"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

// ── Types ──────────────────────────────────────────────────────────────────
type Excursion = {
  id: string;
  title: string;
  city: string;
  price_per_person: number;
  duration_hours: number;
  rating: number;
  reviews_count: number;
  categories: string[];
  photos: string[];
};

type Categorie = {
  id: string;
  nom: string;
  emoji: string;
  couleur: string;
};

type DragPayload =
  | { kind: "excursion"; excursion: Excursion }
  | { kind: "activity"; activityId: string; fromDay: number; fromTime: TimeKey };

type ActivityItem = {
  id: string;
  excursion: Excursion;
  note: string;
  time: TimeKey;
};

type DayPlan = { city: string; activities: ActivityItem[] };
type TimeKey = "matin" | "aprem" | "soir";
type Step = "config" | "builder" | "result";

// ── Constantes villes ──────────────────────────────────────────────────────
const ALL_CITIES = [
  { name: "Tunis",     emoji: "🏛️", region: "Nord",   description: "Capitale vibrante" },
  { name: "Sousse",    emoji: "🏖️", region: "Sahel",  description: "Perle du Sahel" },
  { name: "Hammamet",  emoji: "🌺", region: "Sahel",  description: "Station balnéaire" },
  { name: "Djerba",    emoji: "🏝️", region: "Sud",    description: "Île aux rêves" },
  { name: "Tozeur",    emoji: "🌴", region: "Sud",    description: "Porte du désert" },
  { name: "Douz",      emoji: "🐪", region: "Sud",    description: "Sahara infini" },
  { name: "Kairouan",  emoji: "🕌", region: "Centre", description: "Ville sainte" },
  { name: "Sfax",      emoji: "🫒", region: "Centre", description: "Capitale du Sud" },
  { name: "Tataouine", emoji: "⭐", region: "Sud",    description: "Terre de Star Wars" },
  { name: "Tabarka",   emoji: "🌊", region: "Nord",   description: "Corail et nature" },
  { name: "Nabeul",    emoji: "🏺", region: "Nord",   description: "Poterie et artisanat" },
  { name: "Gafsa",     emoji: "⛏️", region: "Sud",    description: "Oasis millénaire" },
];
const CITY_EMOJI: Record<string, string> = Object.fromEntries(ALL_CITIES.map(c => [c.name, c.emoji]));

// Catégories fallback si la table Supabase est vide
const FALLBACK_CATEGORIES: Categorie[] = [
  { id: "1", nom: "Culture",      emoji: "🏛️", couleur: "#B4533A" },
  { id: "2", nom: "Archéologie",  emoji: "🏺", couleur: "#8B5CF6" },
  { id: "3", nom: "Nature",       emoji: "🌿", couleur: "#059669" },
  { id: "4", nom: "Gastronomie",  emoji: "🍽️", couleur: "#D97706" },
  { id: "5", nom: "Aventure",     emoji: "⚡", couleur: "#DC2626" },
  { id: "6", nom: "Relaxation",   emoji: "🧘", couleur: "#2563EB" },
];

// Excursions fallback si la base est vide
const MOCK_EXCURSIONS: Excursion[] = [
  { id:"1", title:"Médina de Tunis",     city:"Tunis",  price_per_person:45, duration_hours:3,   rating:4.9, reviews_count:128, categories:["Culture","Archéologie"], photos:["https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80"] },
  { id:"2", title:"Sidi Bou Saïd",       city:"Tunis",  price_per_person:35, duration_hours:2.5, rating:4.8, reviews_count:94,  categories:["Culture"],               photos:["https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80"] },
  { id:"3", title:"Sahara à Douz",       city:"Douz",   price_per_person:95, duration_hours:8,   rating:5.0, reviews_count:67,  categories:["Aventure","Nature"],      photos:["https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80"] },
  { id:"4", title:"Île de Djerba",       city:"Djerba", price_per_person:55, duration_hours:4,   rating:4.7, reviews_count:203, categories:["Relaxation","Nature"],    photos:["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80"] },
  { id:"5", title:"Oasis de Tozeur",     city:"Tozeur", price_per_person:75, duration_hours:5,   rating:4.9, reviews_count:45,  categories:["Nature","Aventure"],      photos:["https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80"] },
  { id:"6", title:"Amphithéâtre El Jem", city:"Sfax",   price_per_person:40, duration_hours:4,   rating:4.8, reviews_count:112, categories:["Archéologie","Culture"],  photos:["https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80"] },
];

const TIME_SLOTS: { key: TimeKey; label: string; emoji: string; hint: string }[] = [
  { key: "matin",  label: "Matin",       emoji: "🌅", hint: "8h — 12h"  },
  { key: "aprem",  label: "Après-midi",  emoji: "☀️", hint: "13h — 17h" },
  { key: "soir",   label: "Soir",        emoji: "🌙", hint: "18h — 22h" },
];

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
function ItineraireInner() {
  const router   = useRouter();
  const supabase = createClient();

  // ── Config ────────────────────────────────────────────────────────────
  const [step,            setStep]          = useState<Step>("config");
  const [days,            setDays]          = useState(3);
  const [selectedCities,  setSelectedCities]= useState<string[]>([]);
  const [selectedCats,    setSelectedCats]  = useState<string[]>([]);

  // ── Données Supabase ──────────────────────────────────────────────────
  const [categories,   setCategories]  = useState<Categorie[]>([]);
  const [allExc,       setAllExc]      = useState<Excursion[]>([]);
  const [loadingCats,  setLoadingCats] = useState(true);
  const [loadingExc,   setLoadingExc]  = useState(true);

  // ── Palette filtres ───────────────────────────────────────────────────
  const [searchExc, setSearchExc] = useState("");
  const [palCat,    setPalCat]    = useState("Toutes");
  const [palCity,   setPalCity]   = useState("Toutes");

  // ── Builder ───────────────────────────────────────────────────────────
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [editNote,  setEditNote]  = useState<string | null>(null);
  const [noteText,  setNoteText]  = useState("");
  const [dragOver,  setDragOver]  = useState<{ day: number; time: TimeKey } | null>(null);
  const dragRef = useRef<DragPayload | null>(null);

  // ── Chargement des catégories depuis Supabase ─────────────────────────
  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("nom")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCategories(data as Categorie[]);
        } else {
          // Fallback si la table n'existe pas encore
          setCategories(FALLBACK_CATEGORIES);
        }
        setLoadingCats(false);
      });
  }, []);

  // ── Chargement des excursions depuis Supabase ─────────────────────────
  useEffect(() => {
    supabase
      .from("excursions")
      .select("*")
      // On récupère toutes les excursions actives OU sans statut défini
      .or("is_active.eq.true,is_active.is.null")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setAllExc(data as Excursion[]);
        } else {
          setAllExc(MOCK_EXCURSIONS);
        }
        setLoadingExc(false);
      });
  }, []);

  // ── Helper : couleur d'une catégorie ─────────────────────────────────
  const getCatColor = (catName: string): string => {
    return categories.find(c => c.nom === catName)?.couleur || "#B4533A";
  };
  const getCatEmoji = (catName: string): string => {
    return categories.find(c => c.nom === catName)?.emoji || "🏔️";
  };

  // ── Filtre palette ────────────────────────────────────────────────────
  const palette = allExc.filter(e => {
    const q     = searchExc.toLowerCase();
    const mQ    = e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
    const mCat  = palCat  === "Toutes" || e.categories?.includes(palCat);
    const mCity = palCity === "Toutes" || e.city === palCity;
    const mSel  = selectedCities.length === 0 || selectedCities.includes(e.city);
    return mQ && mCat && mCity && mSel;
  });

  // ── Handlers builder ──────────────────────────────────────────────────
  const startBuilder = () => {
    const plan: DayPlan[] = Array.from({ length: days }, (_, i) => ({
      city: selectedCities[i % selectedCities.length] || "Tunis",
      activities: [],
    }));
    setItinerary(plan);
    setActiveDay(0);
    setPalCity(selectedCities.length === 1 ? selectedCities[0] : "Toutes");
    setStep("builder");
  };

  const drop = (dayIdx: number, time: TimeKey) => {
    const p = dragRef.current;
    if (!p) return;
    if (p.kind === "excursion") {
      setItinerary(prev => {
        const u = [...prev];
        u[dayIdx] = {
          ...u[dayIdx],
          activities: [...u[dayIdx].activities, {
            id: `${Date.now()}-${Math.random()}`,
            excursion: p.excursion,
            note: "",
            time,
          }],
        };
        return u;
      });
    } else {
      const { activityId, fromDay, fromTime } = p;
      if (fromDay === dayIdx && fromTime === time) return;
      setItinerary(prev => {
        const u = prev.map(d => ({ ...d, activities: [...d.activities] }));
        const idx = u[fromDay].activities.findIndex(a => a.id === activityId);
        if (idx === -1) return prev;
        const [act] = u[fromDay].activities.splice(idx, 1);
        u[dayIdx].activities.push({ ...act, time });
        return u;
      });
    }
    dragRef.current = null;
    setDragOver(null);
  };

  const removeActivity = (dayIdx: number, id: string) =>
    setItinerary(prev => {
      const u = [...prev];
      u[dayIdx] = { ...u[dayIdx], activities: u[dayIdx].activities.filter(a => a.id !== id) };
      return u;
    });

  const saveNote = (dayIdx: number, id: string) => {
    setItinerary(prev => {
      const u = [...prev];
      u[dayIdx] = {
        ...u[dayIdx],
        activities: u[dayIdx].activities.map(a => a.id === id ? { ...a, note: noteText } : a),
      };
      return u;
    });
    setEditNote(null);
    setNoteText("");
  };

  const totalAct    = itinerary.reduce((s, d) => s + d.activities.length, 0);
  const totalBudget = itinerary.reduce((s, d) => s + d.activities.reduce((ss, a) => ss + a.excursion.price_per_person, 0), 0);

  // ════════════════════════════════════════════════════════════════════════
  // STEP 1 — CONFIGURATION
  // ════════════════════════════════════════════════════════════════════════
  if (step === "config") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #FDF8F2 0%, #FAF1E4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        .city-chip { transition: all 0.2s ease; }
        .city-chip:hover { transform: translateY(-3px); box-shadow: 0 8px 20px -8px rgba(180,83,58,0.3) !important; }
        .cat-chip { transition: all 0.2s ease; }
        .cat-chip:hover { transform: translateY(-2px); }
        .day-btn { transition: all 0.2s ease; }
        .day-btn:hover { border-color: #B4533A !important; color: #B4533A !important; }
        .cta-btn { transition: all 0.25s ease; }
        .cta-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 32px -12px rgba(180,83,58,0.7) !important; }
        input[type=range] { accent-color: #B4533A; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 900 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <button onClick={() => router.push("/")}
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(180,83,58,0.2)", color: "#B4533A", cursor: "pointer", fontSize: 14, fontFamily: "inherit", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: 40, boxShadow: "0 4px 16px rgba(180,83,58,0.1)", transition: "all 0.2s" }}>
            ← Retour à l&apos;accueil
          </button>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(180,83,58,0.08)", border: "1px solid rgba(180,83,58,0.2)", borderRadius: 30, padding: "6px 18px", marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>✏️</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#B4533A", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mode Libre</span>
          </div>

          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(38px, 6vw, 62px)", fontWeight: 400, color: "#2D2A24", lineHeight: 1.05, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Votre voyage<br />sur mesure
          </h1>
          <p style={{ fontSize: 17, color: "#6B635C", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Choisissez la trame, vous composerez la mélodie.
          </p>
        </div>

        {/* Carte principale */}
        <div style={{ background: "white", borderRadius: 40, overflow: "hidden", boxShadow: "0 32px 64px -20px rgba(45,42,36,0.22)", border: "1px solid rgba(180,83,58,0.12)" }}>

          {/* ── Section 1 : Durée ── */}
          <div style={{ padding: "40px 48px", borderBottom: "1px solid #EAE2D9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 600, color: "#2D2A24", marginBottom: 5, letterSpacing: "-0.01em" }}>La durée de votre échappée</h2>
                <p style={{ fontSize: 14, color: "#8C8279" }}>De quelques jours à une exploration complète</p>
              </div>
              <div style={{ textAlign: "center", background: "linear-gradient(145deg,#FDF8F2,#FAF1E4)", border: "1.5px solid rgba(180,83,58,0.25)", borderRadius: 24, padding: "14px 32px" }}>
                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 44, fontWeight: 400, color: "#B4533A", lineHeight: 1, display: "block" }}>{days}</span>
                <span style={{ fontSize: 12, color: "#8C8279", letterSpacing: "0.05em", textTransform: "uppercase" }}>{days > 1 ? "jours" : "jour"}</span>
              </div>
            </div>

            <input type="range" min={1} max={14} value={days} onChange={e => setDays(Number(e.target.value))}
              style={{ width: "100%", height: 6, cursor: "pointer" }} />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 4 }}>
              {[1, 2, 3, 5, 7, 10, 14].map(n => (
                <button key={n} className="day-btn" onClick={() => setDays(n)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 30, border: `1.5px solid ${days === n ? "#B4533A" : "#EAE2D9"}`, background: days === n ? "#B4533A" : "transparent", color: days === n ? "white" : "#8C8279", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  {n}j
                </button>
              ))}
            </div>
          </div>

          {/* ── Section 2 : Villes ── */}
          <div style={{ padding: "40px 48px", borderBottom: "1px solid #EAE2D9" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 19, fontWeight: 600, color: "#2D2A24", marginBottom: 5, letterSpacing: "-0.01em" }}>Les villes qui vous font signe</h2>
              <p style={{ fontSize: 14, color: "#8C8279" }}>
                Une ou plusieurs, au gré de vos envies
                {selectedCities.length > 0 && <span style={{ color: "#B4533A", marginLeft: 8, fontWeight: 500 }}>· {selectedCities.length} sélectionnée{selectedCities.length > 1 ? "s" : ""}</span>}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
              {ALL_CITIES.map(c => {
                const sel = selectedCities.includes(c.name);
                return (
                  <button key={c.name} className="city-chip" onClick={() => setSelectedCities(toggle(selectedCities, c.name))}
                    style={{ padding: "16px 8px", borderRadius: 20, border: `2px solid ${sel ? "#B4533A" : "#EAE2D9"}`, background: sel ? "#B4533A" : "white", cursor: "pointer", fontFamily: "inherit", textAlign: "center", boxShadow: sel ? "0 10px 20px -8px rgba(180,83,58,0.45)" : "0 2px 8px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>{c.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? "white" : "#2D2A24", marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: sel ? "rgba(255,255,255,0.65)" : "#B4A99F" }}>{c.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section 3 : Catégories ── */}
          <div style={{ padding: "40px 48px", borderBottom: "1px solid #EAE2D9" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 19, fontWeight: 600, color: "#2D2A24", marginBottom: 5, letterSpacing: "-0.01em" }}>Vos centres d&apos;intérêt</h2>
              <p style={{ fontSize: 14, color: "#8C8279" }}>Pour affiner les excursions suggérées <span style={{ color: "#B4A99F" }}>(optionnel)</span></p>
            </div>

            {loadingCats ? (
              <div style={{ display: "flex", gap: 10 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ height: 46, width: 120, borderRadius: 40, background: "#F5EDE6", animation: "pulse 1.5s infinite" }} />)}
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {categories.map(cat => {
                  const sel = selectedCats.includes(cat.nom);
                  return (
                    <button key={cat.id} className="cat-chip" onClick={() => setSelectedCats(toggle(selectedCats, cat.nom))}
                      style={{ padding: "12px 24px", borderRadius: 40, border: `1.5px solid ${sel ? cat.couleur : "#EAE2D9"}`, background: sel ? `${cat.couleur}12` : "white", color: sel ? cat.couleur : "#6B635C", fontSize: 14, fontWeight: sel ? 600 : 400, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: sel ? `0 4px 16px -4px ${cat.couleur}40` : "none" }}>
                      <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                      {cat.nom}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CTA ── */}
          <div style={{ padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(145deg,#FDF8F2,#FAF1E4)" }}>
            <div>
              {selectedCities.length > 0 ? (
                <>
                  <div style={{ fontSize: 12, color: "#8C8279", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Votre sélection</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2D2A24" }}>
                    {days} jour{days > 1 ? "s" : ""} · {selectedCities.slice(0, 2).map(c => `${CITY_EMOJI[c] || ""} ${c}`).join(", ")}
                    {selectedCities.length > 2 && <span style={{ color: "#B4533A", marginLeft: 4 }}>+{selectedCities.length - 2} autre{selectedCities.length - 2 > 1 ? "s" : ""}</span>}
                    {selectedCats.length > 0 && <span style={{ color: "#8C8279" }}> · {selectedCats.slice(0, 2).join(", ")}</span>}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 14, color: "#B4A99F", fontStyle: "italic" }}>Sélectionnez au moins une ville pour commencer</p>
              )}
            </div>

            <button className="cta-btn" onClick={startBuilder} disabled={selectedCities.length === 0}
              style={{ background: selectedCities.length === 0 ? "#EAE2D9" : "#B4533A", color: selectedCities.length === 0 ? "#B4A99F" : "white", border: "none", padding: "16px 40px", borderRadius: 40, fontSize: 15, fontWeight: 500, cursor: selectedCities.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: selectedCities.length > 0 ? "0 12px 28px -10px rgba(180,83,58,0.6)" : "none" }}>
              Composer mon itinéraire →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // STEP 2 — BUILDER
  // ════════════════════════════════════════════════════════════════════════
  if (step === "builder") return (
    <div style={{ minHeight: "100vh", background: "#FDF8F2", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .exc-card { transition: all 0.25s ease; cursor: grab; }
        .exc-card:hover { transform: translateY(-4px); box-shadow: 0 20px 32px -10px rgba(180,83,58,0.22) !important; }
        .exc-card:active { cursor: grabbing; transform: scale(0.98); }
        .drop-zone { transition: all 0.2s ease; }
        .drop-zone.over { border-color: #B4533A !important; background: rgba(180,83,58,0.04) !important; }
        .act-item { transition: all 0.2s ease; cursor: grab; }
        .act-item:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -8px rgba(0,0,0,0.15) !important; }
        .act-item:active { cursor: grabbing; }
        .day-tab { transition: all 0.2s ease; }
        .day-tab:hover { border-color: #B4533A !important; }
        .icon-btn { transition: all 0.2s ease; border-radius: 8px; }
        .icon-btn:hover { background: rgba(180,83,58,0.1) !important; }
        .nav-btn { transition: all 0.2s ease; }
        .nav-btn:hover:not(:disabled) { background: #9B3F2C !important; transform: translateY(-1px); }
        .topbar-btn { transition: all 0.2s ease; border-radius: 30px; }
        .topbar-btn:hover { background: rgba(180,83,58,0.08) !important; color: #B4533A !important; }
        .summary-btn { transition: all 0.2s ease; }
        .summary-btn:hover { background: #9B3F2C !important; transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(180,83,58,0.5) !important; }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .loading-pulse { animation: shimmer 1.5s ease infinite; }
      `}</style>

      {/* ── Barre supérieure ─────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(253,248,242,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(180,83,58,0.12)", padding: "0 28px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button className="topbar-btn" onClick={() => setStep("config")}
            style={{ background: "none", border: "none", color: "#6B635C", cursor: "pointer", fontFamily: "inherit", fontSize: 14, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px" }}>
            ← Configuration
          </button>
          <div style={{ width: 1, height: 28, background: "rgba(180,83,58,0.2)" }} />
          <span style={{ fontSize: 14, color: "#B4533A", background: "rgba(180,83,58,0.08)", padding: "6px 16px", borderRadius: 30, fontWeight: 500 }}>
            {days} jours · {selectedCities.join(" · ")}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {totalAct > 0 && (
            <>
              <span style={{ fontSize: 13, color: "#2D2A24", background: "white", padding: "6px 16px", borderRadius: 30, border: "1px solid rgba(180,83,58,0.2)" }}>
                {totalAct} excursion{totalAct > 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#059669", background: "rgba(5,150,105,0.1)", padding: "6px 16px", borderRadius: 30 }}>
                {totalBudget} TND
              </span>
            </>
          )}
          <button className="summary-btn" onClick={() => setStep("result")}
            style={{ padding: "10px 28px", background: "#B4533A", color: "white", border: "none", borderRadius: 30, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 20px -8px rgba(180,83,58,0.55)" }}>
            Voir le résumé →
          </button>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 68px)" }}>

        {/* ── Palette gauche ───────────────────────────────────────────── */}
        <div style={{ width: 310, flexShrink: 0, borderRight: "1px solid rgba(180,83,58,0.12)", background: "white", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          <div style={{ padding: "20px 18px 12px", flexShrink: 0 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400, color: "#2D2A24", marginBottom: 14 }}>
              Excursions disponibles
            </h2>

            <input type="text" placeholder="🔍  Rechercher..." value={searchExc} onChange={e => setSearchExc(e.target.value)}
              style={{ width: "100%", padding: "10px 16px", border: "1.5px solid #EAE2D9", borderRadius: 40, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#2D2A24", marginBottom: 14, background: "#FDF8F2", transition: "border-color 0.2s" }}
              onFocus={e => e.currentTarget.style.borderColor = "#B4533A"}
              onBlur={e => e.currentTarget.style.borderColor = "#EAE2D9"} />

            {/* Filtre villes */}
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#8C8279", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Villes</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Toutes", ...selectedCities].map(c => (
                  <button key={c} onClick={() => setPalCity(c)}
                    style={{ padding: "5px 12px", borderRadius: 30, border: `1px solid ${palCity === c ? "#B4533A" : "#EAE2D9"}`, background: palCity === c ? "#B4533A" : "white", color: palCity === c ? "white" : "#6B635C", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {c === "Toutes" ? "Toutes" : `${CITY_EMOJI[c] || ""} ${c}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre catégories */}
            <div style={{ paddingBottom: 12, borderBottom: "1px solid #F5EDE6" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#8C8279", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Catégories</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Toutes", ...categories.map(c => c.nom)].map(cat => (
                  <button key={cat} onClick={() => setPalCat(cat)}
                    style={{ padding: "5px 12px", borderRadius: 30, border: `1px solid ${palCat === cat ? (getCatColor(cat) || "#B4533A") : "#EAE2D9"}`, background: palCat === cat ? `${getCatColor(cat) || "#B4533A"}12` : "white", color: palCat === cat ? (getCatColor(cat) || "#B4533A") : "#6B635C", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    {cat === "Toutes" ? "Toutes" : `${getCatEmoji(cat)} ${cat}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Liste excursions */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 20px" }}>
            {loadingExc ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="loading-pulse" style={{ height: 160, borderRadius: 20, background: "#F5EDE6", marginBottom: 12 }} />
              ))
            ) : palette.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 14, color: "#8C8279" }}>Aucune excursion trouvée</p>
              </div>
            ) : palette.map(exc => {
              const col = getCatColor(exc.categories?.[0]);
              return (
                <div key={exc.id} className="exc-card" draggable
                  onDragStart={() => { dragRef.current = { kind: "excursion", excursion: exc }; }}
                  style={{ marginBottom: 12, borderRadius: 20, background: "white", border: `1px solid ${col}20`, userSelect: "none", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                  {exc.photos?.[0] && (
                    <div style={{ height: 100, overflow: "hidden", position: "relative" }}>
                      <img src={exc.photos[0]} alt={exc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.45))" }} />
                      <span style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, color: "white", fontWeight: 600, background: `${col}cc`, padding: "3px 10px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                        {getCatEmoji(exc.categories?.[0])} {exc.categories?.[0]}
                      </span>
                      <span style={{ position: "absolute", top: 8, right: 10, fontSize: 10, color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.35)", padding: "2px 8px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                        ✋ glisser
                      </span>
                    </div>
                  )}
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2D2A24", marginBottom: 5 }}>{exc.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#8C8279" }}>📍 {exc.city} · ⏱️ {exc.duration_hours}h</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: col }}>{exc.price_per_person} TND</span>
                    </div>
                    {exc.rating > 0 && <div style={{ fontSize: 11, color: "#B4A99F", marginTop: 4 }}>⭐ {exc.rating} ({exc.reviews_count} avis)</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #F5EDE6", background: "#FDF8F2", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#8C8279" }}>Activités planifiées</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#B4533A" }}>{totalAct}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#8C8279" }}>Budget estimé</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{totalBudget} TND</span>
            </div>
            <div style={{ height: 5, background: "#EAE2D9", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#B4533A,#D4785C)", borderRadius: 10, width: `${Math.min(100, (totalAct / (days * 2)) * 100)}%`, transition: "width 0.4s ease" }} />
            </div>
          </div>
        </div>

        {/* ── Calendrier droit ─────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* Onglets jours */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {itinerary.map((day, i) => {
              const isActive = activeDay === i;
              const cnt = day.activities.length;
              return (
                <button key={i} className="day-tab" onClick={() => setActiveDay(i)}
                  style={{ padding: "10px 22px", borderRadius: 40, border: `2px solid ${isActive ? "#B4533A" : "#EAE2D9"}`, background: isActive ? "#B4533A" : "white", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: isActive ? 500 : 400, color: isActive ? "white" : "#6B635C", display: "flex", alignItems: "center", gap: 8, boxShadow: isActive ? "0 8px 20px -8px rgba(180,83,58,0.55)" : "none" }}>
                  <span style={{ fontSize: 16 }}>{CITY_EMOJI[day.city] || "📅"}</span>
                  Jour {i + 1}
                  {cnt > 0 && (
                    <span style={{ fontSize: 11, background: isActive ? "rgba(255,255,255,0.25)" : "#B4533A", color: "white", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>{cnt}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Carte du jour actif */}
          {itinerary[activeDay] && (
            <div style={{ background: "white", borderRadius: 32, border: "1px solid rgba(180,83,58,0.12)", overflow: "hidden", boxShadow: "0 20px 48px -20px rgba(45,42,36,0.18)" }}>

              {/* Header jour */}
              <div style={{ padding: "20px 28px", background: "linear-gradient(145deg,#FDF8F2,#FAF1E4)", borderBottom: "1px solid rgba(180,83,58,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 18, background: "#B4533A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 8px 16px -8px rgba(180,83,58,0.5)" }}>
                    {CITY_EMOJI[itinerary[activeDay].city] || "📅"}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 600, color: "#2D2A24", marginBottom: 3 }}>Jour {activeDay + 1} — {itinerary[activeDay].city}</h2>
                    <p style={{ fontSize: 13, color: "#8C8279" }}>
                      {itinerary[activeDay].activities.length} activité{itinerary[activeDay].activities.length !== 1 ? "s" : ""}
                      {itinerary[activeDay].activities.length > 0 && ` · ${itinerary[activeDay].activities.reduce((s, a) => s + a.excursion.price_per_person, 0)} TND · ${itinerary[activeDay].activities.reduce((s, a) => s + a.excursion.duration_hours, 0)}h`}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ fontSize: 11, color: "#8C8279", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ville :</label>
                  <select value={itinerary[activeDay].city}
                    onChange={e => setItinerary(prev => { const u = [...prev]; u[activeDay] = { ...u[activeDay], city: e.target.value }; return u; })}
                    style={{ border: "1.5px solid #EAE2D9", borderRadius: 30, padding: "8px 18px", fontSize: 13, fontFamily: "inherit", color: "#2D2A24", background: "white", cursor: "pointer", outline: "none" }}>
                    {ALL_CITIES.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Créneaux horaires */}
              <div style={{ padding: "24px 28px" }}>
                {TIME_SLOTS.map(slot => {
                  const acts = itinerary[activeDay].activities.filter(a => a.time === slot.key);
                  const isTarget = dragOver?.day === activeDay && dragOver?.time === slot.key;

                  return (
                    <div key={slot.key} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{slot.emoji}</span>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "#2D2A24" }}>{slot.label}</span>
                        <span style={{ fontSize: 12, color: "#8C8279", background: "#FAF1E4", padding: "2px 10px", borderRadius: 20 }}>{slot.hint}</span>
                        {acts.length > 0 && (
                          <span style={{ marginLeft: "auto", fontSize: 12, color: "#059669", background: "rgba(5,150,105,0.1)", padding: "2px 12px", borderRadius: 20 }}>
                            {acts.reduce((s, a) => s + a.excursion.price_per_person, 0)} TND · {acts.reduce((s, a) => s + a.excursion.duration_hours, 0)}h
                          </span>
                        )}
                      </div>

                      <div className={`drop-zone${isTarget ? " over" : ""}`}
                        onDragOver={e => { e.preventDefault(); setDragOver({ day: activeDay, time: slot.key }); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={() => drop(activeDay, slot.key)}
                        style={{ minHeight: 90, borderRadius: 20, border: `2px dashed ${isTarget ? "#B4533A" : "#EAE2D9"}`, background: isTarget ? "rgba(180,83,58,0.04)" : "#FDF8F2", padding: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start" }}>
                        {acts.length === 0 ? (
                          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 22, paddingBottom: 22, fontSize: 13, color: isTarget ? "#B4533A" : "#C4B8B0", fontStyle: "italic" }}>
                            {isTarget ? "✓ Déposez votre excursion ici" : `Glissez une excursion dans ce créneau ${slot.emoji}`}
                          </div>
                        ) : acts.map(act => {
                          const col = getCatColor(act.excursion.categories?.[0]);
                          return (
                            <div key={act.id} className="act-item" draggable
                              onDragStart={() => { dragRef.current = { kind: "activity", activityId: act.id, fromDay: activeDay, fromTime: act.time }; }}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 16, background: "white", border: `1.5px solid ${col}25`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", flex: "1 1 auto" }}>
                              {act.excursion.photos?.[0] && (
                                <img src={act.excursion.photos[0]} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#2D2A24", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{act.excursion.title}</div>
                                <div style={{ fontSize: 11, color: "#8C8279", display: "flex", gap: 10 }}>
                                  <span>📍 {act.excursion.city}</span>
                                  <span>⏱️ {act.excursion.duration_hours}h</span>
                                  <span style={{ color: col, fontWeight: 600 }}>{act.excursion.price_per_person} TND</span>
                                </div>
                                {act.note && <div style={{ fontSize: 11, color: "#8C8279", marginTop: 3, fontStyle: "italic" }}>📝 {act.note}</div>}
                              </div>
                              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                                <button className="icon-btn" onClick={() => { setEditNote(act.id); setNoteText(act.note); }}
                                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#B4A99F", padding: "4px 6px" }} title="Ajouter une note">📝</button>
                                <button className="icon-btn" onClick={() => removeActivity(activeDay, act.id)}
                                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#B4A99F", padding: "4px 6px" }}
                                  onMouseEnter={e => e.currentTarget.style.color = "#DC2626"}
                                  onMouseLeave={e => e.currentTarget.style.color = "#B4A99F"}
                                  title="Retirer">✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer jour */}
              <div style={{ padding: "14px 28px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(180,83,58,0.08)" }}>
                <p style={{ fontSize: 12, color: "#B4A99F", fontStyle: "italic" }}>💡 Déplacez les excursions entre créneaux par glisser-déposer</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="nav-btn" onClick={() => setActiveDay(p => Math.max(0, p - 1))} disabled={activeDay === 0}
                    style={{ padding: "8px 18px", border: `1.5px solid ${activeDay === 0 ? "#EAE2D9" : "#B4533A"}`, borderRadius: 30, background: activeDay === 0 ? "transparent" : "#B4533A", cursor: activeDay === 0 ? "not-allowed" : "pointer", fontSize: 12, color: activeDay === 0 ? "#C4B8B0" : "white", fontFamily: "inherit" }}>
                    ← Précédent
                  </button>
                  <button className="nav-btn" onClick={() => setActiveDay(p => Math.min(days - 1, p + 1))} disabled={activeDay === days - 1}
                    style={{ padding: "8px 18px", border: `1.5px solid ${activeDay === days - 1 ? "#EAE2D9" : "#B4533A"}`, borderRadius: 30, background: activeDay === days - 1 ? "transparent" : "#B4533A", cursor: activeDay === days - 1 ? "not-allowed" : "pointer", fontSize: 12, color: activeDay === days - 1 ? "#C4B8B0" : "white", fontFamily: "inherit" }}>
                    Suivant →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modale note ── */}
      {editNote && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(45,42,36,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setEditNote(null); }}>
          <div style={{ background: "white", borderRadius: 32, padding: 32, width: 420, boxShadow: "0 40px 80px -20px rgba(45,42,36,0.45)" }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: "#2D2A24", marginBottom: 8 }}>Une note personnelle ?</h3>
            <p style={{ fontSize: 13, color: "#8C8279", marginBottom: 18 }}>Conseil, rappel, info utile pour cette excursion...</p>
            <textarea autoFocus value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Ex : Réservation recommandée, à faire tôt le matin..."
              style={{ width: "100%", height: 110, padding: "14px 18px", border: "1.5px solid #EAE2D9", borderRadius: 20, fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", color: "#2D2A24", background: "#FDF8F2" }}
              onFocus={e => e.currentTarget.style.borderColor = "#B4533A"}
              onBlur={e => e.currentTarget.style.borderColor = "#EAE2D9"} />
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => setEditNote(null)}
                style={{ flex: 1, padding: 14, border: "1.5px solid #EAE2D9", borderRadius: 40, background: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", color: "#6B635C", transition: "all 0.2s" }}>
                Annuler
              </button>
              <button onClick={() => saveNote(activeDay, editNote!)}
                style={{ flex: 1, padding: 14, border: "none", borderRadius: 40, background: "#B4533A", cursor: "pointer", fontSize: 14, fontFamily: "inherit", color: "white", fontWeight: 500, boxShadow: "0 8px 20px -8px rgba(180,83,58,0.55)", transition: "all 0.2s" }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // STEP 3 — RÉSUMÉ
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#FDF8F2", padding: "48px 24px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <button onClick={() => setStep("builder")}
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(180,83,58,0.2)", color: "#B4533A", cursor: "pointer", fontSize: 14, fontFamily: "inherit", marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: 40, transition: "all 0.2s" }}>
          ← Retour au planning
        </button>

        <div style={{ background: "white", borderRadius: 40, border: "1px solid rgba(180,83,58,0.12)", overflow: "hidden", boxShadow: "0 32px 64px -20px rgba(45,42,36,0.25)" }}>

          {/* Header résumé */}
          <div style={{ padding: "36px 44px", background: "linear-gradient(145deg,#FDF8F2,#FAF1E4)", borderBottom: "1px solid rgba(180,83,58,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#B4533A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>✏️ Mode Libre — Votre carnet</div>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, color: "#2D2A24", lineHeight: 1.1, marginBottom: 10 }}>
                  {days} jours en Tunisie
                </h1>
                <p style={{ fontSize: 15, color: "#8C8279" }}>{selectedCities.join(" · ")}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#2D2A24", background: "white", padding: "8px 20px", borderRadius: 40, border: "1px solid rgba(180,83,58,0.2)" }}>
                  {totalAct} activité{totalAct > 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.1)", padding: "8px 24px", borderRadius: 40 }}>
                  {totalBudget} TND
                </span>
              </div>
            </div>
          </div>

          {/* Jours */}
          <div style={{ padding: "24px 36px" }}>
            {itinerary.map((day, i) => (
              <div key={i} style={{ marginBottom: 14, padding: "20px 22px", background: "#FDF8F2", borderRadius: 28, border: "1px solid rgba(180,83,58,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "#B4533A", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{CITY_EMOJI[day.city] || "📅"}</span>
                    Jour {i + 1} — {day.city}
                  </h3>
                  {day.activities.length > 0 && (
                    <span style={{ fontSize: 13, color: "#059669", background: "rgba(5,150,105,0.1)", padding: "4px 14px", borderRadius: 30 }}>
                      {day.activities.reduce((s, a) => s + a.excursion.price_per_person, 0)} TND · {day.activities.reduce((s, a) => s + a.excursion.duration_hours, 0)}h
                    </span>
                  )}
                </div>

                {day.activities.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {TIME_SLOTS.map(slot =>
                      day.activities.filter(a => a.time === slot.key).map(act => {
                        const col = getCatColor(act.excursion.categories?.[0]);
                        return (
                          <div key={act.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "white", borderRadius: 20, border: `1px solid ${col}18` }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{slot.emoji}</span>
                            {act.excursion.photos?.[0] && (
                              <img src={act.excursion.photos[0]} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#2D2A24", marginBottom: 2 }}>{act.excursion.title}</div>
                              <div style={{ fontSize: 12, color: "#8C8279", display: "flex", gap: 14 }}>
                                <span>📍 {act.excursion.city}</span>
                                <span>⏱️ {act.excursion.duration_hours}h</span>
                                <span>⭐ {act.excursion.rating}</span>
                              </div>
                              {act.note && <div style={{ fontSize: 12, color: "#8C8279", marginTop: 3, fontStyle: "italic" }}>📝 {act.note}</div>}
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 700, color: col, flexShrink: 0 }}>{act.excursion.price_per_person} TND</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "#C4B8B0", fontStyle: "italic" }}>Aucune activité planifiée pour ce jour</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding: "20px 36px 32px", display: "flex", gap: 14, borderTop: "1px solid rgba(180,83,58,0.1)" }}>
            <button onClick={() => setStep("builder")}
              style={{ flex: 1, padding: 14, border: "1.5px solid #B4533A", borderRadius: 40, background: "none", cursor: "pointer", fontSize: 15, fontFamily: "inherit", color: "#B4533A", fontWeight: 500, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(180,83,58,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              ✏️ Modifier
            </button>
            <button onClick={() => alert("Votre itinéraire a été sauvegardé !")}
              style={{ flex: 1, padding: 14, border: "none", borderRadius: 40, background: "#B4533A", cursor: "pointer", fontSize: 15, fontFamily: "inherit", color: "white", fontWeight: 500, boxShadow: "0 10px 24px -10px rgba(180,83,58,0.6)", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#9B3F2C"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "#B4533A"; }}>
              💾 Sauvegarder ce voyage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ItinerairePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 16, color: "#8C8279", background: "#FDF8F2" }}>
        Préparation de votre carnet de voyage...
      </div>
    }>
      <ItineraireInner />
    </Suspense>
  );
}