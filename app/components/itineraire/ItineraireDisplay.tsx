"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, Globe, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, RotateCcw, Star, Sparkles, Navigation,
  ArrowRight, Camera, X, Plus,
  BadgeCheck, Download, Share2, Bookmark,
  Sunrise, Sun, Moon, CalendarDays, Euro,
  AlertTriangle, ChevronDown, TrendingUp,
} from "lucide-react";

/* ─── Types ─── */
type Activity = {
  id: string; name: string; description?: string; time?: string;
  duration?: string; duration_hours?: number; price?: number; icon?: string;
  photos?: string | string[]; languages?: string | string[];
  inclusion?: string | string[]; city?: string;
  rating?: number; reviews_count?: number; max_people?: number;
  is_free_day?: boolean;
};
type DayPlan = {
  day: number; city: string; date?: string;
  theme?: string; emoji?: string; activities: Activity[];
};
type Itinerary = { title: string; days: DayPlan[] };

type ExcursionData = {
  id: string; title: string; city: string;
  price_per_person?: number; duration_hours?: number;
  description?: string; categories?: string[];
  photos?: string[]; languages?: string[];
  inclusions?: string[]; rating?: number; reviews_count?: number;
  is_active?: boolean;
};

type ItineraireDisplayProps = {
  itinerary: Itinerary;
  selectedCities: string[];
  selectedCats?: string[];
  categories?: { id: string; nom?: string; name?: string }[];
  excursions: ExcursionData[];
  totalPrice: number;
  saving: boolean;
  saveStatus: "idle" | "ok" | "error" | "login" | "saving";
  onBack: () => void;
  onReset: () => void;
  onCheckout?: () => void;
  onSave: () => void;
  onChangeActivity: (dayIdx: number, actIdx: number, alt: Activity) => void;
};

/* ─── Helpers ─── */
function parseList(val?: string | string[]): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch {}
  return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}
function parsePhotos(val?: string | string[]): string[] {
  if (!val) return [];
  
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (p): p is string => typeof p === "string" && (p.startsWith("http") || p.startsWith("/"))
        );
      }
    } catch {}
    if (val.startsWith("http") || val.startsWith("/")) return [val];
    return [];
  }
  
  if (Array.isArray(val)) {
    return val.flatMap(p => {
      if (typeof p !== "string") return [];
      try {
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed)) return parsed.filter(
          (x): x is string => typeof x === "string" && (x.startsWith("http") || x.startsWith("/"))
        );
      } catch {}
      return (p.startsWith("http") || p.startsWith("/")) ? [p] : [];
    });
  }
  
  return [];
}
function getSlot(time?: string): "morning" | "afternoon" | "evening" | "unset" {
  if (!time) return "unset";
  const h = parseInt(time.split(":")[0] ?? "0", 10);
  if (isNaN(h)) return "unset";
  if (h < 13) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

const SLOTS = [
  { key: "morning" as const,   label: "Matin",      icon: <Sunrise size={14}/>, color: "#F59E0B", bg: "rgba(245,158,11,.10)", time: "8h – 12h" },
  { key: "afternoon" as const, label: "Après-midi", icon: <Sun size={14}/>,     color: "#2B96A8", bg: "rgba(43,150,168,.10)",  time: "13h – 17h" },
  { key: "evening" as const,   label: "Soir",       icon: <Moon size={14}/>,    color: "#8B5CF6", bg: "rgba(139,92,246,.10)", time: "18h – 22h" },
];

const SLOT_DEFAULT_TIMES: Record<string, string> = {
  morning: "09:00", afternoon: "14:00", evening: "19:00",
};

/* ════════════════════════════════════════════
   SHARED CSS
════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --primary:#2B96A8;
  --navy:#053366;
  --bg:#F5F7FA;
  --surface:#ffffff;
  --border:#E2E8F0;
  --text:#334155;
  --muted:#94A3B8;
  --r-sm:6px;
  --r-md:10px;
  --r-lg:16px;
  --r-xl:22px;
  --shadow-sm:0 1px 4px rgba(5,51,102,.06);
  --shadow-md:0 4px 16px rgba(5,51,102,.10);
  --shadow-lg:0 8px 32px rgba(5,51,102,.12);
}

.itin-root{
  min-height:100vh; background:var(--bg);
  font-family:'DM Sans',system-ui,sans-serif; color:var(--text);
  display:flex; flex-direction:column;
}

/* ── TOP NAV ── */
.itin-nav{
  position:sticky; top:0; z-index:100;
  display:flex; align-items:center; gap:10px;
  padding:0 24px; height:54px;
  background:var(--surface); border-bottom:1px solid var(--border);
  box-shadow:var(--shadow-sm);
}
.itin-nav-brand{
  display:flex; align-items:center; gap:7px; margin-right:auto;
  font-size:13px; font-weight:800; color:var(--navy);
  letter-spacing:-.01em;
}
.itin-nav-brand-dot{
  width:8px; height:8px; border-radius:50%; background:var(--primary);
}
.itin-nav-pill{
  display:flex; align-items:center; gap:5px;
  padding:3px 10px; border-radius:20px;
  background:rgba(43,150,168,.09); color:var(--primary);
  font-size:11px; font-weight:700; letter-spacing:.04em;
}

/* ── BUTTONS (shared) ── */
.btn{
  display:inline-flex; align-items:center; gap:6px;
  padding:7px 14px; border-radius:50px;
  font-size:12.5px; font-weight:700; cursor:pointer;
  font-family:inherit; transition:all .18s; white-space:nowrap;
  border:1.5px solid transparent;
}
.btn-ghost{
  background:var(--surface); color:var(--text); border-color:var(--border);
}
.btn-ghost:hover{border-color:var(--navy);color:var(--navy)}
.btn-ghost:disabled{opacity:.4;cursor:not-allowed}
.btn-primary{
  background:var(--navy); color:#fff; border-color:var(--navy);
  box-shadow:0 6px 18px -4px rgba(5,51,102,.35);
}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px -4px rgba(5,51,102,.45)}
.btn-primary:disabled{background:#CBD5E1;border-color:#CBD5E1;color:#94A3B8;box-shadow:none;cursor:not-allowed}
.btn-teal{
  background:var(--primary); color:#fff; border-color:var(--primary);
  box-shadow:0 6px 18px -4px rgba(43,150,168,.40);
}
.btn-teal:hover{transform:translateY(-1px);box-shadow:0 8px 24px -4px rgba(43,150,168,.50)}
.btn-save-ok{background:#ECFDF5;color:#059669;border-color:#6EE7B7}
.btn-save-err{background:#FEF2F2;color:#DC2626;border-color:#FCA5A5}
.btn-save-login{background:#FFFBEB;color:#D97706;border-color:#FCD34D}

/* ── HERO ── */
.itin-hero{
  background:linear-gradient(135deg,var(--navy) 0%,#0b4a7a 55%,var(--primary) 100%);
  padding:28px 32px 24px; color:#fff;
  display:flex; align-items:flex-end; justify-content:space-between;
  flex-wrap:wrap; gap:16px;
}
.itin-hero-ai{
  display:inline-flex; align-items:center; gap:5px;
  background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.2);
  border-radius:20px; padding:3px 11px;
  font-size:10px; font-weight:700; letter-spacing:.05em;
  margin-bottom:8px;
}
.itin-hero-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(18px,2.5vw,26px); font-weight:900;
  margin-bottom:4px; line-height:1.2;
}
.itin-hero-cities{
  font-size:13px; opacity:.75;
  display:flex; align-items:center; gap:4px; flex-wrap:wrap;
}
.itin-hero-stats{display:flex; gap:12px; flex-wrap:wrap;}
.itin-stat{
  display:flex; flex-direction:column; align-items:center;
  background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.1);
  border-radius:12px; padding:9px 16px; min-width:72px; text-align:center;
}
.itin-stat-val{font-size:20px;font-weight:800;line-height:1}
.itin-stat-lbl{font-size:9px;opacity:.7;text-transform:uppercase;letter-spacing:.07em;margin-top:3px}

/* ── LAYOUT ── */
.itin-layout{display:flex;flex:1;min-height:0}

/* ── SIDEBAR ── */
.itin-sidebar{
  width:220px;flex-shrink:0;
  background:var(--surface); border-right:1px solid var(--border);
  padding:18px 12px; display:flex; flex-direction:column; gap:20px;
  overflow-y:auto;
}
.itin-sec-label{
  font-size:9px;font-weight:800;text-transform:uppercase;
  letter-spacing:.1em;color:var(--muted);margin-bottom:7px;
}
.itin-day-item{
  display:flex; align-items:center; gap:9px;
  padding:8px 9px; border-radius:var(--r-md);
  cursor:pointer; transition:all .15s; margin-bottom:2px;
}
.itin-day-item:hover{background:rgba(43,150,168,.06)}
.itin-day-item.active{
  background:rgba(43,150,168,.08);
  border-left:3px solid var(--primary); padding-left:7px;
}
.itin-day-num{
  width:26px;height:26px;border-radius:50%;flex-shrink:0;
  background:var(--bg);display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:800;color:var(--navy);border:1px solid var(--border);
}
.itin-day-item.active .itin-day-num{background:var(--primary);color:#fff;border-color:var(--primary)}
.itin-day-city{font-size:12px;font-weight:700;color:var(--navy)}
.itin-day-sub{font-size:10px;color:var(--muted);margin-top:1px}
.itin-day-badge{
  margin-left:auto;font-size:9px;font-weight:700;
  background:var(--bg);border:1px solid var(--border);
  padding:2px 6px;border-radius:8px;color:var(--muted);white-space:nowrap;
}
.itin-add-day{
  width:100%;display:flex;align-items:center;justify-content:center;gap:5px;
  padding:7px;border-radius:var(--r-md);
  border:1.5px dashed var(--border);background:transparent;
  color:var(--muted);font-size:11px;font-weight:700;
  font-family:inherit;cursor:pointer;transition:all .15s;margin-top:4px;
}
.itin-add-day:hover{border-color:var(--primary);color:var(--primary)}

.itin-summary-box{
  background:rgba(43,150,168,.05); border:1px solid rgba(43,150,168,.15);
  border-radius:var(--r-lg);padding:14px;margin-top:auto;
}
.itin-sum-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:4px 0;border-bottom:1px solid rgba(43,150,168,.08);
}
.itin-sum-row:last-of-type{border-bottom:none}
.itin-sum-key{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--muted)}
.itin-sum-val{font-size:11px;font-weight:700;color:var(--navy)}
.itin-sum-total{
  display:flex;justify-content:space-between;align-items:center;
  margin-top:10px;padding-top:10px;border-top:1px solid rgba(43,150,168,.15);
}
.itin-sum-total-lbl{font-size:10px;font-weight:700;color:var(--primary)}
.itin-sum-total-val{font-size:17px;font-weight:800;color:var(--navy)}

/* ── CONTENT ── */
.itin-content{flex:1;padding:22px 26px;overflow-y:auto;min-width:0}

.itin-day-hdr{
  display:flex;align-items:center;gap:12px;
  padding:14px 18px;background:var(--surface);
  border-radius:var(--r-xl);border:1px solid var(--border);
  box-shadow:var(--shadow-sm);margin-bottom:18px;
}
.itin-day-icon{
  width:42px;height:42px;border-radius:12px;flex-shrink:0;
  background:rgba(43,150,168,.09);
  display:flex;align-items:center;justify-content:center;
}
.itin-day-htitle{font-size:16px;font-weight:800;color:var(--navy)}
.itin-day-hsub{font-size:11px;color:var(--muted);margin-top:2px}
.itin-day-hbadge{
  margin-left:auto;display:flex;align-items:center;gap:5px;
  font-size:11px;font-weight:700;color:var(--primary);
  background:rgba(43,150,168,.08);padding:5px 12px;border-radius:20px;
}

/* ── SLOT SECTION ── */
.itin-slot{margin-bottom:24px}
.itin-slot-head{
  display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;
  border-bottom:1px solid var(--border);
}
.itin-slot-icon-wrap{
  width:28px;height:28px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.itin-slot-label{font-size:12px;font-weight:800;color:var(--navy)}
.itin-slot-time{font-size:10px;color:var(--muted);font-weight:500}
.itin-slot-total{margin-left:auto;font-size:11px;font-weight:700;color:var(--primary)}
.itin-slot-empty{
  padding:12px 16px;border-radius:var(--r-md);
  border:1.5px dashed var(--border);color:var(--muted);
  font-size:11px;text-align:center;
}
.itin-add-act{
  display:flex;align-items:center;gap:5px;
  padding:6px 12px;border-radius:var(--r-md);
  border:1.5px dashed var(--border);background:transparent;
  color:var(--muted);font-size:11px;font-weight:700;
  font-family:inherit;cursor:pointer;transition:all .15s;margin-top:6px;
}
.itin-add-act:hover{border-color:var(--primary);color:var(--primary);background:rgba(43,150,168,.04)}

/* ── ACTIVITY CARD ── */
.itin-act{
  display:flex;background:var(--surface);
  border-radius:var(--r-lg);border:1px solid var(--border);
  box-shadow:var(--shadow-sm);overflow:hidden;
  margin-bottom:10px;transition:box-shadow .2s,transform .2s;
  align-items:stretch;  /* ✅ ajout */
}
.itin-act:hover{box-shadow:var(--shadow-md);transform:translateY(-1px)}
.itin-act.free-day{
  background:linear-gradient(135deg,rgba(43,150,168,.04),rgba(5,51,102,.03));
  border-style:dashed;
}

.itin-act-img{
  width:106px;min-width:106px;flex-shrink:0;
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,#EFF6FF,#F0F9FF);
  min-height:120px;align-self:stretch;
}
.itin-act-img img{
  position:absolute;inset:0;
  width:100%;height:100%;
  object-fit:cover;display:block;
}
.itin-act-img-ph{
  width:100%;height:100%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:5px;color:#CBD5E1;font-size:10px;
}
.itin-act-time-tag{
  position:absolute;bottom:5px;left:5px;
  display:flex;align-items:center;gap:3px;
  background:rgba(0,0,0,.65);color:#fff;
  padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700;
}
.itin-act-body{flex:1;padding:13px 15px;display:flex;flex-direction:column;gap:6px;min-width:0}
.itin-act-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.itin-act-name{font-size:13.5px;font-weight:800;color:var(--navy);line-height:1.3}
.itin-act-name.free{color:var(--primary)}
.itin-act-desc{font-size:11px;color:var(--muted);line-height:1.5;margin:0}

.itin-price{
  font-size:12px;font-weight:800;color:var(--navy);
  white-space:nowrap;padding:2px 8px;background:var(--bg);
  border:1px solid var(--border);border-radius:8px;flex-shrink:0;
}
.itin-price.free{color:#059669;background:#ECFDF5;border-color:#A7F3D0}

.itin-chips{display:flex;flex-wrap:wrap;gap:4px}
.itin-chip{
  display:inline-flex;align-items:center;gap:3px;
  background:#F1F5F9;border:1px solid var(--border);
  border-radius:6px;padding:2px 7px;font-size:9.5px;font-weight:600;color:var(--navy);
}
.itin-tags{display:flex;flex-wrap:wrap;gap:3px}
.itin-tag-lang{background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;border-radius:20px;padding:1px 6px;font-size:9px;font-weight:600;display:inline-flex;align-items:center;gap:2px}
.itin-tag-inc{background:#F0FDF4;color:#166534;border:1px solid #BBF7D0;border-radius:20px;padding:1px 6px;font-size:9px;font-weight:600;display:inline-flex;align-items:center;gap:2px}

.itin-act-footer{display:flex;align-items:center;justify-content:space-between;margin-top:2px}
.itin-rating{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--primary)}
.itin-act-btns{display:flex;gap:5px}
.itin-btn-sm{
  display:flex;align-items:center;gap:3px;
  padding:4px 9px;border-radius:7px;
  border:1px solid var(--border);background:var(--bg);
  color:var(--text);font-size:10px;font-weight:700;
  cursor:pointer;transition:all .15s;font-family:inherit;
}
.itin-btn-sm:hover{border-color:var(--primary);color:var(--primary)}
.itin-btn-sm.danger:hover{border-color:#DC2626;color:#DC2626}

/* ── DAY NAV ── */
.itin-day-nav{
  display:flex;justify-content:space-between;
  margin-top:18px;padding-top:18px;border-top:1px solid var(--border);
}

/* ── BOTTOM BAR ── */
.itin-bottom{
  position:sticky;bottom:0;
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 26px;
  background:var(--surface);border-top:1px solid var(--border);
  box-shadow:0 -4px 20px rgba(0,0,0,.06);
  flex-wrap:wrap;gap:10px;z-index:50;
}
.itin-total-lbl{font-size:10px;font-weight:700;color:var(--muted);margin-bottom:1px;text-transform:uppercase;letter-spacing:.05em}
.itin-total-amt{font-size:22px;font-weight:900;color:var(--navy)}
.itin-total-eur{font-size:13px;font-weight:600;color:var(--muted);margin-left:3px}
.itin-bottom-right{display:flex;align-items:center;gap:7px;flex-wrap:wrap}

/* ── OVERLAY / MODAL ── */
.itin-overlay{
  position:fixed;inset:0;background:rgba(5,19,40,.55);
  z-index:200;display:flex;align-items:center;justify-content:center;
  padding:20px;backdrop-filter:blur(3px);
}
.itin-modal{
  background:var(--surface);border-radius:var(--r-xl);
  width:100%;max-width:480px;max-height:85vh;
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 24px 64px rgba(5,51,102,.22);
}
.itin-modal-hdr{
  display:flex;justify-content:space-between;align-items:flex-start;
  padding:16px 18px;border-bottom:1px solid var(--border);flex-shrink:0;
}
.itin-modal-title{font-size:15px;font-weight:800;color:var(--navy)}
.itin-modal-sub{font-size:11px;color:var(--muted);margin-top:2px}
.itin-close-btn{
  background:var(--bg);border:1px solid var(--border);
  border-radius:8px;padding:5px;cursor:pointer;
  display:flex;align-items:center;transition:all .15s;
}
.itin-close-btn:hover{background:var(--border)}
.itin-modal-body{flex:1;overflow-y:auto;padding:14px}
.itin-modal-footer{padding:12px 18px;border-top:1px solid var(--border);display:flex;gap:7px;flex-shrink:0}

.itin-alt-item{
  display:flex;align-items:center;gap:11px;
  padding:10px 11px;border-radius:var(--r-md);
  cursor:pointer;transition:background .15s;border:1.5px solid transparent;
}
.itin-alt-item:hover{background:rgba(43,150,168,.06);border-color:rgba(43,150,168,.12)}
.itin-alt-thumb{
  width:50px;height:50px;border-radius:9px;flex-shrink:0;
  background:var(--bg);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.itin-alt-thumb img{width:100%;height:100%;object-fit:cover}
.itin-alt-name{font-size:12px;font-weight:700;color:var(--navy)}
.itin-alt-meta{display:flex;align-items:center;gap:8px;font-size:10px;color:var(--muted);margin-top:3px;font-weight:600}

.itin-exc-search{
  width:100%;padding:9px 12px;border-radius:var(--r-md);
  border:1.5px solid var(--border);background:var(--bg);
  font-size:12px;font-family:inherit;outline:none;
  transition:border-color .2s;margin-bottom:10px;
}
.itin-exc-search:focus{border-color:var(--primary)}

.itin-form-label{font-size:11px;font-weight:700;color:var(--navy);margin-bottom:5px;display:block}
.itin-form-input{
  width:100%;padding:8px 11px;border-radius:var(--r-md);
  border:1.5px solid var(--border);background:var(--bg);
  font-size:12px;font-family:inherit;outline:none;
  transition:border-color .2s;color:var(--navy);
}
.itin-form-input:focus{border-color:var(--primary)}
.itin-form-select{
  width:100%;padding:8px 11px;border-radius:var(--r-md);
  border:1.5px solid var(--border);background:var(--bg);
  font-size:12px;font-family:inherit;outline:none;color:var(--navy);cursor:pointer;
}
.itin-form-select:focus{border-color:var(--primary)}
.itin-form-row{margin-bottom:12px}

.itin-btn-modal-primary{
  flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
  padding:9px 18px;border-radius:50px;border:none;
  background:var(--primary);color:#fff;
  font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;
  box-shadow:0 6px 18px -4px rgba(43,150,168,.45);transition:all .2s;
}
.itin-btn-modal-primary:hover{transform:translateY(-1px)}
.itin-btn-modal-primary:disabled{background:#CBD5E1;box-shadow:none;cursor:not-allowed;transform:none}
.itin-btn-modal-cancel{
  display:flex;align-items:center;justify-content:center;gap:5px;
  padding:9px 16px;border-radius:50px;
  border:1.5px solid var(--border);background:var(--surface);
  color:var(--text);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .2s;
}
.itin-btn-modal-cancel:hover{border-color:var(--navy);color:var(--navy)}

.itin-no-alt{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:36px 20px;color:var(--muted);
}

/* ── SAVE STATUS PILLS ── */
.itin-save-ok   {font-size:11px;font-weight:700;color:#059669;padding:4px 10px;background:#ECFDF5;border:1px solid #6EE7B7;border-radius:20px}
.itin-save-err  {font-size:11px;font-weight:700;color:#DC2626;padding:4px 10px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:20px}
.itin-save-login{font-size:11px;font-weight:700;color:#D97706;padding:4px 10px;background:#FFFBEB;border:1px solid #FCD34D;border-radius:20px}

/* ── EMPTY STATE ── */
.itin-empty{
  text-align:center;padding:52px 20px;
  background:var(--surface);border-radius:var(--r-xl);
  border:1.5px dashed var(--border);margin-bottom:20px;
}
.itin-empty p{color:var(--muted);font-size:13px;margin-bottom:14px}

::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}

@media(max-width:768px){
  .itin-sidebar{display:none}
  .itin-content{padding:14px}
  .itin-hero{padding:18px 14px}
  .itin-nav{padding:0 12px}
  .itin-bottom{padding:10px 14px}
  .itin-act-img{width:86px}
}
`;

/* ── Save Button ── */
function SaveButton({ saving, saveStatus, onClick }: {
  saving: boolean; saveStatus: string; onClick: () => void;
}) {
  const cfg =
    saving || saveStatus === "saving" ? { cls: "", icon: <Bookmark size={13}/>, label: "Sauvegarde…" } :
    saveStatus === "ok"    ? { cls: "btn-save-ok",    icon: <CheckCircle size={13}/>, label: "Sauvegardé !" } :
    saveStatus === "error" ? { cls: "btn-save-err",   icon: <X size={13}/>, label: "Réessayer" } :
    saveStatus === "login" ? { cls: "btn-save-login", icon: <Bookmark size={13}/>, label: "Connectez-vous" } :
                             { cls: "", icon: <Bookmark size={13}/>, label: "Sauvegarder" };
  return (
    <button className={`btn btn-ghost ${cfg.cls}`} onClick={onClick}
      disabled={saving || saveStatus === "saving"}>
      {cfg.icon}{cfg.label}
    </button>
  );
}

/* ── ActivityCard ── */
// ✅ FIX : excursions passé en prop pour récupérer les vraies photos Supabase
function ActivityCard({ activity, onEdit, onRemove, excursions }: {
  activity: Activity;
  onEdit: () => void;
  onRemove: () => void;
  excursions: ExcursionData[];
  }) {
  // ✅ Recherche multicritère identique à extractItinerary
  const actName = (activity.name ?? "").toLowerCase().trim();
  const realExc =
    excursions.find(e => String(e.id) === String(activity.id)) ||
    excursions.find(e => e.title?.toLowerCase().trim() === actName) ||
    excursions.find(e => actName.includes(e.title?.toLowerCase().trim() ?? "___")) ||
    excursions.find(e => e.title?.toLowerCase().trim().includes(actName));

  // ✅ Photos : Supabase → activité → vide
  const supabasePhotos = parsePhotos(realExc?.photos);
  const activityPhotos = parsePhotos(activity.photos).filter(
    p => p.startsWith("http") || p.startsWith("/")
  );
  const photos = supabasePhotos.length > 0 ? supabasePhotos : activityPhotos;

  const languages  = parseList(activity.languages);
  const inclusions = parseList(activity.inclusion);
  const price      = activity.price || 0;
  const isFree     = price === 0;
  // 🔍 DEBUG TEMPORAIRE - à supprimer après fix
  // Dans ActivityCard, ajoutez juste après le calcul de photos :
console.log("📸 PHOTO URL:", photos[0]);
console.log("📸 SUPABASE RAW:", realExc?.photos);
console.log("📸 ACTIVITY RAW:", activity.photos);
console.log("🖼️ CARD:", {
  activityId: activity.id,
  activityName: activity.name,
  activityPhotos: activity.photos,
  realExcFound: realExc ? `✅ ${realExc.id} - ${realExc.title}` : "❌ NON TROUVÉ",
  supabasePhotos,
  finalPhotos: photos,
  photo0: photos[0] ?? "VIDE ❌",
});
  if (activity.is_free_day) {
    return (
      <div className="itin-act free-day">
        <div className="itin-act-body" style={{ padding: "14px 18px" }}>
          <div className="itin-act-top">
            <div className="itin-act-name free">{activity.name}</div>
            <span className="itin-price free">Gratuit</span>
          </div>
          {activity.description && <p className="itin-act-desc">{activity.description}</p>}
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
            <button className="itin-btn-sm danger" onClick={onRemove}>
              <X size={10}/> Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="itin-act">
      <div className="itin-act-img">
        {photos[0] ? (
          <img
            src={photos[0]}
            alt={activity.name}
            loading="lazy"
            onError={(e) => {
              // ✅ Si l'image casse, afficher le placeholder
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.parentElement as HTMLElement).innerHTML =
                `<div class="itin-act-img-ph"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg><span>Photo</span></div>`;
            }}
          />
        ) : (
          <div className="itin-act-img-ph">
            <Camera size={24} strokeWidth={1.5}/>
            <span>Photo</span>
          </div>
        )}
        {activity.time && (
          <div className="itin-act-time-tag"><Clock size={9}/>{activity.time}</div>
        )}
      </div>
      <div className="itin-act-body">
        <div className="itin-act-top">
          <div className="itin-act-name">{activity.name}</div>
          <span className={`itin-price${isFree ? " free" : ""}`}>
            {isFree ? "Inclus" : `${price} €`}
          </span>
        </div>
        <div className="itin-chips">
          {activity.duration && <span className="itin-chip"><Clock size={9} color="#2B96A8"/> {activity.duration}</span>}
          {activity.city     && <span className="itin-chip"><MapPin size={9} color="#2B96A8"/> {activity.city}</span>}
          {activity.max_people && <span className="itin-chip">Max {activity.max_people}</span>}
        </div>
        {activity.description && <p className="itin-act-desc">{activity.description}</p>}
        {(languages.length > 0 || inclusions.length > 0) && (
          <div className="itin-tags">
            {languages.slice(0, 2).map((l, i) => (
              <span key={i} className="itin-tag-lang"><Globe size={8}/> {l}</span>
            ))}
            {inclusions.slice(0, 3).map((inc, i) => (
              <span key={i} className="itin-tag-inc"><BadgeCheck size={8}/> {inc}</span>
            ))}
          </div>
        )}
        <div className="itin-act-footer">
          <div className="itin-rating">
            {activity.rating
              ? <><Star size={11} fill="#2B96A8" color="#2B96A8"/><span>{activity.rating}</span>
                  {activity.reviews_count && <span style={{fontWeight:400,color:"#94A3B8",fontSize:10}}>({activity.reviews_count})</span>}</>
              : <span style={{color:"#CBD5E1",fontSize:10}}>Non noté</span>
            }
          </div>
          <div className="itin-act-btns">
            <button className="itin-btn-sm" onClick={onEdit}><RefreshCw size={9}/> Changer</button>
            <button className="itin-btn-sm danger" onClick={onRemove}><X size={9}/> Retirer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ── AlternativePicker ── */
function AlternativePicker({ alternatives, currentName, onPick, onClose }: {
  alternatives: any[]; currentName: string;
  onPick: (alt: Activity) => void; onClose: () => void;
}) {
  return (
    <div className="itin-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="itin-modal">
        <div className="itin-modal-hdr">
          <div>
            <div className="itin-modal-title">Choisir une alternative</div>
            <div className="itin-modal-sub">Remplace « {currentName} »</div>
          </div>
          <button className="itin-close-btn" onClick={onClose}><X size={13} color="#6B7280"/></button>
        </div>
        {alternatives.length === 0
          ? <div className="itin-no-alt"><Camera size={28} strokeWidth={1.5} style={{opacity:.3,marginBottom:10}}/><p style={{fontSize:12}}>Aucune alternative disponible</p></div>
          : <div className="itin-modal-body">
              {alternatives.map(exc => (
                <div key={exc.id} className="itin-alt-item"
                  onClick={() => onPick({
                    id: exc.id,
                    name: exc.title,
                    city: exc.city,
                    price: exc.price_per_person || 0,
                    duration: exc.duration_hours ? `${exc.duration_hours}h` : "2h",
                    duration_hours: exc.duration_hours,
                    photos: exc.photos,
                    rating: exc.rating,
                    languages: exc.languages,
                    inclusion: exc.inclusions,
                    description: exc.description,
                  })}>
                  <div className="itin-alt-thumb">
                    {exc.photos?.[0]
                      ? <img src={exc.photos[0]} alt={exc.title}/>
                      : <Camera size={15} color="#CBD5E1"/>
                    }
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="itin-alt-name">{exc.title}</div>
                    <div className="itin-alt-meta">
                      {exc.price_per_person != null && <span>{exc.price_per_person} €</span>}
                      {exc.duration_hours && <span>{exc.duration_hours}h</span>}
                      {exc.rating && <span style={{display:"flex",alignItems:"center",gap:2}}><Star size={9} fill="#2B96A8" color="#2B96A8"/>{exc.rating}</span>}
                    </div>
                  </div>
                  <ArrowRight size={13} color="#2B96A8"/>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

/* ── AddExcursionModal ── */
function AddExcursionModal({ city, excursions, existingIds, slotKey, onAdd, onClose }: {
  city: string; excursions: ExcursionData[]; existingIds: string[];
  slotKey: "morning"|"afternoon"|"evening"; onAdd:(a:Activity)=>void; onClose:()=>void;
}) {
  const [search, setSearch] = useState("");
  const filtered = excursions.filter(e =>
    e.city === city && !existingIds.includes(e.id) &&
    (e.title.toLowerCase().includes(search.toLowerCase()) || (e.description||"").toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 20);

  return (
    <div className="itin-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="itin-modal">
        <div className="itin-modal-hdr">
          <div>
            <div className="itin-modal-title">Ajouter une excursion</div>
            <div className="itin-modal-sub">{city} · {slotKey==="morning"?"Matin":slotKey==="afternoon"?"Après-midi":"Soir"}</div>
          </div>
          <button className="itin-close-btn" onClick={onClose}><X size={13} color="#6B7280"/></button>
        </div>
        <div className="itin-modal-body">
          <input className="itin-exc-search" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
          {filtered.length === 0
            ? <div className="itin-no-alt"><Camera size={24} strokeWidth={1.5} style={{opacity:.3,marginBottom:10}}/><p style={{fontSize:12}}>{excursions.filter(e=>e.city===city).length===0?`Aucune excursion à ${city}`:"Aucun résultat"}</p></div>
            : filtered.map(exc => (
                <div key={exc.id} className="itin-alt-item"
                  onClick={() => onAdd({
                    id: exc.id,
                    name: exc.title,
                    city: exc.city,
                    price: exc.price_per_person || 0,
                    duration: exc.duration_hours ? `${exc.duration_hours}h` : "2h",
                    duration_hours: exc.duration_hours,
                    photos: exc.photos,
                    rating: exc.rating,
                    languages: exc.languages,
                    inclusion: exc.inclusions,
                    description: exc.description,
                    time: SLOT_DEFAULT_TIMES[slotKey],
                  })}>
                  <div className="itin-alt-thumb">
                    {exc.photos?.[0]
                      ? <img src={exc.photos[0]} alt={exc.title}/>
                      : <Camera size={15} color="#CBD5E1"/>
                    }
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="itin-alt-name">{exc.title}</div>
                    <div className="itin-alt-meta">
                      {exc.price_per_person!=null&&<span>{exc.price_per_person} €</span>}
                      {exc.duration_hours&&<span>{exc.duration_hours}h</span>}
                    </div>
                  </div>
                  <Plus size={13} color="#2B96A8"/>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

/* ── AddDayModal ── */
function AddDayModal({ cities, onAdd, onClose }: {
  cities:string[]; onAdd:(c:string,t:string,d:string)=>void; onClose:()=>void;
}) {
  const [city,setCity]   = useState(cities[0]||"");
  const [theme,setTheme] = useState("");
  const [date,setDate]   = useState("");
  return (
    <div className="itin-overlay" onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className="itin-modal" style={{maxWidth:400}}>
        <div className="itin-modal-hdr">
          <div>
            <div className="itin-modal-title">Ajouter un jour</div>
            <div className="itin-modal-sub">Configurer la nouvelle journée</div>
          </div>
          <button className="itin-close-btn" onClick={onClose}><X size={13} color="#6B7280"/></button>
        </div>
        <div className="itin-modal-body">
          <div className="itin-form-row">
            <label className="itin-form-label">Ville *</label>
            <select className="itin-form-select" value={city} onChange={e=>setCity(e.target.value)}>
              {cities.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="itin-form-row">
            <label className="itin-form-label">Thème (optionnel)</label>
            <input className="itin-form-input" placeholder="Ex: Culture & gastronomie…" value={theme} onChange={e=>setTheme(e.target.value)}/>
          </div>
          <div className="itin-form-row">
            <label className="itin-form-label">Date (optionnel)</label>
            <input className="itin-form-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
        </div>
        <div className="itin-modal-footer">
          <button className="itin-btn-modal-cancel" onClick={onClose}>Annuler</button>
          <button className="itin-btn-modal-primary" onClick={()=>{if(city){onAdd(city,theme||"Découverte",date);onClose();}}} disabled={!city}>
            <Plus size={13}/> Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════ */
export default function ItineraireDisplay({
  itinerary: initialItinerary,
  selectedCities,
  excursions,
  totalPrice: _initialTotalPrice,
  saving,
  saveStatus,
  onBack,
  onReset,
  onCheckout,
  onSave,
  onChangeActivity,
}: ItineraireDisplayProps) {
  const [itinerary,  setItinerary]  = useState(initialItinerary);
  const [activeDay,  setActiveDay]  = useState(0);
  const [editing,    setEditing]    = useState<{dayIdx:number;actIdx:number}|null>(null);
  const [addingExc,  setAddingExc]  = useState<{slotKey:"morning"|"afternoon"|"evening"}|null>(null);
  const [showAddDay, setShowAddDay] = useState(false);

  const currentDay = itinerary.days[activeDay];
  const totalActivities = itinerary.days.reduce((s,d)=>s+d.activities.length,0);
  const totalPrice = itinerary.days.reduce((acc,d)=>acc+d.activities.reduce((a,act)=>a+(Number(act.price)||0),0),0);
  const dayPrice = currentDay.activities.reduce((a,act)=>a+(Number(act.price)||0),0);

  function activitiesForSlot(slot:"morning"|"afternoon"|"evening") {
    const slotted = currentDay.activities.filter(a => getSlot(a.time)===slot);
    if (slot==="morning" && slotted.length===0)
      return currentDay.activities.filter(a => getSlot(a.time)==="unset");
    return slotted;
  }
  function slotTotal(slot:"morning"|"afternoon"|"evening") {
    return activitiesForSlot(slot).reduce((a,act)=>a+(Number(act.price)||0),0);
  }
  function globalIdx(act:Activity) {
    return currentDay.activities.findIndex(a=>a.id===act.id);
  }
  function getAlts() {
    if (!editing) return [];
    const day = itinerary.days[editing.dayIdx];
    const cur = day.activities[editing.actIdx];
    return excursions.filter(e=>e.city===day.city && e.id!==cur.id).slice(0,10);
  }

  const handleChange = (dayIdx:number, actIdx:number, alt:Activity) => {
    setItinerary(prev=>({...prev, days:prev.days.map((day,dIdx)=>dIdx!==dayIdx?day:{...day,activities:day.activities.map((act,aIdx)=>aIdx!==actIdx?act:alt)})}));
    onChangeActivity(dayIdx, actIdx, alt);
  };
  const handleRemove = (dayIdx:number, actIdx:number) => {
    setItinerary(prev=>({...prev, days:prev.days.map((day,dIdx)=>dIdx!==dayIdx?day:{...day,activities:day.activities.filter((_,aIdx)=>aIdx!==actIdx)})}));
  };
  const handleAddAct = (slotKey:"morning"|"afternoon"|"evening", act:Activity) => {
    setItinerary(prev=>({...prev, days:prev.days.map((day,dIdx)=>dIdx!==activeDay?day:{...day,activities:[...day.activities,act]})}));
    setAddingExc(null);
  };
  const handleAddDay = (city:string, theme:string, date:string) => {
    setItinerary(prev=>({...prev, days:[...prev.days,{day:prev.days.length+1,city,theme,date,activities:[]}]}));
    setActiveDay(itinerary.days.length);
  };

  const allCities = Array.from(new Set([...selectedCities,...itinerary.days.map(d=>d.city)]));

  return (
    <div suppressHydrationWarning className="itin-root">
      <style suppressHydrationWarning>{CSS}</style>

      {/* NAV */}
      <nav className="itin-nav">
        <div className="itin-nav-pill"><Sparkles size={10}/> Mode Assisté</div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <button className="btn btn-ghost" onClick={onReset}><RotateCcw size={13}/> Recommencer</button>
          <button className="btn btn-ghost" onClick={onBack}><ChevronLeft size={13}/> Modifier</button>
          <SaveButton saving={saving} saveStatus={saveStatus} onClick={onSave}/>
          {onCheckout && (
            <button className="btn btn-teal" onClick={onCheckout}>
              <TrendingUp size={13}/> Réserver
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="itin-hero">
        <div>
          <div className="itin-hero-ai"><Sparkles size={9}/> Généré par IA</div>
          <div className="itin-hero-title">{itinerary.title}</div>
          <div className="itin-hero-cities">
            {selectedCities.map((c,i)=>(
              <React.Fragment key={c}>
                {i>0&&<ArrowRight size={11} style={{opacity:.6}}/>}
                <span>{c}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="itin-hero-stats">
          {[
            {val:itinerary.days.length,lbl:"Jours"},
            {val:selectedCities.length,lbl:"Villes"},
            {val:totalActivities,lbl:"Activités"},
            {val:`${totalPrice.toLocaleString("fr-FR")} €`,lbl:"Budget"},
          ].map(s=>(
            <div key={s.lbl} className="itin-stat">
              <span className="itin-stat-val">{s.val}</span>
              <span className="itin-stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="itin-layout">
        {/* SIDEBAR */}
        <aside className="itin-sidebar">
          <div>
            <div className="itin-sec-label">Jours du voyage</div>
            {itinerary.days.map((day,idx)=>(
              <div key={idx} className={`itin-day-item${activeDay===idx?" active":""}`}
                onClick={()=>{setActiveDay(idx);setEditing(null);setAddingExc(null);}}>
                <div className="itin-day-num">{day.day}</div>
                <div>
                  <div className="itin-day-city">{day.city}</div>
                  {day.theme&&<div className="itin-day-sub">{day.theme}</div>}
                </div>
                <span className="itin-day-badge">{day.activities.length>0?`${day.activities.length} act.`:"—"}</span>
              </div>
            ))}
            <button className="itin-add-day" onClick={()=>setShowAddDay(true)}>
              <Plus size={12}/> Ajouter un jour
            </button>
          </div>
          <div className="itin-summary-box">
            <div className="itin-sec-label" style={{marginBottom:9}}>Récapitulatif</div>
            {[
              {icon:<Clock size={11}/>,key:"Durée",val:`${itinerary.days.length} jours`},
              {icon:<MapPin size={11}/>,key:"Villes",val:`${selectedCities.length} étapes`},
              {icon:<CheckCircle size={11}/>,key:"Activités",val:`${totalActivities} au total`},
            ].map(r=>(
              <div key={r.key} className="itin-sum-row">
                <span className="itin-sum-key">{r.icon}{r.key}</span>
                <span className="itin-sum-val">{r.val}</span>
              </div>
            ))}
            <div className="itin-sum-total">
              <span className="itin-sum-total-lbl">Budget estimé</span>
              <span className="itin-sum-total-val">{totalPrice.toLocaleString("fr-FR")} €</span>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="itin-content">
          <div className="itin-day-hdr">
            <div className="itin-day-icon"><Navigation size={19} color="#2B96A8"/></div>
            <div>
              <div className="itin-day-htitle">Jour {currentDay.day} — {currentDay.city}</div>
              <div className="itin-day-hsub">
                {currentDay.date||""}
                {currentDay.theme?` · ${currentDay.theme}`:""}
              </div>
            </div>
            <div className="itin-day-hbadge">
              <CheckCircle size={11}/>
              {currentDay.activities.length} activité{currentDay.activities.length!==1?"s":""}
              {dayPrice>0&&` · ${dayPrice} €`}
            </div>
          </div>

          {currentDay.activities.length === 0 ? (
            <div className="itin-empty">
              <Camera size={34} strokeWidth={1.5} color="#CBD5E1" style={{marginBottom:10}}/>
              <p>Aucune activité pour cette journée</p>
              <button className="btn btn-teal" style={{margin:"0 auto"}}
                onClick={()=>setAddingExc({slotKey:"morning"})}>
                <Plus size={13}/> Ajouter une activité
              </button>
            </div>
          ) : (
            SLOTS.map(({key,label,icon,color,bg,time})=>{
              const acts = activitiesForSlot(key);
              const sp = slotTotal(key);
              return (
                <div key={key} className="itin-slot">
                  <div className="itin-slot-head">
                    <div className="itin-slot-icon-wrap" style={{background:bg}}>
                      {React.cloneElement(icon as React.ReactElement, {color})}
                    </div>
                    <span className="itin-slot-label">{label}</span>
                    <span className="itin-slot-time">{time}</span>
                    {sp>0&&<span className="itin-slot-total">{sp} €</span>}
                  </div>
                  {acts.length===0
                    ? <div className="itin-slot-empty">Aucune activité — ajoutez-en une ci-dessous</div>
                    : acts.map(act=>(
                        // ✅ FIX : excursions passé à ActivityCard pour récupérer les vraies photos
                        <ActivityCard
                          key={act.id}
                          activity={act}
                          excursions={excursions}
                          onEdit={()=>setEditing({dayIdx:activeDay,actIdx:globalIdx(act)})}
                          onRemove={()=>handleRemove(activeDay,globalIdx(act))}
                        />
                      ))
                  }
                  <button className="itin-add-act" onClick={()=>setAddingExc({slotKey:key})}>
                    <Plus size={12}/> Ajouter au {label.toLowerCase()}
                  </button>
                </div>
              );
            })
          )}

          <div className="itin-day-nav">
            <button className="btn btn-ghost" disabled={activeDay===0} onClick={()=>setActiveDay(p=>p-1)}
              style={{opacity:activeDay===0?.35:1}}>
              <ChevronLeft size={13}/> Jour précédent
            </button>
            <button className="btn btn-ghost" disabled={activeDay===itinerary.days.length-1} onClick={()=>setActiveDay(p=>p+1)}
              style={{opacity:activeDay===itinerary.days.length-1?.35:1}}>
              Jour suivant <ChevronRight size={13}/>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="itin-bottom">
        <div>
          <div className="itin-total-lbl">Budget total estimé</div>
          <div className="itin-total-amt">
            {totalPrice.toLocaleString("fr-FR")}
            <span className="itin-total-eur">EUR</span>
          </div>
        </div>
        <div className="itin-bottom-right">
          {saveStatus==="ok"    && <span className="itin-save-ok">✓ Sauvegardé</span>}
          {saveStatus==="error" && <span className="itin-save-err">Erreur de sauvegarde</span>}
          {saveStatus==="login" && <span className="itin-save-login">Connectez-vous d'abord</span>}
          <button className="btn btn-ghost"><Download size={12}/> PDF</button>
          <button className="btn btn-ghost"><Share2 size={12}/> Partager</button>
          <SaveButton saving={saving} saveStatus={saveStatus} onClick={onSave}/>
          {onCheckout && (
            <button className="btn btn-teal" onClick={onCheckout}>
              <TrendingUp size={13}/> Réserver
            </button>
          )}
        </div>
      </div>

      {/* MODALS */}
      {editing && (
        <AlternativePicker
          alternatives={getAlts()}
          currentName={itinerary.days[editing.dayIdx].activities[editing.actIdx]?.name??""}
          onPick={alt=>{handleChange(editing.dayIdx,editing.actIdx,alt);setEditing(null);}}
          onClose={()=>setEditing(null)}/>
      )}
      {addingExc && (
        <AddExcursionModal city={currentDay.city} excursions={excursions}
          existingIds={currentDay.activities.map(a=>a.id)}
          slotKey={addingExc.slotKey}
          onAdd={act=>handleAddAct(addingExc.slotKey,act)}
          onClose={()=>setAddingExc(null)}/>
      )}
      {showAddDay && (
        <AddDayModal cities={allCities} onAdd={handleAddDay} onClose={()=>setShowAddDay(false)}/>
      )}
    </div>
  );
}