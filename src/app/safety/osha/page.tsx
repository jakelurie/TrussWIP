import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OSHA Regulations for Live Events & AV Technicians | Truss",
  description:
    "Complete OSHA compliance reference for AV technicians and stagehands. Fall protection, electrical safety, rigging, PPE, hearing conservation, lockout/tagout, and hazard communication.",
  keywords: [
    "OSHA live events",
    "OSHA AV technician",
    "stagehand safety regulations",
    "fall protection live events",
    "electrical safety events",
    "rigging OSHA regulations",
    "PPE requirements AV tech",
    "hearing conservation events",
    "lockout tagout live events",
    "OSHA 1926 general industry",
    "event production safety",
    "stagehand fall protection",
  ],
  openGraph: {
    title: "OSHA Regulations for Live Events & AV Technicians | Truss",
    description:
      "Fall protection, electrical safety, rigging, PPE, and more. The federal regulations that apply to every load-in.",
    type: "article",
    url: "https://trusswork.org/safety/osha",
  },
};

// ─── Data ───────────────────────────────────────────────

const PPE_ITEMS = [
  { item: "Hard hat (Type I or II)", when: "Any overhead work, rigging, load-in/out with suspended loads", standard: "ANSI Z89.1" },
  { item: "Steel/composite-toe boots", when: "All load-in/out, any venue with heavy equipment", standard: "ASTM F2413" },
  { item: "High-visibility vest", when: "Outdoor events, loading docks, any area with vehicle traffic", standard: "ANSI 107" },
  { item: "Safety glasses", when: "Grinding, cutting, overhead debris risk, pyrotechnic setup", standard: "ANSI Z87.1" },
  { item: "Hearing protection", when: "Exposure above 85 dBA TWA (most live sound environments)", standard: "29 CFR 1910.95" },
  { item: "Work gloves", when: "Cable pulling, truss handling, rigging, any rough material handling", standard: "ANSI/ISEA 105" },
  { item: "Fall protection harness", when: "Working at heights above 6 ft (construction) or 4 ft (general industry)", standard: "ANSI Z359.11" },
  { item: "Arc-rated clothing", when: "Work on energized electrical panels above 50V", standard: "NFPA 70E Table 130.5(C)" },
];

const NOISE_LEVELS = [
  { source: "Concert front-of-house (typical)", dba: "95-105 dBA" },
  { source: "Monitor world / side stage", dba: "100-115 dBA" },
  { source: "Drum kit (unmiked, 3 ft)", dba: "100-110 dBA" },
  { source: "Corporate general session", dba: "80-90 dBA" },
  { source: "Convention hall ambient", dba: "70-80 dBA" },
  { source: "Forklift / scissor lift operation", dba: "80-95 dBA" },
];

const ELECTRICAL_CLASSES = [
  { voltage: "0-50V", category: "Low voltage", arc_flash: "Minimal risk", ppe: "No special PPE required" },
  { voltage: "50-240V", category: "Hazardous", arc_flash: "Category 1", ppe: "Arc-rated shirt/pants, safety glasses, leather gloves" },
  { voltage: "240-600V", category: "Hazardous", arc_flash: "Category 2", ppe: "Arc-rated suit (8 cal/cm2), face shield, insulated gloves" },
  { voltage: "600V+", category: "High voltage", arc_flash: "Category 3-4", ppe: "Full arc flash suit (25-40 cal/cm2), qualified persons only" },
];

const GHS_SYMBOLS = [
  { name: "Flame", applies: "Haze fluid, cleaning solvents, spray adhesives, contact cement" },
  { name: "Exclamation Mark", applies: "Haze/fog fluid irritants, dust from cutting materials" },
  { name: "Health Hazard", applies: "Long-term exposure to solvents, certain paints and coatings" },
  { name: "Corrosion", applies: "Battery acid (lead-acid UPS systems), certain cleaning chemicals" },
  { name: "Gas Cylinder", applies: "CO2 tanks (cryo effects, confetti cannons)" },
];

export default function OshaPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-2">
        <Link
          href="/safety"
          className="text-[11px] font-mono text-aluminum/40 hover:text-signal-orange transition-colors tracking-wider uppercase"
        >
          &larr; Safety Compliance
        </Link>
      </div>
      <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
        OSHA FOR <span className="text-signal-orange">LIVE EVENTS</span>
      </h1>
      <p className="text-sm text-aluminum/60 mb-1">
        Federal regulations that apply to AV technicians and stagehands
      </p>
      <p className="text-xs text-aluminum/40 mb-10">
        Last updated February 2026
      </p>

      {/* Intro */}
      <section className="mb-12">
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          OSHA doesn&apos;t have a &quot;live events&quot; standard. Instead, event work falls under a mix of General Industry (29 CFR 1910) and Construction (29 CFR 1926) standards depending on the task. Load-in and load-out typically fall under construction standards. Show operations typically fall under general industry. The distinction matters because fall protection trigger heights differ: 6 feet for construction, 4 feet for general industry.
        </p>
        <div className="bg-deep-stage/40 border border-signal-orange/10 rounded-xl p-5">
          <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
            Who Is Responsible?
          </h3>
          <p className="text-xs text-aluminum/60 leading-relaxed">
            Under OSHA&apos;s multi-employer worksite policy, responsibility falls on the <strong className="text-house-lights/80">controlling employer</strong> (the production company or venue that controls the site), the <strong className="text-house-lights/80">creating employer</strong> (whoever creates a hazard), and the <strong className="text-house-lights/80">exposing employer</strong> (whoever exposes workers to a hazard). As a freelance tech, you can be cited if you create a hazard — even if you didn&apos;t hire yourself.
          </p>
        </div>
      </section>

      {/* ─── Fall Protection ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Fall Protection
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Falls are the leading cause of death in construction and a significant risk in event production. OSHA requires fall protection at different heights depending on the standard that applies.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
              Construction (1926.501)
            </h3>
            <div className="font-mono text-2xl font-bold text-house-lights mb-1">6 ft</div>
            <p className="text-xs text-aluminum/60 leading-relaxed">
              Applies during load-in/out, truss assembly, stage builds, and any work that involves erecting or dismantling temporary structures. Includes work from scaffolding, ladders, and aerial lifts.
            </p>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
              General Industry (1910.28)
            </h3>
            <div className="font-mono text-2xl font-bold text-house-lights mb-1">4 ft</div>
            <p className="text-xs text-aluminum/60 leading-relaxed">
              Applies during show operations, fixed platform work, and maintenance tasks. If you&apos;re on a fixed elevated platform (lighting catwalk, follow spot booth) during the show, general industry applies.
            </p>
          </div>
        </div>

        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5 mb-4">
          <h3 className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3">Fall Protection Methods (in order of preference)</h3>
          <div className="space-y-3">
            {[
              { method: "Elimination", desc: "Do the work from the ground. Use ground-supported lifts, pre-rig at floor level." },
              { method: "Guardrails", desc: "Standard guardrail: 42\" top rail, 21\" mid rail, 4\" toe board. Required on open-sided platforms." },
              { method: "Safety nets", desc: "Rarely used in events but required for some structural steel work." },
              { method: "Personal fall arrest (harness + lanyard)", desc: "Full-body harness (ANSI Z359.11), shock-absorbing lanyard, rated anchor point (5,000 lbs per person). Inspect before each use." },
              { method: "Positioning devices", desc: "For work where you need both hands free at height. Must be backed up by a fall arrest system." },
            ].map((f, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-mono text-[10px] text-signal-orange font-bold w-4 flex-shrink-0 pt-0.5">{i + 1}</span>
                <div>
                  <span className="text-xs font-semibold text-house-lights/80">{f.method}</span>
                  <p className="text-[11px] text-aluminum/50 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-signal-orange/5 border border-signal-orange/15 rounded-xl p-5">
          <h3 className="font-heading text-xs font-bold text-signal-orange tracking-wider uppercase mb-2">
            Common Violation
          </h3>
          <p className="text-xs text-aluminum/60 leading-relaxed">
            Standing on the top cap of a 12&apos; A-frame ladder to hang a speaker or projector. Top two steps of a stepladder are not working surfaces. If you need to be higher, use a proper aerial lift or scaffold.
          </p>
        </div>
      </section>

      {/* ─── Electrical Safety ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Electrical Safety
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Event power distribution involves voltages and amperages that can kill. OSHA defers to NFPA 70E (Standard for Electrical Safety in the Workplace) for arc flash and shock protection requirements.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Voltage</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Category</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Arc Flash</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">PPE Required</th>
              </tr>
            </thead>
            <tbody>
              {ELECTRICAL_CLASSES.map((e, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2 pr-3 font-mono text-house-lights/70">{e.voltage}</td>
                  <td className="py-2 pr-3 text-aluminum/60">{e.category}</td>
                  <td className="py-2 pr-3 text-aluminum/60">{e.arc_flash}</td>
                  <td className="py-2 text-aluminum/60">{e.ppe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 mb-4">
          {[
            { rule: "Qualified vs. unqualified persons", detail: "Only qualified electrical workers (trained in NFPA 70E) may work on energized circuits above 50V. If you're plugging in Cam-Lok, tapping power distros, or troubleshooting live panels, you need to be qualified. Running extension cords does not require qualification." },
            { rule: "Approach boundaries", detail: "NFPA 70E defines Limited, Restricted, and Prohibited approach boundaries around energized equipment. For 480V 3-phase (common in event power), the limited approach boundary is 3.5 feet. Unqualified persons must stay outside this boundary." },
            { rule: "GFCI protection", detail: "All 120V, 15A and 20A receptacles used outdoors or in wet/damp locations must have GFCI protection (29 CFR 1926.405(a)(2)(ii)). This includes outdoor festivals, tent events, and any venue with wet floors." },
            { rule: "Temporary wiring", detail: "All temporary event wiring must be protected from damage — no cables run across traffic areas without ramps or covers. Multi-conductor cables must be rated for the amperage. Single-conductor cables (feeder) must be elevated or protected." },
          ].map((r, i) => (
            <div key={i} className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-house-lights/80 mb-1">{r.rule}</h3>
              <p className="text-[11px] text-aluminum/50 leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Rigging ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Rigging & Overhead Loads
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          OSHA doesn&apos;t have a specific rigging standard for entertainment. The industry follows ANSI E1.2 (Entertainment Technology — Design, Manufacture, and Use of Aluminum Trusses and Towers) and ANSI E1.6-1 (Powered Hoists). OSHA enforces the General Duty Clause (Section 5(a)(1)) and sling/rigging hardware standards from 29 CFR 1926 Subpart H.
        </p>

        <div className="space-y-3 mb-6">
          {[
            { rule: "Working Load Limit (WLL)", detail: "Never exceed the WLL of any rigging component. The system is only as strong as its weakest link. All hardware (shackles, slings, hoists) must have legible WLL markings." },
            { rule: "Safety factor", detail: "Entertainment rigging uses a minimum 5:1 safety factor for static loads and 8:1 or 10:1 for dynamic loads (anything involving motion or people). A 1,000 lb WLL shackle has an ultimate breaking strength of 5,000 lbs." },
            { rule: "Competent rigger", detail: "All overhead rigging must be designed and supervised by a competent rigger — someone with documented training and experience. This is not a job for the A2 who \"knows knots.\"" },
            { rule: "Pre-show inspection", detail: "All rigging points, hardware, and suspended loads must be inspected before every show. Check for deformation, wear, cracks, and proper pin alignment. Wire rope slings with broken wires, kinks, or bird-caging must be taken out of service." },
            { rule: "Exclusion zones", detail: "When hoists are in motion (raising/lowering truss), no personnel may be in the area directly below the load. Barricade or rope off the area and post a spotter." },
            { rule: "Secondary attachment (safety)", detail: "All overhead equipment (fixtures, speakers, projectors) must have an independent secondary attachment (safety cable) rated to hold the equipment if the primary attachment fails. Steel aircraft cable with a rated clip or shackle — not tie-line." },
          ].map((r, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-[10px] text-signal-orange font-bold w-4 flex-shrink-0 pt-1">&bull;</span>
              <div>
                <span className="text-xs font-semibold text-house-lights/80">{r.rule}</span>
                <p className="text-[11px] text-aluminum/50 mt-0.5 leading-relaxed">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PPE ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Personal Protective Equipment
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          OSHA requires employers to provide PPE at no cost (29 CFR 1910.132). As a freelancer, you&apos;re responsible for your own. The items below are required by regulation — not suggestions.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Item</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">When Required</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">Standard</th>
              </tr>
            </thead>
            <tbody>
              {PPE_ITEMS.map((p, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2.5 pr-3 text-house-lights/70 font-medium">{p.item}</td>
                  <td className="py-2.5 pr-3 text-aluminum/50">{p.when}</td>
                  <td className="py-2.5 font-mono text-[10px] text-aluminum/40">{p.standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Hearing Conservation ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Hearing Conservation
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          OSHA&apos;s permissible exposure limit (PEL) is 90 dBA over an 8-hour time-weighted average (TWA). The action level — where a hearing conservation program is required — is 85 dBA TWA. Most live sound environments exceed this.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Source</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">Typical Level</th>
              </tr>
            </thead>
            <tbody>
              {NOISE_LEVELS.map((n, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2 pr-3 text-aluminum/60">{n.source}</td>
                  <td className="py-2 font-mono text-house-lights/70">{n.dba}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
          <h3 className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3">Permissible Exposure Times (OSHA Table G-16)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { dba: "85", hours: "16 hr" },
              { dba: "90", hours: "8 hr" },
              { dba: "95", hours: "4 hr" },
              { dba: "100", hours: "2 hr" },
              { dba: "105", hours: "1 hr" },
              { dba: "110", hours: "30 min" },
              { dba: "115", hours: "15 min" },
              { dba: "120+", hours: "0 min" },
            ].map((e, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-sm font-bold text-house-lights">{e.dba} <span className="text-aluminum/40 text-[10px]">dBA</span></div>
                <div className="text-[10px] text-aluminum/50">{e.hours}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LOTO ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Lockout/Tagout (LOTO)
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          29 CFR 1910.147 requires that equipment be de-energized and locked out before servicing or maintenance. In events, this applies to:
        </p>
        <ul className="space-y-2 mb-4">
          {[
            "Power distribution panels and disconnects during troubleshooting",
            "Motor-driven chain hoists during rigging adjustments or repairs",
            "Revolving stages, turntables, and automated scenic elements",
            "HVAC or fire suppression systems that must be disabled during pyro",
            "Any equipment where unexpected energization could injure someone",
          ].map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-aluminum/60">
              <span className="text-signal-orange/60 flex-shrink-0">&bull;</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
          <h3 className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3">LOTO Procedure</h3>
          <div className="space-y-2">
            {[
              "Notify all affected personnel",
              "Shut down equipment using normal operating controls",
              "Isolate energy sources (disconnect, valve, etc.)",
              "Apply lock and tag to isolation device — each worker applies their own lock",
              "Verify zero energy state (try to start, test with meter)",
              "Perform the work",
              "Remove locks in reverse order — only the person who applied a lock removes it",
            ].map((step, i) => (
              <div key={i} className="flex gap-2 text-xs text-aluminum/60">
                <span className="font-mono text-[10px] text-signal-orange font-bold w-4 flex-shrink-0">{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HazCom ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Hazard Communication (GHS)
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          29 CFR 1910.1200 requires Safety Data Sheets (SDS) be available for every hazardous chemical on site. In event production, common hazardous materials include haze fluid, fog fluid, CO2, cleaning solvents, spray adhesives, and pyrotechnic compounds.
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">GHS Symbol</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">Common Event Materials</th>
              </tr>
            </thead>
            <tbody>
              {GHS_SYMBOLS.map((g, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2 pr-3 text-house-lights/70 font-medium">{g.name}</td>
                  <td className="py-2 text-aluminum/50">{g.applies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-signal-orange/5 border border-signal-orange/15 rounded-xl p-5">
          <h3 className="font-heading text-xs font-bold text-signal-orange tracking-wider uppercase mb-2">
            Haze Fluid
          </h3>
          <p className="text-xs text-aluminum/60 leading-relaxed">
            Glycol and glycerin-based haze fluids are the most common chemical exposure in event production. While generally low-toxicity, prolonged exposure can cause respiratory irritation, especially in poorly ventilated spaces. The SDS should be on site. Venue HVAC should be running during hazing. Workers with asthma or respiratory conditions should be informed before hazing begins.
          </p>
        </div>
      </section>

      {/* ─── Reporting ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Reporting & Recordkeeping
        </h2>
        <div className="space-y-3">
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-house-lights/80 mb-1">Fatality: Report within 8 hours</h3>
            <p className="text-[11px] text-aluminum/50">Call OSHA at 1-800-321-OSHA (6742) or report online at osha.gov. Applies to any work-related death.</p>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-house-lights/80 mb-1">Hospitalization, amputation, or eye loss: Report within 24 hours</h3>
            <p className="text-[11px] text-aluminum/50">Any in-patient hospitalization (not just an ER visit), any amputation, or any loss of an eye.</p>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-house-lights/80 mb-1">OSHA 300 Log</h3>
            <p className="text-[11px] text-aluminum/50">Employers with 10+ employees must maintain an OSHA 300 log of recordable injuries. Production companies running large-scale events should be maintaining this. As a freelancer, document injuries in writing regardless.</p>
          </div>
        </div>
      </section>

      {/* ─── State Plans ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          State OSHA Plans
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          22 states run their own OSHA-approved plans with standards that are at least as strict as federal OSHA. Some are stricter. If you work in California (Cal/OSHA), Washington (L&I), Oregon, Michigan, or other state-plan states, check the state-specific requirements — they may have lower trigger heights, additional training mandates, or different citation penalties.
        </p>
        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
          <h3 className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-2">States with their own plans (partial list)</h3>
          <p className="text-xs text-aluminum/50">
            AZ, CA, HI, IN, IA, KY, MD, MI, MN, NV, NM, NC, OR, SC, TN, UT, VA, VT, WA, WY
          </p>
        </div>
      </section>

      {/* ─── Penalties ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Penalties
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { type: "Serious violation", fine: "Up to $16,131", desc: "Hazard that could cause death or serious injury" },
            { type: "Other-than-serious", fine: "Up to $16,131", desc: "Violation that has direct relationship to safety" },
            { type: "Willful violation", fine: "Up to $161,323", desc: "Intentional disregard or plain indifference" },
            { type: "Repeat violation", fine: "Up to $161,323", desc: "Same or similar violation within 5 years" },
          ].map((p, i) => (
            <div key={i} className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-house-lights/80">{p.type}</h3>
              <div className="font-mono text-lg font-bold text-signal-orange mt-1">{p.fine}</div>
              <p className="text-[10px] text-aluminum/40 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-aluminum/40 mt-3">
          Penalty amounts adjusted annually for inflation. Current maximums as of January 2026.
        </p>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-ink/[0.04] pt-6">
        <p className="text-[10px] text-aluminum/30 leading-relaxed">
          This reference is for educational purposes only. It is not legal advice and does not replace OSHA training, site-specific safety plans, or consultation with a qualified safety professional. Regulations vary by state. Always verify current standards at osha.gov. Truss is not responsible for compliance decisions made based on this content.
        </p>
      </div>
    </main>
  );
}
