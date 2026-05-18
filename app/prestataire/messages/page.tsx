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

const CSS = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes popIn { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:scale(1) } }

  .conv-row { transition:background .15s; cursor:pointer; border-left:3px solid transparent; }
  .conv-row:hover { background:#F9FAFB; }
  .conv-row.active { background:#EFF9FB !important; border-left-color:#2B96A8; }
  .send-btn:hover:not(:disabled) { background:#1e7a8a !important; transform:translateY(-1px); }
  .msg-input:focus { border-color:#2B96A8 !important; box-shadow:0 0 0 3px rgba(43,150,168,.12) !important; }
  .bubble { animation:popIn .18s ease; }

  /* ── Desktop ── */
  .msg-container {
    height: calc(100vh - 64px - 32px);
    display: flex;
    background: white;
    border-radius: 20px;
    border: 1px solid #E5E7EB;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,.06);
    margin: 16px 16px 0;
  }
  .msg-sidebar {
    width: 300px;
    flex-shrink: 0;
    border-right: 1px solid #E5E7EB;
    display: flex;
    flex-direction: column;
    background: #FAFAFA;
  }
  .msg-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .msg-back-btn { display: none; }

  /* ── Tablet ── */
  @media (max-width: 900px) {
    .msg-container { margin: 8px 8px 0; border-radius: 16px; }
    .msg-sidebar { width: 260px; }
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .msg-container {
      flex-direction: column;
      height: calc(100vh - 60px);
      margin: 0;
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-top: none;
    }

    /* Sidebar plein écran par défaut, cachée quand conv ouverte */
    .msg-sidebar {
      width: 100%;
      height: 100%;
      border-right: none;
      border-bottom: none;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 10;
      border-radius: 0;
    }
    .msg-sidebar.conv-open {
      display: none;
    }

    /* Chat plein écran, caché par défaut */
    .msg-chat {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 10;
      display: none;
    }
    .msg-chat.conv-open {
      display: flex;
    }

    /* Bouton retour visible sur mobile */
    .msg-back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      cursor: pointer;
      color: #2B96A8;
      font-weight: 700;
      font-size: 13px;
      font-family: inherit;
      padding: 0;
      flex-shrink: 0;
    }

    /* Chat header adapté mobile */
    .chat-header {
      padding: 10px 14px !important;
      gap: 10px !important;
    }

    /* Bulles messages padding réduit */
    .msg-bubbles-area {
      padding: 12px 14px !important;
    }

    /* Max width bulles plus large sur mobile */
    .bubble-inner {
      max-width: 82% !important;
    }

    /* Input zone */
    .msg-input-area {
      padding: 8px 12px !important;
      gap: 8px !important;
    }
    .msg-input {
      font-size: 16px !important; /* prevent iOS zoom */
      padding: 10px 14px !important;
    }
    .send-btn {
      width: 40px !important;
      height: 40px !important;
    }
  }
`;

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

  const closeConversation = () => {
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

  // On mobile: conv is "open" when activeConv is set
  const convOpen = !!activeConv;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, gap: 12 }}>
      <style>{CSS}</style>
      <Loader2 size={28} style={{ color: "#2B96A8", animation: "spin .7s linear infinite" }} />
    </div>
  );

  return (
    <div className="msg-container">
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <div className={`msg-sidebar${convOpen ? " conv-open" : ""}`}>
        <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB", background: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MessageCircle size={18} style={{ color: "#2B96A8" }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Messages</h2>
            {totalUnread > 0 && (
              <span style={{ background: "#2B96A8", color: "white", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
                {totalUnread}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10 }}>Conversations avec vos touristes</p>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un touriste..."
              style={{ width: "100%", padding: "8px 12px 8px 30px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#111827", background: "#F9FAFB", boxSizing: "border-box" }}
              onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
              onBlur={e => e.currentTarget.style.borderColor = "#E5E7EB"}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Inbox size={44} style={{ color: "#E5E7EB", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Aucun message</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>Les touristes vous contacteront depuis vos excursions</p>
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
                style={{ padding: "13px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#7C3AED,#5B21B6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, border: `2px solid ${isActive ? "#7C3AED" : "transparent"}` }}>
                  {conv.touriste?.avatar_url
                    ? <img src={conv.touriste.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    : name.charAt(0).toUpperCase()
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                    {conv.last_message && <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0, marginLeft: 4 }}>{fmt(conv.last_message.created_at)}</span>}
                  </div>
                  {conv.excursion && (
                    <p style={{ fontSize: 11, color: "#2B96A8", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                      <Mountain size={10} /> {conv.excursion.title}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 12, color: unread > 0 ? "#374151" : "#9CA3AF", fontWeight: unread > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                      {conv.last_message?.contenu || "Nouvelle conversation..."}
                    </p>
                    {unread > 0 && (
                      <span style={{ background: "#2B96A8", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4 }}>
                        {unread}
                      </span>
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
        <div className={`msg-chat${convOpen ? " conv-open" : ""}`}>
          {/* Chat header */}
          <div
            className="chat-header"
            style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 12, background: "white" }}
          >
            {/* Bouton retour mobile */}
            <button className="msg-back-btn" onClick={closeConversation}>
              <ArrowLeft size={18} />
              <span>Retour</span>
            </button>

            <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#7C3AED,#5B21B6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {activeConv.touriste?.avatar_url
                ? <img src={activeConv.touriste.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                : (activeConv.touriste?.full_name || "T").charAt(0).toUpperCase()
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeConv.touriste?.full_name || "Touriste"}
              </p>
              {activeConv.excursion && (
                <p style={{ fontSize: 12, color: "#2B96A8", display: "flex", alignItems: "center", gap: 4, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Mountain size={11} /> {activeConv.excursion.title}
                </p>
              )}
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
          </div>

          {/* Messages */}
          <div
            className="msg-bubbles-area"
            style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, background: "#F8FAFB" }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(43,150,168,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Hand size={32} style={{ color: "#2B96A8" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Nouveau message</p>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>Répondez au touriste pour démarrer la conversation</p>
              </div>
            ) : messages.map((msg, idx) => {
              const isMine = msg.expediteur_id === userId;
              const prev   = messages[idx - 1];
              const showTs = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 300000;
              return (
                <div key={msg.id}>
                  {showTs && (
                    <div style={{ textAlign: "center", margin: "8px 0" }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF", background: "#E9EDF0", padding: "3px 10px", borderRadius: 20 }}>{fmt(msg.created_at)}</span>
                    </div>
                  )}
                  <div className="bubble" style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                    <div
                      className="bubble-inner"
                      style={{ maxWidth: "68%", padding: "10px 14px", borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMine ? "#2B96A8" : "white", color: isMine ? "white" : "#111827", fontSize: 14, lineHeight: 1.55, boxShadow: isMine ? "0 2px 12px rgba(43,150,168,.3)" : "0 1px 4px rgba(0,0,0,.06)", border: isMine ? "none" : "1px solid #E5E7EB" }}
                    >
                      <p style={{ wordBreak: "break-word", margin: 0 }}>{msg.contenu}</p>
                      <p style={{ fontSize: 10, marginTop: 3, opacity: .7, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, margin: 0 }}>
                        {fmt(msg.created_at)}
                        {isMine && (msg.lu ? <CheckCheck size={12} /> : <Check size={12} />)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="msg-input-area"
            style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 10, alignItems: "center", background: "white" }}
          >
            <input
              ref={inputRef}
              className="msg-input"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Répondre au touriste..."
              style={{ flex: 1, padding: "11px 16px", border: "1.5px solid #E5E7EB", borderRadius: 30, fontSize: 14, fontFamily: "inherit", outline: "none", color: "#111827", transition: "all .2s", background: "#F9FAFB" }}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!newMsg.trim() || sending}
              style={{ width: 44, height: 44, borderRadius: "50%", background: newMsg.trim() ? "#2B96A8" : "#E5E7EB", border: "none", cursor: newMsg.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s", boxShadow: newMsg.trim() ? "0 4px 12px rgba(43,150,168,.4)" : "none" }}
            >
              {sending
                ? <Loader2 size={18} color="white" style={{ animation: "spin .65s linear infinite" }} />
                : <Send size={17} color={newMsg.trim() ? "white" : "#9CA3AF"} />
              }
            </button>
          </div>
        </div>
      ) : (
        /* Empty state — hidden on mobile (sidebar takes full screen) */
        <div className="msg-chat" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, background: "#F8FAFB" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#F3E8FF,#E9D5FF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={36} style={{ color: "#7C3AED" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Messagerie</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 280, lineHeight: 1.6 }}>Sélectionnez une conversation pour répondre à vos touristes</p>
          </div>
        </div>
      )}
    </div>
  );
}