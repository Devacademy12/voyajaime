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
  CalendarDays, Sparkles, CreditCard, Trash2, ChevronDown,
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
  matin: <Sunrise size={14} color="#F59E0B" />,
  aprem: <Sun size={14} color="#2B96A8" />,
  soir: <Moon size={14} color="#8B5CF6" />,
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
        time: t.slice(0, 5),
        language: item.language,
        price: item.price_per_person || exc.price_per_person,
        slots: item.slots ?? 0,
        groupPrice: item.group_discount_available || false,
        start_time: item.start_time,
        end_time: item.end_time,
      });
    });
  });
  return map;
}

function excursionHasAvailableSlots(exc: ExcursionForCheckout): boolean {
  if (!exc.available_dates || !Array.isArray(exc.available_dates)) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return exc.available_dates.some(item => {
    if (!item.date) return false;
    const dt = new Date(item.date); dt.setHours(0, 0, 0, 0);
    if (dt < today) return false;
    const slots = item.slots ?? item.available_slots ?? null;
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
  const today = new Date(); today.setHours(0, 0, 0, 0);
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

/* ─── CSS MOBILE-OPTIMIZED ─────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  * { box-sizing: border-box; }

  .cmi-overlay {
    position:fixed;inset:0;z-index:1000;
    display:flex;align-items:flex-end;justify-content:center;padding:0;
    background:rgba(5,15,30,0.72);backdrop-filter:blur(10px);
    animation:cmiFade .22s ease;
  }
  
  .cmi-shell {
    font-family:'DM Sans',sans-serif;background:#F8F9FB;
    width:100%;max-height:92vh;
    box-shadow:0 -20px 60px rgba(0,0,0,.3);
    overflow:hidden;display:flex;flex-direction:column;
    animation:cmiUp .32s cubic-bezier(.34,1.4,.64,1);
    border-radius:24px 24px 0 0;
  }

  .cmi-header {
    padding:20px 16px;
    border-bottom:1px solid #E5E7EB;
    background:#FAFBFC;
    flex-shrink:0;
  }

  .cmi-header-top {
    display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;
  }

  .cmi-header h1 {
    margin:0;font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:700;color:#111827;
  }

  .cmi-header-close {
    width:32px;height:32px;border-radius:50%;border:none;background:#E5E7EB;cursor:pointer;
    display:flex;align-items:center;justify-content:center;color:#9CA3AF;flex-shrink:0;
  }

  .cmi-progress {
    display:flex;gap:4px;align-items:center;
  }

  .cmi-progress-bar {
    flex:1;height:4px;background:#E5E7EB;border-radius:2px;overflow:hidden;
  }

  .cmi-progress-fill {
    height:100%;background:#2B96A8;border-radius:2px;transition:width .3s;
  }

  .cmi-content {
    flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column;
  }

  .cmi-content::-webkit-scrollbar {
    width:4px;
  }

  .cmi-content::-webkit-scrollbar-thumb {
    background:#D1D5DB;border-radius:2px;
  }

  .cmi-section {
    padding:16px;border-bottom:1px solid #E5E7EB;
  }

  .cmi-section:last-of-type {
    border-bottom:none;
  }

  .cmi-section-title {
    display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;
    color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;
  }

  .cmi-section-title i {
    color:#2B96A8;
  }

  .cmi-card {
    background:#white;border:1.5px solid #E5E7EB;border-radius:14px;padding:14px;margin-bottom:12px;
  }

  .cmi-card:last-child {
    margin-bottom:0;
  }

  .cmi-card-title {
    font-size:15px;font-weight:700;color:#111827;margin:0 0 6px;
  }

  .cmi-card-meta {
    display:flex;align-items:center;gap:8px;font-size:13px;color:#6B7280;margin-bottom:8px;flex-wrap:wrap;
  }

  .cmi-card-meta span {
    display:inline-flex;align-items:center;gap:4px;
  }

  .cmi-slot-item {
    padding:12px;border:1.5px solid #E5E7EB;border-radius:12px;margin-bottom:10px;
    cursor:pointer;transition:all .15s;background:white;
  }

  .cmi-slot-item.selected {
    background:#EFF9FB;border-color:#2B96A8;
  }

  .cmi-slot-item.full {
    opacity:.5;cursor:not-allowed;
  }

  .cmi-slot-item:not(.full):not(.selected):active {
    border-color:#2B96A8;background:#F8FDFE;
  }

  .cmi-slot-time {
    font-size:16px;font-weight:800;color:#111827;margin-bottom:4px;
  }

  .cmi-slot-info {
    font-size:12px;color:#6B7280;margin-bottom:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;
  }

  .cmi-slot-price {
    font-size:18px;font-weight:800;color:#2B96A8;
  }

  .cmi-slot-places {
    font-size:12px;color:#9CA3AF;margin-top:4px;
  }

  .cmi-counter {
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:12px;background:white;
  }

  .cmi-counter-btn {
    width:40px;height:40px;border:none;border-radius:10px;background:#F3F4F6;
    cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .14s;
  }

  .cmi-counter-btn:hover:not(:disabled) {
    background:#E5E7EB;
  }

  .cmi-counter-btn:disabled {
    opacity:.3;cursor:not-allowed;
  }

  .cmi-counter-value {
    font-size:28px;font-weight:900;color:#111827;font-family:'Cormorant Garamond',serif;
  }

  .cmi-textarea {
    width:100%;padding:12px;min-height:70px;border:1.5px solid #E5E7EB;
    border-radius:12px;font-size:13px;font-family:'DM Sans',sans-serif;
    color:#374151;resize:none;outline:none;background:white;box-sizing:border-box;
    transition:border .15s;
  }

  .cmi-textarea:focus {
    border-color:#2B96A8;background:white;
  }

  .cmi-calendar {
    background:white;border-radius:12px;padding:12px;border:1.5px solid #E5E7EB;
  }

  .cmi-cal-header {
    display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;
  }

  .cmi-cal-nav {
    width:32px;height:32px;border:none;background:#F3F4F6;border-radius:8px;
    cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9CA3AF;
  }

  .cmi-cal-nav:hover {
    background:#E5E7EB;
  }

  .cmi-cal-month {
    font-size:14px;font-weight:700;color:#111827;
  }

  .cmi-cal-days {
    display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:8px;
  }

  .cmi-cal-day-label {
    text-align:center;font-size:11px;font-weight:600;color:#9CA3AF;padding:6px 0;
  }

  .cmi-cal-day {
    aspect-ratio:1;border:none;border-radius:8px;background:#F9FAFB;
    cursor:pointer;font-size:13px;font-weight:600;transition:all .14s;
    display:flex;align-items:center;justify-content:center;position:relative;
    color:#111827;
  }

  .cmi-cal-day:hover:not(.past):not(.unavail) {
    background:#EFF9FB;border-color:#2B96A8;
  }

  .cmi-cal-day.selected {
    background:#2B96A8;color:white;font-weight:700;
  }

  .cmi-cal-day.past {
    opacity:.4;cursor:not-allowed;color:#D1D5DB;
  }

  .cmi-cal-day.unavail {
    opacity:.3;cursor:not-allowed;
  }

  .cmi-footer {
    padding:16px;border-top:1px solid #E5E7EB;background:white;flex-shrink:0;
  }

  .cmi-price-summary {
    background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:12px;
    font-size:13px;
  }

  .cmi-price-row {
    display:flex;justify-content:space-between;margin-bottom:6px;
    color:#6B7280;
  }

  .cmi-price-total {
    display:flex;justify-content:space-between;
    border-top:1px solid #E5E7EB;padding-top:8px;
    font-size:16px;font-weight:700;color:#111827;
  }

  .cmi-price-total span:last-child {
    font-family:'Cormorant Garamond',serif;font-size:18px;
  }

  .cmi-cta {
    width:100%;padding:14px;border:none;border-radius:12px;
    font-size:16px;font-weight:800;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all .2s;
    display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;
    min-height:48px;
  }

  .cmi-cta.on {
    background:linear-gradient(135deg,#2B96A8,#1a7a8f);color:white;
    box-shadow:0 4px 14px rgba(43,150,168,.25);
  }

  .cmi-cta.on:active {
    transform:scale(.98);
  }

  .cmi-cta.off {
    background:#EAECEF;color:#9CA3AF;cursor:not-allowed;
  }

  .cmi-cta.loading {
    background:#7CC4D1;color:white;cursor:not-allowed;
  }

  .cmi-cta.green {
    background:linear-gradient(135deg,#059669,#047857);color:white;
    box-shadow:0 4px 14px rgba(5,150,105,.25);
  }

  .cmi-cta.green:active {
    transform:scale(.98);
  }

  .cmi-secondary-btn {
    width:100%;padding:12px;border:1.5px solid #E5E7EB;background:white;
    border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;
    color:#374151;transition:all .15s;
  }

  .cmi-secondary-btn:active {
    background:#F9FAFB;
  }

  .cmi-excursion-nav {
    display:flex;gap:8px;justify-content:space-between;align-items:center;padding:0;
    margin:0;
  }

  .cmi-nav-btn {
    flex:1;padding:10px;border:1.5px solid #E5E7EB;background:white;
    border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;
    color:#374151;transition:all .15s;display:flex;align-items:center;
    justify-content:center;gap:6px;
  }

  .cmi-nav-btn.next {
    border-color:#2B96A8;color:#2B96A8;background:#EFF9FB;
  }

  .cmi-nav-btn:active {
    opacity:.8;
  }

  .cmi-tabs {
    display:flex;overflow-x:auto;gap:8px;padding:12px;padding-bottom:0;
    margin:-16px -16px 12px;scrollbar-width:none;
  }

  .cmi-tabs::-webkit-scrollbar {
    display:none;
  }

  .cmi-tab {
    padding:8px 12px;border:1.5px solid #E5E7EB;background:white;
    border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;
    color:#6B7280;transition:all .14s;flex-shrink:0;white-space:nowrap;
  }

  .cmi-tab.active {
    background:#2B96A8;color:white;border-color:#2B96A8;
  }

  .cmi-tab.done::before {
    content:'✓ ';color:#059669;font-weight:800;
  }

  .cmi-error {
    background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;
    padding:12px;font-size:13px;color:#DC2626;font-weight:600;
    display:flex;align-items:center;gap:8px;margin-bottom:12px;
  }

  .cmi-success-icon {
    width:80px;height:80px;border-radius:50%;
    background:linear-gradient(135deg,#D1FAE5,#A7F3D0);
    display:flex;align-items:center;justify-content:center;
    margin:0 auto 20px;box-shadow:0 8px 24px rgba(5,150,105,.2);
  }

  .cmi-badge {
    display:inline-flex;align-items:center;gap:4px;
    background:#EFF9FB;color:#0E5068;padding:4px 8px;
    border-radius:8px;font-size:11px;font-weight:600;
  }

  .cmi-alert {
    background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:12px;
    padding:12px;font-size:12px;color:#92400E;margin-bottom:12px;display:flex;
    align-items:center;gap:8px;
  }

  @keyframes cmiFade {from{opacity:0}to{opacity:1}}
  @keyframes cmiUp {from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cmiSpin {to{transform:rotate(360deg)}}
  @keyframes pulseGreen {
    0%,100% {box-shadow:0 0 0 0 rgba(5,150,105,.3)}
    50% {box-shadow:0 0 0 8px rgba(5,150,105,0)}
  }

  /* Desktop fallback */
  @media(min-width:768px) {
    .cmi-overlay {
      align-items:center;padding:8px;
    }
    
    .cmi-shell {
      flex-direction:row;max-width:960px;max-height:94vh;
      border-radius:28px;box-shadow:0 40px 100px rgba(0,0,0,.38);
    }

    .cmi-header {
      flex:0 0 360px;padding:28px 26px;background:linear-gradient(168deg,#071E3D 0%,#0B3D63 45%,#0A6080 100%);
      color:white;border:none;
    }

    .cmi-header h1 {
      color:white;font-size:20px;
    }

    .cmi-header-close {
      background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);
    }

    .cmi-content {
      flex:1;
    }

    .cmi-footer {
      border-top:1px solid #EAECEF;
    }
  }
`;

/* ─── MiniCalendar Mobile ─────────────────────────────────────────────── */

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
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="cmi-calendar">
      <div className="cmi-cal-header">
        <button className="cmi-cal-nav" onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}>
          <ChevronLeft size={16} />
        </button>
        <span className="cmi-cal-month">{MONTHS_FR[viewMonth]} {viewYear}</span>
        <button className="cmi-cal-nav" onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="cmi-cal-days">
        {DAYS_FR.map(d => <div key={d} className="cmi-cal-day-label">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ aspectRatio: '1' }} />;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast = cellDate < today;
          const slots = dateMap.get(dateStr);
          const hasSlots = slots ? slots.some(s => s.slots > 0) : false;
          const isInMap = dateMap.has(dateStr);
          const isSel = dateStr === selectedDate;

          let className = "cmi-cal-day";
          if (isPast) className += " past";
          else if (!isInMap || !hasSlots) className += " unavail";
          if (isSel) className += " selected";

          return (
            <button key={i} className={className} onClick={() => !isPast && isInMap && hasSlots && onSelect(dateStr)}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── SlotList Mobile ─────────────────────────────────────────────────── */

function SlotList({ slots, selected, onSelect }: {
  slots: TimeSlot[]; selected: TimeSlot | null; onSelect: (s: TimeSlot) => void;
}) {
  return (
    <div>
      {slots.map((slot, i) => {
        const avail = slot.slots > 0;
        const isSel = selected === slot;
        const low = avail && slot.slots <= 3;
        return (
          <div key={i} className={`cmi-slot-item ${isSel ? "selected" : ""} ${!avail ? "full" : ""}`}
            onClick={() => avail && onSelect(slot)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div className="cmi-slot-time">{slot.time}</div>
                <div className="cmi-slot-info">
                  {slot.language && <span style={{ background: "#F3F4F6", color: "#6B7280", padding: "2px 6px", borderRadius: 6, fontSize: "11px" }}>{slot.language}</span>}
                  {slot.groupPrice && <span style={{ color: "#10B981", fontWeight: 600 }}>Tarif groupe</span>}
                </div>
              </div>
              <div style={{ textAlign: "right", marginLeft: 12 }}>
                <div className="cmi-slot-price">{slot.price} EUR</div>
                <div className="cmi-slot-places">{slot.slots} place{slot.slots > 1 ? "s" : ""}</div>
              </div>
            </div>
            {!avail && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "#EF4444" }}>Complet</div>}
            {low && avail && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>Dernières places!</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────── */

export default function CheckoutModalItineraire({
  excursions: rawExcursions, itineraireId: propItinId, itineraireTitle, onClose, onPayNow,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const { available: excursions, unavailable: unavailableExcursions } = (() => {
    const available: ExcursionForCheckout[] = [];
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
      let preDate = "";
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
        exc: e,
        dateMap,
        selectedDate: preDate,
        selectedSlot: preSlot,
        people: 1,
        specialNeeds: "",
        hasSuggestion: !!e.plan_date && !!dateMap.get(e.plan_date)?.some(s => s.slots > 0),
        suggestedDate: e.plan_date || "",
      };
    })
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingCodes, setBookingCodes] = useState<string[]>([]);
  const [savedItinId, setSavedItinId] = useState<string | null>(null);
  const [savedReservationIds, setSavedReservationIds] = useState<string[]>([]);

  const patch = useCallback((idx: number, p: Partial<typeof perExc[0]>) =>
    setPerExc(prev => prev.map((x, i) => i === idx ? { ...x, ...p } : x)), []);

  const cur = perExc[activeIdx] ?? perExc[0];
  const slotsForDate = cur?.selectedDate ? (cur.dateMap.get(cur.selectedDate) || []) : [];
  const maxPeople = cur?.selectedSlot?.slots || cur?.exc?.max_people || 20;
  const curPrice = cur?.selectedSlot?.price || cur?.exc?.price_per_person || 0;
  const curTotal = curPrice * (cur?.people || 1);

  const configuredCount = perExc.filter(p => !!p.selectedSlot).length;
  const subtotal = perExc.reduce((s, p) => s + (p.selectedSlot?.price || 0) * p.people, 0);
  const platFee = Math.round(subtotal * .1);
  const grandTotal = subtotal + platFee;
  const isLoading = status === "loading";
  const canSubmit = perExc.some(p => !!p.selectedSlot) && !isLoading && confirmedContinue;

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
        const villes = [...new Set(perExc.map(p => p.exc.city))];
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

      const codes: string[] = [];
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
          const otherExc = Array.isArray(c.excursions) ? c.excursions[0] : c.excursions;
          const otherDuration = otherExc?.duration_hours || 1;
          if (hasTimeOverlap(p.selectedDate, p.selectedSlot.time, duration, c.date, c.time, otherDuration)) {
            setErrorMsg("⚠️ Chevauchement horaire avec une autre réservation.");
            setStatus("error"); return;
          }
        }

        const code = genBookingCode();
        const tot = p.selectedSlot.price * p.people;
        const fee = Math.round(tot * .1);
        const { data: inserted, error: insErr } = await supabase
          .from("reservations")
          .insert([{
            touriste_id: user.id,
            excursion_id: p.exc.id,
            itineraire_id: itineraireId,
            date: p.selectedDate,
            time: p.selectedSlot.time,
            people_count: p.people,
            total_price: tot + fee,
            platform_fee: fee,
            status: "pending",
            special_needs: p.specialNeeds.trim() || null,
            booking_code: code,
            payment_status: "unpaid",
            payment_method: null,
            special_notes: null,
          }])
          .select("id")
          .single();

        if (insErr || !inserted?.id) {
          setErrorMsg(`Erreur insertion réservation : ${insErr?.message ?? "ID non retourné"}`);
          setStatus("error"); return;
        }

        const { error: itinResErr } = await supabase.from("reservation_itineraires").insert([{
          itineraire_id: itineraireId,
          reservation_id: inserted.id,
          excursion_id: p.exc.id,
          day_number: p.exc.plan_day ?? 1,
          plan_time: p.exc.plan_time ?? null,
          plan_date: p.exc.plan_date ?? null,
          payment_status: "unpaid",
          user_id: user.id,
          status: "pending",
          total_price: tot + fee,
          platform_fee: fee,
        }]);

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

  /* ══ WARNING SCREEN ══════════════════════════════════════════════════ */

  if (showNoSlotWarning && !confirmedContinue) {
    const allUnavailable = excursions.length === 0;
    return (
      <>
        <style>{CSS}</style>
        <div className="cmi-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
          <div className="cmi-shell" style={{ maxWidth: 560, display: "block", padding: "32px 16px", borderRadius: "20px" }}>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
                Vérification disponibilités
              </h2>

              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={16} /> {unavailableExcursions.length} excursion{unavailableExcursions.length > 1 ? "s" : ""} indisponible{unavailableExcursions.length > 1 ? "s" : ""}
                </p>
                {unavailableExcursions.map(e => (
                  <div key={e.id} style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: "12px", marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{sanitizeText(e.title)}</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} />{e.city}
                    </p>
                  </div>
                ))}
              </div>

              {excursions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#059669", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={16} /> {excursions.length} excursion{excursions.length > 1 ? "s" : ""} disponible{excursions.length > 1 ? "s" : ""}
                  </p>
                  {excursions.map(e => (
                    <div key={e.id} style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px", marginBottom: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{sanitizeText(e.title)}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} />{e.city}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="cmi-alert">
                <AlertCircle size={14} />
                {allUnavailable ? "Aucune excursion disponible pour le moment." : `${unavailableExcursions.length} excursion${unavailableExcursions.length > 1 ? "s" : ""} seront retirée${unavailableExcursions.length > 1 ? "s" : ""} du paiement.`}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!allUnavailable && (
                <button className="cmi-cta on" onClick={() => { setShowNoSlotWarning(false); setConfirmedContinue(true); }}>
                  Continuer ({excursions.length})
                </button>
              )}
              <button className="cmi-secondary-btn" onClick={() => onClose?.()}>
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
          <div className="cmi-shell" style={{ maxWidth: 540, display: "block", padding: "32px 16px", textAlign: "center", borderRadius: "20px" }}>
            <div className="cmi-success-icon">
              <CheckCircle size={40} color="#059669" />
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Réservation confirmée !
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              {confirmed.length} excursion{confirmed.length > 1 ? "s" : ""} validée{confirmed.length > 1 ? "s" : ""}
            </p>

            {savedItinId && (
              <div style={{ background: "#EFF9FB", border: "1px solid rgba(43,150,168,.3)", borderRadius: 10, padding: "10px 12px", marginBottom: 24, fontSize: 13, fontWeight: 600, color: "#2B96A8" }}>
                Itinéraire #{savedItinId.slice(0, 8).toUpperCase()}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              {confirmed.map((p, i) => (
                <div key={i} style={{ background: "#EFF9FB", border: "1px solid rgba(43,150,168,.2)", borderRadius: 12, padding: "12px", marginBottom: 8, textAlign: "left" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>{sanitizeText(p.exc.title)}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 4px" }}>
                    <Calendar size={11} style={{ display: "inline", marginRight: 4 }} />
                    {formatDateFR(p.selectedDate, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>
                    <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                    {p.selectedSlot!.time} · {p.people} pers.
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#2B96A8", margin: 0 }}>
                    {(p.selectedSlot!.price * p.people) + Math.round(p.selectedSlot!.price * p.people * .1)} EUR
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {savedReservationIds.length > 0 && (
                <button className="cmi-cta green" onClick={() => handleGoToPay(savedReservationIds)}>
                  Payer maintenant
                </button>
              )}
              <button className="cmi-secondary-btn" onClick={() => onClose?.()}>
                Fermer
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
          <div className="cmi-shell" style={{ maxWidth: 480, display: "block", padding: "40px 16px", textAlign: "center", borderRadius: "20px" }}>
            <AlertCircle size={52} color="#EF4444" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
              Aucune disponibilité
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Aucune excursion n'a de créneau disponible pour le moment.
            </p>
            <button className="cmi-cta on" onClick={() => onClose?.()}>Fermer</button>
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
      <div className="cmi-overlay">
        <div className="cmi-shell">

          {/* HEADER */}
          <div className="cmi-header">
            <div className="cmi-header-top">
              <div>
                <h1>{itineraireTitle || "Réserver"}</h1>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.65)", margin: "4px 0 0" }}>
                  {configuredCount}/{excursions.length} configuré{configuredCount > 1 ? "s" : ""}
                </p>
              </div>
              <button className="cmi-header-close" onClick={() => onClose?.()}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="cmi-progress-bar">
                <div className="cmi-progress-fill" style={{ width: `${(configuredCount / excursions.length) * 100}%` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.8)", minWidth: 30 }}>
                {Math.round((configuredCount / excursions.length) * 100)}%
              </span>
            </div>
          </div>

          {/* CONTENT */}
          <div className="cmi-content">

            {/* Excursion tabs */}
            <div className="cmi-tabs">
              {excursions.map((e, i) => (
                <button key={e.id} className={`cmi-tab ${i === activeIdx ? "active" : ""} ${perExc[i].selectedSlot ? "done" : ""}`}
                  onClick={() => setActiveIdx(i)}>
                  {sanitizeText(e.title).substring(0, 12)}...
                </button>
              ))}
            </div>

            {/* Error message */}
            {status === "error" && (
              <div className="cmi-error" style={{ margin: "12px 16px 0" }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            {/* Excursion title & info */}
            <div className="cmi-section">
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
                {sanitizeText(cur.exc.title)}
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={14} />{cur.exc.city}
                </span>
                <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={14} />{cur.exc.duration_hours}h
                </span>
                {cur.exc.plan_day && <span className="cmi-badge">Jour {cur.exc.plan_day}</span>}
              </div>
            </div>

            {/* Calendar section */}
            <div className="cmi-section">
              <div className="cmi-section-title">
                <Calendar size={14} /> Choisissez une date
              </div>
              <MiniCalendar
                dateMap={cur.dateMap}
                selectedDate={cur.selectedDate}
                suggestedDate={cur.hasSuggestion ? cur.suggestedDate : undefined}
                onSelect={d => patch(activeIdx, { selectedDate: d, selectedSlot: null })}
              />
            </div>

            {/* Slots section */}
            {cur.selectedDate && (
              <div className="cmi-section">
                <div className="cmi-section-title">
                  <Clock size={14} /> Créneau horaire
                </div>
                {slotsForDate.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 12px", background: "#FFF7ED", borderRadius: 12, fontSize: 13, color: "#9A3412" }}>
                    Aucun créneau disponible
                  </div>
                ) : (
                  <SlotList slots={slotsForDate} selected={cur.selectedSlot} onSelect={s => patch(activeIdx, { selectedSlot: s })} />
                )}
              </div>
            )}

            {/* People section */}
            {cur.selectedSlot && (
              <div className="cmi-section">
                <div className="cmi-section-title">
                  <Users size={14} /> Nombre de personnes
                </div>
                <div className="cmi-counter">
                  <button className="cmi-counter-btn" disabled={cur.people <= 1} onClick={() => patch(activeIdx, { people: cur.people - 1 })}>
                    <Minus size={18} />
                  </button>
                  <span className="cmi-counter-value">{cur.people}</span>
                  <button className="cmi-counter-btn" disabled={cur.people >= maxPeople} onClick={() => patch(activeIdx, { people: cur.people + 1 })}>
                    <Plus size={18} />
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8, margin: 0 }}>
                  Max {maxPeople} · {cur.selectedSlot.slots} place{cur.selectedSlot.slots > 1 ? "s" : ""} dispo
                </p>
              </div>
            )}

            {/* Special needs section */}
            <div className="cmi-section">
              <div className="cmi-section-title">
                <MessageSquare size={14} /> Besoins spéciaux (optionnel)
              </div>
              <textarea
                className="cmi-textarea"
                value={cur.specialNeeds}
                onChange={e => patch(activeIdx, { specialNeeds: e.target.value })}
                placeholder="Allergies, mobilité, préférences…"
              />
            </div>

            {/* Navigation buttons */}
            {excursions.length > 1 && (
              <div className="cmi-section">
                <div className="cmi-excursion-nav">
                  {activeIdx > 0 && (
                    <button className="cmi-nav-btn" onClick={() => setActiveIdx(activeIdx - 1)}>
                      <ChevronLeft size={16} /> Précédent
                    </button>
                  )}
                  {activeIdx < excursions.length - 1 && (
                    <button className="cmi-nav-btn next" onClick={() => setActiveIdx(activeIdx + 1)}>
                      Suivant <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="cmi-footer">
            {subtotal > 0 && (
              <div className="cmi-price-summary">
                {perExc.filter(p => p.selectedSlot).map((p, i) => (
                  <div key={i} className="cmi-price-row">
                    <span>{sanitizeText(p.exc.title).substring(0, 20)}...</span>
                    <strong>{p.selectedSlot!.price * p.people} EUR</strong>
                  </div>
                ))}
                <div className="cmi-price-row" style={{ borderTop: "1px solid #D1D5DB", paddingTop: 6, marginTop: 6 }}>
                  <span>Frais (10%)</span>
                  <strong>{platFee} EUR</strong>
                </div>
                <div className="cmi-price-total">
                  <span>Total</span>
                  <span>{grandTotal} EUR</span>
                </div>
              </div>
            )}

            {configuredCount > 0 && configuredCount < excursions.length && (
              <div className="cmi-alert">
                <AlertCircle size={13} />
                {excursions.length - configuredCount} excursion{excursions.length - configuredCount > 1 ? "s" : ""} à configurer
              </div>
            )}

            <button
              className={`cmi-cta ${isLoading ? "loading" : !canSubmit ? "off" : "on"}`}
              disabled={!canSubmit || isLoading}
              onClick={handleReserve}
            >
              {isLoading
                ? <><Loader2 size={16} style={{ animation: "cmiSpin .7s linear infinite" }} /> Réservation…</>
                : !canSubmit
                ? "Configurez un créneau"
                : <>Réserver ({configuredCount}) — {grandTotal} EUR</>
              }
            </button>

            <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", margin: "8px 0 0" }}>
              🔒 Paiement sécurisé · Annulation 24h · Confirmé instantanément
            </p>
          </div>
        </div>
      </div>
    </>
  );
}