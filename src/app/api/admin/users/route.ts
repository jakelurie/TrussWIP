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
  const type = url.searchParams.get("type"); // tech | producer
  const city = url.searchParams.get("city");
  const profile = url.searchParams.get("profile"); // complete | incomplete | empty
  const joined = url.searchParams.get("joined"); // 7 | 30
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "newest"; // newest | oldest | name | bookings
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = 50;

  // Build query
  let query = supabaseAdmin
    .from("profiles")
    .select(`
      id, display_name, email, user_type, city, cities, company_name,
      avatar_url, is_verified, identity_verified, is_admin,
      suspended, created_at,
      tech_profiles(profile_complete, completed_gigs, avg_rating, primary_skill, level, xp)
    `);

  // Filters
  if (type) query = query.eq("user_type", type);

  if (city) query = query.or(`city.eq.${city},cities.cs.{${city}}`);

  if (joined === "7") {
    query = query.gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
  } else if (joined === "30") {
    query = query.gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());
  }

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  // Sort
  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name":
      query = query.order("display_name", { ascending: true });
      break;
    default: // newest
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data: users, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Post-filter by profile completeness (needs tech_profiles join)
  let filtered = users || [];
  if (profile && type !== "producer") {
    filtered = filtered.filter((u: any) => {
      const tp = Array.isArray(u.tech_profiles) ? u.tech_profiles[0] : u.tech_profiles;
      const pct = tp?.profile_complete ?? -1;
      if (profile === "complete") return pct >= 70;
      if (profile === "incomplete") return pct > 0 && pct < 70;
      if (profile === "empty") return pct === 0;
      return true;
    });
  }

  // Sort by bookings (post-sort since it's from joined table)
  if (sort === "bookings") {
    filtered.sort((a: any, b: any) => {
      const aGigs = (Array.isArray(a.tech_profiles) ? a.tech_profiles[0] : a.tech_profiles)?.completed_gigs || 0;
      const bGigs = (Array.isArray(b.tech_profiles) ? b.tech_profiles[0] : b.tech_profiles)?.completed_gigs || 0;
      return bGigs - aGigs;
    });
  }

  // Get distinct cities for filter dropdown
  const { data: cityData } = await supabaseAdmin
    .from("profiles")
    .select("city")
    .not("city", "is", null)
    .not("city", "eq", "");

  const cities = [...new Set((cityData || []).map((c: any) => c.city).filter(Boolean))].sort();

  return NextResponse.json({ users: filtered, cities, hasMore: (users || []).length === limit });
}
