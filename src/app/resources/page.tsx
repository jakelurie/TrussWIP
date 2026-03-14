import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources | Truss",
  description:
    "Guides, tools, and industry resources for freelance AV technicians and event producers. Rate guides, career paths, calculators, and more.",
  keywords: [
    "AV technician resources",
    "freelance AV guides",
    "AV technician rate guide",
    "AV career guide",
    "freelance day rate calculator",
    "live event industry resources",
    "AV technician tools",
  ],
  openGraph: {
    title: "Resources | Truss",
    description:
      "Guides, tools, and industry resources for freelance AV technicians and event producers.",
    type: "website",
    url: "https://trusswork.org/resources",
  },
};

const GUIDES = [
  {
    href: "/safety",
    title: "Safety Compliance",
    tag: "Reference",
    description:
      "OSHA regulations and fire code compliance for AV technicians. Fall protection, electrical safety, rigging, occupancy limits, pyrotechnics, flame-retardant materials, and more.",
  },
  {
    href: "/rates",
    title: "Rate Guide 2026",
    tag: "Guide",
    description:
      "Day rates for 24 roles across 10 major US markets. The definitive rate reference for freelance AV technicians and the producers who hire them.",
  },
  {
    href: "/learn",
    title: "How to Become an AV Technician",
    tag: "Guide",
    description:
      "Roles, skills, certifications, and how to land your first gig. The complete career guide for breaking into live event production.",
  },
  {
    href: "/tax-guide",
    title: "Freelance AV Tax Guide 2026",
    tag: "Guide",
    description:
      "1099 vs W-2, self-employment tax, deductions, quarterly payments, S-Corp election, and the new No Tax on Overtime provision.",
  },
  {
    href: "/market",
    title: "AV Market Intelligence",
    tag: "Data",
    description:
      "Live rate benchmarks by role, top markets, experience distribution, hiring demand, and specialization trends from the Truss marketplace.",
  },
];

const TOOLS = [
  {
    href: "/tools/day-rate-calculator",
    title: "Day Rate Calculator",
    tag: "Tool",
    description:
      "Calculate the day rate you need to charge based on your target income. Factors in self-employment tax, insurance, gear costs, and slow months.",
  },
  {
    href: "/tools/rf-coordination",
    title: "RF Frequency Coordination Guide",
    tag: "Tool",
    description:
      "Wireless microphone frequency blocks, FCC 600MHz restrictions by city, intermodulation basics, and channel stacking rules of thumb.",
  },
  {
    href: "/tools/power-calculator",
    title: "Power Calculator",
    tag: "Tool",
    description:
      "Build a gear list and calculate total power draw. See circuit counts, load percentages, and 80% derating warnings for 120V/20A circuits.",
  },
  {
    href: "/tools/signal-flow",
    title: "Signal Flow Simulator",
    tag: "Tool",
    description:
      "Build AV signal chains visually. Drag gear blocks onto a canvas, connect outputs to inputs, and validate your signal flow for audio, video, and lighting.",
  },
  {
    href: "/tools/contract-templates",
    title: "Contract Templates",
    tag: "Tool",
    description:
      "Free service agreements, invoices, rate confirmations, and more. Ready-to-use templates built for freelance AV work.",
  },
  {
    href: "/tools/cable-bible",
    title: "Cable Bible",
    tag: "Tool",
    description:
      "Complete reference guide to audio, video, data, and power connectors used in live events. Pinouts, specs, and compatibility notes for 28 connector types.",
  },
  {
    href: "/tools/show-calculator",
    title: "Show Calculator",
    tag: "Tool",
    description:
      "Input event details — type, audience, screens, cameras — and get crew and gear recommendations. Covers corporate, concert, broadcast, festival, and more.",
  },
  {
    href: "/crew-planner",
    title: "AI Crew Planner",
    tag: "AI Tool",
    description:
      "Describe your event in plain English and get an AI-generated crew plan with roles, headcounts, gear, and production timeline. Each role links to matching techs on Truss.",
  },
];

const COMMUNITY = [
  {
    href: "/venues",
    title: "VenueSpec",
    tag: "Community",
    description:
      "Crowdsourced technical specs for event venues — power, rigging, loading dock, internet, audio, video, lighting, and staging notes from techs who've worked there.",
  },
];

const UPDATES = [
  {
    href: "/news",
    title: "Truss News",
    tag: "Updates",
    description:
      "Platform updates, new features, and upcoming industry events. Stay current with what's happening on Truss and in the AV world.",
  },
];

const TAG_STYLES: Record<string, string> = {
  Reference: "bg-red-500/15 text-red-400",
  Guide: "bg-cue-blue/15 text-cue-blue",
  Tool: "bg-signal-orange/15 text-signal-orange",
  Community: "bg-purple-500/15 text-purple-400",
  Updates: "bg-emerald-500/15 text-emerald-400",
};

export default function ResourcesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">
          Learn &middot; Calculate &middot; Stay Current
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
          <span className="text-signal-orange">RESOURCES</span>
        </h1>
        <p className="text-sm text-aluminum/65 mt-3 max-w-xl mx-auto">
          Everything you need to navigate the AV industry — rate data, career
          guides, calculators, and platform updates.
        </p>
      </div>

      {/* ===== GUIDES ===== */}
      <section className="mb-12">
        <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
          Guides
        </h2>
        <div className="space-y-3">
          {GUIDES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05] hover:border-signal-orange/15 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${TAG_STYLES[item.tag]}`}
                  >
                    {item.tag.toUpperCase()}
                  </span>
                  <h3 className="font-heading text-sm font-bold tracking-wide">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[12px] text-aluminum/60 leading-[1.7]">
                  {item.description}
                </p>
              </div>
              <span className="text-aluminum/35 group-hover:text-signal-orange transition-colors mt-1 text-lg">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== TOOLS ===== */}
      <section className="mb-12">
        <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
          Tools
        </h2>
        <div className="space-y-3">
          {TOOLS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05] hover:border-signal-orange/15 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${TAG_STYLES[item.tag]}`}
                  >
                    {item.tag.toUpperCase()}
                  </span>
                  <h3 className="font-heading text-sm font-bold tracking-wide">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[12px] text-aluminum/60 leading-[1.7]">
                  {item.description}
                </p>
              </div>
              <span className="text-aluminum/35 group-hover:text-signal-orange transition-colors mt-1 text-lg">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== COMMUNITY ===== */}
      <section className="mb-12">
        <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
          Community
        </h2>
        <div className="space-y-3">
          {COMMUNITY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05] hover:border-signal-orange/15 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${TAG_STYLES[item.tag]}`}
                  >
                    {item.tag.toUpperCase()}
                  </span>
                  <h3 className="font-heading text-sm font-bold tracking-wide">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[12px] text-aluminum/60 leading-[1.7]">
                  {item.description}
                </p>
              </div>
              <span className="text-aluminum/35 group-hover:text-signal-orange transition-colors mt-1 text-lg">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== UPDATES ===== */}
      <section className="mb-12">
        <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
          Updates
        </h2>
        <div className="space-y-3">
          {UPDATES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-4 p-5 rounded-xl bg-deep-stage/40 border border-ink/[0.05] hover:border-signal-orange/15 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${TAG_STYLES[item.tag]}`}
                  >
                    {item.tag.toUpperCase()}
                  </span>
                  <h3 className="font-heading text-sm font-bold tracking-wide">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[12px] text-aluminum/60 leading-[1.7]">
                  {item.description}
                </p>
              </div>
              <span className="text-aluminum/35 group-hover:text-signal-orange transition-colors mt-1 text-lg">
                &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="text-center py-12 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Ready to <span className="text-signal-orange">Get Started</span>?
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          Create your free profile on Truss. Set your rate, list your skills,
          and get discovered by producers.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
        >
          Create Your Profile — Free
        </Link>
      </section>
    </main>
  );
}