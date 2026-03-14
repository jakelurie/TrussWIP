"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
const TIER_NAMES = ["New", "Verified", "Established", "Top Rated", "Premier"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-standby-amber/10 text-standby-amber",
  accepted: "bg-cue-blue/10 text-cue-blue",
  confirmed: "bg-cue-blue/10 text-cue-blue",
  paid: "bg-go-green/10 text-go-green",
  completed: "bg-go-green/15 text-go-green",
  cancelled: "bg-aluminum/10 text-aluminum/50",
  declined: "bg-aluminum/10 text-aluminum/50",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  const fetchUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setNoteText(d.profile?.admin_notes || "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const doAction = async (action: string, value?: string) => {
    setActionLoading(action);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, value }),
    });
    setActionLoading(null);
    setShowSuspendForm(false);
    setShowNoteForm(false);
    fetchUser();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.profile) {
    return <div className="p-8 text-aluminum/50 text-sm">User not found.</div>;
  }

  const { profile: p, techProfile: tp, bookings, reviews } = data;
  const isTech = p.user_type === "tech";
  const tier = TIER_NAMES[tp?.level ?? 0] || "New";

  return (
    <div className="p-6 max-w-[1000px]">
      {/* Back link */}
      <Link href="/admin/users" className="text-[10px] font-mono text-aluminum/40 hover:text-signal-orange transition-colors">
        &larr; All Users
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-3 mb-6">
        <div className="flex items-start gap-4">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-deep-stage flex items-center justify-center text-lg font-mono text-aluminum/40">
              {(p.display_name || "?")[0]}
            </div>
          )}
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight flex items-center gap-2">
              {p.display_name || "Unnamed"}
              {p.suspended && (
                <span className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-signal-orange/10 text-signal-orange rounded">Suspended</span>
              )}
              {p.is_admin && (
                <span className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-signal-orange/10 text-signal-orange rounded">Admin</span>
              )}
            </h1>
            <div className="text-xs text-aluminum/60 mt-0.5">
              {p.email} &middot; {p.user_type === "tech" ? "Technician" : "Producer"}{p.city ? ` · ${p.city}` : ""}
            </div>
            <div className="text-[10px] text-aluminum/40 mt-0.5">
              Joined {new Date(p.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {isTech && tp && (
                <> &middot; {tier} ({tp.xp?.toLocaleString() || 0} XP) &middot; Profile: {tp.profile_complete}%</>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {p.is_verified && (
                <span className="text-[8px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-go-green/10 text-go-green rounded">Verified</span>
              )}
              {p.identity_verified && (
                <span className="text-[8px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-go-green/10 text-go-green rounded">ID Verified</span>
              )}
            </div>
          </div>
        </div>

        {/* Admin actions */}
        <div className="flex flex-wrap gap-2">
          {!p.is_verified && (
            <ActionButton
              label="Verify"
              loading={actionLoading === "verify"}
              onClick={() => doAction("verify")}
              color="go-green"
            />
          )}
          {p.suspended ? (
            <ActionButton
              label="Unsuspend"
              loading={actionLoading === "unsuspend"}
              onClick={() => doAction("unsuspend")}
              color="go-green"
            />
          ) : (
            <ActionButton
              label="Suspend"
              loading={actionLoading === "suspend"}
              onClick={() => setShowSuspendForm(true)}
              color="signal-orange"
            />
          )}
          <ActionButton
            label="Reset Password"
            loading={actionLoading === "reset_password"}
            onClick={() => doAction("reset_password", p.email)}
            color="aluminum"
          />
          <ActionButton
            label="Add Note"
            loading={false}
            onClick={() => setShowNoteForm(!showNoteForm)}
            color="aluminum"
          />
        </div>
      </div>

      {/* Suspend form */}
      {showSuspendForm && (
        <div className="bg-deep-stage/40 border border-signal-orange/20 rounded-xl p-4 mb-4">
          <div className="text-xs text-house-lights/70 mb-2">Suspend reason:</div>
          <input
            type="text"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Enter reason..."
            className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => doAction("suspend", suspendReason)}
              disabled={actionLoading === "suspend"}
              className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-signal-orange/10 text-signal-orange rounded hover:bg-signal-orange/20 transition-colors"
            >
              Confirm Suspend
            </button>
            <button
              onClick={() => setShowSuspendForm(false)}
              className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-aluminum/40 hover:text-aluminum transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admin notes form */}
      {showNoteForm && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mb-4">
          <div className="text-xs text-house-lights/70 mb-2">Admin Notes:</div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-2 text-xs text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30 resize-none mb-2"
          />
          <button
            onClick={() => doAction("admin_note", noteText)}
            disabled={actionLoading === "admin_note"}
            className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-cue-blue/10 text-cue-blue rounded hover:bg-cue-blue/20 transition-colors"
          >
            Save Note
          </button>
        </div>
      )}

      {/* Existing admin notes display */}
      {p.admin_notes && !showNoteForm && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mb-4">
          <div className="font-mono text-[9px] text-standby-amber tracking-[3px] uppercase mb-2">Admin Notes</div>
          <p className="text-xs text-aluminum/60 whitespace-pre-wrap">{p.admin_notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile Info */}
        {isTech && tp && (
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
            <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">Tech Profile</h2>
            <div className="space-y-2 text-xs">
              <InfoRow label="Primary Skill" value={tp.primary_skill || "—"} />
              <InfoRow label="Skills" value={(tp.skills || []).join(", ") || "—"} />
              <InfoRow label="Specializations" value={(tp.specializations || []).join(", ") || "—"} />
              <InfoRow label="Certifications" value={(tp.certifications || []).join(", ") || "—"} />
              <InfoRow label="Gear" value={(tp.gear || []).join(", ") || "—"} />
              <InfoRow label="Years Exp." value={tp.years_experience ?? "—"} />
              <InfoRow label="Hourly Rate" value={tp.hourly_rate ? `$${tp.hourly_rate}` : "—"} />
              <InfoRow label="Avg Rating" value={tp.avg_rating ? `${tp.avg_rating} / 5` : "—"} />
              <InfoRow label="Completed Gigs" value={tp.completed_gigs ?? 0} />
              <InfoRow label="Review Count" value={tp.review_count ?? 0} />
              <InfoRow label="Available" value={tp.available ? "Yes" : "No"} />
              {tp.bio && (
                <div className="pt-2 border-t border-ink/[0.03]">
                  <div className="text-[9px] text-aluminum/40 font-mono uppercase mb-1">Bio</div>
                  <p className="text-aluminum/60 whitespace-pre-wrap">{tp.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Producer Info */}
        {!isTech && (
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
            <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">Producer Info</h2>
            <div className="space-y-2 text-xs">
              <InfoRow label="Company" value={p.company_name || "—"} />
              <InfoRow label="Billing Type" value={p.billing_type || "—"} />
              <InfoRow label="Payment Method" value={p.payment_method || "—"} />
            </div>
          </div>
        )}

        {/* Booking History */}
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
          <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">
            Booking History ({bookings?.length || 0})
          </h2>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {bookings.map((b: any) => {
                const other = isTech
                  ? b.profiles?.display_name || "Unknown"
                  : (b as any)["profiles!bookings_tech_id_fkey"]?.display_name ||
                    (Array.isArray(b.profiles) ? b.profiles[1]?.display_name : null) ||
                    "Unknown";
                return (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-ink/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase ${STATUS_COLORS[b.status] || "text-aluminum/40"}`}>
                        {b.status}
                      </span>
                      <span className="text-[11px] text-house-lights/70">{other}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-aluminum/50">
                        {b.total_amount ? `$${b.total_amount.toLocaleString()}` : "—"}
                      </span>
                      <span className="text-[9px] font-mono text-aluminum/30">
                        {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-aluminum/30 text-sm">No bookings</div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mt-4">
        <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">
          Reviews ({reviews?.length || 0})
        </h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r: any) => {
              const reviewer = r["profiles!reviews_reviewer_id_fkey"]?.display_name || "Unknown";
              const tech = r["profiles!reviews_tech_id_fkey"]?.display_name || "Unknown";
              const isReceived = isTech;
              return (
                <div key={r.id} className={`p-3 rounded-lg border ${r.hidden ? "border-signal-orange/20 bg-signal-orange/[0.02]" : "border-ink/[0.03]"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-house-lights/70">
                        {isReceived ? `From ${reviewer}` : `For ${tech}`}
                      </span>
                      {r.hidden && (
                        <span className="text-[8px] font-mono tracking-wider uppercase text-signal-orange">Hidden</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-standby-amber">{r.overall_rating}/5</span>
                      <span className="text-[9px] font-mono text-aluminum/30">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {r.comment && <p className="text-[11px] text-aluminum/50 mt-1">{r.comment}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-aluminum/30 text-sm">No reviews</div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-aluminum/40">{label}</span>
      <span className="text-house-lights/70 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function ActionButton({ label, loading, onClick, color }: {
  label: string;
  loading: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors bg-${color}/10 text-${color} hover:bg-${color}/20 disabled:opacity-50`}
    >
      {loading ? "..." : label}
    </button>
  );
}
