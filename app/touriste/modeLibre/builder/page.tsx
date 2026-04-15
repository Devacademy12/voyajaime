"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Star,
  Pencil, Trash2, FileText, Send, Search, CheckCircle2,
  PiggyBank, Layers, BookMarked, ChevronLeft, ChevronRight,
  Loader2, Sunrise, Sun, Moon, AlertCircle, RotateCw,
  Plus, CalendarDays, Edit3, X, Camera, Mountain, MapPinned,
  LocateFixed, Flag, Landmark, Compass, Building2, Globe,
  Trees, Waves, UtensilsCrossed, Tent, Bike, Ship, Car,
  Coffee, Wine, Camera as CameraIcon, Music, ShoppingBag,
  Sparkles, Heart, Shield, Award, Users, Clock as ClockIcon,
  DollarSign, Info, ClipboardList, Package, Ticket, Phone,
  Mail, MessageCircle, ThumbsUp, ThumbsDown, Check, AlertTriangle
} from "lucide-react";

import { ExcursionDetailModal } from "@/app/components/excursions/ExcursionDetailModal";
import { LoadingSpinner } from "@/app/components/excursions/LoadingSpinner";
import { ErrorDisplay } from "@/app/components/excursions/ErrorDisplay";

import "@/public/style/builder.css";

// Types
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
  departure_time?: string; 
};

type ExcursionDetail = {
  id: string;
  title: string;
  city: string;
  region: string | null;
  description: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  categories: string[];
  languages: string[];
  inclusions: string[];
  photos: string[];
  rating: number;
  reviews_count: number;
  meeting_point: string | null;
  difficulty: string | null;
  min_age: number | null;
  what_to_bring: string | null;
  not_included: string | null;
  important_info: string | null;
  cancel_policy: string | null;
  available_dates: any;
  depart_time: string | null;
};

type Categorie = { id: string; nom: string; emoji: string; couleur: string; };
type Ville = { id: string; nom: string; emoji: string; region: string; description: string; active: boolean; };
type TimeKey = "matin" | "aprem" | "soir";
type ActivityItem = { id: string; excursion: Excursion; note: string; time: TimeKey; customTime?: string; };
type DayPlan = { city: string; date?: string; activities: ActivityItem[]; };
type ViewStep = "builder" | "result";

// Map des émojis vers icônes Lucide pour les catégories
const getCategoryIcon = (categoryName?: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    "Nature": <Trees size={13} />,
    "Plage": <Waves size={13} />,
    "Culture": <Landmark size={13} />,
    "Histoire": <Compass size={13} />,
    "Gastronomie": <UtensilsCrossed size={13} />,
    "Aventure": <Tent size={13} />,
    "Sport": <Bike size={13} />,
    "Mer": <Ship size={13} />,
    "Désert": <Sun size={13} />,
    "Montagne": <Mountain size={13} />,
    "Ville": <Building2 size={13} />,
    "Shopping": <ShoppingBag size={13} />,
    "Bien-être": <Sparkles size={13} />,
    "Soirée": <Music size={13} />,
    "Excursion": <Compass size={13} />,
  };
  return iconMap[categoryName || ""] || <MapPinned size={13} />;
};

// Map des émojis de villes vers icônes Lucide
const getCityIcon = (cityName?: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    "Tunis": <Building2 size={13} />,
    "Sidi Bou Said": <Landmark size={13} />,
    "Carthage": <Flag size={13} />,
    "Hammamet": <Waves size={13} />,
    "Sousse": <Ship size={13} />,
    "Monastir": <Compass size={13} />,
    "Djerba": <Sun size={13} />,
    "Tozeur": <Mountain size={13} />,
    "Douz": <Sun size={13} />,
    "Kairouan": <Landmark size={13} />,
    "El Jem": <Landmark size={13} />,
    "Mahdia": <Waves size={13} />,
    "Nabeul": <PalmtreeIcon size={13} />,
    "Bizerte": <Ship size={13} />,
    "Tabarka": <Trees size={13} />,
    "Zaghouan": <Mountain size={13} />,
  };
  return iconMap[cityName || ""] || <LocateFixed size={13} />;
};

// Composant Palmtree personnalisé (car pas dans Lucide par défaut)
const PalmtreeIcon = ({ size = 13, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12 22V12M12 12L8 8L12 4L16 8L12 12Z" />
    <path d="M12 12L15 9L12 6L9 9L12 12Z" />
    <path d="M5 15L12 12L19 15" />
    <path d="M7 18L12 15L17 18" />
  </svg>
);

const SLOTS = [
  { key: "matin" as TimeKey, label: "Matin", icon: <Sunrise size={13} />, color: "#F59E0B", hint: "8h — 12h", defaultTime: "09:00" },
  { key: "aprem" as TimeKey, label: "Après-midi", icon: <Sun size={13} />, color: "#2B96A8", hint: "13h — 17h", defaultTime: "13:00" },
  { key: "soir" as TimeKey, label: "Soir", icon: <Moon size={13} />, color: "#8B5CF6", hint: "18h — 22h", defaultTime: "19:00" },
];

function BuilderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sb = useMemo(() => createClient(), []);

  const days = Number(params.get("days") || 3);
  const selCities = useMemo(
    () => (params.get("cities") || "").split(",").filter(Boolean),
    [params]
  );

  const [userId, setUserId] = useState<string | null>(null);
  const [savedItId, setSavedItId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [view, setView] = useState<ViewStep>("builder");

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [allExc, setAllExc] = useState<Excursion[]>([]);
  const [ldExc, setLdExc] = useState(true);
  const [errExc, setErrExc] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterDuration, setFilterDuration] = useState<"all" | "long">("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState("");

  const [itin, setItin] = useState<DayPlan[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [editNote, setEditNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const [pendingExc, setPendingExc] = useState<Excursion | null>(null);
  const [pickSlot, setPickSlot] = useState<TimeKey>("matin");
  const [pickTime, setPickTime] = useState("09:00");

  // États pour le modal de détails
  const [selectedExcursion, setSelectedExcursion] = useState<ExcursionDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadAll = async () => {
    setLdExc(true);
    const [cR, vR, eR] = await Promise.all([
      sb.from("categories").select("*").order("nom"),
      sb.from("villes").select("*").eq("active", true).order("nom"),
      sb.from("excursions").select("*").eq("is_active", true).order("rating", { ascending: false }),
    ]);
    setCategories((cR.data || []) as Categorie[]);
    setVilles((vR.data || []) as Ville[]);
    if (eR.error) setErrExc(eR.error.message);
    else setAllExc((eR.data || []) as Excursion[]);
    setLdExc(false);
  };

  // Fonction pour charger les détails d'une excursion
  const loadExcursionDetails = async (excursionId: string) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await sb
        .from("excursions")
        .select("*")
        .eq("id", excursionId)
        .single();
      
      if (error) throw error;
      setSelectedExcursion(data as ExcursionDetail);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadAll();
    setItin(Array.from({ length: days }, (_, i) => ({
      city: selCities[i % selCities.length] || selCities[0] || "",
      activities: [],
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await sb.from("itineraires").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setSavedItId(data.id);
    });
  }, [sb]);

  const cc = (n?: string) => categories.find(c => c.nom === n)?.couleur || "#2B96A8";

  const currentDayCity = useMemo(
    () => itin[activeDay]?.city || "",
    [itin, activeDay]
  );

  const palette = useMemo(() => {
    const q = search.toLowerCase();
    return allExc.filter(e => {
      const matchSearch = !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
      const matchCity = !currentDayCity || e.city.toLowerCase() === currentDayCity.toLowerCase();
      const matchDuration = filterDuration === "all" || e.duration_hours > 6;
      return matchSearch && matchCity && matchDuration;
    });
  }, [allExc, currentDayCity, search, filterDuration]);

  const totAct = itin.reduce((s, d) => s + (d.activities?.length || 0), 0);
  const totBudget = itin.reduce((s, d) => s + (d.activities?.reduce((ss, a) => ss + (a.excursion?.price_per_person || 0), 0) || 0), 0);
  const isAdded = (id: string) => itin[activeDay]?.activities.some(a => a.excursion.id === id);

  const openSlotPicker = (exc: Excursion) => {
    setPendingExc(exc);
    setPickSlot("matin");
    setPickTime("09:00");
  };

  const confirmAdd = () => {
    if (!pendingExc) return;
    setItin(prev => {
      const u = [...prev];
      u[activeDay] = { ...u[activeDay], activities: [...u[activeDay].activities, { id: `${Date.now()}-${Math.random()}`, excursion: pendingExc, note: "", time: pickSlot, customTime: pickTime }] };
      return u;
    });
    setPendingExc(null);
  };

  const rmAct = (dayIdx: number, id: string) =>
    setItin(prev => { const u = [...prev]; u[dayIdx] = { ...u[dayIdx], activities: u[dayIdx].activities.filter(a => a.id !== id) }; return u; });

  const saveNote = (dayIdx: number, id: string) => {
    setItin(prev => { const u = [...prev]; u[dayIdx] = { ...u[dayIdx], activities: u[dayIdx].activities.map(a => a.id === id ? { ...a, note: noteText } : a) }; return u; });
    setEditNote(null);
    setNoteText("");
  };

  const saveItinerary = async () => {
    if (!userId) { alert("Vous devez être connecté"); return; }
    setSaving(true);
    const payload = { user_id: userId, nb_jours: days, villes_selectionnees: selCities, categories_selectionnees: [], plan: itin, updated_at: new Date().toISOString() };
    try {
      if (savedItId) {
        await sb.from("itineraires").update(payload).eq("id", savedItId);
      } else {
        const { data } = await sb.from("itineraires").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (data) setSavedItId(data.id);
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch { alert("Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  };

  // Vue Résumé
  if (view === "result") return (
    <div className="res-root">
      <div className="res-top">
        <button className="res-btn res-btn-outline" onClick={() => setView("builder")}><ArrowLeft size={13} /> Retour au planning</button>
        <h1 className="res-title">Résumé de votre voyage</h1>
        <div className="res-actions">
          <button className="res-btn res-btn-outline" onClick={() => setView("builder")}><Pencil size={13} /> Modifier</button>
          <button className={`res-btn ${saveOk ? "res-btn-green" : "res-btn-dark"}`} onClick={saveItinerary} disabled={saving}>
            <Send size={13} />{saving ? "Sauvegarde…" : saveOk ? "✅ Sauvegardé !" : savedItId ? "Mettre à jour" : "Sauvegarder"}
          </button>
        </div>
      </div>

      <div className="res-body">
        <div className="res-sidebar">
          <p className="res-sidebar-label"><BookMarked size={11} /> Votre itinéraire</p>
          <div className="res-sidebar-title">{days} jours en Tunisie</div>
          <p className="res-sidebar-sub">{selCities.join(" · ")}</p>
          {[
            { icon: <Layers size={15} />, label: "Activités", val: `${totAct}`, color: "#2B96A8", bg: "rgba(43,150,168,.1)" },
            { icon: <PiggyBank size={15} />, label: "Budget total", val: `${totBudget} TND`, color: "#059669", bg: "rgba(5,150,105,.1)" },
            { icon: <Calendar size={15} />, label: "Durée", val: `${days} jours`, color: "#8B5CF6", bg: "rgba(139,92,246,.1)" },
          ].map(({ icon, label, val, color, bg }) => (
            <div key={label} className="res-kpi">
              <div className="res-kpi-icon" style={{ background: bg }}>{icon}</div>
              <div><div className="res-kpi-label">{label}</div><div className="res-kpi-val" style={{ color }}>{val}</div></div>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginTop: ".5rem" }}>
            <button className="res-btn res-btn-outline res-btn-full" onClick={() => setView("builder")}><Edit3 size={13} /> Modifier l&apos;itinéraire</button>
            <button className={`res-btn res-btn-full ${saveOk ? "res-btn-green" : "res-btn-dark"}`} onClick={saveItinerary} disabled={saving}>
              <Send size={13} />{saving ? "Sauvegarde…" : saveOk ? "✅ Sauvegardé !" : savedItId ? "Mettre à jour" : "Sauvegarder ce voyage"}
            </button>
          </div>
        </div>

        <div className="res-scroll">
          {itin.map((day, i) => (
            <div key={i} className="res-day-card">
              <div className="res-day-header">
                <h3 className="res-day-title">
                  <span>{getCityIcon(day.city)}</span>Jour {i + 1} — {day.city}
                  {day.date && <span className="res-day-date">· {new Date(day.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>}
                </h3>
                {day.activities.length > 0 && (
                  <span className="res-day-budget-badge">
                    <PiggyBank size={10} />{day.activities.reduce((s, a) => s + a.excursion.price_per_person, 0)} TND
                    <span className="res-sep">·</span>
                    <Clock size={9} color="#9CA3AF" />
                    <span className="res-hours">{day.activities.reduce((s, a) => s + a.excursion.duration_hours, 0)}h</span>
                  </span>
                )}
              </div>
              {day.activities.length === 0
                ? <p className="res-day-empty">Aucune activité planifiée</p>
                : [...day.activities].sort((a, b) => (a.customTime || "").localeCompare(b.customTime || "")).map(act => {
                  const col = cc(act.excursion.categories?.[0]);
                  const slot = SLOTS.find(s => s.key === act.time)!;
                  return (
                    <div key={act.id} className="res-act-row">
                      <div className="res-act-time">{act.customTime || slot?.defaultTime}</div>
                      {act.excursion.photos?.[0] && <img src={act.excursion.photos[0]} alt="" className="res-act-img" />}
                      <div className="res-act-info">
                        <div className="res-act-title">{act.excursion.title}</div>
                        <div className="res-act-meta">
                          <span className="res-meta-item"><MapPin size={8} />{act.excursion.city}</span>
                          <span className="res-meta-item"><Clock size={8} />{act.excursion.duration_hours}h</span>
                          {act.excursion.rating > 0 && <span className="res-meta-item"><Star size={8} color="#F59E0B" fill="#F59E0B" />{act.excursion.rating}</span>}
                        </div>
                        {act.note && <div className="res-act-note"><FileText size={8} />{act.note}</div>}
                      </div>
                      <span className="res-act-price" style={{ color: col }}>{act.excursion.price_per_person} TND</span>
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

  // Vue Builder
  const currentDay = itin[activeDay];
  const dayActs = currentDay?.activities || [];
  const dayBudget = dayActs.reduce((s, a) => s + a.excursion.price_per_person, 0);
  const slotActs = (slot: TimeKey) => [...dayActs].filter(a => a.time === slot).sort((a, b) => (a.customTime || "").localeCompare(b.customTime || ""));

  const DatePickerModal = () => {
    const today = new Date().toISOString().split("T")[0];
    return (
      <div className="modal-overlay" onClick={() => setShowDatePicker(false)}>
        <div className="date-picker-box" onClick={e => e.stopPropagation()}>
          <div className="date-picker-header">
            <h3>Choisir une date</h3>
            <button onClick={() => setShowDatePicker(false)}><X size={16} /></button>
          </div>
          <input type="date" className="date-picker-input" value={tempDate} min={today} onChange={e => setTempDate(e.target.value)} />
          <div className="date-picker-actions">
            <button className="date-cancel" onClick={() => setShowDatePicker(false)}>Annuler</button>
            <button className="date-confirm" onClick={() => {
              if (tempDate) {
                setItin(prev => { const u = [...prev]; u[activeDay] = { ...u[activeDay], date: tempDate }; return u; });
                setShowDatePicker(false);
                setTempDate("");
              }
            }}><CheckCircle2 size={13} /> Confirmer</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bl-root">
      {showDatePicker && <DatePickerModal />}

      {/* Topbar */}
      <div className="bl-top">
        <div className="bl-top-left">
          <button className="bl-back" onClick={() => router.push("/touriste/modeLibre")}><ArrowLeft size={12} /> Reconfigurer</button>
          <span className="bl-chip"><Calendar size={11} />{days} j · {selCities.join(" · ")}</span>
        </div>
        <div className="bl-top-right">
          {totAct > 0 && (
            <>
              <span className="bl-stat"><Layers size={11} />{totAct} excursion{totAct > 1 ? "s" : ""}</span>
              <span className="bl-budget-badge"><PiggyBank size={11} />{totBudget} TND</span>
            </>
          )}
          <button className="bl-resume-btn" onClick={() => setView("result")}>Voir le résumé <ArrowRight size={12} /></button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="bl-day-tabs">
        {itin.map((day, i) => {
          const cnt = day.activities.length;
          return (
            <button key={i} className={`bl-day-tab${activeDay === i ? " active" : ""}`} onClick={() => setActiveDay(i)}>
              <span>{getCityIcon(day.city)}</span>Jour {i + 1} — {day.city}
              {cnt > 0 && <span className="bl-day-tab-cnt">{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="bl-body">

        {/* Catalogue */}
        <div className="bl-catalogue">
          <div className="bl-cat-header">
            <div className="bl-cat-header-top">
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                <div className="bl-cat-title"><BookMarked size={13} color="#2B96A8" /> Excursions</div>
                {currentDayCity && (
                  <span className="bl-city-badge"><MapPin size={10} />{currentDayCity}</span>
                )}
              </div>
              {!ldExc && !errExc && (
                <span className="bl-results-count"><MapPin size={9} />{palette.length} résultat{palette.length !== 1 ? "s" : ""}</span>
              )}
            </div>
            <div className="bl-search-row">
              <Search size={12} color="#9CA3AF" className="bl-search-icon" />
              <input type="text" className="bl-search-input" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="bl-filter-row">
              <span className="bl-filter-label"><Clock size={10} /> Durée :</span>
              <button className={`bl-filter-btn ${filterDuration === "all" ? "active" : ""}`} onClick={() => setFilterDuration("all")}>Toutes</button>
              <button className={`bl-filter-btn ${filterDuration === "long" ? "active" : ""}`} onClick={() => setFilterDuration("long")}>&gt;6h</button>
            </div>
          </div>

          <div className="bl-cat-grid" key={currentDayCity}>
            {ldExc
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="exc-skeleton" />)
              : errExc
                ? <div className="bl-cat-grid-full"><ErrorDisplay message={errExc} onRetry={loadAll} /></div>
                : palette.length === 0
                  ? <div className="bl-cat-grid-full" style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
                      <MapPin size={28} style={{ marginBottom: ".5rem", opacity: .4 }} />
                      <p style={{ fontSize: ".82rem" }}>Aucune excursion pour {currentDayCity}</p>
                    </div>
                  : palette.map(exc => {
                    const col = cc(exc.categories?.[0]);
                    const added = isAdded(exc.id);
                    return (
                      <div 
                        key={exc.id} 
                        className="exc-card"
                        onClick={() => loadExcursionDetails(exc.id)}
                      >
                        {exc.photos?.[0] ? (
                          <div className="exc-card-img">
                            <img src={exc.photos[0]} alt={exc.title} />
                            <div className="exc-card-img-overlay" />
                            <span className="exc-card-cat">
                              <span>{getCategoryIcon(exc.categories?.[0])}</span> {exc.categories?.[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="exc-card-no-img" style={{ background: `${col}18` }}>
                            <Camera size={24} color={col} />
                          </div>
                        )}
                        <div className="exc-card-body">
                          <div className="exc-card-title">{exc.title}</div>
                          <div className="exc-card-meta">
                            <span className="exc-meta-item"><MapPin size={8} />{exc.city}</span>
                            <span className="exc-meta-item"><Clock size={8} />{exc.duration_hours}h</span>
                            {exc.rating > 0 && <span className="exc-meta-item"><Star size={8} color="#F59E0B" fill="#F59E0B" />{exc.rating}</span>}
                          </div>
                          <div className="exc-card-footer">
                            <span className="exc-card-price" style={{ color: col }}>{exc.price_per_person} TND</span>
                            <button 
                              className={`exc-add-btn${added ? " added" : ""}`} 
                              onClick={(e) => {
                                e.stopPropagation();
                                openSlotPicker(exc);
                              }}
                            >
                              {added ? <><CheckCircle2 size={10} /> Ajouté</> : <><Plus size={10} /> Ajouter</>}
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
                <div className="bl-planner-emoji">{getCityIcon(currentDay?.city)}</div>
                <div>
                  <div className="bl-planner-day-name">Jour {activeDay + 1} — {currentDay?.city}</div>
                  <div className="bl-planner-date-row">
                    {currentDay?.date ? (
                      <span className="bl-planner-date-text">
                        {new Date(currentDay.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        <button className="edit-date-btn" onClick={() => setShowDatePicker(true)}><Edit3 size={9} /></button>
                      </span>
                    ) : (
                      <button className="bl-planner-date-btn" onClick={() => setShowDatePicker(true)}><CalendarDays size={10} /> Sélectionner une date</button>
                    )}
                    <select
                      className="bl-city-select"
                      value={currentDay?.city}
                      onChange={e => {
                        const newCity = e.target.value;
                        setItin(prev => {
                          const u = [...prev];
                          u[activeDay] = { ...u[activeDay], city: newCity };
                          return u;
                        });
                      }}
                    >
                      {villes.map(c => <option key={c.id} value={c.nom}>{getCityIcon(c.nom)} {c.nom}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bl-planner-right">
                <div className="bl-day-totals">
                  <div className="bl-day-budget">{dayBudget} TND</div>
                  <div className="bl-day-count">{dayActs.length} activité{dayActs.length !== 1 ? "s" : ""}</div>
                </div>
                <div className="bl-day-nav">
                  <button className="bl-nav-btn" disabled={activeDay === 0} onClick={() => setActiveDay(p => p - 1)}><ChevronLeft size={13} /></button>
                  <button className="bl-nav-btn" disabled={activeDay === days - 1} onClick={() => setActiveDay(p => p + 1)}><ChevronRight size={13} /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="bl-planner-scroll">
            {dayActs.length === 0 ? (
              <div className="bl-planner-empty">
                <Plus size={36} strokeWidth={1.2} style={{ opacity: .3, display: "block", margin: "0 auto .75rem" }} />
                <p>Aucune activité pour ce jour.<br />Cliquez sur <strong>Ajouter</strong> dans le catalogue.</p>
              </div>
            ) : SLOTS.map(slot => {
              const acts = slotActs(slot.key);
              const slotBudget = acts.reduce((s, a) => s + a.excursion.price_per_person, 0);
              return (
                <div key={slot.key} className="bl-slot">
                  <div className="bl-slot-header">
                    {slot.icon}
                    <span className="bl-slot-label" style={{ color: slot.color }}>{slot.label}</span>
                    <span className="bl-slot-hint">{slot.hint}</span>
                    {acts.length > 0 && <span className="bl-slot-total"><PiggyBank size={9} />{slotBudget} TND · {acts.reduce((s, a) => s + a.excursion.duration_hours, 0)}h</span>}
                  </div>
                  {acts.length === 0
                    ? <div className="bl-slot-empty">Aucune activité ce créneau</div>
                    : acts.map(act => {
                      const col = cc(act.excursion.categories?.[0]);
                      return (
                        <div key={act.id} className="act-card">
                          <div className="act-card-time">{act.customTime || slot.defaultTime}</div>
                          {act.excursion.photos?.[0] && <img src={act.excursion.photos[0]} alt="" className="act-card-img" />}
                          <div className="act-card-info">
                            <div className="act-card-title">{act.excursion.title}</div>
                            <div className="act-card-meta">
                              <span className="act-meta-item"><MapPin size={8} />{act.excursion.city}</span>
                              <span className="act-meta-item"><Clock size={8} />{act.excursion.duration_hours}h</span>
                              {act.excursion.rating > 0 && <span className="act-meta-item"><Star size={8} color="#F59E0B" fill="#F59E0B" />{act.excursion.rating}</span>}
                            </div>
                            {act.note && <div className="act-card-note"><FileText size={8} />{act.note}</div>}
                          </div>
                          <span className="act-card-price" style={{ color: col }}>{act.excursion.price_per_person} TND</span>
                          <div className="act-actions">
                            <button className="act-action-btn note" onClick={() => { setEditNote(act.id); setNoteText(act.note); }}><FileText size={12} /></button>
                            <button className="act-action-btn delete" onClick={() => rmAct(activeDay, act.id)}><Trash2 size={12} /></button>
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
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPendingExc(null); }}>
          <div className="slot-box">
            <div className="slot-box-title">Choisir le créneau</div>
            <p className="slot-box-sub">{pendingExc.title} · {pendingExc.price_per_person} TND</p>
            {SLOTS.map(slot => (
              <div key={slot.key} className={`slot-option${pickSlot === slot.key ? " selected" : ""}`}
                onClick={() => { setPickSlot(slot.key); setPickTime(slot.defaultTime); }}>
                <div className="slot-option-icon" style={{ background: `${slot.color}18` }}>{slot.icon}</div>
                <div className="slot-option-info">
                  <div className="slot-option-label" style={{ color: slot.color }}>{slot.label}</div>
                  <div className="slot-option-hint">{slot.hint}</div>
                </div>
                {pickSlot === slot.key && (
                  <input type="time" className="slot-time-input" value={pickTime}
                    onChange={e => setPickTime(e.target.value)} onClick={e => e.stopPropagation()} />
                )}
              </div>
            ))}
            <div className="slot-box-actions">
              <button className="slot-cancel" onClick={() => setPendingExc(null)}>Annuler</button>
              <button className="slot-confirm" onClick={confirmAdd}><CheckCircle2 size={13} /> Ajouter au jour {activeDay + 1}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal note */}
      {editNote && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditNote(null); }}>
          <div className="note-box">
            <div className="note-box-title"><FileText size={16} color="#2B96A8" />Note personnelle</div>
            <p className="note-box-sub">Conseil, rappel ou info utile…</p>
            <textarea autoFocus className="note-textarea" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ex : Réservation recommandée…" />
            <div className="note-box-actions">
              <button className="note-cancel" onClick={() => setEditNote(null)}>Annuler</button>
              <button className="note-save" onClick={() => saveNote(activeDay, editNote!)}><CheckCircle2 size={13} /> Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails de l'excursion */}
      {selectedExcursion && (
        <ExcursionDetailModal 
          excursion={selectedExcursion} 
          onClose={() => setSelectedExcursion(null)}
          onAdd={() => {
            const excursionSimplifiee: Excursion = {
              id: selectedExcursion.id,
              title: selectedExcursion.title,
              city: selectedExcursion.city,
              price_per_person: selectedExcursion.price_per_person,
              duration_hours: selectedExcursion.duration_hours,
              rating: selectedExcursion.rating,
              reviews_count: selectedExcursion.reviews_count,
              categories: selectedExcursion.categories,
              photos: selectedExcursion.photos,
              departure_time: selectedExcursion.depart_time || undefined
            };
            openSlotPicker(excursionSimplifiee);
            setSelectedExcursion(null);
          }}
        />
      )}

      {/* Loading overlay */}
      {loadingDetails && <LoadingSpinner />}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <BuilderInner />
    </Suspense>
  );
}