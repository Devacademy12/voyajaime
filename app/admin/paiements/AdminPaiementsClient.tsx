"use client";

import { useState } from "react";
import {
  TrendingUp, Coins, Clock, CheckCircle2, XCircle,
  Search, Building2, CalendarDays, Users, ArrowUpRight,
  Filter, ChevronDown,
} from "lucide-react";

/* ── Types ── */
interface Paiement {
  id: string; amount: number; platform_fee: number;
  net_amount: number; status: string;
  created_at: string; prestataire_id: string; reservation_id: string;
}
interface Profile  { user_id: string; full_name: string | null; agency_name?: string | null; avatar_url?: string | null; }
interface Excursion{ id: string; title: string; city: string; }
interface Props {
  paiements:    Paiement[];
  prestataires: Profile[];
  reservations: Record<string, unknown>[];
  excursions:   Excursion[];
  touristes:    Profile[];
}

const STATUS_CFG = {
  paid:      { label: "Payé",        bg: "#DCFCE7", color: "#15803D", dot: "#22C55E", icon: <CheckCircle2 size={12}/> },
  pending:   { label: "En attente",  bg: "#FEF9C3", color: "#A16207", dot: "#D97706", icon: <Clock size={12}/> },
  refunded:  { label: "Remboursé",   bg: "#FEE2E2", color: "#DC2626", dot: "#EF4444", icon: <XCircle size={12}/> },
} as const;
type StatusKey = keyof typeof STATUS_CFG;

export default function AdminPaiementsClient({ paiements, prestataires, reservations, excursions, touristes }: Props) {
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusKey>("all");
  const [sortBy,     setSortBy]     = useState<"date" | "amount">("date");

  // Maps
  const prestMap   = Object.fromEntries(prestataires.map(p => [p.user_id, p]));
  const resaMap    = Object.fromEntries(reservations.map(r => [String(r.id), r]));
  const excMap     = Object.fromEntries(excursions.map(e => [e.id, e]));
  const touristeMap= Object.fromEntries(touristes.map(t => [t.user_id, t]));

  // Stats globales
  const totalVolume  = paiements.reduce((s, p) => s + Number(p.amount), 0);
  const totalFees    = paiements.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.platform_fee), 0);
  const totalNet     = paiements.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0);
  const nbPaid       = paiements.filter(p => p.status === "paid").length;
  const nbPending    = paiements.filter(p => p.status === "pending").length;
  const nbRefunded   = paiements.filter(p => p.status === "refunded").length;

  // Filtrage + tri
  const filtered = paiements
    .filter(p => {
      const resa = resaMap[p.reservation_id] || {};
      const exc  = excMap[String(resa.excursion_id)] || {} as Excursion;
      const prest= prestMap[p.prestataire_id] || {};
      const q    = search.toLowerCase();
      const matchSearch =
        (exc.title  || "").toLowerCase().includes(q) ||
        (exc.city   || "").toLowerCase().includes(q) ||
        (prest.agency_name || prest.full_name || "").toLowerCase().includes(q) ||
        String(resa.booking_code || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => sortBy === "amount"
      ? Number(b.amount) - Number(a.amount)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ap-card { animation:fadeUp .35s ease both; }
        .ap-stat:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(5,51,102,.1)!important; transition:all .2s; }
        .ap-row { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:white; border-radius:14px; border:1px solid #EEF2FF; transition:all .15s; margin-bottom:8px; }
        .ap-row:hover { background:#F8FAFF; border-color:#DCE5FF; }
        .ap-search { width:100%; padding:10px 14px 10px 38px; border:1.5px solid #DCE5FF; border-radius:12px; font-size:13px; font-family:inherit; outline:none; color:#053366; background:white; transition:border .2s; }
        .ap-search:focus { border-color:#02AFCF; box-shadow:0 0 0 3px rgba(2,175,207,.1); }
        .ap-ftab { padding:7px 16px; border-radius:20px; border:1.5px solid #DCE5FF; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; }
        .ap-ftab.on  { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; border-color:transparent; }
        .ap-ftab:not(.on) { background:white; color:#053366; }
        .ap-select { padding:9px 14px; border:1.5px solid #DCE5FF; border-radius:12px; font-size:13px; font-family:inherit; outline:none; color:#053366; background:white; cursor:pointer; }
        .ap-stats  { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
        .ap-pills  { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
        .ap-row-meta { display:flex; justify-content:space-between; align-items:center; }
        @media(max-width:900px){
          .ap-stats { grid-template-columns:repeat(2,1fr); }
          .ap-pills { grid-template-columns:repeat(3,1fr); }
        }
        @media(max-width:600px){
          .ap-stats { grid-template-columns:1fr; gap:10px; }
          .ap-pills { grid-template-columns:1fr; }
          .ap-row-meta { flex-direction:column; align-items:flex-start; gap:8px; }
          .ap-row-right { align-self:flex-end; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="ap-card" style={{ marginBottom:28, animationDelay:"0s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:6 }}>
          <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(2,175,207,.35)" }}>
            <Coins size={22} color="white" strokeWidth={1.8}/>
          </div>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:"#053366", margin:0, letterSpacing:"-0.5px" }}>Paiements & Finances</h1>
            <p style={{ color:"#6B7280", fontSize:14, margin:0 }}>{paiements.length} transaction{paiements.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* ── Stats principales ── */}
      <div className="ap-stats ap-card" style={{ animationDelay:".07s" }}>
        {[
          { label:"Volume total",          value:totalVolume, suffix:"TND", icon:<TrendingUp size={22}/>, color:"#02AFCF", bg:"rgba(2,175,207,.1)",  border:"rgba(2,175,207,.2)"  },
          { label:"Commission encaissée",  value:totalFees,   suffix:"TND", icon:<Coins size={22}/>,      color:"#259FFC", bg:"rgba(37,159,252,.1)", border:"rgba(37,159,252,.2)" },
          { label:"Versé aux prestataires",value:totalNet,    suffix:"TND", icon:<ArrowUpRight size={22}/>,color:"#053366", bg:"rgba(5,51,102,.08)",  border:"rgba(5,51,102,.15)"  },
        ].map((s, i) => (
          <div key={s.label} className="ap-stat" style={{ background:"white", border:`1px solid ${s.border}`, borderRadius:16, padding:"18px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 10px rgba(5,51,102,.05)", animationDelay:`${i*.07}s`, cursor:"default", transition:"all .2s" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:s.bg, border:`1px solid ${s.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize:12, color:"#9CA3AF", fontWeight:500, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.4px" }}>{s.label}</p>
              <p style={{ fontSize:24, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>{s.value} <span style={{ fontSize:13, fontWeight:500, color:"#9CA3AF" }}>{s.suffix}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pills statuts ── */}
      <div className="ap-pills ap-card" style={{ animationDelay:".14s" }}>
        {[
          { key:"paid",     count:nbPaid,     ...STATUS_CFG.paid     },
          { key:"pending",  count:nbPending,  ...STATUS_CFG.pending  },
          { key:"refunded", count:nbRefunded, ...STATUS_CFG.refunded },
        ].map(s => (
          <div key={s.key} style={{ background:"white", border:`1px solid ${s.bg}`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, flexShrink:0 }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize:20, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>{s.count}</p>
                <p style={{ fontSize:12, color:"#9CA3AF", margin:"2px 0 0", fontWeight:500 }}>{s.label}</p>
              </div>
            </div>
            <span style={{ width:8, height:8, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="ap-card" style={{ background:"white", borderRadius:16, border:"1px solid #EEF2FF", padding:"14px 16px", marginBottom:16, animationDelay:".2s" }}>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          {/* Search */}
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <Search size={15} color="#9CA3AF" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
            <input className="ap-search" placeholder="Excursion, prestataire, code réservation..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          {/* Status filter */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {(["all","paid","pending","refunded"] as const).map(s => (
              <button key={s} className={`ap-ftab ${statusFilter === s ? "on" : ""}`} onClick={() => setStatusFilter(s)}>
                {s === "all" ? `Tous (${paiements.length})` : STATUS_CFG[s as StatusKey].label}
              </button>
            ))}
          </div>
          {/* Sort */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Filter size={14} color="#9CA3AF"/>
            <select className="ap-select" value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "amount")}>
              <option value="date">Plus récents</option>
              <option value="amount">Montant ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Résultats ── */}
      <p style={{ fontSize:13, color:"#9CA3AF", marginBottom:12, fontWeight:500 }}>
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", background:"white", borderRadius:20, border:"1px solid #EEF2FF" }}>
          <Coins size={40} style={{ color:"#DCE5FF", margin:"0 auto 14px", display:"block" }}/>
          <p style={{ fontSize:15, fontWeight:700, color:"#053366", marginBottom:6 }}>Aucun paiement trouvé</p>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>Essayez d&apos;autres filtres</p>
        </div>
      ) : (
        <div>
          {filtered.map((p, i) => {
            const resa  = resaMap[p.reservation_id] || {};
            const exc   = excMap[String(resa.excursion_id)] || {} as Excursion;
            const prest = prestMap[p.prestataire_id] || {};
            const tour  = touristeMap[String(resa.touriste_id)] || {};
            const sc    = STATUS_CFG[p.status as StatusKey] || STATUS_CFG.pending;

            return (
              <div key={p.id} className="ap-card ap-row" style={{ animationDelay:`${i * .04}s` }}>
                <div className="ap-row-meta" style={{ width:"100%" }}>
                  {/* Gauche */}
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:800, color:"#053366", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {exc.title || "—"}
                      </span>
                      {exc.city && (
                        <span style={{ fontSize:11, color:"#02AFCF", fontWeight:600, padding:"2px 8px", background:"rgba(2,175,207,.08)", borderRadius:20 }}>
                          {exc.city}
                        </span>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ fontFamily:"monospace", color:"#02AFCF", fontWeight:700 }}>#{String(resa.booking_code || "—")}</span>
                      </span>
                      {prest.agency_name || prest.full_name ? (
                        <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                          <Building2 size={11} color="#9CA3AF"/>
                          {prest.agency_name || prest.full_name}
                        </span>
                      ) : null}
                      {tour.full_name ? (
                        <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                          <Users size={11} color="#9CA3AF"/>
                          {tour.full_name}
                        </span>
                      ) : null}
                      <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                        <CalendarDays size={11} color="#9CA3AF"/>
                        {formatDate(p.created_at)}
                      </span>
                      {resa.people_count ? (
                        <span style={{ fontSize:12, color:"#6B7280" }}>
                          {Number(resa.people_count)} pers.
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Droite */}
                  <div className="ap-row-right" style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0, marginLeft:16 }}>
                    {/* Détail montants */}
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:17, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>
                        {Number(p.amount)} <span style={{ fontSize:11, fontWeight:500, color:"#9CA3AF" }}>TND</span>
                      </p>
                      <div style={{ display:"flex", gap:10, marginTop:4, justifyContent:"flex-end", flexWrap:"wrap" }}>
                        <span style={{ fontSize:11, color:"#259FFC", fontWeight:600 }}>
                          Comm. {Number(p.platform_fee)} TND
                        </span>
                        <span style={{ fontSize:11, color:"#02AFCF", fontWeight:600 }}>
                          Net {Number(p.net_amount)} TND
                        </span>
                      </div>
                    </div>
                    {/* Badge statut */}
                    <span style={{ padding:"5px 12px", borderRadius:20, background:sc.bg, color:sc.color, fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:sc.dot, display:"inline-block" }}/>
                      {sc.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}