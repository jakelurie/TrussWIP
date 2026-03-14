import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 5 });
const isDev = process.env.NODE_ENV !== "production";

function jsonError(error: string, status: number, debug?: string) {
  const body: Record<string, string> = { error };
  if (isDev && debug) body._d = debug;
  return NextResponse.json(body, { status });
}

function isConfigured(value: string | undefined) {
  return !!value && !value.startsWith("replace-with-your-");
}

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    if (!isConfigured(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return jsonError(
        "Local signup is not configured yet. Add your real NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
        503
      );
    }

    if (!isConfigured(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      return jsonError(
        "Local signup is not configured yet. Add your real SUPABASE_SERVICE_ROLE_KEY to .env.local.",
        503
      );
    }

    const { userId, userType, displayName, email, phone, companyName, billingType, refCode } = await req.json();

    if (!userId || !userType || !displayName || !email) {
      return jsonError("Missing required fields", 400);
    }

    // Insert profile (bypasses RLS)
    const profileData: Record<string, unknown> = {
      id: userId,
      user_type: userType,
      roles: [userType],
      display_name: displayName,
      email,
      phone: phone || null,
      cities: [],
    };

    if (userType === "producer") {
      profileData.company_name = companyName || null;
      profileData.billing_type = billingType || "credit_card";
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert(profileData);
    if (profileError) {
      let msg = "Profile creation failed";
      if (profileError.code === "23505") msg = "An account with this email already exists";
      if (profileError.code === "23503") msg = "An account with this email already exists. Try logging in instead.";
      return jsonError(msg, 400, `${profileError.code}:${profileError.message}`);
    }

    // Create tech_profiles row for techs
    if (userType === "tech") {
      const { error: techError } = await supabaseAdmin.from("tech_profiles").insert({ user_id: userId });
      if (techError) {
        return jsonError("Tech profile failed", 400, techError.message);
      }
    }

    // Generate referral code
    const code = Math.random().toString(36).substring(2, 10);
    await supabaseAdmin.from("profiles").update({ referral_code: code }).eq("id", userId);

    // Process referral if present
    if (refCode) {
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", refCode)
        .single();

      if (referrer) {
        await supabaseAdmin.from("referrals").insert({
          referrer_id: referrer.id,
          referred_id: userId,
          referred_email: email,
          status: "signed_up",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return jsonError("Signup failed", 500, error.message);
  }
}
