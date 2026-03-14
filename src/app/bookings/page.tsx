"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReviewModal from "@/components/ReviewModal";
import BookingModal from "@/components/BookingModal";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: "var(--color-standby-amber)", label: "PENDING" },
  accepted: { color: "var(--color-cue-blue)", label: "ACCEPTED" },
  confirmed: { color: "var(--color-go-green)", label: "CONFIRMED" },
  declined: { color: "#FF3D00", label: "DECLINED" },
  completed: { color: "#9B59B6", label: "COMPLETED" },
  cancelled: { color: "var(--color-aluminum)", label: "CANCELLED" },
  paid: { color: "var(--color-go-green)", label: "PAID" },
};

export default function Bookings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [toast, setToast] = useState("");
  const [paying, setPaying] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [billingType, setBillingType] = useState("credit_card");
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [feedCopied, setFeedCopied] = useState(false);
  const [rebookData, setRebookData] = useState<any>(null);
  const [calSyncOpen, setCalSyncOpen] = useState(false);
  const [calSynced, setCalSynced] = useState(false);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Check localStorage for calendar sync flag on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCalSynced(localStorage.getItem("truss_cal_synced") === "1");
    }
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  const bookingAction = async (action: string, bookingId: string, extra?: Record<string, any>) => {
    const token = await getToken();
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ action, bookingId, ...extra }),
    });
    return res.json();
  };

  const handleComplete = async (booking: any) => {
    await bookingAction("complete", booking.id);
    showToast("Gig marked complete! Leave a review?");
    loadData();
    setReviewBooking(booking);
    setShowReview(true);
  };

  const handleInvoiceConfirm = async (booking: any) => {
    await bookingAction("invoice_confirm", booking.id);
    showToast(billingType === "invoice" ? "Booking confirmed — added to your monthly invoice" : "Booking confirmed — deducted from balance");
    loadData();
  };

  const handlePayment = async (booking: any) => {
    setPaying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Payment error: " + (data.error || "Unknown error"));
        setPaying(false);
      }
    } catch (err) {
      showToast("Payment failed");
      setPaying(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUserId(session.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, display_name, billing_type, calendar_token")
      .eq("id", session.user.id)
      .single();
    setUserType(profile?.user_type || null);
    setUserName(profile?.display_name || "");
    setBillingType(profile?.billing_type || "credit_card");
    setCalendarToken(profile?.calendar_token || null);

    const { data: b } = await supabase
      .from("bookings")
      .select("*, projects(name, city, venue, start_date, end_date), project_roles(skill, quantity)")
      .or(`producer_id.eq.${session.user.id},tech_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all((b || []).map(async (booking: any) => {
      const { data: producer } = await supabase
        .from("profiles")
        .select("display_name, company")
        .eq("id", booking.producer_id)
        .single();
      const { data: tech } = await supabase
        .from("profiles")
        .select("display_name, city")
        .eq("id", booking.tech_id)
        .single();
      return { ...booking, producer, tech };
    }));

    setBookings(enriched);
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    // Map status to API action
    const actionMap: Record<string, string> = {
      accepted: "accept",
      declined: "decline",
      confirmed: "confirm",
    };
    const action = actionMap[newStatus];
    if (!action) return;

    await bookingAction(action, bookingId);
    showToast(`Booking ${newStatus}`);
    loadData();
    if (selected?.id === bookingId) {
      setSelected({ ...selected, status: newStatus });
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
  };

  const getHue = (name: string) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
  };

  const handleCheckIn = async (booking: any) => {
    await bookingAction("check_in", booking.id);
    showToast("Clocked in!");
    loadData();
  };

  const handleCheckOut = async (booking: any) => {
    const result = await bookingAction("check_out", booking.id);
    showToast(`Clocked out! ${result.actualHours || ""}hr logged`);
    loadData();
  };

  const handleCancelBooking = async (booking: any) => {
    await bookingAction("cancel", booking.id);
    showToast("Booking cancelled");
    loadData();
  };

  // ── Project Files for booking detail ──
  const loadProjectFiles = async (projectId: string) => {
    setLoadingFiles(true);
    const token = await getToken();
    const res = await fetch("/api/project-files", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "list", projectId }),
    });
    const data = await res.json();
    setProjectFiles(data.files || []);
    setLoadingFiles(false);
  };

  useEffect(() => {
    if (selected && ["accepted", "confirmed", "paid", "completed"].includes(selected.status)) {
      loadProjectFiles(selected.project_id);
    } else {
      setProjectFiles([]);
    }
  }, [selected?.id]);

  const handleFileDownload = async (fileId: string) => {
    const token = await getToken();
    const res = await fetch("/api/project-files", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "download", fileId }),
    });
    const data = await res.json();
    if (data.url) {
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getFileLabel = (mime: string) => {
    const m: Record<string, string> = {
      "application/pdf": "PDF", "image/jpeg": "JPG", "image/png": "PNG",
      "text/csv": "CSV", "text/plain": "TXT", "application/zip": "ZIP",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    };
    return m[mime] || "FILE";
  };

  const fmtFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1_048_576).toFixed(1)}MB`;
  };

  const downloadIcs = (booking: any) => {
    const startDate = booking.projects?.start_date?.replace(/-/g, "");
    if (!startDate) return;
    const endDateRaw = booking.projects?.end_date || booking.projects?.start_date;
    const endD = new Date(endDateRaw + "T00:00:00Z");
    endD.setUTCDate(endD.getUTCDate() + 1);
    const endDate = endD.toISOString().split("T")[0].replace(/-/g, "");
    const summary = `${booking.projects?.name || "Gig"}${booking.project_roles?.skill ? ` (${booking.project_roles.skill})` : ""}`;
    const location = [booking.projects?.venue, booking.projects?.city].filter(Boolean).join(", ");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Truss//Gig Calendar//EN",
      "BEGIN:VEVENT",
      `UID:${booking.id}@trusswork.org`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : "",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `truss-${booking.projects?.name?.replace(/\s+/g, "-").toLowerCase() || "gig"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading bookings...</span>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2 bg-go-green/15 border border-go-green/30 rounded-lg font-mono text-xs text-go-green backdrop-blur-md">
          ✓ {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-heading text-2xl font-bold tracking-wider uppercase mb-1">
          My <span className="text-signal-orange">Bookings</span>
        </h1>
        <p className="text-sm text-aluminum mb-6">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          {bookings.filter(b => b.status === "pending").length > 0 && (
            <span className="text-standby-amber ml-2">
              · {bookings.filter(b => b.status === "pending").length} pending
            </span>
          )}
        </p>

        {userType === "tech" && calendarToken && bookings.length > 0 && (
          calSynced ? (
            <div className="flex items-center gap-1.5 mb-4 text-[11px] font-mono text-go-green/60">
              <span className="w-1.5 h-1.5 rounded-full bg-go-green/50" />
              Calendar synced
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={() => setCalSyncOpen(!calSyncOpen)}
                className="text-[11px] font-mono text-aluminum/65 hover:text-signal-orange transition-colors"
              >
                {calSyncOpen ? "Hide calendar sync ▲" : "Calendar Sync ▸"}
              </button>
              {calSyncOpen && (
                <div className="bg-deep-stage border border-white/5 rounded-lg p-4 mt-2">
                  <p className="text-xs text-aluminum mb-3">
                    Subscribe to this feed and your confirmed gigs will automatically appear in your calendar.
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/api/calendar/${userId}?token=${calendarToken}`}
                      className="flex-1 px-3 py-2 bg-blackout border border-ink/[0.06] rounded-lg font-mono text-[11px] text-aluminum truncate"
                    />
                    <button
                      onClick={() => {
                        const url = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/api/calendar/${userId}?token=${calendarToken}`;
                        navigator.clipboard.writeText(url);
                        setFeedCopied(true);
                        setTimeout(() => setFeedCopied(false), 2000);
                        localStorage.setItem("truss_cal_synced", "1");
                        setCalSynced(true);
                      }}
                      className="px-4 py-2 bg-signal-orange/10 text-signal-orange font-mono text-xs rounded-lg hover:bg-signal-orange/20 transition-colors flex-shrink-0"
                    >
                      {feedCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="mt-3 text-[10px] text-aluminum/60 space-y-1">
                    <p><strong className="text-aluminum/60">iPhone:</strong> Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar → paste URL</p>
                    <p><strong className="text-aluminum/60">Google Calendar:</strong> Settings → Add calendar → From URL → paste URL</p>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-deep-stage rounded-lg">
            <div className="font-heading text-lg font-semibold mb-1">No bookings yet</div>
            <div className="text-sm text-aluminum mb-4">
              {userType === "producer"
                ? "Browse the marketplace to find and book technicians"
                : "When producers book you, their requests will appear here"
              }
            </div>
            {userType === "producer" && (
              <Link href="/browse" className="px-5 py-2.5 bg-signal-orange text-white font-heading font-semibold text-sm tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors inline-block">
                Browse Techs
              </Link>
            )}
          </div>
        ) : (
          <div className="flex gap-4">
            <div className={`${selected ? "w-[380px]" : "w-full max-w-[500px]"} flex-shrink-0 space-y-2 overflow-auto`} style={{ maxHeight: "calc(100vh - 180px)" }}>
              {bookings.map(b => {
                const isProducer = b.producer_id === userId;
                const otherName = isProducer ? b.tech?.display_name : b.producer?.display_name;
                const otherHue = getHue(otherName || "");
                const sc = STATUS_CONFIG[b.status] || { color: "var(--color-aluminum)", label: b.status };

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border ${
                      selected?.id === b.id
                        ? "bg-signal-orange/5 border-signal-orange/20"
                        : "bg-deep-stage border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-[10px] font-bold flex-shrink-0"
                          style={{ background: `hsl(${otherHue}, 40%, 25%)` }}
                        >
                          {getInitials(otherName || "")}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{b.projects?.name || "Unknown Event"}</div>
                          <div className="font-mono text-[10px] text-aluminum">
                            {b.project_roles?.skill} · {isProducer ? `→ ${otherName}` : `← ${otherName}`}
                          </div>
                        </div>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold"
                        style={{ color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-aluminum">
                        {b.projects?.city}
                        {b.projects?.start_date && ` · ${formatDate(b.projects.start_date)}`}
                      </span>
                      <span className="font-mono text-sm font-medium">${b.total_amount?.toLocaleString() || "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selected && (
              <div className="flex-1 bg-deep-stage border border-white/5 rounded-lg p-6 overflow-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="font-heading text-xl font-bold mb-1">{selected.projects?.name}</h2>
                    <div className="text-xs text-aluminum">
                      {selected.projects?.city}
                      {selected.projects?.venue && ` · ${selected.projects.venue}`}
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded text-xs font-mono font-semibold"
                    style={{
                      color: STATUS_CONFIG[selected.status]?.color,
                      background: `${STATUS_CONFIG[selected.status]?.color}15`,
                      border: `1px solid ${STATUS_CONFIG[selected.status]?.color}30`,
                    }}
                  >
                    {STATUS_CONFIG[selected.status]?.label}
                  </span>
                </div>

                <div className="flex items-center gap-0 mb-6 p-4 bg-blackout rounded-lg">
                  {["pending", "accepted", "confirmed"].map((step, i) => {
                    const steps = ["pending", "accepted", "confirmed"];
                    const currentIdx = steps.indexOf(selected.status === "declined" ? "pending" : selected.status);
                    const active = i <= currentIdx && selected.status !== "declined";
                    const stepColor = STATUS_CONFIG[step]?.color || "var(--color-aluminum)";
                    const dates = [selected.sent_at, selected.responded_at, selected.confirmed_at];

                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                            style={{ background: active ? stepColor : "rgba(255,255,255,0.06)", color: active ? "#fff" : "#555" }}
                          >
                            {active ? "✓" : i + 1}
                          </div>
                          <span className="font-mono text-[9px] uppercase" style={{ color: active ? stepColor : "#555" }}>{step}</span>
                          {dates[i] && <span className="font-mono text-[8px] text-aluminum/60">{formatDate(dates[i])}</span>}
                        </div>
                        {i < 2 && (
                          <div className="flex-1 h-0.5 mx-2 rounded mb-8"
                            style={{ background: i < currentIdx && selected.status !== "declined" ? STATUS_CONFIG[steps[i + 1]]?.color : "rgba(255,255,255,0.06)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { l: "Role", v: selected.project_roles?.skill || "—" },
                    { l: "Location", v: selected.projects?.city || "—" },
                    { l: "Dates", v: selected.projects?.start_date ? `${formatDate(selected.projects.start_date)}${selected.projects.end_date ? ` – ${formatDate(selected.projects.end_date)}` : ""}` : "—" },
                    { l: "Hours", v: selected.total_hours ? `${selected.total_hours}hr` : "—" },
                    { l: "Rate", v: selected.rate ? `$${selected.rate}/hr` : "—" },
                    { l: "Total", v: selected.total_amount ? `$${selected.total_amount.toLocaleString()}` : "—" },
                  ].map((d, i) => (
                    <div key={i} className="p-3 bg-blackout rounded-md">
                      <div className="text-[10px] text-aluminum uppercase tracking-wider mb-1">{d.l}</div>
                      <div className="font-mono text-sm font-medium">{d.v}</div>
                    </div>
                  ))}
                </div>

                {selected.notes && (
                  <div className="p-3 bg-blackout rounded-md mb-5">
                    <div className="text-[10px] text-aluminum uppercase tracking-wider mb-1">Notes</div>
                    <div className="text-sm text-aluminum/80 leading-relaxed">{selected.notes}</div>
                  </div>
                )}

                {/* Check-in/out times */}
                {(selected.checked_in_at || selected.checked_out_at) && (
                  <div className="flex gap-3 mb-5">
                    {selected.checked_in_at && (
                      <div className="flex-1 p-3 bg-blackout rounded-md">
                        <div className="text-[10px] text-aluminum uppercase tracking-wider mb-1">Clocked In</div>
                        <div className="font-mono text-sm font-medium">
                          {new Date(selected.checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    )}
                    {selected.checked_out_at && (
                      <div className="flex-1 p-3 bg-blackout rounded-md">
                        <div className="text-[10px] text-aluminum uppercase tracking-wider mb-1">Clocked Out</div>
                        <div className="font-mono text-sm font-medium">
                          {new Date(selected.checked_out_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    )}
                    {selected.actual_hours && (
                      <div className="flex-1 p-3 bg-blackout rounded-md">
                        <div className="text-[10px] text-aluminum uppercase tracking-wider mb-1">Actual Hours</div>
                        <div className="font-mono text-sm font-medium text-signal-orange">{selected.actual_hours}hr</div>
                      </div>
                    )}
                  </div>
                )}

                {(selected.po_number || selected.payment_method) && (
                  <div className="flex gap-3 mb-5">
                    {selected.po_number && (
                      <div className="flex-1 p-3 bg-blackout rounded-md">
                        <div className="text-[10px] text-aluminum uppercase tracking-wider mb-1">PO Number</div>
                        <div className="font-mono text-sm font-medium">{selected.po_number}</div>
                      </div>
                    )}
                    {selected.payment_method && selected.payment_method !== "credit_card" && (
                      <div className="flex-1 p-3 bg-blackout rounded-md">
                        <div className="text-[10px] text-aluminum uppercase tracking-wider mb-1">Billing</div>
                        <div className="font-mono text-sm font-medium capitalize">
                          {selected.payment_method === "invoice" ? "Monthly Invoice" : "Prepaid Balance"}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-blackout rounded-md">
                    <div className="text-[10px] text-aluminum uppercase tracking-wider mb-2">Producer</div>
                    <div className="text-sm font-semibold">{selected.producer?.display_name}</div>
                    {selected.producer?.company && <div className="text-xs text-aluminum">{selected.producer.company}</div>}
                  </div>
                  <div className="p-3 bg-blackout rounded-md">
                    <div className="text-[10px] text-aluminum uppercase tracking-wider mb-2">Technician</div>
                    <Link href={`/profile/${selected.tech_id}`} className="text-sm font-semibold text-signal-orange hover:underline">
                      {selected.tech?.display_name}
                    </Link>
                    {selected.tech?.city && <div className="text-xs text-aluminum">{selected.tech.city}</div>}
                  </div>
                </div>

                {/* ─── Project Files ─── */}
                {projectFiles.length > 0 && (
                  <div className="mb-5">
                    <div className="text-[10px] text-aluminum uppercase tracking-wider mb-2 font-mono">
                      Project Files ({projectFiles.length})
                    </div>
                    <div className="space-y-1">
                      {projectFiles.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between bg-blackout rounded-md px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[9px] font-bold text-signal-orange w-8 flex-shrink-0 text-center">
                              {getFileLabel(file.mime_type)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">{file.file_name}</div>
                              <div className="text-[9px] text-aluminum">
                                {file.category} · {fmtFileSize(file.file_size)}
                                {file.notes && <span className="ml-1 text-aluminum/60">· {file.notes}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFileDownload(file.id)}
                            className="text-[10px] font-mono text-signal-orange hover:underline flex-shrink-0 ml-2"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {selected.tech_id === userId && selected.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(selected.id, "accepted")}
                        className="px-5 py-2.5 bg-go-green text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-green-600 transition-colors">
                        Accept
                      </button>
                      <button onClick={() => updateStatus(selected.id, "declined")}
                        className="px-5 py-2.5 bg-transparent text-red-400 border border-red-400/30 font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-red-400/10 transition-colors">
                        Decline
                      </button>
                    </>
                  )}
                  {selected.producer_id === userId && selected.status === "accepted" && (
                    billingType === "invoice" || billingType === "prepaid" ? (
                      <button onClick={() => handleInvoiceConfirm(selected)}
                        className="px-5 py-2.5 bg-go-green text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-green-600 transition-colors">
                        {billingType === "invoice" ? "Confirm — Add to Invoice" : "Confirm — Deduct from Balance"}
                      </button>
                    ) : (
                      <button onClick={() => updateStatus(selected.id, "confirmed")}
                        className="px-5 py-2.5 bg-go-green text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-green-600 transition-colors">
                        Confirm Booking
                      </button>
                    )
                  )}
                  {selected.status === "confirmed" && selected.producer_id === userId && billingType === "credit_card" && (
                    <button onClick={() => handlePayment(selected)} disabled={paying}
                      className="px-5 py-2.5 bg-signal-orange text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:shadow-[0_0_20px_rgba(255,77,0,0.3)] transition-all disabled:opacity-50">
                      {paying ? "Processing..." : "Pay Now"}
                    </button>
                  )}
                  {selected.status === "confirmed" && selected.producer_id === userId && billingType !== "credit_card" && (
                    <div className="px-4 py-2.5 bg-go-green/8 border border-go-green/15 rounded-lg text-xs text-go-green flex items-center gap-2">
                      {billingType === "invoice" ? "" : ""} Confirmed — {billingType === "invoice" ? "will appear on your monthly invoice" : "deducted from balance"}
                    </div>
                  )}
                  {selected.status === "confirmed" && selected.tech_id === userId && (
                    <div className="px-4 py-2.5 bg-go-green/8 border border-go-green/15 rounded-lg text-xs text-go-green flex items-center gap-2">
                      Confirmed — awaiting payment from producer
                    </div>
                  )}
                  {selected.status === "paid" && selected.producer_id === userId && (
                    <button onClick={() => handleComplete(selected)}
                      className="px-5 py-2.5 bg-purple-600 text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-purple-700 transition-colors">
                      Mark Gig Complete
                    </button>
                  )}
                  {selected.status === "paid" && selected.tech_id === userId && !selected.checked_in_at && (
                    <button onClick={() => handleCheckIn(selected)}
                      className="px-5 py-2.5 bg-go-green text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-green-600 transition-colors">
                      Clock In
                    </button>
                  )}
                  {selected.status === "paid" && selected.tech_id === userId && selected.checked_in_at && !selected.checked_out_at && (
                    <button onClick={() => handleCheckOut(selected)}
                      className="px-5 py-2.5 bg-standby-amber text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-amber-600 transition-colors">
                      Clock Out
                    </button>
                  )}
                  {selected.status === "paid" && selected.tech_id === userId && selected.checked_out_at && (
                    <div className="px-4 py-2.5 bg-go-green/8 border border-go-green/15 rounded-lg text-xs text-go-green flex items-center gap-2">
                      {selected.actual_hours}hr logged — awaiting completion
                    </div>
                  )}
                  {selected.status === "completed" && !selected.reviewed && selected.producer_id === userId && (
                    <button onClick={() => { setReviewBooking(selected); setShowReview(true); }}
                      className="px-5 py-2.5 bg-standby-amber text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-amber-600 transition-colors">
                      Leave a Review
                    </button>
                  )}
                  {selected.status === "completed" && selected.reviewed && (
                    <div className="px-4 py-2.5 bg-purple-500/8 border border-purple-500/15 rounded-lg text-xs text-purple-400 flex items-center gap-2">
                      Complete — reviewed
                    </div>
                  )}
                  {selected.status === "completed" && !selected.reviewed && selected.tech_id === userId && (
                    <div className="px-4 py-2.5 bg-purple-500/8 border border-purple-500/15 rounded-lg text-xs text-purple-400 flex items-center gap-2">
                      Complete — awaiting review from producer
                    </div>
                  )}
                  {selected.status === "completed" && selected.producer_id === userId && (
                    <button
                      onClick={() => setRebookData({
                        techId: selected.tech_id,
                        techName: selected.tech?.display_name || "Tech",
                        techRate: selected.rate || 0,
                        projectId: selected.project_id,
                        roleId: selected.project_role_id,
                        hours: selected.total_hours,
                      })}
                      className="px-5 py-2.5 bg-signal-orange/10 text-signal-orange border border-signal-orange/20 font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-signal-orange/20 transition-colors"
                    >
                      Book Again
                    </button>
                  )}
                  {selected.status === "declined" && (
                    <div className="px-4 py-2.5 bg-red-500/8 border border-red-500/15 rounded-lg text-xs text-red-400">
                      This booking was declined
                    </div>
                  )}
                  {selected.tech_id === userId && selected.status === "accepted" && (
                    <div className="px-4 py-2.5 bg-cue-blue/8 border border-cue-blue/15 rounded-lg text-xs text-cue-blue">
                      ⏳ Waiting for producer to confirm
                    </div>
                  )}
                  {(selected.status === "pending" || selected.status === "accepted") && (
                    <button onClick={() => handleCancelBooking(selected)}
                      className="px-4 py-2.5 bg-transparent text-red-400/60 border border-red-400/15 font-heading text-[10px] tracking-wider uppercase rounded-lg hover:bg-red-400/5 hover:text-red-400 transition-colors">
                      Cancel
                    </button>
                  )}
                  {(selected.status === "confirmed" || selected.status === "paid") && selected.projects?.start_date && (
                    <button
                      onClick={() => downloadIcs(selected)}
                      className="px-4 py-2.5 bg-ink/[0.03] border border-ink/[0.06] rounded-lg text-xs font-mono text-aluminum hover:border-signal-orange/20 hover:text-signal-orange transition-all"
                    >
                      Add to Calendar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showReview && reviewBooking && (
        <ReviewModal
          bookingId={reviewBooking.id}
          techId={reviewBooking.tech_id}
          techName={reviewBooking.tech?.display_name || "Tech"}
          projectName={reviewBooking.projects?.name || "Event"}
          producerId={userId || ""}
          producerName={userName}
          onClose={() => { setShowReview(false); setReviewBooking(null); }}
          onSuccess={() => { setShowReview(false); setReviewBooking(null); showToast("Review submitted!"); loadData(); }}
        />
      )}

      {rebookData && (
        <BookingModal
          techId={rebookData.techId}
          techName={rebookData.techName}
          techRate={rebookData.techRate}
          prefillProjectId={rebookData.projectId}
          prefillRoleId={rebookData.roleId}
          prefillRate={rebookData.techRate}
          prefillHours={rebookData.hours}
          onClose={() => setRebookData(null)}
          onSuccess={() => { setRebookData(null); loadData(); showToast("Booking request sent!"); }}
        />
      )}
    </>
  );
}