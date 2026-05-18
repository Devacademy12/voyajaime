"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Star,
  Trash2, FileText, Search, CheckCircle2,
  PiggyBank, Layers, BookMarked, ChevronLeft, ChevronRight,
  Loader2, Sunrise, Sun, Moon, Plus, CalendarDays, Edit3, X,
  Camera, LocateFixed, Compass, Building2, Trees, Waves,
  UtensilsCrossed, Tent, Bike, Ship, ShoppingBag, Sparkles,
  Music, AlertCircle, CalendarCheck, Users, Mountain, MapPinned,
  BookOpen, Save, Eye,
} from "lucide-react";

import { ExcursionDetailModal } from "@/app/components/excursions/ExcursionDetailModal";
import { LoadingSpinner } from "@/app/components/excursions/LoadingSpinner";
import { ErrorDisplay } from "@/app/components/excursions/ErrorDisplay";
import ItinerarySummary, { SummaryDayPlan } from "@/app/components/itineraire/ItinerarySummary";
import { HelpPanel } from "@/app/components/itineraire/HelpPanel";
import s from "@/public/style/builder.module.css";

/* ─── Types ─── */
type Excursion = {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number; categories: string[];
  photos: string[]; departure_time?: string;
  available_dates?: any; max_people?: number;
  difficulty?: string; min_age?: number;
};
type AvailableDateItem = {
  date: string; departure_time?: string; departure_times?: string[];
  time?: string; slots?: number;
};
type ExcursionDetail = {
  id: string; title: string; city: string; region: string | null;
  description: string; duration_hours: number; price_per_person: number;
  max_people: number; categories: string[]; languages: string[];
  inclusions: string[]; photos: string[]; rating: number;
  reviews_count: number; meeting_point: string | null;
  difficulty: string | null; min_age: number | null;
  what_to_bring: string | null; not_included: string | null;
  important_info: string | null; cancel_policy: string | null;
  available_dates: AvailableDateItem[] | null | undefined;
  depart_time: string | null;
};
type Ville        = { id: string; nom: string; emoji: string; region: string; description: string; active: boolean };
type TimeKey      = "matin" | "aprem" | "soir";
type ActivityItem = { id: string; excursion: Excursion; note: string; time: TimeKey; customTime?: string };
type DayPlan      = { city: string; date?: string; activities: ActivityItem[] };
type ViewStep     = "builder" | "result";
type AvailableSlot = { date: string; slots?: number; departure_time?: string; departure_times?: string[] };

/* Schedule from URL */
type CitySchedule = { city: string; start: string; end: string };

/* ─── Helpers ─── */
function normalizeDate(d: string): string {
  if (!d) return "";
  return String(d).trim().substring(0, 10);
}
function getSlots(available_dates: any): AvailableSlot[] {
  if (!available_dates) return [];
  if (Array.isArray(available_dates)) {
    if (available_dates.length === 0) return [];
    const first = available_dates[0];
    if (typeof first === "object" && first !== null && "date" in first)
      return available_dates.map((item: any) => ({ date: normalizeDate(item.date), slots: item.slots, departure_time: item.departure_time, departure_times: item.departure_times }));
    if (typeof first === "string") return available_dates.map((d: string) => ({ date: normalizeDate(d) }));
  }
  if (typeof available_dates === "object" && available_dates !== null) {
    if (available_dates.dates && Array.isArray(available_dates.dates))
      return available_dates.dates.map((d: any) => typeof d === "string" ? { date: normalizeDate(d) } : { date: normalizeDate(d.date), slots: d.slots, departure_time: d.departure_time });
  }
  return [];
}
function toSummaryDays(itin: DayPlan[], selCities: string[]): SummaryDayPlan[] {
  return itin.map((d, i) => ({
    day: i + 1, city: d.city, date: d.date, emoji: "📍",
    activities: d.activities.map(act => ({
      id: act.id, time: act.time, customTime: act.customTime, note: act.note,
      excursion: { title: act.excursion.title, city: act.excursion.city, price_per_person: act.excursion.price_per_person, duration_hours: act.excursion.duration_hours, rating: act.excursion.rating, photos: act.excursion.photos, categories: act.excursion.categories },
    })),
  }));
}

/* ─── Category icons ─── */
const getCategoryIcon = (name?: string) => {
  const map: Record<string, React.ReactNode> = {
    "Nature": <Trees size={11} />, "Plage": <Waves size={11} />, "Culture": <BookOpen size={11} />,
    "Histoire": <Compass size={11} />, "Gastronomie": <UtensilsCrossed size={11} />,
    "Aventure": <Tent size={11} />, "Sport": <Bike size={11} />, "Mer": <Ship size={11} />,
    "Désert": <Sun size={11} />, "Montagne": <Mountain size={11} />, "Ville": <Building2 size={11} />,
    "Shopping": <ShoppingBag size={11} />, "Bien-être": <Sparkles size={11} />, "Soirée": <Music size={11} />,
  };
  return map[name || ""] || <MapPinned size={11} />;
};

const BRAND = "#2B96A8";
const SLOTS = [
  { key: "matin" as TimeKey, label: "Matin",      icon: <Sunrise size={13}/>, color: "#F59E0B", hint: "8h – 12h",  defaultTime: "09:00" },
  { key: "aprem" as TimeKey, label: "Après-midi", icon: <Sun     size={13}/>, color: "#2B96A8", hint: "13h – 17h", defaultTime: "13:00" },
  { key: "soir"  as TimeKey, label: "Soir",       icon: <Moon    size={13}/>, color: "#8B5CF6", hint: "18h – 22h", defaultTime: "19:00" },
];

/* ─── Inline CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box}
@keyframes bl-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes bl-spin{to{transform:rotate(360deg)}}
@keyframes bl-toast{0%{opacity:0;transform:translateY(12px)}15%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}

/* ── Root ── */
.bl-root{display:flex;flex-direction:column;height:100vh;background:#F7F9FC;font-family:'DM Sans',system-ui,sans-serif;overflow:hidden}

/* ── Topbar ── */
.bl-topbar{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px;background:white;border-bottom:1px solid #EEF1F5;box-shadow:0 1px 6px rgba(0,0,0,.05);flex-shrink:0;gap:12px}
.bl-topbar-left{display:flex;align-items:center;gap:10px;min-width:0}
.bl-back-btn{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;border:1px solid #E5E7EB;background:white;color:#6B7280;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;flex-shrink:0}
.bl-back-btn:hover{border-color:#2B96A8;color:#2B96A8}
.bl-trip-info{display:flex;align-items:center;gap:6px;padding:6px 12px;background:#F8FAFC;border-radius:10px;border:1px solid #EEF1F5;min-width:0}
.bl-trip-days{font-size:13px;font-weight:800;color:#111827}
.bl-trip-sep{color:#D1D5DB;font-size:12px}
.bl-trip-cities{font-size:12px;color:#6B7280;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.bl-topbar-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.bl-people-wrap{display:flex;align-items:center;gap:6px;padding:6px 10px;background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0}
.bl-people-label{font-size:11px;font-weight:600;color:#065F46}
.bl-people-select{border:none;background:transparent;font-size:12px;font-weight:700;color:#065F46;cursor:pointer;font-family:inherit;outline:none}
.bl-stat-chip{display:flex;align-items:center;gap:5px;padding:6px 10px;background:#F8FAFC;border-radius:10px;border:1px solid #EEF1F5;font-size:12px;color:#6B7280;font-weight:600;white-space:nowrap}
.bl-stat-budget{background:rgba(43,150,168,.07);border-color:rgba(43,150,168,.2);color:#2B96A8}
.bl-summary-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;background:#2B96A8;color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s;box-shadow:0 4px 12px rgba(43,150,168,.3)}
.bl-summary-btn:hover{background:#248899;box-shadow:0 6px 18px rgba(43,150,168,.4);transform:translateY(-1px)}
.bl-save-btn{display:flex;align-items:center;gap:5px;padding:7px 14px;background:white;color:#374151;border:1.5px solid #E5E7EB;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
.bl-save-btn:hover{border-color:#2B96A8;color:#2B96A8}
.bl-save-btn-ok{border-color:#10B981;color:#10B981;background:#F0FDF4}

/* ── Day tabs ── */
.bl-day-tabs{display:flex;gap:0;padding:0 20px;background:white;border-bottom:1px solid #EEF1F5;overflow-x:auto;flex-shrink:0}
.bl-day-tabs::-webkit-scrollbar{height:0}
.bl-day-tab{display:flex;align-items:center;gap:6px;padding:12px 16px;border:none;background:transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:#9CA3AF;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap;position:relative}
.bl-day-tab:hover{color:#374151}
.bl-day-tab-active{color:#2B96A8;border-bottom-color:#2B96A8;background:rgba(43,150,168,.03)}
.bl-day-tab-city{font-weight:500;color:#C4C9D0;font-size:11px}
.bl-tab-count{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;background:#2B96A8;color:white;border-radius:50%;font-size:9px;font-weight:800}
.bl-tab-no-date{color:#F59E0B;opacity:.7}

/* ── Body ── */
.bl-body{flex:1;display:flex;overflow:hidden;gap:0}

/* ── Catalogue ── */
.bl-catalogue{width:58%;display:flex;flex-direction:column;border-right:1px solid #EEF1F5;overflow:hidden;background:white}
.bl-cat-header{padding:16px 20px 12px;border-bottom:1px solid #F3F4F6;flex-shrink:0}
.bl-cat-header-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px}
.bl-cat-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:800;color:#111827}
.bl-city-pill{display:flex;align-items:center;gap:4px;padding:3px 9px;background:rgba(43,150,168,.08);border-radius:20px;font-size:11px;font-weight:600;color:#2B96A8}
.bl-cat-right{display:flex;align-items:center;gap:8px}
.bl-date-pill{display:flex;align-items:center;gap:5px;padding:5px 10px;background:rgba(43,150,168,.07);border-radius:8px;border:1px solid rgba(43,150,168,.2);cursor:pointer;font-size:11px;font-weight:700;color:#2B96A8;font-family:inherit;transition:all .15s}
.bl-date-pill:hover{background:rgba(43,150,168,.12)}
.bl-date-pick-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;background:white;border-radius:8px;border:1.5px dashed #D1D5DB;cursor:pointer;font-size:11px;font-weight:600;color:#9CA3AF;font-family:inherit;transition:all .15s}
.bl-date-pick-btn:hover{border-color:#2B96A8;color:#2B96A8}
.bl-result-count{font-size:11px;color:#9CA3AF;font-weight:600;white-space:nowrap}
.bl-search-row{display:flex;align-items:center;gap:8px}
.bl-search-box{flex:1;display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F8FAFC;border-radius:10px;border:1px solid #EEF1F5}
.bl-search-input{flex:1;border:none;background:transparent;font-size:13px;color:#374151;font-family:inherit;outline:none}
.bl-search-input::placeholder{color:#9CA3AF}
.bl-legend{display:flex;gap:12px;margin-top:8px}
.bl-legend-ok{display:flex;align-items:center;gap:4px;font-size:10px;color:#10B981;font-weight:600}
.bl-legend-ko{display:flex;align-items:center;gap:4px;font-size:10px;color:#EF4444;font-weight:600}

/* ── Grid ── */
.bl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:14px 20px;overflow-y:auto;flex:1}
.bl-grid::-webkit-scrollbar{width:4px}
.bl-grid::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}

/* ── Excursion card ── */
.bl-card{border-radius:16px;border:1.5px solid #EEF1F5;background:white;overflow:hidden;cursor:pointer;transition:all .2s;animation:bl-fadein .22s ease both}
.bl-card:hover{border-color:#2B96A8;box-shadow:0 8px 24px -8px rgba(43,150,168,.25);transform:translateY(-2px)}
.bl-card-unavail{opacity:.55;filter:grayscale(.4)}
.bl-card-unavail:hover{transform:none;box-shadow:none;border-color:#EEF1F5}
.bl-card-img{position:relative;height:130px;overflow:hidden;background:#F3F4F6}
.bl-card-img-el{width:100%;height:100%;object-fit:cover;transition:transform .3s}
.bl-card:hover .bl-card-img-el{transform:scale(1.04)}
.bl-card-img-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.bl-card-img-gradient{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.35) 0%,transparent 50%)}
.bl-cat-badge{position:absolute;bottom:7px;left:8px;display:flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);border-radius:20px;font-size:10px;font-weight:700;color:white}
.bl-unavail-badge{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:4px;padding:3px 8px;background:#EF4444;border-radius:20px;font-size:10px;font-weight:700;color:white}
.bl-avail-badge{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:4px;padding:3px 8px;background:#10B981;border-radius:20px;font-size:10px;font-weight:700;color:white}
.bl-card-body{padding:10px 12px}
.bl-card-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:4px}
.bl-card-title{font-size:12px;font-weight:800;color:#111827;line-height:1.3;flex:1}
.bl-card-price{text-align:right;flex-shrink:0}
.bl-card-price-num{font-size:14px;font-weight:900;color:#2B96A8;display:block;line-height:1}
.bl-card-price-unit{font-size:9px;color:#9CA3AF;font-weight:600}
.bl-card-city{display:flex;align-items:center;gap:4px;font-size:11px;color:#9CA3AF;margin-bottom:6px}
.bl-card-meta{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.bl-meta-item{display:flex;align-items:center;gap:3px;font-size:11px;color:#6B7280;font-weight:500}
.bl-meta-depart{color:#2B96A8;font-weight:700}
.bl-avail-tag{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600;margin-bottom:8px}
.bl-avail-tag-ok{color:#10B981}
.bl-avail-tag-ko{color:#EF4444}
.bl-avail-tag-neutral{color:#9CA3AF}
.bl-divider{height:1px;background:#F3F4F6;margin:0 -12px 8px}
.bl-reserve-btn{width:100%;padding:7px;border-radius:8px;border:none;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:5px}
.bl-reserve-btn-default{background:rgba(43,150,168,.08);color:#2B96A8}
.bl-reserve-btn-default:hover{background:#2B96A8;color:white}
.bl-reserve-btn-added{background:#F0FDF4;color:#10B981;cursor:default}
.bl-reserve-btn-unavail{background:#FEF2F2;color:#EF4444;cursor:not-allowed}
.bl-skeleton{border-radius:16px;background:#F3F4F6;height:240px;animation:bl-lp 1.5s ease infinite}
@keyframes bl-lp{0%,100%{opacity:1}50%{opacity:.4}}
.bl-empty-state{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;color:#9CA3AF}
.bl-empty-state-title{font-size:14px;font-weight:700;color:#374151;margin:12px 0 6px}
.bl-empty-state-hint{font-size:12px;color:#9CA3AF}

/* ── Planner ── */
.bl-planner{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#F7F9FC}
.bl-planner-header{padding:14px 18px 10px;background:white;border-bottom:1px solid #EEF1F5;flex-shrink:0}
.bl-planner-header-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.bl-planner-day-info{display:flex;align-items:center;gap:10px;min-width:0}
.bl-planner-day-icon{width:36px;height:36px;border-radius:12px;background:rgba(43,150,168,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bl-planner-day-name{font-size:14px;font-weight:800;color:#111827;margin-bottom:3px}
.bl-planner-date-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.bl-planner-date-btn{display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:8px;border:1px solid #E5E7EB;background:white;font-size:11px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
.bl-planner-date-btn:hover{border-color:#2B96A8;color:#2B96A8}
.bl-city-select{padding:4px 8px;border-radius:8px;border:1px solid #E5E7EB;background:white;font-size:11px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;outline:none;transition:all .15s}
.bl-city-select:hover{border-color:#2B96A8}
.bl-planner-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.bl-day-totals{text-align:right}
.bl-day-budget{font-size:16px;font-weight:900;color:#2B96A8;line-height:1}
.bl-day-budget-unit{font-size:10px;font-weight:600;color:#9CA3AF}
.bl-day-count{font-size:10px;color:#9CA3AF;font-weight:600;margin-top:1px}
.bl-day-nav{display:flex;gap:4px}
.bl-nav-btn{width:28px;height:28px;border-radius:8px;border:1px solid #E5E7EB;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;color:#6B7280}
.bl-nav-btn:hover:not(:disabled){border-color:#2B96A8;color:#2B96A8}
.bl-nav-btn:disabled{opacity:.3;cursor:not-allowed}

.bl-planner-scroll{flex:1;overflow-y:auto;padding:14px 16px}
.bl-planner-scroll::-webkit-scrollbar{width:4px}
.bl-planner-scroll::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}

/* planner empty */
.bl-planner-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;color:#9CA3AF;gap:8px}
.bl-planner-empty-icon{width:56px;height:56px;border-radius:18px;background:#F3F4F6;display:flex;align-items:center;justify-content:center;margin-bottom:6px}
.bl-planner-empty-title{font-size:13px;font-weight:700;color:#374151}
.bl-planner-empty-hint{font-size:12px;color:#9CA3AF;max-width:180px;line-height:1.5}
.bl-empty-date-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;background:#2B96A8;color:white;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px}

/* slot section */
.bl-slot-section{margin-bottom:14px}
.bl-slot-header{display:flex;align-items:center;gap:7px;margin-bottom:8px}
.bl-slot-icon{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bl-slot-label{font-size:12px;font-weight:800}
.bl-slot-hint{font-size:10px;color:#9CA3AF;flex:1}
.bl-slot-total{display:flex;align-items:center;gap:4px;font-size:10px;color:#6B7280;font-weight:600}
.bl-slot-empty{font-size:11px;color:#D1D5DB;font-style:italic;padding:6px 0 2px 31px}

/* activity card in planner */
.bl-act-card{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;background:white;border-radius:12px;margin-bottom:7px;border:1.5px solid #EEF1F5;transition:border .15s;animation:bl-fadein .2s ease}
.bl-act-card:hover{border-color:#2B96A8}
.bl-act-time{font-size:10px;font-weight:800;color:#9CA3AF;flex-shrink:0;min-width:36px;padding-top:2px}
.bl-act-img{width:52px;height:52px;border-radius:9px;object-fit:cover;flex-shrink:0;border:1px solid #EEF1F5}
.bl-act-info{flex:1;min-width:0}
.bl-act-title{font-size:12px;font-weight:800;color:#111827;margin-bottom:4px;line-height:1.3}
.bl-act-meta{display:flex;align-items:center;gap:7px;font-size:10px;color:#6B7280;margin-bottom:3px}
.bl-act-note{display:flex;align-items:flex-start;gap:4px;font-size:10px;color:#9CA3AF;font-style:italic;margin-top:3px}
.bl-act-price{font-size:13px;font-weight:900;color:#2B96A8;flex-shrink:0;white-space:nowrap}
.bl-act-price small{font-size:9px;font-weight:600;color:#9CA3AF}
.bl-act-actions{display:flex;flex-direction:column;gap:4px;flex-shrink:0}
.bl-act-action-btn{width:24px;height:24px;border-radius:7px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.bl-act-action-note{background:#F3F4F6;color:#6B7280}
.bl-act-action-note:hover{background:#E5E7EB}
.bl-act-action-del{background:#FEF2F2;color:#EF4444}
.bl-act-action-del:hover{background:#FCA5A5}

/* ── Overlays ── */
.bl-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px}
.bl-modal{background:white;border-radius:20px;padding:24px;width:100%;max-width:380px;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:bl-fadein .2s ease}
.bl-modal-title{font-size:16px;font-weight:800;color:#111827;margin-bottom:4px}
.bl-modal-sub{font-size:13px;color:#6B7280;margin-bottom:16px}
.bl-modal-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:#6B7280;margin-bottom:14px;flex-wrap:wrap}
.bl-modal-date-confirm{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#F0FDF4;border-radius:8px;border:1px solid #BBF7D0;font-size:12px;color:#065F46;font-weight:600;margin-bottom:14px}
.bl-slot-option{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;border:1.5px solid #E5E7EB;cursor:pointer;margin-bottom:8px;transition:all .15s}
.bl-slot-option:hover{border-color:#2B96A8}
.bl-slot-option-sel{border-width:2px}
.bl-slot-opt-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bl-slot-opt-label{font-size:13px;font-weight:800}
.bl-slot-opt-hint{font-size:11px;color:#9CA3AF}
.bl-time-input{padding:5px 8px;border-radius:8px;border:1.5px solid #E5E7EB;font-size:12px;font-family:inherit;color:#374151;outline:none}
.bl-modal-actions{display:flex;gap:8px;margin-top:16px}
.bl-cancel-btn{flex:1;padding:11px;border-radius:10px;border:1.5px solid #E5E7EB;background:white;color:#6B7280;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
.bl-cancel-btn:hover{border-color:#9CA3AF;color:#374151}
.bl-confirm-btn{flex:2;padding:11px;border-radius:10px;border:none;background:#2B96A8;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .15s;box-shadow:0 4px 12px rgba(43,150,168,.35)}
.bl-confirm-btn:hover:not(:disabled){background:#248899}
.bl-confirm-btn:disabled{background:#E5E7EB;color:#9CA3AF;box-shadow:none;cursor:not-allowed}
.bl-date-input{width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #E5E7EB;font-size:13px;font-family:inherit;color:#374151;outline:none;margin-bottom:12px}
.bl-date-input:focus{border-color:#2B96A8}
.bl-note-textarea{width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #E5E7EB;font-size:13px;font-family:inherit;color:#374151;outline:none;resize:vertical;min-height:80px;margin-bottom:4px}
.bl-note-textarea:focus{border-color:#2B96A8}

/* ── Toast ── */
.bl-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:white;border:1px solid #E5E7EB;border-radius:12px;padding:10px 18px;font-size:13px;font-weight:600;color:#374151;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:9999;display:flex;align-items:center;gap:8px;animation:bl-toast 3s ease forwards}

@media(max-width:900px){
  .bl-body{flex-direction:column}
  .bl-catalogue,.bl-planner{width:100%;height:50%}
  .bl-catalogue{border-right:none;border-bottom:1px solid #EEF1F5}
  .bl-trip-cities{max-width:100px}
}
`;

/* ════════════════════════════════════════
   BuilderInner
════════════════════════════════════════ */
function BuilderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sb     = useMemo(() => createClient(), []);

  /* ── URL params ── */
  const selCities = useMemo(() => (params.get("cities") || "").split(",").filter(Boolean), [params]);
  const days      = Number(params.get("days") || selCities.length || 3);
  const people    = Number(params.get("people") || 2);
  const schedule  = useMemo((): CitySchedule[] => {
    try { return JSON.parse(params.get("schedule") || "[]"); } catch { return []; }
  }, [params]);

  /* ── State ── */
  const [userId,    setUserId]    = useState<string | null>(null);
  const [savedItId, setSavedItId] = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [view,      setView]      = useState<ViewStep>("builder");
  const [numberOfPeople, setNumberOfPeople] = useState(people);

  const [villes,     setVilles]     = useState<Ville[]>([]);
  const [allExc,     setAllExc]     = useState<Excursion[]>([]);
  const [ldExc,      setLdExc]      = useState(true);
  const [errExc,     setErrExc]     = useState<string | null>(null);

  const [search,         setSearch]         = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHelpPanel,  setShowHelpPanel]  = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState<string | null>(null);

  const [itin,      setItin]      = useState<DayPlan[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [editNote,  setEditNote]  = useState<string | null>(null);
  const [noteText,  setNoteText]  = useState("");
  const [pendingExc, setPendingExc] = useState<Excursion | null>(null);
  const [pickSlot,   setPickSlot]   = useState<TimeKey>("matin");
  const [pickTime,   setPickTime]   = useState("09:00");
  const [selectedExcursion, setSelectedExcursion] = useState<ExcursionDetail | null>(null);
  const [loadingDetails,    setLoadingDetails]    = useState(false);

  /* ── Helpers ── */
  const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const formatDate = (d: string, opts?: Intl.DateTimeFormatOptions) => {
    const nd = normalizeDate(d);
    if (!nd) return "";
    const [y, m, day] = nd.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("fr-FR", opts || { day: "numeric", month: "long", year: "numeric" });
  };

  /* ── Build itinerary days from schedule ── */
  const buildDaysFromSchedule = useCallback((schedule: CitySchedule[], villes: Ville[]): DayPlan[] => {
    if (schedule.length === 0) {
      return Array.from({ length: days }, (_, i) => ({ city: selCities[i % selCities.length] || selCities[0] || "", activities: [] }));
    }
    const result: DayPlan[] = [];
    for (const seg of schedule) {
      const start = new Date(seg.start); const end = new Date(seg.end);
      const cur = new Date(start);
      while (cur <= end) {
        result.push({ city: seg.city, date: cur.toISOString().split("T")[0], activities: [] });
        cur.setDate(cur.getDate() + 1);
      }
    }
    return result.length > 0 ? result : Array.from({ length: days }, (_, i) => ({ city: selCities[i % selCities.length] || "", activities: [] }));
  }, [days, selCities]);

  /* ── Availability checks ── */
  const isExcursionAvailableOnDate = useCallback((excursion: Excursion, date: string): boolean => {
    const avail = excursion.available_dates;
    if (avail === null || avail === undefined) return true;
    const nd = normalizeDate(date);
    if (!nd) return true;
    if (Array.isArray(avail)) {
      if (avail.length === 0) return true;
      const first = avail[0];
      if (typeof first === "object" && first !== null && "date" in first)
        return avail.some((item: any) => normalizeDate(item.date) === nd);
      if (typeof first === "string") return avail.some((d: string) => normalizeDate(d) === nd);
      return true;
    }
    if (typeof avail === "object" && avail !== null) {
      if (Object.keys(avail).length === 0) return true;
      if (avail.dates && Array.isArray(avail.dates)) {
        if (avail.dates.length === 0) return true;
        return avail.dates.some((item: any) => typeof item === "string" ? normalizeDate(item) === nd : normalizeDate(item.date) === nd);
      }
      if (avail.start && avail.end) {
        const inRange = nd >= normalizeDate(avail.start) && nd <= normalizeDate(avail.end);
        if (avail.days?.length > 0) {
          if (!inRange) return false;
          const [y,m,dd]=nd.split("-").map(Number);
          const dfr=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
          return avail.days.includes(dfr[new Date(y,m-1,dd).getDay()]);
        }
        return inRange;
      }
    }
    return true;
  }, []);

  const getDepartureTimeForDate = useCallback((excursion: Excursion, date: string): string | undefined => {
    const slots = getSlots(excursion.available_dates);
    const slot  = slots.find(ss => ss.date === normalizeDate(date));
    return slot?.departure_time || excursion.departure_time;
  }, []);

  const isTimeSlotAvailable = useCallback((dayIdx: number, startTime: string, durationHours: number): boolean => {
    const acts = itin[dayIdx]?.activities || [];
    const ns = toMinutes(startTime), ne = ns + durationHours * 60;
    for (const act of acts) {
      const as = toMinutes(act.customTime || SLOTS.find(ss => ss.key === act.time)?.defaultTime || "09:00");
      const ae = as + act.excursion.duration_hours * 60;
      if (!(ne <= as || ns >= ae)) return false;
    }
    return true;
  }, [itin]);

  /* ── Load data ── */
  const loadAll = async () => {
    setLdExc(true);
    try {
      const [vR, eR] = await Promise.all([
        sb.from("villes").select("*").eq("active", true).order("nom"),
        sb.from("excursions").select("*").eq("is_active", true).order("rating", { ascending: false }),
      ]);
      setVilles((vR.data || []) as Ville[]);
      if (eR.error) setErrExc(eR.error.message);
      else setAllExc((eR.data || []) as Excursion[]);
    } catch (err) {
      setErrExc("Erreur lors du chargement");
    } finally { setLdExc(false); }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!ldExc) setItin(buildDaysFromSchedule(schedule, villes));
  }, [ldExc, villes]);

  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await sb.from("itineraires").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setSavedItId(data.id);
    });
  }, [sb]);

  /* ── Derived ── */
  const currentDayCity = useMemo(() => itin[activeDay]?.city || "", [itin, activeDay]);
  const currentDayDate = useMemo(() => itin[activeDay]?.date,       [itin, activeDay]);

  /* Palette filtered by city + search — and sorted: available first */
  const palette = useMemo(() => {
    const q = search.toLowerCase();
    let list = allExc.filter(e => {
      const matchSearch = !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
      const matchCity   = !currentDayCity || e.city.toLowerCase() === currentDayCity.toLowerCase();
      return matchSearch && matchCity;
    });
    // Sort: if date selected, available ones first
    if (currentDayDate) {
      list = [...list].sort((a, b) => {
        const aAvail = isExcursionAvailableOnDate(a, currentDayDate) ? 0 : 1;
        const bAvail = isExcursionAvailableOnDate(b, currentDayDate) ? 0 : 1;
        return aAvail - bAvail;
      });
    }
    return list;
  }, [allExc, currentDayCity, search, currentDayDate, isExcursionAvailableOnDate]);

  const availableCount = useMemo(() =>
    currentDayDate ? palette.filter(e => isExcursionAvailableOnDate(e, currentDayDate)).length : palette.length,
    [palette, currentDayDate, isExcursionAvailableOnDate]
  );

  const totAct    = itin.reduce((acc, d) => acc + (d.activities?.length || 0), 0);
  const totBudget = itin.reduce((acc, d) => acc + (d.activities?.reduce((ss, a) => ss + (a.excursion?.price_per_person || 0), 0) || 0), 0) * numberOfPeople;
  const isAdded   = (id: string) => itin[activeDay]?.activities.some(a => a.excursion.id === id);

  const toast = (msg: string) => { setShowSuccessMsg(msg); setTimeout(() => setShowSuccessMsg(null), 3000); };

  /* ── Actions ── */
  const openSlotPicker = (exc: Excursion) => {
    if (currentDayDate && !isExcursionAvailableOnDate(exc, currentDayDate)) {
      alert(`⚠️ "${exc.title}" n'est pas disponible le ${formatDate(currentDayDate)}.`);
      return;
    }
    const depTime = currentDayDate ? getDepartureTimeForDate(exc, currentDayDate) : exc.departure_time;
    setPendingExc(exc);
    setPickSlot("matin");
    setPickTime(depTime?.substring(0, 5) || "09:00");
  };

  const confirmAdd = () => {
    if (!pendingExc) return;
    if (!isTimeSlotAvailable(activeDay, pickTime, pendingExc.duration_hours)) { alert("❌ Conflit d'horaires avec une autre activité."); return; }
    setItin(prev => { const n=[...prev]; n[activeDay]={...n[activeDay],activities:[...n[activeDay].activities,{id:`${Date.now()}-${Math.random()}`,excursion:pendingExc,note:"",time:pickSlot,customTime:pickTime}]}; return n; });
    toast(`✓ "${pendingExc.title}" ajouté`);
    setPendingExc(null);
  };

  const rmAct = (dayIdx: number, id: string) => {
    setItin(prev => { const n=[...prev]; const act=n[dayIdx].activities.find(a=>a.id===id); n[dayIdx]={...n[dayIdx],activities:n[dayIdx].activities.filter(a=>a.id!==id)}; if(act) toast(`✗ "${act.excursion.title}" retiré`); return n; });
  };

  const saveNote = (dayIdx: number, id: string) => {
    setItin(prev => { const n=[...prev]; n[dayIdx]={...n[dayIdx],activities:n[dayIdx].activities.map(a=>a.id===id?{...a,note:noteText}:a)}; return n; });
    setEditNote(null); setNoteText("");
  };

  const saveItinerary = async () => {
    if (!userId) { alert("Vous devez être connecté"); return; }
    setSaving(true);
    const payload = { user_id: userId, nb_jours: days, villes_selectionnees: selCities, categories_selectionnees: [], plan: itin, nombre_personnes: numberOfPeople, updated_at: new Date().toISOString() };
    try {
      if (savedItId) await sb.from("itineraires").update(payload).eq("id", savedItId);
      else { const { data } = await sb.from("itineraires").insert({ ...payload, created_at: new Date().toISOString() }).select().single(); if (data) setSavedItId(data.id); }
      setSaveOk(true); setTimeout(() => setSaveOk(false), 2500);
    } catch { alert("Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  };

  const loadExcursionDetails = async (excursionId: string) => {
    setLoadingDetails(true);
    try { const { data } = await sb.from("excursions").select("*").eq("id", excursionId).single(); setSelectedExcursion(data as ExcursionDetail); }
    catch { } finally { setLoadingDetails(false); }
  };

  /* ── Date Picker Modal ── */
  const DatePickerModal = () => {
    const today = normalizeDate(new Date().toISOString());
    const [sel, setSel] = useState(currentDayDate ? normalizeDate(currentDayDate) : "");
    const handleConfirm = () => {
      if (!sel) return;
      const nd = normalizeDate(sel);
      setItin(prev => { const n=[...prev]; n[activeDay]={...n[activeDay],date:nd,activities:n[activeDay].activities.filter(act=>isExcursionAvailableOnDate(act.excursion,nd))}; return n; });
      setShowDatePicker(false);
      toast(`📅 Date fixée au ${formatDate(nd)}`);
    };
    return (
      <div className="bl-overlay" onClick={() => setShowDatePicker(false)}>
        <div className="bl-modal" onClick={e => e.stopPropagation()}>
          <div className="bl-modal-title">Date de visite</div>
          <p className="bl-modal-sub"><MapPin size={11} style={{display:"inline"}}/> {currentDayCity}</p>
          <input type="date" className="bl-date-input" value={sel} min={today} onChange={e => setSel(e.target.value)}/>
          <div className="bl-modal-actions">
            <button className="bl-cancel-btn" onClick={() => setShowDatePicker(false)}>Annuler</button>
            <button className="bl-confirm-btn" onClick={handleConfirm} disabled={!sel}><CheckCircle2 size={13}/> Confirmer</button>
          </div>
        </div>
      </div>
    );
  };

  /* ── Result view ── */
  if (view === "result") return (
    <ItinerarySummary
      days={toSummaryDays(itin, selCities)} nbJours={days} selCities={selCities}
      numberOfPeople={numberOfPeople} saving={saving} saveOk={saveOk}
      savedItId={savedItId} onBack={() => setView("builder")}
      onEdit={() => setView("builder")} onSave={saveItinerary}
    />
  );

  /* ── Builder view ── */
  const currentDay = itin[activeDay];
  const dayActs    = currentDay?.activities || [];
  const dayBudget  = dayActs.reduce((acc, a) => acc + a.excursion.price_per_person, 0) * numberOfPeople;
  const slotActs   = (slot: TimeKey) =>
    [...dayActs].filter(a => a.time === slot).sort((a, b) => (a.customTime||"").localeCompare(b.customTime||""));

  return (
    <div className="bl-root">
      <style>{CSS}</style>

      {showDatePicker && <DatePickerModal />}

      {/* Toast */}
      {showSuccessMsg && (
        <div className="bl-toast"><CheckCircle2 size={14} color={BRAND}/> {showSuccessMsg}</div>
      )}

      {/* ── Topbar ── */}
      <div className="bl-topbar">
        <div className="bl-topbar-left">
          <button className="bl-back-btn" onClick={() => router.push("/touriste/modeLibre")}>
            <ArrowLeft size={14}/> <span>Retour</span>
          </button>
          <div className="bl-trip-info">
            <Calendar size={12} color={BRAND}/>
            <span className="bl-trip-days">{itin.length} jour{itin.length > 1 ? "s" : ""}</span>
            <span className="bl-trip-sep">·</span>
            <span className="bl-trip-cities">{selCities.join(" → ")}</span>
          </div>
        </div>
        <div className="bl-topbar-right">
          {/* Nombre de personnes */}
          <div className="bl-people-wrap">
            <Users size={12} color="#065F46"/>
            <span className="bl-people-label">Voyageurs :</span>
            <select className="bl-people-select" value={numberOfPeople} onChange={e => setNumberOfPeople(Number(e.target.value))}>
              {Array.from({length:20},(_,i)=>i+1).map(n=>(
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {totAct > 0 && <>
            <div className="bl-stat-chip"><Layers size={12}/> {totAct} activité{totAct > 1 ? "s" : ""}</div>
            <div className="bl-stat-chip bl-stat-budget"><PiggyBank size={12}/> {totBudget} TND</div>
          </>}

          <button className={`bl-save-btn ${saveOk ? "bl-save-btn-ok" : ""}`} onClick={saveItinerary} disabled={saving}>
            {saving ? <Loader2 size={13} style={{animation:"bl-spin .7s linear infinite"}}/> : <Save size={13}/>}
            {saveOk ? "Sauvegardé !" : "Sauvegarder"}
          </button>

          <button className="bl-summary-btn" onClick={() => setView("result")}>
            <Eye size={13}/> Voir le résumé
          </button>
        </div>
      </div>

      {/* ── Day tabs ── */}
      <div className="bl-day-tabs">
        {itin.map((day, i) => (
          <button key={i} className={`bl-day-tab ${activeDay === i ? "bl-day-tab-active" : ""}`} onClick={() => setActiveDay(i)}>
            <LocateFixed size={11}/>
            <span>Jour {i + 1}</span>
            <span className="bl-day-tab-city">— {day.city}</span>
            {day.date && <span style={{fontSize:9,color:"#9CA3AF",fontWeight:600}}>
              {new Date(day.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
            </span>}
            {!day.date && <CalendarDays size={10} className="bl-tab-no-date"/>}
            {day.activities.length > 0 && <span className="bl-tab-count">{day.activities.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="bl-body">

        {/* ════ Catalogue ════ */}
        <div className="bl-catalogue">
          <div className="bl-cat-header">
            <div className="bl-cat-header-row">
              <div className="bl-cat-title">
                <BookMarked size={14} color={BRAND}/>
                <span>Excursions disponibles</span>
                {currentDayCity && <span className="bl-city-pill"><MapPin size={9}/> {currentDayCity}</span>}
              </div>
              <div className="bl-cat-right">
                {currentDayDate ? (
                  <button className="bl-date-pill" onClick={() => setShowDatePicker(true)}>
                    <CalendarCheck size={11} color={BRAND}/>
                    {formatDate(currentDayDate, {day:"numeric",month:"short"})}
                    <Edit3 size={10} color="#9CA3AF"/>
                  </button>
                ) : (
                  <button className="bl-date-pick-btn" onClick={() => setShowDatePicker(true)}>
                    <CalendarDays size={11}/> Choisir une date
                  </button>
                )}
                {!ldExc && !errExc && (
                  <span className="bl-result-count">
                    {currentDayDate ? `${availableCount}/${palette.length} dispo` : `${palette.length} excursion${palette.length !== 1 ? "s" : ""}`}
                  </span>
                )}
              </div>
            </div>
            <div className="bl-search-row">
              <div className="bl-search-box">
                <Search size={13} color="#9CA3AF"/>
                <input type="text" className="bl-search-input" placeholder="Rechercher une excursion..." value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
            </div>
            {currentDayDate && !ldExc && palette.length > 0 && (
              <div className="bl-legend">
                <span className="bl-legend-ok"><CheckCircle2 size={9}/> Disponible ce jour</span>
                <span className="bl-legend-ko"><AlertCircle size={9}/> Indisponible</span>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="bl-grid">
            {ldExc ? (
              Array.from({length:8}).map((_,i) => <div key={i} className="bl-skeleton" style={{animationDelay:`${i*.05}s`}}/>)
            ) : errExc ? (
              <div style={{gridColumn:"1/-1"}}><ErrorDisplay message={errExc} onRetry={loadAll}/></div>
            ) : palette.length === 0 ? (
              <div className="bl-empty-state">
                <CalendarDays size={48} strokeWidth={1}/>
                <p className="bl-empty-state-title">Aucune excursion à {currentDayCity}</p>
                <p className="bl-empty-state-hint">Essayez de modifier la ville ou les filtres</p>
              </div>
            ) : (
              palette.map((exc, idx) => {
                const added       = isAdded(exc.id);
                const isAvail     = currentDayDate ? isExcursionAvailableOnDate(exc, currentDayDate) : true;
                const unavailable = currentDayDate && !isAvail;
                const depTime     = currentDayDate ? getDepartureTimeForDate(exc, currentDayDate) : exc.departure_time;

                return (
                  <div key={exc.id}
                    className={`bl-card ${unavailable ? "bl-card-unavail" : ""}`}
                    style={{animationDelay:`${idx*.03}s`}}
                    onClick={() => loadExcursionDetails(exc.id)}>

                    {/* Image */}
                    <div className="bl-card-img">
                      {exc.photos?.[0]
                        ? <img src={exc.photos[0]} alt={exc.title} className="bl-card-img-el"/>
                        : <div className="bl-card-img-placeholder" style={{background:`${BRAND}10`}}><Camera size={28} color={BRAND} strokeWidth={1.5}/></div>
                      }
                      <div className="bl-card-img-gradient"/>
                      {exc.categories?.[0] && !unavailable && (
                        <span className="bl-cat-badge">{getCategoryIcon(exc.categories[0])} {exc.categories[0]}</span>
                      )}
                      {currentDayDate && (
                        isAvail
                          ? <span className="bl-avail-badge"><CheckCircle2 size={9}/> Dispo</span>
                          : <span className="bl-unavail-badge"><AlertCircle size={9}/> Indispo</span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="bl-card-body">
                      <div className="bl-card-title-row">
                        <h3 className="bl-card-title">{exc.title}</h3>
                        <div className="bl-card-price">
                          <span className="bl-card-price-num">{exc.price_per_person}</span>
                          <span className="bl-card-price-unit">TND/pers.</span>
                        </div>
                      </div>
                      <div className="bl-card-city"><MapPin size={10} color="#9CA3AF"/> {exc.city}</div>
                      <div className="bl-card-meta">
                        <span className="bl-meta-item"><Clock size={10} color="#6B7280"/> {exc.duration_hours}h</span>
                        {exc.rating > 0 && <span className="bl-meta-item"><Star size={10} color="#F59E0B" fill="#F59E0B"/> {exc.rating}</span>}
                        {depTime && <span className="bl-meta-item bl-meta-depart"><Sunrise size={10}/> {depTime.substring(0,5)}</span>}
                      </div>

                      {/* Prix total si > 1 personne */}
                      {numberOfPeople > 1 && (
                        <div style={{fontSize:10,color:"#9CA3AF",marginBottom:6,fontWeight:600}}>
                          Total {numberOfPeople} pers. : <span style={{color:"#2B96A8",fontWeight:800}}>{exc.price_per_person * numberOfPeople} TND</span>
                        </div>
                      )}

                      <div className="bl-divider"/>
                      <button
                        className={`bl-reserve-btn ${added ? "bl-reserve-btn-added" : unavailable ? "bl-reserve-btn-unavail" : "bl-reserve-btn-default"}`}
                        disabled={added || !!unavailable}
                        onClick={e => { e.stopPropagation(); if (!unavailable && !added) openSlotPicker(exc); }}>
                        {added ? <><CheckCircle2 size={12}/> Ajouté</>
                          : unavailable ? <><AlertCircle size={12}/> Indisponible</>
                          : <><CalendarCheck size={12}/> Ajouter</>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ════ Planner ════ */}
        <div className="bl-planner">
          <div className="bl-planner-header">
            <div className="bl-planner-header-top">
              <div className="bl-planner-day-info">
                <div className="bl-planner-day-icon"><LocateFixed size={14} color={BRAND}/></div>
                <div>
                  <div className="bl-planner-day-name">Jour {activeDay + 1} — {currentDay?.city}</div>
                  <div className="bl-planner-date-row">
                    {currentDay?.date ? (
                      <button className="bl-planner-date-btn" onClick={() => setShowDatePicker(true)}>
                        <CalendarCheck size={11} color={BRAND}/>
                        {formatDate(currentDay.date, {weekday:"short",day:"numeric",month:"short"})}
                        <Edit3 size={10} color="#9CA3AF"/>
                      </button>
                    ) : (
                      <button className="bl-planner-date-btn" onClick={() => setShowDatePicker(true)}>
                        <CalendarDays size={11} color="#9CA3AF"/>
                        <span style={{color:"#9CA3AF"}}>Choisir une date</span>
                      </button>
                    )}
                    <select className="bl-city-select" value={currentDay?.city || ""}
                      onChange={e => { const c=e.target.value; setItin(prev=>{const n=[...prev];n[activeDay]={...n[activeDay],city:c,activities:[]};return n;}); }}>
                      {villes.map(c=><option key={c.id} value={c.nom}>{c.nom}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bl-planner-right">
                <div className="bl-day-totals">
                  <div className="bl-day-budget">{dayBudget} <span className="bl-day-budget-unit">TND</span></div>
                  <div className="bl-day-count">{dayActs.length} activité{dayActs.length !== 1 ? "s" : ""}</div>
                </div>
                <div className="bl-day-nav">
                  <button className="bl-nav-btn" disabled={activeDay === 0} onClick={() => setActiveDay(p=>p-1)}><ChevronLeft size={14}/></button>
                  <button className="bl-nav-btn" disabled={activeDay === itin.length-1} onClick={() => setActiveDay(p=>p+1)}><ChevronRight size={14}/></button>
                </div>
              </div>
            </div>
          </div>

          <div className="bl-planner-scroll">
            {dayActs.length === 0 ? (
              <div className="bl-planner-empty">
                <div className="bl-planner-empty-icon"><Plus size={24} color="#D1D5DB"/></div>
                {currentDay?.date ? (
                  <>
                    <p className="bl-planner-empty-title">{formatDate(currentDay.date, {weekday:"long",day:"numeric",month:"long"})}</p>
                    <p className="bl-planner-empty-hint">Ajoutez des excursions depuis le catalogue à gauche</p>
                  </>
                ) : (
                  <>
                    <p className="bl-planner-empty-title">Journée vide</p>
                    <p className="bl-planner-empty-hint">Choisissez une date pour filtrer les excursions disponibles</p>
                    <button className="bl-empty-date-btn" onClick={() => setShowDatePicker(true)}><CalendarDays size={13}/> Choisir une date</button>
                  </>
                )}
              </div>
            ) : (
              SLOTS.map(slot => {
                const acts = slotActs(slot.key);
                const slotBudget = acts.reduce((acc,a)=>acc+a.excursion.price_per_person,0)*numberOfPeople;
                return (
                  <div key={slot.key} className="bl-slot-section">
                    <div className="bl-slot-header">
                      <div className="bl-slot-icon" style={{background:`${slot.color}18`}}>
                        {React.cloneElement(slot.icon as React.ReactElement,{size:12,color:slot.color})}
                      </div>
                      <span className="bl-slot-label" style={{color:slot.color}}>{slot.label}</span>
                      <span className="bl-slot-hint">{slot.hint}</span>
                      {acts.length > 0 && (
                        <span className="bl-slot-total">
                          <PiggyBank size={9} color="#9CA3AF"/> {slotBudget} TND · {acts.reduce((acc,a)=>acc+a.excursion.duration_hours,0)}h
                        </span>
                      )}
                    </div>
                    {acts.length === 0 ? (
                      <div className="bl-slot-empty">Aucune activité prévue</div>
                    ) : (
                      acts.map(act => (
                        <div key={act.id} className="bl-act-card">
                          <div className="bl-act-time">{act.customTime || slot.defaultTime}</div>
                          {act.excursion.photos?.[0] && <img src={act.excursion.photos[0]} alt="" className="bl-act-img"/>}
                          <div className="bl-act-info">
                            <div className="bl-act-title">{act.excursion.title}</div>
                            <div className="bl-act-meta">
                              <span><Clock size={9}/> {act.excursion.duration_hours}h</span>
                              {act.excursion.rating > 0 && <span><Star size={9} color="#F59E0B" fill="#F59E0B"/> {act.excursion.rating}</span>}
                              <span style={{color:"#9CA3AF"}}>{act.excursion.city}</span>
                            </div>
                            {act.note && <div className="bl-act-note"><FileText size={9}/>{act.note}</div>}
                          </div>
                          <span className="bl-act-price">{act.excursion.price_per_person * numberOfPeople}<small> TND</small></span>
                          <div className="bl-act-actions">
                            <button className="bl-act-action-btn bl-act-action-note" onClick={() => { setEditNote(act.id); setNoteText(act.note||""); }}><FileText size={11}/></button>
                            <button className="bl-act-action-btn bl-act-action-del" onClick={() => rmAct(activeDay, act.id)}><Trash2 size={11}/></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Slot Picker Modal ── */}
      {pendingExc && (
        <div className="bl-overlay" onClick={() => setPendingExc(null)}>
          <div className="bl-modal" onClick={e => e.stopPropagation()}>
            <div className="bl-modal-title">Programmer l'excursion</div>
            <p className="bl-modal-sub">{pendingExc.title}</p>
            <div className="bl-modal-meta">
              <span><Clock size={11}/> {pendingExc.duration_hours}h</span>
              <span style={{color:"#D1D5DB"}}>·</span>
              <span><PiggyBank size={11}/> {pendingExc.price_per_person * numberOfPeople} TND ({numberOfPeople} pers.)</span>
            </div>
            {currentDayDate && (
              <div className="bl-modal-date-confirm"><CheckCircle2 size={12} color={BRAND}/> Disponible le {formatDate(currentDayDate)}</div>
            )}
            {SLOTS.map(slot => (
              <div key={slot.key}
                className={`bl-slot-option ${pickSlot === slot.key ? "bl-slot-option-sel" : ""}`}
                style={pickSlot === slot.key ? {borderColor:slot.color} : {}}
                onClick={() => { setPickSlot(slot.key); setPickTime((currentDayDate?getDepartureTimeForDate(pendingExc,currentDayDate):pendingExc.departure_time)?.substring(0,5)||slot.defaultTime); }}>
                <div className="bl-slot-opt-icon" style={{background:`${slot.color}18`}}>
                  {React.cloneElement(slot.icon as React.ReactElement,{size:14,color:slot.color})}
                </div>
                <div style={{flex:1}}>
                  <div className="bl-slot-opt-label" style={{color:slot.color}}>{slot.label}</div>
                  <div className="bl-slot-opt-hint">{slot.hint}</div>
                </div>
                {pickSlot === slot.key && (
                  <input type="time" className="bl-time-input" value={pickTime} onChange={e => setPickTime(e.target.value)} onClick={e => e.stopPropagation()}/>
                )}
              </div>
            ))}
            <div className="bl-modal-actions">
              <button className="bl-cancel-btn" onClick={() => setPendingExc(null)}>Annuler</button>
              <button className="bl-confirm-btn" onClick={confirmAdd}><CheckCircle2 size={13}/> Ajouter à l'itinéraire</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note Modal ── */}
      {editNote && (
        <div className="bl-overlay" onClick={() => setEditNote(null)}>
          <div className="bl-modal" onClick={e => e.stopPropagation()}>
            <div className="bl-modal-title"><FileText size={16} color={BRAND} style={{display:"inline",marginRight:7}}/> Note personnelle</div>
            <textarea autoFocus className="bl-note-textarea" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ajoutez un rappel ou une information utile..." rows={3}/>
            <div className="bl-modal-actions">
              <button className="bl-cancel-btn" onClick={() => setEditNote(null)}>Annuler</button>
              <button className="bl-confirm-btn" onClick={() => saveNote(activeDay, editNote!)}><CheckCircle2 size={13}/> Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Excursion Detail Modal ── */}
      {selectedExcursion && (
        <ExcursionDetailModal excursion={selectedExcursion} onClose={() => setSelectedExcursion(null)}
          onAdd={() => { const exc: Excursion = { id:selectedExcursion.id, title:selectedExcursion.title, city:selectedExcursion.city, price_per_person:selectedExcursion.price_per_person, duration_hours:selectedExcursion.duration_hours, rating:selectedExcursion.rating, reviews_count:selectedExcursion.reviews_count, categories:selectedExcursion.categories, photos:selectedExcursion.photos, departure_time:selectedExcursion.depart_time||undefined, available_dates:selectedExcursion.available_dates }; openSlotPicker(exc); setSelectedExcursion(null); }}/>
      )}

      {loadingDetails && <LoadingSpinner/>}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",flexDirection:"column",gap:"1rem",background:"#F7F9FC"}}>
        <Loader2 size={32} color="#2B96A8" style={{animation:"bl-spin 1s linear infinite"}}/>
        <style>{`@keyframes bl-spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{color:"#9CA3AF",fontSize:13,fontFamily:"'DM Sans',system-ui"}}>Chargement du builder…</span>
      </div>
    }>
      <BuilderInner/>
    </Suspense>
  );
}