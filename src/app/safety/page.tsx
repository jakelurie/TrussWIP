import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety Compliance for AV Technicians | Truss",
  description:
    "OSHA regulations and fire code compliance for live event and AV technicians. Fall protection, electrical safety, rigging, occupancy limits, pyrotechnics, and more.",
  keywords: [
    "AV technician safety",
    "OSHA live events",
    "fire marshal events",
    "stagehand safety regulations",
    "event safety compliance",
    "rigging safety OSHA",
    "live event fire code",
  ],
  openGraph: {
    title: "Safety Compliance for AV Technicians | Truss",
    description:
      "OSHA regulations and fire code compliance guides for live event and AV technicians.",
    type: "website",
    url: "https://trusswork.org/safety",
  },
};

const GUIDES = [
  {
    href: "/safety/osha",
    title: "OSHA for Live Events",
    description:
      "Fall protection, electrical safety, rigging, PPE, hearing conservation, lockout/tagout, and hazard communication. The federal regulations that apply to every load-in.",
    sections: [
      "Fall Protection (29 CFR 1926.501)",
      "Electrical Safety (NFPA 70E)",
      "Rigging & Overhead Loads",
      "PPE Requirements",
      "Hearing Conservation",
      "Lockout/Tagout (LOTO)",
      "Hazard Communication (GHS)",
      "Reporting & Recordkeeping",
    ],
  },
  {
    href: "/safety/fire-code",
    title: "Fire Code for Events",
    description:
      "Occupancy limits, exit clearance, pyrotechnic permits, flame-retardant materials, fire watch requirements, and what the Authority Having Jurisdiction actually enforces.",
    sections: [
      "Occupancy & Egress (IFC Chapter 10)",
      "Exit & Aisle Clearance",
      "Pyrotechnics & Open Flame Permits",
      "Flame-Retardant Materials & Drape",
      "Fire Watch Requirements",
      "Portable Fire Extinguishers",
      "AHJ Inspections",
      "Venue-Specific Codes",
    ],
  },
];

export default function SafetyIndexPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-2">
        <Link
          href="/resources"
          className="text-[11px] font-mono text-aluminum/40 hover:text-signal-orange transition-colors tracking-wider uppercase"
        >
          &larr; Resources
        </Link>
      </div>
      <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
        SAFETY <span className="text-signal-orange">COMPLIANCE</span>
      </h1>
      <p className="text-sm text-aluminum/60 mb-1">
        Federal and local regulations every AV technician should know
      </p>
      <p className="text-xs text-aluminum/40 mb-10">
        Last updated February 2026
      </p>

      <div className="space-y-6">
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="block bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-6 hover:border-signal-orange/20 transition-all group"
          >
            <h2 className="font-heading text-xl font-bold tracking-wider uppercase mb-2 group-hover:text-signal-orange transition-colors">
              {guide.title}
            </h2>
            <p className="text-sm text-aluminum/60 leading-relaxed mb-4">
              {guide.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {guide.sections.map((s) => (
                <span
                  key={s}
                  className="text-[10px] font-mono text-aluminum/40 px-2 py-1 bg-blackout/30 rounded border border-ink/[0.03]"
                >
                  {s}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-12 border-t border-ink/[0.04] pt-6">
        <p className="text-[10px] text-aluminum/30 leading-relaxed">
          This information is for educational purposes only and does not
          constitute legal advice. Regulations vary by state and municipality.
          Always verify current requirements with OSHA, your local fire
          marshal, and the Authority Having Jurisdiction (AHJ) for your
          venue. Truss is not responsible for compliance decisions made based
          on this content.
        </p>
      </div>
    </main>
  );
}
