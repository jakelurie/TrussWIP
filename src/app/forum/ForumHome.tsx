"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import MarkdownToolbar from "@/components/MarkdownToolbar";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ─── Types ────────────────────────────────────────────────────

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  department_id: string | null;
  icon: string;
  sort_order: number;
  post_count: number;
  last_post_at: string | null;
}

interface PostPreview {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  author_id: string;
  helpful_count: number;
  comment_count: number;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  last_comment_at: string | null;
  forum_categories: { slug: string; name: string; icon: string } | null;
  profiles: { display_name: string; avatar_url: string | null } | null;
  tech_profiles: { level: number; primary_skill: string | null } | null;
}

// ─── Constants ────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────

export default function ForumHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [sort, setSort] = useState<"newest" | "helpful" | "active">("newest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [displayLimit, setDisplayLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const headerReveal = useScrollReveal();
  const sidebarReveal = useScrollReveal(0.1);

  useEffect(() => {
    loadCategories();
    loadUser();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [sort, search]);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUserId(session.user.id);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from("forum_categories")
      .select("*")
      .order("sort_order");
    setCategories(data || []);
  };

  const loadPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, limit: "50" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/forum?${params}`);
    const data = await res.json();
    setPosts(data.posts || []);
    setDisplayLimit(25);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const totalPosts = categories.reduce((sum, c) => sum + c.post_count, 0);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,77,0,0.03) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div
        ref={headerReveal.ref}
        className={`flex items-center justify-between mb-8 transition-all duration-700 ${headerReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            TRUSS <span className="text-signal-orange">FORUM</span>
          </h1>
          <p className="text-xs font-mono text-aluminum/60 mt-1 tracking-wide">
            AV industry discussion &middot; {totalPosts} posts
          </p>
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
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search discussions..."
                className="flex-1 px-3 py-2 bg-deep-stage border border-white/5 rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-deep-stage border border-white/5 rounded-lg text-[11px] font-heading tracking-wider uppercase text-aluminum hover:text-house-lights hover:border-signal-orange/20 transition-all"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setSearchInput(""); }}
                  className="px-2 py-1.5 text-[11px] text-aluminum/40 hover:text-house-lights transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

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
            {search && (
              <span className="ml-auto text-[11px] text-aluminum/45 pr-2">
                Results for &ldquo;{search}&rdquo;
              </span>
            )}
          </div>

          {/* Post List */}
          <div className="bg-deep-stage/30 border border-white/5 border-t-0 rounded-b-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-aluminum/40 text-sm">
                {search ? "No discussions found." : "No discussions yet. Start one!"}
              </div>
            ) : (
              <>
                {posts.slice(0, displayLimit).map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
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
          {/* About */}
          <div className="bg-deep-stage border border-white/5 rounded-lg overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.04] bg-signal-orange/[0.06]">
              <span className="font-heading text-[11px] font-bold tracking-[2px] uppercase text-signal-orange">
                About
              </span>
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-aluminum/60 leading-relaxed mb-3">
                Ask questions, share knowledge, and connect with the live-event AV community.
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-aluminum/40">
                <span>{totalPosts} posts</span>
                <span>{categories.length} categories</span>
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

          {/* Categories */}
          <div className="bg-deep-stage border border-white/5 rounded-lg overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.04] bg-signal-orange/[0.06]">
              <span className="font-heading text-[11px] font-bold tracking-[2px] uppercase text-signal-orange">
                Categories
              </span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/forum/${cat.slug}`}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[9px] font-mono font-bold tracking-wider ${CATEGORY_COLORS[cat.icon]?.split(" ")[0] || "text-aluminum"}`}>
                      {cat.icon}
                    </span>
                    <span className="text-xs text-house-lights/70 group-hover:text-signal-orange transition-colors truncate">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-aluminum/45 flex-shrink-0">
                    {cat.post_count}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="bg-deep-stage border border-white/5 rounded-lg overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.04] bg-signal-orange/[0.06]">
              <span className="font-heading text-[11px] font-bold tracking-[2px] uppercase text-signal-orange">
                Rules
              </span>
            </div>
            <div className="px-4 py-4 space-y-2.5 text-[11px] text-aluminum/55 leading-relaxed">
              <p>1. Be respectful and professional</p>
              <p>2. Stay on topic — AV industry focus</p>
              <p>3. No spam or self-promotion</p>
              <p>4. Share real experience over speculation</p>
              <p>5. Search before posting duplicates</p>
            </div>
          </div>
        </aside>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <NewPostModal
          categories={categories}
          onClose={() => setShowNewPost(false)}
          onCreated={() => {
            setShowNewPost(false);
            loadPosts();
            loadCategories();
          }}
        />
      )}
    </main>
  );
}

// ─── Post Row ─────────────────────────────────────────────────

function PostRow({ post }: { post: PostPreview }) {
  const name = post.profiles?.display_name || "Anonymous";
  const tier = post.tech_profiles?.level || 0;
  const catIcon = post.forum_categories?.icon || "GEN";
  const catName = post.forum_categories?.name || "";
  const catSlug = post.forum_categories?.slug || "";

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-all duration-200 group/row">
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
          <Link
            href={`/forum/${catSlug}`}
            className={`px-1.5 py-0.5 border rounded text-[9px] font-semibold tracking-wider hover:opacity-80 transition-opacity ${CATEGORY_COLORS[catIcon] || CATEGORY_COLORS.GEN}`}
          >
            {catName}
          </Link>
          <span>&middot;</span>
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
}

// ─── New Post Modal ───────────────────────────────────────────

function NewPostModal({
  categories,
  categoryId,
  onClose,
  onCreated,
}: {
  categories: Category[];
  categoryId?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !selectedCategory) {
      setError("All fields are required");
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Please log in"); setSubmitting(false); return; }

    const res = await fetch("/api/forum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "create_post",
        title: title.trim(),
        postBody: body.trim(),
        category_id: selectedCategory,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create post");
      setSubmitting(false);
      return;
    }

    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="bg-deep-stage border border-white/[0.06] rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto modal-panel shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold tracking-[2px] uppercase">Submit a New Post</h2>
          <button onClick={onClose} className="text-aluminum/40 hover:text-house-lights text-lg transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-heading tracking-[2px] uppercase text-aluminum/50 mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-blackout border border-white/5 rounded-lg text-sm text-house-lights focus:outline-none focus:border-signal-orange/30 transition-colors"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-heading tracking-[2px] uppercase text-aluminum/50 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="What's your question or topic?"
              className="w-full px-3 py-2 bg-blackout border border-white/5 rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30 transition-colors"
            />
            <div className="text-right text-[9px] font-mono text-aluminum/40 mt-1">{title.length}/200</div>
          </div>

          <div>
            <label className="block text-[10px] font-heading tracking-[2px] uppercase text-aluminum/50 mb-1.5">
              Body
            </label>
            <MarkdownToolbar textareaRef={bodyTextareaRef} />
            <textarea
              ref={bodyTextareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={10000}
              rows={6}
              placeholder="Share details, context, or your thoughts..."
              className="w-full px-3 py-2 bg-blackout border border-white/5 rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30 transition-colors resize-y"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[11px] font-heading tracking-wider uppercase text-aluminum/50 hover:text-house-lights transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-signal-orange text-white font-heading font-bold text-[11px] tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_16px_rgba(255,77,0,0.12)] transition-all disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { NewPostModal };
export type { Category, PostPreview };
