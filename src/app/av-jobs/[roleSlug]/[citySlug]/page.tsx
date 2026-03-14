import Link from "next/link";
import type { Metadata } from "next";
import {
  SEO_ROLES,
  SEO_CITIES,
  getRoleBySlug,
  getCityBySlug,
  getCityRate,
  toHourly,
} from "@/lib/seo-data";

// ─── Static generation ───────────────────────────────────────

export async function generateStaticParams() {
  const params = [];
  for (const role of SEO_ROLES) {
    for (const city of SEO_CITIES) {
      params.push({ roleSlug: role.slug, citySlug: city.slug });
    }
  }
  return params;
}

// ─── Metadata ────────────────────────────────────────────────

type Props = { params: Promise<{ roleSlug: string; citySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roleSlug, citySlug } = await params;
  const role = getRoleBySlug(roleSlug);
  const city = getCityBySlug(citySlug);
  if (!role || !city) return { title: "Not Found | Truss" };

  return {
    title: `${role.jobTitle} in ${city.name} | Truss`,
    description: `Find ${role.title} gigs in ${city.metroLabel}. Set your own rate, keep 100%, get booked directly. No agency, no non-compete.`,
    openGraph: {
      title: `${role.jobTitle} in ${city.name}`,
      description: `${role.title} opportunities in ${city.metroLabel}. Set your rate. Keep 100%. Get booked directly by producers on Truss.`,
      url: `https://trusswork.org/av-jobs/${role.slug}/${city.slug}`,
    },
  };
}

// ─── Tool suggestions by department ──────────────────────────

const DEPT_TOOLS: Record<string, { label: string; href: string }[]> = {
  Audio: [
    { label: "RF Coordination Tool", href: "/tools/rf-coordination" },
    { label: "Signal Flow Reference", href: "/tools/signal-flow" },
    { label: "Day Rate Calculator", href: "/tools/day-rate-calculator" },
  ],
  Video: [
    { label: "Signal Flow Reference", href: "/tools/signal-flow" },
    { label: "Cable Bible", href: "/tools/cable-bible" },
    { label: "Day Rate Calculator", href: "/tools/day-rate-calculator" },
  ],
  Lighting: [
    { label: "Power Calculator", href: "/tools/power-calculator" },
    { label: "Day Rate Calculator", href: "/tools/day-rate-calculator" },
    { label: "Cable Bible", href: "/tools/cable-bible" },
  ],
  "Staging & Rigging": [
    { label: "Power Calculator", href: "/tools/power-calculator" },
    { label: "Show Calculator", href: "/tools/show-calculator" },
    { label: "Day Rate Calculator", href: "/tools/day-rate-calculator" },
  ],
  "IT & Networking": [
    { label: "Signal Flow Reference", href: "/tools/signal-flow" },
    { label: "Cable Bible", href: "/tools/cable-bible" },
    { label: "Day Rate Calculator", href: "/tools/day-rate-calculator" },
  ],
  "Production & Management": [
    { label: "Show Calculator", href: "/tools/show-calculator" },
    { label: "Day Rate Calculator", href: "/tools/day-rate-calculator" },
    { label: "Contract Templates", href: "/tools/contract-templates" },
  ],
};

// ─── Page ────────────────────────────────────────────────────

export default async function AvJobsPage({ params }: Props) {
  const { roleSlug, citySlug } = await params;
  const role = getRoleBySlug(roleSlug);
  const city = getCityBySlug(citySlug);

  if (!role || !city) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold mb-4">Page Not Found</h1>
        <Link href="/av-jobs" className="text-signal-orange hover:underline">Browse all roles</Link>
      </main>
    );
  }

  const [lo, hi] = getCityRate(role.shortName, city.rateMultiplier);
  const mid = Math.round(((lo + hi) / 2) / 25) * 25;

  const relatedRoles = role.relatedRoles
    .map((s) => getRoleBySlug(s))
    .filter(Boolean) as typeof SEO_ROLES;
  const otherCities = SEO_CITIES.filter((c) => c.slug !== city.slug);
  const tools = DEPT_TOOLS[role.department] || DEPT_TOOLS["Production & Management"];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] font-mono text-aluminum/60 mb-8">
        <Link href="/av-jobs" className="hover:text-signal-orange transition-colors">AV Jobs</Link>
        <span>/</span>
        <Link href={`/av-jobs/${role.slug}`} className="hover:text-signal-orange transition-colors">{role.title}</Link>
        <span>/</span>
        <span className="text-house-lights/70">{city.name}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <p className="text-[11px] font-mono font-semibold tracking-[3px] uppercase text-signal-orange mb-3">
          {role.department}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          {role.jobTitle} in {city.name}
        </h1>
        <p className="text-aluminum text-base leading-relaxed max-w-2xl">
          Set your own rate, build your reputation, and get booked directly by producers.
          No agency takes a cut.
        </p>
        <div className="mt-6">
          <Link
            href="/signup?type=tech"
            className="inline-block px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
          >
            Create Your Free Profile
          </Link>
        </div>
      </header>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Role overview */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          About the {role.title} Role
        </h2>
        <p className="text-house-lights/85 leading-relaxed mb-6">
          {role.description}
        </p>

        <h3 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
          What You&apos;ll Do
        </h3>
        <ul className="space-y-2 mb-6">
          {role.responsibilities.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-house-lights/80 leading-relaxed">
              <span className="text-signal-orange mt-1 flex-shrink-0">&#8226;</span>
              {r}
            </li>
          ))}
        </ul>

        <h3 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
          Gear You Should Know
        </h3>
        <p className="text-sm text-house-lights/70">
          {role.commonGear.join(", ")}
        </p>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Rates */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          What {role.title}s Charge in {city.name}
        </h2>
        <div className="bg-deep-stage border border-ink/[0.1] p-6">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            {[
              { label: "Starting", value: lo },
              { label: "Average", value: mid },
              { label: "Experienced", value: hi },
            ].map((tier) => (
              <div key={tier.label}>
                <div className="text-[11px] font-mono tracking-wider uppercase text-aluminum/60 mb-1">
                  {tier.label}
                </div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-house-lights">
                  ${tier.value.toLocaleString()}
                </div>
                <div className="text-[10px] text-aluminum/40 mt-0.5">per 10-hr day</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-aluminum/50 leading-relaxed">
            Based on Truss marketplace data for {city.metroLabel}. Your rate depends on
            experience, specializations, and gear ownership.
          </p>
          <Link
            href="/rates"
            className="inline-block mt-3 text-[11px] font-mono text-signal-orange hover:underline"
          >
            See full rate guide &rarr;
          </Link>
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Why Truss */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          Why {role.title}s Use Truss
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { heading: "Set Your Own Rate", body: "You decide what you charge. No agency setting rates for you. Your rate, your terms." },
            { heading: "Keep 100%", body: "No commission, no platform fees on your earnings. What producers pay is what you keep." },
            { heading: "Build Your Reputation", body: "Verified reviews, skill endorsements, and a portfolio that follows you — not stuck inside an agency's database." },
            { heading: "Get Booked Directly", body: "Producers find you by role, city, and availability. No middleman. No non-compete." },
          ].map((card) => (
            <div key={card.heading} className="bg-deep-stage border border-ink/[0.1] p-5">
              <h3 className="font-heading text-sm font-bold tracking-wider uppercase mb-2">
                {card.heading}
              </h3>
              <p className="text-xs text-aluminum leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/signup?type=tech"
            className="inline-block px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
          >
            Create Your Free Profile
          </Link>
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Free tools */}
      <section className="mb-10">
        <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
          Free Tools for {role.title}s
        </h2>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
            >
              {t.label}
            </Link>
          ))}
          <Link
            href="/learn"
            className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
          >
            Career Guide
          </Link>
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Related roles */}
      {relatedRoles.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
            Other Roles in {city.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedRoles.map((r) => (
              <Link
                key={r.slug}
                href={`/av-jobs/${r.slug}/${city.slug}`}
                className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Same role, other cities */}
      <section className="mb-10">
        <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
          {role.jobTitle} in Other Cities
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCities.map((c) => (
            <Link
              key={c.slug}
              href={`/av-jobs/${role.slug}/${c.slug}`}
              className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom links */}
      <footer className="pt-8 border-t border-ink/[0.08] flex flex-wrap gap-4 text-[11px] font-mono text-aluminum/50">
        <Link href="/rates" className="hover:text-signal-orange transition-colors">Rate Guide</Link>
        <Link href="/browse" className="hover:text-signal-orange transition-colors">Browse Techs</Link>
        <Link href="/learn" className="hover:text-signal-orange transition-colors">Career Guide</Link>
        <Link href="/av-jobs" className="hover:text-signal-orange transition-colors">All Roles</Link>
      </footer>
    </main>
  );
}
