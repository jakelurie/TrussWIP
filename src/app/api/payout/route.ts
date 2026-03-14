import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPayoutEmail } from "@/lib/email";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    // Look up booking
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("bookings")
      .select("id, tech_id, total_amount, project_id")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get project name for email
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("name")
      .eq("id", booking.project_id)
      .single();

    // Get tech's Connect account
    const { data: techProfile } = await supabaseAdmin
      .from("tech_profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", booking.tech_id)
      .single();

    // Get tech profile info for email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", booking.tech_id)
      .single();

    const totalAmount = booking.total_amount || 0;
    const platformFee = Math.round(totalAmount * 0.1 * 100) / 100;
    const payoutAmount = totalAmount - platformFee;

    // If no Connect account or not onboarded, create pending payout record
    if (!techProfile?.stripe_account_id || !techProfile?.stripe_onboarding_complete) {
      await supabaseAdmin.from("payouts").insert({
        tech_id: booking.tech_id,
        booking_id: bookingId,
        amount: payoutAmount,
        platform_fee: platformFee,
        status: "pending",
      });

      return NextResponse.json({ status: "pending", message: "Tech has not set up payouts yet" });
    }

    // Create Stripe transfer
    const stripe = getStripe();
    const transfer = await stripe.transfers.create({
      amount: Math.round(payoutAmount * 100), // cents
      currency: "usd",
      destination: techProfile.stripe_account_id,
      transfer_group: bookingId,
    });

    // Insert payout record
    await supabaseAdmin.from("payouts").insert({
      tech_id: booking.tech_id,
      booking_id: bookingId,
      stripe_transfer_id: transfer.id,
      amount: payoutAmount,
      platform_fee: platformFee,
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    // Send payout email (best-effort)
    if (profile?.email) {
      try {
        await sendPayoutEmail(
          profile.email,
          profile.display_name || "Tech",
          project?.name || "Event",
          payoutAmount
        );
      } catch (emailErr) {
        console.error("Payout email failed:", emailErr);
      }
    }

    return NextResponse.json({ status: "paid", transferId: transfer.id });
  } catch (error: any) {
    console.error("Payout error:", error);
    return NextResponse.json({ error: "Payout failed" }, { status: 500 });
  }
}
