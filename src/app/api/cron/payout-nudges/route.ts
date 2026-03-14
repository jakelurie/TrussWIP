import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPayoutNudgeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sent = 0;
  let errors = 0;

  // Find techs with pending payouts who haven't completed Stripe Connect
  // and haven't been nudged in the last 3 days
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingPayouts } = await supabaseAdmin
    .from("payouts")
    .select("tech_id, amount")
    .eq("status", "pending");

  if (!pendingPayouts || pendingPayouts.length === 0) {
    return NextResponse.json({ success: true, sent: 0, skipped: 0, errors: 0 });
  }

  // Group by tech_id
  const byTech: Record<string, { total: number; count: number }> = {};
  for (const p of pendingPayouts) {
    if (!byTech[p.tech_id]) byTech[p.tech_id] = { total: 0, count: 0 };
    byTech[p.tech_id].total += Number(p.amount) || 0;
    byTech[p.tech_id].count++;
  }

  const techIds = Object.keys(byTech);

  // Get tech profiles that haven't completed onboarding and haven't been nudged recently
  const { data: techProfiles } = await supabaseAdmin
    .from("tech_profiles")
    .select("user_id, stripe_onboarding_complete, payout_nudge_sent_at")
    .in("user_id", techIds)
    .eq("stripe_onboarding_complete", false);

  for (const tp of techProfiles || []) {
    // Skip if nudged within last 3 days
    if (tp.payout_nudge_sent_at && tp.payout_nudge_sent_at > threeDaysAgo) continue;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", tp.user_id)
      .single();

    if (!profile?.email) continue;

    const { total, count } = byTech[tp.user_id];

    try {
      await sendPayoutNudgeEmail(
        profile.email,
        profile.display_name || "Tech",
        total,
        count
      );
      await supabaseAdmin
        .from("tech_profiles")
        .update({ payout_nudge_sent_at: new Date().toISOString() })
        .eq("user_id", tp.user_id);
      sent++;
    } catch (err) {
      console.error(`Nudge email error for ${tp.user_id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ success: true, sent, errors });
}
