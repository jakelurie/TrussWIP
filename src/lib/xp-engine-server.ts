import { supabaseAdmin } from "./supabase-admin";

const LEVEL_THRESHOLDS = [0, 1000, 3000, 6000, 10000];
const LEVEL_NAMES = ["Rookie", "Technician", "Specialist", "Expert", "Elite"];

const XP_REWARDS = {
  gig_completed: 100,
  review_received: 50,
  five_star_review: 75,
  profile_complete: 200,
  first_booking: 150,
  ten_gigs: 300,
  twenty_five_gigs: 500,
  fifty_gigs: 1000,
};

function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] || LEVEL_NAMES[0];
}

export async function awardXP(techUserId: string, amount: number, reason: string): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const { data: tp } = await supabaseAdmin
    .from("tech_profiles")
    .select("id, xp, level")
    .eq("user_id", techUserId)
    .single();

  if (!tp) return { newXP: 0, newLevel: 0, leveledUp: false };

  const oldXP = tp.xp || 0;
  const oldLevel = tp.level || 0;
  const newXP = oldXP + amount;
  const newLevel = getLevel(newXP);
  const leveledUp = newLevel > oldLevel;

  await supabaseAdmin
    .from("tech_profiles")
    .update({ xp: newXP, level: newLevel })
    .eq("id", tp.id);

  return { newXP, newLevel, leveledUp };
}

export async function processGigCompletion(techUserId: string): Promise<void> {
  const { data: tp } = await supabaseAdmin
    .from("tech_profiles")
    .select("id, completed_gigs")
    .eq("user_id", techUserId)
    .single();

  if (!tp) return;

  const newGigCount = (tp.completed_gigs || 0) + 1;

  await supabaseAdmin
    .from("tech_profiles")
    .update({ completed_gigs: newGigCount })
    .eq("id", tp.id);

  await awardXP(techUserId, XP_REWARDS.gig_completed, "Gig completed");

  if (newGigCount === 1) await awardXP(techUserId, XP_REWARDS.first_booking, "First gig completed!");
  if (newGigCount === 10) await awardXP(techUserId, XP_REWARDS.ten_gigs, "10 gigs milestone");
  if (newGigCount === 25) await awardXP(techUserId, XP_REWARDS.twenty_five_gigs, "25 gigs milestone");
  if (newGigCount === 50) await awardXP(techUserId, XP_REWARDS.fifty_gigs, "50 gigs milestone");

  await checkAndAwardBadges(techUserId, tp.id, newGigCount);

  if (newGigCount === 1) {
    await processReferralCompletion(techUserId);
  }
}

export async function processReview(techUserId: string, rating: number): Promise<void> {
  await awardXP(techUserId, XP_REWARDS.review_received, "Review received");
  if (rating === 5) await awardXP(techUserId, XP_REWARDS.five_star_review, "5-star review bonus");

  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("overall_rating")
    .eq("tech_id", techUserId);

  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length;
    const rounded = Math.round(avg * 10) / 10;

    await supabaseAdmin
      .from("tech_profiles")
      .update({
        avg_rating: rounded,
        review_count: reviews.length,
      })
      .eq("user_id", techUserId);
  }

  await checkVerification(techUserId);
}

async function processReferralCompletion(techUserId: string): Promise<void> {
  const { data: referral } = await supabaseAdmin
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", techUserId)
    .eq("status", "signed_up")
    .single();

  if (!referral) return;

  await supabaseAdmin.from("referrals").update({
    status: "completed",
    reward_given: true,
    completed_at: new Date().toISOString(),
  }).eq("id", referral.id);

  await awardXP(referral.referrer_id, 200, "Referral reward");
  await awardXP(techUserId, 200, "Referral welcome bonus");
}

async function checkVerification(techUserId: string): Promise<void> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_verified, avatar_url, display_name")
    .eq("id", techUserId)
    .single();

  if (!profile || profile.is_verified) return;

  const { data: tp } = await supabaseAdmin
    .from("tech_profiles")
    .select("bio, primary_skill, skills, hourly_rate, completed_gigs")
    .eq("user_id", techUserId)
    .single();

  if (!tp) return;

  const hasProfile = !!(
    profile.display_name &&
    profile.avatar_url &&
    tp.bio &&
    tp.primary_skill &&
    tp.skills?.length > 0 &&
    tp.hourly_rate > 0
  );

  if (!hasProfile || (tp.completed_gigs || 0) < 1) return;

  const { count } = await supabaseAdmin
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("tech_id", techUserId)
    .gte("overall_rating", 4);

  if (!count || count < 1) return;

  await supabaseAdmin
    .from("profiles")
    .update({ is_verified: true })
    .eq("id", techUserId);
}

async function checkAndAwardBadges(techUserId: string, techProfileId: string, gigCount: number): Promise<void> {
  const { data: badges } = await supabaseAdmin.from("badges").select("*");
  if (!badges) return;

  const { data: earned } = await supabaseAdmin
    .from("earned_badges")
    .select("badge_id")
    .eq("tech_profile_id", techProfileId);
  const earnedIds = new Set((earned || []).map(e => e.badge_id));

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    let shouldAward = false;
    if (badge.name === "First Gig" && gigCount >= 1) shouldAward = true;
    if (badge.name === "Road Warrior" && gigCount >= 10) shouldAward = true;
    if (badge.name === "Veteran" && gigCount >= 25) shouldAward = true;
    if (badge.name === "Legend" && gigCount >= 50) shouldAward = true;

    if (shouldAward) {
      await supabaseAdmin.from("earned_badges").insert({
        tech_profile_id: techProfileId,
        badge_id: badge.id,
        earned_date: new Date().toISOString(),
      });
    }
  }
}
