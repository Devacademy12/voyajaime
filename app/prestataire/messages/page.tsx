"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  MessageCircle,
  Search,
  Inbox,
  Mountain,
  Loader2,
  Send,
  CheckCheck,
  Check,
  Hand,
  ArrowLeft,
} from "lucide-react";
import "@/public/style/PrestataireMessagesPage.css";

type Conversation = {
  id: string;
  prestataire_id: string;
  touriste_id: string;
  excursion_id: string | null;
  touriste_name: string | null;
  prestataire_name: string | null;
  created_at: string;
  touriste: { full_name: string; avatar_url: string | null } | null;
  excursion: { title: string } | null;
  last_message?: { contenu: string; created_at: string; lu: boolean; expediteur_id: string };
  unread_count?: number;
};

type Message = {
  id: string;
  conversation_id: string;
  expediteur_id: string;
  contenu: string;
  created_at: string;
  lu: boolean;
};

export default function PrestataireMessagesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId,        setUserId]        = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv,    setActiveConv]    = useState<Conversation | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [newMsg,        setNewMsg]        = useState("");
  const [sending,       setSending]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      await loadConversations(user.id);
      setLoading(false);

      const channel = supabase
        .channel("prestataire-msg-" + user.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const msg = payload.new as Message;
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            loadConversations(user.id);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    });
  }, [supabase]);

  const loadConversations = async (uid: string) => {
    const { data: convData } = await supabase
      .from("conversations")
      .select("*, messages(id, contenu, created_at, lu, expediteur_id)")
      .eq("prestataire_id", uid)
      .order("created_at", { ascending: false });
    if (!convData) return;

    const touristeIds = [...new Set(convData.map((c: Record<string, unknown>) => c.touriste_id as string))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", touristeIds);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));

    const excIds = [...new Set(convData.map((c: Record<string, unknown>) => c.excursion_id as string).filter(Boolean))];
    const excMap: Record<string, { title: string }> = {};
    if (excIds.length > 0) {
      const { data: excs } = await supabase.from("excursions").select("id, title").in("id", excIds);
      (excs || []).forEach(e => { excMap[e.id] = { title: e.title }; });
    }

    const convs = convData.map((c: Record<string, unknown>) => {
      const msgs   = (c.messages as Message[]) || [];
      const sorted = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = msgs.filter(m => !m.lu && m.expediteur_id !== uid).length;
      const profile = profileMap[c.touriste_id as string];
      const displayName = (c.touriste_name as string) || profile?.full_name || "Touriste";
      return {
        ...(c as Conversation),
        touriste:  { full_name: displayName, avatar_url: profile?.avatar_url || null },
        excursion: c.excursion_id ? (excMap[c.excursion_id as string] || null) : null,
        last_message: sorted[0],
        unread_count: unread,
      };
    });
    setConversations(convs);
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase.from("messages").update({ lu: true }).eq("conversation_id", conv.id).eq("lu", false).neq("expediteur_id", userId);
    await loadConversations(userId);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleBack = () => {
    setActiveConv(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv || sending) return;
    setSending(true);
    const { data } = await supabase.from("messages").insert({
      conversation_id: activeConv.id, expediteur_id: userId, contenu: newMsg.trim(), lu: false,
    }).select().single();
    if (data) {
      setMessages(prev => [...prev, data]);
      setNewMsg("");
      await loadConversations(userId);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setSending(false);
  };

  const fmt = (iso: string) => {
    const d = new Date(iso), now = new Date(), diff = now.getTime() - d.getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const filtered = conversations.filter(c =>
    (c.touriste?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.excursion?.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const convOpen = !!activeConv;

  if (loading) return (
    <div className="page-loader">
      <Loader2 size={28} className="spin" style={{ color: "#2B96A8" }} />
    </div>
  );

  return (
    <div className="messages-page-wrapper">
      <div className="messages-page">

        {/* ── Sidebar ── */}
        <div className={`sidebar${convOpen ? " hidden-mobile" : ""}`}>
          <div className="sidebar-header">
            <div className="sidebar-title-row">
              <MessageCircle size={18} style={{ color: "#2B96A8" }} />
              <h2 className="sidebar-title">Messages</h2>
              {totalUnread > 0 && (
                <span className="unread-badge">{totalUnread}</span>
              )}
            </div>
            <p className="sidebar-subtitle">Conversations avec vos touristes</p>
            <div className="search-wrapper">
              <Search size={13} className="search-icon" style={{ color: "#9CA3AF" }} />
              <input
                className="search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un touriste..."
              />
            </div>
          </div>

          <div className="conv-list">
            {filtered.length === 0 ? (
              <div className="conv-empty">
                <div className="conv-empty-icon">
                  <Inbox size={44} />
                </div>
                <p className="conv-empty-title">Aucun message</p>
                <p className="conv-empty-sub">Les touristes vous contacteront depuis vos excursions</p>
              </div>
            ) : filtered.map(conv => {
              const isActive = activeConv?.id === conv.id;
              const name     = conv.touriste?.full_name || "Touriste";
              const unread   = conv.unread_count || 0;
              return (
                <div
                  key={conv.id}
                  className={`conv-row${isActive ? " active" : ""}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="avatar">
                    {conv.touriste?.avatar_url
                      ? <img src={conv.touriste.avatar_url} alt="" />
                      : name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="conv-meta">
                    <div className="conv-top">
                      <span className={`conv-name ${unread > 0 ? "unread" : "read"}`}>{name}</span>
                      {conv.last_message && (
                        <span className="conv-time">{fmt(conv.last_message.created_at)}</span>
                      )}
                    </div>
                    {conv.excursion && (
                      <p className="conv-excursion">
                        <Mountain size={10} /> {conv.excursion.title}
                      </p>
                    )}
                    <div className="conv-bottom">
                      <p className={`conv-preview ${unread > 0 ? "unread" : "read"}`}>
                        {conv.last_message?.contenu || "Nouvelle conversation..."}
                      </p>
                      {unread > 0 && (
                        <span className="conv-unread-dot">{unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zone chat ── */}
        {activeConv ? (
          <div className={`chat-zone${convOpen ? " visible-mobile" : ""}`}>

            {/* Header chat */}
            <div className="chat-header">
              <button
                className="chat-back-btn"
                onClick={handleBack}
                aria-label="Retour aux conversations"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="chat-avatar">
                {activeConv.touriste?.avatar_url
                  ? <img src={activeConv.touriste.avatar_url} alt="" />
                  : (activeConv.touriste?.full_name || "T").charAt(0).toUpperCase()
                }
              </div>
              <div className="chat-header-info">
                <p className="chat-header-name">
                  {activeConv.touriste?.full_name || "Touriste"}
                </p>
                {activeConv.excursion && (
                  <p className="chat-header-excursion">
                    <Mountain size={11} /> {activeConv.excursion.title}
                  </p>
                )}
              </div>
              <div className="online-dot" />
            </div>

            {/* Messages */}
            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="messages-empty">
                  <div className="messages-empty-icon">
                    <Hand size={32} style={{ color: "#2B96A8" }} />
                  </div>
                  <p className="messages-empty-title">Nouveau message</p>
                  <p className="messages-empty-sub">Répondez au touriste pour démarrer la conversation</p>
                </div>
              ) : messages.map((msg, idx) => {
                const isMine = msg.expediteur_id === userId;
                const prev   = messages[idx - 1];
                const showTs = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 300000;
                return (
                  <div key={msg.id}>
                    {showTs && (
                      <div className="timestamp-divider">
                        <span className="timestamp-pill">{fmt(msg.created_at)}</span>
                      </div>
                    )}
                    <div className={`bubble-row ${isMine ? "mine" : "other"}`}>
                      <div className={`bubble ${isMine ? "mine" : "other"}`}>
                        <p>{msg.contenu}</p>
                        <div className="bubble-meta">
                          <span className="bubble-time">{fmt(msg.created_at)}</span>
                          {isMine && (
                            msg.lu
                              ? <CheckCheck size={12} />
                              : <Check size={12} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="input-area">
              <input
                ref={inputRef}
                className="msg-input"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Répondre au touriste..."
              />
              <button
                className={`send-btn ${newMsg.trim() ? "active" : "inactive"}`}
                onClick={sendMessage}
                disabled={!newMsg.trim() || sending}
              >
                {sending
                  ? <Loader2 size={18} color="white" className="spin" />
                  : <Send size={17} color={newMsg.trim() ? "white" : "#9CA3AF"} />
                }
              </button>
            </div>
          </div>

        ) : (
          /* Empty state — caché sur mobile */
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <MessageCircle size={36} style={{ color: "#7C3AED" }} />
            </div>
            <div className="chat-empty-text">
              <p className="chat-empty-title">Messagerie</p>
              <p className="chat-empty-sub">Sélectionnez une conversation pour répondre à vos touristes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}