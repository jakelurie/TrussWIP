"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { slugToGearId, getGearById, GEAR_CATEGORIES } from "@/lib/taxonomy";
import { supabase } from "@/lib/supabase";

const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];
const TIER_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "#9B59B6", "var(--color-signal-orange)", "var(--color-standby-amber)"];

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

interface Profile {
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  is_verified: boolean;
}

interface TechProfile {
  level: number;
  primary_skill: string | null;
  skills: string[];
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
  profiles: Profile | null;
  tech_profiles: TechProfile | null;
}

interface Answer {
  id: string;
  question_id: string;
  body: string;
  helpful_count: number;
  is_accepted: boolean;
  created_at: string;
  author_id: string;
  profiles: Profile | null;
  tech_profiles: TechProfile | null;
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function AuthorBadge({ authorId, profiles, techProfiles, createdAt }: {
  authorId: string;
  profiles: Profile | null;
  techProfiles: TechProfile | null;
  createdAt: string;
}) {
  const name = profiles?.display_name || "Anonymous";
  const tier = techProfiles?.level || 0;
  const skill = techProfiles?.primary_skill;

  return (
    <div className="flex items-center gap-2.5">
      <Link href={`/profile/${authorId}`}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
          style={{
            backgroundColor: profiles?.avatar_url ? undefined : `hsl(${getHue(name)}, 40%, 25%)`,
            color: `hsl(${getHue(name)}, 60%, 70%)`,
          }}
        >
          {profiles?.avatar_url ? (
            <img src={profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            name.split(" ").map(n => n[0]).join("").slice(0, 2)
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/profile/${authorId}`} className="text-xs font-semibold text-house-lights hover:text-signal-orange transition-colors">
          {name}
        </Link>
        {skill && <span className="px-1.5 py-0.5 text-[9px] font-mono text-aluminum/50 border border-white/10 rounded">{skill}</span>}
        <span className="text-[9px] font-mono font-bold" style={{ color: TIER_COLORS[tier] }}>{TIER_NAMES[tier]}</span>
        <span className="text-[10px] font-mono text-aluminum/30">{timeAgo(createdAt)}</span>
        {profiles?.city && <span className="text-[10px] font-mono text-aluminum/25">{profiles.city}</span>}
      </div>
    </div>
  );
}

export default function QuestionPage({ slug, questionId }: { slug: string; questionId: string }) {
  const gearId = slugToGearId(slug);
  const gear = getGearById(gearId);
  const category = GEAR_CATEGORIES.find(c => c.items.some(i => i.id === gearId));

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userMarks, setUserMarks] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");

  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null));
  }, []);

  const loadQuestion = async () => {
    const res = await fetch(`/api/wiki?question_id=${questionId}&sort=${sort}`);
    const d = await res.json();
    setQuestion(d.question || null);
    setAnswers(d.answers || []);
    setUserMarks(new Set(d.userMarks || []));
  };

  useEffect(() => { loadQuestion(); }, [questionId, sort]);

  const toggleHelpful = async (target: { question_id?: string; answer_id?: string }) => {
    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "toggle_helpful", ...target }),
    });
    const data = await res.json();
    const targetId = target.question_id || target.answer_id!;

    setUserMarks(prev => {
      const next = new Set(prev);
      if (data.marked) next.add(targetId); else next.delete(targetId);
      return next;
    });

    if (target.question_id && question) {
      // Question doesn't display helpful_count visually in the same way, but we track it
    }
    if (target.answer_id) {
      setAnswers(prev => prev.map(a =>
        a.id === target.answer_id ? { ...a, helpful_count: a.helpful_count + (data.marked ? 1 : -1) } : a
      ));
    }
  };

  const acceptAnswer = async (answerId: string) => {
    const token = await getToken();
    if (!token) return;

    await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "accept_answer", question_id: questionId, answer_id: answerId }),
    });

    setQuestion(prev => prev ? { ...prev, accepted_answer_id: answerId } : prev);
    setAnswers(prev => prev.map(a => ({ ...a, is_accepted: a.id === answerId })));
  };

  const submitAnswer = async () => {
    if (!answerBody.trim() || submitting) return;
    setSubmitting(true);
    const token = await getToken();
    if (!token) { setSubmitting(false); return; }

    const res = await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "create_answer", question_id: questionId, body: answerBody }),
    });

    if (res.ok) {
      setAnswerBody("");
      await loadQuestion();
    }
    setSubmitting(false);
  };

  if (!question) {
    return (
      <main className="min-h-screen bg-blackout flex items-center justify-center">
        <div className="text-sm text-aluminum/50">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blackout">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-aluminum/40 mb-6 flex-wrap">
          <Link href="/wiki" className="hover:text-signal-orange transition-colors">Wiki</Link>
          <span>/</span>
          <Link href={`/wiki/${slug}`} className="hover:text-signal-orange transition-colors">{gear?.name || slug}</Link>
          <span>/</span>
          <span>Q&A</span>
          <span>/</span>
          <span className="text-aluminum/60 truncate max-w-[200px]">{question.title}</span>
        </div>

        {/* Question */}
        <div className="p-6 rounded-xl bg-deep-stage border border-ink/[0.04] mb-8">
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight mb-4">{question.title}</h1>
          <AuthorBadge
            authorId={question.author_id}
            profiles={question.profiles}
            techProfiles={question.tech_profiles}
            createdAt={question.created_at}
          />
          <div className="mt-4 text-sm text-house-lights/80 leading-relaxed whitespace-pre-wrap">{question.body}</div>
          <div className="flex items-center gap-4 mt-4 text-[10px] font-mono text-aluminum/30">
            <span>{question.view_count} views</span>
            <span>{question.answer_count} answers</span>
          </div>
        </div>

        {/* Answers Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-sm font-bold tracking-wider uppercase text-aluminum/60">
            {answers.length} Answer{answers.length !== 1 ? "s" : ""}
          </h2>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-[10px] font-mono bg-deep-stage border border-white/10 rounded px-2 py-1 text-aluminum"
          >
            <option value="newest">Newest</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        {/* Answers List */}
        {answers.length === 0 ? (
          <div className="text-center py-12 bg-deep-stage rounded-lg mb-8">
            <div className="text-sm text-aluminum/50">No answers yet. Be the first to help.</div>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {answers.map(answer => (
              <div
                key={answer.id}
                className={`p-5 rounded-lg border ${
                  answer.is_accepted
                    ? "bg-emerald-500/[0.03] border-emerald-500/20"
                    : "bg-deep-stage border-ink/[0.04]"
                }`}
              >
                {answer.is_accepted && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-emerald-400 text-sm">✓</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">Accepted Answer</span>
                  </div>
                )}

                <AuthorBadge
                  authorId={answer.author_id}
                  profiles={answer.profiles}
                  techProfiles={answer.tech_profiles}
                  createdAt={answer.created_at}
                />

                <div className="mt-3 text-sm text-house-lights/80 leading-relaxed whitespace-pre-wrap">{answer.body}</div>

                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => userId && toggleHelpful({ answer_id: answer.id })}
                    disabled={!userId}
                    className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${
                      userMarks.has(answer.id)
                        ? "text-signal-orange"
                        : userId ? "text-aluminum/40 hover:text-signal-orange" : "text-aluminum/20 cursor-default"
                    }`}
                  >
                    <span>{userMarks.has(answer.id) ? "▲" : "△"}</span>
                    <span>{answer.helpful_count} helpful</span>
                  </button>

                  {/* Accept button (only for question author, when not already accepted) */}
                  {userId === question.author_id && !answer.is_accepted && (
                    <button
                      onClick={() => acceptAnswer(answer.id)}
                      className="text-[10px] font-mono text-emerald-400/60 hover:text-emerald-400 transition-colors"
                    >
                      Accept this answer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Answer Form */}
        {userId ? (
          <div className="p-5 rounded-lg bg-deep-stage border border-ink/[0.04]">
            <h3 className="font-heading text-xs font-bold tracking-wider uppercase text-aluminum/60 mb-3">Your Answer</h3>
            <textarea
              value={answerBody}
              onChange={e => setAnswerBody(e.target.value)}
              placeholder="Share your knowledge..."
              maxLength={5000}
              rows={5}
              className="w-full bg-blackout border border-white/10 rounded-lg p-3 text-sm text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-mono text-aluminum/30">{answerBody.length}/5000</span>
              <button
                onClick={submitAnswer}
                disabled={!answerBody.trim() || submitting}
                className="px-4 py-2 text-xs font-heading font-semibold tracking-wider uppercase bg-signal-orange text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Answer"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-deep-stage rounded-lg">
            <p className="text-sm text-aluminum/50">
              <Link href="/login" className="text-signal-orange hover:underline">Log in</Link> to post an answer.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
