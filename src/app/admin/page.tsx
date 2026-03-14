"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setData(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-aluminum/50 text-sm">Failed to load admin data.</div>;
  }

  const { keyMetrics: km, health, actionItems, activity, signupsByDay } = data;
  const signupDays = Object.entries(signupsByDay as Record<string, number>).sort(([a], [b]) => a.localeCompare(b));
  const maxSignups = Math.max(...signupDays.map(([, v]) => v), 1);

  return (
    <div className="p-6 max-w-[1100px]">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-signal-orange tracking-[3px] uppercase">Platform Admin</span>
        <h1 className="font-heading text-xl font-bold tracking-tight mt-1">Overview</h1>
      </div>

      {/* ── Key Metrics (4 cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Total Techs"
          value={km.totalTechs}
          delta={km.techsThisWeek > 0 ? `+${km.techsThisWeek} this wk` : undefined}
          sub={`${km.avgProfileComplete}% avg complete`}
          color="var(--color-signal-orange)"
        />
        <MetricCard
          label="Producers"
          value={km.totalProducers}
          delta={km.producersThisWeek > 0 ? `+${km.producersThisWeek} this wk` : undefined}
          color="var(--color-cue-blue)"
        />
        <MetricCard
          label="Bookings This Week"
          value={km.bookingsThisWeek}
          delta={km.bookingsLastWeek > 0 ? `vs ${km.bookingsLastWeek} last wk` : undefined}
          sub={`$${km.weekGmv.toLocaleString()} GMV`}
          color="var(--color-standby-amber)"
        />
        <MetricCard
          label="Revenue This Month"
          value={`$${km.monthRevenue.toLocaleString()}`}
          delta={km.revenueMoM !== 0 ? `MoM: ${km.revenueMoM > 0 ? "+" : ""}${km.revenueMoM}%` : undefined}
          deltaColor={km.revenueMoM > 0 ? "var(--color-go-green)" : km.revenueMoM < 0 ? "var(--color-signal-orange)" : undefined}
          color="var(--color-go-green)"
        />
      </div>

      {/* ── Marketplace Health (3 cards) ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-4">
          <div className="font-mono text-2xl font-semibold">{health.fillRate}%</div>
          <div className="text-[9px] text-aluminum/50 font-mono tracking-wider uppercase mt-1">Fill Rate</div>
          <div className="text-[10px] text-aluminum/30 mt-0.5">Completed / Total</div>
        </div>
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-4">
          <div className="font-mono text-2xl font-semibold">${health.avgBookingValue.toLocaleString()}</div>
          <div className="text-[9px] text-aluminum/50 font-mono tracking-wider uppercase mt-1">Avg Booking Value</div>
          <div className="text-[10px] text-aluminum/30 mt-0.5">Across all paid</div>
        </div>
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-4">
          <div className="font-mono text-2xl font-semibold">{health.repeatRate}%</div>
          <div className="text-[9px] text-aluminum/50 font-mono tracking-wider uppercase mt-1">Repeat Rate</div>
          <div className="text-[10px] text-aluminum/30 mt-0.5">Producers who booked 2+</div>
        </div>
      </div>

      {/* ── Action Items ── */}
      {(actionItems.newSignupsToday > 0 || actionItems.emptyProfiles > 0) && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
          <h2 className="font-mono text-[9px] text-standby-amber tracking-[3px] uppercase mb-3">Action Items</h2>
          <div className="space-y-1.5">
            {actionItems.newSignupsToday > 0 && (
              <Link href="/admin/users" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-ink/[0.03] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cue-blue" />
                  <span className="text-xs">{actionItems.newSignupsToday} new signup{actionItems.newSignupsToday !== 1 ? "s" : ""} today</span>
                </div>
                <span className="text-[9px] font-mono text-aluminum/40">/admin/users</span>
              </Link>
            )}
            {actionItems.emptyProfiles > 0 && (
              <Link href="/admin/users" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-ink/[0.03] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-standby-amber" />
                  <span className="text-xs">{actionItems.emptyProfiles} profile{actionItems.emptyProfiles !== 1 ? "s" : ""} at 0% completeness</span>
                </div>
                <span className="text-[9px] font-mono text-aluminum/40">/admin/users</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Signups Chart ── */}
      {signupDays.length > 0 && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
          <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-4">Signups — Last 30 Days</h2>
          <div className="flex items-end gap-1 h-24">
            {signupDays.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count}`}>
                <span className="text-[7px] text-aluminum/40 font-mono">{count > 0 ? count : ""}</span>
                <div
                  className="w-full bg-signal-orange/50 rounded-t min-h-[2px]"
                  style={{ height: `${(count / maxSignups) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[8px] text-aluminum/25 font-mono">{signupDays[0]?.[0]?.slice(5)}</span>
            <span className="text-[8px] text-aluminum/25 font-mono">{signupDays[signupDays.length - 1]?.[0]?.slice(5)}</span>
          </div>
        </div>
      )}

      {/* ── Recent Activity ── */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
        <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">Recent Activity</h2>
        {activity.length === 0 ? (
          <div className="text-center py-6 text-aluminum/30 text-sm">No recent activity</div>
        ) : (
          <div className="space-y-1">
            {activity.map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-ink/[0.02]">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  item.type === "signup" ? "bg-cue-blue"
                    : item.type === "booking_completed" ? "bg-go-green"
                    : item.type === "booking_created" ? "bg-standby-amber"
                    : item.type === "review" ? "bg-signal-orange"
                    : "bg-aluminum/30"
                }`} />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-house-lights/70">{item.message}</span>
                </div>
                <span className="text-[9px] text-aluminum/30 font-mono flex-shrink-0">{getTimeAgo(item.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Components ──

function MetricCard({ label, value, delta, deltaColor, sub, color }: {
  label: string;
  value: number | string;
  delta?: string;
  deltaColor?: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-4">
      <div className="font-mono text-2xl font-semibold" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[9px] text-aluminum/50 font-mono tracking-wider uppercase mt-1">{label}</div>
      {delta && (
        <div className="text-[10px] mt-1" style={{ color: deltaColor || "var(--color-aluminum)" }}>
          {delta}
        </div>
      )}
      {sub && <div className="text-[10px] text-aluminum/30 mt-0.5">{sub}</div>}
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
