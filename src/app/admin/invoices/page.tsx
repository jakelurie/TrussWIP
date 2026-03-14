"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type PendingProducer = {
  id: string;
  display_name: string | null;
  email: string | null;
  company_name: string | null;
  billing_email: string | null;
  billing_address: string | null;
  payment_terms: string | null;
  city: string | null;
  created_at: string;
  invoice_requested_at: string | null;
  bookingCount: number;
  gmv: number;
};

type ApprovedAccount = {
  id: string;
  display_name: string | null;
  email: string | null;
  company_name: string | null;
  billing_email: string | null;
  payment_terms: string | null;
  invoice_approved_at: string | null;
  invoice_credit_limit: number;
  invoice_notes: string | null;
  outstanding: number;
  pctUsed: number;
  status: string;
  lastBookingDate: string | null;
};

export default function AdminInvoicesPage() {
  const [tab, setTab] = useState<"queue" | "outstanding">("queue");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingProducer[]>([]);
  const [accounts, setAccounts] = useState<ApprovedAccount[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/invoices?tab=${tab}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (tab === "queue") setPending(data.pending || []);
      else setAccounts(data.accounts || []);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-6 max-w-[1100px]">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-signal-orange tracking-[3px] uppercase">Platform Admin</span>
        <h1 className="font-heading text-xl font-bold tracking-tight mt-1">Invoices</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab("queue")}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase rounded-lg transition-colors ${
            tab === "queue"
              ? "bg-signal-orange/10 text-signal-orange"
              : "text-aluminum/40 hover:text-aluminum/60 hover:bg-ink/[0.03]"
          }`}
        >
          Approval Queue {pending.length > 0 && tab !== "queue" && (
            <span className="ml-1.5 inline-block w-4 h-4 rounded-full bg-signal-orange/20 text-signal-orange text-[9px] leading-4 text-center">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("outstanding")}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase rounded-lg transition-colors ${
            tab === "outstanding"
              ? "bg-signal-orange/10 text-signal-orange"
              : "text-aluminum/40 hover:text-aluminum/60 hover:bg-ink/[0.03]"
          }`}
        >
          Outstanding Invoices
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
        </div>
      ) : tab === "queue" ? (
        <ApprovalQueue pending={pending} onRefresh={fetchData} />
      ) : (
        <OutstandingInvoices accounts={accounts} onRefresh={fetchData} />
      )}
    </div>
  );
}

// ── Approval Queue ──

function ApprovalQueue({ pending, onRefresh }: { pending: PendingProducer[]; onRefresh: () => void }) {
  if (pending.length === 0) {
    return (
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-8 text-center">
        <div className="text-aluminum/30 text-sm">No pending invoice requests</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.map((p) => (
        <ApprovalCard key={p.id} producer={p} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function ApprovalCard({ producer: p, onRefresh }: { producer: PendingProducer; onRefresh: () => void }) {
  const [creditLimit, setCreditLimit] = useState("");
  const [netTerms, setNetTerms] = useState("net_30");
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const doAction = async (action: "approve" | "deny") => {
    setActing(action);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/admin/invoices", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        producerId: p.id,
        creditLimit: creditLimit ? parseInt(creditLimit, 10) : 0,
        netTerms,
        notes: notes || undefined,
      }),
    });
    setActing(null);
    onRefresh();
  };

  return (
    <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link href={`/admin/users/${p.id}`} className="font-heading text-base font-bold hover:text-signal-orange transition-colors">
            {p.company_name || p.display_name || "Unknown"}
          </Link>
          <div className="text-[11px] text-aluminum/50 mt-0.5">
            Contact: {p.display_name || "—"} &middot; {p.email || "—"}
          </div>
          {p.billing_email && (
            <div className="text-[11px] text-aluminum/40">
              AP Email: {p.billing_email}
            </div>
          )}
        </div>
        <span className="text-[9px] font-mono text-aluminum/30">
          {p.invoice_requested_at
            ? `Requested ${getTimeAgo(p.invoice_requested_at)}`
            : `Joined ${getTimeAgo(p.created_at)}`}
        </span>
      </div>

      {/* Account stats */}
      <div className="flex gap-4 text-[10px] text-aluminum/50 mb-4">
        <span>Joined {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>{p.bookingCount} booking{p.bookingCount !== 1 ? "s" : ""} completed</span>
        <span>${p.gmv.toLocaleString()} GMV</span>
        {p.city && <span>{p.city}</span>}
      </div>

      {/* Approval form */}
      <div className="bg-blackout/30 border border-ink/[0.04] rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4 mb-3">
          <div>
            <label className="block text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Credit Limit ($)</label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0 = unlimited"
              className="w-36 bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights placeholder:text-aluminum/25 focus:outline-none focus:border-signal-orange/30"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Net Terms</label>
            <select
              value={netTerms}
              onChange={(e) => setNetTerms(e.target.value)}
              className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
            >
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[9px] font-mono text-aluminum/40 tracking-wider uppercase mb-1">Admin Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights placeholder:text-aluminum/25 focus:outline-none focus:border-signal-orange/30"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => doAction("approve")}
            disabled={acting !== null}
            className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-go-green/10 text-go-green rounded hover:bg-go-green/20 transition-colors disabled:opacity-50"
          >
            {acting === "approve" ? "Approving..." : "Approve"}
          </button>
          <button
            onClick={() => doAction("deny")}
            disabled={acting !== null}
            className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-signal-orange/10 text-signal-orange rounded hover:bg-signal-orange/20 transition-colors disabled:opacity-50"
          >
            {acting === "deny" ? "Denying..." : "Deny"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Outstanding Invoices ──

function OutstandingInvoices({ accounts, onRefresh }: { accounts: ApprovedAccount[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (producerId: string) => {
    setRevoking(producerId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/admin/invoices", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "revoke", producerId }),
    });
    setRevoking(null);
    onRefresh();
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-8 text-center">
        <div className="text-aluminum/30 text-sm">No approved invoice accounts</div>
      </div>
    );
  }

  const STATUS_STYLES: Record<string, string> = {
    current: "text-go-green",
    near_limit: "text-standby-amber",
    over_limit: "text-signal-orange",
    unlimited: "text-cue-blue",
  };

  const STATUS_LABELS: Record<string, string> = {
    current: "Current",
    near_limit: "Near Limit",
    over_limit: "Over Limit",
    unlimited: "Unlimited",
  };

  return (
    <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-ink/[0.06]">
            <th className="text-left px-4 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Company</th>
            <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden md:table-cell">Producer</th>
            <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Terms</th>
            <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Limit</th>
            <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Outstanding</th>
            <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden md:table-cell">% Used</th>
            <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Last Booking</th>
            <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <>
              <tr
                key={a.id}
                className="border-b border-ink/[0.03] hover:bg-ink/[0.02] transition-colors cursor-pointer"
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              >
                <td className="px-4 py-2.5 font-medium">{a.company_name || a.display_name || "—"}</td>
                <td className="px-3 py-2.5 text-aluminum/60 hidden md:table-cell">{a.display_name || "—"}</td>
                <td className="px-3 py-2.5 text-aluminum/50 font-mono text-[10px] hidden lg:table-cell">
                  {a.payment_terms === "net_15" ? "Net 15" : "Net 30"}
                </td>
                <td className="px-3 py-2.5 font-mono text-[10px]">
                  {a.invoice_credit_limit ? `$${a.invoice_credit_limit.toLocaleString()}` : "None"}
                </td>
                <td className="px-3 py-2.5 font-mono text-[10px]">${a.outstanding.toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-[10px] hidden md:table-cell">
                  {a.invoice_credit_limit ? `${a.pctUsed}%` : "—"}
                </td>
                <td className="px-3 py-2.5 text-aluminum/40 font-mono text-[10px] hidden lg:table-cell">
                  {a.lastBookingDate ? getTimeAgo(a.lastBookingDate) : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-[9px] font-mono tracking-wider uppercase ${STATUS_STYLES[a.status] || "text-aluminum/40"}`}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </td>
              </tr>
              {expanded === a.id && (
                <tr key={`${a.id}-detail`} className="border-b border-ink/[0.03]">
                  <td colSpan={8} className="px-4 py-4 bg-blackout/20">
                    <div className="flex flex-wrap gap-6 text-[11px]">
                      <div>
                        <span className="text-aluminum/40">AP Email:</span>{" "}
                        <span className="text-aluminum/70">{a.billing_email || "—"}</span>
                      </div>
                      <div>
                        <span className="text-aluminum/40">Approved:</span>{" "}
                        <span className="text-aluminum/70">
                          {a.invoice_approved_at
                            ? new Date(a.invoice_approved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "—"}
                        </span>
                      </div>
                      {a.invoice_notes && (
                        <div>
                          <span className="text-aluminum/40">Notes:</span>{" "}
                          <span className="text-aluminum/70">{a.invoice_notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/admin/users/${a.id}`}
                        className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-cue-blue/10 text-cue-blue rounded hover:bg-cue-blue/20 transition-colors"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRevoke(a.id); }}
                        disabled={revoking === a.id}
                        className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider bg-signal-orange/10 text-signal-orange rounded hover:bg-signal-orange/20 transition-colors disabled:opacity-50"
                      >
                        {revoking === a.id ? "Revoking..." : "Revoke Access"}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
