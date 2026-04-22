"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
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
const LANGUAGES  = ["Français", "Anglais", "Arabe", "Allemand", "Espagnol", "Italien"];
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
interface DateDispo    { date: string; slots: number; time: string; }

/* ─────────────────────────────────────────────
   Hook de validation
───────────────────────────────────────────── */
function useValidation(s: {
  title: string; city: string; description: string;
  languages: string[]; categories: string[];
  dates: DateDispo[]; photos: PhotoPreview[];
}) {
  const v = {
    title:       s.title.trim().length >= 5,
    city:        s.city.trim().length > 0,
    description: s.description.trim().length >= 30,
    languages:   s.languages.length > 0,
    categories:  s.categories.length > 0,
    dates:       s.dates.length > 0,
    photos:      s.photos.length >= 1,
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
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, paddingBottom:14, borderBottom:"1px solid #F3F4F6" }}>
      <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,rgba(15,118,110,.12),rgba(20,184,166,.08))", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"1px solid rgba(15,118,110,.15)" }}>
        <Icon size={14} color="#0F766E" />
      </div>
      <div>
        <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:0, letterSpacing:"-.01em" }}>{label}</p>
        {subtitle && <p style={{ fontSize:11, color:"#94A3B8", margin:"2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Chip({ label, selected, color="#0F766E", onClick }: { label:string; selected:boolean; color?:string; onClick:()=>void }) {
  return (
    <button type="button" onClick={onClick} style={{ padding:"6px 13px", borderRadius:100, cursor:"pointer", fontFamily:"inherit", fontSize:12, transition:"all .18s", fontWeight:selected?700:500, border:`1.5px solid ${selected?color:"#E2E8F0"}`, background:selected?`${color}18`:"white", color:selected?color:"#64748B", transform:selected?"scale(1.02)":"scale(1)", boxShadow:selected?`0 0 0 3px ${color}18`:"none" }}>
      {label}
    </button>
  );
}

function Field({ label, required, hint, children }: { label:string; required?:boolean; hint?:string; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#475569", letterSpacing:".5px", textTransform:"uppercase" as const, marginBottom:7 }}>
        {label}{required && <span style={{ color:"#EF4444", fontSize:9 }}>●</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize:11, color:"#94A3B8", marginTop:5, lineHeight:1.5 }}>{hint}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Composant principal
───────────────────────────────────────────── */
export default function NouvelleExcursionClient({
  villes, categories: categoriesDB,
}: { villes: Ville[]; categories: Categorie[] }) {
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
  const [newTime,  setNewTime]  = useState("09:00"); // ← input time natif

  /* ── Dates récurrentes ── */
  const [recurDays,  setRecurDays]  = useState<number[]>([]);
  const [recurSlots, setRecurSlots] = useState(10);
  const [recurTime,  setRecurTime]  = useState("09:00"); // ← input time natif
  const [recurFrom,  setRecurFrom]  = useState("");
  const [recurTo,    setRecurTo]    = useState("");

  const { v, isReadyToPublish, pct } = useValidation({ title, city, description, languages, categories, dates, photos });

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
    if (!newDate || dates.find(d => d.date === newDate)) return;
    // ← time est bien inclus dans chaque entrée
    setDates(p => [...p, { date: newDate, slots: newSlots, time: newTime }]
      .sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate("");
  };
  const removeDate  = (d: string) => setDates(p => p.filter(x => x.date !== d));
  const updateSlots = (d: string, s: number) => setDates(p => p.map(x => x.date===d ? {...x, slots:s} : x));
  const updateTime  = (d: string, t: string) => setDates(p => p.map(x => x.date===d ? {...x, time:t}  : x));

  const genRecurring = () => {
    if (!recurFrom || !recurTo || recurDays.length===0) return;
    const from=new Date(recurFrom), to=new Date(recurTo), added:DateDispo[]=[], cur=new Date(from);
    while (cur <= to) {
      if (recurDays.includes(cur.getDay())) {
        const iso = cur.toISOString().slice(0,10);
        // ← time récurrent inclus
        if (!dates.find(d => d.date===iso)) added.push({ date:iso, slots:recurSlots, time:recurTime });
      }
      cur.setDate(cur.getDate()+1);
    }
    setDates(p => [...p, ...added].sort((a,b) => a.date.localeCompare(b.date)));
  };

  /* ── Submit ──
     available_dates = [{ date, slots, time }, ...]
     → stocké tel quel dans la colonne JSONB de Supabase             ── */
  const submit = async (pub: boolean) => {
    if (!title || !city || !description) { setError("Remplissez les champs obligatoires."); setTab("infos"); return; }
    setLoading(true); setPubMode(pub); setError(null);
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée."); setLoading(false); return; }

    const photoUrls = photos.length > 0 ? await uploadPhotos(user.id) : [];

    // S'assurer que chaque date a bien un time non vide
    const safeDates = dates.map(d => ({
      date:  d.date,
      slots: d.slots,
      time:  d.time || "09:00",   // ← fallback si jamais vide
    }));

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
      available_dates:  safeDates.length > 0 ? safeDates : null, // ← [{ date, slots, time }]
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
        .nf-field input,.nf-field select,.nf-field textarea {
          width:100%;padding:10px 13px;border:1.5px solid #E2E8F0;border-radius:10px;
          font-size:13px;font-family:inherit !important;color:#0F172A;outline:none;
          transition:all .2s;background:#FAFBFC;box-sizing:border-box;
        }
        .nf-field input:focus,.nf-field select:focus,.nf-field textarea:focus {
          border-color:#0F766E;background:white;box-shadow:0 0 0 3px rgba(15,118,110,.1);
        }
        .nf-field input::placeholder,.nf-field textarea::placeholder{color:#CBD5E1;}

        /* ── input[type=time] natif ── */
        .time-input {
          padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:10px;
          font-size:13px;font-family:inherit !important;color:#0F172A;outline:none;
          transition:all .2s;background:#FAFBFC;cursor:pointer;
          box-sizing:border-box;
        }
        .time-input:focus {
          border-color:#0F766E;background:white;box-shadow:0 0 0 3px rgba(15,118,110,.1);
        }
        /* ── input[type=time] dans la liste des dates ── */
        .time-input-sm {
          padding:6px 8px;border:1.5px solid #E2E8F0;border-radius:8px;
          font-size:12px;font-family:inherit !important;color:#0F172A;outline:none;
          transition:border-color .2s;background:#FAFBFC;cursor:pointer;
          min-width:88px;
        }
        .time-input-sm:focus { border-color:#0F766E; background:white; }

        .tab-btn{display:flex;align-items:center;gap:7px;padding:8px 15px;border-radius:10px;
          font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit !important;
          border:none;transition:all .2s;white-space:nowrap;}
        .tab-btn.on{background:#0F172A;color:white;box-shadow:0 2px 8px rgba(15,23,42,.25);}
        .tab-btn:not(.on){background:white;color:#64748B;border:1.5px solid #E2E8F0;}
        .tab-btn:not(.on):hover{background:#F8FAFC;border-color:#CBD5E1;color:#0F172A;}
        .card{background:white;border-radius:16px;border:1px solid #EEF2F7;padding:22px 24px;box-shadow:0 1px 4px rgba(15,23,42,.04);}
        .drop-z{border:2px dashed #E2E8F0;border-radius:14px;padding:40px 28px;text-align:center;cursor:pointer;transition:all .22s;background:#FAFBFC;}
        .drop-z:hover{border-color:#0F766E;background:rgba(15,118,110,.03);}
        .date-row{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#F8FAFC;border-radius:10px;border:1.5px solid #EEF2F7;margin-bottom:7px;transition:border-color .15s;}
        .date-row:hover{border-color:#CBD5E1;}
        .num{width:68px;padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit !important;color:#0F172A;outline:none;text-align:center;transition:border-color .2s;background:#FAFBFC;}
        .num:focus{border-color:#0F766E;background:white;}
        .day{padding:5px 11px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit !important;border:1.5px solid #E2E8F0;background:white;color:#64748B;transition:all .15s;}
        .day.on{background:#0F172A;color:white;border-color:#0F172A;}
        .pub-btn{display:flex;align-items:center;gap:8px;padding:11px 22px;border-radius:11px;cursor:pointer;font-family:inherit !important;font-size:13.5px;font-weight:700;border:none;transition:all .22s;letter-spacing:-.01em;}
        .pub-btn.ready{background:linear-gradient(135deg,#0F766E,#0D9488);color:white;box-shadow:0 4px 14px rgba(15,118,110,.35);}
        .pub-btn.ready:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(15,118,110,.4);}
        .pub-btn.locked{background:#F1F5F9;color:#94A3B8;cursor:not-allowed;}
        .draft-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;cursor:pointer;font-family:inherit !important;font-size:13px;font-weight:600;background:white;color:#475569;border:1.5px solid #E2E8F0;transition:all .18s;}
        .draft-btn:hover:not(:disabled){background:#F8FAFC;border-color:#CBD5E1;}
        .draft-btn:disabled{opacity:.5;cursor:not-allowed;}
        .spin{animation:sp 1s linear infinite;}
        @keyframes sp{to{transform:rotate(360deg);}}
        select{appearance:none !important;-webkit-appearance:none !important;}
      `}</style>

      <div style={{ maxWidth:960, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <a href="/prestataire/excursions" style={{ fontSize:12, color:"#94A3B8", textDecoration:"none", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5, marginBottom:12 }}>
            <ArrowLeft size={12} /> Mes excursions
          </a>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:800, color:"#0F172A", margin:0, letterSpacing:"-.04em" }}>Nouvelle excursion</h1>
              <p style={{ fontSize:13, color:"#64748B", margin:"6px 0 0", fontWeight:500 }}>Complétez tous les champs pour débloquer la publication</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
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
                {loading && pubMode ? <><Loader2 size={14} className="spin"/> Publication...</> : isReadyToPublish ? <><Rocket size={14}/> Publier l&apos;excursion</> : <><Lock size={13}/> Publier ({pct}%)</>}
              </button>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, marginBottom:18, fontSize:13, color:"#DC2626", fontWeight:600 }}>
            <AlertTriangle size={14}/> {error}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 264px", gap:18, alignItems:"start" }}>

          {/* Colonne principale */}
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
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div className="card">
                  <SectionTitle icon={FileText} label="Informations de base"/>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <Field label="Titre" required>
                      <div className="nf-field">
                        <input placeholder="Ex : Médina de Tunis — Visite guidée & dégustation" value={title} onChange={e=>setTitle(e.target.value)}
                          style={{ borderColor:title.length>0&&!v.title?"#FCA5A5":v.title?"#86EFAC":"#E2E8F0" }}/>
                      </div>
                      {title.length>0&&!v.title&&<p style={{ fontSize:11, color:"#EF4444", marginTop:4, fontWeight:600 }}>Minimum 5 caractères</p>}
                    </Field>
                    <Field label="Ville" required>
                      <div className="nf-field" style={{ position:"relative" }}>
                        <MapPin size={13} color="#94A3B8" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", zIndex:1 }}/>
                        <ChevronDown size={13} color="#94A3B8" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", zIndex:1 }}/>
                        <select value={city} onChange={e=>setCity(e.target.value)} style={{ paddingLeft:32, borderColor:v.city?"#86EFAC":"#E2E8F0" }}>
                          <option value="">Sélectionnez une ville</option>
                          {villes.map(vi=><option key={vi.id} value={vi.nom}>{vi.nom}</option>)}
                        </select>
                      </div>
                    </Field>
                    <Field label="Description" required hint="Décrivez les points d'intérêt, l'ambiance, l'expérience vécue.">
                      <div className="nf-field">
                        <textarea rows={4} placeholder="Partez à la découverte de la médina de Tunis, ses ruelles tortueuses, ses souks colorés..." value={description} onChange={e=>setDescription(e.target.value)}
                          style={{ resize:"vertical", borderColor:description.length>0&&!v.description?"#FCA5A5":v.description?"#86EFAC":"#E2E8F0" }}/>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                        {description.length>0&&!v.description&&<p style={{ fontSize:11, color:"#EF4444", fontWeight:600, margin:0 }}>Minimum 30 car. ({30-description.length} restants)</p>}
                        <p style={{ fontSize:11, color:description.length>900?"#D97706":"#CBD5E1", textAlign:"right", margin:"0 0 0 auto" }}>{description.length}/1000</p>
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={Settings2} label="Détails pratiques"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    {[
                      { label:"Durée (h)",        val:duration,  min:0.5, max:24,  step:0.5, set:setDuration  },
                      { label:"Prix/pers. (TND)",  val:price,     min:1,           step:1,   set:setPrice     },
                      { label:"Personnes max",     val:maxPeople, min:1,   max:100, step:1,   set:setMaxPeople },
                    ].map(f=>(
                      <Field key={f.label} label={f.label}>
                        <div className="nf-field"><input type="number" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e=>f.set(Number(e.target.value))}/></div>
                      </Field>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={Tag} label="Catégories" subtitle={v.categories?`${categories.length} sélectionnée(s)`:"Sélectionnez au moins une catégorie"}/>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {categoriesDB.map(c=><Chip key={c.id} label={c.nom} selected={categories.includes(c.nom)} color={c.couleur} onClick={()=>setCategories(toggle(categories,c.nom))}/>)}
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={Languages} label="Langues parlées" subtitle={v.languages?`${languages.length} sélectionnée(s)`:"Sélectionnez au moins une langue"}/>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {LANGUAGES.map(l=><Chip key={l} label={l} selected={languages.includes(l)} color="#7C3AED" onClick={()=>setLanguages(toggle(languages,l))}/>)}
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={Package} label="Inclus dans le prix" subtitle="Optionnel"/>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {INCLUSIONS.map(i=><Chip key={i} label={i} selected={inclusions.includes(i)} color="#059669" onClick={()=>setInclusions(toggle(inclusions,i))}/>)}
                  </div>
                </div>
              </div>
            )}

            {/* ════ DÉTAILS ════ */}
            {tab==="details" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div className="card">
                  <SectionTitle icon={Navigation} label="Logistique" subtitle="Informations pratiques pour le touriste"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <Field label="Point de rendez-vous" hint="Adresse ou description du lieu de départ">
                      <div className="nf-field" style={{ position:"relative" }}>
                        <MapPin size={13} color="#94A3B8" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                        <input style={{ paddingLeft:30 }} placeholder="Ex : Parking place du Belvédère, Tunis" value={meetingPt} onChange={e=>setMeetingPt(e.target.value)}/>
                      </div>
                    </Field>
                    <Field label="Âge minimum" hint="Laisser vide si aucune restriction">
                      <div className="nf-field" style={{ position:"relative" }}>
                        <Users size={13} color="#94A3B8" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                        <input type="number" min={0} max={99} style={{ paddingLeft:30 }} placeholder="Ex : 12" value={minAge} onChange={e=>setMinAge(e.target.value?Number(e.target.value):"")}/>
                      </div>
                    </Field>
                  </div>
                  <div style={{ marginTop:16 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:9 }}>Niveau de difficulté</label>
                    <div style={{ display:"flex", gap:8 }}>
                      {DIFFICULTY.map(d=>(
                        <button key={d.value} type="button" onClick={()=>setDifficulty(difficulty===d.value?"":d.value)}
                          style={{ padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:12.5, fontWeight:600, fontFamily:"inherit", border:`1.5px solid ${difficulty===d.value?d.border:"#E2E8F0"}`, background:difficulty===d.value?d.bg:"white", color:difficulty===d.value?d.color:"#64748B", transition:"all .15s" }}>
                          {d.icon} {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={Package} label="Inclus et non inclus" subtitle="Soyez précis — cela réduit les malentendus"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <Field label="Non inclus dans le prix" hint="Ex : billets, repas...">
                      <div className="nf-field"><textarea rows={3} placeholder={"- Billets d'entrée\n- Repas personnels\n- Pourboires"} value={notIncl} onChange={e=>setNotIncl(e.target.value)} style={{ resize:"vertical" }}/></div>
                    </Field>
                    <Field label="Ce qu'il faut apporter" hint="Équipement recommandé">
                      <div className="nf-field"><textarea rows={3} placeholder={"- Chaussures confortables\n- Chapeau + crème solaire\n- Bouteille d'eau"} value={whatBring} onChange={e=>setWhatBring(e.target.value)} style={{ resize:"vertical" }}/></div>
                    </Field>
                  </div>
                </div>

                <div className="card">
                  <SectionTitle icon={AlertCircle} label="Informations importantes & annulation"/>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <Field label="Informations importantes" hint="Restrictions, contre-indications, conditions météo...">
                      <div className="nf-field"><textarea rows={3} placeholder="Ex : Non accessible aux PMR. Annulé en cas de mauvais temps." value={impInfo} onChange={e=>setImpInfo(e.target.value)} style={{ resize:"vertical" }}/></div>
                    </Field>
                    <Field label="Politique d'annulation">
                      <div className="nf-field"><input placeholder="Ex : Annulation gratuite jusqu'à 24h avant" value={cancelPol} onChange={e=>setCancelPol(e.target.value)}/></div>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ════ DATES ════ */}
            {tab==="dates" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, alignItems:"start" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* ── Ajouter une date ── */}
                  <div className="card">
                    <SectionTitle icon={CalendarDays} label="Ajouter une date"/>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

                      {/* Champ date */}
                      <div className="nf-field">
                        <input type="date" value={newDate} min={today} onChange={e => setNewDate(e.target.value)}/>
                      </div>

                      {/* ── Heure de départ (input time natif) + places ── */}
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>

                        {/* Heure — input time natif, un seul champ clair */}
                        <div style={{ display:"flex", alignItems:"center", gap:7, flex:1, background:"#FAFBFC", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px" }}>
                          <Clock size={13} color="#94A3B8" style={{ flexShrink:0 }}/>
                          <input
                            type="time"
                            value={newTime}
                            onChange={e => setNewTime(e.target.value)}
                            className="time-input"
                            style={{ flex:1, border:"none", background:"transparent", padding:"9px 0", boxShadow:"none" }}
                          />
                        </div>

                        {/* Places */}
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <Users size={13} color="#94A3B8"/>
                          <input
                            type="number" min={1} max={maxPeople}
                            value={newSlots}
                            onChange={e => setNewSlots(Number(e.target.value))}
                            className="num"
                          />
                          <span style={{ fontSize:11, color:"#94A3B8" }}>pl.</span>
                        </div>

                        {/* Bouton ajouter */}
                        <button type="button" onClick={addDate} disabled={!newDate}
                          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:9, background:newDate?"#0F172A":"#F1F5F9", color:newDate?"white":"#94A3B8", border:"none", cursor:newDate?"pointer":"not-allowed", fontSize:12.5, fontWeight:700, fontFamily:"inherit", transition:"all .18s", whiteSpace:"nowrap" }}>
                          <Plus size={13}/> Ajouter
                        </button>
                      </div>

                      {/* Aperçu */}
                      {newDate && (
                        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"#F0FDF4", borderRadius:8, border:"1px solid #BBF7D0", fontSize:12, color:"#059669", fontWeight:600 }}>
                          <CheckCircle2 size={12}/>
                          {new Date(newDate+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} à <strong>{newTime}</strong> — {newSlots} place{newSlots>1?"s":""}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Dates récurrentes ── */}
                  <div className="card">
                    <SectionTitle icon={Clock} label="Dates récurrentes" subtitle="Générer sur une période"/>
                    <div style={{ marginBottom:12 }}>
                      <label style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:7 }}>Jours de la semaine</label>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {DAYS_FR.map((d,i) => (
                          <button key={i} type="button" className={`day ${recurDays.includes(i)?"on":""}`} onClick={() => setRecurDays(p => p.includes(i)?p.filter(x=>x!==i):[...p,i])}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                      {[{l:"Du",v:recurFrom,m:today,s:setRecurFrom},{l:"Au",v:recurTo,m:recurFrom||today,s:setRecurTo}].map(f=>(
                        <div key={f.l} className="nf-field">
                          <label style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:5 }}>{f.l}</label>
                          <input type="date" value={f.v} min={f.m} onChange={e=>f.s(e.target.value)}/>
                        </div>
                      ))}
                    </div>

                    {/* ── Heure récurrente (input time natif) ── */}
                    <div style={{ marginBottom:10 }}>
                      <label style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:6 }}>Heure de départ</label>
                      <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FAFBFC", border:"1.5px solid #E2E8F0", borderRadius:10, padding:"0 12px", width:"fit-content" }}>
                        <Clock size={13} color="#94A3B8" style={{ flexShrink:0 }}/>
                        <input
                          type="time"
                          value={recurTime}
                          onChange={e => setRecurTime(e.target.value)}
                          className="time-input"
                          style={{ border:"none", background:"transparent", padding:"9px 0", boxShadow:"none" }}
                        />
                      </div>
                      <p style={{ fontSize:11, color:"#94A3B8", marginTop:5 }}>Appliquée à toutes les dates générées</p>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <span style={{ fontSize:12, color:"#64748B" }}>Places/date :</span>
                      <input type="number" min={1} max={maxPeople} value={recurSlots} onChange={e=>setRecurSlots(Number(e.target.value))} className="num"/>
                    </div>

                    <button type="button" onClick={genRecurring} disabled={recurDays.length===0||!recurFrom||!recurTo}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px", borderRadius:10, background:(recurDays.length>0&&recurFrom&&recurTo)?"#F0FDF4":"#F8FAFC", color:(recurDays.length>0&&recurFrom&&recurTo)?"#059669":"#94A3B8", border:`1.5px solid ${(recurDays.length>0&&recurFrom&&recurTo)?"#BBF7D0":"#E2E8F0"}`, cursor:(recurDays.length>0&&recurFrom&&recurTo)?"pointer":"not-allowed", fontSize:12.5, fontWeight:700, fontFamily:"inherit", transition:"all .18s" }}>
                      <CalendarDays size={13}/> Générer les dates
                    </button>
                  </div>
                </div>

                {/* ── Liste des dates ── */}
                <div className="card">
                  <SectionTitle icon={CalendarDays} label={`Dates sélectionnées${dates.length?` (${dates.length})`:""}`} subtitle="Modifiez l'heure et les places par date"/>
                  {dates.length===0 ? (
                    <div style={{ textAlign:"center", padding:"24px 16px", color:"#94A3B8" }}>
                      <CalendarDays size={36} color="#E2E8F0" style={{ margin:"0 auto 12px", display:"block" }}/>
                      <p style={{ fontSize:13, fontWeight:700, margin:0 }}>Aucune date ajoutée</p>
                      <p style={{ fontSize:12, marginTop:5, color:"#CBD5E1" }}>Ajoutez des dates depuis le panneau gauche</p>
                    </div>
                  ) : (
                    <>
                      {dates.map(d => {
                        const dt = new Date(d.date+"T00:00:00");
                        return (
                          <div key={d.date} className="date-row">
                            {/* Jour */}
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:12.5, fontWeight:700, color:"#0F172A", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {dt.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                              </p>
                            </div>

                            {/* ── Heure éditable par date (input time natif) ── */}
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <Clock size={11} color="#94A3B8"/>
                              <input
                                type="time"
                                value={d.time}
                                onChange={e => updateTime(d.date, e.target.value)}
                                className="time-input-sm"
                              />
                            </div>

                            {/* Places */}
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <Users size={11} color="#94A3B8"/>
                              <input type="number" min={1} max={maxPeople} value={d.slots} onChange={e=>updateSlots(d.date,Number(e.target.value))} className="num"/>
                              <span style={{ fontSize:11, color:"#94A3B8" }}>pl.</span>
                            </div>

                            <button type="button" onClick={() => removeDate(d.date)}
                              style={{ width:26, height:26, borderRadius:"50%", border:"none", background:"#FEE2E2", color:"#DC2626", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <X size={11}/>
                            </button>
                          </div>
                        );
                      })}
                      <button type="button" onClick={() => setDates([])}
                        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:10, padding:"8px", borderRadius:9, background:"#FEF2F2", color:"#DC2626", border:"1.5px solid #FCA5A5", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>
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
                <SectionTitle icon={ImageIcon} label="Photos de l'excursion" subtitle={`${photos.length}/6 — La première sera la photo principale`}/>
                {photos.length===0 ? (
                  <div className="drop-z" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}}>
                    <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#F0FDF4,#ECFDF5)", border:"1.5px solid #BBF7D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                      <ImageIcon size={22} color="#059669"/>
                    </div>
                    <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:5 }}>Glissez vos photos ici ou cliquez</p>
                    <p style={{ fontSize:12, color:"#94A3B8" }}>JPG, PNG, WebP · Max 5 MB · 6 photos max</p>
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
                          <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>Ajouter</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize:11, color:"#94A3B8", margin:0 }}>✦ La 1ère photo est mise en avant sur votre annonce</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
              </div>
            )}
          </div>

          {/* ── Panneau latéral ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:0, letterSpacing:"-.01em" }}>Checklist publication</p>
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
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
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
                {loading&&pubMode?<><Loader2 size={14} className="spin"/> Publication...</>:isReadyToPublish?<><Rocket size={14}/> Publier maintenant</>:<><Lock size={13}/> Compléter les champs</>}
              </button>
              {!isReadyToPublish&&<p style={{ fontSize:11, color:"#94A3B8", textAlign:"center", marginTop:8, lineHeight:1.5 }}>Le bouton se débloque automatiquement quand tous les critères sont remplis.</p>}
            </div>

            {/* Gains */}
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