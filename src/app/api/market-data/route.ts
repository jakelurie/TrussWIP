import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Public endpoint — returns aggregated, anonymized market data
export async function GET() {
  // Fetch all tech profiles with rates and skills
  const { data: techs } = await supabaseAdmin
    .from("tech_profiles")
    .select("primary_skill, skills, hourly_rate, skill_rates, years_experience, specializations, completed_gigs, available, profiles!tech_profiles_user_id_fkey(city, cities)")
    .gt("hourly_rate", 0);

  // Fetch active job postings
  const { data: jobs } = await supabaseAdmin
    .from("jobs")
    .select("role_id, city, pay_min, pay_max, pay_type, employment_type, created_at")
    .eq("status", "posted");

  // Fetch recent bookings (count by role)
  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("project_roles!inner(skill), status, created_at")
    .in("status", ["confirmed", "completed", "paid"]);

  if (!techs) {
    return NextResponse.json({ error: "No data" }, { status: 500 });
  }

  // ── Rate stats by role ──
  const roleRates: Record<string, number[]> = {};
  for (const t of techs) {
    // Primary skill rate
    if (t.primary_skill && t.hourly_rate > 0) {
      if (!roleRates[t.primary_skill]) roleRates[t.primary_skill] = [];
      const rate = t.skill_rates?.[t.primary_skill] || t.hourly_rate;
      roleRates[t.primary_skill].push(rate);
    }
    // Additional skills
    if (t.skills?.length) {
      for (const skill of t.skills) {
        if (!roleRates[skill]) roleRates[skill] = [];
        const rate = t.skill_rates?.[skill] || t.hourly_rate;
        roleRates[skill].push(rate);
      }
    }
  }

  const ratesByRole = Object.entries(roleRates)
    .map(([role, rates]) => {
      const sorted = rates.sort((a, b) => a - b);
      const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
      const median = sorted.length % 2 === 0
        ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
        : sorted[Math.floor(sorted.length / 2)];
      return {
        role,
        count: sorted.length,
        avg,
        median,
        low: sorted[0],
        high: sorted[sorted.length - 1],
        p25: sorted[Math.floor(sorted.length * 0.25)] || sorted[0],
        p75: sorted[Math.floor(sorted.length * 0.75)] || sorted[sorted.length - 1],
      };
    })
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count);

  // ── City stats ──
  const cityTechCount: Record<string, number> = {};
  for (const t of techs) {
    const cities = (t as any).profiles?.cities?.length
      ? (t as any).profiles.cities
      : (t as any).profiles?.city
      ? [(t as any).profiles.city]
      : [];
    for (const c of cities) {
      cityTechCount[c] = (cityTechCount[c] || 0) + 1;
    }
  }
  const topCities = Object.entries(cityTechCount)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // ── Experience distribution ──
  const expBuckets = { "0-2": 0, "3-5": 0, "6-10": 0, "11-15": 0, "16+": 0 };
  for (const t of techs) {
    const yr = t.years_experience || 0;
    if (yr <= 2) expBuckets["0-2"]++;
    else if (yr <= 5) expBuckets["3-5"]++;
    else if (yr <= 10) expBuckets["6-10"]++;
    else if (yr <= 15) expBuckets["11-15"]++;
    else expBuckets["16+"]++;
  }

  // ── Availability ──
  const availableCount = techs.filter((t) => t.available).length;

  // ── Top specializations ──
  const specCount: Record<string, number> = {};
  for (const t of techs) {
    if (t.specializations?.length) {
      for (const s of t.specializations) {
        specCount[s] = (specCount[s] || 0) + 1;
      }
    }
  }
  const topSpecs = Object.entries(specCount)
    .map(([spec, count]) => ({ spec, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // ── Job demand ──
  const jobsByRole: Record<string, number> = {};
  const jobsByCity: Record<string, number> = {};
  for (const j of jobs || []) {
    jobsByRole[j.role_id] = (jobsByRole[j.role_id] || 0) + 1;
    if (j.city) jobsByCity[j.city] = (jobsByCity[j.city] || 0) + 1;
  }
  const topJobRoles = Object.entries(jobsByRole)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const topJobCities = Object.entries(jobsByCity)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Booking activity ──
  const bookingsByRole: Record<string, number> = {};
  for (const b of bookings || []) {
    const skill = (b as any).project_roles?.skill;
    if (skill) bookingsByRole[skill] = (bookingsByRole[skill] || 0) + 1;
  }

  return NextResponse.json({
    totalTechs: techs.length,
    availableCount,
    totalJobs: (jobs || []).length,
    totalBookings: (bookings || []).length,
    ratesByRole,
    topCities,
    experienceDistribution: expBuckets,
    topSpecializations: topSpecs,
    jobDemand: { byRole: topJobRoles, byCity: topJobCities },
    bookingsByRole,
  });
}
