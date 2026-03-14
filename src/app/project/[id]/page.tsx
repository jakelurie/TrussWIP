"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BulkBookingModal from "@/components/BulkBookingModal";
import TechFinderDrawer from "@/components/TechFinderDrawer";
import BookingModal from "@/components/BookingModal";
import ProjectFilesTab from "@/components/ProjectFilesTab";
import { DEPARTMENTS } from "@/lib/taxonomy";

const LEVEL_NAMES = ["Rookie", "Technician", "Specialist", "Expert", "Elite"];
const LEVEL_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "#9B59B6", "var(--color-signal-orange)", "var(--color-standby-amber)"];
const LEVEL_ICONS = ["I", "II", "III", "IV", "V"];
const SHORT_LABEL_ROLES = new Set(["A1", "A2", "V1", "V2", "L1", "L2", "TD", "PM"]);
const ROLE_OPTIONS = DEPARTMENTS.flatMap((dept) =>
  dept.roles.map((role) => ({
    value: role.shortName,
    label: SHORT_LABEL_ROLES.has(role.shortName)
      ? `${role.shortName} — ${role.name.replace(` (${role.shortName})`, "")}`
      : role.name,
  }))
);

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newSkill, setNewSkill] = useState("A1");
  const [newQty, setNewQty] = useState(1);
  const [showBulkBooking, setShowBulkBooking] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [finderDrawer, setFinderDrawer] = useState<{ roleId: string; skill: string } | null>(null);
  const [inviteSearch, setInviteSearch] = useState<Record<string, string>>({});
  const [inviteResults, setInviteResults] = useState<Record<string, any[]>>({});
  const [inviteNoResults, setInviteNoResults] = useState<Record<string, boolean>>({});
  const [inviteBooking, setInviteBooking] = useState<{
    roleId: string;
    techId: string;
    techName: string;
    techRate: number;
    techSkillRates?: Record<string, number>;
  } | null>(null);
  const searchTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const [allTechs, setAllTechs] = useState<any[] | null>(null);
  const [pastCrewIds, setPastCrewIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"crew" | "files">("crew");
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    // Load project
    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!proj) { router.push("/projects"); return; }
    setProject(proj);

    // Load roles
    const { data: r } = await supabase
      .from("project_roles")
      .select("*")
      .eq("project_id", params.id);
    setRoles(r || []);

    // Load bookings with tech profiles
    const { data: b } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles!bookings_tech_id_fkey (display_name, city, avatar_url),
        tech_profiles:tech_id (hourly_rate, level, primary_skill)
      `)
      .eq("project_id", params.id)
      .order("created_at", { ascending: false });
    setBookings(b || []);

    // Load past crew and favorites for invite badges
    const { data: pastBookings } = await supabase
      .from("bookings")
      .select("tech_id")
      .eq("producer_id", session.user.id)
      .in("status", ["accepted", "confirmed", "paid", "completed"]);
    if (pastBookings) setPastCrewIds(new Set(pastBookings.map(pb => pb.tech_id)));

    const { data: favs } = await supabase
      .from("favorites")
      .select("tech_id")
      .eq("producer_id", session.user.id);
    if (favs) setFavoriteIds(new Set(favs.map(f => f.tech_id)));

    // Load file count for tab badge
    const { count: fc } = await supabase
      .from("project_files")
      .select("id", { count: "exact", head: true })
      .eq("project_id", params.id as string);
    setFileCount(fc || 0);

    setLoading(false);
  };

  const addRole = async () => {
    if (!project) return;
    await supabase.from("project_roles").insert({
      project_id: project.id,
      skill: newSkill,
      quantity: newQty,
      filled: 0,
    });
    setShowAddRole(false);
    setNewSkill("A1");
    setNewQty(1);
    loadData();
  };

  const deleteRole = async (roleId: string) => {
    await supabase.from("project_roles").delete().eq("id", roleId);
    setConfirmDeleteId(null);
    loadData();
  };

  const handleInviteSearch = (roleId: string, roleSkill: string, query: string) => {
    setInviteSearch(prev => ({ ...prev, [roleId]: query }));
    setInviteNoResults(prev => ({ ...prev, [roleId]: false }));
    if (searchTimeouts.current[roleId]) clearTimeout(searchTimeouts.current[roleId]);
    if (query.length < 2) {
      setInviteResults(prev => ({ ...prev, [roleId]: [] }));
      return;
    }
    searchTimeouts.current[roleId] = setTimeout(async () => {
      // Lazy-load all techs once, then filter client-side
      let techs = allTechs;
      if (!techs) {
        const { data } = await supabase
          .from("tech_profiles")
          .select(`
            user_id, hourly_rate, skill_rates, primary_skill, skills,
            profiles!tech_profiles_user_id_fkey (display_name, city, avatar_url)
          `)
          .gt("profile_complete", 0);
        techs = data || [];
        setAllTechs(techs);
      }

      // Get tech IDs already booked for this role (active bookings)
      const bookedTechIds = new Set(
        bookings
          .filter(b => b.project_role_id === roleId && !["declined", "cancelled"].includes(b.status))
          .map(b => b.tech_id)
      );

      const q = query.toLowerCase();
      const matches = techs
        .filter((t: any) =>
          t.profiles?.display_name?.toLowerCase().includes(q) &&
          !bookedTechIds.has(t.user_id)
        )
        .sort((a: any, b: any) => {
          // Skill match first
          const aMatch = (a.skills?.includes(roleSkill) || a.primary_skill === roleSkill) ? 0 : 1;
          const bMatch = (b.skills?.includes(roleSkill) || b.primary_skill === roleSkill) ? 0 : 1;
          if (aMatch !== bMatch) return aMatch - bMatch;
          // Then past crew, then favorites
          const aGroup = pastCrewIds.has(a.user_id) ? 0 : favoriteIds.has(a.user_id) ? 1 : 2;
          const bGroup = pastCrewIds.has(b.user_id) ? 0 : favoriteIds.has(b.user_id) ? 1 : 2;
          return aGroup - bGroup;
        })
        .slice(0, 6);

      setInviteResults(prev => ({ ...prev, [roleId]: matches }));
      setInviteNoResults(prev => ({ ...prev, [roleId]: matches.length === 0 }));
    }, 300);
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getBookingsForRole = (roleId: string) => {
    return bookings.filter(b => b.project_role_id === roleId);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  };

  const getHue = (name: string) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
  };

  const statusColors: any = {
    pending: "var(--color-standby-amber)",
    accepted: "var(--color-cue-blue)",
    confirmed: "var(--color-go-green)",
    paid: "var(--color-go-green)",
    declined: "#FF3D00",
    completed: "#9B59B6",
    cancelled: "var(--color-aluminum)",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading project...</span>
      </div>
    );
  }

  if (!project) return null;

  const totalSlots = roles.reduce((a: number, r: any) => a + (r.quantity || 0), 0);
  const filledSlots = roles.reduce((a: number, r: any) => a + (r.filled || 0), 0);

  return (
    <>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/projects" className="font-mono text-xs text-signal-orange hover:underline mb-4 inline-block">
          ← Back to projects
        </Link>

        {/* ===== HEADER ===== */}
        <div className="bg-deep-stage border border-white/5 rounded-lg p-6 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-heading text-2xl font-bold mb-1">{project.name}</h1>
              <div className="text-sm text-aluminum">
                {project.city && `${project.city}`}
                {project.venue && ` · ${project.venue}`}
              </div>
              {(project.start_date || project.end_date) && (
                <div className="text-sm text-aluminum mt-1">
                  {formatDate(project.start_date)}
                  {project.end_date && project.end_date !== project.start_date && ` – ${formatDate(project.end_date)}`}
                </div>
              )}
              {project.notes && (
                <p className="text-xs text-aluminum/60 mt-2 max-w-lg">{project.notes}</p>
              )}
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-medium">
                {filledSlots}<span className="text-aluminum">/{totalSlots}</span>
              </div>
              <div className="font-mono text-[10px] text-aluminum">CREW FILLED</div>
              {totalSlots > 0 && (
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 ml-auto">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0}%`,
                      background: filledSlots === totalSlots ? "var(--color-go-green)" : "var(--color-signal-orange)"
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-ink/[0.04] flex gap-2">
            {bookings.length > 0 && (
              <Link href={`/crew/${params.id}`}
                className="px-4 py-2 bg-signal-orange/10 text-signal-orange text-xs font-mono rounded-lg border border-signal-orange/20 hover:bg-signal-orange/15 transition-all">
                View Crew Sheet
              </Link>
            )}
            {filledSlots < totalSlots && roles.length > 0 && (
              <button onClick={() => setShowBulkBooking(true)}
                className="px-4 py-2 bg-signal-orange text-white text-xs font-heading font-bold tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-all">
                Fill All Roles
              </button>
            )}
          </div>
        </div>

        {/* ===== TAB BAR ===== */}
        <div className="flex gap-0 mb-4 border-b border-white/5">
          <button
            onClick={() => setActiveTab("crew")}
            className={`px-5 py-3 text-xs font-heading font-semibold tracking-widest uppercase border-b-2 transition-all ${
              activeTab === "crew"
                ? "border-signal-orange text-signal-orange"
                : "border-transparent text-aluminum hover:text-house-lights"
            }`}
          >
            Crew
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`px-5 py-3 text-xs font-heading font-semibold tracking-widest uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "files"
                ? "border-signal-orange text-signal-orange"
                : "border-transparent text-aluminum hover:text-house-lights"
            }`}
          >
            Files
            {fileCount > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-signal-orange/10 text-signal-orange">
                {fileCount}
              </span>
            )}
          </button>
        </div>

        {/* ===== FILES TAB ===== */}
        {activeTab === "files" && project && (
          <ProjectFilesTab
            projectId={project.id}
            projectName={project.name}
            onFileCountChange={setFileCount}
          />
        )}

        {/* ===== ROLES ===== */}
        {activeTab === "crew" && (<>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-signal-orange">Crew Roles</h2>
          <button
            onClick={() => setShowAddRole(!showAddRole)}
            className="text-xs font-mono text-signal-orange hover:underline"
          >
            {showAddRole ? "Cancel" : "+ Add Role"}
          </button>
        </div>

        {/* Add role form */}
        {showAddRole && (
          <div className="bg-deep-stage border border-signal-orange/15 rounded-lg p-4 mb-3 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-aluminum tracking-wider uppercase mb-1">Role</label>
              <select
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                className="w-full px-3 py-2.5 bg-blackout border border-signal-orange/10 rounded-lg text-sm text-house-lights outline-none appearance-none"
              >
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-[10px] font-mono text-aluminum tracking-wider uppercase mb-1">Qty</label>
              <input
                type="number"
                value={newQty}
                onChange={e => setNewQty(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2.5 bg-blackout border border-signal-orange/10 rounded-lg text-sm text-house-lights text-center outline-none"
              />
            </div>
            <button
              onClick={addRole}
              className="px-5 py-2.5 bg-signal-orange text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-orange-600"
            >
              Add
            </button>
          </div>
        )}

        {/* Role slots */}
        {roles.length === 0 ? (
          <div className="text-center py-12 bg-deep-stage rounded-lg mb-4 border border-dashed border-white/10">
            <div className="text-sm text-aluminum mb-1">No roles added yet</div>
            <p className="text-[11px] text-aluminum/50 mb-3">Add crew roles, then find techs to fill them</p>
            <button onClick={() => setShowAddRole(true)} className="px-4 py-2 bg-signal-orange/10 text-signal-orange text-xs font-mono rounded-lg border border-signal-orange/20 hover:bg-signal-orange/20 transition-colors">
              + Add your first role
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {roles.map((role: any) => {
              const roleBookings = getBookingsForRole(role.id);
              const activeBookings = roleBookings.filter((b: any) => !["declined", "cancelled"].includes(b.status));
              const declinedBookings = roleBookings.filter((b: any) => b.status === "declined" || b.status === "cancelled");
              const emptySlots = Math.max(0, role.quantity - activeBookings.length);

              // Status summary counts
              const statusCounts: Record<string, number> = {};
              roleBookings.forEach((b: any) => {
                statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
              });

              return (
                <div key={role.id} className="bg-deep-stage border border-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-semibold">{role.skill}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                        role.filled >= role.quantity
                          ? "text-go-green bg-go-green/8"
                          : "text-aluminum bg-white/3"
                      }`}>
                        {role.filled}/{role.quantity} filled
                      </span>
                      {/* Inline status summary */}
                      {roleBookings.length > 0 && (
                        <div className="flex items-center gap-1">
                          {Object.entries(statusCounts).map(([status, count]) => (
                            <span
                              key={status}
                              className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                              style={{
                                color: statusColors[status] || "var(--color-aluminum)",
                                background: `${statusColors[status] || "var(--color-aluminum)"}10`,
                              }}
                            >
                              {count} {status}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {confirmDeleteId === role.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-aluminum">Delete this role?</span>
                        <button
                          onClick={() => deleteRole(role.id)}
                          className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] font-mono text-aluminum hover:text-house-lights transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(role.id)}
                        className="text-[10px] text-red-400/40 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Quick invite by name */}
                  {emptySlots > 0 && (
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={inviteSearch[role.id] || ""}
                        onChange={e => handleInviteSearch(role.id, role.skill, e.target.value)}
                        onBlur={() => setTimeout(() => {
                          setInviteResults(prev => ({ ...prev, [role.id]: [] }));
                          setInviteNoResults(prev => ({ ...prev, [role.id]: false }));
                        }, 200)}
                        placeholder="Invite by name..."
                        className="w-full px-3 py-2 bg-blackout border border-ink/[0.04] rounded-lg text-xs text-house-lights outline-none focus:border-signal-orange/20 transition-colors placeholder:text-aluminum/30"
                      />
                      {(inviteResults[role.id]?.length > 0 || inviteNoResults[role.id]) && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-blackout border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                          {inviteNoResults[role.id] ? (
                            <div className="px-3 py-3 text-center text-[11px] text-aluminum/50">
                              No techs found matching "{inviteSearch[role.id]}"
                            </div>
                          ) : (
                            inviteResults[role.id].map((tech: any) => {
                              const techName = tech.profiles?.display_name || "Unknown";
                              const avatarUrl = tech.profiles?.avatar_url;
                              const hue = getHue(techName);
                              const hasSkill = tech.skills?.includes(role.skill) || tech.primary_skill === role.skill;
                              const isCrew = pastCrewIds.has(tech.user_id);
                              const isFav = favoriteIds.has(tech.user_id);
                              const rate = tech.skill_rates?.[role.skill] || tech.hourly_rate || 0;

                              return (
                                <button
                                  key={tech.user_id}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setInviteBooking({
                                      roleId: role.id,
                                      techId: tech.user_id,
                                      techName,
                                      techRate: rate,
                                      techSkillRates: tech.skill_rates,
                                    });
                                    setInviteSearch(prev => ({ ...prev, [role.id]: "" }));
                                    setInviteResults(prev => ({ ...prev, [role.id]: [] }));
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-deep-stage/60 transition-colors text-left"
                                >
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt={techName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div
                                      className="w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-[10px] flex-shrink-0"
                                      style={{ background: `hsl(${hue}, 40%, 25%)` }}
                                    >
                                      {getInitials(techName)}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-semibold truncate">{techName}</span>
                                      {isCrew && (
                                        <span className="px-1 py-0.5 bg-signal-orange/10 text-signal-orange text-[7px] font-mono font-semibold rounded border border-signal-orange/20">CREW</span>
                                      )}
                                      {isFav && !isCrew && (
                                        <span className="px-1 py-0.5 bg-cue-blue/10 text-cue-blue text-[7px] font-mono font-semibold rounded border border-cue-blue/20">SAVED</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-aluminum">
                                      {tech.profiles?.city && <span>{tech.profiles.city}</span>}
                                      {rate > 0 && <span>· ${rate}/hr</span>}
                                      {!hasSkill && (
                                        <span className="text-standby-amber/70">· No {role.skill} listed</span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono text-signal-orange flex-shrink-0">Invite</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active bookings */}
                  <div className="space-y-2">
                    {activeBookings.map((booking: any) => {
                      const techName = booking.profiles?.display_name || "Unknown";
                      const hue = getHue(techName);
                      const techData = Array.isArray(booking.tech_profiles) ? booking.tech_profiles[0] : booking.tech_profiles;
                      const lvl = techData?.level || 0;

                      return (
                        <div key={booking.id} className="flex items-center justify-between bg-blackout rounded-lg px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-xs font-bold"
                              style={{ background: `hsl(${hue}, 40%, 25%)` }}
                            >
                              {getInitials(techName)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link href={`/profile/${booking.tech_id}`} className="text-sm font-semibold hover:text-signal-orange transition-colors">
                                  {techName}
                                </Link>
                                <span
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ color: LEVEL_COLORS[lvl], background: `${LEVEL_COLORS[lvl]}15` }}
                                >
                                  {LEVEL_ICONS[lvl]} {LEVEL_NAMES[lvl]}
                                </span>
                              </div>
                              <div className="text-[10px] text-aluminum">
                                ${booking.rate}/hr · ${booking.total_amount?.toLocaleString() || "—"}
                              </div>
                            </div>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
                            style={{
                              color: statusColors[booking.status] || "var(--color-aluminum)",
                              background: `${statusColors[booking.status] || "var(--color-aluminum)"}15`,
                              border: `1px solid ${statusColors[booking.status] || "var(--color-aluminum)"}30`,
                            }}
                          >
                            {booking.status}
                          </span>
                        </div>
                      );
                    })}

                    {/* Declined/cancelled bookings — collapsed, muted */}
                    {declinedBookings.length > 0 && (
                      <details className="group">
                        <summary className="text-[10px] font-mono text-aluminum/40 cursor-pointer hover:text-aluminum/60 transition-colors py-1">
                          {declinedBookings.length} declined/cancelled
                        </summary>
                        <div className="space-y-1 mt-1">
                          {declinedBookings.map((booking: any) => {
                            const techName = booking.profiles?.display_name || "Unknown";
                            return (
                              <div key={booking.id} className="flex items-center justify-between bg-blackout/50 rounded-lg px-3 py-2 opacity-50">
                                <span className="text-xs text-aluminum">{techName}</span>
                                <span
                                  className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase"
                                  style={{
                                    color: statusColors[booking.status] || "var(--color-aluminum)",
                                    background: `${statusColors[booking.status] || "var(--color-aluminum)"}15`,
                                  }}
                                >
                                  {booking.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    )}

                    {/* Empty slots */}
                    {[...Array(emptySlots)].map((_, i) => (
                      <button
                        key={`empty-${i}`}
                        onClick={() => setFinderDrawer({ roleId: role.id, skill: role.skill })}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-standby-amber/20 rounded-lg text-standby-amber text-xs font-mono hover:bg-standby-amber/5 transition-colors"
                      >
                        + Find {role.skill}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>)}
      </main>

      {showBulkBooking && project && (
        <BulkBookingModal
          projectId={project.id}
          projectName={project.name}
          roles={roles}
          onClose={() => setShowBulkBooking(false)}
          onSuccess={() => { setShowBulkBooking(false); loadData(); }}
        />
      )}

      {finderDrawer && project && (
        <TechFinderDrawer
          projectId={project.id}
          projectName={project.name}
          roleId={finderDrawer.roleId}
          skill={finderDrawer.skill}
          onClose={() => setFinderDrawer(null)}
          onBookingSuccess={() => {
            loadData();
          }}
        />
      )}

      {inviteBooking && project && (
        <BookingModal
          techId={inviteBooking.techId}
          techName={inviteBooking.techName}
          techRate={inviteBooking.techRate}
          techSkillRates={inviteBooking.techSkillRates}
          prefillProjectId={project.id}
          prefillRoleId={inviteBooking.roleId}
          onClose={() => setInviteBooking(null)}
          onSuccess={() => {
            setInviteBooking(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
