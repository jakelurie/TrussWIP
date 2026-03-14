"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BookingModal from "@/components/BookingModal";
import { gearIdToSlug, getGearById } from "@/lib/taxonomy";

const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];
const TIER_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "#9B59B6", "var(--color-signal-orange)", "var(--color-standby-amber)"];
const TIER_THRESHOLDS = [0, 1000, 3000, 6000, 10000];

export default function TechProfile() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const projectContextId = searchParams.get("project") || undefined;
  const roleContextId = searchParams.get("role") || undefined;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [techProfile, setTechProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [wikiContributions, setWikiContributions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("about");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [showWelcome, setShowWelcome] = useState(isWelcome);

  const handleMessage = async () => {
    if (!currentUser) { router.push("/login"); return; }
    setStartingChat(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recipientId: params.id }),
      });
      const data = await res.json();
      if (data.conversationId) {
        router.push(`/messages?with=${params.id}`);
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    const userId = params.id as string;

    // Check if current user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUser(session.user);

    // Load profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(prof);

    // Load tech profile
    const { data: tp } = await supabase
      .from("tech_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setTechProfile(tp);

    // Load reviews
    const { data: revs } = await supabase
      .from("reviews")
      .select("*, profiles!reviews_reviewer_id_fkey(display_name)")
      .eq("tech_id", userId)
      .order("created_at", { ascending: false });
    setReviews(revs || []);

    // Track profile view
    if (session && session.user.id !== userId) {
      supabase.from("profile_views").insert({
        tech_user_id: userId,
        viewer_id: session.user.id,
        source: "profile",
      });
    }

    // Load portfolio
    if (tp) {
      const { data: port } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("tech_profile_id", tp.id)
        .order("created_at", { ascending: false });
      setPortfolioItems(port || []);

      // Load earned badges
      const { data: badges } = await supabase
        .from("earned_badges")
        .select("*, badges(*)")
        .eq("tech_profile_id", tp.id)
        .order("earned_date", { ascending: false });
      setEarnedBadges(badges || []);
    }

    // Load forum posts
    const forumRes = await fetch(`/api/forum?author_id=${userId}&limit=10`);
    const forumData = await forumRes.json();
    setForumPosts(forumData.posts || []);

    // Load wiki contributions
    const wikiRes = await fetch(`/api/wiki?author_id=${userId}&limit=20`);
    const wikiData = await wikiRes.json();
    setWikiContributions([...(wikiData.notes || []), ...(wikiData.questions || [])]);

    setLoading(false);

    // Auto-open booking modal when coming from a project
    if (session && projectContextId && session.user.id !== userId) {
      setShowBookingModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading profile...</span>
      </div>
    );
  }

  if (!profile || !techProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-heading text-lg font-semibold mb-1">Tech not found</div>
          <Link href="/browse" className="text-sm text-signal-orange hover:underline">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  const name = profile.display_name || "Unknown";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  const hue = (() => { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return Math.abs(h) % 360; })();
  const lvl = techProfile.level || 0;
  const xp = techProfile.xp || 0;
  const nextThreshold = TIER_THRESHOLDS[lvl + 1] || TIER_THRESHOLDS[lvl];
  const xpProgress = nextThreshold > 0 ? xp / nextThreshold : 1;
  const circumference = 2 * Math.PI * 38;

  const tabs = [
    { id: "about", label: "About", count: null },
    { id: "portfolio", label: "Portfolio", count: portfolioItems.length },
    { id: "reviews", label: "Reviews", count: techProfile.review_count || reviews.length },
    { id: "badges", label: "Credentials", count: earnedBadges.length },
    { id: "forum", label: "Forum", count: forumPosts.length },
    { id: "wiki", label: "Wiki", count: wikiContributions.length },
  ];

  const statItems = [
    { label: "Gigs", value: techProfile.completed_gigs || 0 },
    { label: "Rating", value: techProfile.avg_rating || "New" },
    { label: "On Time", value: `${techProfile.on_time_rate || 0}%` },
    { label: "Repeat", value: `${techProfile.repeat_rate || 0}%` },
    { label: "Response", value: techProfile.response_time || "—" },
  ];

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
        {showWelcome && (
          <div className="bg-signal-orange/[0.06] border border-signal-orange/15 rounded-xl px-5 py-4 mb-4 flex items-start justify-between">
            <div>
              <div className="font-heading text-sm font-semibold tracking-wider uppercase mb-1">
                Your profile is live
              </div>
              <p className="text-xs text-aluminum leading-relaxed">
                Producers can find you now.{" "}
                <Link href="/edit-profile" className="text-signal-orange hover:underline">
                  Add more details
                </Link>{" "}
                to stand out — photo, bio, gear, and specializations.
              </p>
            </div>
            <button onClick={() => setShowWelcome(false)} className="text-aluminum/50 hover:text-aluminum text-sm ml-4 mt-0.5">✕</button>
          </div>
        )}

        <Link href="/browse" className="font-mono text-xs text-signal-orange hover:underline mb-4 inline-block">
          ← Back to marketplace
        </Link>

        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-br from-deep-stage to-signal-orange/5 border border-signal-orange/10 rounded-xl p-6 mb-4">
          <div className="flex gap-5 items-start flex-wrap">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center font-heading text-2xl font-bold"
                    style={{ background: `hsl(${hue}, 40%, 22%)` }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              {lvl > 0 && (
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-lg px-2 py-0.5 text-[9px] font-mono font-medium text-white border-[3px] border-blackout whitespace-nowrap"
                  style={{ background: TIER_COLORS[lvl] }}
                >
                  {TIER_NAMES[lvl]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="font-heading text-2xl font-bold">{name}</h1>
                {profile.is_verified && (
                  <span className="px-2 py-0.5 bg-signal-orange text-white text-[10px] font-mono font-semibold rounded">VERIFIED</span>
                )}
                {profile.identity_verified && (
                  <span className="px-2 py-0.5 bg-go-green/15 text-go-green text-[10px] font-mono font-semibold rounded border border-go-green/25">ID VERIFIED</span>
                )}
                <span className={`flex items-center gap-1.5 text-xs ${techProfile.available ? "text-go-green" : "text-aluminum"}`}>
                  <span className={`w-2 h-2 rounded-full ${techProfile.available ? "bg-go-green shadow-[0_0_6px_rgba(0,200,83,0.5)]" : "bg-aluminum/50"}`} />
                  {techProfile.available ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="font-mono text-xs text-signal-orange mb-1">
                {techProfile.skills?.join(" · ") || "No skills listed"}
              </div>

              <div className="text-xs text-aluminum mb-2">
                {(() => {
                  const allCities = profile.cities?.length ? profile.cities : profile.city ? [profile.city] : [];
                  return allCities.length > 0 && `${allCities.join(" / ")} · `;
                })()}
                {techProfile.years_experience > 0 && `${techProfile.years_experience} years · `}
                {techProfile.completed_gigs > 0 && `${techProfile.completed_gigs} gigs`}
              </div>

              {/* External links */}
              {(techProfile.linkedin_url || techProfile.website_url) && (
                <div className="flex items-center gap-3 mb-2">
                  {techProfile.linkedin_url && (
                    <a
                      href={techProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-aluminum hover:text-signal-orange transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {techProfile.website_url && (
                    <a
                      href={techProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-aluminum hover:text-signal-orange transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      Website
                    </a>
                  )}
                </div>
              )}

              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: i < Math.floor(techProfile.avg_rating || 0) ? "var(--color-standby-amber)" : "#333", fontSize: "14px" }}>★</span>
                ))}
                {techProfile.avg_rating > 0 && (
                  <span className="font-mono text-sm text-house-lights ml-1">{techProfile.avg_rating}</span>
                )}
                <span className="font-mono text-[10px] text-aluminum ml-1">
                  ({techProfile.review_count || 0} reviews)
                </span>
              </div>

              {/* Reputation stats */}
              {(techProfile.completed_gigs > 0 || techProfile.review_count > 0) && (
                <div className="flex gap-4 text-[11px]">
                  {techProfile.completed_gigs > 0 && (
                    <span className="text-aluminum/60">{techProfile.completed_gigs} gig{techProfile.completed_gigs !== 1 ? "s" : ""} completed</span>
                  )}
                  {techProfile.review_count > 0 && (
                    <span className="text-aluminum/60">{techProfile.review_count} review{techProfile.review_count !== 1 ? "s" : ""}</span>
                  )}
                </div>
              )}
            </div>

            {/* Rate + CTA */}
            <div className="sm:text-right flex-shrink-0 w-full sm:w-auto">
              {techProfile.hourly_rate > 0 && (profile?.privacy_settings?.show_rate !== false || currentUser?.id === params.id) ? (
                <>
                  <div className="font-mono text-3xl font-medium">
                    ${techProfile.hourly_rate}<span className="text-sm text-aluminum">/hr</span>
                  </div>
                  <div className="font-mono text-xs text-aluminum mb-3">
                    ${techProfile.hourly_rate * 10}/day (10hr)
                  </div>
                </>
              ) : techProfile.hourly_rate > 0 ? (
                <div className="font-mono text-sm text-aluminum/60 mb-3">Contact for rate</div>
              ) : null}
              <div className="flex gap-2 sm:justify-end flex-wrap">
                {currentUser && currentUser.id !== params.id ? (
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="px-5 py-2.5 rounded-lg font-heading text-xs font-semibold tracking-wider uppercase bg-signal-orange text-white hover:bg-orange-600 transition-all"
                  >
                    Request to Book
                  </button>
                ) : !currentUser ? (
                  <Link
                    href="/login"
                    className="px-5 py-2.5 bg-signal-orange text-white rounded-lg font-heading text-xs font-semibold tracking-wider uppercase hover:bg-orange-600 transition-colors"
                  >
                    Log In to Book
                  </Link>
                ) : null}
                <button
                  onClick={handleMessage}
                  disabled={startingChat}
                  className="px-4 py-2.5 bg-transparent text-house-lights border border-white/10 rounded-lg font-heading text-xs font-semibold tracking-wider uppercase hover:border-white/20 transition-colors disabled:opacity-50"
                >
                  {startingChat ? "..." : "Msg"}
                </button>
                <Link href={`/card/${params.id}`}
                  className="px-4 py-2.5 bg-transparent text-aluminum/65 border border-white/10 rounded-lg font-heading text-xs font-semibold tracking-wider uppercase hover:border-white/20 hover:text-house-lights transition-colors">
                   Share
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ===== QUICK STATS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {statItems.map((s, i) => (
            <div key={i} className="bg-deep-stage rounded-md p-3 text-center">
              <div className="font-mono text-base font-medium">{s.value}</div>
              <div className="text-[9px] text-aluminum uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ===== BADGE SHOWCASE ===== */}
        {earnedBadges.length > 0 && (
          <div className="bg-deep-stage rounded-md px-4 py-3 mb-4 flex items-center gap-3 overflow-auto">
            <span className="font-mono text-[10px] text-aluminum whitespace-nowrap">BADGES</span>
            <div className="flex gap-1.5">
              {earnedBadges.map((eb: any, i: number) => (
                <div
                  key={i}
                  title={eb.badges?.name}
                  className="w-8 h-8 rounded-md bg-signal-orange/8 border border-signal-orange/10 flex items-center justify-center text-base flex-shrink-0"
                >
                  {eb.badges?.icon}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TABS ===== */}
        <div className="flex border-b border-signal-orange/8 mb-5 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-heading text-xs font-semibold tracking-widest uppercase whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-house-lights border-b-2 border-signal-orange"
                  : "text-aluminum border-b-2 border-transparent hover:text-house-lights"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`font-mono text-[9px] ml-1.5 px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-signal-orange/15 text-signal-orange" : "bg-white/5 text-aluminum/65"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== ABOUT TAB ===== */}
        {activeTab === "about" && (
          <div className="space-y-4">
            {/* Bio */}
            {techProfile.bio && (
              <div className="bg-deep-stage rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold tracking-widest uppercase text-signal-orange mb-3">About</h3>
                <p className="text-sm text-aluminum/80 leading-relaxed">{techProfile.bio}</p>
              </div>
            )}

            {/* Career Highlights */}
            {techProfile.career_highlights?.length > 0 && (
              <div className="bg-deep-stage rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold tracking-widest uppercase text-signal-orange mb-3">Career Highlights</h3>
                <div className="space-y-2.5">
                  {techProfile.career_highlights.map((h: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-signal-orange text-sm mt-0.5 flex-shrink-0">▸</span>
                      <div>
                        <div className="text-sm text-house-lights font-semibold">
                          {h.title}
                          {h.year && <span className="text-aluminum/50 font-normal ml-2">{h.year}</span>}
                        </div>
                        {h.description && (
                          <p className="text-xs text-aluminum/60 mt-0.5 leading-relaxed">{h.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {techProfile.certifications?.length > 0 && (
              <div className="bg-deep-stage rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold tracking-widest uppercase text-signal-orange mb-3">Certifications</h3>
                <div className="flex flex-wrap gap-1.5">
                  {techProfile.certifications.map((cert: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-md text-xs font-mono bg-signal-orange/[0.06] text-signal-orange/80 border border-signal-orange/15">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Policy */}
            {techProfile.cancellation_policy && (
              <div className="bg-deep-stage rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold tracking-widest uppercase text-signal-orange mb-3">Cancellation Policy</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-aluminum/80">
                    {techProfile.cancellation_policy === "flexible" && "Flexible — Free cancellation anytime"}
                    {techProfile.cancellation_policy === "24hr" && "24-Hour Notice required for free cancellation"}
                    {techProfile.cancellation_policy === "48hr" && "48-Hour Notice required for free cancellation"}
                    {techProfile.cancellation_policy === "72hr" && "72-Hour Notice required for free cancellation"}
                  </span>
                </div>
              </div>
            )}

            {/* Skills & Gear */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-deep-stage rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold tracking-widest uppercase text-signal-orange mb-3">Skills & Rates</h3>
                <div className="space-y-1.5">
                  {techProfile.skills?.map((s: string) => {
                    const skillRate = techProfile.skill_rates?.[s];
                    const displayRate = skillRate || techProfile.hourly_rate;
                    return (
                      <div key={s} className="flex justify-between items-center px-3 py-2 bg-ink/[0.02] rounded border border-ink/[0.04]">
                        <span className="font-heading text-sm font-semibold flex items-center gap-2">
                          {s}
                          {s === techProfile.primary_skill && (
                            <span className="px-1.5 py-0.5 bg-signal-orange text-white text-[9px] font-mono rounded">PRIMARY</span>
                          )}
                        </span>
                        {displayRate > 0 && (
                          <span className="font-mono text-xs text-signal-orange">${displayRate}/hr</span>
                        )}
                      </div>
                    );
                  })}
                  {(!techProfile.skills || techProfile.skills.length === 0) && (
                    <p className="text-xs text-aluminum">No skills listed yet</p>
                  )}
                </div>
              </div>

              {(profile?.privacy_settings?.show_gear !== false || currentUser?.id === params.id) && (
              <div className="bg-deep-stage rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold tracking-widest uppercase text-signal-orange mb-3">Gear</h3>
                {techProfile.gear ? (
                  <p className="text-sm text-house-lights leading-relaxed whitespace-pre-wrap">{
                    Array.isArray(techProfile.gear) ? techProfile.gear.join(", ") : techProfile.gear
                  }</p>
                ) : (
                  <p className="text-xs text-aluminum">No gear listed yet</p>
                )}
              </div>
              )}
            </div>
          </div>
        )}

        {/* ===== PORTFOLIO TAB ===== */}
        {activeTab === "portfolio" && (
          <div>
            {portfolioItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {portfolioItems.map((item: any) => (
                  <div key={item.id} className="rounded-lg overflow-hidden">
                    <div className="h-36 bg-gradient-to-br from-deep-stage to-signal-orange/5 relative flex items-center justify-center">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-mono text-[9px] text-aluminum/50">EVENT PHOTO</span>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          {item.tags.map((tag: string, i: number) => (
                            <span key={i} className="px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-mono text-signal-orange">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-deep-stage">
                      <div className="font-heading text-xs font-semibold mb-0.5">{item.title}</div>
                      {item.description && (
                        <div className="text-[10px] text-aluminum">{item.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum">No portfolio items yet</div>
              </div>
            )}
          </div>
        )}

        {/* ===== REVIEWS TAB ===== */}
        {activeTab === "reviews" && (
          <div>
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <div key={review.id} className="bg-deep-stage rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-semibold">{review.profiles?.display_name || "Anonymous"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ color: i < (review.overall_rating || 0) ? "var(--color-standby-amber)" : "#333", fontSize: "11px" }}>★</span>
                        ))}
                        <span className="font-mono text-xs ml-1">{review.overall_rating}</span>
                      </div>
                    </div>
                    {review.text && (
                      <p className="text-xs text-aluminum/80 leading-relaxed mb-2 italic">&ldquo;{review.text}&rdquo;</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {review.skill_rating && (
                        <span className="font-mono text-[9px] text-go-green px-1.5 py-0.5 bg-ink/[0.02] rounded">
                          Skill: {review.skill_rating}/5
                        </span>
                      )}
                      {review.punctuality_rating && (
                        <span className="font-mono text-[9px] text-go-green px-1.5 py-0.5 bg-ink/[0.02] rounded">
                          Punctuality: {review.punctuality_rating}/5
                        </span>
                      )}
                      {review.professionalism_rating && (
                        <span className="font-mono text-[9px] text-go-green px-1.5 py-0.5 bg-ink/[0.02] rounded">
                          Professionalism: {review.professionalism_rating}/5
                        </span>
                      )}
                      {review.communication_rating && (
                        <span className="font-mono text-[9px] text-go-green px-1.5 py-0.5 bg-ink/[0.02] rounded">
                          Communication: {review.communication_rating}/5
                        </span>
                      )}
                      <span className="font-mono text-[9px] text-go-green px-1.5 py-0.5 bg-go-green/5 rounded border border-go-green/10">
                        ✓ Verified Booking
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum">No reviews yet</div>
              </div>
            )}
          </div>
        )}

        {/* ===== BADGES TAB ===== */}
        {activeTab === "badges" && (
          <div>
            {earnedBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {earnedBadges.map((eb: any) => (
                  <div key={eb.id} className="bg-deep-stage rounded-lg p-4 border border-signal-orange/8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-2xl">{eb.badges?.icon}</span>
                      <span className="font-mono text-[9px] text-aluminum">
                        {eb.earned_date ? new Date(eb.earned_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                      </span>
                    </div>
                    <div className="font-heading text-sm font-semibold mb-0.5">{eb.badges?.name}</div>
                    <div className="text-[10px] text-aluminum leading-relaxed">{eb.badges?.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum">No badges earned yet</div>
                <div className="text-xs text-aluminum/65 mt-1">Badges are earned by completing gigs, getting reviews, and more</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "forum" && (
          <div>
            {forumPosts.length > 0 ? (
              <div className="space-y-2">
                {forumPosts.map((post: any) => (
                  <Link
                    key={post.id}
                    href={`/forum/post/${post.id}`}
                    className="block p-4 rounded-lg bg-deep-stage border border-ink/[0.04] hover:border-signal-orange/15 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {post.forum_categories && (
                        <span className="text-[9px] font-mono text-aluminum/40 tracking-wider">
                          {post.forum_categories.name}
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-aluminum/25">
                        {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-house-lights mb-1">{post.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-aluminum/30">
                      <span>{post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}</span>
                      <span>{post.helpful_count} helpful</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum">No forum posts yet</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "wiki" && (
          <div>
            {wikiContributions.length > 0 ? (
              <div className="space-y-2">
                {wikiContributions.map((item: any) => {
                  const gear = getGearById(item.gear_id);
                  const isQuestion = !!item.title;
                  return (
                    <Link
                      key={item.id}
                      href={isQuestion ? `/wiki/${gearIdToSlug(item.gear_id)}/question/${item.id}` : `/wiki/${gearIdToSlug(item.gear_id)}`}
                      className="block p-4 rounded-lg bg-deep-stage border border-ink/[0.04] hover:border-signal-orange/15 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono text-aluminum/40 tracking-wider">
                          {gear?.name || item.gear_id}
                        </span>
                        <span className="text-[9px] font-mono text-aluminum/25">
                          {isQuestion ? "Question" : item.category}
                        </span>
                        <span className="text-[9px] font-mono text-aluminum/25">
                          {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      {isQuestion ? (
                        <>
                          <h3 className="text-sm font-semibold text-house-lights mb-1">{item.title}</h3>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-aluminum/30">
                            <span>{item.answer_count} answer{item.answer_count !== 1 ? "s" : ""}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-house-lights/80 line-clamp-2">{item.body}</p>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-aluminum/30 mt-1">
                            <span>{item.helpful_count} helpful</span>
                          </div>
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum">No wiki contributions yet</div>
              </div>
            )}
          </div>
        )}

        <div className="h-16" />

        {/* Booking Modal */}
        {showBookingModal && (
          <BookingModal
            techId={params.id as string}
            techName={name}
            techRate={techProfile.hourly_rate || 0}
            techSkillRates={techProfile.skill_rates || {}}
            prefillProjectId={projectContextId}
            prefillRoleId={roleContextId}
            onClose={() => setShowBookingModal(false)}
            onSuccess={() => {
              setShowBookingModal(false);
              alert("Booking request sent! Check your bookings page.");
            }}
          />
        )}
    </main>
  );
}