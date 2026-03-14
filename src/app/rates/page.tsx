import { DEPARTMENTS } from "@/lib/taxonomy";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AV Technician Rate Guide 2026 | Truss",
  description:
    "Average day rates for freelance AV technicians by role and city. Audio, video, lighting, staging, IT, and production rates for corporate events across major US markets.",
  keywords: [
    "AV technician rates",
    "freelance AV rates",
    "audio engineer day rate",
    "video engineer day rate",
    "lighting designer rates",
    "corporate AV rates 2026",
    "stagehand rates",
    "technical director day rate",
    "AV labor rates by city",
    "event technician pay",
  ],
  openGraph: {
    title: "AV Technician Rate Guide 2026 | Truss",
    description:
      "Average day rates for freelance AV technicians by role and city. The definitive rate guide for corporate events.",
    type: "article",
    url: "https://trusswork.org/rates",
  },
};

// ─── Cities shown in the rate grid ────────────────────────────
const CITIES = [
  "San Francisco",
  "New York",
  "Los Angeles",
  "Las Vegas",
  "Chicago",
  "Dallas",
  "Atlanta",
  "Nashville",
  "Miami",
  "Seattle",
] as const;

type City = (typeof CITIES)[number];

// ─── Cost-of-market multiplier vs national average ────────────
const CITY_MULTIPLIER: Record<City, number> = {
  "San Francisco": 1.18,
  "New York": 1.22,
  "Los Angeles": 1.12,
  "Las Vegas": 1.05,
  Chicago: 1.04,
  Dallas: 0.95,
  Atlanta: 0.93,
  Nashville: 0.92,
  Miami: 1.02,
  Seattle: 1.10,
};

// ─── National-average 10-hour day rate (low–high) by role short name ──
const BASE_RATES: Record<string, [number, number]> = {
  // Audio
  A1: [550, 850],
  A2: [350, 550],
  MON: [500, 800],
  DSP: [600, 950],
  // Video
  V1: [550, 900],
  V2: [350, 550],
  GFX: [400, 650],
  CAM: [400, 700],
  LED: [450, 700],
  PROJ: [400, 650],
  // Lighting
  L1: [500, 850],
  L2: [325, 500],
  SPOT: [275, 400],
  LP: [550, 900],
  // Staging & Rigging
  SH: [250, 400],
  RIG: [450, 750],
  SM: [500, 800],
  CARP: [400, 650],
  // IT & Networking
  NET: [600, 1000],
  IT: [350, 550],
  // Production & Management
  TD: [700, 1200],
  SC: [600, 950],
  PM: [650, 1100],
};

function cityRate(shortName: string, city: City): [number, number] {
  const [lo, hi] = BASE_RATES[shortName] ?? [0, 0];
  const m = CITY_MULTIPLIER[city];
  return [Math.round(lo * m / 25) * 25, Math.round(hi * m / 25) * 25];
}

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US");
}

// ─── Page ─────────────────────────────────────────────────────
export default function RatesPage() {
  const allRoles = DEPARTMENTS.flatMap((d) =>
    d.roles.map((r) => ({ ...r, dept: d.name, icon: d.icon }))
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* ── Header ──────────────────────────── */}
      <div className="text-center mb-12">
        <Link
          href="/"
          className="inline-block font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange hover:text-orange-400 transition-colors mb-6"
        >
          Truss
        </Link>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-wide uppercase leading-tight mb-4">
          AV Technician{" "}
          <span className="text-signal-orange">Rate Guide</span>{" "}
          <span className="text-aluminum">2026</span>
        </h1>
        <p className="text-aluminum max-w-2xl mx-auto leading-relaxed">
          Average 10-hour day rates for freelance AV technicians across major US
          markets. Rates reflect corporate / live-event work and vary by
          experience, gear ownership, and show complexity.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-standby-amber/[0.06] border border-standby-amber/15 text-[12px] text-standby-amber/70 max-w-xl">
          <span className="flex-shrink-0">*</span>
          <span>Rates are industry estimates based on market research. Actual rates vary by experience, market, and event type. As Truss grows, these will reflect real platform data.</span>
        </div>
      </div>

      {/* ── Rate Grid by Department ──────────── */}
      {DEPARTMENTS.map((dept) => (
        <section key={dept.id} className="mb-14">
          <h2 className="font-heading text-lg font-bold tracking-widest uppercase text-signal-orange mb-1 flex items-center gap-2">
            <span>{dept.icon}</span> {dept.name}
          </h2>
          <p className="text-xs text-aluminum/65 mb-4 font-mono">
            {dept.roles.length} roles &middot; 10-hr day rates (USD)
          </p>

          {/* Horizontal scroll wrapper */}
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink/[0.06]">
                  <th className="text-left py-3 pr-4 font-mono text-[10px] text-aluminum tracking-widest uppercase sticky left-0 bg-blackout z-10 min-w-[140px]">
                    Role
                  </th>
                  {CITIES.map((city) => (
                    <th
                      key={city}
                      className="text-center py-3 px-2 font-mono text-[10px] text-aluminum tracking-wider uppercase whitespace-nowrap"
                    >
                      {city}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dept.roles.map((role, i) => (
                  <tr
                    key={role.id}
                    className={`border-b border-ink/[0.03] ${
                      i % 2 === 0 ? "bg-ink/[0.015]" : ""
                    } hover:bg-signal-orange/[0.04] transition-colors`}
                  >
                    <td className="py-3 pr-4 sticky left-0 bg-blackout z-10">
                      <div className="font-semibold text-house-lights">
                        {role.shortName}
                      </div>
                      <div className="text-[11px] text-aluminum/65 leading-snug">
                        {role.name.replace(` (${role.shortName})`, "")}
                      </div>
                    </td>
                    {CITIES.map((city) => {
                      const [lo, hi] = cityRate(role.shortName, city);
                      return (
                        <td
                          key={city}
                          className="text-center py-3 px-2 font-mono text-xs whitespace-nowrap"
                        >
                          <span className="text-house-lights">{fmt(lo)}</span>
                          <span className="text-aluminum/60">&ndash;</span>
                          <span className="text-house-lights">{fmt(hi)}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* ── Methodology ─────────────────────── */}
      <section className="mb-14">
        <h2 className="font-heading text-lg font-bold tracking-widest uppercase text-signal-orange mb-4">
          How We Calculate Rates
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: "Market Data",
              text: "Rates are based on current freelance market data, IATSE scale references, and reported rates from working technicians in each market.",
            },
            {
              label: "10-Hour Day",
              text: "All rates assume a standard 10-hour day, the industry norm for corporate AV. Overtime, travel days, and per diem are additional.",
            },
            {
              label: "Experience Bands",
              text: "Low end reflects 1-3 years experience; high end reflects 8+ years, specialized skills, or gear-owner operators.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-deep-stage border border-white/5 rounded-lg p-5"
            >
              <div className="font-heading text-sm font-semibold tracking-wider uppercase mb-2">
                {item.label}
              </div>
              <p className="text-xs text-aluminum leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Reference: highest-demand roles ── */}
      <section className="mb-14">
        <h2 className="font-heading text-lg font-bold tracking-widest uppercase text-signal-orange mb-4">
          Highest-Demand Roles
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              { role: "A1", label: "Audio Engineer", nat: BASE_RATES["A1"] },
              { role: "V1", label: "Video Engineer", nat: BASE_RATES["V1"] },
              { role: "L1", label: "Lighting Designer", nat: BASE_RATES["L1"] },
              { role: "TD", label: "Technical Director", nat: BASE_RATES["TD"] },
            ] as const
          ).map((r) => (
            <div
              key={r.role}
              className="bg-deep-stage border border-white/5 rounded-lg p-5 text-center"
            >
              <div className="font-mono text-signal-orange text-2xl font-bold mb-1">
                {r.role}
              </div>
              <div className="text-xs text-aluminum mb-3">{r.label}</div>
              <div className="font-mono text-lg text-house-lights">
                {fmt(r.nat[0])}&ndash;{fmt(r.nat[1])}
              </div>
              <div className="text-[10px] text-aluminum/60 mt-1">
                national avg / day
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="text-center py-16 border-t border-ink/[0.06]">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-wide uppercase mb-3">
          Set Your Own Rate on{" "}
          <span className="text-signal-orange">Truss</span>
        </h2>
        <p className="text-aluminum max-w-md mx-auto mb-8 text-sm leading-relaxed">
          Join the marketplace built for AV professionals. Create your profile,
          set per-skill rates, and get booked by top producers.
        </p>
        <Link
          href="/signup?type=tech"
          className="inline-block px-8 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-orange-600 transition-colors"
        >
          Sign Up Free
        </Link>
        <p className="text-xs text-aluminum/50 mt-4">
          No fees until you get booked. Producers —{" "}
          <Link href="/signup?type=producer" className="text-signal-orange/60 hover:text-signal-orange transition-colors">
            create a producer account
          </Link>
          .
        </p>
      </section>

      {/* ── Footer note ─────────────────────── */}
      <footer className="text-center pb-8">
        <p className="text-[11px] text-aluminum/50 max-w-lg mx-auto leading-relaxed">
          Rates are estimates for informational purposes only. Actual rates vary
          by technician experience, event type, union jurisdiction, and market
          conditions. Updated February 2026.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 font-mono text-xs text-aluminum/50 hover:text-signal-orange transition-colors"
        >
          trusswork.org
        </Link>
      </footer>
    </main>
  );
}
