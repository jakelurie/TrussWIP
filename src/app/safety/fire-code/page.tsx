import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fire Code Compliance for Live Events | Truss",
  description:
    "Fire code and fire marshal compliance for live events and AV technicians. Occupancy limits, egress, pyrotechnics, flame-retardant materials, fire watch, and AHJ inspections.",
  keywords: [
    "fire code live events",
    "fire marshal events",
    "occupancy limits events",
    "pyrotechnics permit",
    "flame retardant drape",
    "fire watch requirements",
    "IFC event compliance",
    "NFPA 101 life safety",
    "AHJ inspection events",
    "event egress requirements",
    "fire safety AV technician",
    "event fire code compliance",
  ],
  openGraph: {
    title: "Fire Code Compliance for Live Events | Truss",
    description:
      "Occupancy limits, egress, pyrotechnics, flame-retardant materials, and AHJ inspections. The fire codes that apply to every event.",
    type: "article",
    url: "https://trusswork.org/safety/fire-code",
  },
};

// ─── Data ───────────────────────────────────────────────

const OCCUPANCY_TYPES = [
  { type: "Assembly (standing, no fixed seats)", factor: "5 sq ft / person", code: "IFC Table 1004.5" },
  { type: "Assembly (chairs, no fixed seats)", factor: "7 sq ft / person", code: "IFC Table 1004.5" },
  { type: "Assembly (fixed seats)", factor: "Count the seats", code: "IFC 1004.6" },
  { type: "Exhibition hall / trade show", factor: "30 sq ft / person", code: "IFC Table 1004.5" },
  { type: "Stage area", factor: "15 sq ft / person", code: "IFC Table 1004.5" },
  { type: "Ballroom / banquet (tables + chairs)", factor: "15 sq ft / person", code: "IFC Table 1004.5" },
];

const EXTINGUISHER_TYPES = [
  { class: "A", fires: "Ordinary combustibles (wood, cloth, paper, drape)", agent: "Water, foam, dry chemical" },
  { class: "B", fires: "Flammable liquids (fuel, solvents, haze fluid)", agent: "CO2, dry chemical, foam" },
  { class: "C", fires: "Energized electrical equipment", agent: "CO2, dry chemical (never water)" },
  { class: "D", fires: "Combustible metals (rare in events)", agent: "Specialized dry powder" },
  { class: "K", fires: "Cooking oils/grease (catering kitchens)", agent: "Wet chemical" },
];

const FLAME_TEST_STANDARDS = [
  { material: "Fabric / drape / curtains", standard: "NFPA 701", test: "Vertical burn test — must self-extinguish" },
  { material: "Carpet and rugs", standard: "ASTM D2859 (DOC FF-1-70)", test: "Pill test / methenamine tablet" },
  { material: "Foam / decorative materials", standard: "NFPA 701 or UL 94", test: "Must not sustain flame or drip fire" },
  { material: "Christmas trees / natural greenery", standard: "NFPA 1 § 11.5", test: "Must be flame-retardant treated or fresh-cut" },
  { material: "Hay, straw, moss", standard: "Generally prohibited", test: "Banned in most assembly occupancies" },
];

const PYRO_CATEGORIES = [
  { category: "Proximate pyrotechnics", distance: "Within 15 m (50 ft) of audience", permit: "State pyro license + AHJ permit + fire watch", examples: "Gerbs, comets, flash pots, concussions, flame projectors" },
  { category: "Display fireworks (1.3G)", distance: "Outdoor, fallout zone required", permit: "ATF license + state license + AHJ permit", examples: "Aerial shells, cakes, large-scale outdoor displays" },
  { category: "Flame effects", distance: "Varies by AHJ", permit: "Flame permit from fire marshal", examples: "Propane flame bars, fire bowls, torch effects, fire performers" },
  { category: "Theatrical flash/smoke", distance: "On stage", permit: "AHJ approval, may not require separate permit", examples: "Flash paper, smoke cartridges, small flash pots (varies by jurisdiction)" },
];

export default function FireCodePage() {
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
        FIRE CODE FOR <span className="text-signal-orange">EVENTS</span>
      </h1>
      <p className="text-sm text-aluminum/60 mb-1">
        Fire marshal requirements and life safety codes for live event production
      </p>
      <p className="text-xs text-aluminum/40 mb-10">
        Last updated February 2026
      </p>

      {/* Intro */}
      <section className="mb-12">
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Event fire safety is governed by a combination of the International Fire Code (IFC), NFPA 1 (Fire Code), NFPA 101 (Life Safety Code), and local amendments adopted by the Authority Having Jurisdiction (AHJ). The AHJ is typically the local fire marshal or fire prevention bureau. Their word is final — if the AHJ says no, it doesn&apos;t matter what the national code says.
        </p>
        <div className="bg-deep-stage/40 border border-signal-orange/10 rounded-xl p-5">
          <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
            Authority Having Jurisdiction (AHJ)
          </h3>
          <p className="text-xs text-aluminum/60 leading-relaxed">
            The AHJ is the entity responsible for enforcing fire codes at your venue. This is usually the local fire marshal, but it can also be a fire prevention bureau, building department, or state fire marshal&apos;s office. They have the authority to grant variances, require additional safety measures, shut down events, and issue fines. <strong className="text-house-lights/80">Always contact the AHJ early</strong> — don&apos;t wait until load-in day to find out your floor plan doesn&apos;t comply.
          </p>
        </div>
      </section>

      {/* ─── Occupancy & Egress ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Occupancy & Egress
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Maximum occupancy is calculated by floor area and use type. The venue&apos;s posted occupancy limit is the legal maximum — exceeding it is a misdemeanor in most jurisdictions and can result in immediate shutdown.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Use Type</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Load Factor</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">Code Reference</th>
              </tr>
            </thead>
            <tbody>
              {OCCUPANCY_TYPES.map((o, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2.5 pr-3 text-house-lights/70 font-medium">{o.type}</td>
                  <td className="py-2.5 pr-3 font-mono text-aluminum/60">{o.factor}</td>
                  <td className="py-2.5 font-mono text-[10px] text-aluminum/40">{o.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5 mb-4">
          <h3 className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3">Occupancy Calculation Example</h3>
          <div className="space-y-2 text-xs text-aluminum/60">
            <p>A 10,000 sq ft ballroom configured for a standing reception:</p>
            <p className="font-mono text-house-lights/70">10,000 sq ft / 5 sq ft per person = <strong className="text-signal-orange">2,000 persons max</strong></p>
            <p>Same room with tables and chairs for a banquet:</p>
            <p className="font-mono text-house-lights/70">10,000 sq ft / 15 sq ft per person = <strong className="text-signal-orange">666 persons max</strong></p>
            <p className="text-[11px] text-aluminum/40 mt-2">Stage area, AV footprint, and FOH positions reduce usable floor area. Calculate from the actual available space, not the total room.</p>
          </div>
        </div>

        <div className="bg-signal-orange/5 border border-signal-orange/15 rounded-xl p-5">
          <h3 className="font-heading text-xs font-bold text-signal-orange tracking-wider uppercase mb-2">
            Common Violation
          </h3>
          <p className="text-xs text-aluminum/60 leading-relaxed">
            Reducing egress capacity with production equipment. A 6-foot-wide exit corridor that gets narrowed to 3 feet by cable ramps, road cases, or AV equipment loses half its egress capacity. The fire marshal calculates egress based on the narrowest point.
          </p>
        </div>
      </section>

      {/* ─── Exit & Aisle Clearance ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Exit & Aisle Clearance
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Exits and aisles must remain clear and accessible at all times during the event — including load-in, show, and load-out. These are not guidelines. They are enforceable code.
        </p>

        <div className="space-y-3 mb-6">
          {[
            { rule: "Exit doors", detail: "Must swing in the direction of egress (outward). Must not be locked, bolted, or obstructed from the egress side. Panic hardware required on doors serving 50+ occupants. Exit doors cannot be concealed by drape, scenic, or signage." },
            { rule: "Exit signage", detail: "Illuminated EXIT signs required above every exit and along the path of egress. Must be visible from 100 feet. If your drape or scenic blocks an exit sign, you need to add a supplemental sign or relocate the obstruction." },
            { rule: "Aisle width (assembly seating)", detail: "Main aisles: 48 inches minimum. Cross aisles: 36 inches minimum. Dead-end aisles: maximum 20 feet in length (IFC 1029.9.4). Aisles must be kept clear of cables, equipment, and personal items." },
            { rule: "Corridor width", detail: "Exit corridors serving 50+ occupants: 44 inches minimum. Corridors serving fewer than 50: 36 inches minimum. Cables crossing corridors must use ADA-compliant ramps that maintain minimum width." },
            { rule: "Door hardware", detail: "Exit doors in assembly occupancies must have panic hardware (push bars) if serving 50+ occupants. Electromagnetic locks must release on fire alarm activation, power failure, and manual push bar operation." },
            { rule: "Emergency lighting", detail: "Required in all assembly occupancies. Must activate automatically on power failure. Must illuminate the path of egress to at least 1 foot-candle at floor level for a minimum of 90 minutes." },
          ].map((r, i) => (
            <div key={i} className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-house-lights/80 mb-1">{r.rule}</h3>
              <p className="text-[11px] text-aluminum/50 leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pyrotechnics ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Pyrotechnics & Open Flame
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          Any use of pyrotechnics, open flame, or flame effects in an assembly occupancy requires written approval from the AHJ. NFPA 1126 (Use of Pyrotechnics Before a Proximate Audience) and NFPA 160 (Standard for the Use of Flame Effects Before an Audience) are the governing standards.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Category</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Distance</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Permit Requirements</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">Examples</th>
              </tr>
            </thead>
            <tbody>
              {PYRO_CATEGORIES.map((p, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2.5 pr-3 text-house-lights/70 font-medium">{p.category}</td>
                  <td className="py-2.5 pr-3 text-aluminum/60">{p.distance}</td>
                  <td className="py-2.5 pr-3 text-aluminum/50">{p.permit}</td>
                  <td className="py-2.5 text-aluminum/50">{p.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 mb-4">
          {[
            { rule: "Permit timeline", detail: "Most AHJs require pyrotechnic permit applications 2-4 weeks before the event. Some major cities require 30+ days. Late applications are routinely denied. File early." },
            { rule: "Licensed operator", detail: "Proximate pyrotechnics must be operated by a licensed pyrotechnician. The license is state-issued. The operator must be present during setup, rehearsal, show, and teardown of all pyrotechnic devices." },
            { rule: "Fire watch", detail: "Any event using pyrotechnics or open flame requires a dedicated fire watch — a person (usually a uniformed firefighter hired through the fire department) stationed with extinguishing equipment. This is a paid position, not a volunteer from your crew." },
            { rule: "Sprinkler system", detail: "If the venue has a sprinkler system, it must remain active during pyro use unless the AHJ grants a written variance. Pyrotechnic devices must be positioned to avoid triggering sprinkler heads (typically 135-165 deg F activation). Smoke from haze machines does not trigger sprinklers — heat does." },
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

        <div className="bg-signal-orange/5 border border-signal-orange/15 rounded-xl p-5">
          <h3 className="font-heading text-xs font-bold text-signal-orange tracking-wider uppercase mb-2">
            No-Permit Items That Still Need Approval
          </h3>
          <p className="text-xs text-aluminum/60 leading-relaxed">
            Candles (even battery-operated may need verification), cooking demonstrations with open flame, fog machines (some AHJs require notification to avoid false fire alarms), confetti cannons with CO2 charges. When in doubt, call the fire marshal. It&apos;s always better to ask than to get shut down.
          </p>
        </div>
      </section>

      {/* ─── Flame-Retardant Materials ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Flame-Retardant Materials
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          All fabric, drape, scenic materials, and decorations in assembly occupancies must be flame-retardant. The fire marshal can — and will — pull a swatch and test it on site with a lighter. If it sustains flame, your event gets shut down until the material is removed.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Material</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Standard</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">Test</th>
              </tr>
            </thead>
            <tbody>
              {FLAME_TEST_STANDARDS.map((f, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2.5 pr-3 text-house-lights/70 font-medium">{f.material}</td>
                  <td className="py-2.5 pr-3 font-mono text-[10px] text-aluminum/60">{f.standard}</td>
                  <td className="py-2.5 text-aluminum/50">{f.test}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          {[
            { rule: "Certification documentation", detail: "Keep flame-retardant certificates on site for all soft goods. Rental drape should come with a certificate from the vendor. If the fire marshal asks and you can't produce documentation, the material comes down." },
            { rule: "Re-treatment", detail: "Flame-retardant treatments on fabric are not permanent. Most treatments last 1-2 years or until the fabric is washed. Rental companies should re-certify regularly. If in doubt, have the material re-treated and re-tested." },
            { rule: "Inherently flame-retardant vs. treated", detail: "IFR (inherently flame-retardant) fabrics like Banjo, Commando, or Premier have the flame resistance built into the fiber. They don't wash out and don't need re-treatment. Treated fabrics (cotton muslin, natural fiber drape) need regular re-application." },
            { rule: "Scenic and props", detail: "All scenic elements, set pieces, and props must be flame-retardant. This includes foam, cardboard, and paper elements. Styrofoam and untreated foam are generally prohibited in assembly occupancies — use fire-rated foam alternatives." },
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

      {/* ─── Fire Watch ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Fire Watch Requirements
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          A fire watch is a dedicated person assigned to monitor for fire hazards and respond if needed. Fire watch is not optional — it&apos;s code-required in specific situations.
        </p>

        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5 mb-4">
          <h3 className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3">When Fire Watch Is Required</h3>
          <div className="space-y-2">
            {[
              "Pyrotechnics or open flame effects — during and 30-60 minutes after last use",
              "Hot work (welding, cutting, grinding) — during and 30 minutes after",
              "When fire protection systems (sprinklers, alarms) are impaired or taken offline",
              "Occupancy exceeds 500 and the AHJ requires it (common in convention centers)",
              "Any time the AHJ deems it necessary based on the event risk profile",
            ].map((item, i) => (
              <div key={i} className="flex gap-2 text-xs text-aluminum/60">
                <span className="text-signal-orange/60 flex-shrink-0">&bull;</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
              Fire Watch Personnel
            </h3>
            <p className="text-xs text-aluminum/60 leading-relaxed">
              In most jurisdictions, fire watch must be a uniformed, on-duty or off-duty firefighter hired through the fire department. Some AHJs allow trained private fire watch personnel. They must be equipped with a radio, fire extinguisher, and a clear understanding of the venue&apos;s fire alarm and suppression systems.
            </p>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="font-heading text-sm font-bold text-signal-orange tracking-wider uppercase mb-2">
              Cost
            </h3>
            <p className="text-xs text-aluminum/60 leading-relaxed">
              Fire watch is billed at the department&apos;s off-duty rate, typically $50-$100/hour with a 4-hour minimum. Large events may require multiple fire watch personnel. This is a production cost — budget for it when planning pyro, flame effects, or events in venues where the AHJ typically requires it.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Portable Fire Extinguishers ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Portable Fire Extinguishers
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          IFC Chapter 9 and NFPA 10 govern fire extinguisher placement. Assembly occupancies must have extinguishers within 75 feet of travel distance from any point. Production equipment, power distribution, and pyro areas may require additional units.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Class</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2 pr-3">Fire Type</th>
                <th className="text-left font-mono text-[9px] text-aluminum/40 tracking-wider uppercase py-2">Agent</th>
              </tr>
            </thead>
            <tbody>
              {EXTINGUISHER_TYPES.map((e, i) => (
                <tr key={i} className="border-b border-ink/[0.03]">
                  <td className="py-2.5 pr-3 font-mono text-lg font-bold text-signal-orange">{e.class}</td>
                  <td className="py-2.5 pr-3 text-aluminum/60">{e.fires}</td>
                  <td className="py-2.5 text-aluminum/50">{e.agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          {[
            { rule: "ABC extinguishers", detail: "Most venues stock multi-purpose ABC dry chemical extinguishers. These work on Class A, B, and C fires. Know where they are before load-in starts." },
            { rule: "CO2 extinguishers near power", detail: "A CO2 extinguisher should be stationed near main power distribution. CO2 does not leave residue and is safe for electronics. Dry chemical will destroy gear." },
            { rule: "Inspection tags", detail: "All extinguishers must have a current annual inspection tag and monthly check initials. If the tag is expired or missing, report it to the venue. Do not rely on an uninspected extinguisher." },
            { rule: "Obstruction", detail: "Production equipment must not block access to venue fire extinguishers. If your road cases, cable runs, or scenic block an extinguisher, relocate the equipment or provide a supplemental extinguisher." },
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

      {/* ─── AHJ Inspections ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          AHJ Inspections
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          The fire marshal or AHJ representative will inspect before the event (and sometimes during). Knowing what they check helps you pass the first time and avoid costly delays.
        </p>

        <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5 mb-4">
          <h3 className="font-mono text-[10px] text-aluminum/50 tracking-wider uppercase mb-3">What the Fire Marshal Checks</h3>
          <div className="space-y-2">
            {[
              "Occupancy load calculation matches floor plan and seating configuration",
              "All exits unobstructed, properly marked, and illuminated",
              "Aisle widths meet minimum requirements (measures the narrowest point)",
              "Flame-retardant certificates for all drape, scenic, and decorations",
              "Pyrotechnic permits, operator licenses, and safety plans on file",
              "Fire extinguishers accessible and in-date",
              "Sprinkler and fire alarm systems operational and not impaired",
              "Emergency lighting functional",
              "No unapproved cooking, open flame, or smoking inside the venue",
              "Electrical panels accessible with 36-inch clearance (NEC 110.26)",
            ].map((item, i) => (
              <div key={i} className="flex gap-2 text-xs text-aluminum/60">
                <span className="font-mono text-[10px] text-signal-orange font-bold w-4 flex-shrink-0">{i + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-signal-orange/5 border border-signal-orange/15 rounded-xl p-5">
            <h3 className="font-heading text-xs font-bold text-signal-orange tracking-wider uppercase mb-2">
              Failed Inspection
            </h3>
            <p className="text-xs text-aluminum/60 leading-relaxed">
              If you fail, the marshal issues a correction notice. Minor issues (missing certificate, blocked extinguisher) can usually be fixed on the spot. Major issues (blocked exits, non-compliant drape, no pyro permit) can delay or cancel doors. The venue may also face fines.
            </p>
          </div>
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-5">
            <h3 className="font-heading text-xs font-bold text-signal-orange tracking-wider uppercase mb-2">
              Tip: Pre-Inspection Walkthrough
            </h3>
            <p className="text-xs text-aluminum/60 leading-relaxed">
              Many AHJs allow (and prefer) a pre-inspection walkthrough days before the event. This lets you identify issues while there&apos;s still time to fix them. Bring your floor plan, flame certificates, and permit copies. Five minutes with the marshal before load-in can save hours on show day.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Venue-Specific Codes ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Venue-Specific Codes
        </h2>
        <p className="text-sm text-aluminum/70 leading-relaxed mb-4">
          National codes are the baseline. Cities, counties, and individual venues layer additional requirements on top.
        </p>

        <div className="space-y-3 mb-6">
          {[
            { rule: "City amendments", detail: "Major event markets (Las Vegas, Los Angeles, New York, Chicago, Nashville) have local fire code amendments that can be more restrictive than IFC or NFPA. Las Vegas, for example, has specific regulations for the Strip corridor. New York City uses its own fire code (NYC Fire Code) rather than IFC." },
            { rule: "Convention center rules", detail: "Convention centers typically have their own event guidelines document that incorporates fire code requirements plus facility-specific rules. These cover everything from rigging point weights to approved caterers to forklift operation hours. Get this document early — it supersedes your assumptions." },
            { rule: "Historic venues", detail: "Historic buildings often have non-compliant original construction that is grandfathered in, plus additional restrictions on modifications. Fire escape routes may be narrower, sprinkler coverage may be incomplete, and the AHJ may impose lower occupancy limits as a result." },
            { rule: "Tent and temporary structures", detail: "Tents and membrane structures are governed by IFC Chapter 31. Permits required for tents over 400 sq ft (most event tents). Flame-retardant certification required for all tent fabric. Exit signage and emergency lighting required. Anchoring must be engineered — no staking into underground utilities." },
            { rule: "Outdoor events", detail: "Outdoor events may seem exempt from fire code, but they&apos;re not. Temporary structures, generators, fuel storage, cooking operations, and crowd density all trigger fire code provisions. Large outdoor events (festivals, concerts) typically require a fire safety plan submitted to the AHJ for approval." },
          ].map((r, i) => (
            <div key={i} className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-house-lights/80 mb-1">{r.rule}</h3>
              <p className="text-[11px] text-aluminum/50 leading-relaxed">{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Quick Reference ─── */}
      <section className="mb-12">
        <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-4">
          Quick Reference Numbers
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Min aisle width (seated)", value: "48\"" },
            { label: "Min corridor (50+ occ)", value: "44\"" },
            { label: "Exit sign visibility", value: "100 ft" },
            { label: "Emergency light duration", value: "90 min" },
            { label: "Extinguisher travel dist", value: "75 ft" },
            { label: "Panel clearance (NEC)", value: "36\"" },
            { label: "Proximate pyro distance", value: "50 ft" },
            { label: "Tent permit threshold", value: "400 sq ft" },
          ].map((q, i) => (
            <div key={i} className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-3 text-center">
              <div className="font-mono text-lg font-bold text-house-lights">{q.value}</div>
              <div className="text-[10px] text-aluminum/40 mt-1">{q.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-ink/[0.04] pt-6">
        <p className="text-[10px] text-aluminum/30 leading-relaxed">
          This reference is for educational purposes only. It is not legal advice and does not replace consultation with your local fire marshal, a licensed fire protection engineer, or venue-specific safety plans. Fire codes vary by state, county, and municipality. Local amendments may override national codes. Always verify current requirements with the Authority Having Jurisdiction (AHJ) for your venue. Truss is not responsible for compliance decisions made based on this content.
        </p>
      </div>
    </main>
  );
}
