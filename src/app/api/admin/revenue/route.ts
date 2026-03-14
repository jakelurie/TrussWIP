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
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = monthStart;

  // Fetch all paid/completed bookings (for breakdowns)
  const { data: allBookings } = await supabaseAdmin
    .from("bookings")
    .select(`
      id, total_amount, platform_fee, payment_method, status, created_at,
      projects(city),
      project_roles(skill)
    `)
    .in("status", ["paid", "completed"])
    .order("created_at", { ascending: false });

  // Outstanding invoice bookings
  const { data: outstandingBookings } = await supabaseAdmin
    .from("bookings")
    .select("id, total_amount")
    .eq("payment_method", "invoice")
    .not("status", "in", "(cancelled,declined,completed)");

  const rows = allBookings || [];

  // ── Period metrics ──
  const thisMonthRows = rows.filter((b) => b.created_at >= monthStart);
  const lastMonthRows = rows.filter((b) => b.created_at >= lastMonthStart && b.created_at < lastMonthEnd);

  const thisMonthGmv = thisMonthRows.reduce((s, b) => s + (b.total_amount || 0), 0);
  const lastMonthGmv = lastMonthRows.reduce((s, b) => s + (b.total_amount || 0), 0);
  const thisMonthRevenue = thisMonthRows.reduce((s, b) => s + (b.platform_fee || 0), 0);
  const lastMonthRevenue = lastMonthRows.reduce((s, b) => s + (b.platform_fee || 0), 0);
  const takeRate = thisMonthGmv > 0 ? ((thisMonthRevenue / thisMonthGmv) * 100).toFixed(1) : "0.0";
  const outstandingTotal = (outstandingBookings || []).reduce((s, b) => s + (b.total_amount || 0), 0);
  const outstandingCount = (outstandingBookings || []).length;

  // ── Revenue by payment method ──
  const byMethod: Record<string, number> = { credit_card: 0, invoice: 0, prepaid: 0 };
  for (const b of rows) {
    const m = b.payment_method || "credit_card";
    byMethod[m] = (byMethod[m] || 0) + (b.platform_fee || 0);
  }
  const methodTotal = Object.values(byMethod).reduce((s, v) => s + v, 0) || 1;

  // ── Monthly breakdown ──
  const monthMap: Record<string, { bookings: number; gmv: number; revenue: number; card: number; invoice: number; prepaid: number }> = {};
  for (const b of rows) {
    const key = b.created_at.slice(0, 7); // YYYY-MM
    if (!monthMap[key]) monthMap[key] = { bookings: 0, gmv: 0, revenue: 0, card: 0, invoice: 0, prepaid: 0 };
    monthMap[key].bookings++;
    monthMap[key].gmv += b.total_amount || 0;
    monthMap[key].revenue += b.platform_fee || 0;
    const m = b.payment_method || "credit_card";
    if (m === "credit_card") monthMap[key].card += b.platform_fee || 0;
    else if (m === "invoice") monthMap[key].invoice += b.platform_fee || 0;
    else if (m === "prepaid") monthMap[key].prepaid += b.platform_fee || 0;
  }
  const months = Object.entries(monthMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data]) => ({
      month,
      ...data,
      avgBooking: data.bookings > 0 ? Math.round(data.gmv / data.bookings) : 0,
    }));

  // ── Revenue by city ──
  const cityMap: Record<string, { bookings: number; gmv: number; revenue: number }> = {};
  for (const b of rows) {
    const city = (b.projects as any)?.city || "Unknown";
    if (!cityMap[city]) cityMap[city] = { bookings: 0, gmv: 0, revenue: 0 };
    cityMap[city].bookings++;
    cityMap[city].gmv += b.total_amount || 0;
    cityMap[city].revenue += b.platform_fee || 0;
  }
  const cities = Object.entries(cityMap)
    .sort(([, a], [, b]) => b.gmv - a.gmv)
    .map(([city, data]) => ({ city, ...data }));

  // ── Revenue by role ──
  const roleMap: Record<string, { bookings: number; gmv: number }> = {};
  for (const b of rows) {
    const role = (b.project_roles as any)?.skill || "Unassigned";
    if (!roleMap[role]) roleMap[role] = { bookings: 0, gmv: 0 };
    roleMap[role].bookings++;
    roleMap[role].gmv += b.total_amount || 0;
  }
  const roles = Object.entries(roleMap)
    .sort(([, a], [, b]) => b.gmv - a.gmv)
    .map(([role, data]) => ({ role, ...data }));

  return NextResponse.json({
    period: {
      thisMonthGmv, lastMonthGmv, thisMonthRevenue, lastMonthRevenue,
      takeRate, outstandingTotal, outstandingCount,
    },
    byMethod: Object.entries(byMethod).map(([method, revenue]) => ({
      method, revenue, pct: Math.round((revenue / methodTotal) * 100),
    })),
    months,
    cities,
    roles,
    // Chart data: monthly GMV and revenue for sparkline
    chartData: Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, gmv: data.gmv, revenue: data.revenue })),
  });
}
