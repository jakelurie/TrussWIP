"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Get profile to determine where to redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, onboarding_complete")
        .eq("id", data.user.id)
        .single();

      if (profile?.user_type === "producer") {
        router.push("/projects");
      } else if (profile?.user_type === "tech" && !profile?.onboarding_complete) {
        router.push("/edit-profile");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors";
  const labelClass = "block text-[10px] font-mono text-signal-orange tracking-wider uppercase mb-1";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-5">
            <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-1">
              Welcome <span className="text-signal-orange">Back</span>
            </h1>
            <p className="text-xs text-aluminum">Log in to your Truss account</p>
          </div>

          <div className="bg-deep-stage border border-white/5 rounded-lg p-5">
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcus@email.com"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={inputClass}
                  required
                />
              </div>

              <div className="text-right -mt-1">
                <Link href="/reset-password" className="text-[10px] text-aluminum/50 hover:text-signal-orange transition-colors">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-aluminum mt-3">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-signal-orange hover:underline">Sign up</Link>
          </p>
        </div>
    </main>
  );
}