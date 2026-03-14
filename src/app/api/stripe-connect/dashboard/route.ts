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
    const loginLink = await stripe.accounts.createLoginLink(techProfile.stripe_account_id);

    return NextResponse.json({ url: loginLink.url });
  } catch (error: any) {
    console.error("Stripe dashboard link error:", error);
    return NextResponse.json({ error: "Failed to create dashboard link" }, { status: 500 });
  }
}
