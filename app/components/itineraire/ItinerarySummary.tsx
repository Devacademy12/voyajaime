"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, Edit3, Send, Bookmark, Layers, Euro,
  Calendar, MapPin, Clock, Star, FileText, Navigation,
  CreditCard, RefreshCw, CheckCircle, TrendingUp,
  Sparkles, Download, Share2, X, ChevronRight,
  Sunrise, Sun, Moon,
} from "lucide-react";
import CheckoutModalItineraire from "@/app/components/itineraire/Checkoutmodalitineraire";
import TouristeNav from "@/app/components/touriste/TouristeNav";


/* ─── Types ─────────────────────────────────────────────── */
export type SummaryActivity = {
  id: string;
  excursion_id?: string;        // ← UUID Supabase de l'excursion
  time: string;
  customTime?: string;
  note?: string;
  excursion?: {
    id?: string;                // ← UUID Supabase si disponible
    excursion_id?: string;      // ← alias possible
    title: string;
    city: string;
    price_per_person: number;
    duration_hours: number;
    rating?: number;
    photos?: string[];
    categories?: string[];
    available_dates?: any[] | null;
    description?: string;
  };
  name?: string;
  description?: string;
  price?: number;
  duration?: string;
  photos?: string | string[];
  city?: string;
  rating?: number;
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

/* ─── UUID helper ─── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (s?: string | null): s is string => !!s && UUID_RE.test(s);

/**
 * Résout le vrai UUID Supabase d'une activité.
 * Ordre de priorité :
 *   1. act.excursion_id   (champ dédié le plus fiable)
 *   2. act.excursion.id   (UUID stocké dans l'objet excursion)
 *   3. act.excursion.excursion_id
 *   4. act.id             (seulement si c'est un UUID valide)
 * Retourne null si aucun UUID valide trouvé.
 */
function resolveActivityUUID(act: SummaryActivity): string | null {
  if (isValidUUID(act.excursion_id))           return act.excursion_id!;
  if (isValidUUID(act.excursion?.id))          return act.excursion!.id!;
  if (isValidUUID(act.excursion?.excursion_id)) return act.excursion!.excursion_id!;
  if (isValidUUID(act.id))                     return act.id;
  return null;
}

/* ─── Helpers ─── */
const SLOT_COLORS: Record<string, string> = { matin:"#F59E0B", aprem:"#2B96A8", soir:"#8B5CF6" };
const SLOT_BG: Record<string, string> = { matin:"rgba(245,158,11,.10)", aprem:"rgba(43,150,168,.10)", soir:"rgba(139,92,246,.10)" };
const SLOT_ICONS: Record<string, React.ReactNode> = { matin:<Sunrise size={13}/>, aprem:<Sun size={13}/>, soir:<Moon size={13}/> };
const SLOT_TIMES: Record<string, string> = { matin:"09:00", aprem:"13:00", soir:"19:00" };

function getTitle(act: SummaryActivity): string { return act.excursion?.title ?? act.name ?? "—"; }
function getCity(act: SummaryActivity): string { return act.excursion?.city ?? act.city ?? ""; }
function getDuration(act: SummaryActivity): string {
  if (act.excursion?.duration_hours) return `${act.excursion.duration_hours}h`;
  return act.duration ?? "";
}
function getPrice(act: SummaryActivity): number { return act.excursion?.price_per_person ?? act.price ?? 0; }
function getRating(act: SummaryActivity): number { return act.excursion?.rating ?? act.rating ?? 0; }
function getPhotos(act: SummaryActivity): string[] {
  const p = act.excursion?.photos ?? act.photos;
  if (!p) return [];
  return Array.isArray(p) ? p : [p];
}
function getDescription(act: SummaryActivity): string { return act.excursion?.description ?? act.description ?? ""; }

/* ════════════════════════════════════════════
   CSS — SAME TOKENS AS ItineraireDisplay
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
  --r-md:10px;
  --r-lg:16px;
  --r-xl:22px;
  --shadow-sm:0 1px 4px rgba(5,51,102,.06);
  --shadow-md:0 4px 16px rgba(5,51,102,.10);
}

.sum-root{
  min-height:100vh; background:var(--bg);
  font-family:'DM Sans',system-ui,sans-serif; color:var(--text);
  display:flex; flex-direction:column;
}

/* ── TOP NAV ── */
.sum-nav{
  position:sticky; top:0; z-index:100;
  display:flex; align-items:center; gap:10px;
  padding:0 24px; height:54px;
  background:var(--surface); border-bottom:1px solid var(--border);
  box-shadow:var(--shadow-sm);
}
.sum-nav-brand{
  display:flex; align-items:center; gap:7px; margin-right:auto;
  font-size:13px; font-weight:800; color:var(--navy); letter-spacing:-.01em;
}
.sum-nav-brand-dot{width:8px;height:8px;border-radius:50%;background:var(--primary)}
.sum-nav-pill{
  display:flex; align-items:center; gap:5px;
  padding:3px 10px; border-radius:20px;
  background:rgba(43,150,168,.09); color:var(--primary);
  font-size:11px; font-weight:700; letter-spacing:.04em;
}

/* ── BUTTONS ── */
.btn{
  display:inline-flex; align-items:center; gap:6px;
  padding:7px 14px; border-radius:50px;
  font-size:12.5px; font-weight:700; cursor:pointer;
  font-family:inherit; transition:all .18s; white-space:nowrap;
  border:1.5px solid transparent;
}
.btn-ghost{background:var(--surface);color:var(--text);border-color:var(--border)}
.btn-ghost:hover{border-color:var(--navy);color:var(--navy)}
.btn-ghost:disabled{opacity:.4;cursor:not-allowed}
.btn-primary{background:var(--navy);color:#fff;border-color:var(--navy);box-shadow:0 6px 18px -4px rgba(5,51,102,.35)}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px -4px rgba(5,51,102,.45)}
.btn-primary:disabled{background:#CBD5E1;border-color:#CBD5E1;color:#94A3B8;box-shadow:none;cursor:not-allowed}
.btn-teal{background:var(--primary);color:#fff;border-color:var(--primary);box-shadow:0 6px 18px -4px rgba(43,150,168,.40)}
.btn-teal:hover{transform:translateY(-1px)}
.btn-green{background:#059669;color:#fff;border-color:#059669}

/* ── HERO ── */
.sum-hero{
  background:linear-gradient(135deg,var(--navy) 0%,#0b4a7a 55%,var(--primary) 100%);
  padding:28px 32px 24px; color:#fff;
  display:flex; align-items:flex-end; justify-content:space-between;
  flex-wrap:wrap; gap:16px;
}
.sum-hero-pill{
  display:inline-flex; align-items:center; gap:5px;
  background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.2);
  border-radius:20px; padding:3px 11px;
  font-size:10px; font-weight:700; letter-spacing:.05em; margin-bottom:8px;
}
.sum-hero-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(18px,2.5vw,26px); font-weight:900; margin-bottom:4px; line-height:1.2;
}
.sum-hero-cities{font-size:13px;opacity:.75;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.sum-hero-stats{display:flex;gap:12px;flex-wrap:wrap}
.sum-stat{
  display:flex;flex-direction:column;align-items:center;
  background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.1);
  border-radius:12px;padding:9px 16px;min-width:72px;text-align:center;
}
.sum-stat-val{font-size:20px;font-weight:800;line-height:1}
.sum-stat-lbl{font-size:9px;opacity:.7;text-transform:uppercase;letter-spacing:.07em;margin-top:3px}

/* ── LAYOUT ── */
.sum-layout{display:flex;flex:1;min-height:0;align-items:start}

/* ── SIDEBAR ── */
.sum-sidebar{
  width:260px;flex-shrink:0;
  background:var(--surface);border-right:1px solid var(--border);
  padding:20px 16px;display:flex;flex-direction:column;gap:18px;
  position:sticky;top:54px;height:calc(100vh - 54px);overflow-y:auto;
}
.sum-sidebar-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:8px}
.sum-kpi{
  display:flex;align-items:center;gap:11px;
  padding:10px 12px;border-radius:var(--r-md);
  background:var(--bg);border:1px solid var(--border);margin-bottom:7px;
}
.sum-kpi-icon{
  width:34px;height:34px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.sum-kpi-lbl{font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.02em}
.sum-kpi-val{font-size:15px;font-weight:800;margin-top:1px}
.sum-sidebar-ctas{display:flex;flex-direction:column;gap:7px;margin-top:auto}

/* ── SCROLL AREA ── */
.sum-scroll{flex:1;padding:22px 26px;overflow-y:auto}

/* ── DAY CARD ── */
.sum-day-card{
  background:var(--surface);border-radius:var(--r-xl);overflow:hidden;
  border:1px solid var(--border);box-shadow:var(--shadow-sm);
  margin-bottom:16px;transition:box-shadow .2s;
}
.sum-day-card:hover{box-shadow:var(--shadow-md)}
.sum-day-hdr{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 18px;border-bottom:1px solid var(--border);
  background:linear-gradient(135deg,var(--bg) 0%,var(--surface) 100%);
}
.sum-day-left{display:flex;align-items:center;gap:11px}
.sum-day-num{
  width:36px;height:36px;border-radius:50%;flex-shrink:0;
  background:var(--primary);color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:800;
}
.sum-day-title{font-size:15px;font-weight:800;color:var(--navy)}
.sum-day-theme{font-size:12px;color:var(--muted);margin-top:2px}
.sum-day-city{
  display:flex;align-items:center;gap:4px;
  font-size:11px;color:var(--muted);margin-top:2px;
}
.sum-day-badge{
  display:flex;align-items:center;gap:5px;
  background:rgba(43,150,168,.08);border:1px solid rgba(43,150,168,.15);
  border-radius:20px;padding:5px 11px;
  font-size:11px;color:var(--primary);font-weight:700;flex-shrink:0;
}
.sum-day-sep{opacity:.3;margin:0 2px}
.sum-day-empty{
  padding:24px;color:var(--muted);font-size:12px;
  font-style:italic;text-align:center;
}

/* ── ACT ROW ── */
.sum-acts{padding:4px 0}
.sum-act-row{
  display:flex;align-items:flex-start;
  padding:10px 16px;gap:10px;
  border-bottom:1px solid var(--border);
  transition:background .15s;
}
.sum-act-row:last-child{border-bottom:none}
.sum-act-row:hover{background:rgba(43,150,168,.025)}
.sum-act-slot{
  display:flex;flex-direction:column;align-items:center;gap:3px;
  width:48px;flex-shrink:0;padding-top:4px;
}
.sum-act-slot-time{font-size:11px;font-weight:800}
.sum-act-slot-icon{
  width:24px;height:24px;border-radius:7px;
  display:flex;align-items:center;justify-content:center;
}

/* ── ACT CARD ── */
.sum-act-card{
  flex:1;display:flex;background:var(--surface);
  border-radius:var(--r-lg);border:1px solid var(--border);
  overflow:hidden;min-height:100px;box-shadow:var(--shadow-sm);
  transition:box-shadow .2s,transform .15s;
}
.sum-act-card:hover{box-shadow:var(--shadow-md);transform:translateY(-1px)}
.sum-act-img{width:130px;min-height:100px;object-fit:cover;flex-shrink:0}
.sum-act-body{
  flex:1;padding:10px 13px;display:flex;flex-direction:column;gap:5px;min-width:0;
}
.sum-act-toprow{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.sum-act-title{font-size:13px;font-weight:800;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
.sum-act-price{
  background:rgba(43,150,168,.08);color:var(--primary);
  font-size:11px;font-weight:800;
  padding:2px 8px;border-radius:8px;border:1px solid rgba(43,150,168,.2);
  white-space:nowrap;flex-shrink:0;
}
.sum-act-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.sum-act-meta span{
  display:inline-flex;align-items:center;gap:3px;
  font-size:10px;color:var(--text);font-weight:600;
  background:var(--bg);border:1px solid var(--border);
  padding:1px 6px;border-radius:6px;
}
.sum-act-desc{font-size:11px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sum-act-btmrow{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:2px}
.sum-act-note{
  display:inline-flex;align-items:center;gap:3px;
  font-size:10px;color:var(--primary);font-weight:600;
  background:rgba(43,150,168,.07);border-radius:5px;padding:1px 6px;
  border:1px solid rgba(43,150,168,.15);
}
.sum-act-rating{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--navy);margin-left:auto}
.sum-act-changer{
  display:inline-flex;align-items:center;gap:3px;
  font-size:10px;font-weight:700;color:var(--text);
  background:var(--surface);border:1.5px solid var(--border);
  border-radius:7px;padding:3px 8px;cursor:pointer;
  transition:all .15s;font-family:inherit;
}
.sum-act-changer:hover{border-color:var(--primary);color:var(--primary)}

/* ── BOTTOM BAR ── */
.sum-bottom{
  position:sticky;bottom:0;
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 26px;
  background:var(--surface);border-top:1px solid var(--border);
  box-shadow:0 -4px 20px rgba(0,0,0,.06);
  flex-wrap:wrap;gap:10px;z-index:50;
}
.sum-total-lbl{font-size:10px;font-weight:700;color:var(--muted);margin-bottom:1px;text-transform:uppercase;letter-spacing:.05em}
.sum-total-amt{font-size:22px;font-weight:900;color:var(--navy)}
.sum-total-eur{font-size:13px;font-weight:600;color:var(--muted);margin-left:3px}
.sum-bottom-right{display:flex;align-items:center;gap:7px;flex-wrap:wrap}

::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}

@media(max-width:1024px){
  .sum-sidebar{display:none}
}
@media(max-width:768px){
  .sum-scroll{padding:14px}
  .sum-hero{padding:18px 14px}
  .sum-nav{padding:0 12px}
  .sum-bottom{padding:10px 14px}
  .sum-act-img{width:90px}
  .sum-act-row{padding:8px 12px}
}
@media(max-width:640px){
  .sum-act-card{flex-direction:column}
  .sum-act-img{width:100%;height:130px;min-height:unset}
  .sum-nav .btn span{display:none}
}
`;

/* ─── Component ─── */
export default function ItinerarySummary({
  title, days, nbJours, selCities,
  saving = false, saveOk = false, savedItId = null,
  onBack, onEdit, onSave,
}: ItinerarySummaryProps) {
  const router = useRouter();
  const supabase = createClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleAction = async (action: () => void) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    action();
  };

  const totAct    = days.reduce((s, d) => s + d.activities.length, 0);
  const totBudget = days.reduce((s, d) => s + d.activities.reduce((ss, a) => ss + getPrice(a), 0), 0);

  /* ─────────────────────────────────────────────────────────────
     Construction des excursions pour le checkout.
     CORRECTION : on résout le vrai UUID Supabase via resolveActivityUUID()
     et on filtre strictement les entrées sans UUID valide pour éviter
     l'erreur « invalid input syntax for type uuid ».
  ───────────────────────────────────────────────────────────── */
  const checkoutExcursions = days.flatMap((day, di) =>
    day.activities.map((act, ai) => {
      const resolvedId = resolveActivityUUID(act);
      return {
        // Si aucun UUID valide, on marque avec un préfixe __invalid__
        // pour que le filtre suivant l'élimine proprement.
        id: resolvedId ?? `__invalid__${di}-${ai}`,
        title: getTitle(act),
        city: getCity(act),
        duration_hours: act.excursion?.duration_hours ?? (parseFloat(getDuration(act)) || 0),
        price_per_person: getPrice(act),
        max_people: 20,
        available_dates: act.available_dates ?? act.excursion?.available_dates ?? null,
        plan_date: day.date,
        plan_time: (act.time as "matin" | "aprem" | "soir") || undefined,
        plan_day: day.day ?? di + 1,
        note: act.note,
      };
    })
  // Ne conserver que les entrées dont l'id est un UUID Supabase valide
  ).filter(e => isValidUUID(e.id));

  const saveBtnLabel = saving ? "Enregistrement…" : saveOk ? "Enregistré !" : "Sauvegarder";

  const kpis = [
    { icon:<Layers size={14}/>,  label:"Activités",    val:`${totAct}`,               color:"#2B96A8", bg:"rgba(43,150,168,.12)" },
    { icon:<Euro size={14}/>,    label:"Budget total",  val:`${totBudget} €`,          color:"#059669", bg:"rgba(5,150,105,.12)" },
    { icon:<Calendar size={14}/>,label:"Durée",         val:`${nbJours} jours`,        color:"#8B5CF6", bg:"rgba(139,92,246,.12)" },
    { icon:<MapPin size={14}/>,  label:"Villes",        val:selCities.length.toString(),color:"#F59E0B", bg:"rgba(245,158,11,.12)" },
  ];

  return (
    <>
      <style suppressHydrationWarning>{CSS}</style>
      <TouristeNav />
      <div style={{ paddingTop: 64 }}/>

      <div className="sum-root">

        {/* NAV */}
        <nav className="sum-nav">
          <div className="sum-nav-pill"><Sparkles size={10}/> Mode Libre</div>
          <div style={{display:"flex",alignItems:"center",gap:7,marginLeft:"auto"}}>
            <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={13}/> <span>Retour</span></button>
            <button className="btn btn-ghost" onClick={onEdit}><Edit3 size={13}/> <span>Modifier</span></button>
            <button className={`btn ${saveOk ? "btn-green" : "btn-primary"}`}
              onClick={() => handleAction(onSave)} disabled={saving || saveOk}>
              <Send size={13}/> <span>{saveBtnLabel}</span>
            </button>
            <button className="btn btn-teal" onClick={() => handleAction(() => setCheckoutOpen(true))}>
              <CreditCard size={13}/> <span>Payer</span>
            </button>
          </div>
        </nav>

        {/* HERO */}
        <div className="sum-hero">
          <div>
            <div className="sum-hero-pill"><Sparkles size={9}/> Itinéraire personnalisé</div>
            <div className="sum-hero-title">{title ?? `${nbJours} jours en Tunisie`}</div>
            <div className="sum-hero-cities">
              {selCities.map((c, i) => (
                <React.Fragment key={c}>
                  {i > 0 && <ChevronRight size={11} style={{opacity:.6}}/>}
                  <span>{c}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="sum-hero-stats">
            {[
              { val: nbJours,              lbl: "Jours" },
              { val: selCities.length,     lbl: "Villes" },
              { val: totAct,               lbl: "Activités" },
              { val: `${totBudget} €`,     lbl: "Budget" },
            ].map(s => (
              <div key={s.lbl} className="sum-stat">
                <span className="sum-stat-val">{s.val}</span>
                <span className="sum-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sum-layout">
          {/* SIDEBAR */}
          <aside className="sum-sidebar">
            <div>
              <div className="sum-sidebar-label">Vue d'ensemble</div>
              {kpis.map(k => (
                <div key={k.label} className="sum-kpi">
                  <div className="sum-kpi-icon" style={{background:k.bg, color:k.color}}>{k.icon}</div>
                  <div>
                    <div className="sum-kpi-lbl">{k.label}</div>
                    <div className="sum-kpi-val" style={{color:k.color}}>{k.val}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:7}}>
              <div className="sum-sidebar-label">Actions</div>
              <button className="btn btn-ghost" style={{width:"100%",justifyContent:"center"}} onClick={onEdit}>
                <Edit3 size={13}/> Modifier l'itinéraire
              </button>
              <button className={`btn ${saveOk ? "btn-green" : "btn-primary"}`}
                style={{width:"100%",justifyContent:"center"}}
                onClick={() => handleAction(onSave)} disabled={saving || saveOk}>
                <Send size={13}/> {saveBtnLabel}
              </button>
              <button className="btn btn-teal" style={{width:"100%",justifyContent:"center"}}
                onClick={() => handleAction(() => setCheckoutOpen(true))}>
                <CreditCard size={13}/> Payer ce voyage
              </button>
            </div>
          </aside>

          {/* SCROLL */}
          <div className="sum-scroll">
            {days.map((day, i) => {
              const dayPrice = day.activities.reduce((s, a) => s + getPrice(a), 0);
              const dayHours = day.activities.reduce((s, a) => {
                const d = getDuration(a);
                return s + (parseFloat(d) || 0);
              }, 0);
              const sorted = [...day.activities].sort((a, b) =>
                (a.customTime || SLOT_TIMES[a.time] || "").localeCompare(b.customTime || SLOT_TIMES[b.time] || "")
              );
              return (
                <div key={i} className="sum-day-card">
                  <div className="sum-day-hdr">
                    <div className="sum-day-left">
                      <div className="sum-day-num">{day.day ?? i + 1}</div>
                      <div>
                        <div className="sum-day-title">
                          Jour {day.day ?? i + 1}
                          {day.theme && <span style={{fontWeight:500,color:"#64748B",marginLeft:6}}>{day.theme}</span>}
                        </div>
                        <div className="sum-day-city">
                          <Navigation size={10} color="#2B96A8"/>
                          {day.city}
                          {day.date && (
                            <span style={{color:"#94A3B8",marginLeft:4}}>
                              · {new Date(day.date).toLocaleDateString("fr-FR", {day:"numeric", month:"long"})}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {day.activities.length > 0 && (
                      <div className="sum-day-badge">
                        <Euro size={10}/> {dayPrice} €
                        <span className="sum-day-sep">·</span>
                        <Clock size={9}/> {dayHours}h
                        <span className="sum-day-sep">·</span>
                        {day.activities.length} act.
                      </div>
                    )}
                  </div>

                  {sorted.length === 0 ? (
                    <p className="sum-day-empty">Aucune activité planifiée</p>
                  ) : (
                    <div className="sum-acts">
                      {sorted.map((act, ai) => {
                        const photos      = getPhotos(act);
                        const price       = getPrice(act);
                        const rating      = getRating(act);
                        const description = getDescription(act);
                        const slotColor   = SLOT_COLORS[act.time] ?? "#2B96A8";
                        const slotBg      = SLOT_BG[act.time]     ?? "rgba(43,150,168,.10)";
                        const slotIcon    = SLOT_ICONS[act.time]  ?? <Sun size={12}/>;
                        const displayTime = act.customTime || SLOT_TIMES[act.time] || "—";

                        // Indique si cette activité sera incluse dans le checkout
                        const hasValidUUID = isValidUUID(resolveActivityUUID(act));

                        return (
                          <div key={act.id ?? ai} className="sum-act-row">
                            <div className="sum-act-slot">
                              <span className="sum-act-slot-time" style={{color:slotColor}}>{displayTime}</span>
                              <div className="sum-act-slot-icon" style={{background:slotBg, color:slotColor}}>
                                {React.cloneElement(slotIcon as React.ReactElement, {size:12, color:slotColor})}
                              </div>
                            </div>
                            <div className="sum-act-card" style={!hasValidUUID ? {opacity:.7} : undefined}>
                              {photos[0] && <img src={photos[0]} alt="" className="sum-act-img"/>}
                              <div className="sum-act-body">
                                <div className="sum-act-toprow">
                                  <div className="sum-act-title">{getTitle(act)}</div>
                                  {price > 0 && <div className="sum-act-price">{price} €</div>}
                                </div>
                                <div className="sum-act-meta">
                                  {getDuration(act) && <span><Clock size={9}/> {getDuration(act)}</span>}
                                  {getCity(act)     && <span><MapPin size={9}/> {getCity(act)}</span>}
                                  {/* Avertissement si UUID manquant */}
                                  {!hasValidUUID && (
                                    <span style={{
                                      color:"#DC2626",
                                      background:"#FEF2F2",
                                      borderColor:"#FCA5A5",
                                      fontSize:9,
                                    }}>
                                      ⚠ non réservable
                                    </span>
                                  )}
                                </div>
                                {description && <div className="sum-act-desc">{description}</div>}
                                <div className="sum-act-btmrow">
                                  {act.note && (
                                    <div className="sum-act-note"><FileText size={8}/> {act.note}</div>
                                  )}
                                  {rating > 0 && (
                                    <div className="sum-act-rating">
                                      <Star size={11} color="#F59E0B" fill="#F59E0B"/> {rating}
                                    </div>
                                  )}
                                  <button className="sum-act-changer" onClick={onEdit}>
                                    <RefreshCw size={10}/> Changer
                                  </button>
                                </div>
                              </div>
                            </div>
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

        {/* BOTTOM BAR */}
        <div className="sum-bottom">
          <div>
            <div className="sum-total-lbl">Budget total estimé</div>
            <div className="sum-total-amt">
              {totBudget.toLocaleString("fr-FR")}
              <span className="sum-total-eur">EUR</span>
            </div>
          </div>
          <div className="sum-bottom-right">
            <button className="btn btn-ghost"><Download size={12}/> PDF</button>
            <button className="btn btn-ghost"><Share2 size={12}/> Partager</button>
            <button className="btn btn-ghost" onClick={onEdit}><Edit3 size={12}/> Modifier</button>
            <button className={`btn ${saveOk ? "btn-green" : "btn-primary"}`}
              onClick={() => handleAction(onSave)} disabled={saving || saveOk}>
              <Bookmark size={12}/> {saveBtnLabel}
            </button>
            <button className="btn btn-teal" onClick={() => handleAction(() => setCheckoutOpen(true))}>
              <CreditCard size={12}/> Payer
            </button>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModalItineraire
          excursions={checkoutExcursions}
          itineraireId={savedItId ?? undefined}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}