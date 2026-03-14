"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const VENUE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "hotel", label: "Hotel" },
  { value: "convention_center", label: "Convention Center" },
  { value: "theater", label: "Theater" },
  { value: "arena", label: "Arena" },
  { value: "outdoor", label: "Outdoor" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
];

const SPEC_FIELDS = [
  { key: "power_info", label: "Power", placeholder: "Capacity, distro points, generator access, tie-ins..." },
  { key: "rigging_info", label: "Rigging", placeholder: "Points, weight limits, grid height, trim height..." },
  { key: "loading_dock", label: "Loading Dock", placeholder: "Dock access, door dimensions, elevator, freight info..." },
  { key: "internet_info", label: "Internet", placeholder: "WiFi, hardline, bandwidth, network contact..." },
  { key: "audio_notes", label: "Audio", placeholder: "House sound, acoustics, noise restrictions, union rules..." },
  { key: "video_notes", label: "Video", placeholder: "House screens, projection distances, ambient light..." },
  { key: "lighting_notes", label: "Lighting", placeholder: "House lighting, dimming, power for lighting rigs..." },
  { key: "staging_notes", label: "Staging", placeholder: "Stage dimensions, ceiling height, floor type..." },
  { key: "general_notes", label: "General", placeholder: "Parking, green room, catering, curfew, union rules, tips..." },
] as const;

type VenueSpec = {
  id: string;
  venue_name: string;
  city: string;
  state: string | null;
  venue_type: string;
  power_info: string | null;
  rigging_info: string | null;
  loading_dock: string | null;
  internet_info: string | null;
  audio_notes: string | null;
  video_notes: string | null;
  lighting_notes: string | null;
  staging_notes: string | null;
  general_notes: string | null;
  submitted_by: string;
  verified: boolean;
  upvotes: number;
  created_at: string;
  profiles?: { display_name: string | null };
};

export default function VenueSpec() {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [venues, setVenues] = useState<VenueSpec[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Submission form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    venue_name: "",
    city: "",
    state: "",
    venue_type: "hotel",
    power_info: "",
    rigging_info: "",
    loading_dock: "",
    internet_info: "",
    audio_notes: "",
    video_notes: "",
    lighting_notes: "",
    staging_notes: "",
    general_notes: "",
  });

  // Expanded card
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Upvoted tracking (client-side)
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setToken(session?.access_token ?? null);
    });
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter !== "all") params.set("type", typeFilter);
    const res = await fetch(`/api/venue-specs?${params}`);
    const json = await res.json();
    setVenues(json.venues || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVenues();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);

    const res = await fetch("/api/venue-specs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "create", ...formData }),
    });

    if (res.ok) {
      setFormData({
        venue_name: "", city: "", state: "", venue_type: "hotel",
        power_info: "", rigging_info: "", loading_dock: "", internet_info: "",
        audio_notes: "", video_notes: "", lighting_notes: "", staging_notes: "",
        general_notes: "",
      });
      setShowForm(false);
      fetchVenues();
    }
    setSubmitting(false);
  };

  const handleUpvote = async (venueId: string) => {
    if (!token) return;

    const res = await fetch("/api/venue-specs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "upvote", venue_spec_id: venueId }),
    });

    if (res.ok) {
      const json = await res.json();
      setUpvoted((prev) => {
        const next = new Set(prev);
        if (json.upvoted) next.add(venueId);
        else next.delete(venueId);
        return next;
      });
      // Update count locally
      setVenues((prev) =>
        prev.map((v) =>
          v.id === venueId
            ? { ...v, upvotes: v.upvotes + (json.upvoted ? 1 : -1) }
            : v
        )
      );
    }
  };

  const filledSpecs = (v: VenueSpec) =>
    SPEC_FIELDS.filter((f) => v[f.key as keyof VenueSpec]);

  const typeLabel = (val: string) =>
    VENUE_TYPES.find((t) => t.value === val)?.label ?? val;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">
          Crowdsourced Venue Intelligence
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2">
          VENUE<span className="text-signal-orange">SPEC</span>
        </h1>
        <p className="text-sm text-aluminum/65 mt-3 max-w-xl mx-auto">
          Technical specs for event venues — power, rigging, loading, internet,
          and production notes from techs who&apos;ve actually worked there.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by venue name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-deep-stage border border-ink/[0.08] rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-signal-orange text-white font-heading text-sm font-bold tracking-wider uppercase rounded-lg hover:bg-signal-orange/90 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {VENUE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-colors ${
                typeFilter === t.value
                  ? "bg-signal-orange/15 text-signal-orange border border-signal-orange/25"
                  : "bg-deep-stage/60 text-aluminum/60 border border-ink/[0.05] hover:border-ink/[0.1]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Venue Button */}
      <div className="mb-8 flex justify-between items-center">
        <p className="text-xs text-aluminum/50 font-mono">
          {loading ? "Loading..." : `${venues.length} venue${venues.length !== 1 ? "s" : ""}`}
        </p>
        {userId ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-signal-orange/10 text-signal-orange border border-signal-orange/20 rounded-lg text-xs font-heading font-bold tracking-wider uppercase hover:bg-signal-orange/15 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Venue"}
          </button>
        ) : (
          <Link
            href="/signup?type=tech"
            className="px-4 py-2 bg-signal-orange/10 text-signal-orange border border-signal-orange/20 rounded-lg text-xs font-heading font-bold tracking-wider uppercase hover:bg-signal-orange/15 transition-colors"
          >
            Sign In to Add
          </Link>
        )}
      </div>

      {/* Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-10 p-6 rounded-xl bg-deep-stage/60 border border-ink/[0.06] space-y-4"
        >
          <h3 className="font-heading text-base font-bold tracking-wider uppercase mb-2">
            Add Venue Specs
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Venue name *"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              className="px-3 py-2 bg-blackout border border-ink/[0.08] rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30"
            />
            <input
              required
              placeholder="City *"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="px-3 py-2 bg-blackout border border-ink/[0.08] rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30"
            />
            <input
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="px-3 py-2 bg-blackout border border-ink/[0.08] rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30"
            />
            <select
              value={formData.venue_type}
              onChange={(e) => setFormData({ ...formData, venue_type: e.target.value })}
              className="px-3 py-2 bg-blackout border border-ink/[0.08] rounded-lg text-sm text-house-lights focus:outline-none focus:border-signal-orange/30"
            >
              {VENUE_TYPES.filter((t) => t.value !== "all").map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {SPEC_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-mono text-aluminum/60 mb-1">
                  {field.label}
                </label>
                <textarea
                  placeholder={field.placeholder}
                  value={formData[field.key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-blackout border border-ink/[0.08] rounded-lg text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 resize-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-aluminum/60 hover:text-aluminum transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-signal-orange text-white font-heading text-sm font-bold tracking-wider uppercase rounded-lg hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Venue"}
            </button>
          </div>
        </form>
      )}

      {/* Venue Cards */}
      {!loading && venues.length === 0 && (
        <div className="text-center py-20">
          <p className="text-aluminum/50 text-sm mb-2">No venues found.</p>
          <p className="text-aluminum/35 text-xs">
            Be the first to add technical specs for a venue.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {venues.map((venue) => {
          const specs = filledSpecs(venue);
          const isExpanded = expandedId === venue.id;

          return (
            <div
              key={venue.id}
              className="rounded-xl bg-deep-stage/40 border border-ink/[0.05] hover:border-signal-orange/10 transition-colors overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : venue.id)}
                className="w-full text-left p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-heading text-base font-bold tracking-wide text-house-lights">
                      {venue.venue_name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-signal-orange/10 text-signal-orange/70">
                      {typeLabel(venue.venue_type).toUpperCase()}
                    </span>
                    {venue.verified && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-emerald-500/10 text-emerald-400">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-aluminum/50">
                    <span>
                      {venue.city}{venue.state ? `, ${venue.state}` : ""}
                    </span>
                    <span>{specs.length} spec{specs.length !== 1 ? "s" : ""} filed</span>
                    <span>
                      by {venue.profiles?.display_name || "Anonymous"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Upvote */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpvote(venue.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.stopPropagation(); handleUpvote(venue.id); }
                    }}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      upvoted.has(venue.id)
                        ? "bg-signal-orange/15 text-signal-orange"
                        : "text-aluminum/40 hover:text-aluminum/60"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={upvoted.has(venue.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    </svg>
                    <span className="text-[11px] font-mono font-bold">
                      {venue.upvotes}
                    </span>
                  </div>

                  {/* Expand arrow */}
                  <span
                    className={`text-aluminum/30 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </div>
              </button>

              {/* Expanded Specs */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-ink/[0.04]">
                  {specs.length === 0 ? (
                    <p className="text-xs text-aluminum/40 pt-4">
                      No detailed specs yet.
                    </p>
                  ) : (
                    <div className="grid gap-3 pt-4">
                      {SPEC_FIELDS.map((field) => {
                        const value = venue[field.key as keyof VenueSpec] as string | null;
                        if (!value) return null;
                        return (
                          <div key={field.key}>
                            <span className="text-[10px] font-mono font-bold tracking-wider text-signal-orange/60 uppercase">
                              {field.label}
                            </span>
                            <p className="text-sm text-aluminum/70 leading-relaxed mt-0.5 whitespace-pre-line">
                              {value}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-ink/[0.03] flex items-center justify-between">
                    <span className="text-[10px] text-aluminum/30 font-mono">
                      Added {new Date(venue.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <section className="text-center py-16 mt-12 border-t border-ink/[0.03]">
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Know a Venue? <span className="text-signal-orange">Share the Specs</span>
        </h2>
        <p className="text-sm text-aluminum/60 mb-6 max-w-md mx-auto">
          Help the AV community by documenting technical details for venues
          you&apos;ve worked. Power, rigging, loading, internet — every detail counts.
        </p>
        {!userId ? (
          <Link
            href="/signup?type=tech"
            className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Sign Up to Contribute
          </Link>
        ) : (
          <button
            onClick={() => {
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-block px-8 py-4 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
          >
            Add a Venue
          </button>
        )}
      </section>
    </main>
  );
}
