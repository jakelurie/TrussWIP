"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [rating, setRating] = useState("");
  const [hasComment, setHasComment] = useState("");
  const [hidden, setHidden] = useState("");
  const [sort, setSort] = useState("newest");

  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async (newOffset: number, append = false) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const params = new URLSearchParams();
    if (rating) params.set("rating", rating);
    if (hasComment) params.set("hasComment", hasComment);
    if (hidden) params.set("hidden", hidden);
    if (sort) params.set("sort", sort);
    params.set("offset", String(newOffset));

    const res = await fetch(`/api/admin/reviews?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setReviews(append ? (prev) => [...prev, ...data.reviews] : data.reviews);
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }, [rating, hasComment, hidden, sort]);

  useEffect(() => {
    setOffset(0);
    fetchReviews(0);
  }, [fetchReviews]);

  const loadMore = () => {
    const next = offset + 50;
    setOffset(next);
    fetchReviews(next, true);
  };

  const doAction = async (action: string, reviewId: string) => {
    if (action === "delete" && !confirm("Permanently delete this review?")) return;
    setActionLoading(reviewId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, reviewId }),
    });
    setActionLoading(null);
    fetchReviews(0);
  };

  return (
    <div className="p-6 max-w-[1100px]">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-signal-orange tracking-[3px] uppercase">Platform Admin</span>
        <h1 className="font-heading text-xl font-bold tracking-tight mt-1">Reviews</h1>
      </div>

      {/* Filters */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={hasComment}
            onChange={(e) => setHasComment(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="">All Reviews</option>
            <option value="yes">With Comment</option>
            <option value="no">No Comment</option>
          </select>

          <select
            value={hidden}
            onChange={(e) => setHidden(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="">All Visibility</option>
            <option value="no">Visible</option>
            <option value="yes">Hidden</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-2">
        {reviews.map((r) => {
          const tech = r["profiles!reviews_tech_id_fkey"];
          const reviewer = r["profiles!reviews_reviewer_id_fkey"];
          const isExpanded = expanded === r.id;

          return (
            <div
              key={r.id}
              className={`bg-deep-stage/40 border rounded-xl overflow-hidden transition-colors ${
                r.hidden ? "border-signal-orange/15" : "border-ink/[0.03]"
              }`}
            >
              {/* Row */}
              <div
                className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-ink/[0.02] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : r.id)}
              >
                {/* Rating */}
                <div className="flex items-center gap-0.5 w-16 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`text-[10px] ${s <= r.overall_rating ? "text-standby-amber" : "text-aluminum/15"}`}
                    >
                      &#9733;
                    </span>
                  ))}
                </div>

                {/* Tech */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-house-lights/70">
                    For{" "}
                    <Link
                      href={`/admin/users/${tech?.id}`}
                      className="hover:text-signal-orange transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tech?.display_name || "Unknown"}
                    </Link>
                  </span>
                  <span className="text-xs text-aluminum/30 mx-1.5">&middot;</span>
                  <span className="text-xs text-aluminum/50">
                    by{" "}
                    <Link
                      href={`/admin/users/${reviewer?.id}`}
                      className="hover:text-signal-orange transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {reviewer?.display_name || "Unknown"}
                    </Link>
                  </span>
                </div>

                {/* Comment preview */}
                <div className="hidden md:block flex-1 min-w-0">
                  {r.text ? (
                    <span className="text-[11px] text-aluminum/40 truncate block">
                      {r.text.length > 80 ? r.text.slice(0, 80) + "..." : r.text}
                    </span>
                  ) : (
                    <span className="text-[11px] text-aluminum/15">No comment</span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.hidden && (
                    <span className="text-[8px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-signal-orange/10 text-signal-orange rounded">
                      Hidden
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-aluminum/30">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-ink/[0.04]">
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sub-ratings */}
                    <div className="space-y-1.5">
                      <SubRating label="Overall" value={r.overall_rating} />
                      <SubRating label="Skill" value={r.skill_rating} />
                      <SubRating label="Punctuality" value={r.punctuality_rating} />
                      <SubRating label="Professionalism" value={r.professionalism_rating} />
                      <SubRating label="Communication" value={r.communication_rating} />
                    </div>

                    {/* Comment */}
                    <div>
                      {r.text ? (
                        <div>
                          <div className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Comment</div>
                          <p className="text-xs text-aluminum/60 whitespace-pre-wrap">{r.text}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-aluminum/20">No written comment</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ink/[0.04]">
                    {r.hidden ? (
                      <button
                        onClick={() => doAction("unhide", r.id)}
                        disabled={actionLoading === r.id}
                        className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-go-green/10 text-go-green rounded hover:bg-go-green/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === r.id ? "..." : "Unhide"}
                      </button>
                    ) : (
                      <button
                        onClick={() => doAction("hide", r.id)}
                        disabled={actionLoading === r.id}
                        className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-standby-amber/10 text-standby-amber rounded hover:bg-standby-amber/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === r.id ? "..." : "Hide Review"}
                      </button>
                    )}
                    <button
                      onClick={() => doAction("delete", r.id)}
                      disabled={actionLoading === r.id}
                      className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-signal-orange/10 text-signal-orange rounded hover:bg-signal-orange/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === r.id ? "..." : "Delete"}
                    </button>
                    {r.booking_id && (
                      <Link
                        href={`/admin/bookings/${r.booking_id}`}
                        className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-cue-blue/10 text-cue-blue rounded hover:bg-cue-blue/20 transition-colors"
                      >
                        View Booking
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-12 text-center text-aluminum/30 text-sm">
          No reviews found
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            className="px-4 py-1.5 text-xs font-mono text-aluminum/60 hover:text-signal-orange transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

function SubRating({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-aluminum/40 w-28">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`text-[9px] ${s <= value ? "text-standby-amber" : "text-aluminum/15"}`}>
            &#9733;
          </span>
        ))}
      </div>
      <span className="text-[10px] font-mono text-aluminum/40">{value}/5</span>
    </div>
  );
}
