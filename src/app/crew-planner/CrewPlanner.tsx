"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface CrewRole {
  role: string;
  title: string;
  count: number;
  department: string;
  rationale: string;
}

interface GearRec {
  item: string;
  category: string;
  note?: string;
}

interface CrewPlan {
  eventSummary: string;
  crew: CrewRole[];
  gear: GearRec[];
  timeline: {
    loadInHours: number;
    rehearsalHours: number;
    strikeHours: number;
  };
  notes: string[];
  estimatedCrewDays: number;
}

const EXAMPLE_PROMPTS = [
  "500-person corporate general session in a hotel ballroom. 2 screens, 6 wireless mics, teleprompter, 1-day event with keynote and 3 panels.",
  "Outdoor music festival, 2 stages, 3,000 attendees over 2 days. Full PA, lighting, and video on main stage. Acoustic stage needs basic PA only.",
  "3-day tech conference at a convention center. Main stage for 800, plus 6 breakout rooms with basic AV. Livestreaming the keynotes. LED wall on main stage.",
  "Gala dinner for 300 in a hotel ballroom. Live band (8 piece), awards presentation, 2 screens for content, uplighting. Black tie.",
];

export default function CrewPlanner() {
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<CrewPlan | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!description.trim() || generating) return;
    setGenerating(true);
    setError("");
    setPlan(null);

    try {
      const res = await fetch("/api/crew-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
      } else {
        setError(data.error || "Failed to generate crew plan");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const crewByDept = useMemo(() => {
    if (!plan) return {};
    const grouped: Record<string, CrewRole[]> = {};
    for (const c of plan.crew) {
      if (!grouped[c.department]) grouped[c.department] = [];
      grouped[c.department].push(c);
    }
    return grouped;
  }, [plan]);

  const gearByCat = useMemo(() => {
    if (!plan) return {};
    const grouped: Record<string, GearRec[]> = {};
    for (const g of plan.gear) {
      if (!grouped[g.category]) grouped[g.category] = [];
      grouped[g.category].push(g);
    }
    return grouped;
  }, [plan]);

  const totalCrew = plan?.crew.reduce((t, c) => t + c.count, 0) || 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-2">
        <Link
          href="/resources"
          className="text-[11px] font-mono text-aluminum/40 hover:text-signal-orange transition-colors tracking-wider uppercase"
        >
          &larr; Resources
        </Link>
      </div>
      <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
        AI CREW <span className="text-signal-orange">PLANNER</span>
      </h1>
      <p className="text-sm text-aluminum/60 mb-8 max-w-2xl">
        Describe your event and get a full crew plan with roles, headcounts,
        gear recommendations, and production timeline. Powered by AI with
        real AV industry knowledge.
      </p>

      {/* Input */}
      <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-6 mb-8">
        <label className="block text-xs font-mono text-aluminum/60 tracking-wider uppercase mb-2">
          Describe Your Event
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., 500-person corporate general session in a hotel ballroom. 2 screens, 6 wireless mics, teleprompter..."
          rows={4}
          className="w-full px-4 py-3 bg-blackout border border-ink/[0.06] rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/40 transition-colors resize-vertical leading-relaxed"
        />

        {/* Example prompts */}
        <div className="mt-3 mb-4">
          <span className="text-[10px] font-mono text-aluminum/40 tracking-wider uppercase">Examples:</span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setDescription(ex)}
                className="text-left px-2.5 py-1.5 rounded border border-ink/[0.04] text-[11px] text-aluminum/50 hover:text-signal-orange hover:border-signal-orange/20 transition-all line-clamp-1 max-w-xs"
              >
                {ex.slice(0, 60)}...
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
          className="w-full sm:w-auto px-10 py-3 bg-signal-orange text-white font-heading font-bold text-sm tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all disabled:opacity-50"
        >
          {generating ? "Generating Crew Plan..." : "Generate Crew Plan"}
        </button>

        {generating && (
          <div className="mt-4 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
            <span className="text-xs text-aluminum/50 font-mono">Analyzing event requirements...</span>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>

      {/* Results */}
      {plan && (
        <div className="space-y-6">
          {/* Event Summary */}
          <div className="bg-signal-orange/[0.04] border border-signal-orange/15 rounded-xl p-5">
            <p className="text-sm text-house-lights/80">{plan.eventSummary}</p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Crew", value: totalCrew },
              { label: "Crew-Days", value: plan.estimatedCrewDays },
              { label: "Load-In", value: `${plan.timeline.loadInHours}h` },
              { label: "Rehearsal", value: `${plan.timeline.rehearsalHours}h` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-deep-stage/40 border border-ink/[0.04] rounded-xl p-4 text-center"
              >
                <div className="font-heading text-2xl font-bold text-signal-orange">
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-aluminum/50 tracking-wider uppercase mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Crew Plan */}
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-6">
            <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
              Crew Plan
            </h2>
            <div className="space-y-5">
              {Object.entries(crewByDept).map(([dept, roles]) => (
                <div key={dept}>
                  <h3 className="text-xs font-mono text-signal-orange/70 tracking-widest uppercase mb-2">
                    {dept}
                  </h3>
                  <div className="space-y-1.5">
                    {roles.map((c, i) => (
                      <div
                        key={`${c.role}-${i}`}
                        className="flex items-start justify-between gap-3 py-2.5 border-b border-ink/[0.03] last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-signal-orange font-bold">
                              {c.count}x
                            </span>
                            <span className="text-sm text-house-lights">
                              {c.title}
                            </span>
                            <span className="text-[10px] font-mono text-aluminum/40">
                              ({c.role})
                            </span>
                          </div>
                          <p className="text-[11px] text-aluminum/50 mt-0.5 ml-7">
                            {c.rationale}
                          </p>
                        </div>
                        <Link
                          href={`/browse?skill=${c.role}`}
                          className="text-[10px] font-mono text-signal-orange/60 hover:text-signal-orange transition-colors flex-shrink-0"
                        >
                          Find &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gear */}
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-6">
            <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
              Gear Recommendations
            </h2>
            <div className="space-y-5">
              {Object.entries(gearByCat).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="text-xs font-mono text-signal-orange/70 tracking-widest uppercase mb-2">
                    {cat}
                  </h3>
                  <div className="space-y-1.5">
                    {items.map((g, i) => (
                      <div
                        key={i}
                        className="py-2 border-b border-ink/[0.03] last:border-0"
                      >
                        <div className="text-sm text-house-lights">{g.item}</div>
                        {g.note && (
                          <p className="text-[11px] text-aluminum/50 mt-0.5">
                            {g.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-deep-stage/40 border border-ink/[0.04] rounded-2xl p-6">
            <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-4">
              Timeline
            </h2>
            <div className="space-y-2">
              {[
                { label: "Load-In", hours: plan.timeline.loadInHours },
                { label: "Rehearsal", hours: plan.timeline.rehearsalHours },
                { label: "Strike", hours: plan.timeline.strikeHours },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-center justify-between py-2 border-b border-ink/[0.03] last:border-0"
                >
                  <span className="text-sm text-house-lights">{t.label}</span>
                  <span className="font-mono text-sm text-signal-orange">
                    {t.hours} hours
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {plan.notes.length > 0 && (
            <div className="bg-deep-stage/40 border border-signal-orange/10 rounded-2xl p-6">
              <h2 className="font-heading text-lg font-bold tracking-wider uppercase mb-3">
                Production Notes
              </h2>
              <ul className="space-y-2">
                {plan.notes.map((note, i) => (
                  <li key={i} className="flex gap-2 text-sm text-aluminum/70">
                    <span className="text-signal-orange mt-0.5 shrink-0">
                      &bull;
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="text-center py-8 border-t border-ink/[0.03]">
            <h2 className="font-heading text-xl font-bold tracking-tight mb-2">
              Ready to Staff This Show on{" "}
              <span className="text-signal-orange">Truss</span>?
            </h2>
            <p className="text-xs text-aluminum/50 mb-4 max-w-md mx-auto">
              Create a project and start booking the crew above. Every role
              links directly to matching techs on the marketplace.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/projects"
                className="px-6 py-3 bg-signal-orange text-white font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(255,77,0,0.25)] transition-all"
              >
                Create Project
              </Link>
              <Link
                href="/browse"
                className="px-6 py-3 border border-signal-orange/30 text-signal-orange font-heading font-bold text-xs tracking-[3px] uppercase rounded-xl hover:bg-signal-orange/[0.06] transition-all"
              >
                Browse Techs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-12 pt-6 border-t border-ink/[0.03]">
        <p className="text-[10px] text-aluminum/30 leading-relaxed max-w-2xl">
          Crew plans are AI-generated recommendations based on common industry
          configurations. Actual requirements vary by venue, content complexity,
          union jurisdiction, and production standards. Always review with your
          production manager or lead technician before finalizing crew calls.
        </p>
      </div>
    </main>
  );
}
