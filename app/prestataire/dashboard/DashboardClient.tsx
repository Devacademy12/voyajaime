// app/prestataire/dashboard/page.tsx
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

// ─── FIX 1 : helper qui évite tout décalage de fuseau horaire ────────────────
// new Date("2025-06-10").toISOString() renvoie "2025-06-09T22:00:00Z" en UTC+2
// On extrait la partie date directement depuis la chaîne pour éviter ce bug.
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}



// ─── Composant Calendrier ────────────────────────────────────────────────────
function ReservationCalendar({ reservations }: { reservations: Record<string, unknown>[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth  = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();   // 0=dim, 1=lun, …
  const daysInMonth       = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++)       days.push(new Date(year, month, i));

  // FIX : comparaison purement locale, sans passer par UTC
  const getReservationsForDate = (date: Date) => {
    const dateStr = toLocalDateStr(date);
    return reservations.filter(r => {
      const rDateStr = String(r.date).split("T")[0];   // "2025-06-10" direct
      return rDateStr === dateStr;
    });
  };

  const getDayStatus = (date: Date) => {
    const dayReservations = getReservationsForDate(date);
    if (dayReservations.length === 0) return null;
    if (dayReservations.some(r => r.status === "pending"))   return "pending";
    if (dayReservations.some(r => r.status === "confirmed")) return "confirmed";
    if (dayReservations.some(r => r.status === "completed")) return "completed";
    return "default";
  };

  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const dayNames   = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

  const statusColors = {
    pending:   { bg: "#FEF3C7", color: "#D97706" },
    confirmed: { bg: "#DCFCE7", color: "#15803D" },
    completed: { bg: "#DCE5FF", color: "#259FFC" },
    default:   { bg: "#F3F4F6", color: "#9CA3AF" },
  };

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #EBEBEB", padding: 24 }}>
      {/* Entête navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={20} color="#02AFCF" />
          Calendrier des réservations
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", cursor: "pointer" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#053366", padding: "0 12px" }}>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", cursor: "pointer" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Noms des jours */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
        {dayNames.map(day => (
          <div key={day} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#9CA3AF", padding: "8px 0" }}>
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} style={{ aspectRatio: "1", background: "#F9FAFB", borderRadius: 12 }} />;
          }

          const dayReservations = getReservationsForDate(date);
          const status          = getDayStatus(date);
          // FIX : on utilise toLocalDateStr pour éviter le décalage UTC
          const localStr  = toLocalDateStr(date);
          const isSelected = selectedDate === localStr;

          return (
            <div
              key={localStr}
              onClick={() => setSelectedDate(isSelected ? null : localStr)}
              style={{
                aspectRatio: "1",
                background: isSelected
                  ? "rgba(2,175,207,.1)"
                  : status ? statusColors[status as keyof typeof statusColors].bg : "white",
                borderRadius: 12,
                border: isSelected
                  ? "2px solid #02AFCF"
                  : `1px solid ${status ? statusColors[status as keyof typeof statusColors].color : "#E5E7EB"}`,
                padding: 8,
                cursor: "pointer",
                transition: "all .15s",
                position: "relative",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: status ? statusColors[status as keyof typeof statusColors].color : "#374151" }}>
                {date.getDate()}
              </div>
              {dayReservations.length > 0 && (
                <div style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: statusColors[status as keyof typeof statusColors].color,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
        {[
          { bg: "#DCFCE7", border: "#15803D", label: "Confirmé" },
          { bg: "#FEF3C7", border: "#D97706", label: "En attente" },
          { bg: "#DCE5FF", border: "#259FFC", label: "Terminé" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.bg, border: `1px solid ${item.border}` }} />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Détail du jour sélectionné */}
      {selectedDate && (() => {
        // FIX : on crée la date en midi local pour éviter tout décalage
        const detailDate = new Date(selectedDate + "T12:00:00");
        const detailReservations = getReservationsForDate(detailDate);
        return (
          <div style={{ marginTop: 20, padding: 16, background: "#F8FAFF", borderRadius: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", marginBottom: 12 }}>
              Réservations du {detailDate.toLocaleDateString("fr-FR")}
            </p>
            {detailReservations.length === 0 && (
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Aucune réservation ce jour.</p>
            )}
            {detailReservations.map(r => {
              const exc    = r.excursion as Record<string, unknown> | null;
              const status = String(r.status);
              const ss     = STATUS_STYLE[status] || { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
              return (
                <div key={String(r.id)} style={{ padding: "10px 12px", background: "white", borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0 }}>
                        {exc?.title as string || "Excursion"}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
                        #{String(r.booking_code)} • {Number(r.people_count)} pers.
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ss.color, background: ss.bg, padding: "2px 8px", borderRadius: 12 }}>
                      {STATUS_LABEL[status] || status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
// ─── Composant graphique notes excursions (SVG pur, sans dépendance) ─────────
function ExcursionRatingsChart({ excursions }: { excursions: Record<string, unknown>[] }) {
  const sorted = [...excursions].sort((a, b) => Number(b.rating) - Number(a.rating));

  const globalAvg = excursions.length
    ? (excursions.reduce((s, e) => s + (Number(e.rating) || 0), 0) / excursions.length).toFixed(1)
    : "—";
  const totalReviews = excursions.reduce((s, e) => s + (Number(e.reviews_count) || 0), 0);
  const activeCount  = excursions.filter(e => e.is_active).length;
  const maxReviews   = Math.max(...excursions.map(e => Number(e.reviews_count) || 0), 1);

  const ROW_H    = 44;
  const LABEL_W  = 180;
  const BAR_AREA = 340;
  const PAD_TOP  = 32;
  const PAD_BOT  = 24;
  const svgH     = PAD_TOP + sorted.length * ROW_H + PAD_BOT;

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #EBEBEB", padding: 24 }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(139,92,246,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={14} color="#7F77DD" />
          </div>
          Notes par excursion
        </h2>
      </div>

      {/* Métriques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Note globale",  value: `${globalAvg} ★`, color: "#7F77DD" },
          { label: "Total avis",    value: String(totalReviews),   color: "#053366" },
          { label: "Actives",       value: `${activeCount} / ${excursions.length}`, color: "#053366" },
        ].map(s => (
          <div key={s.label} style={{ background: "#F8FAFF", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 2px" }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Graphique SVG */}
      {sorted.length === 0 ? (
        <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Aucune excursion.</p>
      ) : (
        <svg
          width="100%"
          viewBox={`0 0 ${LABEL_W + BAR_AREA + 80} ${svgH}`}
          style={{ overflow: "visible" }}
        >
          {/* Lignes de grille verticales pour 1★ à 5★ */}
          {[1, 2, 3, 4, 5].map(n => {
            const x = LABEL_W + (n / 5) * BAR_AREA;
            return (
              <g key={n}>
                <line
                  x1={x} y1={PAD_TOP - 12}
                  x2={x} y2={svgH - PAD_BOT}
                  stroke="#F3F4F6" strokeWidth={1}
                />
                <text x={x} y={PAD_TOP - 16} textAnchor="middle" fontSize={10} fill="#D1D5DB">
                  {"★".repeat(n)}
                </text>
              </g>
            );
          })}

          {/* Ligne de base */}
          <line
            x1={LABEL_W} y1={PAD_TOP - 12}
            x2={LABEL_W} y2={svgH - PAD_BOT}
            stroke="#E5E7EB" strokeWidth={1}
          />

          {/* Lignes des excursions */}
          {sorted.map((exc, i) => {
            const rating    = Number(exc.rating) || 0;
            const reviews   = Number(exc.reviews_count) || 0;
            const isActive  = Boolean(exc.is_active);
            const barColor  = isActive ? "#7F77DD" : "#AFA9EC";
            const barW      = (rating / 5) * BAR_AREA;
            const reviewW   = (reviews / maxReviews) * BAR_AREA;
            const y         = PAD_TOP + i * ROW_H;
            const barY      = y + 6;
            const barH      = 14;
            const reviewY   = y + 24;
            const reviewH   = 8;
            const title     = String(exc.title);

            return (
              <g key={String(exc.id || i)}>
                {/* Nom de l'excursion */}
                <text
                  x={LABEL_W - 10}
                  y={barY + barH / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={isActive ? 600 : 400}
                  fill={isActive ? "#053366" : "#9CA3AF"}
                >
                  {title.length > 22 ? title.slice(0, 21) + "…" : title}
                </text>

                {/* Barre de fond (max) */}
                <rect
                  x={LABEL_W} y={barY}
                  width={BAR_AREA} height={barH}
                  rx={4} fill="#F3F4F6"
                />

                {/* Barre de note */}
                <rect
                  x={LABEL_W} y={barY}
                  width={barW} height={barH}
                  rx={4} fill={barColor}
                />

                {/* Barre avis (fond) */}
                <rect
                  x={LABEL_W} y={reviewY}
                  width={BAR_AREA} height={reviewH}
                  rx={3} fill="#F3F4F6"
                />

                {/* Barre avis (valeur) */}
                <rect
                  x={LABEL_W} y={reviewY}
                  width={reviewW} height={reviewH}
                  rx={3} fill={isActive ? "#D4B8FD" : "#E5E7EB"}
                />

                {/* Note à droite */}
                <text
                  x={LABEL_W + barW + 7}
                  y={barY + barH / 2}
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={700}
                  fill={barColor}
                >
                  {rating.toFixed(1)} ★
                </text>

                {/* Nb avis à droite */}
                <text
                  x={LABEL_W + reviewW + 7}
                  y={reviewY + reviewH / 2}
                  dominantBaseline="central"
                  fontSize={10}
                  fill="#9CA3AF"
                >
                  {reviews} avis
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* Légende */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 12, borderTop: "1px solid #F3F4F6", flexWrap: "wrap" }}>
        {[
          { color: "#7F77DD", label: "Note — excursion active"   },
          { color: "#AFA9EC", label: "Note — excursion inactive" },
          { color: "#D4B8FD", label: "Volume d'avis"             },
        ].map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7280" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
/* ─── CSS ───────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pw {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #F5F7FA;
    min-height: 100vh;
    padding: 28px 36px 64px;
    width: 100%;
  }

  /* ── Header ── */
  .pw-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    animation: fadeUp .35s ease both;
    flex-wrap: wrap;
  }
  .pw-header-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: #EFF9FB; border: 1px solid rgba(43,150,168,.22);
    border-radius: 20px; padding: 4px 12px;
    font-size: 11px; font-weight: 700; color: #2B96A8;
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 10px;
  }
  .pw-header-title {
    font-size: clamp(22px, 4vw, 30px); font-weight: 800;
    color: #053366; line-height: 1.1; letter-spacing: -.02em;
  }
  .pw-header-sub {
    font-size: 13px; color: #94A3B8; margin-top: 5px; font-weight: 500;
  }
  .pw-header-badge {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
    padding: 10px 16px; flex-shrink: 0; align-self: flex-start;
  }
  .pw-header-badge-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #053366, #2B96A8);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #fff;
  }
  .pw-header-badge-name {
    font-size: 13px; font-weight: 700; color: #053366;
  }
  .pw-header-badge-role {
    font-size: 11px; color: #94A3B8; font-weight: 500;
  }

  /* ── Metrics grid ── */
  .pw-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px; margin-bottom: 24px;
    animation: fadeUp .4s ease both;
  }
  .pw-metric {
    background: #fff; border-radius: 16px; border: 1.5px solid #E2E8F0;
    padding: 18px 20px;
    transition: box-shadow .2s, transform .2s; cursor: default;
  }
  .pw-metric:hover { box-shadow: 0 6px 20px rgba(5,51,102,.07); transform: translateY(-2px); }
  .pw-metric-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .pw-metric-icon {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .pw-metric-trend {
    font-size: 10px; font-weight: 700; color: #2B96A8;
    background: #EFF9FB; border-radius: 6px; padding: 2px 6px;
  }
  .pw-metric-num { font-size: 24px; font-weight: 800; color: #053366; line-height: 1; letter-spacing: -.02em; }
  .pw-metric-lbl { font-size: 11px; color: #94A3B8; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

  /* ── Cards ── */
  .pw-card {
    background: #fff; border-radius: 16px; border: 1.5px solid #E2E8F0;
    padding: 24px; animation: fadeUp .45s ease both;
  }
  .pw-grid {
    display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; margin-bottom: 24px;
  }

  .pw-btn-group {
    display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;
    animation: fadeUp .5s ease both;
  }
  .pw-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 12px; font-size: 13.5px; font-weight: 700;
    cursor: pointer; transition: all .2s; border: none; font-family: inherit;
    text-decoration: none;
  }
  .pw-btn-primary {
    background: #053366; color: #fff;
    box-shadow: 0 4px 12px rgba(5,51,102,0.15);
  }
  .pw-btn-primary:hover { background: #042952; transform: translateY(-1px); }
  .pw-btn-secondary {
    background: #fff; color: #053366; border: 1.5px solid #E2E8F0;
  }
  .pw-btn-secondary:hover { background: #F8FAFC; border-color: #CBD5E1; }

  @media (max-width: 1024px) {
    .pw-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .pw { padding: 20px 16px; }
    .pw-metrics { grid-template-columns: repeat(2, 1fr); }
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

  const name = String(profile?.agency_name || profile?.full_name || "Prestataire");
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const stats = [
    { label: "Réservations", value: totalReservations, trend: "+12%", icon: <BookOpen size={18}/>, color: "#053366", bg: "#EFF6FF" },
    { label: "Taux complétion", value: `${completionRate}%`, trend: "+5%", icon: <CheckCircle2 size={18}/>, color: "#059669", bg: "#ECFDF5" },
    { label: "En attente", value: pending, trend: pending > 0 ? "Action" : "OK", icon: <Clock size={18}/>, color: "#D97706", bg: "#FFFBEB" },
    { label: "Note moyenne", value: avgRating, trend: "★", icon: <Star size={18}/>, color: "#7C3AED", bg: "#F5F3FF" },
  ];

  return (
    <div className="pw">
      <style>{CSS}</style>

      {/* Header */}
      <header className="pw-header">
        <div className="pw-header-left">
          <h1 className="pw-header-title">Tableau de bord</h1>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="pw-btn-group">
        <a href="/prestataire/excursions/nouveau" className="pw-btn pw-btn-primary">
          <Plus size={16} /> Nouvelle excursion
        </a>
        <a href="/prestataire/paiements-reservations" className="pw-btn pw-btn-secondary">
          <CalendarDays size={16} /> Calendrier
        </a>
        <a href="/prestataire/messages" className="pw-btn pw-btn-secondary">
          <Eye size={16} /> Mes messages
        </a>
      </div>

      {/* Stats */}
      <div className="pw-metrics">
        {stats.map((s) => (
          <div key={s.label} className="pw-metric">
            <div className="pw-metric-top">
              <div className="pw-metric-icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="pw-metric-trend">{s.trend}</div>
            </div>
            <div className="pw-metric-num">{s.value}</div>
            <div className="pw-metric-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts & Calendar */}
      <div className="pw-grid">
        <div className="pw-card">
          <ExcursionRatingsChart excursions={excursions} />
        </div>
        <div className="pw-card">
          <ReservationCalendar reservations={reservations} />
        </div>
      </div>

      {/* Empty State */}
      {reservations.length === 0 && (
        <div className="pw-card" style={{ textAlign: "center", padding: "64px 20px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#EFF9FB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CalendarClock size={28} color="#2B96A8" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#053366", marginBottom: 8 }}>C'est bien calme ici...</h3>
          <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24, maxWidth: 380, marginInline: "auto" }}>
            Dès que vous recevrez vos premières réservations, elles apparaîtront ici. Assurez-vous que vos excursions sont bien publiées.
          </p>
          <a href="/prestataire/excursions/nouveau" className="pw-btn pw-btn-primary">
            Publier une excursion
          </a>
        </div>
      )}
    </div>
  );
}
