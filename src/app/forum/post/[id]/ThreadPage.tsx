"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/taxonomy";
import { renderMarkdown } from "@/lib/markdown";
import MarkdownToolbar from "@/components/MarkdownToolbar";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ─── Types ────────────────────────────────────────────────────

interface PostDetail {
  id: string;
  title: string;
  slug: string;
  body: string;
  author_id: string;
  category_id: string;
  helpful_count: number;
  comment_count: number;
  view_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  forum_categories: { slug: string; name: string; icon: string; department_id: string | null } | null;
  profiles: { display_name: string; avatar_url: string | null; city: string | null; is_verified: boolean } | null;
  tech_profiles: { level: number; primary_skill: string | null; skills: string[] } | null;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  helpful_count: number;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null; city: string | null; is_verified: boolean } | null;
  tech_profiles: { level: number; primary_skill: string | null; skills: string[] } | null;
}

interface CommentNode extends Comment {
  children: CommentNode[];
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

const MAX_DEPTH = 6;

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
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getHue = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

const getInitials = (name: string) =>
  name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

function getVerifiedSkill(departmentId: string | null, skills: string[] | null): string | null {
  if (!departmentId || !skills?.length) return null;
  const dept = DEPARTMENTS.find(d => d.id === departmentId);
  if (!dept) return null;
  const match = dept.roles.find(role => skills.includes(role.shortName));
  return match ? match.shortName : null;
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, children: [] });
  }

  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function sortComments(nodes: CommentNode[], sortBy: "best" | "new" | "old"): CommentNode[] {
  const sorted = [...nodes].sort((a, b) => {
    if (sortBy === "best") return b.helpful_count - a.helpful_count || new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  return sorted.map(n => ({ ...n, children: sortComments(n.children, sortBy) }));
}

// ─── Component ────────────────────────────────────────────────

export default function ThreadPage({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userMarks, setUserMarks] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState<{ type: "post" | "comment"; id: string } | null>(null);
  const [commentSort, setCommentSort] = useState<"best" | "new" | "old">("best");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const articleReveal = useScrollReveal();
  const commentsReveal = useScrollReveal(0.1);

  useEffect(() => {
    loadThread();
    loadUser();
  }, []);

  const startMessage = async (targetUserId: string) => {
    if (!userId) { router.push("/login"); return; }
    if (targetUserId === userId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recipientId: targetUserId }),
      });
      const data = await res.json();
      if (data.conversationId) {
        router.push(`/messages?with=${targetUserId}`);
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  };

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUserId(session.user.id);
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  const loadThread = async () => {
    setLoading(true);
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`/api/forum?post_id=${postId}`, { headers });
    const data = await res.json();
    if (data.post) setPost(data.post);
    setComments(data.comments || []);
    setUserMarks(new Set(data.userMarks || []));
    setLoading(false);
  };

  const toggleHelpful = async (target: { post_id?: string; comment_id?: string }) => {
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "toggle_helpful", ...target }),
    });
    const data = await res.json();
    const targetId = target.post_id || target.comment_id!;

    setUserMarks((prev) => {
      const next = new Set(prev);
      if (data.marked) next.add(targetId);
      else next.delete(targetId);
      return next;
    });

    if (target.post_id && post) {
      setPost({ ...post, helpful_count: post.helpful_count + (data.marked ? 1 : -1) });
    } else if (target.comment_id) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === target.comment_id
            ? { ...c, helpful_count: c.helpful_count + (data.marked ? 1 : -1) }
            : c
        )
      );
    }
  };

  const submitComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const body = parentId ? (document.getElementById(`reply-${parentId}`) as HTMLTextAreaElement)?.value?.trim() : commentBody.trim();
    if (!body) return;
    setSubmitting(true);

    const token = await getToken();
    const payload: Record<string, string> = {
      action: "create_comment",
      post_id: postId,
      commentBody: body,
    };
    if (parentId) payload.parent_comment_id = parentId;

    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      if (!parentId) setCommentBody("");
      setReplyTo(null);
      loadThread();
    }
    setSubmitting(false);
  };

  const submitReport = async (reason: string) => {
    if (!showReport) return;
    const token = await getToken();
    await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        action: "report",
        post_id: showReport.type === "post" ? showReport.id : undefined,
        comment_id: showReport.type === "comment" ? showReport.id : undefined,
        reason,
      }),
    });
    setShowReport(null);
  };

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-aluminum/50">Post not found.</p>
        <Link href="/forum" className="text-signal-orange text-sm mt-4 inline-block">Back to Forum</Link>
      </main>
    );
  }

  const catSlug = post.forum_categories?.slug || "";
  const catName = post.forum_categories?.name || "";
  const catIcon = post.forum_categories?.icon || "GEN";
  const deptId = post.forum_categories?.department_id || null;

  const tree = sortComments(buildCommentTree(comments), commentSort);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,77,0,0.03) 0%, transparent 70%)" }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-aluminum/50 mb-5">
        <Link href="/forum" className="hover:text-signal-orange transition-colors">Forum</Link>
        <span>/</span>
        <Link href={`/forum/${catSlug}`} className="hover:text-signal-orange transition-colors">{catName}</Link>
        <span>/</span>
        <span className="text-house-lights/50 truncate max-w-[300px]">{post.title}</span>
      </div>

      {/* Post */}
      <article
        ref={articleReveal.ref}
        className={`flex gap-5 bg-deep-stage border border-white/5 rounded-lg p-5 mb-8 transition-all duration-700 ${articleReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 w-12 flex-shrink-0 pt-1">
          <button
            onClick={() => userId && toggleHelpful({ post_id: post.id })}
            disabled={!userId}
            className={`text-xl leading-none transition-all vote-btn ${
              userMarks.has(post.id)
                ? "text-signal-orange"
                : userId ? "text-aluminum/35 hover:text-signal-orange" : "text-aluminum/20"
            }`}
          >
            &#9650;
          </button>
          <span className={`text-base font-mono font-bold ${post.helpful_count > 0 ? "text-house-lights" : "text-aluminum/40"}`}>{post.helpful_count}</span>
          <button
            onClick={() => userId && toggleHelpful({ post_id: post.id })}
            disabled={!userId}
            className={`text-xl leading-none transition-all vote-btn ${
              userMarks.has(post.id)
                ? "text-signal-orange"
                : userId ? "text-aluminum/35 hover:text-signal-orange" : "text-aluminum/20"
            }`}
          >
            &#9660;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta line */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-aluminum/40 mb-2">
            <span className={`px-2 py-0.5 border rounded-md tracking-wider text-[9px] font-semibold ${CATEGORY_COLORS[catIcon] || CATEGORY_COLORS.GEN}`}>
              {catName}
            </span>
            {post.is_pinned && (
              <span className="text-[9px] font-bold text-signal-orange tracking-wider">PINNED</span>
            )}
            {post.is_locked && (
              <span className="text-[9px] font-bold text-red-400/70 tracking-wider">LOCKED</span>
            )}
            <span>&middot;</span>
            <span>Posted by</span>
            <Link href={`/profile/${post.author_id}`} className="text-aluminum/60 hover:text-signal-orange transition-colors">
              {post.profiles?.display_name || "Anonymous"}
            </Link>
            {post.tech_profiles?.primary_skill && (
              <span className="text-aluminum/45">{post.tech_profiles.primary_skill}</span>
            )}
            <span style={{ color: TIER_COLORS[post.tech_profiles?.level || 0] }} className="text-[9px]">
              {TIER_NAMES[post.tech_profiles?.level || 0]}
            </span>
            <span>&middot;</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl font-bold tracking-tight mb-4">
            {post.title}
          </h1>

          {/* Body */}
          <div
            className="text-sm text-house-lights/85 leading-relaxed mb-5"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />

          {/* Footer */}
          <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04] text-[11px] font-mono text-aluminum/45">
            <span>{post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}</span>
            <span>{post.view_count} view{post.view_count !== 1 ? "s" : ""}</span>
            {userId && userId !== post.author_id && (
              <button
                onClick={() => startMessage(post.author_id)}
                className="hover:text-signal-orange transition-colors"
              >
                message
              </button>
            )}
            {userId && userId !== post.author_id && (
              <button
                onClick={() => setShowReport({ type: "post", id: post.id })}
                className="hover:text-red-400/60 transition-colors"
              >
                report
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Comment input (top-level) */}
      {post.is_locked ? (
        <div className="mb-6 p-3 border border-ink/[0.08] text-center text-[11px] font-mono text-aluminum/40">
          This thread is locked.
        </div>
      ) : userId ? (
        <form onSubmit={(e) => submitComment(e)} className="mb-6">
          <MarkdownToolbar textareaRef={commentTextareaRef} />
          <textarea
            ref={commentTextareaRef}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="What are your thoughts?"
            className="w-full px-3 py-2.5 bg-blackout border border-white/5 rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30 transition-colors resize-y"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !commentBody.trim()}
              className="px-5 py-2 bg-signal-orange text-white font-heading font-bold text-[11px] tracking-[2px] uppercase rounded-lg hover:shadow-[0_0_16px_rgba(255,77,0,0.12)] transition-all disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-3 border border-ink/[0.08] text-center">
          <Link href="/login" className="text-signal-orange text-sm hover:underline">Log in to comment</Link>
        </div>
      )}

      {/* Comment sort */}
      <div
        ref={commentsReveal.ref}
        className={`flex items-center gap-1 mb-4 border-b border-white/[0.04] pb-2.5 transition-all duration-700 ${commentsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <span className="text-[11px] font-heading tracking-[1.5px] uppercase text-aluminum/40 mr-2">
          Sort by:
        </span>
        {(["best", "new", "old"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setCommentSort(s)}
            className={`px-3 py-1 text-[11px] font-heading font-semibold tracking-[1.5px] uppercase transition-colors ${
              commentSort === s
                ? "text-signal-orange"
                : "text-aluminum/50 hover:text-aluminum/60"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-[11px] font-mono text-aluminum/45">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Threaded Comments */}
      <div className="space-y-0">
        {tree.map((node) => (
          <CommentThread
            key={node.id}
            node={node}
            depth={0}
            userId={userId}
            userMarks={userMarks}
            collapsed={collapsed}
            replyTo={replyTo}
            submitting={submitting}
            postLocked={post.is_locked}
            deptId={deptId}
            onToggleHelpful={toggleHelpful}
            onToggleCollapse={toggleCollapse}
            onSetReplyTo={setReplyTo}
            onSubmitComment={submitComment}
            onReport={(id) => setShowReport({ type: "comment", id })}
            onMessage={startMessage}
          />
        ))}
      </div>

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          onClose={() => setShowReport(null)}
          onSubmit={submitReport}
        />
      )}
    </main>
  );
}

// ─── Comment Thread (Recursive) ───────────────────────────────

function CommentThread({
  node,
  depth,
  userId,
  userMarks,
  collapsed,
  replyTo,
  submitting,
  postLocked,
  deptId,
  onToggleHelpful,
  onToggleCollapse,
  onSetReplyTo,
  onSubmitComment,
  onReport,
  onMessage,
}: {
  node: CommentNode;
  depth: number;
  userId: string | null;
  userMarks: Set<string>;
  collapsed: Set<string>;
  replyTo: string | null;
  submitting: boolean;
  postLocked: boolean;
  deptId: string | null;
  onToggleHelpful: (target: { comment_id: string }) => void;
  onToggleCollapse: (id: string) => void;
  onSetReplyTo: (id: string | null) => void;
  onSubmitComment: (e: React.FormEvent, parentId: string) => void;
  onReport: (id: string) => void;
  onMessage: (targetUserId: string) => void;
}) {
  const name = node.profiles?.display_name || "Anonymous";
  const tier = node.tech_profiles?.level || 0;
  const skill = node.tech_profiles?.primary_skill;
  const verifiedSkill = getVerifiedSkill(deptId, node.tech_profiles?.skills || null);
  const isCollapsed = collapsed.has(node.id);
  const effectiveDepth = Math.min(depth, MAX_DEPTH);

  return (
    <div style={{ marginLeft: effectiveDepth > 0 ? "24px" : "0" }}>
      <div className={`${effectiveDepth > 0 ? `border-l-2 pl-4 thread-depth-${Math.min(effectiveDepth - 1, 5)}` : ""}`}>
        <div className="py-2">
          {/* Comment header */}
          <div className="flex items-center gap-2 text-[11px]">
            <button
              onClick={() => onToggleCollapse(node.id)}
              className="text-aluminum/45 hover:text-aluminum/60 transition-colors font-mono text-[10px] w-4 text-center flex-shrink-0"
            >
              {isCollapsed ? "[+]" : "[–]"}
            </button>

            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ring-1 ring-white/[0.06]"
              style={{
                backgroundColor: node.profiles?.avatar_url
                  ? undefined
                  : `hsl(${getHue(name)}, 40%, 25%)`,
              }}
            >
              {node.profiles?.avatar_url ? (
                <img src={node.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                getInitials(name)
              )}
            </div>

            <Link
              href={`/profile/${node.author_id}`}
              className="font-semibold text-house-lights/80 hover:text-signal-orange transition-colors text-[11px]"
            >
              {name}
            </Link>
            {skill && (
              <span className="text-aluminum/45 text-[10px]">{skill}</span>
            )}
            <span
              className="text-[9px] font-mono font-bold tracking-wider"
              style={{ color: TIER_COLORS[tier] }}
            >
              {TIER_NAMES[tier]}
            </span>
            {verifiedSkill && (
              <span className="px-1 py-px text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded">
                Verified {verifiedSkill}
              </span>
            )}
            <span className="text-aluminum/40 font-mono text-[10px]">{timeAgo(node.created_at)}</span>
          </div>

          {/* Comment body + actions (hidden when collapsed) */}
          {!isCollapsed && (
            <>
              <div
                className="text-sm text-house-lights/80 leading-relaxed mt-2 ml-9"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(node.body) }}
              />

              {/* Actions */}
              <div className="flex items-center gap-3.5 mt-2 ml-9 text-[10px] font-mono text-aluminum/40">
                <button
                  onClick={() => userId && onToggleHelpful({ comment_id: node.id })}
                  disabled={!userId}
                  className={`flex items-center gap-1 transition-all vote-btn ${
                    userMarks.has(node.id)
                      ? "text-signal-orange"
                      : userId ? "hover:text-signal-orange" : "opacity-50"
                  }`}
                >
                  <span>{userMarks.has(node.id) ? "▲" : "△"}</span>
                  <span>{node.helpful_count}</span>
                </button>

                {userId && !postLocked && (
                  <button
                    onClick={() => onSetReplyTo(replyTo === node.id ? null : node.id)}
                    className="hover:text-signal-orange transition-colors"
                  >
                    reply
                  </button>
                )}

                {userId && userId !== node.author_id && (
                  <button
                    onClick={() => onMessage(node.author_id)}
                    className="hover:text-signal-orange transition-colors"
                  >
                    message
                  </button>
                )}

                {userId && userId !== node.author_id && (
                  <button
                    onClick={() => onReport(node.id)}
                    className="hover:text-red-400/60 transition-colors"
                  >
                    report
                  </button>
                )}
              </div>

              {/* Reply form */}
              {replyTo === node.id && userId && (
                <form
                  onSubmit={(e) => onSubmitComment(e, node.id)}
                  className="mt-3 ml-9 bg-blackout/30 border border-white/[0.04] rounded-lg p-3"
                >
                  <textarea
                    id={`reply-${node.id}`}
                    rows={3}
                    maxLength={5000}
                    placeholder={`Reply to ${name}...`}
                    className="w-full px-3 py-2 bg-blackout border border-white/5 rounded-lg text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30 transition-colors resize-y"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => onSetReplyTo(null)}
                      className="px-3 py-1.5 text-[10px] font-heading tracking-wider uppercase text-aluminum/40 hover:text-house-lights transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-3 py-1.5 bg-signal-orange text-white font-heading font-bold text-[10px] tracking-[2px] uppercase rounded-md hover:shadow-[0_0_12px_rgba(255,77,0,0.12)] transition-all disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </form>
              )}

              {/* Children */}
              {node.children.length > 0 && (
                <div className="mt-0">
                  {node.children.map((child) => (
                    <CommentThread
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                      userId={userId}
                      userMarks={userMarks}
                      collapsed={collapsed}
                      replyTo={replyTo}
                      submitting={submitting}
                      postLocked={postLocked}
                      deptId={deptId}
                      onToggleHelpful={onToggleHelpful}
                      onToggleCollapse={onToggleCollapse}
                      onSetReplyTo={onSetReplyTo}
                      onSubmitComment={onSubmitComment}
                      onReport={onReport}
                      onMessage={onMessage}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Collapsed indicator */}
          {isCollapsed && node.children.length > 0 && (
            <span className="text-[10px] font-mono text-aluminum/35 ml-9">
              ({node.children.length} {node.children.length === 1 ? "child" : "children"})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────

function ReportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const reasons = ["Spam", "Harassment", "Off-topic", "Misinformation"];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className="bg-deep-stage border border-white/[0.06] rounded-lg w-full max-w-sm p-6 modal-panel shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-sm font-bold tracking-[2px] uppercase mb-4">Report Content</h3>
        <div className="space-y-2 mb-4">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all ${
                reason === r
                  ? "bg-signal-orange/15 text-signal-orange border border-signal-orange/20"
                  : "bg-blackout border border-white/5 text-aluminum/60 hover:text-house-lights hover:border-white/10"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1.5 text-[11px] font-heading tracking-wider uppercase text-aluminum/50 hover:text-house-lights transition-colors">
            Cancel
          </button>
          <button
            onClick={() => reason && onSubmit(reason)}
            disabled={!reason}
            className="px-4 py-2 bg-red-500/80 text-white font-heading font-bold text-[11px] tracking-[2px] uppercase rounded-lg hover:bg-red-500/90 transition-all disabled:opacity-50"
          >
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
