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

    const { data: techProfile } = await supabaseAdmin
      .from("tech_profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (!techProfile?.stripe_account_id) {
      return NextResponse.json({ error: "No Connect account found" }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = req.nextUrl.origin;

    const accountLink = await stripe.accountLinks.create({
      account: techProfile.stripe_account_id,
      refresh_url: `${origin}/payouts?setup=refresh`,
      return_url: `${origin}/payouts?setup=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect refresh error:", error);
    return NextResponse.json({ error: "Failed to refresh link" }, { status: 500 });
  }
}
