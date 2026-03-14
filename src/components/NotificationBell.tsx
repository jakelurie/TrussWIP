"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NotificationIcon from "@/lib/notification-icons";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClick = (notif: Notification) => {
    if (!notif.read) {
      supabase.from("notifications").update({ read: true }).eq("id", notif.id).then();
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.link) window.location.href = notif.link;
    setOpen(false);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-aluminum hover:text-house-lights">
        <NotificationIcon type="bell" className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-signal-orange text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-deep-stage border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
              <span className="font-heading text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-mono text-signal-orange hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <NotificationIcon type="bell" className="w-5 h-5 text-aluminum/35 mx-auto mb-2" />
                  <div className="text-xs text-aluminum/50">No notifications yet</div>
                </div>
              ) : (
                notifications.map(notif => (
                  <button key={notif.id} onClick={() => handleClick(notif)}
                    className={`w-full text-left px-4 py-3 hover:bg-ink/[0.03] transition-colors border-b border-ink/[0.02] ${
                      !notif.read ? "bg-signal-orange/[0.03]" : ""
                    }`}>
                    <div className="flex gap-2.5">
                      <NotificationIcon
                        type={notif.type}
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${!notif.read ? "text-signal-orange" : "text-aluminum/60"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-xs font-semibold ${!notif.read ? "text-house-lights" : "text-aluminum/60"}`}>
                            {notif.title}
                          </span>
                          <span className="text-[9px] font-mono text-aluminum/40 flex-shrink-0 ml-2">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        <div className="text-[11px] text-aluminum/60 truncate">{notif.message}</div>
                      </div>
                      {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-signal-orange flex-shrink-0 mt-1.5" />}
                    </div>
                  </button>
                ))
              )}
            </div>

            <a
              href="/notifications"
              className="block text-center px-4 py-2.5 border-t border-white/5 font-mono text-[11px] text-signal-orange hover:bg-ink/[0.02] transition-colors"
            >
              See all
            </a>
          </div>
        </>
      )}
    </div>
  );
}
