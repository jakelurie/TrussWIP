"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "declined", label: "Declined" },
];

const PAYMENT_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "credit_card", label: "Credit Card" },
  { value: "invoice", label: "Invoice" },
  { value: "prepaid", label: "Prepaid" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-standby-amber/10 text-standby-amber",
  accepted: "bg-cue-blue/10 text-cue-blue",
  confirmed: "bg-cue-blue/10 text-cue-blue",
  paid: "bg-go-green/10 text-go-green",
  completed: "bg-go-green/15 text-go-green",
  cancelled: "bg-aluminum/10 text-aluminum/50",
  declined: "bg-aluminum/10 text-aluminum/50",
};

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: "Card",
  invoice: "Invoice",
  prepaid: "Prepaid",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchBookings = useCallback(async (newOffset: number, append = false) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    if (sort) params.set("sort", sort);
    if (search) params.set("search", search);
    params.set("offset", String(newOffset));

    const res = await fetch(`/api/admin/bookings?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setBookings(append ? (prev) => [...prev, ...data.bookings] : data.bookings);
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }, [status, payment, sort, search]);

  useEffect(() => {
    setOffset(0);
    fetchBookings(0);
  }, [fetchBookings]);

  const loadMore = () => {
    const next = offset + 50;
    setOffset(next);
    fetchBookings(next, true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // Compute summary stats from loaded bookings
  const totalGmv = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalFees = bookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);

  return (
    <div className="p-6 max-w-[1200px]">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-signal-orange tracking-[3px] uppercase">Platform Admin</span>
        <h1 className="font-heading text-xl font-bold tracking-tight mt-1">Bookings</h1>
      </div>

      {/* Filters */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search producer, tech, project, ID..."
              className="w-full bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights placeholder:text-aluminum/30 focus:outline-none focus:border-signal-orange/30"
            />
          </form>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount_desc">Highest Amount</option>
          </select>
        </div>

        {/* Summary bar */}
        {bookings.length > 0 && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-ink/[0.04] text-[10px] font-mono text-aluminum/40">
            <span>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} shown</span>
            <span>GMV: ${totalGmv.toLocaleString()}</span>
            <span>Fees: ${totalFees.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink/[0.06]">
                <th className="text-left px-4 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">ID</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Date</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Producer</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Tech</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Role</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden md:table-cell">Rate</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Total</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden lg:table-cell">Fee</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase hidden md:table-cell">Payment</th>
                <th className="text-left px-3 py-3 font-mono text-[9px] text-aluminum/50 tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const producer = b["profiles!bookings_producer_id_fkey"];
                const tech = b["profiles!bookings_tech_id_fkey"];
                const role = b.project_roles?.skill;
                return (
                  <tr key={b.id} className="border-b border-ink/[0.03] hover:bg-ink/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-mono text-[10px] text-aluminum/60 hover:text-signal-orange transition-colors"
                      >
                        {b.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-aluminum/40 font-mono text-[10px] whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/users/${producer?.id}`}
                        className="text-house-lights/70 hover:text-signal-orange transition-colors truncate max-w-[120px] block"
                      >
                        {producer?.display_name || "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/users/${tech?.id}`}
                        className="text-house-lights/70 hover:text-signal-orange transition-colors truncate max-w-[120px] block"
                      >
                        {tech?.display_name || "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      {role ? (
                        <span className="inline-block px-1.5 py-0.5 bg-cue-blue/10 text-cue-blue rounded text-[9px] font-mono tracking-wider">
                          {role}
                        </span>
                      ) : (
                        <span className="text-aluminum/20">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-aluminum/50 hidden md:table-cell">
                      {b.rate ? `$${b.rate}/hr` : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px]">
                      {b.total_amount ? `$${b.total_amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-go-green/70 hidden lg:table-cell">
                      {b.platform_fee ? `$${b.platform_fee.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className="text-[9px] font-mono text-aluminum/40 tracking-wider uppercase">
                        {PAYMENT_LABELS[b.payment_method] || b.payment_method || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase ${STATUS_COLORS[b.status] || "text-aluminum/40"}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && !loading && (
          <div className="text-center py-12 text-aluminum/30 text-sm">No bookings found</div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center py-4 border-t border-ink/[0.03]">
            <button
              onClick={loadMore}
              className="px-4 py-1.5 text-xs font-mono text-aluminum/60 hover:text-signal-orange transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
