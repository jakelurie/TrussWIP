import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Returns rate comparison data for a tech's skills vs. other techs in their market
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the tech's profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("primary_skill, skills, hourly_rate, skill_rates, city, cities")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const techSkills: string[] = [];
  if (profile.primary_skill) techSkills.push(profile.primary_skill);
  if (profile.skills?.length) {
    for (const s of profile.skills) {
      if (!techSkills.includes(s)) techSkills.push(s);
    }
  }

  if (techSkills.length === 0) {
    return NextResponse.json({ insights: [], summary: null });
  }

  // Get the tech's cities for market comparison
  const techCities: string[] = [];
  if (profile.cities?.length) {
    techCities.push(...profile.cities);
  } else if (profile.city) {
    techCities.push(profile.city);
  }

  // Fetch all techs who share at least one skill
  // We get everyone, then filter — simpler than building a complex query
  const { data: allTechs } = await supabaseAdmin
    .from("profiles")
    .select("id, primary_skill, skills, hourly_rate, skill_rates, city, cities")
    .eq("user_type", "tech")
    .neq("id", user.id);

  if (!allTechs || allTechs.length === 0) {
    return NextResponse.json({ insights: [], summary: null });
  }

  // For each of the tech's skills, compute market stats
  const insights = techSkills.map((skill) => {
    // Find other techs with this skill
    const peersAll = allTechs.filter((t) => {
      return t.primary_skill === skill || (t.skills && t.skills.includes(skill));
    });

    // Find peers in same market
    const peersLocal = peersAll.filter((t) => {
      const tCities = t.cities?.length ? t.cities : t.city ? [t.city] : [];
      return tCities.some((c: string) => techCities.includes(c));
    });

    // Get rate for each peer for this skill
    const getRateForSkill = (t: any): number => {
      if (t.skill_rates?.[skill]) return t.skill_rates[skill];
      return t.hourly_rate || 0;
    };

    const myRate = profile.skill_rates?.[skill] || profile.hourly_rate || 0;

    // Compute stats for a group of peers
    const computeStats = (peers: any[]) => {
      const rates = peers.map(getRateForSkill).filter((r) => r > 0).sort((a, b) => a - b);
      if (rates.length === 0) return null;

      const sum = rates.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / rates.length);
      const median = rates.length % 2 === 0
        ? Math.round((rates[rates.length / 2 - 1] + rates[rates.length / 2]) / 2)
        : rates[Math.floor(rates.length / 2)];
      const low = rates[0];
      const high = rates[rates.length - 1];
      const p25 = rates[Math.floor(rates.length * 0.25)] || low;
      const p75 = rates[Math.floor(rates.length * 0.75)] || high;

      return { count: rates.length, avg, median, low, high, p25, p75 };
    };

    const national = computeStats(peersAll);
    const local = computeStats(peersLocal);

    // Determine positioning
    let position: "below" | "competitive" | "above" | "unknown" = "unknown";
    const ref = local || national;
    if (ref && myRate > 0) {
      if (myRate < ref.p25) position = "below";
      else if (myRate > ref.p75) position = "above";
      else position = "competitive";
    }

    return {
      skill,
      myRate,
      national,
      local,
      position,
    };
  });

  // Overall summary
  const myPrimaryRate = profile.skill_rates?.[profile.primary_skill] || profile.hourly_rate || 0;
  const primaryInsight = insights.find((i) => i.skill === profile.primary_skill);

  return NextResponse.json({
    insights,
    summary: {
      primarySkill: profile.primary_skill,
      myRate: myPrimaryRate,
      marketAvg: primaryInsight?.local?.avg || primaryInsight?.national?.avg || 0,
      marketMedian: primaryInsight?.local?.median || primaryInsight?.national?.median || 0,
      position: primaryInsight?.position || "unknown",
      totalComps: primaryInsight?.local?.count || primaryInsight?.national?.count || 0,
    },
  });
}
