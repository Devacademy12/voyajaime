"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  X, Users, MapPin, Clock, Check, Minus, Plus,
  ShieldCheck, RefreshCcw, Lock, Loader2, CheckCircle,
  AlertCircle, ChevronLeft, ChevronRight, MessageSquare,
  Route, Calendar, Coins, Flag, Sunrise, Sun, Moon,
  CalendarDays, Sparkles, CreditCard, Trash2,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface TimeSlot {
  time: string;
  language?: string;
  price: number;
  slots: number;
  groupPrice?: boolean;
  start_time?: string;
  end_time?: string;
}

interface ExcursionForCheckout {
  id: string;
  title: string;
  city: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  available_dates?: any[] | null;
  plan_date?: string;
  plan_time?: "matin" | "aprem" | "soir";
  plan_day?: number;
  note?: string;
}

interface Props {
  excursions: ExcursionForCheckout[];
  itineraireId?: string;
  itineraireTitle?: string;
  onClose?: () => void;
  onPayNow?: (reservationId: string) => void;
}

/* ─── Constants ──────────────────────────────────────────────────────── */

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

const TIME_ICON: Record<string, JSX.Element> = {
  matin: <Sunrise size={10} color="#F59E0B" />,
  aprem: <Sun    size={10} color="#2B96A8" />,
  soir:  <Moon   size={10} color="#8B5CF6" />,
};
const TIME_LABEL: Record<string, string> = {
  matin: "Matin", aprem: "Après-midi", soir: "Soir",
};

const genBookingCode = () =>
  "VJ-" + Date.now().toString(36).toUpperCase() + "-" +
  Math.random().toString(36).substring(2, 5).toUpperCase();

/* ─── Helpers ────────────────────────────────────────────────────────── */

function buildDateMap(exc: ExcursionForCheckout): Map<string, TimeSlot[]> {
  const map = new Map<string, TimeSlot[]>();
  if (!exc.available_dates || !Array.isArray(exc.available_dates)) return map;
  exc.available_dates.forEach((item: any) => {
    const d = item.date;
    if (!d) return;
    if (!map.has(d)) map.set(d, []);
    const depTimes: string[] =
      item.departure_times?.length ? item.departure_times
      : [item.departure_time || item.time || item.start_time || "09:00"];
    depTimes.forEach(t => {
      map.get(d)!.push({
        time:       t.slice(0, 5),
        language:   item.language,
        price:      item.price_per_person || exc.price_per_person,
        slots:      item.slots ?? 0,
        groupPrice: item.group_discount_available || false,
        start_time: item.start_time,
        end_time:   item.end_time,
      });
    });
  });
  return map;
}

/**
 * Vérifie si une excursion a au moins un créneau disponible dans le futur
 */
function excursionHasAvailableSlots(exc: ExcursionForCheckout): boolean {
  if (!exc.available_dates || !Array.isArray(exc.available_dates)) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return exc.available_dates.some(item => {
    if (!item.date) return false;
    const dt = new Date(item.date); dt.setHours(0, 0, 0, 0);
    if (dt < today) return false;
    const slots = item.slots ?? item.available_slots ?? null;
    // null/undefined = pas de limite = disponible
    return slots === null || slots === undefined || Number(slots) > 0;
  });
}

function findBestSlot(slots: TimeSlot[], planTime?: string): TimeSlot | null {
  if (!slots.length) return null;
  const available = slots.filter(s => s.slots > 0);
  if (!available.length) return null;
  if (!planTime) return available[0];
  const timeRanges: Record<string, [number, number]> = {
    matin: [6, 12], aprem: [12, 18], soir: [18, 24],
  };
  const [min, max] = timeRanges[planTime] || [0, 24];
  const matched = available.find(s => {
    const h = parseInt(s.time.split(":")[0], 10);
    return h >= min && h < max;
  });
  return matched || available[0];
}

function formatDateFR(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", opts || {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch { return dateStr; }
}

function getFirstAvailableDate(dateMap: Map<string, TimeSlot[]>): string {
  const sorted = Array.from(dateMap.keys()).sort();
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  return sorted.find(d => {
    const dt = new Date(d); dt.setHours(0, 0, 0, 0);
    return dt >= today && (dateMap.get(d) || []).some(s => s.slots > 0);
  }) || "";
}

function isTimeInPast(date: string, time: string): boolean {
  return new Date(`${date}T${time}:00`) < new Date();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasTimeOverlap(
  date1: string, time1: string, duration1: number,
  date2: string, time2: string, duration2: number,
): boolean {
  if (date1 !== date2) return false;
  const s1 = timeToMinutes(time1), e1 = s1 + duration1 * 60;
  const s2 = timeToMinutes(time2), e2 = s2 + duration2 * 60;
  return s1 < e2 && s2 < e1;
}

/* ─── CSS RESPONSIVE ─────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  * { box-sizing: border-box; }

  /* ═══ RESPONSIVE OVERLAY & SHELL ═══ */
  .cmi-overlay {
    position:fixed;inset:0;z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:8px;
    background:rgba(5,15,30,0.72);backdrop-filter:blur(10px);
    animation:cmiFade .22s ease;
  }
  
  .cmi-shell {
    font-family:'DM Sans',sans-serif;background:#F8F9FB;
    width:100%;max-width:960px;
    box-shadow:0 40px 100px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.06);
    overflow:hidden;display:flex;max-height:94vh;
    animation:cmiUp .32s cubic-bezier(.34,1.4,.64,1);
    border-radius:28px;
  }

  /* ═══ DESKTOP LAYOUT (960px+) ═══ */
  .cmi-left {
    width:360px;flex-shrink:0;
    background:linear-gradient(168deg,#071E3D 0%,#0B3D63 45%,#0A6080 100%);
    display:flex;flex-direction:column;position:relative;overflow:hidden;
  }
  
  .cmi-left-inner {
    flex:1;overflow-y:auto;padding:28px 26px;
    display:flex;flex-direction:column;gap:20px;
  }
  
  .cmi-left-inner::-webkit-scrollbar{width:3px}
  .cmi-left-inner::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
  
  .cmi-left::before{
    content:'';position:absolute;top:-80px;right:-80px;
    width:240px;height:240px;border-radius:50%;
    background:radial-gradient(circle,rgba(43,150,168,.25) 0%,transparent 70%);
    pointer-events:none;
  }
  
  .cmi-left::after{
    content:'';position:absolute;bottom:-60px;left:-50px;
    width:200px;height:200px;border-radius:50%;
    background:radial-gradient(circle,rgba(11,126,163,.18) 0%,transparent 70%);
    pointer-events:none;
  }

  .cmi-right{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#FAFBFC;min-width:0;}
  
  .cmi-right-scroll{
    flex:1;overflow-y:auto;padding:26px;
    scrollbar-width:thin;scrollbar-color:#E5E7EB transparent;
  }
  
  .cmi-right-scroll::-webkit-scrollbar{width:4px}
  .cmi-right-scroll::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}
  
  .cmi-right-footer{padding:18px 26px 22px;border-top:1px solid #EAECEF;background:#FAFBFC;}

  /* ═══ HEADER (titre + bouton fermer) ═══ */
  .cmi-header{
    display:flex;justify-content:space-between;align-items:flex-start;
    gap:12px;margin-bottom:20px;
  }
  .cmi-header-meta{
    display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  }
  .cmi-close-btn{
    width:32px;height:32px;border-radius:50%;border:none;background:#F3F4F6;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    color:#9CA3AF;flex-shrink:0;
  }

  /* ═══ TABS & ACCORDION ═══ */
  .exc-tab{
    border-radius:12px;padding:10px 13px;cursor:pointer;
    display:flex;align-items:center;gap:9px;border:1px solid transparent;transition:all .16s;
    font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
    color:rgba(255,255,255,.65);background:rgba(255,255,255,.05);text-align:left;width:100%;
  }
  
  .exc-tab.active{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.28);color:white;box-shadow:0 4px 16px rgba(0,0,0,.18);}
  .exc-tab:hover:not(.active){background:rgba(255,255,255,.09);color:rgba(255,255,255,.85);}
  .exc-tab.unavailable{opacity:.45;cursor:not-allowed;}
  
  .exc-tab-num{
    width:22px;height:22px;border-radius:50%;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-size:10px;font-weight:800;
    background:rgba(255,255,255,.12);color:rgba(255,255,255,.7);transition:all .16s;
  }
  
  .exc-tab.active .exc-tab-num{background:#2B96A8;color:white;}
  .exc-tab.done .exc-tab-num{background:#059669;color:white;}
  .exc-tab.unavailable .exc-tab-num{background:rgba(239,68,68,.4);color:white;}

  /* ═══ CALENDAR ═══ */
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
  
  .cal-day{
    aspect-ratio:1;border-radius:9px;border:none;
    font-size:12px;font-weight:600;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all .14s;
    display:flex;align-items:center;justify-content:center;
    flex-direction:column;gap:1px;position:relative;
    min-height:32px;
  }
  
  .cal-day.empty{background:transparent;cursor:default;pointer-events:none;}
  .cal-day.past{background:rgba(255,255,255,.03);color:rgba(255,255,255,.2);cursor:not-allowed;text-decoration:line-through;}
  .cal-day.unavailable{background:rgba(255,255,255,.04);color:rgba(255,255,255,.2);cursor:not-allowed;}
  .cal-day.unavailable::before{
    content:'';position:absolute;left:15%;right:15%;top:50%;
    height:1.5px;background:rgba(255,255,255,.18);transform:rotate(-12deg);
  }
  .cal-day.available{background:rgba(255,255,255,.08);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.12);}
  .cal-day.available:hover{background:rgba(43,150,168,.3);border-color:#2B96A8;color:white;transform:translateY(-1px);}
  .cal-day.selected{background:#2B96A8 !important;color:white !important;border-color:#2B96A8 !important;box-shadow:0 4px 14px rgba(43,150,168,.45);transform:translateY(-1px);}
  .cal-day.today::after{content:'';position:absolute;bottom:2px;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.6);}
  .cal-dot{width:4px;height:4px;border-radius:50%;background:#34D399;flex-shrink:0;}

  /* ═══ SLOTS ═══ */
  .slot-pill{
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 15px;border-radius:14px;border:1.5px solid #E5E7EB;background:white;
    cursor:pointer;transition:all .15s;margin-bottom:8px;position:relative;
    min-height:52px;gap:10px;
  }
  
  .slot-pill.sel{background:#EFF9FB;border-color:#2B96A8;}
  .slot-pill.full{opacity:.5;cursor:not-allowed;border-color:#FEE2E2;}
  .slot-pill:not(.full):not(.sel):hover{border-color:#2B96A8;background:#F8FDFE;}

  /* ═══ CONTROLS ═══ */
  .cmi-counter-btn{
    width:36px;height:36px;border:none;border-radius:10px;background:#F3F4F6;cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:all .14s;
    min-width:36px;
  }
  
  .cmi-counter-btn:hover:not(:disabled){background:#E5E7EB;}
  .cmi-counter-btn:disabled{opacity:.3;cursor:not-allowed;}

  /* ═══ BUTTONS ═══ */
  .cmi-cta{
    width:100%;padding:15px;border:none;border-radius:14px;
    font-size:15px;font-weight:800;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all .2s;
    display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.3px;
    min-height:48px;text-align:center;
  }
  
  .cmi-cta.on{background:linear-gradient(135deg,#2B96A8,#1a7a8f);color:white;box-shadow:0 4px 18px rgba(43,150,168,.3);}
  .cmi-cta.on:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(43,150,168,.4);}
  .cmi-cta.off{background:#EAECEF;color:#9CA3AF;cursor:not-allowed;}
  .cmi-cta.loading{background:#7CC4D1;color:white;cursor:not-allowed;}
  .cmi-cta.green{background:linear-gradient(135deg,#059669,#047857);color:white;box-shadow:0 4px 18px rgba(5,150,105,.3);}
  .cmi-cta.green:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(5,150,105,.4);}

  /* ═══ PROGRESS & BADGES ═══ */
  .prog-step{height:3px;border-radius:3px;flex:1;transition:background .3s;}

  .sugg-badge{
    display:inline-flex;align-items:center;gap:5px;
    background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.3);
    border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;color:#059669;
  }
  
  .date-chip{
    display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap;
    background:rgba(43,150,168,.12);border:1px solid rgba(43,150,168,.25);
    border-radius:10px;padding:5px 10px;font-size:11px;font-weight:600;color:#0E5068;
    cursor:pointer;transition:all .15s;
  }
  
  .date-chip:hover{background:rgba(43,150,168,.2);border-color:#2B96A8;}

  .no-slot-banner {
    display:flex;align-items:center;gap:10px;
    padding:12px 14px;
    background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);
    border-radius:12px;margin-bottom:12px;
    font-size:12px;font-weight:600;color:#DC2626;
  }

  /* ═══ FORM ELEMENTS ═══ */
  .cmi-textarea{
    width:100%;padding:10px 13px;min-height:60px;
    border:1.5px solid #E5E7EB;border-radius:12px;
    font-size:13px;font-family:'DM Sans',sans-serif;
    color:#374151;resize:none;outline:none;
    background:#F9FAFB;box-sizing:border-box;transition:border .15s;
  }
  
  .cmi-textarea:focus{border-color:#2B96A8;background:white;}

  /* ═══ FOOTER GUARANTEES ═══ */
  .cmi-guarantees{
    display:flex;justify-content:center;gap:20px;margin-top:12px;flex-wrap:wrap;
  }
  .cmi-guarantee-item{
    font-size:11px;color:#9CA3AF;display:flex;align-items:center;gap:4px;
    white-space:nowrap;
  }

  /* ═══ NAV BUTTONS (Précédent/Suivant) ═══ */
  .cmi-navbtn{
    flex:1;padding:10px 14px;border-radius:12px;cursor:pointer;
    font-size:12px;font-weight:700;display:flex;align-items:center;
    justify-content:center;gap:5px;font-family:'DM Sans',sans-serif;
    min-height:40px;
  }

  /* ═══ ANIMATIONS ═══ */
  @keyframes cmiFade{from{opacity:0}to{opacity:1}}
  @keyframes cmiUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cmiSpin{to{transform:rotate(360deg)}}
  @keyframes pulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(5,150,105,.3)}50%{box-shadow:0 0 0 8px rgba(5,150,105,0)}}

  /* ═══ TABLET (768px - 959px) ═══ */
  @media(max-width:959px){
    .cmi-shell{
      flex-direction:column;
      border-radius:24px;
      max-height:92vh;
    }
    
    .cmi-left{
      width:100%;
      max-height:45%;
      border-radius:24px 24px 0 0;
      flex-shrink:0;
    }
    
    .cmi-left-inner{
      padding:20px 22px;
      gap:16px;
    }
    
    .cmi-right{
      max-height:55%;
      border-radius:0 0 24px 24px;
    }
    
    .cmi-right-scroll{
      padding:20px 22px;
    }
    
    .cmi-right-footer{
      padding:14px 22px 18px;
    }
  }

  /* ═══ MOBILE LANDSCAPE / SMALL TABLET (640px - 767px) ═══ */
  @media(max-width:767px){
    .cmi-overlay{
      padding:0;
      align-items:stretch;
    }
    
    .cmi-shell{
      flex-direction:column;
      border-radius:0;
      max-height:100vh;
      height:100vh;
      width:100vw;
    }
    
    .cmi-left{
      width:100%;
      max-height:none;
      flex:0 0 auto;
      border-radius:0;
      overflow-y:auto;
    }
    
    .cmi-left-inner{
      padding:18px 18px;
      gap:14px;
    }
    
    .cmi-right{
      flex:1;
      min-height:0;
      border-radius:0;
    }
    
    .cmi-right-scroll{
      padding:18px 18px;
    }
    
    .cmi-right-footer{
      padding:12px 18px 16px;
    }
    
    .exc-tab{
      padding:9px 11px;
      font-size:11px;
      gap:7px;
    }
    
    .exc-tab-num{
      width:20px;height:20px;
      font-size:9px;
    }
    
    .cmi-cta{
      padding:13px;
      font-size:14px;
      min-height:44px;
      gap:6px;
    }
    
    .cal-day{
      min-height:30px;
      font-size:11px;
    }

    /* Liste des excursions: scroll limité pour ne pas pousser tout */
    .cmi-exc-list{
      max-height:160px !important;
    }
  }

  /* ═══ MOBILE PORTRAIT (480px - 639px) ═══ */
  @media(max-width:639px){
    .cmi-header{
      margin-bottom:14px;
    }
    .cmi-header h3{
      font-size:17px !important;
    }
    .cmi-header-meta{
      gap:6px;
    }
    .cmi-header-meta > span{
      font-size:11px !important;
    }

    .exc-tab{
      padding:8px 10px;
      font-size:10px;
      gap:6px;
    }
    
    .exc-tab-num{
      width:18px;height:18px;
      font-size:8px;
    }

    .cmi-exc-list{
      max-height:130px !important;
    }
    
    .cmi-cta{
      padding:12px;
      font-size:13px;
      min-height:44px;
      gap:5px;
    }
    
    .cmi-cta.on{
      font-size:12px;
    }
    
    .cal-day{
      min-height:28px;
      font-size:10px;
    }
    
    .slot-pill{
      padding:10px 12px;
      font-size:13px;
      min-height:48px;
    }
    
    .sugg-badge{
      font-size:10px;
      padding:3px 8px;
    }
    
    .date-chip{
      font-size:10px;
      padding:4px 8px;
    }

    /* Garanties: empiler en colonne et centrer */
    .cmi-guarantees{
      flex-direction:column;
      align-items:center;
      gap:6px;
    }

    /* Boutons Précédent/Suivant: texte court */
    .cmi-navbtn-label-full{ display:none; }
    .cmi-navbtn-label-short{ display:inline; }
  }

  @media(min-width:640px){
    .cmi-navbtn-label-short{ display:none; }
  }

  /* ═══ SMALL MOBILE (320px - 479px) ═══ */
  @media(max-width:479px){
    .cmi-left-inner{
      padding:14px 14px;
      gap:10px;
    }
    
    .cmi-left::before,
    .cmi-left::after{
      opacity:0.5;
    }
    
    .cmi-right-scroll{
      padding:14px 14px;
      gap:10px;
    }
    
    .cmi-right-footer{
      padding:10px 14px 14px;
    }
    
    .cmi-header h3{
      font-size:15px !important;
    }
    
    .exc-tab{
      padding:7px 9px;
      font-size:9px;
      gap:5px;
    }
    
    .exc-tab-num{
      width:16px;height:16px;
      font-size:7px;
    }

    .cmi-exc-list{
      max-height:110px !important;
    }
    
    .cmi-cta{
      padding:10px;
      font-size:12px;
      min-height:42px;
      gap:4px;
    }
    
    .cmi-cta.on,
    .cmi-cta.green{
      font-size:11px;
    }
    
    .cal-grid{
      gap:2px;
    }
    
    .cal-day{
      min-height:26px;
      font-size:9px;
    }
    
    .slot-pill{
      padding:9px 10px;
      min-height:46px;
      gap:8px;
    }
    
    .cmi-counter-btn{
      width:32px;height:32px;
      min-width:32px;
    }
    
    .cmi-textarea{
      min-height:50px;
      padding:8px 10px;
      font-size:12px;
    }
  }
`;

/* ─── MiniCalendar ───────────────────────────────────────────────────── */

function MiniCalendar({
  dateMap, selectedDate, onSelect, suggestedDate,
}: {
  dateMap: Map<string, TimeSlot[]>;
  selectedDate: string;
  onSelect: (d: string) => void;
  suggestedDate?: string;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const initDate = suggestedDate ? new Date(suggestedDate)
    : (() => { const f = Array.from(dateMap.keys()).sort()[0]; return f ? new Date(f) : today; })();
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button
          onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
          style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <button
          onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
          style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="cal-grid" style={{ marginBottom: 4 }}>
        {DAYS_FR.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.35)", padding: "3px 0" }}>{d}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="cal-day empty" />;
          const dateStr  = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast   = cellDate < today;
          const slots    = dateMap.get(dateStr);
          const hasSlots = slots ? slots.some(s => s.slots > 0) : false;
          const isInMap  = dateMap.has(dateStr);
          const isSel    = dateStr === selectedDate;
          const isSugg   = dateStr === suggestedDate && !isSel;
          const isToday  = cellDate.getTime() === today.getTime();

          let cls = "cal-day ";
          if (isPast) cls += "past";
          else if (!isInMap || !hasSlots) cls += "unavailable";
          else if (isSel) cls += "selected";
          else cls += "available";
          if (isToday && !isPast) cls += " today";

          return (
            <button key={i} className={cls}
              style={isSugg ? { outline: "2px solid rgba(52,211,153,.5)", outlineOffset: "1px" } : undefined}
              onClick={() => !isPast && isInMap && hasSlots && onSelect(dateStr)}
            >
              {day}
              {isInMap && hasSlots && !isSel && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
        {[
          { color: "#34D399", label: "Disponible" },
          { color: "rgba(255,255,255,.2)", label: "Indisponible", cross: true },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,.5)" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, position: "relative" }}>
              {l.cross && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "110%", height: 1.5, background: "rgba(255,255,255,.4)", transform: "rotate(-12deg)" }} />
                </div>
              )}
            </div>
            {l.label}
          </div>
        ))}
        {suggestedDate && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(52,211,153,.8)" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "transparent", border: "2px solid rgba(52,211,153,.6)" }} />
            Date suggérée
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SlotList ───────────────────────────────────────────────────────── */

function SlotList({ slots, selected, onSelect }: {
  slots: TimeSlot[]; selected: TimeSlot | null; onSelect: (s: TimeSlot) => void;
}) {
  return (
    <div>
      {slots.map((slot, i) => {
        const avail = slot.slots > 0;
        const isSel = selected === slot;
        const low   = avail && slot.slots <= 3;
        return (
          <div key={i} className={`slot-pill ${isSel ? "sel" : ""} ${!avail ? "full" : ""}`}
            onClick={() => avail && onSelect(slot)}>
            {!avail && <span style={{ position: "absolute", top: -8, right: 10, background: "#EF4444", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Complet</span>}
            {low && avail && <span style={{ position: "absolute", top: -8, right: 10, background: "#F59E0B", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Dernières places !</span>}
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: avail ? "#111827" : "#9CA3AF" }}>{slot.time}</span>
              {slot.language && <span style={{ marginLeft: 8, fontSize: 11, background: "#F3F4F6", color: "#6B7280", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>{slot.language}</span>}
              {slot.groupPrice && (
                <div style={{ fontSize: 11, color: "#10B981", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                  <Users size={9} /> Tarif groupe
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {avail ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#2B96A8" }}>{slot.price} EUR <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>/pers.</span></div>
                  <div style={{ fontSize: 11, color: low ? "#F59E0B" : "#9CA3AF", fontWeight: low ? 700 : 400 }}>{slot.slots} place{slot.slots > 1 ? "s" : ""}</div>
                </>
              ) : <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>Complet</span>}
            </div>
            {avail && (
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSel ? "#2B96A8" : "#D1D5DB"}`, background: isSel ? "#2B96A8" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isSel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component (unchanged logic) ─────────────────────────────────────── */

export default function CheckoutModalItineraire({
  excursions: rawExcursions, itineraireId: propItinId, itineraireTitle, onClose, onPayNow,
}: Props) {
  const supabase = createClient();
  const router   = useRouter();

  const { available: excursions, unavailable: unavailableExcursions } = (() => {
    const available:   ExcursionForCheckout[] = [];
    const unavailable: ExcursionForCheckout[] = [];
    rawExcursions.forEach(e => {
      if (excursionHasAvailableSlots(e)) available.push(e);
      else unavailable.push(e);
    });
    return { available, unavailable };
  })();

  const [showNoSlotWarning, setShowNoSlotWarning] = useState(unavailableExcursions.length > 0);
  const [confirmedContinue, setConfirmedContinue] = useState(unavailableExcursions.length === 0);

  const [perExc, setPerExc] = useState(() =>
    excursions.map(e => {
      const dateMap = buildDateMap(e);
      let preDate   = "";
      let preSlot: TimeSlot | null = null;

      if (e.plan_date) {
        const slotsOnPlanDate = dateMap.get(e.plan_date);
        if (slotsOnPlanDate?.some(s => s.slots > 0)) {
          preDate = e.plan_date;
          preSlot = findBestSlot(slotsOnPlanDate, e.plan_time);
        }
      }
      if (!preDate) {
        preDate = getFirstAvailableDate(dateMap);
        if (preDate) preSlot = findBestSlot(dateMap.get(preDate) || [], e.plan_time);
      }
      return {
        exc:          e,
        dateMap,
        selectedDate: preDate,
        selectedSlot: preSlot,
        people:       1,
        specialNeeds: "",
        hasSuggestion: !!e.plan_date && !!dateMap.get(e.plan_date)?.some(s => s.slots > 0),
        suggestedDate: e.plan_date || "",
      };
    })
  );

  const [activeIdx,           setActiveIdx]           = useState(0);
  const [status,              setStatus]              = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg,            setErrorMsg]            = useState("");
  const [bookingCodes,        setBookingCodes]        = useState<string[]>([]);
  const [savedItinId,         setSavedItinId]         = useState<string | null>(null);
  const [savedReservationIds, setSavedReservationIds] = useState<string[]>([]);

  const patch = useCallback((idx: number, p: Partial<typeof perExc[0]>) =>
    setPerExc(prev => prev.map((x, i) => i === idx ? { ...x, ...p } : x)), []);

  const cur          = perExc[activeIdx] ?? perExc[0];
  const slotsForDate = cur?.selectedDate ? (cur.dateMap.get(cur.selectedDate) || []) : [];
  const maxPeople    = cur?.selectedSlot?.slots || cur?.exc?.max_people || 20;
  const curPrice     = cur?.selectedSlot?.price || cur?.exc?.price_per_person || 0;
  const curTotal     = curPrice * (cur?.people || 1);

  const configuredCount = perExc.filter(p => !!p.selectedSlot).length;
  const subtotal        = perExc.reduce((s, p) => s + (p.selectedSlot?.price || 0) * p.people, 0);
  const platFee         = Math.round(subtotal * .1);
  const grandTotal      = subtotal + platFee;
  const isLoading       = status === "loading";
  const canSubmit       = perExc.some(p => !!p.selectedSlot) && !isLoading && confirmedContinue;

  const handleGoToPay = (reservationIds: string[]) => {
    if (!reservationIds.length) return;
    if (onPayNow) {
      onClose?.();
      onPayNow(reservationIds[0]);
    } else {
      onClose?.();
      router.push(`/touriste/reservations?pay=${reservationIds[0]}`);
    }
  };

  const handleReserve = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { setErrorMsg("Vous devez être connecté."); setStatus("error"); return; }

      let itineraireId: string | null = propItinId ?? null;

      if (!itineraireId) {
        const villes    = [...new Set(perExc.map(p => p.exc.city))];
        const planItems = perExc.filter(p => p.selectedSlot).map((p, idx) => ({
          jour: idx + 1, excursion_id: p.exc.id, titre: p.exc.title, ville: p.exc.city,
          date: p.selectedDate, heure: p.selectedSlot!.time, personnes: p.people,
          prix_total: (p.selectedSlot!.price * p.people) + Math.round(p.selectedSlot!.price * p.people * .1),
        }));
        const { data: newItin, error: itinErr } = await supabase
          .from("itineraires")
          .insert([{ user_id: user.id, nb_jours: planItems.length, villes_selectionnees: villes, categories_selectionnees: [], plan: planItems }])
          .select("id").single();
        if (itinErr || !newItin) { setErrorMsg(`Erreur itinéraire : ${itinErr?.message ?? "inconnue"}`); setStatus("error"); return; }
        itineraireId = newItin.id;
        setSavedItinId(newItin.id);
      } else {
        setSavedItinId(itineraireId);
      }

      const codes: string[]  = [];
      const resaIds: string[] = [];

      for (const p of perExc) {
        if (!p.selectedSlot) continue;

        if (isTimeInPast(p.selectedDate, p.selectedSlot.time)) {
          setErrorMsg(`❌ Date/heure déjà passée (${p.selectedDate} à ${p.selectedSlot.time}).`);
          setStatus("error"); return;
        }

        const { data: existing, error: checkErr } = await supabase
          .from("reservations").select("id")
          .eq("touriste_id", user.id).eq("excursion_id", p.exc.id).eq("date", p.selectedDate)
          .not("status", "eq", "cancelled").maybeSingle();
        if (checkErr) { setErrorMsg(`Erreur : ${checkErr.message}`); setStatus("error"); return; }
        if (existing) { setErrorMsg(`Réservation existante pour "${p.exc.title}".`); setStatus("error"); return; }

        const { data: conflicting, error: conflictErr } = await supabase
          .from("reservations")
          .select("id,excursion_id,date,time,excursions(duration_hours)")
          .eq("touriste_id", user.id).eq("date", p.selectedDate).not("status", "eq", "cancelled");
        if (conflictErr) { setErrorMsg(`Erreur horaire : ${conflictErr.message}`); setStatus("error"); return; }

        const duration = p.exc.duration_hours || 1;
        for (const c of conflicting || []) {
          const otherExc      = Array.isArray(c.excursions) ? c.excursions[0] : c.excursions;
          const otherDuration = otherExc?.duration_hours || 1;
          if (hasTimeOverlap(p.selectedDate, p.selectedSlot.time, duration, c.date, c.time, otherDuration)) {
            setErrorMsg("⚠️ Chevauchement horaire avec une autre réservation.");
            setStatus("error"); return;
          }
        }

        const code  = genBookingCode();
        const tot   = p.selectedSlot.price * p.people;
        const fee   = Math.round(tot * .1);
        const { data: inserted, error: insErr } = await supabase
          .from("reservations")
          .insert([{
            touriste_id:    user.id,
            excursion_id:   p.exc.id,
            itineraire_id:  itineraireId,
            date:           p.selectedDate,
            time:           p.selectedSlot.time,
            people_count:   p.people,
            total_price:    tot + fee,
            platform_fee:   fee,
            status:         "pending",
            special_needs:  p.specialNeeds.trim() || null,
            booking_code:   code,
            payment_status: "unpaid",
            payment_method: null,
            special_notes:  null,
          }])
          .select("id")
          .single();

        if (insErr || !inserted?.id) {
          setErrorMsg(`Erreur insertion réservation : ${insErr?.message ?? "ID non retourné — vérifiez les policies RLS de la table reservations"}`);
          setStatus("error"); return;
        }

        const { error: itinResErr } = await supabase.from("reservation_itineraires").insert([{
          itineraire_id:  itineraireId,
          reservation_id: inserted.id,
          excursion_id:   p.exc.id,
          day_number:     p.exc.plan_day ?? 1,
          plan_time:      p.exc.plan_time ?? null,
          plan_date:      p.exc.plan_date ?? null,
          payment_status: "unpaid",
          user_id:        user.id,
          status:         "pending",
          total_price:    tot + fee,
          platform_fee:   fee,
        }]);
        if (itinResErr) {
          console.error("Erreur reservation_itineraires:", itinResErr.message);
        }

        await supabase.rpc("decrement_slot", { exc_id: p.exc.id, date_str: p.selectedDate, qty: p.people });
        codes.push(code);
        resaIds.push(inserted.id);
      }

      setBookingCodes(codes);
      setSavedReservationIds(resaIds);
      setStatus("success");

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
      setStatus("error");
    }
  };

  /* ══ ÉCRAN D'AVERTISSEMENT ════════════════ */

  if (showNoSlotWarning && !confirmedContinue) {
    const allUnavailable = excursions.length === 0;
    return (
      <>
        <style>{CSS}</style>
        <div className="cmi-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
          <div className="cmi-shell" style={{ maxWidth: 560, display: "block", padding: "40px 36px", background: "white", borderRadius: "20px", overflowY: "auto" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                Vérification des disponibilités
              </h2>
              <button onClick={() => onClose?.()} className="cmi-close-btn">
                <X size={15} color="#9CA3AF" />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={14} /> {unavailableExcursions.length} excursion{unavailableExcursions.length > 1 ? "s" : ""} sans créneau disponible
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {unavailableExcursions.map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12 }}>
                    <Trash2 size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sanitizeText(e.title)}
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={9} />{e.city}
                        {e.plan_day && <><span>·</span>Jour {e.plan_day}</>}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, background: "#FEE2E2", color: "#DC2626", padding: "3px 8px", borderRadius: 10, flexShrink: 0 }}>
                      Aucun créneau
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {excursions.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> {excursions.length} excursion{excursions.length > 1 ? "s" : ""} disponible{excursions.length > 1 ? "s" : ""}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {excursions.map(e => (
                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12 }}>
                      <Check size={14} color="#059669" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sanitizeText(e.title)}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={9} />{e.city}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 14px", marginBottom: 22 }}>
              <p style={{ fontSize: 12, color: "#92400E", margin: 0 }}>
                {allUnavailable
                  ? "⚠️ Aucune excursion de votre itinéraire n'est disponible actuellement. Contactez les prestataires ou modifiez votre itinéraire."
                  : `⚠️ Les ${unavailableExcursions.length} excursion${unavailableExcursions.length > 1 ? "s" : ""} sans créneau seront retirée${unavailableExcursions.length > 1 ? "s" : ""} du paiement. Vous pourrez les réserver ultérieurement.`
                }
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!allUnavailable && (
                <button
                  className="cmi-cta on"
                  onClick={() => { setShowNoSlotWarning(false); setConfirmedContinue(true); }}
                >
                  <Route size={15} />
                  Continuer avec {excursions.length} excursion{excursions.length > 1 ? "s" : ""}
                </button>
              )}
              <button
                className="cmi-cta"
                style={{ background: "#F3F4F6", color: "#374151", fontSize: 13 }}
                onClick={() => onClose?.()}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ══ SUCCESS SCREEN ══════════════════════════════════════════════════ */

  if (status === "success") {
    const confirmed = perExc.filter(p => p.selectedSlot);
    return (
      <>
        <style>{CSS}</style>
        <div className="cmi-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
          <div className="cmi-shell" style={{ maxWidth: 520, display: "block", padding: "44px 40px", textAlign: "center", background: "white", borderRadius: "20px", overflowY: "auto" }}>

            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 22px",
              boxShadow: "0 8px 28px rgba(5,150,105,.25)",
              animation: "pulseGreen 2s ease-in-out infinite",
            }}>
              <CheckCircle size={40} color="#059669" />
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Itinéraire réservé !
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>
              {confirmed.length} excursion{confirmed.length > 1 ? "s" : ""} confirmée{confirmed.length > 1 ? "s" : ""}
            </p>

            {savedItinId && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#EFF9FB,#D0F0F5)", border: "1px solid rgba(43,150,168,.3)", borderRadius: 10, padding: "8px 14px", marginBottom: 22, fontSize: 12 }}>
                <Route size={13} color="#2B96A8" />
                <span style={{ fontWeight: 700, color: "#2B96A8" }}>Itinéraire</span>
                <span style={{ color: "#6B7280", fontFamily: "monospace", fontSize: 11 }}>#{savedItinId.slice(0, 8).toUpperCase()}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {confirmed.map((p, i) => (
                <div key={i} style={{ background: "linear-gradient(135deg,#EFF9FB,#E0F5FA)", border: "1px solid rgba(43,150,168,.2)", borderRadius: 14, padding: "13px 16px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{sanitizeText(p.exc.title)}</p>
                      <p style={{ margin: "0 0 5px", fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <MapPin size={10} color="#9CA3AF" />{p.exc.city}
                        {p.exc.plan_time && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            {TIME_ICON[p.exc.plan_time]}{TIME_LABEL[p.exc.plan_time]}
                          </span>
                        )}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 5, fontWeight: 600, flexWrap: "wrap" }}>
                        <Calendar size={10} color="#2B96A8" />
                        {formatDateFR(p.selectedDate, { day: "numeric", month: "long", year: "numeric" })} · {p.selectedSlot!.time} · {p.people} pers.
                      </p>
                    </div>
                    <span style={{ background: "#2B96A8", color: "white", borderRadius: 8, padding: "4px 8px", fontSize: 10, fontWeight: 800, flexShrink: 0, fontFamily: "monospace" }}>
                      #{bookingCodes[i]?.split("-").slice(-1)[0]}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(43,150,168,.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>{bookingCodes[i]}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#2B96A8" }}>
                      {(p.selectedSlot!.price * p.people) + Math.round(p.selectedSlot!.price * p.people * .1)} EUR
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "#92400E", fontWeight: 600, margin: 0 }}>
                💳 Finalisez le paiement pour confirmer vos places.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {savedReservationIds.length > 0 && (
                <button
                  className="cmi-cta green"
                  onClick={() => handleGoToPay(savedReservationIds)}
                >
                  <CreditCard size={15} /> Payer maintenant
                </button>
              )}
              <button
                className="cmi-cta"
                style={{ background: "#F3F4F6", color: "#374151", fontSize: 13 }}
                onClick={() => onClose?.()}
              >
                Payer plus tard dans Mes réservations
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (excursions.length === 0) {
    return (
      <>
        <style>{CSS}</style>
        <div className="cmi-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
          <div className="cmi-shell" style={{ maxWidth: 480, display: "block", padding: "44px 36px", textAlign: "center", background: "white", borderRadius: "20px", overflowY: "auto" }}>
            <AlertCircle size={52} color="#EF4444" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Aucune excursion disponible
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
              Toutes les excursions de cet itinéraire n'ont pas de créneaux disponibles pour le moment.
            </p>
            <button className="cmi-cta on" onClick={() => onClose?.()}>
              Fermer
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ══ MAIN MODAL ══════════════════════════════════════════════════════ */

  if (!cur) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="cmi-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
        <div className="cmi-shell">

          {/* ══ LEFT PANEL ══ */}
          <div className="cmi-left">
            <div className="cmi-left-inner">

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(43,150,168,.2)", border: "1px solid rgba(43,150,168,.35)", borderRadius: 20, padding: "4px 10px", marginBottom: 10 }}>
                  <Route size={10} color="#7CC4D1" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7CC4D1", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Itinéraire · {excursions.length} excursion{excursions.length > 1 ? "s" : ""}
                  </span>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "white", margin: "0 0 6px", lineHeight: 1.3 }}>
                  {itineraireTitle || "Voyage en Tunisie"}
                </h2>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", margin: 0 }}>
                  {configuredCount}/{excursions.length} créneau{configuredCount > 1 ? "x" : ""} configuré{configuredCount > 1 ? "s" : ""}
                </p>
                {unavailableExcursions.length > 0 && (
                  <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10 }}>
                    <p style={{ fontSize: 10, color: "#FCA5A5", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertCircle size={10} />
                      {unavailableExcursions.length} excursion{unavailableExcursions.length > 1 ? "s" : ""} retirée{unavailableExcursions.length > 1 ? "s" : ""} (pas de créneau)
                    </p>
                  </div>
                )}
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                  {excursions.map((_, i) => (
                    <div key={i} className="prog-step"
                      style={{ background: perExc[i].selectedSlot ? "#34D399" : i === activeIdx ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.12)" }}
                    />
                  ))}
                </div>
              </div>

              <div className="cmi-exc-list" style={{ display: "flex", flexDirection: "column", gap: 5, position: "relative", zIndex: 1, overflowY: "auto", maxHeight: 220 }}>
                {excursions.map((e, i) => {
                  const p = perExc[i];
                  return (
                    <button key={e.id} className={`exc-tab ${i === activeIdx ? "active" : ""} ${p.selectedSlot ? "done" : ""}`}
                      onClick={() => setActiveIdx(i)}>
                      <span className={`exc-tab-num ${p.selectedSlot ? "done" : ""}`}>
                        {p.selectedSlot ? <Check size={10} color="white" /> : i + 1}
                      </span>
                      <div style={{ flex: 1, overflow: "hidden", textAlign: "left" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sanitizeText(e.title)}</div>
                        <div style={{ fontSize: 10, opacity: .6, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={8} />{e.city}
                          {e.plan_day && <><span>·</span><CalendarDays size={8} />Jour {e.plan_day}</>}
                          {e.plan_time && <><span>·</span>{TIME_ICON[e.plan_time]}{TIME_LABEL[e.plan_time]}</>}
                        </div>
                      </div>
                      {p.selectedSlot && (
                        <span style={{ fontSize: 10, color: "rgba(52,211,153,.8)", fontWeight: 700, flexShrink: 0 }}>
                          {p.selectedSlot.time}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px" }}>
                  Choisissez une date
                </p>

                {cur.hasSuggestion && cur.suggestedDate && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="sugg-badge" style={{ marginBottom: 6 }}>
                      <Sparkles size={9} /> Date suggérée par votre plan
                    </div>
                    <button className="date-chip"
                      onClick={() => {
                        const slots    = cur.dateMap.get(cur.suggestedDate) || [];
                        const bestSlot = findBestSlot(slots, cur.exc.plan_time);
                        patch(activeIdx, { selectedDate: cur.suggestedDate, selectedSlot: bestSlot });
                      }}>
                      <Calendar size={10} />
                      {formatDateFR(cur.suggestedDate, { weekday: "short", day: "numeric", month: "short" })}
                      {cur.exc.plan_time && <><span>·</span>{TIME_LABEL[cur.exc.plan_time]}</>}
                      <span style={{ fontSize: 10, color: "#2B96A8", fontWeight: 800 }}>→ Sélectionner</span>
                    </button>
                  </div>
                )}

                <MiniCalendar
                  dateMap={cur.dateMap}
                  selectedDate={cur.selectedDate}
                  suggestedDate={cur.hasSuggestion ? cur.suggestedDate : undefined}
                  onSelect={d => patch(activeIdx, { selectedDate: d, selectedSlot: null })}
                />
              </div>

              {subtotal > 0 && (
                <div style={{ marginTop: "auto", background: "rgba(255,255,255,.08)", borderRadius: 14, padding: "14px 16px", position: "relative", zIndex: 1, border: "1px solid rgba(255,255,255,.1)" }}>
                  {perExc.filter(p => p.selectedSlot).map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.65)", marginBottom: 4, gap: 8 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%", display: "flex", alignItems: "center", gap: 4 }}>
                        {p.exc.plan_time && TIME_ICON[p.exc.plan_time]}
                        {sanitizeText(p.exc.title)}
                      </span>
                      <span style={{ flexShrink: 0 }}>{p.selectedSlot!.price * p.people} EUR</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "rgba(255,255,255,.12)", margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.45)", marginBottom: 5 }}>
                    <span>Frais de service (10%)</span><span>{platFee} EUR</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "white" }}>
                    <span>Total</span>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18 }}>{grandTotal} EUR</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="cmi-right">
            <div className="cmi-right-scroll">

              <div className="cmi-header">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 3px" }}>
                    {sanitizeText(cur.exc.title)}
                  </h3>
                  <div className="cmi-header-meta">
                    <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{cur.exc.city}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{cur.exc.duration_hours}h</span>
                    {cur.exc.plan_day && (
                      <span style={{ fontSize: 11, background: "#EFF9FB", color: "#2B96A8", padding: "2px 7px", borderRadius: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                        <CalendarDays size={9} />Jour {cur.exc.plan_day}
                      </span>
                    )}
                    {cur.exc.plan_time && (
                      <span style={{ fontSize: 11, background: "#F9FAFB", color: "#6B7280", padding: "2px 7px", borderRadius: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                        {TIME_ICON[cur.exc.plan_time]}{TIME_LABEL[cur.exc.plan_time]}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => onClose?.()} className="cmi-close-btn">
                  <X size={15} />
                </button>
              </div>

              {status === "error" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />{errorMsg}
                </div>
              )}

              {!cur.selectedDate ? (
                <div style={{ textAlign: "center", padding: "36px 20px", background: "#F9FAFB", borderRadius: 16, border: "1.5px dashed #E5E7EB", marginBottom: 18 }}>
                  <CalendarDays size={28} color="#D1D5DB" style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0, fontWeight: 500 }}>Sélectionnez une date sur le calendrier</p>
                </div>
              ) : slotsForDate.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 20px", background: "#FFF7ED", borderRadius: 14, border: "1px solid #FED7AA", marginBottom: 18 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#9A3412", margin: "0 0 4px" }}>Aucun créneau</p>
                  <p style={{ fontSize: 12, color: "#C2410C", margin: 0 }}>Choisissez une autre date</p>
                </div>
              ) : (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: ".5px", flexWrap: "wrap" }}>
                    <Clock size={11} color="#2B96A8" /> Créneaux disponibles
                    {cur.selectedDate && (
                      <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9CA3AF" }}>
                        — {formatDateFR(cur.selectedDate, { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                    )}
                  </p>
                  <SlotList slots={slotsForDate} selected={cur.selectedSlot} onSelect={s => patch(activeIdx, { selectedSlot: s })} />
                </div>
              )}

              {cur.selectedSlot && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 5, textTransform: "uppercase", letterSpacing: ".5px" }}>
                    <Users size={11} color="#2B96A8" /> Nombre de personnes
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", border: "1.5px solid #E5E7EB", borderRadius: 12, background: "white" }}>
                    <button className="cmi-counter-btn" disabled={cur.people <= 1} onClick={() => patch(activeIdx, { people: cur.people - 1 })}><Minus size={14} /></button>
                    <span style={{ flex: 1, textAlign: "center", fontSize: 24, fontWeight: 900, color: "#111827", fontFamily: "'Cormorant Garamond',serif" }}>{cur.people}</span>
                    <button className="cmi-counter-btn" disabled={cur.people >= maxPeople} onClick={() => patch(activeIdx, { people: cur.people + 1 })}><Plus size={14} /></button>
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
                    Max {maxPeople} · {cur.selectedSlot.slots} place{cur.selectedSlot.slots > 1 ? "s" : ""} dispo
                    {cur.selectedSlot.price && (
                      <span style={{ marginLeft: 8, color: "#2B96A8", fontWeight: 600 }}>
                        → {curTotal} EUR (+{Math.round(curTotal * .1)} frais) = {curTotal + Math.round(curTotal * .1)} EUR
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {activeIdx > 0 && (
                  <button className="cmi-navbtn" onClick={() => setActiveIdx(activeIdx - 1)}
                    style={{ border: "1.5px solid #E5E7EB", background: "white", color: "#374151" }}>
                    <ChevronLeft size={13} />
                    <span className="cmi-navbtn-label-full">Précédent</span>
                    <span className="cmi-navbtn-label-short">Préc.</span>
                  </button>
                )}
                {activeIdx < excursions.length - 1 && (
                  <button className="cmi-navbtn" onClick={() => setActiveIdx(activeIdx + 1)}
                    style={{ border: "1.5px solid #2B96A8", background: "#EFF9FB", color: "#2B96A8" }}>
                    <span className="cmi-navbtn-label-full">Suivant</span>
                    <span className="cmi-navbtn-label-short">Suiv.</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px", flexWrap: "wrap" }}>
                  <MessageSquare size={11} color="#2B96A8" />
                  Besoins spéciaux <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none" }}>(optionnel)</span>
                </label>
                <textarea
                  className="cmi-textarea"
                  value={cur.specialNeeds}
                  onChange={e => patch(activeIdx, { specialNeeds: e.target.value })}
                  placeholder="Allergies, mobilité réduite, préférences…"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="cmi-right-footer">
              {configuredCount > 0 && configuredCount < excursions.length && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "9px 12px", marginBottom: 12, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 7 }}>
                  <AlertCircle size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                  {excursions.length - configuredCount} excursion{excursions.length - configuredCount > 1 ? "s" : ""} sans créneau — vous pouvez quand même continuer.
                </div>
              )}

              <button
                className={`cmi-cta ${isLoading ? "loading" : !canSubmit ? "off" : "on"}`}
                disabled={!canSubmit || isLoading}
                onClick={handleReserve}
              >
                {isLoading
                  ? <><Loader2 size={15} style={{ animation: "cmiSpin .7s linear infinite" }} /> Réservation en cours…</>
                  : !canSubmit
                  ? "Configurez au moins un créneau"
                  : <><Route size={15} /> Réserver ({configuredCount} exc.) — {grandTotal} EUR</>
                }
              </button>

              <div className="cmi-guarantees">
                {[
                  { icon: <Lock size={10} color="#059669" />,       text: "Paiement sécurisé" },
                  { icon: <RefreshCcw size={10} color="#2563EB" />,  text: "Annulation 24h" },
                  { icon: <ShieldCheck size={10} color="#8B5CF6" />, text: "Confirmé instantanément" },
                ].map(g => (
                  <span key={g.text} className="cmi-guarantee-item">
                    {g.icon}{g.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}