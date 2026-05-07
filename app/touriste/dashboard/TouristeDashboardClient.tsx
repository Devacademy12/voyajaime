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
    <div className="font-sans">
      {/* Police + animations déjà dans ton CSS global */}
      <div className="page-wrapper" style={{ padding: "40px 48px 80px", maxWidth: 1160 }}>
        {/* Header */}
        <div className="mb-9" style={{ animation: "fadeUp .3s ease" }}>
          <h1 className="font-serif text-4xl font-black tracking-tight text-gray-900 m-0" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,36px)" }}>
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-gray-400 mt-2 text-base">
            Prêt pour votre prochaine aventure en Tunisie ?
          </p>
        </div>

        {/* Quick Actions - Grid 3 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {quickActions.map((a, i) => (
            <a key={a.title} href={a.href} className="block no-underline group">
              <div 
                className="card-hover bg-white rounded-2xl p-6 shadow-sm" 
                style={{ animationDelay: `${i * .08}s`, animation: "fadeUp .3s ease both" }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3.5"
                  style={{ background: `${a.accent}12`, border: `1.5px solid ${a.accent}22` }}
                >
                  {a.icon}
                </div>
                <h3 className="text-base font-extrabold text-gray-900 m-0 mb-1">{a.title}</h3>
                <p className="text-sm text-gray-400 m-0 mb-4">{a.desc}</p>
                <span 
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `${a.accent}12`, color: a.accent }}
                >
                  Commencer <ChevronRight size={12}/>
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Stats - Grid 2 colonnes */}
        <div className="grid grid-cols-2 gap-4 max-w-md mb-10">
          {[
            { label: "Mes réservations", href: "/touriste/reservations", icon: <CalendarDays size={20} color="#2B96A8"/>, count: reservations.length, accent: "#2B96A8" },
            { label: "Mes favoris",      href: "/touriste/favoris",      icon: <Heart size={20} color="#EF4444"/>,        count: favorisCount,         accent: "#EF4444" },
          ].map((s, i) => (
            <a key={s.label} href={s.href} className="no-underline">
              <div 
                className="card-hover bg-white rounded-xl p-5 flex items-center gap-3.5 shadow-sm"
                style={{ animationDelay: `${.25 + i * .08}s`, animation: "fadeUp .3s ease both" }}
              >
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.accent}10` }}
                >
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900 m-0 leading-none">{s.count}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium m-0">{s.label}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Réservations récentes */}
        {reservations.length > 0 && (
          <div className="card rounded-2xl p-6 sm:p-7 shadow-sm" style={{ animation: "fadeUp .3s .35s ease both" }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-extrabold text-gray-900 m-0 flex items-center gap-2">
                <CalendarDays size={16} color="#2B96A8"/> Réservations récentes
              </h2>
              <a href="/touriste/reservations" className="text-sm text-teal no-underline font-semibold flex items-center gap-1 whitespace-nowrap">
                Tout voir <ChevronRight size={13}/>
              </a>
            </div>
            <div className="flex flex-col gap-2.5">
              {reservations.map((r) => {
                const exc    = r.excursion as Record<string, unknown> | null;
                const status = String(r.status);
                const sc     = STATUS_COLOR[status] || { bg: "#F3F4F6", color: "#6B7280" };
                return (
                  <div key={String(r.id)} className="table-row !p-3.5 flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 m-0 mb-1 truncate">
                        {exc?.title as string || "Excursion"}
                      </p>
                      <p className="text-xs text-gray-400 m-0 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-0.5"><MapPin size={10}/>{exc?.city as string}</span>
                        <span className="flex items-center gap-0.5"><CalendarDays size={10}/>{String(r.date)}</span>
                        <span className="font-mono">#{String(r.booking_code)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 sm:ml-3 self-end sm:self-auto">
                      <span className="font-extrabold text-gray-900 text-base">{Number(r.total_price)} <span className="text-xs font-medium text-gray-400">EUR</span></span>
                      <span className="badge !rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap" style={{ background: sc.bg, color: sc.color }}>
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
          <div className="empty-state !py-12">
            <div className="empty-state-icon w-16 h-16 !bg-gray-100">
              <Mountain size={48} className="text-gray-300" />
            </div>
            <p className="empty-state-title text-lg">Aucune réservation pour l&apos;instant</p>
            <p className="empty-state-text text-sm">Explorez nos excursions et planifiez votre premier voyage !</p>
            <a href="/excursions" className="btn btn-primary !px-6 !py-3 text-base inline-flex items-center gap-2">
              <Mountain size={16}/> Découvrir les excursions
            </a>
          </div>
        )}
      </div>
    </div>
  );
}