"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GEAR_CATEGORIES, getAllGear, gearIdToSlug } from "@/lib/taxonomy";

interface PageStats {
  gear_id: string;
  note_count: number;
  question_count: number;
  answer_count: number;
  view_count: number;
  edit_count: number;
  last_activity_at: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  audio_consoles: "text-blue-400 border-blue-400/20",
  wireless_rf: "text-cyan-400 border-cyan-400/20",
  loudspeakers: "text-indigo-400 border-indigo-400/20",
  video_switchers: "text-purple-400 border-purple-400/20",
  cameras: "text-violet-400 border-violet-400/20",
  lighting_consoles: "text-yellow-400 border-yellow-400/20",
  led_displays: "text-amber-400 border-amber-400/20",
  projectors: "text-orange-400 border-orange-400/20",
  comms_intercom: "text-emerald-400 border-emerald-400/20",
  av_networking: "text-teal-400 border-teal-400/20",
  streaming_recording: "text-rose-400 border-rose-400/20",
  show_control: "text-pink-400 border-pink-400/20",
};

function getCategoryColor(catId: string): string {
  return CATEGORY_COLORS[catId] || "text-aluminum border-aluminum/20";
}

export default function WikiHome() {
  const [stats, setStats] = useState<PageStats[]>([]);
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wiki")
      .then(r => r.json())
      .then(d => setStats(d.stats || []));
  }, []);

  const statsMap = new Map(stats.map(s => [s.gear_id, s]));
  const allGear = getAllGear();

  // Category-level stats
  const catStats = GEAR_CATEGORIES.map(cat => {
    let notes = 0, questions = 0, articles = 0;
    cat.items.forEach(item => {
      const s = statsMap.get(item.id);
      if (s) { notes += s.note_count; questions += s.question_count; if (s.edit_count > 0) articles++; }
    });
    return { id: cat.id, notes, questions, articles };
  });
  const catStatsMap = new Map(catStats.map(c => [c.id, c]));

  // Popular gear (by activity)
  const popular = allGear
    .map(g => ({ ...g, stats: statsMap.get(g.id) }))
    .filter(g => g.stats && (g.stats.note_count + g.stats.question_count) > 0)
    .sort((a, b) => {
      const aScore = (a.stats?.note_count || 0) + (a.stats?.question_count || 0);
      const bScore = (b.stats?.note_count || 0) + (b.stats?.question_count || 0);
      return bScore - aScore;
    })
    .slice(0, 8);

  // Search filter
  const q = search.toLowerCase();
  const filteredGear = q
    ? allGear.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.manufacturer.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      )
    : null;

  return (
    <main className="min-h-screen bg-blackout">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="font-mono text-[10px] text-signal-orange/50 tracking-[4px] uppercase">Community Knowledge</span>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mt-2">
            GEAR <span className="text-signal-orange">WIKI</span>
          </h1>
          <p className="text-sm text-aluminum/60 mt-3 max-w-xl mx-auto">
            The AV industry&apos;s collaborative encyclopedia. Every gear page is editable by the community with full revision history, discussion, and Q&A.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto mb-10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search gear by name, manufacturer, or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-deep-stage border border-white/10 rounded-lg text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="px-3 py-2.5 text-xs font-mono text-aluminum hover:text-house-lights transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {filteredGear && (
          <div className="mb-12">
            <h2 className="font-heading text-sm font-bold tracking-wider uppercase text-aluminum/50 mb-4">
              {filteredGear.length} result{filteredGear.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </h2>
            {filteredGear.length === 0 ? (
              <p className="text-sm text-aluminum/40">No gear found matching your search.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredGear.map(g => {
                  const s = statsMap.get(g.id);
                  return (
                    <Link
                      key={g.id}
                      href={`/wiki/${gearIdToSlug(g.id)}`}
                      className="p-4 rounded-lg bg-deep-stage border border-ink/[0.04] hover:border-signal-orange/15 transition-all"
                    >
                      <div className="text-sm font-semibold text-house-lights">{g.name}</div>
                      <div className="text-[10px] font-mono text-aluminum/40 mt-0.5">{g.manufacturer} · {g.categoryName}</div>
                      {s && (
                        <div className="flex gap-3 mt-2 text-[10px] font-mono text-aluminum/30">
                          <span>{s.note_count} notes</span>
                          <span>{s.question_count} questions</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Category Grid */}
        {!filteredGear && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {GEAR_CATEGORIES.map(cat => {
                const cs = catStatsMap.get(cat.id);
                const colorClass = getCategoryColor(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                    className={`text-left p-5 rounded-lg bg-deep-stage border border-ink/[0.04] hover:border-signal-orange/15 transition-all ${expandedCat === cat.id ? "border-signal-orange/20 ring-1 ring-signal-orange/10" : ""}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider border rounded ${colorClass}`}>
                        {cat.icon}
                      </span>
                      <span className="font-heading text-sm font-bold tracking-wider uppercase">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-aluminum/40">
                      <span>{cat.items.length} items</span>
                      {cs && cs.articles > 0 && <span>{cs.articles} articles</span>}
                      {cs && cs.notes > 0 && <span>{cs.notes} notes</span>}
                      {cs && cs.questions > 0 && <span>{cs.questions} questions</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Expanded Category */}
            {expandedCat && (
              <div className="mb-12">
                {(() => {
                  const cat = GEAR_CATEGORIES.find(c => c.id === expandedCat);
                  if (!cat) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider border rounded ${getCategoryColor(cat.id)}`}>
                          {cat.icon}
                        </span>
                        <h2 className="font-heading text-lg font-bold tracking-wider uppercase">{cat.name}</h2>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cat.items.map(item => {
                          const s = statsMap.get(item.id);
                          return (
                            <Link
                              key={item.id}
                              href={`/wiki/${gearIdToSlug(item.id)}`}
                              className="p-4 rounded-lg bg-deep-stage border border-ink/[0.04] hover:border-signal-orange/15 transition-all"
                            >
                              <div className="text-sm font-semibold text-house-lights">{item.name}</div>
                              <div className="text-[10px] font-mono text-aluminum/40 mt-0.5">{item.manufacturer}</div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.tags.slice(0, 4).map(t => (
                                  <span key={t} className="px-1.5 py-0.5 text-[8px] font-mono text-aluminum/35 bg-ink/[0.03] rounded">{t}</span>
                                ))}
                              </div>
                              <div className="flex gap-3 mt-2 text-[10px] font-mono text-aluminum/30">
                                {s && s.edit_count > 0 ? (
                                  <span className="text-emerald-400/60">has article</span>
                                ) : (
                                  <span className="text-aluminum/20">no article yet</span>
                                )}
                                {s && s.note_count > 0 && <span>{s.note_count} notes</span>}
                                {s && s.question_count > 0 && <span>{s.question_count} questions</span>}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Popular Gear */}
            {popular.length > 0 && (
              <div className="mb-12">
                <h2 className="font-heading text-sm font-bold tracking-wider uppercase text-aluminum/50 mb-4">Most Active</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {popular.map(g => (
                    <Link
                      key={g.id}
                      href={`/wiki/${gearIdToSlug(g.id)}`}
                      className="p-4 rounded-lg bg-deep-stage border border-ink/[0.04] hover:border-signal-orange/15 transition-all"
                    >
                      <div className="text-sm font-semibold text-house-lights">{g.name}</div>
                      <div className="text-[10px] font-mono text-aluminum/40 mt-0.5">{g.manufacturer} · {g.categoryName}</div>
                      <div className="flex gap-3 mt-2 text-[10px] font-mono text-aluminum/30">
                        <span>{g.stats?.note_count || 0} notes</span>
                        <span>{g.stats?.question_count || 0} questions</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Gear (collapsed by default, expand category cards above) */}
            {!expandedCat && (
              <div className="text-center">
                <p className="text-xs text-aluminum/30 font-mono">Click a category above to browse gear items</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
