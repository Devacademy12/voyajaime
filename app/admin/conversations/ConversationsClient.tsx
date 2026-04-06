"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Search, Mountain, Eye, EyeOff,
  X, User, Building2, CalendarDays, CheckCheck,
  AlertTriangle, ShieldAlert, Phone, Mail, Wifi,
} from "lucide-react";
import "@/public/style/conversations.css";

interface Conv {
  id: string; touriste_id: string; prestataire_id: string;
  excursion_id: string | null; created_at: string;
  touriste_name: string | null; prestataire_name: string | null;
}
interface Excursion { id: string; title: string; }
interface Message {
  id: string; conversation_id: string; contenu: string;
  lu: boolean; expediteur_id: string; created_at: string;
}
interface Profile { user_id: string; full_name: string | null; avatar_url: string | null; }
interface Violation { type: string; label: string; match: string; }

interface Props {
  conversations: Conv[];
  excursions:    Excursion[];
  messages:      Message[];
  profiles:      Profile[];
  violations:    Record<string, Violation[]>;
}

/* ── Icône par type de violation ── */
function ViolationIcon({ type }: { type: string }) {
  if (type === "phone")    return <Phone    size={11}/>;
  if (type === "email")    return <Mail     size={11}/>;
  if (type === "whatsapp") return <Wifi     size={11}/>;
  return <AlertTriangle size={11}/>;
}

const VIOLATION_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  phone:    { bg: "#FEF9C3", color: "#A16207", border: "#FDE68A" },
  email:    { bg: "#FEE2E2", color: "#DC2626", border: "#FCA5A5" },
  whatsapp: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  telegram: { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  instagram:{ bg: "#F3E8FF", color: "#7C3AED", border: "#C4B5FD" },
};

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

export default function ConversationsClient({ conversations, excursions, messages, profiles, violations }: Props) {
  const [search,        setSearch]        = useState("");
  const [selected,      setSelected]      = useState<string | null>(null);
  const [filterUnread,  setFilterUnread]  = useState(false);
  const [filterAlert,   setFilterAlert]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const excMap     = Object.fromEntries(excursions.map(e => [e.id, e.title]));
  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

  const msgByConv: Record<string, Message[]> = {};
  for (const m of messages) {
    if (!msgByConv[m.conversation_id]) msgByConv[m.conversation_id] = [];
    msgByConv[m.conversation_id].push(m);
  }

  // Conversations avec au moins 1 violation
  const alertConvIds = new Set(
    Object.keys(violations).map(msgId => {
      const msg = messages.find(m => m.id === msgId);
      return msg?.conversation_id;
    }).filter(Boolean) as string[]
  );

  const totalUnread  = messages.filter(m => !m.lu).length;
  const totalAlerts  = alertConvIds.size;

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.touriste_name    || "").toLowerCase().includes(q) ||
      (c.prestataire_name || "").toLowerCase().includes(q) ||
      (excMap[c.excursion_id || ""] || "").toLowerCase().includes(q);
    const hasUnread = (msgByConv[c.id] || []).some(m => !m.lu);
    const hasAlert  = alertConvIds.has(c.id);
    return matchSearch
      && (!filterUnread || hasUnread)
      && (!filterAlert  || hasAlert);
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
    if (diff < 86400000) return date.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
    return date.toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
  };

  // Highlighter : entoure les matches en rouge dans le texte
  function highlightViolations(contenu: string, msgViolations: Violation[]) {
    if (!msgViolations?.length) return <>{contenu}</>;
    const allMatches = msgViolations.map(v => v.match).filter(Boolean);
    if (!allMatches.length) return <>{contenu}</>;

    const escaped = allMatches.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex   = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts   = contenu.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part)
            ? <mark key={i} style={{ background:"#FEF9C3", color:"#92400E", borderRadius:3, padding:"0 2px", fontWeight:700 }}>{part}</mark>
            : part
        )}
      </>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <div className="cv-fadein" style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:6 }}>
          <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(2,175,207,.35)" }}>
            <MessageCircle size={22} color="white" strokeWidth={1.8}/>
          </div>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:"#053366", margin:0, letterSpacing:"-0.5px" }}>Conversations</h1>
            <p style={{ color:"#6B7280", fontSize:14, margin:0 }}>
              {conversations.length} conversation{conversations.length > 1 ? "s" : ""} · {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
              {totalAlerts > 0 && <span style={{ color:"#DC2626", fontWeight:700 }}> · ⚠️ {totalAlerts} alerte{totalAlerts > 1 ? "s" : ""}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Bannière alertes si violations */}
      {totalAlerts > 0 && (
        <div style={{ marginBottom:20, padding:"14px 18px", background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:14, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <ShieldAlert size={20} color="#DC2626"/>
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#DC2626", margin:"0 0 2px" }}>
              {totalAlerts} conversation{totalAlerts > 1 ? "s" : ""} contient{totalAlerts > 1 ? "nent" : ""} des informations de contact
            </p>
            <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>
              Téléphones, emails, WhatsApp, Telegram ou Instagram détectés — la plateforme doit rester le seul canal de communication.
            </p>
          </div>
          <button
            onClick={() => { setFilterAlert(true); setFilterUnread(false); }}
            style={{ marginLeft:"auto", padding:"7px 14px", background:"#DC2626", color:"white", border:"none", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}
          >
            Voir les alertes
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Conversations",    value:conversations.length, icon:<MessageCircle size={20}/>, color:"#02AFCF", bg:"rgba(2,175,207,.1)",  border:"rgba(2,175,207,.2)"  },
          { label:"Messages non lus", value:totalUnread,          icon:<EyeOff size={20}/>,        color:"#259FFC", bg:"rgba(37,159,252,.1)", border:"rgba(37,159,252,.2)" },
          { label:"Total messages",   value:messages.length,      icon:<CheckCheck size={20}/>,    color:"#053366", bg:"rgba(5,51,102,.08)",  border:"rgba(5,51,102,.15)"  },
          { label:"Alertes contact",  value:totalAlerts,          icon:<ShieldAlert size={20}/>,   color:"#DC2626", bg:"rgba(220,38,38,.08)", border:"rgba(220,38,38,.2)"  },
        ].map(s => (
          <div key={s.label} className="cv-stat-card" style={{ border:`1px solid ${s.border}` }}>
            <div style={{ width:42, height:42, borderRadius:12, background:s.bg, border:`1px solid ${s.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize:24, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:11, color:"#9CA3AF", margin:"3px 0 0", textTransform:"uppercase", letterSpacing:"0.4px", fontWeight:500 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Layout */}
      <div className="cv-layout" style={{ display:"flex", background:"white", borderRadius:20, border:"1px solid #EEF2FF", overflow:"hidden", boxShadow:"0 2px 12px rgba(5,51,102,.06)", minHeight:560 }}>

        {/* Liste */}
        <div className="cv-list-pane" style={{ width:340, borderRight:"1px solid #EEF2FF", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid #EEF2FF" }}>
            <div style={{ position:"relative", marginBottom:10 }}>
              <Search size={15} color="#9CA3AF" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
              <input className="cv-search-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <button className={`cv-ftab ${!filterUnread && !filterAlert ? "on" : ""}`} onClick={() => { setFilterUnread(false); setFilterAlert(false); }}>
                Toutes ({conversations.length})
              </button>
              <button className={`cv-ftab ${filterUnread ? "on" : ""}`} onClick={() => { setFilterUnread(true); setFilterAlert(false); }}>
                Non lues ({conversations.filter(c => (msgByConv[c.id] || []).some(m => !m.lu)).length})
              </button>
              {totalAlerts > 0 && (
                <button
                  className={`cv-ftab ${filterAlert ? "on" : ""}`}
                  onClick={() => { setFilterAlert(true); setFilterUnread(false); }}
                  style={ filterAlert ? { background:"#DC2626", borderColor:"transparent" } : { borderColor:"#FCA5A5", color:"#DC2626" } }
                >
                  ⚠️ Alertes ({totalAlerts})
                </button>
              )}
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 16px", color:"#9CA3AF" }}>
                <MessageCircle size={32} style={{ margin:"0 auto 10px", display:"block", opacity:.3 }}/>
                <p style={{ fontSize:13 }}>Aucune conversation</p>
              </div>
            ) : filtered.map(c => {
              const convMsgs   = msgByConv[c.id] || [];
              const lastMsg    = convMsgs[0];
              const unread     = convMsgs.filter(m => !m.lu).length;
              const hasAlert   = alertConvIds.has(c.id);
              const isActive   = selected === c.id;
              const tProfile   = profileMap[c.touriste_id];
              const pProfile   = profileMap[c.prestataire_id];

              return (
                <div key={c.id} className={`conv-item${isActive ? " active" : ""}`}
                  onClick={() => setSelected(c.id)}
                  style={ hasAlert ? { borderLeft:"3px solid #EF4444" } : undefined }>
                  <div style={{ position:"relative", width:44, height:44, flexShrink:0 }}>
                    <div style={{ position:"absolute", top:0, left:0 }}>
                      <Avatar url={tProfile?.avatar_url} name={c.touriste_name} size={30} radius={9}/>
                    </div>
                    <div style={{ position:"absolute", bottom:0, right:0, border:"2px solid white", borderRadius:9 }}>
                      <Avatar url={pProfile?.avatar_url} name={c.prestataire_name} size={26} radius={7}/>
                    </div>
                    {unread > 0 && (
                      <span style={{ position:"absolute", top:-4, right:-4, background:"#EF4444", color:"white", borderRadius:"50%", width:17, height:17, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid white", zIndex:2 }}>
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                    {hasAlert && unread === 0 && (
                      <span style={{ position:"absolute", top:-4, right:-4, background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:"50%", width:17, height:17, display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}>
                        <AlertTriangle size={9} color="#DC2626"/>
                      </span>
                    )}
                  </div>

                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:2 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#053366", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:145 }}>
                        {c.touriste_name || "Touriste"}
                      </p>
                      {lastMsg && <span style={{ fontSize:10, color:"#9CA3AF", flexShrink:0, marginLeft:4 }}>{formatDate(lastMsg.created_at)}</span>}
                    </div>
                    <p style={{ fontSize:12, color:"#02AFCF", fontWeight:600, margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      ↔ {c.prestataire_name || "Prestataire"}
                    </p>
                    {lastMsg && (
                      <p style={{ fontSize:12, color:"#9CA3AF", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {lastMsg.contenu.slice(0, 45)}{lastMsg.contenu.length > 45 ? "…" : ""}
                      </p>
                    )}
                    {hasAlert && (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4, padding:"2px 8px", background:"#FEF2F2", borderRadius:20, fontSize:11, color:"#DC2626", fontWeight:600 }}>
                        <ShieldAlert size={10}/> Contact détecté
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Détail */}
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {!selectedConv ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#9CA3AF", padding:40 }}>
              <div style={{ width:64, height:64, borderRadius:20, background:"rgba(2,175,207,.08)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <MessageCircle size={30} color="#02AFCF" strokeWidth={1.5}/>
              </div>
              <p style={{ fontSize:15, fontWeight:700, color:"#053366", marginBottom:6 }}>Sélectionnez une conversation</p>
              <p style={{ fontSize:13, color:"#9CA3AF" }}>Cliquez sur une conversation pour voir les messages</p>
            </div>
          ) : (() => {
            const tProfile = profileMap[selectedConv.touriste_id];
            const pProfile = profileMap[selectedConv.prestataire_id];
            const convAlerts = selectedMsgs.filter(m => violations[m.id]?.length > 0);

            return (
              <>
                {/* Header */}
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #EEF2FF", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ display:"flex", alignItems:"center" }}>
                      <div style={{ zIndex:2 }}><Avatar url={tProfile?.avatar_url} name={selectedConv.touriste_name} size={42} radius={12}/></div>
                      <div style={{ marginLeft:-10, border:"2px solid white", borderRadius:12 }}><Avatar url={pProfile?.avatar_url} name={selectedConv.prestataire_name} size={38} radius={10}/></div>
                    </div>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:700, color:"#053366", display:"flex", alignItems:"center", gap:5 }}>
                          <User size={13} color="#02AFCF"/> {selectedConv.touriste_name || "Touriste"}
                        </span>
                        <span style={{ color:"#DCE5FF", fontSize:16 }}>↔</span>
                        <span style={{ fontSize:14, fontWeight:700, color:"#053366", display:"flex", alignItems:"center", gap:5 }}>
                          <Building2 size={13} color="#259FFC"/> {selectedConv.prestataire_name || "Prestataire"}
                        </span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:3, flexWrap:"wrap" }}>
                        {selectedConv.excursion_id && excMap[selectedConv.excursion_id] && (
                          <span style={{ fontSize:12, color:"#02AFCF", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                            <Mountain size={11}/> {excMap[selectedConv.excursion_id]}
                          </span>
                        )}
                        <span style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                          <CalendarDays size={11}/> {new Date(selectedConv.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span style={{ fontSize:12, color:"#9CA3AF" }}>{selectedMsgs.length} message{selectedMsgs.length > 1 ? "s" : ""}</span>
                        {convAlerts.length > 0 && (
                          <span style={{ fontSize:12, color:"#DC2626", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                            <ShieldAlert size={12}/> {convAlerts.length} alerte{convAlerts.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background:"#F3F4F6", border:"none", borderRadius:10, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                    <X size={16} color="#6B7280"/>
                  </button>
                </div>

                {/* Bannière violations dans cette conv */}
                {convAlerts.length > 0 && (
                  <div style={{ padding:"10px 18px", background:"#FEF2F2", borderBottom:"1px solid #FCA5A5", display:"flex", alignItems:"center", gap:8 }}>
                    <ShieldAlert size={15} color="#DC2626"/>
                    <span style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>
                      {convAlerts.length} message{convAlerts.length > 1 ? "s contiennent" : " contient"} des informations de contact détectées
                    </span>
                  </div>
                )}

                {/* Messages */}
                <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:14, background:"#F8FAFF" }}>
                  {selectedMsgs.length === 0 ? (
                    <div style={{ textAlign:"center", color:"#9CA3AF", paddingTop:40 }}>
                      <p style={{ fontSize:13 }}>Aucun message</p>
                    </div>
                  ) : selectedMsgs.map((m, i) => {
                    const isTouriste    = m.expediteur_id === selectedConv.touriste_id;
                    const senderProfile = isTouriste ? tProfile : pProfile;
                    const senderName    = isTouriste
                      ? (selectedConv.touriste_name    || "Touriste")
                      : (selectedConv.prestataire_name || "Prestataire");
                    const msgViolations = violations[m.id] || [];
                    const hasViolation  = msgViolations.length > 0;

                    return (
                      <div key={m.id} className="cv-msg-fadein" style={{ display:"flex", flexDirection:"column", alignItems:isTouriste ? "flex-start" : "flex-end", animationDelay:`${i * .025}s` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5, flexDirection:isTouriste ? "row" : "row-reverse" }}>
                          <Avatar url={senderProfile?.avatar_url} name={senderName} size={26} radius={8}/>
                          <span style={{ fontSize:12, fontWeight:600, color:"#053366" }}>{senderName}</span>
                          <span style={{ fontSize:11, color:"#9CA3AF" }}>{formatDate(m.created_at)}</span>
                          {!m.lu && <span style={{ width:6, height:6, borderRadius:"50%", background:"#EF4444", display:"inline-block" }}/>}
                        </div>

                        {/* Bulle avec highlight si violation */}
                        <div className={`msg-bubble ${isTouriste ? "msg-t" : "msg-p"}`}
                          style={ hasViolation ? { outline:"2px solid #FCA5A5", outlineOffset:2 } : undefined }>
                          {highlightViolations(m.contenu, msgViolations)}
                        </div>

                        {/* Tags violations */}
                        {hasViolation && (
                          <div style={{ display:"flex", gap:4, marginTop:5, flexWrap:"wrap", justifyContent:isTouriste ? "flex-start" : "flex-end" }}>
                            {msgViolations.map((v, vi) => {
                              const vc = VIOLATION_COLOR[v.type] || VIOLATION_COLOR.phone;
                              return (
                                <span key={vi} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700, background:vc.bg, color:vc.color, border:`1px solid ${vc.border}` }}>
                                  <ViolationIcon type={v.type}/> {v.label}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {m.lu && !isTouriste && (
                          <span style={{ fontSize:10, color:"#9CA3AF", marginTop:4, display:"flex", alignItems:"center", gap:3 }}>
                            <CheckCheck size={10} color="#02AFCF"/> Lu
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef}/>
                </div>

                <div style={{ padding:"11px 18px", borderTop:"1px solid #EEF2FF", background:"white", display:"flex", alignItems:"center", gap:8 }}>
                  <Eye size={14} color="#9CA3AF"/>
                  <span style={{ fontSize:12, color:"#9CA3AF" }}>Lecture seule — les admins ne peuvent pas envoyer de messages</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

}