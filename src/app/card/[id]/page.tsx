"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

const LEVEL_NAMES = ["Rookie", "Technician", "Specialist", "Expert", "Elite"];
const LEVEL_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "var(--color-standby-amber)", "var(--color-signal-orange)", "#9B59B6"];

export default function TechCard() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [techProfile, setTechProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(prof);

    const { data: tp } = await supabase.from("tech_profiles").select("*").eq("user_id", id).single();
    setTechProfile(tp);

    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name: string) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "?";
  const getHue = (name: string) => { let h = 0; for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return Math.abs(h) % 360; };

  if (loading) return (<div className="min-h-screen bg-blackout flex items-center justify-center"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>);
  if (!profile || !techProfile) return (<div className="min-h-screen bg-blackout flex items-center justify-center text-aluminum">Profile not found</div>);

  const lvl = techProfile.level || 0;
  const name = profile.display_name || "Tech";
  const hue = getHue(name);

  return (
    <div className="min-h-screen bg-blackout flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-deep-stage border border-ink/[0.06] rounded-2xl overflow-hidden">
          {/* Header gradient */}
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${LEVEL_COLORS[lvl]}30, #1A1A2E)` }}>
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
            {/* Truss logo */}
            <div className="absolute top-3 right-3 opacity-50">
              <svg width="48" height="12" viewBox="0 0 200 50" fill="none">
                <text x="100" y="33" fontFamily="Oswald, 'Arial Black', sans-serif" fontWeight="700" fontSize="36" fill="var(--color-house-lights)" textAnchor="middle" letterSpacing="4">TRUSS</text>
                <line x1="36" y1="40" x2="164" y2="40" stroke="var(--color-signal-orange)" strokeWidth="2" />
                <line x1="36" y1="44" x2="164" y2="44" stroke="var(--color-signal-orange)" strokeWidth="0.5" />
              </svg>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-12 relative z-10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-deep-stage" />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-heading text-2xl font-bold border-4 border-deep-stage"
                style={{ background: `hsl(${hue}, 35%, 18%)`, color: `hsl(${hue}, 50%, 70%)` }}>
                {getInitials(name)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center px-6 pt-3 pb-5">
            <h1 className="font-heading text-xl font-bold">{name}</h1>
            {profile.city && <p className="text-xs text-aluminum/65 mt-0.5">{profile.city}</p>}

            {/* Level badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-2"
              style={{ background: `${LEVEL_COLORS[lvl]}12`, border: `1px solid ${LEVEL_COLORS[lvl]}30` }}>
              <span className="text-[10px] font-mono font-bold" style={{ color: LEVEL_COLORS[lvl] }}>
                LVL {lvl} · {LEVEL_NAMES[lvl]}
              </span>
            </div>

            {/* Primary skill */}
            {techProfile.primary_skill && (
              <div className="mt-3">
                <span className="px-3 py-1 bg-signal-orange/10 text-signal-orange text-xs font-mono rounded-lg border border-signal-orange/20">
                  ★ {techProfile.primary_skill}
                </span>
              </div>
            )}

            {/* Stats row */}
            <div className="flex justify-center gap-6 mt-4">
              {techProfile.avg_rating > 0 && (
                <div className="text-center">
                  <div className="font-mono text-lg font-semibold">{techProfile.avg_rating}★</div>
                  <div className="text-[9px] text-aluminum/50">RATING</div>
                </div>
              )}
              {techProfile.completed_gigs > 0 && (
                <div className="text-center">
                  <div className="font-mono text-lg font-semibold">{techProfile.completed_gigs}</div>
                  <div className="text-[9px] text-aluminum/50">GIGS</div>
                </div>
              )}
              {techProfile.years_experience > 0 && (
                <div className="text-center">
                  <div className="font-mono text-lg font-semibold">{techProfile.years_experience}</div>
                  <div className="text-[9px] text-aluminum/50">YEARS</div>
                </div>
              )}
            </div>

            {/* Skills */}
            {techProfile.skills && techProfile.skills.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {techProfile.skills.map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-ink/[0.03] text-aluminum/65 text-[10px] font-mono rounded">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Rate */}
            {techProfile.hourly_rate > 0 && (
              <div className="mt-4 pt-4 border-t border-ink/[0.04]">
                <span className="font-mono text-2xl font-semibold text-signal-orange">${techProfile.hourly_rate}</span>
                <span className="text-xs text-aluminum/50">/hr</span>
              </div>
            )}

            {/* Availability */}
            {techProfile.available && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="w-2 h-2 rounded-full bg-go-green animate-pulse" />
                <span className="text-[10px] font-mono text-go-green">Available for bookings</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link href={`/profile/${id}`}
            className="flex-1 py-3 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-xl text-center hover:shadow-[0_0_20px_rgba(255,77,0,0.2)] transition-all">
            View Full Profile
          </Link>
          <button onClick={copyLink}
            className="px-4 py-3 bg-deep-stage border border-ink/[0.06] text-aluminum/60 text-sm rounded-xl hover:border-white/10 transition-all">
            {copied ? "✓" : ""}
          </button>
        </div>

        {/* Powered by */}
        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] font-mono text-aluminum/35 hover:text-aluminum/60 transition-colors">
            <svg width="40" height="10" viewBox="0 0 200 50" fill="none">
              <text x="100" y="33" fontFamily="Oswald, 'Arial Black', sans-serif" fontWeight="700" fontSize="36" fill="currentColor" textAnchor="middle" letterSpacing="4">TRUSS</text>
              <line x1="36" y1="40" x2="164" y2="40" stroke="var(--color-signal-orange)" strokeWidth="2" />
              <line x1="36" y1="44" x2="164" y2="44" stroke="var(--color-signal-orange)" strokeWidth="0.5" />
            </svg>
            Powered by Truss
          </Link>
        </div>
      </div>
    </div>
  );
}