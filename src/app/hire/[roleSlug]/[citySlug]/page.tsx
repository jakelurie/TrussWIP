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
import { createClient } from "@supabase/supabase-js";

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

  const [lo] = getCityRate(role.shortName, city.rateMultiplier);

  return {
    title: `${role.hiringTitle} in ${city.name} | Truss`,
    description: `Find and book verified ${role.title}s in ${city.metroLabel}. See rates, reviews, and availability. Book directly on Truss — no agency markup.`,
    openGraph: {
      title: `${role.hiringTitle} in ${city.name}`,
      description: `Browse verified ${role.title}s in ${city.metroLabel}. Transparent rates starting at $${toHourly(lo)}/hr.`,
      url: `https://trusswork.org/hire/${role.slug}/${city.slug}`,
    },
  };
}

// ─── Live tech count ─────────────────────────────────────────

async function getTechCount(shortName: string, cityName: string, state: string): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 0;

  try {
    const supabase = createClient(url, key);
    const cityLabel = `${cityName}, ${state}`;

    const { count } = await supabase
      .from("tech_profiles")
      .select("id", { count: "exact", head: true })
      .eq("primary_skill", shortName)
      .eq("profiles.city", cityLabel);

    return count ?? 0;
  } catch {
    return 0;
  }
}

// ─── Page ────────────────────────────────────────────────────

export default async function HirePage({ params }: Props) {
  const { roleSlug, citySlug } = await params;
  const role = getRoleBySlug(roleSlug);
  const city = getCityBySlug(citySlug);

  if (!role || !city) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold mb-4">Page Not Found</h1>
        <Link href="/hire" className="text-signal-orange hover:underline">Browse all roles</Link>
      </main>
    );
  }

  const [lo, hi] = getCityRate(role.shortName, city.rateMultiplier);
  const mid = Math.round(((lo + hi) / 2) / 25) * 25;
  const techCount = await getTechCount(role.shortName, city.name, city.state);

  const relatedRoles = role.relatedRoles
    .map((s) => getRoleBySlug(s))
    .filter(Boolean) as typeof SEO_ROLES;
  const otherCities = SEO_CITIES.filter((c) => c.slug !== city.slug);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] font-mono text-aluminum/60 mb-8">
        <Link href="/hire" className="hover:text-signal-orange transition-colors">Hire</Link>
        <span>/</span>
        <Link href={`/hire/${role.slug}`} className="hover:text-signal-orange transition-colors">{role.title}</Link>
        <span>/</span>
        <span className="text-house-lights/70">{city.name}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <p className="text-[11px] font-mono font-semibold tracking-[3px] uppercase text-signal-orange mb-3">
          {role.department}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          {role.hiringTitle} in {city.name}
        </h1>
        <p className="text-aluminum text-base leading-relaxed max-w-2xl">
          Browse verified {role.title}s with transparent rates, reviews, and real availability.
          Book directly — no agency, no markup.
        </p>
        <div className="mt-6">
          <Link
            href={`/browse?skill=${role.shortName}&city=${city.slug}`}
            className="inline-block px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
          >
            Browse {role.title}s in {city.name}
          </Link>
        </div>
      </header>

      <hr className="border-ink/[0.08] mb-10" />

      {/* What does this role do? */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          What does a{/^[aeiou]/i.test(role.title) ? "n" : ""} {role.title} do?
        </h2>
        <p className="text-house-lights/85 leading-relaxed mb-6">
          {role.description}
        </p>

        <h3 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
          Responsibilities
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
          Common Gear
        </h3>
        <p className="text-sm text-house-lights/70">
          {role.commonGear.join(", ")}
        </p>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Rates */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          {role.title} Rates in {city.name}
        </h2>
        <div className="bg-deep-stage border border-ink/[0.1] p-6">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            {[
              { label: "Low", value: lo },
              { label: "Mid", value: mid },
              { label: "High", value: hi },
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
            Based on Truss marketplace data for {city.metroLabel}. Rates vary by experience,
            specialization, and event type.
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

      {/* Available techs */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          Available {role.title}s in {city.name}
        </h2>
        {techCount > 0 ? (
          <div className="bg-deep-stage border border-ink/[0.1] p-6 text-center">
            <div className="font-mono text-3xl font-bold text-signal-orange mb-2">{techCount}</div>
            <p className="text-sm text-aluminum/60 mb-4">
              verified {role.title}{techCount !== 1 ? "s" : ""} in {city.metroLabel}
            </p>
            <Link
              href={`/browse?skill=${role.shortName}&city=${city.slug}`}
              className="inline-block px-5 py-2 bg-signal-orange text-white font-heading font-bold text-[11px] tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
            >
              View Profiles
            </Link>
          </div>
        ) : (
          <div className="bg-deep-stage border border-ink/[0.1] p-6 text-center">
            <p className="text-sm text-aluminum/60 mb-4">
              New {role.title}s are joining in {city.name}. Create a free account to get notified when they do.
            </p>
            <Link
              href="/signup?type=producer"
              className="inline-block px-5 py-2 bg-signal-orange text-white font-heading font-bold text-[11px] tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
            >
              Create a Free Producer Account
            </Link>
          </div>
        )}
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* How Truss works */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          How Truss Works for Producers
        </h2>
        <ol className="space-y-3">
          {[
            "Search by role, city, availability, and rate",
            "Review profiles — skills, gear, reviews, portfolio",
            "Send a booking request with your project details",
            "Tech accepts. Payment secured. Done.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-house-lights/80 leading-relaxed">
              <span className="font-mono font-bold text-signal-orange flex-shrink-0 w-5 text-right">
                {i + 1}.
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Link
            href="/signup?type=producer"
            className="inline-block px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors"
          >
            Create a Free Producer Account
          </Link>
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Related roles */}
      {relatedRoles.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
            Also Hiring in {city.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedRoles.map((r) => (
              <Link
                key={r.slug}
                href={`/hire/${r.slug}/${city.slug}`}
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
          {role.hiringTitle} in Other Cities
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCities.map((c) => (
            <Link
              key={c.slug}
              href={`/hire/${role.slug}/${c.slug}`}
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
        <Link href="/hire" className="hover:text-signal-orange transition-colors">All Roles</Link>
      </footer>
    </main>
  );
}
