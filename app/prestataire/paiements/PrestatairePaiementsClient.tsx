"use client";

import { useState } from "react";
import {
  TrendingUp, Clock, Percent, Wallet,
  CalendarDays, Users, CheckCircle2,
  RefreshCcw, Hourglass, Search, MapPin,
} from "lucide-react";

interface Paiement {
  id: string; amount: number; net_amount: number;
  platform_fee: number; status: string;
  created_at: string; reservation_id: string;
}
interface Excursion { id: string; title: string; city: string; }

interface Props {
  paiements:    Paiement[];
  reservations: Record<string, unknown>[];
  excursions:   Excursion[];
  touristes:    { user_id: string; full_name: string | null }[];
}

const STATUS_CFG = {
  paid:     { label: "Versé",       bg: "#DCFCE7", color: "#15803D", dot: "#22C55E", icon: <CheckCircle2 size={12}/> },
  pending:  { label: "En attente",  bg: "#FEF9C3", color: "#A16207", dot: "#D97706", icon: <Hourglass size={12}/> },
  refunded: { label: "Remboursé",   bg: "#FEE2E2", color: "#DC2626", dot: "#EF4444", icon: <RefreshCcw size={12}/> },
} as const;
type StatusKey = keyof typeof STATUS_CFG;

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// Groupe les paiements par mois
function groupByMonth(items: Paiement[]) {
  const groups: Record<string, Paiement[]> = {};
  for (const p of items) {
    const key = new Date(p.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

export default function PrestatairePaiementsClient({ paiements, reservations, excursions, touristes }: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusKey>("all");

  const resaMap  = Object.fromEntries(reservations.map(r => [String(r.id), r]));
  const excMap   = Object.fromEntries(excursions.map(e => [e.id, e]));
  const tourMap  = Object.fromEntries(touristes.map(t => [t.user_id, t.full_name || "Anonyme"]));

  const totalPaid    = paiements.filter(p => p.status === "paid")   .reduce((s, p) => s + Number(p.net_amount), 0);
  const totalPending = paiements.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.net_amount), 0);
  const totalFees    = paiements.reduce((s, p) => s + Number(p.platform_fee), 0);
  const nbPaid       = paiements.filter(p => p.status === "paid").length;

  const filtered = paiements.filter(p => {
    const resa = resaMap[p.reservation_id] || {};
    const exc  = excMap[String(resa.excursion_id)] || {} as Excursion;
    const tour = tourMap[String(resa.touriste_id)] || "";
    const q    = search.toLowerCase();
    const matchSearch =
      (exc.title || "").toLowerCase().includes(q) ||
      (exc.city  || "").toLowerCase().includes(q) ||
      tour.toLowerCase().includes(q)              ||
      String(resa.booking_code || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const grouped = groupByMonth(filtered);

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pp-card { animation:fadeUp .35s ease both; }
        .pp-stat:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(5,51,102,.1)!important; transition:all .2s; }
        .pp-row { display:flex; justify-content:space-between; align-items:center; padding:15px 18px; background:white; border-radius:12px; border:1px solid #EEF2FF; margin-bottom:8px; transition:all .15s; }
        .pp-row:hover { background:#F8FAFF; border-color:#DCE5FF; }
        .pp-search { width:100%; padding:10px 14px 10px 38px; border:1.5px solid #DCE5FF; border-radius:12px; font-size:13px; font-family:inherit; outline:none; color:#053366; background:white; transition:border .2s; }
        .pp-search:focus { border-color:#02AFCF; box-shadow:0 0 0 3px rgba(2,175,207,.1); }
        .pp-ftab { padding:7px 14px; border-radius:20px; border:1.5px solid #DCE5FF; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; }
        .pp-ftab.on  { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; border-color:transparent; box-shadow:0 3px 10px rgba(2,175,207,.3); }
        .pp-ftab:not(.on) { background:white; color:#053366; }
        .pp-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px; }
        .pp-row-inner { display:flex; justify-content:space-between; align-items:center; width:100%; gap:12px; }
        @media(max-width:900px){ .pp-stats { grid-template-columns:repeat(2,1fr); gap:10px; } }
        @media(max-width:600px){
          .pp-stats { grid-template-columns:1fr; }
          .pp-row-inner { flex-direction:column; align-items:flex-start; }
          .pp-row-right { align-self:flex-end; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="pp-card" style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:6 }}>
          <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(2,175,207,.35)" }}>
            <Wallet size={22} color="white" strokeWidth={1.8}/>
          </div>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:"#053366", margin:0, letterSpacing:"-0.5px" }}>Paiements</h1>
            <p style={{ color:"#6B7280", fontSize:14, margin:0 }}>
              {paiements.length} transaction{paiements.length > 1 ? "s" : ""} · {nbPaid} versé{nbPaid > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="pp-stats pp-card" style={{ animationDelay:".07s" }}>
        {[
          { label:"Total encaissé",        value:`${totalPaid} TND`,    icon:<TrendingUp size={20}/>,  color:"#02AFCF", bg:"rgba(2,175,207,.1)",   border:"rgba(2,175,207,.2)"   },
          { label:"En attente versement",  value:`${totalPending} TND`, icon:<Clock size={20}/>,       color:"#A16207", bg:"rgba(217,119,6,.1)",    border:"rgba(217,119,6,.2)"   },
          { label:"Commission prélevée",   value:`${totalFees} TND`,    icon:<Percent size={20}/>,     color:"#6B7280", bg:"rgba(107,114,128,.08)", border:"rgba(107,114,128,.15)" },
        ].map((s, i) => (
          <div key={s.label} className="pp-stat" style={{ background:"white", border:`1px solid ${s.border}`, borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 8px rgba(5,51,102,.05)", animationDelay:`${.07+i*.05}s`, cursor:"default", transition:"all .2s" }}>
            <div style={{ width:40, height:40, borderRadius:11, background:s.bg, border:`1px solid ${s.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize:11, color:"#9CA3AF", fontWeight:500, margin:"0 0 3px", textTransform:"uppercase", letterSpacing:"0.4px" }}>{s.label}</p>
              <p style={{ fontSize:20, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty global ── */}
      {paiements.length === 0 ? (
        <div style={{ textAlign:"center", padding:"70px 20px", background:"white", borderRadius:20, border:"1px solid #EEF2FF" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(2,175,207,.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <Wallet size={32} color="#02AFCF" strokeWidth={1.5}/>
          </div>
          <p style={{ fontSize:16, fontWeight:700, color:"#053366", marginBottom:8 }}>Aucun paiement pour l&apos;instant</p>
          <p style={{ fontSize:14, color:"#9CA3AF" }}>Vos revenus apparaîtront ici après vos premières réservations confirmées</p>
        </div>
      ) : (
        <>
          {/* ── Toolbar ── */}
          <div className="pp-card" style={{ background:"white", borderRadius:16, border:"1px solid #EEF2FF", padding:"14px 16px", marginBottom:20, animationDelay:".18s" }}>
            <div style={{ position:"relative", marginBottom:12 }}>
              <Search size={15} color="#9CA3AF" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
              <input className="pp-search" placeholder="Excursion, touriste, code réservation..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {(["all", "paid", "pending", "refunded"] as const).map(s => (
                <button key={s} className={`pp-ftab ${statusFilter === s ? "on" : ""}`} onClick={() => setStatusFilter(s)}>
                  {s === "all"
                    ? `Tous (${paiements.length})`
                    : `${STATUS_CFG[s].label} (${paiements.filter(p => p.status === s).length})`
                  }
                </button>
              ))}
            </div>
          </div>

          {/* ── Résultats filtrés ── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:48, background:"white", borderRadius:16, border:"1px solid #EEF2FF" }}>
              <Search size={28} color="#DCE5FF" style={{ margin:"0 auto 12px", display:"block" }}/>
              <p style={{ fontWeight:700, color:"#053366", marginBottom:4 }}>Aucun résultat</p>
              <p style={{ fontSize:13, color:"#9CA3AF", marginBottom:14 }}>Essayez d&apos;autres filtres</p>
              <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
                style={{ padding:"8px 18px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", border:"none", borderRadius:10, fontSize:13, fontWeight:600, color:"white", cursor:"pointer", fontFamily:"inherit" }}>
                Réinitialiser
              </button>
            </div>
          ) : (
            /* ── Groupé par mois ── */
            Object.entries(grouped).map(([month, items]) => {
              const monthNet = items.reduce((s, p) => s + Number(p.net_amount), 0);
              return (
                <div key={month} style={{ marginBottom:28 }}>
                  {/* En-tête du mois */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:3, height:18, borderRadius:2, background:"linear-gradient(#02AFCF,#259FFC)" }}/>
                      <span style={{ fontSize:13, fontWeight:800, color:"#053366", textTransform:"capitalize" }}>{month}</span>
                      <span style={{ fontSize:12, color:"#9CA3AF", fontWeight:500 }}>{items.length} transaction{items.length > 1 ? "s" : ""}</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:800, color:"#02AFCF" }}>
                      {monthNet} TND net
                    </span>
                  </div>

                  {/* Lignes du mois */}
                  {items.map((p, i) => {
                    const resa = resaMap[p.reservation_id] || {};
                    const exc  = excMap[String(resa.excursion_id)] || {} as Excursion;
                    const tour = tourMap[String(resa.touriste_id)] || "Anonyme";
                    const sc   = STATUS_CFG[p.status as StatusKey] || STATUS_CFG.pending;

                    return (
                      <div key={p.id} className="pp-card pp-row" style={{ animationDelay:`${i*.04}s`, borderLeft:`3px solid ${sc.dot}` }}>
                        <div className="pp-row-inner">
                          {/* Gauche */}
                          <div style={{ minWidth:0, flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                              <span style={{ fontSize:14, fontWeight:800, color:"#053366", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {exc.title || "Excursion"}
                              </span>
                              {exc.city && (
                                <span style={{ fontSize:11, color:"#02AFCF", fontWeight:600, padding:"2px 8px", background:"rgba(2,175,207,.08)", borderRadius:20 }}>
                                  {exc.city}
                                </span>
                              )}
                            </div>
                            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                              <span style={{ fontSize:11, fontFamily:"monospace", color:"#02AFCF", fontWeight:700, background:"rgba(2,175,207,.08)", padding:"2px 8px", borderRadius:8 }}>
                                #{String(resa.booking_code || "—")}
                              </span>
                              <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                                <CalendarDays size={11} color="#9CA3AF"/> {String(resa.date || "—")}
                              </span>
                              <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                                <Users size={11} color="#9CA3AF"/> {tour}
                              </span>
                              {resa.people_count != null && (
                                <span style={{ fontSize:12, color:"#6B7280" }}>
                                  {Number(resa.people_count)} pers.
                                </span>
                              )}
                            </div>
                            {/* Barre commission */}
                            <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ flex:1, height:4, borderRadius:2, background:"#EEF2FF", overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${(Number(p.net_amount) / Number(p.amount)) * 100}%`, background:"linear-gradient(90deg,#02AFCF,#259FFC)", borderRadius:2 }}/>
                              </div>
                              <span style={{ fontSize:11, color:"#9CA3AF", whiteSpace:"nowrap" }}>
                                Comm. {Number(p.platform_fee)} TND ({Math.round((Number(p.platform_fee)/Number(p.amount))*100)}%)
                              </span>
                            </div>
                          </div>

                          {/* Droite */}
                          <div className="pp-row-right" style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                            <div style={{ textAlign:"right" }}>
                              <p style={{ fontSize:18, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>
                                {Number(p.net_amount)} <span style={{ fontSize:11, fontWeight:500, color:"#9CA3AF" }}>TND</span>
                              </p>
                              <p style={{ fontSize:11, color:"#9CA3AF", marginTop:3 }}>
                                sur {Number(p.amount)} TND total
                              </p>
                              <p style={{ fontSize:11, color:"#9CA3AF", marginTop:1 }}>
                                {fmtDate(p.created_at)}
                              </p>
                            </div>
                            <span style={{ padding:"5px 12px", borderRadius:20, background:sc.bg, color:sc.color, fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
                              <span style={{ width:6, height:6, borderRadius:"50%", background:sc.dot, display:"inline-block" }}/>
                              {sc.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}