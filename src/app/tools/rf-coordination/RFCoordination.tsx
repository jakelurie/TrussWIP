"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Shure Frequency Blocks (US) ──────────────────────────────
const SHURE_BANDS = [
  { band: "G50", range: "470–534 MHz", width: "64 MHz", status: "safe" as const, note: "Below 600 MHz. Safe nationwide. Check local TV channels." },
  { band: "G57", range: "470–616 MHz", width: "146 MHz", status: "safe" as const, note: "Axient Digital wideband. Covers G50 + H50 + J50A range." },
  { band: "H50", range: "534–598 MHz", width: "64 MHz", status: "safe" as const, note: "Below 600 MHz. Safe nationwide. Check local TV channels." },
  { band: "H54", range: "520–636 MHz", width: "116 MHz", status: "caution" as const, note: "Extends above 614 MHz. Must band-limit upper portion in Wireless Workbench." },
  { band: "J50A", range: "572–616 MHz", width: "44 MHz", status: "safe" as const, note: "Post-repack replacement for J50. Stays below 617 MHz cutoff." },
  { band: "K51", range: "606–670 MHz", width: "64 MHz", status: "caution" as const, note: "Overlaps 600 MHz restricted zone. Must band-limit. Only duplex gap (653–663 MHz) is usable above 617." },
  { band: "K53", range: "606–698 MHz", width: "92 MHz", status: "restricted" as const, note: "Mostly in restricted 600 MHz zone. Very limited usable spectrum." },
  { band: "L50", range: "632–698 MHz", width: "66 MHz", status: "restricted" as const, note: "Entirely in the 600 MHz zone. Effectively unusable without band-limiting to duplex gap only." },
];

// ─── Sennheiser Bands (US) ────────────────────────────────────
const SENNHEISER_BANDS = [
  { band: "Q1-6", range: "470–526 MHz", width: "56 MHz", status: "safe" as const, note: "Below 600 MHz. Safe nationwide." },
  { band: "R1-6", range: "520–576 MHz", width: "56 MHz", status: "safe" as const, note: "Below 600 MHz. Safe nationwide." },
  { band: "R4-9", range: "552–608 MHz", width: "56 MHz", status: "safe" as const, note: "Stays below 614 MHz. Generally safe." },
  { band: "S1-7", range: "606–662 MHz", width: "56 MHz", status: "caution" as const, note: "Overlaps 600 MHz zone. Must avoid 617–653 MHz. Duplex gap (653–663) usable." },
  { band: "S4-7", range: "630–662 MHz", width: "32 MHz", status: "caution" as const, note: "Mostly in restricted zone. Only duplex gap frequencies usable." },
];

// ─── Wisycom Bands (US) ───────────────────────────────────────
const WISYCOM_BANDS = [
  { band: "B2", range: "470–700 MHz", width: "230 MHz", status: "caution" as const, note: "MCR54/MTP60. Ultra-wideband tuning. Must avoid 617–653 / 663–698 MHz." },
];

// ─── City Data ────────────────────────────────────────────────
type CityData = {
  name: string;
  congestion: "high" | "moderate" | "low";
  safeBlocks: string[];
  cautionBlocks: string[];
  notes: string;
};

const CITIES: CityData[] = [
  { name: "New York", congestion: "high", safeBlocks: ["G50", "J50A"], cautionBlocks: ["H50"], notes: "Extremely congested UHF market. Many active TV stations in 470–600 MHz. G50 has the most usable channels. Always run a scan." },
  { name: "Los Angeles", congestion: "high", safeBlocks: ["G50", "J50A"], cautionBlocks: ["H50"], notes: "Heavy TV usage. Limited open channels across all blocks. Bring a spectrum analyzer." },
  { name: "Chicago", congestion: "high", safeBlocks: ["G50", "H50"], cautionBlocks: ["J50A"], notes: "Dense TV market. G50 and H50 have the most room. Public safety uses some channels 14–20." },
  { name: "San Francisco", congestion: "high", safeBlocks: ["G50", "H50"], cautionBlocks: ["J50A"], notes: "Bay Area has heavy TV and public safety usage. G50 is typically your best bet." },
  { name: "Washington DC", congestion: "high", safeBlocks: ["G50"], cautionBlocks: ["H50", "J50A"], notes: "Federal facilities and dense TV market. Government RF activity across UHF. Coordinate carefully." },
  { name: "Dallas", congestion: "moderate", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Moderate TV density. All blocks below 614 MHz generally workable." },
  { name: "Atlanta", congestion: "moderate", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Moderate congestion. Good availability across sub-600 MHz blocks." },
  { name: "Las Vegas", congestion: "moderate", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Convention venues may have heavy wireless traffic from neighboring events. Coordinate with venue." },
  { name: "Orlando", congestion: "moderate", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Theme parks and convention centers create local congestion. Run a scan on site." },
  { name: "Nashville", congestion: "moderate", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Live music venues mean lots of wireless in use. G50 and H50 are solid choices." },
  { name: "Miami", congestion: "moderate", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Moderate TV density. Sub-600 MHz blocks are generally clear." },
  { name: "Seattle", congestion: "moderate", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Moderate market. Good availability in G50 and H50." },
  { name: "Denver", congestion: "low", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Fewer active TV stations. Good spectrum availability across all sub-600 MHz blocks." },
  { name: "Milwaukee", congestion: "low", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Low TV density. All blocks below 614 MHz are generally open." },
  { name: "Salt Lake City", congestion: "low", safeBlocks: ["G50", "H50", "J50A"], cautionBlocks: [], notes: "Low congestion. Plenty of open spectrum." },
];

const STATUS_STYLES = {
  safe: "bg-go-green/15 text-go-green",
  caution: "bg-standby-amber/15 text-standby-amber",
  restricted: "bg-red-500/15 text-red-400",
};

const STATUS_LABELS = {
  safe: "SAFE",
  caution: "CAUTION",
  restricted: "RESTRICTED",
};

const CONGESTION_STYLES = {
  high: "bg-red-500/15 text-red-400",
  moderate: "bg-standby-amber/15 text-standby-amber",
  low: "bg-go-green/15 text-go-green",
};

export default function RFCoordination() {
  const [selectedCity, setSelectedCity] = useState<string>("");

  const cityData = CITIES.find((c) => c.name === selectedCity);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">
          Tools
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
          RF FREQUENCY <span className="text-signal-orange">COORDINATION</span>
        </h1>
        <p className="text-sm text-aluminum/65 mt-3 max-w-2xl mx-auto">
          Quick reference for wireless microphone frequency blocks, FCC
          restrictions, and intermodulation limits. Built for A1s and RF
          coordinators working corporate AV.
        </p>
      </div>

      {/* ===== 600 MHz OVERVIEW ===== */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          The 600 MHz Rule
        </h2>
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-red-500/15">
          <div className="flex items-start gap-3 mb-4">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-red-500/15 text-red-400 flex-shrink-0 mt-0.5">
              FCC LAW
            </span>
            <p className="text-sm text-aluminum/60 leading-relaxed">
              Since July 2020, it is <strong className="text-house-lights">illegal</strong> to
              operate wireless microphones in the 617–653 MHz and 663–698 MHz
              ranges. These were auctioned to T-Mobile for 5G. Equipment that
              can even <em>tune</em> to these frequencies must be band-limited.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-go-green/[0.06] border border-go-green/10">
              <div className="font-mono text-[11px] text-go-green mb-1">470–614 MHz</div>
              <div className="text-[10px] text-aluminum/60">UHF TV Band — Legal</div>
            </div>
            <div className="p-3 rounded-lg bg-standby-amber/[0.06] border border-standby-amber/10">
              <div className="font-mono text-[11px] text-standby-amber mb-1">614–617 / 653–663 MHz</div>
              <div className="text-[10px] text-aluminum/60">Guard Band / Duplex Gap — 20mW max</div>
            </div>
            <div className="p-3 rounded-lg bg-red-500/[0.06] border border-red-500/10">
              <div className="font-mono text-[11px] text-red-400 mb-1">617–653 / 663–698 MHz</div>
              <div className="text-[10px] text-aluminum/60">T-Mobile 5G — Illegal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SHURE BLOCKS ===== */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-2">
          Shure Frequency Blocks
        </h2>
        <p className="text-xs text-aluminum/60 mb-4">
          Axient Digital, ULX-D, QLX-D, SLX-D
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider">BAND</th>
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider">RANGE</th>
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider hidden sm:table-cell">WIDTH</th>
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {SHURE_BANDS.map((b) => (
                <tr key={b.band} className="border-b border-ink/[0.03] hover:bg-ink/[0.02]">
                  <td className="py-2.5 px-3 font-heading font-bold text-house-lights">{b.band}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-aluminum/60">{b.range}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-aluminum/60 hidden sm:table-cell">{b.width}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${STATUS_STYLES[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1.5">
          {SHURE_BANDS.map((b) => (
            <div key={b.band} className="text-[11px] text-aluminum/50">
              <span className="font-mono text-aluminum/65">{b.band}:</span> {b.note}
            </div>
          ))}
        </div>
      </section>

      {/* ===== SENNHEISER BLOCKS ===== */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-2">
          Sennheiser Frequency Blocks
        </h2>
        <p className="text-xs text-aluminum/60 mb-4">
          EW-D, EW-DX, Digital 6000
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider">BAND</th>
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider">RANGE</th>
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider hidden sm:table-cell">WIDTH</th>
                <th className="text-left py-2 px-3 font-mono text-[10px] text-aluminum/60 tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {SENNHEISER_BANDS.map((b) => (
                <tr key={b.band} className="border-b border-ink/[0.03] hover:bg-ink/[0.02]">
                  <td className="py-2.5 px-3 font-heading font-bold text-house-lights">{b.band}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-aluminum/60">{b.range}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-aluminum/60 hidden sm:table-cell">{b.width}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${STATUS_STYLES[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== WISYCOM ===== */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-2">
          Wisycom
        </h2>
        <p className="text-xs text-aluminum/60 mb-4">
          MCR54, MTP60
        </p>
        <div className="p-4 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-heading font-bold text-house-lights">B2</span>
              <span className="font-mono text-xs text-aluminum/60 ml-3">470–700 MHz</span>
              <span className="font-mono text-xs text-aluminum/60 ml-3 hidden sm:inline">230 MHz</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${STATUS_STYLES.caution}`}>
              CAUTION
            </span>
          </div>
          <p className="text-[11px] text-aluminum/50 mt-2">
            Ultra-wideband tuning. Must avoid 617–653 MHz and 663–698 MHz. The wide tuning range
            makes Wisycom highly flexible for dodging local interference — but you still need to
            scan and coordinate.
          </p>
        </div>
      </section>

      {/* ===== CITY TOOL ===== */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-2">
          Check Your City
        </h2>
        <p className="text-xs text-aluminum/60 mb-4">
          Select a city to see which frequency blocks are recommended for that market.
        </p>
        <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-blackout/60 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-house-lights focus:outline-none focus:border-signal-orange/40 appearance-none cursor-pointer"
          >
            <option value="">Select a city...</option>
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {cityData && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-heading text-lg font-bold">{cityData.name}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${CONGESTION_STYLES[cityData.congestion]}`}>
                  {cityData.congestion.toUpperCase()} CONGESTION
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {cityData.safeBlocks.length > 0 && (
                  <div className="p-3 rounded-lg bg-go-green/[0.04] border border-go-green/10">
                    <div className="text-[10px] font-mono text-go-green tracking-wider mb-2">RECOMMENDED</div>
                    <div className="flex flex-wrap gap-2">
                      {cityData.safeBlocks.map((b) => (
                        <span key={b} className="px-3 py-1 rounded bg-go-green/10 text-go-green font-heading font-bold text-sm">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {cityData.cautionBlocks.length > 0 && (
                  <div className="p-3 rounded-lg bg-standby-amber/[0.04] border border-standby-amber/10">
                    <div className="text-[10px] font-mono text-standby-amber tracking-wider mb-2">USE WITH CAUTION</div>
                    <div className="flex flex-wrap gap-2">
                      {cityData.cautionBlocks.map((b) => (
                        <span key={b} className="px-3 py-1 rounded bg-standby-amber/10 text-standby-amber font-heading font-bold text-sm">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[12px] text-aluminum/60 leading-[1.7]">
                {cityData.notes}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ===== INTERMODULATION ===== */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Intermodulation &amp; Channel Stacking
        </h2>
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-signal-orange mb-3">
              What Is Intermodulation?
            </h3>
            <p className="text-[12px] text-aluminum/65 leading-[1.8] mb-3">
              When two or more wireless transmitters operate simultaneously, they
              create mathematical combinations of their frequencies called
              intermodulation (intermod) products. These phantom signals can land
              on the same frequency as one of your receivers, causing dropouts or
              interference. The more transmitters you add, the more intermod
              products are generated — exponentially.
            </p>
            <p className="text-[12px] text-aluminum/65 leading-[1.8]">
              Three transmitters generate up to 9 third-order intermod products.
              Every transmitter you add makes coordination exponentially harder.
              This is why you can&apos;t just pick frequencies manually — you need
              software like Shure Wireless Workbench or Sennheiser WSM to
              calculate intermod-free frequency sets.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-signal-orange mb-3">
              Rules of Thumb: Channels Per Block
            </h3>
            <p className="text-[12px] text-aluminum/65 leading-[1.8] mb-4">
              These are practical maximums in a single frequency block, assuming
              a clean RF environment and proper coordination software. Real-world
              counts depend on local TV stations, other wireless users, and venue
              conditions.
            </p>
            <div className="space-y-3">
              {[
                {
                  system: "Shure Axient Digital",
                  channels: "Up to 47 per 6 MHz TV channel",
                  mode: "High Density mode",
                  note: "Best-in-class density. Requires Wireless Workbench coordination.",
                },
                {
                  system: "Shure ULX-D",
                  channels: "Up to 17 per 6 MHz TV channel",
                  mode: "High Density mode",
                  note: "Standard mode supports fewer. HD mode packs channels tighter.",
                },
                {
                  system: "Shure QLX-D / SLX-D",
                  channels: "8–12 per 6 MHz TV channel",
                  mode: "Standard mode",
                  note: "No High Density mode. Solid for small-to-mid corporate shows.",
                },
                {
                  system: "Sennheiser EW-D / EW-DX",
                  channels: "Up to 90 per TV channel (EW-DX)",
                  mode: "Equidistant spacing",
                  note: "EW-DX uses a fixed 600 kHz raster. EW-D supports fewer.",
                },
                {
                  system: "Sennheiser Digital 6000",
                  channels: "Up to 12 per 8 MHz",
                  mode: "Long Range mode",
                  note: "Equidistant tuning grid. Designed for broadcast and theater.",
                },
                {
                  system: "Wisycom MCR54 / MTP60",
                  channels: "Varies by mode",
                  mode: "Narrowband / wideband",
                  note: "Wideband tuning. Channel count depends on mode and bandwidth setting.",
                },
                {
                  system: "Analog systems (general)",
                  channels: "~12–16 per 24 MHz block",
                  mode: "Calculated groups",
                  note: "Legacy analog generates more intermod. Use coordination software.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-blackout/40 border border-ink/[0.02]"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-heading text-xs font-bold tracking-wide text-house-lights">
                      {item.system}
                    </span>
                    <span className="font-mono text-[10px] text-signal-orange">
                      {item.channels}
                    </span>
                  </div>
                  <div className="text-[10px] text-aluminum/50 font-mono mb-1">
                    {item.mode}
                  </div>
                  <p className="text-[11px] text-aluminum/60">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-deep-stage/40 border border-standby-amber/10">
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-standby-amber mb-3">
              The Real-World Rule
            </h3>
            <p className="text-[12px] text-aluminum/65 leading-[1.8]">
              Manufacturer specs assume a clean environment. On a real show floor
              with neighboring events, DAS systems, and local TV stations, expect
              to use <strong className="text-house-lights">50–70% of the theoretical
              maximum</strong>. For a 24-channel corporate show, plan on needing
              at least two clean frequency blocks. Always scan the venue before
              the show and bring a backup block.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FCC WHITE SPACE ===== */}
      <section className="mb-16">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Before the Show
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
            <h3 className="font-heading text-xs font-bold tracking-wider uppercase text-signal-orange mb-2">
              Check the FCC White Space Database
            </h3>
            <p className="text-[12px] text-aluminum/60 leading-[1.7] mb-3">
              The FCC maintains a database of which TV channels are active in
              every US market. Check it before every show to know which
              frequencies are occupied. Available at{" "}
              <span className="text-signal-orange font-mono text-[11px]">
                whitespaces.fcc.gov
              </span>
            </p>
            <p className="text-[11px] text-aluminum/50">
              Shure Wireless Workbench and Sennheiser WSM can query this data
              automatically.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05]">
            <h3 className="font-heading text-xs font-bold tracking-wider uppercase text-signal-orange mb-2">
              Always Scan On Site
            </h3>
            <p className="text-[12px] text-aluminum/60 leading-[1.7] mb-3">
              White space data tells you about TV stations, but not about other
              wireless users in the building. Hotel ballrooms, convention
              centers, and arenas often have DAS (Distributed Antenna Systems)
              and other events running wireless simultaneously.
            </p>
            <p className="text-[11px] text-aluminum/50">
              Use your receiver&apos;s scan function or a dedicated RF scanner
              (RF Venue, Shure AXT600) to see what&apos;s actually in the air.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="text-center py-12 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          RF Coordination Is a <span className="text-signal-orange">Skill</span>
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          List your RF coordination experience on Truss. Producers need A1s who
          can manage complex wireless environments.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Create Your Profile — Free
          </Link>
          <Link
            href="/rates"
            className="inline-block px-8 py-4 bg-transparent text-aluminum font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl border border-white/10 hover:border-signal-orange/30 hover:bg-signal-orange/[0.03] transition-all"
          >
            View Rate Guide
          </Link>
        </div>
      </section>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[11px] text-aluminum/40 leading-relaxed">
          This reference is for informational purposes only. RF regulations vary by country and jurisdiction. Always verify frequency availability with local authorities and venue management before deploying wireless systems. Truss is not responsible for interference or regulatory compliance.
        </p>
      </footer>
    </main>
  );
}