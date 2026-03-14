"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import NotificationIcon from "@/lib/notification-icons";

type Tab = "all" | "unread" | "bookings" | "reviews" | "system" | "archived";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  archived_at: string | null;
}

interface Preferences {
  booking_requests_email: boolean;
  booking_updates_email: boolean;
  reviews_email: boolean;
  system_email: boolean;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "bookings", label: "Bookings" },
  { key: "reviews", label: "Reviews" },
  { key: "system", label: "System" },
  { key: "archived", label: "Archived" },
];

const BOOKING_TYPES = [
  "booking_request",
  "booking_accepted",
  "booking_confirmed",
  "booking_declined",
  "gig_completed",
  "gig_reminder",
];
const REVIEW_TYPES = ["review_received"];
const SYSTEM_TYPES = ["level_up", "payment"];

const PAGE_SIZE = 20;

function dateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  if (d >= today) return "TODAY";
  if (d >= yesterday) return "YESTERDAY";
  if (d >= weekAgo) return "THIS WEEK";
  return "EARLIER";
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    booking_requests_email: true,
    booking_updates_email: true,
    reviews_email: true,
    system_email: true,
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (userId) {
      setNotifications([]);
      setPage(0);
      setHasMore(false);
      fetchNotifications(userId, 0);
    }
  }, [activeTab, userId]);

  const init = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUserId(session.user.id);
    await fetchPreferences(session.user.id);
  };

  const fetchPreferences = async (uid: string) => {
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", uid)
      .single();

    if (data) {
      setPreferences({
        booking_requests_email: data.booking_requests_email,
        booking_updates_email: data.booking_updates_email,
        reviews_email: data.reviews_email,
        system_email: data.system_email,
      });
    }
  };

  const fetchNotifications = async (uid: string, pageNum: number) => {
    setLoading(pageNum === 0);

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    // 90 day cutoff for non-archived tabs
    const ninetyDaysAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000
    ).toISOString();

    if (activeTab === "archived") {
      query = query.not("archived_at", "is", null);
    } else {
      query = query.is("archived_at", null);

      if (activeTab !== "unread") {
        query = query.gte("created_at", ninetyDaysAgo);
      }

      if (activeTab === "unread") {
        query = query.eq("read", false);
      } else if (activeTab === "bookings") {
        query = query.in("type", BOOKING_TYPES);
      } else if (activeTab === "reviews") {
        query = query.in("type", REVIEW_TYPES);
      } else if (activeTab === "system") {
        query = query.in("type", SYSTEM_TYPES);
      }
    }

    const { data } = await query;
    const results = data || [];

    if (pageNum === 0) {
      setNotifications(results);
    } else {
      setNotifications((prev) => [...prev, ...results]);
    }

    setHasMore(results.length === PAGE_SIZE);
    setPage(pageNum);
    setLoading(false);
  };

  const loadMore = () => {
    if (userId) fetchNotifications(userId, page + 1);
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.link) router.push(notif.link);
  };

  const archiveNotification = async (
    e: React.MouseEvent,
    notif: Notification
  ) => {
    e.stopPropagation();
    const now = new Date().toISOString();
    await supabase
      .from("notifications")
      .update({ archived_at: now })
      .eq("id", notif.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  };

  const unarchiveNotification = async (
    e: React.MouseEvent,
    notif: Notification
  ) => {
    e.stopPropagation();
    await supabase
      .from("notifications")
      .update({ archived_at: null })
      .eq("id", notif.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
  };

  const savePreferences = async () => {
    if (!userId) return;
    setSavingPrefs(true);
    await supabase.from("notification_preferences").upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    });
    setSavingPrefs(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group notifications by date
  const grouped: { label: string; items: Notification[] }[] = [];
  let currentGroup = "";
  for (const n of notifications) {
    const g = dateGroup(n.created_at);
    if (g !== currentGroup) {
      currentGroup = g;
      grouped.push({ label: g, items: [n] });
    } else {
      grouped[grouped.length - 1].items.push(n);
    }
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-wider uppercase">
          Notifications
        </h1>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && activeTab !== "archived" && (
            <button
              onClick={markAllRead}
              className="font-mono text-xs text-signal-orange hover:underline"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-aluminum hover:text-house-lights"
            title="Notification preferences"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <circle cx="8" cy="8" r="2.5" />
              <path d="M8,1.5 L8,3 M8,13 L8,14.5 M1.5,8 L3,8 M13,8 L14.5,8 M3.1,3.1 L4.2,4.2 M11.8,11.8 L12.9,12.9 M12.9,3.1 L11.8,4.2 M4.2,11.8 L3.1,12.9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preferences panel */}
      {showPreferences && (
        <div className="mb-6 p-4 bg-deep-stage border border-white/5 rounded-xl">
          <h2 className="font-heading text-sm font-bold tracking-wider uppercase mb-4">
            Email Preferences
          </h2>
          <div className="space-y-3">
            {[
              {
                key: "booking_requests_email" as const,
                label: "Booking Requests",
              },
              {
                key: "booking_updates_email" as const,
                label: "Booking Updates",
              },
              { key: "reviews_email" as const, label: "Reviews" },
              { key: "system_email" as const, label: "System" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="text-sm text-aluminum group-hover:text-house-lights transition-colors">
                  {label}
                </span>
                <button
                  onClick={() =>
                    setPreferences((p) => ({ ...p, [key]: !p[key] }))
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    preferences[key] ? "bg-signal-orange" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences[key] ? "left-5.5" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
          <button
            onClick={savePreferences}
            disabled={savingPrefs}
            className="mt-4 px-4 py-2 bg-signal-orange text-white font-heading text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {savingPrefs ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-white/5 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-mono text-xs tracking-wider uppercase whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-signal-orange text-house-lights"
                : "border-transparent text-aluminum/60 hover:text-aluminum"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="text-center py-16">
          <span className="font-mono text-sm text-aluminum">Loading...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <NotificationIcon type="bell" className="w-8 h-8 text-aluminum/35 mx-auto mb-3" />
          <div className="text-sm text-aluminum/60">
            {activeTab === "unread"
              ? "All caught up"
              : activeTab === "archived"
                ? "No archived notifications"
                : "No notifications"}
          </div>
        </div>
      ) : (
        <div>
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="font-mono text-[10px] text-aluminum/60 tracking-widest uppercase px-1 py-2 mt-2">
                {group.label}
              </div>
              {group.items.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors group flex items-start gap-3 ${
                    !notif.read
                      ? "bg-signal-orange/[0.04] hover:bg-signal-orange/[0.07]"
                      : "hover:bg-ink/[0.03]"
                  }`}
                >
                  <NotificationIcon
                    type={notif.type}
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      !notif.read ? "text-signal-orange" : "text-aluminum/60"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span
                        className={`text-sm font-semibold ${
                          !notif.read
                            ? "text-house-lights"
                            : "text-aluminum/60"
                        }`}
                      >
                        {notif.title}
                      </span>
                      <span className="text-[9px] font-mono text-aluminum/40 flex-shrink-0 ml-2">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    <div className="text-xs text-aluminum/60 truncate">
                      {notif.message}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-signal-orange mt-1.5" />
                    )}
                    {activeTab === "archived" ? (
                      <span
                        onClick={(e) => unarchiveNotification(e, notif)}
                        className="opacity-0 group-hover:opacity-100 text-aluminum/60 hover:text-house-lights transition-all text-xs"
                        title="Unarchive"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <polyline points="5,9 8,6 11,9" />
                          <line x1="8" y1="6" x2="8" y2="13" />
                          <path d="M2,11 L2,13.5 C2,14 2.5,14 2.5,14 L13.5,14 C14,14 14,13.5 14,13.5 L14,11" />
                        </svg>
                      </span>
                    ) : (
                      <span
                        onClick={(e) => archiveNotification(e, notif)}
                        className="opacity-0 group-hover:opacity-100 text-aluminum/60 hover:text-house-lights transition-all text-xs"
                        title="Archive"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <rect x="2" y="2" width="12" height="4" rx="0.5" />
                          <path d="M3,6 L3,13 C3,13.5 3.5,14 4,14 L12,14 C12.5,14 13,13.5 13,13 L13,6" />
                          <line x1="6.5" y1="9" x2="9.5" y2="9" />
                        </svg>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}

          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                className="font-mono text-xs text-signal-orange hover:underline"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
