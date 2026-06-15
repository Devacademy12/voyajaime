"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TouristeNav from "@/app/components/touriste/TouristeNav";

import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Star,
  Trash2, Search, CheckCircle2,
  Euro, ChevronRight, Loader2,
  Sunrise, Sun, Moon, Plus, X, Camera, CheckCircle,
  AlertCircle, Sparkles, Navigation,
  SlidersHorizontal, TrendingUp,
  Edit2, Check, HelpCircle, Lock,
} from "lucide-react";

import { ExcursionDetailModal } from "@/app/components/excursions/ExcursionDetailModal";
import { LoadingSpinner } from "@/app/components/excursions/LoadingSpinner";
import ItinerarySummary, { SummaryDayPlan } from "@/app/components/itineraire/ItinerarySummary";
import { HelpPanel } from "@/app/components/itineraire/HelpPanel";

/* ─── Types ─── */
type Excursion = {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number;
  categories: string[]; photos: string[];
  /**
   * depart_time : colonne `time without time zone` de la BDD (ex: "09:30:00" ou "09:30").
   * Quand ce champ est renseigné, l'heure de départ est FIXE et non modifiable.
   * Quand il est null/undefined, l'utilisateur choisit librement.
   */
  depart_time?: string | null;
  available_dates?: any;
  max_people?: number; difficulty?: string; min_age?: number;
};
type ExcursionDetail = {
  id: string; title: string; city: string; region: string|null;
  description: string; duration_hours: number; price_per_person: number;
  max_people: number; categories: string[]; languages: string[];
  inclusions: string[]; photos: string[]; rating: number;
  reviews_count: number; meeting_point: string|null;
  difficulty: string|null; min_age: number|null;
  what_to_bring: string|null; not_included: string|null;
  important_info: string|null; cancel_policy: string|null;
  available_dates: any;
  depart_time: string|null;
};
type Categorie  = { id: string; nom: string; emoji: string; couleur: string };
type Ville      = { id: string; nom: string; region: string; description: string|null; active: boolean; image_url: string|null };
type TimeKey    = "matin"|"aprem"|"soir";
type ActivityItem = { id: string; excursion: Excursion; note: string; time: TimeKey; customTime: string };
type DayPlan    = { city: string; date?: string; activities: ActivityItem[] };
type ViewStep   = "builder"|"result";

type ConflictInfo = {
  hasConflict: boolean;
  conflictingActivity?: ActivityItem;
  message?: string;
};

const BRAND = "#2B96A8";
const NAVY  = "#053366";

const SLOTS = [
  { key:"matin" as TimeKey,  label:"Matin",      icon:<Sunrise size={13}/>, color:"#F59E0B", bg:"rgba(245,158,11,.10)", hint:"8h – 12h",  defaultTime:"09:00" },
  { key:"aprem" as TimeKey,  label:"Après-midi", icon:<Sun size={13}/>,     color:BRAND,     bg:"rgba(43,150,168,.10)", hint:"13h – 17h", defaultTime:"13:00" },
  { key:"soir"  as TimeKey,  label:"Soir",        icon:<Moon size={13}/>,    color:"#8B5CF6", bg:"rgba(139,92,246,.10)", hint:"18h – 22h", defaultTime:"18:00" },
];

/* ────────────────────────────────────────────
   Utilitaires date
──────────────────────────────────────────── */
function normalizeDate(d: string): string { return String(d||"").trim().substring(0,10); }

function isAvailableOnDate(exc: Excursion, date: string): boolean {
  const avail = exc.available_dates;
  if (!avail) return true;
  const nd = normalizeDate(date);
  if (!nd) return true;
  if (Array.isArray(avail)) {
    if (avail.length === 0) return true;
    const first = avail[0];
    if (typeof first==="object" && first!==null && "date" in first)
      return avail.some((i:any) => normalizeDate(i.date)===nd);
    if (typeof first==="string")
      return avail.some((d:string) => normalizeDate(d)===nd);
    return true;
  }
  if (typeof avail==="object" && avail!==null) {
    if (Object.keys(avail).length===0) return true;
    if (avail.dates && Array.isArray(avail.dates)) {
      if (avail.dates.length===0) return true;
      return avail.dates.some((i:any) => typeof i==="string"?normalizeDate(i)===nd:normalizeDate(i.date)===nd);
    }
    if (avail.start && avail.end) {
      const inRange = nd>=normalizeDate(avail.start) && nd<=normalizeDate(avail.end);
      if (avail.days?.length>0) {
        if (!inRange) return false;
        const [y,m,dd] = nd.split("-").map(Number);
        const fr = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
        return avail.days.includes(fr[new Date(y,m-1,dd).getDay()]);
      }
      return inRange;
    }
  }
  return true;
}

/* ────────────────────────────────────────────
   Utilitaires horaires
──────────────────────────────────────────── */

/** "HH:MM(:SS)" → minutes depuis minuit */
function timeToMinutes(time: string): number {
  const parts = (time || "00:00").split(":");
  return parseInt(parts[0]||"0",10)*60 + parseInt(parts[1]||"0",10);
}

/** minutes → "HH:MM" */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes/60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

/**
 * Normalise depart_time depuis la BDD ("HH:MM:SS" ou "HH:MM") → "HH:MM".
 * Retourne null si aucun horaire n'est défini.
 */
function normalizeDepartTime(raw: string|null|undefined): string|null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Prend les 5 premiers caractères : "HH:MM"
  return s.substring(0,5);
}

/** Créneau horaire d'une heure "HH:MM" */
function slotForTime(time: string): TimeKey {
  const h = Number(time.split(":")[0]);
  if (h < 12) return "matin";
  if (h < 18) return "aprem";
  return "soir";
}

/** Heure de fin = début + durée */
function computeEndTime(startTime: string, durationHours: number): string {
  return minutesToTime(timeToMinutes(startTime) + Math.round(durationHours*60));
}

/**
 * Détecte si l'ajout d'une excursion démarrant à `startTime`
 * chevauche une activité existante (buffer 15 min entre activités).
 */
function checkTimeConflict(
  activities: ActivityItem[],
  newExc: Excursion,
  startTime: string,
): ConflictInfo {
  const BUFFER = 15;
  const newStart = timeToMinutes(startTime);
  const newEnd   = newStart + Math.round(newExc.duration_hours*60);

  for (const act of activities) {
    const actStart = timeToMinutes(act.customTime);
    const actEnd   = actStart + Math.round(act.excursion.duration_hours*60);
    if (newStart < actEnd + BUFFER && newEnd + BUFFER > actStart) {
      return {
        hasConflict: true,
        conflictingActivity: act,
        message: `Conflit avec "${act.excursion.title}" (${act.customTime} – ${minutesToTime(actEnd)})`,
      };
    }
  }
  return { hasConflict: false };
}

/* ────────────────────────────────────────────
   toSummaryDays
──────────────────────────────────────────── */
function toSummaryDays(itin: DayPlan[]): SummaryDayPlan[] {
  return itin.map((d,i) => ({
    day: i+1, city: d.city, date: d.date,
    activities: d.activities.map(act => ({
      id: act.id, time: act.time, customTime: act.customTime, note: act.note,
      excursion: {
        title:            act.excursion.title,
        city:             act.excursion.city,
        price_per_person: act.excursion.price_per_person,
        duration_hours:   act.excursion.duration_hours,
        rating:           act.excursion.rating,
        photos:           act.excursion.photos,
        categories:       act.excursion.categories,
        available_dates:  act.excursion.available_dates,
      },
    })),
  }));
}

/* ════════════════════════════════════════════
   CSS
════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --primary:#2B96A8; --navy:#053366; --bg:#F5F7FA;
  --surface:#ffffff; --border:#E2E8F0; --text:#334155; --muted:#94A3B8;
  --r-md:10px; --r-lg:16px; --r-xl:22px;
  --shadow-sm:0 1px 4px rgba(5,51,102,.06); --shadow-md:0 4px 16px rgba(5,51,102,.10);
}

.bldr-root{
  min-height:100vh; background:var(--bg);
  font-family:'DM Sans',system-ui,sans-serif; color:var(--text);
  display:flex; flex-direction:column;
}

/* NAV */
.bldr-nav{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;gap:10px;
  padding:0 22px;height:54px;
  background:var(--surface);border-bottom:1px solid var(--border);
  box-shadow:var(--shadow-sm);
}
.bldr-nav-pill{display:flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:rgba(43,150,168,.09);color:var(--primary);font-size:11px;font-weight:700}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:50px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s;white-space:nowrap;border:1.5px solid transparent}
.btn-ghost{background:var(--surface);color:var(--text);border-color:var(--border)}
.btn-ghost:hover{border-color:var(--navy);color:var(--navy)}
.btn-ghost:disabled{opacity:.4;cursor:not-allowed}
.btn-primary{background:var(--navy);color:#fff;border-color:var(--navy);box-shadow:0 6px 18px -4px rgba(5,51,102,.35)}
.btn-primary:hover:not(:disabled){transform:translateY(-1px)}
.btn-primary:disabled{background:#CBD5E1;border-color:#CBD5E1;color:#94A3B8;box-shadow:none;cursor:not-allowed}
.btn-teal{background:var(--primary);color:#fff;border-color:var(--primary);box-shadow:0 6px 18px -4px rgba(43,150,168,.40)}
.btn-teal:hover{transform:translateY(-1px)}
.btn-sm{display:inline-flex;align-items:center;gap:3px;padding:4px 9px;border-radius:7px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit}
.btn-sm:hover{border-color:var(--primary);color:var(--primary)}
.btn-sm.danger:hover{border-color:#DC2626;color:#DC2626}

/* HERO STRIP */
.bldr-hero-strip{
  background:linear-gradient(135deg,var(--navy) 0%,#0b4a7a 55%,var(--primary) 100%);
  padding:16px 24px; color:#fff;
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
}
.bldr-hero-left{display:flex;align-items:center;gap:12px}
.bldr-hero-pill{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700}
.bldr-hero-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:900}
.bldr-hero-cities{font-size:12px;opacity:.75;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.bldr-hero-stats{display:flex;gap:20px}
.bldr-hstat{text-align:center}
.bldr-hstat-val{font-size:20px;font-weight:800}
.bldr-hstat-lbl{font-size:9px;opacity:.7;text-transform:uppercase;letter-spacing:.07em}

/* LAYOUT */
.bldr-layout{display:flex;flex:1;min-height:0}

/* ITINERARY PANEL */
.bldr-it-panel{
  width:300px;flex-shrink:0;
  background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;overflow:hidden;
}
.bldr-it-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 14px 10px;border-bottom:1px solid var(--border);flex-shrink:0;
}
.bldr-it-header-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.bldr-it-scroll{flex:1;overflow-y:auto;padding:10px 10px}
.bldr-day-item{
  border-radius:var(--r-lg);border:1px solid var(--border);
  margin-bottom:8px;overflow:hidden;transition:box-shadow .15s;
  cursor:pointer;
}
.bldr-day-item:hover{box-shadow:var(--shadow-sm)}
.bldr-day-item.active{border-color:var(--primary);box-shadow:0 0 0 2px rgba(43,150,168,.15)}
.bldr-day-hdr{
  display:flex;align-items:center;gap:8px;
  padding:9px 12px;background:var(--bg);border-bottom:1px solid var(--border);
}
.bldr-day-item.active .bldr-day-hdr{background:rgba(43,150,168,.07)}
.bldr-day-num{
  width:24px;height:24px;border-radius:50%;flex-shrink:0;
  background:var(--border);color:var(--navy);
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:800;
}
.bldr-day-item.active .bldr-day-num{background:var(--primary);color:#fff}
.bldr-day-city{font-size:12px;font-weight:700;color:var(--navy)}
.bldr-day-meta{font-size:10px;color:var(--muted);margin-top:1px}
.bldr-day-count{
  margin-left:auto;font-size:9px;font-weight:700;
  background:var(--primary);color:#fff;
  padding:2px 6px;border-radius:8px;
}
.bldr-day-acts-preview{padding:6px 10px}
.bldr-day-act-preview{
  display:flex;align-items:center;gap:6px;
  padding:4px 0;border-bottom:1px solid var(--border);
  font-size:10px;color:var(--text);
}
.bldr-day-act-preview:last-child{border-bottom:none}
.bldr-day-act-time{font-size:9px;font-weight:800;color:var(--primary);width:40px;flex-shrink:0}
.bldr-day-act-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.bldr-day-empty-slot{
  padding:8px 10px;border-radius:var(--r-md);
  border:1.5px dashed var(--border);color:var(--muted);
  font-size:10px;text-align:center;margin:4px 0;cursor:pointer;
  transition:all .15s;
}
.bldr-day-empty-slot:hover{border-color:var(--primary);color:var(--primary)}
.bldr-add-day-btn{
  width:100%;display:flex;align-items:center;justify-content:center;gap:5px;
  padding:8px;border-radius:var(--r-md);
  border:1.5px dashed var(--border);background:transparent;
  color:var(--muted);font-size:11px;font-weight:700;
  font-family:inherit;cursor:pointer;transition:all .15s;margin-top:4px;
}
.bldr-add-day-btn:hover{border-color:var(--primary);color:var(--primary)}

/* CITY / DATE btns */
.bldr-city-edit-btn{
  display:inline-flex;align-items:center;gap:3px;
  padding:2px 7px;border-radius:6px;
  border:1px solid rgba(43,150,168,.3);background:rgba(43,150,168,.07);
  color:var(--primary);font-size:9px;font-weight:700;cursor:pointer;
  font-family:inherit;transition:all .15s;
}
.bldr-city-edit-btn:hover{background:rgba(43,150,168,.14)}
.bldr-date-btn{
  display:flex;align-items:center;gap:4px;
  padding:3px 8px;border-radius:6px;
  border:1px solid rgba(43,150,168,.3);background:rgba(43,150,168,.07);
  color:var(--primary);font-size:9px;font-weight:700;cursor:pointer;
  font-family:inherit;transition:all .15s;
}
.bldr-date-btn:hover{background:rgba(43,150,168,.12)}

/* EXCURSIONS PANEL */
.bldr-exc-panel{flex:1;display:flex;flex-direction:column;overflow:hidden}
.bldr-exc-toolbar{
  padding:12px 18px;background:var(--surface);
  border-bottom:1px solid var(--border);flex-shrink:0;
}
.bldr-exc-toolbar-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}

.bldr-search-wrap{
  flex:1;display:flex;align-items:center;gap:6px;
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:var(--r-md);padding:7px 11px;
  transition:border-color .2s;
}
.bldr-search-wrap:focus-within{border-color:var(--primary)}
.bldr-search-input{
  flex:1;border:none;background:transparent;outline:none;
  font-size:12px;font-family:inherit;color:var(--text);
}
.bldr-search-input::placeholder{color:var(--muted)}
.bldr-filter-select{
  padding:7px 10px;border-radius:var(--r-md);
  border:1.5px solid var(--border);background:var(--surface);
  font-size:11px;font-family:inherit;color:var(--text);
  cursor:pointer;outline:none;transition:border-color .2s;
}
.bldr-filter-select:focus{border-color:var(--primary)}
.bldr-price-filter{
  display:flex;align-items:center;gap:6px;
  padding:5px 10px;border-radius:var(--r-md);
  border:1.5px solid var(--border);background:var(--surface);
  font-size:11px;color:var(--text);font-weight:600;
}
.bldr-price-range{accent-color:var(--primary);width:80px;height:4px;cursor:pointer}
.bldr-avail-toggle{
  display:flex;align-items:center;gap:5px;
  font-size:10px;font-weight:700;color:var(--primary);cursor:pointer;
  padding:5px 10px;border-radius:var(--r-md);
  background:rgba(43,150,168,.07);border:1.5px solid rgba(43,150,168,.2);
  transition:all .15s;white-space:nowrap;
}
.bldr-avail-toggle:hover{background:rgba(43,150,168,.12)}

.bldr-context-bar{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 18px;background:rgba(43,150,168,.04);
  border-bottom:1px solid var(--border);flex-shrink:0;
  flex-wrap:wrap;gap:6px;
}
.bldr-context-info{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--primary);font-weight:700}
.bldr-context-count{font-size:10px;color:var(--muted);font-weight:500}

.bldr-exc-grid{
  flex:1;overflow-y:auto;padding:16px 18px;
  display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;
  align-content:start;
}

/* EXC CARD */
.bldr-exc-card{
  background:var(--surface);border-radius:var(--r-lg);
  border:1px solid var(--border);box-shadow:var(--shadow-sm);
  overflow:hidden;cursor:pointer;transition:all .2s;
  display:flex;flex-direction:column;
}
.bldr-exc-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px);border-color:rgba(43,150,168,.3)}
.bldr-exc-card.added{border-color:var(--primary);box-shadow:0 0 0 2px rgba(43,150,168,.15)}
.bldr-exc-img{
  height:130px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,#EFF6FF,#F0F9FF);flex-shrink:0;
}
.bldr-exc-img img{width:100%;height:100%;object-fit:cover}
.bldr-exc-img-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#CBD5E1}
.bldr-exc-avail-badge{
  position:absolute;top:7px;left:7px;
  padding:2px 7px;border-radius:6px;
  font-size:9px;font-weight:800;
  display:flex;align-items:center;gap:3px;
}
.bldr-exc-avail-badge.ok{background:#DCFCE7;color:#166534}
.bldr-exc-avail-badge.ko{background:#FEE2E2;color:#991B1B}
.bldr-exc-added-badge{
  position:absolute;top:7px;right:7px;
  padding:2px 7px;border-radius:6px;
  font-size:9px;font-weight:800;background:var(--primary);color:#fff;
  display:flex;align-items:center;gap:3px;
}
/* Badge heure fixe sur la card */
.bldr-exc-time-badge{
  position:absolute;bottom:7px;left:7px;
  padding:2px 7px;border-radius:6px;
  font-size:9px;font-weight:800;
  background:rgba(5,51,102,.75);color:#fff;
  display:flex;align-items:center;gap:3px;backdrop-filter:blur(4px);
}
.bldr-exc-body{padding:10px 12px;display:flex;flex-direction:column;gap:5px;flex:1}
.bldr-exc-title{font-size:12.5px;font-weight:800;color:var(--navy);line-height:1.3}
.bldr-exc-meta{display:flex;align-items:center;gap:8px;font-size:10px;color:var(--muted);flex-wrap:wrap}
.bldr-exc-meta span{display:flex;align-items:center;gap:3px;font-weight:600}
.bldr-exc-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:6px}
.bldr-exc-price{font-size:14px;font-weight:900;color:var(--navy)}
.bldr-exc-add{
  padding:5px 12px;border-radius:50px;
  border:none;background:var(--primary);color:#fff;
  font-size:10px;font-weight:800;cursor:pointer;font-family:inherit;
  transition:all .15s;
}
.bldr-exc-add:hover{transform:translateY(-1px);box-shadow:0 4px 10px -3px rgba(43,150,168,.5)}
.bldr-exc-add.added-btn{background:#ECFDF5;color:#059669;border:1.5px solid #6EE7B7;cursor:default}

/* SKELETON */
.bldr-skeleton{
  height:200px;border-radius:var(--r-lg);
  background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);
  background-size:200% 100%;animation:shimmer 1.5s infinite;
}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

/* OVERLAY */
.bldr-overlay{
  position:fixed;inset:0;background:rgba(5,19,40,.55);
  z-index:200;display:flex;align-items:center;justify-content:center;
  padding:20px;backdrop-filter:blur(3px);
}

/* SLOT PICKER BOX */
.bldr-slot-box{
  background:var(--surface);border-radius:var(--r-xl);
  width:100%;max-width:440px;overflow:hidden;
  box-shadow:0 24px 64px rgba(5,51,102,.22);
}
.bldr-slot-hdr{padding:16px 18px;border-bottom:1px solid var(--border)}
.bldr-slot-title{font-size:15px;font-weight:800;color:var(--navy)}
.bldr-slot-exc-name{font-size:12px;color:var(--primary);margin-top:3px;font-weight:700}
.bldr-slot-meta{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--muted);margin-top:4px;font-weight:600;flex-wrap:wrap}
.bldr-slot-body{padding:14px 18px;display:flex;flex-direction:column;gap:10px;max-height:60vh;overflow-y:auto}
.bldr-slot-option{
  display:flex;align-items:center;gap:10px;
  padding:11px 13px;border-radius:var(--r-md);
  border:1.5px solid var(--border);cursor:pointer;transition:all .15s;
}
.bldr-slot-option:hover{border-color:rgba(43,150,168,.3);background:rgba(43,150,168,.03)}
.bldr-slot-option.selected{border-color:var(--primary);background:rgba(43,150,168,.06)}
.bldr-slot-option.disabled-slot{opacity:.4;cursor:not-allowed}
.bldr-slot-option.disabled-slot:hover{border-color:var(--border);background:transparent}
.bldr-slot-icon{
  width:30px;height:30px;border-radius:9px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.bldr-slot-label{font-size:12px;font-weight:800;color:var(--navy)}
.bldr-slot-hint{font-size:10px;color:var(--muted)}
.bldr-time-input{
  margin-left:auto;padding:5px 9px;border-radius:7px;
  border:1.5px solid var(--primary);background:rgba(43,150,168,.06);
  font-size:11px;font-weight:700;color:var(--primary);
  outline:none;cursor:pointer;font-family:inherit;
}

/* Heure fixe imposée par la BDD */
.bldr-fixed-time-card{
  display:flex;align-items:center;gap:12px;
  padding:13px 15px;border-radius:var(--r-md);
  background:linear-gradient(135deg,rgba(5,51,102,.05),rgba(43,150,168,.08));
  border:1.5px solid rgba(43,150,168,.35);
}
.bldr-fixed-time-icon{
  width:36px;height:36px;border-radius:10px;flex-shrink:0;
  background:rgba(43,150,168,.12);
  display:flex;align-items:center;justify-content:center;
}
.bldr-fixed-time-label{font-size:12px;font-weight:800;color:var(--navy)}
.bldr-fixed-time-sub{font-size:10px;color:var(--muted);margin-top:2px}
.bldr-fixed-time-value{
  margin-left:auto;
  display:flex;flex-direction:column;align-items:flex-end;gap:2px;
  flex-shrink:0;
}
.bldr-fixed-time-heure{
  font-size:20px;font-weight:900;color:var(--navy);
  font-variant-numeric:tabular-nums;letter-spacing:-.02em;
}
.bldr-fixed-time-fin{font-size:9px;color:var(--muted);font-weight:700}
.bldr-fixed-time-lock{
  display:inline-flex;align-items:center;gap:3px;
  font-size:9px;font-weight:700;color:var(--primary);
  background:rgba(43,150,168,.10);border-radius:5px;padding:2px 6px;margin-top:3px;
}

/* CONFLICT BANNER */
.bldr-conflict-banner{
  display:flex;align-items:flex-start;gap:9px;
  padding:11px 14px;border-radius:var(--r-md);
  background:#FEF2F2;border:1.5px solid #FECACA;
  font-size:11px;color:#991B1B;font-weight:600;line-height:1.45;
}
.bldr-conflict-banner svg{flex-shrink:0;margin-top:1px}

/* TIMELINE */
.bldr-timeline-wrap{
  padding:10px 12px;border-radius:var(--r-md);
  background:var(--bg);border:1px solid var(--border);
}
.bldr-timeline-title{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:6px}
.bldr-timeline-row{
  display:flex;align-items:center;gap:8px;padding:3px 0;
}
.bldr-timeline-bar{
  width:3px;border-radius:2px;align-self:stretch;flex-shrink:0;min-height:16px;
}
.bldr-timeline-info{flex:1;min-width:0}
.bldr-timeline-name{font-size:10px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bldr-timeline-range{font-size:9px;color:var(--muted);font-weight:600}
.bldr-timeline-sep{border:none;border-top:1.5px dashed var(--border);margin:4px 0}

/* SLOT FOOTER */
.bldr-slot-footer{display:flex;gap:8px;padding:12px 18px 16px;border-top:1px solid var(--border)}
.bldr-slot-cancel{
  padding:9px 16px;border-radius:50px;border:1.5px solid var(--border);
  background:var(--surface);color:var(--text);font-size:12px;font-weight:700;
  font-family:inherit;cursor:pointer;transition:all .2s;
}
.bldr-slot-cancel:hover{border-color:var(--navy);color:var(--navy)}
.bldr-slot-confirm{
  flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
  padding:9px 18px;border-radius:50px;border:none;
  background:var(--primary);color:#fff;font-size:12px;font-weight:700;
  font-family:inherit;cursor:pointer;
  box-shadow:0 6px 18px -4px rgba(43,150,168,.45);transition:all .2s;
}
.bldr-slot-confirm:hover:not(:disabled){transform:translateY(-1px)}
.bldr-slot-confirm:disabled{background:#CBD5E1;box-shadow:none;cursor:not-allowed;color:#94A3B8}

/* TOAST */
.bldr-toast{
  position:fixed;bottom:26px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:8px;
  padding:10px 20px;border-radius:var(--r-lg);
  font-size:12.5px;font-weight:700;
  font-family:'DM Sans',system-ui,sans-serif;
  z-index:9999;pointer-events:none;white-space:nowrap;
  box-shadow:0 8px 28px rgba(0,0,0,.18);
  background:#052e16;color:#bbf7d0;
  animation:toastIn .3s cubic-bezier(.22,.68,0,1.2) both;
}
.bldr-toast.error{background:#450a0a;color:#fca5a5}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* DATE PICKER MODAL */
.bldr-dp{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:360px;overflow:hidden;box-shadow:0 24px 64px rgba(5,51,102,.22)}
.bldr-dp-hdr{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border)}
.bldr-dp-title{font-size:14px;font-weight:800;color:var(--navy)}
.bldr-dp-close{background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:5px;cursor:pointer;display:flex;align-items:center}
.bldr-dp-close:hover{background:var(--border)}
.bldr-dp-body{padding:14px 16px}
.bldr-dp-input{
  width:100%;padding:9px 12px;border-radius:var(--r-md);
  border:1.5px solid var(--border);background:var(--bg);
  font-size:13px;font-family:inherit;outline:none;color:var(--navy);
  transition:border-color .2s;
}
.bldr-dp-input:focus{border-color:var(--primary)}
.bldr-dp-footer{display:flex;gap:7px;padding:0 16px 14px}

/* CITY MODAL */
.city-modal{
  background:var(--surface);border-radius:var(--r-xl);
  width:100%;max-width:360px;overflow:hidden;
  box-shadow:0 24px 64px rgba(5,51,102,.25);
  display:flex;flex-direction:column;max-height:80vh;
}
.city-modal-hdr{
  padding:16px 18px 12px;border-bottom:1px solid var(--border);flex-shrink:0;
  display:flex;align-items:flex-start;justify-content:space-between;
}
.city-modal-title{font-size:14px;font-weight:800;color:var(--navy);display:flex;align-items:center;gap:7px}
.city-modal-sub{font-size:11px;color:var(--muted);margin-top:3px}
.city-modal-list{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;}
.city-option{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:var(--r-md);cursor:pointer;transition:background .12s;font-size:13px;font-weight:600;color:var(--navy);}
.city-option:hover{background:rgba(43,150,168,.07)}
.city-option.selected{background:rgba(43,150,168,.10);color:var(--primary)}
.city-option-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.city-option-dot{width:7px;height:7px;border-radius:50%;background:var(--border);flex-shrink:0}
.city-option.selected .city-option-dot{background:var(--primary)}
.city-option-name{font-size:13px;font-weight:700;color:var(--navy)}
.city-option.selected .city-option-name{color:var(--primary)}
.city-option-region{font-size:10px;color:var(--muted);font-weight:500;margin-left:6px;flex-shrink:0}
.city-option-check{color:var(--primary);display:flex;align-items:center;flex-shrink:0}
.city-empty{text-align:center;padding:32px 20px;color:var(--muted);font-size:12px;}
.city-loading{display:flex;align-items:center;justify-content:center;padding:32px;gap:8px;color:var(--muted);font-size:12px;font-weight:600;}
.city-modal-footer{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--border);flex-shrink:0;}

/* SUMMARY VIEW */
.bldr-summary-wrap{flex:1;overflow-y:auto}

/* BOTTOM BAR */
.bldr-bottom{
  position:sticky;bottom:0;z-index:50;
  display:flex;align-items:center;justify-content:space-between;
  padding:11px 24px;
  background:var(--surface);border-top:1px solid var(--border);
  box-shadow:0 -4px 20px rgba(0,0,0,.06);flex-wrap:wrap;gap:8px;
}
.bldr-total-lbl{font-size:10px;font-weight:700;color:var(--muted);margin-bottom:1px;text-transform:uppercase;letter-spacing:.05em}
.bldr-total-amt{font-size:20px;font-weight:900;color:var(--navy)}
.bldr-total-eur{font-size:12px;font-weight:600;color:var(--muted);margin-left:3px}
.bldr-bottom-right{display:flex;align-items:center;gap:7px;flex-wrap:wrap}

/* MOBILE */
.bldr-mobile-strip{display:none}
.bldr-mobile-tabbar{display:none}

@keyframes spin{to{transform:rotate(360deg)}}

@media(max-width:768px){
  .bldr-it-panel{display:none}
  .bldr-exc-grid{grid-template-columns:1fr;padding:10px 12px}
  .bldr-hero-strip{padding:12px 14px}
  .bldr-nav{padding:0 12px}
  .bldr-context-bar{padding:6px 12px}
  .bldr-exc-toolbar{padding:10px 12px}
  .bldr-bottom{padding:10px 14px}
  .bldr-mobile-strip{display:flex;overflow-x:auto;gap:6px;padding:8px 12px;background:var(--surface);border-bottom:1px solid var(--border);-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .bldr-mobile-tabbar{display:flex;position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-top:1px solid var(--border);z-index:100}
}

::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
`;

/* ════════════════════════════════════════════
   Sub-components (outside BuilderInner)
════════════════════════════════════════════ */

interface DatePickerModalProps {
  currentDayCity: string; currentDayDate?: string;
  onClose: () => void; onConfirm: (date: string) => void;
}
function DatePickerModal({ currentDayCity, currentDayDate, onClose, onConfirm }: DatePickerModalProps) {
  const today = normalizeDate(new Date().toISOString());
  const [sel, setSel] = useState(currentDayDate ? normalizeDate(currentDayDate) : "");
  return (
    <div className="bldr-overlay" onClick={onClose}>
      <div className="bldr-dp" onClick={e=>e.stopPropagation()}>
        <div className="bldr-dp-hdr">
          <div className="bldr-dp-title">Date de visite — {currentDayCity}</div>
          <button className="bldr-dp-close" onClick={onClose}><X size={13}/></button>
        </div>
        <div className="bldr-dp-body">
          <input type="date" className="bldr-dp-input" value={sel} min={today} onChange={e=>setSel(e.target.value)}/>
        </div>
        <div className="bldr-dp-footer">
          <button className="bldr-slot-cancel" onClick={onClose}>Annuler</button>
          <button className="bldr-slot-confirm" disabled={!sel} onClick={()=>{if(sel)onConfirm(normalizeDate(sel));}}>
            <CheckCircle2 size={12}/> Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

interface CityPickerModalProps {
  dayIdx: number; currentCity: string; allVilles: Ville[]; ldVilles: boolean;
  onClose: () => void; onConfirm: (ville: Ville) => void;
}
function CityPickerModal({ dayIdx, currentCity, allVilles, ldVilles, onClose, onConfirm }: CityPickerModalProps) {
  return (
    <div className="bldr-overlay" onClick={onClose}>
      <div className="city-modal" onClick={e=>e.stopPropagation()}>
        <div className="city-modal-hdr">
          <div>
            <div className="city-modal-title"><MapPin size={14} color={BRAND}/>Choisir la ville — Jour {dayIdx+1}</div>
            <div className="city-modal-sub">Ville actuelle : <strong style={{color:NAVY}}>{currentCity||"Non définie"}</strong></div>
          </div>
          <button className="bldr-dp-close" onClick={onClose}><X size={13}/></button>
        </div>
        <div className="city-modal-list">
          {ldVilles
            ? <div className="city-loading"><Loader2 size={16} color={BRAND} style={{animation:"spin 1s linear infinite"}}/>Chargement…</div>
            : allVilles.length===0
              ? <div className="city-empty">Aucune ville disponible</div>
              : allVilles.map(ville=>{
                  const sel = ville.nom===currentCity;
                  return (
                    <div key={ville.id} className={`city-option${sel?" selected":""}`} onClick={()=>onConfirm(ville)}>
                      <div className="city-option-left">
                        <div className="city-option-dot"/>
                        <span className="city-option-name">{ville.nom}</span>
                        <span className="city-option-region">{ville.region}</span>
                      </div>
                      {sel&&<div className="city-option-check"><Check size={13}/></div>}
                    </div>
                  );
                })
          }
        </div>
        <div className="city-modal-footer">
          <button className="bldr-slot-cancel" style={{flex:1}} onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   BuilderInner
════════════════════════════════════════════ */
function BuilderInner() {
  const router     = useRouter();
  const params     = useSearchParams();
  const sb         = useMemo(() => createClient(), []);

  const days      = Number(params.get("days") || 3);
  const selCities = useMemo(() => (params.get("cities")||"").split(",").filter(Boolean), [params]);

  const [userId,    setUserId]    = useState<string|null>(null);
  const [user,      setUser]      = useState<{id:string}|null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [savedItId, setSavedItId] = useState<string|null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [view,      setView]      = useState<ViewStep>("builder");
  const [mounted,   setMounted]   = useState(false);

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [allExc,     setAllExc]     = useState<Excursion[]>([]);
  const [ldExc,      setLdExc]      = useState(true);

  const [allVilles,      setAllVilles]      = useState<Ville[]>([]);
  const [ldVilles,       setLdVilles]       = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [editingDayIdx,  setEditingDayIdx]  = useState<number|null>(null);

  const [showHelp,          setShowHelp]          = useState(false);
  const [search,            setSearch]            = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showDatePicker,    setShowDatePicker]    = useState(false);
  const [showSuccessMsg,    setShowSuccessMsg]    = useState<string|null>(null);
  const [toastType,         setToastType]         = useState<"ok"|"error">("ok");

  const [priceRange,       setPriceRange]       = useState(500);
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [itin,      setItin]      = useState<DayPlan[]>([]);
  const [activeDay, setActiveDay] = useState(0);

  /* ── Slot picker state ── */
  const [pendingExc,   setPendingExc]   = useState<Excursion|null>(null);
  const [pickSlot,     setPickSlot]     = useState<TimeKey>("matin");
  const [pickTime,     setPickTime]     = useState("09:00");
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo>({hasConflict:false});

  const [selectedExcursion, setSelectedExcursion] = useState<ExcursionDetail|null>(null);
  const [loadingDetails,    setLoadingDetails]     = useState(false);

  /* ────────── helpers ────────── */
  const formatDate = (d:string, opts?: Intl.DateTimeFormatOptions) => {
    const nd = normalizeDate(d);
    if (!nd) return "";
    const [y,m,dd] = nd.split("-").map(Number);
    return new Date(y,m-1,dd).toLocaleDateString("fr-FR", opts||{day:"numeric",month:"long",year:"numeric"});
  };

  const toast = (msg:string, type:"ok"|"error"="ok") => {
    setToastType(type); setShowSuccessMsg(msg);
    setTimeout(()=>setShowSuccessMsg(null),3500);
  };

  /* ────────── load data ────────── */
  const fetchVilles = useCallback(async () => {
    setLdVilles(true);
    try {
      const {data,error} = await sb.from("villes").select("id,nom,region,description,active,image_url").eq("active",true).order("nom");
      if (!error && data) setAllVilles(data as Ville[]);
    } catch(e){console.error(e);}
    finally{setLdVilles(false);}
  },[sb]);

  const loadAll = async () => {
    setLdExc(true);
    try {
      const [cR,eR] = await Promise.all([
        sb.from("categories").select("*").order("nom"),
        sb.from("excursions").select("*").eq("is_active",true).order("rating",{ascending:false}),
      ]);
      setCategories((cR.data||[]) as Categorie[]);
      if (!eR.error) setAllExc((eR.data||[]) as Excursion[]);
    } catch(e){console.error(e);}
    finally{setLdExc(false);}
  };

  useEffect(() => {
    setMounted(true);
    loadAll();
    fetchVilles();
    setItin(Array.from({length:days},(_,i)=>({city:selCities[i%selCities.length]||selCities[0]||"",activities:[]})));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    sb.auth.getUser().then(async ({data:{user}})=>{
      if (!user) return;
      setUserId(user.id); setUser({id:user.id});
      const {data:favs} = await sb.from("favoris").select("excursion_id").eq("touriste_id",user.id);
      if (favs) setFavorites(new Set(favs.map((f:any)=>f.excursion_id)));
      const {data} = await sb.from("itineraires").select("*").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle();
      if (data) setSavedItId(data.id);
    });
  },[sb]);

  /* ────────── depart_time de l'excursion en attente ────────── */

  /**
   * Heure de départ officielle de l'excursion (depuis la BDD, colonne depart_time).
   * null = pas d'horaire fixe → l'utilisateur choisit.
   */
  const fixedDepartTime = useMemo(
    () => normalizeDepartTime(pendingExc?.depart_time),
    [pendingExc]
  );

  /** true quand la BDD impose un horaire fixe */
  const isTimeFixed = fixedDepartTime !== null;

  /* Recalcule le conflit à chaque changement d'heure */
  useEffect(()=>{
    if (!pendingExc) { setConflictInfo({hasConflict:false}); return; }
    const effectiveTime = isTimeFixed ? fixedDepartTime! : pickTime;
    const conflict = checkTimeConflict(itin[activeDay]?.activities||[], pendingExc, effectiveTime);
    setConflictInfo(conflict);
  },[pickTime, pendingExc, fixedDepartTime, isTimeFixed, itin, activeDay]);

  /* ────────── city picker ────────── */
  const openCityPicker = (dayIdx:number, e?:React.MouseEvent) => {
    e?.stopPropagation();
    setEditingDayIdx(dayIdx);
    setShowCityPicker(true);
  };

  const confirmCityChange = useCallback((ville:Ville)=>{
    if (editingDayIdx===null) return;
    const oldCity = itin[editingDayIdx]?.city;
    setItin(prev=>{
      const n=[...prev];
      n[editingDayIdx!]={
        ...n[editingDayIdx!], city:ville.nom,
        activities: oldCity!==ville.nom
          ? n[editingDayIdx!].activities.filter(a=>a.excursion.city.toLowerCase()===ville.nom.toLowerCase())
          : n[editingDayIdx!].activities,
      };
      return n;
    });
    setShowCityPicker(false);
    toast(`📍 Jour ${editingDayIdx!+1} → ${ville.nom}`);
    setEditingDayIdx(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[editingDayIdx,itin]);

  /* ────────── derived ────────── */
  const currentDay     = itin[activeDay];
  const currentDayCity = currentDay?.city||"";
  const currentDayDate = currentDay?.date;

  const palette = useMemo(()=>{
    const q = search.toLowerCase();
    let list = allExc.filter(e=>{
      const matchSearch   = !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
      const matchCity     = !currentDayCity || e.city.toLowerCase()===currentDayCity.toLowerCase();
      const matchPrice    = e.price_per_person<=priceRange;
      const matchCategory = selectedCategory==="all" || e.categories?.includes(selectedCategory);
      let matchDur=true;
      if (selectedDuration==="short")  matchDur=e.duration_hours<=3;
      if (selectedDuration==="medium") matchDur=e.duration_hours>3&&e.duration_hours<=6;
      if (selectedDuration==="long")   matchDur=e.duration_hours>6;
      return matchSearch&&matchCity&&matchPrice&&matchCategory&&matchDur;
    });
    if (currentDayDate&&showOnlyAvailable) list=list.filter(e=>isAvailableOnDate(e,currentDayDate));
    return list;
  },[allExc,currentDayCity,search,priceRange,selectedCategory,selectedDuration,currentDayDate,showOnlyAvailable]);

  const availCount = useMemo(
    ()=>currentDayDate?palette.filter(e=>isAvailableOnDate(e,currentDayDate)).length:palette.length,
    [palette,currentDayDate]
  );

  const totAct    = itin.reduce((acc,d)=>acc+(d.activities?.length||0),0);
  const totBudget = itin.reduce((acc,d)=>acc+(d.activities?.reduce((s,a)=>s+(a.excursion?.price_per_person||0),0)||0),0);
  const isAdded   = (id:string)=>(itin[activeDay]?.activities||[]).some(a=>a.excursion.id===id);

  /* ────────── timeline du jour (pour l'aperçu) ────────── */
  const currentDayTimeline = useMemo(()=>[...(itin[activeDay]?.activities||[])].sort((a,b)=>timeToMinutes(a.customTime)-timeToMinutes(b.customTime)),[itin,activeDay]);

  /* ────────── slot picker ────────── */

  /**
   * Ouvre le slot picker pour une excursion.
   *
   * Règle depart_time :
   *  - Si l'excursion a un depart_time en BDD → heure fixe, on l'impose directement.
   *  - Sinon → l'utilisateur choisit le créneau (matin/aprem/soir) et l'heure.
   */
  const openSlotPicker = (exc: Excursion) => {
    if (currentDayDate && !isAvailableOnDate(exc, currentDayDate)) {
      toast(`⚠️ "${exc.title}" n'est pas disponible le ${formatDate(currentDayDate)}.`, "error");
      return;
    }

    const fixed = normalizeDepartTime(exc.depart_time);

    if (fixed) {
      // Heure fixe imposée par la BDD : on positionne pickTime sur cette valeur
      // (utilisée pour l'affichage et la vérification de conflit).
      setPickTime(fixed);
      setPickSlot(slotForTime(fixed));
    } else {
      // Pas d'horaire défini → défaut matin 09:00
      setPickSlot("matin");
      setPickTime("09:00");
    }

    setPendingExc(exc);
  };

  const confirmAdd = () => {
    if (!pendingExc) return;
    const effectiveTime = isTimeFixed ? fixedDepartTime! : pickTime;
    // Vérification finale (garde-fou)
    const finalConflict = checkTimeConflict(itin[activeDay]?.activities||[], pendingExc, effectiveTime);
    if (finalConflict.hasConflict) {
      toast(`⛔ ${finalConflict.message}`, "error");
      return;
    }
    const slot = slotForTime(effectiveTime);
    setItin(prev=>{
      const n=[...prev];
      n[activeDay]={
        ...n[activeDay],
        activities:[
          ...n[activeDay].activities,
          { id:`${Date.now()}-${Math.random()}`, excursion:pendingExc, note:"", time:slot, customTime:effectiveTime },
        ].sort((a,b)=>timeToMinutes(a.customTime)-timeToMinutes(b.customTime)),
      };
      return n;
    });
    toast(`✓ "${pendingExc.title}" ajouté à ${effectiveTime}`);
    setPendingExc(null);
  };

  /* ────────── autres actions ────────── */
  const rmAct = (dayIdx:number, id:string) => {
    setItin(prev=>{
      const n=[...prev];
      const act=n[dayIdx].activities.find(a=>a.id===id);
      n[dayIdx]={...n[dayIdx],activities:n[dayIdx].activities.filter(a=>a.id!==id)};
      if (act) toast(`✗ "${act.excursion.title}" retiré`);
      return n;
    });
  };

  const saveItinerary = async () => {
    if (!userId){alert("Vous devez être connecté");return;}
    setSaving(true);
    try {
      const {data,error} = await sb.from("itineraires").insert({
        user_id:userId, nb_jours:days, villes_selectionnees:selCities,
        categories_selectionnees:[], plan:itin,
        created_at:new Date().toISOString(), updated_at:new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      if (data) setSavedItId(data.id);
      setSaveOk(true);
    } catch(e){console.error(e);alert("Erreur lors de la sauvegarde");}
    finally{setSaving(false);}
  };

  const loadDetails = async (id:string) => {
    setLoadingDetails(true);
    try {
      const {data,error} = await sb.from("excursions").select("*").eq("id",id).single();
      if (!error) setSelectedExcursion(data as ExcursionDetail);
    } catch(e){console.error(e);}
    finally{setLoadingDetails(false);}
  };

  const handleDateConfirm = useCallback((nd:string)=>{
    setItin(prev=>{
      const n=[...prev];
      n[activeDay]={...n[activeDay],date:nd,activities:n[activeDay].activities.filter(a=>isAvailableOnDate(a.excursion,nd))};
      return n;
    });
    setShowDatePicker(false);
    toast(`📅 ${formatDate(nd,{day:"numeric",month:"long"})}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[activeDay]);

  /* ────────── render guards ────────── */
  if (view==="result") {
    return (
      <div className="bldr-root">
        <style>{CSS}</style>
        <div className="bldr-summary-wrap">
          <ItinerarySummary
            days={toSummaryDays(itin)} nbJours={days} selCities={selCities}
            saving={saving} saveOk={saveOk} savedItId={savedItId}
            onBack={()=>setView("builder")}
            onEdit={()=>{setSaveOk(false);setView("builder");}}
            onSave={saveItinerary}/>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="bldr-root">
        <style>{CSS}</style>
        <TouristeNav favCount={0} isLoggedIn={false}/>
        <div style={{paddingTop:64}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",flex:1,gap:10,color:"#94A3B8",fontSize:13}}>
          <Loader2 size={22} color={BRAND} style={{animation:"spin 1s linear infinite"}}/>Chargement…
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="bldr-root">
      <style>{CSS}</style>

      {/* TOAST */}
      {showSuccessMsg && (
        <div className={`bldr-toast${toastType==="error"?" error":""}`}>
          {toastType==="error" ? <AlertCircle size={13}/> : <CheckCircle size={13}/>}
          {showSuccessMsg}
        </div>
      )}

      {showDatePicker && (
        <DatePickerModal currentDayCity={currentDayCity} currentDayDate={currentDayDate}
          onClose={()=>setShowDatePicker(false)} onConfirm={handleDateConfirm}/>
      )}
      {showCityPicker && editingDayIdx!==null && (
        <CityPickerModal dayIdx={editingDayIdx} currentCity={itin[editingDayIdx]?.city||""}
          allVilles={allVilles} ldVilles={ldVilles}
          onClose={()=>{setShowCityPicker(false);setEditingDayIdx(null);}}
          onConfirm={confirmCityChange}/>
      )}
      {showHelp && <HelpPanel onClose={()=>setShowHelp(false)}/>}

      <TouristeNav favCount={favorites.size} isLoggedIn={!!user}/>
      <div style={{paddingTop:64}}/>

      {/* NAV */}
      <nav className="bldr-nav">
        <div className="bldr-nav-pill"><SlidersHorizontal size={10}/> Mode Libre</div>
        <div style={{display:"flex",alignItems:"center",gap:7,marginLeft:"auto"}}>
          <button className="btn btn-ghost" onClick={()=>setShowHelp(true)}><HelpCircle size={13}/> Aide</button>
          <button className="btn btn-ghost" onClick={()=>router.push("/modeLibre")}><ArrowLeft size={13}/> Configurer</button>
          <button className="btn btn-teal" onClick={()=>setView("result")}><TrendingUp size={13}/> Voir le résumé</button>
        </div>
      </nav>

      {/* HERO STRIP */}
      <div className="bldr-hero-strip">
        <div className="bldr-hero-left">
          <div>
            <div className="bldr-hero-pill"><Sparkles size={9}/> Constructeur libre</div>
          </div>
          <div>
            <div className="bldr-hero-title">{days} jours en Tunisie</div>
            <div className="bldr-hero-cities">
              {itin.map((d,i)=>(
                <React.Fragment key={i}>
                  {i>0&&<ChevronRight size={10} style={{opacity:.6}}/>}
                  <button onClick={()=>openCityPicker(i)} title={`Modifier la ville du jour ${i+1}`}
                    style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",borderRadius:6,padding:"1px 7px",color:"white",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit",transition:"all .15s"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.22)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.12)")}>
                    <Edit2 size={9}/>{d.city||`Jour ${i+1}`}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="bldr-hero-stats">
          {[{val:totAct,lbl:"Activités"},{val:`${totBudget} €`,lbl:"Budget"},{val:days,lbl:"Jours"}].map(s=>(
            <div key={s.lbl} className="bldr-hstat">
              <div className="bldr-hstat-val">{s.val}</div>
              <div className="bldr-hstat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE strip */}
      <div className="bldr-mobile-strip">
        {itin.map((day,dIdx)=>(
          <button key={dIdx} onClick={()=>setActiveDay(dIdx)}
            style={{flexShrink:0,padding:"5px 12px",borderRadius:"999px",border:activeDay===dIdx?`2px solid ${BRAND}`:"2px solid #E5E7EB",background:activeDay===dIdx?`${BRAND}12`:"#F9FAFB",color:activeDay===dIdx?BRAND:"#6B7280",fontWeight:activeDay===dIdx?700:500,fontSize:"0.7rem",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",minWidth:"56px",fontFamily:"inherit"}}>
            <span style={{fontSize:"0.6rem",opacity:.7}}>J{dIdx+1}</span>
            <span style={{fontSize:"0.68rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"56px"}}>{day.city}</span>
          </button>
        ))}
      </div>

      <div className="bldr-layout">

        {/* ── ITINERARY PANEL ── */}
        <div className="bldr-it-panel">
          <div className="bldr-it-header">
            <span className="bldr-it-header-title">Itinéraire</span>
            <button className="btn-sm" onClick={()=>setItin(prev=>[...prev,{city:prev[prev.length-1]?.city||"",activities:[]}])}>
              <Plus size={10}/> Jour
            </button>
          </div>
          <div className="bldr-it-scroll">
            {itin.map((day,dIdx)=>(
              <div key={dIdx} className={`bldr-day-item${activeDay===dIdx?" active":""}`} onClick={()=>setActiveDay(dIdx)}>
                <div className="bldr-day-hdr">
                  <div className="bldr-day-num">{dIdx+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="bldr-day-city">{day.city}</div>
                    <div className="bldr-day-meta">{day.date?formatDate(day.date,{day:"numeric",month:"short"}):"Date non fixée"}</div>
                  </div>
                  {day.activities.length>0&&<span className="bldr-day-count">{day.activities.length}</span>}
                </div>
                <div style={{display:"flex",gap:5,padding:"6px 10px 4px",borderBottom:"1px solid var(--border)"}}>
                  <button className="bldr-city-edit-btn" onClick={e=>openCityPicker(dIdx,e)}><Edit2 size={8}/> Ville</button>
                  <button className="bldr-date-btn" onClick={e=>{e.stopPropagation();setActiveDay(dIdx);setShowDatePicker(true);}}>
                    <Calendar size={9}/>{day.date?formatDate(day.date,{day:"numeric",month:"short"}):"Date"}
                  </button>
                </div>
                <div className="bldr-day-acts-preview">
                  {day.activities.length===0 ? (
                    <>
                      <div className="bldr-day-empty-slot" onClick={e=>{e.stopPropagation();setActiveDay(dIdx);}}>+ Ajouter une activité</div>
                      <div className="bldr-day-empty-slot" onClick={e=>{e.stopPropagation();setActiveDay(dIdx);}}>+ Ajouter une activité</div>
                    </>
                  ) : (
                    <>
                      {day.activities.map(act=>(
                        <div key={act.id} className="bldr-day-act-preview">
                          <span className="bldr-day-act-time">{act.customTime}</span>
                          <span className="bldr-day-act-name">{act.excursion.title}</span>
                          <button className="btn-sm danger" style={{padding:"2px 5px"}} onClick={e=>{e.stopPropagation();rmAct(dIdx,act.id);}}>
                            <Trash2 size={9}/>
                          </button>
                        </div>
                      ))}
                      <div className="bldr-day-empty-slot" onClick={e=>{e.stopPropagation();setActiveDay(dIdx);}}>+ Ajouter</div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button className="bldr-add-day-btn" onClick={()=>setItin(prev=>[...prev,{city:prev[prev.length-1]?.city||"",activities:[]}])}>
              <Plus size={12}/> Ajouter un jour
            </button>
          </div>
        </div>

        {/* ── EXCURSIONS PANEL ── */}
        <div className="bldr-exc-panel">
          <div className="bldr-exc-toolbar">
            <div className="bldr-exc-toolbar-top">
              <div className="bldr-search-wrap">
                <Search size={13} color="#94A3B8"/>
                <input className="bldr-search-input" placeholder="Rechercher une excursion…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="bldr-filter-select" value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}>
                <option value="all">Catégorie</option>
                {categories.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
              <select className="bldr-filter-select" value={selectedDuration} onChange={e=>setSelectedDuration(e.target.value)}>
                <option value="all">Durée</option>
                <option value="short">≤ 3h</option>
                <option value="medium">3–6h</option>
                <option value="long">&gt; 6h</option>
              </select>
              <div className="bldr-price-filter">
                <span>≤ {priceRange} €</span>
                <input type="range" min="0" max="500" step="10" className="bldr-price-range" value={priceRange} onChange={e=>setPriceRange(Number(e.target.value))}/>
              </div>
            </div>
          </div>

          <div className="bldr-context-bar">
            <div className="bldr-context-info">
              <Navigation size={11}/><span>{currentDayCity}</span>
              <button onClick={()=>openCityPicker(activeDay)}
                style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,border:"1px solid rgba(43,150,168,.35)",background:"rgba(43,150,168,.08)",color:BRAND,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                <Edit2 size={8}/> Changer
              </button>
              {currentDayDate&&(<><Calendar size={11}/>{formatDate(currentDayDate,{day:"numeric",month:"long"})}</>)}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {currentDayDate&&(
                <label className="bldr-avail-toggle">
                  <input type="checkbox" checked={showOnlyAvailable} onChange={e=>setShowOnlyAvailable(e.target.checked)} style={{width:12,height:12,accentColor:BRAND}}/>
                  Disponibles · {availCount}/{palette.length}
                </label>
              )}
              <span className="bldr-context-count">{palette.length} excursion{palette.length!==1?"s":""}</span>
            </div>
          </div>

          <div className="bldr-exc-grid">
            {ldExc
              ? Array.from({length:8}).map((_,i)=><div key={i} className="bldr-skeleton"/>)
              : palette.length===0
                ? <div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px 20px",color:"#94A3B8"}}>
                    <Search size={32} style={{marginBottom:10,opacity:.3}}/><p>Aucune excursion pour ces critères</p>
                  </div>
                : palette.map(exc=>{
                    const added  = isAdded(exc.id);
                    const avail  = currentDayDate ? isAvailableOnDate(exc,currentDayDate) : null;
                    const fixedT = normalizeDepartTime(exc.depart_time);
                    return (
                      <div key={exc.id} className={`bldr-exc-card${added?" added":""}`} onClick={()=>loadDetails(exc.id)}>
                        <div className="bldr-exc-img">
                          {exc.photos?.[0]
                            ? <img src={exc.photos[0]} alt={exc.title}/>
                            : <div className="bldr-exc-img-ph"><Camera size={28} strokeWidth={1.5}/></div>
                          }
                          {avail!==null&&(
                            <div className={`bldr-exc-avail-badge${avail?" ok":" ko"}`}>
                              {avail?<><CheckCircle2 size={9}/> Disponible</>:<><AlertCircle size={9}/> Indispo</>}
                            </div>
                          )}
                          {added&&<div className="bldr-exc-added-badge"><CheckCircle size={9}/> Ajouté</div>}
                          {/* Badge heure de départ fixe */}
                          {fixedT&&!added&&(
                            <div className="bldr-exc-time-badge">
                              <Clock size={9}/> {fixedT}
                            </div>
                          )}
                        </div>
                        <div className="bldr-exc-body">
                          <div className="bldr-exc-title">{exc.title}</div>
                          <div className="bldr-exc-meta">
                            <span><Clock size={10}/>{exc.duration_hours>0?`${exc.duration_hours}h`:"Variable"}</span>
                            <span><MapPin size={10}/>{exc.city}</span>
                            {exc.rating>0&&<span><Star size={10} color="#F59E0B" fill="#F59E0B"/>{exc.rating.toFixed(1)}</span>}
                            {/* Heure de départ dans les méta */}
                            {fixedT&&<span style={{color:NAVY,fontWeight:800}}><Clock size={10}/>{fixedT}</span>}
                          </div>
                          <div className="bldr-exc-footer">
                            <span className="bldr-exc-price">{exc.price_per_person} €</span>
                            <button className={`bldr-exc-add${added?" added-btn":""}`}
                              onClick={e=>{e.stopPropagation();if(!added)openSlotPicker(exc);}}>
                              {added?"✓ Ajouté":"+ Ajouter"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="bldr-bottom">
        <div>
          <div className="bldr-total-lbl">Budget estimé</div>
          <div className="bldr-total-amt">{totBudget.toLocaleString("fr-FR")}<span className="bldr-total-eur">EUR</span></div>
        </div>
        <div className="bldr-bottom-right">
          <span style={{fontSize:11,color:"#64748B"}}>{totAct} activité{totAct!==1?"s":""} · {days} jours</span>
          <button className="btn btn-ghost" onClick={()=>router.push("/modeLibre")}><ArrowLeft size={12}/> Reconfigurer</button>
          <button className="btn btn-teal" onClick={()=>setView("result")} disabled={totAct===0}>
            <TrendingUp size={12}/> Voir le résumé<ArrowRight size={12}/>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SLOT PICKER MODAL
      ══════════════════════════════════════ */}
      {pendingExc && (
        <div className="bldr-overlay" onClick={()=>setPendingExc(null)}>
          <div className="bldr-slot-box" onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div className="bldr-slot-hdr">
              <div className="bldr-slot-title">Programmer l'excursion</div>
              <div className="bldr-slot-exc-name">{pendingExc.title}</div>
              <div className="bldr-slot-meta">
                <span><Clock size={10}/>{pendingExc.duration_hours}h</span>
                <span>·</span>
                <span><Euro size={10}/>{pendingExc.price_per_person} €</span>
                {currentDayDate&&<><span>·</span><span style={{color:"#059669"}}><CheckCircle2 size={10}/> Disponible</span></>}
                <span>·</span>
                {/* Résumé horaire : fixe ou choisi */}
                <span style={{color:conflictInfo.hasConflict?"#DC2626":BRAND,fontWeight:800}}>
                  {isTimeFixed ? (
                    <><Lock size={9}/> {fixedDepartTime} → {computeEndTime(fixedDepartTime!, pendingExc.duration_hours)}</>
                  ) : (
                    <>{pickTime} → {computeEndTime(pickTime, pendingExc.duration_hours)}</>
                  )}
                </span>
              </div>
            </div>

            <div className="bldr-slot-body">

              {/* ── CAS 1 : heure de départ FIXE (depart_time renseigné en BDD) ── */}
              {isTimeFixed ? (
                <div className="bldr-fixed-time-card">
                  <div className="bldr-fixed-time-icon">
                    <Clock size={16} color={NAVY}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="bldr-fixed-time-label">Heure de départ officielle</div>
                    <div className="bldr-fixed-time-sub">
                      Définie par l'organisateur · {computeEndTime(fixedDepartTime!, pendingExc.duration_hours)} fin estimée
                    </div>
                    <div className="bldr-fixed-time-lock">
                      <Lock size={8}/> Non modifiable
                    </div>
                  </div>
                  <div className="bldr-fixed-time-value">
                    <div className="bldr-fixed-time-heure">{fixedDepartTime}</div>
                    <div className="bldr-fixed-time-fin">→ {computeEndTime(fixedDepartTime!, pendingExc.duration_hours)}</div>
                  </div>
                </div>
              ) : (
                /* ── CAS 2 : pas d'heure fixe → l'utilisateur choisit ── */
                SLOTS.map(slot => (
                  <div key={slot.key}
                    className={`bldr-slot-option${pickSlot===slot.key?" selected":""}`}
                    onClick={()=>{
                      setPickSlot(slot.key);
                      // Réinitialise l'heure sur la valeur par défaut du créneau
                      if (pickSlot!==slot.key) setPickTime(slot.defaultTime);
                    }}>
                    <div className="bldr-slot-icon" style={{background:slot.bg}}>
                      {React.cloneElement(slot.icon as React.ReactElement,{color:slot.color})}
                    </div>
                    <div style={{flex:1}}>
                      <div className="bldr-slot-label" style={{color:slot.color}}>{slot.label}</div>
                      <div className="bldr-slot-hint">{slot.hint}</div>
                    </div>
                    {pickSlot===slot.key&&(
                      <input type="time" className="bldr-time-input" value={pickTime}
                        onChange={e=>{
                          setPickTime(e.target.value);
                          setPickSlot(slotForTime(e.target.value));
                        }}
                        onClick={e=>e.stopPropagation()}/>
                    )}
                  </div>
                ))
              )}

              {/* ── Bannière de conflit ── */}
              {conflictInfo.hasConflict&&(
                <div className="bldr-conflict-banner">
                  <AlertCircle size={14} color="#DC2626"/>
                  <div>
                    <div style={{fontWeight:800,marginBottom:2}}>Conflit d'horaire détecté</div>
                    <div>{conflictInfo.message}</div>
                    {!isTimeFixed&&(
                      <div style={{marginTop:4,fontSize:10,color:"#B91C1C"}}>
                        Modifiez l'heure de départ pour éviter le chevauchement.
                      </div>
                    )}
                    {isTimeFixed&&(
                      <div style={{marginTop:4,fontSize:10,color:"#B91C1C"}}>
                        L'heure étant fixée par l'organisateur, retirez l'activité en conflit pour ajouter celle-ci.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Timeline du jour ── */}
              {currentDayTimeline.length>0&&(
                <div className="bldr-timeline-wrap">
                  <div className="bldr-timeline-title">Programme du jour · Jour {activeDay+1}</div>
                  {currentDayTimeline.map((act,idx)=>{
                    const actEnd = computeEndTime(act.customTime, act.excursion.duration_hours);
                    const isConf = conflictInfo.conflictingActivity?.id===act.id;
                    const fixedT2 = normalizeDepartTime(act.excursion.depart_time);
                    return (
                      <div key={act.id}>
                        {idx>0&&<hr className="bldr-timeline-sep"/>}
                        <div className="bldr-timeline-row">
                          <div className="bldr-timeline-bar" style={{background:isConf?"#DC2626":BRAND}}/>
                          <div className="bldr-timeline-info">
                            <div className="bldr-timeline-name" style={{color:isConf?"#DC2626":undefined}}>
                              {act.excursion.title}{isConf?" ⚠️":""}
                            </div>
                            <div className="bldr-timeline-range">
                              {act.customTime} – {actEnd}
                              {fixedT2&&<span style={{marginLeft:5,opacity:.65}}><Lock size={7}/></span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Nouvelle excursion */}
                  <hr className="bldr-timeline-sep"/>
                  <div className="bldr-timeline-row">
                    <div className="bldr-timeline-bar" style={{background:conflictInfo.hasConflict?"#DC2626":"#10B981"}}/>
                    <div className="bldr-timeline-info">
                      <div className="bldr-timeline-name" style={{color:conflictInfo.hasConflict?"#DC2626":"#059669",fontWeight:800}}>
                        {pendingExc.title} <span style={{fontSize:9,fontWeight:600}}>(nouveau)</span>
                      </div>
                      <div className="bldr-timeline-range">
                        {isTimeFixed?fixedDepartTime:pickTime} – {computeEndTime(isTimeFixed?fixedDepartTime!:pickTime, pendingExc.duration_hours)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bldr-slot-footer">
              <button className="bldr-slot-cancel" onClick={()=>setPendingExc(null)}>Annuler</button>
              <button className="bldr-slot-confirm" onClick={confirmAdd} disabled={conflictInfo.hasConflict}>
                {conflictInfo.hasConflict
                  ? <><AlertCircle size={12}/> Conflit d'horaire</>
                  : <><CheckCircle2 size={12}/> Ajouter à {isTimeFixed?fixedDepartTime:pickTime}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedExcursion&&(
        <ExcursionDetailModal
          excursion={selectedExcursion}
          onClose={()=>setSelectedExcursion(null)}
          onAdd={()=>{
            const exc: Excursion = {
              id:             selectedExcursion.id,
              title:          selectedExcursion.title,
              city:           selectedExcursion.city,
              price_per_person: selectedExcursion.price_per_person,
              duration_hours: selectedExcursion.duration_hours,
              rating:         selectedExcursion.rating,
              reviews_count:  selectedExcursion.reviews_count,
              categories:     selectedExcursion.categories,
              photos:         selectedExcursion.photos,
              depart_time:    selectedExcursion.depart_time,   // ← champ BDD direct
              available_dates: selectedExcursion.available_dates,
            };
            openSlotPicker(exc);
            setSelectedExcursion(null);
          }}/>
      )}
      {loadingDetails&&<LoadingSpinner/>}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:12}}>
        <Loader2 size={28} color={BRAND} style={{animation:"spin 1s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{color:"#94A3B8",fontSize:13}}>Chargement…</span>
      </div>
    }>
      <BuilderInner/>
    </Suspense>
  );
}