"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  ArrowLeft, FileText, ImageIcon, Settings2, Tag,
  AlertTriangle, CheckCircle2, Loader2, X, Plus,
  Save, Rocket, Info, Clock, Users, Banknote,
  Languages, Package, MapPin, CalendarDays, Trash2,
  ChevronDown, AlertCircle, Navigation, Star, Lock,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Constantes
───────────────────────────────────────────── */
// LANGUES: supprimé — désormais dynamique via props (Supabase)

const INCLUSIONS = ["Guide francophone", "Transport", "Repas", "Eau minérale", "Équipement", "Photos", "Billet d'entrée"];
const DIFFICULTY = [
  { value: "facile",    label: "Facile",    icon: "🟢", color: "#059669", bg: "rgba(5,150,105,.08)",  border: "rgba(5,150,105,.25)"  },
  { value: "modere",    label: "Modéré",    icon: "🟡", color: "#D97706", bg: "rgba(217,119,6,.08)",  border: "rgba(217,119,6,.25)"  },
  { value: "difficile", label: "Difficile", icon: "🔴", color: "#DC2626", bg: "rgba(220,38,38,.08)",  border: "rgba(220,38,38,.25)"  },
];
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function toggle(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface PhotoPreview { file: File; url: string; uploading: boolean; uploaded?: string; }
interface Ville        { id: string; nom: string; active: boolean; }
interface Categorie    { id: string; nom: string; couleur: string; }
interface Langue       { id: string; nom: string; }   // ← nouveau type Supabase

interface DateDispo {
  date: string;
  slots: number;
  departure_time: string;  // heure principale (compatibilité)
  departure_times?: string[]; // plusieurs heures de départ possibles
}

/* ─────────────────────────────────────────────
   Hook de validation
───────────────────────────────────────────── */
function useValidation(s: {
  title: string; city: string; description: string;
  languages: string[]; categories: string[];
  dates: DateDispo[]; photos: PhotoPreview[];
  price: number; duration: number; maxPeople: number;
}) {
  const v = {
    title:       s.title.trim().length >= 5,
    city:        s.city.trim().length > 0,
    description: s.description.trim().length >= 30,
    languages:   s.languages.length > 0,
    categories:  s.categories.length > 0,
    dates:       s.dates.length > 0,
    photos:      s.photos.length >= 1,
    price:       s.price > 0 && s.price <= 9999,
    duration:    s.duration >= 0.5 && s.duration <= 24,
    maxPeople:   s.maxPeople >= 1 && s.maxPeople <= 200,
  };
  const vals = Object.values(v);
  return {
    v,
    isReadyToPublish: vals.every(Boolean),
    pct: Math.round((vals.filter(Boolean).length / vals.length) * 100),
  };
}

/* ─────────────────────────────────────────────
   Sous-composants
───────────────────────────────────────────── */
function SectionTitle({ icon: Icon, label, subtitle }: { icon: React.ElementType; label: string; subtitle?: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, paddingBottom:14, borderBottom:"1px solid #F3F4F6" }}>
      <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,rgba(15,118,110,.12),rgba(20,184,166,.08))", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"1px solid rgba(15,118,110,.15)" }}>
        <Icon size={15} color="#0F766E" />
      </div>
      <div>
        <p style={{ fontSize:13.5, fontWeight:700, color:"#0F172A", margin:0, letterSpacing:"-.01em" }}>{label}</p>
        {subtitle && <p style={{ fontSize:11.5, color:"#94A3B8", margin:"2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Chip({ label, selected, color="#0F766E", onClick }: { label:string; selected:boolean; color?:string; onClick:()=>void }) {
  return (
    <button type="button" onClick={onClick} style={{ padding:"7px 14px", borderRadius:100, cursor:"pointer", fontFamily:"inherit", fontSize:12.5, transition:"all .18s", fontWeight:selected?700:500, border:`1.5px solid ${selected?color:"#E2E8F0"}`, background:selected?`${color}18`:"white", color:selected?color:"#64748B", transform:selected?"scale(1.02)":"scale(1)", boxShadow:selected?`0 0 0 3px ${color}18`:"none" }}>
      {label}
    </button>
  );
}

function Field({ label, required, hint, error, children }: { label:string; required?:boolean; hint?:string; error?:string; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#475569", letterSpacing:".5px", textTransform:"uppercase" as const, marginBottom:7 }}>
        {label}{required && <span style={{ color:"#EF4444", fontSize:9 }}>●</span>}
      </label>
      {children}
      {error && <p style={{ fontSize:11, color:"#EF4444", marginTop:5, fontWeight:600 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize:11, color:"#94A3B8", marginTop:5, lineHeight:1.5 }}>{hint}</p>}
    </div>
  );
}

/* Indicateur d'étape dans les panneaux de saisie date */
function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
      <div style={{ width:22, height:22, borderRadius:"50%", background:"#0F172A", color:"white", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
      <span style={{ fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase" as const, letterSpacing:".5px" }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Composant principal
   Props : langues est maintenant passé depuis le serveur (Supabase)
───────────────────────────────────────────── */
export default function NouvelleExcursionClient({
  villes,
  categories: categoriesDB,
  langues = [],                    // ← défaut [] si undefined
}: {
  villes: Ville[];
  categories: Categorie[];
  langues?: Langue[];              // ← optionnel avec fallback
}) {
  const supabase  = createClient();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pubMode, setPubMode] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<"infos"|"details"|"dates"|"photos">("infos");

  /* Champs */
  const [title,       setTitle]       = useState("");
  const [city,        setCity]        = useState("");
  const [description, setDescription] = useState("");
  const [duration,    setDuration]    = useState(2);
  const [price,       setPrice]       = useState(50);
  const [maxPeople,   setMaxPeople]   = useState(10);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [languages,   setLanguages]   = useState<string[]>([]);
  const [inclusions,  setInclusions]  = useState<string[]>([]);
  const [photos,      setPhotos]      = useState<PhotoPreview[]>([]);
  const [meetingPt,   setMeetingPt]   = useState("");
  const [difficulty,  setDifficulty]  = useState("");
  const [minAge,      setMinAge]      = useState<number|"">("");
  const [whatBring,   setWhatBring]   = useState("");
  const [notIncl,     setNotIncl]     = useState("");
  const [impInfo,     setImpInfo]     = useState("");
  const [cancelPol,   setCancelPol]   = useState("Annulation gratuite jusqu'à 24h avant");
  const [dates,       setDates]       = useState<DateDispo[]>([]);

  /* ── Ajout d'une date ── */
  const [newDate,  setNewDate]  = useState("");
  const [newSlots, setNewSlots] = useState(10);
  const [newTimes, setNewTimes] = useState<string[]>(["09:00"]);

  /* ── Dates récurrentes ── */
  const [recurDays,  setRecurDays]  = useState<number[]>([]);
  const [recurSlots, setRecurSlots] = useState(10);
  const [recurTime,  setRecurTime]  = useState("09:00");
  const [recurFrom,  setRecurFrom]  = useState("");
  const [recurTo,    setRecurTo]    = useState("");

  const { v, isReadyToPublish, pct } = useValidation({ title, city, description, languages, categories, dates, photos, price, duration, maxPeople });

  /* ── Photos ── */
  const handleFiles = (files: FileList|null) => {
    if (!files) return;
    Array.from(files).slice(0, 6-photos.length).forEach(f => {
      if (!f.type.startsWith("image/")) return;
      setPhotos(p => [...p, { file:f, url:URL.createObjectURL(f), uploading:false }]);
    });
  };
  const removePhoto = (i: number) => setPhotos(p => { const n=[...p]; URL.revokeObjectURL(n[i].url); n.splice(i,1); return n; });
  const uploadPhotos = async (uid: string): Promise<string[]> => {
    const urls: string[] = [];
    const up = [...photos];
    for (let i=0; i<up.length; i++) {
      if (up[i].uploaded) { urls.push(up[i].uploaded!); continue; }
      up[i].uploading=true; setPhotos([...up]);
      const ext=up[i].file.name.split(".").pop();
      const path=`${uid}/${Date.now()}-${i}.${ext}`;
      const { data, error } = await supabase.storage.from("excursions-photos").upload(path, up[i].file, { upsert:true });
      if (error) continue;
      const { data:{publicUrl} } = supabase.storage.from("excursions-photos").getPublicUrl(data.path);
      up[i].uploading=false; up[i].uploaded=publicUrl; urls.push(publicUrl);
    }
    setPhotos([...up]); return urls;
  };

  /* ── Dates ── */
  const addDate = () => {
    if (!newDate) return;
    const times = newTimes.filter(t => t.trim());
    const mainTime = times.length > 0 ? times[0] : "09:00";
    const existing = dates.find(d => d.date === newDate);
    if (existing) {
      // Fusionner les heures si la date existe déjà
      const merged = Array.from(new Set([...(existing.departure_times || [existing.departure_time]), ...times])).sort();
      setDates(p => p.map(x => x.date === newDate ? { ...x, departure_time: merged[0], departure_times: merged, slots: newSlots } : x));
    } else {
      setDates(p => [...p, { date: newDate, slots: newSlots, departure_time: mainTime, departure_times: times.length > 0 ? times : [mainTime] }]
        .sort((a, b) => a.date.localeCompare(b.date)));
    }
    setNewDate("");
    setNewTimes(["09:00"]);
  };
  const removeDate        = (d: string) => setDates(p => p.filter(x => x.date !== d));
  const updateSlots       = (d: string, s: number) => setDates(p => p.map(x => x.date===d ? {...x, slots:s} : x));
  const updateDepartureTime = (d: string, t: string) => setDates(p => p.map(x => x.date===d ? {...x, departure_time:t} : x));
  const addTimeToDate = (d: string, t: string) => setDates(p => p.map(x => {
    if (x.date !== d) return x;
    const times = Array.from(new Set([...(x.departure_times || [x.departure_time]), t])).sort();
    return { ...x, departure_time: times[0], departure_times: times };
  }));
  const removeTimeFromDate = (d: string, t: string) => setDates(p => p.map(x => {
    if (x.date !== d) return x;
    const times = (x.departure_times || [x.departure_time]).filter(tt => tt !== t);
    const safe = times.length > 0 ? times : ["09:00"];
    return { ...x, departure_time: safe[0], departure_times: safe };
  }));

  const genRecurring = () => {
    if (!recurFrom || !recurTo || recurDays.length===0) return;
    const from=new Date(recurFrom), to=new Date(recurTo), added:DateDispo[]=[], cur=new Date(from);
    while (cur <= to) {
      if (recurDays.includes(cur.getDay())) {
        const iso = cur.toISOString().slice(0,10);
        if (!dates.find(d => d.date===iso)) added.push({ date:iso, slots:recurSlots, departure_time: recurTime || "09:00", departure_times: [recurTime || "09:00"] });
      }
      cur.setDate(cur.getDate()+1);
    }
    setDates(p => [...p, ...added].sort((a,b) => a.date.localeCompare(b.date)));
  };

  /* ── Submit ──
     available_dates = [{ date, slots, departure_time }, ...]
     → stocké dans la colonne JSONB + departure_time dans la colonne dédiée
  ── */
  const submit = async (pub: boolean) => {
    if (!title || !city || !description) { setError("Remplissez les champs obligatoires."); setTab("infos"); return; }
    setLoading(true); setPubMode(pub); setError(null);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée."); setLoading(false); return; }

    const photoUrls = photos.length > 0 ? await uploadPhotos(user.id) : [];

    // Normaliser chaque date avec departure_time non vide
    const safeDates = dates.map(d => {
      const times = (d.departure_times && d.departure_times.length > 0) ? d.departure_times : [d.departure_time || "09:00"];
      return {
        date:            d.date,
        slots:           d.slots,
        departure_time:  times[0],
        departure_times: times,
      };
    });

    // departure_time par défaut = heure de la première date (ou "09:00")
    const defaultDepartureTime = safeDates.length > 0 ? safeDates[0].departure_time : "09:00";

    const { error: err } = await supabase.from("excursions").insert({
      prestataire_id:   user.id,
      title,
      city,
      description,
      duration_hours:   duration,
      price_per_person: price,
      max_people:       maxPeople,
      categories,
      languages,
      inclusions,
      photos:           photoUrls,
      is_active:        pub,
      meeting_point:    meetingPt  || null,
      difficulty:       difficulty || null,
      min_age:          minAge     || null,
      what_to_bring:    whatBring  || null,
      not_included:     notIncl    || null,
      important_info:   impInfo    || null,
      cancel_policy:    cancelPol  || null,
      // Colonne dédiée departure_time (heure par défaut de l'excursion)
      depart_time: defaultDepartureTime,
      // Colonne JSONB available_dates avec departure_time par date
      available_dates:  safeDates.length > 0 ? safeDates : null,
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = "/prestataire/excursions"; }, 2000);
  };

  /* ── Succès ── */
  if (success) return (
    <div style={{ maxWidth:480, margin:"80px auto", textAlign:"center", padding:"60px 20px" }}>
      <div style={{ width:88, height:88, borderRadius:"50%", background:"linear-gradient(135deg,#ECFDF5,#D1FAE5)", border:"4px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 8px 24px rgba(5,150,105,.2)" }}>
        <CheckCircle2 size={40} color="#059669" />
      </div>
      <h2 style={{ fontSize:24, fontWeight:800, color:"#0F172A", marginBottom:10, letterSpacing:"-.03em" }}>Excursion {pubMode?"publiée":"sauvegardée"} !</h2>
      <p style={{ color:"#64748B", fontSize:14 }}>Redirection en cours...</p>
    </div>
  );

  const today = new Date().toISOString().slice(0,10);
  const TABS = [
    { key:"infos",   label:"Informations",  icon:FileText,     warn:!v.title||!v.city||!v.description||!v.languages||!v.categories },
    { key:"details", label:"Détails",        icon:Settings2,    warn:false },
    { key:"dates",   label:"Disponibilités", icon:CalendarDays, warn:!v.dates },
    { key:"photos",  label:"Photos",         icon:ImageIcon,    warn:!v.photos },
  ] as const;

  const CHECKLIST = [
    { key:"title",       label:"Titre (5 car. min.)",    ok:v.title },
    { key:"city",        label:"Ville sélectionnée",     ok:v.city },
    { key:"description", label:"Description (30 car.)",  ok:v.description },
    { key:"languages",   label:"Au moins 1 langue",      ok:v.languages },
    { key:"categories",  label:"Au moins 1 catégorie",   ok:v.categories },
    { key:"dates",       label:"Dates de disponibilité", ok:v.dates },
    { key:"photos",      label:"Au moins 1 photo",       ok:v.photos },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family:'Plus Jakarta Sans',sans-serif !important; }

        /* ── Champs de saisie génériques ── */
        .nf-field input,
        .nf-field select,
        .nf-field textarea {
          width:100%; padding:11px 14px;
          border:1.5px solid #E2E8F0; border-radius:10px;
          font-size:13px; font-family:inherit !important; color:#0F172A;
          outline:none; transition:all .2s; background:#FAFBFC; box-sizing:border-box;
        }
        .nf-field input:focus,
        .nf-field select:focus,
        .nf-field textarea:focus {
          border-color:#0F766E; background:white;
          box-shadow:0 0 0 3px rgba(15,118,110,.1);
        }
        .nf-field input::placeholder,
        .nf-field textarea::placeholder { color:#CBD5E1; }

        /* ── Input time (principal) ── */
        .time-input {
          padding:0; border:none; background:transparent;
          font-size:13px; font-family:inherit !important; color:#0F172A;
          outline:none; cursor:pointer; min-width:80px;
        }
        /* ── Input time (compact dans la liste des dates) ── */
        .time-input-sm {
          padding:6px 9px; border:1.5px solid #E2E8F0; border-radius:8px;
          font-size:12px; font-family:inherit !important; color:#0F172A;
          outline:none; transition:border-color .2s; background:#FAFBFC;
          cursor:pointer; min-width:90px; box-sizing:border-box;
        }
        .time-input-sm:focus { border-color:#0F766E; background:white; }

        /* ── Onglets ── */
        .tab-btn {
          display:flex; align-items:center; gap:7px;
          padding:9px 16px; border-radius:10px;
          font-size:12.5px; font-weight:600; cursor:pointer;
          font-family:inherit !important; border:none; transition:all .2s; white-space:nowrap;
        }
        .tab-btn.on { background:#0F172A; color:white; box-shadow:0 2px 8px rgba(15,23,42,.25); }
        .tab-btn:not(.on) { background:white; color:#64748B; border:1.5px solid #E2E8F0; }
        .tab-btn:not(.on):hover { background:#F8FAFC; border-color:#CBD5E1; color:#0F172A; }

        /* ── Cartes ── */
        .card {
          background:white; border-radius:16px;
          border:1px solid #EEF2F7; padding:24px 26px;
          box-shadow:0 1px 4px rgba(15,23,42,.04);
        }

        /* ── Zone de dépôt photos ── */
        .drop-z {
          border:2px dashed #E2E8F0; border-radius:14px;
          padding:48px 28px; text-align:center; cursor:pointer;
          transition:all .22s; background:#FAFBFC;
        }
        .drop-z:hover { border-color:#0F766E; background:rgba(15,118,110,.03); }

        /* ── Ligne date dans la liste ── */
        .date-row {
          display:flex; align-items:center; gap:10px;
          padding:11px 14px; background:#F8FAFC;
          border-radius:10px; border:1.5px solid #EEF2F7;
          margin-bottom:7px; transition:border-color .15s;
        }
        .date-row:hover { border-color:#CBD5E1; }

        /* ── Input nombre ── */
        .num {
          width:72px; padding:7px 10px;
          border:1.5px solid #E2E8F0; border-radius:8px;
          font-size:13px; font-family:inherit !important; color:#0F172A;
          outline:none; text-align:center; transition:border-color .2s; background:#FAFBFC;
        }
        .num:focus { border-color:#0F766E; background:white; }

        /* ── Boutons jours récurrents ── */
        .day {
          padding:6px 12px; border-radius:8px; font-size:12.5px; font-weight:600;
          cursor:pointer; font-family:inherit !important;
          border:1.5px solid #E2E8F0; background:white; color:#64748B; transition:all .15s;
        }
        .day.on { background:#0F172A; color:white; border-color:#0F172A; }

        /* ── Bouton Publier ── */
        .pub-btn {
          display:flex; align-items:center; gap:8px;
          padding:11px 22px; border-radius:11px; cursor:pointer;
          font-family:inherit !important; font-size:13.5px; font-weight:700;
          border:none; transition:all .22s; letter-spacing:-.01em;
        }
        .pub-btn.ready {
          background:linear-gradient(135deg,#0F766E,#0D9488); color:white;
          box-shadow:0 4px 14px rgba(15,118,110,.35);
        }
        .pub-btn.ready:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(15,118,110,.4); }
        .pub-btn.locked { background:#F1F5F9; color:#94A3B8; cursor:not-allowed; }

        /* ── Bouton Brouillon ── */
        .draft-btn {
          display:flex; align-items:center; gap:8px;
          padding:10px 18px; border-radius:10px; cursor:pointer;
          font-family:inherit !important; font-size:13px; font-weight:600;
          background:white; color:#475569; border:1.5px solid #E2E8F0; transition:all .18s;
        }
        .draft-btn:hover:not(:disabled) { background:#F8FAFC; border-color:#CBD5E1; }
        .draft-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* ── Wrapper champ heure ── */
        .time-wrapper {
          display:flex; align-items:center; gap:8px;
          background:#FAFBFC; border:1.5px solid #E2E8F0;
          border-radius:10px; padding:0 13px; transition:all .2s;
        }
        .time-wrapper:focus-within {
          border-color:#0F766E; background:white;
          box-shadow:0 0 0 3px rgba(15,118,110,.1);
        }

        /* ── Séparateur de section dans l'onglet dates ── */
        .section-sep {
          font-size:10px; font-weight:800; color:#94A3B8;
          text-transform:uppercase; letter-spacing:1px;
          margin:4px 0 10px; display:flex; align-items:center; gap:8px;
        }
        .section-sep::after {
          content:""; flex:1; height:1px; background:#F1F5F9;
        }

        .spin { animation:sp 1s linear infinite; }
        @keyframes sp { to { transform:rotate(360deg); } }
        select { appearance:none !important; -webkit-appearance:none !important; }
      `}</style>

      <div style={{ maxWidth:960, margin:"0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:24 }}>
          <a href="/prestataire/excursions" style={{ fontSize:12, color:"#94A3B8", textDecoration:"none", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5, marginBottom:12 }}>
            <ArrowLeft size={12} /> Mes excursions
          </a>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:800, color:"#053366", margin:0, letterSpacing:"-.04em" }}>Nouvelle excursion</h1>
              <p style={{ fontSize:13, color:"#64748B", margin:"6px 0 0", fontWeight:500 }}>Complétez tous les champs pour débloquer la publication</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* Cercle de progression */}
              <div style={{ position:"relative", width:50, height:50 }}>
                <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform:"rotate(-90deg)" }}>
                  <circle cx="25" cy="25" r="21" fill="none" stroke="#EEF2F7" strokeWidth="4.5" />
                  <circle cx="25" cy="25" r="21" fill="none" stroke={isReadyToPublish?"#059669":"#0F766E"} strokeWidth="4.5" strokeLinecap="round"
                    strokeDasharray={`${2*Math.PI*21}`} strokeDashoffset={`${2*Math.PI*21*(1-pct/100)}`}
                    style={{ transition:"stroke-dashoffset .4s ease,stroke .3s" }} />
                </svg>
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:11, fontWeight:800, color:"#0F172A" }}>{pct}%</span>
                </div>
              </div>
              <button type="button" className="draft-btn" onClick={() => submit(false)} disabled={loading}>
                {loading && !pubMode ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Brouillon
              </button>
              <button type="button" className={`pub-btn ${isReadyToPublish?"ready":"locked"}`} onClick={() => isReadyToPublish && submit(true)} disabled={loading || !isReadyToPublish}>
                {loading && pubMode
                  ? <><Loader2 size={14} className="spin"/> Publication...</>
                  : isReadyToPublish
                    ? <><Rocket size={14}/> Publier l&apos;excursion</>
                    : <><Lock size={13}/> Publier ({pct}%)</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, marginBottom:18, fontSize:13, color:"#DC2626", fontWeight:600 }}>
            <AlertTriangle size={14}/> {error}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 264px", gap:18, alignItems:"start" }}>

          {/* ── Colonne principale ── */}
          <div>
            {/* Tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {TABS.map(({key,label,icon:Icon,warn}) => (
                <button key={key} type="button" className={`tab-btn ${tab===key?"on":""}`} onClick={()=>setTab(key as typeof tab)}>
                  <Icon size={13}/>{label}
                  {warn && tab!==key && <span style={{ width:7, height:7, borderRadius:"50%", background:"#F59E0B", flexShrink:0, boxShadow:"0 0 0 2px white" }}/>}
                </button>
              ))}
            </div>

            {/* ════ INFOS ════ */}
            {tab==="infos" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                {/* Informations de base */}
                <div className="card">
                  <SectionTitle icon={FileText} label="Informations de base" subtitle="Ces informations apparaissent en priorité sur votre annonce"/>
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                    <Field label="Titre de l'excursion" required>
                      <div className="nf-field">
                        <input
                          placeholder="Ex : Médina de Tunis — Visite guidée & dégustation"
                          value={title}
                          onChange={e=>setTitle(e.target.value)}
                          style={{ borderColor:title.length>0&&!v.title?"#FCA5A5":v.title?"#86EFAC":"#E2E8F0" }}
                        />
                      </div>
                      {title.length>0&&!v.title&&<p style={{ fontSize:11, color:"#EF4444", marginTop:5, fontWeight:600 }}>Minimum 5 caractères ({5-title.trim().length} restants)</p>}
                    </Field>

                    <Field label="Ville" required hint="La ville où se déroule l'excursion">
                      <div className="nf-field" style={{ position:"relative" }}>
                        <MapPin size={13} color="#94A3B8" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", zIndex:1 }}/>
                        <ChevronDown size={13} color="#94A3B8" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", zIndex:1 }}/>
                        <select value={city} onChange={e=>setCity(e.target.value)} style={{ paddingLeft:32, borderColor:v.city?"#86EFAC":"#E2E8F0" }}>
                          <option value="">Sélectionnez une ville</option>
                          {villes.map(vi=><option key={vi.id} value={vi.nom}>{vi.nom}</option>)}
                        </select>
                      </div>
                    </Field>

                    <Field label="Description" required hint="Décrivez les points d'intérêt, l'ambiance, l'expérience vécue. Minimum 30 caractères.">
                      <div className="nf-field">
                        <textarea
                          rows={4}
                          placeholder="Partez à la découverte de la médina de Tunis, ses ruelles tortueuses, ses souks colorés..."
                          value={description}
                          onChange={e=>setDescription(e.target.value)}
                          style={{ resize:"vertical", borderColor:description.length>0&&!v.description?"#FCA5A5":v.description?"#86EFAC":"#E2E8F0" }}
                        />
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                        {description.length>0&&!v.description
                          ? <p style={{ fontSize:11, color:"#EF4444", fontWeight:600, margin:0 }}>{30-description.length} caractères manquants</p>
                          : <span/>}
                        <p style={{ fontSize:11, color:description.length>900?"#D97706":"#CBD5E1", textAlign:"right", margin:0 }}>{description.length}/1000</p>
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Chiffres clés */}
                <div className="card">
                  <SectionTitle icon={Settings2} label="Chiffres clés" subtitle="Durée, prix et capacité de l'excursion"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                    <Field label="Durée (heures)" hint="Ex : 2, 3.5, 8">
                      <div className="nf-field">
                        <input type="number" min={0.5} max={24} step={0.5} value={duration} onChange={e=>setDuration(Number(e.target.value))}/>
                      </div>
                    </Field>
                    <Field label="Prix par personne (TND)">
                      <div className="nf-field">
                        <input type="number" min={1} step={1} value={price} onChange={e=>setPrice(Number(e.target.value))}/>
                      </div>
                    </Field>
                    <Field label="Personnes max" hint="Capacité du groupe">
                      <div className="nf-field">
                        <input type="number" min={1} max={100} step={1} value={maxPeople} onChange={e=>setMaxPeople(Number(e.target.value))}/>
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Catégories */}
                <div className="card">
                  <SectionTitle icon={Tag} label="Catégories" subtitle={v.categories?`${categories.length} sélectionnée(s)`:"Choisissez au moins une catégorie"}/>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {categoriesDB.map(c=><Chip key={c.id} label={c.nom} selected={categories.includes(c.nom)} color={c.couleur} onClick={()=>setCategories(toggle(categories,c.nom))}/>)}
                  </div>
                </div>

                {/* Langues — DYNAMIQUE depuis Supabase via prop `langues` */}
                <div className="card">
                  <SectionTitle
                    icon={Languages}
                    label="Langues parlées"
                    subtitle={v.languages?`${languages.length} sélectionnée(s)`:"Choisissez les langues dans lesquelles vous guidez"}
                  />
                  {langues.length === 0 ? (
                    <div style={{ padding:"14px 16px", background:"#FEF9EC", border:"1px solid #FDE68A", borderRadius:10, fontSize:12, color:"#92400E", fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                      <AlertCircle size={13}/> Aucune langue configurée — ajoutez-en dans votre panneau d&apos;administration.
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {langues.map(l=>(
                        <Chip key={l.id} label={l.nom} selected={languages.includes(l.nom)} color="#7C3AED" onClick={()=>setLanguages(toggle(languages,l.nom))}/>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inclusions */}
                <div className="card">
                  <SectionTitle icon={Package} label="Inclus dans le prix" subtitle="Optionnel — cochez ce qui est compris"/>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {INCLUSIONS.map(i=><Chip key={i} label={i} selected={inclusions.includes(i)} color="#059669" onClick={()=>setInclusions(toggle(inclusions,i))}/>)}
                  </div>
                </div>
              </div>
            )}

            {/* ════ DÉTAILS ════ */}
            {tab==="details" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                <div className="card">
                  <SectionTitle icon={Navigation} label="Logistique" subtitle="Informations pratiques pour le touriste"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <Field label="Point de rendez-vous" hint="Adresse ou description précise du lieu de départ">
                      <div className="nf-field" style={{ position:"relative" }}>
                        <MapPin size={13} color="#94A3B8" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                        <input style={{ paddingLeft:30 }} placeholder="Ex : Parking place du Belvédère, Tunis" value={meetingPt} onChange={e=>setMeetingPt(e.target.value)}/>
                      </div>
                    </Field>
                    <Field label="Âge minimum" hint="Laisser vide si aucune restriction d'âge">
                      <div className="nf-field" style={{ position:"relative" }}>
                        <Users size={13} color="#94A3B8" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                        <input type="number" min={0} max={99} style={{ paddingLeft:30 }} placeholder="Ex : 12" value={minAge} onChange={e=>setMinAge(e.target.value?Number(e.target.value):"")}/>
                      </div>
                    </Field>
                  </div>
                  <div style={{ marginTop:18 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:10 }}>Niveau de difficulté physique</label>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {DIFFICULTY.map(d=>(
                        <button key={d.value} type="button" onClick={()=>setDifficulty(difficulty===d.value?"":d.value)}
                          style={{ padding:"9px 18px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", border:`1.5px solid ${difficulty===d.value?d.border:"#E2E8F0"}`, background:difficulty===d.value?d.bg:"white", color:difficulty===d.value?d.color:"#64748B", transition:"all .15s" }}>
                          {d.icon} {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={Package} label="Inclus et non inclus" subtitle="Soyez précis — cela réduit les malentendus avec vos clients"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <Field label="Non inclus dans le prix" hint="Ex : billets d'entrée, repas personnels...">
                      <div className="nf-field">
                        <textarea rows={3} placeholder={"- Billets d'entrée\n- Repas personnels\n- Pourboires"} value={notIncl} onChange={e=>setNotIncl(e.target.value)} style={{ resize:"vertical" }}/>
                      </div>
                    </Field>
                    <Field label="Ce qu'il faut apporter" hint="Équipement et accessoires recommandés">
                      <div className="nf-field">
                        <textarea rows={3} placeholder={"- Chaussures confortables\n- Chapeau + crème solaire\n- Bouteille d'eau"} value={whatBring} onChange={e=>setWhatBring(e.target.value)} style={{ resize:"vertical" }}/>
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={AlertCircle} label="Informations importantes & annulation"/>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <Field label="Informations importantes" hint="Restrictions, contre-indications médicales, conditions météo requises...">
                      <div className="nf-field">
                        <textarea rows={3} placeholder="Ex : Non accessible aux PMR. Annulé si météo défavorable." value={impInfo} onChange={e=>setImpInfo(e.target.value)} style={{ resize:"vertical" }}/>
                      </div>
                    </Field>
                    <Field label="Politique d'annulation">
                      <div className="nf-field">
                        <input placeholder="Ex : Annulation gratuite jusqu'à 24h avant" value={cancelPol} onChange={e=>setCancelPol(e.target.value)}/>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ════ DATES ════ */}
            {tab==="dates" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>

                {/* ── Panneau gauche : ajout ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* Ajouter une date ponctuelle */}
                  <div className="card">
                    <SectionTitle icon={CalendarDays} label="Ajouter une date" subtitle="Saisir une disponibilité ponctuelle"/>

                    {/* Étape 1 : Date */}
                    <div style={{ marginBottom:14 }}>
                      <div className="section-sep">Étape 1 — Date</div>
                      <div className="nf-field">
                        <input type="date" value={newDate} min={today} onChange={e => setNewDate(e.target.value)}/>
                      </div>
                    </div>

                    {/* Étape 2 : Heures de départ (plusieurs possibles) */}
                    <div style={{ marginBottom:14 }}>
                      <div className="section-sep">Étape 2 — Heure(s) de départ</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        {newTimes.map((t, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div className="time-wrapper" style={{ flex:1 }}>
                              <Clock size={14} color="#0F766E" style={{ flexShrink:0 }}/>
                              <input
                                type="time"
                                value={t}
                                onChange={e => setNewTimes(prev => prev.map((x, j) => j===i ? e.target.value : x))}
                                className="time-input"
                                style={{ padding:"11px 4px" }}
                              />
                            </div>
                            {newTimes.length > 1 && (
                              <button type="button" onClick={() => setNewTimes(p => p.filter((_, j) => j!==i))}
                                style={{ width:26, height:26, borderRadius:"50%", border:"none", background:"#FEE2E2", color:"#DC2626", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <X size={11}/>
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setNewTimes(p => [...p, "09:00"])}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 10px", borderRadius:8, background:"#F0FDF4", color:"#059669", border:"1px solid #BBF7D0", cursor:"pointer", fontSize:11.5, fontWeight:700, fontFamily:"inherit", width:"fit-content" }}>
                          <Plus size={11}/> Ajouter une heure
                        </button>
                        <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>Vous pouvez ajouter plusieurs horaires pour la même date (ex: 09:00 et 14:00)</p>
                      </div>
                    </div>

                    {/* Étape 3 : Places */}
                    <div style={{ marginBottom:16 }}>
                      <div className="section-sep">Étape 3 — Nombre de places</div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FAFBFC", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"9px 14px", flex:1 }}>
                          <Users size={14} color="#0F766E"/>
                          <input
                            type="number" min={1} max={maxPeople}
                            value={newSlots}
                            onChange={e => setNewSlots(Number(e.target.value))}
                            style={{ border:"none", background:"transparent", outline:"none", fontSize:13, color:"#0F172A", fontFamily:"inherit", width:"60px", fontWeight:700 }}
                          />
                          <span style={{ fontSize:12, color:"#94A3B8" }}>/ {maxPeople} max</span>
                        </div>
                      </div>
                    </div>

                    {/* Aperçu + bouton */}
                    {newDate && (
                      <div style={{ padding:"10px 13px", background:"#F0FDF4", borderRadius:10, border:"1px solid #BBF7D0", marginBottom:12, fontSize:12.5, color:"#059669", fontWeight:600, display:"flex", alignItems:"center", gap:7 }}>
                        <CheckCircle2 size={13}/>
                        <span>
                          {new Date(newDate+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
                          {" "}· départ{newTimes.filter(t=>t).length > 1 ? "s" : ""} à <strong>{newTimes.filter(t=>t).join(" / ")}</strong> · {newSlots} place{newSlots>1?"s":""}
                        </span>
                      </div>
                    )}

                    <button type="button" onClick={addDate} disabled={!newDate}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"10px", borderRadius:10, background:newDate?"#0F172A":"#F1F5F9", color:newDate?"white":"#94A3B8", border:"none", cursor:newDate?"pointer":"not-allowed", fontSize:13, fontWeight:700, fontFamily:"inherit", transition:"all .18s" }}>
                      <Plus size={14}/> Ajouter cette date
                    </button>
                  </div>

                  {/* Dates récurrentes */}
                  <div className="card">
                    <SectionTitle icon={Clock} label="Dates récurrentes" subtitle="Générer plusieurs dates sur une période"/>

                    {/* Jours */}
                    <div style={{ marginBottom:14 }}>
                      <div className="section-sep">Jours de la semaine</div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {DAYS_FR.map((d,i) => (
                          <button key={i} type="button" className={`day ${recurDays.includes(i)?"on":""}`} onClick={() => setRecurDays(p => p.includes(i)?p.filter(x=>x!==i):[...p,i])}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Période */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                      {[{l:"Du",v:recurFrom,m:today,s:setRecurFrom},{l:"Au",v:recurTo,m:recurFrom||today,s:setRecurTo}].map(f=>(
                        <div key={f.l}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase" as const, letterSpacing:".5px", display:"block", marginBottom:5 }}>{f.l}</label>
                          <div className="nf-field">
                            <input type="date" value={f.v} min={f.m} onChange={e=>f.s(e.target.value)}/>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Heure récurrente */}
                    <div style={{ marginBottom:14 }}>
                      <div className="section-sep">Heure de départ (commune)</div>
                      <div className="time-wrapper" style={{ width:"fit-content" }}>
                        <Clock size={14} color="#0F766E" style={{ flexShrink:0 }}/>
                        <input
                          type="time"
                          value={recurTime}
                          onChange={e => setRecurTime(e.target.value)}
                          className="time-input"
                          style={{ padding:"11px 4px" }}
                        />
                      </div>
                      <p style={{ fontSize:11, color:"#94A3B8", marginTop:6 }}>Appliquée à toutes les dates générées</p>
                    </div>

                    {/* Places récurrentes */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Places par date :</span>
                      <input type="number" min={1} max={maxPeople} value={recurSlots} onChange={e=>setRecurSlots(Number(e.target.value))} className="num"/>
                      <span style={{ fontSize:11, color:"#94A3B8" }}>/ {maxPeople} max</span>
                    </div>

                    <button type="button" onClick={genRecurring} disabled={recurDays.length===0||!recurFrom||!recurTo}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"10px", borderRadius:10, background:(recurDays.length>0&&recurFrom&&recurTo)?"#F0FDF4":"#F8FAFC", color:(recurDays.length>0&&recurFrom&&recurTo)?"#059669":"#94A3B8", border:`1.5px solid ${(recurDays.length>0&&recurFrom&&recurTo)?"#BBF7D0":"#E2E8F0"}`, cursor:(recurDays.length>0&&recurFrom&&recurTo)?"pointer":"not-allowed", fontSize:13, fontWeight:700, fontFamily:"inherit", transition:"all .18s" }}>
                      <CalendarDays size={14}/> Générer les dates
                    </button>
                  </div>
                </div>

                {/* ── Panneau droit : liste des dates ── */}
                <div className="card">
                  <SectionTitle
                    icon={CalendarDays}
                    label={dates.length ? `Dates sélectionnées (${dates.length})` : "Dates sélectionnées"}
                    subtitle="Modifiez l'heure de départ et les places pour chaque date"
                  />

                  {dates.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"32px 16px", color:"#94A3B8" }}>
                      <CalendarDays size={38} color="#E2E8F0" style={{ margin:"0 auto 14px", display:"block" }}/>
                      <p style={{ fontSize:13, fontWeight:700, margin:0, color:"#CBD5E1" }}>Aucune date ajoutée</p>
                      <p style={{ fontSize:12, marginTop:6, color:"#CBD5E1", lineHeight:1.6 }}>Utilisez le panneau à gauche<br/>pour ajouter vos disponibilités</p>
                    </div>
                  ) : (
                    <>
                      {/* En-tête de colonne */}
                      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 14px 8px", borderBottom:"1px solid #F1F5F9", marginBottom:8 }}>
                        <span style={{ flex:1, fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:".5px" }}>Date</span>
                        <span style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:".5px", minWidth:90 }}>Départ</span>
                        <span style={{ fontSize:10, fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:".5px", width:72, textAlign:"center" }}>Places</span>
                        <span style={{ width:26 }}/>
                      </div>

                      {dates.map(d => {
                        const dt = new Date(d.date+"T00:00:00");
                        return (
                          <div key={d.date} className="date-row">
                            {/* Date */}
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {dt.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                              </p>
                            </div>

                            {/* Heures de départ — plusieurs heures possibles */}
                            <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:120 }}>
                              {(d.departure_times && d.departure_times.length > 0 ? d.departure_times : [d.departure_time]).map((t, ti) => (
                                <div key={ti} style={{ display:"flex", alignItems:"center", gap:4 }}>
                                  <Clock size={10} color="#0F766E" style={{ flexShrink:0 }}/>
                                  <input
                                    type="time"
                                    value={t}
                                    onChange={e => {
                                      const times = d.departure_times && d.departure_times.length > 0 ? [...d.departure_times] : [d.departure_time];
                                      times[ti] = e.target.value;
                                      const sorted = times.sort();
                                      setDates(p => p.map(x => x.date===d.date ? {...x, departure_time:sorted[0], departure_times:sorted} : x));
                                    }}
                                    className="time-input-sm"
                                    title="Heure de départ"
                                  />
                                  {(d.departure_times || []).length > 1 && (
                                    <button type="button" onClick={() => removeTimeFromDate(d.date, t)}
                                      style={{ width:18, height:18, borderRadius:"50%", border:"none", background:"#FEE2E2", color:"#DC2626", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, padding:0 }}>
                                      <X size={9}/>
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button type="button" onClick={() => addTimeToDate(d.date, "09:00")}
                                style={{ fontSize:10, color:"#059669", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", padding:0, display:"flex", alignItems:"center", gap:3, fontFamily:"inherit", fontWeight:600 }}>
                                <Plus size={9}/> Horaire
                              </button>
                            </div>

                            {/* Places */}
                            <div style={{ display:"flex", alignItems:"center", gap:4, width:72 }}>
                              <input
                                type="number" min={1} max={maxPeople}
                                value={d.slots}
                                onChange={e=>updateSlots(d.date,Number(e.target.value))}
                                className="num"
                                style={{ width:52 }}
                              />
                            </div>

                            <button type="button" onClick={() => removeDate(d.date)}
                              style={{ width:26, height:26, borderRadius:"50%", border:"none", background:"#FEE2E2", color:"#DC2626", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <X size={11}/>
                            </button>
                          </div>
                        );
                      })}

                      <button type="button" onClick={() => setDates([])}
                        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:12, padding:"8px", borderRadius:9, background:"#FEF2F2", color:"#DC2626", border:"1.5px solid #FCA5A5", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>
                        <Trash2 size={12}/> Tout supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ════ PHOTOS ════ */}
            {tab==="photos" && (
              <div className="card">
                <SectionTitle icon={ImageIcon} label="Photos de l'excursion" subtitle={`${photos.length}/6 — La première photo sera mise en avant sur votre annonce`}/>

                {photos.length===0 ? (
                  <div className="drop-z"
                    onClick={()=>fileRef.current?.click()}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}}>
                    <div style={{ width:56, height:56, borderRadius:14, background:"linear-gradient(135deg,#F0FDF4,#ECFDF5)", border:"1.5px solid #BBF7D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                      <ImageIcon size={24} color="#059669"/>
                    </div>
                    <p style={{ fontSize:15, fontWeight:700, color:"#0F172A", marginBottom:6 }}>Glissez vos photos ici ou cliquez pour parcourir</p>
                    <p style={{ fontSize:12, color:"#94A3B8" }}>JPG, PNG, WebP · Max 5 MB · 6 photos maximum</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
                      {photos.map((p,i) => (
                        <div key={i} style={{ position:"relative", aspectRatio:"4/3", borderRadius:12, overflow:"hidden", background:"#F1F5F9", border:i===0?"2.5px solid #0F766E":"2px solid transparent", boxShadow:i===0?"0 0 0 3px rgba(15,118,110,.15)":"none" }}>
                          <img src={p.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                          {p.uploading
                            ? <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.8)", display:"flex", alignItems:"center", justifyContent:"center" }}><Loader2 size={20} color="#0F766E" className="spin"/></div>
                            : <button type="button" onClick={()=>removePhoto(i)} style={{ position:"absolute", top:7, right:7, width:24, height:24, borderRadius:"50%", background:"rgba(15,23,42,.65)", color:"white", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={11}/></button>
                          }
                          {i===0&&<div style={{ position:"absolute", bottom:7, left:7, padding:"3px 8px", background:"#0F766E", color:"white", borderRadius:6, fontSize:10, fontWeight:700, letterSpacing:".5px" }}>PRINCIPALE</div>}
                        </div>
                      ))}
                      {photos.length<6&&(
                        <div onClick={()=>fileRef.current?.click()} style={{ aspectRatio:"4/3", borderRadius:12, border:"2px dashed #E2E8F0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", background:"#FAFBFC", gap:7 }}>
                          <Plus size={20} color="#CBD5E1"/>
                          <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>Ajouter une photo</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize:11.5, color:"#94A3B8", margin:0 }}>✦ La première photo est mise en avant sur votre annonce</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
              </div>
            )}
          </div>

          {/* ── Panneau latéral ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Checklist */}
            <div className="card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:0, letterSpacing:"-.01em" }}>Checklist de publication</p>
                  <p style={{ fontSize:11, color:"#94A3B8", margin:"2px 0 0" }}>{CHECKLIST.filter(r=>r.ok).length}/{CHECKLIST.length} critères remplis</p>
                </div>
                {isReadyToPublish&&(
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#ECFDF5,#D1FAE5)", border:"2px solid #A7F3D0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <CheckCircle2 size={16} color="#059669"/>
                  </div>
                )}
              </div>
              <div style={{ height:5, borderRadius:100, background:"#F1F5F9", marginBottom:14, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:100, width:`${pct}%`, background:isReadyToPublish?"linear-gradient(90deg,#059669,#10B981)":"linear-gradient(90deg,#0F766E,#14B8A6)", transition:"width .4s ease" }}/>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {CHECKLIST.map(r => (
                  <div key={r.key} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0" }}>
                    {r.ok
                      ? <CheckCircle2 size={13} color="#059669" style={{ flexShrink:0 }}/>
                      : <div style={{ width:13, height:13, borderRadius:"50%", border:"2px solid #CBD5E1", flexShrink:0 }}/>
                    }
                    <span style={{ fontSize:12, fontWeight:r.ok?600:500, color:r.ok?"#059669":"#94A3B8" }}>{r.label}</span>
                  </div>
                ))}
              </div>
              <button type="button" className={`pub-btn ${isReadyToPublish?"ready":"locked"}`} onClick={()=>isReadyToPublish&&submit(true)} disabled={loading||!isReadyToPublish} style={{ width:"100%", justifyContent:"center", marginTop:16 }}>
                {loading&&pubMode
                  ? <><Loader2 size={14} className="spin"/> Publication...</>
                  : isReadyToPublish
                    ? <><Rocket size={14}/> Publier maintenant</>
                    : <><Lock size={13}/> Compléter les champs</>}
              </button>
              {!isReadyToPublish&&<p style={{ fontSize:11, color:"#94A3B8", textAlign:"center", marginTop:8, lineHeight:1.5 }}>Le bouton se débloque quand tous les critères sont remplis.</p>}
            </div>

            {/* Aperçu gains */}
            <div style={{ background:"linear-gradient(135deg,#F0FDF4,#ECFDF5)", borderRadius:14, border:"1px solid rgba(5,150,105,.2)", padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                <Banknote size={13} color="#059669"/>
                <span style={{ fontWeight:700, fontSize:12, color:"#059669" }}>Aperçu des gains</span>
              </div>
              {[{l:"Prix affiché",v:`${price} TND`,c:"#0F172A"},{l:"Commission (10%)",v:`−${Math.round(price*.1)} TND`,c:"#DC2626"}].map(r=>(
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                  <span style={{ color:"#64748B" }}>{r.l}</span><strong style={{ color:r.c }}>{r.v}</strong>
                </div>
              ))}
              <div style={{ borderTop:"1px dashed rgba(5,150,105,.25)", paddingTop:10, marginTop:4, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#0F172A" }}>Vous recevez</span>
                <strong style={{ color:"#059669", fontSize:18, letterSpacing:"-.02em" }}>{Math.round(price*.9)} TND</strong>
              </div>
            </div>

            <button type="button" className="draft-btn" onClick={()=>submit(false)} disabled={loading} style={{ width:"100%", justifyContent:"center" }}>
              {loading&&!pubMode?<Loader2 size={13} className="spin"/>:<Save size={13}/>} Sauvegarder en brouillon
            </button>
          </div>
        </div>
      </div>
    </>
  );
}