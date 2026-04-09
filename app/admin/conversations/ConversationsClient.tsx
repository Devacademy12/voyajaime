"use client";

import { useState, useRef, useEffect } from "react";
import {
  HeaderSection,
  AlertBanner,
  StatsGrid,
  ConversationList,
  EmptyConversationState,
  ConversationHeader,
  MessagesArea,
  ReadOnlyFooter,
  Conv,
  Message,
  Violation,
  Excursion
} from "../../components/admin/ConversationsUI";
import { Profile } from "../../../types";

interface Props {
  conversations: Conv[];
  excursions: Excursion[];
  messages: Message[];
  profiles: Profile[];
  violations: Record<string, Violation[]>;
}

export default function ConversationsClient({ conversations, excursions, messages, profiles, violations }: Props) {
  const [search,        setSearch]        = useState("");
  const [selected,      setSelected]      = useState<string | null>(null);
  const [filterUnread,  setFilterUnread]  = useState(false);
  const [filterAlert,   setFilterAlert]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const excMap     = Object.fromEntries(excursions.map((e: Excursion) => [e.id, e.title]));
  const profileMap = Object.fromEntries(profiles.map((p: Profile) => [p.user_id, p]));

  const msgByConv: Record<string, Message[]> = {};
  for (const m of messages) {
    if (!msgByConv[m.conversation_id]) msgByConv[m.conversation_id] = [];
    msgByConv[m.conversation_id].push(m);
  }

  // Conversations avec au moins 1 violation
  const alertConvIds = new Set(
    Object.keys(violations).map(msgId => {
      const msg = messages.find((m: Message) => m.id === msgId);
      return msg?.conversation_id;
    }).filter(Boolean) as string[]
  );

  const totalUnread  = messages.filter((m: Message) => !m.lu).length;
  const totalAlerts  = alertConvIds.size;

  const filtered = conversations.filter((c: Conv) => {
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

  const selectedConv = selected ? (conversations.find((c: Conv) => c.id === selected) ?? null) : null;
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
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", display:"flex", flexDirection:"column", minHeight:"calc(100vh - 112px)", overflow:"hidden" }}>

      <HeaderSection conversations={conversations} totalUnread={totalUnread} totalAlerts={totalAlerts} />

      {totalAlerts > 0 && (
        <AlertBanner totalAlerts={totalAlerts} onViewAlerts={() => { setFilterAlert(true); setFilterUnread(false); }} />
      )}

      <StatsGrid conversations={conversations} totalUnread={totalUnread} messages={messages} totalAlerts={totalAlerts} />

      <div className="cv-layout" style={{ display:"flex", flex:1, minHeight:0, background:"white", borderRadius:20, border:"1px solid #EEF2FF", overflow:"hidden", boxShadow:"0 2px 12px rgba(5,51,102,.06)" }}>

        <ConversationList
          search={search}
          setSearch={setSearch}
          filterUnread={filterUnread}
          setFilterUnread={setFilterUnread}
          filterAlert={filterAlert}
          setFilterAlert={setFilterAlert}
          filtered={filtered}
          msgByConv={msgByConv}
          alertConvIds={alertConvIds}
          selected={selected}
          setSelected={setSelected}
          profileMap={profileMap}
          excMap={excMap}
          formatDate={formatDate}
          totalAlerts={totalAlerts}
          conversations={conversations}
        />

        <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column" }}>
          {!selectedConv ? (
            <EmptyConversationState />
          ) : (() => {
            const convAlerts = selectedMsgs.filter((m: Message) => violations[m.id]?.length > 0);

            return (
              <>
                <ConversationHeader
                  selectedConv={selectedConv}
                  profileMap={profileMap}
                  excMap={excMap}
                  selectedMsgs={selectedMsgs}
                  convAlerts={convAlerts}
                  setSelected={setSelected}
                />

                <MessagesArea
                  selectedMsgs={selectedMsgs}
                  selectedConv={selectedConv}
                  profileMap={profileMap}
                  violations={violations}
                  formatDate={formatDate}
                  highlightViolations={highlightViolations}
                  messagesEndRef={messagesEndRef}
                />

                <ReadOnlyFooter />
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

}