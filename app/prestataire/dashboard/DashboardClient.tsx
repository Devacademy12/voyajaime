"use client";

import { useState } from "react";
import {
  TrendingUp, Map, CalendarClock, Star,
  Plus, CalendarDays, Clock, ArrowRight,
  CheckCircle2, BookOpen, Wallet, Eye,
  ChevronLeft, ChevronRight,
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

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Calendrier compact ──────────────────────────────────────────────────────
function ReservationCalendar({ reservations }: { reservations: Record<string, unknown>[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth   = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth       = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++)       days.push(new Date(year, month, i));

  const getReservationsForDate = (date: Date) => {
    const dateStr = toLocalDateStr(date);
    return reservations.filter(r => String(r.date).split("T")[0] === dateStr);
  };

  const getDayStatus = (date: Date) => {
    const dr = getReservationsForDate(date);
    if (!dr.length) return null;
    if (dr.some(r => r.status === "pending"))   return "pending";
    if (dr.some(r => r.status === "confirmed")) return "confirmed";
    if (dr.some(r => r.status === "completed")) return "completed";
    return "default";
  };

  const monthNames = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const dayNames   = ["D","L","M","M","J","V","S"];

  const statusColors = {
    pending:   { bg: "#FEF3C7", color: "#D97706" },
    confirmed: { bg: "#DCFCE7", color: "#15803D" },
    completed: { bg: "#DCE5FF", color: "#259FFC" },
    default:   { bg: "#F3F4F6", color: "#9CA3AF" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      {/* Nav mois */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#053366" }}>
          {monthNames[month]} {year}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid #E5E7EB", background: "white", cursor: "pointer" }}>
            <ChevronLeft size={13} />
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid #E5E7EB", background: "white", cursor: "pointer" }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Jours noms */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {dayNames.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#9CA3AF" }}>{d}</div>
        ))}
      </div>

      {/* Grille jours */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, flex: 1 }}>
        {days.map((date, idx) => {
          if (!date) return <div key={`e-${idx}`} style={{ background: "#F9FAFB", borderRadius: 6 }} />;
          const status    = getDayStatus(date);
          const localStr  = toLocalDateStr(date);
          const isSelected = selectedDate === localStr;
          const sc = status ? statusColors[status as keyof typeof statusColors] : null;
          return (
            <div key={localStr}
              onClick={() => setSelectedDate(isSelected ? null : localStr)}
              style={{
                aspectRatio: "1",
                background: isSelected ? "rgba(2,175,207,.12)" : sc?.bg || "white",
                borderRadius: 6,
                border: isSelected ? "1.5px solid #02AFCF" : `1px solid ${sc?.color || "#E5E7EB"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all .12s", position: "relative",
              }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: sc?.color || "#374151" }}>
                {date.getDate()}
              </span>
              {sc && (
                <span style={{ position: "absolute", bottom: 2, right: 2,
                  width: 4, height: 4, borderRadius: "50%", background: sc.color }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, paddingTop: 8, borderTop: "1px solid #F3F4F6", flexWrap: "wrap" }}>
        {[
          { bg: "#DCFCE7", border: "#15803D", label: "Confirmé" },
          { bg: "#FEF3C7", border: "#D97706", label: "Attente" },
          { bg: "#DCE5FF", border: "#259FFC", label: "Terminé" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.bg, border: `1px solid ${item.border}` }} />
            <span style={{ fontSize: 10, color: "#6B7280" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Détail sélection */}
      {selectedDate && (() => {
        const detailDate = new Date(selectedDate + "T12:00:00");
        const detailRes  = getReservationsForDate(detailDate);
        return (
          <div style={{ padding: 10, background: "#F8FAFF", borderRadius: 10, maxHeight: 120, overflowY: "auto" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#053366", marginBottom: 6 }}>
              {detailDate.toLocaleDateString("fr-FR")}
            </p>
            {!detailRes.length && <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Aucune réservation.</p>}
            {detailRes.map(r => {
              const exc = r.excursion as Record<string, unknown> | null;
              const ss  = STATUS_STYLE[String(r.status)] || { bg: "#F3F4F6", color: "#6B7280" };
              return (
                <div key={String(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 8px", background: "white", borderRadius: 8, marginBottom: 4 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#053366", margin: 0 }}>{exc?.title as string || "Excursion"}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0 }}>#{String(r.booking_code)} · {Number(r.people_count)} pers.</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ss.color, background: ss.bg, padding: "2px 6px", borderRadius: 8 }}>
                    {STATUS_LABEL[String(r.status)] || String(r.status)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Graphique notes compact ─────────────────────────────────────────────────
function ExcursionRatingsChart({ excursions }: { excursions: Record<string, unknown>[] }) {
  const sorted = [...excursions].sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 5);

  const globalAvg  = excursions.length
    ? (excursions.reduce((s, e) => s + (Number(e.rating) || 0), 0) / excursions.length).toFixed(1)
    : "—";
  const totalReviews = excursions.reduce((s, e) => s + (Number(e.reviews_count) || 0), 0);
  const activeCount  = excursions.filter(e => e.is_active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      {/* Métriques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {[
          { label: "Note", value: `${globalAvg} ★`, color: "#7F77DD" },
          { label: "Avis",  value: String(totalReviews),  color: "#053366" },
          { label: "Actives", value: `${activeCount}/${excursions.length}`, color: "#053366" },
        ].map(s => (
          <div key={s.label} style={{ background: "#F8FAFF", borderRadius: 8, padding: "8px 10px" }}>
            <p style={{ fontSize: 10, color: "#9CA3AF", margin: "0 0 2px" }}>{s.label}</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Barres */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
        {sorted.length === 0
          ? <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>Aucune excursion.</p>
          : sorted.map((exc) => {
              const rating   = Number(exc.rating) || 0;
              const isActive = Boolean(exc.is_active);
              const color    = isActive ? "#7F77DD" : "#AFA9EC";
              const title    = String(exc.title);
              return (
                <div key={String(exc.id)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: isActive ? "#053366" : "#9CA3AF",
                    fontWeight: isActive ? 600 : 400, width: 100, flexShrink: 0,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {title}
                  </span>
                  <div style={{ flex: 1, height: 10, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${(rating / 5) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, width: 32, textAlign: "right", flexShrink: 0 }}>
                    {rating.toFixed(1)}★
                  </span>
                </div>
              );
            })
        }
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: 12, paddingTop: 8, borderTop: "1px solid #F3F4F6" }}>
        {[{ color: "#7F77DD", label: "Active" }, { color: "#AFA9EC", label: "Inactive" }].map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B7280" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: "inline-block" }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Reset box-sizing */
  .pw *, .pw *::before, .pw *::after { box-sizing: border-box; }

  /* ── Layout racine : pleine hauteur, pas de scroll ── */
  .pw {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #F5F7FA;
    /* Prend toute la hauteur disponible dans la page */
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 16px 20px;
    gap: 12px;
    width: 100%;
  }

  /* ── Header ── */
  .pw-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 12px;
    animation: fadeUp .3s ease both;
    flex-wrap: wrap;
  }
  .pw-header-title {
    font-size: clamp(18px, 3vw, 24px);
    font-weight: 800;
    color: #053366;
    line-height: 1;
    letter-spacing: -.02em;
    margin: 0;
  }

  /* ── Quick Actions ── */
  .pw-btn-group {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    flex-wrap: wrap;
    animation: fadeUp .35s ease both;
  }
  .pw-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 10px;
    font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all .2s; border: none;
    font-family: inherit; text-decoration: none; white-space: nowrap;
  }
  .pw-btn-primary  { background: #053366; color: #fff; }
  .pw-btn-primary:hover  { background: #042952; }
  .pw-btn-secondary { background: #fff; color: #053366; border: 1.5px solid #E2E8F0; }
  .pw-btn-secondary:hover { background: #F8FAFC; }

  /* ── Stats row ── */
  .pw-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex-shrink: 0;
    animation: fadeUp .4s ease both;
  }
  .pw-metric {
    background: #fff; border-radius: 12px; border: 1.5px solid #E2E8F0;
    padding: 12px 14px;
    transition: box-shadow .2s, transform .2s;
  }
  .pw-metric:hover { box-shadow: 0 4px 12px rgba(5,51,102,.07); transform: translateY(-1px); }
  .pw-metric-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .pw-metric-icon {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .pw-metric-trend { font-size: 9px; font-weight: 700; color: #2B96A8; background: #EFF9FB; border-radius: 5px; padding: 2px 5px; }
  .pw-metric-num { font-size: clamp(18px, 2.5vw, 22px); font-weight: 800; color: #053366; line-height: 1; letter-spacing: -.02em; }
  .pw-metric-lbl { font-size: 9px; color: #94A3B8; margin-top: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

  /* ── Main grid (charts + calendrier) ── */
  .pw-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    flex: 1;
    min-height: 0;          /* crucial : permet au flex child de rétrécir */
    animation: fadeUp .45s ease both;
  }
  .pw-panel {
    background: #fff;
    border-radius: 14px;
    border: 1.5px solid #E2E8F0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;       /* contenu débordant caché, pas de scroll */
    min-height: 0;
  }
  .pw-panel-title {
    font-size: 13px; font-weight: 800; color: #053366;
    display: flex; align-items: center; gap: 6px;
    margin: 0 0 12px; flex-shrink: 0;
  }
  .pw-panel-icon {
    width: 24px; height: 24px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .pw-panel-body { flex: 1; min-height: 0; overflow: hidden; }

  /* ── Empty state ── */
  .pw-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; text-align: center; gap: 12px;
  }

  /* ─── RESPONSIVE ───────────────────────────────────────────────────────── */

  /* Tablette : 2 stats par ligne */
  @media (max-width: 900px) {
    .pw-metrics { grid-template-columns: repeat(2, 1fr); }
    .pw-main    { grid-template-columns: 1fr; }
    /* Sur mobile, on autorise un léger scroll UNIQUEMENT dans la zone main */
    .pw         { overflow-y: auto; height: auto; min-height: 100dvh; }
    .pw-main    { flex: none; }
    .pw-panel   { min-height: 320px; }
  }

  /* Mobile : header compact */
  @media (max-width: 600px) {
    .pw { padding: 12px 12px; gap: 10px; }
    .pw-btn-group { gap: 6px; }
    .pw-btn { padding: 7px 10px; font-size: 11px; }
    /* Masquer le label des boutons secondaires sur très petit écran */
    .pw-btn-label-hide { display: none; }
    .pw-metrics { gap: 6px; }
    .pw-metric  { padding: 10px 10px; }
    .pw-main    { gap: 10px; }
    .pw-panel   { padding: 12px; min-height: 280px; }
  }
`;

// ─── Composant principal ─────────────────────────────────────────────────────
export default function DashboardClient({ profile, excursions, reservations, paiements }: Props) {
  const pending    = reservations?.filter(r => r.status === "pending").length || 0;
  const avgRating  = excursions.length
    ? (excursions.reduce((s, e) => s + (Number(e.rating) || 0), 0) / excursions.length).toFixed(1)
    : "—";
  const totalReservations = reservations.length;
  const completionRate    = totalReservations > 0
    ? Math.round((reservations.filter(r => r.status === "completed").length / totalReservations) * 100)
    : 0;

  const stats = [
    { label: "Réservations", value: totalReservations, trend: "+12%", icon: <BookOpen size={15}/>, color: "#053366", bg: "#EFF6FF" },
    { label: "Complétion",   value: `${completionRate}%`, trend: "+5%", icon: <CheckCircle2 size={15}/>, color: "#059669", bg: "#ECFDF5" },
    { label: "En attente",   value: pending, trend: pending > 0 ? "Action" : "OK", icon: <Clock size={15}/>, color: "#D97706", bg: "#FFFBEB" },
    { label: "Note moy.",    value: avgRating, trend: "★", icon: <Star size={15}/>, color: "#7C3AED", bg: "#F5F3FF" },
  ];

  return (
    <div className="pw">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <header className="pw-header">
        <h1 className="pw-header-title">Tableau de bord</h1>
        <div className="pw-btn-group">
          <a href="/prestataire/excursions/nouveau" className="pw-btn pw-btn-primary">
            <Plus size={13} />
            <span className="pw-btn-label-hide">Nouvelle excursion</span>
            <span className="pw-btn-label-show" style={{ display: "none" }}>Nouveau</span>
          </a>
          <a href="/prestataire/paiements-reservations" className="pw-btn pw-btn-secondary">
            <CalendarDays size={13} />
            <span className="pw-btn-label-hide">Calendrier</span>
          </a>
          <a href="/prestataire/messages" className="pw-btn pw-btn-secondary">
            <Eye size={13} />
            <span className="pw-btn-label-hide">Messages</span>
          </a>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="pw-metrics">
        {stats.map((s) => (
          <div key={s.label} className="pw-metric">
            <div className="pw-metric-top">
              <div className="pw-metric-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="pw-metric-trend">{s.trend}</div>
            </div>
            <div className="pw-metric-num">{s.value}</div>
            <div className="pw-metric-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Panneaux principaux ── */}
      {reservations.length === 0 ? (
        <div className="pw-panel" style={{ flex: 1 }}>
          <div className="pw-empty">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EFF9FB",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarClock size={24} color="#2B96A8" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: "0 0 6px" }}>
                C'est bien calme ici...
              </h3>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px", maxWidth: 340 }}>
                Dès que vous recevrez vos premières réservations, elles apparaîtront ici.
              </p>
              <a href="/prestataire/excursions/nouveau" className="pw-btn pw-btn-primary">
                Publier une excursion
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="pw-main">
          {/* Panneau graphique */}
          <div className="pw-panel">
            <p className="pw-panel-title">
              <span className="pw-panel-icon" style={{ background: "rgba(139,92,246,.12)" }}>
                <Star size={13} color="#7F77DD" />
              </span>
              Notes par excursion
            </p>
            <div className="pw-panel-body">
              <ExcursionRatingsChart excursions={excursions} />
            </div>
          </div>

          {/* Panneau calendrier */}
          <div className="pw-panel">
            <p className="pw-panel-title">
              <span className="pw-panel-icon" style={{ background: "#EFF9FB" }}>
                <CalendarDays size={13} color="#02AFCF" />
              </span>
              Calendrier des réservations
            </p>
            <div className="pw-panel-body">
              <ReservationCalendar reservations={reservations} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}