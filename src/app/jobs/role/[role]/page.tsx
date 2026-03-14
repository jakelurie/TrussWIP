import Link from "next/link";
import type { Metadata } from "next";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { CITIES } from "@/lib/cities";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Build role lookup
const ALL_ROLES = DEPARTMENTS.flatMap((d) =>
  d.roles.map((r) => ({
    shortName: r.shortName.toLowerCase(),
    original: r.shortName,
    name: r.name.replace(` (${r.shortName})`, ""),
    fullName: r.name,
    description: r.description,
    deptName: d.name,
  }))
);
const ROLE_MAP = new Map(ALL_ROLES.map((r) => [r.shortName, r]));

// City slug map for cross-links
const CITY_SLUGS = CITIES.map((city) => ({
  slug: city
    .split(",")[0]
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, ""),
  name: city.split(",")[0],
  full: city,
}));

export async function generateStaticParams() {
  return ALL_ROLES.map((r) => ({ role: r.shortName }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  const r = ROLE_MAP.get(role.toLowerCase());
  const roleName = r ? `${r.original} ${r.name}` : role.toUpperCase();
  const title = `${roleName} Jobs | Truss`;
  const description = `Browse open ${roleName} jobs and freelance gigs on Truss. ${r?.description || ""} Apply with one click — your profile is your resume.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://trusswork.org/jobs/role/${role.toLowerCase()}`,
    },
  };
}

export default async function RoleJobsPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const r = ROLE_MAP.get(role.toLowerCase());
  const roleName = r ? `${r.original} ${r.name}` : role.toUpperCase();
  const roleId = r?.original || role.toUpperCase();

  const { data: jobs } = await supabaseAdmin
    .from("jobs")
    .select(
      "*, profiles!jobs_producer_id_fkey(display_name, company_name)"
    )
    .eq("status", "posted")
    .eq("role_id", roleId)
    .order("created_at", { ascending: false })
    .limit(50);

  const payLabel = (j: any) => {
    if (!j.pay_min && !j.pay_max) return null;
    const unit =
      j.pay_type === "hourly" ? "hr" : j.pay_type === "salary" ? "yr" : "day";
    if (j.pay_min && j.pay_max)
      return `$${j.pay_min.toLocaleString()}–$${j.pay_max.toLocaleString()}/${unit}`;
    if (j.pay_max) return `Up to $${j.pay_max.toLocaleString()}/${unit}`;
    return `From $${j.pay_min.toLocaleString()}/${unit}`;
  };

  const typeLabel = (t: string) =>
    t === "full-time" ? "Full-Time" : t === "part-time" ? "Part-Time" : "Contract";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative py-16 border-b border-ink/[0.03]">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-signal-orange/[0.02] to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <Link
            href="/jobs"
            className="font-mono text-[10px] text-aluminum/50 hover:text-signal-orange transition-colors tracking-[3px] uppercase"
          >
            &larr; All Jobs
          </Link>
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mt-3 mb-4">
            <span className="text-signal-orange">{roleName}</span> Jobs
          </h1>
          <p className="text-aluminum/60 max-w-xl mx-auto">
            {(jobs || []).length} open {roleName} position
            {(jobs || []).length !== 1 ? "s" : ""} on Truss.
            {r?.description ? ` ${r.description}` : ""}
          </p>
          {r && (
            <div className="mt-3">
              <span className="text-[10px] font-mono text-aluminum/40 tracking-wider uppercase">
                Department: {r.deptName}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Job list */}
        {(jobs || []).length === 0 ? (
          <div className="text-center py-20 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
            <div className="font-heading text-lg text-aluminum/60 mb-2">
              No {roleName} jobs right now
            </div>
            <p className="text-xs text-aluminum/40 mb-6">
              New positions are posted every day. Check back soon or browse all
              jobs.
            </p>
            <Link
              href="/jobs"
              className="text-xs text-signal-orange font-mono hover:underline"
            >
              Browse all jobs &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(jobs || []).map((job: any) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 hover:border-signal-orange/15 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-heading text-base font-bold group-hover:text-signal-orange transition-colors mb-1">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-aluminum/60">
                      <span>{job.city}</span>
                      <span>&middot;</span>
                      <span>{typeLabel(job.employment_type)}</span>
                      {job.profiles && (
                        <>
                          <span>&middot;</span>
                          <span>
                            {job.profiles.company_name ||
                              job.profiles.display_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {payLabel(job) && (
                      <span className="px-2.5 py-1 bg-signal-orange/[0.06] border border-signal-orange/15 rounded text-xs font-mono text-signal-orange">
                        {payLabel(job)}
                      </span>
                    )}
                    <span className="text-[10px] text-aluminum/40 font-mono">
                      {new Date(job.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {job.description && (
                  <p className="text-xs text-aluminum/50 mt-2 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Browse by city links */}
        <section className="mt-12 pt-8 border-t border-ink/[0.03]">
          <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">
            {roleName} Jobs by City
          </h2>
          <div className="flex flex-wrap gap-2">
            {CITY_SLUGS.map((c) => (
              <Link
                key={c.slug}
                href={`/jobs?role=${roleId}&city=${encodeURIComponent(c.name)}`}
                className="px-3 py-1.5 bg-deep-stage/40 border border-ink/[0.04] rounded-lg text-xs font-mono text-aluminum/60 hover:text-signal-orange hover:border-signal-orange/20 transition-all"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Other role links */}
        <section className="mt-8 pt-8 border-t border-ink/[0.03]">
          <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">
            Other AV Roles
          </h2>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.filter(
              (ro) => ro.shortName !== role.toLowerCase()
            ).map((ro) => (
              <Link
                key={ro.shortName}
                href={`/jobs/role/${ro.shortName}`}
                className="px-3 py-1.5 bg-deep-stage/40 border border-ink/[0.04] rounded-lg text-xs font-mono text-aluminum/60 hover:text-signal-orange hover:border-signal-orange/20 transition-all"
              >
                {ro.original}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center py-12 border-t border-ink/[0.03]">
          <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Looking for <span className="text-signal-orange">{roleName}</span>{" "}
            Work?
          </h2>
          <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
            Create your free Truss profile and apply to {roleName} jobs with one
            click. Your skills, experience, and rates — all in one place.
          </p>
          <Link
            href="/signup?type=tech"
            className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Create Your Profile — Free
          </Link>
        </section>
      </div>
    </main>
  );
}
