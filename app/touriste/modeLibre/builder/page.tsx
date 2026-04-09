"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Star,
  Pencil, Trash2, FileText, Send, Search, CheckCircle2,
  PiggyBank, Layers, BookMarked, ChevronLeft, ChevronRight,
  Loader2, Sunrise, Sun, Moon, AlertCircle, RotateCw,
  Plus, CalendarDays, Edit3, X,
} from "lucide-react";

type Excursion    = { id:string; title:string; city:string; price_per_person:number; duration_hours:number; rating:number; reviews_count:number; categories:string[]; photos:string[]; departure_time?:string; };
type Categorie    = { id:string; nom:string; emoji:string; couleur:string; };
type Ville        = { id:string; nom:string; emoji:string; region:string; description:string; active:boolean; };
type TimeKey      = "matin"|"aprem"|"soir";
type ActivityItem = { id:string; excursion:Excursion; note:string; time:TimeKey; customTime?:string; };
type DayPlan      = { city:string; date?:string; activities:ActivityItem[]; };
type ViewStep     = "builder"|"result";

const SLOTS = [
  { key:"matin" as TimeKey, label:"Matin",       icon:<Sunrise size={13} color="#F59E0B"/>, color:"#F59E0B", hint:"8h — 12h",  defaultTime:"09:00" },
  { key:"aprem" as TimeKey, label:"Après-midi",  icon:<Sun     size={13} color="#2B96A8"/>, color:"#2B96A8", hint:"13h — 17h", defaultTime:"13:00" },
  { key:"soir"  as TimeKey, label:"Soir",        icon:<Moon    size={13} color="#8B5CF6"/>, color:"#8B5CF6", hint:"18h — 22h", defaultTime:"19:00" },
];

function DbError({ message, onRetry }: { message:string; onRetry?:()=>void }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"2rem", background:"white", borderRadius:"1rem", border:"1px solid #FEE2E2" }}>
      <AlertCircle size={28} color="#DC2626" style={{ marginBottom:"0.75rem" }}/>
      <p style={{ fontWeight:600, fontSize:"0.9rem", color:"#DC2626", marginBottom:"0.25rem" }}>Erreur de chargement</p>
      <p style={{ fontSize:"0.8rem", color:"#6B7280", marginBottom:"0.75rem" }}>{message}</p>
      {onRetry && <button onClick={onRetry} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:"#F3F4F6", border:"none", padding:"0.4rem 0.9rem", borderRadius:"2rem", fontSize:"0.75rem", cursor:"pointer" }}><RotateCw size={12}/> Réessayer</button>}
    </div>
  );
}

function BuilderInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const sb      = useMemo(() => createClient(), []);

  const days      = Number(params.get("days") || 3);
  const selCities = (params.get("cities") || "").split(",").filter(Boolean);

  const [userId,    setUserId]    = useState<string|null>(null);
  const [savedItId, setSavedItId] = useState<string|null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [view,      setView]      = useState<ViewStep>("builder");

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [villes,     setVilles]     = useState<Ville[]>([]);
  const [allExc,     setAllExc]     = useState<Excursion[]>([]);
  const [ldExc,      setLdExc]      = useState(true);
  const [errExc,     setErrExc]     = useState<string|null>(null);

  const [search,         setSearch]         = useState("");
  const [filterDuration, setFilterDuration] = useState<"all"|"long">("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate,       setTempDate]       = useState("");

  const [itin,      setItin]      = useState<DayPlan[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [editNote,  setEditNote]  = useState<string|null>(null);
  const [noteText,  setNoteText]  = useState("");

  const [pendingExc, setPendingExc] = useState<Excursion|null>(null);
  const [pickSlot,   setPickSlot]   = useState<TimeKey>("matin");
  const [pickTime,   setPickTime]   = useState("09:00");

  const loadAll = async () => {
    const [cR, vR, eR] = await Promise.all([
      sb.from("categories").select("*").order("nom"),
      sb.from("villes").select("*").eq("active", true).order("nom"),
      sb.from("excursions").select("*").eq("is_active", true).order("rating", { ascending:false }),
    ]);
    setCategories((cR.data||[]) as Categorie[]);
    setVilles((vR.data||[]) as Ville[]);
    if (eR.error) setErrExc(eR.error.message);
    else setAllExc((eR.data||[]) as Excursion[]);
    setLdExc(false);
  };

  useEffect(() => {
    loadAll();
    setItin(Array.from({ length:days }, (_, i) => ({ city:selCities[i % selCities.length] || selCities[0] || "", activities:[] })));
  }, []);

  useEffect(() => {
    sb.auth.getUser().then(async ({ data:{ user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await sb.from("itineraires").select("*").eq("user_id", user.id).order("updated_at", { ascending:false }).limit(1).maybeSingle();
      if (data) setSavedItId(data.id);
    });
  }, [sb]);

  const cc = (n?:string) => categories.find(c=>c.nom===n)?.couleur || "#2B96A8";
  const ce = (n?:string) => categories.find(c=>c.nom===n)?.emoji   || "🏔️";
  const ve = (nom:string) => villes.find(v=>v.nom===nom)?.emoji     || "📍";

  // ── Filtre par ville du jour actif + recherche + durée ──
  const currentDayCity = itin[activeDay]?.city || "";
  const palette = allExc.filter(e => {
    const q = search.toLowerCase();
    const matchSearch   = !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
    const matchCity     = !currentDayCity || e.city === currentDayCity;
    const matchDuration = filterDuration === "all" || e.duration_hours > 6;
    return matchSearch && matchCity && matchDuration;
  });

  const totAct    = itin.reduce((s,d) => s + (d.activities?.length||0), 0);
  const totBudget = itin.reduce((s,d) => s + (d.activities?.reduce((ss,a) => ss+(a.excursion?.price_per_person||0),0)||0), 0);
  const isAdded   = (id:string) => itin[activeDay]?.activities.some(a=>a.excursion.id===id);

  const openSlotPicker = (exc:Excursion) => { setPendingExc(exc); setPickSlot("matin"); setPickTime("09:00"); };

  const confirmAdd = () => {
    if (!pendingExc) return;
    setItin(prev => {
      const u = [...prev];
      u[activeDay] = { ...u[activeDay], activities:[...u[activeDay].activities, { id:`${Date.now()}-${Math.random()}`, excursion:pendingExc, note:"", time:pickSlot, customTime:pickTime }] };
      return u;
    });
    setPendingExc(null);
  };

  const rmAct = (dayIdx:number, id:string) =>
    setItin(prev => { const u=[...prev]; u[dayIdx]={ ...u[dayIdx], activities:u[dayIdx].activities.filter(a=>a.id!==id) }; return u; });

  const saveNote = (dayIdx:number, id:string) => {
    setItin(prev => { const u=[...prev]; u[dayIdx]={ ...u[dayIdx], activities:u[dayIdx].activities.map(a=>a.id===id?{...a,note:noteText}:a) }; return u; });
    setEditNote(null); setNoteText("");
  };

  const saveItinerary = async () => {
    if (!userId) { alert("Vous devez être connecté"); return; }
    setSaving(true);
    const payload = { user_id:userId, nb_jours:days, villes_selectionnees:selCities, categories_selectionnees:[], plan:itin, updated_at:new Date().toISOString() };
    try {
      if (savedItId) {
        await sb.from("itineraires").update(payload).eq("id", savedItId);
      } else {
        const { data } = await sb.from("itineraires").insert({ ...payload, created_at:new Date().toISOString() }).select().single();
        if (data) setSavedItId(data.id);
      }
      setSaveOk(true); setTimeout(()=>setSaveOk(false), 2500);
    } catch { alert("Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  };

  /* ── CSS inline (remplace le fichier .css) ── */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',system-ui,sans-serif;background:#F7F9FC;color:#1A2C3E}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

    /* Topbar */
    .bl-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:1.25rem;background:white;padding:.75rem 1.25rem;border-radius:1.25rem;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #EDF2F7}
    .bl-top-left,.bl-top-right{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
    .bl-back{display:flex;align-items:center;gap:.4rem;background:#F3F4F6;border:none;padding:.45rem .9rem;border-radius:2rem;font-size:.78rem;font-weight:500;color:#374151;cursor:pointer}
    .bl-back:hover{background:#E5E7EB}
    .bl-chip{display:inline-flex;align-items:center;gap:.4rem;background:#EFF9FB;padding:.4rem .9rem;border-radius:2rem;font-size:.78rem;color:#2B96A8;font-weight:600}
    .bl-stat{display:inline-flex;align-items:center;gap:.4rem;font-size:.78rem;background:#F3F4F6;padding:.4rem .8rem;border-radius:2rem;color:#4B5563}
    .bl-budget-badge{display:inline-flex;align-items:center;gap:.4rem;font-size:.78rem;background:rgba(5,150,105,.1);padding:.4rem .8rem;border-radius:2rem;color:#059669;font-weight:600}
    .bl-resume-btn{display:flex;align-items:center;gap:.4rem;background:linear-gradient(135deg,#02AFCF,#053366);border:none;padding:.45rem 1.1rem;border-radius:2rem;font-size:.78rem;font-weight:600;color:white;cursor:pointer;transition:all .2s;box-shadow:0 3px 10px rgba(2,175,207,.3)}
    .bl-resume-btn:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(2,175,207,.4)}

    /* Day tabs */
    .bl-day-tabs{display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.5rem;margin-bottom:1.25rem;scrollbar-width:none}
    .bl-day-tabs::-webkit-scrollbar{display:none}
    .bl-day-tab{display:flex;align-items:center;gap:.4rem;background:white;border:1.5px solid #E5E7EB;padding:.55rem 1.1rem;border-radius:2rem;font-size:.82rem;font-weight:600;color:#4B5563;cursor:pointer;transition:all .2s;white-space:nowrap}
    .bl-day-tab.active{background:linear-gradient(135deg,#02AFCF,#053366);border-color:transparent;color:white;box-shadow:0 3px 10px rgba(2,175,207,.3)}
    .bl-day-tab-cnt{background:rgba(0,0,0,.1);padding:.1rem .45rem;border-radius:1rem;font-size:.68rem}
    .bl-day-tab.active .bl-day-tab-cnt{background:rgba(255,255,255,.25)}

    /* Body layout */
    .bl-body{display:grid;grid-template-columns:1.3fr 1fr;gap:1.25rem;align-items:start}
    @media(max-width:1000px){.bl-body{grid-template-columns:1fr}}

    /* Catalogue */
    .bl-catalogue{background:white;border-radius:1.25rem;box-shadow:0 2px 8px rgba(0,0,0,.05);border:1px solid #EDF2F7;overflow:hidden}
    .bl-cat-header{padding:1rem 1.1rem;border-bottom:1px solid #EDF2F7}
    .bl-cat-header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem}
    .bl-cat-title{display:flex;align-items:center;gap:.4rem;font-weight:700;font-size:.9rem;color:#1A2C3E}
    .bl-city-badge{display:inline-flex;align-items:center;gap:.3rem;background:rgba(2,175,207,.1);color:#02AFCF;padding:.25rem .7rem;border-radius:2rem;font-size:.72rem;font-weight:700}
    .bl-results-count{display:inline-flex;align-items:center;gap:.25rem;font-size:.7rem;background:#F3F4F6;padding:.2rem .7rem;border-radius:1rem;color:#6B7280}
    .bl-search-row{position:relative;margin-bottom:.75rem}
    .bl-search-icon{position:absolute;left:.7rem;top:50%;transform:translateY(-50%);pointer-events:none}
    .bl-search-input{width:100%;padding:.55rem .7rem .55rem 1.9rem;border:1.5px solid #E5E7EB;border-radius:2rem;font-size:.82rem;font-family:inherit;transition:all .2s}
    .bl-search-input:focus{outline:none;border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.1)}
    .bl-filter-row{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
    .bl-filter-label{font-size:.72rem;font-weight:600;color:#9CA3AF}
    .bl-filter-btn{background:#F3F4F6;border:none;padding:.3rem .75rem;border-radius:2rem;font-size:.72rem;font-weight:500;color:#4B5563;cursor:pointer;transition:all .2s;font-family:inherit}
    .bl-filter-btn.active{background:#053366;color:white}

    /* ── Grille 3 colonnes ── */
    .bl-cat-grid{padding:1rem;display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;max-height:68vh;overflow-y:auto;scrollbar-width:thin}
    .bl-cat-grid::-webkit-scrollbar{width:4px}
    .bl-cat-grid::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:2px}
    .bl-cat-grid-full{grid-column:1/-1}
    @media(max-width:1400px){.bl-cat-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:700px){.bl-cat-grid{grid-template-columns:1fr}}

    .exc-skeleton{height:160px;background:#F9FAFB;border-radius:.875rem;animation:pulse 1.5s infinite}

    /* Exc card */
    .exc-card{background:white;border-radius:.875rem;overflow:hidden;border:1.5px solid #EDF2F7;transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.04);animation:fadeUp .25s ease both}
    .exc-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.08);border-color:#DCE5FF}
    .exc-card-img{position:relative;height:110px;overflow:hidden}
    .exc-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .35s}
    .exc-card:hover .exc-card-img img{transform:scale(1.05)}
    .exc-card-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(5,19,51,.5),transparent)}
    .exc-card-cat{position:absolute;bottom:.5rem;left:.5rem;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);padding:.2rem .55rem;border-radius:1rem;font-size:.68rem;color:white}
    .exc-card-no-img{height:90px;display:flex;align-items:center;justify-content:center;font-size:1.8rem}
    .exc-card-body{padding:.65rem}
    .exc-card-title{font-weight:700;font-size:.8rem;margin-bottom:.35rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#1A2C3E}
    .exc-card-meta{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.5rem}
    .exc-meta-item{display:inline-flex;align-items:center;gap:.2rem;font-size:.66rem;color:#6B7280}
    .exc-card-footer{display:flex;justify-content:space-between;align-items:center}
    .exc-card-price{font-weight:800;font-size:.85rem}
    .exc-add-btn{display:flex;align-items:center;gap:.25rem;background:#F3F4F6;border:none;padding:.28rem .7rem;border-radius:2rem;font-size:.68rem;font-weight:600;color:#374151;cursor:pointer;transition:all .2s;font-family:inherit;white-space:nowrap}
    .exc-add-btn.added{background:rgba(5,150,105,.1);color:#059669}
    .exc-add-btn:hover:not(.added){background:#E5E7EB}

    /* Planner */
    .bl-planner{background:white;border-radius:1.25rem;box-shadow:0 2px 8px rgba(0,0,0,.05);border:1px solid #EDF2F7;overflow:hidden}
    .bl-planner-header{padding:1rem 1.1rem;border-bottom:1px solid #EDF2F7}
    .bl-planner-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.75rem}
    .bl-planner-day-info{display:flex;align-items:center;gap:.65rem}
    .bl-planner-emoji{font-size:1.6rem;background:#F3F4F6;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:1.1rem;flex-shrink:0}
    .bl-planner-day-name{font-weight:700;font-size:.95rem;color:#1A2C3E}
    .bl-planner-date-row{display:flex;align-items:center;gap:.4rem;margin-top:.2rem;flex-wrap:wrap}
    .bl-planner-date-text{font-size:.7rem;color:#6B7280;display:flex;align-items:center;gap:.2rem}
    .edit-date-btn{background:none;border:none;cursor:pointer;color:#9CA3AF;display:inline-flex;padding:0 .2rem}
    .bl-planner-date-btn{display:inline-flex;align-items:center;gap:.25rem;background:#F3F4F6;border:none;padding:.22rem .6rem;border-radius:1rem;font-size:.7rem;color:#4B5563;cursor:pointer;font-family:inherit}
    .bl-city-select{background:#EFF9FB;border:none;padding:.22rem .6rem;border-radius:1rem;font-size:.7rem;font-weight:600;color:#02AFCF;cursor:pointer;font-family:inherit}
    .bl-planner-right{display:flex;align-items:center;gap:.75rem}
    .bl-day-totals{text-align:right}
    .bl-day-budget{font-weight:800;font-size:.95rem;color:#059669}
    .bl-day-count{font-size:.68rem;color:#9CA3AF}
    .bl-day-nav{display:flex;gap:.2rem}
    .bl-nav-btn{background:#F3F4F6;border:none;width:28px;height:28px;border-radius:.75rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
    .bl-nav-btn:hover:not(:disabled){background:#E5E7EB}
    .bl-nav-btn:disabled{opacity:.35;cursor:not-allowed}
    .bl-planner-scroll{padding:1rem;max-height:62vh;overflow-y:auto;display:flex;flex-direction:column;gap:1rem}
    .bl-planner-empty{text-align:center;padding:2.5rem 1rem;color:#9CA3AF}
    .bl-planner-empty p{font-size:.85rem;line-height:1.6}

    /* Slots */
    .bl-slot{background:#F9FAFB;border-radius:.875rem;padding:.75rem}
    .bl-slot-header{display:flex;align-items:center;gap:.4rem;margin-bottom:.6rem;flex-wrap:wrap}
    .bl-slot-label{font-weight:700;font-size:.78rem}
    .bl-slot-hint{font-size:.68rem;color:#9CA3AF}
    .bl-slot-total{margin-left:auto;display:inline-flex;align-items:center;gap:.25rem;font-size:.68rem;color:#059669;font-weight:600}
    .bl-slot-empty{font-size:.72rem;color:#9CA3AF;text-align:center;padding:.6rem;background:white;border-radius:.6rem;border:1px dashed #E5E7EB}

    /* Act card */
    .act-card{background:white;border-radius:.75rem;padding:.65rem;margin-bottom:.45rem;display:flex;gap:.65rem;align-items:flex-start;border:1px solid #EDF2F7;transition:all .2s;position:relative}
    .act-card:hover{border-color:#DCE5FF;box-shadow:0 2px 8px rgba(0,0,0,.05)}
    .act-card-time{font-size:.68rem;font-weight:700;color:#02AFCF;background:rgba(2,175,207,.1);padding:.18rem .5rem;border-radius:1rem;white-space:nowrap;flex-shrink:0}
    .act-card-img{width:44px;height:44px;object-fit:cover;border-radius:.5rem;flex-shrink:0}
    .act-card-info{flex:1;min-width:0}
    .act-card-title{font-weight:700;font-size:.78rem;margin-bottom:.22rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .act-card-meta{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.2rem}
    .act-meta-item{display:inline-flex;align-items:center;gap:.18rem;font-size:.64rem;color:#6B7280}
    .act-card-note{display:inline-flex;align-items:center;gap:.2rem;font-size:.64rem;background:#FEF3C7;padding:.18rem .45rem;border-radius:1rem;color:#B45309}
    .act-card-price{font-weight:700;font-size:.78rem;white-space:nowrap;flex-shrink:0}
    .act-actions{display:flex;gap:.25rem;position:absolute;top:.45rem;right:.45rem;opacity:0;transition:opacity .2s}
    .act-card:hover .act-actions{opacity:1}
    .act-action-btn{background:#F3F4F6;border:none;padding:.22rem;border-radius:.45rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
    .act-action-btn.note:hover{background:#FEF3C7;color:#B45309}
    .act-action-btn.delete:hover{background:#FEE2E2;color:#DC2626}

    /* Modals */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
    .slot-box,.note-box,.date-picker-box{background:white;border-radius:1.25rem;width:100%;max-width:400px;padding:1.25rem;box-shadow:0 20px 40px rgba(0,0,0,.2)}
    .slot-box-title,.note-box-title{font-weight:700;font-size:1rem;margin-bottom:.25rem;display:flex;align-items:center;gap:.4rem}
    .slot-box-sub,.note-box-sub{font-size:.78rem;color:#6B7280;margin-bottom:1rem}
    .slot-option{display:flex;align-items:center;gap:.65rem;padding:.65rem;border-radius:.875rem;background:#F9FAFB;margin-bottom:.4rem;cursor:pointer;transition:all .2s;border:1.5px solid transparent}
    .slot-option.selected{background:rgba(2,175,207,.08);border-color:rgba(2,175,207,.3)}
    .slot-option-icon{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:.875rem}
    .slot-option-info{flex:1}
    .slot-option-label{font-weight:600;font-size:.82rem}
    .slot-option-hint{font-size:.68rem;color:#6B7280}
    .slot-time-input{background:white;border:1px solid #E5E7EB;padding:.25rem .5rem;border-radius:.875rem;font-size:.78rem;font-family:inherit}
    .slot-box-actions,.note-box-actions,.date-picker-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1.25rem}
    .slot-cancel,.note-cancel,.date-cancel{background:#F3F4F6;border:none;padding:.45rem .9rem;border-radius:2rem;font-size:.78rem;cursor:pointer;font-family:inherit}
    .slot-confirm,.note-save,.date-confirm{background:linear-gradient(135deg,#02AFCF,#053366);border:none;padding:.45rem .9rem;border-radius:2rem;font-size:.78rem;font-weight:600;color:white;cursor:pointer;display:flex;align-items:center;gap:.4rem;font-family:inherit}
    .note-textarea{width:100%;padding:.65rem;border:1.5px solid #E5E7EB;border-radius:.875rem;font-size:.82rem;font-family:inherit;resize:vertical;min-height:90px;transition:all .2s}
    .note-textarea:focus{outline:none;border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.1)}
    .date-picker-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
    .date-picker-header h3{font-size:1rem;font-weight:700}
    .date-picker-header button{background:none;border:none;cursor:pointer;color:#9CA3AF}
    .date-picker-input{width:100%;padding:.65rem;border:1.5px solid #E5E7EB;border-radius:.875rem;font-size:.9rem;font-family:inherit}
    .date-picker-input:focus{outline:none;border-color:#02AFCF}

    /* Result view */
    .res-root{padding:1.5rem}
    .res-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:1.5rem}
    .res-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem 1.1rem;border-radius:2rem;font-size:.78rem;font-weight:500;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
    .res-btn-outline{background:#F3F4F6;color:#374151}.res-btn-outline:hover{background:#E5E7EB}
    .res-btn-dark{background:#053366;color:white}.res-btn-dark:hover{background:#021f47}
    .res-btn-green{background:#059669;color:white}
    .res-title{font-size:1.4rem;font-weight:800;color:#1A2C3E}
    .res-actions{display:flex;gap:.6rem}
    .res-body{display:grid;grid-template-columns:.8fr 2fr;gap:1.5rem;align-items:start}
    @media(max-width:900px){.res-body{grid-template-columns:1fr}}
    .res-sidebar{background:white;border-radius:1.25rem;padding:1.25rem;border:1px solid #EDF2F7;position:sticky;top:1.5rem;display:flex;flex-direction:column;gap:.75rem}
    .res-sidebar-label{display:flex;align-items:center;gap:.3rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.5px;color:#9CA3AF}
    .res-sidebar-title{font-size:1.4rem;font-weight:800;line-height:1.2;color:#1A2C3E}
    .res-sidebar-sub{font-size:.78rem;color:#6B7280}
    .res-kpi{display:flex;align-items:center;gap:.65rem;padding:.6rem 0;border-bottom:1px solid #EDF2F7}
    .res-kpi-icon{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:.875rem}
    .res-kpi-label{font-size:.68rem;color:#9CA3AF}
    .res-kpi-val{font-weight:700;font-size:.95rem}
    .res-btn-full{width:100%;justify-content:center}
    .res-scroll{display:flex;flex-direction:column;gap:.875rem;max-height:85vh;overflow-y:auto}
    .res-day-card{background:white;border-radius:1.25rem;padding:1rem;border:1px solid #EDF2F7}
    .res-day-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.4rem;margin-bottom:.875rem;padding-bottom:.875rem;border-bottom:1px solid #EDF2F7}
    .res-day-title{display:flex;align-items:center;gap:.4rem;font-size:.95rem;font-weight:700;color:#1A2C3E}
    .res-day-date{font-size:.7rem;font-weight:400;color:#9CA3AF}
    .res-day-budget-badge{display:inline-flex;align-items:center;gap:.25rem;font-size:.68rem;background:#F3F4F6;padding:.22rem .65rem;border-radius:1rem;color:#4B5563}
    .res-sep,.res-hours{margin:0 .15rem}
    .res-day-empty{font-size:.78rem;color:#9CA3AF;text-align:center;padding:.75rem}
    .res-act-row{display:flex;align-items:center;gap:.65rem;padding:.6rem 0;border-bottom:1px solid #F3F4F6}
    .res-act-time{font-size:.68rem;font-weight:700;color:#02AFCF;background:rgba(2,175,207,.1);padding:.18rem .45rem;border-radius:1rem;min-width:56px;text-align:center;flex-shrink:0}
    .res-act-img{width:44px;height:44px;object-fit:cover;border-radius:.5rem;flex-shrink:0}
    .res-act-info{flex:1;min-width:0}
    .res-act-title{font-weight:600;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .res-act-meta{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.2rem}
    .res-meta-item{display:inline-flex;align-items:center;gap:.18rem;font-size:.64rem;color:#6B7280}
    .res-act-note{display:inline-flex;align-items:center;gap:.2rem;font-size:.64rem;background:#FEF3C7;padding:.18rem .45rem;border-radius:1rem;color:#B45309;margin-top:.2rem}
    .res-act-price{font-weight:700;font-size:.82rem;white-space:nowrap;flex-shrink:0}
  `;

  /* ── RESULT VIEW ── */
  if (view === "result") return (
    <div className="res-root">
      <style>{CSS}</style>
      <div className="res-top">
        <button className="res-btn res-btn-outline" onClick={() => setView("builder")}><ArrowLeft size={13}/> Retour au planning</button>
        <h1 className="res-title">Résumé de votre voyage</h1>
        <div className="res-actions">
          <button className="res-btn res-btn-outline" onClick={() => setView("builder")}><Pencil size={13}/> Modifier</button>
          <button className={`res-btn ${saveOk ? "res-btn-green" : "res-btn-dark"}`} onClick={saveItinerary} disabled={saving}>
            <Send size={13}/>{saving ? "Sauvegarde…" : saveOk ? "✅ Sauvegardé !" : savedItId ? "Mettre à jour" : "Sauvegarder"}
          </button>
        </div>
      </div>

      <div className="res-body">
        <div className="res-sidebar">
          <p className="res-sidebar-label"><BookMarked size={11}/> Votre itinéraire</p>
          <div className="res-sidebar-title">{days} jours en Tunisie</div>
          <p className="res-sidebar-sub">{selCities.join(" · ")}</p>
          {[
            { icon:<Layers size={15} color="#2B96A8"/>,    label:"Activités",    val:`${totAct}`,        color:"#2B96A8", bg:"rgba(43,150,168,.1)" },
            { icon:<PiggyBank size={15} color="#059669"/>, label:"Budget total", val:`${totBudget} TND`, color:"#059669", bg:"rgba(5,150,105,.1)"  },
            { icon:<Calendar size={15} color="#8B5CF6"/>,  label:"Durée",        val:`${days} jours`,   color:"#8B5CF6", bg:"rgba(139,92,246,.1)" },
          ].map(({ icon, label, val, color, bg }) => (
            <div key={label} className="res-kpi">
              <div className="res-kpi-icon" style={{ background:bg }}>{icon}</div>
              <div><div className="res-kpi-label">{label}</div><div className="res-kpi-val" style={{ color }}>{val}</div></div>
            </div>
          ))}
          <div style={{ display:"flex", flexDirection:"column", gap:".5rem", marginTop:".5rem" }}>
            <button className="res-btn res-btn-outline res-btn-full" onClick={() => setView("builder")}><Edit3 size={13}/> Modifier l&apos;itinéraire</button>
            <button className={`res-btn res-btn-full ${saveOk ? "res-btn-green" : "res-btn-dark"}`} onClick={saveItinerary} disabled={saving}>
              <Send size={13}/>{saving ? "Sauvegarde…" : saveOk ? "✅ Sauvegardé !" : savedItId ? "Mettre à jour" : "Sauvegarder ce voyage"}
            </button>
          </div>
        </div>

        <div className="res-scroll">
          {itin.map((day, i) => (
            <div key={i} className="res-day-card">
              <div className="res-day-header">
                <h3 className="res-day-title">
                  <span>{ve(day.city)}</span>Jour {i+1} — {day.city}
                  {day.date && <span className="res-day-date">· {new Date(day.date).toLocaleDateString("fr-FR",{ day:"numeric", month:"long" })}</span>}
                </h3>
                {day.activities.length > 0 && (
                  <span className="res-day-budget-badge">
                    <PiggyBank size={10}/>{day.activities.reduce((s,a)=>s+a.excursion.price_per_person,0)} TND
                    <span className="res-sep">·</span>
                    <Clock size={9} color="#9CA3AF"/>
                    <span className="res-hours">{day.activities.reduce((s,a)=>s+a.excursion.duration_hours,0)}h</span>
                  </span>
                )}
              </div>
              {day.activities.length === 0
                ? <p className="res-day-empty">Aucune activité planifiée</p>
                : [...day.activities].sort((a,b)=>(a.customTime||"").localeCompare(b.customTime||"")).map(act => {
                  const col  = cc(act.excursion.categories?.[0]);
                  const slot = SLOTS.find(s=>s.key===act.time)!;
                  return (
                    <div key={act.id} className="res-act-row">
                      <div className="res-act-time">{act.customTime||slot?.defaultTime}</div>
                      {act.excursion.photos?.[0] && <img src={act.excursion.photos[0]} alt="" className="res-act-img"/>}
                      <div className="res-act-info">
                        <div className="res-act-title">{act.excursion.title}</div>
                        <div className="res-act-meta">
                          <span className="res-meta-item"><MapPin size={8}/>{act.excursion.city}</span>
                          <span className="res-meta-item"><Clock size={8}/>{act.excursion.duration_hours}h</span>
                          {act.excursion.rating > 0 && <span className="res-meta-item"><Star size={8} color="#F59E0B" fill="#F59E0B"/>{act.excursion.rating}</span>}
                        </div>
                        {act.note && <div className="res-act-note"><FileText size={8}/>{act.note}</div>}
                      </div>
                      <span className="res-act-price" style={{ color:col }}>{act.excursion.price_per_person} TND</span>
                    </div>
                  );
                })
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── BUILDER VIEW ── */
  const currentDay = itin[activeDay];
  const dayActs    = currentDay?.activities || [];
  const dayBudget  = dayActs.reduce((s,a)=>s+a.excursion.price_per_person,0);
  const slotActs   = (slot:TimeKey) => [...dayActs].filter(a=>a.time===slot).sort((a,b)=>(a.customTime||"").localeCompare(b.customTime||""));

  const DatePickerModal = () => {
    const today = new Date().toISOString().split('T')[0];
    return (
      <div className="modal-overlay" onClick={() => setShowDatePicker(false)}>
        <div className="date-picker-box" onClick={e => e.stopPropagation()}>
          <div className="date-picker-header">
            <h3>Choisir une date</h3>
            <button onClick={() => setShowDatePicker(false)}><X size={16}/></button>
          </div>
          <input type="date" className="date-picker-input" value={tempDate} min={today} onChange={e => setTempDate(e.target.value)}/>
          <div className="date-picker-actions">
            <button className="date-cancel" onClick={() => setShowDatePicker(false)}>Annuler</button>
            <button className="date-confirm" onClick={() => {
              if (tempDate) {
                setItin(prev => { const u=[...prev]; u[activeDay]={...u[activeDay],date:tempDate}; return u; });
                setShowDatePicker(false); setTempDate("");
              }
            }}><CheckCircle2 size={13}/> Confirmer</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bl-root" style={{ maxWidth:1600, margin:"0 auto", padding:"1.25rem" }}>
      <style>{CSS}</style>
      {showDatePicker && <DatePickerModal/>}

      {/* Topbar */}
      <div className="bl-top">
        <div className="bl-top-left">
          <button className="bl-back" onClick={() => router.push("/touriste/modeLibre")}><ArrowLeft size={12}/> Reconfigurer</button>
          <span className="bl-chip"><Calendar size={11}/>{days} j · {selCities.join(" · ")}</span>
        </div>
        <div className="bl-top-right">
          {totAct > 0 && (
            <>
              <span className="bl-stat"><Layers size={11}/>{totAct} excursion{totAct>1?"s":""}</span>
              <span className="bl-budget-badge"><PiggyBank size={11}/>{totBudget} TND</span>
            </>
          )}
          <button className="bl-resume-btn" onClick={() => setView("result")}>Voir le résumé <ArrowRight size={12}/></button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="bl-day-tabs">
        {itin.map((day, i) => {
          const cnt = day.activities.length;
          return (
            <button key={i} className={`bl-day-tab${activeDay===i?" active":""}`} onClick={() => setActiveDay(i)}>
              <span>{ve(day.city)}</span>Jour {i+1} — {day.city}
              {cnt > 0 && <span className="bl-day-tab-cnt">{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="bl-body">

        {/* Catalogue — grille 3 colonnes */}
        <div className="bl-catalogue">
          <div className="bl-cat-header">
            <div className="bl-cat-header-top">
              <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap" }}>
                <div className="bl-cat-title"><BookMarked size={13} color="#2B96A8"/> Excursions</div>
                {/* Badge ville active */}
                {currentDayCity && (
                  <span className="bl-city-badge"><MapPin size={10}/>{currentDayCity}</span>
                )}
              </div>
              {!ldExc && !errExc && (
                <span className="bl-results-count"><MapPin size={9}/>{palette.length} résultat{palette.length!==1?"s":""}</span>
              )}
            </div>
            <div className="bl-search-row">
              <Search size={12} color="#9CA3AF" className="bl-search-icon"/>
              <input type="text" className="bl-search-input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <div className="bl-filter-row">
              <span className="bl-filter-label"><Clock size={10}/> Durée :</span>
              <button className={`bl-filter-btn ${filterDuration==="all"?"active":""}`} onClick={()=>setFilterDuration("all")}>Toutes</button>
              <button className={`bl-filter-btn ${filterDuration==="long"?"active":""}`} onClick={()=>setFilterDuration("long")}>&gt;6h</button>
            </div>
          </div>

          <div className="bl-cat-grid">
            {ldExc
              ? Array.from({length:6}).map((_,i) => <div key={i} className="exc-skeleton"/>)
              : errExc
                ? <div className="bl-cat-grid-full"><DbError message={errExc} onRetry={loadAll}/></div>
                : palette.length === 0
                  ? <div className="bl-cat-grid-full" style={{ textAlign:"center", padding:"2rem", color:"#9CA3AF" }}>
                      <MapPin size={28} style={{ marginBottom:".5rem", opacity:.4 }}/>
                      <p style={{ fontSize:".82rem" }}>Aucune excursion pour {currentDayCity}</p>
                    </div>
                  : palette.map(exc => {
                    const col   = cc(exc.categories?.[0]);
                    const added = isAdded(exc.id);
                    return (
                      <div key={exc.id} className="exc-card">
                        {exc.photos?.[0] ? (
                          <div className="exc-card-img">
                            <img src={exc.photos[0]} alt={exc.title}/>
                            <div className="exc-card-img-overlay"/>
                            <span className="exc-card-cat">{ce(exc.categories?.[0])} {exc.categories?.[0]}</span>
                          </div>
                        ) : (
                          <div className="exc-card-no-img" style={{ background:`${col}18` }}>{ce(exc.categories?.[0])}</div>
                        )}
                        <div className="exc-card-body">
                          <div className="exc-card-title">{exc.title}</div>
                          <div className="exc-card-meta">
                            <span className="exc-meta-item"><MapPin size={8}/>{exc.city}</span>
                            <span className="exc-meta-item"><Clock size={8}/>{exc.duration_hours}h</span>
                            {exc.rating > 0 && <span className="exc-meta-item"><Star size={8} color="#F59E0B" fill="#F59E0B"/>{exc.rating}</span>}
                          </div>
                          <div className="exc-card-footer">
                            <span className="exc-card-price" style={{ color:col }}>{exc.price_per_person} TND</span>
                            <button className={`exc-add-btn${added?" added":""}`} onClick={() => openSlotPicker(exc)}>
                              {added ? <><CheckCircle2 size={10}/> Ajouté</> : <><Plus size={10}/> Ajouter</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        </div>

        {/* Planner */}
        <div className="bl-planner">
          <div className="bl-planner-header">
            <div className="bl-planner-top">
              <div className="bl-planner-day-info">
                <div className="bl-planner-emoji">{ve(currentDay?.city)}</div>
                <div>
                  <div className="bl-planner-day-name">Jour {activeDay+1} — {currentDay?.city}</div>
                  <div className="bl-planner-date-row">
                    {currentDay?.date ? (
                      <span className="bl-planner-date-text">
                        {new Date(currentDay.date).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
                        <button className="edit-date-btn" onClick={() => setShowDatePicker(true)}><Edit3 size={9}/></button>
                      </span>
                    ) : (
                      <button className="bl-planner-date-btn" onClick={() => setShowDatePicker(true)}><CalendarDays size={10}/> Sélectionner une date</button>
                    )}
                    <select className="bl-city-select" value={currentDay?.city}
                      onChange={e => setItin(prev => { const u=[...prev]; u[activeDay]={...u[activeDay],city:e.target.value}; return u; })}>
                      {villes.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bl-planner-right">
                <div className="bl-day-totals">
                  <div className="bl-day-budget">{dayBudget} TND</div>
                  <div className="bl-day-count">{dayActs.length} activité{dayActs.length!==1?"s":""}</div>
                </div>
                <div className="bl-day-nav">
                  <button className="bl-nav-btn" disabled={activeDay===0} onClick={()=>setActiveDay(p=>p-1)}><ChevronLeft size={13}/></button>
                  <button className="bl-nav-btn" disabled={activeDay===days-1} onClick={()=>setActiveDay(p=>p+1)}><ChevronRight size={13}/></button>
                </div>
              </div>
            </div>
          </div>

          <div className="bl-planner-scroll">
            {dayActs.length === 0 ? (
              <div className="bl-planner-empty">
                <Plus size={36} strokeWidth={1.2} style={{ opacity:.3, display:"block", margin:"0 auto .75rem" }}/>
                <p>Aucune activité pour ce jour.<br/>Cliquez sur <strong>Ajouter</strong> dans le catalogue.</p>
              </div>
            ) : SLOTS.map(slot => {
              const acts       = slotActs(slot.key);
              const slotBudget = acts.reduce((s,a)=>s+a.excursion.price_per_person,0);
              return (
                <div key={slot.key} className="bl-slot">
                  <div className="bl-slot-header">
                    {slot.icon}
                    <span className="bl-slot-label" style={{ color:slot.color }}>{slot.label}</span>
                    <span className="bl-slot-hint">{slot.hint}</span>
                    {acts.length > 0 && <span className="bl-slot-total"><PiggyBank size={9}/>{slotBudget} TND · {acts.reduce((s,a)=>s+a.excursion.duration_hours,0)}h</span>}
                  </div>
                  {acts.length === 0
                    ? <div className="bl-slot-empty">Aucune activité ce créneau</div>
                    : acts.map(act => {
                      const col = cc(act.excursion.categories?.[0]);
                      return (
                        <div key={act.id} className="act-card">
                          <div className="act-card-time">{act.customTime||slot.defaultTime}</div>
                          {act.excursion.photos?.[0] && <img src={act.excursion.photos[0]} alt="" className="act-card-img"/>}
                          <div className="act-card-info">
                            <div className="act-card-title">{act.excursion.title}</div>
                            <div className="act-card-meta">
                              <span className="act-meta-item"><MapPin size={8}/>{act.excursion.city}</span>
                              <span className="act-meta-item"><Clock size={8}/>{act.excursion.duration_hours}h</span>
                              {act.excursion.rating > 0 && <span className="act-meta-item"><Star size={8} color="#F59E0B" fill="#F59E0B"/>{act.excursion.rating}</span>}
                            </div>
                            {act.note && <div className="act-card-note"><FileText size={8}/>{act.note}</div>}
                          </div>
                          <span className="act-card-price" style={{ color:col }}>{act.excursion.price_per_person} TND</span>
                          <div className="act-actions">
                            <button className="act-action-btn note" onClick={() => { setEditNote(act.id); setNoteText(act.note); }}><FileText size={12}/></button>
                            <button className="act-action-btn delete" onClick={() => rmAct(activeDay, act.id)}><Trash2 size={12}/></button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal slot */}
      {pendingExc && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setPendingExc(null); }}>
          <div className="slot-box">
            <div className="slot-box-title">Choisir le créneau</div>
            <p className="slot-box-sub">{pendingExc.title} · {pendingExc.price_per_person} TND</p>
            {SLOTS.map(slot => (
              <div key={slot.key} className={`slot-option${pickSlot===slot.key?" selected":""}`}
                onClick={() => { setPickSlot(slot.key); setPickTime(slot.defaultTime); }}>
                <div className="slot-option-icon" style={{ background:`${slot.color}18` }}>{slot.icon}</div>
                <div className="slot-option-info">
                  <div className="slot-option-label" style={{ color:slot.color }}>{slot.label}</div>
                  <div className="slot-option-hint">{slot.hint}</div>
                </div>
                {pickSlot===slot.key && (
                  <input type="time" className="slot-time-input" value={pickTime}
                    onChange={e => setPickTime(e.target.value)} onClick={e => e.stopPropagation()}/>
                )}
              </div>
            ))}
            <div className="slot-box-actions">
              <button className="slot-cancel" onClick={() => setPendingExc(null)}>Annuler</button>
              <button className="slot-confirm" onClick={confirmAdd}><CheckCircle2 size={13}/> Ajouter au jour {activeDay+1}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal note */}
      {editNote && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setEditNote(null); }}>
          <div className="note-box">
            <div className="note-box-title"><FileText size={16} color="#2B96A8"/>Note personnelle</div>
            <p className="note-box-sub">Conseil, rappel ou info utile…</p>
            <textarea autoFocus className="note-textarea" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Ex : Réservation recommandée…"/>
            <div className="note-box-actions">
              <button className="note-cancel" onClick={() => setEditNote(null)}>Annuler</button>
              <button className="note-save" onClick={() => saveNote(activeDay, editNote!)}><CheckCircle2 size={13}/> Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation:"spin 1s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <BuilderInner/>
    </Suspense>
  );
}