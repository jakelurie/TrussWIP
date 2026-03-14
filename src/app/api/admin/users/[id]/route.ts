import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 20 });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const { id } = await params;

  const [
    { data: profile, error: profileError },
    { data: techProfile },
    { data: bookings },
    { data: reviews },
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("tech_profiles")
      .select("*")
      .eq("user_id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("bookings")
      .select(`
        id, status, total_amount, platform_fee, rate, hours, created_at,
        profiles!bookings_producer_id_fkey(id, display_name),
        profiles!bookings_tech_id_fkey(id, display_name)
      `)
      .or(`producer_id.eq.${id},tech_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("reviews")
      .select(`
        id, overall_rating, communication_rating, skill_rating,
        professionalism_rating, comment, created_at, hidden,
        profiles!reviews_reviewer_id_fkey(id, display_name),
        profiles!reviews_tech_id_fkey(id, display_name)
      `)
      .or(`tech_id.eq.${id},reviewer_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (profileError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ profile, techProfile, bookings, reviews });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const { id } = await params;
  const body = await req.json();
  const { action, value } = body;

  switch (action) {
    case "verify": {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_verified: true })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "suspend": {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: value || "Suspended by admin",
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "unsuspend": {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          suspended: false,
          suspended_at: null,
          suspended_reason: null,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "admin_note": {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ admin_notes: value })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "reset_password": {
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: value,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
