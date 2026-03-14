import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendSavedSearchAlertEmail } from "@/lib/email";

// Runs daily — checks each active saved search for new matching techs
// since the last notification, and sends email alerts.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all active saved searches
  const { data: searches } = await supabaseAdmin
    .from("saved_searches")
    .select("*, profiles!saved_searches_producer_id_fkey(display_name, email)")
    .eq("active", true);

  if (!searches || searches.length === 0) {
    return NextResponse.json({ message: "No active saved searches", sent: 0 });
  }

  // Get all tech profiles (we filter in memory per search)
  const { data: allTechs } = await supabaseAdmin
    .from("tech_profiles")
    .select("user_id, primary_skill, skills, hourly_rate, available, has_insurance, created_at, profiles!tech_profiles_user_id_fkey(display_name, city, cities)");

  if (!allTechs) {
    return NextResponse.json({ message: "No techs found", sent: 0 });
  }

  let emailsSent = 0;

  for (const search of searches) {
    const filters = search.filters || {};
    const since = search.last_notified_at || search.created_at;

    // Find techs created since last notification that match filters
    const newTechs = allTechs.filter((tech: any) => {
      // Must be created after last notification
      if (tech.created_at <= since) return false;

      // Skill filter
      if (filters.skills?.length > 0) {
        const techSkills = [tech.primary_skill, ...(tech.skills || [])];
        if (!filters.skills.some((s: string) => techSkills.includes(s))) return false;
      }

      // City filter (text match)
      if (filters.city) {
        const cityLower = filters.city.toLowerCase();
        const techCities = tech.profiles?.cities?.length
          ? tech.profiles.cities
          : tech.profiles?.city
          ? [tech.profiles.city]
          : [];
        if (!techCities.some((c: string) => c.toLowerCase().includes(cityLower))) return false;
      }

      // Availability filter
      if (filters.available && !tech.available) return false;

      // Insurance filter
      if (filters.insured && !tech.has_insurance) return false;

      return true;
    });

    if (newTechs.length === 0) continue;

    // Build label from filters
    const label = search.label || buildLabel(filters);

    // Build tech summaries for the email
    const techSummaries = newTechs.map((t: any) => ({
      name: t.profiles?.display_name || "New Tech",
      skill: t.primary_skill || "",
      city: t.profiles?.cities?.[0] || t.profiles?.city || "",
      rate: t.hourly_rate || 0,
    }));

    const producerEmail = search.profiles?.email;
    const producerName = search.profiles?.display_name || "there";

    if (producerEmail) {
      try {
        await sendSavedSearchAlertEmail(producerEmail, producerName, label, techSummaries);
        emailsSent++;
      } catch {
        // Skip failed sends
      }
    }

    // Update last notified timestamp and match count
    await supabaseAdmin
      .from("saved_searches")
      .update({
        last_notified_at: new Date().toISOString(),
        last_match_count: (search.last_match_count || 0) + newTechs.length,
      })
      .eq("id", search.id);
  }

  return NextResponse.json({ message: "Done", sent: emailsSent, searches: searches.length });
}

function buildLabel(filters: any): string {
  const parts: string[] = [];
  if (filters.skills?.length > 0) parts.push(filters.skills.join(", "));
  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.available) parts.push("available");
  if (filters.insured) parts.push("insured");
  return parts.length > 0 ? parts.join(" · ") : "All techs";
}
