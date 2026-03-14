import Link from "next/link";
import type { Metadata } from "next";
import { SEO_ROLES, SEO_CITIES, getRoleBySlug, getCityRate } from "@/lib/seo-data";

export async function generateStaticParams() {
  return SEO_ROLES.map((r) => ({ roleSlug: r.slug }));
}

type Props = { params: Promise<{ roleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roleSlug } = await params;
  const role = getRoleBySlug(roleSlug);
  if (!role) return { title: "Not Found | Truss" };

  return {
    title: `${role.jobTitle} | Truss`,
    description: `Find ${role.title} gigs in 15 major US cities. Set your own rate, keep 100%, get booked directly on Truss.`,
    openGraph: {
      title: role.jobTitle,
      description: `${role.title} opportunities across major AV markets. Set your rate. Get booked directly.`,
      url: `https://trusswork.org/av-jobs/${role.slug}`,
    },
  };
}

export default async function AvJobsRolePage({ params }: Props) {
  const { roleSlug } = await params;
  const role = getRoleBySlug(roleSlug);

  if (!role) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold mb-4">Role Not Found</h1>
        <Link href="/av-jobs" className="text-signal-orange hover:underline">Browse all roles</Link>
      </main>
    );
  }

  const relatedRoles = role.relatedRoles
    .map((s) => getRoleBySlug(s))
    .filter(Boolean) as typeof SEO_ROLES;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] font-mono text-aluminum/60 mb-8">
        <Link href="/av-jobs" className="hover:text-signal-orange transition-colors">AV Jobs</Link>
        <span>/</span>
        <span className="text-house-lights/70">{role.title}</span>
      </nav>

      <header className="mb-10">
        <p className="text-[11px] font-mono font-semibold tracking-[3px] uppercase text-signal-orange mb-3">
          {role.department}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
          {role.jobTitle}
        </h1>
        <p className="text-house-lights/85 leading-relaxed max-w-2xl mb-6">
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
        <p className="text-sm text-house-lights/70 mb-6">
          {role.commonGear.join(", ")}
        </p>
      </header>

      <hr className="border-ink/[0.08] mb-10" />

      {/* City grid */}
      <section className="mb-10">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-4">
          {role.jobTitle} by City
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SEO_CITIES.map((city) => {
            const [lo, hi] = getCityRate(role.shortName, city.rateMultiplier);
            return (
              <Link
                key={city.slug}
                href={`/av-jobs/${role.slug}/${city.slug}`}
                className="group bg-deep-stage border border-ink/[0.1] p-4 hover:border-signal-orange/30 transition-colors"
              >
                <div className="font-heading text-sm font-bold tracking-tight group-hover:text-signal-orange transition-colors">
                  {city.metroLabel}
                </div>
                <div className="font-mono text-xs text-aluminum/60 mt-1">
                  ${lo.toLocaleString()} &ndash; ${hi.toLocaleString()} / day
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <hr className="border-ink/[0.08] mb-10" />

      {/* Related roles */}
      {relatedRoles.length > 0 && (
        <section className="mb-10">
          <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase text-aluminum mb-3">
            Related Roles
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedRoles.map((r) => (
              <Link
                key={r.slug}
                href={`/av-jobs/${r.slug}`}
                className="px-3 py-1.5 border border-ink/[0.1] text-sm text-house-lights/70 hover:text-signal-orange hover:border-signal-orange/30 transition-colors"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="text-center py-12 border-t border-ink/[0.08]">
        <h2 className="font-heading text-xl font-bold tracking-tight mb-3">
          Ready to get booked as a{/^[aeiou]/i.test(role.title) ? "n" : ""} {role.title}?
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
