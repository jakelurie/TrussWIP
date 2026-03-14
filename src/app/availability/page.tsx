"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-go-green/15", text: "text-go-green", label: "Available" },
  unavailable: { bg: "bg-red-500/15", text: "text-red-400", label: "Unavailable" },
  tentative: { bg: "bg-standby-amber/15", text: "text-standby-amber", label: "Tentative" },
  booked: { bg: "bg-cue-blue/15", text: "text-cue-blue", label: "Booked" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Availability() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<Record<string, { status: string; notes: string; booking_id?: string }>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDates, setBulkDates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (userId) loadMonth(); }, [currentMonth, userId]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUserId(session.user.id);
    setLoading(false);
  };

  const loadMonth = async () => {
    if (!userId) return;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

    const { data } = await supabase.from("availability")
      .select("*")
      .eq("tech_user_id", userId)
      .gte("date", start)
      .lte("date", end);

    const map: Record<string, any> = {};
    (data || []).forEach(e => { map[e.date] = { status: e.status, notes: e.notes || "", booking_id: e.booking_id }; });

    // Also load booked dates from bookings
    const { data: bookings } = await supabase.from("bookings")
      .select("*, projects(start_date, end_date)")
      .eq("tech_id", userId)
      .in("status", ["confirmed", "paid", "accepted"]);

    (bookings || []).forEach(b => {
      if (b.projects?.start_date) {
        const sd = new Date(b.projects.start_date);
        const ed = b.projects?.end_date ? new Date(b.projects.end_date) : sd;
        for (let d = new Date(sd); d <= ed; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split("T")[0];
          if (!map[key]) map[key] = { status: "booked", notes: "", booking_id: b.id };
        }
      }
    });

    setEntries(map);
  };

  const setDateStatus = async (dateStr: string, status: string) => {
    if (!userId) return;
    setSaving(true);

    const existing = entries[dateStr];
    if (existing && existing.status === status) {
      // Toggle off
      await supabase.from("availability").delete()
        .eq("tech_user_id", userId).eq("date", dateStr);
      const updated = { ...entries };
      delete updated[dateStr];
      setEntries(updated);
    } else {
      await supabase.from("availability").upsert({
        tech_user_id: userId,
        date: dateStr,
        status,
      }, { onConflict: "tech_user_id,date" });
      setEntries({ ...entries, [dateStr]: { status, notes: "" } });
    }
    setSaving(false);
  };

  const handleBulkApply = async (status: string) => {
    if (!userId || bulkDates.length === 0) return;
    setSaving(true);

    const rows = bulkDates.map(date => ({
      tech_user_id: userId,
      date,
      status,
    }));

    await supabase.from("availability").upsert(rows, { onConflict: "tech_user_id,date" });

    const updated = { ...entries };
    bulkDates.forEach(d => { updated[d] = { status, notes: "" }; });
    setEntries(updated);
    setBulkDates([]);
    setBulkMode(false);
    setSaving(false);
  };

  const toggleBulkDate = (dateStr: string) => {
    if (bulkDates.includes(dateStr)) setBulkDates(bulkDates.filter(d => d !== dateStr));
    else setBulkDates([...bulkDates, dateStr]);
  };

  // Calendar math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="inline-block w-6 h-6 border-2 border-signal-orange/30 border-t-signal-orange rounded-full animate-spin" /></div>);

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="font-mono text-[10px] text-signal-orange tracking-[3px] uppercase">Schedule</span>
            <h1 className="font-heading text-2xl font-bold tracking-tight mt-1">
              Your <span className="text-signal-orange">Availability</span>
            </h1>
          </div>
          <button onClick={() => { setBulkMode(!bulkMode); setBulkDates([]); }}
            className={`px-4 py-2 text-xs font-mono rounded-lg border transition-all ${
              bulkMode ? "text-signal-orange border-signal-orange/30 bg-signal-orange/[0.05]" : "text-aluminum/65 border-ink/[0.06] hover:border-white/10"
            }`}>
            {bulkMode ? "Cancel Bulk" : "Bulk Edit"}
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4">
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${val.bg}`} />
              <span className="text-[10px] font-mono text-aluminum/60">{val.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-5">
          {/* Month nav */}
          <div className="flex justify-between items-center mb-5">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-ink/[0.03] hover:bg-ink/[0.06] flex items-center justify-center text-aluminum/65 transition-colors">
              ←
            </button>
            <h2 className="font-heading text-lg font-bold">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-ink/[0.03] hover:bg-ink/[0.06] flex items-center justify-center text-aluminum/65 transition-colors">
              →
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-mono text-aluminum/40 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const entry = entries[dateStr];
              const isToday = dateStr === today;
              const isPast = dateStr < today;
              const isBulkSelected = bulkDates.includes(dateStr);
              const status = entry?.status;
              const statusColor = status ? STATUS_COLORS[status] : null;

              return (
                <button key={dateStr}
                  onClick={() => {
                    if (isPast) return;
                    if (bulkMode) { toggleBulkDate(dateStr); return; }
                    if (status === "booked") return;
                    setSelectedDate(selectedDate === dateStr ? null : dateStr);
                  }}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                    isPast ? "opacity-30 cursor-default" :
                    isBulkSelected ? "ring-2 ring-signal-orange bg-signal-orange/10" :
                    selectedDate === dateStr ? "ring-2 ring-signal-orange" :
                    statusColor ? statusColor.bg : "bg-ink/[0.02] hover:bg-ink/[0.04]"
                  }`}>
                  <span className={`text-sm font-mono ${
                    isToday ? "text-signal-orange font-bold" :
                    statusColor ? statusColor.text : "text-aluminum/65"
                  }`}>
                    {day}
                  </span>
                  {status && (
                    <span className="text-[7px] font-mono mt-0.5" style={{ color: statusColor?.text.replace("text-", "") }}>
                      {status === "booked" ? "●" : status === "available" ? "✓" : status === "unavailable" ? "✕" : "?"}
                    </span>
                  )}
                  {isToday && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-signal-orange" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date actions */}
        {selectedDate && !bulkMode && entries[selectedDate]?.status !== "booked" && (
          <div className="bg-deep-stage/40 border border-ink/[0.03] rounded-xl p-4 mt-3">
            <div className="font-mono text-xs text-aluminum/60 mb-3">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDateStatus(selectedDate, "available")}
                className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all ${
                  entries[selectedDate]?.status === "available" ? "bg-go-green/20 text-go-green border border-go-green/30" : "bg-ink/[0.03] text-aluminum/65 border border-ink/[0.05] hover:border-go-green/20"
                }`}>
                ✓ Available
              </button>
              <button onClick={() => setDateStatus(selectedDate, "tentative")}
                className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all ${
                  entries[selectedDate]?.status === "tentative" ? "bg-standby-amber/20 text-standby-amber border border-standby-amber/30" : "bg-ink/[0.03] text-aluminum/65 border border-ink/[0.05] hover:border-standby-amber/20"
                }`}>
                ? Tentative
              </button>
              <button onClick={() => setDateStatus(selectedDate, "unavailable")}
                className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all ${
                  entries[selectedDate]?.status === "unavailable" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-ink/[0.03] text-aluminum/65 border border-ink/[0.05] hover:border-red-500/20"
                }`}>
                ✕ Unavailable
              </button>
            </div>
          </div>
        )}

        {/* Bulk actions */}
        {bulkMode && bulkDates.length > 0 && (
          <div className="bg-signal-orange/[0.04] border border-signal-orange/15 rounded-xl p-4 mt-3">
            <div className="font-mono text-xs text-signal-orange mb-3">{bulkDates.length} dates selected</div>
            <div className="flex gap-2">
              <button onClick={() => handleBulkApply("available")} disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-mono bg-go-green/15 text-go-green border border-go-green/20 hover:bg-go-green/25 transition-all disabled:opacity-50">
                Mark Available
              </button>
              <button onClick={() => handleBulkApply("unavailable")} disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-mono bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all disabled:opacity-50">
                Mark Unavailable
              </button>
              <button onClick={() => handleBulkApply("tentative")} disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-mono bg-standby-amber/15 text-standby-amber border border-standby-amber/20 hover:bg-standby-amber/25 transition-all disabled:opacity-50">
                Mark Tentative
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-aluminum/35 text-center mt-6">
          Producers can see your availability when booking. Dates with confirmed bookings are automatically marked as booked.
        </p>
    </main>
  );
}