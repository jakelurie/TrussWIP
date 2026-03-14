import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 20 });

export async function GET(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") || "queue"; // queue | outstanding

  if (tab === "queue") {
    // Producers who set billing_type = "invoice" but are not yet approved
    const { data: pending } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, display_name, email, company_name, billing_email, billing_address,
        payment_terms, city, created_at, invoice_requested_at
      `)
      .eq("billing_type", "invoice")
      .or("invoice_approved.is.null,invoice_approved.eq.false")
      .order("created_at", { ascending: false });

    // Get booking stats for each pending producer
    const enriched = await Promise.all(
      (pending || []).map(async (p: any) => {
        const [{ count: bookingCount }, { data: gmvData }] = await Promise.all([
          supabaseAdmin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("producer_id", p.id)
            .in("status", ["paid", "completed"]),
          supabaseAdmin
            .from("bookings")
            .select("total_amount")
            .eq("producer_id", p.id)
            .in("status", ["paid", "completed"]),
        ]);
        const gmv = (gmvData || []).reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
        return { ...p, bookingCount: bookingCount || 0, gmv };
      })
    );

    return NextResponse.json({ pending: enriched });
  }

  // Outstanding: approved invoice accounts
  const { data: approved } = await supabaseAdmin
    .from("profiles")
    .select(`
      id, display_name, email, company_name, billing_email,
      payment_terms, invoice_approved_at, invoice_credit_limit, invoice_notes
    `)
    .eq("billing_type", "invoice")
    .eq("invoice_approved", true)
    .order("invoice_approved_at", { ascending: false });

  // Get outstanding amounts for each
  const enriched = await Promise.all(
    (approved || []).map(async (p: any) => {
      const [{ data: unpaidBookings }, { data: lastBooking }] = await Promise.all([
        supabaseAdmin
          .from("bookings")
          .select("total_amount")
          .eq("producer_id", p.id)
          .eq("payment_method", "invoice")
          .not("status", "in", "(cancelled,declined,completed)"),
        supabaseAdmin
          .from("bookings")
          .select("created_at")
          .eq("producer_id", p.id)
          .eq("payment_method", "invoice")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      const outstanding = (unpaidBookings || []).reduce(
        (sum: number, b: any) => sum + (b.total_amount || 0), 0
      );
      const limit = p.invoice_credit_limit || 0;
      const pctUsed = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;
      let status: string;
      if (limit === 0) status = "unlimited";
      else if (pctUsed > 100) status = "over_limit";
      else if (pctUsed >= 80) status = "near_limit";
      else status = "current";

      return {
        ...p,
        outstanding,
        pctUsed,
        status,
        lastBookingDate: lastBooking?.[0]?.created_at || null,
      };
    })
  );

  return NextResponse.json({ accounts: enriched });
}

export async function PATCH(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;
  const { user } = result;

  const body = await req.json();
  const { action, producerId, creditLimit, netTerms, notes } = body;

  if (action === "approve") {
    const limit = creditLimit || 0;
    const terms = netTerms || "net_30";
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        invoice_approved: true,
        invoice_approved_at: new Date().toISOString(),
        invoice_approved_by: user.id,
        invoice_credit_limit: limit,
        payment_terms: terms,
        invoice_notes: notes || null,
      })
      .eq("id", producerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const termsLabel = terms === "net_15" ? "Net 15" : "Net 30";
    const limitLabel = limit > 0 ? `$${limit.toLocaleString()}` : "Unlimited";
    await supabaseAdmin.from("notifications").insert({
      user_id: producerId,
      type: "invoice_approved",
      title: "Invoice Billing Approved",
      message: `Your invoice billing has been approved. Credit limit: ${limitLabel}. Terms: ${termsLabel}.`,
      link: "/billing",
    });

    return NextResponse.json({ success: true });
  }

  if (action === "deny") {
    // Reset billing type back to credit card, clear request
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        billing_type: "credit_card",
        invoice_requested_at: null,
        invoice_notes: notes || null,
      })
      .eq("id", producerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin.from("notifications").insert({
      user_id: producerId,
      type: "invoice_denied",
      title: "Invoice Billing Request Denied",
      message: "Your invoice billing request was not approved. Your account has been set to credit card billing.",
      link: "/billing",
    });

    return NextResponse.json({ success: true });
  }

  if (action === "revoke") {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        invoice_approved: false,
        billing_type: "credit_card",
        invoice_credit_limit: 0,
      })
      .eq("id", producerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin.from("notifications").insert({
      user_id: producerId,
      type: "invoice_revoked",
      title: "Invoice Billing Revoked",
      message: "Your invoice billing access has been revoked. Your account has been set to credit card billing.",
      link: "/billing",
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
