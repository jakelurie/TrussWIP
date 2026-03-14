"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS } from "@/lib/taxonomy";
import BookingModal from "@/components/BookingModal";

const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];
const TIER_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "#9B59B6", "var(--color-signal-orange)", "var(--color-standby-amber)"];

// Build label map from taxonomy
const ROLE_LABEL_MAP = new Map(
  DEPARTMENTS.flatMap((dept) =>
    dept.roles.map((role) => [role.shortName, role.name])
  )
);

interface TechResult {
  id: string;
  user_id: string;
  primary_skill: string;
  skills: string[];
  gear: string[];
  bio: string;
  years_experience: number;
  hourly_rate: number;
  skill_rates?: Record<string, number>;
  available: boolean;
  level: number;
  completed_gigs: number;
  avg_rating: number;
  review_count: number;
  has_insurance: boolean;
  profiles: {
    display_name: string;
    city: string;
    cities?: string[];
    avatar_url: string;
    is_verified: boolean;
    identity_verified?: boolean;
  };
}

interface TechFinderDrawerProps {
  projectId: string;
  projectName: string;
  roleId: string;
  skill: string;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export default function TechFinderDrawer({
  projectId,
  projectName,
  roleId,
  skill,
  onClose,
  onBookingSuccess,
}: TechFinderDrawerProps) {
  const [techs, setTechs] = useState<TechResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [bookingTarget, setBookingTarget] = useState<{
    techId: string;
    techName: string;
    techRate: number;
    techSkillRates?: Record<string, number>;
  } | null>(null);
  const [pastCrewIds, setPastCrewIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTechs();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const loadTechs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id || null;

    const { data } = await supabase
      .from("tech_profiles")
      .select(`
        *,
        profiles!tech_profiles_user_id_fkey (
          display_name,
          city,
          cities,
          avatar_url,
          is_verified,
          identity_verified
        )
      `)
      .gt("profile_complete", 0);

    if (data) {
      setTechs(data as unknown as TechResult[]);
    }

    // Load past crew and favorites for this producer
    if (uid) {
      const { data: pastBookings } = await supabase
        .from("bookings")
        .select("tech_id")
        .eq("producer_id", uid)
        .in("status", ["accepted", "confirmed", "paid", "completed"]);
      if (pastBookings) {
        setPastCrewIds(new Set(pastBookings.map(b => b.tech_id)));
      }

      const { data: favs } = await supabase
        .from("favorites")
        .select("tech_id")
        .eq("producer_id", uid);
      if (favs) {
        setFavoriteIds(new Set(favs.map(f => f.tech_id)));
      }
    }

    setLoading(false);
  };

  const [filterGroup, setFilterGroup] = useState<"all" | "crew" | "saved">("all");

  const toggleFavorite = async (techUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    if (favoriteIds.has(techUserId)) {
      await supabase.from("favorites").delete().eq("producer_id", uid).eq("tech_id", techUserId);
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(techUserId); return next; });
    } else {
      await supabase.from("favorites").insert({ producer_id: uid, tech_id: techUserId });
      setFavoriteIds(prev => new Set(prev).add(techUserId));
    }
  };

  const filtered = techs
    .filter((t) => {
      // Must have the skill for this role
      if (!t.skills?.includes(skill) && t.primary_skill !== skill) return false;
      if (onlyAvailable && !t.available) return false;
      if (filterGroup === "crew" && !pastCrewIds.has(t.user_id)) return false;
      if (filterGroup === "saved" && !favoriteIds.has(t.user_id)) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = t.profiles?.display_name?.toLowerCase() || "";
        const cityMatch =
          t.profiles?.cities?.some((c) => c.toLowerCase().includes(q)) ||
          t.profiles?.city?.toLowerCase().includes(q);
        const gearMatch = t.gear?.some((g) => g.toLowerCase().includes(q));
        if (!name.includes(q) && !cityMatch && !gearMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Primary: past crew first, then favorites, then everyone else
      const aGroup = pastCrewIds.has(a.user_id) ? 0 : favoriteIds.has(a.user_id) ? 1 : 2;
      const bGroup = pastCrewIds.has(b.user_id) ? 0 : favoriteIds.has(b.user_id) ? 1 : 2;
      if (aGroup !== bGroup) return aGroup - bGroup;

      // Secondary: selected sort within each group
      if (sortBy === "rating") return (b.avg_rating || 0) - (a.avg_rating || 0);
      if (sortBy === "rate_low") return (a.hourly_rate || 0) - (b.hourly_rate || 0);
      if (sortBy === "rate_high") return (b.hourly_rate || 0) - (a.hourly_rate || 0);
      if (sortBy === "experience") return (b.years_experience || 0) - (a.years_experience || 0);
      return 0;
    });

  // Pre-compute group counts for headers and filter buttons
  const crewResults = filtered.filter(t => pastCrewIds.has(t.user_id));
  const savedResults = filtered.filter(t => favoriteIds.has(t.user_id) && !pastCrewIds.has(t.user_id));
  const otherResults = filtered.filter(t => !pastCrewIds.has(t.user_id) && !favoriteIds.has(t.user_id));

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getHue = (name: string) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
  };

  const roleLabel = ROLE_LABEL_MAP.get(skill) || skill;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-blackout border-l border-ink/[0.06] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-heading text-lg font-bold tracking-wide">
              Find <span className="text-signal-orange">{skill}</span>
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-aluminum hover:text-house-lights transition-colors rounded-lg hover:bg-ink/[0.04]"
            >
              ✕
            </button>
          </div>
          <div className="text-[11px] font-mono text-aluminum/60">
            {roleLabel} for {projectName}
          </div>

          {/* Search + filters */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, city, gear..."
                className="w-full pl-3 pr-3 py-2 bg-deep-stage border border-ink/[0.06] rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-deep-stage border border-ink/[0.06] rounded-lg text-house-lights text-xs outline-none appearance-none cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Experience</option>
              <option value="rate_low">Rate: Low-High</option>
              <option value="rate_high">Rate: High-Low</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                onlyAvailable
                  ? "bg-go-green/15 text-go-green border border-go-green/30"
                  : "bg-deep-stage text-aluminum border border-ink/[0.06] hover:border-white/10"
              }`}
            >
              Available Now
            </button>
            {pastCrewIds.size > 0 && (
              <button
                onClick={() => setFilterGroup(filterGroup === "crew" ? "all" : "crew")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                  filterGroup === "crew"
                    ? "bg-signal-orange/15 text-signal-orange border border-signal-orange/30"
                    : "bg-deep-stage text-aluminum border border-ink/[0.06] hover:border-white/10"
                }`}
              >
                Your Crew
              </button>
            )}
            {favoriteIds.size > 0 && (
              <button
                onClick={() => setFilterGroup(filterGroup === "saved" ? "all" : "saved")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                  filterGroup === "saved"
                    ? "bg-cue-blue/15 text-cue-blue border border-cue-blue/30"
                    : "bg-deep-stage text-aluminum border border-ink/[0.06] hover:border-white/10"
                }`}
              >
                Saved
              </button>
            )}
            <div className="ml-auto text-[10px] font-mono text-aluminum/50 self-center">
              {filtered.length} match{filtered.length !== 1 ? "es" : ""}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-sm text-aluminum mb-1">
                No {skill} techs found
              </div>
              <p className="text-[11px] text-aluminum/50">
                {search
                  ? "Try a different search."
                  : `More ${skill} techs are joining every day.`}
              </p>
            </div>
          ) : (
            <div>
              {/* Render grouped sections */}
              {[
                { key: "crew", label: "Your Crew", items: crewResults, color: "text-signal-orange/70" },
                { key: "saved", label: "Saved", items: savedResults, color: "text-cue-blue/70" },
                { key: "all", label: `All ${skill} Techs`, items: otherResults, color: "text-aluminum/40" },
              ].map(({ key, label, items, color }) => {
                if (items.length === 0) return null;
                const showHeader = filterGroup === "all" && (crewResults.length > 0 || savedResults.length > 0);
                return (
                  <div key={key}>
                    {showHeader && (
                      <div className="px-5 py-2 bg-deep-stage/60 border-b border-ink/[0.04] flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${color}`}>{label}</span>
                        <span className="text-[9px] font-mono text-aluminum/30">{items.length}</span>
                      </div>
                    )}
                    {items.map((tech) => {
                      const name = tech.profiles?.display_name || "Unknown";
                      const techCities = tech.profiles?.cities?.length
                        ? tech.profiles.cities
                        : tech.profiles?.city
                        ? [tech.profiles.city]
                        : [];
                      const primaryCity = techCities[0] || "";
                      const avatarUrl = tech.profiles?.avatar_url;
                      const hue = getHue(name);
                      const lvl = tech.level || 0;
                      const rate = tech.skill_rates?.[skill] || tech.hourly_rate || 0;
                      const isCrew = pastCrewIds.has(tech.user_id);
                      const isFav = favoriteIds.has(tech.user_id);

                      return (
                        <div key={tech.id} className="px-5 py-4 hover:bg-deep-stage/60 transition-colors border-b border-ink/[0.03]">
                          <div className="flex gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-xs"
                                  style={{ background: `hsl(${hue}, 40%, 25%)` }}
                                >
                                  {getInitials(name)}
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <a
                                  href={`/profile/${tech.user_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-heading text-sm font-semibold truncate hover:text-signal-orange transition-colors"
                                >
                                  {name}
                                </a>
                                {tech.profiles?.is_verified && (
                                  <span className="px-1 py-0.5 bg-signal-orange text-white text-[8px] font-mono font-semibold rounded">V</span>
                                )}
                                {tech.profiles?.identity_verified && (
                                  <span className="px-1 py-0.5 bg-go-green/15 text-go-green text-[8px] font-mono font-semibold rounded border border-go-green/25">ID</span>
                                )}
                                {tech.available && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-go-green flex-shrink-0" />
                                )}
                                {isCrew && (
                                  <span className="px-1.5 py-0.5 bg-signal-orange/10 text-signal-orange text-[8px] font-mono font-semibold rounded border border-signal-orange/20">CREW</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-aluminum">
                                {lvl > 0 && (
                                  <span
                                    className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                                    style={{ color: TIER_COLORS[lvl], background: `${TIER_COLORS[lvl]}15` }}
                                  >
                                    {TIER_NAMES[lvl]}
                                  </span>
                                )}
                                {primaryCity && <span>{primaryCity}</span>}
                                {tech.years_experience > 0 && <span>{tech.years_experience}y</span>}
                                {tech.completed_gigs > 0 && <span>{tech.completed_gigs} gigs</span>}
                              </div>

                              {/* Rating + rate row */}
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} style={{ color: i < Math.floor(tech.avg_rating || 0) ? "var(--color-standby-amber)" : "#333", fontSize: "10px" }}>★</span>
                                  ))}
                                  {tech.avg_rating > 0 && (
                                    <span className="font-mono text-[10px] text-house-lights ml-0.5">{tech.avg_rating}</span>
                                  )}
                                  {tech.review_count > 0 && (
                                    <span className="font-mono text-[9px] text-aluminum">({tech.review_count})</span>
                                  )}
                                </div>
                                {rate > 0 && (
                                  <span className="font-mono text-sm font-semibold">
                                    ${rate}<span className="text-[10px] text-aluminum">/hr</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-center gap-2 self-center flex-shrink-0">
                              <button
                                onClick={() => setBookingTarget({
                                  techId: tech.user_id,
                                  techName: name,
                                  techRate: rate,
                                  techSkillRates: tech.skill_rates,
                                })}
                                className="px-4 py-2 bg-signal-orange text-white text-xs font-heading font-bold tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-all"
                              >
                                Book
                              </button>
                              <button
                                onClick={() => toggleFavorite(tech.user_id)}
                                className={`text-[10px] font-mono transition-colors ${
                                  isFav ? "text-cue-blue hover:text-aluminum/60" : "text-aluminum/30 hover:text-cue-blue"
                                }`}
                                title={isFav ? "Remove from saved" : "Save"}
                              >
                                {isFav ? "Saved" : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink/[0.06] flex-shrink-0">
          <a
            href={`/browse?skill=${encodeURIComponent(skill)}&project=${projectId}&role=${roleId}`}
            className="text-[10px] font-mono text-aluminum/50 hover:text-signal-orange transition-colors"
          >
            Open full browse page →
          </a>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingTarget && (
        <BookingModal
          techId={bookingTarget.techId}
          techName={bookingTarget.techName}
          techRate={bookingTarget.techRate}
          techSkillRates={bookingTarget.techSkillRates}
          prefillProjectId={projectId}
          prefillRoleId={roleId}
          onClose={() => setBookingTarget(null)}
          onSuccess={() => {
            setBookingTarget(null);
            onBookingSuccess();
          }}
        />
      )}
    </>
  );
}
