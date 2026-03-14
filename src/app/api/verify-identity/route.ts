import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 3 });

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

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

    // Check if already verified
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("identity_verified, stripe_identity_session_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.identity_verified) {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = req.nextUrl.origin;

    // Create Stripe Identity VerificationSession
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { userId: user.id },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      return_url: `${origin}/dashboard?verification=complete`,
    });

    // Store session ID
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_identity_session_id: session.id })
      .eq("id", user.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Verify identity error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
