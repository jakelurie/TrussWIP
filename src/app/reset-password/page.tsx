"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
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
            Reset <span className="text-signal-orange">Password</span>
          </h1>
          <p className="text-xs text-aluminum">
            {sent ? "Check your email for a reset link." : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        <div className="bg-deep-stage border border-white/5 rounded-lg p-5">
          {sent ? (
            <div className="text-center py-3">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-go-green/10 flex items-center justify-center">
                <span className="text-go-green text-lg">✓</span>
              </div>
              <p className="text-xs text-aluminum mb-1">Reset link sent to</p>
              <p className="text-sm text-house-lights font-semibold mb-3">{email}</p>
              <p className="text-[10px] text-aluminum/50">
                Didn&apos;t get it? Check spam, or{" "}
                <button onClick={() => setSent(false)} className="text-signal-orange hover:underline">try again</button>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-aluminum mt-3">
          Remember your password?{" "}
          <Link href="/login" className="text-signal-orange hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
