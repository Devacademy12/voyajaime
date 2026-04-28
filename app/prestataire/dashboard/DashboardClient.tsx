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

// Fonction pour obtenir les stats de réservation par mois
function getReservationStats(reservations: Record<string, unknown>[]) {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const currentYear = new Date().getFullYear();
  
  const monthlyData = months.map((month, index) => {
    const monthReservations = reservations.filter(r => {
      const date = new Date(r.date as string);
      return date.getMonth() === index && date.getFullYear() === currentYear;
    });
    
    const confirmed = monthReservations.filter(r => r.status === "confirmed").length;
    const pending = monthReservations.filter(r => r.status === "pending").length;
    const completed = monthReservations.filter(r => r.status === "completed").length;
    const cancelled = monthReservations.filter(r => r.status === "cancelled").length;
    
    return { month, confirmed, pending, completed, cancelled, total: monthReservations.length };
  });
  
  return monthlyData;
}

// Composant Calendrier
function ReservationCalendar({ reservations }: { reservations: Record<string, unknown>[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  const getReservationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(r => {
      const rDate = new Date(r.date as string);
      return rDate.toISOString().split('T')[0] === dateStr;
    });
  };
  
  const getDayStatus = (date: Date) => {
    const dayReservations = getReservationsForDate(date);
    if (dayReservations.length === 0) return null;
    if (dayReservations.some(r => r.status === "pending")) return "pending";
    if (dayReservations.some(r => r.status === "confirmed")) return "confirmed";
    if (dayReservations.some(r => r.status === "completed")) return "completed";
    return "default";
  };
  
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  
  const statusColors = {
    pending: { bg: "#FEF3C7", color: "#D97706" },
    confirmed: { bg: "#DCFCE7", color: "#15803D" },
    completed: { bg: "#DCE5FF", color: "#259FFC" },
    default: { bg: "#F3F4F6", color: "#9CA3AF" },
  };
  
  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #EBEBEB", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={20} color="#02AFCF" />
          Calendrier des réservations
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
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
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
        {dayNames.map(day => (
          <div key={day} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#9CA3AF", padding: "8px 0" }}>
            {day}
          </div>
        ))}
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} style={{ aspectRatio: "1", background: "#F9FAFB", borderRadius: 12 }} />;
          }
          
          const dayReservations = getReservationsForDate(date);
          const status = getDayStatus(date);
          const isSelected = selectedDate === date.toISOString().split('T')[0];
          
          return (
            <div
              key={date.toISOString()}
              onClick={() => setSelectedDate(isSelected ? null : date.toISOString().split('T')[0])}
              style={{
                aspectRatio: "1",
                background: isSelected ? "rgba(2,175,207,.1)" : status ? statusColors[status as keyof typeof statusColors].bg : "white",
                borderRadius: 12,
                border: isSelected ? "2px solid #02AFCF" : `1px solid ${status ? statusColors[status as keyof typeof statusColors].color : "#E5E7EB"}`,
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#DCFCE7", border: "1px solid #15803D" }} />
          <span style={{ fontSize: 11, color: "#6B7280" }}>Confirmé</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#FEF3C7", border: "1px solid #D97706" }} />
          <span style={{ fontSize: 11, color: "#6B7280" }}>En attente</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#DCE5FF", border: "1px solid #259FFC" }} />
          <span style={{ fontSize: 11, color: "#6B7280" }}>Terminé</span>
        </div>
      </div>
      
      {/* Détail du jour sélectionné */}
      {selectedDate && (
        <div style={{ marginTop: 20, padding: 16, background: "#F8FAFF", borderRadius: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", marginBottom: 12 }}>
            Réservations du {new Date(selectedDate).toLocaleDateString("fr-FR")}
          </p>
          {getReservationsForDate(new Date(selectedDate)).map(r => {
            const exc = r.excursion as Record<string, unknown> | null;
            const status = String(r.status);
            const ss = STATUS_STYLE[status] || { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
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
      )}
    </div>
  );
}

// Composant graphique réservations
function ReservationChart({ reservations }: { reservations: Record<string, unknown>[] }) {
  const monthlyStats = getReservationStats(reservations);
  const maxTotal = Math.max(...monthlyStats.map(m => m.total), 1);
  
  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #EBEBEB", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#053366", margin: 0 }}>
          Réservations par mois
        </h2>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#22C55E" }} />
            <span style={{ fontSize: 12, color: "#6B7280" }}>Confirmées</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#F59E0B" }} />
            <span style={{ fontSize: 12, color: "#6B7280" }}>En attente</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#02AFCF" }} />
            <span style={{ fontSize: 12, color: "#6B7280" }}>Terminées</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "#EF4444" }} />
            <span style={{ fontSize: 12, color: "#6B7280" }}>Annulées</span>
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, minHeight: 300, paddingTop: 20 }}>
        {monthlyStats.map((item, idx) => (
          <div key={item.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {item.confirmed > 0 && (
                <div 
                  style={{ 
                    width: "80%", 
                    height: `${(item.confirmed / maxTotal) * 180}px`, 
                    background: "#22C55E", 
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.5s ease-out",
                    minHeight: item.confirmed > 0 ? "2px" : "0",
                  }}
                />
              )}
              {item.pending > 0 && (
                <div 
                  style={{ 
                    width: "80%", 
                    height: `${(item.pending / maxTotal) * 180}px`, 
                    background: "#F59E0B", 
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.5s ease-out 0.1s",
                    minHeight: item.pending > 0 ? "2px" : "0",
                  }}
                />
              )}
              {item.completed > 0 && (
                <div 
                  style={{ 
                    width: "80%", 
                    height: `${(item.completed / maxTotal) * 180}px`, 
                    background: "#02AFCF", 
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.5s ease-out 0.2s",
                    minHeight: item.completed > 0 ? "2px" : "0",
                  }}
                />
              )}
              {item.cancelled > 0 && (
                <div 
                  style={{ 
                    width: "80%", 
                    height: `${(item.cancelled / maxTotal) * 180}px`, 
                    background: "#EF4444", 
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.5s ease-out 0.3s",
                    minHeight: item.cancelled > 0 ? "2px" : "0",
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{item.month}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#053366" }}>{item.total}</span>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Total réservations : <strong style={{ color: "#053366" }}>{reservations.length}</strong>
          </p>
        </div>
        <div>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Taux de confirmation : <strong style={{ color: "#22C55E" }}>
              {reservations.length > 0 
                ? Math.round((reservations.filter(r => r.status === "confirmed" || r.status === "completed").length / reservations.length) * 100)
                : 0}%
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({ profile, excursions, reservations, paiements }: Props) {
  const revenue = paiements?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0) || 0;
  const pending = reservations?.filter(r => r.status === "pending").length || 0;
  const activeExc = excursions?.filter(e => e.is_active).length || 0;
  const avgRating = excursions.length
    ? (excursions.reduce((s, e) => s + (Number(e.rating) || 0), 0) / excursions.length).toFixed(1)
    : "—";
  const totalReservations = reservations.length;
  const completionRate = totalReservations > 0
    ? Math.round((reservations.filter(r => r.status === "completed").length / totalReservations) * 100)
    : 0;

  const name = String(profile?.agency_name || profile?.full_name || "Prestataire");

  const stats = [
    { label: "Réservations totales", value: totalReservations, change: "+12%", icon: <BookOpen size={22} strokeWidth={1.8}/>, color: "#02AFCF", bg: "rgba(2,175,207,.1)" },
    { label: "Taux complétion", value: `${completionRate}%`, change: "+5%", icon: <CheckCircle2 size={22} strokeWidth={1.8}/>, color: "#22C55E", bg: "rgba(34,197,94,.1)" },
    { label: "En attente", value: pending, change: pending > 0 ? `${pending} à traiter` : "0", icon: <Clock size={22} strokeWidth={1.8}/>, color: "#F59E0B", bg: "rgba(245,158,11,.1)" },
    { label: "Note moyenne", value: avgRating, change: `${avgRating}/5`, icon: <Star size={22} strokeWidth={1.8}/>, color: "#8B5CF6", bg: "rgba(139,92,246,.1)" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: "#F8FAFF", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barGrow { from{height:0} to{height:var(--target-height)} }
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
        .chart-bar { transition: height 0.5s ease-out; }
        @media(max-width:900px) { .dp-stats { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px) {
          .dp-stats   { grid-template-columns:repeat(2,1fr); gap:10px; }
          .dp-actions { flex-direction:column; }
          .dp-actions .dp-action { justify-content:center; width:100%; }
          .dp-resa-inner { flex-direction:column; align-items:flex-start; gap:8px; }
          .dp-resa-badge { align-self:flex-end; }
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 40px" }}>
        {/* Header */}
        <div className="dp-card" style={{ marginBottom: 32, animationDelay: "0s" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-0.5px" }}>
              Dashboard
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: 14, margin: "4px 0 0" }}>
              Bienvenue, {name}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="dp-stats">
          {stats.map((s, i) => (
            <div key={s.label} className="dp-card dp-stat" style={{ 
              background: "white", borderRadius: 20, border: "1px solid #EBEBEB", 
              padding: "20px", display: "flex", flexDirection: "column", gap: 12, 
              boxShadow: "0 2px 10px rgba(5,51,102,.05)", animationDelay: `${i * .07}s`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                  {s.icon}
                </div>
                <span style={{ 
                  fontSize: 12, fontWeight: 600, 
                  color: s.change.includes("+") || s.change.includes("%") ? "#22C55E" : "#EF4444",
                  background: s.change.includes("+") || s.change.includes("%") ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
                  padding: "4px 8px", borderRadius: 20
                }}>
                  {s.change}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#053366", lineHeight: 1 }}>{String(s.value)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Graphique Réservations + Calendrier */}
        <div className="dp-card" style={{ marginBottom: 28, animationDelay: ".14s", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
          <ReservationChart reservations={reservations} />
          <ReservationCalendar reservations={reservations} />
        </div>

        {/* Actions */}
        <div className="dp-card dp-actions" style={{ animationDelay: ".28s" }}>
          <a href="/prestataire/excursions/nouveau" className="dp-action dp-action-primary">
            <Plus size={16} /> Ajouter une excursion
          </a>
          <a href="/prestataire/reservations" className="dp-action dp-action-secondary">
            <CalendarDays size={16} /> Voir les réservations
          </a>
          <a href="/prestataire/paiements" className="dp-action dp-action-secondary">
            <Wallet size={16} /> Mes paiements
          </a>
        </div>

        {/* Alerte en attente */}
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

        {/* Réservations récentes */}
        {reservations.length > 0 && (
          <div className="dp-card" style={{ background: "white", borderRadius: 20, border: "1px solid #EEF2FF", padding: "24px", boxShadow: "0 2px 12px rgba(5,51,102,.06)", animationDelay: ".36s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(2,175,207,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={14} color="#02AFCF" />
                </div>
                Dernières réservations
              </h2>
              <a href="/prestataire/reservations" style={{ fontSize: 13, color: "#259FFC", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                Voir tout <ArrowRight size={13} />
              </a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reservations.slice(0, 5).map((r) => {
                const exc = r.excursion as Record<string, unknown> | null;
                const status = String(r.status);
                const ss = STATUS_STYLE[status] || { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
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
    </div>
  );
}