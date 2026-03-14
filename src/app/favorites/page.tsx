"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingModal from "@/components/BookingModal";

const LEVEL_NAMES = ["Rookie", "Technician", "Specialist", "Expert", "Elite"];
const LEVEL_COLORS = ["var(--color-aluminum)", "var(--color-cue-blue)", "var(--color-standby-amber)", "var(--color-signal-orange)", "#9B59B6"];

export default function Favorites() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteTechs, setFavoriteTechs] = useState<any[]>([]);
  const [bookingTech, setBookingTech] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUserId(session.user.id);

    const { data: favs } = await supabase.from("favorites")
      .select("tech_id, created_at")
      .eq("producer_id", session.user.id)
      .order("created_at", { ascending: false });

    if (favs && favs.length > 0) {
      const techIds = favs.map(f => f.tech_id);
      const { data: techs } = await supabase.from("tech_profiles")
        .select("*, profiles!tech_profiles_user_id_fkey(display_name, city, avatar_url)")
        .in("user_id", techIds);

      // Also get last booking info for rebook
      const { data: lastBookings } = await supabase.from("bookings")
        .select("tech_id, status, total_amount, rate, total_hours, project_id, project_role_id, created_at, projects(name)")
        .eq("producer_id", session.user.id)
        .in("tech_id", techIds)
        .order("created_at", { ascending: false });

      const lastBookingMap: Record<string, any> = {};
      (lastBookings || []).forEach(b => {
        if (!lastBookingMap[b.tech_id]) lastBookingMap[b.tech_id] = b;
      });

      setFavoriteTechs((techs || []).map(t => ({
        ...t,
        lastBooking: lastBookingMap[t.user_id] || null,
      })));
    }

    setLoading(false);
  };

  const removeFavorite = async (techId: string) => {
    if (!userId) return;
    await supabase.from("favorites").delete()
      .eq("producer_id", userId).eq("tech_id", techId);
    setFavoriteTechs(favoriteTechs.filter(t => t.user_id !== techId));
  };

  const getInitials = (name: string) => name ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "?";
  const getHue = (name: string) => { let h = 0; for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return Math.abs(h) % 360; };

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>);

  return (
    <>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Your Crew</span>
        <h1 className="font-heading text-2xl font-bold tracking-tight mt-1 mb-6">
          Saved <span className="text-signal-orange">Technicians</span>
        </h1>

        {favoriteTechs.length === 0 ? (
          <div className="text-center py-20 bg-deep-stage/30 rounded-xl border border-ink/[0.03]">
            <div className="font-heading text-lg text-aluminum/65">No saved techs yet</div>
            <p className="text-xs text-aluminum/50 mt-2 mb-4">Browse the marketplace and click the heart to save techs you like</p>
            <Link href="/browse" className="px-5 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors inline-block">
              Browse Techs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteTechs.map(tech => {
              const name = tech.profiles?.display_name || "Tech";
              const hue = getHue(name);
              const lvl = tech.level || 0;

              return (
                <div key={tech.id} className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 flex items-center gap-4 hover:border-ink/[0.08] transition-all">
                  {/* Avatar */}
                  <Link href={`/profile/${tech.user_id}`}>
                    {tech.profiles?.avatar_url ? (
                      <img src={tech.profiles.avatar_url} alt={name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center font-heading font-bold text-base"
                        style={{ background: `hsl(${hue}, 35%, 20%)`, color: `hsl(${hue}, 50%, 70%)` }}>
                        {getInitials(name)}
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${tech.user_id}`} className="font-heading text-sm font-bold hover:text-signal-orange transition-colors">
                        {name}
                      </Link>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold"
                        style={{ color: LEVEL_COLORS[lvl], background: `${LEVEL_COLORS[lvl]}12` }}>
                        {LEVEL_NAMES[lvl]}
                      </span>
                    </div>
                    <div className="text-[11px] text-aluminum/60">
                      {tech.primary_skill && <span className="text-signal-orange/70">{tech.primary_skill}</span>}
                      {tech.profiles?.city && <span> · {tech.profiles.city}</span>}
                      {tech.avg_rating > 0 && <span> · {tech.avg_rating}★</span>}
                      {tech.hourly_rate > 0 && <span> · ${tech.hourly_rate}/hr</span>}
                    </div>
                    {tech.lastBooking && (
                      <div className="text-[10px] text-aluminum/40 mt-0.5">
                        Last booked: {tech.lastBooking.projects?.name} · {new Date(tech.lastBooking.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setBookingTech(tech)}
                      className="px-4 py-2 bg-signal-orange text-white text-xs font-heading font-bold tracking-wider uppercase rounded-lg hover:shadow-[0_0_15px_rgba(255,77,0,0.2)] transition-all">
                      {tech.lastBooking ? "Rebook" : "Book"}
                    </button>
                    <button onClick={() => removeFavorite(tech.user_id)}
                      className="w-8 h-8 rounded-lg bg-ink/[0.03] hover:bg-red-500/10 flex items-center justify-center text-red-400/50 hover:text-red-400 transition-all text-sm">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {bookingTech && (
        <BookingModal
          techId={bookingTech.user_id}
          techName={bookingTech.profiles?.display_name || "Tech"}
          techRate={bookingTech.lastBooking?.rate || bookingTech.hourly_rate || 0}
          prefillProjectId={bookingTech.lastBooking?.project_id}
          prefillRoleId={bookingTech.lastBooking?.project_role_id}
          prefillRate={bookingTech.lastBooking?.rate}
          prefillHours={bookingTech.lastBooking?.total_hours}
          onClose={() => setBookingTech(null)}
          onSuccess={() => { setBookingTech(null); router.push("/bookings"); }}
        />
      )}
    </>
  );
}