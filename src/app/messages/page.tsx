"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

const CONVO_PAGE_SIZE = 15;
const MSG_PAGE_SIZE = 50;

export default function MessagesPage() {
  return (
    <Suspense>
      <Messages />
    </Suspense>
  );
}

function Messages() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [convoPage, setConvoPage] = useState(0);
  const [hasMoreConvos, setHasMoreConvos] = useState(false);
  const [loadingMoreConvos, setLoadingMoreConvos] = useState(false);
  const [hasEarlierMessages, setHasEarlierMessages] = useState(false);
  const [loadingEarlierMessages, setLoadingEarlierMessages] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const msgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedConvo) loadMessages(selectedConvo.id);
  }, [selectedConvo?.id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Real-time subscription for selected conversation messages
  useEffect(() => {
    if (!selectedConvo) return;

    const channel = supabase
      .channel(`messages-${selectedConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selectedConvo.id}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo?.id]);

  // Real-time subscription for sidebar updates (new messages across all convos)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-convos-${userId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
      }, (payload) => {
        setAllConversations(prev =>
          prev.map(c => c.id === payload.new.id
            ? { ...c, last_message: payload.new.last_message, last_message_time: payload.new.last_message_time }
            : c
          ).sort((a, b) => new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime())
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUserId(session.user.id);

    // Update last_seen
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", session.user.id);

    await fetchConversations(session.user.id, 0);
    setLoading(false);
  };

  const fetchConversations = async (uid: string, pageNum: number) => {
    if (pageNum > 0) setLoadingMoreConvos(true);

    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", uid);

    if (!participations || participations.length === 0) {
      if (pageNum > 0) setLoadingMoreConvos(false);
      return;
    }

    const convoIds = participations.map(p => p.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convoIds)
      .order("last_message_time", { ascending: false })
      .range(pageNum * CONVO_PAGE_SIZE, (pageNum + 1) * CONVO_PAGE_SIZE - 1);

    const enriched = await Promise.all((convos || []).map(async (convo) => {
      // Filter out soft-deleted conversations
      if (convo.deleted_by && convo.deleted_by.includes(uid)) return null;

      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", convo.id);

      const otherUserId = parts?.find(p => p.user_id !== uid)?.user_id;

      let otherUser = null;
      if (otherUserId) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, user_type, company, city, last_seen")
          .eq("id", otherUserId)
          .single();
        otherUser = data;
      }

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", convo.id)
        .neq("sender_id", uid)
        .eq("read", false);

      return { ...convo, otherUser, otherUserId, unread: count || 0 };
    }));

    const filtered = enriched.filter(Boolean);

    if (pageNum === 0) {
      setAllConversations(filtered);
      // Auto-select from ?with= param
      if (withUserId) {
        const match = filtered.find(c => c.otherUserId === withUserId);
        if (match) setSelectedConvo(match);
      }
    } else {
      setAllConversations(prev => [...prev, ...filtered]);
    }

    setHasMoreConvos((convos || []).length === CONVO_PAGE_SIZE);
    setConvoPage(pageNum);
    setLoadingMoreConvos(false);
  };

  const loadMoreConvos = () => {
    if (userId) fetchConversations(userId, convoPage + 1);
  };

  const loadMessages = async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: false })
      .limit(MSG_PAGE_SIZE);

    const reversed = (data || []).reverse();
    setMessages(reversed);
    setHasEarlierMessages((data || []).length === MSG_PAGE_SIZE);

    // Mark messages as read
    if (userId) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", convoId)
        .neq("sender_id", userId)
        .eq("read", false);

      // Clear unread count in sidebar
      setAllConversations(prev =>
        prev.map(c => c.id === convoId ? { ...c, unread: 0 } : c)
      );
    }
  };

  const loadEarlierMessages = async () => {
    if (!selectedConvo || messages.length === 0) return;
    setLoadingEarlierMessages(true);

    const earliest = messages[0].created_at;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedConvo.id)
      .lt("created_at", earliest)
      .order("created_at", { ascending: false })
      .limit(MSG_PAGE_SIZE);

    const reversed = (data || []).reverse();

    // Preserve scroll position
    const container = msgContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    setMessages(prev => [...reversed, ...prev]);
    setHasEarlierMessages((data || []).length === MSG_PAGE_SIZE);
    setLoadingEarlierMessages(false);

    // Restore scroll position after new messages render
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedConvo || !userId) return;
    setSending(true);

    const text = newMsg.trim();
    setNewMsg("");

    await supabase.from("messages").insert({
      conversation_id: selectedConvo.id,
      sender_id: userId,
      text,
      read: false,
    });

    await supabase.from("conversations").update({
      last_message: text,
      last_message_time: new Date().toISOString(),
    }).eq("id", selectedConvo.id);

    // Update last_seen
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);

    loadMessages(selectedConvo.id);
    setSending(false);
  };

  const softDeleteConvo = async (e: React.MouseEvent, convo: any) => {
    e.stopPropagation();
    if (!userId) return;

    const currentDeletedBy = convo.deleted_by || [];
    await supabase
      .from("conversations")
      .update({ deleted_by: [...currentDeletedBy, userId] })
      .eq("id", convo.id);

    setAllConversations(prev => prev.filter(c => c.id !== convo.id));
    if (selectedConvo?.id === convo.id) setSelectedConvo(null);
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

  const formatTime = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diff < 604800000) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const lastSeenLabel = useCallback((lastSeen: string | null) => {
    if (!lastSeen) return null;
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 5 * 60 * 1000) return "Online";
    if (diff < 60 * 60 * 1000) return `Active ${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `Active ${Math.floor(diff / 3600000)}h ago`;
    return `Active ${Math.floor(diff / 86400000)}d ago`;
  }, []);

  // Client-side search filter
  const filteredConversations = search.trim()
    ? allConversations.filter(c => {
        const q = search.toLowerCase();
        const name = (c.otherUser?.display_name || "").toLowerCase();
        const msg = (c.last_message || "").toLowerCase();
        return name.includes(q) || msg.includes(q);
      })
    : allConversations;

  const handleSelectConvo = (convo: any) => {
    setSelectedConvo(convo);
  };

  const handleBack = () => {
    setSelectedConvo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-aluminum">Loading messages...</span>
      </div>
    );
  }

  return (
    <main className="flex" style={{ height: "calc(100vh - 49px)" }}>
      {/* Conversation list — hidden on mobile when a convo is selected */}
      <div className={`${
        selectedConvo ? "hidden md:flex" : "flex"
      } w-full md:w-[320px] border-r border-white/5 flex-col flex-shrink-0`}>
        <div className="p-4 border-b border-white/5">
          <h1 className="font-heading text-lg font-bold tracking-wider uppercase mb-3">
            Messages
          </h1>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-aluminum/60">
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-deep-stage border border-white/5 rounded-lg text-house-lights text-xs outline-none focus:border-signal-orange/20 transition-colors placeholder:text-aluminum/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-sm text-aluminum">
                {search ? "No matches" : "No conversations yet"}
              </div>
              {!search && (
                <div className="text-xs text-aluminum/65 mt-1">Conversations are created when bookings are made</div>
              )}
            </div>
          ) : (
            <>
              {filteredConversations.map(convo => {
                const name = convo.otherUser?.display_name || "Unknown";
                const hue = getHue(name);
                const selected = selectedConvo?.id === convo.id;

                return (
                  <div
                    key={convo.id}
                    onClick={() => handleSelectConvo(convo)}
                    className={`px-4 py-3 cursor-pointer border-b border-white/3 flex items-center gap-3 transition-colors group relative ${
                      selected ? "bg-signal-orange/5" : "hover:bg-ink/[0.02]"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-heading text-xs font-bold flex-shrink-0"
                      style={{ background: `hsl(${hue}, 40%, 25%)` }}
                    >
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm font-semibold truncate">{name}</span>
                        <span className="font-mono text-[9px] text-aluminum/65 flex-shrink-0 ml-2">
                          {formatTime(convo.last_message_time)}
                        </span>
                      </div>
                      <div className="text-xs text-aluminum truncate">{convo.last_message || "No messages yet"}</div>
                    </div>
                    {convo.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-signal-orange flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                        {convo.unread}
                      </span>
                    )}
                    <button
                      onClick={(e) => softDeleteConvo(e, convo)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 text-aluminum/60 hover:text-red-400 transition-all"
                      title="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <polyline points="3,4 4,14 12,14 13,4" />
                        <line x1="2" y1="4" x2="14" y2="4" />
                        <polyline points="6,4 6,2 10,2 10,4" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              {hasMoreConvos && !search && (
                <div className="text-center py-3">
                  <button
                    onClick={loadMoreConvos}
                    disabled={loadingMoreConvos}
                    className="font-mono text-xs text-signal-orange hover:underline disabled:opacity-50"
                  >
                    {loadingMoreConvos ? "Loading..." : "Load more conversations"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat area — full width on mobile when convo selected */}
      {selectedConvo ? (
        <div className={`${
          selectedConvo ? "flex" : "hidden md:flex"
        } flex-1 flex-col`}>
          {/* Chat header */}
          <div className="px-4 md:px-5 py-3 border-b border-white/5 flex items-center gap-3">
            {/* Back button — mobile only */}
            <button
              onClick={handleBack}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-aluminum"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="10,3 5,8 10,13" />
              </svg>
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-heading text-[10px] font-bold"
              style={{ background: `hsl(${getHue(selectedConvo.otherUser?.display_name || "")}, 40%, 25%)` }}
            >
              {getInitials(selectedConvo.otherUser?.display_name || "")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{selectedConvo.otherUser?.display_name}</div>
              <div className="text-[10px] text-aluminum flex items-center gap-1.5">
                <span>
                  {selectedConvo.otherUser?.user_type === "producer" ? "Event Producer" : "Technician"}
                  {selectedConvo.otherUser?.company && ` · ${selectedConvo.otherUser.company}`}
                </span>
                {(() => {
                  const status = lastSeenLabel(selectedConvo.otherUser?.last_seen);
                  if (!status) return null;
                  return (
                    <>
                      <span className="text-aluminum/50">|</span>
                      <span className={status === "Online" ? "text-go-green" : "text-aluminum/65"}>
                        {status}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={(e) => softDeleteConvo(e, selectedConvo)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-aluminum/60 hover:text-red-400 transition-colors"
              title="Delete conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="3,4 4,14 12,14 13,4" />
                <line x1="2" y1="4" x2="14" y2="4" />
                <polyline points="6,4 6,2 10,2 10,4" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={msgContainerRef} className="flex-1 overflow-auto px-4 md:px-5 py-4 space-y-2">
            {hasEarlierMessages && (
              <div className="text-center py-2">
                <button
                  onClick={loadEarlierMessages}
                  disabled={loadingEarlierMessages}
                  className="font-mono text-xs text-signal-orange hover:underline disabled:opacity-50"
                >
                  {loadingEarlierMessages ? "Loading..." : "Load earlier messages"}
                </button>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === userId;
              return (
                <div key={msg.id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] md:max-w-[70%] px-4 py-2.5 ${
                      isMe
                        ? "bg-signal-orange/12 border border-signal-orange/15 rounded-xl rounded-br-sm"
                        : "bg-deep-stage border border-white/5 rounded-xl rounded-bl-sm"
                    }`}
                  >
                    <div className={`text-sm leading-relaxed ${isMe ? "text-house-lights" : "text-aluminum/90"}`}>
                      {msg.text}
                    </div>
                    <div className={`font-mono text-[9px] mt-1 ${isMe ? "text-right text-aluminum/60" : "text-aluminum/50"}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="text-sm text-aluminum">Start the conversation</div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 md:px-5 py-3 border-t border-white/5 flex gap-3">
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-deep-stage border border-signal-orange/10 rounded-lg text-house-lights text-sm outline-none focus:border-signal-orange/30 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!newMsg.trim() || sending}
              className="px-5 py-2.5 bg-signal-orange text-white font-heading text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-aluminum">Select a conversation</div>
          </div>
        </div>
      )}
    </main>
  );
}
