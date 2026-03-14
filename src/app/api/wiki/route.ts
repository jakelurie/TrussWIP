import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 30 });

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function getAuthUser(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ? { id: user.id, email: user.email || "" } : null;
}

async function upsertStats(gearId: string, updates: Record<string, any>) {
  const { data: existing } = await supabaseAdmin
    .from("wiki_page_stats")
    .select("gear_id")
    .eq("gear_id", gearId)
    .single();

  if (existing) {
    await supabaseAdmin.from("wiki_page_stats").update({ ...updates, last_activity_at: new Date().toISOString() }).eq("gear_id", gearId);
  } else {
    await supabaseAdmin.from("wiki_page_stats").insert({ gear_id: gearId, ...updates, last_activity_at: new Date().toISOString() });
  }
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gearId = searchParams.get("gear_id");
  const questionId = searchParams.get("question_id");
  const authorId = searchParams.get("author_id");
  const noteCategory = searchParams.get("category");
  const sort = searchParams.get("sort") || "newest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const profileSelect = "display_name, avatar_url, city, is_verified";
  const techProfileSelect = "level, primary_skill, skills";

  // ── Single question with answers ──
  if (questionId) {
    const { data: question } = await supabaseAdmin
      .from("wiki_questions")
      .select(`*, profiles!wiki_questions_author_id_fkey(${profileSelect}), tech_profiles!inner(${techProfileSelect})`)
      .eq("id", questionId)
      .eq("is_hidden", false)
      .single();

    if (!question) return err("Question not found", 404);

    // Increment view count
    await supabaseAdmin.from("wiki_questions").update({ view_count: (question.view_count || 0) + 1 }).eq("id", questionId);

    let answersQuery = supabaseAdmin
      .from("wiki_answers")
      .select(`*, profiles!wiki_answers_author_id_fkey(${profileSelect}), tech_profiles!inner(${techProfileSelect})`)
      .eq("question_id", questionId)
      .eq("is_hidden", false);

    if (sort === "helpful") {
      answersQuery = answersQuery.order("is_accepted", { ascending: false }).order("helpful_count", { ascending: false });
    } else {
      answersQuery = answersQuery.order("is_accepted", { ascending: false }).order("created_at", { ascending: true });
    }

    const { data: answers } = await answersQuery;

    // User marks
    const authUser = await getAuthUser(req);
    let userMarks: string[] = [];
    if (authUser) {
      const answerIds = (answers || []).map(a => a.id);
      const { data: marks } = await supabaseAdmin
        .from("wiki_helpful_marks")
        .select("question_id, answer_id")
        .eq("user_id", authUser.id);

      userMarks = (marks || [])
        .filter(m => m.question_id === questionId || answerIds.includes(m.answer_id))
        .map(m => m.question_id || m.answer_id);
    }

    return NextResponse.json({ question, answers: answers || [], userMarks });
  }

  // ── Revision history ──
  const revisionGearId = searchParams.get("revisions_for");
  if (revisionGearId) {
    const revLimit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const revOffset = parseInt(searchParams.get("offset") || "0");

    const { data: revisions, count } = await supabaseAdmin
      .from("wiki_revisions")
      .select("id, gear_id, editor_id, summary, created_at, profiles!wiki_revisions_editor_id_fkey(display_name, avatar_url)", { count: "exact" })
      .eq("gear_id", revisionGearId)
      .order("created_at", { ascending: false })
      .range(revOffset, revOffset + revLimit - 1);

    return NextResponse.json({ revisions: revisions || [], total: count || 0 });
  }

  // ── Single revision content ──
  const revisionId = searchParams.get("revision_id");
  if (revisionId) {
    const { data: revision } = await supabaseAdmin
      .from("wiki_revisions")
      .select("*, profiles!wiki_revisions_editor_id_fkey(display_name, avatar_url)")
      .eq("id", revisionId)
      .single();

    if (!revision) return err("Revision not found", 404);
    return NextResponse.json({ revision });
  }

  // ── Gear page data ──
  if (gearId) {
    // Fetch article content
    const { data: article } = await supabaseAdmin
      .from("wiki_articles")
      .select("content, last_editor_id, edit_count, updated_at, profiles!wiki_articles_last_editor_id_fkey(display_name)")
      .eq("gear_id", gearId)
      .single();

    const { data: stats } = await supabaseAdmin
      .from("wiki_page_stats")
      .select("*")
      .eq("gear_id", gearId)
      .single();

    // Fetch notes
    let notesQuery = supabaseAdmin
      .from("wiki_notes")
      .select(`*, profiles!wiki_notes_author_id_fkey(${profileSelect}), tech_profiles!inner(${techProfileSelect})`)
      .eq("gear_id", gearId)
      .eq("is_hidden", false);

    if (noteCategory) {
      notesQuery = notesQuery.eq("category", noteCategory);
    }

    if (sort === "helpful") {
      notesQuery = notesQuery.order("helpful_count", { ascending: false });
    } else {
      notesQuery = notesQuery.order("created_at", { ascending: false });
    }

    notesQuery = notesQuery.range(offset, offset + limit - 1);
    const { data: notes } = await notesQuery;

    // Fetch questions
    let questionsQuery = supabaseAdmin
      .from("wiki_questions")
      .select(`*, profiles!wiki_questions_author_id_fkey(${profileSelect}), tech_profiles!inner(${techProfileSelect})`)
      .eq("gear_id", gearId)
      .eq("is_hidden", false);

    if (sort === "helpful") {
      questionsQuery = questionsQuery.order("answer_count", { ascending: false });
    } else {
      questionsQuery = questionsQuery.order("created_at", { ascending: false });
    }

    questionsQuery = questionsQuery.range(offset, offset + limit - 1);
    const { data: questions } = await questionsQuery;

    // User marks
    const authUser = await getAuthUser(req);
    let userMarks: string[] = [];
    if (authUser) {
      const noteIds = (notes || []).map(n => n.id);
      const questionIds = (questions || []).map(q => q.id);
      const allIds = [...noteIds, ...questionIds];

      if (allIds.length > 0) {
        const { data: marks } = await supabaseAdmin
          .from("wiki_helpful_marks")
          .select("note_id, question_id")
          .eq("user_id", authUser.id);

        userMarks = (marks || [])
          .filter(m => allIds.includes(m.note_id) || allIds.includes(m.question_id))
          .map(m => m.note_id || m.question_id);
      }
    }

    return NextResponse.json({
      article: article || null,
      stats: stats || { gear_id: gearId, note_count: 0, question_count: 0, answer_count: 0, view_count: 0, edit_count: 0 },
      notes: notes || [],
      questions: questions || [],
      userMarks,
    });
  }

  // ── Author contributions (for profile tab) ──
  if (authorId) {
    const { data: notes } = await supabaseAdmin
      .from("wiki_notes")
      .select("id, gear_id, category, body, helpful_count, created_at")
      .eq("author_id", authorId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    const { data: questions } = await supabaseAdmin
      .from("wiki_questions")
      .select("id, gear_id, title, answer_count, created_at")
      .eq("author_id", authorId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({ notes: notes || [], questions: questions || [] });
  }

  // ── All page stats (for wiki home) ──
  const { data: allStats } = await supabaseAdmin
    .from("wiki_page_stats")
    .select("*")
    .order("last_activity_at", { ascending: false });

  return NextResponse.json({ stats: allStats || [] });
}

// ─── POST ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const user = await getAuthUser(req);
  if (!user) return err("Unauthorized", 401);

  const body = await req.json();
  const { action } = body;

  // ── Save Article ──
  if (action === "save_article") {
    const { gear_id, content, summary } = body;
    if (!gear_id) return err("gear_id required");
    if (typeof content !== "string") return err("content required");
    if (content.length > 50000) return err("Article content max 50,000 characters");
    const editSummary = (summary || "").trim().slice(0, 200);

    // Save revision
    await supabaseAdmin.from("wiki_revisions").insert({
      gear_id,
      editor_id: user.id,
      content,
      summary: editSummary,
    });

    // Upsert article
    const { data: existing } = await supabaseAdmin
      .from("wiki_articles")
      .select("edit_count")
      .eq("gear_id", gear_id)
      .single();

    if (existing) {
      await supabaseAdmin.from("wiki_articles").update({
        content,
        last_editor_id: user.id,
        edit_count: (existing.edit_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq("gear_id", gear_id);
    } else {
      await supabaseAdmin.from("wiki_articles").insert({
        gear_id,
        content,
        last_editor_id: user.id,
        edit_count: 1,
      });
    }

    // Update page stats
    const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("edit_count").eq("gear_id", gear_id).single();
    await upsertStats(gear_id, { edit_count: (stats?.edit_count || 0) + 1 });

    return NextResponse.json({ saved: true });
  }

  // ── Create Note ──
  if (action === "create_note") {
    const { gear_id, category, body: noteBody } = body;
    if (!gear_id || !category || !noteBody?.trim()) return err("gear_id, category, and body required");
    if (!["tip", "issue", "compatibility", "story"].includes(category)) return err("Invalid category");
    if (noteBody.length > 3000) return err("Note body max 3000 characters");

    const { data: note, error } = await supabaseAdmin
      .from("wiki_notes")
      .insert({ gear_id, author_id: user.id, category, body: noteBody.trim() })
      .select("id")
      .single();

    if (error) return err(error.message);

    // Update stats
    const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("note_count").eq("gear_id", gear_id).single();
    await upsertStats(gear_id, { note_count: (stats?.note_count || 0) + 1 });

    return NextResponse.json({ id: note.id });
  }

  // ── Create Question ──
  if (action === "create_question") {
    const { gear_id, title, body: qBody } = body;
    if (!gear_id || !title?.trim() || !qBody?.trim()) return err("gear_id, title, and body required");
    if (title.length > 200) return err("Title max 200 characters");
    if (qBody.length > 5000) return err("Body max 5000 characters");

    const { data: question, error } = await supabaseAdmin
      .from("wiki_questions")
      .insert({ gear_id, author_id: user.id, title: title.trim(), body: qBody.trim() })
      .select("id")
      .single();

    if (error) return err(error.message);

    const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("question_count").eq("gear_id", gear_id).single();
    await upsertStats(gear_id, { question_count: (stats?.question_count || 0) + 1 });

    return NextResponse.json({ id: question.id });
  }

  // ── Create Answer ──
  if (action === "create_answer") {
    const { question_id, body: aBody } = body;
    if (!question_id || !aBody?.trim()) return err("question_id and body required");
    if (aBody.length > 5000) return err("Body max 5000 characters");

    const { data: question } = await supabaseAdmin
      .from("wiki_questions")
      .select("gear_id, answer_count")
      .eq("id", question_id)
      .single();

    if (!question) return err("Question not found", 404);

    const { data: answer, error } = await supabaseAdmin
      .from("wiki_answers")
      .insert({ question_id, author_id: user.id, body: aBody.trim() })
      .select("id")
      .single();

    if (error) return err(error.message);

    // Update question answer_count
    await supabaseAdmin.from("wiki_questions").update({ answer_count: (question.answer_count || 0) + 1 }).eq("id", question_id);

    // Update page stats
    const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("answer_count").eq("gear_id", question.gear_id).single();
    await upsertStats(question.gear_id, { answer_count: (stats?.answer_count || 0) + 1 });

    return NextResponse.json({ id: answer.id });
  }

  // ── Toggle Helpful ──
  if (action === "toggle_helpful") {
    const { note_id, question_id, answer_id } = body;
    const targetCount = [note_id, question_id, answer_id].filter(Boolean).length;
    if (targetCount !== 1) return err("Exactly one of note_id, question_id, or answer_id required");

    const target = note_id ? { note_id } : question_id ? { question_id } : { answer_id };
    const table = note_id ? "wiki_notes" : question_id ? "wiki_questions" : "wiki_answers";
    const targetId = note_id || question_id || answer_id;

    // Check existing
    let checkQuery = supabaseAdmin.from("wiki_helpful_marks").select("id").eq("user_id", user.id);
    if (note_id) checkQuery = checkQuery.eq("note_id", note_id);
    else if (question_id) checkQuery = checkQuery.eq("question_id", question_id);
    else checkQuery = checkQuery.eq("answer_id", answer_id);

    const { data: existing } = await checkQuery.single();

    if (existing) {
      await supabaseAdmin.from("wiki_helpful_marks").delete().eq("id", existing.id);
      const { data: item } = await supabaseAdmin.from(table).select("helpful_count").eq("id", targetId).single();
      await supabaseAdmin.from(table).update({ helpful_count: Math.max(0, (item?.helpful_count || 1) - 1) }).eq("id", targetId);
      return NextResponse.json({ marked: false });
    } else {
      await supabaseAdmin.from("wiki_helpful_marks").insert({ user_id: user.id, ...target });
      const { data: item } = await supabaseAdmin.from(table).select("helpful_count").eq("id", targetId).single();
      await supabaseAdmin.from(table).update({ helpful_count: (item?.helpful_count || 0) + 1 }).eq("id", targetId);
      return NextResponse.json({ marked: true });
    }
  }

  // ── Accept Answer ──
  if (action === "accept_answer") {
    const { question_id, answer_id } = body;
    if (!question_id || !answer_id) return err("question_id and answer_id required");

    // Verify user is the question author
    const { data: question } = await supabaseAdmin
      .from("wiki_questions")
      .select("author_id, accepted_answer_id")
      .eq("id", question_id)
      .single();

    if (!question) return err("Question not found", 404);
    if (question.author_id !== user.id) return err("Only the question author can accept an answer", 403);

    // Unset previous accepted answer
    if (question.accepted_answer_id) {
      await supabaseAdmin.from("wiki_answers").update({ is_accepted: false }).eq("id", question.accepted_answer_id);
    }

    // Set new accepted answer
    await supabaseAdmin.from("wiki_answers").update({ is_accepted: true }).eq("id", answer_id);
    await supabaseAdmin.from("wiki_questions").update({ accepted_answer_id: answer_id }).eq("id", question_id);

    return NextResponse.json({ accepted: true });
  }

  // ── Delete Note ──
  if (action === "delete_note") {
    const { note_id } = body;
    if (!note_id) return err("note_id required");

    const { data: note } = await supabaseAdmin.from("wiki_notes").select("author_id, gear_id").eq("id", note_id).single();
    if (!note) return err("Note not found", 404);

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    if (note.author_id !== user.id && !isAdmin) return err("Forbidden", 403);

    await supabaseAdmin.from("wiki_notes").update({ is_hidden: true }).eq("id", note_id);

    const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("note_count").eq("gear_id", note.gear_id).single();
    if (stats) {
      await supabaseAdmin.from("wiki_page_stats").update({ note_count: Math.max(0, (stats.note_count || 1) - 1) }).eq("gear_id", note.gear_id);
    }

    return NextResponse.json({ deleted: true });
  }

  // ── Delete Question ──
  if (action === "delete_question") {
    const { question_id } = body;
    if (!question_id) return err("question_id required");

    const { data: question } = await supabaseAdmin.from("wiki_questions").select("author_id, gear_id").eq("id", question_id).single();
    if (!question) return err("Question not found", 404);

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    if (question.author_id !== user.id && !isAdmin) return err("Forbidden", 403);

    await supabaseAdmin.from("wiki_questions").update({ is_hidden: true }).eq("id", question_id);

    const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("question_count").eq("gear_id", question.gear_id).single();
    if (stats) {
      await supabaseAdmin.from("wiki_page_stats").update({ question_count: Math.max(0, (stats.question_count || 1) - 1) }).eq("gear_id", question.gear_id);
    }

    return NextResponse.json({ deleted: true });
  }

  // ── Delete Answer ──
  if (action === "delete_answer") {
    const { answer_id } = body;
    if (!answer_id) return err("answer_id required");

    const { data: answer } = await supabaseAdmin.from("wiki_answers").select("author_id, question_id").eq("id", answer_id).single();
    if (!answer) return err("Answer not found", 404);

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    if (answer.author_id !== user.id && !isAdmin) return err("Forbidden", 403);

    await supabaseAdmin.from("wiki_answers").update({ is_hidden: true }).eq("id", answer_id);

    // Decrement question answer_count
    const { data: question } = await supabaseAdmin.from("wiki_questions").select("answer_count, gear_id, accepted_answer_id").eq("id", answer.question_id).single();
    if (question) {
      const updates: any = { answer_count: Math.max(0, (question.answer_count || 1) - 1) };
      if (question.accepted_answer_id === answer_id) {
        updates.accepted_answer_id = null;
      }
      await supabaseAdmin.from("wiki_questions").update(updates).eq("id", answer.question_id);

      const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("answer_count").eq("gear_id", question.gear_id).single();
      if (stats) {
        await supabaseAdmin.from("wiki_page_stats").update({ answer_count: Math.max(0, (stats.answer_count || 1) - 1) }).eq("gear_id", question.gear_id);
      }
    }

    return NextResponse.json({ deleted: true });
  }

  // ── Report ──
  if (action === "report") {
    const { note_id, question_id, answer_id, reason } = body;
    const targetCount = [note_id, question_id, answer_id].filter(Boolean).length;
    if (targetCount !== 1) return err("Exactly one target required");
    if (!reason?.trim()) return err("Reason required");

    // Reuse forum_reports table with a wiki prefix in reason
    await supabaseAdmin.from("forum_reports").insert({
      reporter_id: user.id,
      post_id: null,
      comment_id: null,
      reason: `[wiki] ${reason.trim()}`,
      details: JSON.stringify({ note_id, question_id, answer_id }),
    });

    return NextResponse.json({ reported: true });
  }

  // ── Admin Moderate ──
  if (action === "admin_moderate") {
    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
    if (!isAdmin) return err("Forbidden", 403);

    const { target_type, target_id, moderate_action } = body;
    if (!target_type || !target_id || !moderate_action) return err("target_type, target_id, moderate_action required");

    const tableMap: Record<string, string> = { note: "wiki_notes", question: "wiki_questions", answer: "wiki_answers" };
    const table = tableMap[target_type];
    if (!table) return err("Invalid target_type");

    if (moderate_action === "hide") {
      await supabaseAdmin.from(table).update({ is_hidden: true }).eq("id", target_id);
    } else if (moderate_action === "unhide") {
      await supabaseAdmin.from(table).update({ is_hidden: false }).eq("id", target_id);
    }

    return NextResponse.json({ moderated: true });
  }

  // ── Increment View ──
  if (action === "increment_view") {
    const { gear_id } = body;
    if (!gear_id) return err("gear_id required");

    const { data: stats } = await supabaseAdmin.from("wiki_page_stats").select("view_count").eq("gear_id", gear_id).single();
    await upsertStats(gear_id, { view_count: (stats?.view_count || 0) + 1 });

    return NextResponse.json({ ok: true });
  }

  return err("Unknown action");
}
