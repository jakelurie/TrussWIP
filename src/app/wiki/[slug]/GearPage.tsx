"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugToGearId, getGearById, gearIdToSlug, GEAR_CATEGORIES } from "@/lib/taxonomy";
import { supabase } from "@/lib/supabase";
import { renderMarkdown } from "@/lib/markdown";

const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];
const TIER_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "#9B59B6", "var(--color-signal-orange)", "var(--color-standby-amber)"];

const NOTE_CATEGORIES = [
  { id: "tip", label: "Tips & Tricks", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" },
  { id: "issue", label: "Known Issues", color: "text-red-400 border-red-400/20 bg-red-400/5" },
  { id: "compatibility", label: "Compatibility", color: "text-blue-400 border-blue-400/20 bg-blue-400/5" },
  { id: "story", label: "Show Stories", color: "text-purple-400 border-purple-400/20 bg-purple-400/5" },
];

// ── Section parser for table of contents ──
function extractSections(md: string): { id: string; title: string; level: number }[] {
  const sections: { id: string; title: string; level: number }[] = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^(#{2,4})\s+(.*)/);
    if (m) {
      const title = m[2].replace(/\*\*/g, "").replace(/\*/g, "");
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      sections.push({ id, title, level: m[1].length });
    }
  }
  return sections;
}

function getHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Note {
  id: string;
  gear_id: string;
  category: string;
  body: string;
  helpful_count: number;
  created_at: string;
  author_id: string;
  profiles: { display_name: string; avatar_url: string | null; city: string | null; is_verified: boolean } | null;
  tech_profiles: { level: number; primary_skill: string | null; skills: string[] } | null;
}

interface Question {
  id: string;
  gear_id: string;
  title: string;
  body: string;
  answer_count: number;
  view_count: number;
  accepted_answer_id: string | null;
  created_at: string;
  author_id: string;
  profiles: { display_name: string; avatar_url: string | null; city: string | null; is_verified: boolean } | null;
  tech_profiles: { level: number; primary_skill: string | null; skills: string[] } | null;
}

interface Revision {
  id: string;
  gear_id: string;
  editor_id: string;
  summary: string;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
}

interface Article {
  content: string;
  last_editor_id: string | null;
  edit_count: number;
  updated_at: string;
  profiles: { display_name: string } | null;
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// ── Default article template ──
function getDefaultTemplate(gearName: string, manufacturer: string, category: string, tags: string[]): string {
  return `## Overview

The **${gearName}** by ${manufacturer} is a ${category.toLowerCase()} used in professional AV production.

## Specifications

*Add key specifications, I/O counts, and technical details here.*

## Setup Guide

*Document common setup procedures, signal flow, and best practices.*

## Common Issues

*List known issues, firmware bugs, and workarounds.*

## Compatibility

*Note compatibility with other gear, firmware versions, and integration tips.*

## Tips & Tricks

*Share real-world tips from the field.*
`;
}

export default function GearPage({ slug }: { slug: string }) {
  const gearId = slugToGearId(slug);
  const gear = getGearById(gearId);
  const category = GEAR_CATEGORIES.find(c => c.items.some(i => i.id === gearId));
  const router = useRouter();

  const [tab, setTab] = useState<"article" | "discussion" | "qa" | "history">("article");
  const [article, setArticle] = useState<Article | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [stats, setStats] = useState({ note_count: 0, question_count: 0, answer_count: 0, view_count: 0, edit_count: 0 });
  const [userMarks, setUserMarks] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [noteFilter, setNoteFilter] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [saving, setSaving] = useState(false);

  // Forms
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteCategory, setNoteCategory] = useState("tip");
  const [noteBody, setNoteBody] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [qTitle, setQTitle] = useState("");
  const [qBody, setQBody] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ gear_id: gearId, sort });
    if (noteFilter) params.set("category", noteFilter);
    fetch(`/api/wiki?${params}`)
      .then(r => r.json())
      .then(d => {
        setArticle(d.article || null);
        setNotes(d.notes || []);
        setQuestions(d.questions || []);
        setStats(d.stats || { note_count: 0, question_count: 0, answer_count: 0, view_count: 0, edit_count: 0 });
        setUserMarks(new Set(d.userMarks || []));
      });
  }, [gearId, noteFilter, sort]);

  // Load history when tab switches to history
  useEffect(() => {
    if (tab === "history") {
      fetch(`/api/wiki?revisions_for=${gearId}`)
        .then(r => r.json())
        .then(d => setRevisions(d.revisions || []));
    }
  }, [tab, gearId]);

  // Increment view on mount
  useEffect(() => {
    getToken().then(token => {
      if (token) {
        fetch("/api/wiki", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "increment_view", gear_id: gearId }),
        });
      }
    });
  }, [gearId]);

  const startEditing = () => {
    const content = article?.content || (gear ? getDefaultTemplate(gear.name, gear.manufacturer, category?.name || "gear", gear.tags) : "");
    setEditContent(content);
    setEditSummary("");
    setEditing(true);
  };

  const saveArticle = async () => {
    if (saving) return;
    setSaving(true);
    const token = await getToken();
    if (!token) { setSaving(false); return; }

    const res = await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "save_article", gear_id: gearId, content: editContent, summary: editSummary }),
    });

    if (res.ok) {
      setEditing(false);
      // Refresh
      const params = new URLSearchParams({ gear_id: gearId, sort });
      const r = await fetch(`/api/wiki?${params}`);
      const d = await r.json();
      setArticle(d.article || null);
      setStats(d.stats || stats);
    }
    setSaving(false);
  };

  const toggleHelpful = async (target: { note_id?: string; question_id?: string }) => {
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "toggle_helpful", ...target }),
    });
    const data = await res.json();
    const targetId = target.note_id || target.question_id!;

    setUserMarks(prev => {
      const next = new Set(prev);
      if (data.marked) next.add(targetId); else next.delete(targetId);
      return next;
    });

    if (target.note_id) {
      setNotes(prev => prev.map(n => n.id === target.note_id ? { ...n, helpful_count: n.helpful_count + (data.marked ? 1 : -1) } : n));
    }
  };

  const submitNote = async () => {
    if (!noteBody.trim() || submittingNote) return;
    setSubmittingNote(true);
    const token = await getToken();
    if (!token) { setSubmittingNote(false); return; }

    const res = await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "create_note", gear_id: gearId, category: noteCategory, body: noteBody }),
    });

    if (res.ok) {
      setNoteBody("");
      setShowNoteForm(false);
      const params = new URLSearchParams({ gear_id: gearId, sort });
      if (noteFilter) params.set("category", noteFilter);
      const r = await fetch(`/api/wiki?${params}`);
      const d = await r.json();
      setNotes(d.notes || []);
      setStats(d.stats || stats);
    }
    setSubmittingNote(false);
  };

  const submitQuestion = async () => {
    if (!qTitle.trim() || !qBody.trim() || submittingQuestion) return;
    setSubmittingQuestion(true);
    const token = await getToken();
    if (!token) { setSubmittingQuestion(false); return; }

    const res = await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "create_question", gear_id: gearId, title: qTitle, body: qBody }),
    });

    if (res.ok) {
      setQTitle("");
      setQBody("");
      setShowQuestionForm(false);
      const params = new URLSearchParams({ gear_id: gearId, sort });
      const r = await fetch(`/api/wiki?${params}`);
      const d = await r.json();
      setQuestions(d.questions || []);
      setStats(d.stats || stats);
    }
    setSubmittingQuestion(false);
  };

  if (!gear) {
    return (
      <main className="min-h-screen bg-blackout flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Gear Not Found</h1>
          <p className="text-sm text-aluminum/50 mb-4">This gear item doesn&apos;t exist in the taxonomy.</p>
          <Link href="/wiki" className="text-sm text-signal-orange hover:underline">Back to Wiki</Link>
        </div>
      </main>
    );
  }

  const articleContent = article?.content || "";
  const sections = extractSections(articleContent);

  return (
    <main className="min-h-screen bg-blackout">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-aluminum/40 mb-6">
          <Link href="/wiki" className="hover:text-signal-orange transition-colors">Wiki</Link>
          <span>/</span>
          <span>{category?.name}</span>
          <span>/</span>
          <span className="text-aluminum/60">{gear.name}</span>
        </div>

        {/* Header Card */}
        <div className="p-6 rounded-xl bg-deep-stage border border-ink/[0.04] mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">{gear.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-sm font-mono text-aluminum/60">{gear.manufacturer}</span>
                {category && (
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider border rounded text-signal-orange/60 border-signal-orange/20">
                    {category.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {gear.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 text-[9px] font-mono text-aluminum/40 bg-ink/[0.03] rounded">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-mono text-aluminum/40">
              <span>{stats.edit_count || 0} edits</span>
              <span>{stats.note_count} notes</span>
              <span>{stats.question_count} questions</span>
              <span>{stats.view_count} views</span>
            </div>
          </div>
          {article?.profiles?.display_name && (
            <div className="mt-3 pt-3 border-t border-ink/[0.04] text-[10px] font-mono text-aluminum/30">
              Last edited by {article.profiles.display_name} · {timeAgo(article.updated_at)}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-signal-orange/8 mb-6 overflow-x-auto">
          {([
            { id: "article" as const, label: "Article", count: stats.edit_count || null },
            { id: "discussion" as const, label: "Discussion", count: stats.note_count },
            { id: "qa" as const, label: "Q&A", count: stats.question_count },
            { id: "history" as const, label: "History", count: stats.edit_count || null },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 font-heading text-xs font-semibold tracking-widest uppercase transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "text-house-lights border-b-2 border-signal-orange"
                  : "text-aluminum border-b-2 border-transparent hover:text-house-lights"
              }`}
            >
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={`font-mono text-[9px] ml-1.5 px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? "bg-signal-orange/15 text-signal-orange" : "bg-white/5 text-aluminum/65"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ ARTICLE TAB ═══ */}
        {tab === "article" && !editing && (
          <div className="flex gap-8">
            {/* Table of Contents sidebar */}
            {sections.length > 2 && (
              <aside className="hidden lg:block w-52 flex-shrink-0">
                <div className="sticky top-20">
                  <div className="text-[9px] font-mono font-bold tracking-[3px] uppercase text-aluminum/30 mb-3">Contents</div>
                  <nav className="space-y-1.5">
                    {sections.map(s => (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className={`block text-[11px] font-mono transition-colors hover:text-signal-orange ${
                          s.level === 2 ? "text-aluminum/60" : "text-aluminum/35 pl-3"
                        }`}
                      >
                        {s.title}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

            {/* Article body */}
            <div className="flex-1 min-w-0">
              {userId && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={startEditing}
                    className="px-4 py-1.5 text-xs font-heading font-semibold tracking-wider uppercase border border-signal-orange/30 text-signal-orange rounded hover:bg-signal-orange/10 transition-colors"
                  >
                    Edit Article
                  </button>
                </div>
              )}

              {articleContent ? (
                <div
                  className="wiki-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(articleContent, { wikiLinks: true }) }}
                />
              ) : (
                <div className="text-center py-16 bg-deep-stage rounded-lg">
                  <div className="text-sm text-aluminum/50 mb-4">This article hasn&apos;t been written yet.</div>
                  {userId ? (
                    <button
                      onClick={startEditing}
                      className="px-5 py-2 text-xs font-heading font-semibold tracking-wider uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Write the First Article
                    </button>
                  ) : (
                    <p className="text-xs text-aluminum/40">
                      <Link href="/login" className="text-signal-orange hover:underline">Log in</Link> to create this article.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ EDIT MODE ═══ */}
        {tab === "article" && editing && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-sm font-bold tracking-wider uppercase text-aluminum/60">Editing: {gear.name}</h2>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.markdownguide.org/cheat-sheet/"
                  target="_blank"
                  rel="noopener"
                  className="text-[10px] font-mono text-aluminum/30 hover:text-signal-orange transition-colors"
                >
                  Markdown Guide
                </a>
                <span className="text-[10px] font-mono text-aluminum/20">|</span>
                <span className="text-[10px] font-mono text-aluminum/30">
                  Use <code className="px-1 bg-white/5 rounded text-[9px]">[[Gear Name]]</code> to link gear
                </span>
              </div>
            </div>

            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full bg-blackout border border-white/10 rounded-lg p-4 text-sm font-mono text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 resize-y min-h-[400px]"
              rows={20}
              placeholder="Write the article using Markdown..."
            />

            <div className="flex items-center gap-3 mt-4">
              <input
                type="text"
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                placeholder="Edit summary (e.g., 'Added setup guide section')"
                maxLength={200}
                className="flex-1 bg-deep-stage border border-white/10 rounded-lg px-3 py-2 text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30"
              />
              <button
                onClick={() => { setEditing(false); setEditContent(""); setEditSummary(""); }}
                className="px-4 py-2 text-xs font-heading font-semibold tracking-wider uppercase text-aluminum hover:text-house-lights transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveArticle}
                disabled={saving || !editContent.trim()}
                className="px-5 py-2 text-xs font-heading font-semibold tracking-wider uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-mono text-aluminum/30">{editContent.length.toLocaleString()} / 50,000 characters</span>
              <span className="text-[10px] font-mono text-aluminum/25">All edits are saved to revision history</span>
            </div>

            {/* Live preview */}
            {editContent.trim() && (
              <div className="mt-6">
                <div className="text-[9px] font-mono font-bold tracking-[3px] uppercase text-aluminum/30 mb-3">Preview</div>
                <div className="p-6 rounded-lg bg-deep-stage border border-ink/[0.04]">
                  <div
                    className="wiki-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent, { wikiLinks: true }) }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ DISCUSSION TAB (formerly Notes) ═══ */}
        {tab === "discussion" && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setNoteFilter(null)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${!noteFilter ? "bg-signal-orange/15 text-signal-orange" : "text-aluminum/50 hover:text-aluminum"}`}
                >
                  All
                </button>
                {NOTE_CATEGORIES.map(nc => (
                  <button
                    key={nc.id}
                    onClick={() => setNoteFilter(noteFilter === nc.id ? null : nc.id)}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${noteFilter === nc.id ? "bg-signal-orange/15 text-signal-orange" : "text-aluminum/50 hover:text-aluminum"}`}
                  >
                    {nc.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="text-[10px] font-mono bg-deep-stage border border-white/10 rounded px-2 py-1 text-aluminum"
                >
                  <option value="newest">Newest</option>
                  <option value="helpful">Most Helpful</option>
                </select>
                {userId && (
                  <button
                    onClick={() => setShowNoteForm(!showNoteForm)}
                    className="px-3 py-1.5 text-xs font-heading font-semibold tracking-wider uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    Add Note
                  </button>
                )}
              </div>
            </div>

            {showNoteForm && (
              <div className="p-4 rounded-lg bg-deep-stage border border-signal-orange/15 mb-5">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {NOTE_CATEGORIES.map(nc => (
                    <button
                      key={nc.id}
                      onClick={() => setNoteCategory(nc.id)}
                      className={`px-2.5 py-1 text-[10px] font-mono border rounded transition-colors ${noteCategory === nc.id ? nc.color : "text-aluminum/40 border-white/10"}`}
                    >
                      {nc.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={noteBody}
                  onChange={e => setNoteBody(e.target.value)}
                  placeholder="Share your real-world experience with this gear..."
                  maxLength={3000}
                  rows={4}
                  className="w-full bg-blackout border border-white/10 rounded-lg p-3 text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono text-aluminum/30">{noteBody.length}/3000</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowNoteForm(false); setNoteBody(""); }} className="px-3 py-1.5 text-xs text-aluminum hover:text-house-lights transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={submitNote}
                      disabled={!noteBody.trim() || submittingNote}
                      className="px-4 py-1.5 text-xs font-heading font-semibold tracking-wider uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {submittingNote ? "Posting..." : "Post Note"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {notes.length === 0 ? (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum/50">No discussion notes yet. Be the first to contribute.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => {
                  const nc = NOTE_CATEGORIES.find(c => c.id === note.category);
                  const name = note.profiles?.display_name || "Anonymous";
                  const tier = note.tech_profiles?.level || 0;
                  const skill = note.tech_profiles?.primary_skill;

                  return (
                    <div key={note.id} className="p-4 rounded-lg bg-deep-stage border border-ink/[0.04]">
                      <div className="flex items-center gap-2.5 mb-3">
                        <Link href={`/profile/${note.author_id}`}>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
                            style={{
                              backgroundColor: note.profiles?.avatar_url ? undefined : `hsl(${getHue(name)}, 40%, 25%)`,
                              color: `hsl(${getHue(name)}, 60%, 70%)`,
                            }}
                          >
                            {note.profiles?.avatar_url ? (
                              <img src={note.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              name.split(" ").map(n => n[0]).join("").slice(0, 2)
                            )}
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/profile/${note.author_id}`} className="text-xs font-semibold text-house-lights hover:text-signal-orange transition-colors">
                            {name}
                          </Link>
                          {skill && <span className="px-1.5 py-0.5 text-[9px] font-mono text-aluminum/50 border border-white/10 rounded">{skill}</span>}
                          <span className="text-[9px] font-mono font-bold" style={{ color: TIER_COLORS[tier] }}>{TIER_NAMES[tier]}</span>
                          <span className="text-[10px] font-mono text-aluminum/30">{timeAgo(note.created_at)}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        {nc && (
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-mono border rounded mb-2 ${nc.color}`}>
                            {nc.label}
                          </span>
                        )}
                        <p className="text-sm text-house-lights/80 leading-relaxed whitespace-pre-wrap">{note.body}</p>
                      </div>

                      <button
                        onClick={() => userId && toggleHelpful({ note_id: note.id })}
                        disabled={!userId}
                        className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${
                          userMarks.has(note.id)
                            ? "text-signal-orange"
                            : userId ? "text-aluminum/40 hover:text-signal-orange" : "text-aluminum/20 cursor-default"
                        }`}
                      >
                        <span>{userMarks.has(note.id) ? "▲" : "△"}</span>
                        <span>{note.helpful_count} helpful</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ Q&A TAB ═══ */}
        {tab === "qa" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="text-[10px] font-mono bg-deep-stage border border-white/10 rounded px-2 py-1 text-aluminum"
              >
                <option value="newest">Newest</option>
                <option value="helpful">Most Answers</option>
              </select>
              {userId && (
                <button
                  onClick={() => setShowQuestionForm(!showQuestionForm)}
                  className="px-3 py-1.5 text-xs font-heading font-semibold tracking-wider uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors"
                >
                  Ask Question
                </button>
              )}
            </div>

            {showQuestionForm && (
              <div className="p-4 rounded-lg bg-deep-stage border border-signal-orange/15 mb-5">
                <input
                  type="text"
                  value={qTitle}
                  onChange={e => setQTitle(e.target.value)}
                  placeholder="Question title..."
                  maxLength={200}
                  className="w-full bg-blackout border border-white/10 rounded-lg px-3 py-2.5 text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 mb-3"
                />
                <textarea
                  value={qBody}
                  onChange={e => setQBody(e.target.value)}
                  placeholder="Describe your question in detail..."
                  maxLength={5000}
                  rows={4}
                  className="w-full bg-blackout border border-white/10 rounded-lg p-3 text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono text-aluminum/30">{qBody.length}/5000</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowQuestionForm(false); setQTitle(""); setQBody(""); }} className="px-3 py-1.5 text-xs text-aluminum hover:text-house-lights transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={submitQuestion}
                      disabled={!qTitle.trim() || !qBody.trim() || submittingQuestion}
                      className="px-4 py-1.5 text-xs font-heading font-semibold tracking-wider uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {submittingQuestion ? "Posting..." : "Post Question"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum/50">No questions yet. Be the first to ask.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map(q => {
                  const name = q.profiles?.display_name || "Anonymous";
                  const tier = q.tech_profiles?.level || 0;
                  const skill = q.tech_profiles?.primary_skill;

                  return (
                    <Link
                      key={q.id}
                      href={`/wiki/${slug}/question/${q.id}`}
                      className="block p-4 rounded-lg bg-deep-stage border border-ink/[0.04] hover:border-signal-orange/15 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 text-center min-w-[48px]">
                          <span className="text-lg font-heading font-bold text-house-lights">{q.answer_count}</span>
                          <span className="text-[9px] font-mono text-aluminum/40">answers</span>
                          {q.accepted_answer_id && (
                            <span className="text-[9px] font-mono text-emerald-400">accepted</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-house-lights mb-1">{q.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-aluminum/40">
                            <span>{name}</span>
                            {skill && <span className="text-aluminum/30">{skill}</span>}
                            <span style={{ color: TIER_COLORS[tier] }}>{TIER_NAMES[tier]}</span>
                            <span>{timeAgo(q.created_at)}</span>
                            <span>{q.view_count} views</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {tab === "history" && (
          <div>
            {revisions.length === 0 ? (
              <div className="text-center py-12 bg-deep-stage rounded-lg">
                <div className="text-sm text-aluminum/50">No edit history yet.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {revisions.map((rev, idx) => {
                  const name = rev.profiles?.display_name || "Unknown";
                  return (
                    <div key={rev.id} className="flex items-center gap-4 p-4 rounded-lg bg-deep-stage border border-ink/[0.04]">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-signal-orange" : "bg-aluminum/20"}`} />
                      </div>

                      {/* Avatar */}
                      <Link href={`/profile/${rev.editor_id}`}>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-heading font-bold flex-shrink-0"
                          style={{
                            backgroundColor: rev.profiles?.avatar_url ? undefined : `hsl(${getHue(name)}, 40%, 25%)`,
                            color: `hsl(${getHue(name)}, 60%, 70%)`,
                          }}
                        >
                          {rev.profiles?.avatar_url ? (
                            <img src={rev.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            name.split(" ").map(n => n[0]).join("").slice(0, 2)
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/profile/${rev.editor_id}`} className="text-xs font-semibold text-house-lights hover:text-signal-orange transition-colors">
                            {name}
                          </Link>
                          {rev.summary && (
                            <span className="text-xs text-aluminum/50 italic truncate">{rev.summary}</span>
                          )}
                          {!rev.summary && idx === revisions.length - 1 && (
                            <span className="text-xs text-aluminum/50 italic">Created article</span>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[10px] font-mono text-aluminum/30 flex-shrink-0">
                        {new Date(rev.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" "}
                        {new Date(rev.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>

                      {/* View revision */}
                      <Link
                        href={`/wiki/${slug}/revision/${rev.id}`}
                        className="text-[10px] font-mono text-signal-orange/50 hover:text-signal-orange transition-colors flex-shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
