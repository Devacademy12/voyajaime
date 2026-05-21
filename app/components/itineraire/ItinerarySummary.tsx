"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, Edit3, Send, BookMarked, Layers, PiggyBank,
  Calendar, MapPin, Clock, Star, FileText, LocateFixed,
  CreditCard,
} from "lucide-react";
import CheckoutModalItineraire from "@/app/components/itineraire/Checkoutmodalitineraire";

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
    available_dates?: any[] | null;
  };
  // Mode Assisté shape (flat activity)
  name?: string; description?: string;
  price?: number; duration?: string;
  photos?: string | string[];
  city?: string; rating?: number;
  available_dates?: any[] | null;
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
  const router = useRouter();
  const supabase = createClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleAction = async (action: () => void) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    action();
  };

  const totAct    = days.reduce((s, d) => s + d.activities.length, 0);
  const totBudget = days.reduce((s, d) =>
    s + d.activities.reduce((ss, a) => ss + getPrice(a), 0), 0);

  const saveBtnLabel = saving
    ? "Enregistrement…"
    : saveOk
      ? "✅ Enregistré !"
      : "Enregistrer";

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
              onClick={() => handleAction(onSave)}
              disabled={saving || saveOk}
            >
              <Send size={13} /> {saveBtnLabel}
            </button>
            <button
              className="its-btn its-btn-pay"
              onClick={() => handleAction(() => setCheckoutOpen(true))}
            >
              <CreditCard size={13} /> Payer
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
                onClick={() => handleAction(onSave)}
                disabled={saving || saveOk}
              >
                <Send size={13} /> {saveBtnLabel}
              </button>
              <button
                className="its-btn its-btn-pay its-btn-full"
                onClick={() => handleAction(() => setCheckoutOpen(true))}
              >
                <CreditCard size={13} /> Payer ce voyage
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

      {/* ── Checkout Modal ───────────────────────────────────── */}
      {checkoutOpen && (
        <CheckoutModalItineraire
          excursions={days.flatMap((day, dIdx) =>
            day.activities.map(act => ({
              id: act.id,
              title: getTitle(act),
              city: getCity(act),
              duration_hours: parseFloat(getDuration(act)) || 0,
              price_per_person: getPrice(act),
              max_people: 20,
              available_dates: act.excursion?.available_dates ?? act.available_dates ?? null,
              plan_date: day.date,
              plan_time: act.time as any,
              plan_day: day.day ?? dIdx + 1,
              note: act.note,
            }))
          )}
          itineraireId={savedItId ?? undefined}
          itineraireTitle={title ?? `Résumé — ${nbJours} jours en Tunisie`}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}

/* ─── CSS ────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

/* root */
.its-root {
  min-height: 100vh;
<<<<<<< HEAD
  background: #f7f9fc;
  font-family: 'DM Sans', sans-serif;
  padding: 2rem 8rem;
=======
  background: #F8FAFB;
  font-family: inherit'DM Sans', sans-serif;
  padding: 1.25rem 10rem;
>>>>>>> 521c33b7c05a8b72545c8d5986e8f66c07c371e6
  box-sizing: border-box;
  color: #0f1f38;
}

/* topbar */
.its-topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}
.its-topbar-title { flex: 1; }
.its-topbar-title h1 {
  font-family: 'Sora', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #053366;
  margin: 0;
  letter-spacing: -0.02em;
}
.its-topbar-actions { display: flex; gap: .75rem; }

/* buttons */
.its-btn {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .6rem 1.2rem; border-radius: 10px; font-size: .85rem;
  font-weight: 700; cursor: pointer; border: none; transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}
.its-btn-ghost { background: transparent; color: #4a5568; }
.its-btn-ghost:hover { background: #eef2f8; color: #053366; }

.its-btn-outline { 
  background: white; 
  color: #053366; 
  border: 1.5px solid #dde4ef; 
}
.its-btn-outline:hover { 
  border-color: #2B96A8; 
  color: #2B96A8; 
  background: #e8f6f8;
}

.its-btn-primary { 
  background: #053366; 
  color: white; 
  box-shadow: 0 4px 12px rgba(5, 51, 102, 0.2);
}
.its-btn-primary:hover { 
  background: #031e3d; 
  transform: translateY(-1px);
}

.its-btn-green { background: #059669; color: white; }

.its-btn-pay { 
  background: #2B96A8; 
  color: white; 
  box-shadow: 0 4px 12px rgba(43, 150, 168, 0.2);
}
.its-btn-pay:hover { 
  background: #237d8c; 
  transform: translateY(-1px);
}

.its-btn-full { width: 100%; justify-content: center; }
.its-btn:disabled { opacity: .55; cursor: not-allowed; transform: none !important; }

/* layout */
.its-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2.5rem;
  align-items: start;
}

/* sidebar */
.its-sidebar {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid #dde4ef;
  position: sticky;
  top: 2rem;
  box-shadow: 0 10px 30px rgba(5, 51, 102, 0.05);
}
.its-sidebar-brand {
  display: flex; align-items: center; gap: .5rem;
  font-size: .7rem; font-weight: 700; color: #2B96A8;
  text-transform: uppercase; letter-spacing: .1em;
  margin-bottom: 1rem;
}
.its-sidebar-headline {
  font-family: 'Sora', sans-serif;
  font-size: 1.3rem; font-weight: 800; color: #053366;
  line-height: 1.2; margin-bottom: .5rem;
}
.its-sidebar-cities { font-size: .85rem; color: #4a5568; margin: 0 0 1.5rem; line-height: 1.5; }

/* kpis */
.its-kpis { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 2rem; }
.its-kpi { 
  display: flex; align-items: center; gap: 1rem; 
  padding: .85rem 1rem; border-radius: 12px; 
  background: #f7f9fc; 
  border: 1px solid #dde4ef;
}
.its-kpi-icon { 
  width: 36px; height: 36px; border-radius: 10px; 
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; 
}
.its-kpi-label { font-size: .75rem; color: #8fa0b4; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
.its-kpi-val { font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 700; }

.its-sidebar-ctas { display: flex; flex-direction: column; gap: .75rem; }

/* scroll area */
.its-scroll { display: flex; flex-direction: column; gap: 1.5rem; }

/* day card */
.its-day-card {
  background: white; border-radius: 20px; overflow: hidden;
  border: 1px solid #dde4ef;
  box-shadow: 0 4px 20px rgba(5, 51, 102, 0.04);
  transition: all .3s ease;
}
.its-day-card:hover { 
  box-shadow: 0 12px 40px rgba(5, 51, 102, 0.08); 
  border-color: #c2e8ed;
}

.its-day-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.75rem; border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #f7f9fc 0%, white 100%);
}
.its-day-left { display: flex; align-items: center; gap: 1rem; }
.its-day-title { 
  font-family: 'Sora', sans-serif;
  font-size: 1.05rem; font-weight: 700; color: #053366; 
}
.its-day-theme { font-weight: 500; color: #4a5568; margin-left: .5rem; }
.its-day-city {
  display: flex; align-items: center; gap: .35rem;
  font-size: .8rem; color: #8fa0b4; margin-top: .25rem;
  font-weight: 500;
}
.its-day-date { color: #8fa0b4; margin-left: .3rem; }
.its-day-badge {
  display: flex; align-items: center; gap: .5rem;
  background: #e8f6f8; border-radius: 99px;
  padding: .4rem 1rem; font-size: .8rem; color: #2B96A8; font-weight: 700;
  border: 1px solid #c2e8ed;
}
.its-sep { opacity: .3; margin: 0 .2rem; }
.its-day-empty { padding: 2rem; color: #8fa0b4; font-size: .9rem; font-style: italic; text-align: center; }

/* acts */
.its-acts { padding: 0.5rem 0; }
.its-act-row {
  display: flex; align-items: center; gap: 1.25rem;
  padding: 1rem 1.75rem;
  transition: background .2s ease;
  border-bottom: 1px solid #f7f9fc;
}
.its-act-row:last-child { border-bottom: none; }
.its-act-row:hover { background: #f7f9fc; }

.its-act-time {
  font-family: 'Sora', sans-serif;
  font-size: .8rem; font-weight: 700;
  width: 50px; flex-shrink: 0; text-align: center;
}
.its-act-accent {
  width: 4px; height: 40px; border-radius: 4px; flex-shrink: 0; opacity: 0.8;
}
.its-act-img {
  width: 64px; height: 48px; object-fit: cover; border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.its-act-info { flex: 1; min-width: 0; }
.its-act-title {
  font-family: 'Sora', sans-serif;
  font-size: .95rem; font-weight: 700; color: #053366;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: .2rem;
}
.its-act-meta {
  display: flex; align-items: center; gap: .75rem;
  font-size: .78rem; color: #8fa0b4;
}
.its-act-meta span { display: flex; align-items: center; gap: .25rem; }
.its-act-note {
  display: flex; align-items: center; gap: .3rem;
  font-size: .75rem; color: #4a5568; margin-top: .5rem;
  padding: .3rem .6rem; background: #fdf6e3; border-radius: 6px;
  width: fit-content;
}
.its-act-price {
  font-family: 'Sora', sans-serif;
  font-size: 1.05rem; font-weight: 800; flex-shrink: 0;
  margin-left: auto;
  color: #053366 !important;
}

/* responsive */
@media (max-width: 1280px) {
  .its-root { padding: 2rem 4rem; }
}
@media (max-width: 1024px) {
  .its-root { padding: 2rem 2rem; }
  .its-layout { grid-template-columns: 1fr; }
  .its-sidebar { position: static; width: 100%; max-width: 500px; margin: 0 auto; }
}
@media (max-width: 640px) {
  .its-root { padding: 1rem 1rem; }
  .its-topbar { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .its-topbar-actions { width: 100%; justify-content: space-between; }
  .its-act-row { padding: 1rem; gap: .75rem; }
  .its-act-time { width: 40px; font-size: .7rem; }
  .its-act-img { display: none; }
}
`;