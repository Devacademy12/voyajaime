"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  CalendarDays, Users, User, CheckCircle2, XCircle,
  CheckCheck, Loader2, CalendarX, Clock, MapPin,
  Banknote, Search,
} from "lucide-react";

interface ResRow {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  touriste_name: string;
  excursion_title: string;
  excursion_city: string;
}

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string; Icon: React.ElementType }> = {
  pending:   { label: "En attente", color: "#A16207", bg: "#FEF9C3", dot: "#D97706", Icon: Clock        },
  confirmed: { label: "Confirmée",  color: "#15803D", bg: "#DCFCE7", dot: "#22C55E", Icon: CheckCircle2 },
  completed: { label: "Terminée",   color: "#259FFC", bg: "#DCE5FF", dot: "#02AFCF", Icon: CheckCheck   },
  cancelled: { label: "Annulée",    color: "#DC2626", bg: "#FEE2E2", dot: "#EF4444", Icon: XCircle      },
};

type FilterKey = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const TABS: { key: FilterKey; label: string; Icon: React.ElementType }[] = [
  { key: "pending",   label: "En attente", Icon: Clock        },
  { key: "confirmed", label: "Confirmées", Icon: CheckCircle2 },
  { key: "completed", label: "Terminées",  Icon: CheckCheck   },
  { key: "cancelled", label: "Annulées",   Icon: XCircle      },
  { key: "all",       label: "Toutes",     Icon: CalendarDays },
];

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function ReservationsClient({ reservations: initial }: { reservations: ResRow[] }) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(initial);
  const [loading,      setLoading]      = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter,       setFilter]       = useState<FilterKey>("pending");
  const [search,       setSearch]       = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (!error) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast(
        status === "confirmed" ? "Réservation confirmée ✓" :
        status === "completed" ? "Réservation terminée ✓"  : "Réservation annulée",
        status !== "cancelled"
      );
    } else {
      showToast("Erreur lors de la mise à jour", false);
    }
    setLoading(null);
  };

  const counts: Record<string, number> = { all: reservations.length };
  reservations.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });

  const filtered = reservations.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.booking_code.toLowerCase().includes(q)    ||
        r.touriste_name.toLowerCase().includes(q)   ||
        r.excursion_title.toLowerCase().includes(q) ||
        r.excursion_city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ── Empty state global ── */
  if (reservations.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"70px 20px", background:"white", borderRadius:20, border:"1px solid #EEF2FF", boxShadow:"0 2px 12px rgba(5,51,102,.05)" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(2,175,207,.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <CalendarX size={32} color="#02AFCF" strokeWidth={1.5}/>
        </div>
        <p style={{ fontSize:16, fontWeight:700, color:"#053366", marginBottom:8 }}>Aucune réservation</p>
        <p style={{ fontSize:14, color:"#9CA3AF" }}>Publiez des excursions pour commencer à recevoir des réservations</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rr-row { display:flex; justify-content:space-between; align-items:center; padding:18px 20px; gap:16px; background:white; border-radius:14px; border:1px solid #EEF2FF; margin-bottom:10px; transition:all .15s; animation:fadeUp .3s ease both; }
        .rr-row:hover { background:#F8FAFF; border-color:#DCE5FF; box-shadow:0 4px 16px rgba(5,51,102,.06); }
        .rr-search { width:100%; padding:10px 14px 10px 38px; border:1.5px solid #DCE5FF; border-radius:12px; font-size:13px; font-family:inherit; outline:none; color:#053366; background:white; transition:border .2s; }
        .rr-search:focus { border-color:#02AFCF; box-shadow:0 0 0 3px rgba(2,175,207,.1); }
        .rr-tab { display:flex; align-items:center; gap:5px; padding:7px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .18s; white-space:nowrap; }
        .rr-tab.on  { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; border:none; box-shadow:0 3px 10px rgba(2,175,207,.35); }
        .rr-tab:not(.on) { background:white; color:#053366; border:1.5px solid #DCE5FF; }
        .rr-btn-confirm { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:10px; border:none; background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 2px 8px rgba(2,175,207,.3); transition:all .15s; }
        .rr-btn-confirm:hover { box-shadow:0 4px 14px rgba(2,175,207,.45); transform:translateY(-1px); }
        .rr-btn-cancel  { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:10px; border:none; background:#FEE2E2; color:#DC2626; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
        .rr-btn-cancel:hover { background:#FECACA; }
        .rr-btn-done   { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:10px; border:1.5px solid #DCE5FF; background:white; color:#053366; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
        .rr-btn-done:hover { background:#DCE5FF; }
        @media(max-width:600px){
          .rr-row { flex-direction:column; align-items:flex-start; }
          .rr-actions { align-self:flex-end; }
          .rr-amounts { text-align:left !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:100, display:"flex", alignItems:"center", gap:8, padding:"13px 18px", borderRadius:12, fontSize:13, fontWeight:600, background:toast.ok?"#DCFCE7":"#FEE2E2", color:toast.ok?"#15803D":"#DC2626", border:`1px solid ${toast.ok?"#86EFAC":"#FCA5A5"}`, boxShadow:"0 4px 16px rgba(0,0,0,.1)", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
          {toast.ok ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #EEF2FF", padding:"14px 16px", marginBottom:20, boxShadow:"0 2px 8px rgba(5,51,102,.05)" }}>
        {/* Search */}
        <div style={{ position:"relative", marginBottom:12 }}>
          <Search size={15} color="#9CA3AF" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
          <input className="rr-search" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher voyageur, excursion, code..."/>
        </div>
        {/* Tabs */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {TABS.map(tab => {
            const count  = counts[tab.key] ?? 0;
            const active = filter === tab.key;
            if (tab.key !== "all" && count === 0) return null;
            return (
              <button key={tab.key} className={`rr-tab ${active ? "on" : ""}`} onClick={() => setFilter(tab.key)}>
                <tab.Icon size={12} strokeWidth={2}/> {tab.label}
                <span style={{ padding:"1px 7px", borderRadius:20, fontSize:11, background:active?"rgba(255,255,255,.25)":"rgba(5,51,102,.07)", color:active?"white":"#053366" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty filtered */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:48, background:"white", borderRadius:16, border:"1px solid #EEF2FF" }}>
          <Search size={28} color="#DCE5FF" style={{ margin:"0 auto 12px", display:"block" }}/>
          <p style={{ fontWeight:700, color:"#053366", marginBottom:4 }}>Aucun résultat</p>
          <p style={{ fontSize:13, color:"#9CA3AF", marginBottom:14 }}>
            {search ? `Aucune réservation pour « ${search} »` : "Aucune réservation dans cette catégorie"}
          </p>
          {(search || filter !== "all") && (
            <button onClick={() => { setSearch(""); setFilter("all"); }}
              style={{ padding:"8px 18px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", border:"none", borderRadius:10, fontSize:13, fontWeight:600, color:"white", cursor:"pointer", fontFamily:"inherit" }}>
              Réinitialiser
            </button>
          )}
        </div>
      ) : filtered.map((r, i) => {
        const s = STATUS[r.status] ?? STATUS.pending;
        const isLoading = loading === r.id;
        const net = r.total_price - r.platform_fee;

        return (
          <div key={r.id} className="rr-row" style={{ animationDelay:`${i * .04}s`, borderLeft:`4px solid ${s.dot}` }}>

            {/* Infos principale */}
            <div style={{ flex:1, minWidth:0 }}>
              {/* Ligne 1 : badge + code */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7, flexWrap:"wrap" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:s.bg, color:s.color }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>
                  {s.label}
                </span>
                <span style={{ fontSize:11, fontFamily:"monospace", color:"#02AFCF", fontWeight:700, background:"rgba(2,175,207,.08)", padding:"2px 8px", borderRadius:8 }}>
                  #{r.booking_code}
                </span>
              </div>

              {/* Ligne 2 : titre excursion */}
              <p style={{ fontSize:15, fontWeight:800, color:"#053366", marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {r.excursion_title}
              </p>

              {/* Ligne 3 : meta */}
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                  <User size={12} color="#9CA3AF"/> {r.touriste_name}
                </span>
                {r.excursion_city && (
                  <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                    <MapPin size={12} color="#9CA3AF"/> {r.excursion_city}
                  </span>
                )}
                <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                  <CalendarDays size={12} color="#9CA3AF"/> {fmtDate(r.date)} {r.time && `à ${r.time}`}
                </span>
                <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                  <Users size={12} color="#9CA3AF"/> {r.people_count} pers.
                </span>
              </div>
            </div>

            {/* Montant + Actions */}
            <div className="rr-actions" style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
              <div className="rr-amounts" style={{ textAlign:"right" }}>
                <p style={{ fontSize:17, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>
                  {r.total_price} <span style={{ fontSize:11, fontWeight:500, color:"#9CA3AF" }}>TND</span>
                </p>
                <p style={{ fontSize:11, color:"#02AFCF", fontWeight:600, marginTop:4, display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end" }}>
                  <Banknote size={11} color="#02AFCF"/> Net : {net} TND
                </p>
              </div>

              {r.status === "pending" && (
                <div style={{ display:"flex", gap:6 }}>
                  <button className="rr-btn-confirm" onClick={() => updateStatus(r.id, "confirmed")} disabled={isLoading}>
                    {isLoading ? <Loader2 size={13} style={{ animation:"spin .6s linear infinite" }}/> : <CheckCircle2 size={13}/>}
                    Confirmer
                  </button>
                  <button className="rr-btn-cancel" onClick={() => updateStatus(r.id, "cancelled")} disabled={isLoading}>
                    <XCircle size={13}/> Annuler
                  </button>
                </div>
              )}

              {r.status === "confirmed" && (
                <button className="rr-btn-done" onClick={() => updateStatus(r.id, "completed")} disabled={isLoading}>
                  {isLoading ? <Loader2 size={13} style={{ animation:"spin .6s linear infinite" }}/> : <CheckCheck size={13}/>}
                  Terminer
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}