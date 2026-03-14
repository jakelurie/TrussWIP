import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 20 });

type ActivityEvent = {
  type: string;
  message: string;
  timestamp: string;
  link?: string;
  color: string;
};

export async function GET(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "all";
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const pageSize = 50;

  // Query window — fetch up to 90 days back, we'll merge and paginate in memory
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();

  const [
    { data: signups },
    { data: bookingsCreated },
    { data: bookingsAccepted },
    { data: bookingsCompleted },
    { data: bookingsCancelled },
    { data: reviews },
    { data: invoiceRequested },
    { data: invoiceApproved },
    { data: messages },
  ] = await Promise.all([
    // Signups
    supabaseAdmin
      .from("profiles")
      .select("id, display_name, user_type, city, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(100),

    // Bookings created
    supabaseAdmin
      .from("bookings")
      .select("id, total_amount, created_at, profiles!bookings_producer_id_fkey(display_name)")
      .gte("created_at", cutoff)
      .not("status", "in", "(cancelled,declined)")
      .order("created_at", { ascending: false })
      .limit(100),

    // Bookings accepted
    supabaseAdmin
      .from("bookings")
      .select("id, total_amount, responded_at, profiles!bookings_tech_id_fkey(display_name)")
      .eq("status", "accepted")
      .not("responded_at", "is", null)
      .gte("responded_at", cutoff)
      .order("responded_at", { ascending: false })
      .limit(100),

    // Bookings completed
    supabaseAdmin
      .from("bookings")
      .select("id, total_amount, platform_fee, completed_at, profiles!bookings_tech_id_fkey(display_name)")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .gte("completed_at", cutoff)
      .order("completed_at", { ascending: false })
      .limit(100),

    // Bookings cancelled
    supabaseAdmin
      .from("bookings")
      .select("id, created_at, profiles!bookings_producer_id_fkey(display_name)")
      .eq("status", "cancelled")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(50),

    // Reviews
    supabaseAdmin
      .from("reviews")
      .select("id, overall_rating, created_at, profiles!reviews_tech_id_fkey(display_name), profiles!reviews_reviewer_id_fkey(display_name)")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(100),

    // Invoice requested
    supabaseAdmin
      .from("profiles")
      .select("id, display_name, company_name, invoice_requested_at")
      .not("invoice_requested_at", "is", null)
      .gte("invoice_requested_at", cutoff)
      .order("invoice_requested_at", { ascending: false })
      .limit(50),

    // Invoice approved
    supabaseAdmin
      .from("profiles")
      .select("id, display_name, company_name, invoice_approved_at")
      .eq("invoice_approved", true)
      .not("invoice_approved_at", "is", null)
      .gte("invoice_approved_at", cutoff)
      .order("invoice_approved_at", { ascending: false })
      .limit(50),

    // Messages (count per sender, no content)
    supabaseAdmin
      .from("messages")
      .select("id, sender_id, created_at, profiles!messages_sender_id_fkey(display_name)")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // ── Build events ──
  const events: ActivityEvent[] = [];

  for (const u of signups || []) {
    events.push({
      type: "signup",
      message: `${u.display_name || "Someone"} signed up as ${u.user_type}${u.city ? ` (${u.city})` : ""}`,
      timestamp: u.created_at,
      link: `/admin/users/${u.id}`,
      color: "cue-blue",
    });
  }

  for (const b of bookingsCreated || []) {
    const name = (b as any)["profiles!bookings_producer_id_fkey"]?.display_name || "Unknown";
    events.push({
      type: "booking_created",
      message: `${name} created a booking — $${(b.total_amount || 0).toLocaleString()}`,
      timestamp: b.created_at,
      link: `/admin/bookings/${b.id}`,
      color: "standby-amber",
    });
  }

  for (const b of bookingsAccepted || []) {
    const name = (b as any)["profiles!bookings_tech_id_fkey"]?.display_name || "Unknown";
    events.push({
      type: "booking_accepted",
      message: `${name} accepted a booking`,
      timestamp: b.responded_at!,
      link: `/admin/bookings/${b.id}`,
      color: "cue-blue",
    });
  }

  for (const b of bookingsCompleted || []) {
    events.push({
      type: "booking_completed",
      message: `Booking completed — $${(b.total_amount || 0).toLocaleString()} (fee: $${(b.platform_fee || 0).toLocaleString()})`,
      timestamp: b.completed_at!,
      link: `/admin/bookings/${b.id}`,
      color: "go-green",
    });
  }

  for (const b of bookingsCancelled || []) {
    const name = (b as any)["profiles!bookings_producer_id_fkey"]?.display_name || "Unknown";
    events.push({
      type: "booking_cancelled",
      message: `${name} cancelled a booking`,
      timestamp: b.created_at,
      link: `/admin/bookings/${b.id}`,
      color: "aluminum",
    });
  }

  for (const r of reviews || []) {
    const tech = (r as any)["profiles!reviews_tech_id_fkey"]?.display_name || "Unknown";
    const reviewer = (r as any)["profiles!reviews_reviewer_id_fkey"]?.display_name || "Unknown";
    events.push({
      type: "review",
      message: `${reviewer} left a ${r.overall_rating}-star review for ${tech}`,
      timestamp: r.created_at,
      color: "signal-orange",
    });
  }

  for (const p of invoiceRequested || []) {
    events.push({
      type: "invoice_requested",
      message: `${p.company_name || p.display_name || "Unknown"} requested invoice billing`,
      timestamp: p.invoice_requested_at!,
      link: `/admin/users/${p.id}`,
      color: "standby-amber",
    });
  }

  for (const p of invoiceApproved || []) {
    events.push({
      type: "invoice_approved",
      message: `Invoice billing approved for ${p.company_name || p.display_name || "Unknown"}`,
      timestamp: p.invoice_approved_at!,
      link: `/admin/users/${p.id}`,
      color: "go-green",
    });
  }

  for (const m of messages || []) {
    const name = (m as any)["profiles!messages_sender_id_fkey"]?.display_name || "Unknown";
    events.push({
      type: "message",
      message: `${name} sent a message`,
      timestamp: m.created_at,
      color: "aluminum",
    });
  }

  // ── Filter ──
  let filtered = events;
  if (filter !== "all") {
    filtered = events.filter((e) => e.type === filter);
  }

  // ── Sort and paginate ──
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const page = filtered.slice(offset, offset + pageSize);

  return NextResponse.json({
    events: page,
    hasMore: offset + pageSize < filtered.length,
    total: filtered.length,
  });
}
