"use client";

import { Suspense as ReactSuspense, useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFavorites } from "@/lib/useFavorites";
import { DEPARTMENTS } from "@/lib/taxonomy";
import BookingModal from "@/components/BookingModal";

const TechMapView = lazy(() => import("@/components/TechMapView"));

// Roles that commonly go by their shorthand in the industry
const SHORT_LABEL_ROLES = new Set(["A1", "A2", "V1", "V2", "L1", "L2", "TD", "PM"]);

// Build role lookup: shortName → { label for display, department name }
const ROLE_OPTIONS = DEPARTMENTS.flatMap((dept) =>
  dept.roles.map((role) => ({
    shortName: role.shortName,
    label: SHORT_LABEL_ROLES.has(role.shortName)
      ? `${role.shortName} — ${role.name.replace(` (${role.shortName})`, "")}`
      : role.name,
    deptName: dept.name,
    deptId: dept.id,
  }))
);

const ROLE_LABEL_MAP = new Map(ROLE_OPTIONS.map((r) => [r.shortName, r.label]));
const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];
const TIER_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "#9B59B6", "var(--color-signal-orange)", "var(--color-standby-amber)"];

interface TechWithProfile {
  id: string;
  user_id: string;
  primary_skill: string;
  skills: string[];
  specializations: string[];
  certifications: string[];
  gear: string[];
  bio: string;
  years_experience: number;
  hourly_rate: number;
  skill_rates?: Record<string, number>;
  available: boolean;
  level: number;
  xp: number;
  completed_gigs: number;
  avg_rating: number;
  review_count: number;
  profile_complete: number;
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

export default function BrowseWrapper() {
  return (
    <ReactSuspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading...</span>
      </div>
    }>
      <Browse />
    </ReactSuspense>
  );
}

function Browse() {
  const searchParams = useSearchParams();
  const projectContextId = searchParams.get("project") || null;
  const roleContextId = searchParams.get("role") || null;
  const skillParam = searchParams.get("skill") || null;

  const [techs, setTechs] = useState<TechWithProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [skillFilters, setSkillFilters] = useState<string[]>(skillParam ? [skillParam] : []);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState("rating");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyInsured, setOnlyInsured] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [savedSearch, setSavedSearch] = useState(false);
  const [specFilters, setSpecFilters] = useState<string[]>([]);
  const [specSearch, setSpecSearch] = useState("");
  const [specDropdownOpen, setSpecDropdownOpen] = useState(false);
  const specDropdownRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [smartQuery, setSmartQuery] = useState("");
  const [smartSearching, setSmartSearching] = useState(false);
  const [smartParsed, setSmartParsed] = useState<any>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ techId: string; techName: string; techRate: number; techSkillRates?: Record<string, number> } | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites(userId);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadUser();
    if (projectContextId) loadProjectName();
  }, []);

  // Fetch techs from API whenever filters change
  const fetchTechs = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (skillFilters.length > 0) params.set("skills", skillFilters.join(","));
    if (specFilters.length > 0) params.set("specs", specFilters.join(","));
    params.set("sort", sortBy);
    if (onlyAvailable) params.set("available", "true");
    if (onlyInsured) params.set("insured", "true");
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (smartParsed?.maxRate) params.set("max_rate", String(smartParsed.maxRate));
    if (smartParsed?.minRate) params.set("min_rate", String(smartParsed.minRate));
    params.set("limit", "30");
    params.set("offset", append ? String(techs.length) : "0");

    try {
      const res = await fetch(`/api/browse?${params}`);
      const data = await res.json();
      if (append) {
        setTechs(prev => [...prev, ...(data.techs || [])]);
      } else {
        setTechs(data.techs || []);
      }
      setTotal(data.total || 0);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, skillFilters, specFilters, sortBy, onlyAvailable, onlyInsured, dateFrom, dateTo, smartParsed, techs.length]);

  // Initial load + filter changes trigger fresh fetch
  useEffect(() => {
    fetchTechs(false);
  }, [debouncedSearch, skillFilters, specFilters, sortBy, onlyAvailable, onlyInsured, dateFrom, dateTo, smartParsed]);

  const loadMore = () => fetchTechs(true);
  const hasMore = techs.length < total;

  const loadProjectName = async () => {
    const { data } = await supabase.from("projects").select("name").eq("id", projectContextId).single();
    if (data) setProjectName(data.name);
  };

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single();
      setUserType(profile?.user_type || null);

      // Show onboarding guide for first-time producers
      if (profile?.user_type === "producer" && typeof window !== "undefined") {
        const dismissed = localStorage.getItem("truss_browse_guide_dismissed");
        if (!dismissed) setShowGuide(true);
      }
    }
  };

  const handleSmartSearch = async () => {
    if (!smartQuery.trim() || smartSearching) return;
    setSmartSearching(true);
    setSmartParsed(null);
    try {
      const res = await fetch("/api/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: smartQuery }),
      });
      const data = await res.json();
      if (data.filters) {
        const f = data.filters;
        setSmartParsed(f);
        if (f.roles?.length) setSkillFilters(f.roles);
        if (f.city) setSearch(f.city);
        if (f.available) setOnlyAvailable(true);
        if (f.specializations?.length) setSpecFilters(f.specializations);
        if (f.date) setDateFrom(f.date);
        if (f.searchText) setSearch(f.searchText);
        if (f.maxRate) setSortBy("rate_low");
      }
    } catch {
      // Silently fail
    } finally {
      setSmartSearching(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getHue = (name: string) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-1">
            Browse <span className="text-signal-orange">Technicians</span>
          </h1>
          <p className="text-sm text-aluminum">
            {loading ? "Loading..." : `${total} tech${total !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* First-time producer guide */}
        {showGuide && (
          <div className="bg-signal-orange/[0.04] border border-signal-orange/15 rounded-lg px-5 py-4 mb-4 flex items-start justify-between">
            <div>
              <div className="font-heading text-sm font-semibold tracking-wider uppercase mb-1.5">
                How Truss works
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-xs text-aluminum">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-signal-orange/15 text-signal-orange text-[10px] font-mono flex items-center justify-center flex-shrink-0">1</span>
                  Find a tech
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-signal-orange/15 text-signal-orange text-[10px] font-mono flex items-center justify-center flex-shrink-0">2</span>
                  View their profile
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-signal-orange/15 text-signal-orange text-[10px] font-mono flex items-center justify-center flex-shrink-0">3</span>
                  Request to book
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowGuide(false);
                localStorage.setItem("truss_browse_guide_dismissed", "1");
              }}
              className="text-aluminum/50 hover:text-aluminum text-sm ml-4 mt-0.5 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Project context banner */}
        {projectContextId && projectName && (
          <div className="bg-signal-orange/[0.04] border border-signal-orange/15 rounded-lg px-5 py-4 mb-4 flex items-start justify-between">
            <div>
              <div className="text-xs text-aluminum/60 font-mono mb-1">
                Finding crew for
              </div>
              <div className="font-heading text-sm font-semibold">
                {projectName} <span className="text-aluminum font-normal font-mono text-xs">· {skillParam || "any role"}</span>
              </div>
              <div className="text-[11px] text-aluminum/50 mt-1">
                Click <span className="text-signal-orange">Book</span> on any tech to send a booking request
              </div>
            </div>
            <Link
              href={`/project/${projectContextId}`}
              className="text-[10px] font-mono text-aluminum/50 hover:text-signal-orange transition-colors flex-shrink-0 mt-1"
            >
              ← Back to project
            </Link>
          </div>
        )}

        {/* Filter hint for producers with no filters */}
        {userType === "producer" && !projectContextId && skillFilters.length === 0 && !search && !onlyAvailable && !onlyInsured && !dateFrom && !loading && (
          <p className="text-xs text-aluminum/60 mb-3 font-mono">
            Tip: Filter by role, city, or availability to find your crew faster.
          </p>
        )}

        {/* Smart Search */}
        <div className="mb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={smartQuery}
                onChange={(e) => setSmartQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSmartSearch(); }}
                placeholder='Try: "2 A1s in San Diego under $75/hr" or "available LED tech in Vegas"'
                className="w-full px-4 py-3 bg-deep-stage border border-signal-orange/15 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/40 transition-colors placeholder:text-aluminum/30"
              />
              {smartSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={handleSmartSearch}
              disabled={smartSearching || !smartQuery.trim()}
              className="px-5 py-3 bg-signal-orange text-white font-heading font-bold text-xs tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all disabled:opacity-50 flex-shrink-0"
            >
              {smartSearching ? "Searching..." : "Smart Search"}
            </button>
          </div>
          {smartParsed && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] font-mono text-aluminum/40">Parsed:</span>
              {smartParsed.roles?.map((r: string) => (
                <span key={r} className="px-2 py-0.5 rounded bg-signal-orange/[0.08] text-signal-orange text-[10px] font-mono">{r}</span>
              ))}
              {smartParsed.city && (
                <span className="px-2 py-0.5 rounded bg-cue-blue/[0.08] text-cue-blue text-[10px] font-mono">{smartParsed.city}</span>
              )}
              {smartParsed.maxRate && (
                <span className="px-2 py-0.5 rounded bg-go-green/[0.08] text-go-green text-[10px] font-mono">Under ${smartParsed.maxRate}/hr</span>
              )}
              {smartParsed.count && (
                <span className="px-2 py-0.5 rounded bg-standby-amber/[0.08] text-standby-amber text-[10px] font-mono">{smartParsed.count} needed</span>
              )}
              {smartParsed.available && (
                <span className="px-2 py-0.5 rounded bg-go-green/[0.08] text-go-green text-[10px] font-mono">Available</span>
              )}
              {smartParsed.date && (
                <span className="px-2 py-0.5 rounded bg-standby-amber/[0.08] text-standby-amber text-[10px] font-mono">{smartParsed.date}</span>
              )}
              <button
                onClick={() => {
                  setSmartParsed(null);
                  setSmartQuery("");
                  setSkillFilters([]);
                  setSpecFilters([]);
                  setSearch("");
                  setOnlyAvailable(false);
                  setOnlyInsured(false);
                  setDateFrom("");
                  setSortBy("rating");
                }}
                className="text-[10px] font-mono text-aluminum/40 hover:text-red-400 transition-colors ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-deep-stage border border-white/5 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-aluminum text-sm">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, city, gear..."
                className="w-full pl-8 pr-4 py-2.5 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none appearance-none cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="level">Highest Level</option>
              <option value="experience">Most Experience</option>
              <option value="rate_low">Rate: Low → High</option>
              <option value="rate_high">Rate: High → Low</option>
            </select>

            {/* Available toggle */}
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-4 py-2.5 rounded-lg text-xs font-mono transition-all ${
                onlyAvailable
                  ? "bg-go-green/15 text-go-green border border-go-green/30"
                  : "bg-blackout text-aluminum border border-white/8 hover:border-white/15"
              }`}
            >
              {onlyAvailable ? "✓ Available Now" : "Available Now"}
            </button>

            <button
              onClick={() => setOnlyInsured(!onlyInsured)}
              className={`px-4 py-2.5 rounded-lg text-xs font-mono transition-all ${
                onlyInsured
                  ? "bg-cue-blue/15 text-cue-blue border border-cue-blue/30"
                  : "bg-blackout text-aluminum border border-white/8 hover:border-white/15"
              }`}
            >
              {onlyInsured ? "✓ Insured" : "Insured"}
            </button>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full mt-3 pt-3 border-t border-ink/[0.04] text-[10px] font-mono text-aluminum/60 hover:text-aluminum transition-colors md:hidden text-center"
          >
            {filtersOpen ? "Hide filters ▲" : "More filters ▼"}
          </button>

          {/* Date range filter */}
          <div className={`flex-wrap gap-3 items-center mt-3 pt-3 border-t border-ink/[0.04] ${filtersOpen ? "flex" : "hidden md:flex"}`}>
            <span className="text-[10px] font-mono text-aluminum/60 tracking-wider uppercase">Available dates:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-xs font-mono outline-none focus:border-signal-orange/30 transition-colors"
            />
            <span className="text-xs text-aluminum/50">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom}
              className="px-3 py-2 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-xs font-mono outline-none focus:border-signal-orange/30 transition-colors"
            />
            {dateFrom && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-[10px] text-red-400/50 hover:text-red-400 font-mono transition-colors">
                Clear dates
              </button>
            )}
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${viewMode === "list" ? "bg-signal-orange/15 text-signal-orange border border-signal-orange/30" : "bg-blackout text-aluminum border border-white/8"}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${viewMode === "map" ? "bg-signal-orange/15 text-signal-orange border border-signal-orange/30" : "bg-blackout text-aluminum border border-white/8"}`}
              >
                Map
              </button>
            </div>
          </div>

          {/* Role multi-select dropdown */}
          <div className={`mt-3 ${filtersOpen ? "block" : "hidden md:block"}`}>
            <RoleMultiSelect
              selected={skillFilters}
              setSelected={setSkillFilters}
              onSelectionChange={() => setSpecFilters([])}
              roleSearch={roleSearch}
              setRoleSearch={setRoleSearch}
              open={roleDropdownOpen}
              setOpen={setRoleDropdownOpen}
              dropdownRef={roleDropdownRef}
            />
          </div>

          {/* Specialization multi-select dropdown */}
          <div className={`mt-3 ${filtersOpen ? "block" : "hidden md:block"}`}>
            <SpecMultiSelect
              selected={specFilters}
              setSelected={setSpecFilters}
              roleFilters={skillFilters}
              specSearch={specSearch}
              setSpecSearch={setSpecSearch}
              open={specDropdownOpen}
              setOpen={setSpecDropdownOpen}
              dropdownRef={specDropdownRef}
            />
          </div>
        </div>

        {/* Selected role + specialization tags */}
        {(skillFilters.length > 0 || specFilters.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skillFilters.map((sf) => (
              <button
                key={sf}
                onClick={() => setSkillFilters((prev) => prev.filter((s) => s !== sf))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-signal-orange/10 text-signal-orange border border-signal-orange/25 hover:bg-signal-orange/20 transition-all"
              >
                {ROLE_LABEL_MAP.get(sf) || sf}
                <span className="text-signal-orange/50 text-[10px]">✕</span>
              </button>
            ))}
            {specFilters.map((sf) => (
              <button
                key={sf}
                onClick={() => setSpecFilters((prev) => prev.filter((s) => s !== sf))}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-cue-blue/10 text-cue-blue border border-cue-blue/25 hover:bg-cue-blue/20 transition-all"
              >
                {sf}
                <span className="text-cue-blue/50 text-[10px]">✕</span>
              </button>
            ))}
            <button
              onClick={() => { setSkillFilters([]); setSpecFilters([]); }}
              className="px-2.5 py-1 rounded-md text-xs font-mono text-aluminum/60 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Map View */}
        {viewMode === "map" && !loading && (
          <div className="mb-6">
            <Suspense fallback={<div className="h-[500px] bg-deep-stage rounded-lg flex items-center justify-center"><span className="font-mono text-sm text-aluminum">Loading map...</span></div>}>
              <TechMapView techs={techs} />
            </Suspense>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-20">
            <span className="font-mono text-sm text-aluminum">Loading technicians...</span>
          </div>
        ) : techs.length === 0 ? (
          <div className="text-center py-16 bg-deep-stage rounded-lg border border-white/5">
            <div className="font-heading text-lg font-semibold mb-2">No techs found</div>
            <p className="text-sm text-aluminum max-w-sm mx-auto mb-5">
              {skillFilters.length > 0
                ? `More ${skillFilters.join(", ")} techs are joining every day.`
                : "Try adjusting your filters or search."}
            </p>
            {userId && userType === "producer" && (skillFilters.length > 0 || search) && (
              <button
                onClick={async () => {
                  await supabase.from("saved_searches").insert({
                    producer_id: userId,
                    filters: { skills: skillFilters, specs: specFilters, city: search, available: onlyAvailable, insured: onlyInsured },
                    label: [skillFilters.join(", "), search, onlyAvailable && "available", onlyInsured && "insured"].filter(Boolean).join(" · ") || "All techs",
                  });
                  setSavedSearch(true);
                }}
                disabled={savedSearch}
                className="px-5 py-2.5 bg-signal-orange/10 text-signal-orange text-xs font-mono rounded-lg border border-signal-orange/20 hover:bg-signal-orange/15 transition-all disabled:opacity-50"
              >
                {savedSearch ? "Saved — we'll notify you" : "Notify me when new techs match"}
              </button>
            )}
          </div>
        ) : (
          <>
          {total < 10 && total > 0 && userId && userType === "producer" && (skillFilters.length > 0 || search) && (
            <div className="bg-deep-stage border border-white/5 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <p className="text-xs text-aluminum">
                {total} result{total !== 1 ? "s" : ""} — more {skillFilters.length > 0 ? skillFilters.join(", ") : ""} techs are joining every day.
              </p>
              {!savedSearch ? (
                <button
                  onClick={async () => {
                    await supabase.from("saved_searches").insert({
                      producer_id: userId,
                      filters: { skills: skillFilters, specs: specFilters, city: search, available: onlyAvailable, insured: onlyInsured },
                      label: [skillFilters.join(", "), search, onlyAvailable && "available", onlyInsured && "insured"].filter(Boolean).join(" · ") || "All techs",
                    });
                    setSavedSearch(true);
                  }}
                  className="px-3 py-1.5 bg-signal-orange/10 text-signal-orange text-[10px] font-mono rounded border border-signal-orange/20 hover:bg-signal-orange/15 transition-all flex-shrink-0 ml-3"
                >
                  Notify Me
                </button>
              ) : (
                <span className="text-[10px] font-mono text-go-green flex-shrink-0 ml-3">✓ Saved</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techs.map(tech => {
              const name = tech.profiles?.display_name || "Unknown";
              const techCities = tech.profiles?.cities?.length ? tech.profiles.cities : tech.profiles?.city ? [tech.profiles.city] : [];
              const primaryCity = techCities[0] || "";
              const extraCities = techCities.length > 1 ? techCities.length - 1 : 0;
              const verified = tech.profiles?.is_verified;
              const idVerified = tech.profiles?.identity_verified;
              const avatarUrl = tech.profiles?.avatar_url;
              const hue = getHue(name);
              const lvl = tech.level || 0;
              const profileHref = projectContextId
                ? `/profile/${tech.user_id}?project=${projectContextId}${roleContextId ? `&role=${roleContextId}` : ""}`
                : `/profile/${tech.user_id}`;

              return (
                <Link
                  key={tech.id}
                  href={profileHref}
                  className="bg-deep-stage border border-white/5 rounded-lg p-5 hover:border-signal-orange/20 transition-all group"
                >
                  <div className="flex gap-3 mb-3">
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-sm flex-shrink-0"
                        style={{ background: `hsl(${hue}, 40%, 25%)` }}
                      >
                        {getInitials(name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-heading text-sm font-semibold truncate group-hover:text-signal-orange transition-colors">
                          {name}
                        </span>
                        {verified && (
                          <span className="px-1.5 py-0.5 bg-signal-orange text-white text-[9px] font-mono font-semibold rounded">✓</span>
                        )}
                        {idVerified && (
                          <span className="px-1.5 py-0.5 bg-go-green/15 text-go-green text-[9px] font-mono font-semibold rounded border border-go-green/25">ID</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {lvl > 0 && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              color: TIER_COLORS[lvl],
                              background: `${TIER_COLORS[lvl]}15`,
                              border: `1px solid ${TIER_COLORS[lvl]}30`,
                            }}
                          >
                            {TIER_NAMES[lvl]}
                          </span>
                        )}
                        {tech.available && (
                          <span className="flex items-center gap-1 text-[10px] text-go-green">
                            <span className="w-1.5 h-1.5 rounded-full bg-go-green" />
                            Available
                          </span>
                        )}
                        {tech.has_insurance && (
                          <span className="flex items-center gap-1 text-[10px] text-cue-blue">
                            Insured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tech.primary_skill && (
                      <span className="px-2 py-0.5 bg-signal-orange/15 text-signal-orange text-[10px] font-mono rounded border border-signal-orange/30">
                        ★ {tech.primary_skill}
                      </span>
                    )}
                    {tech.skills?.filter(s => s !== tech.primary_skill).slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-white/3 text-aluminum text-[10px] font-mono rounded border border-white/5">
                        {s}
                      </span>
                    ))}
                    {(tech.skills?.length || 0) > 4 && (
                      <span className="text-[10px] text-aluminum/65 font-mono">+{tech.skills.length - 4}</span>
                    )}
                  </div>

                  {/* Specializations */}
                  {tech.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tech.specializations.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-cue-blue/[0.06] text-cue-blue/70 text-[10px] font-mono rounded border border-cue-blue/10">
                          {s}
                        </span>
                      ))}
                      {tech.specializations.length > 3 && (
                        <span className="text-[10px] text-aluminum/50 font-mono">+{tech.specializations.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Certifications */}
                  {tech.certifications?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tech.certifications.slice(0, 2).map(c => (
                        <span key={c} className="px-2 py-0.5 bg-signal-orange/[0.05] text-signal-orange/60 text-[10px] font-mono rounded border border-signal-orange/10">
                          {c}
                        </span>
                      ))}
                      {tech.certifications.length > 2 && (
                        <span className="text-[10px] text-aluminum/50 font-mono">+{tech.certifications.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Info row */}
                  <div className="flex items-center gap-3 text-xs text-aluminum mb-3">
                    {primaryCity && (
                      <span>
                        {primaryCity}
                        {extraCities > 0 && <span className="text-signal-orange/60 ml-1">+{extraCities}</span>}
                      </span>
                    )}
                    {tech.years_experience > 0 && <span>{tech.years_experience}y exp</span>}
                    {tech.completed_gigs > 0 && <span>{tech.completed_gigs} gigs</span>}
                  </div>

                  {/* Rating and rate */}
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < Math.floor(tech.avg_rating || 0) ? "var(--color-standby-amber)" : "#333", fontSize: "12px" }}>★</span>
                      ))}
                      {tech.avg_rating > 0 && (
                        <span className="font-mono text-xs text-house-lights ml-1">{tech.avg_rating}</span>
                      )}
                      {tech.review_count > 0 && (
                        <span className="font-mono text-[10px] text-aluminum">({tech.review_count})</span>
                      )}
                      {tech.avg_rating === 0 && (
                        <span className="font-mono text-[10px] text-aluminum">New</span>
                      )}
                    </div>
                    {tech.hourly_rate > 0 && (
                      <div className="font-mono text-base font-semibold">
                        {(() => {
                          if (skillFilters.length === 1 && tech.skill_rates?.[skillFilters[0]] && tech.skill_rates[skillFilters[0]] > 0) {
                            return <>${tech.skill_rates[skillFilters[0]]}<span className="text-xs text-aluminum">/hr</span><span className="text-[9px] text-aluminum/40 ml-1">{skillFilters[0]}</span></>;
                          }
                          if (skillFilters.length > 1 && tech.skill_rates) {
                            const filteredRates = skillFilters.map(r => tech.skill_rates![r]).filter(r => r && r > 0);
                            if (filteredRates.length > 0) {
                              const min = Math.min(...filteredRates);
                              const max = Math.max(...filteredRates);
                              return min === max
                                ? <>${min}<span className="text-xs text-aluminum">/hr</span></>
                                : <>${min}<span className="text-xs text-aluminum">–</span>${max}<span className="text-xs text-aluminum">/hr</span></>;
                            }
                          }
                          if (tech.skill_rates && Object.keys(tech.skill_rates).length > 0) {
                            const rates = Object.values(tech.skill_rates).filter(r => r > 0);
                            if (rates.length > 0) {
                              const min = Math.min(...rates);
                              const max = Math.max(...rates);
                              return min === max
                                ? <>${min}<span className="text-xs text-aluminum">/hr</span></>
                                : <>${min}<span className="text-xs text-aluminum">–</span>${max}<span className="text-xs text-aluminum">/hr</span></>;
                            }
                          }
                          return <>${tech.hourly_rate}<span className="text-xs text-aluminum">/hr</span></>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* View profile hint */}
                  <div className="text-[10px] font-mono text-aluminum/0 group-hover:text-aluminum/50 transition-colors text-right mt-1">
                    View Profile →
                  </div>

                  {/* Quick actions */}
                  {userType === "producer" && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-ink/[0.03]">
                      {projectContextId && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setBookingTarget({
                              techId: tech.user_id,
                              techName: name,
                              techRate: tech.hourly_rate || 0,
                              techSkillRates: tech.skill_rates,
                            });
                          }}
                          className="flex-1 py-1.5 rounded text-[10px] font-mono font-semibold bg-signal-orange/10 text-signal-orange border border-signal-orange/20 hover:bg-signal-orange/20 transition-all"
                        >
                          Book
                        </button>
                      )}
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(tech.user_id); }}
                        className={`${projectContextId ? "" : "flex-1 "}py-1.5 px-3 rounded text-[10px] font-mono transition-all ${
                          isFavorite(tech.user_id)
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-ink/[0.02] text-aluminum/50 border border-ink/[0.04] hover:border-red-500/20 hover:text-red-400"
                        }`}>
                        {isFavorite(tech.user_id) ? "Saved" : "Save"}
                      </button>
                      <Link href={`/card/${tech.user_id}`} onClick={(e) => e.stopPropagation()}
                        className="py-1.5 px-3 rounded text-[10px] font-mono bg-ink/[0.02] text-aluminum/50 border border-ink/[0.04] hover:border-white/10 transition-all">

                      </Link>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-deep-stage border border-ink/[0.06] rounded-lg text-sm font-mono text-aluminum hover:border-signal-orange/20 hover:text-signal-orange transition-all disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : `Load More (${total - techs.length} remaining)`}
              </button>
            </div>
          )}
          </>
        )}
      {/* Booking modal for project context */}
      {bookingTarget && (
        <BookingModal
          techId={bookingTarget.techId}
          techName={bookingTarget.techName}
          techRate={bookingTarget.techRate}
          techSkillRates={bookingTarget.techSkillRates}
          prefillProjectId={projectContextId || undefined}
          prefillRoleId={roleContextId || undefined}
          onClose={() => setBookingTarget(null)}
          onSuccess={() => {
            setBookingTarget(null);
            alert("Booking request sent! Check your bookings page.");
          }}
        />
      )}
    </main>
  );
}

// ─── Role Multi-Select Dropdown ─────────────────────────────

function RoleMultiSelect({
  selected,
  setSelected,
  roleSearch,
  setRoleSearch,
  open,
  setOpen,
  dropdownRef,
  onSelectionChange,
}: {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  roleSearch: string;
  setRoleSearch: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onSelectionChange?: () => void;
}) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open, dropdownRef, setOpen]);

  const q = roleSearch.toLowerCase();
  const filteredOptions = q
    ? ROLE_OPTIONS.filter(
        (r) =>
          r.shortName.toLowerCase().includes(q) ||
          r.label.toLowerCase().includes(q) ||
          r.deptName.toLowerCase().includes(q)
      )
    : ROLE_OPTIONS;

  const grouped = filteredOptions.reduce<Record<string, typeof ROLE_OPTIONS>>((acc, r) => {
    (acc[r.deptName] ??= []).push(r);
    return acc;
  }, {});

  const toggle = (shortName: string) => {
    setSelected((prev) =>
      prev.includes(shortName) ? prev.filter((s) => s !== shortName) : [...prev, shortName]
    );
    onSelectionChange?.();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-blackout border rounded-lg cursor-text transition-colors ${
          open ? "border-signal-orange/30" : "border-signal-orange/10"
        }`}
        onClick={() => setOpen(true)}
      >
        <span className="text-aluminum/60 text-sm shrink-0">⌕</span>
        <input
          value={roleSearch}
          onChange={(e) => { setRoleSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length > 0 ? `${selected.length} role${selected.length > 1 ? "s" : ""} selected — add more...` : "Filter by role..."}
          className="flex-1 bg-transparent text-house-lights text-sm outline-none placeholder:text-aluminum/50 min-w-0"
        />
        {selected.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setSelected([]); setRoleSearch(""); }}
            className="text-aluminum/50 hover:text-red-400 text-xs transition-colors shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-blackout border border-white/10 rounded-lg shadow-xl max-h-72 overflow-y-auto z-50">
          {Object.keys(grouped).length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-aluminum/60 font-mono">No roles match &ldquo;{roleSearch}&rdquo;</div>
          ) : (
            Object.entries(grouped).map(([dept, roles]) => (
              <div key={dept}>
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase text-aluminum/60 bg-deep-stage/60 sticky top-0">
                  {dept}
                </div>
                {roles.map((role) => {
                  const isSelected = selected.includes(role.shortName);
                  return (
                    <button
                      key={role.shortName}
                      onClick={() => toggle(role.shortName)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-signal-orange/8 text-signal-orange"
                          : "text-house-lights/70 hover:bg-ink/[0.03]"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 text-[9px] ${
                        isSelected
                          ? "bg-signal-orange border-signal-orange text-white"
                          : "border-aluminum/30"
                      }`}>
                        {isSelected && "✓"}
                      </span>
                      <span className="truncate">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Specialization Multi-Select Dropdown ──────────────────

const SPEC_OPTIONS: { spec: string; roleName: string; roleShort: string }[] = [];
DEPARTMENTS.forEach(dept => dept.roles.forEach(role => {
  role.specializations.forEach(spec => {
    SPEC_OPTIONS.push({ spec, roleName: role.name, roleShort: role.shortName });
  });
}));

function SpecMultiSelect({
  selected,
  setSelected,
  roleFilters,
  specSearch,
  setSpecSearch,
  open,
  setOpen,
  dropdownRef,
}: {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  roleFilters: string[];
  specSearch: string;
  setSpecSearch: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open, dropdownRef, setOpen]);

  const available = roleFilters.length > 0
    ? SPEC_OPTIONS.filter(s => roleFilters.includes(s.roleShort))
    : SPEC_OPTIONS;

  const q = specSearch.toLowerCase();
  const filtered = q
    ? available.filter(s => s.spec.toLowerCase().includes(q) || s.roleName.toLowerCase().includes(q) || s.roleShort.toLowerCase().includes(q))
    : available;

  const grouped = filtered.reduce<Record<string, typeof SPEC_OPTIONS>>((acc, s) => {
    const key = `${s.roleShort} — ${s.roleName.replace(` (${s.roleShort})`, "")}`;
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const toggle = (spec: string) => {
    setSelected((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-blackout border rounded-lg cursor-text transition-colors ${
          open ? "border-cue-blue/30" : "border-signal-orange/10"
        }`}
        onClick={() => setOpen(true)}
      >
        <span className="text-aluminum/60 text-sm shrink-0">⌕</span>
        <input
          value={specSearch}
          onChange={(e) => { setSpecSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length > 0
            ? `${selected.length} specialization${selected.length > 1 ? "s" : ""} selected — add more...`
            : roleFilters.length > 0
              ? `Filter specializations for ${roleFilters.join(", ")}...`
              : "Filter by specialization..."
          }
          className="flex-1 bg-transparent text-house-lights text-sm outline-none placeholder:text-aluminum/50 min-w-0"
        />
        {selected.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setSelected([]); setSpecSearch(""); }}
            className="text-aluminum/50 hover:text-red-400 text-xs transition-colors shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-blackout border border-white/10 rounded-lg shadow-xl max-h-72 overflow-y-auto z-50">
          {Object.keys(grouped).length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-aluminum/60 font-mono">
              No specializations match &ldquo;{specSearch}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([role, specs]) => (
              <div key={role}>
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase text-aluminum/60 bg-deep-stage/60 sticky top-0">
                  {role}
                </div>
                {specs.map((s) => {
                  const isSelected = selected.includes(s.spec);
                  return (
                    <button
                      key={`${s.roleShort}-${s.spec}`}
                      onClick={() => toggle(s.spec)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-cue-blue/8 text-cue-blue"
                          : "text-house-lights/70 hover:bg-ink/[0.03]"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 text-[9px] ${
                        isSelected
                          ? "bg-cue-blue border-cue-blue text-white"
                          : "border-aluminum/30"
                      }`}>
                        {isSelected && "✓"}
                      </span>
                      <span className="truncate">{s.spec}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
