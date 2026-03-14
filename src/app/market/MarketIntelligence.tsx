"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RoleStat {
  role: string;
  count: number;
  avg: number;
  median: number;
  low: number;
  high: number;
  p25: number;
  p75: number;
}

interface MarketData {
  totalTechs: number;
  availableCount: number;
  totalJobs: number;
  totalBookings: number;
  ratesByRole: RoleStat[];
  topCities: { city: string; count: number }[];
  experienceDistribution: Record<string, number>;
  topSpecializations: { spec: string; count: number }[];
  jobDemand: {
    byRole: { role: string; count: number }[];
    byCity: { city: string; count: number }[];
  };
  bookingsByRole: Record<string, number>;
}

export default function MarketIntelligence() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market-data")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-center text-aluminum/50">Unable to load market data.</p>
      </main>
    );
  }

  const maxCityCount = data.topCities[0]?.count || 1;
  const maxSpecCount = data.topSpecializations[0]?.count || 1;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">
          Live Data
        </span>
        <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mt-2">
          AV MARKET <span className="text-signal-orange">INTELLIGENCE</span>
        </h1>
        <p className="text-sm text-aluminum/60 mt-3 max-w-xl mx-auto">
          Rate benchmarks, demand trends, and labor market insights from the
          Truss marketplace. Updated in real time.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: "Technicians", value: data.totalTechs },
          { label: "Available Now", value: data.availableCount },
          { label: "Open Jobs", value: data.totalJobs },
          { label: "Bookings", value: data.totalBookings },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5 text-center"
          >
            <div className="font-heading text-3xl font-bold text-signal-orange">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Rate Benchmarks */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Rate Benchmarks by Role
        </h2>
        <p className="text-xs text-aluminum/50 mb-4">
          Hourly rates reported by technicians on Truss. Shows average, median, and range.
        </p>
        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-ink/[0.04] text-[10px] font-mono text-aluminum/50 tracking-wider uppercase">
            <div className="col-span-2">Role</div>
            <div className="text-right">Avg</div>
            <div className="text-right">Median</div>
            <div className="text-right">Range</div>
            <div className="text-right">Techs</div>
          </div>
          {data.ratesByRole.map((r, i) => (
            <div
              key={r.role}
              className={`grid grid-cols-6 gap-2 px-4 py-3 items-center ${
                i < data.ratesByRole.length - 1 ? "border-b border-ink/[0.02]" : ""
              }`}
            >
              <div className="col-span-2">
                <Link
                  href={`/browse?skill=${r.role}`}
                  className="text-sm text-house-lights hover:text-signal-orange transition-colors"
                >
                  {r.role}
                </Link>
              </div>
              <div className="text-right font-mono text-sm text-signal-orange">
                ${r.avg}
              </div>
              <div className="text-right font-mono text-sm text-aluminum/70">
                ${r.median}
              </div>
              <div className="text-right font-mono text-[11px] text-aluminum/50">
                ${r.low}–${r.high}
              </div>
              <div className="text-right font-mono text-[11px] text-aluminum/40">
                {r.count}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-column: Cities + Experience */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* Top Markets */}
        <section>
          <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
            Top Markets
          </h2>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-5">
            <div className="space-y-2.5">
              {data.topCities.map((c) => (
                <div key={c.city}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-house-lights/80">{c.city}</span>
                    <span className="font-mono text-[11px] text-aluminum/50">
                      {c.count} tech{c.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal-orange/60 rounded-full transition-all"
                      style={{ width: `${(c.count / maxCityCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Experience Distribution */}
        <section>
          <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
            Experience Distribution
          </h2>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-5">
            <div className="space-y-3">
              {Object.entries(data.experienceDistribution).map(([bucket, count]) => {
                const maxExp = Math.max(...Object.values(data.experienceDistribution));
                return (
                  <div key={bucket}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-house-lights/80">{bucket} years</span>
                      <span className="font-mono text-[11px] text-aluminum/50">
                        {count} tech{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-1.5 bg-ink/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cue-blue/60 rounded-full transition-all"
                        style={{ width: `${(count / maxExp) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Two-column: Specializations + Job Demand */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* Top Specializations */}
        <section>
          <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
            Top Specializations
          </h2>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-5">
            <div className="space-y-2.5">
              {data.topSpecializations.map((s) => (
                <div key={s.spec}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-house-lights/80">{s.spec}</span>
                    <span className="font-mono text-[11px] text-aluminum/50">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-ink/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-go-green/50 rounded-full transition-all"
                      style={{ width: `${(s.count / maxSpecCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Job Demand */}
        <section>
          <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
            Hiring Demand
          </h2>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-5">
            {data.jobDemand.byRole.length > 0 ? (
              <>
                <h3 className="text-[10px] font-mono text-signal-orange/60 tracking-widest uppercase mb-2">
                  By Role
                </h3>
                <div className="space-y-1.5 mb-4">
                  {data.jobDemand.byRole.map((j) => (
                    <div key={j.role} className="flex justify-between items-center py-1">
                      <Link
                        href={`/jobs/role/${j.role.toLowerCase()}`}
                        className="text-xs text-house-lights/80 hover:text-signal-orange transition-colors"
                      >
                        {j.role}
                      </Link>
                      <span className="font-mono text-[11px] text-signal-orange">
                        {j.count} open
                      </span>
                    </div>
                  ))}
                </div>
                {data.jobDemand.byCity.length > 0 && (
                  <>
                    <h3 className="text-[10px] font-mono text-signal-orange/60 tracking-widest uppercase mb-2">
                      By City
                    </h3>
                    <div className="space-y-1.5">
                      {data.jobDemand.byCity.map((j) => (
                        <div key={j.city} className="flex justify-between items-center py-1">
                          <span className="text-xs text-house-lights/80">{j.city}</span>
                          <span className="font-mono text-[11px] text-aluminum/50">
                            {j.count} job{j.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-aluminum/40">No open jobs yet. Check back soon.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* CTA */}
      <section className="text-center py-10 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Join the <span className="text-signal-orange">Truss</span> Marketplace
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          Set your rate, list your skills, and show up in market data.
          Producers use this data to find and book qualified crew.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/signup?type=tech"
            className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Create Tech Profile
          </Link>
          <Link
            href="/browse"
            className="px-6 py-3 border border-signal-orange/30 text-signal-orange font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:bg-signal-orange/[0.06] transition-all"
          >
            Browse Marketplace
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-8 pt-6 border-t border-ink/[0.03]">
        <p className="text-[10px] text-aluminum/30 leading-relaxed max-w-2xl">
          Market data is aggregated from self-reported rates and activity on the
          Truss platform. Data is anonymized and updated in real time. Rates
          reflect what technicians list on their profiles, not necessarily what
          they are paid. Sample sizes vary by role and market.
        </p>
      </div>
    </main>
  );
}
