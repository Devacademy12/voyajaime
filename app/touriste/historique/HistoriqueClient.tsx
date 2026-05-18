"use client";

import { useState } from "react";
import Link from "next/link";
import {
  History, MapPin, Clock, Users, CalendarDays,
  Ban, CheckCircle2, ChevronRight, Search, Filter,
  ArrowLeft, Ticket, Star, RotateCcw,
} from "lucide-react";

type HistoryType = "cancelled" | "completed" | "passed";

interface HistEntry {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  payment_status: string | null;
  created_at: string;
  history_type: HistoryType;
  excursion: {
    title: string; city: string; photos: string[];
    duration_hours: number; price_per_person: number;
  } | null;
}

const TYPE_CONFIG: Record<HistoryType, { label: string; color: string; bg: string; border: string; dot: string; Icon: React.ElementType }> = {
  cancelled: { label:"Annulée",   color:"#991B1B", bg:"#FEF2F2", border:"#FCA5A5", dot:"#EF4444", Icon:Ban         },
  completed: { label:"Terminée",  color:"#065F46", bg:"#D1FAE5", border:"#6EE7B7", dot:"#10B981", Icon:CheckCircle2},
  passed:    { label:"Passée",    color:"#1E40AF", bg:"#DBEAFE", border:"#93C5FD", dot:"#3B82F6", Icon:History     },
};

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
}
function fmtShort(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=70";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

  .hist-card{
    background:white; border-radius:20px; border:1px solid #EBEBEB;
    overflow:hidden; transition:all .22s; display:flex; flex-direction:column;
    box-shadow:0 2px 8px rgba(0,0,0,.04); animation:fadeUp .3s ease both;
  }
  .hist-card:hover{ box-shadow:0 10px 32px rgba(0,0,0,.1); transform:translateY(-3px); }
  .hist-card:hover .hist-photo{ transform:scale(1.06); }
  .hist-photo{ transition:transform .4s ease; }

  .filter-pill{
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 18px; border-radius:20px; border:1.5px solid #E5E7EB;
    background:white; font-size:13px; font-weight:600; cursor:pointer;
    color:#374151; font-family:inherit; transition:all .18s; white-space:nowrap;
  }
  .filter-pill.active{ background:#053366; border-color:#053366; color:white; }
  .filter-pill:not(.active):hover{ border-color:#053366; color:#053366; }

  .search-input{ 
    width:100%; padding:11px 16px 11px 44px; border:1.5px solid #E5E7EB;
    border-radius:14px; font-size:14px; font-family:inherit; color:#111827;
    background:white; outline:none; transition:all .2s; box-sizing:border-box;
  }
  .search-input:focus{ border-color:#02AFCF; box-shadow:0 0 0 3px rgba(2,175,207,.08); }

  .rebook-btn{
    display:inline-flex; align-items:center; gap:6px;
    padding:9px 16px; background:#053366; color:white; border:none;
    border-radius:12px; font-size:12px; font-weight:700; cursor:pointer;
    font-family:inherit; text-decoration:none; transition:all .18s; white-space:nowrap;
  }
  .rebook-btn:hover{ background:#02AFCF; transform:translateY(-1px); }

  .stat-card{
    background:white; border-radius:18px; border:1px solid #EBEBEB;
    padding:20px 22px; display:flex; align-items:center; gap:14px;
    box-shadow:0 2px 8px rgba(0,0,0,.04);
  }

  /* ── Responsive ── */

  /* Tablet: 2 colonnes */
  @media (max-width: 900px) {
    .hist-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .hist-header-inner {
      padding: 20px 20px 18px !important;
    }
    .hist-content {
      padding: 24px 20px 60px !important;
    }
  }

  /* Mobile: 1 colonne, layout horizontal pour les cards */
  @media (max-width: 600px) {
    .hist-grid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    /* Card en mode row sur mobile */
    .hist-card {
      flex-direction: row !important;
      border-radius: 16px !important;
      min-height: 120px;
    }

    /* Photo à gauche, petite */
    .hist-card-photo-wrap {
      width: 110px !important;
      min-width: 110px !important;
      height: auto !important;
      min-height: 120px !important;
    }

    .hist-card-photo-wrap img {
      height: 100% !important;
    }

    /* Corps à droite */
    .hist-card-body {
      padding: 10px 12px !important;
      gap: 6px !important;
    }

    /* Badge type, repositionné sur mobile */
    .badge-type {
      top: 8px !important;
      left: 8px !important;
    }

    .badge-code {
      display: none !important;
    }

    /* Titre + ville */
    .hist-card-title {
      font-size: 12px !important;
    }

    .hist-card-city {
      font-size: 10px !important;
    }

    /* Grille d'infos : 1 ligne de 2 */
    .hist-info-grid {
      grid-template-columns: 1fr 1fr !important;
      gap: 4px !important;
    }

    /* Prix */
    .hist-price {
      font-size: 15px !important;
    }

    /* Header */
    .hist-header-inner {
      padding: 16px 16px 14px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
    }

    .hist-content {
      padding: 16px 16px 60px !important;
    }

    /* Filtres scrollables horizontalement */
    .hist-filter-row {
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
      padding-bottom: 4px !important;
    }
    .hist-filter-row::-webkit-scrollbar { display: none !important; }

    /* Search + filtres en colonne */
    .hist-controls {
      flex-direction: column !important;
      gap: 10px !important;
    }

    .filter-pill {
      padding: 7px 14px !important;
      font-size: 12px !important;
    }

    /* Bouton réserver full width sur mobile */
    .rebook-btn {
      font-size: 11px !important;
      padding: 8px 12px !important;
    }

    /* Stars rating */
    .hist-stars {
      display: none !important;
    }

    /* Empty state */
    .hist-empty {
      padding: 48px 16px !important;
    }
  }

  /* Très petit mobile (< 380px) */
  @media (max-width: 380px) {
    .hist-card-photo-wrap {
      width: 90px !important;
      min-width: 90px !important;
    }
    .hist-info-grid {
      display: none !important;
    }
  }
`;

export default function HistoriqueClient({ reservations }: { reservations: HistEntry[] }) {
  const [filter, setFilter] = useState<"all" | HistoryType>("all");
  const [search, setSearch] = useState("");

  const filtered = reservations.filter(r => {
    const matchFilter = filter === "all" || r.history_type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.excursion?.title.toLowerCase().includes(q) ||
      r.excursion?.city.toLowerCase().includes(q) ||
      r.booking_code.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const stats = {
    total:     reservations.length,
    cancelled: reservations.filter(r => r.history_type === "cancelled").length,
    completed: reservations.filter(r => r.history_type === "completed").length,
    passed:    reservations.filter(r => r.history_type === "passed").length,
    spent:     reservations.filter(r => r.history_type !== "cancelled").reduce((s,r)=>s+r.total_price, 0),
  };

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#F8FAFF", minHeight:"100vh" }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom:"1px solid #EBEBEB", padding:"28px 40px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div
            className="hist-header-inner"
            style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16 }}
          >
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color:"#053366", margin:0 }}>
                  Historique
                </h1>
              </div>
              <p style={{ fontSize:13, color:"#9CA3AF", margin:0 }}>
                Vos excursions passées, annulées et terminées
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hist-content" style={{ maxWidth:1100, margin:"0 auto", padding:"32px 40px 80px" }}>

        {/* ── Search + Filtres ── */}
        <div className="hist-controls" style={{ display:"flex", gap:14, marginBottom:28, flexWrap:"wrap", alignItems:"center" }}>
          {/* Search */}
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <Search size={15} color="#9CA3AF" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
            <input
              className="search-input"
              type="text"
              placeholder="Rechercher par excursion, ville, code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", display:"flex" }}
              >
                ×
              </button>
            )}
          </div>

          {/* Filtres */}
          <div className="hist-filter-row" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {([
              { key:"all",       label:`Tout (${stats.total})` },
              { key:"completed", label:`Terminées (${stats.completed})` },
              { key:"passed",    label:`Passées (${stats.passed})` },
              { key:"cancelled", label:`Annulées (${stats.cancelled})` },
            ] as const).map(f => (
              <button
                key={f.key}
                className={`filter-pill ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty ── */}
        {reservations.length === 0 ? (
          <div className="hist-empty" style={{ textAlign:"center", padding:"80px 20px", background:"white", borderRadius:24, border:"1px solid #EBEBEB" }}>
            <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(2,175,207,.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
              <History size={32} color="#02AFCF" strokeWidth={1.5}/>
            </div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#053366", marginBottom:8 }}>
              Aucun historique
            </h3>
            <p style={{ fontSize:14, color:"#9CA3AF", marginBottom:24 }}>
              Vos excursions passées et annulées apparaîtront ici
            </p>
            <Link
              href="/excursions"
              style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"12px 24px", background:"linear-gradient(135deg,#02AFCF,#053366)", color:"white", borderRadius:14, textDecoration:"none", fontSize:14, fontWeight:700 }}
            >
              Explorer les excursions <ChevronRight size={15}/>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"56px 20px", background:"white", borderRadius:20, border:"1px solid #EBEBEB" }}>
            <Search size={28} color="#D1D5DB" style={{ marginBottom:12 }}/>
            <p style={{ fontSize:15, fontWeight:700, color:"#374151", marginBottom:6 }}>Aucun résultat</p>
            <p style={{ fontSize:13, color:"#9CA3AF" }}>Essayez d'autres termes ou filtres</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize:12, color:"#9CA3AF", fontWeight:600, marginBottom:18 }}>
              {filtered.length} entrée{filtered.length>1?"s":""} affichée{filtered.length>1?"s":""}
            </p>

            <div
              className="hist-grid"
              style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}
            >
              {filtered.map((r, i) => {
                const cfg   = TYPE_CONFIG[r.history_type];
                const photo = r.excursion?.photos?.[0] || FALLBACK;
                const exc   = r.excursion;
                return (
                  <div key={r.id} className="hist-card" style={{ animationDelay:`${i*.04}s` }}>

                    {/* Photo */}
                    <div
                      className="hist-card-photo-wrap"
                      style={{ position:"relative", height:190, overflow:"hidden", background:"#EEF2FF", flexShrink:0 }}
                    >
                      <img
                        src={photo}
                        alt={exc?.title || ""}
                        className="hist-photo"
                        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                      />
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(5,19,51,.6) 0%,transparent 55%)" }}/>

                      {/* Badge type */}
                      <div
                        className="badge-type"
                        style={{ position:"absolute", top:12, left:12, display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:20 }}
                      >
                        <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot, flexShrink:0 }}/>
                        <span style={{ fontSize:11, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                      </div>

                      {/* Booking code */}
                      <div
                        className="badge-code"
                        style={{ position:"absolute", top:12, right:12, padding:"4px 9px", background:"rgba(0,0,0,.55)", backdropFilter:"blur(6px)", borderRadius:20 }}
                      >
                        <span style={{ fontSize:10, fontWeight:700, color:"white", fontFamily:"monospace" }}>#{r.booking_code}</span>
                      </div>

                      {/* Title sur photo */}
                      <div style={{ position:"absolute", bottom:12, left:14, right:14 }}>
                        <p
                          className="hist-card-title"
                          style={{ fontSize:14, fontWeight:800, color:"white", margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                        >
                          {exc?.title || "Excursion"}
                        </p>
                        <span
                          className="hist-card-city"
                          style={{ fontSize:12, color:"rgba(255,255,255,.8)", display:"flex", alignItems:"center", gap:4 }}
                        >
                          <MapPin size={10}/> {exc?.city}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div
                      className="hist-card-body"
                      style={{ padding:"14px 16px", flex:1, display:"flex", flexDirection:"column", gap:10 }}
                    >
                      {/* Infos */}
                      <div
                        className="hist-info-grid"
                        style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}
                      >
                        {[
                          { Icon:CalendarDays, val:fmtShort(r.date) },
                          { Icon:Clock,        val:r.time || "—" },
                          { Icon:Users,        val:`${r.people_count} pers.` },
                          { Icon:Clock,        val:`${exc?.duration_hours || "—"}h` },
                        ].map(({ Icon, val }, j) => (
                          <div key={j} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#6B7280" }}>
                            <Icon size={11} color="#9CA3AF"/>
                            {val}
                          </div>
                        ))}
                      </div>

                      {/* Prix + status paiement */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #F3F4F6" }}>
                        <div>
                          <p
                            className="hist-price"
                            style={{ fontSize:18, fontWeight:900, color:"#053366", margin:0 }}
                          >
                            {r.total_price} <span style={{ fontSize:11, fontWeight:500, color:"#9CA3AF" }}>EUR</span>
                          </p>
                          {r.payment_status && (
                            <p style={{ fontSize:10, color: r.payment_status==="paid" ? "#059669" : "#9CA3AF", fontWeight:600, margin:0 }}>
                              {r.payment_status === "paid" ? "✓ Payée" : r.payment_status === "expired" ? "Expirée" : r.payment_status}
                            </p>
                          )}
                        </div>
                        {/* Note étoiles si terminée */}
                        {r.history_type === "completed" && (
                          <div className="hist-stars" style={{ display:"flex", gap:2 }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
                        {r.history_type !== "cancelled" ? (
                          <Link href={`/excursions`} className="rebook-btn" style={{ flex:1, justifyContent:"center" }}>
                            <RotateCcw size={12}/> Réserver à nouveau
                          </Link>
                        ) : (
                          <Link href={`/excursions`} className="rebook-btn" style={{ flex:1, justifyContent:"center", background:"#F3F4F6", color:"#374151" }}>
                            <RotateCcw size={12}/> Explorer d'autres excursions
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}