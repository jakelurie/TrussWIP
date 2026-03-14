"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { NewPostModal } from "../ForumHome";
import type { Category, PostPreview } from "../ForumHome";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];
const TIER_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "#9B59B6", "var(--color-signal-orange)", "var(--color-standby-amber)"];

const CATEGORY_COLORS: Record<string, string> = {
  GEN: "text-aluminum border-aluminum/20",
  AUD: "text-blue-400 border-blue-400/20",
  VID: "text-purple-400 border-purple-400/20",
  LTG: "text-yellow-400 border-yellow-400/20",
  STG: "text-orange-400 border-orange-400/20",
  NET: "text-cyan-400 border-cyan-400/20",
  PRD: "text-emerald-400 border-emerald-400/20",
  GER: "text-rose-400 border-rose-400/20",
  RTE: "text-green-400 border-green-400/20",
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function CategoryPage({ slug }: { slug: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [sort, setSort] = useState<"newest" | "helpful" | "active">("newest");
  const [displayLimit, setDisplayLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const headerReveal = useScrollReveal();
  const sidebarReveal = useScrollReveal(0.1);

  useEffect(() => {
    loadCategory();
    loadUser();
  }, []);

  useEffect(() => {
    if (category) loadPosts();
  }, [sort, category]);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUserId(session.user.id);
  };

  const loadCategory = async () => {
    const { data: cats } = await supabase
      .from("forum_categories")
      .select("*")
      .order("sort_order");
    setAllCategories(cats || []);
    const cat = (cats || []).find((c: Category) => c.slug === slug);
    setCategory(cat || null);
  };

  const loadPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ category: slug, sort, limit: "50" });
    const res = await fetch(`/api/forum?${params}`);
    const data = await res.json();
    setPosts(data.posts || []);
    setDisplayLimit(25);
    setLoading(false);
  };

  if (!category && !loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-aluminum/50">Category not found.</p>
        <Link href="/forum" className="text-signal-orange text-sm mt-4 inline-block">Back to Forum</Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,77,0,0.03) 0%, transparent 70%)" }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-aluminum/50 mb-5">
        <Link href="/forum" className="hover:text-signal-orange transition-colors">Forum</Link>
        <span>/</span>
        <span className="text-house-lights/70">{category?.name || slug}</span>
      </div>

      {/* Header */}
      <div
        ref={headerReveal.ref}
        className={`flex items-center justify-between mb-8 transition-all duration-700 ${headerReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div className="flex items-center gap-3">
          {category && (
            <span className={`px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider border rounded-md ${CATEGORY_COLORS[category.icon] || CATEGORY_COLORS.GEN}`}>
              {category.icon}
            </span>
          )}
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {category?.name}
          </h1>
        </div>
        {userId && (
          <button
            onClick={() => setShowNewPost(true)}
            className="px-5 py-2.5 bg-signal-orange text-white font-heading font-bold text-[11px] tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.15)] transition-all"
          >
            Submit Post
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Main Column */}
        <div>
          {/* Sort Tabs */}
          <div className="flex items-center bg-deep-stage/50 border border-white/5 rounded-t-lg px-1">
            {(["newest", "helpful", "active"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-4 py-2 text-[11px] font-heading font-semibold tracking-[1.5px] uppercase transition-colors relative ${
                  sort === s
                    ? "text-signal-orange"
                    : "text-aluminum/40 hover:text-aluminum/70"
                }`}
              >
                {s === "newest" ? "New" : s === "helpful" ? "Top" : "Active"}
                {sort === s && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-signal-orange" />
                )}
              </button>
            ))}
            <span className="ml-auto text-[10px] font-mono text-aluminum/45 pr-2">
              {category?.post_count || 0} post{(category?.post_count || 0) !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Post List */}
          <div className="bg-deep-stage/30 border border-white/5 border-t-0 rounded-b-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-aluminum/40 text-sm">
                No discussions in this category yet. Be the first!
              </div>
            ) : (
              <>
                {posts.slice(0, displayLimit).map((post) => {
                  const name = post.profiles?.display_name || "Anonymous";
                  const tier = post.tech_profiles?.level || 0;

                  return (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-all duration-200 group/row"
                    >
                      {/* Vote column */}
                      <div className="flex flex-col items-center w-10 flex-shrink-0 pt-0.5">
                        <span className="text-xs text-aluminum/30 group-hover/row:text-aluminum/50 transition-colors vote-btn cursor-default">&#9650;</span>
                        <span className={`text-sm font-mono font-bold ${post.helpful_count > 0 ? "text-house-lights/70" : "text-aluminum/40"}`}>
                          {post.helpful_count}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {post.is_pinned && (
                            <span className="text-[9px] font-mono font-bold text-signal-orange tracking-wider">PINNED</span>
                          )}
                          <Link
                            href={`/forum/post/${post.id}`}
                            className="text-sm font-semibold text-house-lights/90 hover:text-signal-orange transition-colors leading-snug group-hover/row:text-house-lights"
                          >
                            {post.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[10px] font-mono text-aluminum/50">
                          <span>by <span className="text-aluminum/50">{name}</span></span>
                          <span style={{ color: TIER_COLORS[tier] }} className="text-[9px]">{TIER_NAMES[tier]}</span>
                          <span>&middot;</span>
                          <span>{timeAgo(post.created_at)}</span>
                          <span>&middot;</span>
                          <Link
                            href={`/forum/post/${post.id}`}
                            className="text-aluminum/40 hover:text-signal-orange transition-colors"
                          >
                            {post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {posts.length > displayLimit && (
                  <div className="text-center py-4 border-t border-white/[0.04]">
                    <button
                      onClick={() => setDisplayLimit((p) => p + 25)}
                      className="px-5 py-2 bg-deep-stage border border-white/5 rounded-lg text-[11px] font-heading tracking-wider uppercase text-aluminum/50 hover:border-signal-orange/20 hover:text-signal-orange transition-all"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside
          ref={sidebarReveal.ref}
          className={`hidden lg:block space-y-4 transition-all duration-700 delay-200 ${sidebarReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Category Info */}
          <div className="bg-deep-stage border border-white/5 rounded-lg overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.04] bg-signal-orange/[0.06]">
              <span className="font-heading text-[11px] font-bold tracking-[2px] uppercase text-signal-orange">
                About
              </span>
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-aluminum/60 leading-relaxed mb-3">
                {category?.description}
              </p>
              <div className="text-[11px] font-mono text-aluminum/40">
                {category?.post_count || 0} posts
                {category?.last_post_at && (
                  <span> &middot; last activity {timeAgo(category.last_post_at)}</span>
                )}
              </div>
              {userId && (
                <button
                  onClick={() => setShowNewPost(true)}
                  className="w-full mt-3 py-2 bg-signal-orange text-white font-heading font-bold text-[11px] tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_16px_rgba(255,77,0,0.12)] transition-all"
                >
                  Submit Post
                </button>
              )}
            </div>
          </div>

          {/* Other Categories */}
          <div className="bg-deep-stage border border-white/5 rounded-lg overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.04] bg-signal-orange/[0.06]">
              <span className="font-heading text-[11px] font-bold tracking-[2px] uppercase text-signal-orange">
                Categories
              </span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {allCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/forum/${cat.slug}`}
                  className={`flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-all duration-150 group ${cat.slug === slug ? "bg-white/[0.04]" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[9px] font-mono font-bold tracking-wider ${CATEGORY_COLORS[cat.icon]?.split(" ")[0] || "text-aluminum"}`}>
                      {cat.icon}
                    </span>
                    <span className={`text-xs truncate transition-colors ${cat.slug === slug ? "text-signal-orange" : "text-house-lights/70 group-hover:text-signal-orange"}`}>
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-aluminum/45 flex-shrink-0">{cat.post_count}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <NewPostModal
          categories={allCategories}
          categoryId={category?.id}
          onClose={() => setShowNewPost(false)}
          onCreated={() => {
            setShowNewPost(false);
            loadPosts();
            loadCategory();
          }}
        />
      )}
    </main>
  );
}
