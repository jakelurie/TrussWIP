import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 10 });

export async function GET(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = monthStart;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const dayAgo = new Date(now.getTime() - 86400000).toISOString();

  // ── Parallel queries ──
  const [
    { count: totalTechs },
    { count: totalProducers },
    { count: techsThisWeek },
    { count: producersThisWeek },
    { count: bookingsThisWeek },
    { count: bookingsLastWeek },
    { count: totalCompleted },
    { count: totalBookings },
    { count: newSignupsToday },
    { count: emptyProfiles },
    { data: avgProfileData },
    { data: weekGmvData },
    { data: monthFeeData },
    { data: lastMonthFeeData },
    { data: allPaidBookings },
    { data: recentSignups },
    { data: recentBookings },
    { data: recentReviews },
  ] = await Promise.all([
    // Key metrics
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("user_type", "tech"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("user_type", "producer"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("user_type", "tech").gte("created_at", weekAgo),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("user_type", "producer").gte("created_at", weekAgo),
    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", weekAgo).not("status", "in", "(cancelled,declined)"),
    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo).not("status", "in", "(cancelled,declined)"),
    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).not("status", "in", "(cancelled,declined)"),

    // Action items
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
    supabaseAdmin.from("tech_profiles").select("id", { count: "exact", head: true }).eq("profile_complete", 0),

    // Marketplace health
    supabaseAdmin.from("tech_profiles").select("profile_complete"),
    supabaseAdmin.from("bookings").select("total_amount").gte("created_at", weekAgo).not("status", "in", "(cancelled,declined)"),
    supabaseAdmin.from("bookings").select("platform_fee").gte("created_at", monthStart).in("status", ["paid", "completed"]),
    supabaseAdmin.from("bookings").select("platform_fee").gte("created_at", lastMonthStart).lt("created_at", lastMonthEnd).in("status", ["paid", "completed"]),

    // Repeat rate
    supabaseAdmin.from("bookings").select("producer_id, status").in("status", ["paid", "completed"]),

    // Activity feed sources
    supabaseAdmin.from("profiles").select("id, display_name, user_type, city, created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("bookings").select("id, status, total_amount, platform_fee, created_at, profiles!bookings_producer_id_fkey(display_name)").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("reviews").select("id, overall_rating, created_at, profiles!reviews_tech_id_fkey(display_name)").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(10),
  ]);

  // ── Compute metrics ──
  const avgProfileComplete = avgProfileData?.length
    ? Math.round(avgProfileData.reduce((sum: number, t: any) => sum + (t.profile_complete || 0), 0) / avgProfileData.length)
    : 0;

  const weekGmv = (weekGmvData || []).reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
  const monthRevenue = (monthFeeData || []).reduce((sum: number, b: any) => sum + (b.platform_fee || 0), 0);
  const lastMonthRevenue = (lastMonthFeeData || []).reduce((sum: number, b: any) => sum + (b.platform_fee || 0), 0);
  const revenueMoM = lastMonthRevenue > 0 ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

  // Marketplace health
  const fillRate = (totalBookings || 0) > 0
    ? Math.round(((totalCompleted || 0) / (totalBookings || 1)) * 100)
    : 0;

  const avgBookingValue = (allPaidBookings || []).length > 0
    ? Math.round((allPaidBookings || []).reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) / allPaidBookings!.length)
    : 0;

  // Repeat rate: producers who booked 2+ times
  const producerBookingCounts: Record<string, number> = {};
  (allPaidBookings || []).forEach((b: any) => {
    if (b.producer_id) producerBookingCounts[b.producer_id] = (producerBookingCounts[b.producer_id] || 0) + 1;
  });
  const totalBookingProducers = Object.keys(producerBookingCounts).length;
  const repeatProducers = Object.values(producerBookingCounts).filter(c => c >= 2).length;
  const repeatRate = totalBookingProducers > 0 ? Math.round((repeatProducers / totalBookingProducers) * 100) : 0;

  // ── Activity feed (merge and sort) ──
  const activity: any[] = [];

  (recentSignups || []).forEach((u: any) => {
    activity.push({
      type: "signup",
      message: `${u.display_name || "Someone"} signed up as a ${u.user_type}${u.city ? ` (${u.city})` : ""}`,
      timestamp: u.created_at,
      link: `/admin/users/${u.id}`,
    });
  });

  (recentBookings || []).forEach((b: any) => {
    const producer = b.profiles?.display_name || "Unknown";
    if (b.status === "completed") {
      activity.push({
        type: "booking_completed",
        message: `Booking completed — $${b.total_amount?.toLocaleString() || 0} (fee: $${b.platform_fee?.toLocaleString() || 0})`,
        timestamp: b.created_at,
      });
    } else if (b.status === "pending") {
      activity.push({
        type: "booking_created",
        message: `${producer} created a booking — $${b.total_amount?.toLocaleString() || 0}`,
        timestamp: b.created_at,
      });
    }
  });

  (recentReviews || []).forEach((r: any) => {
    const tech = r.profiles?.display_name || "Unknown";
    activity.push({
      type: "review",
      message: `${r.overall_rating}-star review for ${tech}`,
      timestamp: r.created_at,
    });
  });

  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // ── Signups by day (for chart) ──
  const signupsByDay: Record<string, number> = {};
  (recentSignups || []).forEach((u: any) => {
    const day = u.created_at?.split("T")[0];
    if (day) signupsByDay[day] = (signupsByDay[day] || 0) + 1;
  });

  return NextResponse.json({
    keyMetrics: {
      totalTechs: totalTechs || 0,
      totalProducers: totalProducers || 0,
      techsThisWeek: techsThisWeek || 0,
      producersThisWeek: producersThisWeek || 0,
      bookingsThisWeek: bookingsThisWeek || 0,
      bookingsLastWeek: bookingsLastWeek || 0,
      weekGmv,
      monthRevenue,
      revenueMoM,
      avgProfileComplete,
    },
    health: {
      fillRate,
      avgBookingValue,
      repeatRate,
    },
    actionItems: {
      newSignupsToday: newSignupsToday || 0,
      emptyProfiles: emptyProfiles || 0,
    },
    activity: activity.slice(0, 20),
    signupsByDay,
  });
}
