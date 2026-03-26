"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  MapPin, Clock, Sparkles, ChevronRight, ChevronLeft,
  RotateCcw, CheckCircle, Calendar, Wallet, Bot,
  Mountain, RefreshCw, X, Loader2,
} from "lucide-react";

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

/* ── Types ── */
type Ville      = { id: string; nom?: string; name?: string; city?: string; emoji?: string; icon?: string; [key: string]: unknown; };
type Categorie  = { id: string; nom?: string; name?: string; label?: string; emoji?: string; icon?: string; [key: string]: unknown; };
type Excursion  = {
  id: string; title: string; city: string;
  price_per_person?: number; duration_hours?: number;
  description?: string; categories?: string[];
};
type Activity   = {
  id: string; name: string; description?: string;
  time: string; duration: string; price: number; icon?: string;
};
type DayPlan    = { day: number; city: string; theme?: string; emoji?: string; activities: Activity[]; };
type Itinerary  = { title: string; days: DayPlan[]; };

const CITY_EMOJI: Record<string, string> = {
  tunis:"🏛️", carthage:"🏺", "sidi bou saïd":"🔵", "sidi bou said":"🔵",
  hammamet:"🌊", sousse:"🏰", monastir:"⛪", mahdia:"🐟",
  sfax:"🫒", tozeur:"🌴", douz:"🐪", djerba:"🏝️",
  tataouine:"🏜️", matmata:"🪨", kairouan:"🕌", béja:"🌿", beja:"🌿",
};
const cityEmoji = (c = "") => CITY_EMOJI[c.toLowerCase()] || "📍";

const LOADING_MSGS = [
  "Récupération des excursions depuis la base...",
  "Analyse des activités disponibles...",
  "L'agent IA organise votre itinéraire...",
  "Finalisation jour par jour...",
];

function extractItinerary(raw: unknown): Itinerary {
  const item = Array.isArray(raw) ? raw[0] : raw;
  const r = item as Record<string, unknown>;
  const candidates = [r?.output, r?.message, r?.text, r?.json, r?.data, r?.itinerary, item];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const p = typeof c === "string" ? JSON.parse(c) : c;
      const pr = p as Record<string, unknown>;
      if (Array.isArray(pr?.days) && (pr.days as unknown[]).length > 0) return p as Itinerary;
      const nested = pr?.itinerary || pr?.result;
      if (nested && Array.isArray((nested as Record<string, unknown>)?.days)) return nested as Itinerary;
    } catch { /* continuer */ }
  }
  throw new Error("Impossible de trouver l'itinéraire dans la réponse n8n. Vérifie ton workflow.");
}

export default function ModeAssiste() {
  const supabase = createClient();
  const [step, setStep] = useState<"accueil"|"questions"|"generation"|"itineraire"|"checkout">("accueil");
  const [days, setDays] = useState(5);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCats, setSelectedCats]     = useState<string[]>([]);

  const [villes,      setVilles]      = useState<Ville[]>([]);
  const [categories,  setCategories]  = useState<Categorie[]>([]);
  const [excursions,  setExcursions]  = useState<Excursion[]>([]);
  const [dbLoading,   setDbLoading]   = useState(true);
  const [dbError,     setDbError]     = useState("");

  const [itinerary,   setItinerary]   = useState<Itinerary | null>(null);
  const [genError,    setGenError]    = useState("");
  const [loadingMsg,  setLoadingMsg]  = useState("");
  const [activeDay,   setActiveDay]   = useState(0);
  const msgIdxRef = useRef(0);

  const [editing,     setEditing]     = useState<{dayIdx:number;actIdx:number}|null>(null);
  const [altOptions,  setAltOptions]  = useState<Activity[]>([]);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookingCode] = useState(() => "TN-" + Math.random().toString(36).substring(2,8).toUpperCase());

  const totalPrice = itinerary?.days.reduce(
    (acc, d) => acc + d.activities.reduce((a, act) => a + (Number(act.price) || 0), 0), 0
  ) ?? 0;

  /* ── Charger Supabase ── */
  useEffect(() => {
    const load = async () => {
      setDbLoading(true); setDbError("");
      try {
        const [
          { data: v, error: ve },
          { data: c, error: ce },
          { data: e, error: ee },
        ] = await Promise.all([
          supabase.from("villes").select("*").order("nom"),
          supabase.from("categories").select("*").order("nom"),
          supabase.from("excursions").select("*").eq("is_active", true),
        ]);
        if (ve) throw new Error("Villes: " + ve.message);
        if (ce) throw new Error("Catégories: " + ce.message);
        if (ee) throw new Error("Excursions: " + ee.message);
        setVilles((v || []) as unknown as Ville[]);
        setCategories((c || []) as unknown as Categorie[]);
        setExcursions((e || []) as Excursion[]);
      } catch (err) {
        setDbError(err instanceof Error ? err.message : "Erreur chargement");
      } finally {
        setDbLoading(false);
      }
    };
    load();
  }, []);

  const toggleCity = (nom: string) =>
    setSelectedCities(p => p.includes(nom) ? p.filter(x => x !== nom) : [...p, nom]);
  const toggleCat  = (id: string) =>
    setSelectedCats(p =>  p.includes(id)  ? p.filter(x => x !== id)  : [...p, id]);

  /* ── Générer via n8n ── */
  const generate = async () => {
    if (!selectedCities.length || !selectedCats.length || !N8N_WEBHOOK_URL) return;
    setStep("generation"); setGenError("");
    msgIdxRef.current = 0; setLoadingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => {
      msgIdxRef.current = Math.min(msgIdxRef.current + 1, LOADING_MSGS.length - 1);
      setLoadingMsg(LOADING_MSGS[msgIdxRef.current]);
    }, 2200);

    try {
      const relExc = excursions.filter(e => selectedCities.includes(e.city));
      const catNames = selectedCats.map(id => categories.find(c => c.id === id)?.nom).filter(Boolean);

      const message = `Tu es un expert en tourisme tunisien.
Crée un itinéraire de ${days} jours.
Villes: ${selectedCities.join(", ")}
Intérêts: ${catNames.join(", ")}

Excursions disponibles (utilise UNIQUEMENT celles-ci):
${JSON.stringify(relExc.map(e => ({
  id: e.id, name: e.title, city: e.city,
  price: e.price_per_person || 0,
  duration: e.duration_hours ? `${e.duration_hours}h` : "2h",
  description: e.description || "",
})), null, 2)}

RÈGLES: max 3 activités/jour, 1 ville/jour, IDs exacts, JSON uniquement.

Format:
{
  "title": "Titre",
  "days": [{
    "day": 1, "city": "Ville", "theme": "Thème", "emoji": "🏛️",
    "activities": [{
      "id": "id-exact", "name": "Nom", "description": "...",
      "time": "09:00", "duration": "2h", "price": 45, "icon": "🏛️"
    }]
  }]
}`;

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action:"generate", message, days, cities:selectedCities, interests:catNames }),
      });
      clearInterval(iv);
      if (!res.ok) throw new Error(`n8n ${res.status}: ${(await res.text()).slice(0,300)}`);
      const data = extractItinerary(await res.json());
      setItinerary(data); setActiveDay(0); setStep("itineraire");
    } catch (err) {
      clearInterval(iv);
      setGenError(err instanceof Error ? err.message : "Erreur inconnue");
      setStep("questions");
    }
  };

  /* ── Alternatives locales ── */
  const openEdit = (dayIdx: number, actIdx: number) => {
    setEditing({ dayIdx, actIdx });
    const city = itinerary!.days[dayIdx].city;
    const curId = itinerary!.days[dayIdx].activities[actIdx].id;
    const used  = new Set(itinerary!.days.flatMap(d => d.activities.map(a => a.id)));
    const alts: Activity[] = excursions
      .filter(e => e.city === city && e.id !== curId && !used.has(e.id))
      .slice(0, 5)
      .map(e => ({
        id: e.id, name: e.title, description: e.description || "",
        time: itinerary!.days[dayIdx].activities[actIdx].time,
        duration: e.duration_hours ? `${e.duration_hours}h` : "2h",
        price: e.price_per_person || 0, icon: "🗺️",
      }));
    setAltOptions(alts);
  };

  const applyAlt = (alt: Activity) => {
    if (!editing || !itinerary) return;
    const upd: Itinerary = JSON.parse(JSON.stringify(itinerary));
    upd.days[editing.dayIdx].activities[editing.actIdx] = alt;
    setItinerary(upd); setEditing(null); setAltOptions([]);
  };

  const resetAll = () => {
    setStep("accueil"); setItinerary(null); setSelectedCities([]);
    setSelectedCats([]); setDays(5); setActiveDay(0);
    setBookingDone(false); setGenError("");
  };

  /* ── Render ── */
  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFF", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes dot    { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        .ma-fadein { animation:fadeUp .4s ease both; }
        .ma-btn-primary { display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:linear-gradient(135deg,#02AFCF,#259FFC);color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 14px rgba(2,175,207,.35); }
        .ma-btn-primary:hover { box-shadow:0 6px 20px rgba(2,175,207,.5);transform:translateY(-2px); }
        .ma-btn-primary:disabled { background:#DCE5FF;color:#9CA3AF;box-shadow:none;transform:none;cursor:not-allowed; }
        .ma-btn-secondary { display:inline-flex;align-items:center;gap:8px;padding:11px 24px;background:white;color:#053366;border:1.5px solid #DCE5FF;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s; }
        .ma-btn-secondary:hover { border-color:#02AFCF;color:#02AFCF; }
        .ma-chip { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1.5px solid #DCE5FF;border-radius:20px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:#053366;transition:all .18s;user-select:none;font-family:inherit; }
        .ma-chip:hover  { border-color:#02AFCF;color:#02AFCF; }
        .ma-chip.on     { background:linear-gradient(135deg,#02AFCF,#259FFC);border-color:transparent;color:white;box-shadow:0 3px 10px rgba(2,175,207,.3); }
        .ma-icard { display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 10px;border:1.5px solid #DCE5FF;border-radius:14px;background:white;cursor:pointer;font-size:12px;font-weight:600;color:#053366;text-align:center;transition:all .18s;user-select:none;font-family:inherit; }
        .ma-icard:hover { border-color:#02AFCF; }
        .ma-icard.on    { background:rgba(2,175,207,.07);border-color:#02AFCF;color:#02AFCF; }
        .ma-day-tab { padding:8px 18px;border:1.5px solid #DCE5FF;border-radius:20px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:#6B7280;transition:all .15s;white-space:nowrap;font-family:inherit; }
        .ma-day-tab.on { background:linear-gradient(135deg,#02AFCF,#259FFC);color:white;border-color:transparent;box-shadow:0 3px 10px rgba(2,175,207,.3); }
        .ma-acard { background:white;border:1px solid #EEF2FF;border-radius:14px;padding:16px 18px;display:flex;gap:14px;align-items:flex-start;transition:all .2s;margin-bottom:10px; }
        .ma-acard:hover { box-shadow:0 4px 20px rgba(5,51,102,.08);border-color:#DCE5FF; }
        .ma-altcard { background:white;border:1.5px solid #EEF2FF;border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .2s;margin-bottom:8px; }
        .ma-altcard:hover { border-color:#02AFCF;background:rgba(2,175,207,.04); }
        .ma-badge-price { display:inline-block;background:rgba(2,175,207,.1);color:#02AFCF;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700; }
        .ma-range { -webkit-appearance:none;width:100%;height:5px;border-radius:3px;outline:none;background:linear-gradient(to right,#02AFCF 0%,#02AFCF var(--val,30%),#DCE5FF var(--val,30%),#DCE5FF 100%); }
        .ma-range::-webkit-slider-thumb { -webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:white;border:2.5px solid #02AFCF;cursor:pointer;box-shadow:0 2px 8px rgba(2,175,207,.35); }
        .ma-input { width:100%;padding:11px 14px;border:1.5px solid #DCE5FF;border-radius:10px;font-family:inherit;font-size:14px;color:#053366;outline:none;transition:border .2s; }
        .ma-input:focus { border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.1); }
        .ma-stat-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px; }
        .ma-cats-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px; }
        .ma-nav-footer { display:flex;justify-content:space-between;align-items:center;margin-top:28px; }
        @media(max-width:600px){
          .ma-stat-grid{grid-template-columns:repeat(3,1fr);gap:8px}
          .ma-cats-grid{grid-template-columns:repeat(3,1fr)}
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:"white", borderBottom:"1px solid #EEF2FF", padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 2px 8px rgba(5,51,102,.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 3px 10px rgba(2,175,207,.35)" }}>
            <Bot size={20} color="white" strokeWidth={1.8}/>
          </div>
          <div>
            <p style={{ fontSize:15, fontWeight:800, color:"#053366", margin:0, letterSpacing:"-0.3px" }}>Mode Assisté</p>
            <p style={{ fontSize:11, color:"#9CA3AF", margin:0 }}>Itinéraire généré par IA</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color: N8N_WEBHOOK_URL ? "#15803D" : "#DC2626" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background: N8N_WEBHOOK_URL ? "#22C55E" : "#EF4444", display:"inline-block" }}/>
            {N8N_WEBHOOK_URL ? "Agent IA connecté" : "Agent non configuré"}
          </span>
          {!dbLoading && !dbError && (
            <span style={{ fontSize:12, color:"#9CA3AF" }}>
              {excursions.length} excursions · {villes.length} villes
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"36px 24px" }}>

        {/* ══ ACCUEIL ══ */}
        {step === "accueil" && (
          <div className="ma-fadein" style={{ textAlign:"center", paddingTop:24 }}>

            {dbError && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:12, padding:"14px 18px", marginBottom:24, fontSize:13, color:"#DC2626", textAlign:"left" }}>
                <strong>Erreur base de données :</strong> {dbError}
              </div>
            )}

            {!N8N_WEBHOOK_URL && (
              <div style={{ background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:12, padding:"14px 18px", marginBottom:24, fontSize:13, color:"#A16207", textAlign:"left" }}>
                <strong>Configuration requise</strong> — Ajoute dans <code>.env.local</code> :<br/>
                <code style={{ display:"block", marginTop:8, padding:"8px 12px", background:"rgba(0,0,0,.05)", borderRadius:8, fontSize:12 }}>
                  NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/tunisia-planner
                </code>
              </div>
            )}

            <div style={{ width:72, height:72, borderRadius:22, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 8px 24px rgba(2,175,207,.4)" }}>
              <Sparkles size={34} color="white" strokeWidth={1.5}/>
            </div>
            <h1 style={{ fontSize:28, fontWeight:800, color:"#053366", margin:"0 0 10px", letterSpacing:"-0.5px" }}>
              Votre itinéraire sur mesure
            </h1>
            <p style={{ fontSize:15, color:"#6B7280", margin:"0 0 28px", lineHeight:1.6 }}>
              Répondez à 3 questions et notre agent IA compose votre voyage<br/>
              jour par jour depuis les excursions disponibles.
            </p>

            {dbLoading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:"#02AFCF", fontSize:13, fontWeight:600, marginBottom:28 }}>
                <Loader2 size={16} style={{ animation:"spin .7s linear infinite" }}/> Chargement de la base de données...
              </div>
            ) : !dbError && (
              <div style={{ background:"white", border:"1px solid #EEF2FF", borderRadius:16, padding:"18px 24px", marginBottom:28, boxShadow:"0 2px 10px rgba(5,51,102,.05)", display:"inline-block", minWidth:280 }}>
                <p style={{ fontSize:12, fontWeight:700, color:"#02AFCF", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 14px" }}>Base de données connectée ✓</p>
                <div className="ma-stat-grid">
                  {[
                    { val:excursions.length, label:"excursions", icon:<Mountain size={16}/> },
                    { val:villes.length,     label:"villes",     icon:<MapPin size={16}/> },
                    { val:categories.length, label:"catégories", icon:<Sparkles size={16}/> },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign:"center", padding:"10px 8px", background:"#F8FAFF", borderRadius:10 }}>
                      <div style={{ color:"#02AFCF", display:"flex", justifyContent:"center", marginBottom:4 }}>{s.icon}</div>
                      <p style={{ fontSize:22, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>{s.val}</p>
                      <p style={{ fontSize:11, color:"#9CA3AF", margin:"3px 0 0", fontWeight:500 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <button className="ma-btn-primary" onClick={() => setStep("questions")}
                disabled={!N8N_WEBHOOK_URL || dbLoading || !!dbError}
                style={{ fontSize:15, padding:"14px 36px" }}>
                <Sparkles size={17}/> Générer mon itinéraire
              </button>
            </div>
          </div>
        )}

        {/* ══ QUESTIONS ══ */}
        {step === "questions" && (
          <div className="ma-fadein">
            {genError && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:12, padding:"14px 18px", marginBottom:20, fontSize:13, color:"#DC2626" }}>
                <strong>Erreur agent IA :</strong> {genError}
              </div>
            )}

            {/* Progress */}
            <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:32 }}>
              {["Durée","Villes","Intérêts"].map((label, i) => (
                <React.Fragment key={label}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#02AFCF,#259FFC)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"white", boxShadow:"0 3px 10px rgba(2,175,207,.35)" }}>
                      {i+1}
                    </div>
                    <span style={{ fontSize:11, color:"#02AFCF", fontWeight:600 }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ flex:1, height:2, background:"#DCE5FF", margin:"0 4px", marginBottom:18 }}/>}
                </React.Fragment>
              ))}
            </div>

            {/* Q1 — Jours */}
            <div style={{ background:"white", borderRadius:16, border:"1px solid #EEF2FF", padding:"22px 24px", marginBottom:16, boxShadow:"0 2px 8px rgba(5,51,102,.04)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:"rgba(2,175,207,.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Calendar size={17} color="#02AFCF"/>
                </div>
                <div>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#053366", margin:0 }}>Combien de jours ?</h2>
                  <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>Glissez pour choisir la durée du voyage</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                <input type="range" min="2" max="14" step="1" value={days} className="ma-range"
                  style={{ "--val":`${((days-2)/12)*100}%`, flex:1 } as React.CSSProperties}
                  onChange={e => setDays(Number(e.target.value))}/>
                <div style={{ minWidth:70, textAlign:"center", background:"linear-gradient(135deg,#02AFCF,#259FFC)", borderRadius:14, padding:"10px 16px", boxShadow:"0 3px 10px rgba(2,175,207,.35)" }}>
                  <p style={{ fontSize:28, fontWeight:900, color:"white", margin:0, lineHeight:1 }}>{days}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,.7)", margin:0, fontWeight:500 }}>jours</p>
                </div>
              </div>
            </div>

            {/* Q2 — Villes */}
            <div style={{ background:"white", borderRadius:16, border:"1px solid #EEF2FF", padding:"22px 24px", marginBottom:16, boxShadow:"0 2px 8px rgba(5,51,102,.04)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:"rgba(2,175,207,.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <MapPin size={17} color="#02AFCF"/>
                </div>
                <div>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#053366", margin:0 }}>Quelles villes ?</h2>
                  <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>
                    {selectedCities.length === 0 ? "Sélectionnez au moins une ville" : `${selectedCities.length} ville${selectedCities.length > 1 ? "s" : ""} choisie${selectedCities.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              {villes.length === 0 ? (
                <p style={{ fontSize:13, color:"#9CA3AF" }}>Aucune ville dans la base</p>
              ) : (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {villes.map(v => (
                    <button key={v.id} className={`ma-chip ${selectedCities.includes(v.nom) ? "on" : ""}`}
                      onClick={() => toggleCity(String(v.nom || v.name || ''))}>
                      {(v.emoji || v.icon) || cityEmoji(String(v.nom || v.name || ''))} {String(v.nom || v.name || '')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Q3 — Catégories */}
            <div style={{ background:"white", borderRadius:16, border:"1px solid #EEF2FF", padding:"22px 24px", marginBottom:24, boxShadow:"0 2px 8px rgba(5,51,102,.04)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:"rgba(2,175,207,.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Sparkles size={17} color="#02AFCF"/>
                </div>
                <div>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#053366", margin:0 }}>Vos intérêts ?</h2>
                  <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>
                    {selectedCats.length === 0 ? "Sélectionnez vos centres d'intérêt" : `${selectedCats.length} intérêt${selectedCats.length > 1 ? "s" : ""} choisi${selectedCats.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              {categories.length === 0 ? (
                <p style={{ fontSize:13, color:"#9CA3AF" }}>Aucune catégorie dans la base</p>
              ) : (
                <div className="ma-cats-grid">
                  {categories.map(cat => (
                    <button key={cat.id} className={`ma-icard ${selectedCats.includes(cat.id) ? "on" : ""}`}
                      onClick={() => toggleCat(cat.id)}>
                      <span style={{ fontSize:26 }}>{String(cat.emoji || cat.icon || '🎯')}</span>
                      <span style={{ fontSize:12 }}>{String(cat.nom || cat.name || cat.label || '')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ma-nav-footer">
              <button className="ma-btn-secondary" onClick={() => { setStep("accueil"); setGenError(""); }}>
                <ChevronLeft size={16}/> Retour
              </button>
              <button className="ma-btn-primary" onClick={generate}
                disabled={!selectedCities.length || !selectedCats.length || !N8N_WEBHOOK_URL}>
                <Bot size={16}/> Générer l'itinéraire
              </button>
            </div>
          </div>
        )}

        {/* ══ GÉNÉRATION ══ */}
        {step === "generation" && (
          <div style={{ textAlign:"center", paddingTop:80 }}>
            <div style={{ width:80, height:80, borderRadius:24, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", boxShadow:"0 8px 28px rgba(2,175,207,.45)", animation:"pulse 2s ease-in-out infinite" }}>
              <Bot size={38} color="white" strokeWidth={1.5}/>
            </div>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#053366", marginBottom:10 }}>L'agent IA prépare votre voyage...</h2>
            <p style={{ fontSize:14, color:"#6B7280", minHeight:22, marginBottom:32 }}>{loadingMsg}</p>
            <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"linear-gradient(135deg,#02AFCF,#259FFC)", animation:`dot 1.2s ${i*.2}s ease-in-out infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {/* ══ ITINÉRAIRE ══ */}
        {step === "itineraire" && itinerary && (
          <div className="ma-fadein">
            {/* Header itinéraire */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:800, color:"#053366", margin:"0 0 4px", letterSpacing:"-0.4px" }}>{itinerary.title}</h1>
                <p style={{ fontSize:13, color:"#9CA3AF", margin:0 }}>
                  {itinerary.days.length} jours · {selectedCities.join(", ")}
                </p>
              </div>
              <button className="ma-btn-secondary" style={{ padding:"8px 14px", fontSize:13 }} onClick={() => setStep("questions")}>
                <RefreshCw size={14}/> Modifier
              </button>
            </div>

            {/* Tabs jours */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:10, marginBottom:20 }}>
              {itinerary.days.map((d, i) => (
                <button key={i} className={`ma-day-tab ${activeDay===i?"on":""}`} onClick={() => setActiveDay(i)}>
                  {d.emoji || cityEmoji(d.city)} Jour {d.day}
                </button>
              ))}
            </div>

            {/* Contenu du jour */}
            {(() => {
              const day = itinerary.days[activeDay];
              return (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"14px 18px", background:"white", borderRadius:14, border:"1px solid #EEF2FF" }}>
                    <span style={{ fontSize:28 }}>{day.emoji || cityEmoji(day.city)}</span>
                    <div>
                      <p style={{ fontSize:16, fontWeight:800, color:"#053366", margin:0 }}>Jour {day.day} — {day.city}</p>
                      {day.theme && <p style={{ fontSize:12, color:"#02AFCF", fontWeight:600, margin:0, textTransform:"uppercase", letterSpacing:"0.5px" }}>{day.theme}</p>}
                    </div>
                  </div>

                  {day.activities.map((act, ai) => (
                    <div key={act.id || ai}>
                      {editing?.dayIdx === activeDay && editing?.actIdx === ai ? (
                        /* Panel alternatives */
                        <div style={{ border:"2px solid #02AFCF", borderRadius:14, padding:18, background:"rgba(2,175,207,.04)", marginBottom:10 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                            <p style={{ fontSize:13, fontWeight:700, color:"#02AFCF", textTransform:"uppercase", letterSpacing:"0.5px", margin:0 }}>
                              Alternatives pour « {act.name} »
                            </p>
                            <button onClick={() => { setEditing(null); setAltOptions([]); }}
                              style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", display:"flex" }}>
                              <X size={16}/>
                            </button>
                          </div>
                          {altOptions.length === 0 ? (
                            <p style={{ fontSize:13, color:"#9CA3AF", textAlign:"center", padding:16 }}>
                              Aucune alternative disponible pour {day.city} dans la base.
                            </p>
                          ) : altOptions.map((alt, oi) => (
                            <div key={oi} className="ma-altcard" onClick={() => applyAlt(alt)}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                <p style={{ fontSize:14, fontWeight:700, color:"#053366", margin:0 }}>
                                  {alt.icon || "🗺️"} {alt.name}
                                </p>
                                <span className="ma-badge-price">{!alt.price || alt.price===0 ? "Gratuit" : `${alt.price} TND`}</span>
                              </div>
                              {alt.description && <p style={{ fontSize:12, color:"#6B7280", margin:"6px 0 4px" }}>{alt.description}</p>}
                              <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>⏱ {alt.duration}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Carte activité */
                        <div className="ma-acard">
                          <div style={{ width:42, height:42, borderRadius:12, background:"rgba(2,175,207,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                            {act.icon || "🗺️"}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                              <div style={{ minWidth:0 }}>
                                <p style={{ fontSize:14, fontWeight:800, color:"#053366", margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.name}</p>
                                <p style={{ fontSize:12, color:"#9CA3AF", margin:0, display:"flex", alignItems:"center", gap:8 }}>
                                  <Clock size={11}/> {act.time} · {act.duration}
                                </p>
                              </div>
                              <span className="ma-badge-price" style={{ flexShrink:0 }}>
                                {!act.price || act.price===0 ? "Gratuit" : `${act.price} TND`}
                              </span>
                            </div>
                            {act.description && (
                              <p style={{ fontSize:13, color:"#6B7280", margin:"8px 0 0", lineHeight:1.5 }}>{act.description}</p>
                            )}
                          </div>
                          <button onClick={() => openEdit(activeDay, ai)}
                            style={{ flexShrink:0, background:"none", border:"1.5px solid #DCE5FF", borderRadius:9, padding:"7px 12px", cursor:"pointer", fontSize:12, color:"#9CA3AF", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, transition:"all .15s" }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#02AFCF";(e.currentTarget as HTMLElement).style.color="#02AFCF";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#DCE5FF";(e.currentTarget as HTMLElement).style.color="#9CA3AF";}}>
                            <RefreshCw size={12}/> Changer
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Nav jours */}
                  <div className="ma-nav-footer">
                    <button className="ma-btn-secondary" style={{ visibility:activeDay>0?"visible":"hidden" }} onClick={() => setActiveDay(activeDay-1)}>
                      <ChevronLeft size={16}/> Jour {activeDay}
                    </button>
                    {activeDay < itinerary.days.length-1 ? (
                      <button className="ma-btn-primary" onClick={() => setActiveDay(activeDay+1)}>
                        Jour {activeDay+2} <ChevronRight size={16}/>
                      </button>
                    ) : (
                      <button className="ma-btn-primary" onClick={() => setStep("checkout")}>
                        <CheckCircle size={16}/> Réserver
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Récap prix */}
            <div style={{ marginTop:24, padding:"16px 20px", background:"white", border:"1px solid #EEF2FF", borderRadius:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, boxShadow:"0 2px 8px rgba(5,51,102,.05)" }}>
              <div>
                <p style={{ fontSize:11, color:"#9CA3AF", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 3px" }}>Total estimé</p>
                <p style={{ fontSize:24, fontWeight:900, color:"#053366", margin:0 }}>
                  {totalPrice} <span style={{ fontSize:13, fontWeight:500, color:"#9CA3AF" }}>TND</span>
                </p>
              </div>
              <p style={{ fontSize:13, color:"#6B7280", margin:0 }}>{itinerary.days.length} jours · {selectedCities.join(", ")}</p>
              <button className="ma-btn-primary" onClick={() => setStep("checkout")}>
                Finaliser <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}

        {/* ══ CHECKOUT ══ */}
        {step === "checkout" && (
          <div className="ma-fadein">
            {!bookingDone ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Wallet size={20} color="white" strokeWidth={1.8}/>
                  </div>
                  <h1 style={{ fontSize:22, fontWeight:800, color:"#053366", margin:0 }}>Confirmer la réservation</h1>
                </div>

                {/* Récapitulatif */}
                <div style={{ background:"white", border:"1px solid #EEF2FF", borderRadius:16, padding:"20px 22px", marginBottom:16, boxShadow:"0 2px 8px rgba(5,51,102,.05)" }}>
                  <p style={{ fontSize:15, fontWeight:800, color:"#053366", margin:"0 0 16px" }}>Récapitulatif</p>
                  {itinerary?.days.map((d, di) => (
                    <div key={di} style={{ padding:"12px 0", borderBottom:"1px solid #EEF2FF" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <p style={{ fontSize:14, fontWeight:700, color:"#053366", margin:0 }}>
                          {d.emoji || cityEmoji(d.city)} Jour {d.day} — {d.city}
                        </p>
                        <span className="ma-badge-price">{d.activities.reduce((s,a)=>s+(Number(a.price)||0),0)} TND</span>
                      </div>
                      <p style={{ fontSize:12, color:"#9CA3AF", margin:"4px 0 0" }}>{d.activities.map(a=>a.name).join(" · ")}</p>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, paddingTop:16, borderTop:"2px solid #EEF2FF" }}>
                    <p style={{ fontSize:15, fontWeight:700, color:"#053366", margin:0 }}>Total</p>
                    <p style={{ fontSize:22, fontWeight:900, color:"#02AFCF", margin:0 }}>{totalPrice} TND</p>
                  </div>
                </div>

                {/* Infos voyageur */}
                <div style={{ background:"white", border:"1px solid #EEF2FF", borderRadius:16, padding:"20px 22px", marginBottom:24, boxShadow:"0 2px 8px rgba(5,51,102,.05)" }}>
                  <p style={{ fontSize:15, fontWeight:800, color:"#053366", margin:"0 0 16px" }}>Vos informations</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[["Prénom","text"],["Nom","text"],["Email","email"],["Téléphone","tel"]].map(([f, t]) => (
                      <div key={f}>
                        <label style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:5 }}>{f}</label>
                        <input type={t} placeholder={f} className="ma-input"/>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ma-nav-footer">
                  <button className="ma-btn-secondary" onClick={() => setStep("itineraire")}>
                    <ChevronLeft size={16}/> Modifier
                  </button>
                  <button className="ma-btn-primary" onClick={() => setBookingDone(true)} style={{ padding:"13px 32px" }}>
                    <CheckCircle size={16}/> Confirmer & Réserver
                  </button>
                </div>
              </>
            ) : (
              /* Confirmation */
              <div style={{ textAlign:"center", paddingTop:48 }}>
                <div style={{ width:80, height:80, borderRadius:24, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 8px 28px rgba(2,175,207,.4)" }}>
                  <CheckCircle size={38} color="white" strokeWidth={1.5}/>
                </div>
                <h1 style={{ fontSize:26, fontWeight:800, color:"#053366", marginBottom:10 }}>Voyage confirmé ! 🎉</h1>
                <p style={{ fontSize:15, color:"#6B7280", marginBottom:28, lineHeight:1.6 }}>
                  Votre itinéraire de {itinerary?.days.length} jours est réservé.<br/>
                  Une confirmation a été envoyée par email.
                </p>
                <div style={{ background:"rgba(2,175,207,.07)", border:"1px solid rgba(2,175,207,.3)", borderRadius:14, padding:"18px 28px", marginBottom:28, display:"inline-block" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#02AFCF", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 6px" }}>N° de réservation</p>
                  <p style={{ fontSize:24, fontWeight:900, color:"#053366", margin:0, letterSpacing:"2px" }}>{bookingCode}</p>
                </div>
                <div>
                  <button className="ma-btn-secondary" onClick={resetAll}>
                    <RotateCcw size={15}/> Planifier un nouveau voyage
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}