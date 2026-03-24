"use client";

import {
  TrendingUp, Map, CalendarClock, Star,
  Plus, CalendarDays, Clock, ArrowRight,
  CheckCircle2, BookOpen, Wallet,
} from "lucide-react";

type Props = {
  profile: Record<string, unknown> | null;
  excursions: Record<string, unknown>[];
  reservations: Record<string, unknown>[];
  paiements: Record<string, unknown>[];
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};
const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  pending:   { bg: "#FEF9C3", color: "#A16207",  dot: "#D97706" },
  confirmed: { bg: "#DCFCE7", color: "#15803D",  dot: "#22C55E" },
  completed: { bg: "#DCE5FF", color: "#259FFC",  dot: "#02AFCF" },
  cancelled: { bg: "#FEE2E2", color: "#DC2626",  dot: "#EF4444" },
};

export default function DashboardClient({ profile, excursions, reservations, paiements }: Props) {
  const revenue  = paiements?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0) || 0;
  const pending  = reservations?.filter(r => r.status === "pending").length || 0;
  const activeExc = excursions?.filter(e => e.is_active).length || 0;
  const avgRating = excursions.length
    ? (excursions.reduce((s, e) => s + (Number(e.rating) || 0), 0) / excursions.length).toFixed(1)
    : "—";
  const name = String(profile?.agency_name || profile?.full_name || "Prestataire");

  const stats = [
    { label: "Revenu total",      value: `${revenue} TND`, icon: <TrendingUp size={22} strokeWidth={1.8}/>, color: "#02AFCF", bg: "rgba(2,175,207,.1)",   border: "rgba(2,175,207,.2)"   },
    { label: "Excursions actives",value: activeExc,        icon: <Map size={22} strokeWidth={1.8}/>,        color: "#259FFC", bg: "rgba(37,159,252,.1)",  border: "rgba(37,159,252,.2)"  },
    { label: "En attente",        value: pending,          icon: <CalendarClock size={22} strokeWidth={1.8}/>, color: "#D97706", bg: "rgba(217,119,6,.1)", border: "rgba(217,119,6,.2)"   },
    { label: "Note moyenne",      value: avgRating,        icon: <Star size={22} strokeWidth={1.8}/>,       color: "#053366", bg: "rgba(5,51,102,.08)",   border: "rgba(5,51,102,.15)"   },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .dp-card { animation: fadeUp .35s ease both; }
        .dp-stat:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(5,51,102,.1) !important; transition: all .2s; }
        .dp-action { display:inline-flex; align-items:center; gap:8px; padding:11px 22px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; font-family:inherit; transition:all .2s; border:none; }
        .dp-action-primary { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; box-shadow:0 4px 16px rgba(2,175,207,.35); }
        .dp-action-primary:hover { box-shadow:0 6px 22px rgba(2,175,207,.5); transform:translateY(-2px); }
        .dp-action-secondary { background:white; color:#053366; border:1.5px solid #DCE5FF !important; }
        .dp-action-secondary:hover { background:#DCE5FF; }
        .dp-resa-row { display:flex; justify-content:space-between; align-items:center; padding:13px 16px; background:white; border-radius:12px; border:1px solid #EEF2FF; transition:all .15s; }
        .dp-resa-row:hover { background:#F8FAFF; border-color:#DCE5FF; }
        .dp-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
        .dp-actions { display:flex; gap:12px; margin-bottom:28px; flex-wrap:wrap; }
        .dp-resa-inner { display:flex; justify-content:space-between; align-items:center; }
        @media(max-width:900px) { .dp-stats { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px) {
          .dp-stats   { grid-template-columns:repeat(2,1fr); gap:10px; }
          .dp-actions { flex-direction:column; }
          .dp-actions .dp-action { justify-content:center; width:100%; }
          .dp-resa-inner { flex-direction:column; align-items:flex-start; gap:8px; }
          .dp-resa-badge { align-self:flex-end; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="dp-card" style={{ marginBottom: 32, animationDelay: "0s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-0.5px" }}>
              Bonjour, {name} 
            </h1>
            <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>Vue d&apos;ensemble de votre activité</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="dp-stats">
        {stats.map((s, i) => (
          <div key={s.label} className="dp-card dp-stat" style={{ background: "white", borderRadius: 16, border: `1px solid ${s.border}`, padding: "20px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 10px rgba(5,51,102,.05)", animationDelay: `${i * .07}s`, cursor: "default", transition: "all .2s" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: "#053366", lineHeight: 1 }}>{String(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div className="dp-card dp-actions" style={{ animationDelay: ".28s" }}>
        <a href="/prestataire/excursions/nouveau" className="dp-action dp-action-primary">
          <Plus size={16} /> Ajouter une excursion
        </a>
        <a href="/prestataire/reservations" className="dp-action dp-action-secondary" style={{ border: "1.5px solid #DCE5FF" }}>
          <CalendarDays size={16} /> Voir les réservations
        </a>
        <a href="/prestataire/paiements" className="dp-action dp-action-secondary" style={{ border: "1.5px solid #DCE5FF" }}>
          <Wallet size={16} /> Mes paiements
        </a>
      </div>

      {/* ── Alerte en attente ── */}
      {pending > 0 && (
        <div className="dp-card" style={{ marginBottom: 24, padding: "14px 18px", background: "linear-gradient(135deg,rgba(2,175,207,.07),rgba(37,159,252,.05))", border: "1px solid rgba(2,175,207,.25)", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", animationDelay: ".32s" }}>
          <p style={{ fontSize: 14, color: "#053366", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Clock size={16} color="#02AFCF" style={{ flexShrink: 0 }} />
            <span>Vous avez <strong style={{ color: "#02AFCF" }}>{pending} réservation(s)</strong> en attente de confirmation</span>
          </p>
          <a href="/prestataire/reservations" style={{ fontSize: 13, color: "#259FFC", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            Confirmer <ArrowRight size={14} />
          </a>
        </div>
      )}

      {/* ── Réservations récentes ── */}
      {reservations.length > 0 && (
        <div className="dp-card" style={{ background: "white", borderRadius: 20, border: "1px solid #EEF2FF", padding: "24px 24px", boxShadow: "0 2px 12px rgba(5,51,102,.06)", animationDelay: ".36s" }}>
          {/* Header section */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(2,175,207,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={14} color="#02AFCF" />
              </div>
              Réservations récentes
            </h2>
            <a href="/prestataire/reservations" style={{ fontSize: 13, color: "#259FFC", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              Voir tout <ArrowRight size={13} />
            </a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reservations.map((r) => {
              const exc    = r.excursion as Record<string, unknown> | null;
              const status = String(r.status);
              const ss     = STATUS_STYLE[status] || { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
              return (
                <div key={String(r.id)} className="dp-resa-row">
                  <div className="dp-resa-inner" style={{ width: "100%" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {exc?.title as string || "Excursion"}
                      </p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "monospace", color: "#02AFCF", fontWeight: 600 }}>#{String(r.booking_code)}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CalendarDays size={11} />{String(r.date)}</span>
                        <span>{Number(r.people_count)} pers.</span>
                      </p>
                    </div>
                    <div className="dp-resa-badge" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontWeight: 800, color: "#053366", fontSize: 14 }}>{Number(r.total_price)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span></span>
                      <span style={{ padding: "4px 12px", borderRadius: 20, background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                        {STATUS_LABEL[status] || status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reservations.length === 0 && (
        <div className="dp-card" style={{ textAlign: "center", padding: "48px 20px", background: "white", borderRadius: 20, border: "1px solid #EEF2FF", animationDelay: ".36s" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(2,175,207,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle2 size={28} color="#02AFCF" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#053366", marginBottom: 8 }}>Aucune réservation pour l&apos;instant</p>
          <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Publiez vos excursions pour commencer à recevoir des réservations</p>
          <a href="/prestataire/excursions/nouveau" className="dp-action dp-action-primary" style={{ display: "inline-flex" }}>
            <Plus size={16} /> Créer une excursion
          </a>
        </div>
      )}
    </div>
  );
}