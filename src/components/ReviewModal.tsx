"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ReviewModalProps {
  bookingId: string;
  techId: string;
  techName: string;
  projectName: string;
  producerId: string;
  producerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ bookingId, techId, techName, projectName, producerId, producerName, onClose, onSuccess }: ReviewModalProps) {
  const [overall, setOverall] = useState(5);
  const [skill, setSkill] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSubmitting(false); return; }

    await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "review",
        bookingId,
        overall,
        skill,
        punctuality,
        professionalism,
        communication,
        text,
      }),
    });

    setSubmitting(false);
    onSuccess();
  };

  const StarRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-aluminum/60">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} onClick={() => onChange(i)}
            className="text-lg transition-transform hover:scale-110"
            style={{ color: i <= value ? "var(--color-standby-amber)" : "rgba(255,255,255,0.06)" }}>
            ★
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-deep-stage border border-signal-orange/15 rounded-xl p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="font-heading text-lg font-bold">
              Review <span className="text-signal-orange">{techName}</span>
            </h2>
            <p className="text-[11px] text-aluminum/60 mt-0.5">{projectName}</p>
          </div>
          <button onClick={onClose} className="text-aluminum hover:text-house-lights text-lg">✕</button>
        </div>

        <div className="space-y-3 mb-5 bg-blackout/30 rounded-lg p-4">
          <StarRow label="Overall" value={overall} onChange={setOverall} />
          <StarRow label="Technical Skill" value={skill} onChange={setSkill} />
          <StarRow label="Punctuality" value={punctuality} onChange={setPunctuality} />
          <StarRow label="Professionalism" value={professionalism} onChange={setProfessionalism} />
          <StarRow label="Communication" value={communication} onChange={setCommunication} />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-mono text-aluminum/60 tracking-wider uppercase mb-1.5">
            Written Review <span className="text-aluminum/35">(optional but encouraged)</span>
          </label>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="How was your experience working with this tech? What stood out?"
            rows={4}
            className="w-full px-4 py-3 bg-blackout/50 border border-ink/[0.06] rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/20 transition-all resize-vertical leading-relaxed" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-aluminum font-heading text-sm tracking-wider uppercase hover:text-house-lights transition-colors">
            Skip
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}