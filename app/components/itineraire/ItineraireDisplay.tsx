"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, Globe, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, RotateCcw, Star, Users, Sparkles, Navigation,
  ArrowRight, Camera, Heart, X, Plus, Info,
  BadgeCheck, Download, Share2, Bookmark,
} from "lucide-react";

/* ─── Types ─── */
type Activity = {
  id: string; name: string; description?: string; time?: string;
  duration?: string; price?: number; icon?: string;
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

type ItineraireDisplayProps = {
  itinerary: Itinerary;
  selectedCities: string[];
  selectedCats?: string[];
  categories?: { id: string; nom?: string; name?: string }[];
  excursions: {
    id: string; title: string; city: string;
    price_per_person?: number; duration_hours?: number;
    description?: string; categories?: string[];
    photos?: string[]; languages?: string[];
    inclusions?: string[]; rating?: number; reviews_count?: number;
  }[];
  totalPrice: number;
  saving: boolean;
  saveStatus: "idle" | "ok" | "error" | "login" | "saving";
  onBack: () => void;
  onReset: () => void;
  onCheckout: () => void;
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
  return parseList(val).filter(u => u.startsWith("http") || u.startsWith("/"));
}
function getSlot(time?: string): "morning" | "afternoon" | "evening" | "unset" {
  if (!time) return "unset";
  const h = parseInt(time.split(":")[0] ?? time.split("h")[0] ?? "0", 10);
  if (isNaN(h)) return "unset";
  if (h < 13) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

const SLOTS = [
  { key: "morning"   as const, label: "Matin",       time: "8h00 – 12h00" },
  { key: "afternoon" as const, label: "Après-midi",  time: "13h00 – 17h00" },
  { key: "evening"   as const, label: "Soir",        time: "18h00 – 22h00" },
];

/* ════════════════════════════════════════════
   CSS — tout en JS
════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --primary:#2B96A8; --title:#053366; --bg:#F6F9FB;
  --surface:#ffffff; --border:#E8EDF2; --border2:#D1D9E4;
  --text:#374151; --muted:#9CA3AF; --danger:#DC2626;
  --r-sm:8px; --r-md:12px; --r-lg:18px; --r-xl:24px;
}

.v2-root{
  min-height:100vh; background:var(--bg);
  font-family:'DM Sans',system-ui,sans-serif;
  display:flex; flex-direction:column;
}

/* ── NAV ── */
.v2-nav{
  position:sticky; top:0; z-index:100;
  display:flex; align-items:center; justify-content:space-between;
  padding:0 24px; height:56px;
  background:var(--surface); border-bottom:1px solid var(--border);
  box-shadow:0 1px 8px rgba(0,0,0,.05);
}
.v2-nav-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ── BUTTONS ── */
.v2-btn-ghost{
  display:flex;align-items:center;gap:5px;
  padding:7px 14px;border-radius:50px;
  border:1.5px solid var(--border);background:var(--surface);
  color:var(--text);font-size:13px;font-weight:600;font-family:inherit;
  cursor:pointer;transition:all .18s;white-space:nowrap;
}
.v2-btn-ghost:hover:not(:disabled){border-color:var(--title);color:var(--title)}
.v2-btn-ghost:disabled{opacity:.45;cursor:not-allowed}

.v2-btn-save{
  display:flex;align-items:center;gap:6px;
  padding:8px 18px;border-radius:50px;
  border:1.5px solid var(--border);background:var(--surface);
  color:var(--text);font-size:13px;font-weight:700;font-family:inherit;
  cursor:pointer;transition:all .2s;white-space:nowrap;
  box-shadow:0 2px 8px rgba(0,0,0,.06);
}
.v2-btn-save:hover:not(:disabled){border-color:var(--primary);color:var(--primary);background:rgba(43,150,168,.05)}
.v2-btn-save:disabled{opacity:.55;cursor:not-allowed}
.v2-btn-save.saved{border-color:#16a34a;color:#16a34a;background:#f0fdf4}
.v2-btn-save.error{border-color:var(--danger);color:var(--danger);background:#fef2f2}
.v2-btn-save.login{border-color:#d97706;color:#d97706;background:#fffbeb}

.v2-btn-teal{
  display:flex;align-items:center;gap:6px;
  padding:8px 20px;border-radius:50px;
  border:none;background:var(--primary);color:white;
  font-size:13px;font-weight:700;font-family:inherit;
  cursor:pointer;transition:all .2s;white-space:nowrap;
  box-shadow:0 6px 18px -4px rgba(43,150,168,.5);
}
.v2-btn-teal:hover{transform:translateY(-1px);box-shadow:0 8px 22px -4px rgba(43,150,168,.6)}
.v2-btn-teal:active{transform:none}

/* ── HERO ── */
.v2-hero{
  background:linear-gradient(135deg,var(--title) 0%,#0a5a8a 50%,var(--primary) 100%);
  padding:32px 28px 28px; color:white;
  display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:16px;
}
.v2-hero-pill{
  display:inline-flex;align-items:center;gap:5px;
  background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);
  border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;
  letter-spacing:.04em;margin-bottom:10px;
}
.v2-hero-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(20px,3vw,28px);font-weight:900;margin-bottom:4px;
}
.v2-hero-sub{font-size:14px;opacity:.75;display:flex;align-items:center;gap:5px}
.v2-hero-stats{display:flex;gap:18px;flex-wrap:wrap}
.v2-stat{display:flex;flex-direction:column;align-items:center;gap:2px;
  background:rgba(255,255,255,.12);border-radius:12px;padding:10px 16px}
.v2-stat-val{font-size:22px;font-weight:800}
.v2-stat-lbl{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.06em}

/* ── LAYOUT ── */
.v2-main{display:flex;flex:1;min-height:0;gap:0}

/* ── SIDEBAR ── */
.v2-sidebar{
  width:240px;flex-shrink:0;
  background:var(--surface);border-right:1px solid var(--border);
  padding:20px 14px;display:flex;flex-direction:column;gap:24px;
  overflow-y:auto;
}
.v2-section-label{font-size:10px;font-weight:800;text-transform:uppercase;
  letter-spacing:.08em;color:var(--muted);margin-bottom:8px}

.v2-dli{
  display:flex;align-items:center;gap:10px;
  padding:9px 10px;border-radius:var(--r-md);
  cursor:pointer;transition:all .15s;margin-bottom:3px;
}
.v2-dli:hover{background:#F0F9FB}
.v2-dli.active{background:rgba(43,150,168,.1);border-left:3px solid var(--primary)}
.v2-dli-num{
  width:26px;height:26px;border-radius:50%;
  background:var(--border);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:800;color:var(--title);
}
.v2-dli.active .v2-dli-num{background:var(--primary);color:white}
.v2-dli-city{font-size:13px;font-weight:700;color:var(--title)}
.v2-dli-sub{font-size:10px;color:var(--muted);margin-top:1px}
.v2-dli-badge{margin-left:auto;font-size:10px;font-weight:600;
  background:var(--bg);border:1px solid var(--border);
  padding:2px 7px;border-radius:10px;color:var(--muted);white-space:nowrap}

.v2-add-day{
  width:100%;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:8px;border-radius:var(--r-md);border:1.5px dashed var(--border2);
  background:transparent;color:var(--muted);font-size:12px;font-weight:600;
  font-family:inherit;cursor:pointer;transition:all .15s;
}
.v2-add-day:hover{border-color:var(--primary);color:var(--primary)}

.v2-summary{
  background:rgba(43,150,168,.05);border:1.5px solid rgba(43,150,168,.15);
  border-radius:var(--r-lg);padding:14px;margin-top:auto;
}
.v2-sum-row{display:flex;justify-content:space-between;align-items:center;
  padding:5px 0;border-bottom:1px solid rgba(43,150,168,.08)}
.v2-sum-key{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--muted)}
.v2-sum-val{font-size:12px;font-weight:700;color:var(--title)}
.v2-sum-total{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
.v2-sum-total-lbl{font-size:11px;font-weight:700;color:var(--primary)}
.v2-sum-total-val{font-size:16px;font-weight:800;color:var(--title)}

/* ── CONTENT ── */
.v2-content{flex:1;padding:24px 28px;overflow-y:auto;min-width:0}

.v2-day-hdr{
  display:flex;align-items:center;gap:14px;
  padding:16px 20px;background:var(--surface);
  border-radius:var(--r-xl);border:1px solid var(--border);
  box-shadow:0 2px 8px rgba(0,0,0,.04);margin-bottom:20px;
}
.v2-day-icon{
  width:44px;height:44px;border-radius:14px;flex-shrink:0;
  background:rgba(43,150,168,.1);display:flex;align-items:center;justify-content:center;
}
.v2-day-htitle{font-size:17px;font-weight:800;color:var(--title)}
.v2-day-hsub{font-size:12px;color:var(--muted);margin-top:2px}
.v2-day-hbadge{
  margin-left:auto;display:flex;align-items:center;gap:5px;
  font-size:12px;font-weight:600;color:var(--primary);
  background:rgba(43,150,168,.08);padding:5px 12px;border-radius:20px;white-space:nowrap;
}

/* ── SLOTS ── */
.v2-slot{margin-bottom:28px}
.v2-slot-head{
  display:flex;align-items:center;gap:8px;margin-bottom:12px;
}
.v2-slot-stripe{width:3px;height:18px;background:var(--primary);border-radius:2px}
.v2-slot-name{font-size:13px;font-weight:800;color:var(--title)}
.v2-slot-time{font-size:11px;color:var(--muted)}
.v2-slot-total{margin-left:auto;font-size:12px;font-weight:700;color:var(--primary)}
.v2-slot-empty{
  padding:14px 18px;border-radius:var(--r-md);
  border:1.5px dashed var(--border2);color:var(--muted);
  font-size:12px;text-align:center;margin-bottom:8px;
}
.v2-add-act{
  display:flex;align-items:center;gap:6px;
  padding:8px 14px;border-radius:var(--r-md);
  border:1.5px dashed var(--border2);background:transparent;
  color:var(--muted);font-size:12px;font-weight:600;
  font-family:inherit;cursor:pointer;transition:all .15s;margin-top:8px;
}
.v2-add-act:hover{border-color:var(--primary);color:var(--primary)}

/* ── ACTIVITY CARD ── */
.v2-act{
  display:flex;background:var(--surface);
  border-radius:var(--r-lg);border:1px solid var(--border);
  box-shadow:0 2px 10px rgba(0,0,0,.05);
  overflow:hidden;margin-bottom:12px;transition:box-shadow .2s;
}
.v2-act:hover{box-shadow:0 4px 18px rgba(0,0,0,.09)}
.v2-act.free-day{background:linear-gradient(135deg,rgba(43,150,168,.04),rgba(5,51,102,.03))}

.v2-act-img{
  width:110px;flex-shrink:0;position:relative;overflow:hidden;
  background:linear-gradient(135deg,#EFF6FF,#F0F9FF);
}
.v2-act-img img{width:100%;height:100%;object-fit:cover}
.v2-act-img-ph{
  width:100%;height:100%;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:6px;color:#CBD5E1;font-size:11px;
}
.v2-act-time-tag{
  position:absolute;bottom:6px;left:6px;
  display:flex;align-items:center;gap:3px;
  background:rgba(0,0,0,.6);color:white;
  padding:2px 7px;border-radius:8px;font-size:10px;font-weight:600;
}
.v2-act-body{flex:1;padding:14px 16px;display:flex;flex-direction:column;gap:7px;min-width:0}
.v2-act-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.v2-act-name{font-size:14px;font-weight:800;color:var(--title);line-height:1.3}
.v2-act-name.free{color:var(--primary)}
.v2-act-desc{font-size:12px;color:var(--muted);line-height:1.5;margin:0}

.v2-price{font-size:13px;font-weight:700;color:var(--title);white-space:nowrap}
.v2-price.free{color:#16a34a}

.v2-chips{display:flex;flex-wrap:wrap;gap:5px}
.v2-chip{
  display:inline-flex;align-items:center;gap:3px;
  background:#F3F8FE;border:1px solid #E0EEFA;
  border-radius:6px;padding:2px 7px;font-size:10px;font-weight:600;color:var(--title);
}

.v2-tags{display:flex;flex-wrap:wrap;gap:4px}
.v2-tag{
  display:inline-flex;align-items:center;gap:3px;
  padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600;
}
.v2-tag-lang{background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE}
.v2-tag-inc{background:#F0FDF4;color:#166534;border:1px solid #BBF7D0}

.v2-act-footer{display:flex;align-items:center;justify-content:space-between;margin-top:2px}
.v2-rating{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:var(--primary)}
.v2-act-btns{display:flex;gap:6px}
.v2-btn-sm{
  display:flex;align-items:center;gap:4px;
  padding:5px 10px;border-radius:8px;
  border:1px solid var(--border);background:var(--bg);
  color:var(--text);font-size:11px;font-weight:600;font-family:inherit;
  cursor:pointer;transition:all .15s;
}
.v2-btn-sm:hover{border-color:var(--primary);color:var(--primary)}

/* ── DAY NAV ── */
.v2-day-nav{display:flex;justify-content:space-between;margin-top:20px;padding-top:20px;border-top:1px solid var(--border)}

/* ── BOTTOM BAR ── */
.v2-bottom{
  position:sticky;bottom:0;
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 28px;
  background:var(--surface);border-top:1px solid var(--border);
  box-shadow:0 -4px 20px rgba(0,0,0,.07);
  flex-wrap:wrap;gap:12px;z-index:50;
}
.v2-total-lbl{font-size:11px;font-weight:600;color:var(--muted);margin-bottom:2px}
.v2-total-amt{font-size:22px;font-weight:900;color:var(--title)}
.v2-total-eur{font-size:14px;font-weight:600;color:var(--muted);margin-left:4px}
.v2-bottom-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ── SAVE STATUS INLINE ── */
.v2-save-ok   {font-size:12px;font-weight:700;color:#16a34a;padding:5px 12px;
  background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px}
.v2-save-err  {font-size:12px;font-weight:700;color:var(--danger);padding:5px 12px;
  background:#fef2f2;border:1px solid #fecaca;border-radius:20px}
.v2-save-login{font-size:12px;font-weight:700;color:#d97706;padding:5px 12px;
  background:#fffbeb;border:1px solid #fed7aa;border-radius:20px}

/* ── TOAST ── */
.v2-toast{
  position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:8px;
  padding:12px 22px;border-radius:14px;
  font-size:13px;font-weight:700;font-family:'DM Sans',system-ui,sans-serif;
  z-index:9999;pointer-events:none;white-space:nowrap;
  box-shadow:0 8px 32px rgba(0,0,0,.2);
  animation:v2toastIn .3s cubic-bezier(.22,.68,0,1.2) both;
}
@keyframes v2toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.v2-toast.saving{background:#0c1a2e;color:#bae6fd}
.v2-toast.ok    {background:#052e16;color:#bbf7d0}
.v2-toast.error {background:#450a0a;color:#fecaca}
.v2-toast.login {background:#1e293b;color:#e2e8f0}

/* ── OVERLAY / ALT PICKER ── */
.v2-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.5);
  z-index:200;display:flex;align-items:center;justify-content:center;
  padding:20px;backdrop-filter:blur(4px);
}
.v2-alt-box{
  background:var(--surface);border-radius:var(--r-xl);
  width:100%;max-width:480px;max-height:80vh;
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 24px 60px rgba(0,0,0,.2);
}
.v2-alt-hdr{
  display:flex;justify-content:space-between;align-items:flex-start;
  padding:18px 20px;border-bottom:1px solid var(--border);
}
.v2-alt-title{font-size:16px;font-weight:800;color:var(--title)}
.v2-alt-sub{font-size:12px;color:var(--muted);margin-top:2px}
.v2-close{
  background:var(--bg);border:1px solid var(--border);
  border-radius:8px;padding:6px;cursor:pointer;
  display:flex;align-items:center;transition:all .15s;
}
.v2-close:hover{background:var(--border)}
.v2-alt-list{flex:1;overflow-y:auto;padding:12px}
.v2-no-alt{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:40px 20px;color:var(--muted)}
.v2-alt-item{
  display:flex;align-items:center;gap:12px;
  padding:11px 12px;border-radius:var(--r-md);
  cursor:pointer;transition:background .15s;
}
.v2-alt-item:hover{background:rgba(43,150,168,.07)}
.v2-alt-thumb{
  width:52px;height:52px;border-radius:10px;flex-shrink:0;
  background:var(--bg);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.v2-alt-thumb img{width:100%;height:100%;object-fit:cover}
.v2-alt-name{font-size:13px;font-weight:700;color:var(--title)}
.v2-alt-meta{display:flex;align-items:center;gap:10px;font-size:11px;
  color:var(--muted);margin-top:3px;font-weight:600}

::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}

@media(max-width:768px){
  .v2-sidebar{display:none}
  .v2-content{padding:16px}
  .v2-hero{padding:20px 16px}
  .v2-nav{padding:0 14px}
  .v2-nav-actions{gap:5px}
  .v2-btn-ghost,.v2-btn-save,.v2-btn-teal{padding:6px 11px;font-size:12px}
  .v2-bottom{padding:12px 16px}
  .v2-toast{font-size:12px;padding:10px 16px;bottom:76px;max-width:calc(100vw - 32px);white-space:normal}
}
`;

/* ════════════════════════════════════════════
   Toast
════════════════════════════════════════════ */
function Toast({ status }: { status: "idle"|"ok"|"error"|"login"|"saving" }) {
  if (status === "idle") return null;
  const cfg = {
    saving: { icon: "⏳", msg: "Sauvegarde en cours…" },
    ok:     { icon: "✅", msg: "Itinéraire sauvegardé !" },
    error:  { icon: "❌", msg: "Erreur de sauvegarde. Réessayez." },
    login:  { icon: "🔐", msg: "Connectez-vous pour sauvegarder." },
  }[status];
  return (
    <div className={`v2-toast ${status}`}>
      <span>{cfg.icon}</span><span>{cfg.msg}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   ActivityCard
════════════════════════════════════════════ */
function ActivityCard({ activity, onEdit }: { activity: Activity; onEdit: () => void }) {
  const photos     = parsePhotos(activity.photos);
  const languages  = parseList(activity.languages);
  const inclusions = parseList(activity.inclusion);
  const price      = activity.price || 0;
  const isFree     = price === 0;
  const photo      = photos[0];

  if (activity.is_free_day) {
    return (
      <div className="v2-act free-day">
        <div className="v2-act-body" style={{ padding: "16px 20px" }}>
          <div className="v2-act-top">
            <div className="v2-act-name free">{activity.name}</div>
            <span className="v2-price free">Gratuit</span>
          </div>
          {activity.description && <p className="v2-act-desc">{activity.description}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="v2-act">
      <div className="v2-act-img">
        {photo
          ? <img src={photo} alt={activity.name} loading="lazy" />
          : <div className="v2-act-img-ph"><Camera size={26} strokeWidth={1.5} /><span>Photo</span></div>
        }
        {activity.time && (
          <div className="v2-act-time-tag"><Clock size={10} />{activity.time}</div>
        )}
      </div>
      <div className="v2-act-body">
        <div className="v2-act-top">
          <div className="v2-act-name">{activity.name}</div>
          <span className={`v2-price${isFree ? " free" : ""}`}>
            {isFree ? "Inclus" : `${price} EUR`}
          </span>
        </div>
        <div className="v2-chips">
          {activity.duration && <span className="v2-chip"><Clock size={10} color="#2B96A8" /> {activity.duration}</span>}
          {activity.city     && <span className="v2-chip"><MapPin size={10} color="#2B96A8" /> {activity.city}</span>}
          {activity.max_people && <span className="v2-chip"><Users size={10} /> Max {activity.max_people}</span>}
        </div>
        {activity.description && <p className="v2-act-desc">{activity.description}</p>}
        {(languages.length > 0 || inclusions.length > 0) && (
          <div className="v2-tags">
            {languages.slice(0, 2).map((l, i) => (
              <span key={i} className="v2-tag v2-tag-lang"><Globe size={9} /> {l}</span>
            ))}
            {inclusions.slice(0, 3).map((inc, i) => (
              <span key={i} className="v2-tag v2-tag-inc"><BadgeCheck size={9} /> {inc}</span>
            ))}
          </div>
        )}
        <div className="v2-act-footer">
          <div className="v2-rating">
            {activity.rating
              ? (<><Star size={12} fill="#2B96A8" color="#2B96A8" /><span>{activity.rating}</span>
                  {activity.reviews_count && (
                    <span style={{ fontWeight:400, color:"#94A3B8", fontSize:11 }}>
                      ({activity.reviews_count} avis)
                    </span>
                  )}</>)
              : <span style={{ color:"#CBD5E1", fontSize:11 }}>Pas encore noté</span>
            }
          </div>
          <div className="v2-act-btns">
            <button className="v2-btn-sm"><Info size={10} /> Détails</button>
            <button className="v2-btn-sm" onClick={onEdit}><RefreshCw size={10} /> Changer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   AlternativePicker
════════════════════════════════════════════ */
function AlternativePicker({ alternatives, currentName, onPick, onClose }: {
  alternatives: {
    id: string; title: string; city: string;
    price_per_person?: number; duration_hours?: number;
    photos?: string[]; rating?: number;
  }[];
  currentName: string;
  onPick: (alt: Activity) => void;
  onClose: () => void;
}) {
  return (
    <div className="v2-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="v2-alt-box">
        <div className="v2-alt-hdr">
          <div>
            <div className="v2-alt-title">Choisir une alternative</div>
            <div className="v2-alt-sub">Remplace « {currentName} »</div>
          </div>
          <button className="v2-close" onClick={onClose}><X size={14} color="#6B7280" /></button>
        </div>
        {alternatives.length === 0
          ? (
            <div className="v2-no-alt">
              <Camera size={30} strokeWidth={1.5} style={{ opacity:.3, marginBottom:10 }} />
              <p style={{ fontSize:13 }}>Aucune alternative dans cette ville</p>
            </div>
          ) : (
            <div className="v2-alt-list">
              {alternatives.map(exc => (
                <div key={exc.id} className="v2-alt-item"
                  onClick={() => onPick({
                    id: exc.id, name: exc.title, city: exc.city,
                    price: exc.price_per_person || 0,
                    duration: exc.duration_hours ? `${exc.duration_hours}h` : "2h",
                    photos: exc.photos, rating: exc.rating,
                  })}>
                  <div className="v2-alt-thumb">
                    {exc.photos?.[0]
                      ? <img src={exc.photos[0]} alt={exc.title} />
                      : <Camera size={16} color="#CBD5E1" />
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="v2-alt-name">{exc.title}</div>
                    <div className="v2-alt-meta">
                      {exc.price_per_person != null && <span>{exc.price_per_person} EUR</span>}
                      {exc.duration_hours   && <span>{exc.duration_hours}h</span>}
                      {exc.rating           && (
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <Star size={9} fill="#2B96A8" color="#2B96A8" /> {exc.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} color="#2B96A8" />
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SAVE BUTTON
════════════════════════════════════════════ */
function SaveButton({ saving, saveStatus, onClick }: {
  saving: boolean;
  saveStatus: "idle"|"ok"|"error"|"login"|"saving";
  onClick: () => void;
}) {
  const cfg = saving || saveStatus === "saving"
    ? { cls: "",       icon: <Bookmark size={13} />, label: "Sauvegarde…" }
    : saveStatus === "ok"
    ? { cls: "saved",  icon: <CheckCircle size={13} />, label: "Sauvegardé !" }
    : saveStatus === "error"
    ? { cls: "error",  icon: <X size={13} />, label: "Réessayer" }
    : saveStatus === "login"
    ? { cls: "login",  icon: <Bookmark size={13} />, label: "Connectez-vous" }
    : { cls: "",       icon: <Bookmark size={13} />, label: "Sauvegarder" };

  return (
    <button
      className={`v2-btn-save${cfg.cls ? " " + cfg.cls : ""}`}
      onClick={onClick}
      disabled={saving || saveStatus === "saving"}
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
}

/* ════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════ */
export default function ItineraireDisplay({
  itinerary, selectedCities, excursions, totalPrice,
  saving, saveStatus, onBack, onReset, onCheckout, onSave, onChangeActivity,
}: ItineraireDisplayProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [editing,   setEditing]   = useState<{ dayIdx: number; actIdx: number } | null>(null);

  const currentDay       = itinerary.days[activeDay];
  const totalActivities  = itinerary.days.reduce((s, d) => s + d.activities.length, 0);
  const dayPrice         = currentDay.activities.reduce((a, act) => a + (Number(act.price) || 0), 0);

  function activitiesForSlot(slot: "morning" | "afternoon" | "evening") {
    const slotted = currentDay.activities.filter(a => getSlot(a.time) === slot);
    if (slot === "morning" && slotted.length === 0)
      return currentDay.activities.filter(a => getSlot(a.time) === "unset");
    return slotted;
  }
  function slotTotal(slot: "morning" | "afternoon" | "evening") {
    return activitiesForSlot(slot).reduce((a, act) => a + (Number(act.price) || 0), 0);
  }
  function globalIdx(act: Activity) {
    return currentDay.activities.findIndex(a => a.id === act.id);
  }
  const getAlternatives = () => {
    if (!editing) return [];
    const day = itinerary.days[editing.dayIdx];
    const cur = day.activities[editing.actIdx];
    return excursions.filter(e => e.city === day.city && e.id !== cur.id).slice(0, 8);
  };

  const toastStatus: "idle"|"ok"|"error"|"login"|"saving" =
    saving ? "saving" : saveStatus;

  return (
    <div suppressHydrationWarning className="v2-root">
      <style suppressHydrationWarning>{CSS}</style>

      <Toast status={toastStatus} />

      <nav className="v2-nav">
        <div className="v2-logo" />
        <div className="v2-nav-actions">
          <button className="v2-btn-ghost" onClick={onReset}>
            <RotateCcw size={13} /> Recommencer
          </button>
          <button className="v2-btn-ghost" onClick={onBack}>
            <ChevronLeft size={13} /> Modifier
          </button>
          <SaveButton saving={saving} saveStatus={saveStatus} onClick={onSave} />
          <button className="v2-btn-teal" onClick={onCheckout}>
            <Heart size={13} /> Réserver
          </button>
        </div>
      </nav>

      <div className="v2-hero">
        <div>
          <div className="v2-hero-pill"><Sparkles size={10} /> Généré par IA</div>
          <div className="v2-hero-title">{itinerary.title}</div>
          <div className="v2-hero-sub">{selectedCities.join(" → ")}</div>
        </div>
        <div className="v2-hero-stats">
          <div className="v2-stat"><span className="v2-stat-val">{itinerary.days.length}</span><span className="v2-stat-lbl">Jours</span></div>
          <div className="v2-stat"><span className="v2-stat-val">{selectedCities.length}</span><span className="v2-stat-lbl">Villes</span></div>
          <div className="v2-stat"><span className="v2-stat-val">{totalActivities}</span><span className="v2-stat-lbl">Activités</span></div>
          <div className="v2-stat"><span className="v2-stat-val">{totalPrice.toLocaleString("fr-FR")}</span><span className="v2-stat-lbl">EUR total</span></div>
        </div>
      </div>

      <div className="v2-main">
        <aside className="v2-sidebar">
          <div>
            <div className="v2-section-label">Jours du voyage</div>
            {itinerary.days.map((day, idx) => (
              <div key={idx}
                className={`v2-dli${activeDay === idx ? " active" : ""}`}
                onClick={() => { setActiveDay(idx); setEditing(null); }}>
                <div className="v2-dli-num">{day.day}</div>
                <div className="v2-dli-info">
                  <div className="v2-dli-city">{day.city}</div>
                  {day.theme && <div className="v2-dli-sub">{day.theme}</div>}
                </div>
                <span className="v2-dli-badge">
                  {day.activities.length > 0 ? `${day.activities.length} act.` : "—"}
                </span>
              </div>
            ))}
            <button className="v2-add-day" style={{ marginTop:8 }}>
              <Plus size={13} /> Ajouter un jour
            </button>
          </div>

          <div className="v2-summary">
            <div className="v2-section-label" style={{ marginBottom:10 }}>Récapitulatif</div>
            <div className="v2-sum-row"><span className="v2-sum-key"><Clock size={12}/> Durée</span><span className="v2-sum-val">{itinerary.days.length} jours</span></div>
            <div className="v2-sum-row"><span className="v2-sum-key"><MapPin size={12}/> Villes</span><span className="v2-sum-val">{selectedCities.length} étapes</span></div>
            <div className="v2-sum-row"><span className="v2-sum-key"><CheckCircle size={12}/> Activités</span><span className="v2-sum-val">{totalActivities} au total</span></div>
            <div className="v2-sum-total">
              <span className="v2-sum-total-lbl">Budget estimé</span>
              <span className="v2-sum-total-val">{totalPrice.toLocaleString("fr-FR")} EUR</span>
            </div>
          </div>
        </aside>

        <div className="v2-content">
          <div className="v2-day-hdr">
            <div className="v2-day-icon"><Navigation size={20} color="#2B96A8" /></div>
            <div>
              <div className="v2-day-htitle">Jour {currentDay.day} — {currentDay.city}</div>
              <div className="v2-day-hsub">
                {currentDay.date || ""}
                {currentDay.theme ? ` · ${currentDay.theme}` : ""}
              </div>
            </div>
            <div className="v2-day-hbadge">
              <CheckCircle size={12} />
              {currentDay.activities.length} activité{currentDay.activities.length !== 1 ? "s" : ""}
              {dayPrice > 0 && ` · ${dayPrice} EUR`}
            </div>
          </div>

          {currentDay.activities.length === 0 ? (
            <div style={{
              textAlign:"center", padding:"60px 20px",
              background:"var(--surface)", borderRadius:"var(--r-lg)",
              border:"1.5px dashed var(--border2)",
            }}>
              <Camera size={36} strokeWidth={1.5} color="#CBD5E1" style={{ marginBottom:12 }} />
              <p style={{ color:"#94A3B8", fontSize:14 }}>Aucune activité pour cette journée</p>
            </div>
          ) : (
            SLOTS.map(({ key, label, time }) => {
              const acts = activitiesForSlot(key);
              const sp   = slotTotal(key);
              return (
                <div key={key} className="v2-slot">
                  <div className="v2-slot-head">
                    <div className="v2-slot-stripe" />
                    <span className="v2-slot-name">{label}</span>
                    <span className="v2-slot-time">{time}</span>
                    {sp > 0 && <span className="v2-slot-total">{sp} EUR</span>}
                  </div>
                  {acts.length === 0 ? (
                    <div className="v2-slot-empty">Aucune activité — ajoutez-en une ci-dessous</div>
                  ) : (
                    acts.map(act => (
                      <ActivityCard
                        key={act.id}
                        activity={act}
                        onEdit={() => setEditing({ dayIdx: activeDay, actIdx: globalIdx(act) })}
                      />
                    ))
                  )}
                  <button className="v2-add-act">
                    <Plus size={13} /> Ajouter une activité au {label.toLowerCase()}
                  </button>
                </div>
              );
            })
          )}

          <div className="v2-day-nav">
            <button className="v2-btn-ghost"
              disabled={activeDay === 0}
              onClick={() => setActiveDay(p => p - 1)}
              style={{ opacity: activeDay === 0 ? .35 : 1 }}>
              <ChevronLeft size={14} /> Jour précédent
            </button>
            <button className="v2-btn-ghost"
              disabled={activeDay === itinerary.days.length - 1}
              onClick={() => setActiveDay(p => p + 1)}
              style={{ opacity: activeDay === itinerary.days.length - 1 ? .35 : 1 }}>
              Jour suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="v2-bottom">
        <div>
          <div className="v2-total-lbl">Budget total estimé</div>
          <div className="v2-total-amt">
            {totalPrice.toLocaleString("fr-FR")}
            <span className="v2-total-eur">EUR</span>
          </div>
        </div>
        <div className="v2-bottom-right">
          {saveStatus === "ok"    && <span className="v2-save-ok">✓ Sauvegardé</span>}
          {saveStatus === "error" && <span className="v2-save-err">Erreur de sauvegarde</span>}
          {saveStatus === "login" && <span className="v2-save-login">Connectez-vous d'abord</span>}

          <button className="v2-btn-ghost">
            <Download size={13} /> PDF
          </button>
          <button className="v2-btn-ghost">
            <Share2 size={13} /> Partager
          </button>

          <SaveButton saving={saving} saveStatus={saveStatus} onClick={onSave} />

          <button className="v2-btn-teal" onClick={onCheckout}>
            <Heart size={13} /> Réserver l&apos;itinéraire
          </button>
        </div>
      </div>

      {editing && (
        <AlternativePicker
          alternatives={getAlternatives()}
          currentName={itinerary.days[editing.dayIdx].activities[editing.actIdx]?.name ?? ""}
          onPick={alt => { onChangeActivity(editing.dayIdx, editing.actIdx, alt); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}