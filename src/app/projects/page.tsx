"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEPARTMENTS } from "@/lib/taxonomy";

const SHORT_LABEL_ROLES = new Set(["A1", "A2", "V1", "V2", "L1", "L2", "TD", "PM"]);
const ROLE_OPTIONS = DEPARTMENTS.flatMap((dept) =>
  dept.roles.map((role) => ({
    value: role.shortName,
    label: SHORT_LABEL_ROLES.has(role.shortName)
      ? `${role.shortName} — ${role.name.replace(` (${role.shortName})`, "")}`
      : role.name,
  }))
);

const SHOW_TEMPLATES: Record<string, { skill: string; quantity: number }[]> = {
  "Corporate General Session": [
    { skill: "A1", quantity: 1 }, { skill: "A2", quantity: 1 },
    { skill: "V1", quantity: 1 }, { skill: "V2", quantity: 1 },
    { skill: "L1", quantity: 1 },
  ],
  "Concert / Festival": [
    { skill: "A1", quantity: 1 }, { skill: "A2", quantity: 2 },
    { skill: "V1", quantity: 1 },
    { skill: "L1", quantity: 1 }, { skill: "L2", quantity: 1 },
    { skill: "SH", quantity: 2 },
  ],
  "Trade Show": [
    { skill: "A1", quantity: 1 }, { skill: "V1", quantity: 1 },
    { skill: "LED", quantity: 1 }, { skill: "SH", quantity: 2 },
  ],
  "Broadcast / Stream": [
    { skill: "A1", quantity: 1 }, { skill: "A2", quantity: 1 },
    { skill: "V1", quantity: 1 }, { skill: "CAM", quantity: 2 },
    { skill: "TD", quantity: 1 }, { skill: "GFX", quantity: 1 },
  ],
  "Gala / Awards": [
    { skill: "A1", quantity: 1 }, { skill: "A2", quantity: 1 },
    { skill: "V1", quantity: 1 }, { skill: "V2", quantity: 1 },
    { skill: "L1", quantity: 1 }, { skill: "L2", quantity: 1 },
    { skill: "SPOT", quantity: 2 }, { skill: "TD", quantity: 1 },
    { skill: "SH", quantity: 2 },
  ],
  "Conference / Breakouts": [
    { skill: "A1", quantity: 1 }, { skill: "A2", quantity: 2 },
    { skill: "V1", quantity: 1 }, { skill: "V2", quantity: 2 },
    { skill: "L1", quantity: 1 }, { skill: "IT", quantity: 1 },
  ],
};

export default function Projects() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<"projects" | "jobs">("projects");
  const [projects, setProjects] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // New project form
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [roles, setRoles] = useState<{ skill: string; quantity: number }[]>([]);
  const [creating, setCreating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [cloneSource, setCloneSource] = useState<{
    projectName: string;
    bookings: { tech_id: string; skill: string; tech_name: string }[];
  } | null>(null);
  const [reInviteCrew, setReInviteCrew] = useState(false);
  const [cloneLoading, setCloneLoading] = useState<string | null>(null);

  // Jobs state
  const [jobs, setJobs] = useState<any[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobTab, setJobTab] = useState("all");
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobLimitReached, setJobLimitReached] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "", description: "", city: "", role_id: ROLE_OPTIONS[0].value,
    employment_type: "contract", pay_min: "", pay_max: "", pay_type: "day_rate", requirements: "",
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data: prof } = await supabase.from("profiles").select("display_name, city, cities").eq("id", session.user.id).single();
    if (prof && (!prof.display_name || (!prof.city && !(prof.cities?.length > 0)))) { router.push("/onboarding"); return; }

    setUserId(session.user.id);

    const { data: projs } = await supabase
      .from("projects")
      .select("*, project_roles (*)")
      .eq("producer_id", session.user.id)
      .order("created_at", { ascending: false });

    setProjects(projs || []);
    setLoading(false);
  };

  const loadJobs = async () => {
    setJobsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/jobs?producer_id=${session.user.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setJobs(data.jobs || []);
    setJobsLoading(false);
  };

  useEffect(() => { if (view === "jobs" && jobs.length === 0) loadJobs(); }, [view]);

  const createJob = async () => {
    if (!jobForm.title || !jobForm.city || !jobForm.role_id) return;
    setCreatingJob(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        action: "create",
        ...jobForm,
        pay_min: jobForm.pay_min ? parseFloat(jobForm.pay_min) : null,
        pay_max: jobForm.pay_max ? parseFloat(jobForm.pay_max) : null,
      }),
    });
    const data = await res.json();
    if (data.upgrade_required) {
      setJobLimitReached(true);
      setCreatingJob(false);
      return;
    }
    if (data.job) {
      setJobs([data.job, ...jobs]);
      setJobForm({ title: "", description: "", city: "", role_id: ROLE_OPTIONS[0].value, employment_type: "contract", pay_min: "", pay_max: "", pay_type: "day_rate", requirements: "" });
      setShowJobForm(false);
    }
    setCreatingJob(false);
  };

  const closeJob = async (jobId: string, status: "filled" | "closed") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: "close", jobId, status }),
    });
    const data = await res.json();
    if (data.job) setJobs(jobs.map(j => j.id === jobId ? data.job : j));
  };

  const deleteJob = async (jobId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: "delete", jobId }),
    });
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  const addRole = () => { setRoles([...roles, { skill: ROLE_OPTIONS[0].value, quantity: 1 }]); setActiveTemplate(null); };
  const updateRole = (i: number, field: string, value: any) => {
    const updated = [...roles]; updated[i] = { ...updated[i], [field]: value }; setRoles(updated); setActiveTemplate(null);
  };
  const removeRole = (i: number) => { setRoles(roles.filter((_, idx) => idx !== i)); setActiveTemplate(null); };

  const cloneProject = async (projectId: string) => {
    const source = projects.find(p => p.id === projectId);
    if (!source) return;
    setCloneLoading(projectId);

    // Load roles
    const sourceRoles = (source.project_roles || []).map((r: any) => ({
      skill: r.skill, quantity: r.quantity,
    }));

    // Load successful bookings
    const { data: sourceBookings } = await supabase
      .from("bookings")
      .select("tech_id, project_roles!inner(skill)")
      .eq("project_id", projectId)
      .in("status", ["accepted", "confirmed", "paid", "completed"]);

    // Deduplicate: keep one booking per tech_id + skill combo
    const seen = new Set<string>();
    const uniqueBookings = (sourceBookings || []).filter((b: any) => {
      const key = `${b.tech_id}:${b.project_roles?.skill}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Load tech names for preview
    const techIds = [...new Set(uniqueBookings.map((b: any) => b.tech_id))];
    let techNameMap: Record<string, string> = {};
    if (techIds.length > 0) {
      const { data: techProfiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", techIds);
      if (techProfiles) {
        techNameMap = Object.fromEntries(techProfiles.map(p => [p.id, p.display_name || "Unknown"]));
      }
    }

    setCloneSource({
      projectName: source.name,
      bookings: uniqueBookings.map((b: any) => ({
        tech_id: b.tech_id,
        skill: b.project_roles?.skill || "",
        tech_name: techNameMap[b.tech_id] || "Unknown",
      })),
    });
    setReInviteCrew(false);
    setActiveTemplate(null);
    setRoles(sourceRoles);
    setName("");
    setCity(source.city || "");
    setVenue(source.venue || "");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setShowNew(true);
    setCloneLoading(null);
  };

  const createProject = async () => {
    if (!userId || !name) return;
    setCreating(true);
    const { data: project, error } = await supabase.from("projects").insert({
      producer_id: userId, name, city, venue,
      start_date: startDate || null, end_date: endDate || null, notes, status: "active",
    }).select().single();

    if (error || !project) { setCreating(false); return; }

    if (roles.length > 0) {
      await supabase.from("project_roles").insert(
        roles.map(r => ({ project_id: project.id, skill: r.skill, quantity: r.quantity, filled: 0 }))
      );
    }

    // Re-invite crew from cloned project via server API
    if (cloneSource && reInviteCrew && cloneSource.bookings.length > 0) {
      const { data: newRoles } = await supabase
        .from("project_roles")
        .select("id, skill")
        .eq("project_id", project.id);

      if (newRoles) {
        const { data: { session } } = await supabase.auth.getSession();

        // Build booking list for bulk API
        const bookingList: any[] = [];
        for (const oldBooking of cloneSource.bookings) {
          const matchingRole = newRoles.find(r => r.skill === oldBooking.skill);
          if (!matchingRole) continue;

          const { data: techProfile } = await supabase
            .from("tech_profiles")
            .select("hourly_rate, skill_rates")
            .eq("user_id", oldBooking.tech_id)
            .single();

          const rate = techProfile?.skill_rates?.[matchingRole.skill] || techProfile?.hourly_rate || 0;
          bookingList.push({
            projectRoleId: matchingRole.id,
            techId: oldBooking.tech_id,
            rate,
            totalHours: 10,
          });
        }

        if (bookingList.length > 0 && session) {
          await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "create_bulk",
              projectId: project.id,
              bookings: bookingList,
            }),
          });
        }
      }
    }

    setName(""); setCity(""); setVenue(""); setStartDate(""); setEndDate(""); setNotes(""); setRoles([]);
    setCloneSource(null); setReInviteCrew(false); setActiveTemplate(null);
    setShowNew(false); setCreating(false);
    router.push(`/project/${project.id}`);
  };

  const formatDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  const getTotalRoles = (p: any) => (p.project_roles || []).reduce((a: number, r: any) => a + (r.quantity || 0), 0);
  const getFilledRoles = (p: any) => (p.project_roles || []).reduce((a: number, r: any) => a + (r.filled || 0), 0);

  // Categorize projects
  const today = new Date().toISOString().split("T")[0];
  const categorize = (p: any) => {
    if (p.status === "completed") return "completed";
    if (p.status === "cancelled") return "cancelled";
    if (p.end_date && p.end_date < today) return "past";
    if (p.start_date && p.start_date > today) return "upcoming";
    return "active";
  };

  const counts = { all: projects.length, active: 0, upcoming: 0, past: 0, completed: 0 };
  projects.forEach(p => { const cat = categorize(p); if (cat in counts) counts[cat as keyof typeof counts]++; });

  // Filter and sort
  const filtered = projects
    .filter(p => {
      if (activeTab !== "all" && categorize(p) !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.venue?.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "date") return (a.start_date || "9999").localeCompare(b.start_date || "9999");
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  // Stats
  const totalCrewNeeded = projects.reduce((a, p) => a + getTotalRoles(p), 0);
  const totalCrewFilled = projects.reduce((a, p) => a + getFilledRoles(p), 0);

  const inputClass = "w-full px-4 py-3 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors";

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>);

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
        {/* View toggle */}
        <div className="flex gap-1 mb-6 bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-1 w-fit">
          <button onClick={() => setView("projects")}
            className={`px-5 py-2 rounded-md font-heading text-sm font-semibold tracking-wider uppercase transition-all ${
              view === "projects" ? "bg-signal-orange text-white" : "text-aluminum/60 hover:text-house-lights"
            }`}>
            Projects
          </button>
          <button onClick={() => setView("jobs")}
            className={`px-5 py-2 rounded-md font-heading text-sm font-semibold tracking-wider uppercase transition-all ${
              view === "jobs" ? "bg-signal-orange text-white" : "text-aluminum/60 hover:text-house-lights"
            }`}>
            Jobs
          </button>
        </div>

        {view === "projects" && (<>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Event Management</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">
              My <span className="text-signal-orange">Projects</span>
            </h1>
          </div>
          <button onClick={() => { setShowNew(!showNew); if (showNew) { setCloneSource(null); setReInviteCrew(false); } }}
            className="px-5 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all">
            {showNew ? "Cancel" : "+ New Project"}
          </button>
        </div>

        {/* Stats bar */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Projects", value: projects.length, color: "var(--color-house-lights)" },
              { label: "Active Now", value: counts.active, color: "var(--color-signal-orange)" },
              { label: "Crew Filled", value: `${totalCrewFilled}/${totalCrewNeeded}`, color: totalCrewFilled === totalCrewNeeded && totalCrewNeeded > 0 ? "var(--color-go-green)" : "var(--color-standby-amber)" },
              { label: "Upcoming", value: counts.upcoming, color: "var(--color-cue-blue)" },
            ].map((s, i) => (
              <div key={i} className="bg-deep-stage/40 border border-ink/[0.03] rounded-lg p-3 text-center">
                <div className="font-mono text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] text-aluminum/50 font-mono tracking-wider uppercase mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* New project form */}
        {showNew && (
          <div className="bg-deep-stage border border-signal-orange/15 rounded-xl p-6 mb-6">
            <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">
              {cloneSource ? "Clone Event" : "Create New Event"}
            </h2>
            {cloneSource && (
              <div className="bg-signal-orange/[0.04] border border-signal-orange/15 rounded-lg px-4 py-3 mb-4">
                <div className="text-xs text-aluminum mb-1">
                  Cloning roles from <span className="text-signal-orange font-semibold">{cloneSource.projectName}</span>
                </div>
                {cloneSource.bookings.length > 0 && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={reInviteCrew}
                        onChange={e => setReInviteCrew(e.target.checked)}
                        className="accent-signal-orange"
                      />
                      <span className="text-xs text-aluminum">
                        Re-invite same crew ({cloneSource.bookings.length} tech{cloneSource.bookings.length !== 1 ? "s" : ""})
                      </span>
                    </label>
                    {reInviteCrew && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cloneSource.bookings.map((b, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blackout rounded text-[10px] font-mono text-aluminum/70 border border-ink/[0.04]">
                            {b.tech_name} <span className="text-aluminum/40">({b.skill})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Event Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Q2 Leadership Summit" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Chicago, IL" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Venue</label>
                <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Hilton Grand Ballroom" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Event description, special requirements..." rows={3} className={inputClass + " resize-vertical"} />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono text-aluminum tracking-wider uppercase">Crew Roles Needed</label>
                <button onClick={addRole} className="text-xs font-mono text-signal-orange hover:underline">+ Add Role</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(SHOW_TEMPLATES).map(([showType, templateRoles]) => {
                  const crewCount = templateRoles.reduce((a, r) => a + r.quantity, 0);
                  const isActive = activeTemplate === showType;
                  return (
                    <button
                      key={showType}
                      type="button"
                      onClick={() => {
                        setRoles(templateRoles.map(r => ({ ...r })));
                        setActiveTemplate(showType);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                        isActive
                          ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/30"
                          : "bg-blackout border border-ink/[0.06] text-aluminum hover:border-signal-orange/30 hover:text-signal-orange"
                      }`}
                    >
                      {showType} <span className={isActive ? "text-signal-orange/60" : "text-aluminum/40"}>({crewCount})</span>
                    </button>
                  );
                })}
              </div>
              {roles.length === 0 && (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
                  <div className="text-aluminum text-sm mb-1">No roles added yet</div>
                  <p className="text-[11px] text-aluminum/40 mb-2">Pick a show type above, or add roles manually</p>
                  <button onClick={addRole} className="text-xs font-mono text-signal-orange hover:underline">+ Add custom role</button>
                </div>
              )}
              <div className="space-y-2">
                {roles.map((role, i) => (
                  <div key={i} className="flex gap-3 items-center bg-blackout rounded-lg p-3">
                    <select value={role.skill} onChange={e => updateRole(i, "skill", e.target.value)}
                      className="flex-1 px-3 py-2 bg-deep-stage border border-white/5 rounded text-sm text-house-lights outline-none appearance-none">
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-mono text-aluminum">QTY:</label>
                      <input type="number" value={role.quantity} onChange={e => updateRole(i, "quantity", parseInt(e.target.value) || 1)}
                        min="1" max="20" className="w-16 px-2 py-2 bg-deep-stage border border-white/5 rounded text-sm text-house-lights text-center outline-none" />
                    </div>
                    <button onClick={() => removeRole(i)} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowNew(false); setCloneSource(null); setReInviteCrew(false); }} className="px-5 py-2.5 text-aluminum font-heading text-sm tracking-wider uppercase hover:text-house-lights transition-colors">Cancel</button>
              <button onClick={createProject} disabled={!name || creating}
                className="px-6 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
                {creating
                  ? (reInviteCrew ? "Creating & Sending Invites..." : "Creating...")
                  : (reInviteCrew ? "Create & Send Invites" : "Create Project")}
              </button>
            </div>
          </div>
        )}

        {/* Tabs + Search + Sort */}
        {projects.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {[
                  { id: "all", label: "All", count: counts.all },
                  { id: "active", label: "Active", count: counts.active },
                  { id: "upcoming", label: "Upcoming", count: counts.upcoming },
                  { id: "past", label: "Past", count: counts.past },
                  { id: "completed", label: "Completed", count: counts.completed },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activeTab === tab.id
                        ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20"
                        : "text-aluminum/60 hover:text-aluminum/60"
                    }`}>
                    {tab.label}
                    {tab.count > 0 && <span className="ml-1 text-[9px] opacity-60">{tab.count}</span>}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-blackout border border-ink/[0.06] rounded-lg text-xs text-aluminum outline-none appearance-none cursor-pointer">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="date">By event date</option>
                <option value="name">By name</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search projects by name, city, or venue..."
                className="w-full px-4 py-2.5 pl-9 bg-deep-stage/40 border border-ink/[0.04] rounded-lg text-sm text-house-lights outline-none focus:border-signal-orange/20 transition-colors"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-aluminum/35 text-sm"></span>
            </div>
          </div>
        )}

        {/* Project list */}
        {projects.length === 0 && !showNew ? (
          <div className="text-center py-20 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
            <div className="font-heading text-lg text-aluminum/60">No projects yet</div>
            <div className="text-xs text-aluminum/40 mt-1 mb-4">Create your first event to start building your crew</div>
            <button onClick={() => setShowNew(true)}
              className="px-6 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors">
              + Create First Project
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
            <div className="text-xl mb-2 opacity-20"></div>
            <div className="text-sm text-aluminum/60">No projects match your filters</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(project => {
              const total = getTotalRoles(project);
              const filled = getFilledRoles(project);
              const progress = total > 0 ? (filled / total) * 100 : 0;
              const cat = categorize(project);
              const catColors: Record<string, string> = {
                active: "var(--color-signal-orange)", upcoming: "var(--color-cue-blue)", past: "var(--color-aluminum)", completed: "var(--color-go-green)", cancelled: "#FF3D00",
              };
              const color = catColors[cat] || "var(--color-aluminum)";
              const isFullyCrewed = filled === total && total > 0;
              const daysUntil = project.start_date ? Math.ceil((new Date(project.start_date).getTime() - Date.now()) / 86400000) : null;

              return (
                <Link key={project.id} href={`/project/${project.id}`}
                  className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 hover:border-signal-orange/15 transition-all group">

                  {/* Top row: name + status */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-heading text-base font-bold group-hover:text-signal-orange transition-colors leading-tight pr-2">{project.name}</h3>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                      style={{ color, background: `${color}10`, border: `1px solid ${color}25` }}>
                      {cat}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="text-[11px] text-aluminum/60 mb-3 flex flex-wrap gap-x-2">
                    {project.city && <span>{project.city}</span>}
                    {project.venue && <span>· {project.venue}</span>}
                    {project.start_date && (
                      <span>· {formatDate(project.start_date)}
                        {project.end_date && project.end_date !== project.start_date && ` – ${formatDate(project.end_date)}`}
                      </span>
                    )}
                  </div>

                  {/* Countdown badge for upcoming */}
                  {daysUntil !== null && daysUntil > 0 && daysUntil <= 30 && (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono mb-3 ${
                      daysUntil <= 3 ? "bg-red-500/10 text-red-400 border border-red-500/15" :
                      daysUntil <= 7 ? "bg-standby-amber/10 text-standby-amber border border-standby-amber/15" :
                      "bg-cue-blue/10 text-cue-blue border border-cue-blue/15"
                    }`}>
                      {daysUntil === 1 ? "Tomorrow" : `${daysUntil} days away`}
                    </div>
                  )}

                  {/* Role pills */}
                  {project.project_roles && project.project_roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.project_roles.map((role: any) => (
                        <span key={role.id}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                            role.filled >= role.quantity
                              ? "bg-go-green/8 text-go-green/70 border border-go-green/15"
                              : role.filled > 0
                              ? "bg-standby-amber/8 text-standby-amber/70 border border-standby-amber/15"
                              : "bg-ink/[0.02] text-aluminum/50 border border-ink/[0.04]"
                          }`}>
                          {role.skill} {role.filled}/{role.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress bar */}
                  {total > 0 ? (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-[9px] text-aluminum/40">CREW</span>
                        <span className="font-mono text-[9px]" style={{ color: isFullyCrewed ? "var(--color-go-green)" : color }}>
                          {filled}/{total} {isFullyCrewed ? "✓ Full" : ""}
                        </span>
                      </div>
                      <div className="h-1 bg-ink/[0.03] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: isFullyCrewed ? "var(--color-go-green)" : color }} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-aluminum/35 font-mono">No roles added</div>
                  )}

                  {/* Clone button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); cloneProject(project.id); }}
                    disabled={cloneLoading === project.id}
                    className="mt-3 w-full py-1.5 text-[10px] font-mono text-aluminum/40 hover:text-signal-orange border border-transparent hover:border-signal-orange/15 rounded-lg transition-all disabled:opacity-50"
                  >
                    {cloneLoading === project.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 border border-aluminum/30 border-t-signal-orange rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : "Clone"}
                  </button>
                </Link>
              );
            })}
          </div>
        )}
        </>)}

        {/* ===== JOBS VIEW ===== */}
        {view === "jobs" && (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Job Postings</span>
                <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">
                  My <span className="text-signal-orange">Jobs</span>
                </h1>
              </div>
              <button onClick={() => setShowJobForm(!showJobForm)}
                className="px-5 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all">
                {showJobForm ? "Cancel" : "+ Post a Job"}
              </button>
            </div>

            {/* Job posting form */}
            {showJobForm && (
              <div className="bg-deep-stage border border-signal-orange/15 rounded-xl p-6 mb-6">
                <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange mb-4">Post a Job</h2>

                {jobLimitReached && (
                  <div className="bg-standby-amber/10 border border-standby-amber/20 rounded-lg px-4 py-3 mb-4">
                    <div className="text-sm font-semibold text-standby-amber mb-1">Free post limit reached</div>
                    <div className="text-xs text-aluminum">You&apos;ve used all 3 free job posts. Paid job posts coming soon.</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Job Title *</label>
                    <input value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})}
                      placeholder="A1 Audio Engineer — Corporate Summit" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Role *</label>
                    <select value={jobForm.role_id} onChange={e => setJobForm({...jobForm, role_id: e.target.value})}
                      className={inputClass + " appearance-none"}>
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">City *</label>
                    <input value={jobForm.city} onChange={e => setJobForm({...jobForm, city: e.target.value})}
                      placeholder="San Francisco, CA" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Employment Type</label>
                    <select value={jobForm.employment_type} onChange={e => setJobForm({...jobForm, employment_type: e.target.value})}
                      className={inputClass + " appearance-none"}>
                      <option value="contract">Contract / Freelance</option>
                      <option value="full-time">Full-Time</option>
                      <option value="part-time">Part-Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Pay Type</label>
                    <select value={jobForm.pay_type} onChange={e => setJobForm({...jobForm, pay_type: e.target.value})}
                      className={inputClass + " appearance-none"}>
                      <option value="day_rate">Day Rate</option>
                      <option value="hourly">Hourly</option>
                      <option value="salary">Salary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Pay Min ($)</label>
                    <input type="number" value={jobForm.pay_min} onChange={e => setJobForm({...jobForm, pay_min: e.target.value})}
                      placeholder="500" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Pay Max ($)</label>
                    <input type="number" value={jobForm.pay_max} onChange={e => setJobForm({...jobForm, pay_max: e.target.value})}
                      placeholder="800" className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Description</label>
                    <textarea value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})}
                      placeholder="Describe the gig, show details, expectations..." rows={4} className={inputClass + " resize-vertical"} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Requirements</label>
                    <textarea value={jobForm.requirements} onChange={e => setJobForm({...jobForm, requirements: e.target.value})}
                      placeholder="Must have experience with Dante networking, own tools..." rows={3} className={inputClass + " resize-vertical"} />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowJobForm(false); setJobLimitReached(false); }}
                    className="px-5 py-2.5 text-aluminum font-heading text-sm tracking-wider uppercase hover:text-house-lights transition-colors">Cancel</button>
                  <button onClick={createJob} disabled={!jobForm.title || !jobForm.city || creatingJob || jobLimitReached}
                    className="px-6 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
                    {creatingJob ? "Posting..." : "Post Job"}
                  </button>
                </div>
              </div>
            )}

            {/* Job tabs */}
            {jobs.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1">
                    {[
                      { id: "all", label: "All", count: jobs.length },
                      { id: "posted", label: "Posted", count: jobs.filter(j => j.status === "posted").length },
                      { id: "filled", label: "Filled", count: jobs.filter(j => j.status === "filled").length },
                      { id: "closed", label: "Closed", count: jobs.filter(j => j.status === "closed").length },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setJobTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          jobTab === tab.id
                            ? "bg-signal-orange/10 text-signal-orange border border-signal-orange/20"
                            : "text-aluminum/60 hover:text-aluminum/60"
                        }`}>
                        {tab.label}
                        {tab.count > 0 && <span className="ml-1 text-[9px] opacity-60">{tab.count}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                    placeholder="Search jobs by title, role, or city..."
                    className="w-full px-4 py-2.5 pl-9 bg-deep-stage/40 border border-ink/[0.04] rounded-lg text-sm text-house-lights outline-none focus:border-signal-orange/20 transition-colors" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-aluminum/35 text-sm"></span>
                </div>
              </div>
            )}

            {/* Job cards */}
            {jobsLoading ? (
              <div className="text-center py-12"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>
            ) : jobs.length === 0 && !showJobForm ? (
              <div className="text-center py-20 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
                <div className="font-heading text-lg text-aluminum/60">No jobs posted yet</div>
                <div className="text-xs text-aluminum/40 mt-1 mb-4">Post a job to find crew for your events</div>
                <button onClick={() => setShowJobForm(true)}
                  className="px-6 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors">
                  + Post First Job
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {jobs
                  .filter(j => {
                    if (jobTab !== "all" && j.status !== jobTab) return false;
                    if (jobSearch) {
                      const q = jobSearch.toLowerCase();
                      return j.title?.toLowerCase().includes(q) || j.role_id?.toLowerCase().includes(q) || j.city?.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map(job => {
                    const statusColors: Record<string, string> = { posted: "var(--color-go-green)", filled: "var(--color-cue-blue)", closed: "var(--color-aluminum)", draft: "var(--color-standby-amber)" };
                    const color = statusColors[job.status] || "var(--color-aluminum)";
                    const roleLabel = ROLE_OPTIONS.find(r => r.value === job.role_id)?.label || job.role_id;
                    const payLabel = job.pay_min || job.pay_max
                      ? `$${job.pay_min || "?"}–$${job.pay_max || "?"}/${job.pay_type === "hourly" ? "hr" : job.pay_type === "salary" ? "yr" : "day"}`
                      : null;

                    return (
                      <Link key={job.id} href={`/jobs/${job.id}`}
                        className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 hover:border-signal-orange/15 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-heading text-base font-bold group-hover:text-signal-orange transition-colors leading-tight pr-2">{job.title}</h3>
                          <span className="flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                            style={{ color, background: `${color}10`, border: `1px solid ${color}25` }}>
                            {job.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-aluminum/60 mb-3 flex flex-wrap gap-x-2">
                          <span>{roleLabel}</span>
                          <span>· {job.city}</span>
                          <span>· {job.employment_type === "full-time" ? "Full-Time" : job.employment_type === "part-time" ? "Part-Time" : "Contract"}</span>
                        </div>
                        {payLabel && (
                          <div className="inline-flex items-center px-2 py-0.5 bg-signal-orange/[0.06] border border-signal-orange/15 rounded text-[10px] font-mono text-signal-orange mb-3">
                            {payLabel}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] text-aluminum/40 font-mono">
                            Posted {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {job.status === "posted" && (
                            <div className="flex gap-1">
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeJob(job.id, "filled"); }}
                                className="px-2 py-1 text-[9px] font-mono text-go-green/70 hover:text-go-green border border-go-green/15 hover:border-go-green/30 rounded transition-all">
                                Mark Filled
                              </button>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeJob(job.id, "closed"); }}
                                className="px-2 py-1 text-[9px] font-mono text-aluminum/40 hover:text-aluminum border border-ink/[0.04] hover:border-white/10 rounded transition-all">
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}

            {/* Free posts remaining */}
            {jobs.length > 0 && (
              <div className="mt-4 text-center">
                <span className="text-[10px] text-aluminum/40 font-mono">
                  {Math.max(0, 3 - jobs.filter(j => j.status !== "draft").length)} of 3 free posts remaining
                </span>
              </div>
            )}
          </>
        )}
    </main>
  );
}