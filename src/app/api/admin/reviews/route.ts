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
  const rating = url.searchParams.get("rating");
  const hasComment = url.searchParams.get("hasComment");
  const hidden = url.searchParams.get("hidden");
  const sort = url.searchParams.get("sort") || "newest";
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = 50;

  let query = supabaseAdmin
    .from("reviews")
    .select(`
      id, overall_rating, skill_rating, punctuality_rating,
      professionalism_rating, communication_rating,
      text, hidden, created_at, booking_id,
      profiles!reviews_tech_id_fkey(id, display_name),
      profiles!reviews_reviewer_id_fkey(id, display_name)
    `);

  if (rating) query = query.eq("overall_rating", parseInt(rating, 10));
  if (hasComment === "yes") query = query.not("text", "is", null).neq("text", "");
  if (hasComment === "no") query = query.or("text.is.null,text.eq.");
  if (hidden === "yes") query = query.eq("hidden", true);
  if (hidden === "no") query = query.or("hidden.is.null,hidden.eq.false");

  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "rating_high":
      query = query.order("overall_rating", { ascending: false });
      break;
    case "rating_low":
      query = query.order("overall_rating", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data: reviews, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    reviews: reviews || [],
    hasMore: (reviews || []).length === limit,
  });
}

export async function PATCH(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const body = await req.json();
  const { action, reviewId } = body;

  switch (action) {
    case "hide": {
      const { error } = await supabaseAdmin
        .from("reviews")
        .update({ hidden: true })
        .eq("id", reviewId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "unhide": {
      const { error } = await supabaseAdmin
        .from("reviews")
        .update({ hidden: false })
        .eq("id", reviewId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete": {
      const { error } = await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("id", reviewId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
