"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const FILTER_OPTIONS = [
  { value: "all", label: "All Activity" },
  { value: "signup", label: "Signups" },
  { value: "booking_created", label: "Bookings Created" },
  { value: "booking_accepted", label: "Bookings Accepted" },
  { value: "booking_completed", label: "Bookings Completed" },
  { value: "booking_cancelled", label: "Bookings Cancelled" },
  { value: "review", label: "Reviews" },
  { value: "invoice_requested", label: "Invoice Requested" },
  { value: "invoice_approved", label: "Invoice Approved" },
  { value: "message", label: "Messages" },
];

const DOT_COLORS: Record<string, string> = {
  "cue-blue": "bg-cue-blue",
  "signal-orange": "bg-signal-orange",
  "standby-amber": "bg-standby-amber",
  "go-green": "bg-go-green",
  "aluminum": "bg-aluminum/30",
};

export default function AdminActivityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async (newOffset: number, append = false) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const params = new URLSearchParams();
    params.set("filter", filter);
    params.set("offset", String(newOffset));

    const res = await fetch(`/api/admin/activity?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setEvents(append ? (prev) => [...prev, ...data.events] : data.events);
      setHasMore(data.hasMore);
      setTotal(data.total);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setOffset(0);
    setEvents([]);
    fetchEvents(0);
  }, [fetchEvents]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = offset + 50;
          setOffset(next);
          fetchEvents(next, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, fetchEvents]);

  return (
    <div className="p-6 max-w-[900px]">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-signal-orange tracking-[3px] uppercase">Platform Admin</span>
        <h1 className="font-heading text-xl font-bold tracking-tight mt-1">Activity</h1>
      </div>

      {/* Filter bar */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-blackout/50 border border-ink/[0.06] rounded-lg px-3 py-1.5 text-xs text-house-lights focus:outline-none focus:border-signal-orange/30"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-[10px] font-mono text-aluminum/30">
            {total} event{total !== 1 ? "s" : ""} (last 90 days)
          </span>
        </div>
      </div>

      {/* Events */}
      <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl overflow-hidden">
        {events.length > 0 ? (
          <div className="divide-y divide-ink/[0.03]">
            {events.map((e, i) => (
              <div key={`${e.timestamp}-${i}`} className="flex items-start gap-3 px-5 py-3 hover:bg-ink/[0.02] transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${DOT_COLORS[e.color] || "bg-aluminum/30"}`} />
                <div className="flex-1 min-w-0">
                  {e.link ? (
                    <Link href={e.link} className="text-xs text-house-lights/70 hover:text-signal-orange transition-colors">
                      {e.message}
                    </Link>
                  ) : (
                    <span className="text-xs text-house-lights/70">{e.message}</span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-aluminum/30 flex-shrink-0 whitespace-nowrap">
                  {getTimeAgo(e.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-12 text-aluminum/30 text-sm">No activity found</div>
        ) : null}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="inline-block w-5 h-5 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-1" />}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
