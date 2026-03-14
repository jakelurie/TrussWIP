import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPayoutEmail } from "@/lib/email";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { data: techProfile } = await supabaseAdmin
      .from("tech_profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", userId)
      .single();

    if (!techProfile?.stripe_account_id) {
      return NextResponse.json({
        onboarded: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(techProfile.stripe_account_id);

    const fullyOnboarded = account.charges_enabled && account.payouts_enabled;

    // Update onboarding status if newly complete — and process pending payouts
    if (fullyOnboarded && !techProfile.stripe_onboarding_complete) {
      await supabaseAdmin
        .from("tech_profiles")
        .update({ stripe_onboarding_complete: true })
        .eq("user_id", userId);

      // Process any pending payouts
      await processPendingPayouts(userId, techProfile.stripe_account_id, stripe);
    }

    return NextResponse.json({
      onboarded: fullyOnboarded,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (error: any) {
    console.error("Stripe Connect status error:", error);
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}

async function processPendingPayouts(userId: string, stripeAccountId: string, stripe: Stripe) {
  const { data: pendingPayouts } = await supabaseAdmin
    .from("payouts")
    .select("id, booking_id, amount")
    .eq("tech_id", userId)
    .eq("status", "pending");

  if (!pendingPayouts || pendingPayouts.length === 0) return;

  // Get tech profile for email
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("id", userId)
    .single();

  for (const payout of pendingPayouts) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(payout.amount * 100), // cents
        currency: "usd",
        destination: stripeAccountId,
        transfer_group: payout.booking_id,
      });

      await supabaseAdmin
        .from("payouts")
        .update({
          status: "paid",
          stripe_transfer_id: transfer.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", payout.id);

      // Get project name for email
      if (profile?.email && payout.booking_id) {
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select("project_id")
          .eq("id", payout.booking_id)
          .single();
        const { data: project } = await supabaseAdmin
          .from("projects")
          .select("name")
          .eq("id", booking?.project_id)
          .single();

        try {
          await sendPayoutEmail(
            profile.email,
            profile.display_name || "Tech",
            project?.name || "Event",
            payout.amount
          );
        } catch (emailErr) {
          console.error("Payout email failed:", emailErr);
        }
      }
    } catch (err) {
      console.error(`Failed to process pending payout ${payout.id}:`, err);
      await supabaseAdmin
        .from("payouts")
        .update({ status: "failed" })
        .eq("id", payout.id);
    }
  }
}
