import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── GET /api/browse ─────────────────────────────────────────
// Server-side filtered, sorted, paginated tech search.
// All filtering happens in PostgreSQL — client sends filter params.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const skills = searchParams.get("skills") || ""; // comma-separated
  const specs = searchParams.get("specs") || ""; // comma-separated
  const sortBy = searchParams.get("sort") || "rating";
  const onlyAvailable = searchParams.get("available") === "true";
  const onlyInsured = searchParams.get("insured") === "true";
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const maxRate = parseInt(searchParams.get("max_rate") || "0");
  const minRate = parseInt(searchParams.get("min_rate") || "0");
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 60);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build query
  let query = supabaseAdmin
    .from("tech_profiles")
    .select(`
      id,
      user_id,
      primary_skill,
      skills,
      specializations,
      certifications,
      gear,
      bio,
      years_experience,
      hourly_rate,
      skill_rates,
      available,
      level,
      xp,
      completed_gigs,
      avg_rating,
      review_count,
      profile_complete,
      has_insurance,
      profiles!tech_profiles_user_id_fkey (
        display_name,
        city,
        cities,
        avatar_url,
        is_verified,
        identity_verified,
        privacy_settings
      )
    `, { count: "exact" })
    .gt("profile_complete", 0);

  // ── Boolean filters ──
  if (onlyAvailable) {
    query = query.eq("available", true);
  }
  if (onlyInsured) {
    query = query.eq("has_insurance", true);
  }

  // ── Skill filter (overlap: tech has ANY of the requested skills) ──
  if (skills) {
    const skillArr = skills.split(",").map(s => s.trim()).filter(Boolean);
    if (skillArr.length > 0) {
      // Use overlaps for array containment check
      query = query.overlaps("skills", skillArr);
    }
  }

  // ── Specialization filter ──
  if (specs) {
    const specArr = specs.split(",").map(s => s.trim()).filter(Boolean);
    if (specArr.length > 0) {
      query = query.overlaps("specializations", specArr);
    }
  }

  // ── Rate filters ──
  if (maxRate > 0) {
    query = query.lte("hourly_rate", maxRate);
  }
  if (minRate > 0) {
    query = query.gte("hourly_rate", minRate);
  }

  // ── Text search (name, city — uses ilike for simplicity, good enough to 100k+) ──
  if (search) {
    // Search across display_name and city via profiles join
    // Supabase doesn't support ilike on joined columns in .or(),
    // so we use a workaround: fetch with a broader set and then
    // do a lightweight server-side filter. For true scale (500k+),
    // this would need a materialized search view or tsvector index.
    // For now, we fetch a larger batch and filter server-side.
  }

  // ── Sorting ──
  switch (sortBy) {
    case "rating":
      query = query.order("avg_rating", { ascending: false, nullsFirst: false });
      break;
    case "rate_low":
      query = query.order("hourly_rate", { ascending: true, nullsFirst: false });
      break;
    case "rate_high":
      query = query.order("hourly_rate", { ascending: false, nullsFirst: false });
      break;
    case "experience":
      query = query.order("years_experience", { ascending: false, nullsFirst: false });
      break;
    case "level":
      query = query.order("xp", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("avg_rating", { ascending: false, nullsFirst: false });
  }

  // ── Date availability filter ──
  // If date filters are set, we first get blocked tech IDs, then exclude them
  let blockedIds: string[] = [];
  if (dateFrom) {
    const endDate = dateTo || dateFrom;

    // Get techs with unavailable dates in range
    const { data: blocked } = await supabaseAdmin
      .from("availability")
      .select("user_id")
      .gte("date", dateFrom)
      .lte("date", endDate)
      .eq("status", "unavailable");

    // Get techs with confirmed/paid bookings overlapping the date range
    const { data: booked } = await supabaseAdmin
      .from("bookings")
      .select("tech_id, projects!inner(start_date, end_date)")
      .in("status", ["confirmed", "paid"])
      .lte("projects.start_date", endDate)
      .gte("projects.end_date", dateFrom);

    const ids = new Set<string>();
    (blocked || []).forEach(b => ids.add(b.user_id));
    (booked || []).forEach((b: any) => ids.add(b.tech_id));
    blockedIds = Array.from(ids);
  }

  // Apply blocked ID exclusion (if any)
  // Supabase doesn't have a .not().in() for large arrays efficiently,
  // so we handle this in post-processing for date filters
  // For non-date queries, pagination works directly

  if (!search && blockedIds.length === 0) {
    // Pure database pagination — fastest path
    query = query.range(offset, offset + limit - 1);
    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const visible = (data || []).filter((t: any) => {
      const ps = t.profiles?.privacy_settings;
      return !ps || ps.profile_visible !== false;
    });
    return NextResponse.json({ techs: visible, total: count || 0 });
  }

  // For search or date filters, fetch a larger batch and filter server-side
  // This is still far better than loading ALL rows — we cap at 500
  const fetchLimit = Math.min(500, Math.max(limit * 5, 150));
  query = query.range(0, fetchLimit - 1);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let results = (data || []).filter((t: any) => {
    const ps = t.profiles?.privacy_settings;
    return !ps || ps.profile_visible !== false;
  });

  // Server-side text search filter
  if (search) {
    const q = search.toLowerCase();
    results = results.filter((t: any) => {
      const name = t.profiles?.display_name?.toLowerCase() || "";
      const cityMatch = t.profiles?.cities?.some((c: string) => c.toLowerCase().includes(q))
        || t.profiles?.city?.toLowerCase().includes(q);
      const gearMatch = t.gear?.some((g: string) => g.toLowerCase().includes(q));
      const skillMatch = t.skills?.some((s: string) => s.toLowerCase().includes(q));
      const specMatch = t.specializations?.some((s: string) => s.toLowerCase().includes(q));
      return name.includes(q) || cityMatch || gearMatch || skillMatch || specMatch;
    });
  }

  // Exclude blocked techs (date filter)
  if (blockedIds.length > 0) {
    const blockedSet = new Set(blockedIds);
    results = results.filter((t: any) => !blockedSet.has(t.user_id));
  }

  const total = results.length;
  const paged = results.slice(offset, offset + limit);

  return NextResponse.json({ techs: paged, total });
}
