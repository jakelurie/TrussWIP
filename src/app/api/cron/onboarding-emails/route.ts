import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  sendProfileLiveEmail,
  sendCompleteProfileEmail,
  sendRateGuideEmail,
} from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin;
  const now = new Date();
  let sent = { day1: 0, day3: 0, day7: 0 };
  let errors = 0;

  // ── Day 1: "Your profile is live" ──────────────────────────────
  // Profiles created in the last 25 hours that haven't received this email
  const day1Cutoff = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
  const day1Start = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();

  const { data: newProfiles } = await supabase
    .from("profiles")
    .select("id, email, display_name, user_type, onboarding_email_sent")
    .gte("created_at", day1Start)
    .lte("created_at", day1Cutoff)
    .is("onboarding_email_sent", null);

  for (const profile of newProfiles || []) {
    if (!profile.email || !profile.display_name) continue;
    try {
      await sendProfileLiveEmail(
        profile.email,
        profile.display_name,
        profile.id,
        profile.user_type as "tech" | "producer"
      );
      await supabase
        .from("profiles")
        .update({ onboarding_email_sent: 1 })
        .eq("id", profile.id);
      sent.day1++;
    } catch (err) {
      console.error(`Day 1 email error for ${profile.id}:`, err);
      errors++;
    }
  }

  // ── Day 3: "Complete your profile" (tech only) ─────────────────
  const day3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const day3Start = new Date(now.getTime() - 3.04 * 24 * 60 * 60 * 1000).toISOString();

  const { data: day3Profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name, user_type, onboarding_email_sent")
    .eq("user_type", "tech")
    .gte("created_at", day3Start)
    .lte("created_at", day3Cutoff)
    .eq("onboarding_email_sent", 1);

  for (const profile of day3Profiles || []) {
    if (!profile.email || !profile.display_name) continue;
    try {
      // Check what's missing from their profile
      const { data: techProfile } = await supabase
        .from("tech_profiles")
        .select("bio, skills, gear, hourly_rate, profile_complete")
        .eq("user_id", profile.id)
        .single();

      const missing: string[] = [];
      if (!profile.display_name) missing.push("Add your display name");
      if (!techProfile?.bio) missing.push("Write a short bio");
      if (!techProfile?.hourly_rate) missing.push("Set your hourly rate");
      if (!techProfile?.gear || techProfile.gear.length === 0) missing.push("Add your gear proficiencies");
      if (!techProfile?.skills || techProfile.skills.length < 2) missing.push("Add more skills to your profile");

      // Only send if there's actually something missing
      if (missing.length === 0) {
        await supabase.from("profiles").update({ onboarding_email_sent: 3 }).eq("id", profile.id);
        continue;
      }

      await sendCompleteProfileEmail(
        profile.email,
        profile.display_name,
        profile.id,
        missing
      );
      await supabase
        .from("profiles")
        .update({ onboarding_email_sent: 3 })
        .eq("id", profile.id);
      sent.day3++;
    } catch (err) {
      console.error(`Day 3 email error for ${profile.id}:`, err);
      errors++;
    }
  }

  // ── Day 7: "Rate guide + career resources" (tech only) ─────────
  const day7Cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const day7Start = new Date(now.getTime() - 7.04 * 24 * 60 * 60 * 1000).toISOString();

  const { data: day7Profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name, user_type, onboarding_email_sent")
    .eq("user_type", "tech")
    .gte("created_at", day7Start)
    .lte("created_at", day7Cutoff)
    .in("onboarding_email_sent", [1, 3]);

  for (const profile of day7Profiles || []) {
    if (!profile.email || !profile.display_name) continue;
    try {
      const { data: techProfile } = await supabase
        .from("tech_profiles")
        .select("primary_skill")
        .eq("user_id", profile.id)
        .single();

      await sendRateGuideEmail(
        profile.email,
        profile.display_name,
        techProfile?.primary_skill || null
      );
      await supabase
        .from("profiles")
        .update({ onboarding_email_sent: 7 })
        .eq("id", profile.id);
      sent.day7++;
    } catch (err) {
      console.error(`Day 7 email error for ${profile.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ success: true, sent, errors });
}
