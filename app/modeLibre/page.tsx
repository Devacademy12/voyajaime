"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import {
  MapPin, CalendarDays, Users, Heart, Loader2,
  CheckCircle, ChevronLeft, ChevronRight, AlertTriangle,
  SlidersHorizontal, ArrowRight,
} from "lucide-react";

/* ─── Types ─── */
type Ville     = { id: string; nom: string; emoji?: string; region?: string; active: boolean };
type Categorie = { id: string; nom: string; emoji?: string; couleur?: string };
type CityDateRange = { city: string; start: Date | null; end: Date | null };

/* ─── Helpers ─── */
function tog<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}
function fmtShort(d: Date) {
  const M = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
  return `${d.getDate()} ${M[d.getMonth()]}`;
}
function getBlockedDates(cityDates: CityDateRange[], excludeCity: string) {
  return cityDates
    .filter(c => c.city !== excludeCity && c.start && c.end)
    .map(c => ({ start: c.start!, end: c.end! }));
}
function datesOverlap(s1:Date|null,e1:Date|null,s2:Date|null,e2:Date|null) {
  if (!s1||!e1||!s2||!e2) return false;
  const a=new Date(s1);a.setHours(0,0,0,0);const b=new Date(e1);b.setHours(0,0,0,0);
  const c=new Date(s2);c.setHours(0,0,0,0);const d=new Date(e2);d.setHours(0,0,0,0);
  return a<=d&&c<=b;
}

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.ml-root{min-height:100vh;background:#F7F9FC;font-family:'DM Sans',system-ui,sans-serif;display:flex;flex-direction:column}

/* topbar */
.ml-topbar{background:white;border-bottom:1px solid #EEF1F5;box-shadow:0 1px 6px rgba(0,0,0,.04);padding:16px 40px;display:flex;align-items:center;justify-content:center;gap:14px}
.ml-topbar-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:24px;background:rgba(43,150,168,.09);font-size:11px;font-weight:700;color:#2B96A8;letter-spacing:.06em}
.ml-topbar h1{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#111827;margin:0}
.ml-topbar h1 span{color:#2B96A8}

/* layout */
.ml-main{flex:1;display:flex;flex-direction:column;align-items:center;padding:28px 24px 48px;gap:20px}
.ml-cards-row{display:flex;flex-direction:row;gap:18px;width:100%;max-width:1100px;align-items:stretch;min-height:500px}

/* card */
.ml-card{flex:1;min-width:0;background:white;border-radius:22px;border:1px solid #EEF1F5;box-shadow:0 4px 20px rgba(0,0,0,.06);display:flex;flex-direction:column;overflow:hidden;transition:box-shadow .22s}
.ml-card:hover{box-shadow:0 8px 32px rgba(43,150,168,.1)}
.ml-card-disabled{opacity:.55;pointer-events:none}
.ml-card-header{padding:18px 22px 14px;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.ml-card-header-left{display:flex;align-items:center;gap:12px}
.ml-card-icon{width:36px;height:36px;border-radius:12px;background:rgba(43,150,168,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ml-card-title{font-size:14px;font-weight:800;color:#111827;margin-bottom:2px}
.ml-card-sub{font-size:12px;color:#9CA3AF}
.ml-badge-count{font-size:11px;font-weight:700;color:#2B96A8;background:rgba(43,150,168,.09);padding:3px 10px;border-radius:20px}
.ml-badge-days{font-size:11px;font-weight:700;color:#2B96A8;background:rgba(43,150,168,.09);padding:3px 10px;border-radius:20px}
.ml-card-body{flex:1;padding:16px 20px;overflow-y:auto}

/* cities */
.ml-cities-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.ml-city-btn{padding:10px 12px;border-radius:12px;border:2px solid #E5E7EB;background:white;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:#374151;text-align:left;transition:all .15s;display:flex;align-items:center;gap:7px}
.ml-city-btn:hover{border-color:#2B96A8;color:#2B96A8}
.ml-city-btn-on{border-color:#2B96A8;background:#2B96A8;color:white;box-shadow:0 4px 12px rgba(43,150,168,.3)}

/* calendar empty */
.ml-cal-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;text-align:center;padding:20px}
.ml-cal-empty-icon{width:48px;height:48px;border-radius:16px;background:#F3F4F6;display:flex;align-items:center;justify-content:center}
.ml-cal-empty-text{font-size:13px;color:#9CA3AF;max-width:200px;line-height:1.5}
.ml-dates-step-label{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}

/* city date row */
.ml-city-date-row{background:#F8FAFC;border-radius:14px;border:1.5px solid #EEF1F5;padding:12px 14px;margin-bottom:10px}
.ml-city-date-name{font-size:13px;font-weight:800;color:#111827;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.ml-date-row{display:flex;align-items:center;gap:8px}
.ml-date-btn{flex:1;padding:9px 12px;border-radius:10px;border:1.5px solid #E5E7EB;background:white;font-size:12px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;text-align:left;transition:all .15s;display:flex;align-items:center;gap:6px}
.ml-date-btn:hover{border-color:#2B96A8}
.ml-date-btn-active{border-color:#2B96A8;color:#2B96A8;background:rgba(43,150,168,.05)}
.ml-date-arrow{color:#D1D5DB;flex-shrink:0}
.ml-nights-badge{font-size:10px;font-weight:700;color:#2B96A8;background:rgba(43,150,168,.08);padding:3px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0}
.ml-recap-box{margin-top:12px;padding:12px 14px;background:rgba(43,150,168,.05);border-radius:12px;border:1px solid rgba(43,150,168,.15)}
.ml-recap-title{font-size:11px;font-weight:700;color:#2B96A8;display:flex;align-items:center;gap:5px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em}
.ml-recap-pills{display:flex;flex-wrap:wrap;gap:6px}
.ml-recap-pill{display:flex;align-items:center;gap:4px;padding:3px 10px;background:white;border-radius:20px;font-size:11px;font-weight:600;color:#374151;border:1px solid #E5E7EB}
.ml-conflict-banner{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:10px 12px;margin-bottom:10px;background:#FEF2F2;border-radius:10px;border:1px solid #FECACA;font-size:11px;color:#DC2626}
.ml-conflict-banner button{background:none;border:none;cursor:pointer;color:#DC2626;flex-shrink:0}

/* mini calendar popup */
.ml-cal-pop{background:white;border-radius:16px;border:1px solid #E5E7EB;box-shadow:0 8px 32px rgba(0,0,0,.14);padding:12px;width:260px}
.ml-cal-pop-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.ml-cal-nav-btn{width:28px;height:28px;border-radius:8px;border:1px solid #E5E7EB;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
.ml-cal-nav-btn:hover{border-color:#2B96A8;color:#2B96A8}
.ml-cal-month{font-size:13px;font-weight:700;color:#111827}
.ml-cal-days-header{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px}
.ml-cal-day-name{font-size:9px;font-weight:700;color:#9CA3AF;text-align:center;padding:3px 0}
.ml-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.ml-cal-day-btn{height:32px;border-radius:8px;border:none;background:transparent;font-size:11px;font-weight:500;color:#374151;cursor:pointer;transition:all .12s}
.ml-cal-day-btn:hover:not(:disabled){background:rgba(43,150,168,.1);color:#2B96A8}
.ml-cal-day-btn:disabled{color:#D1D5DB;cursor:not-allowed}
.ml-cal-day-btn-selected{background:#2B96A8!important;color:white!important;font-weight:700}
.ml-cal-day-btn-blocked{background:#FEF2F2!important;color:#FCA5A5!important}
.ml-cal-legend{display:flex;align-items:center;gap:5px;margin-top:8px;font-size:9px;color:#9CA3AF}
.ml-cal-legend-dot{width:8px;height:8px;border-radius:50%}

/* categories */
.ml-cats-wrap{display:flex;flex-wrap:wrap;gap:8px}
.ml-cat-chip{padding:8px 14px;border-radius:22px;border:1.5px solid #E5E7EB;background:white;color:#6B7280;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .15s}
.ml-cat-chip:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,.08)}
.ml-cat-chip-on{font-weight:700;border-width:2px}

/* people */
.ml-people-section{margin-top:20px;padding-top:16px;border-top:1px solid #F3F4F6}
.ml-people-label{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;align-items:center;gap:5px}
.ml-people-row{display:flex;align-items:center;gap:12px}
.ml-people-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid #E5E7EB;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;font-weight:700;color:#374151;transition:all .15s;flex-shrink:0;line-height:1}
.ml-people-btn:hover{border-color:#2B96A8;color:#2B96A8}
.ml-people-btn:disabled{opacity:.3;cursor:not-allowed}
.ml-people-display{flex:1;text-align:center;background:rgba(43,150,168,.07);border-radius:10px;padding:8px 0;border:1.5px solid rgba(43,150,168,.2)}
.ml-people-num{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#2B96A8;line-height:1;display:block}
.ml-people-unit{font-size:10px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.ml-people-quick{display:flex;gap:6px;margin-top:10px}
.ml-people-quick-btn{flex:1;padding:6px 0;border-radius:8px;border:1.5px solid #E5E7EB;background:white;font-size:11px;font-weight:600;color:#9CA3AF;cursor:pointer;font-family:inherit;transition:all .12s}
.ml-people-quick-btn:hover,.ml-people-quick-btn.pqb-active{border-color:#2B96A8;background:#2B96A8;color:white}

/* CTA */
.ml-cta-bar{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:1100px}
.ml-selection-pill{padding:8px 20px;background:white;border-radius:30px;border:1px solid #E5E7EB;font-size:12px;color:#374151;box-shadow:0 2px 8px rgba(0,0,0,.05);display:flex;align-items:center;gap:6px}
.ml-hl{color:#2B96A8;font-weight:700}
.ml-cta-btn{padding:14px 48px;background:#2B96A8;color:white;border:none;border-radius:50px;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 10px 28px -8px rgba(43,150,168,.55);transition:all .22s}
.ml-cta-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 36px -10px rgba(43,150,168,.65)}
.ml-cta-btn:disabled{background:#E5E7EB;color:#9CA3AF;box-shadow:none;cursor:not-allowed}

/* utils */
.ml-skeleton{background:#F3F4F6;border-radius:10px;animation:ml-lp 1.5s ease infinite}
@keyframes ml-lp{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes ml-spin{to{transform:rotate(360deg)}}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}

@media(max-width:900px){
  .ml-cards-row{flex-direction:column;min-height:auto}
  .ml-topbar{padding:14px 16px}
  .ml-main{padding:16px 12px 40px}
}
`;

const MONTHS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR     = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

/* ─────────── MiniCalPop ─────────── */
function MiniCalPop({ value, onChange, minDate, onClose, blockedRanges }: {
  value: Date | null; onChange: (d: Date) => void;
  minDate?: Date | null; onClose: () => void;
  blockedRanges?: { start: Date; end: Date }[];
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [cursor, setCursor] = useState(() => {
    const ref = value || minDate || today;
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  });
  const year = cursor.getFullYear(), month = cursor.getMonth();
  let fd = new Date(year, month, 1).getDay();
  fd = fd === 0 ? 6 : fd - 1;
  const dim = new Date(year, month + 1, 0).getDate();
  const cells: (number|null)[] = [];
  for (let i=0;i<fd;i++) cells.push(null);
  for (let i=1;i<=dim;i++) cells.push(i);

  const isBlocked = (day: number|null) => {
    if (!day||!blockedRanges?.length) return false;
    const d = new Date(year,month,day); d.setHours(0,0,0,0);
    return blockedRanges.some(r => { const s=new Date(r.start);s.setHours(0,0,0,0);const e=new Date(r.end);e.setHours(0,0,0,0); return d>=s&&d<=e; });
  };
  const isDisabled = (day: number|null) => {
    if (!day) return true;
    const d = new Date(year,month,day);
    if (d<today) return true;
    if (minDate){const m=new Date(minDate);m.setHours(0,0,0,0);if(d<m)return true;}
    return isBlocked(day);
  };
  const isSel = (day: number|null) => day&&value ? value.getDate()===day&&value.getMonth()===month&&value.getFullYear()===year : false;

  return (
    <div className="ml-cal-pop" onClick={e=>e.stopPropagation()}>
      <div className="ml-cal-pop-header">
        <button className="ml-cal-nav-btn" onClick={()=>setCursor(new Date(year,month-1,1))}><ChevronLeft size={14}/></button>
        <span className="ml-cal-month">{MONTHS_FULL[month]} {year}</span>
        <button className="ml-cal-nav-btn" onClick={()=>setCursor(new Date(year,month+1,1))}><ChevronRight size={14}/></button>
      </div>
      <div className="ml-cal-days-header">{DAYS_FR.map(d=><div key={d} className="ml-cal-day-name">{d}</div>)}</div>
      <div className="ml-cal-grid">
        {cells.map((day,i)=>{
          const dis=isDisabled(day),bl=isBlocked(day),sel=isSel(day);
          return (
            <button key={i} disabled={dis}
              onClick={()=>{if(day&&!dis){onChange(new Date(year,month,day));onClose();}}}
              className={["ml-cal-day-btn",sel?"ml-cal-day-btn-selected":"",bl?"ml-cal-day-btn-blocked":""].join(" ")}>
              {day||""}
            </button>
          );
        })}
      </div>
      {!!blockedRanges?.length && (
        <div className="ml-cal-legend">
          <span className="ml-cal-legend-dot" style={{background:"#FECACA"}}/>Dates réservées pour une autre ville
        </div>
      )}
    </div>
  );
}

/* ─────────── CityDateRow ─────────── */
function CityDateRow({ cdr, onStart, onEnd, allCityDates }: {
  cdr: CityDateRange; onStart:(d:Date)=>void; onEnd:(d:Date)=>void; allCityDates:CityDateRange[];
}) {
  const [openPop, setOpenPop] = useState<"start"|"end"|null>(null);
  const minEnd = cdr.start ? new Date(cdr.start.getFullYear(),cdr.start.getMonth(),cdr.start.getDate()) : undefined;
  const nights = cdr.start&&cdr.end ? daysBetween(cdr.start,cdr.end) : 0;
  const blocked = getBlockedDates(allCityDates, cdr.city);

  return (
    <div className="ml-city-date-row" style={{position:"relative"}}>
      <div className="ml-city-date-name"><MapPin size={12} color="#2B96A8"/> {cdr.city}</div>
      <div className="ml-date-row">
        <div style={{position:"relative",flex:1}}>
          <button className={`ml-date-btn ${cdr.start?"ml-date-btn-active":""}`} onClick={()=>setOpenPop(openPop==="start"?null:"start")}>
            <CalendarDays size={12}/> {cdr.start?fmtShort(cdr.start):"Arrivée"}
          </button>
          {openPop==="start"&&<>
            <div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setOpenPop(null)}/>
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:9999}}>
              <MiniCalPop value={cdr.start} onChange={d=>{onStart(d);setOpenPop(null);}} onClose={()=>setOpenPop(null)} blockedRanges={blocked}/>
            </div>
          </>}
        </div>
        <ArrowRight size={14} className="ml-date-arrow"/>
        <div style={{position:"relative",flex:1}}>
          <button className={`ml-date-btn ${cdr.end?"ml-date-btn-active":""}`} onClick={()=>setOpenPop(openPop==="end"?null:"end")}>
            <CalendarDays size={12}/> {cdr.end?fmtShort(cdr.end):"Départ"}
          </button>
          {openPop==="end"&&<>
            <div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setOpenPop(null)}/>
            <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:9999}}>
              <MiniCalPop value={cdr.end} onChange={d=>{onEnd(d);setOpenPop(null);}} minDate={minEnd} onClose={()=>setOpenPop(null)} blockedRanges={blocked}/>
            </div>
          </>}
        </div>
        {nights>0&&<span className="ml-nights-badge">{nights}j</span>}
      </div>
    </div>
  );
}

/* ─────────── ConfigInner ─────────── */
function ConfigInner() {
  const router = useRouter();
  const sb = useMemo(()=>createClient(),[]);

  const [selCities, setSelCities] = useState<string[]>([]);
  const [cityDates, setCityDates] = useState<CityDateRange[]>([]);
  const [selCats,   setSelCats]   = useState<string[]>([]);
  const [people,    setPeople]    = useState(2);
  const [dateError, setDateError] = useState("");
  const [villes,    setVilles]    = useState<Ville[]>([]);
  const [categories,setCategories]= useState<Categorie[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(()=>{
    (async()=>{
      const [{data:v},{data:c}] = await Promise.all([
        sb.from("villes").select("*").eq("active",true).order("nom"),
        sb.from("categories").select("*").order("nom"),
      ]);
      setVilles((v||[]) as Ville[]);
      setCategories((c||[]) as Categorie[]);
      setLoading(false);
    })();
  },[]);

  const toggleCity=(nom:string)=>{
    const next=tog(selCities,nom);
    setSelCities(next);
    setCityDates(next.map(c=>cityDates.find(cd=>cd.city===c)??{city:c,start:null,end:null}));
  };

  const updateCityStart=(city:string,d:Date)=>{
    const me=cityDates.find(x=>x.city===city);
    const conflict=cityDates.find(c=>c.city!==city&&c.start&&c.end&&datesOverlap(d,me?.end||d,c.start,c.end));
    if(conflict){setDateError(`Conflit de dates avec ${conflict.city}`);return;}
    setDateError("");
    setCityDates(prev=>prev.map(c=>c.city===city?{...c,start:d,end:c.end&&d>c.end?null:c.end}:c));
  };
  const updateCityEnd=(city:string,d:Date)=>{
    const me=cityDates.find(x=>x.city===city);
    const conflict=cityDates.find(c=>c.city!==city&&c.start&&c.end&&datesOverlap(me?.start||d,d,c.start,c.end));
    if(conflict){setDateError(`Conflit de dates avec ${conflict.city}`);return;}
    setDateError("");
    setCityDates(prev=>prev.map(c=>c.city===city?{...c,end:d}:c));
  };

  const totalDays=cityDates.reduce((acc,c)=>c.start&&c.end?acc+daysBetween(c.start,c.end):acc,0);
  const allDatesSet=cityDates.length>0&&cityDates.every(c=>c.start&&c.end);
  const canGo=selCities.length>0&&allDatesSet;

  const goToBuilder=()=>{
    const p=new URLSearchParams();
    p.set("cities",selCities.join(","));
    p.set("days",String(totalDays||selCities.length));
    p.set("people",String(people));
    if(selCats.length>0) p.set("cats",selCats.join(","));
    const schedule=cityDates.filter(c=>c.start&&c.end).map(c=>({
      city:c.city,
      start:c.start!.toISOString().split("T")[0],
      end:c.end!.toISOString().split("T")[0],
    }));
    p.set("schedule",JSON.stringify(schedule));
    router.push(`/modeLibre/builder?${p.toString()}`);
  };

  return (
    <div className="ml-root">
      <style>{CSS}</style>
      <TouristeNav/>

      {/* Topbar */}
      <div className="ml-topbar">
        <div className="ml-topbar-badge"><SlidersHorizontal size={12}/> Mode Libre</div>
        <h1>Construisez votre voyage <span>à votre façon</span></h1>
      </div>

      <main className="ml-main">
        <div className="ml-cards-row">

          {/* Card 1 : Destinations */}
          <div className="ml-card">
            <div className="ml-card-header">
              <div className="ml-card-header-left">
                <div className="ml-card-icon"><MapPin size={18} color="#2B96A8"/></div>
                <div>
                  <p className="ml-card-title">Destinations</p>
                  <p className="ml-card-sub">Choisissez vos villes</p>
                </div>
              </div>
              {selCities.length>0&&<span className="ml-badge-count">{selCities.length} sélectionnée{selCities.length>1?"s":""}</span>}
            </div>
            <div className="ml-card-body">
              {loading?(
                <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:80}}>
                  <Loader2 size={22} color="#2B96A8" style={{animation:"ml-spin .7s linear infinite"}}/>
                </div>
              ):(
                <div className="ml-cities-grid">
                  {villes.map(v=>{
                    const on=selCities.includes(v.nom);
                    return(
                      <button key={v.id} className={`ml-city-btn ${on?"ml-city-btn-on":""}`} onClick={()=>toggleCity(v.nom)}>
                        {v.emoji&&<span>{v.emoji}</span>}{v.nom}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 2 : Calendrier */}
          <div className={`ml-card ${selCities.length===0?"ml-card-disabled":""}`}>
            <div className="ml-card-header">
              <div className="ml-card-header-left">
                <div className="ml-card-icon"><CalendarDays size={18} color="#2B96A8"/></div>
                <div>
                  <p className="ml-card-title">Calendrier</p>
                  <p className="ml-card-sub">
                    {selCities.length===0?"Sélectionnez d'abord une ville":totalDays>0?`${totalDays} jours au total`:"Définissez les dates"}
                  </p>
                </div>
              </div>
              {totalDays>0&&<span className="ml-badge-days">🗓️ {totalDays}j</span>}
            </div>
            <div className="ml-card-body">
              {selCities.length===0?(
                <div className="ml-cal-empty">
                  <div className="ml-cal-empty-icon"><MapPin size={24} color="#9CA3AF"/></div>
                  <p className="ml-cal-empty-text">Choisissez vos villes à gauche pour organiser votre calendrier</p>
                </div>
              ):(
                <>
                  <p className="ml-dates-step-label">
                    {cityDates.filter(c=>c.start&&c.end).length}/{cityDates.length} étapes configurées
                  </p>
                  {dateError&&(
                    <div className="ml-conflict-banner">
                      <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                        <AlertTriangle size={13} style={{marginTop:1,flexShrink:0}}/><span>{dateError}</span>
                      </div>
                      <button onClick={()=>setDateError("")}>✕</button>
                    </div>
                  )}
                  {cityDates.map(cdr=>(
                    <CityDateRow key={cdr.city} cdr={cdr} allCityDates={cityDates}
                      onStart={d=>updateCityStart(cdr.city,d)} onEnd={d=>updateCityEnd(cdr.city,d)}/>
                  ))}
                  {allDatesSet&&!dateError&&(
                    <div className="ml-recap-box">
                      <div className="ml-recap-title"><CheckCircle size={13} color="#2B96A8"/> Récapitulatif du séjour</div>
                      <div className="ml-recap-pills">
                        {cityDates.map(cdr=>cdr.start&&cdr.end&&(
                          <span key={cdr.city} className="ml-recap-pill">
                            <MapPin size={9}/> {cdr.city} · {fmtShort(cdr.start)} → {fmtShort(cdr.end)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 3 : Intérêts + Personnes */}
          <div className={`ml-card ${!allDatesSet?"ml-card-disabled":""}`}>
            <div className="ml-card-header">
              <div className="ml-card-header-left">
                <div className="ml-card-icon"><Heart size={18} color="#2B96A8"/></div>
                <div>
                  <p className="ml-card-title">Centres d&apos;intérêt</p>
                  <p className="ml-card-sub">
                    {!allDatesSet?"Définissez d'abord les dates":selCats.length===0?"Optionnel":`${selCats.length} sélectionné${selCats.length>1?"s":""}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-card-body">
              {loading?(
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {Array.from({length:6}).map((_,i)=><div key={i} className="ml-skeleton" style={{height:34,width:90,borderRadius:22}}/>)}
                </div>
              ):(
                <div className="ml-cats-wrap">
                  {categories.map(cat=>{
                    const on=selCats.includes(cat.nom);
                    return(
                      <button key={cat.id}
                        className={`ml-cat-chip ${on?"ml-cat-chip-on":""}`}
                        style={on?{borderColor:cat.couleur||"#2B96A8",color:cat.couleur||"#2B96A8",background:`${cat.couleur||"#2B96A8"}12`}:{}}
                        onClick={()=>setSelCats(tog(selCats,cat.nom))}>
                        {cat.emoji&&<span>{cat.emoji}</span>}{cat.nom}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Nombre de personnes */}
              <div className="ml-people-section">
                <p className="ml-people-label"><Users size={11}/> Nombre de personnes</p>
                <div className="ml-people-row">
                  <button className="ml-people-btn" disabled={people<=1} onClick={()=>setPeople(p=>p-1)}>−</button>
                  <div className="ml-people-display">
                    <span className="ml-people-num">{people}</span>
                    <span className="ml-people-unit">{people>1?"personnes":"personne"}</span>
                  </div>
                  <button className="ml-people-btn" disabled={people>=20} onClick={()=>setPeople(p=>p+1)}>+</button>
                </div>
                <div className="ml-people-quick">
                  {[1,2,3,4,5,6].map(n=>(
                    <button key={n} className={`ml-people-quick-btn ${people===n?"pqb-active":""}`} onClick={()=>setPeople(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CTA */}
        <div className="ml-cta-bar">
          {selCities.length>0&&(
            <div className="ml-selection-pill">
              {totalDays>0&&<><span className="ml-hl">{totalDays}j</span> · </>}
              {selCities.slice(0,3).join(", ")}
              {selCities.length>3&&<span className="ml-hl"> +{selCities.length-3}</span>}
              {people>1&&<> · <span className="ml-hl">{people} pers.</span></>}
            </div>
          )}
          <button className="ml-cta-btn" onClick={goToBuilder} disabled={!canGo}>
            Composer mon itinéraire <ArrowRight size={18}/>
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ModeLibrePage() {
  return (
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F7F9FC"}}>
        <Loader2 size={28} color="#2B96A8" style={{animation:"ml-spin .7s linear infinite"}}/>
        <style>{`@keyframes ml-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ConfigInner/>
    </Suspense>
  );
}