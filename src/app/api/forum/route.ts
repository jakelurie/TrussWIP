import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 30 });

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function getAuthUser(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ? { id: user.id, email: user.email || "" } : null;
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("post_id");
  const category = searchParams.get("category");
  const authorId = searchParams.get("author_id");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "newest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Single post with comments
  if (postId) {
    const { data: post } = await supabaseAdmin
      .from("forum_posts")
      .select(`
        *,
        forum_categories(slug, name, icon, department_id),
        profiles!forum_posts_author_id_fkey(display_name, avatar_url, city, is_verified),
        tech_profiles(level, primary_skill, skills)
      `)
      .eq("id", postId)
      .eq("is_hidden", false)
      .single();

    if (!post) return err("Post not found", 404);

    // Increment view count (fire-and-forget)
    supabaseAdmin
      .from("forum_posts")
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq("id", postId)
      .then(() => {});

    const { data: comments } = await supabaseAdmin
      .from("forum_comments")
      .select(`
        *, parent_comment_id,
        profiles!forum_comments_author_id_fkey(display_name, avatar_url, city, is_verified),
        tech_profiles(level, primary_skill, skills)
      `)
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true });

    // Get helpful marks for this post + its comments (for the requesting user)
    const authUser = await getAuthUser(req);
    let userMarks: string[] = [];
    if (authUser) {
      const { data: marks } = await supabaseAdmin
        .from("forum_helpful_marks")
        .select("post_id, comment_id")
        .eq("user_id", authUser.id)
        .or(`post_id.eq.${postId},comment_id.in.(${(comments || []).map(c => c.id).join(",")})`);
      userMarks = (marks || []).map(m => m.post_id || m.comment_id);
    }

    return NextResponse.json({ post, comments: comments || [], userMarks });
  }

  // Post list
  // Use left join for tech_profiles so producer posts also show
  let query = supabaseAdmin
    .from("forum_posts")
    .select(`
      id, title, slug, category_id, author_id, helpful_count, comment_count, view_count,
      is_pinned, created_at, last_comment_at,
      forum_categories(slug, name, icon),
      profiles!forum_posts_author_id_fkey(display_name, avatar_url),
      tech_profiles(level, primary_skill)
    `)
    .eq("is_hidden", false);

  if (category) {
    const { data: cat } = await supabaseAdmin
      .from("forum_categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (authorId) {
    query = query.eq("author_id", authorId);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  }

  // Sort
  if (sort === "helpful") {
    query = query.order("is_pinned", { ascending: false }).order("helpful_count", { ascending: false }).order("created_at", { ascending: false });
  } else if (sort === "active") {
    query = query.order("is_pinned", { ascending: false }).order("last_comment_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: posts, error: postsErr } = await query;
  if (postsErr) return err(postsErr.message, 500);

  return NextResponse.json({ posts: posts || [] });
}

// ─── POST ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const user = await getAuthUser(req);
  if (!user) return err("Unauthorized", 401);

  const body = await req.json();
  const { action } = body;

  // ── Create Post ──
  if (action === "create_post") {
    const { title, postBody, category_id } = body;
    if (!title?.trim() || !postBody?.trim() || !category_id) {
      return err("Title, body, and category are required");
    }
    if (title.length > 200) return err("Title too long (max 200 chars)");
    if (postBody.length > 10000) return err("Body too long (max 10,000 chars)");

    const slug = generateSlug(title);

    const { data: post, error: postErr } = await supabaseAdmin
      .from("forum_posts")
      .insert({
        category_id,
        author_id: user.id,
        title: title.trim(),
        slug,
        body: postBody.trim(),
      })
      .select("id, slug")
      .single();

    if (postErr) return err(postErr.message, 500);

    // Increment category post_count and update last_post_at
    const { data: cat } = await supabaseAdmin
      .from("forum_categories")
      .select("post_count")
      .eq("id", category_id)
      .single();
    await supabaseAdmin
      .from("forum_categories")
      .update({
        post_count: (cat?.post_count || 0) + 1,
        last_post_at: new Date().toISOString(),
      })
      .eq("id", category_id);

    return NextResponse.json({ post });
  }

  // ── Create Comment ──
  if (action === "create_comment") {
    const { post_id, commentBody, parent_comment_id } = body;
    if (!post_id || !commentBody?.trim()) return err("Post ID and body are required");
    if (commentBody.length > 5000) return err("Comment too long (max 5,000 chars)");

    // Check post exists and isn't locked
    const { data: post } = await supabaseAdmin
      .from("forum_posts")
      .select("id, is_locked, category_id")
      .eq("id", post_id)
      .eq("is_hidden", false)
      .single();
    if (!post) return err("Post not found", 404);
    if (post.is_locked) return err("This thread is locked");

    const insertData: Record<string, string> = {
      post_id,
      author_id: user.id,
      body: commentBody.trim(),
    };
    if (parent_comment_id) insertData.parent_comment_id = parent_comment_id;

    const { data: comment, error: commentErr } = await supabaseAdmin
      .from("forum_comments")
      .insert(insertData)
      .select("id")
      .single();

    if (commentErr) return err(commentErr.message, 500);

    // Update post comment_count and last_comment_at
    const { data: postData } = await supabaseAdmin
      .from("forum_posts")
      .select("comment_count")
      .eq("id", post_id)
      .single();
    await supabaseAdmin
      .from("forum_posts")
      .update({
        comment_count: (postData?.comment_count || 0) + 1,
        last_comment_at: new Date().toISOString(),
      })
      .eq("id", post_id);

    return NextResponse.json({ comment });
  }

  // ── Toggle Helpful ──
  if (action === "toggle_helpful") {
    const { post_id, comment_id } = body;
    if (!post_id && !comment_id) return err("post_id or comment_id required");

    const target = post_id ? { post_id } : { comment_id };
    const table = post_id ? "forum_posts" : "forum_comments";
    const targetId = post_id || comment_id;

    // Check if already marked
    let checkQuery = supabaseAdmin
      .from("forum_helpful_marks")
      .select("id")
      .eq("user_id", user.id);
    if (post_id) checkQuery = checkQuery.eq("post_id", post_id);
    else checkQuery = checkQuery.eq("comment_id", comment_id);

    const { data: existing } = await checkQuery.single();

    if (existing) {
      // Remove mark
      await supabaseAdmin.from("forum_helpful_marks").delete().eq("id", existing.id);
      const { data: item } = await supabaseAdmin.from(table).select("helpful_count").eq("id", targetId).single();
      await supabaseAdmin.from(table).update({ helpful_count: Math.max(0, (item?.helpful_count || 1) - 1) }).eq("id", targetId);
      return NextResponse.json({ marked: false });
    } else {
      // Add mark
      await supabaseAdmin.from("forum_helpful_marks").insert({ user_id: user.id, ...target });
      const { data: item } = await supabaseAdmin.from(table).select("helpful_count").eq("id", targetId).single();
      await supabaseAdmin.from(table).update({ helpful_count: (item?.helpful_count || 0) + 1 }).eq("id", targetId);
      return NextResponse.json({ marked: true });
    }
  }

  // ── Delete Post (soft) ──
  if (action === "delete_post") {
    const { post_id } = body;
    if (!post_id) return err("post_id required");

    const { data: post } = await supabaseAdmin
      .from("forum_posts")
      .select("author_id")
      .eq("id", post_id)
      .single();
    if (!post) return err("Post not found", 404);
    if (post.author_id !== user.id) return err("Not your post", 403);

    await supabaseAdmin.from("forum_posts").update({ is_hidden: true }).eq("id", post_id);
    return NextResponse.json({ deleted: true });
  }

  // ── Delete Comment (soft) ──
  if (action === "delete_comment") {
    const { comment_id } = body;
    if (!comment_id) return err("comment_id required");

    const { data: comment } = await supabaseAdmin
      .from("forum_comments")
      .select("author_id")
      .eq("id", comment_id)
      .single();
    if (!comment) return err("Comment not found", 404);
    if (comment.author_id !== user.id) return err("Not your comment", 403);

    await supabaseAdmin.from("forum_comments").update({ is_hidden: true }).eq("id", comment_id);
    return NextResponse.json({ deleted: true });
  }

  // ── Report ──
  if (action === "report") {
    const { post_id, comment_id, reason, details } = body;
    if (!post_id && !comment_id) return err("post_id or comment_id required");
    if (!reason) return err("Reason required");

    await supabaseAdmin.from("forum_reports").insert({
      reporter_id: user.id,
      post_id: post_id || null,
      comment_id: comment_id || null,
      reason,
      details: details || null,
    });
    return NextResponse.json({ reported: true });
  }

  // ── Admin Moderate ──
  if (action === "admin_moderate") {
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) return err("Forbidden", 403);

    const { post_id, moderate_action } = body;
    if (!post_id || !moderate_action) return err("post_id and moderate_action required");

    const updates: Record<string, boolean> = {};
    if (moderate_action === "hide") updates.is_hidden = true;
    if (moderate_action === "unhide") updates.is_hidden = false;
    if (moderate_action === "lock") updates.is_locked = true;
    if (moderate_action === "unlock") updates.is_locked = false;
    if (moderate_action === "pin") updates.is_pinned = true;
    if (moderate_action === "unpin") updates.is_pinned = false;

    if (Object.keys(updates).length === 0) return err("Invalid moderate_action");

    await supabaseAdmin.from("forum_posts").update(updates).eq("id", post_id);
    return NextResponse.json({ moderated: true });
  }

  return err("Unknown action");
}
