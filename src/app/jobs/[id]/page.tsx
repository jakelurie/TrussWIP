"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS } from "@/lib/taxonomy";

const ROLE_OPTIONS = DEPARTMENTS.flatMap((dept) =>
  dept.roles.map((role) => ({
    value: role.shortName,
    label: `${role.shortName} — ${role.name.replace(` (${role.shortName})`, "")}`,
  }))
);

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  applied: { label: "Applied", color: "var(--color-cue-blue)" },
  reviewed: { label: "Reviewed", color: "var(--color-standby-amber)" },
  shortlisted: { label: "Shortlisted", color: "var(--color-signal-orange)" },
  hired: { label: "Hired", color: "var(--color-go-green)" },
  rejected: { label: "Rejected", color: "var(--color-aluminum)" },
};

export default function JobDetail() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [myApplication, setMyApplication] = useState<any>(null);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    // Fetch job
    const res = await fetch(`/api/jobs?status=posted`);
    const data = await res.json();
    const found = (data.jobs || []).find((j: any) => j.id === jobId);

    // Also try fetching by producer_id in case it's their own non-posted job
    if (!found) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res2 = await fetch(`/api/jobs?producer_id=${session.user.id}`);
        const data2 = await res2.json();
        const ownJob = (data2.jobs || []).find((j: any) => j.id === jobId);
        if (ownJob) {
          setJob(ownJob);
          setLoading(false);
          checkAuth(ownJob);
          return;
        }
      }
    }

    setJob(found || null);
    setLoading(false);
    if (found) checkAuth(found);
  };

  const checkAuth = async (jobData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setCurrentUser(session.user);
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single();
    setUserType(profile?.user_type || null);

    // If producer and owns the job, load applications
    if (profile?.user_type === "producer" && jobData.producer_id === session.user.id) {
      loadApplications(session.access_token);
    }

    // If tech, check if already applied
    if (profile?.user_type === "tech") {
      const appRes = await fetch(`/api/job-applications?view=mine`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const appData = await appRes.json();
      const existing = (appData.applications || []).find((a: any) => a.job_id === jobData.id);
      if (existing) {
        setMyApplication(existing);
        setApplied(true);
      }
    }
  };

  const loadApplications = async (token: string) => {
    setAppsLoading(true);
    const res = await fetch(`/api/job-applications?job_id=${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setApplications(data.applications || []);
    setAppsLoading(false);
  };

  const handleApply = async () => {
    setApplying(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/job-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: "apply", jobId, message: message || null }),
    });
    const data = await res.json();
    if (data.application) {
      setApplied(true);
      setMyApplication(data.application);
      setShowApplyForm(false);
    }
    setApplying(false);
  };

  const updateAppStatus = async (applicationId: string, status: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/job-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: "update_status", applicationId, status }),
    });
    const data = await res.json();
    if (data.application) {
      setApplications(applications.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    }
  };

  const getRoleLabel = (roleId: string) =>
    ROLE_OPTIONS.find((r) => r.value === roleId)?.label || roleId;

  const typeLabel = (t: string) =>
    t === "full-time" ? "Full-Time" : t === "part-time" ? "Part-Time" : "Contract / Freelance";

  const payLabel = (j: any) => {
    if (!j.pay_min && !j.pay_max) return null;
    const unit = j.pay_type === "hourly" ? "hr" : j.pay_type === "salary" ? "yr" : "day";
    if (j.pay_min && j.pay_max) return `$${Number(j.pay_min).toLocaleString()}–$${Number(j.pay_max).toLocaleString()}/${unit}`;
    if (j.pay_max) return `Up to $${Number(j.pay_max).toLocaleString()}/${unit}`;
    return `From $${Number(j.pay_min).toLocaleString()}/${unit}`;
  };

  const isOwner = currentUser && job?.producer_id === currentUser.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-heading text-lg font-semibold mb-1">Job not found</div>
          <Link href="/jobs" className="text-sm text-signal-orange hover:underline">Back to Jobs →</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-aluminum/50 hover:text-signal-orange font-mono mb-6 transition-colors">
        ← Back to Jobs
      </Link>

      {/* Job header */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-signal-orange/[0.06] border border-signal-orange/15 rounded text-[10px] font-mono text-signal-orange">
            {getRoleLabel(job.role_id)}
          </span>
          <span className="px-2 py-0.5 bg-ink/[0.03] border border-ink/[0.06] rounded text-[10px] font-mono text-aluminum/60">
            {typeLabel(job.employment_type)}
          </span>
          {payLabel(job) && (
            <span className="px-2 py-0.5 bg-go-green/[0.06] border border-go-green/15 rounded text-[10px] font-mono text-go-green">
              {payLabel(job)}
            </span>
          )}
        </div>

        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">{job.title}</h1>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-aluminum/60">
          <span>{job.city}</span>
          {job.profiles && (
            <span>Posted by {job.profiles.company_name || job.profiles.display_name}</span>
          )}
          <span>Posted {new Date(job.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {job.description && (
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-6">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-3">Description</h2>
              <div className="text-sm text-aluminum/70 leading-relaxed whitespace-pre-wrap">{job.description}</div>
            </div>
          )}

          {job.requirements && (
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-6">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-3">Requirements</h2>
              <div className="text-sm text-aluminum/70 leading-relaxed whitespace-pre-wrap">{job.requirements}</div>
            </div>
          )}

          {/* Applicants (producer view) */}
          {isOwner && (
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-6">
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">
                Applicants {applications.length > 0 && <span className="text-aluminum/50">({applications.length})</span>}
              </h2>

              {appsLoading ? (
                <div className="text-center py-6">
                  <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-sm text-aluminum/50">No applications yet</div>
                  <div className="text-xs text-aluminum/35 mt-1">Share this job to get applicants</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const tech = app.profiles || {};
                    const techProfile = app.tech_profiles || {};
                    const st = STATUS_LABELS[app.status] || STATUS_LABELS.applied;

                    return (
                      <div key={app.id} className="bg-blackout/40 border border-ink/[0.03] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Link href={`/profile/${tech.id}`} className="flex items-center gap-3 group">
                            {tech.avatar_url ? (
                              <img src={tech.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-signal-orange/15 flex items-center justify-center text-xs font-heading font-bold text-signal-orange">
                                {(tech.display_name || "?")[0]}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-semibold group-hover:text-signal-orange transition-colors">
                                {tech.display_name || "Unknown"}
                              </div>
                              <div className="text-[10px] text-aluminum/50">
                                {tech.city}
                                {techProfile.avg_rating > 0 && (
                                  <span> · <span className="text-signal-orange">★</span> {techProfile.avg_rating?.toFixed(1)} ({techProfile.review_count})</span>
                                )}
                                {techProfile.reputation_tier && techProfile.reputation_tier !== "New" && (
                                  <span> · {techProfile.reputation_tier}</span>
                                )}
                              </div>
                            </div>
                          </Link>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                            style={{ color: st.color, background: `${st.color}10`, border: `1px solid ${st.color}25` }}>
                            {st.label}
                          </span>
                        </div>

                        {/* Skills and gear */}
                        {techProfile.skills && techProfile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {techProfile.skills.map((s: string) => (
                              <span key={s} className="px-1.5 py-0.5 bg-ink/[0.03] text-[9px] text-aluminum/60 rounded">{s}</span>
                            ))}
                          </div>
                        )}

                        {techProfile.rate && (
                          <div className="text-[10px] font-mono text-signal-orange/60 mb-2">
                            ${techProfile.rate}/hr
                          </div>
                        )}

                        {app.message && (
                          <div className="text-xs text-aluminum/50 bg-deep-stage/40 rounded p-2 mb-2 italic">
                            &ldquo;{app.message}&rdquo;
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] text-aluminum/35 font-mono">
                            Applied {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex gap-1">
                            {app.status !== "shortlisted" && app.status !== "hired" && (
                              <button onClick={() => updateAppStatus(app.id, "shortlisted")}
                                className="px-2 py-1 text-[9px] font-mono text-signal-orange/70 hover:text-signal-orange border border-signal-orange/15 hover:border-signal-orange/30 rounded transition-all">
                                Shortlist
                              </button>
                            )}
                            {app.status !== "hired" && (
                              <button onClick={() => updateAppStatus(app.id, "hired")}
                                className="px-2 py-1 text-[9px] font-mono text-go-green/70 hover:text-go-green border border-go-green/15 hover:border-go-green/30 rounded transition-all">
                                Hire
                              </button>
                            )}
                            {app.status !== "rejected" && (
                              <button onClick={() => updateAppStatus(app.id, "rejected")}
                                className="px-2 py-1 text-[9px] font-mono text-aluminum/40 hover:text-aluminum border border-ink/[0.04] hover:border-white/10 rounded transition-all">
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply card (tech view) */}
          {!isOwner && (
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-6">
              {applied ? (
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-go-green/10 flex items-center justify-center">
                    <span className="text-go-green text-lg">✓</span>
                  </div>
                  <div className="font-heading text-sm font-semibold mb-1">Application Sent</div>
                  <div className="text-xs text-aluminum/50">
                    Status: <span style={{ color: STATUS_LABELS[myApplication?.status]?.color }}>
                      {STATUS_LABELS[myApplication?.status]?.label || "Applied"}
                    </span>
                  </div>
                </div>
              ) : showApplyForm ? (
                <>
                  <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-3">Apply</h3>
                  <p className="text-xs text-aluminum/50 mb-3">Your Truss profile will be shared with the producer. Add an optional message below.</p>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Why you're a good fit for this gig..."
                    rows={3}
                    className="w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors resize-vertical mb-3" />
                  <button onClick={handleApply} disabled={applying}
                    className="w-full py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all disabled:opacity-50">
                    {applying ? "Submitting..." : "Submit Application"}
                  </button>
                  <button onClick={() => setShowApplyForm(false)}
                    className="w-full mt-2 py-2 text-xs text-aluminum/50 hover:text-aluminum transition-colors">
                    Cancel
                  </button>
                </>
              ) : currentUser ? (
                <button onClick={() => setShowApplyForm(true)}
                  className="w-full py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all">
                  Apply Now
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-aluminum/50 mb-3">Sign up to apply with your Truss profile</p>
                  <Link href={`/signup?type=tech`}
                    className="block w-full py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all text-center">
                    Sign Up to Apply
                  </Link>
                  <Link href="/login" className="block mt-2 text-xs text-signal-orange/60 hover:text-signal-orange transition-colors">
                    Already have an account? Log in
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Job details sidebar */}
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-6">
            <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-0.5">Role</div>
                <div className="text-sm text-house-lights">{getRoleLabel(job.role_id)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-0.5">Location</div>
                <div className="text-sm text-house-lights">{job.city}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-0.5">Type</div>
                <div className="text-sm text-house-lights">{typeLabel(job.employment_type)}</div>
              </div>
              {payLabel(job) && (
                <div>
                  <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-0.5">Pay</div>
                  <div className="text-sm text-signal-orange font-semibold">{payLabel(job)}</div>
                </div>
              )}
              <div>
                <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-0.5">Posted</div>
                <div className="text-sm text-house-lights">
                  {new Date(job.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
