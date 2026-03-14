import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a tech
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_type, email, display_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "tech") {
      return NextResponse.json({ error: "Only technicians can set up payouts" }, { status: 403 });
    }

    const stripe = getStripe();
    const origin = req.nextUrl.origin;

    // Check if tech already has a Connect account
    const { data: techProfile } = await supabaseAdmin
      .from("tech_profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    let accountId = techProfile?.stripe_account_id;

    if (!accountId) {
      // Create new Express account
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email,
        metadata: { userId: user.id },
        capabilities: {
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      // Save to tech_profiles
      await supabaseAdmin
        .from("tech_profiles")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id);
    }

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/payouts?setup=refresh`,
      return_url: `${origin}/payouts?setup=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json({ error: "Stripe Connect failed" }, { status: 500 });
  }
}
