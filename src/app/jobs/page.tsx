"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { CITIES } from "@/lib/cities";

const CITY_SLUGS = CITIES.map((city) => ({
  slug: city.split(",")[0].toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
  name: city.split(",")[0],
}));

const ROLE_OPTIONS = DEPARTMENTS.flatMap((dept) =>
  dept.roles.map((role) => ({
    value: role.shortName,
    label: `${role.shortName} — ${role.name.replace(` (${role.shortName})`, "")}`,
    dept: dept.name,
  }))
);

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [displayLimit, setDisplayLimit] = useState(20);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const res = await fetch("/api/jobs?status=posted");
    const data = await res.json();
    setJobs(data.jobs || []);
    setLoading(false);
  };

  const getRoleLabel = (roleId: string) =>
    ROLE_OPTIONS.find((r) => r.value === roleId)?.label || roleId;

  const filtered = jobs
    .filter((j) => {
      if (roleFilter && j.role_id !== roleFilter) return false;
      if (typeFilter && j.employment_type !== typeFilter) return false;
      if (cityFilter && !j.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          j.title?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.city?.toLowerCase().includes(q) ||
          j.role_id?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "pay_high") return (b.pay_max || 0) - (a.pay_max || 0);
      return 0;
    });

  const payLabel = (j: any) => {
    if (!j.pay_min && !j.pay_max) return null;
    const unit = j.pay_type === "hourly" ? "hr" : j.pay_type === "salary" ? "yr" : "day";
    if (j.pay_min && j.pay_max) return `$${j.pay_min.toLocaleString()}–$${j.pay_max.toLocaleString()}/${unit}`;
    if (j.pay_max) return `Up to $${j.pay_max.toLocaleString()}/${unit}`;
    return `From $${j.pay_min.toLocaleString()}/${unit}`;
  };

  const typeLabel = (t: string) =>
    t === "full-time" ? "Full-Time" : t === "part-time" ? "Part-Time" : "Contract";

  const inputClass = "px-4 py-2.5 bg-deep-stage/40 border border-ink/[0.04] rounded-lg text-sm text-house-lights outline-none focus:border-signal-orange/20 transition-colors";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative py-16 border-b border-ink/[0.03]">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-signal-orange/[0.02] to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">Find Work</span>
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-4">
            AV <span className="text-signal-orange">JOBS</span>
          </h1>
          <p className="text-aluminum/60 max-w-xl mx-auto">
            Browse open positions and gigs from producers hiring on Truss. Apply with one click — your profile is your resume.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="col-span-2 md:col-span-1">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..." className={inputClass + " w-full"} />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className={inputClass + " appearance-none w-full"}>
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
            placeholder="City..." className={inputClass + " w-full"} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className={inputClass + " appearance-none w-full"}>
            <option value="">All Types</option>
            <option value="contract">Contract</option>
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className={inputClass + " appearance-none w-full"}>
            <option value="newest">Newest First</option>
            <option value="pay_high">Highest Pay</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-xs font-mono text-aluminum/40 mb-4">
          {loading ? "Loading..." : `${filtered.length} job${filtered.length !== 1 ? "s" : ""} found`}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
            <div className="font-heading text-lg text-aluminum/60 mb-2">No jobs found</div>
            <p className="text-xs text-aluminum/40 mb-6">
              {jobs.length === 0 ? "No jobs posted yet. Check back soon." : "Try adjusting your filters."}
            </p>
            <Link href="/signup?type=producer"
              className="text-xs text-signal-orange font-mono hover:underline">
              Are you a producer? Post a job →
            </Link>
          </div>
        ) : (
          <>
          <div className="space-y-3">
            {filtered.slice(0, displayLimit).map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}
                className="block bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 hover:border-signal-orange/15 transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-heading text-base font-bold group-hover:text-signal-orange transition-colors mb-1">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-aluminum/60">
                      <span>{getRoleLabel(job.role_id)}</span>
                      <span>·</span>
                      <span>{job.city}</span>
                      <span>·</span>
                      <span>{typeLabel(job.employment_type)}</span>
                      {job.profiles && (
                        <>
                          <span>·</span>
                          <span>{job.profiles.company_name || job.profiles.display_name}</span>
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
                      {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                {job.description && (
                  <p className="text-xs text-aluminum/50 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                )}
              </Link>
            ))}
          </div>
          {filtered.length > displayLimit && (
            <div className="text-center mt-6">
              <button
                onClick={() => setDisplayLimit(prev => prev + 20)}
                className="px-6 py-2.5 bg-deep-stage border border-ink/[0.06] rounded-lg text-sm font-mono text-aluminum hover:border-signal-orange/20 hover:text-signal-orange transition-all"
              >
                Load More ({filtered.length - displayLimit} remaining)
              </button>
            </div>
          )}
          </>
        )}

        {/* Browse by city */}
        <section className="mt-12 pt-8 border-t border-ink/[0.03]">
          <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">
            Browse Jobs by City
          </h2>
          <div className="flex flex-wrap gap-2">
            {CITY_SLUGS.map((c) => (
              <Link key={c.slug} href={`/jobs/city/${c.slug}`}
                className="px-3 py-1.5 bg-deep-stage/40 border border-ink/[0.04] rounded-lg text-xs font-mono text-aluminum/60 hover:text-signal-orange hover:border-signal-orange/20 transition-all">
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by role */}
        <section className="mt-8 pt-8 border-t border-ink/[0.03]">
          <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">
            Browse Jobs by Role
          </h2>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.flatMap((d) => d.roles).map((role) => (
              <Link key={role.shortName} href={`/jobs/role/${role.shortName.toLowerCase()}`}
                className="px-3 py-1.5 bg-deep-stage/40 border border-ink/[0.04] rounded-lg text-xs font-mono text-aluminum/60 hover:text-signal-orange hover:border-signal-orange/20 transition-all">
                {role.shortName}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center border-t border-ink/[0.03] pt-8">
          <p className="text-sm text-aluminum/50 mb-4">Looking for crew instead?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse"
              className="px-6 py-3 bg-transparent border-2 border-white/10 text-house-lights font-heading font-bold text-sm tracking-[2px] uppercase rounded-lg hover:border-signal-orange/30 transition-all">
              Browse Technicians
            </Link>
            <Link href="/signup?type=producer"
              className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all">
              Post a Job
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
