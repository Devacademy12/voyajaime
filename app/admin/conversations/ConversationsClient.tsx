"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Search, Mountain,
  Eye, EyeOff, X, User, Building2,
  CalendarDays, CheckCheck,
} from "lucide-react";
import "./conversations.css";

interface Conv {
  id:               string;
  touriste_id:      string;
  prestataire_id:   string;
  excursion_id:     string | null;
  created_at:       string;
  touriste_name:    string | null;
  prestataire_name: string | null;
}
interface Excursion { id: string; title: string; }
interface Message {
  id:              string;
  conversation_id: string;
  contenu:         string;
  lu:              boolean;
  expediteur_id:   string;
  created_at:      string;
}
interface Profile { user_id: string; full_name: string | null; avatar_url: string | null; }

interface Props {
  conversations: Conv[];
  excursions:    Excursion[];
  messages:      Message[];
  profiles:      Profile[];
}

function Avatar({ url, name, size = 40, radius = 12 }: { url?: string | null; name?: string | null; size?: number; radius?: number }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:radius, overflow:"hidden", background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {url
        ? <img src={url} alt={name || ""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
        : <span style={{ fontSize:size * 0.38, fontWeight:800, color:"white" }}>{initial}</span>
      }
    </div>
  );
}

export default function ConversationsClient({ conversations, excursions, messages, profiles }: Props) {
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState<string | null>(null);
  const [filterUnread, setFilterUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const excMap     = Object.fromEntries(excursions.map(e => [e.id, e.title]));
  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

  const msgByConv: Record<string, Message[]> = {};
  for (const m of messages) {
    if (!msgByConv[m.conversation_id]) msgByConv[m.conversation_id] = [];
    msgByConv[m.conversation_id].push(m);
  }

  const totalUnread = messages.filter(m => !m.lu).length;

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.touriste_name    || "").toLowerCase().includes(q) ||
      (c.prestataire_name || "").toLowerCase().includes(q) ||
      (excMap[c.excursion_id || ""] || "").toLowerCase().includes(q);
    const hasUnread = (msgByConv[c.id] || []).some(m => !m.lu);
    return matchSearch && (!filterUnread || hasUnread);
  });

  const selectedConv = selected ? (conversations.find(c => c.id === selected) ?? null) : null;
  const selectedMsgs = selected
    ? (msgByConv[selected] || []).slice().sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMsgs.length]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 60000)    return "À l'instant";
    if (diff < 3600000)  return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const stats = [
    { label: "Conversations",    value: conversations.length, icon: <MessageCircle size={20}/>, color: "#02AFCF", bg: "rgba(2,175,207,.1)",  border: "rgba(2,175,207,.2)"  },
    { label: "Messages non lus", value: totalUnread,          icon: <EyeOff size={20}/>,        color: "#259FFC", bg: "rgba(37,159,252,.1)", border: "rgba(37,159,252,.2)" },
    { label: "Total messages",   value: messages.length,      icon: <CheckCheck size={20}/>,    color: "#053366", bg: "rgba(5,51,102,.08)",  border: "rgba(5,51,102,.15)"  },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <div className="cv-fadein" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#02AFCF,#053366)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(2,175,207,.35)" }}>
            <MessageCircle size={22} color="white" strokeWidth={1.8}/>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-0.5px" }}>Conversations</h1>
            <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
              {conversations.length} conversation{conversations.length > 1 ? "s" : ""} · {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="cv-stat-card" style={{ border: `1px solid ${s.border}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#053366", margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: 500 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Layout principal */}
      <div className="cv-layout" style={{ display: "flex", background: "white", borderRadius: 20, border: "1px solid #EEF2FF", overflow: "hidden", boxShadow: "0 2px 12px rgba(5,51,102,.06)", minHeight: 560 }}>

        {/* Liste */}
        <div className="cv-list-pane" style={{ width: 340, borderRight: "1px solid #EEF2FF", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #EEF2FF" }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <Search size={15} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}/>
              <input className="cv-search-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={`cv-ftab ${!filterUnread ? "on" : ""}`} onClick={() => setFilterUnread(false)}>
                Toutes ({conversations.length})
              </button>
              <button className={`cv-ftab ${filterUnread ? "on" : ""}`} onClick={() => setFilterUnread(true)}>
                Non lues ({conversations.filter(c => (msgByConv[c.id] || []).some(m => !m.lu)).length})
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#9CA3AF" }}>
                <MessageCircle size={32} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }}/>
                <p style={{ fontSize: 13 }}>Aucune conversation</p>
              </div>
            ) : filtered.map(c => {
              const convMsgs = msgByConv[c.id] || [];
              const lastMsg  = convMsgs[0];
              const unread   = convMsgs.filter(m => !m.lu).length;
              const isActive = selected === c.id;
              const tProfile = profileMap[c.touriste_id];
              const pProfile = profileMap[c.prestataire_id];

              return (
                <div key={c.id} className={`conv-item${isActive ? " active" : ""}`} onClick={() => setSelected(c.id)}>
                  {/* Avatars empilés */}
                  <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 0, left: 0 }}>
                      <Avatar url={tProfile?.avatar_url} name={c.touriste_name} size={30} radius={9}/>
                    </div>
                    <div style={{ position: "absolute", bottom: 0, right: 0, border: "2px solid white", borderRadius: 9 }}>
                      <Avatar url={pProfile?.avatar_url} name={c.prestataire_name} size={26} radius={7}/>
                    </div>
                    {unread > 0 && (
                      <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "white", borderRadius: "50%", width: 17, height: 17, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", zIndex: 2 }}>
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 155 }}>
                        {c.touriste_name || "Touriste"}
                      </p>
                      {lastMsg && <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0, marginLeft: 4 }}>{formatDate(lastMsg.created_at)}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: "#02AFCF", fontWeight: 600, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      ↔ {c.prestataire_name || "Prestataire"}
                    </p>
                    {lastMsg && (
                      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lastMsg.contenu.slice(0, 48)}{lastMsg.contenu.length > 48 ? "…" : ""}
                      </p>
                    )}
                    {c.excursion_id && excMap[c.excursion_id] && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, padding: "2px 8px", background: "rgba(2,175,207,.08)", borderRadius: 20, fontSize: 11, color: "#02AFCF", fontWeight: 600 }}>
                        <Mountain size={10}/> {excMap[c.excursion_id]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Détail */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!selectedConv ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9CA3AF", padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(2,175,207,.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <MessageCircle size={30} color="#02AFCF" strokeWidth={1.5}/>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#053366", marginBottom: 6 }}>Sélectionnez une conversation</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Cliquez sur une conversation pour voir les messages</p>
            </div>
          ) : (() => {
            const tProfile = profileMap[selectedConv.touriste_id];
            const pProfile = profileMap[selectedConv.prestataire_id];
            return (
              <>
                {/* Header conversation */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #EEF2FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ zIndex: 2 }}>
                        <Avatar url={tProfile?.avatar_url} name={selectedConv.touriste_name} size={42} radius={12}/>
                      </div>
                      <div style={{ marginLeft: -10, border: "2px solid white", borderRadius: 12 }}>
                        <Avatar url={pProfile?.avatar_url} name={selectedConv.prestataire_name} size={38} radius={10}/>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#053366", display: "flex", alignItems: "center", gap: 5 }}>
                          <User size={13} color="#02AFCF"/> {selectedConv.touriste_name || "Touriste"}
                        </span>
                        <span style={{ color: "#DCE5FF", fontSize: 16 }}>↔</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#053366", display: "flex", alignItems: "center", gap: 5 }}>
                          <Building2 size={13} color="#259FFC"/> {selectedConv.prestataire_name || "Prestataire"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                        {selectedConv.excursion_id && excMap[selectedConv.excursion_id] && (
                          <span style={{ fontSize: 12, color: "#02AFCF", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <Mountain size={11}/> {excMap[selectedConv.excursion_id]}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                          <CalendarDays size={11}/> {new Date(selectedConv.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{selectedMsgs.length} message{selectedMsgs.length > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background: "#F3F4F6", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <X size={16} color="#6B7280"/>
                  </button>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14, background: "#F8FAFF" }}>
                  {selectedMsgs.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9CA3AF", paddingTop: 40 }}>
                      <p style={{ fontSize: 13 }}>Aucun message dans cette conversation</p>
                    </div>
                  ) : selectedMsgs.map((m, i) => {
                    const isTouriste    = m.expediteur_id === selectedConv.touriste_id;
                    const senderProfile = isTouriste ? tProfile : pProfile;
                    const senderName    = isTouriste
                      ? (selectedConv.touriste_name    || "Touriste")
                      : (selectedConv.prestataire_name || "Prestataire");

                    return (
                      <div key={m.id} className="cv-msg-fadein" style={{ display: "flex", flexDirection: "column", alignItems: isTouriste ? "flex-start" : "flex-end", animationDelay: `${i * 0.025}s` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexDirection: isTouriste ? "row" : "row-reverse" }}>
                          <Avatar url={senderProfile?.avatar_url} name={senderName} size={26} radius={8}/>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#053366" }}>{senderName}</span>
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{formatDate(m.created_at)}</span>
                          {!m.lu && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}/>}
                        </div>
                        <div className={`msg-bubble ${isTouriste ? "msg-t" : "msg-p"}`}>
                          {m.contenu}
                        </div>
                        {m.lu && !isTouriste && (
                          <span style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                            <CheckCheck size={10} color="#02AFCF"/> Lu
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef}/>
                </div>

                {/* Footer */}
                <div style={{ padding: "11px 18px", borderTop: "1px solid #EEF2FF", background: "white", display: "flex", alignItems: "center", gap: 8 }}>
                  <Eye size={14} color="#9CA3AF"/>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>Lecture seule — les admins ne peuvent pas envoyer de messages</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}