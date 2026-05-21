"use client";

import React from "react";
import {
  ArrowLeft, Edit3, Send, BookMarked, Layers, PiggyBank,
  Calendar, MapPin, Clock, Star, FileText, LocateFixed,
  CheckCircle2,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
export type SummaryActivity = {
  id: string;
  time: string;         // slot key: "matin" | "aprem" | "soir"
  customTime?: string;
  note?: string;
  excursion?: {         // Mode Libre shape
    title: string; city: string;
    price_per_person: number; duration_hours: number;
    rating?: number; photos?: string[];
    categories?: string[];
  };
  // Mode Assisté shape (flat activity)
  name?: string; description?: string;
  price?: number; duration?: string;
  photos?: string | string[];
  city?: string; rating?: number;
};

export type SummaryDayPlan = {
  day?: number;
  city: string;
  date?: string;
  theme?: string;
  activities: SummaryActivity[];
};

export type ItinerarySummaryProps = {
  title?: string;
  days: SummaryDayPlan[];
  nbJours: number;
  selCities: string[];
  saving?: boolean;
  saveOk?: boolean;
  savedItId?: string | null;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
};

/* ─── Helpers ────────────────────────────────────────────── */
const SLOT_COLORS: Record<string, string> = {
  matin: "#F59E0B",
  aprem: "#2B96A8",
  soir:  "#8B5CF6",
};

const SLOT_TIMES: Record<string, string> = {
  matin: "09:00",
  aprem: "13:00",
  soir:  "19:00",
};

function getTitle(act: SummaryActivity): string {
  return act.excursion?.title ?? act.name ?? "—";
}
function getCity(act: SummaryActivity): string {
  return act.excursion?.city ?? act.city ?? "";
}
function getDuration(act: SummaryActivity): string {
  if (act.excursion?.duration_hours) return `${act.excursion.duration_hours}h`;
  return act.duration ?? "";
}
function getPrice(act: SummaryActivity): number {
  return act.excursion?.price_per_person ?? act.price ?? 0;
}
function getRating(act: SummaryActivity): number {
  return act.excursion?.rating ?? act.rating ?? 0;
}
function getPhotos(act: SummaryActivity): string[] {
  const p = act.excursion?.photos ?? act.photos;
  if (!p) return [];
  return Array.isArray(p) ? p : [p];
}

/* ─── Component ─────────────────────────────────────────── */
export default function ItinerarySummary({
  title,
  days,
  nbJours,
  selCities,
  saving = false,
  saveOk = false,
  savedItId = null,
  onBack,
  onEdit,
  onSave,
}: ItinerarySummaryProps) {
  const totAct    = days.reduce((s, d) => s + d.activities.length, 0);
  const totBudget = days.reduce((s, d) =>
    s + d.activities.reduce((ss, a) => ss + getPrice(a), 0), 0);

  const saveBtnLabel = saving
    ? "Sauvegarde…"
    : saveOk
      ? "✅ Sauvegardé !"
      : savedItId
        ? "Mettre à jour"
        : "Sauvegarder ce voyage";

  return (
    <>
      {/* ── inject styles once ─────────────────────────────── */}
      <style>{CSS}</style>

      <div className="its-root">

        {/* ── Top bar ──────────────────────────────────────── */}
        <div className="its-topbar">
          <button className="its-btn its-btn-ghost" onClick={onBack}>
            <ArrowLeft size={13} /> Retour
          </button>
          <div className="its-topbar-title">
            <h1>{title ?? `Résumé — ${nbJours} jours en Tunisie`}</h1>
          </div>
          <div className="its-topbar-actions">
            <button className="its-btn its-btn-outline" onClick={onEdit}>
              <Edit3 size={13} /> Modifier
            </button>
            <button
              className={`its-btn ${saveOk ? "its-btn-green" : "its-btn-primary"}`}
              onClick={onSave}
              disabled={saving}
            >
              <Send size={13} /> {saveBtnLabel}
            </button>
          </div>
        </div>

        {/* ── Layout ────────────────────────────────────────── */}
        <div className="its-layout">

          {/* Sidebar KPIs */}
          <aside className="its-sidebar">
            <div className="its-sidebar-brand">
              <BookMarked size={14} color="#2B96A8" />
              <span>Votre itinéraire</span>
            </div>
            <div className="its-sidebar-headline">{nbJours} jours en Tunisie</div>
            <p className="its-sidebar-cities">{selCities.join(" · ")}</p>

            <div className="its-kpis">
              {[
                { icon: <Layers size={15} />,    label: "Activités",    val: `${totAct}`,        color: "#2B96A8", bg: "rgba(43,150,168,.12)" },
                { icon: <PiggyBank size={15} />, label: "Budget total", val: `${totBudget} EUR`, color: "#059669", bg: "rgba(5,150,105,.12)"  },
                { icon: <Calendar size={15} />,  label: "Durée",        val: `${nbJours} jours`, color: "#8B5CF6", bg: "rgba(139,92,246,.12)" },
              ].map(kpi => (
                <div key={kpi.label} className="its-kpi">
                  <div className="its-kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <div className="its-kpi-label">{kpi.label}</div>
                    <div className="its-kpi-val" style={{ color: kpi.color }}>{kpi.val}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="its-sidebar-ctas">
              <button className="its-btn its-btn-outline its-btn-full" onClick={onEdit}>
                <Edit3 size={13} /> Modifier l&apos;itinéraire
              </button>
              <button
                className={`its-btn its-btn-full ${saveOk ? "its-btn-green" : "its-btn-primary"}`}
                onClick={onSave}
                disabled={saving}
              >
                <Send size={13} /> {saveBtnLabel}
              </button>
            </div>
          </aside>

          {/* Day cards scroll */}
          <div className="its-scroll">
            {days.map((day, i) => {
              const dayPrice = day.activities.reduce((s, a) => s + getPrice(a), 0);
              const dayHours = day.activities.reduce((s, a) => {
                const d = getDuration(a);
                return s + (parseFloat(d) || 0);
              }, 0);
              const sorted = [...day.activities].sort((a, b) =>
                (a.customTime || SLOT_TIMES[a.time] || "").localeCompare(
                  b.customTime || SLOT_TIMES[b.time] || ""
                )
              );
              return (
                <div key={i} className="its-day-card">
                  {/* day header */}
                  <div className="its-day-header">
                    <div className="its-day-left">
                      <div>
                        <div className="its-day-title">
                          Jour {day.day ?? i + 1}
                          {day.theme && <span className="its-day-theme"> — {day.theme}</span>}
                        </div>
                        <div className="its-day-city">
                          <LocateFixed size={11} /> {day.city}
                          {day.date && (
                            <span className="its-day-date">
                              · {new Date(day.date).toLocaleDateString("fr-FR", {
                                day: "numeric", month: "long",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {day.activities.length > 0 && (
                      <div className="its-day-badge">
                        <span><PiggyBank size={10} /> {dayPrice} EUR</span>
                        <span className="its-sep">·</span>
                        <span><Clock size={9} /> {dayHours}h</span>
                      </div>
                    )}
                  </div>

                  {/* activities */}
                  {sorted.length === 0 ? (
                    <p className="its-day-empty">Aucune activité planifiée</p>
                  ) : (
                    <div className="its-acts">
                      {sorted.map((act, ai) => {
                        const photos = getPhotos(act);
                        const price  = getPrice(act);
                        const rating = getRating(act);
                        const slotColor = SLOT_COLORS[act.time] ?? "#2B96A8";
                        return (
                          <div key={act.id ?? ai} className="its-act-row">
                            {/* time pill */}
                            <div className="its-act-time" style={{ color: slotColor }}>
                              {act.customTime || SLOT_TIMES[act.time] || "—"}
                            </div>

                            {/* slot accent */}
                            <div className="its-act-accent" style={{ background: slotColor }} />

                            {/* photo */}
                            {photos[0] && (
                              <img src={photos[0]} alt="" className="its-act-img" />
                            )}

                            {/* info */}
                            <div className="its-act-info">
                              <div className="its-act-title">{getTitle(act)}</div>
                              <div className="its-act-meta">
                                {getCity(act) && (
                                  <span><MapPin size={8} /> {getCity(act)}</span>
                                )}
                                {getDuration(act) && (
                                  <span><Clock size={8} /> {getDuration(act)}</span>
                                )}
                                {rating > 0 && (
                                  <span><Star size={8} color="#F59E0B" fill="#F59E0B" /> {rating}</span>
                                )}
                              </div>
                              {act.note && (
                                <div className="its-act-note">
                                  <FileText size={8} /> {act.note}
                                </div>
                              )}
                            </div>

                            {/* price */}
                            {price > 0 && (
                              <div className="its-act-price" style={{ color: slotColor }}>
                                {price} EUR
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── CSS ────────────────────────────────────────────────── */
const CSS = `
/* root */
.its-root {
  min-height: 100vh;
  background: #F8FAFB;
  font-family: inherit'DM Sans', sans-serif;
  padding: 1.25rem 10rem;
  box-sizing: border-box;
}

/* topbar */
.its-topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.its-topbar-title { flex: 1; }
.its-topbar-title h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
}
.its-topbar-actions { display: flex; gap: .5rem; }

/* buttons */
.its-btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .5rem 1rem; border-radius: 8px; font-size: .82rem;
  font-weight: 600; cursor: pointer; border: none; transition: all .18s;
  white-space: nowrap;
}
.its-btn-ghost { background: transparent; color: #64748B; }
.its-btn-ghost:hover { background: #F1F5F9; color: #0F172A; }
.its-btn-outline { background: white; color: #334155; border: 1.5px solid #E2E8F0; }
.its-btn-outline:hover { border-color: #2B96A8; color: #2B96A8; }
.its-btn-primary { background: #2B96A8; color: white; }
.its-btn-primary:hover { background: #238a9b; }
.its-btn-green { background: #059669; color: white; }
.its-btn-full { width: 100%; justify-content: center; }
.its-btn:disabled { opacity: .55; cursor: not-allowed; }

/* layout */
.its-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* sidebar */
.its-sidebar {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #E2E8F0;
  position: sticky;
  top: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,.05);
}
.its-sidebar-brand {
  display: flex; align-items: center; gap: .5rem;
  font-size: .75rem; font-weight: 600; color: #2B96A8;
  text-transform: uppercase; letter-spacing: .06em;
  margin-bottom: .75rem;
}
.its-sidebar-headline {
  font-size: 1.15rem; font-weight: 800; color: #0F172A;
  line-height: 1.25; margin-bottom: .3rem;
}
.its-sidebar-cities { font-size: .78rem; color: #64748B; margin: 0 0 1.25rem; }

/* kpis */
.its-kpis { display: flex; flex-direction: column; gap: .65rem; margin-bottom: 1.25rem; }
.its-kpi { display: flex; align-items: center; gap: .75rem; padding: .6rem .75rem; border-radius: 10px; background: #F8FAFB; }
.its-kpi-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.its-kpi-label { font-size: .72rem; color: #94A3B8; font-weight: 500; }
.its-kpi-val { font-size: .88rem; font-weight: 700; }

.its-sidebar-ctas { display: flex; flex-direction: column; gap: .5rem; }

/* scroll area */
.its-scroll { display: flex; flex-direction: column; gap: 1.25rem; }

/* day card */
.its-day-card {
  background: white; border-radius: 16px; overflow: hidden;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 12px rgba(0,0,0,.04);
  transition: box-shadow .2s;
}
.its-day-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.08); }

.its-day-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid #F1F5F9;
  background: linear-gradient(135deg, #F8FAFB 0%, white 100%);
}
.its-day-left { display: flex; align-items: center; gap: .75rem; }
.its-day-emoji { font-size: 1.4rem; }
.its-day-title { font-size: .95rem; font-weight: 700; color: #0F172A; }
.its-day-theme { font-weight: 500; color: #475569; }
.its-day-city {
  display: flex; align-items: center; gap: .3rem;
  font-size: .75rem; color: #64748B; margin-top: .15rem;
}
.its-day-date { color: #94A3B8; margin-left: .2rem; }
.its-day-badge {
  display: flex; align-items: center; gap: .4rem;
  background: #F1F5F9; border-radius: 99px;
  padding: .3rem .75rem; font-size: .74rem; color: #475569; font-weight: 600;
}
.its-sep { color: #CBD5E1; }
.its-day-empty { padding: 1.25rem; color: #94A3B8; font-size: .82rem; font-style: italic; }

/* acts */
.its-acts { padding: .5rem 0; }
.its-act-row {
  display: flex; align-items: center; gap: .75rem;
  padding: .65rem 1.25rem;
  transition: background .15s;
  border-bottom: 1px solid #F8FAFB;
}
.its-act-row:last-child { border-bottom: none; }
.its-act-row:hover { background: #F8FAFB; }

.its-act-time {
  font-size: .75rem; font-weight: 700;
  width: 44px; flex-shrink: 0; text-align: center;
}
.its-act-accent {
  width: 3px; height: 36px; border-radius: 4px; flex-shrink: 0; opacity: .7;
}
.its-act-img {
  width: 52px; height: 38px; object-fit: cover; border-radius: 8px;
  flex-shrink: 0;
}
.its-act-info { flex: 1; min-width: 0; }
.its-act-title {
  font-size: .85rem; font-weight: 600; color: #1E293B;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.its-act-meta {
  display: flex; align-items: center; gap: .5rem;
  font-size: .72rem; color: #94A3B8; margin-top: .15rem;
}
.its-act-meta span { display: flex; align-items: center; gap: .2rem; }
.its-act-note {
  display: flex; align-items: center; gap: .25rem;
  font-size: .7rem; color: #64748B; margin-top: .25rem;
  font-style: italic;
}
.its-act-price {
  font-size: .85rem; font-weight: 700; flex-shrink: 0;
  margin-left: auto;
}

/* responsive */
@media (max-width: 1100px) {
  .its-root { padding: 1.25rem 3rem; }
}
@media (max-width: 768px) {
  .its-root { padding: 1rem 1rem; }
  .its-layout { grid-template-columns: 1fr; }
  .its-sidebar { position: static; }
}
`;