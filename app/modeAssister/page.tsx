"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabaseClient";
import Checkoutmodal from "@/app/components/itineraire/Checkoutmodalitineraire";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import ItineraireDisplay from "@/app/components/itineraire/ItineraireDisplay";
import {
  MapPin, Sparkles, Bot, Loader2, ChevronLeft, ChevronRight, CalendarDays,
  Heart, ArrowRight, ArrowLeft, CheckCircle, Euro, AlertTriangle, Bug,
} from "lucide-react";
import styles from "@/public/style/ModeAssiste.module.css";

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

/* ── Types ── */
type Ville     = { id: string; nom?: string; name?: string; city?: string; description?: string; [key: string]: unknown };
type Categorie = { id: string; nom?: string; name?: string; label?: string; [key: string]: unknown };
type Excursion = {
  id: string; title: string; city: string;
  price_per_person?: number; duration_hours?: number;
  description?: string; categories?: string[];
  photos?: string[]; languages?: string[];
  inclusions?: string[]; rating?: number; reviews_count?: number; max_people?: number;
  start_date?: string; end_date?: string; is_active?: boolean;
};
type Activity = {
  id: string; name: string; description?: string;
  time?: string; duration?: string; price?: number; icon?: string;
  photos?: string | string[]; languages?: string | string[];
  inclusion?: string | string[]; city?: string; rating?: number;
};
type DayPlan   = { day: number; city: string; theme?: string; emoji?: string; activities: Activity[] };
type Itinerary = { title: string; days: DayPlan[] };
type CityDateRange = { city: string; start: Date | null; end: Date | null; };

/* ── Constantes ── */
const LOADING_MSGS = [
  "Analyse des meilleures excursions disponibles...",
  "Cartographie de votre itinéraire personnalisé...",
  "L'agent IA consulte les recommandations locales...",
  "Organisation jour par jour de votre séjour...",
  "Sélection des activités les mieux notées...",
];
const MONTHS_FULL  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTHS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
const DAYS_FR      = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

/* ── Helpers ── */
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000) + 1; }
function fmtShort(d: Date) { return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; }
function formatDateForN8N(date: Date): string { return date.toISOString().split('T')[0]; }

function datesOverlap(s1: Date|null, e1: Date|null, s2: Date|null, e2: Date|null): boolean {
  if (!s1||!e1||!s2||!e2) return false;
  const a = new Date(s1); a.setHours(0,0,0,0);
  const b = new Date(e1); b.setHours(0,0,0,0);
  const c = new Date(s2); c.setHours(0,0,0,0);
  const d = new Date(e2); d.setHours(0,0,0,0);
  return a <= d && c <= b;
}

function getBlockedDates(cityDates: CityDateRange[], excludeCity: string) {
  return cityDates.filter(c => c.city !== excludeCity && c.start && c.end)
    .map(c => ({ start: c.start!, end: c.end! }));
}

function extractItinerary(raw: unknown): Itinerary {
  const findDaysObject = (obj: any): any => {
    if (!obj) return null;
    if (obj.days && Array.isArray(obj.days) && obj.days.length > 0) return obj;
    if (obj.itinerary?.days) return obj.itinerary;
    if (obj.result?.days)    return obj.result;
    if (obj.data?.days)      return obj.data;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const found = findDaysObject(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };
  try {
    let parsed = raw;
    if (typeof raw === 'string') {
      const cleaned = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : JSON.parse(cleaned);
    }
    const obj = findDaysObject(parsed);
    if (obj?.days) {
      return {
        title: obj.title || "Mon voyage en Tunisie",
        days: obj.days.map((day: any, idx: number) => ({
          day: day.day || idx + 1,
          city: day.city || "Ville inconnue",
          theme: day.theme || "Découverte",
          activities: (day.activities || []).map((act: any) => ({
            id: act.id || `act-${Date.now()}-${Math.random()}`,
            name: act.name || act.title || "Activité",
            description: act.description || "",
            time: act.time || act.horaire || "09:00",
            duration: act.duration || "2h",
            price: typeof act.price === 'number' ? act.price : (parseFloat(act.price) || 0),
            photos: act.photos || [],
            languages: act.languages || ["Français","Anglais"],
            inclusion: act.inclusion || act.inclusions || [],
            city: act.city || day.city,
            rating: act.rating || 4.5,
          })),
        })),
      };
    }
    throw new Error("Aucun itinéraire valide trouvé");
  } catch (err) {
    throw new Error(`Impossible de parser l'itinéraire: ${err instanceof Error ? err.message : "Format invalide"}`);
  }
}

/* ══════ CSS ══════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; }

:root {
  --primary: #2B96A8;
  --title:   #053366;
  --bg:      #F6F9FB;
  --white:   #ffffff;
  --border:  #E8EDF2;
  --text:    #374151;
  --muted:   #9CA3AF;
  --danger:  #DC2626;
}

.ma2-page {
  min-height: calc(100vh - 64px);
  background: var(--bg);
  font-family: 'DM Sans', system-ui, sans-serif;
  display: flex; flex-direction: column;
}

/* ── Topbar ── */
.ma2-topbar {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 14px 32px 12px;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 8px rgba(0,0,0,.04);
  gap: 10px;
}
.ma2-topbar .badge {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 14px; border-radius: 24px;
  background: rgba(43,150,168,.09);
  font-size: 12px; font-weight: 700; color: var(--primary);
  letter-spacing: .04em;
}
.ma2-topbar h1 {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 900; color: var(--title); margin: 0;
}
.ma2-topbar h1 span { color: var(--primary); }

/* ── Step indicator ── */
.ma2-steps-indicator {
  display: flex; align-items: center; justify-content: center;
  padding: 18px 32px 0; flex-shrink: 0;
}
.ma2-step-pip { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; max-width: 140px; }
.ma2-step-pip-circle {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
  border: 2px solid var(--border); background: var(--white);
  color: var(--muted); transition: all .3s ease; position: relative; z-index: 1;
}
.ma2-step-pip-circle.done   { background: var(--primary); border-color: var(--primary); color: white; }
.ma2-step-pip-circle.active { background: var(--title);   border-color: var(--title);   color: white; box-shadow: 0 4px 14px -3px rgba(5,51,102,.35); }
.ma2-step-pip-label { font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: .04em; text-transform: uppercase; white-space: nowrap; transition: color .3s; }
.ma2-step-pip-label.active { color: var(--title); }
.ma2-step-pip-label.done   { color: var(--primary); }
.ma2-step-connector {
  height: 2px; flex: 1; max-width: 60px;
  background: var(--border); border-radius: 2px; margin-bottom: 18px;
  transition: background .3s; position: relative; top: -9px;
}
.ma2-step-connector.done { background: var(--primary); }

/* ── Body ── */
.ma2-body {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; padding: 20px 20px 36px;
}

/* ── Card ── */
.ma2-card-viewport { width: 100%; max-width: 580px; display: flex; flex-direction: column; flex: 1; }
.ma2-card {
  background: var(--white); border-radius: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px -8px rgba(5,51,102,.10);
  display: flex; flex-direction: column; flex: 1;
  animation: ma2SlideIn .38s cubic-bezier(.22,.68,0,1.2) both;
}
.ma2-card.dir-left  { animation: ma2SlideLeft  .38s cubic-bezier(.22,.68,0,1.2) both; }
.ma2-card.dir-right { animation: ma2SlideRight .38s cubic-bezier(.22,.68,0,1.2) both; }
@keyframes ma2SlideLeft  { from{opacity:0;transform:translateX(60px) scale(.97)} to{opacity:1;transform:none} }
@keyframes ma2SlideRight { from{opacity:0;transform:translateX(-60px) scale(.97)} to{opacity:1;transform:none} }
@keyframes ma2SlideIn    { from{opacity:0;transform:translateY(14px) scale(.98)} to{opacity:1;transform:none} }

.ma2-card-header {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid #F3F6F9; flex-shrink: 0;
}
.ma2-card-icon {
  width: 36px; height: 36px; border-radius: 12px;
  background: rgba(43,150,168,.10);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ma2-card-header h2 { font-size: 16px; font-weight: 800; color: var(--title); margin: 0; }
.ma2-card-header .step-badge {
  margin-left: auto; font-size: 11px; font-weight: 700;
  color: var(--primary); background: rgba(43,150,168,.09);
  padding: 3px 11px; border-radius: 20px; white-space: nowrap;
}
.ma2-card-header .count-badge {
  font-size: 11px; font-weight: 700;
  color: var(--primary); background: rgba(43,150,168,.09);
  padding: 3px 11px; border-radius: 20px; white-space: nowrap;
}
.ma2-card-body { padding: 20px 22px; flex: 1; overflow-y: auto; overflow-x: hidden; }

/* ── Cities grid ── */
.ma2-cities-grid { display: flex; flex-wrap: wrap; gap: 9px; }
.ma2-city-btn {
  padding: 9px 18px; border-radius: 22px;
  border: 2px solid var(--border); background: var(--white);
  color: var(--text); font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all .18s;
}
.ma2-city-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px -4px rgba(0,0,0,.12); }
.ma2-city-btn.on {
  border-color: var(--primary); background: rgba(43,150,168,.07);
  color: var(--primary); font-weight: 700;
  box-shadow: 0 4px 14px -4px rgba(43,150,168,.30);
}

/* ── Calendar / dates ── */
.ma2-dates-step-label {
  font-size: 12px; font-weight: 600; color: var(--muted);
  margin-bottom: 12px; letter-spacing: .02em;
}
.ma2-city-date-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 14px;
  border: 1.5px solid var(--border); background: #FAFBFC;
  margin-bottom: 8px; gap: 10px; flex-wrap: wrap;
}
.ma2-city-date-row-left { display: flex; align-items: center; gap: 8px; }
.ma2-city-name { font-size: 13px; font-weight: 700; color: var(--title); }
.ma2-city-nights { font-size: 12px; color: var(--primary); font-weight: 600; }
.ma2-city-date-btns { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.ma2-date-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 10px;
  border: 1.5px solid var(--border); background: var(--white);
  font-size: 12px; font-weight: 600; color: var(--muted);
  cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap;
}
.ma2-date-btn:hover { border-color: var(--primary); color: var(--primary); }
.ma2-date-btn.active { border-color: var(--primary); background: rgba(43,150,168,.07); color: var(--primary); }
.ma2-date-btn.disabled { opacity: .4; cursor: not-allowed; }
.ma2-date-conflict-banner {
  display: flex; align-items: flex-start; justify-content: space-between;
  background: #FEF2F2; border: 1.5px solid #FECACA;
  border-radius: 12px; padding: 10px 14px;
  font-size: 12px; color: #991b1b; margin-bottom: 10px; gap: 8px;
}
.ma2-date-conflict-banner button { background: none; border: none; cursor: pointer; color: #991b1b; font-size: 16px; }
.ma2-recap-box {
  background: rgba(43,150,168,.05); border: 1.5px solid rgba(43,150,168,.18);
  border-radius: 14px; padding: 12px 16px; margin-top: 10px;
}
.ma2-recap-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
.ma2-recap-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.ma2-recap-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; background: white;
  border: 1px solid rgba(43,150,168,.2); border-radius: 20px;
  font-size: 11px; font-weight: 600; color: var(--title);
}
.ma2-cal-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 20px; gap: 12px; text-align: center;
}
.ma2-cal-empty-icon { width: 52px; height: 52px; border-radius: 16px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; }
.ma2-cal-empty-text { font-size: 13px; color: var(--muted); max-width: 240px; line-height: 1.5; }

/* ── Cats ── */
.ma2-cats-wrap { display: flex; flex-wrap: wrap; gap: 9px; }
.ma2-cat-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 15px; border-radius: 24px;
  border: 2px solid var(--border); background: var(--white);
  color: var(--text); font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: inherit; transition: all .18s;
}
.ma2-cat-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 10px -4px rgba(0,0,0,.12); }
.ma2-cat-chip.on {
  border-color: var(--primary); background: rgba(43,150,168,.07);
  color: var(--primary); font-weight: 700;
}
.ma2-budget-section { margin-top: 20px; border-top: 1px solid var(--border); padding-top: 16px; }
.ma2-budget-label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.ma2-budget-input {
  width: 100%; padding: 10px 38px 10px 14px;
  border-radius: 12px; border: 1.5px solid var(--border);
  font-size: 14px; color: var(--title); outline: none;
  background: #FAFBFC; transition: border-color .2s; font-family: inherit;
}
.ma2-budget-input:focus { border-color: var(--primary); }
.ma2-budget-hint { font-size: 11px; color: var(--primary); margin-top: 6px; }

/* ── Error banner ── */
.ma2-err-banner {
  display: flex; align-items: flex-start; justify-content: space-between;
  background: #FEF2F2; border: 1.5px solid #FECACA;
  border-radius: 14px; padding: 12px 16px;
  font-size: 13px; color: #991b1b; margin-bottom: 16px; gap: 10px;
  width: 100%; max-width: 580px;
}
.ma2-err-banner button { background: none; border: none; cursor: pointer; color: #991b1b; font-size: 18px; }

/* ── Nav footer ── */
.ma2-nav-footer { width: 100%; max-width: 580px; margin-top: 14px; display: flex; align-items: center; gap: 10px; }
.ma2-back-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 22px; border-radius: 50px;
  border: 2px solid var(--border); background: var(--white);
  color: var(--text); font-size: 14px; font-weight: 700;
  font-family: inherit; cursor: pointer; transition: all .18s;
}
.ma2-back-btn:hover { border-color: var(--title); color: var(--title); }
.ma2-next-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px 28px; border-radius: 50px;
  border: none; background: var(--title); color: white;
  font-size: 15px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: all .22s;
  box-shadow: 0 10px 28px -8px rgba(5,51,102,.40);
}
.ma2-next-btn.primary { background: var(--primary); box-shadow: 0 10px 28px -8px rgba(43,150,168,.50); }
.ma2-next-btn:hover:not(:disabled) { transform: translateY(-2px); }
.ma2-next-btn:disabled { background: #E5E7EB; color: var(--muted); box-shadow: none; cursor: not-allowed; transform: none; }
.ma2-next-btn.danger-next { background: #2B96A8; }

/* ── Summary pill ── */
.ma2-summary-pill {
  font-size: 12px; color: var(--text);
  background: var(--white); border: 1px solid var(--border);
  border-radius: 30px; padding: 6px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
  max-width: 580px; width: 100%; margin-top: 8px; text-align: center;
}
.ma2-summary-pill .hl { color: var(--primary); font-weight: 700; }

/* ── Loading ── */
.ma2-loading-row { display: flex; align-items: center; gap: 10px; padding: 12px 0; color: #64748b; font-size: 13px; }

/* ── Gen screen ── */
.ma2-gen-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 20px; text-align: center; gap: 20px;
}
.ma2-gen-orb {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--title));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12px 32px -8px rgba(43,150,168,.55);
  animation: ma2pulse 2s ease-in-out infinite;
}
@keyframes ma2pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
.ma2-gen-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; color: var(--title); margin: 0; }
.ma2-gen-msg { font-size: 14px; color: var(--muted); max-width: 340px; line-height: 1.5; }
.ma2-gen-dots { display: flex; gap: 8px; justify-content: center; }
.ma2-gen-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); animation: ma2bounce 1.4s infinite; }
@keyframes ma2bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

/* ── Mini Calendar popup ── */
.ma2-cal-pop {
  background: white; border-radius: 14px; overflow: hidden;
}
.ma2-cal-pop-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid #F1F5F9;
}
.ma2-cal-month-label { font-size: 13px; font-weight: 700; color: var(--title); }
.ma2-cal-nav-btn {
  background: none; border: none; cursor: pointer;
  color: var(--muted); padding: 4px; border-radius: 8px; transition: all .15s;
  display: flex; align-items: center;
}
.ma2-cal-nav-btn:hover { color: var(--primary); background: rgba(43,150,168,.08); }
.ma2-cal-days-header {
  display: grid; grid-template-columns: repeat(7,1fr);
  padding: 8px 6px 2px;
}
.ma2-cal-day-name { text-align: center; font-size: 10px; font-weight: 700; color: var(--muted); }
.ma2-cal-grid {
  display: grid; grid-template-columns: repeat(7,1fr);
  padding: 4px 6px 10px; gap: 2px;
}
.ma2-cal-day-btn {
  aspect-ratio: 1; border: none; background: none;
  border-radius: 8px; font-size: 12px; font-weight: 500;
  color: var(--text); cursor: pointer; transition: all .12s;
  display: flex; align-items: center; justify-content: center;
  font-family: inherit;
}
.ma2-cal-day-btn:hover:not(:disabled) { background: rgba(43,150,168,.10); color: var(--primary); }
.ma2-cal-day-btn:disabled { color: #D1D5DB; cursor: not-allowed; }
.ma2-cal-day-btn.selected { background: var(--primary); color: white; font-weight: 700; }
.ma2-cal-day-btn.blocked  { background: #FEF2F2; color: #FECACA; }
.ma2-cal-legend { display: flex; align-items: center; gap: 6px; padding: 6px 10px 10px; font-size: 10px; color: var(--muted); }
.ma2-cal-legend-dot { width: 8px; height: 8px; border-radius: 50%; background: #FCA5A5; }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .ma2-topbar { padding: 12px 16px; gap: 8px; }
  .ma2-topbar h1 { font-size: 15px; }
  .ma2-body { padding: 14px 12px 28px; }
  .ma2-card-body { padding: 16px; }
  .ma2-card-header { padding: 14px 16px 12px; }
  .ma2-city-date-row { padding: 8px 10px; }
  .ma2-gen-title { font-size: 18px; }
}
`;

/* ════════════════════════════
   MiniCalPop
════════════════════════════ */
function MiniCalPop({
  value, onChange, minDate, onClose, blockedRanges,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  minDate?: Date | null;
  onClose: () => void;
  blockedRanges?: { start: Date; end: Date }[];
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [cursor, setCursor] = useState(() => {
    const ref = value || minDate || today;
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  });
  const year = cursor.getFullYear(), month = cursor.getMonth();
  let firstDayIndex = new Date(year, month, 1).getDay();
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isBlocked = (day: number | null) => {
    if (!day || !blockedRanges?.length) return false;
    const date = new Date(year, month, day); date.setHours(0,0,0,0);
    return blockedRanges.some(r => {
      const s = new Date(r.start); s.setHours(0,0,0,0);
      const e = new Date(r.end);   e.setHours(0,0,0,0);
      return date >= s && date <= e;
    });
  };
  const isDisabled = (day: number | null) => {
    if (!day) return true;
    const date = new Date(year, month, day);
    if (date < today) return true;
    if (minDate) { const m = new Date(minDate); m.setHours(0,0,0,0); if (date < m) return true; }
    return isBlocked(day);
  };
  const isSelected = (day: number | null) =>
    !!(day && value && value.getDate() === day && value.getMonth() === month && value.getFullYear() === year);

  return (
    <div className="ma2-cal-pop" onClick={e => e.stopPropagation()} style={{ width: 260 }}>
      <div className="ma2-cal-pop-header">
        <button className="ma2-cal-nav-btn" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={16}/></button>
        <span className="ma2-cal-month-label">{MONTHS_FULL[month]} {year}</span>
        <button className="ma2-cal-nav-btn" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={16}/></button>
      </div>
      <div className="ma2-cal-days-header">{DAYS_FR.map(d => <div key={d} className="ma2-cal-day-name">{d}</div>)}</div>
      <div className="ma2-cal-grid">
        {cells.map((day, i) => {
          const disabled = isDisabled(day);
          const blocked  = isBlocked(day);
          const selected = isSelected(day);
          return (
            <button key={i} disabled={disabled}
              onClick={() => { if (day && !disabled) { onChange(new Date(year, month, day)); onClose(); } }}
              className={["ma2-cal-day-btn", selected ? "selected" : "", blocked ? "blocked" : ""].join(" ")}
            >{day || ""}</button>
          );
        })}
      </div>
      {!!blockedRanges?.length && (
        <div className="ma2-cal-legend">
          <span className="ma2-cal-legend-dot"/>
          <span>Dates réservées pour une autre ville</span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════
   CityDateRow
════════════════════════════ */
function CityDateRow({ cdr, onStart, onEnd, allCityDates }: {
  cdr: CityDateRange; onStart: (d:Date)=>void; onEnd: (d:Date)=>void; allCityDates: CityDateRange[];
}) {
  const [openPop, setOpenPop] = useState<"start"|"end"|null>(null);
  const minEnd = cdr.start ? new Date(cdr.start) : undefined;
  const nights = cdr.start && cdr.end ? daysBetween(cdr.start, cdr.end) : 0;
  const blocked = getBlockedDates(allCityDates, cdr.city);

  const portal = openPop ? createPortal(
    <>
      <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setOpenPop(null)}/>
      <div style={{
        position:"fixed", top:"80px", left:"50%",
        transform:"translateX(-50%) scale(0.88)", transformOrigin:"top center",
        zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
        borderRadius:12, background:"#fff",
      }} onWheel={e=>e.stopPropagation()}>
        <MiniCalPop
          value={openPop === "start" ? cdr.start : cdr.end}
          onChange={d => { if (openPop==="start") onStart(d); else onEnd(d); setOpenPop(null); }}
          minDate={openPop === "end" ? minEnd : undefined}
          onClose={() => setOpenPop(null)}
          blockedRanges={blocked}
        />
      </div>
    </>, document.body
  ) : null;

  return (
    <>
      <div className="ma2-city-date-row">
        <div className="ma2-city-date-row-left">
          <span className="ma2-city-name">{cdr.city}</span>
          {nights > 0 && <span className="ma2-city-nights">• {nights} jour{nights>1?"s":""}</span>}
        </div>
        <div className="ma2-city-date-btns">
          <button onClick={() => setOpenPop(openPop==="start"?null:"start")}
            className={["ma2-date-btn", cdr.start?"active":""].join(" ")}>
            <CalendarDays size={12}/>
            {cdr.start ? fmtShort(cdr.start) : "Arrivée"}
          </button>
          <ArrowRight size={14} color="#94a3b8"/>
          <button onClick={() => { if (cdr.start) setOpenPop(openPop==="end"?null:"end"); }}
            className={["ma2-date-btn", cdr.end?"active":"", !cdr.start?"disabled":""].join(" ")}>
            <CalendarDays size={12}/>
            {cdr.end ? fmtShort(cdr.end) : "Départ"}
          </button>
        </div>
      </div>
      {portal}
    </>
  );
}

/* ════════════════════════════
   DebugPanel
════════════════════════════ */
function DebugPanel({ webhookUrl }: { webhookUrl: string }) {
  const [open,   setOpen]   = useState(false);
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [log,    setLog]    = useState<string[]>([]);
  const addLog = (msg: string) => setLog(p => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runTest = async () => {
    setStatus("loading"); setLog([]);
    addLog("▶ Démarrage du test..."); addLog(`URL: ${webhookUrl}`);
    const payload = { destination:"Tunis",startDate:"2025-06-01",endDate:"2025-06-03",budget:500,travelers:1,interests:["Culture"],cities:["Tunis"],citySchedule:[{city:"Tunis",startDate:"2025-06-01",endDate:"2025-06-03",daysCount:3}],message:"Test debug" };
    addLog("📤 Payload: " + JSON.stringify(payload,null,2));
    try {
      const res = await fetch(webhookUrl, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      addLog(`📥 Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      addLog("📥 Réponse: " + text.substring(0,2000));
      if (!res.ok) { setStatus("error"); return; }
      try {
        const json = JSON.parse(text);
        if (json.days) { addLog(`✅ Itinéraire: ${json.days.length} jour(s)`); setStatus("ok"); }
        else { addLog("⚠️ JSON sans 'days'. Clés: " + Object.keys(json).join(", ")); setStatus("error"); }
      } catch { addLog("⚠️ Réponse non-JSON"); setStatus("error"); }
    } catch (err: any) { addLog("❌ Erreur réseau: " + err.message); setStatus("error"); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ position:"fixed",bottom:24,right:24,zIndex:9999,background:"#1e293b",color:"#fff",border:"none",borderRadius:12,padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.3)",opacity:0.85 }}>
      <Bug size={15}/> Debug N8N
    </button>
  );

  return (
    <div style={{ position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={() => setOpen(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#0f172a",color:"#e2e8f0",borderRadius:16,width:"100%",maxWidth:700,maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 25px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ padding:"16px 20px",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <Bug size={18} color="#38bdf8"/>
            <span style={{ fontWeight:700,fontSize:15 }}>Debug Webhook N8N</span>
            {status==="ok"      && <span style={{ background:"#166534",color:"#86efac",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700 }}>✅ OK</span>}
            {status==="error"   && <span style={{ background:"#7f1d1d",color:"#fca5a5",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700 }}>❌ ERREUR</span>}
            {status==="loading" && <span style={{ background:"#1e3a5f",color:"#93c5fd",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700 }}>⏳ EN COURS</span>}
          </div>
          <button onClick={() => setOpen(false)} style={{ background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:20 }}>✕</button>
        </div>
        <div style={{ padding:"12px 20px",borderBottom:"1px solid #1e293b",background:"#0a0f1a" }}>
          <p style={{ fontSize:11,color:"#64748b",marginBottom:4 }}>WEBHOOK URL</p>
          <p style={{ fontSize:12,color:"#38bdf8",fontFamily:"monospace",wordBreak:"break-all" }}>{webhookUrl||"⚠️ NEXT_PUBLIC_N8N_WEBHOOK_URL non défini !"}</p>
        </div>
        <div style={{ flex:1,overflow:"auto",padding:"16px 20px",fontFamily:"monospace",fontSize:12,lineHeight:1.7 }}>
          {log.length===0 ? <p style={{ color:"#475569" }}>Cliquez sur "Lancer le test" pour diagnostiquer...</p>
            : log.map((line,i) => <div key={i} style={{ color:line.includes("❌")?"#f87171":line.includes("✅")?"#86efac":line.includes("⚠️")?"#fbbf24":line.includes("▶")?"#38bdf8":line.includes("📤")?"#a78bfa":line.includes("📥")?"#34d399":"#cbd5e1",marginBottom:2,whiteSpace:"pre-wrap",wordBreak:"break-all" }}>{line}</div>)}
        </div>
        <div style={{ padding:"14px 20px",borderTop:"1px solid #1e293b",display:"flex",gap:10 }}>
          <button onClick={runTest} disabled={status==="loading"} style={{ flex:1,background:status==="loading"?"#1e3a5f":"#0ea5e9",color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",cursor:status==="loading"?"not-allowed":"pointer",fontWeight:700,fontSize:13 }}>
            {status==="loading"?"⏳ En cours...":"▶ Lancer le test"}
          </button>
          <button onClick={()=>setLog([])} style={{ background:"#1e293b",color:"#94a3b8",border:"none",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13 }}>Effacer</button>
          <button onClick={()=>setOpen(false)} style={{ background:"#1e293b",color:"#94a3b8",border:"none",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13 }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════
   Steps config
════════════════════════════ */
const STEPS = [
  { label: "Destinations", icon: <MapPin     size={15} color="#2B96A8"/> },
  { label: "Calendrier",   icon: <CalendarDays size={15} color="#2B96A8"/> },
  { label: "Intérêts",     icon: <Heart       size={15} color="#2B96A8"/> },
];

/* ════════════════════════════
   Main Component
════════════════════════════ */
export default function ModeAssiste() {
  const supabase = createClient();

  const [appStep, setAppStep]               = useState<"questions"|"generation"|"itineraire">("questions");
  const [cardStep, setCardStep]             = useState(0);
  const [slideDir, setSlideDir]             = useState<"left"|"right">("left");
  const [animKey,  setAnimKey]              = useState(0);

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityDates, setCityDates]           = useState<CityDateRange[]>([]);
  const [selectedCats, setSelectedCats]     = useState<string[]>([]);
  const [budget, setBudget]                 = useState<string>("");

  const [villes,     setVilles]     = useState<Ville[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [dbLoading,  setDbLoading]  = useState(true);

  const [itinerary, setItinerary]   = useState<Itinerary | null>(null);
  const [genError,  setGenError]    = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const msgIdxRef = useRef(0);

  const [dateError, setDateError]   = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveStatus, setSaveStatus]     = useState<"idle"|"ok"|"error"|"login">("idle");

  /* ── Derived ── */
  const totalDays = cityDates.reduce(
    (acc, cdr) => acc + (cdr.start && cdr.end ? daysBetween(cdr.start, cdr.end) : 0), 0
  );
  const allDatesSet = cityDates.length > 0 && cityDates.every(c => c.start && c.end);
  const totalPrice  = itinerary?.days.reduce(
    (acc, d) => acc + d.activities.reduce((a, act) => a + (Number(act.price)||0), 0), 0
  ) ?? 0;
  const itineraryAsExc = itinerary ? {
    id: "itinerary-" + Date.now(), title: itinerary.title,
    city: selectedCities.join(", "), duration_hours: totalDays * 8,
    price_per_person: totalPrice, max_people: 20,
  } : null;

  /* Step 2 can proceed without categories (optional) */
  const canGenerate = selectedCities.length > 0 && allDatesSet && !dateError && !!N8N_WEBHOOK_URL;

  /* ── Load Supabase ── */
  useEffect(() => {
    (async () => {
      setDbLoading(true);
      try {
        const [{ data: v }, { data: c }, { data: e }] = await Promise.all([
          supabase.from("villes").select("*").order("nom"),
          supabase.from("categories").select("*").order("nom"),
          supabase.from("excursions").select("*").eq("is_active", true),
        ]);
        setVilles((v||[]) as Ville[]);
        setCategories((c||[]) as Categorie[]);
        setExcursions((e||[]) as Excursion[]);
      } catch {}
      finally { setDbLoading(false); }
    })();
  }, []);

  /* ── Navigation between cards ── */
  const goCard = (next: number) => {
    setSlideDir(next > cardStep ? "left" : "right");
    setAnimKey(k => k + 1);
    setCardStep(next);
  };

  /* ── City toggle ── */
  const toggleCity = (nom: string) => {
    setSelectedCities(prev => {
      const next = prev.includes(nom) ? prev.filter(x => x !== nom) : [...prev, nom];
      setCityDates(next.map(c => cityDates.find(cd => cd.city === c) ?? { city: c, start: null, end: null }));
      setDateError(""); return next;
    });
  };
  const toggleCat = (id: string) =>
    setSelectedCats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const updateCityStart = (city: string, d: Date) => {
    const cur = cityDates.find(c => c.city === city);
    const conflict = cityDates.find(c => c.city !== city && datesOverlap(d, cur?.end ?? null, c.start, c.end));
    if (conflict) { setDateError(`Conflit avec "${conflict.city}"`); return; }
    setDateError("");
    setCityDates(prev => prev.map(c => c.city !== city ? c : { ...c, start: d, end: c.end && c.end < d ? null : c.end }));
  };
  const updateCityEnd = (city: string, d: Date) => {
    const cur = cityDates.find(c => c.city === city);
    const conflict = cityDates.find(c => c.city !== city && datesOverlap(cur?.start ?? null, d, c.start, c.end));
    if (conflict) { setDateError(`Conflit avec "${conflict.city}"`); return; }
    setDateError("");
    setCityDates(prev => prev.map(c => c.city !== city ? c : { ...c, end: d }));
  };

  /* ── Generate ── */
  const generate = async () => {
    if (!canGenerate) return;
    setAppStep("generation"); setGenError("");
    msgIdxRef.current = 0; setLoadingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => {
      msgIdxRef.current = Math.min(msgIdxRef.current + 1, LOADING_MSGS.length - 1);
      setLoadingMsg(LOADING_MSGS[msgIdxRef.current]);
    }, 2000);
    try {
      const catNames = selectedCats.map(id => categories.find(c => c.id === id)?.nom).filter(Boolean) as string[];
      const citySchedule = cityDates
        .map(cdr => ({ city: cdr.city, startDate: cdr.start ? formatDateForN8N(cdr.start) : null, endDate: cdr.end ? formatDateForN8N(cdr.end) : null, daysCount: cdr.start && cdr.end ? daysBetween(cdr.start, cdr.end) : 0 }))
        .filter(s => s.startDate && s.endDate);
      const payload = {
        destination: selectedCities.join(", "), startDate: citySchedule[0]?.startDate||"",
        endDate: citySchedule[citySchedule.length-1]?.endDate||"",
        budget: budget ? Number(budget) : 0, travelers: 1, interests: catNames,
        cities: selectedCities, citySchedule,
        message: `Séjour en Tunisie du ${citySchedule[0]?.startDate} au ${citySchedule[citySchedule.length-1]?.endDate}`,
        timestamp: new Date().toISOString(),
      };
      const res = await fetch(N8N_WEBHOOK_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      clearInterval(iv);
      if (!res.ok) throw new Error(`n8n error ${res.status}`);
      const data = await res.json();
      setItinerary(extractItinerary(data));
      setAppStep("itineraire");
    } catch (err) {
      clearInterval(iv);
      setGenError(err instanceof Error ? err.message : "Erreur inconnue");
      setAppStep("questions");
    }
  };

  const handleChangeActivity = (dayIdx: number, actIdx: number, alt: Activity) => {
    if (!itinerary) return;
    const upd: Itinerary = JSON.parse(JSON.stringify(itinerary));
    upd.days[dayIdx].activities[actIdx] = alt;
    setItinerary(upd);
  };

  const saveItinerary = async () => {
    if (!itinerary) return;
    setSaving(true); setSaveStatus("idle");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus("login"); setSaving(false); return; }
      const catNames = selectedCats.map(id => categories.find(c=>c.id===id)?.nom).filter(Boolean) as string[];
      const { error } = await supabase.from("itineraires").insert({
        user_id: user.id, nb_jours: totalDays, villes_selectionnees: selectedCities,
        categories_selectionnees: catNames, budget: budget ? Number(budget) : null,
        city_schedule: cityDates.map(c => ({ city: c.city, start: c.start?.toISOString(), end: c.end?.toISOString() })),
        plan: itinerary,
      });
      setSaveStatus(error ? "error" : "ok");
    } catch { setSaveStatus("error"); }
    finally { setSaving(false); setTimeout(() => setSaveStatus("idle"), 4000); }
  };

  const resetAll = () => {
    setAppStep("questions"); setCardStep(0); setItinerary(null);
    setSelectedCities([]); setCityDates([]); setSelectedCats([]);
    setBudget(""); setGenError(""); setDateError(""); setShowCheckout(false); setSaveStatus("idle");
  };

  /* ── Summary pill content ── */
  const summaryParts: string[] = [];
  if (selectedCities.length) summaryParts.push(selectedCities.slice(0,2).join(", ") + (selectedCities.length>2 ? ` +${selectedCities.length-2}`:``));
  if (totalDays > 0) summaryParts.push(`${totalDays}j`);
  if (selectedCats.length) summaryParts.push(`${selectedCats.length} intérêt${selectedCats.length>1?"s":""}`);

  /* ── Can advance each step ── */
  const canStep0 = selectedCities.length > 0;
  const canStep1 = allDatesSet && !dateError;

  /* ════════ RENDER ════════ */
  return (
    <div style={{ minHeight:"100vh", background:"#F6F9FB", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{CSS}</style>
      <TouristeNav/>
      <div style={{ paddingTop: 64 }}/>
      <DebugPanel webhookUrl={N8N_WEBHOOK_URL}/>

      {/* ── Questions / wizard flow ── */}
      {appStep === "questions" && (
        <div className="ma2-page">
          {/* Topbar */}
          <div className="ma2-topbar">
            <div className="badge"><Sparkles size={13}/> Mode Assisté</div>
            <h1>Composez votre itinéraire <span>sur mesure</span></h1>
          </div>

          {/* Step indicator */}
          <div className="ma2-steps-indicator">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="ma2-step-pip">
                  <div className={`ma2-step-pip-circle${i < cardStep ? " done" : i === cardStep ? " active" : ""}`}>
                    {i < cardStep ? <CheckCircle size={15} color="white"/> : i + 1}
                  </div>
                  <span className={`ma2-step-pip-label${i < cardStep ? " done" : i === cardStep ? " active" : ""}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className={`ma2-step-connector${i < cardStep ? " done" : ""}`}/>}
              </React.Fragment>
            ))}
          </div>

          <div className="ma2-body">
            {/* Error banner */}
            {genError && (
              <div className="ma2-err-banner">
                <span><strong>Erreur :</strong> {genError}</span>
                <button onClick={() => setGenError("")}>✕</button>
              </div>
            )}

            <div className="ma2-card-viewport">

              {/* ─── Step 0 : Destinations ─── */}
              {cardStep === 0 && (
                <div key={`c-${animKey}`} className={`ma2-card dir-${slideDir}`}>
                  <div className="ma2-card-header">
                    <div className="ma2-card-icon"><MapPin size={16} color="#2B96A8"/></div>
                    <h2>Destinations</h2>
                    {selectedCities.length > 0 && (
                      <span className="count-badge">{selectedCities.length} sélectionnée{selectedCities.length>1?"s":""}</span>
                    )}
                    <span className="step-badge">Étape 1 / 3</span>
                  </div>
                  <div className="ma2-card-body">
                    {dbLoading ? (
                      <div className="ma2-loading-row"><Loader2 size={18} className={styles.spin}/><span>Chargement...</span></div>
                    ) : (
                      <div className="ma2-cities-grid">
                        {villes.map(v => {
                          const nom = String(v.nom || v.name || "");
                          const on  = selectedCities.includes(nom);
                          return (
                            <button key={v.id} onClick={() => toggleCity(nom)}
                              className={["ma2-city-btn", on?"on":""].join(" ")}>
                              {nom}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Step 1 : Calendrier ─── */}
              {cardStep === 1 && (
                <div key={`c-${animKey}`} className={`ma2-card dir-${slideDir}`}>
                  <div className="ma2-card-header">
                    <div className="ma2-card-icon"><CalendarDays size={16} color="#2B96A8"/></div>
                    <h2>Calendrier</h2>
                    {totalDays > 0 && <span className="count-badge">🗓️ {totalDays}j</span>}
                    <span className="step-badge">Étape 2 / 3</span>
                  </div>
                  <div className="ma2-card-body">
                    <p className="ma2-dates-step-label">
                      {cityDates.filter(c=>c.start&&c.end).length}/{cityDates.length} étapes configurées
                    </p>

                    {dateError && (
                      <div className="ma2-date-conflict-banner">
                        <div style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                          <AlertTriangle size={15} style={{ marginTop:1,flexShrink:0 }}/>
                          <span>{dateError}</span>
                        </div>
                        <button onClick={() => setDateError("")}>✕</button>
                      </div>
                    )}

                    {cityDates.map(cdr => (
                      <CityDateRow key={cdr.city} cdr={cdr} allCityDates={cityDates}
                        onStart={d => updateCityStart(cdr.city, d)}
                        onEnd={d   => updateCityEnd(cdr.city, d)}/>
                    ))}

                    {allDatesSet && !dateError && (
                      <div className="ma2-recap-box">
                        <div className="ma2-recap-title"><CheckCircle size={14} color="#2B96A8"/> Récapitulatif</div>
                        <div className="ma2-recap-pills">
                          {cityDates.map(cdr => cdr.start && cdr.end && (
                            <span key={cdr.city} className="ma2-recap-pill">
                              <MapPin size={10}/>
                              {cdr.city} · {fmtShort(cdr.start)} → {fmtShort(cdr.end)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Step 2 : Intérêts + Budget ─── */}
              {cardStep === 2 && (
                <div key={`c-${animKey}`} className={`ma2-card dir-${slideDir}`}>
                  <div className="ma2-card-header">
                    <div className="ma2-card-icon"><Heart size={16} color="#2B96A8"/></div>
                    <h2>Centres d&apos;intérêt</h2>
                    {selectedCats.length > 0 && (
                      <span className="count-badge">{selectedCats.length} choisi{selectedCats.length>1?"s":""}</span>
                    )}
                    <span className="step-badge">Étape 3 / 3</span>
                  </div>
                  <div className="ma2-card-body">
                    <p style={{ fontSize:12,color:"#9CA3AF",marginBottom:14,fontStyle:"italic",textAlign:"center" }}>
                      Optionnel — passez directement si vous voulez tout découvrir
                    </p>
                    {dbLoading ? (
                      <div className="ma2-loading-row"><Loader2 size={18} className={styles.spin}/><span>Chargement...</span></div>
                    ) : (
                      <div className="ma2-cats-wrap">
                        {categories.map(cat => {
                          const catName = String(cat.nom || cat.name || cat.label || "");
                          const isOn    = selectedCats.includes(cat.id);
                          return (
                            <button key={cat.id} onClick={() => toggleCat(cat.id)}
                              className={["ma2-cat-chip", isOn?"on":""].join(" ")}>
                              <Sparkles size={12}/>{catName}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="ma2-budget-section">
                      <p className="ma2-budget-label"><Euro size={14} color="#2B96A8"/> Budget total (optionnel)</p>
                      <div style={{ position:"relative" }}>
                        <input type="number" min={0} placeholder="Ex: 500"
                          value={budget} onChange={e => setBudget(e.target.value)}
                          className="ma2-budget-input"/>
                        <span style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:"#9CA3AF",fontSize:14,fontWeight:600,pointerEvents:"none" }}>€</span>
                      </div>
                      {budget && Number(budget) > 0 && (
                        <p className="ma2-budget-hint">Budget de <strong>{Number(budget).toLocaleString("fr-FR")} €</strong> pris en compte</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Summary pill */}
            {summaryParts.length > 0 && (
              <div className="ma2-summary-pill">
                {summaryParts.map((p, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && " · "}
                    <span className="hl">{p}</span>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Nav footer */}
            <div className="ma2-nav-footer">
              {cardStep > 0 && (
                <button className="ma2-back-btn" onClick={() => goCard(cardStep - 1)}>
                  <ArrowLeft size={16}/> Retour
                </button>
              )}

              {cardStep === 0 && (
                <button className="ma2-next-btn" onClick={() => goCard(1)} disabled={!canStep0}>
                  Définir les dates <ArrowRight size={17}/>
                </button>
              )}

              {cardStep === 1 && (
                <button className="ma2-next-btn" onClick={() => goCard(2)} disabled={!canStep1}>
                  Choisir mes intérêts <ArrowRight size={17}/>
                </button>
              )}

              {cardStep === 2 && (
                <>
                  {dateError && (
                    <p style={{ fontSize:12,color:"#c2410c",display:"flex",alignItems:"center",gap:5 }}>
                      <AlertTriangle size={13}/> Corrigez les conflits de dates
                    </p>
                  )}
                  <button className="ma2-next-btn primary" onClick={generate} disabled={!canGenerate}>
                    <Bot size={17}/> Générer mon itinéraire <ArrowRight size={17}/>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Generation screen ── */}
      {appStep === "generation" && (
        <div className="ma2-page">
          <div className="ma2-gen-screen">
            <div className="ma2-gen-orb"><Bot size={32} color="#ffffff" strokeWidth={1.5}/></div>
            <h2 className="ma2-gen-title">L&apos;agent IA prépare votre voyage…</h2>
            <p className="ma2-gen-msg">{loadingMsg}</p>
            <div className="ma2-gen-dots">
              {[0, 200, 400].map(delay => (
                <div key={delay} className="ma2-gen-dot" style={{ animationDelay:`${delay}ms` }}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Itinerary result ── */}
      {appStep === "itineraire" && itinerary && (
        <div style={{ flex:1, overflow:"auto" }}>
          <ItineraireDisplay
            itinerary={itinerary}
            selectedCities={selectedCities}
            selectedCats={selectedCats}
            categories={categories as { id:string; nom?:string; name?:string }[]}
            excursions={excursions}
            totalPrice={totalPrice}
            saving={saving}
            saveStatus={saveStatus}
            onBack={() => setAppStep("questions")}
            onReset={resetAll}
            onCheckout={() => setShowCheckout(true)}
            onSave={saveItinerary}
            onChangeActivity={handleChangeActivity}
          />
        </div>
      )}

      {showCheckout && itineraryAsExc && (
        <Checkoutmodal
          excursions={[itineraryAsExc]}
          itineraireTitle={itinerary?.title}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}