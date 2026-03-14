"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const METHOD_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  invoice: "Invoice",
  prepaid: "Prepaid",
};

const METHOD_COLORS: Record<string, string> = {
  credit_card: "bg-cue-blue",
  invoice: "bg-standby-amber",
  prepaid: "bg-go-green",
};

export default function AdminRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/revenue", {
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
    return <div className="p-8 text-aluminum/50 text-sm">Failed to load revenue data.</div>;
  }

  const { period: p, byMethod, months, cities, roles, chartData } = data;
  const maxChartGmv = Math.max(...chartData.map((d: any) => d.gmv), 1);

  return (
    <div className="p-6 max-w-[1100px]">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-signal-orange tracking-[3px] uppercase">Platform Admin</span>
        <h1 className="font-heading text-xl font-bold tracking-tight mt-1">Revenue</h1>
      </div>

      {/* ── Period Metrics (4 cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="GMV This Month"
          value={`$${p.thisMonthGmv.toLocaleString()}`}
          delta={p.lastMonthGmv > 0 ? `vs $${p.lastMonthGmv.toLocaleString()} last mo` : undefined}
          color="var(--color-aluminum)"
        />
        <MetricCard
          label="Revenue (Fees)"
          value={`$${p.thisMonthRevenue.toLocaleString()}`}
          delta={p.lastMonthRevenue > 0 ? `vs $${p.lastMonthRevenue.toLocaleString()} last mo` : undefined}
          color="var(--color-signal-orange)"
        />
        <MetricCard
          label="Take Rate"
          value={`${p.takeRate}%`}
          color="var(--color-cue-blue)"
        />
        <MetricCard
          label="Outstanding Invoices"
          value={`$${p.outstandingTotal.toLocaleString()}`}
          delta={p.outstandingCount > 0 ? `${p.outstandingCount} invoice${p.outstandingCount !== 1 ? "s" : ""}` : undefined}
          color="var(--color-standby-amber)"
        />
      </div>

      {/* ── Revenue by Payment Method ── */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
        <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-4">Revenue by Payment Method</h2>
        <div className="space-y-3">
          {byMethod.map((m: any) => (
            <div key={m.method} className="flex items-center gap-3">
              <span className="text-xs text-aluminum/60 w-24">{METHOD_LABELS[m.method] || m.method}</span>
              <div className="flex-1 h-4 bg-blackout/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${METHOD_COLORS[m.method] || "bg-aluminum"}`}
                  style={{ width: `${m.pct}%`, opacity: 0.6 }}
                />
              </div>
              <span className="font-mono text-[10px] text-house-lights/70 w-20 text-right">
                ${m.revenue.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-aluminum/40 w-10 text-right">{m.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Chart (CSS bar chart) ── */}
      {chartData.length > 0 && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
          <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-4">Monthly GMV & Revenue</h2>
          <div className="flex items-end gap-2 h-32">
            {chartData.map((d: any) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                {/* GMV bar */}
                <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: `${(d.gmv / maxChartGmv) * 100}%` }}>
                  <div
                    className="flex-1 bg-aluminum/30 rounded-t min-h-[2px]"
                    style={{ height: "100%" }}
                    title={`GMV: $${d.gmv.toLocaleString()}`}
                  />
                  <div
                    className="flex-1 bg-signal-orange/60 rounded-t min-h-[2px]"
                    style={{ height: `${d.gmv > 0 ? (d.revenue / d.gmv) * 100 : 0}%` }}
                    title={`Revenue: $${d.revenue.toLocaleString()}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {chartData.map((d: any) => (
              <span key={d.month} className="flex-1 text-center text-[8px] text-aluminum/25 font-mono">
                {formatMonth(d.month)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 justify-end">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-aluminum/30 rounded-sm" />
              <span className="text-[9px] text-aluminum/40 font-mono">GMV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-signal-orange/60 rounded-sm" />
              <span className="text-[9px] text-aluminum/40 font-mono">Revenue</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly Breakdown Table ── */}
      {months.length > 0 && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl overflow-hidden mb-4">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase">Monthly Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/[0.06]">
                  <th className="text-left px-4 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Month</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Bookings</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">GMV</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Revenue</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden md:table-cell">Avg Booking</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Card</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Invoice</th>
                  <th className="text-right px-4 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Prepaid</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m: any) => (
                  <tr key={m.month} className="border-b border-ink/[0.03] hover:bg-ink/[0.02]">
                    <td className="px-4 py-2.5 font-mono text-[10px]">{formatMonthFull(m.month)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[10px] text-aluminum/60">{m.bookings}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[10px]">${m.gmv.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[10px] text-signal-orange">${m.revenue.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[10px] text-aluminum/50 hidden md:table-cell">${m.avgBooking.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[10px] text-aluminum/40 hidden lg:table-cell">${m.card.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[10px] text-aluminum/40 hidden lg:table-cell">${m.invoice.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[10px] text-aluminum/40 hidden lg:table-cell">${m.prepaid.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Revenue by City ── */}
        {cities.length > 0 && (
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase">Revenue by City</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/[0.06]">
                  <th className="text-left px-4 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">City</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Bookings</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">GMV</th>
                  <th className="text-right px-4 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c: any) => (
                  <tr key={c.city} className="border-b border-ink/[0.03] hover:bg-ink/[0.02]">
                    <td className="px-4 py-2 text-house-lights/70">{c.city}</td>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-aluminum/60">{c.bookings}</td>
                    <td className="px-3 py-2 text-right font-mono text-[10px]">${c.gmv.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono text-[10px] text-signal-orange">${c.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Revenue by Role ── */}
        {roles.length > 0 && (
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase">Revenue by Role</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/[0.06]">
                  <th className="text-left px-4 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Role</th>
                  <th className="text-right px-3 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Bookings</th>
                  <th className="text-right px-4 py-2 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">GMV</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r: any) => (
                  <tr key={r.role} className="border-b border-ink/[0.03] hover:bg-ink/[0.02]">
                    <td className="px-4 py-2">
                      <span className="inline-block px-1.5 py-0.5 bg-cue-blue/10 text-cue-blue rounded text-[9px] font-mono tracking-wider">
                        {r.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-aluminum/60">{r.bookings}</td>
                    <td className="px-4 py-2 text-right font-mono text-[10px]">${r.gmv.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, delta, color }: {
  label: string;
  value: string;
  delta?: string;
  color: string;
}) {
  return (
    <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-4">
      <div className="font-mono text-2xl font-semibold" style={{ color }}>{value}</div>
      <div className="text-[9px] text-aluminum/50 font-mono tracking-wider uppercase mt-1">{label}</div>
      {delta && <div className="text-[10px] text-aluminum/30 mt-0.5">{delta}</div>}
    </div>
  );
}

function formatMonth(ym: string) {
  const [y, m] = ym.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1]} '${y.slice(2)}`;
}

function formatMonthFull(ym: string) {
  const [y, m] = ym.split("-");
  return `${["January","February","March","April","May","June","July","August","September","October","November","December"][parseInt(m) - 1]} ${y}`;
}
