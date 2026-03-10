"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type ActivityItem = {
  id: string;
  excursion: { title: string; city: string; price_per_person: number; duration_hours: number; photos: string[] };
  note: string;
  time: "matin" | "aprem" | "soir";
};
type DayPlan    = { city: string; activities: ActivityItem[] };
type Itineraire = {
  id: string;
  nb_jours: number;
  villes_selectionnees: string[];
  plan: DayPlan[];
  created_at: string;
  updated_at: string;
};

const CITY_EMOJI: Record<string, string> = {
  Tunis:"🏛️", Sousse:"🏖️", Hammamet:"🌺", Djerba:"🏝️",
  Tozeur:"🌴", Douz:"🐪", Kairouan:"🕌", Sfax:"🫒",
  Tataouine:"⭐", Tabarka:"🌊", Nabeul:"🏺", Gafsa:"⛏️",
};

export default function ItinerairesClient({
  itineraires: init = [],
  userId,
}: {
  itineraires: Itineraire[];
  userId: string;
}) {
  const sb          = createClient();
  const [items,     setItems]    = useState<Itineraire[]>(init ?? []);
  const [deleting,  setDeleting] = useState<string | null>(null);
  const [expanded,  setExpanded] = useState<string | null>(null);

  const deleteIt = async (id: string) => {
    if (!confirm("Supprimer cet itinéraire ?")) return;
    setDeleting(id);
    await sb.from("itineraires").delete().eq("id", id).eq("user_id", userId);
    setItems(p => p.filter(i => i.id !== id));
    setDeleting(null);
  };

  const totAct    = (plan: DayPlan[]) =>
    plan.reduce((s, d) => s + (d.activities?.length || 0), 0);
  const totBudget = (plan: DayPlan[]) =>
    plan.reduce((s, d) => s + d.activities.reduce((ss, a) => ss + (a.excursion?.price_per_person || 0), 0), 0);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", padding: "36px 48px 60px", maxWidth: 1160, margin: "0 auto", width: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .it-card { animation:fadeUp .22s ease both; transition:box-shadow .2s,transform .18s }
        .it-card:hover { box-shadow:0 8px 28px -8px rgba(43,150,168,.2)!important; transform:translateY(-2px) }
        .it-btn  { transition:all .15s; cursor:pointer; font-family:inherit; border:none; outline:none }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:"#2B96A8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>
            ✏️ Mode Libre
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:"#111827", margin:0, lineHeight:1.1 }}>
            Mes itinéraires
          </h1>
          <p style={{ fontSize:13, color:"#9CA3AF", marginTop:8 }}>
            {items.length} itinéraire{items.length !== 1 ? "s" : ""} sauvegardé{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <a href="/touriste/itineraire"
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 22px", background:"#2B96A8", color:"white", borderRadius:40, textDecoration:"none", fontSize:13, fontWeight:700, boxShadow:"0 6px 20px -6px rgba(43,150,168,.5)", transition:"all .2s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#1e7a8a"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="#2B96A8"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouvel itinéraire
        </a>
      </div>

      {/* ── Empty state ── */}
      {items.length === 0 ? (
        <div style={{ textAlign:"center", padding:"72px 24px", background:"white", borderRadius:28, border:"1px solid #E5E7EB", boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize:60, marginBottom:16 }}>🗺️</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:"#111827", marginBottom:10 }}>
            Aucun itinéraire sauvegardé
          </h2>
          <p style={{ fontSize:14, color:"#9CA3AF", marginBottom:28, maxWidth:320, margin:"0 auto 28px" }}>
            Planifiez votre voyage en Tunisie et sauvegardez votre itinéraire
          </p>
          <a href="/touriste/itineraire"
            style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 28px", background:"#2B96A8", color:"white", borderRadius:40, textDecoration:"none", fontSize:14, fontWeight:700 }}>
            ✏️ Créer mon premier itinéraire
          </a>
        </div>

      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {items.map((it, idx) => {
            const acts   = totAct(it.plan);
            const budget = totBudget(it.plan);
            const isOpen = expanded === it.id;

            return (
              <div key={it.id} className="it-card"
                style={{ background:"white", borderRadius:24, border:"1px solid #E5E7EB", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,.05)", animationDelay:`${idx * .06}s` }}>

                {/* ── Card header ── */}
                <div style={{ padding:"20px 24px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}
                  onClick={() => setExpanded(isOpen ? null : it.id)}>

                  {/* Icon */}
                  <div style={{ width:50, height:50, borderRadius:16, background:"linear-gradient(135deg,#EFF9FB,#D0F0F5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, border:"1px solid rgba(43,150,168,.15)" }}>
                    🗺️
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                      <h3 style={{ fontSize:15, fontWeight:800, color:"#111827", margin:0 }}>
                        {it.nb_jours} jour{it.nb_jours > 1 ? "s" : ""} en Tunisie
                      </h3>
                      {it.villes_selectionnees?.slice(0, 3).map(v => (
                        <span key={v} style={{ fontSize:11, color:"#2B96A8", background:"rgba(43,150,168,.08)", padding:"2px 8px", borderRadius:20, fontWeight:500 }}>
                          {CITY_EMOJI[v] || "📍"} {v}
                        </span>
                      ))}
                      {(it.villes_selectionnees?.length || 0) > 3 && (
                        <span style={{ fontSize:11, color:"#9CA3AF" }}>+{it.villes_selectionnees.length - 3}</span>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:16, fontSize:12, color:"#9CA3AF", flexWrap:"wrap" }}>
                      <span>📅 Modifié le {fmt(it.updated_at)}</span>
                      <span>🎯 {acts} activité{acts !== 1 ? "s" : ""}</span>
                      {budget > 0 && <span style={{ color:"#059669", fontWeight:600 }}>💰 {budget} TND</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                    <a href="/touriste/itineraire"
                      style={{ padding:"8px 16px", background:"#2B96A8", color:"white", borderRadius:20, fontSize:12, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", gap:5, transition:"all .15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#1e7a8a"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="#2B96A8"}>
                      ✏️ Modifier
                    </a>
                    <button className="it-btn"
                      onClick={() => deleteIt(it.id)}
                      disabled={deleting === it.id}
                      style={{ padding:"8px 14px", background:"#FEF2F2", color:"#DC2626", borderRadius:20, fontSize:12, fontWeight:700 }}>
                      {deleting === it.id ? "..." : "🗑️"}
                    </button>
                  </div>

                  {/* Arrow */}
                  <span style={{ color:"#D1D5DB", fontSize:18, flexShrink:0, transition:"transform .2s", transform:isOpen ? "rotate(180deg)" : "none", display:"inline-block" }}>
                    ▾
                  </span>
                </div>

                {/* ── Détail du plan ── */}
                {isOpen && (
                  <div style={{ padding:"0 24px 20px", borderTop:"1px solid #F3F4F6" }}>
                    <div style={{ paddingTop:18 }}>
                      {it.plan.length === 0 ? (
                        <p style={{ fontSize:13, color:"#C4C9D0", fontStyle:"italic" }}>Aucune activité planifiée</p>
                      ) : it.plan.map((day, di) => (
                        <div key={di} style={{ borderLeft:"3px solid #EFF9FB", paddingLeft:14, marginBottom:14 }}>
                          <p style={{ fontSize:12, fontWeight:700, color:"#2B96A8", marginBottom:8 }}>
                            {CITY_EMOJI[day.city] || "📍"} Jour {di + 1} — {day.city}
                          </p>
                          {day.activities.length === 0 ? (
                            <p style={{ fontSize:12, color:"#D1D5DB", fontStyle:"italic" }}>Journée libre</p>
                          ) : day.activities.map(act => (
                            <div key={act.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#F9FAFB", borderRadius:12, marginBottom:6, border:"1px solid #F3F4F6" }}>
                              {act.excursion.photos?.[0] && (
                                <img src={act.excursion.photos[0]} alt="" style={{ width:34, height:34, borderRadius:8, objectFit:"cover", flexShrink:0 }}/>
                              )}
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ fontSize:13, fontWeight:600, color:"#111827", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  {act.excursion.title}
                                </p>
                                <p style={{ fontSize:11, color:"#9CA3AF", margin:0 }}>
                                  {act.time === "matin" ? "🌅 Matin" : act.time === "aprem" ? "☀️ Après-midi" : "🌙 Soir"}
                                  {" · "}{act.excursion.duration_hours}h · 📍 {act.excursion.city}
                                </p>
                              </div>
                              <span style={{ fontSize:13, fontWeight:700, color:"#2B96A8", flexShrink:0 }}>
                                {act.excursion.price_per_person} TND
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}