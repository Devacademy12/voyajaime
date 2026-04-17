"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import {
  ArrowLeft, Save, MapPin, Clock, Star, Plus, Trash2,
  Sunrise, Sun, Moon, Search, X, CheckCircle2, Loader2,
  FileText, Pencil, GripVertical, ChevronDown, ChevronUp,
  AlertCircle, Check, CalendarDays,
} from "lucide-react";

/* ─── Types ─── */
type TimeKey      = "matin" | "aprem" | "soir";
type ActivityItem = {
  id: string;
  excursion: { id: string; title: string; city: string; price_per_person: number; duration_hours: number; photos: string[]; categories: string[] };
  note: string;
  time: TimeKey;
  customTime?: string;
};
type DayPlan  = { city: string; date?: string; activities: ActivityItem[] };
type RawPlan  = DayPlan[] | { title?: string; days?: unknown[] } | null | undefined;
type Excursion = { id: string; title: string; city: string; price_per_person: number; duration_hours: number; rating: number; photos: string[]; categories: string[] };

const SLOTS = [
  { key:"matin" as TimeKey, label:"Matin",       icon:<Sunrise size={12} color="#F59E0B"/>, color:"#F59E0B", hint:"8h–12h",   defaultTime:"09:00" },
  { key:"aprem" as TimeKey, label:"Après-midi",  icon:<Sun     size={12} color="#2B96A8"/>, color:"#2B96A8", hint:"13h–17h",  defaultTime:"13:00" },
  { key:"soir"  as TimeKey, label:"Soir",        icon:<Moon    size={12} color="#8B5CF6"/>, color:"#8B5CF6", hint:"18h–22h",  defaultTime:"19:00" },
];

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=70";

/* ─── Normalize plan ─── */
function normalizePlan(raw: RawPlan): DayPlan[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as DayPlan[];
  if (typeof raw === "object" && Array.isArray((raw as { days?: unknown[] }).days)) {
    return ((raw as { days: unknown[] }).days).map((d: unknown) => {
      const dd = d as Record<string, unknown>;
      const acts: ActivityItem[] = Array.isArray(dd.activities)
        ? (dd.activities as Record<string, unknown>[]).map(a => ({
            id:   String(a.id || crypto.randomUUID()),
            note: String(a.description || ""),
            time: "matin" as const,
            excursion: {
              id:               String(a.id || ""),
              title:            String(a.name || ""),
              city:             String(dd.city || ""),
              price_per_person: Number(a.price) || 0,
              duration_hours:   parseFloat(String(a.duration || "2")) || 2,
              photos:           [],
              categories:       [],
            },
          }))
        : [];
      return { city: String(dd.city || ""), activities: acts };
    });
  }
  return [];
}

/* ══ COMPOSANT PRINCIPAL ══ */
export default function EditItineraireClient({ itineraireId }: { itineraireId: string }) {
  const router = useRouter();
  const sb     = useMemo(() => createClient(), []);

  /* State principal */
  const [plan,       setPlan]       = useState<DayPlan[]>([]);
  const [title,      setTitle]      = useState("Mon itinéraire");
  const [nbJours,    setNbJours]    = useState(0);
  const [villes,     setVilles]     = useState<string[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  /* UI state */
  const [activeDay,     setActiveDay]     = useState(0);
  const [editNote,      setEditNote]      = useState<{ dayIdx:number; actId:string } | null>(null);
  const [noteText,      setNoteText]      = useState("");
  const [editDayCity,   setEditDayCity]   = useState<number | null>(null);
  const [allVilles,     setAllVilles]     = useState<string[]>([]);

  /* Catalogue */
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [catSearch,     setCatSearch]     = useState("");
  const [catalogue,     setCatalogue]     = useState<Excursion[]>([]);
  const [catLoading,    setCatLoading]    = useState(false);
  const [pickSlot,      setPickSlot]      = useState<TimeKey>("matin");
  const [pickTime,      setPickTime]      = useState("09:00");
  const [pendingExc,    setPendingExc]    = useState<Excursion | null>(null);

  /* Chargement initial */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push(ROUTES.auth); return; }

      const [itRes, villesRes] = await Promise.all([
        sb.from("itineraires").select("*").eq("id", itineraireId).eq("user_id", user.id).single(),
        sb.from("villes").select("nom").eq("active", true).order("nom"),
      ]);

      if (itRes.error || !itRes.data) { setError("Itinéraire introuvable"); setLoading(false); return; }

      const it = itRes.data;
      setTitle(it.plan?.title || `${it.nb_jours} jours en Tunisie`);
      setNbJours(it.nb_jours);
      setVilles(it.villes_selectionnees || []);
      setPlan(normalizePlan(it.plan));
      setAllVilles((villesRes.data || []).map((v: { nom: string }) => v.nom));
      setLoading(false);

      /* Charger les photos des excursions IA */
      const ids = new Set<string>();
      normalizePlan(it.plan).forEach(day => day.activities?.forEach(act => { if (act.excursion?.id) ids.add(act.excursion.id); }));
      if (ids.size > 0) {
        const { data: excs } = await sb.from("excursions").select("id, title, city, price_per_person, duration_hours, rating, photos, categories").in("id", Array.from(ids));
        if (excs) {
          setPlan(prev => prev.map(day => ({
            ...day,
            activities: day.activities.map(act => {
              const exc = excs.find((e: Excursion) => e.id === act.excursion.id);
              return exc ? { ...act, excursion: { ...act.excursion, ...exc } } : act;
            }),
          })));
        }
      }
    })();
  }, [itineraireId]);

  /* Catalogue — charger au premier affichage */
  const openCatalogue = async () => {
    setShowCatalogue(true);
    if (catalogue.length === 0) {
      setCatLoading(true);
      const city = plan[activeDay]?.city;
      const q    = sb.from("excursions").select("id, title, city, price_per_person, duration_hours, rating, photos, categories").eq("is_active", true).order("rating", { ascending:false });
      const { data } = city ? await q.eq("city", city) : await q.limit(40);
      setCatalogue((data || []) as Excursion[]);
      setCatLoading(false);
    }
  };

  /* Changer la ville d'un jour → recharger le catalogue */
  const changeCity = async (dayIdx: number, city: string) => {
    setPlan(prev => { const u=[...prev]; u[dayIdx]={...u[dayIdx], city}; return u; });
    setEditDayCity(null);
    setCatalogue([]);
  };

  /* Ouvrir slot picker */
  const openSlotPicker = (exc: Excursion) => { setPendingExc(exc); setPickSlot("matin"); setPickTime("09:00"); };

  /* Confirmer ajout */
  const confirmAdd = () => {
    if (!pendingExc) return;
    const newAct: ActivityItem = {
      id: `${Date.now()}-${Math.random()}`,
      excursion: pendingExc,
      note: "", time: pickSlot, customTime: pickTime,
    };
    setPlan(prev => { const u=[...prev]; u[activeDay]={...u[activeDay], activities:[...u[activeDay].activities, newAct]}; return u; });
    setPendingExc(null);
  };

  /* Supprimer activité */
  const removeAct = (dayIdx: number, actId: string) =>
    setPlan(prev => { const u=[...prev]; u[dayIdx]={...u[dayIdx], activities:u[dayIdx].activities.filter(a=>a.id!==actId)}; return u; });

  /* Changer le créneau */
  const changeSlot = (dayIdx: number, actId: string, time: TimeKey) =>
    setPlan(prev => { const u=[...prev]; u[dayIdx]={...u[dayIdx], activities:u[dayIdx].activities.map(a=>a.id===actId?{...a,time}:a)}; return u; });

  /* Enregistrer note */
  const saveNote = () => {
    if (!editNote) return;
    setPlan(prev => { const u=[...prev]; u[editNote.dayIdx]={...u[editNote.dayIdx], activities:u[editNote.dayIdx].activities.map(a=>a.id===editNote.actId?{...a,note:noteText}:a)}; return u; });
    setEditNote(null); setNoteText("");
  };

  /* Ajouter un jour */
  const addDay = () => {
    const lastCity = plan[plan.length-1]?.city || villes[0] || "";
    setPlan(prev => [...prev, { city:lastCity, activities:[] }]);
    setNbJours(p => p+1);
    setTimeout(() => setActiveDay(plan.length), 50);
  };

  /* Supprimer un jour */
  const removeDay = (idx: number) => {
    if (plan.length <= 1) return;
    setPlan(prev => prev.filter((_,i)=>i!==idx));
    setNbJours(p => Math.max(1, p-1));
    setActiveDay(p => Math.min(p, plan.length-2));
  };

  /* Sauvegarder */
  const save = async () => {
    setSaving(true);
    const { data:{ user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("itineraires").update({
      nb_jours: plan.length,
      villes_selectionnees: [...new Set(plan.map(d=>d.city).filter(Boolean))],
      plan,
      updated_at: new Date().toISOString(),
    }).eq("id", itineraireId).eq("user_id", user.id);
    setSaving(false); setSaveOk(true);
    setTimeout(() => { setSaveOk(false); router.push(ROUTES.touriste.itineraires); }, 1800);
  };

  /* Excursions filtrées dans le catalogue */
  const filteredCat = catalogue.filter(e => {
    const q = catSearch.toLowerCase();
    return !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
  });
  const isAdded = (excId: string) => plan[activeDay]?.activities.some(a => a.excursion.id === excId);

  const totBudget = plan.reduce((s,d) => s + d.activities.reduce((ss,a) => ss+(a.excursion.price_per_person||0), 0), 0);

  /* ── CSS ── */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFF;color:#111827}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}

    /* Topbar */
    .ed-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 24px;background:white;border-bottom:1px solid #EEF2FF;position:sticky;top:0;z-index:100}
    .ed-top-left{display:flex;align-items:center;gap:12px}
    .ed-top-right{display:flex;align-items:center;gap:10px}
    .ed-back{display:flex;align-items:center;gap:6px;background:#F3F4F6;border:none;padding:8px 14px;border-radius:20px;font-size:13px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
    .ed-back:hover{background:#E5E7EB}
    .ed-title-input{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:#111827;border:none;background:transparent;outline:none;min-width:200px;max-width:400px;cursor:text;border-bottom:2px solid transparent;transition:border .2s}
    .ed-title-input:focus{border-bottom-color:#02AFCF}
    .ed-save-btn{display:flex;align-items:center;gap:7px;padding:9px 20px;background:linear-gradient(135deg,#02AFCF,#053366);color:white;border:none;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 14px rgba(2,175,207,.3)}
    .ed-save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(2,175,207,.4)}
    .ed-save-btn:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none}
    .ed-save-btn.ok{background:linear-gradient(135deg,#059669,#047857)}
    .ed-stat{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#6B7280;padding:6px 12px;background:#F3F4F6;border-radius:20px}

    /* Layout */
    .ed-body{display:grid;grid-template-columns:260px 1fr;min-height:calc(100vh - 64px)}
    @media(max-width:900px){.ed-body{grid-template-columns:1fr}}

    /* Sidebar jours */
    .ed-sidebar{background:white;border-right:1px solid #EEF2FF;padding:20px 14px;display:flex;flex-direction:column;gap:8px;position:sticky;top:64px;height:calc(100vh - 64px);overflow-y:auto}
    .ed-sidebar-title{font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;padding:0 8px;margin-bottom:4px}
    .ed-day-btn{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:1.5px solid transparent;cursor:pointer;background:none;font-family:inherit;transition:all .18s;text-align:left;width:100%;position:relative}
    .ed-day-btn.active{background:linear-gradient(135deg,rgba(2,175,207,.1),rgba(5,51,102,.06));border-color:rgba(2,175,207,.3)}
    .ed-day-btn:not(.active):hover{background:#F8FAFF;border-color:#EEF2FF}
    .ed-day-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;background:#F3F4F6;flex-shrink:0;font-family:'DM Sans',sans-serif}
    .ed-day-icon.active{background:linear-gradient(135deg,#02AFCF,#053366);color:white}
    .ed-day-info{flex:1;min-width:0}
    .ed-day-label{font-size:13px;font-weight:700;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .ed-day-meta{font-size:11px;color:#9CA3AF;margin-top:1px}
    .ed-day-cnt{position:absolute;top:6px;right:6px;background:#02AFCF;color:white;border-radius:20px;padding:2px 7px;font-size:10px;font-weight:700}
    .ed-add-day{display:flex;align-items:center;gap:6px;padding:9px 12px;border-radius:14px;border:1.5px dashed #DCE5FF;background:none;color:#9CA3AF;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;width:100%;transition:all .18s;margin-top:4px}
    .ed-add-day:hover{border-color:#02AFCF;color:#02AFCF;background:#F8FAFF}

    /* Zone principale */
    .ed-main{padding:24px 28px;display:flex;flex-direction:column;gap:20px;max-width:900px}

    /* En-tête du jour */
    .ed-day-header{background:white;border-radius:18px;border:1px solid #EEF2FF;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 2px 8px rgba(5,51,102,.04)}
    .ed-day-header-left{display:flex;align-items:center;gap:14px}
    .ed-day-num{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#02AFCF,#053366);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;font-weight:800;flex-shrink:0}
    .ed-day-city-btn{display:flex;align-items:center;gap:6px;background:#F3F4F6;border:none;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
    .ed-day-city-btn:hover{background:#E5E7EB}
    .ed-city-select{padding:6px 12px;border:1.5px solid #02AFCF;border-radius:20px;font-size:13px;font-family:inherit;color:#053366;font-weight:600;background:white;cursor:pointer;outline:none}
    .ed-day-stats{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .ed-day-stat{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#6B7280}
    .ed-remove-day{background:#FEF2F2;border:none;color:#DC2626;padding:7px 12px;border-radius:12px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;font-family:inherit;transition:all .15s}
    .ed-remove-day:hover{background:#FECACA}

    /* Slots */
    .ed-slot{background:white;border-radius:16px;border:1px solid #EEF2FF;overflow:hidden;box-shadow:0 2px 6px rgba(5,51,102,.03)}
    .ed-slot-hdr{display:flex;align-items:center;gap:8px;padding:12px 16px;background:#F9FAFF;border-bottom:1px solid #EEF2FF}
    .ed-slot-label{font-size:13px;font-weight:700}
    .ed-slot-hint{font-size:11px;color:#9CA3AF}
    .ed-slot-budget{margin-left:auto;font-size:12px;font-weight:700;color:#059669;display:flex;align-items:center;gap:4px}
    .ed-slot-body{padding:12px}
    .ed-slot-empty{text-align:center;padding:16px;font-size:12px;color:#C4C9D0;font-style:italic;background:#FAFBFF;border-radius:10px;border:1px dashed #EEF2FF}

    /* Act card */
    .act-card{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#FAFBFF;border-radius:12px;border:1.5px solid #EEF2FF;margin-bottom:8px;transition:all .15s;position:relative;animation:fadeUp .2s ease}
    .act-card:hover{border-color:#DCE5FF;background:white;box-shadow:0 3px 10px rgba(5,51,102,.06)}
    .act-photo{width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;border:1px solid #EEF2FF}
    .act-photo-ph{width:44px;height:44px;border-radius:10px;background:#EEF2FF;flex-shrink:0;display:flex;align-items:center;justify-content:center}
    .act-info{flex:1;min-width:0}
    .act-title{font-size:13px;font-weight:700;color:#111827;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .act-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .act-meta-item{display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#6B7280}
    .act-note-badge{display:inline-flex;align-items:center;gap:3px;font-size:10px;background:#FEF3C7;color:#B45309;padding:2px 7px;border-radius:20px}
    .act-price{font-size:13px;font-weight:800;color:#02AFCF;flex-shrink:0}
    .act-actions{display:flex;gap:5px;flex-shrink:0}
    .act-action-btn{background:#F3F4F6;border:none;padding:5px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .act-action-btn:hover.note{background:#FEF3C7;color:#B45309}
    .act-action-btn.note:hover{background:#FEF3C7;color:#B45309}
    .act-action-btn.del:hover{background:#FEE2E2;color:#DC2626}
    .act-slot-select{background:#F3F4F6;border:none;border-radius:8px;font-size:11px;font-family:inherit;font-weight:600;color:#374151;padding:4px 6px;cursor:pointer}

    /* Bouton ajouter */
    .ed-add-act{display:flex;align-items:center;gap:6px;padding:10px 16px;border:1.5px dashed #DCE5FF;border-radius:12px;background:none;color:#02AFCF;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;width:100%;justify-content:center;transition:all .18s;margin-top:4px}
    .ed-add-act:hover{background:#F0FAFF;border-color:#02AFCF}

    /* Catalogue modal */
    .cat-overlay{position:fixed;inset:0;background:rgba(5,19,51,.55);backdrop-filter:blur(4px);z-index:500;display:flex;align-items:flex-end;justify-content:center}
    @media(min-width:640px){.cat-overlay{align-items:center}}
    .cat-panel{background:white;border-radius:24px 24px 0 0;width:100%;max-width:680px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,.2);animation:slideIn .25s ease}
    @media(min-width:640px){.cat-panel{border-radius:24px;max-height:85vh}}
    .cat-header{padding:18px 20px 14px;border-bottom:1px solid #EEF2FF}
    .cat-header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .cat-title{font-size:16px;font-weight:800;color:#111827}
    .cat-close{background:#F3F4F6;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9CA3AF;transition:all .15s}
    .cat-close:hover{background:#E5E7EB;color:#374151}
    .cat-search{position:relative}
    .cat-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none}
    .cat-search-input{width:100%;padding:10px 12px 10px 36px;border:1.5px solid #EEF2FF;border-radius:12px;font-size:13px;font-family:inherit;color:#111827;background:#FAFBFF;outline:none;transition:all .2s}
    .cat-search-input:focus{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.08)}
    .cat-grid{flex:1;overflow-y:auto;padding:14px 16px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    @media(max-width:480px){.cat-grid{grid-template-columns:1fr}}
    .cat-card{border-radius:14px;overflow:hidden;border:1.5px solid #EEF2FF;background:white;cursor:pointer;transition:all .18s}
    .cat-card:hover{border-color:#DCE5FF;box-shadow:0 4px 14px rgba(5,51,102,.08);transform:translateY(-2px)}
    .cat-card.added{border-color:#059669;background:#F0FDF4}
    .cat-card-img{height:90px;overflow:hidden;position:relative}
    .cat-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .35s}
    .cat-card:hover .cat-card-img img{transform:scale(1.06)}
    .cat-card-body{padding:10px}
    .cat-card-title{font-size:12px;font-weight:700;color:#111827;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .cat-card-meta{display:flex;justify-content:space-between;align-items:center}
    .cat-card-price{font-size:13px;font-weight:800;color:#02AFCF}
    .cat-card-add{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;border:none;cursor:pointer;font-family:inherit;transition:all .15s}
    .cat-card-add.idle{background:#F3F4F6;color:#374151}
    .cat-card-add.idle:hover{background:#EEF2FF;color:#02AFCF}
    .cat-card-add.done{background:#D1FAE5;color:#059669}

    /* Slot picker */
    .slot-overlay{position:fixed;inset:0;background:rgba(5,19,51,.5);backdrop-filter:blur(3px);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px}
    .slot-box{background:white;border-radius:20px;padding:22px;width:100%;max-width:380px;box-shadow:0 20px 50px rgba(0,0,0,.2)}
    .slot-box-title{font-size:15px;font-weight:800;color:#111827;margin-bottom:3px}
    .slot-box-sub{font-size:12px;color:#9CA3AF;margin-bottom:14px}
    .slot-option{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:#F9FAFB;margin-bottom:6px;cursor:pointer;transition:all .15s;border:1.5px solid transparent}
    .slot-option.sel{background:rgba(2,175,207,.08);border-color:rgba(2,175,207,.3)}
    .slot-option-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center}
    .slot-option-label{font-size:13px;font-weight:700}
    .slot-option-hint{font-size:11px;color:#9CA3AF}
    .slot-time-input{background:white;border:1px solid #E5E7EB;padding:4px 8px;border-radius:8px;font-size:12px;font-family:inherit;margin-left:auto}
    .slot-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
    .slot-cancel{background:#F3F4F6;border:none;padding:8px 16px;border-radius:12px;font-size:13px;cursor:pointer;font-family:inherit}
    .slot-confirm{background:linear-gradient(135deg,#02AFCF,#053366);border:none;padding:8px 18px;border-radius:12px;font-size:13px;font-weight:700;color:white;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit}

    /* Note modal */
    .note-overlay{position:fixed;inset:0;background:rgba(5,19,51,.5);backdrop-filter:blur(3px);z-index:700;display:flex;align-items:center;justify-content:center;padding:20px}
    .note-box{background:white;border-radius:20px;padding:22px;width:100%;max-width:380px;box-shadow:0 20px 50px rgba(0,0,0,.2)}
    .note-box-title{font-size:15px;font-weight:800;color:#111827;margin-bottom:3px;display:flex;align-items:center;gap:7px}
    .note-box-sub{font-size:12px;color:#9CA3AF;margin-bottom:12px}
    .note-textarea{width:100%;padding:10px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:13px;font-family:inherit;resize:vertical;min-height:80px;outline:none;transition:all .2s}
    .note-textarea:focus{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.08)}
    .note-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
    .note-cancel{background:#F3F4F6;border:none;padding:8px 16px;border-radius:12px;font-size:13px;cursor:pointer;font-family:inherit}
    .note-save{background:linear-gradient(135deg,#02AFCF,#053366);border:none;padding:8px 18px;border-radius:12px;font-size:13px;font-weight:700;color:white;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit}

    /* Scrollbar */
    *::-webkit-scrollbar{width:4px;height:4px}
    *::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:2px}
  `;

  /* ── Loading ── */
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:12, color:"#9CA3AF", fontFamily:"'DM Sans',sans-serif" }}>
        <Loader2 size={24} color="#02AFCF" style={{ animation:"spin .8s linear infinite" }}/>
        Chargement de l&apos;itinéraire…
      </div>
    </>
  );

  /* ── Erreur ── */
  if (error) return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", flexDirection:"column", gap:14, fontFamily:"'DM Sans',sans-serif" }}>
        <AlertCircle size={36} color="#DC2626"/>
        <p style={{ fontSize:16, fontWeight:700, color:"#111827" }}>{error}</p>
        <button onClick={() => router.back()} className="ed-back"><ArrowLeft size={14}/> Retour</button>
      </div>
    </>
  );

  const currentDay = plan[activeDay];
  const dayBudget  = currentDay?.activities.reduce((s,a) => s+(a.excursion.price_per_person||0), 0) || 0;
  const dayHours   = currentDay?.activities.reduce((s,a) => s+(a.excursion.duration_hours||0), 0) || 0;

  return (
    <>
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <div className="ed-top">
        <div className="ed-top-left">
          <button className="ed-back" onClick={() => router.push(ROUTES.touriste.itineraires)}>
            <ArrowLeft size={14}/> Mes itinéraires
          </button>
          <input
            className="ed-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de l'itinéraire"
          />
        </div>
        <div className="ed-top-right">
          <span className="ed-stat"><CalendarDays size={12}/> {plan.length} jour{plan.length>1?"s":""}</span>
          <span className="ed-stat" style={{ color:"#059669" }}>{totBudget} TND</span>
          <button
            className={`ed-save-btn ${saveOk?"ok":""}`}
            onClick={save}
            disabled={saving || saveOk}
          >
            {saving ? <><Loader2 size={13} style={{ animation:"spin .7s linear infinite" }}/> Enregistrement…</>
             : saveOk ? <><Check size={13}/> Enregistré !</>
             : <><Save size={13}/> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ed-body">

        {/* Sidebar jours */}
        <div className="ed-sidebar">
          <p className="ed-sidebar-title">Jours du voyage</p>
          {plan.map((day, i) => (
            <button
              key={i}
              className={`ed-day-btn ${activeDay===i?"active":""}`}
              onClick={() => { setActiveDay(i); setCatalogue([]); }}
            >
              <div className={`ed-day-icon ${activeDay===i?"active":""}`}>
                {i+1}
              </div>
              <div className="ed-day-info">
                <div className="ed-day-label">Jour {i+1}</div>
                <div className="ed-day-meta">
                  <MapPin size={9} style={{ display:"inline", verticalAlign:"middle" }}/> {day.city || "Ville non définie"}
                </div>
              </div>
              {day.activities.length > 0 && (
                <span className="ed-day-cnt">{day.activities.length}</span>
              )}
            </button>
          ))}
          <button className="ed-add-day" onClick={addDay}>
            <Plus size={13}/> Ajouter un jour
          </button>
        </div>

        {/* Zone principale */}
        <div className="ed-main">

          {/* En-tête du jour */}
          <div className="ed-day-header">
            <div className="ed-day-header-left">
              <div className="ed-day-num">{activeDay+1}</div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#111827", marginBottom:6 }}>
                  Jour {activeDay+1}
                </div>
                {editDayCity === activeDay ? (
                  <select
                    className="ed-city-select"
                    value={currentDay?.city}
                    onChange={e => changeCity(activeDay, e.target.value)}
                    autoFocus
                    onBlur={() => setEditDayCity(null)}
                  >
                    {allVilles.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : (
                  <button className="ed-day-city-btn" onClick={() => setEditDayCity(activeDay)}>
                    <MapPin size={11} color="#02AFCF"/> {currentDay?.city || "Choisir une ville"}
                    <Pencil size={10} color="#9CA3AF"/>
                  </button>
                )}
              </div>
            </div>
            <div className="ed-day-stats">
              <span className="ed-day-stat"><Clock size={11}/> {dayHours}h</span>
              <span className="ed-day-stat" style={{ color:"#059669", fontWeight:700 }}>{dayBudget} TND</span>
              <span className="ed-day-stat">{currentDay?.activities.length || 0} activité{(currentDay?.activities.length||0)>1?"s":""}</span>
              {plan.length > 1 && (
                <button className="ed-remove-day" onClick={() => removeDay(activeDay)}>
                  <Trash2 size={11}/> Supprimer ce jour
                </button>
              )}
            </div>
          </div>

          {/* Slots */}
          {SLOTS.map(slot => {
            const acts = currentDay?.activities.filter(a=>a.time===slot.key) || [];
            const slotBudget = acts.reduce((s,a)=>s+(a.excursion.price_per_person||0),0);
            return (
              <div key={slot.key} className="ed-slot">
                <div className="ed-slot-hdr">
                  {slot.icon}
                  <span className="ed-slot-label" style={{ color:slot.color }}>{slot.label}</span>
                  <span className="ed-slot-hint">{slot.hint}</span>
                  {acts.length > 0 && <span className="ed-slot-budget">{slotBudget} TND</span>}
                </div>
                <div className="ed-slot-body">
                  {acts.length === 0 ? (
                    <div className="ed-slot-empty">Aucune activité — ajoutez-en une ci-dessous</div>
                  ) : acts.map(act => (
                    <div key={act.id} className="act-card">
                      {act.excursion.photos?.[0]
                        ? <img src={act.excursion.photos[0]} alt="" className="act-photo" onError={e=>{(e.target as HTMLImageElement).src=FALLBACK}}/>
                        : <div className="act-photo-ph"><Star size={16} color="#D1D5DB" strokeWidth={1.5}/></div>
                      }
                      <div className="act-info">
                        <div className="act-title">{act.excursion.title}</div>
                        <div className="act-meta">
                          <span className="act-meta-item"><MapPin size={9}/>{act.excursion.city}</span>
                          <span className="act-meta-item"><Clock size={9}/>{act.excursion.duration_hours}h</span>
                          {act.excursion.price_per_person > 0 && <span className="act-meta-item" style={{ color:"#02AFCF", fontWeight:700 }}>{act.excursion.price_per_person} TND</span>}
                          {act.note && <span className="act-note-badge"><FileText size={8}/>{act.note.slice(0,24)}{act.note.length>24?"…":""}</span>}
                        </div>
                      </div>
                      {/* Changer créneau */}
                      <select className="act-slot-select" value={act.time} onChange={e=>changeSlot(activeDay,act.id,e.target.value as TimeKey)}>
                        {SLOTS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                      <div className="act-actions">
                        <button className="act-action-btn note" title="Note" onClick={()=>{setEditNote({dayIdx:activeDay,actId:act.id});setNoteText(act.note);}}>
                          <FileText size={12} color={act.note?"#B45309":"#9CA3AF"}/>
                        </button>
                        <button className="act-action-btn del" title="Supprimer" onClick={()=>removeAct(activeDay,act.id)}>
                          <Trash2 size={12} color="#9CA3AF"/>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="ed-add-act" onClick={openCatalogue}>
                    <Plus size={14}/> Ajouter une activité au {slot.label.toLowerCase()}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Catalogue modal ── */}
      {showCatalogue && (
        <div className="cat-overlay" onClick={e=>{ if(e.target===e.currentTarget) setShowCatalogue(false); }}>
          <div className="cat-panel">
            <div className="cat-header">
              <div className="cat-header-top">
                <div>
                  <div className="cat-title">Ajouter une excursion</div>
                  <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>
                    Excursions disponibles à <strong style={{ color:"#02AFCF" }}>{currentDay?.city}</strong>
                  </div>
                </div>
                <button className="cat-close" onClick={()=>setShowCatalogue(false)}><X size={15}/></button>
              </div>
              <div className="cat-search">
                <Search size={13} color="#9CA3AF" className="cat-search-icon"/>
                <input className="cat-search-input" placeholder="Rechercher…" value={catSearch} onChange={e=>setCatSearch(e.target.value)}/>
              </div>
            </div>
            <div className="cat-grid">
              {catLoading ? (
                Array.from({length:6}).map((_,i)=>(
                  <div key={i} style={{ borderRadius:14, overflow:"hidden", border:"1px solid #EEF2FF" }}>
                    <div style={{ height:90, background:"linear-gradient(90deg,#EEF2FF 25%,#DCE5FF 50%,#EEF2FF 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }}/>
                    <div style={{ padding:10 }}><div style={{ height:12, width:"70%", borderRadius:4, background:"#EEF2FF" }}/></div>
                  </div>
                ))
              ) : filteredCat.length === 0 ? (
                <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"32px 20px", color:"#9CA3AF" }}>
                  <Search size={28} style={{ marginBottom:8, opacity:.4 }}/>
                  <p style={{ fontSize:13 }}>Aucune excursion pour {currentDay?.city}</p>
                </div>
              ) : filteredCat.map(exc => {
                const added = isAdded(exc.id);
                return (
                  <div key={exc.id} className={`cat-card ${added?"added":""}`}>
                    <div className="cat-card-img">
                      <img src={exc.photos?.[0]||FALLBACK} alt={exc.title} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK}}/>
                    </div>
                    <div className="cat-card-body">
                      <div className="cat-card-title">{exc.title}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                        <span style={{ fontSize:11, color:"#9CA3AF", display:"flex", alignItems:"center", gap:3 }}><Clock size={9}/>{exc.duration_hours}h</span>
                        {exc.rating > 0 && <span style={{ fontSize:11, color:"#9CA3AF", display:"flex", alignItems:"center", gap:3 }}><Star size={9} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>{exc.rating}</span>}
                      </div>
                      <div className="cat-card-meta">
                        <span className="cat-card-price">{exc.price_per_person} TND</span>
                        <button
                          className={`cat-card-add ${added?"done":"idle"}`}
                          onClick={() => { if (!added) openSlotPicker(exc); }}
                        >
                          {added ? <><CheckCircle2 size={11}/> Ajouté</> : <><Plus size={11}/> Ajouter</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Slot picker ── */}
      {pendingExc && (
        <div className="slot-overlay" onClick={e=>{if(e.target===e.currentTarget)setPendingExc(null);}}>
          <div className="slot-box">
            <div className="slot-box-title">Choisir le créneau</div>
            <p className="slot-box-sub">{pendingExc.title} · {pendingExc.price_per_person} TND</p>
            {SLOTS.map(slot=>(
              <div key={slot.key} className={`slot-option ${pickSlot===slot.key?"sel":""}`}
                onClick={()=>{setPickSlot(slot.key);setPickTime(slot.defaultTime);}}>
                <div className="slot-option-icon" style={{ background:`${slot.color}18` }}>{slot.icon}</div>
                <div><div className="slot-option-label" style={{ color:slot.color }}>{slot.label}</div><div className="slot-option-hint">{slot.hint}</div></div>
                {pickSlot===slot.key && (
                  <input type="time" className="slot-time-input" value={pickTime}
                    onChange={e=>setPickTime(e.target.value)} onClick={e=>e.stopPropagation()}/>
                )}
              </div>
            ))}
            <div className="slot-actions">
              <button className="slot-cancel" onClick={()=>setPendingExc(null)}>Annuler</button>
              <button className="slot-confirm" onClick={()=>{confirmAdd();setShowCatalogue(false);}}>
                <CheckCircle2 size={13}/> Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note modal ── */}
      {editNote && (
        <div className="note-overlay" onClick={e=>{if(e.target===e.currentTarget)setEditNote(null);}}>
          <div className="note-box">
            <div className="note-box-title"><FileText size={15} color="#02AFCF"/> Note personnelle</div>
            <p className="note-box-sub">Conseil, rappel ou info utile pour cette activité</p>
            <textarea autoFocus className="note-textarea" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Ex : Réservation recommandée à l'avance…"/>
            <div className="note-actions">
              <button className="note-cancel" onClick={()=>setEditNote(null)}>Annuler</button>
              <button className="note-save" onClick={saveNote}><Check size={13}/> Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}