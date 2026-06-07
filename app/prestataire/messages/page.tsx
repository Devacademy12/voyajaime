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
  const [profile,       setProfile]       = useState<{agency_name:string, full_name:string} | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const name = profile?.agency_name || profile?.full_name || "Prestataire";

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data: prof } = await supabase.from("profiles").select("agency_name, full_name").eq("user_id", user.id).single();
      setProfile(prof);
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
    const touristeIds = [...new Set(convData.map((c: any) => c.touriste_id as string))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", touristeIds);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
    const excIds = [...new Set(convData.map((c: any) => c.excursion_id as string).filter(Boolean))];
    const excMap: Record<string, { title: string }> = {};
    if (excIds.length > 0) {
      const { data: excs } = await supabase.from("excursions").select("id, title").in("id", excIds);
      (excs || []).forEach((e: any) => { excMap[e.id] = { title: e.title }; });
    }
    const convs = convData.map((c: any) => {
      const msgs   = (c.messages as Message[]) || [];
      const sorted = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = msgs.filter(m => !m.lu && m.expediteur_id !== uid).length;
      const prof   = profileMap[c.touriste_id as string];
      const displayName = (c.touriste_name as string) || prof?.full_name || "Touriste";
      return {
        ...c,
        touriste:  { full_name: displayName, avatar_url: prof?.avatar_url || null },
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

  const handleBack = () => { setActiveConv(null); setMessages([]); };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv || sending) return;
    setSending(true);
    const { data } = await supabase.from("messages").insert({
      conversation_id: activeConv.id, expediteur_id: userId, contenu: newMsg.trim(), lu: false,
    }).select().single();
    if (data) {
      setMessages(prev => [...prev, data]);
      setNewMsg("");
      void fetch("/api/notifications/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id, messageId: data.id }),
      });
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

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#F5F7FA" }}>
      <Loader2 size={32} style={{ color:"#2B96A8", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }

        /* ── ROOT PAGE WRAPPER ── */
        .pm-root {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #F5F7FA;
          /* Use full viewport minus whatever the dashboard sidebar/nav takes */
          width: 100%;
          display: flex;
          flex-direction: column;
          padding: 24px 28px 28px;
          gap: 18px;
          /* Height: fill available space. 
             If your dashboard wrapper already handles height, change this to 'auto' */
          min-height: 100vh;
        }

        /* ── Page title row ── */
        .pm-page-header {
          flex-shrink: 0;
          animation: fadeUp .3s ease both;
        }
        .pm-page-title {
          font-size: clamp(20px, 3vw, 26px);
          font-weight: 800;
          color: #053366;
          letter-spacing: -.02em;
        }
        .pm-page-sub {
          font-size: 13px;
          color: #94A3B8;
          margin-top: 4px;
          font-weight: 500;
        }

        /* ── SHELL: sidebar + chat, side by side ── */
        .pm-shell {
          flex: 1;
          display: flex;
          /* CRITICAL: this must be a fixed height so children can scroll */
          height: calc(100vh - 140px);
          min-height: 400px;
          background: #fff;
          border-radius: 20px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 4px 24px rgba(0,0,0,.04);
          overflow: hidden;
          animation: fadeUp .4s ease both;
        }

        /* ══════════════ SIDEBAR ══════════════ */
        .pm-sidebar {
          width: 300px;
          min-width: 300px;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          border-right: 1.5px solid #F1F5F9;
          overflow: hidden; /* children will scroll, not this */
        }

        .pm-sidebar-head {
          flex-shrink: 0;
          padding: 16px 18px 13px;
          border-bottom: 1.5px solid #F1F5F9;
        }
        .pm-sidebar-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 11px;
        }
        .pm-sidebar-title {
          font-size: 14px;
          font-weight: 700;
          color: #053366;
          flex: 1;
        }
        .pm-unread-badge {
          background: #053366;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 20px;
          padding: 2px 8px;
        }

        .pm-search-wrap { position: relative; }
        .pm-search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #9CA3AF;
          pointer-events: none;
        }
        .pm-search-input {
          width: 100%;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          padding: 8px 12px 8px 34px;
          font-size: 12.5px;
          font-family: inherit;
          color: #053366;
          outline: none;
          transition: border-color .2s;
        }
        .pm-search-input:focus { border-color: #2B96A8; }
        .pm-search-input::placeholder { color: #B0BAC9; }

        /* Scrollable conversation list */
        .pm-conv-list {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .pm-conv-list::-webkit-scrollbar { width: 3px; }
        .pm-conv-list::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }

        .pm-conv-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          text-align: center;
          gap: 10px;
        }
        .pm-conv-empty-icon {
          width: 56px; height: 56px;
          background: #EFF9FB;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #2B96A8;
          margin-bottom: 4px;
        }
        .pm-conv-empty-title { font-size: 13px; font-weight: 700; color: #053366; }
        .pm-conv-empty-sub   { font-size: 12px; color: #94A3B8; line-height: 1.5; }

        .pm-conv-row {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 13px 16px;
          border-bottom: 1px solid #F8FAFC;
          cursor: pointer;
          transition: background .15s;
        }
        .pm-conv-row:hover { background: #F8FAFC; }
        .pm-conv-row.active {
          background: #EFF9FB;
          border-left: 3px solid #053366;
          padding-left: 13px;
        }

        .pm-avatar {
          width: 40px; height: 40px; min-width: 40px;
          border-radius: 11px;
          background: linear-gradient(135deg, #2B96A8, #053366);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #fff;
          overflow: hidden;
        }
        .pm-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .pm-conv-meta { flex: 1; min-width: 0; }
        .pm-conv-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 2px;
        }
        .pm-conv-name { font-size: 12.5px; font-weight: 700; color: #053366; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pm-conv-name.read { color: #64748B; font-weight: 600; }
        .pm-conv-time { font-size: 10.5px; color: #B0BAC9; flex-shrink: 0; margin-left: 6px; }
        .pm-conv-excursion {
          display: flex; align-items: center; gap: 3px;
          font-size: 10.5px; color: #2B96A8; font-weight: 600;
          margin-bottom: 3px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pm-conv-bottom { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
        .pm-conv-preview {
          font-size: 11.5px; color: #94A3B8;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
        }
        .pm-conv-preview.unread { color: #475569; font-weight: 600; }
        .pm-conv-dot {
          background: #2B96A8; color: #fff;
          font-size: 10px; font-weight: 700;
          border-radius: 20px; padding: 1px 6px;
          flex-shrink: 0;
        }

        /* ══════════════ CHAT PANEL ══════════════ */
        .pm-chat {
          /* Takes all remaining width */
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Chat header */
        .pm-chat-head {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
          height: 65px;
          border-bottom: 1.5px solid #F1F5F9;
          background: #fff;
        }
        /* Back button — hidden on desktop, shown on mobile */
        .pm-back-btn {
          display: none;
          align-items: center; justify-content: center;
          width: 34px; height: 34px;
          background: #F1F5F9;
          border: none; border-radius: 9px;
          cursor: pointer; color: #053366;
          transition: background .15s;
          flex-shrink: 0;
        }
        .pm-back-btn:hover { background: #E2E8F0; }

        .pm-chat-avatar {
          width: 38px; height: 38px; min-width: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2B96A8, #053366);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          overflow: hidden;
        }
        .pm-chat-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .pm-chat-head-info { flex: 1; min-width: 0; }
        .pm-chat-head-name {
          font-size: 13.5px; font-weight: 700; color: #053366;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pm-chat-head-exc {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: #2B96A8; font-weight: 600;
          margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pm-online-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22C55E;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px #fff;
        }

        /* Scrollable messages */
        .pm-messages-area {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #FAFBFD;
        }
        .pm-messages-area::-webkit-scrollbar { width: 3px; }
        .pm-messages-area::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }

        .pm-msgs-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          flex: 1; text-align: center; gap: 10px; padding: 32px;
        }
        .pm-msgs-empty-icon {
          width: 56px; height: 56px; border-radius: 14px;
          background: #EFF9FB;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
        }
        .pm-msgs-empty-title { font-size: 14px; font-weight: 700; color: #053366; }
        .pm-msgs-empty-sub   { font-size: 12px; color: #94A3B8; line-height: 1.5; }

        .pm-ts-divider { display: flex; align-items: center; justify-content: center; margin: 10px 0 6px; }
        .pm-ts-pill {
          font-size: 10.5px; color: #94A3B8; font-weight: 600;
          background: #F1F5F9; border-radius: 20px; padding: 3px 10px;
        }

        .pm-bubble-row { display: flex; margin-bottom: 2px; }
        .pm-bubble-row.mine  { justify-content: flex-end; }
        .pm-bubble-row.other { justify-content: flex-start; }

        .pm-bubble {
          max-width: min(68%, 480px);
          padding: 10px 13px;
          font-size: 13px;
          line-height: 1.55;
          word-break: break-word;
          animation: fadeUp .18s ease both;
        }
        .pm-bubble.mine {
          background: #053366; color: #fff;
          border-radius: 16px 16px 4px 16px;
        }
        .pm-bubble.other {
          background: #F1F5F9; color: #1E293B;
          border-radius: 16px 16px 16px 4px;
        }
        .pm-bubble-meta {
          display: flex; align-items: center; gap: 4px;
          margin-top: 4px; justify-content: flex-end;
        }
        .pm-bubble-time { font-size: 10px; opacity: .6; }

        /* Input row */
        .pm-input-area {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 18px;
          border-top: 1.5px solid #F1F5F9;
          background: #fff;
        }
        .pm-msg-input {
          flex: 1;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 11px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: inherit;
          color: #053366;
          outline: none;
          transition: border-color .2s;
        }
        .pm-msg-input:focus { border-color: #2B96A8; background: #fff; }
        .pm-msg-input::placeholder { color: #B0BAC9; }

        .pm-send-btn {
          width: 42px; height: 42px; min-width: 42px;
          background: #053366;
          border: none; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background .2s, transform .15s, opacity .2s;
          flex-shrink: 0;
        }
        .pm-send-btn:hover:not(:disabled) { background: #042952; transform: scale(1.05); }
        .pm-send-btn:disabled { opacity: .45; cursor: not-allowed; }

        /* Desktop placeholder (no conv selected) */
        .pm-chat-placeholder {
          flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; text-align: center; padding: 32px;
          background: #FAFBFD;
        }
        .pm-chat-placeholder-icon {
          width: 68px; height: 68px; border-radius: 18px;
          background: linear-gradient(135deg, #EFF9FB, #E8F4FF);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px;
        }
        .pm-chat-placeholder-title { font-size: 15px; font-weight: 700; color: #053366; }
        .pm-chat-placeholder-sub   { font-size: 12.5px; color: #94A3B8; line-height: 1.6; max-width: 240px; }

        /* ══════════════ RESPONSIVE ══════════════ */

        /* Tablet */
        @media (min-width: 701px) and (max-width: 1024px) {
          .pm-root  { padding: 16px 18px 20px; }
          .pm-shell { height: calc(100vh - 118px); }
          .pm-sidebar { width: 260px; min-width: 260px; max-width: 260px; }
        }

        /* Mobile */
        @media (max-width: 700px) {
          .pm-root {
            padding: 0;
            background: #fff;
            min-height: 100dvh;
            gap: 0;
          }
          .pm-page-header { display: none; }

          .pm-shell {
            border-radius: 0;
            border: none;
            box-shadow: none;
            height: 100dvh;
            min-height: 100dvh;
          }

          /* SIDEBAR: full width when no conv open */
          .pm-sidebar {
            position: absolute;
            inset: 0;
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            z-index: 1;
            transition: transform .25s ease, opacity .25s ease;
          }
          /* Hide sidebar when conv is open */
          .pm-sidebar.mob-hidden {
            transform: translateX(-100%);
            opacity: 0;
            pointer-events: none;
          }

          /* CHAT: full width, initially off-screen */
          .pm-chat {
            position: absolute;
            inset: 0;
            width: 100%;
            transform: translateX(100%);
            opacity: 0;
            pointer-events: none;
            transition: transform .25s ease, opacity .25s ease;
            z-index: 2;
          }
          /* Show chat when conv is open */
          .pm-chat.mob-visible {
            transform: translateX(0);
            opacity: 1;
            pointer-events: auto;
          }

          /* The shell needs to be relative for absolute children */
          .pm-shell { position: relative; }

          /* Show back button */
          .pm-back-btn { display: flex; }

          /* Safe-area paddings for iOS notch */
          .pm-sidebar-head {
            padding-top: calc(14px + env(safe-area-inset-top, 0px));
          }
          .pm-chat-head {
            height: calc(60px + env(safe-area-inset-top, 0px));
            padding-top: env(safe-area-inset-top, 0px);
            padding-left: 12px;
            padding-right: 14px;
          }
          .pm-input-area {
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          }

          .pm-messages-area { padding: 14px; }
          .pm-bubble { max-width: 82%; }
          .pm-conv-row { padding: 12px 14px; }
        }
      `}</style>

      <div className="pm-root">

        <header className="pm-page-header">
          <h1 className="pm-page-title">Mes Conversations</h1>
          <p className="pm-page-sub">
            {totalUnread > 0
              ? `${totalUnread} message${totalUnread > 1 ? "s" : ""} non lu${totalUnread > 1 ? "s" : ""}`
              : "Gérez vos échanges avec les touristes"}
          </p>
        </header>

        <div className="pm-shell">

          {/* ── SIDEBAR ── */}
          <div className={`pm-sidebar${activeConv ? " mob-hidden" : ""}`}>
            <div className="pm-sidebar-head">
              <div className="pm-sidebar-title-row">
                <MessageCircle size={15} style={{ color: "#2B96A8" }} />
                <span className="pm-sidebar-title">Messages</span>
                {totalUnread > 0 && <span className="pm-unread-badge">{totalUnread}</span>}
              </div>
              <div className="pm-search-wrap">
                <Search size={13} className="pm-search-icon" />
                <input
                  className="pm-search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un touriste..."
                />
              </div>
            </div>

            <div className="pm-conv-list">
              {filtered.length === 0 ? (
                <div className="pm-conv-empty">
                  <div className="pm-conv-empty-icon"><Inbox size={26} /></div>
                  <p className="pm-conv-empty-title">Aucun message</p>
                  <p className="pm-conv-empty-sub">Les touristes vous contacteront depuis vos excursions</p>
                </div>
              ) : filtered.map(conv => {
                const isActive = activeConv?.id === conv.id;
                const tName    = conv.touriste?.full_name || "Touriste";
                const unread   = conv.unread_count || 0;
                return (
                  <div
                    key={conv.id}
                    className={`pm-conv-row${isActive ? " active" : ""}`}
                    onClick={() => openConversation(conv)}
                  >
                    <div className="pm-avatar">
                      {conv.touriste?.avatar_url
                        ? <img src={conv.touriste.avatar_url} alt="" />
                        : tName.charAt(0).toUpperCase()}
                    </div>
                    <div className="pm-conv-meta">
                      <div className="pm-conv-top">
                        <span className={`pm-conv-name ${unread > 0 ? "" : "read"}`}>{tName}</span>
                        {conv.last_message && <span className="pm-conv-time">{fmt(conv.last_message.created_at)}</span>}
                      </div>
                      {conv.excursion && (
                        <p className="pm-conv-excursion">
                          <Mountain size={10} /> {conv.excursion.title}
                        </p>
                      )}
                      <div className="pm-conv-bottom">
                        <p className={`pm-conv-preview${unread > 0 ? " unread" : ""}`}>
                          {conv.last_message?.contenu || "Nouvelle conversation..."}
                        </p>
                        {unread > 0 && <span className="pm-conv-dot">{unread}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CHAT PANEL ── */}
          <div className={`pm-chat${activeConv ? " mob-visible" : ""}`}>
            {activeConv ? (
              <>
                {/* Header */}
                <div className="pm-chat-head">
                  <button className="pm-back-btn" onClick={handleBack} aria-label="Retour">
                    <ArrowLeft size={17} />
                  </button>
                  <div className="pm-chat-avatar">
                    {activeConv.touriste?.avatar_url
                      ? <img src={activeConv.touriste.avatar_url} alt="" />
                      : (activeConv.touriste?.full_name || "T").charAt(0).toUpperCase()}
                  </div>
                  <div className="pm-chat-head-info">
                    <p className="pm-chat-head-name">{activeConv.touriste?.full_name || "Touriste"}</p>
                    {activeConv.excursion && (
                      <p className="pm-chat-head-exc"><Mountain size={11} /> {activeConv.excursion.title}</p>
                    )}
                  </div>
                  <div className="pm-online-dot" />
                </div>

                {/* Messages */}
                <div className="pm-messages-area">
                  {messages.length === 0 ? (
                    <div className="pm-msgs-empty">
                      <div className="pm-msgs-empty-icon">
                        <Hand size={26} style={{ color: "#2B96A8" }} />
                      </div>
                      <p className="pm-msgs-empty-title">Nouvelle conversation</p>
                      <p className="pm-msgs-empty-sub">Répondez au touriste pour démarrer la conversation</p>
                    </div>
                  ) : messages.map((msg, idx) => {
                    const isMine = msg.expediteur_id === userId;
                    const prev   = messages[idx - 1];
                    const showTs = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 300000;
                    return (
                      <div key={msg.id}>
                        {showTs && (
                          <div className="pm-ts-divider">
                            <span className="pm-ts-pill">{fmt(msg.created_at)}</span>
                          </div>
                        )}
                        <div className={`pm-bubble-row ${isMine ? "mine" : "other"}`}>
                          <div className={`pm-bubble ${isMine ? "mine" : "other"}`}>
                            <p>{msg.contenu}</p>
                            <div className="pm-bubble-meta">
                              <span className="pm-bubble-time">{fmt(msg.created_at)}</span>
                              {isMine && (msg.lu ? <CheckCheck size={11} /> : <Check size={11} />)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="pm-input-area">
                  <input
                    ref={inputRef}
                    className="pm-msg-input"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Répondre au touriste..."
                  />
                  <button
                    className="pm-send-btn"
                    onClick={sendMessage}
                    disabled={!newMsg.trim() || sending}
                    aria-label="Envoyer"
                  >
                    {sending
                      ? <Loader2 size={16} color="white" style={{ animation: "spin 1s linear infinite" }} />
                      : <Send size={15} color="white" />}
                  </button>
                </div>
              </>
            ) : (
              /* Desktop placeholder */
              <div className="pm-chat-placeholder">
                <div className="pm-chat-placeholder-icon">
                  <MessageCircle size={30} style={{ color: "#2B96A8" }} />
                </div>
                <p className="pm-chat-placeholder-title">Messagerie</p>
                <p className="pm-chat-placeholder-sub">
                  Sélectionnez une conversation pour répondre à vos touristes
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}