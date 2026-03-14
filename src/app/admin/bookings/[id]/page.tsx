"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-standby-amber/10 text-standby-amber",
  accepted: "bg-cue-blue/10 text-cue-blue",
  confirmed: "bg-cue-blue/10 text-cue-blue",
  paid: "bg-go-green/10 text-go-green",
  completed: "bg-go-green/15 text-go-green",
  cancelled: "bg-aluminum/10 text-aluminum/50",
  declined: "bg-aluminum/10 text-aluminum/50",
};

const VALID_STATUSES = ["pending", "accepted", "confirmed", "paid", "completed", "cancelled", "declined"];

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action forms
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjRate, setAdjRate] = useState("");
  const [adjHours, setAdjHours] = useState("");
  const [adjTotal, setAdjTotal] = useState("");
  const [adjFee, setAdjFee] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  const fetchBooking = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch single booking with all joins via the list endpoint + search by ID
    const res = await fetch(`/api/admin/bookings?search=${id.slice(0, 8)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const b = (data.bookings || []).find((b: any) => b.id === id);
      if (b) {
        setBooking(b);
        setNoteText(b.admin_notes || "");
        setAdjRate(b.rate?.toString() || "");
        setAdjHours(b.total_hours?.toString() || "");
        setAdjTotal(b.total_amount?.toString() || "");
        setAdjFee(b.platform_fee?.toString() || "");
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const doAction = async (action: string, value?: any) => {
    setActionLoading(action);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, bookingId: id, value }),
    });

    setActionLoading(null);
    setShowCancel(false);
    setShowOverride(false);
    setShowAdjust(false);
    setShowNote(false);
    fetchBooking();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return <div className="p-8 text-aluminum/50 text-sm">Booking not found.</div>;
  }

  const b = booking;
  const producer = b["profiles!bookings_producer_id_fkey"];
  const tech = b["profiles!bookings_tech_id_fkey"];
  const project = b.projects;
  const role = b.project_roles?.skill;

  return (
    <div className="p-6 max-w-[1000px]">
      <Link href="/admin/bookings" className="text-[10px] font-mono text-aluminum/40 hover:text-signal-orange transition-colors">
        &larr; All Bookings
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold tracking-tight">
              Booking {b.id.slice(0, 8)}
            </h1>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase ${STATUS_COLORS[b.status] || "text-aluminum/40"}`}>
              {b.status}
            </span>
          </div>
          <div className="text-xs text-aluminum/50 mt-1">
            Created {new Date(b.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!["cancelled", "declined"].includes(b.status) && (
            <button
              onClick={() => setShowCancel(!showCancel)}
              className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-signal-orange/10 text-signal-orange rounded hover:bg-signal-orange/20 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-standby-amber/10 text-standby-amber rounded hover:bg-standby-amber/20 transition-colors"
          >
            Override Status
          </button>
          <button
            onClick={() => setShowAdjust(!showAdjust)}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-cue-blue/10 text-cue-blue rounded hover:bg-cue-blue/20 transition-colors"
          >
            Adjust Amount
          </button>
          <button
            onClick={() => setShowNote(!showNote)}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-aluminum/10 text-aluminum/60 rounded hover:bg-aluminum/20 transition-colors"
          >
            Add Note
          </button>
        </div>
      </div>

      {/* Cancel form */}
      {showCancel && (
        <ActionForm
          label="Cancel this booking"
          color="signal-orange"
          onSubmit={() => doAction("cancel", cancelReason)}
          onCancel={() => setShowCancel(false)}
          loading={actionLoading === "cancel"}
          submitLabel="Confirm Cancel"
        >
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Cancellation reason (optional)..."
            className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights placeholder:text-aluminum/25 focus:outline-none focus:border-signal-orange/30"
          />
        </ActionForm>
      )}

      {/* Override status form */}
      {showOverride && (
        <ActionForm
          label="Override booking status"
          color="standby-amber"
          onSubmit={() => doAction("override_status", overrideStatus)}
          onCancel={() => setShowOverride(false)}
          loading={actionLoading === "override_status"}
          submitLabel="Set Status"
        >
          <select
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="">Select status...</option>
            {VALID_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </ActionForm>
      )}

      {/* Adjust amount form */}
      {showAdjust && (
        <ActionForm
          label="Adjust booking amounts"
          color="cue-blue"
          onSubmit={() => doAction("adjust_amount", {
            rate: adjRate ? parseFloat(adjRate) : undefined,
            hours: adjHours ? parseFloat(adjHours) : undefined,
            total: adjTotal ? parseFloat(adjTotal) : undefined,
            fee: adjFee ? parseFloat(adjFee) : undefined,
          })}
          onCancel={() => setShowAdjust(false)}
          loading={actionLoading === "adjust_amount"}
          submitLabel="Save Changes"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Rate ($/hr)</label>
              <input type="number" value={adjRate} onChange={(e) => setAdjRate(e.target.value)}
                className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Hours</label>
              <input type="number" value={adjHours} onChange={(e) => setAdjHours(e.target.value)}
                className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Total ($)</label>
              <input type="number" value={adjTotal} onChange={(e) => setAdjTotal(e.target.value)}
                className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Fee ($)</label>
              <input type="number" value={adjFee} onChange={(e) => setAdjFee(e.target.value)}
                className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30" />
            </div>
          </div>
        </ActionForm>
      )}

      {/* Admin note form */}
      {showNote && (
        <ActionForm
          label="Admin note"
          color="aluminum"
          onSubmit={() => doAction("admin_note", noteText)}
          onCancel={() => setShowNote(false)}
          loading={actionLoading === "admin_note"}
          submitLabel="Save Note"
        >
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-2 text-xs text-house-lights placeholder:text-aluminum/25 focus:outline-none focus:border-signal-orange/30 resize-none"
          />
        </ActionForm>
      )}

      {/* Admin notes display */}
      {b.admin_notes && !showNote && (
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mb-4">
          <div className="font-mono text-[9px] text-standby-amber tracking-[3px] uppercase mb-2">Admin Notes</div>
          <p className="text-xs text-aluminum/60 whitespace-pre-wrap">{b.admin_notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Booking Details */}
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
          <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">Details</h2>
          <div className="space-y-2 text-xs">
            <InfoRow label="Booking ID" value={b.id} mono />
            <InfoRow label="Status" value={b.status} />
            <InfoRow label="Rate" value={b.rate ? `$${b.rate}/hr` : "—"} />
            <InfoRow label="Hours" value={b.total_hours ?? "—"} />
            <InfoRow label="Total Amount" value={b.total_amount ? `$${b.total_amount.toLocaleString()}` : "—"} />
            <InfoRow label="Platform Fee" value={b.platform_fee ? `$${b.platform_fee.toLocaleString()}` : "—"} />
            <InfoRow label="Payment Method" value={b.payment_method || "—"} />
            {b.po_number && <InfoRow label="PO Number" value={b.po_number} />}
            {role && <InfoRow label="Role" value={role} />}
            {b.notes && (
              <div className="pt-2 border-t border-ink/[0.03]">
                <div className="text-[9px] text-aluminum/40 font-mono uppercase mb-1">Booking Notes</div>
                <p className="text-aluminum/60">{b.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* People & Project */}
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
          <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">People & Project</h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[9px] text-aluminum/40 font-mono uppercase mb-1">Producer</div>
              <Link href={`/admin/users/${producer?.id}`} className="text-house-lights/70 hover:text-signal-orange transition-colors">
                {producer?.display_name || "—"}
              </Link>
              {producer?.company_name && (
                <span className="text-aluminum/40 ml-1">({producer.company_name})</span>
              )}
            </div>
            <div>
              <div className="text-[9px] text-aluminum/40 font-mono uppercase mb-1">Technician</div>
              <Link href={`/admin/users/${tech?.id}`} className="text-house-lights/70 hover:text-signal-orange transition-colors">
                {tech?.display_name || "—"}
              </Link>
            </div>
            {project && (
              <div>
                <div className="text-[9px] text-aluminum/40 font-mono uppercase mb-1">Project</div>
                <span className="text-house-lights/70">{project.name || "—"}</span>
                {project.city && <span className="text-aluminum/40 ml-1">({project.city})</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5 mt-4">
        <h2 className="font-mono text-[9px] text-signal-orange/60 tracking-[3px] uppercase mb-3">Timeline</h2>
        <div className="space-y-2">
          <TimelineEvent label="Created" date={b.created_at} />
          <TimelineEvent label="Confirmed" date={b.confirmed_at} />
          <TimelineEvent label="Checked In" date={b.checked_in_at} />
          <TimelineEvent label="Checked Out" date={b.checked_out_at} extra={b.actual_hours ? `${b.actual_hours}h actual` : undefined} />
          <TimelineEvent label="Completed" date={b.completed_at} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-aluminum/40">{label}</span>
      <span className={`text-house-lights/70 text-right max-w-[60%] truncate ${mono ? "font-mono text-[10px]" : ""}`}>{value}</span>
    </div>
  );
}

function TimelineEvent({ label, date, extra }: { label: string; date: string | null; extra?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${date ? "bg-go-green" : "bg-aluminum/20"}`} />
      <span className="text-xs text-aluminum/50 w-24">{label}</span>
      {date ? (
        <span className="text-[10px] font-mono text-aluminum/60">
          {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          {extra && <span className="text-aluminum/40 ml-2">({extra})</span>}
        </span>
      ) : (
        <span className="text-[10px] font-mono text-aluminum/20">—</span>
      )}
    </div>
  );
}

function ActionForm({ label, color, onSubmit, onCancel, loading, submitLabel, children }: {
  label: string;
  color: string;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-deep-stage/40 border border-${color}/20 rounded-xl p-4 mb-4`}>
      <div className="text-xs text-house-lights/70 mb-2">{label}</div>
      <div className="mb-3">{children}</div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={loading}
          className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-${color}/10 text-${color} rounded hover:bg-${color}/20 transition-colors disabled:opacity-50`}
        >
          {loading ? "..." : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-aluminum/40 hover:text-aluminum transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
