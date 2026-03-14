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
  const status = url.searchParams.get("status");
  const payment = url.searchParams.get("payment");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "newest";
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = 50;

  let query = supabaseAdmin
    .from("bookings")
    .select(`
      id, status, rate, total_hours, total_amount, platform_fee,
      payment_method, po_number, notes, admin_notes, created_at,
      confirmed_at, completed_at, checked_in_at, checked_out_at, actual_hours,
      profiles!bookings_producer_id_fkey(id, display_name, company_name),
      profiles!bookings_tech_id_fkey(id, display_name),
      projects(id, name, city),
      project_roles(skill)
    `);

  if (status) query = query.eq("status", status);
  if (payment) query = query.eq("payment_method", payment);

  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("total_amount", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data: bookings, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Post-filter by search (producer or tech name)
  let filtered = bookings || [];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((b: any) => {
      const producer = b["profiles!bookings_producer_id_fkey"]?.display_name || "";
      const tech = b["profiles!bookings_tech_id_fkey"]?.display_name || "";
      const company = b["profiles!bookings_producer_id_fkey"]?.company_name || "";
      const project = b.projects?.name || "";
      return (
        producer.toLowerCase().includes(s) ||
        tech.toLowerCase().includes(s) ||
        company.toLowerCase().includes(s) ||
        project.toLowerCase().includes(s) ||
        b.id?.slice(0, 8).includes(s)
      );
    });
  }

  return NextResponse.json({ bookings: filtered, hasMore: (bookings || []).length === limit });
}

export async function PATCH(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const body = await req.json();
  const { action, bookingId, value } = body;

  switch (action) {
    case "cancel": {
      const { error } = await supabaseAdmin
        .from("bookings")
        .update({ status: "cancelled", admin_notes: value || null })
        .eq("id", bookingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "override_status": {
      const validStatuses = ["pending", "accepted", "confirmed", "paid", "completed", "cancelled", "declined"];
      if (!validStatuses.includes(value)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const updates: any = { status: value };
      if (value === "completed") updates.completed_at = new Date().toISOString();
      if (value === "confirmed") updates.confirmed_at = new Date().toISOString();
      const { error } = await supabaseAdmin.from("bookings").update(updates).eq("id", bookingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "adjust_amount": {
      const { rate, hours, total, fee } = value || {};
      const updates: any = {};
      if (rate !== undefined) updates.rate = rate;
      if (hours !== undefined) updates.total_hours = hours;
      if (total !== undefined) updates.total_amount = total;
      if (fee !== undefined) updates.platform_fee = fee;
      const { error } = await supabaseAdmin.from("bookings").update(updates).eq("id", bookingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "admin_note": {
      const { error } = await supabaseAdmin
        .from("bookings")
        .update({ admin_notes: value })
        .eq("id", bookingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
