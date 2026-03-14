"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  );
}

function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userType, setUserType] = useState<"producer" | "tech">(
    searchParams.get("type") === "producer" ? "producer" : "tech"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingType, setBillingType] = useState("credit_card");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const refCode = searchParams.get("ref") || "";

  // Redirect authenticated users to onboarding/dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("profiles").select("display_name, city, cities, user_type")
          .eq("id", session.user.id).single().then(({ data: profile }) => {
            const hasCity = !!(profile?.city || profile?.cities?.length > 0);
            if (profile?.display_name && hasCity) {
              router.push(profile.user_type === "tech" ? "/dashboard" : "/projects");
            } else {
              router.push("/onboarding");
            }
          });
      }
    });
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name, user_type: userType } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // Supabase returns a fake user with empty identities for existing emails
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error("An account with this email already exists. Try logging in instead.");
      }

      // Create profile via API route (bypasses RLS since user hasn't confirmed email yet)
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          userType,
          displayName: name,
          email,
          phone: phone || null,
          companyName: companyName || null,
          billingType: userType === "producer" ? billingType : undefined,
          refCode: refCode || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Profile creation failed");

      // Show confirmation screen instead of redirecting
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors";
  const labelClass = "block text-[10px] font-mono text-signal-orange tracking-wider uppercase mb-1";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">

          {emailSent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-signal-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-signal-orange"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,6 12,13 22,6" /></svg>
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-2">
                Check Your <span className="text-signal-orange">Email</span>
              </h1>
              <p className="text-sm text-aluminum/60 mb-4 leading-relaxed">
                We sent a confirmation link to<br />
                <span className="text-house-lights font-semibold">{email}</span>
              </p>
              <div className="bg-deep-stage border border-white/5 rounded-xl p-4 mb-4 text-left">
                <div className="space-y-2.5">
                  {[
                    { step: "1", text: "Open the email from Truss" },
                    { step: "2", text: "Click the confirmation link" },
                    { step: "3", text: "You'll be signed in automatically" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-signal-orange/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-mono font-bold text-signal-orange">{s.step}</span>
                      </div>
                      <span className="text-sm text-aluminum/60">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-aluminum/50 mb-3">
                Didn&apos;t get it? Check your spam folder.
              </p>
              <Link href="/login" className="text-sm text-signal-orange hover:underline">
                Go to login →
              </Link>
            </div>
          ) : (
          <>
          {refCode && (
            <div className="bg-signal-orange/[0.06] border border-signal-orange/15 rounded-xl px-4 py-2.5 mb-3 text-center">
              <span className="text-xs text-aluminum">You were referred! Complete your first gig and you both earn <strong className="text-signal-orange">200 XP</strong></span>
            </div>
          )}

          <div className="text-center mb-5">
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-1">
              Join <span className="text-signal-orange">Truss</span>
            </h1>
            <p className="text-xs text-aluminum">Create your account and start connecting</p>
          </div>

          {/* Producer / Tech toggle */}
          <div className="flex bg-deep-stage rounded-lg p-1 mb-4">
            {(["tech", "producer"] as const).map((type) => (
              <button key={type} onClick={() => setUserType(type)}
                className={`flex-1 py-2 rounded-md text-sm font-heading font-semibold tracking-wider uppercase transition-all ${
                  userType === type ? "bg-signal-orange/15 text-signal-orange" : "text-aluminum hover:text-house-lights"
                }`}>
                {type === "tech" ? "I'm a Tech" : "I'm a Producer"}
              </button>
            ))}
          </div>

          <div className="bg-deep-stage border border-white/5 rounded-lg p-5">
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Rodriguez" className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@email.com" className={inputClass} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters" className={inputClass} minLength={6} required />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password" className={inputClass} minLength={6} required />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Phone <span className="text-aluminum/50">(optional)</span>
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567" className={inputClass} />
              </div>

              {/* Enterprise fields for producers */}
              {userType === "producer" && (
                <>
                  <div>
                    <label className={labelClass}>
                      Company Name <span className="text-aluminum/50">(optional)</span>
                    </label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Encore, Pinnacle Live, your company..." className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass + " mb-2"}>How will you pay?</label>
                    <div className="space-y-1.5">
                      {[
                        { id: "credit_card", title: "Credit Card", desc: "Pay per booking. Best for freelance producers." },
                        { id: "invoice", title: "Monthly Invoice", desc: "Net 15/30 terms. Best for companies." },
                        { id: "prepaid", title: "Prepaid Balance", desc: "Deposit funds, bookings deduct automatically." },
                      ].map(opt => (
                        <button key={opt.id} type="button" onClick={() => setBillingType(opt.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                            billingType === opt.id
                              ? "border-signal-orange/30 bg-signal-orange/[0.04]"
                              : "border-ink/[0.04] hover:border-white/10"
                          }`}>
                          <div>
                            <span className="text-xs font-semibold">{opt.title}</span>
                            <span className="text-[10px] text-aluminum/50 ml-2">{opt.desc}</span>
                          </div>
                          {billingType === opt.id && <span className="text-signal-orange text-[10px] font-mono ml-2">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {billingType === "invoice" && (
                    <div className="bg-signal-orange/[0.03] border border-signal-orange/10 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-aluminum/60 leading-relaxed">
                        Invoice billing requires approval. After signup, set up your billing address and payment terms in Settings.
                      </p>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                {loading ? "Creating account..." : `Sign Up as ${userType === "tech" ? "Technician" : "Producer"}`}
              </button>

              <p className="text-center text-[10px] text-aluminum/50 leading-relaxed">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-aluminum/50 hover:text-signal-orange transition-colors underline">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-aluminum/50 hover:text-signal-orange transition-colors underline">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          <p className="text-center text-xs text-aluminum mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-signal-orange hover:underline">Log in</Link>
          </p>
          </>
          )}
        </div>
    </main>
  );
}