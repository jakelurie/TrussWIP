import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  let query = supabaseAdmin
    .from("venue_specs")
    .select("*, profiles!venue_specs_submitted_by_fkey(display_name)")
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (city) query = query.ilike("city", `%${city}%`);
  if (type && type !== "all") query = query.eq("venue_type", type);
  if (search) query = query.or(`venue_name.ilike.%${search}%,city.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ venues: data || [] });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { venue_name, city, state, venue_type, power_info, rigging_info, loading_dock, internet_info, audio_notes, video_notes, lighting_notes, staging_notes, general_notes } = body;

    if (!venue_name || !city) {
      return NextResponse.json({ error: "Venue name and city are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("venue_specs")
      .insert({
        venue_name,
        city,
        state: state || null,
        venue_type: venue_type || "other",
        power_info: power_info || null,
        rigging_info: rigging_info || null,
        loading_dock: loading_dock || null,
        internet_info: internet_info || null,
        audio_notes: audio_notes || null,
        video_notes: video_notes || null,
        lighting_notes: lighting_notes || null,
        staging_notes: staging_notes || null,
        general_notes: general_notes || null,
        submitted_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ venue: data });
  }

  if (action === "upvote") {
    const { venue_spec_id } = body;
    if (!venue_spec_id) return NextResponse.json({ error: "Missing venue_spec_id" }, { status: 400 });

    // Check if already upvoted
    const { data: existing } = await supabaseAdmin
      .from("venue_spec_upvotes")
      .select("id")
      .eq("venue_spec_id", venue_spec_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Remove upvote
      await supabaseAdmin.from("venue_spec_upvotes").delete().eq("id", existing.id);
      const { data: spec } = await supabaseAdmin.from("venue_specs").select("upvotes").eq("id", venue_spec_id).single();
      await supabaseAdmin.from("venue_specs").update({ upvotes: Math.max(0, (spec?.upvotes || 1) - 1) }).eq("id", venue_spec_id);
      return NextResponse.json({ upvoted: false });
    } else {
      // Add upvote
      await supabaseAdmin.from("venue_spec_upvotes").insert({ venue_spec_id, user_id: user.id });
      // Increment count
      const { data: spec } = await supabaseAdmin.from("venue_specs").select("upvotes").eq("id", venue_spec_id).single();
      await supabaseAdmin.from("venue_specs").update({ upvotes: (spec?.upvotes || 0) + 1 }).eq("id", venue_spec_id);
      return NextResponse.json({ upvoted: true });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
