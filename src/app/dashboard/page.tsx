"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Shared Constants ────────────────────────────────────────

const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];
const TIER_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "var(--color-standby-amber)", "var(--color-signal-orange)", "#9B59B6"];
const TIER_THRESHOLDS = [0, 1000, 3000, 6000, 10000];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "var(--color-standby-amber)", label: "PENDING" },
  accepted: { color: "var(--color-cue-blue)", label: "ACCEPTED" },
  confirmed: { color: "var(--color-go-green)", label: "CONFIRMED" },
  declined: { color: "#FF3D00", label: "DECLINED" },
  completed: { color: "#9B59B6", label: "COMPLETED" },
  cancelled: { color: "var(--color-aluminum)", label: "CANCELLED" },
  paid: { color: "var(--color-go-green)", label: "PAID" },
};

const formatDate = (d: string) => d ? new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

const getInitials = (name: string) => name ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "?";

const getHue = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

// ═════════════════════════════════════════════════════════════
// Root: Role-Based Router
// ═════════════════════════════════════════════════════════════

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) { router.push("/login"); return; }
      setSession(s);

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", s.user.id).single();
      if (!prof) { router.push("/login"); return; }
      if (!prof.display_name || (!prof.city && !(prof.cities?.length > 0))) { router.push("/onboarding"); return; }

      setProfile(prof);
      setUserType(prof.user_type);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
    </div>
  );

  if (userType === "producer") return <ProducerDashboard userId={session.user.id} profile={profile} />;
  return <TechDashboard userId={session.user.id} profile={profile} />;
}

// ─── Identity Verification Banner ──────────────────────────

function IdentityVerificationBanner({ profile }: { profile: any }) {
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(false);

  const justCompleted = searchParams.get("verification") === "complete";

  if (profile.identity_verified) {
    if (justCompleted) {
      return (
        <div className="bg-go-green/[0.06] border border-go-green/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="text-go-green text-lg">&#9635;</span>
          <div>
            <div className="text-sm font-semibold text-go-green">Identity Verified</div>
            <div className="text-[11px] text-aluminum/60">Your government ID has been verified through Stripe Identity.</div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Pending: session started but not yet verified
  if (profile.stripe_identity_session_id) {
    if (justCompleted) {
      return (
        <div className="bg-cue-blue/[0.06] border border-cue-blue/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="inline-block w-4 h-4 border-2 border-cue-blue/30 border-t-cue-blue rounded-full animate-spin flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-cue-blue">Verification Processing</div>
            <div className="text-[11px] text-aluminum/60">Your ID is being reviewed. This usually takes a few minutes.</div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-standby-amber/[0.04] border border-standby-amber/15 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Identity verification in progress</div>
          <div className="text-[11px] text-aluminum/60">Your ID submission is being reviewed.</div>
        </div>
        <button
          onClick={startVerification}
          disabled={verifying}
          className="w-full sm:w-auto text-center px-4 py-2 text-xs font-mono text-aluminum/65 border border-ink/[0.06] rounded-lg hover:border-signal-orange/20 transition-all flex-shrink-0"
        >
          {verifying ? "Loading..." : "Try Again"}
        </button>
      </div>
    );
  }

  async function startVerification() {
    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/verify-identity", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Verification error:", data.error);
        setVerifying(false);
      }
    } catch {
      setVerifying(false);
    }
  }

  return (
    <div className="bg-signal-orange/[0.04] border border-signal-orange/15 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold">Verify your identity</div>
        <div className="text-[11px] text-aluminum/60">
          Government ID + selfie match. Takes 2 minutes. Builds trust with {profile.user_type === "tech" ? "producers" : "technicians"}.
        </div>
      </div>
      <button
        onClick={startVerification}
        disabled={verifying}
        className="w-full sm:w-auto text-center px-4 py-2 bg-signal-orange/10 text-signal-orange text-xs font-heading font-bold tracking-wider uppercase rounded-lg hover:bg-signal-orange/20 transition-all flex-shrink-0"
      >
        {verifying ? "Loading..." : "Verify Now"}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PRODUCER DASHBOARD
// ═════════════════════════════════════════════════════════════

function ProducerDashboard({ userId, profile }: { userId: string; profile: any }) {
  const [tab, setTab] = useState<"overview" | "bookings">("overview");
  const [projects, setProjects] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({ bookingsThisMonth: 0, spendThisMonth: 0, favCount: 0 });
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProducerData(); }, []);

  const loadProducerData = async () => {
    // Active projects with roles
    const { data: projs } = await supabase
      .from("projects")
      .select("*, project_roles(*)")
      .eq("producer_id", userId)
      .in("status", ["active", "draft"])
      .order("start_date", { ascending: true });
    setProjects(projs || []);

    // All bookings (enriched with tech names)
    const { data: bks } = await supabase
      .from("bookings")
      .select("*, projects(name, city, venue, start_date, end_date), project_roles(skill, quantity)")
      .eq("producer_id", userId)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all((bks || []).map(async (b: any) => {
      const { data: tech } = await supabase.from("profiles").select("display_name, city").eq("id", b.tech_id).single();
      return { ...b, tech };
    }));
    setBookings(enriched);

    // Recent notifications as activity feed
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    setActivity(notifs || []);

    // Stats: bookings this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthBookings = (enriched || []).filter(b => b.created_at >= monthStart && !["cancelled", "declined"].includes(b.status));
    const monthSpend = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Favorites count
    const { count: favCount } = await supabase.from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("producer_id", userId);

    setStats({ bookingsThisMonth: monthBookings.length, spendThisMonth: monthSpend, favCount: favCount || 0 });

    // Saved searches
    const { data: searches } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("producer_id", userId)
      .eq("active", true)
      .order("created_at", { ascending: false });
    setSavedSearches(searches || []);

    setLoading(false);
  };

  const deleteSavedSearch = async (id: string) => {
    await supabase.from("saved_searches").update({ active: false }).eq("id", id);
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
    </div>
  );

  // Derived data
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysOut = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const upcomingBookings = bookings
    .filter(b => ["confirmed", "paid", "accepted"].includes(b.status) && b.projects?.start_date && b.projects.start_date >= today && b.projects.start_date <= sevenDaysOut)
    .sort((a, b) => (a.projects?.start_date || "").localeCompare(b.projects?.start_date || ""));

  const pendingResponse = bookings.filter(b => b.status === "pending");
  const needsCompletion = bookings.filter(b => b.status === "paid");
  const needsReview = bookings.filter(b => b.status === "completed" && !b.reviewed);
  const pendingCount = pendingResponse.length + needsCompletion.length + needsReview.length;

  const getTotalRoles = (p: any) => (p.project_roles || []).reduce((a: number, r: any) => a + (r.quantity || 0), 0);
  const getFilledRoles = (p: any) => (p.project_roles || []).reduce((a: number, r: any) => a + (r.filled || 0), 0);
  const getUnfilledSkills = (p: any) => (p.project_roles || []).filter((r: any) => (r.filled || 0) < (r.quantity || 0)).map((r: any) => r.skill);

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
        <div>
          <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Dashboard</span>
          <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">
            Welcome back, <span className="text-signal-orange">{profile?.display_name?.split(" ")[0]}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/projects"
            className="px-4 py-2 text-xs font-mono text-aluminum/65 border border-ink/[0.06] rounded-lg hover:border-signal-orange/20 transition-all">
            All Projects →
          </Link>
          <Link href="/browse"
            className="px-4 py-2 text-xs font-mono bg-signal-orange/10 text-signal-orange border border-signal-orange/20 rounded-lg hover:bg-signal-orange/15 transition-all">
            Find Crew
          </Link>
        </div>
      </div>

      {/* Identity Verification */}
      <IdentityVerificationBanner profile={profile} />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6">
        <button onClick={() => setTab("overview")}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-all ${tab === "overview" ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20" : "text-aluminum/60 hover:text-aluminum/60"}`}>
          Overview
        </button>
        <button onClick={() => setTab("bookings")}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${tab === "bookings" ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20" : "text-aluminum/60 hover:text-aluminum/60"}`}>
          All Bookings
          {bookings.length > 0 && <span className="text-[9px] opacity-50">{bookings.length}</span>}
        </button>
      </div>

      {tab === "bookings" ? (
        <ProducerBookingsList bookings={bookings} userId={userId} />
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
              <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Bookings This Month</div>
              <div className="font-mono text-2xl font-semibold">{stats.bookingsThisMonth}</div>
            </div>
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
              <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Spend This Month</div>
              <div className="font-mono text-2xl font-semibold">${stats.spendThisMonth.toLocaleString()}</div>
            </div>
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
              <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Saved Techs</div>
              <div className="font-mono text-2xl font-semibold text-cue-blue">{stats.favCount}</div>
            </div>
          </div>

          {/* Pending Actions */}
          {pendingCount > 0 && (
            <div className="bg-standby-amber/[0.04] border border-standby-amber/15 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-mono text-[10px] text-standby-amber tracking-[3px] uppercase">Pending Actions</h2>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-standby-amber/15 text-standby-amber border border-standby-amber/25">
                  {pendingCount}
                </span>
              </div>
              <div className="space-y-2">
                {pendingResponse.map(b => (
                  <Link key={b.id} href="/bookings"
                    className="flex items-center justify-between p-3 bg-blackout/30 rounded-lg hover:bg-blackout/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-standby-amber" />
                      <span className="text-sm">
                        <span className="text-aluminum/60">Waiting on</span>{" "}
                        <span className="font-semibold">{b.tech?.display_name}</span>{" "}
                        <span className="text-aluminum/60">for</span>{" "}
                        {b.project_roles?.skill} <span className="text-aluminum/60">on</span> {b.projects?.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-standby-amber">AWAITING RESPONSE</span>
                  </Link>
                ))}
                {needsCompletion.map(b => (
                  <Link key={b.id} href="/bookings"
                    className="flex items-center justify-between p-3 bg-blackout/30 rounded-lg hover:bg-blackout/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="text-sm">
                        <span className="font-semibold">{b.tech?.display_name}</span>{" "}
                        <span className="text-aluminum/60">—</span> {b.projects?.name}{" "}
                        <span className="text-aluminum/60">ready to mark complete</span>
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-purple-400">MARK COMPLETE</span>
                  </Link>
                ))}
                {needsReview.map(b => (
                  <Link key={b.id} href="/bookings"
                    className="flex items-center justify-between p-3 bg-blackout/30 rounded-lg hover:bg-blackout/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-signal-orange" />
                      <span className="text-sm">
                        <span className="text-aluminum/60">Leave a review for</span>{" "}
                        <span className="font-semibold">{b.tech?.display_name}</span>{" "}
                        <span className="text-aluminum/60">on</span> {b.projects?.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-signal-orange">REVIEW</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Projects */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase">Active Projects</h2>
              <Link href="/projects" className="text-[10px] font-mono text-aluminum/50 hover:text-signal-orange transition-colors">All projects →</Link>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-10 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
                <div className="text-aluminum/35 text-sm mb-2">No active projects</div>
                <Link href="/projects" className="text-xs font-mono text-signal-orange hover:underline">Create your first project →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => {
                  const total = getTotalRoles(project);
                  const filled = getFilledRoles(project);
                  const unfilled = getUnfilledSkills(project);
                  const progress = total > 0 ? (filled / total) * 100 : 0;
                  const isFullyCrewed = filled === total && total > 0;
                  const daysUntil = project.start_date ? Math.ceil((new Date(project.start_date + "T00:00:00").getTime() - Date.now()) / 86400000) : null;

                  return (
                    <div key={project.id} className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/project/${project.id}`} className="group">
                          <h3 className="font-heading text-base font-bold group-hover:text-signal-orange transition-colors">{project.name}</h3>
                          <div className="text-[11px] text-aluminum/60 flex flex-wrap gap-x-2 mt-0.5">
                            {project.city && <span>{project.city}</span>}
                            {project.venue && <span>· {project.venue}</span>}
                            {project.start_date && (
                              <span>· {formatDate(project.start_date)}
                                {project.end_date && project.end_date !== project.start_date && ` – ${formatDate(project.end_date)}`}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          {daysUntil !== null && daysUntil >= 0 && daysUntil <= 14 && (
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono ${
                              daysUntil <= 2 ? "bg-red-500/10 text-red-400" :
                              daysUntil <= 7 ? "bg-standby-amber/10 text-standby-amber" :
                              "bg-cue-blue/10 text-cue-blue"
                            }`}>
                              {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Crew progress */}
                      {total > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between mb-1">
                            <div className="flex flex-wrap gap-1">
                              {(project.project_roles || []).map((role: any) => (
                                <span key={role.id} className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                  role.filled >= role.quantity
                                    ? "bg-go-green/8 text-go-green/70"
                                    : "bg-ink/[0.02] text-aluminum/50"
                                }`}>
                                  {role.skill} {role.filled}/{role.quantity}
                                </span>
                              ))}
                            </div>
                            <span className="font-mono text-[9px] shrink-0 ml-2" style={{ color: isFullyCrewed ? "var(--color-go-green)" : "var(--color-standby-amber)" }}>
                              {filled}/{total}
                            </span>
                          </div>
                          <div className="h-1 bg-ink/[0.03] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: isFullyCrewed ? "var(--color-go-green)" : "var(--color-signal-orange)" }} />
                          </div>
                        </div>
                      )}

                      {/* Find crew button for unfilled roles */}
                      {unfilled.length > 0 && (
                        <Link
                          href={`/browse?roles=${encodeURIComponent(unfilled.join(","))}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-mono bg-signal-orange/8 text-signal-orange border border-signal-orange/15 hover:bg-signal-orange/15 transition-all"
                        >
                          Find Crew
                          <span className="text-signal-orange/50">— need {unfilled.join(", ")}</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Two-column: Upcoming Bookings + Recent Activity */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Upcoming 7 days */}
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase">Next 7 Days</h2>
                <button onClick={() => setTab("bookings")} className="text-[10px] font-mono text-aluminum/50 hover:text-signal-orange transition-colors">
                  All bookings →
                </button>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-aluminum/30 text-sm mb-1">No gigs in the next 7 days</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingBookings.map(b => {
                    const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                    return (
                      <Link key={b.id} href="/bookings"
                        className="flex items-center justify-between p-3 bg-blackout/20 rounded-lg hover:bg-blackout/40 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-[10px] font-bold flex-shrink-0"
                            style={{ background: `hsl(${getHue(b.tech?.display_name || "")}, 40%, 25%)` }}>
                            {getInitials(b.tech?.display_name || "")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{b.tech?.display_name}</div>
                            <div className="text-[10px] text-aluminum/60">
                              {b.project_roles?.skill} · {b.projects?.name} · {formatDate(b.projects?.start_date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/messages`} onClick={e => e.stopPropagation()}
                            className="px-2 py-1 rounded text-[9px] font-mono text-aluminum/50 border border-ink/[0.05] hover:border-signal-orange/20 hover:text-signal-orange transition-all">
                            Msg
                          </Link>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold"
                            style={{ color: sc.color, background: `${sc.color}12` }}>
                            {sc.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
              <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-4">Recent Activity</h2>
              {activity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-aluminum/30 text-sm">No recent activity</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activity.map(n => {
                    const typeColors: Record<string, string> = {
                      booking_accepted: "var(--color-go-green)",
                      booking_confirmed: "var(--color-go-green)",
                      booking_declined: "#FF3D00",
                      booking_request: "var(--color-standby-amber)",
                      gig_completed: "#9B59B6",
                      review_received: "var(--color-signal-orange)",
                    };
                    const dotColor = typeColors[n.type] || "var(--color-aluminum)";
                    const ago = getTimeAgo(n.created_at);

                    return (
                      <div key={n.id}
                        className={`flex items-start gap-2.5 p-3 rounded-lg ${n.read ? "bg-blackout/10" : "bg-blackout/30"}`}>
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: dotColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-house-lights/70 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-aluminum/40 font-mono">{ago}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase">Saved Searches</h2>
                <span className="text-[10px] font-mono text-aluminum/40">{savedSearches.length} active</span>
              </div>
              <div className="space-y-2">
                {savedSearches.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-blackout/20 rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/browse${s.filters?.skills?.length ? `?skill=${s.filters.skills[0]}` : ""}`}
                        className="text-xs text-house-lights/80 hover:text-signal-orange transition-colors truncate block"
                      >
                        {s.label || "All techs"}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.last_match_count > 0 && (
                          <span className="text-[10px] font-mono text-go-green">{s.last_match_count} match{s.last_match_count !== 1 ? "es" : ""}</span>
                        )}
                        <span className="text-[10px] font-mono text-aluminum/40">
                          saved {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSavedSearch(s.id)}
                      className="text-[10px] font-mono text-aluminum/40 hover:text-red-400 transition-colors ml-3 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-aluminum/40 mt-2">
                You&apos;ll get an email when new techs match these searches.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/projects"
              className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 hover:border-signal-orange/15 transition-all text-center">
              <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Projects</div>
              <div className="font-mono text-lg font-semibold">{projects.length}</div>
            </Link>
            <Link href="/favorites"
              className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 hover:border-signal-orange/15 transition-all text-center">
              <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Saved Techs</div>
              <div className="font-mono text-lg font-semibold text-cue-blue">{stats.favCount}</div>
            </Link>
            <Link href="/messages"
              className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 hover:border-signal-orange/15 transition-all text-center">
              <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Messages</div>
              <div className="font-mono text-lg font-semibold">→</div>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

// ─── Producer Bookings List (secondary tab) ──────────────────

function ProducerBookingsList({ bookings, userId }: { bookings: any[]; userId: string }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? bookings : bookings.filter(b => b.status === statusFilter);
  const counts: Record<string, number> = {};
  bookings.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });

  return (
    <div>
      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "accepted", label: "Accepted" },
          { id: "confirmed", label: "Confirmed" },
          { id: "paid", label: "Paid" },
          { id: "completed", label: "Completed" },
        ].map(t => (
          <button key={t.id} onClick={() => setStatusFilter(t.id)}
            className={`px-3 py-1 rounded text-xs font-mono transition-all ${
              statusFilter === t.id
                ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20"
                : "text-aluminum/50 hover:text-aluminum/65"
            }`}>
            {t.label}
            {t.id !== "all" && counts[t.id] ? <span className="ml-1 text-[9px] opacity-50">{counts[t.id]}</span> : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
          <div className="text-aluminum/35 text-sm">No bookings{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => {
            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
            return (
              <Link key={b.id} href="/bookings"
                className="flex items-center justify-between p-4 bg-deep-stage/40 border border-ink/[0.03] rounded-lg hover:border-signal-orange/15 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-heading text-[10px] font-bold flex-shrink-0"
                    style={{ background: `hsl(${getHue(b.tech?.display_name || "")}, 40%, 25%)` }}>
                    {getInitials(b.tech?.display_name || "")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{b.projects?.name || "Unknown Event"}</div>
                    <div className="text-[10px] text-aluminum/60">
                      {b.project_roles?.skill} · {b.tech?.display_name}
                      {b.projects?.start_date && ` · ${formatDate(b.projects.start_date)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">${b.total_amount?.toLocaleString() || "—"}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold"
                    style={{ color: sc.color, background: `${sc.color}12`, border: `1px solid ${sc.color}25` }}>
                    {sc.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Time ago helper ─────────────────────────────────────────

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

// ═════════════════════════════════════════════════════════════
// TECH DASHBOARD (preserved from original)
// ═════════════════════════════════════════════════════════════

function TechDashboard({ userId, profile }: { userId: string; profile: any }) {
  const [techProfile, setTechProfile] = useState<any>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0, pending: 0 });
  const [reviewCount, setReviewCount] = useState(0);
  const [profileViews7d, setProfileViews7d] = useState(0);
  const [profileViews30d, setProfileViews30d] = useState(0);
  const [searchAppearances, setSearchAppearances] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [payoutsSetUp, setPayoutsSetUp] = useState(true);
  const [pendingPayoutAmount, setPendingPayoutAmount] = useState(0);
  const [pendingPayoutCount, setPendingPayoutCount] = useState(0);
  const [rateAnalytics, setRateAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTechData(); }, []);

  const loadTechData = async () => {
    const { data: tp } = await supabase.from("tech_profiles").select("*").eq("user_id", userId).single();
    setTechProfile(tp);

    const { data: upcoming } = await supabase.from("bookings")
      .select("*, projects(name, city, start_date, end_date), project_roles(skill)")
      .eq("tech_id", userId)
      .in("status", ["confirmed", "paid", "accepted"])
      .order("created_at", { ascending: false })
      .limit(5);
    setUpcomingBookings(upcoming || []);

    const { data: recent } = await supabase.from("bookings")
      .select("*, projects(name, city)")
      .eq("tech_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5);
    setRecentBookings(recent || []);

    const { data: allPaid } = await supabase.from("bookings")
      .select("total_amount, paid_at, status")
      .eq("tech_id", userId)
      .in("status", ["paid", "completed"]);

    if (allPaid) {
      const total = allPaid.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thisMonth = allPaid.filter(b => b.paid_at && b.paid_at >= monthStart)
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      setEarnings({ total, thisMonth, pending: 0 });
    }

    const { data: pendingBookings } = await supabase.from("bookings")
      .select("total_amount")
      .eq("tech_id", userId)
      .in("status", ["confirmed", "accepted"]);
    if (pendingBookings) {
      setEarnings(prev => ({ ...prev, pending: pendingBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) }));
    }

    const { data: reviews } = await supabase.from("reviews").select("id").eq("tech_id", userId);
    setReviewCount(reviews?.length || 0);

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

    const { count: views7 } = await supabase.from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("tech_user_id", userId).eq("source", "profile").gte("viewed_at", d7);
    setProfileViews7d(views7 || 0);

    const { count: views30 } = await supabase.from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("tech_user_id", userId).eq("source", "profile").gte("viewed_at", d30);
    setProfileViews30d(views30 || 0);

    const { count: appearances } = await supabase.from("profile_views")
      .select("*", { count: "exact", head: true })
      .eq("tech_user_id", userId).eq("source", "browse").gte("viewed_at", d30);
    setSearchAppearances(appearances || 0);

    setReferralCode(profile?.referral_code || "");
    const { count: refCount } = await supabase.from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", userId).eq("status", "completed");
    setReferralCount(refCount || 0);

    // Check payout setup status
    if (tp && !tp.stripe_onboarding_complete) {
      setPayoutsSetUp(false);

      // Query pending payouts to show amount in banner
      const { data: pendingPayouts } = await supabase
        .from("payouts")
        .select("amount")
        .eq("tech_id", userId)
        .eq("status", "pending");
      if (pendingPayouts && pendingPayouts.length > 0) {
        const total = pendingPayouts.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        setPendingPayoutAmount(total);
        setPendingPayoutCount(pendingPayouts.length);
      }
    }

    // Fetch rate analytics (non-blocking)
    const { data: { session: sess } } = await supabase.auth.getSession();
    if (sess?.access_token) {
      fetch("/api/rate-analytics", {
        headers: { Authorization: `Bearer ${sess.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => { if (data.insights) setRateAnalytics(data); })
        .catch(() => {});
    }

    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
    </div>
  );

  const lvl = techProfile?.level || 0;
  const xp = techProfile?.xp || 0;
  const nextThreshold = TIER_THRESHOLDS[Math.min(lvl + 1, TIER_THRESHOLDS.length - 1)];
  const currentThreshold = TIER_THRESHOLDS[lvl] || 0;
  const xpProgress = nextThreshold > currentThreshold ? (xp - currentThreshold) / (nextThreshold - currentThreshold) : 1;

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
        <div>
          <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Dashboard</span>
          <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">
            Welcome back, <span className="text-signal-orange">{profile?.display_name?.split(" ")[0]}</span>
          </h1>
        </div>
        <Link href="/edit-profile"
          className="px-4 py-2 text-xs font-mono text-aluminum/65 border border-ink/[0.06] rounded-lg hover:border-signal-orange/20 transition-all">
          Edit Profile →
        </Link>
      </div>

      {/* Identity Verification */}
      <IdentityVerificationBanner profile={profile} />

      {/* Reputation */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-aluminum/60 tracking-wider uppercase">Reputation</span>
            <div className="px-3 py-1 rounded-lg text-xs font-mono font-bold"
              style={{ color: TIER_COLORS[lvl], background: `${TIER_COLORS[lvl]}15`, border: `1px solid ${TIER_COLORS[lvl]}30` }}>
              {TIER_NAMES[lvl]}
            </div>
          </div>
          <span className="font-mono text-[10px] text-aluminum/50">{xp.toLocaleString()} / {nextThreshold.toLocaleString()} pts</span>
        </div>
        <div className="h-2 bg-ink/[0.04] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpProgress * 100}%`, background: `linear-gradient(90deg, ${TIER_COLORS[lvl]}80, ${TIER_COLORS[lvl]})` }} />
        </div>
        <p className="text-[10px] text-aluminum/40 mt-2">
          {nextThreshold - xp > 0 ? `${(nextThreshold - xp).toLocaleString()} points to ${TIER_NAMES[Math.min(lvl + 1, 4)]}` : "Premier status achieved"}
          {" · "}Earn points by completing gigs, getting reviews, and maintaining high ratings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
          <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Total Earned</div>
          <div className="font-mono text-2xl font-semibold text-go-green">${earnings.total.toLocaleString()}</div>
        </div>
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
          <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">This Month</div>
          <div className="font-mono text-2xl font-semibold">${earnings.thisMonth.toLocaleString()}</div>
        </div>
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
          <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Pending</div>
          <div className="font-mono text-2xl font-semibold text-standby-amber">${earnings.pending.toLocaleString()}</div>
        </div>
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4">
          <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mb-1">Gigs / Reviews</div>
          <div className="font-mono text-2xl font-semibold">
            {techProfile?.completed_gigs || 0} <span className="text-sm text-aluminum/50">/</span> {reviewCount}
          </div>
        </div>
      </div>

      {/* Payout setup banner */}
      {!payoutsSetUp && (
        <div className="bg-standby-amber/[0.04] border border-standby-amber/15 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              {pendingPayoutAmount > 0
                ? `You have $${pendingPayoutAmount.toLocaleString()} waiting`
                : "Set up payouts to start receiving your earnings"}
            </div>
            <div className="text-[11px] text-aluminum/60 mt-0.5">
              {pendingPayoutAmount > 0
                ? `${pendingPayoutCount} completed gig${pendingPayoutCount !== 1 ? "s" : ""} — connect your bank account to get paid`
                : "Connect your bank account so you get paid when gigs are completed"}
            </div>
          </div>
          <Link href="/payouts"
            className="w-full sm:w-auto text-center px-4 py-2 bg-standby-amber/15 text-standby-amber text-xs font-heading font-bold tracking-wider uppercase rounded-lg hover:bg-standby-amber/25 transition-all flex-shrink-0">
            Set Up Payouts
          </Link>
        </div>
      )}

      {/* Profile Analytics */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
        <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-3">Profile Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-blackout/20 rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-semibold text-cue-blue">{profileViews7d}</div>
            <div className="text-[9px] text-aluminum/50 tracking-wider uppercase mt-1">Views (7d)</div>
          </div>
          <div className="bg-blackout/20 rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-semibold">{profileViews30d}</div>
            <div className="text-[9px] text-aluminum/50 tracking-wider uppercase mt-1">Views (30d)</div>
          </div>
          <div className="bg-blackout/20 rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-semibold text-standby-amber">{searchAppearances}</div>
            <div className="text-[9px] text-aluminum/50 tracking-wider uppercase mt-1">Search Appearances</div>
          </div>
        </div>
        {(techProfile?.completed_gigs || 0) > 0 && profileViews30d > 0 && (
          <div className="mt-3 text-[10px] text-aluminum/50">
            Booking rate: {Math.round(((techProfile?.completed_gigs || 0) / profileViews30d) * 100)}% of profile viewers booked you (30d)
          </div>
        )}
      </div>

      {/* Rate Insights */}
      {rateAnalytics && rateAnalytics.insights.length > 0 && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
          <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase mb-3">Rate Insights</h2>
          {rateAnalytics.summary && rateAnalytics.summary.myRate > 0 && rateAnalytics.summary.marketAvg > 0 && (
            <div className="bg-blackout/20 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-aluminum/60">Your {rateAnalytics.summary.primarySkill} rate</span>
                <span className="font-mono text-lg font-bold text-signal-orange">${rateAnalytics.summary.myRate}/hr</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-aluminum/60">Market average ({rateAnalytics.summary.totalComps} techs)</span>
                <span className="font-mono text-lg font-bold">${rateAnalytics.summary.marketAvg}/hr</span>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider ${
                  rateAnalytics.summary.position === "above"
                    ? "bg-signal-orange/[0.08] text-signal-orange"
                    : rateAnalytics.summary.position === "competitive"
                    ? "bg-emerald-500/[0.08] text-emerald-400"
                    : rateAnalytics.summary.position === "below"
                    ? "bg-standby-amber/[0.08] text-standby-amber"
                    : "bg-aluminum/[0.08] text-aluminum"
                }`}>
                  {rateAnalytics.summary.position === "above" && "ABOVE MARKET"}
                  {rateAnalytics.summary.position === "competitive" && "COMPETITIVE"}
                  {rateAnalytics.summary.position === "below" && "BELOW MARKET"}
                  {rateAnalytics.summary.position === "unknown" && "NOT ENOUGH DATA"}
                </span>
              </div>
            </div>
          )}
          {rateAnalytics.insights.filter((i: any) => i.myRate > 0 && (i.local || i.national)).length > 1 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">All Your Roles</div>
              {rateAnalytics.insights
                .filter((i: any) => i.myRate > 0 && (i.local || i.national))
                .map((insight: any) => {
                  const ref = insight.local || insight.national;
                  const diff = ref ? Math.round(((insight.myRate - ref.avg) / ref.avg) * 100) : 0;
                  return (
                    <div key={insight.skill} className="flex items-center justify-between bg-blackout/20 rounded-lg px-3 py-2">
                      <span className="text-xs font-mono text-aluminum/70">{insight.skill}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-house-lights">${insight.myRate}/hr</span>
                        {ref && (
                          <span className={`text-[10px] font-mono ${diff > 0 ? "text-signal-orange" : diff < 0 ? "text-standby-amber" : "text-aluminum/50"}`}>
                            {diff > 0 ? "+" : ""}{diff}% vs avg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          <p className="text-[10px] text-aluminum/40 mt-3">
            Based on {rateAnalytics.insights[0]?.local ? "techs in your market" : "all techs on Truss"} with matching skills.
            {rateAnalytics.summary?.position === "below" && " Consider updating your rates on your profile."}
          </p>
        </div>
      )}

      {/* Referral Link */}
      {referralCode && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase">Refer a Friend</h2>
            {referralCount > 0 && (
              <span className="font-mono text-xs text-go-green">{referralCount} referral{referralCount !== 1 ? "s" : ""}</span>
            )}
          </div>
          <p className="text-xs text-aluminum/60 mb-3">Share your link. When they complete their first gig, you both earn 200 XP.</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referralCode}`}
              className="flex-1 px-3 py-2 bg-blackout border border-ink/[0.06] rounded-lg font-mono text-[11px] text-aluminum truncate"
            />
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralCode}`)}
              className="px-4 py-2 bg-signal-orange/10 text-signal-orange font-mono text-xs rounded-lg hover:bg-signal-orange/20 transition-colors flex-shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming */}
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase">Upcoming Gigs</h2>
            <Link href="/bookings" className="text-[10px] font-mono text-aluminum/50 hover:text-signal-orange transition-colors">View all →</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-aluminum/30 text-sm">No upcoming gigs</div>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map(b => (
                <Link key={b.id} href="/bookings"
                  className="flex justify-between items-center p-3 bg-blackout/20 rounded-lg hover:bg-blackout/40 transition-colors">
                  <div>
                    <div className="text-sm font-semibold">{b.projects?.name}</div>
                    <div className="text-[10px] text-aluminum/60">
                      {b.project_roles?.skill} · {b.projects?.city}
                      {b.projects?.start_date && ` · ${formatDate(b.projects.start_date)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">${b.total_amount}</div>
                    <div className="text-[9px] font-mono uppercase"
                      style={{ color: b.status === "paid" ? "var(--color-go-green)" : b.status === "confirmed" ? "var(--color-go-green)" : "var(--color-cue-blue)" }}>
                      {b.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent */}
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-mono text-[10px] text-signal-orange/60 tracking-[3px] uppercase">Recent Gigs</h2>
            <Link href="/bookings" className="text-[10px] font-mono text-aluminum/50 hover:text-signal-orange transition-colors">View all →</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-aluminum/30 text-sm">No completed gigs yet</div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBookings.map(b => (
                <div key={b.id} className="flex justify-between items-center p-3 bg-blackout/20 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold">{b.projects?.name}</div>
                    <div className="text-[10px] text-aluminum/60">{b.projects?.city} · {formatDate(b.completed_at)}</div>
                  </div>
                  <div className="font-mono text-sm text-go-green">${b.total_amount}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <Link href="/edit-profile"
          className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 hover:border-signal-orange/15 transition-all text-center">
          <div className="text-xs font-mono text-aluminum/65">Edit Profile</div>
        </Link>
        <Link href="/availability"
          className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 hover:border-signal-orange/15 transition-all text-center">
          <div className="text-xs font-mono text-aluminum/65">Availability</div>
        </Link>
        <Link href="/messages"
          className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 hover:border-signal-orange/15 transition-all text-center">
          <div className="text-xs font-mono text-aluminum/65">Messages</div>
        </Link>
      </div>

      {/* Profile completeness */}
      {techProfile && (techProfile.profile_complete || 0) < 80 && (
        <div className="mt-4 bg-signal-orange/[0.04] border border-signal-orange/15 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Complete your profile to get more bookings</div>
            <div className="text-[11px] text-aluminum/60 mt-0.5">Profiles over 80% complete get 3x more views</div>
          </div>
          <Link href="/edit-profile"
            className="w-full sm:w-auto text-center px-4 py-2 bg-signal-orange text-white text-xs font-heading font-bold tracking-wider uppercase rounded-lg hover:shadow-[0_0_15px_rgba(255,77,0,0.2)] transition-all flex-shrink-0">
            Complete Profile
          </Link>
        </div>
      )}
    </main>
  );
}
