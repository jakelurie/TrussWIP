"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PAGE_SIZE = 20;

export default function PayoutsWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
      </div>
    }>
      <Payouts />
    </Suspense>
  );
}

function Payouts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState<{
    onboarded: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
  } | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [settingUp, setSettingUp] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    loadData();
  }, [page]);

  useEffect(() => {
    const setup = searchParams.get("setup");
    if (setup === "complete") {
      showToast("Payout setup complete");
    } else if (setup === "refresh") {
      showToast("Please complete your payout setup");
    }
  }, [searchParams]);

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const uid = session.user.id;
    setUserId(uid);

    // Check user type
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", uid)
      .single();

    if (profile?.user_type !== "tech") {
      router.push("/dashboard");
      return;
    }

    // Check Connect status
    try {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();
      const statusRes = await fetch("/api/stripe-connect/status", {
        headers: {
          Authorization: `Bearer ${activeSession?.access_token || ""}`,
        },
      });
      const statusData = await statusRes.json();
      if (!statusRes.ok) {
        throw new Error(statusData.error || "Failed to load payout status");
      }
      setConnectStatus(statusData);
    } catch {
      setConnectStatus({ onboarded: false, charges_enabled: false, payouts_enabled: false });
    }

    // Fetch payouts
    const { count } = await supabase
      .from("payouts")
      .select("*", { count: "exact", head: true })
      .eq("tech_id", uid);
    setTotalCount(count || 0);

    const { data: payoutData } = await supabase
      .from("payouts")
      .select("*, bookings(projects(name))")
      .eq("tech_id", uid)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setPayouts(payoutData || []);

    // Compute summary stats
    const { data: allPayouts } = await supabase
      .from("payouts")
      .select("amount, status, paid_at")
      .eq("tech_id", uid);

    if (allPayouts) {
      const paid = allPayouts
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setTotalPaid(paid);

      const now = new Date();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const monthPaid = allPayouts
        .filter((p) => p.status === "paid" && p.paid_at && p.paid_at >= monthStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setThisMonth(monthPaid);

      const pending = allPayouts
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setPendingTotal(pending);
    }

    setLoading(false);
  };

  const handleSetup = async () => {
    setSettingUp(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe-connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Setup failed");
        setSettingUp(false);
      }
    } catch {
      showToast("Setup failed");
      setSettingUp(false);
    }
  };

  const handleRefresh = async () => {
    setSettingUp(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe-connect/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Refresh failed");
        setSettingUp(false);
      }
    } catch {
      showToast("Refresh failed");
      setSettingUp(false);
    }
  };

  const handleOpenDashboard = async () => {
    setOpeningDashboard(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe-connect/dashboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        showToast(data.error || "Could not open dashboard");
      }
    } catch {
      showToast("Could not open dashboard");
    }
    setOpeningDashboard(false);
  };

  const formatDate = (d: string) => {
    if (!d) return "--";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2 bg-go-green/15 border border-go-green/30 rounded-lg font-mono text-xs text-go-green backdrop-blur-md">
          {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
          <div>
            <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">
              Payouts
            </span>
            <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">
              Your <span className="text-signal-orange">Earnings</span>
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-mono text-aluminum/65 border border-ink/[0.06] rounded-lg hover:border-signal-orange/20 transition-all"
          >
            Dashboard
          </Link>
        </div>

        {/* Connect Status */}
        {connectStatus && !connectStatus.onboarded ? (
          <div className="bg-standby-amber/[0.06] border border-standby-amber/20 rounded-xl p-6 mb-6">
            <h2 className="font-heading text-lg font-bold mb-2">
              Set up payouts to receive your earnings
            </h2>
            <p className="text-sm text-aluminum/70 mb-4">
              Connect your bank account through Stripe to get paid when gigs
              are completed. Stripe handles all identity verification and tax
              forms.
            </p>
            {connectStatus.charges_enabled === false &&
            connectStatus.payouts_enabled === false &&
            searchParams.get("setup") === "refresh" ? (
              <button
                onClick={handleRefresh}
                disabled={settingUp}
                className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-wider uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.3)] transition-all disabled:opacity-50"
              >
                {settingUp ? "Redirecting..." : "Continue Setup"}
              </button>
            ) : (
              <button
                onClick={handleSetup}
                disabled={settingUp}
                className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-wider uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.3)] transition-all disabled:opacity-50"
              >
                {settingUp ? "Redirecting..." : "Set Up Payouts"}
              </button>
            )}
          </div>
        ) : connectStatus?.onboarded ? (
          <div className="flex items-center justify-between bg-go-green/[0.06] border border-go-green/20 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-go-green" />
              <span className="text-sm font-semibold text-go-green">
                Payouts active
              </span>
            </div>
            <button
              onClick={handleOpenDashboard}
              disabled={openingDashboard}
              className="px-4 py-2 text-xs font-mono text-aluminum/65 border border-ink/[0.06] rounded-lg hover:border-signal-orange/20 hover:text-signal-orange transition-all disabled:opacity-50"
            >
              {openingDashboard ? "Opening..." : "Manage Bank Account"}
            </button>
          </div>
        ) : null}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
              Total Paid Out
            </div>
            <div className="font-mono text-2xl font-semibold text-go-green">
              ${totalPaid.toLocaleString()}
            </div>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
              This Month
            </div>
            <div className="font-mono text-2xl font-semibold">
              ${thisMonth.toLocaleString()}
            </div>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">
              Pending
            </div>
            <div className="font-mono text-2xl font-semibold text-standby-amber">
              ${pendingTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="mb-4">
          <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-3">
            Payout History
          </h2>

          {payouts.length === 0 ? (
            <div className="text-center py-12 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
              <div className="text-aluminum/35 text-sm">No payouts yet</div>
              <p className="text-[11px] text-aluminum/25 mt-1">
                Payouts appear here when producers mark your gigs as complete
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_90px_100px_80px_100px] gap-3 px-4 py-2 text-[9px] font-mono text-aluminum/40 uppercase tracking-wider">
                <span>Project</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Fee (10%)</span>
                <span className="text-right">Net Payout</span>
                <span className="text-center">Status</span>
                <span className="text-right">Date</span>
              </div>

              <div className="space-y-1">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_100px_90px_100px_80px_100px] gap-1 sm:gap-3 items-center p-4 bg-deep-stage/40 border border-ink/[0.03] rounded-lg"
                  >
                    <div className="text-sm font-semibold truncate">
                      {p.bookings?.projects?.name || "Unknown"}
                    </div>
                    <div className="font-mono text-sm text-right">
                      ${((p.amount || 0) + (p.platform_fee || 0)).toLocaleString()}
                    </div>
                    <div className="font-mono text-xs text-aluminum/50 text-right">
                      -${(p.platform_fee || 0).toLocaleString()}
                    </div>
                    <div className="font-mono text-sm font-semibold text-go-green text-right">
                      ${(p.amount || 0).toLocaleString()}
                    </div>
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold ${
                          p.status === "paid"
                            ? "bg-go-green/10 text-go-green border border-go-green/20"
                            : "bg-standby-amber/10 text-standby-amber border border-standby-amber/20"
                        }`}
                      >
                        {p.status === "paid" ? "PAID" : "PENDING"}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-aluminum/60 text-right">
                      {formatDate(p.paid_at || p.created_at)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs font-mono text-aluminum/60 border border-ink/[0.06] rounded-lg disabled:opacity-30 hover:border-signal-orange/20 transition-all"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs font-mono text-aluminum/40">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs font-mono text-aluminum/60 border border-ink/[0.06] rounded-lg disabled:opacity-30 hover:border-signal-orange/20 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
