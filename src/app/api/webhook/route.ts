import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && sig) {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    // Payment: booking paid
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        await supabaseAdmin
          .from("bookings")
          .update({
            status: "paid",
            payment_intent: session.payment_intent,
            paid_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
      }
    }

    // Stripe Connect: account onboarding completed
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      if (account.charges_enabled && account.payouts_enabled) {
        await supabaseAdmin
          .from("tech_profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("stripe_account_id", account.id);
      }
    }

    // Stripe Identity: verification completed
    if (event.type === "identity.verification_session.verified") {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.userId;

      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
    }

    // Stripe Identity: verification needs retry (failed or expired)
    if (event.type === "identity.verification_session.requires_input") {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.userId;

      if (userId) {
        // Clear session ID so user can start a new one
        await supabaseAdmin
          .from("profiles")
          .update({ stripe_identity_session_id: null })
          .eq("id", userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
