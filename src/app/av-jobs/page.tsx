import Link from "next/link";
import type { Metadata } from "next";
import { SEO_ROLES, SEO_CITIES } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "AV Technician Jobs | Truss",
  description:
    "Find freelance AV technician gigs in 15 major US cities. Audio, video, lighting, staging, IT, and production roles — set your own rate on Truss.",
  openGraph: {
    title: "AV Technician Jobs | Truss",
    description: "Find freelance AV gigs by role and city. Set your own rate. Keep 100%.",
    url: "https://trusswork.org/av-jobs",
  },
};

const DEPT_ORDER = ["Audio", "Video", "Lighting", "Staging & Rigging", "IT & Networking", "Production & Management"];

export default function AvJobsIndexPage() {
  const grouped = DEPT_ORDER.map((dept) => ({
    department: dept,
    roles: SEO_ROLES.filter((r) => r.department === dept),
  }));

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <p className="text-[11px] font-mono font-semibold tracking-[3px] uppercase text-signal-orange mb-3">
          Truss Marketplace
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          AV Technician Jobs
        </h1>
        <p className="text-aluminum text-base leading-relaxed max-w-2xl">
          Find freelance AV gigs in major US markets. Set your own rate, keep 100%,
          and get booked directly by producers — no agency, no non-compete.
        </p>
      </header>

      {/* Roles by department */}
      {grouped.map(({ department, roles }) => (
        <section key={department} className="mb-10">
          <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-signal-orange mb-4 border-b border-ink/[0.08] pb-2">
            {department}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map((role) => (
              <Link
                key={role.slug}
                href={`/av-jobs/${role.slug}`}
                className="group bg-deep-stage border border-ink/[0.1] p-4 hover:border-signal-orange/30 transition-colors"
              >
                <div className="font-mono text-xs text-signal-orange mb-1">{role.shortName}</div>
                <div className="font-heading text-sm font-bold tracking-tight group-hover:text-signal-orange transition-colors">
                  {role.title}
                </div>
                <p className="text-[11px] text-aluminum/60 mt-1 line-clamp-2 leading-relaxed">
                  {role.description.split(".")[0]}.
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Top cities */}
      <section className="mb-10">
        <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-4 border-b border-ink/[0.08] pb-2">
          Top Markets
        </h2>
        <div className="flex flex-wrap gap-2">
          {SEO_CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/av-jobs/a1-audio-engineer/${city.slug}`}
              className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
            >
              {city.metroLabel}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 border-t border-ink/[0.08]">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-3">
          Ready to get booked?
        </h2>
        <p className="text-sm text-aluminum mb-6">
          Create your free profile. Set your rate. Get found by producers.
        </p>
        <Link
          href="/signup?type=tech"
          className="inline-block px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
        >
          Create Your Free Profile
        </Link>
      </section>
    </main>
  );
}
