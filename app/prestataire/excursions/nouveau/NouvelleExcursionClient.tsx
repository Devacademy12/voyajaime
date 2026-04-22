"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, FileText, ImageIcon, Settings2, Tag,
  AlertTriangle, CheckCircle2, Loader2, X, Plus,
  Save, Rocket, Clock, Users, Banknote,
  Languages, Package, MapPin, CalendarDays, Trash2,
  AlertCircle, Navigation, Lock,
} from "lucide-react";

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

interface PhotoPreview { file: File; url: string; uploading: boolean; uploaded?: string; }
interface Ville        { id: string; nom: string; active: boolean; }
interface Categorie    { id: string; nom: string; couleur: string; }
interface DateDispo    { date: string; slots: number; }

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
  return { v, isReadyToPublish: vals.every(Boolean), pct: Math.round((vals.filter(Boolean).length / vals.length) * 100) };
}

/* ── Sous-composants ── */
function SectionTitle({ icon: Icon, label, subtitle }: { icon: React.ElementType; label: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #eef0f6" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(2,175,207,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(2,175,207,.2)" }}>
        <Icon size={14} color="#02AFCF" />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0, letterSpacing: "-.01em" }}>{label}</p>
        {subtitle && <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Chip({ label, selected, color = "#02AFCF", onClick }: { label: string; selected: boolean; color?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding: "6px 13px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit", fontSize: 12, transition: "all .18s", fontWeight: selected ? 700 : 500, border: `1.5px solid ${selected ? color : "#D2D4D8"}`, background: selected ? `${color}18` : "white", color: selected ? color : "#6B7280" }}>
      {label}
    </button>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: ".5px", textTransform: "uppercase" as const, marginBottom: 7 }}>
        {label}{required && <span style={{ color: "#EF4444", fontSize: 9 }}>●</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

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
  const [newDate,     setNewDate]     = useState("");
  const [newSlots,    setNewSlots]    = useState(10);
  const [recurDays,   setRecurDays]   = useState<number[]>([]);
  const [recurSlots,  setRecurSlots]  = useState(10);
  const [recurFrom,   setRecurFrom]   = useState("");
  const [recurTo,     setRecurTo]     = useState("");

  const { v, isReadyToPublish, pct } = useValidation({ title, city, description, languages, categories, dates, photos });

  const handleFiles = (files: FileList|null) => {
    if (!files) return;
    Array.from(files).slice(0, 6 - photos.length).forEach(f => {
      if (!f.type.startsWith("image/")) return;
      setPhotos(p => [...p, { file: f, url: URL.createObjectURL(f), uploading: false }]);
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

  const addDate = () => {
    if (!newDate || dates.find(d=>d.date===newDate)) return;
    setDates(p=>[...p,{date:newDate,slots:newSlots}].sort((a,b)=>a.date.localeCompare(b.date)));
    setNewDate("");
  };
  const removeDate  = (d:string) => setDates(p=>p.filter(x=>x.date!==d));
  const updateSlots = (d:string,s:number) => setDates(p=>p.map(x=>x.date===d?{...x,slots:s}:x));
  const genRecurring = () => {
    if (!recurFrom||!recurTo||recurDays.length===0) return;
    const from=new Date(recurFrom),to=new Date(recurTo),added:DateDispo[]=[],cur=new Date(from);
    while(cur<=to){
      if(recurDays.includes(cur.getDay())){const iso=cur.toISOString().slice(0,10); if(!dates.find(d=>d.date===iso)) added.push({date:iso,slots:recurSlots});}
      cur.setDate(cur.getDate()+1);
    }
    setDates(p=>[...p,...added].sort((a,b)=>a.date.localeCompare(b.date)));
  };

  const submit = async (pub:boolean) => {
    if (!title||!city||!description){setError("Remplissez les champs obligatoires.");setTab("infos");return;}
    setLoading(true); setPubMode(pub); setError(null);
    const {data:{user}} = await supabase.auth.getUser();
    if (!user){setError("Session expirée.");setLoading(false);return;}
    const photoUrls = photos.length>0 ? await uploadPhotos(user.id) : [];
    const {error:err} = await supabase.from("excursions").insert({
      prestataire_id:user.id, title, city, description,
      duration_hours:duration, price_per_person:price, max_people:maxPeople,
      categories, languages, inclusions, photos:photoUrls, is_active:pub,
      meeting_point:meetingPt||null, difficulty:difficulty||null, min_age:minAge||null,
      what_to_bring:whatBring||null, not_included:notIncl||null,
      important_info:impInfo||null, cancel_policy:cancelPol||null,
      available_dates:dates.length>0?dates:null,
    });
    setLoading(false);
    if (err){setError(err.message);return;}
    setSuccess(true);
    setTimeout(()=>{window.location.href="/prestataire/excursions";},2000);
  };

  if (success) return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,rgba(2,175,207,.1),rgba(37,159,252,.08))", border: "4px solid rgba(2,175,207,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 24px rgba(2,175,207,.2)" }}>
        <CheckCircle2 size={40} color="#02AFCF" />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#053366", marginBottom: 10, letterSpacing: "-.03em" }}>Excursion {pubMode?"publiée":"sauvegardée"} !</h2>
      <p style={{ color: "#6B7280", fontSize: 14 }}>Redirection en cours...</p>
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .nf-root * { font-family:'DM Sans',system-ui,sans-serif !important; }

        .nf-input input, .nf-input select, .nf-input textarea {
          width:100%; padding:10px 13px;
          border:1.5px solid #e2e5f0; border-radius:12px;
          font-size:13px; font-family:inherit !important;
          color:#053366; outline:none; transition:all .2s;
          background:white; box-sizing:border-box;
          box-shadow:0 1px 4px rgba(5,51,102,.04);
        }
        .nf-input input:focus, .nf-input select:focus, .nf-input textarea:focus {
          border-color:#02AFCF;
          box-shadow:0 0 0 3px rgba(2,175,207,.1);
        }
        .nf-input input::placeholder, .nf-input textarea::placeholder { color:#CBD5E1; }

        .nf-tab {
          display:flex; align-items:center; gap:7px;
          padding:9px 16px; border-radius:24px;
          font-size:13px; font-weight:600; cursor:pointer;
          font-family:inherit !important; border:1.5px solid #d2d4d8;
          background:white; color:#6B7280; transition:all .2s; white-space:nowrap;
        }
        .nf-tab.on { background:#053366; color:white; border-color:#053366; box-shadow:0 3px 12px rgba(5,51,102,.25); }
        .nf-tab:not(.on):hover { border-color:#02AFCF; color:#02AFCF; }

        .nf-card {
          background:white; border-radius:16px;
          border:1px solid #eef0f6; padding:22px 24px;
          box-shadow:0 2px 8px rgba(5,51,102,.04);
        }

        .nf-drop {
          border:2px dashed #e2e5f0; border-radius:14px;
          padding:40px 28px; text-align:center;
          cursor:pointer; transition:all .22s; background:#f7f8fc;
        }
        .nf-drop:hover { border-color:#02AFCF; background:rgba(2,175,207,.03); }

        .nf-date-row {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px; background:#f7f8fc;
          border-radius:10px; border:1.5px solid #eef0f6;
          margin-bottom:7px; transition:border-color .15s;
        }
        .nf-date-row:hover { border-color:#d2d4d8; }

        .nf-num {
          width:68px; padding:7px 10px;
          border:1.5px solid #e2e5f0; border-radius:8px;
          font-size:13px; font-family:inherit !important;
          color:#053366; outline:none; text-align:center;
          transition:border-color .2s; background:white;
        }
        .nf-num:focus { border-color:#02AFCF; }

        .nf-day {
          padding:5px 11px; border-radius:8px; font-size:12px;
          font-weight:600; cursor:pointer; font-family:inherit !important;
          border:1.5px solid #d2d4d8; background:white;
          color:#6B7280; transition:all .15s;
        }
        .nf-day.on { background:#053366; color:white; border-color:#053366; }

        .nf-pub-btn {
          display:flex; align-items:center; gap:8px;
          padding:11px 22px; border-radius:12px;
          cursor:pointer; font-family:inherit !important;
          font-size:13.5px; font-weight:700; border:none;
          transition:all .22s; letter-spacing:-.01em;
        }
        .nf-pub-btn.ready {
          background:linear-gradient(135deg,#02AFCF,#259FFC);
          color:white; box-shadow:0 4px 14px rgba(2,175,207,.38);
        }
        .nf-pub-btn.ready:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(2,175,207,.5); }
        .nf-pub-btn.locked { background:#EEF2FF; color:#9CA3AF; cursor:not-allowed; }

        .nf-draft-btn {
          display:flex; align-items:center; gap:8px;
          padding:10px 18px; border-radius:12px; cursor:pointer;
          font-family:inherit !important; font-size:13px; font-weight:600;
          background:white; color:#053366; border:1.5px solid #d2d4d8; transition:all .18s;
        }
        .nf-draft-btn:hover:not(:disabled) { background:#f7f8fc; border-color:#02AFCF; color:#02AFCF; }
        .nf-draft-btn:disabled { opacity:.5; cursor:not-allowed; }

        .nf-spin { animation:nf-sp 1s linear infinite; }
        @keyframes nf-sp { to { transform:rotate(360deg); } }

        select { appearance:none !important; -webkit-appearance:none !important; }
      `}</style>

      <div className="nf-root" style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ background: "white", padding: "32px 0 28px", borderBottom: "1px solid #eef0f6", marginBottom: 28 }}>
          <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 4px" }}>
            <a href="/prestataire/excursions" style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
              <ArrowLeft size={12} /> Mes excursions
            </a>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-.5px" }}>Nouvelle excursion</h1>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "5px 0 0", fontWeight: 400 }}>Complétez tous les champs pour débloquer la publication</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Progression ring */}
                <div style={{ position: "relative", width: 48, height: 48 }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#eef0f6" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke={isReadyToPublish ? "#02AFCF" : "#259FFC"} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*20}`} strokeDashoffset={`${2*Math.PI*20*(1-pct/100)}`}
                      style={{ transition: "stroke-dashoffset .4s ease" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#053366" }}>{pct}%</span>
                  </div>
                </div>

                <button type="button" className="nf-draft-btn" onClick={() => submit(false)} disabled={loading}>
                  {loading && !pubMode ? <Loader2 size={13} className="nf-spin" /> : <Save size={13} />} Brouillon
                </button>
                <button type="button" className={`nf-pub-btn ${isReadyToPublish ? "ready" : "locked"}`}
                  onClick={() => isReadyToPublish && submit(true)} disabled={loading || !isReadyToPublish}>
                  {loading && pubMode
                    ? <><Loader2 size={14} className="nf-spin" /> Publication...</>
                    : isReadyToPublish
                      ? <><Rocket size={14} /> Publier l'excursion</>
                      : <><Lock size={13} /> Publier ({pct}%)</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, marginBottom: 18, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 252px", gap: 18, alignItems: "start" }}>

          {/* ── Colonne principale ── */}
          <div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {TABS.map(({ key, label, icon: Icon, warn }) => (
                <button key={key} type="button" className={`nf-tab ${tab === key ? "on" : ""}`} onClick={() => setTab(key as any)}>
                  <Icon size={13} /> {label}
                  {warn && tab !== key && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />}
                </button>
              ))}
            </div>

            {/* ════ INFOS ════ */}
            {tab === "infos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="nf-card">
                  <SectionTitle icon={FileText} label="Informations de base" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Titre" required>
                      <div className="nf-input">
                        <input placeholder="Ex : Médina de Tunis — Visite guidée & dégustation" value={title} onChange={e => setTitle(e.target.value)}
                          style={{ borderColor: title.length > 0 && !v.title ? "#FCA5A5" : v.title ? "#86EFAC" : "#e2e5f0" }} />
                      </div>
                      {title.length > 0 && !v.title && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4, fontWeight: 600 }}>Minimum 5 caractères</p>}
                    </Field>

                    <Field label="Ville" required>
                      <div className="nf-input" style={{ position: "relative" }}>
                        <MapPin size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
                        <select value={city} onChange={e => setCity(e.target.value)} style={{ paddingLeft: 32, borderColor: v.city ? "#86EFAC" : "#e2e5f0" }}>
                          <option value="">Sélectionnez une ville</option>
                          {villes.map(vi => <option key={vi.id} value={vi.nom}>{vi.nom}</option>)}
                        </select>
                      </div>
                    </Field>

                    <Field label="Description" required hint="Décrivez les points d'intérêt, l'ambiance, l'expérience vécue.">
                      <div className="nf-input">
                        <textarea rows={4} placeholder="Partez à la découverte de la médina de Tunis, ses ruelles tortueuses, ses souks colorés..." value={description} onChange={e => setDescription(e.target.value)}
                          style={{ resize: "vertical", borderColor: description.length > 0 && !v.description ? "#FCA5A5" : v.description ? "#86EFAC" : "#e2e5f0" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        {description.length > 0 && !v.description && <p style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, margin: 0 }}>Minimum 30 car. ({30 - description.length} restants)</p>}
                        <p style={{ fontSize: 11, color: description.length > 900 ? "#D97706" : "#CBD5E1", textAlign: "right", margin: "0 0 0 auto" }}>{description.length}/1000</p>
                      </div>
                    </Field>
                  </div>
                </div>

                <div className="nf-card">
                  <SectionTitle icon={Settings2} label="Détails pratiques" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Durée (h)",        val: duration,   min: 0.5, max: 24,  step: 0.5, set: setDuration },
                      { label: "Prix/pers. (TND)", val: price,      min: 1,             step: 1,   set: setPrice },
                      { label: "Personnes max",    val: maxPeople,  min: 1,   max: 100, step: 1,   set: setMaxPeople },
                    ].map(f => (
                      <Field key={f.label} label={f.label}>
                        <div className="nf-input">
                          <input type="number" min={f.min} max={f.max} step={f.step} value={f.val} onChange={e => f.set(Number(e.target.value))} />
                        </div>
                      </Field>
                    ))}
                  </div>
                </div>

                <div className="nf-card">
                  <SectionTitle icon={Tag} label="Catégories" subtitle={v.categories ? `${categories.length} sélectionnée(s)` : "Sélectionnez au moins une catégorie"} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {categoriesDB.map(c => <Chip key={c.id} label={c.nom} selected={categories.includes(c.nom)} color={c.couleur} onClick={() => setCategories(toggle(categories, c.nom))} />)}
                  </div>
                </div>

                <div className="nf-card">
                  <SectionTitle icon={Languages} label="Langues parlées" subtitle={v.languages ? `${languages.length} sélectionnée(s)` : "Sélectionnez au moins une langue"} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {LANGUAGES.map(l => <Chip key={l} label={l} selected={languages.includes(l)} color="#259FFC" onClick={() => setLanguages(toggle(languages, l))} />)}
                  </div>
                </div>

                <div className="nf-card">
                  <SectionTitle icon={Package} label="Inclus dans le prix" subtitle="Optionnel" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {INCLUSIONS.map(i => <Chip key={i} label={i} selected={inclusions.includes(i)} color="#02AFCF" onClick={() => setInclusions(toggle(inclusions, i))} />)}
                  </div>
                </div>
              </div>
            )}

            {/* ════ DÉTAILS ════ */}
            {tab === "details" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="nf-card">
                  <SectionTitle icon={Navigation} label="Logistique" subtitle="Informations pratiques pour le touriste" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="Point de rendez-vous" hint="Adresse ou description du lieu de départ">
                      <div className="nf-input" style={{ position: "relative" }}>
                        <MapPin size={13} color="#9CA3AF" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input style={{ paddingLeft: 30 }} placeholder="Ex : Parking place du Belvédère, Tunis" value={meetingPt} onChange={e => setMeetingPt(e.target.value)} />
                      </div>
                    </Field>
                    <Field label="Âge minimum" hint="Laisser vide si aucune restriction">
                      <div className="nf-input" style={{ position: "relative" }}>
                        <Users size={13} color="#9CA3AF" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input type="number" min={0} max={99} style={{ paddingLeft: 30 }} placeholder="Ex : 12" value={minAge} onChange={e => setMinAge(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                    </Field>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 9 }}>Niveau de difficulté</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {DIFFICULTY.map(d => (
                        <button key={d.value} type="button" onClick={() => setDifficulty(difficulty === d.value ? "" : d.value)}
                          style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", border: `1.5px solid ${difficulty === d.value ? d.border : "#d2d4d8"}`, background: difficulty === d.value ? d.bg : "white", color: difficulty === d.value ? d.color : "#6B7280", transition: "all .15s" }}>
                          {d.icon} {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="nf-card">
                  <SectionTitle icon={Package} label="Inclus et non inclus" subtitle="Soyez précis — cela réduit les malentendus" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="Non inclus dans le prix" hint="Ex : billets, repas...">
                      <div className="nf-input"><textarea rows={3} placeholder={"- Billets d'entrée\n- Repas personnels"} value={notIncl} onChange={e => setNotIncl(e.target.value)} style={{ resize: "vertical" }} /></div>
                    </Field>
                    <Field label="Ce qu'il faut apporter" hint="Équipement recommandé">
                      <div className="nf-input"><textarea rows={3} placeholder={"- Chaussures confortables\n- Crème solaire"} value={whatBring} onChange={e => setWhatBring(e.target.value)} style={{ resize: "vertical" }} /></div>
                    </Field>
                  </div>
                </div>

                <div className="nf-card">
                  <SectionTitle icon={AlertCircle} label="Informations importantes & annulation" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Field label="Informations importantes" hint="Restrictions, contre-indications, conditions météo...">
                      <div className="nf-input"><textarea rows={3} placeholder="Ex : Non accessible aux PMR. Annulé en cas de mauvais temps." value={impInfo} onChange={e => setImpInfo(e.target.value)} style={{ resize: "vertical" }} /></div>
                    </Field>
                    <Field label="Politique d'annulation">
                      <div className="nf-input"><input placeholder="Ex : Annulation gratuite jusqu'à 24h avant" value={cancelPol} onChange={e => setCancelPol(e.target.value)} /></div>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ════ DATES ════ */}
            {tab === "dates" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="nf-card">
                    <SectionTitle icon={CalendarDays} label="Ajouter une date" />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <div className="nf-input" style={{ flex: 1, minWidth: 140 }}>
                        <input type="date" value={newDate} min={today} onChange={e => setNewDate(e.target.value)} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={12} color="#9CA3AF" />
                        <input type="number" min={1} max={maxPeople} value={newSlots} onChange={e => setNewSlots(Number(e.target.value))} className="nf-num" />
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>pl.</span>
                      </div>
                      <button type="button" onClick={addDate} disabled={!newDate}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, background: newDate ? "linear-gradient(135deg,#02AFCF,#259FFC)" : "#f7f8fc", color: newDate ? "white" : "#9CA3AF", border: "none", cursor: newDate ? "pointer" : "not-allowed", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", transition: "all .18s", boxShadow: newDate ? "0 3px 10px rgba(2,175,207,.35)" : "none" }}>
                        <Plus size={13} /> Ajouter
                      </button>
                    </div>
                  </div>

                  <div className="nf-card">
                    <SectionTitle icon={Clock} label="Dates récurrentes" subtitle="Générer sur une période" />
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 7 }}>Jours de la semaine</label>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {DAYS_FR.map((d, i) => (
                          <button key={i} type="button" className={`nf-day ${recurDays.includes(i) ? "on" : ""}`} onClick={() => setRecurDays(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      {[{ l: "Du", v: recurFrom, m: today, s: setRecurFrom }, { l: "Au", v: recurTo, m: recurFrom || today, s: setRecurTo }].map(f => (
                        <div key={f.l} className="nf-input">
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 5 }}>{f.l}</label>
                          <input type="date" value={f.v} min={f.m} onChange={e => f.s(e.target.value)} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>Places/date :</span>
                      <input type="number" min={1} max={maxPeople} value={recurSlots} onChange={e => setRecurSlots(Number(e.target.value))} className="nf-num" />
                    </div>
                    <button type="button" onClick={genRecurring} disabled={recurDays.length === 0 || !recurFrom || !recurTo}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px", borderRadius: 10, background: (recurDays.length > 0 && recurFrom && recurTo) ? "rgba(2,175,207,.08)" : "#f7f8fc", color: (recurDays.length > 0 && recurFrom && recurTo) ? "#02AFCF" : "#9CA3AF", border: `1.5px solid ${(recurDays.length > 0 && recurFrom && recurTo) ? "rgba(2,175,207,.3)" : "#eef0f6"}`, cursor: (recurDays.length > 0 && recurFrom && recurTo) ? "pointer" : "not-allowed", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", transition: "all .18s" }}>
                      <CalendarDays size={13} /> Générer les dates
                    </button>
                  </div>
                </div>

                <div className="nf-card">
                  <SectionTitle icon={CalendarDays} label={`Dates sélectionnées${dates.length ? ` (${dates.length})` : ""}`} subtitle="Modifiez les places par date" />
                  {dates.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 16px" }}>
                      <CalendarDays size={36} color="#eef0f6" style={{ margin: "0 auto 12px", display: "block" }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0 }}>Aucune date ajoutée</p>
                      <p style={{ fontSize: 12, marginTop: 5, color: "#9CA3AF" }}>Ajoutez des dates depuis le panneau gauche</p>
                    </div>
                  ) : (
                    <>
                      {dates.map(d => { const dt = new Date(d.date + "T00:00:00"); return (
                        <div key={d.date} className="nf-date-row">
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#053366", margin: 0 }}>
                              {dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Users size={11} color="#9CA3AF" />
                            <input type="number" min={1} max={maxPeople} value={d.slots} onChange={e => updateSlots(d.date, Number(e.target.value))} className="nf-num" />
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>pl.</span>
                          </div>
                          <button type="button" onClick={() => removeDate(d.date)} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#FEE2E2", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <X size={11} />
                          </button>
                        </div>
                      );})}
                      <button type="button" onClick={() => setDates([])} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "8px", borderRadius: 9, background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FCA5A5", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                        <Trash2 size={12} /> Tout supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ════ PHOTOS ════ */}
            {tab === "photos" && (
              <div className="nf-card">
                <SectionTitle icon={ImageIcon} label="Photos de l'excursion" subtitle={`${photos.length}/6 — La première sera la photo principale`} />
                {photos.length === 0 ? (
                  <div className="nf-drop" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(2,175,207,.08)", border: "1.5px solid rgba(2,175,207,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <ImageIcon size={22} color="#02AFCF" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", marginBottom: 5 }}>Glissez vos photos ici ou cliquez</p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>JPG, PNG, WebP · Max 5 MB · 6 photos max</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
                      {photos.map((p, i) => (
                        <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 12, overflow: "hidden", background: "#f7f8fc", border: i === 0 ? "2.5px solid #02AFCF" : "2px solid transparent", boxShadow: i === 0 ? "0 0 0 3px rgba(2,175,207,.15)" : "none" }}>
                          <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {p.uploading
                            ? <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.8)", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={20} color="#02AFCF" className="nf-spin" /></div>
                            : <button type="button" onClick={() => removePhoto(i)} style={{ position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: "50%", background: "rgba(5,51,102,.65)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={11} /></button>
                          }
                          {i === 0 && <div style={{ position: "absolute", bottom: 7, left: 7, padding: "3px 8px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", color: "white", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: ".5px" }}>PRINCIPALE</div>}
                        </div>
                      ))}
                      {photos.length < 6 && (
                        <div onClick={() => fileRef.current?.click()} style={{ aspectRatio: "4/3", borderRadius: 12, border: "2px dashed #e2e5f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f7f8fc", gap: 7 }}>
                          <Plus size={20} color="#d2d4d8" />
                          <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Ajouter</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>✦ La 1ère photo est mise en avant sur votre annonce</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
              </div>
            )}
          </div>

          {/* ── Panneau latéral ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Checklist */}
            <div className="nf-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0 }}>Checklist publication</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{CHECKLIST.filter(r => r.ok).length}/{CHECKLIST.length} critères</p>
                </div>
                {isReadyToPublish && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(2,175,207,.1)", border: "2px solid rgba(2,175,207,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={15} color="#02AFCF" />
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, borderRadius: 100, background: "#eef0f6", marginBottom: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 100, width: `${pct}%`, background: "linear-gradient(90deg,#02AFCF,#259FFC)", transition: "width .4s ease" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {CHECKLIST.map(r => (
                  <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    {r.ok
                      ? <CheckCircle2 size={13} color="#02AFCF" style={{ flexShrink: 0 }} />
                      : <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #d2d4d8", flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 12, fontWeight: r.ok ? 600 : 500, color: r.ok ? "#053366" : "#9CA3AF" }}>{r.label}</span>
                  </div>
                ))}
              </div>

              <button type="button" className={`nf-pub-btn ${isReadyToPublish ? "ready" : "locked"}`}
                onClick={() => isReadyToPublish && submit(true)} disabled={loading || !isReadyToPublish}
                style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                {loading && pubMode ? <><Loader2 size={14} className="nf-spin" /> Publication...</> : isReadyToPublish ? <><Rocket size={14} /> Publier maintenant</> : <><Lock size={13} /> Compléter les champs</>}
              </button>
              {!isReadyToPublish && <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>Le bouton se débloque automatiquement.</p>}
            </div>

            {/* Gains */}
            <div style={{ background: "linear-gradient(135deg,rgba(2,175,207,.07),rgba(37,159,252,.04))", borderRadius: 14, border: "1.5px solid rgba(2,175,207,.22)", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Banknote size={13} color="#02AFCF" />
                <span style={{ fontWeight: 700, fontSize: 12, color: "#02AFCF" }}>Aperçu des gains</span>
              </div>
              {[{ l: "Prix affiché", v: `${price} TND`, c: "#053366" }, { l: "Commission (10%)", v: `−${Math.round(price * .1)} TND`, c: "#DC2626" }].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "#6B7280" }}>{r.l}</span>
                  <strong style={{ color: r.c }}>{r.v}</strong>
                </div>
              ))}
              <div style={{ borderTop: "1px dashed rgba(2,175,207,.25)", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#053366" }}>Vous recevez</span>
                <strong style={{ color: "#02AFCF", fontSize: 18, letterSpacing: "-.02em" }}>{Math.round(price * .9)} TND</strong>
              </div>
            </div>

            {/* Brouillon */}
            <button type="button" className="nf-draft-btn" onClick={() => submit(false)} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading && !pubMode ? <Loader2 size={13} className="nf-spin" /> : <Save size={13} />} Sauvegarder en brouillon
            </button>
          </div>
        </div>
      </div>
    </>
  );
}