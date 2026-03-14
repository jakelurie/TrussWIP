"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BulkBookingModalProps {
  projectId: string;
  projectName: string;
  roles: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkBookingModal({ projectId, projectName, roles, onClose, onSuccess }: BulkBookingModalProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [matchedTechs, setMatchedTechs] = useState<Record<string, any[]>>({});
  const [selectedTechs, setSelectedTechs] = useState<Record<string, string[]>>({});
  const [hours, setHours] = useState(10);
  const [sent, setSent] = useState(0);

  // Find unfilled roles
  const unfilledRoles = roles.filter(r => (r.filled || 0) < (r.quantity || 0));

  useEffect(() => {
    loadMatchingTechs();
  }, []);

  const loadMatchingTechs = async () => {
    const skillsNeeded = [...new Set(unfilledRoles.map(r => r.skill))];
    const results: Record<string, any[]> = {};

    for (const skill of skillsNeeded) {
      const { data } = await supabase
        .from("tech_profiles")
        .select("*, profiles!tech_profiles_user_id_fkey(display_name, city, cities)")
        .eq("available", true)
        .contains("skills", [skill])
        .order("avg_rating", { ascending: false })
        .limit(10);
      results[skill] = data || [];
    }

    setMatchedTechs(results);
    setLoading(false);
  };

  const toggleTech = (roleId: string, techUserId: string) => {
    const current = selectedTechs[roleId] || [];
    if (current.includes(techUserId)) {
      setSelectedTechs({ ...selectedTechs, [roleId]: current.filter(id => id !== techUserId) });
    } else {
      setSelectedTechs({ ...selectedTechs, [roleId]: [...current, techUserId] });
    }
  };

  const sendAll = async () => {
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Build booking list for bulk API
    const bookingList: any[] = [];
    for (const role of unfilledRoles) {
      const techs = selectedTechs[role.id] || [];
      for (const techUserId of techs) {
        const tech = matchedTechs[role.skill]?.find(t => t.user_id === techUserId);
        const rate = tech?.skill_rates?.[role.skill] || tech?.hourly_rate || 0;
        bookingList.push({
          projectRoleId: role.id,
          techId: techUserId,
          rate,
          totalHours: hours,
        });
      }
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "create_bulk",
        projectId,
        bookings: bookingList,
      }),
    });

    const data = await res.json();
    const count = data.created || 0;
    setSent(count);
    setSending(false);
    if (count > 0) onSuccess();
  };

  const totalSelected = Object.values(selectedTechs).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-deep-stage border border-signal-orange/15 rounded-xl p-6 mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading text-lg font-bold">
            Fill All Roles — <span className="text-signal-orange">{projectName}</span>
          </h2>
          <button onClick={onClose} className="text-aluminum hover:text-house-lights text-lg">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
            <p className="text-xs text-aluminum mt-3">Finding matching techs...</p>
          </div>
        ) : unfilledRoles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-aluminum">All roles are filled!</div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-mono text-aluminum tracking-wider uppercase mb-1.5">Hours per booking</label>
              <input
                type="number"
                value={hours}
                onChange={e => setHours(parseInt(e.target.value) || 0)}
                min="1"
                className="w-32 px-4 py-2 bg-blackout border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none"
              />
            </div>

            <div className="space-y-4 mb-5">
              {unfilledRoles.map(role => {
                const slotsNeeded = (role.quantity || 0) - (role.filled || 0);
                const techs = matchedTechs[role.skill] || [];
                const selected = selectedTechs[role.id] || [];

                return (
                  <div key={role.id} className="bg-blackout rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm font-semibold">{role.skill}</span>
                        <span className="font-mono text-[10px] text-standby-amber">{slotsNeeded} needed</span>
                      </div>
                      <span className="font-mono text-[10px] text-aluminum">{selected.length} selected</span>
                    </div>

                    {techs.length === 0 ? (
                      <p className="text-xs text-aluminum/60">No available techs with {role.skill} skill found</p>
                    ) : (
                      <div className="space-y-1.5">
                        {techs.map(tech => {
                          const isSelected = selected.includes(tech.user_id);
                          const rate = tech.skill_rates?.[role.skill] || tech.hourly_rate || 0;
                          return (
                            <button
                              key={tech.user_id}
                              onClick={() => toggleTech(role.id, tech.user_id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${
                                isSelected
                                  ? "bg-signal-orange/10 border border-signal-orange/30"
                                  : "bg-ink/[0.02] border border-ink/[0.04] hover:border-white/10"
                              }`}
                            >
                              <div>
                                <span className="text-sm font-semibold">{tech.profiles?.display_name}</span>
                                <span className="text-[10px] text-aluminum ml-2">
                                  {tech.profiles?.city}{tech.profiles?.cities?.length > 1 && <span className="text-signal-orange/60"> +{tech.profiles.cities.length - 1}</span>} · {tech.avg_rating > 0 ? `${tech.avg_rating}★` : "New"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">${rate}/hr</span>
                                <span className={isSelected ? "text-signal-orange" : "text-aluminum/35"}>{isSelected ? "✓" : "+"}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 text-aluminum font-heading text-sm tracking-wider uppercase hover:text-house-lights transition-colors">
                Cancel
              </button>
              <button
                onClick={sendAll}
                disabled={sending || totalSelected === 0}
                className="flex-1 py-3 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : `Send ${totalSelected} Request${totalSelected !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
