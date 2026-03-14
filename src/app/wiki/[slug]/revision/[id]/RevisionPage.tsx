"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { slugToGearId, getGearById, GEAR_CATEGORIES } from "@/lib/taxonomy";
import { renderMarkdown } from "@/lib/markdown";

interface Revision {
  id: string;
  gear_id: string;
  editor_id: string;
  content: string;
  summary: string;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
}

export default function RevisionPage({ slug, revisionId }: { slug: string; revisionId: string }) {
  const gearId = slugToGearId(slug);
  const gear = getGearById(gearId);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wiki?revision_id=${revisionId}`)
      .then(r => r.json())
      .then(d => { setRevision(d.revision || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [revisionId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-blackout flex items-center justify-center">
        <div className="text-sm text-aluminum/50">Loading revision...</div>
      </main>
    );
  }

  if (!revision) {
    return (
      <main className="min-h-screen bg-blackout flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold mb-2">Revision Not Found</h1>
          <Link href={`/wiki/${slug}`} className="text-sm text-signal-orange hover:underline">Back to article</Link>
        </div>
      </main>
    );
  }

  const editorName = revision.profiles?.display_name || "Unknown";
  const date = new Date(revision.created_at);

  return (
    <main className="min-h-screen bg-blackout">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-aluminum/40 mb-6 flex-wrap">
          <Link href="/wiki" className="hover:text-signal-orange transition-colors">Wiki</Link>
          <span>/</span>
          <Link href={`/wiki/${slug}`} className="hover:text-signal-orange transition-colors">{gear?.name || slug}</Link>
          <span>/</span>
          <span>History</span>
          <span>/</span>
          <span className="text-aluminum/60">Revision</span>
        </div>

        {/* Revision banner */}
        <div className="p-4 rounded-lg bg-standby-amber/10 border border-standby-amber/20 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-heading font-bold tracking-wider uppercase text-standby-amber">
                Viewing past revision
              </div>
              <div className="text-[11px] font-mono text-aluminum/50 mt-1">
                Edited by <Link href={`/profile/${revision.editor_id}`} className="text-house-lights hover:text-signal-orange">{editorName}</Link>
                {" "}on {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                {revision.summary && <span className="italic"> — {revision.summary}</span>}
              </div>
            </div>
            <Link
              href={`/wiki/${slug}`}
              className="px-4 py-1.5 text-xs font-heading font-semibold tracking-wider uppercase border border-signal-orange/30 text-signal-orange rounded hover:bg-signal-orange/10 transition-colors"
            >
              View Current
            </Link>
          </div>
        </div>

        {/* Rendered revision content */}
        <div className="p-6 rounded-lg bg-deep-stage border border-ink/[0.04]">
          <div
            className="wiki-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(revision.content, { wikiLinks: true }) }}
          />
        </div>
      </div>
    </main>
  );
}
