import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/gear?q=searchterm — search community gear items
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabaseAdmin
    .from("gear_items")
    .select("name, category, amps")
    .ilike("name", `%${q}%`)
    .order("times_added", { ascending: false })
    .limit(15);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST /api/gear — add a community gear item (or bump its count)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name || "").trim();
  const amps = parseFloat(body.amps);
  const category = (body.category || "Custom").trim();

  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (isNaN(amps) || amps <= 0 || amps > 200) {
    return NextResponse.json({ error: "Invalid amps" }, { status: 400 });
  }

  // Check if this gear already exists (case-insensitive)
  const { data: existing } = await supabaseAdmin
    .from("gear_items")
    .select("id, times_added")
    .ilike("name", name)
    .limit(1)
    .single();

  if (existing) {
    // Bump the count
    await supabaseAdmin
      .from("gear_items")
      .update({ times_added: (existing.times_added || 1) + 1 })
      .eq("id", existing.id);

    return NextResponse.json({ status: "bumped" });
  }

  // Insert new
  const { error } = await supabaseAdmin.from("gear_items").insert({
    name,
    category,
    amps,
    times_added: 1,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "created" });
}