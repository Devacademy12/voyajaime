"use client";

import { CalendarDays, Heart, MapPin, Bot, Pencil, Search, ChevronRight, Mountain } from "lucide-react";

interface Props {
  profile: Record<string, unknown> | null;
  reservations: Record<string, unknown>[];
  favorisCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmé",
  completed: "Terminé",  cancelled: "Annulé",
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "#FEF9C3", color: "#A16207" },
  confirmed: { bg: "#DCFCE7", color: "#15803D" },
  completed: { bg: "#DBEAFE", color: "#1D4ED8" },
  cancelled: { bg: "#FEE2E2", color: "#DC2626" },
};

export default function TouristeDashboardClient({ profile, reservations, favorisCount }: Props) {
  const firstName = String(profile?.full_name || "Voyageur").split(" ")[0];

  const quickActions = [
    { icon: <Bot size={22} color="#2B96A8"/>,    title: "Mode Assisté",  desc: "On crée votre itinéraire", href: "/touriste/itineraire?mode=assiste", accent: "#2B96A8" },
    { icon: <Pencil size={22} color="#7C3AED"/>, title: "Mode Libre",    desc: "Construisez vous-même",    href: "/touriste/itineraire",               accent: "#7C3AED" },
    { icon: <Search size={22} color="#D97706"/>, title: "Explorer",      desc: "Parcourir les excursions", href: "/excursions",                        accent: "#D97706" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .dash-card{animation:fadeUp .3s ease both;transition:transform .2s,box-shadow .2s}
        .dash-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px -8px rgba(0,0,0,.12)!important}
        .qa-card{animation:fadeUp .3s ease both;transition:all .2s;text-decoration:none;display:block}
        .qa-card:hover .qa-inner{transform:translateY(-3px);box-shadow:0 12px 30px -8px rgba(0,0,0,.15)!important}

        .dash-wrap { padding: 40px 48px 80px; max-width: 1160px; margin: 0 auto; width: 100%; }
        .qa-grid   { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 40px; }
        .stats-grid{ display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; max-width: 520px; margin-bottom: 40px; }
        .resa-row  { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #F9FAFB; border-radius: 14px; border: 1px solid #F3F4F6; }

        @media (max-width: 900px) {
          .qa-grid { grid-template-columns: repeat(3,1fr); gap: 12px; }
          .dash-wrap { padding: 28px 24px 60px; }
        }
        @media (max-width: 600px) {
          .qa-grid   { grid-template-columns: 1fr; gap: 10px; }
          .stats-grid{ grid-template-columns: repeat(2,1fr); max-width:100%; }
          .dash-wrap { padding: 20px 16px 60px; }
          .resa-row  { flex-direction: column; align-items: flex-start; gap: 10px; }
          .resa-right{ align-self: flex-end; }
        }
      `}</style>

      <div className="dash-wrap">
        {/* Header */}
        <div style={{ marginBottom: 36, animation: "fadeUp .3s ease" }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,36px)", fontWeight: 900, color: "#111827", margin: 0, letterSpacing: "-1px" }}>
            Bonjour, {firstName} 👋
          </h1>
          <p style={{ color: "#9CA3AF", marginTop: 8, fontSize: 15 }}>
            Prêt pour votre prochaine aventure en Tunisie ?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="qa-grid">
          {quickActions.map((a, i) => (
            <a key={a.title} href={a.href} className="qa-card">
              <div className="qa-inner" style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", padding: "24px 20px", boxShadow: "0 2px 8px rgba(0,0,0,.04)", animationDelay: `${i * .08}s`, transition: "all .2s" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${a.accent}12`, border: `1.5px solid ${a.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  {a.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 16px" }}>{a.desc}</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 20, background: `${a.accent}12`, color: a.accent, fontSize: 12, fontWeight: 700 }}>
                  Commencer <ChevronRight size={12}/>
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: "Mes réservations", href: "/touriste/reservations", icon: <CalendarDays size={20} color="#2B96A8"/>, count: reservations.length, accent: "#2B96A8" },
            { label: "Mes favoris",      href: "/touriste/favoris",      icon: <Heart size={20} color="#EF4444"/>,        count: favorisCount,         accent: "#EF4444" },
          ].map((s, i) => (
            <a key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              <div className="dash-card" style={{ background: "white", borderRadius: 18, border: "1px solid #E5E7EB", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,.04)", animationDelay: `${.25 + i * .08}s` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.accent}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: "#111827", margin: 0, lineHeight: 1 }}>{s.count}</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0", fontWeight: 500 }}>{s.label}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Réservations récentes */}
        {reservations.length > 0 && (
          <div style={{ background: "white", borderRadius: 24, border: "1px solid #E5E7EB", padding: "24px 28px", boxShadow: "0 2px 10px rgba(0,0,0,.04)", animation: "fadeUp .3s .35s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarDays size={16} color="#2B96A8"/> Réservations récentes
              </h2>
              <a href="/touriste/reservations" style={{ fontSize: 13, color: "#2B96A8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                Tout voir <ChevronRight size={13}/>
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reservations.map((r) => {
                const exc    = r.excursion as Record<string, unknown> | null;
                const status = String(r.status);
                const sc     = STATUS_COLOR[status] || { bg: "#F3F4F6", color: "#6B7280" };
                return (
                  <div key={String(r.id)} className="resa-row">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {exc?.title as string || "Excursion"}
                      </p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10}/>{exc?.city as string}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CalendarDays size={10}/>{String(r.date)}</span>
                        <span style={{ fontFamily: "monospace" }}>#{String(r.booking_code)}</span>
                      </p>
                    </div>
                    <div className="resa-right" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontWeight: 800, color: "#111827", fontSize: 15 }}>{Number(r.total_price)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span></span>
                      <span style={{ padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {STATUS_LABEL[status] || status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {reservations.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "white", borderRadius: 24, border: "1px solid #E5E7EB" }}>
            <Mountain size={48} style={{ color: "#E5E7EB", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Aucune réservation pour l&apos;instant</p>
            <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>Explorez nos excursions et planifiez votre premier voyage !</p>
            <a href="/excursions" style={{ padding: "11px 24px", background: "#2B96A8", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Mountain size={16}/> Découvrir les excursions
            </a>
          </div>
        )}
      </div>
    </div>
  );
}