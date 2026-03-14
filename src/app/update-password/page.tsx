"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase automatically picks up the recovery token from the URL hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also check if already in a session (token may have been consumed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-3 py-2 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors";
  const labelClass = "block text-[10px] font-mono text-signal-orange tracking-wider uppercase mb-1";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-1">
            New <span className="text-signal-orange">Password</span>
          </h1>
          <p className="text-xs text-aluminum">
            {success ? "Password updated. Redirecting..." : "Choose a new password for your account."}
          </p>
        </div>

        <div className="bg-deep-stage border border-white/5 rounded-lg p-5">
          {success ? (
            <div className="text-center py-3">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-go-green/10 flex items-center justify-center">
                <span className="text-go-green text-lg">✓</span>
              </div>
              <p className="text-sm text-house-lights">Password updated successfully</p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-3">
              <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin mb-3" />
              <p className="text-xs text-aluminum">Verifying reset link...</p>
              <p className="text-[10px] text-aluminum/40 mt-2">
                If this takes too long,{" "}
                <Link href="/reset-password" className="text-signal-orange hover:underline">request a new link</Link>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={inputClass}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className={inputClass}
                  required
                  minLength={6}
                />
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
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
