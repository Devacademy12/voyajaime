"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Star,
  Trash2, FileText, Search, CheckCircle2,
  PiggyBank, Layers, BookMarked, ChevronLeft, ChevronRight,
  Loader2, Sunrise, Sun, Moon,
  Plus, CalendarDays, Edit3, X, Camera, Mountain,
  MapPinned, LocateFixed, Landmark, Compass, Building2,
  Trees, Waves, UtensilsCrossed, Tent, Bike, Ship,
  ShoppingBag, Sparkles, Music, AlertCircle,
} from "lucide-react";

import { ExcursionDetailModal } from "@/app/components/excursions/ExcursionDetailModal";
import { LoadingSpinner } from "@/app/components/excursions/LoadingSpinner";
import { ErrorDisplay } from "@/app/components/excursions/ErrorDisplay";
import ItinerarySummary, { SummaryDayPlan } from "@/app/components/itineraire/ItinerarySummary";

import "@/public/style/builder.css";

/* ════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */

// Format spécifique de available_dates : tableau d'objets avec date, slots, departure_time
type AvailableDateSlot = {
  date: string;
  slots: number;
  departure_time: string;
};

type AvailableDates = AvailableDateSlot[] | null;

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
  available_dates?: AvailableDates;
  max_people?: number;
  difficulty?: string;
  min_age?: number;
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
  available_dates: AvailableDates;
  depart_time: string | null;
};

type Categorie    = { id: string; nom: string; emoji: string; couleur: string };
type Ville        = { id: string; nom: string; emoji: string; region: string; description: string; active: boolean };
type TimeKey      = "matin" | "aprem" | "soir";
type ActivityItem = { id: string; excursion: Excursion; note: string; time: TimeKey; customTime?: string };
type DayPlan      = { city: string; date?: string; activities: ActivityItem[] };
type ViewStep     = "builder" | "result";

/* ════════════════════════════════════════════════════════════
   UTILITAIRES DATE  — 100 % UTC-safe
════════════════════════════════════════════════════════════ */

function toDateStr(raw: unknown): string {
  if (raw === null || raw === undefined) return "";

  if (raw instanceof Date) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, "0");
    const d = String(raw.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  if (typeof raw === "number") {
    const dt = new Date(raw);
    const y  = dt.getUTCFullYear();
    const m  = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d  = String(dt.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  if (typeof raw === "string") {
    const s    = raw.trim();
    if (!s) return "";
    const part = s.split("T")[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : "";
  }

  return "";
}

function formatFr(dateStr: string, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    ...opts,
  });
}

/* ════════════════════════════════════════════════════════════
   LOGIQUE available_dates — Format tableau d'objets
   [{ date: "2026-04-26", slots: 10, departure_time: "08:00" }]
════════════════════════════════════════════════════════════ */

/**
 * Vérifie si l'excursion est disponible à une date donnée.
 * Basé sur le format : tableau d'objets avec date, slots, departure_time
 */
function isAvailableOn(availableDates: AvailableDates, targetDate: string): boolean {
  // Pas de contrainte de dates → toujours disponible
  if (!availableDates || availableDates.length === 0) {
    return true;
  }

  const target = toDateStr(targetDate);
  if (!target) return true;

  // Vérifier si la date cible existe dans le tableau
  return availableDates.some(slot => toDateStr(slot.date) === target);
}

/**
 * Retourne la liste des dates disponibles (formatées YYYY-MM-DD)
 */
function getAvailableDatesList(availableDates: AvailableDates): string[] {
  if (!availableDates) return [];
  return availableDates.map(slot => toDateStr(slot.date)).filter(Boolean);
}

/**
 * Retourne l'heure de départ pour une date spécifique
 */
function getDepartureTimeForDate(availableDates: AvailableDates, targetDate: string): string | null {
  if (!availableDates) return null;
  const target = toDateStr(targetDate);
  const slot = availableDates.find(s => toDateStr(s.date) === target);
  return slot?.departure_time || null;
}

/**
 * Vérifie si l'excursion a des contraintes de dates
 */
function excursionHasDateConstraints(availableDates: AvailableDates): boolean {
  return !!(availableDates && availableDates.length > 0);
}

/* ════════════════════════════════════════════════════════════
   ICÔNES CATÉGORIES
════════════════════════════════════════════════════════════ */
const getCategoryIcon = (name?: string) => {
  const map: Record<string, React.ReactNode> = {
    "Nature":      <Trees size={13} />,
    "Plage":       <Waves size={13} />,
    "Culture":     <Landmark size={13} />,
    "Histoire":    <Compass size={13} />,
    "Gastronomie": <UtensilsCrossed size={13} />,
    "Aventure":    <Tent size={13} />,
    "Sport":       <Bike size={13} />,
    "Mer":         <Ship size={13} />,
    "Désert":      <Sun size={13} />,
    "Montagne":    <Mountain size={13} />,
    "Ville":       <Building2 size={13} />,
    "Shopping":    <ShoppingBag size={13} />,
    "Bien-être":   <Sparkles size={13} />,
    "Soirée":      <Music size={13} />,
    "Excursion":   <Compass size={13} />,
  };
  return map[name || ""] || <MapPinned size={13} />;
};

/* ════════════════════════════════════════════════════════════
   CONSTANTES
════════════════════════════════════════════════════════════ */
const SLOTS = [
  { key: "matin" as TimeKey, label: "Matin",      icon: <Sunrise size={13} />, color: "#F59E0B", hint: "8h — 12h",  defaultTime: "09:00" },
  { key: "aprem" as TimeKey, label: "Après-midi", icon: <Sun     size={13} />, color: "#2B96A8", hint: "13h — 17h", defaultTime: "13:00" },
  { key: "soir"  as TimeKey, label: "Soir",       icon: <Moon    size={13} />, color: "#8B5CF6", hint: "18h — 22h", defaultTime: "19:00" },
];

/* ════════════════════════════════════════════════════════════
   CONVERTER  DayPlan[] → SummaryDayPlan[]
════════════════════════════════════════════════════════════ */
function toSummaryDays(itin: DayPlan[], _selCities: string[]): SummaryDayPlan[] {
  return itin.map((d, i) => ({
    day:   i + 1,
    city:  d.city,
    date:  d.date,
    emoji: "📍",
    activities: d.activities.map(act => ({
      id:         act.id,
      time:       act.time,
      customTime: act.customTime,
      note:       act.note,
      excursion: {
        title:            act.excursion.title,
        city:             act.excursion.city,
        price_per_person: act.excursion.price_per_person,
        duration_hours:   act.excursion.duration_hours,
        rating:           act.excursion.rating,
        photos:           act.excursion.photos,
        categories:       act.excursion.categories,
      },
    })),
  }));
}

/* ════════════════════════════════════════════════════════════
   BUILDER INNER
════════════════════════════════════════════════════════════ */
function BuilderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sb     = useMemo(() => createClient(), []);

  const days      = Number(params.get("days") || 3);
  const selCities = useMemo(
    () => (params.get("cities") || "").split(",").filter(Boolean),
    [params],
  );

  const [userId,    setUserId]    = useState<string | null>(null);
  const [savedItId, setSavedItId] = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [view,      setView]      = useState<ViewStep>("builder");

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [villes,     setVilles]     = useState<Ville[]>([]);
  const [allExc,     setAllExc]     = useState<Excursion[]>([]);
  const [ldExc,      setLdExc]      = useState(true);
  const [errExc,     setErrExc]     = useState<string | null>(null);

  const [search,         setSearch]         = useState("");
  const [filterDuration, setFilterDuration] = useState<"all" | "long">("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState<string | null>(null);

  const [itin,      setItin]      = useState<DayPlan[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [editNote,  setEditNote]  = useState<string | null>(null);
  const [noteText,  setNoteText]  = useState("");

  const [pendingExc, setPendingExc] = useState<Excursion | null>(null);
  const [pickSlot,   setPickSlot]   = useState<TimeKey>("matin");
  const [pickTime,   setPickTime]   = useState("09:00");

  const [selectedExcursion, setSelectedExcursion] = useState<ExcursionDetail | null>(null);
  const [loadingDetails,    setLoadingDetails]    = useState(false);

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  /* ── Chargement ── */
  const loadAll = async () => {
    setLdExc(true);
    try {
      const [cR, vR, eR] = await Promise.all([
        sb.from("categories").select("*").order("nom"),
        sb.from("villes").select("*").eq("active", true).order("nom"),
        sb.from("excursions")
          .select("id,title,city,price_per_person,duration_hours,rating,reviews_count,categories,photos,available_dates,depart_time,max_people,difficulty,min_age")
          .eq("is_active", true)
          .order("rating", { ascending: false }),
      ]);

      setCategories((cR.data || []) as Categorie[]);
      setVilles((vR.data || []) as Ville[]);

      if (eR.error) {
        setErrExc(eR.error.message);
      } else {
        const excursions: Excursion[] = (eR.data || []).map((row: any) => ({
          ...row,
          departure_time: row.depart_time ?? undefined,
        }));
        setAllExc(excursions);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
      setErrExc("Erreur lors du chargement des données");
    } finally {
      setLdExc(false);
    }
  };

  useEffect(() => {
    loadAll();
    setItin(
      Array.from({ length: days }, (_, i) => ({
        city:       selCities[i % selCities.length] || selCities[0] || "",
        activities: [],
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await sb
        .from("itineraires")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setSavedItId(data.id);
    });
  }, [sb]);

  const cc = (n?: string) => categories.find(c => c.nom === n)?.couleur || "#2B96A8";

  const currentDayCity = useMemo(() => itin[activeDay]?.city || "", [itin, activeDay]);
  const currentDayDate = useMemo(() => itin[activeDay]?.date,        [itin, activeDay]);

  const palette = useMemo(() => {
    const q = search.toLowerCase();
    return allExc.filter(e => {
      const okSearch   = !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
      const okCity     = !currentDayCity || e.city.toLowerCase() === currentDayCity.toLowerCase();
      const okDuration = filterDuration === "all" || e.duration_hours > 6;
      return okSearch && okCity && okDuration;
    });
  }, [allExc, currentDayCity, search, filterDuration]);

  const checkAvailable = useCallback(
    (exc: Excursion, date: string): boolean =>
      isAvailableOn(exc.available_dates ?? null, date),
    [],
  );

  const availableCount = useMemo(
    () => currentDayDate
      ? palette.filter(e => checkAvailable(e, currentDayDate)).length
      : palette.length,
    [palette, currentDayDate, checkAvailable],
  );

  const totAct    = itin.reduce((s, d) => s + (d.activities?.length || 0), 0);
  const totBudget = itin.reduce(
    (s, d) => s + (d.activities?.reduce((ss, a) => ss + (a.excursion?.price_per_person || 0), 0) || 0),
    0,
  );
  const isAdded = (id: string) => itin[activeDay]?.activities.some(a => a.excursion.id === id);

  const isTimeSlotAvailable = useCallback(
    (dayIdx: number, startTime: string, durationHours: number): boolean => {
      const acts     = itin[dayIdx]?.activities || [];
      const newStart = toMinutes(startTime);
      const newEnd   = newStart + durationHours * 60;
      for (const act of acts) {
        const t0 = act.customTime || SLOTS.find(s => s.key === act.time)?.defaultTime || "09:00";
        const s0 = toMinutes(t0);
        const e0 = s0 + act.excursion.duration_hours * 60;
        if (!(newEnd <= s0 || newStart >= e0)) return false;
      }
      return true;
    },
    [itin],
  );

  const openSlotPicker = useCallback(
    (exc: Excursion) => {
      if (currentDayDate) {
        const ok = checkAvailable(exc, currentDayDate);
        if (!ok) {
          const list = getAvailableDatesList(exc.available_dates ?? null);
          if (list.length > 0) {
            const shown = list
              .slice(0, 5)
              .map(d => formatFr(d, { day: "numeric", month: "long" }))
              .join(", ");
            alert(
              `⚠️ "${exc.title}" n'est pas disponible le ` +
              `${formatFr(currentDayDate, { day: "numeric", month: "long", year: "numeric" })}.\n\n` +
              `📅 Dates disponibles : ${shown}${list.length > 5 ? "…" : ""}`,
            );
          } else {
            alert(`⚠️ "${exc.title}" n'est pas disponible à cette date.`);
          }
          return;
        }
        
        // Récupérer l'heure de départ spécifique pour cette date
        const departureTime = getDepartureTimeForDate(exc.available_dates ?? null, currentDayDate);
        if (departureTime) {
          setPickTime(departureTime.substring(0, 5));
        } else {
          setPickTime(exc.departure_time?.substring(0, 5) || "09:00");
        }
      } else {
        setPickTime(exc.departure_time?.substring(0, 5) || "09:00");
      }
      
      setPendingExc(exc);
      setPickSlot("matin");
    },
    [currentDayDate, checkAvailable],
  );

  const confirmAdd = () => {
    if (!pendingExc) return;
    if (currentDayDate && !checkAvailable(pendingExc, currentDayDate)) {
      alert(`❌ "${pendingExc.title}" n'est plus disponible à cette date.`);
      setPendingExc(null);
      return;
    }
    if (!isTimeSlotAvailable(activeDay, pickTime, pendingExc.duration_hours)) {
      alert("❌ Conflit d'horaires avec une autre activité.");
      return;
    }
    setItin(prev => {
      const next = [...prev];
      const item: ActivityItem = {
        id:         `${Date.now()}-${Math.random()}`,
        excursion:  pendingExc,
        note:       "",
        time:       pickSlot,
        customTime: pickTime,
      };
      next[activeDay] = { ...next[activeDay], activities: [...next[activeDay].activities, item] };
      return next;
    });
    setShowSuccessMsg(`✓ "${pendingExc.title}" ajouté à votre itinéraire`);
    setTimeout(() => setShowSuccessMsg(null), 3000);
    setPendingExc(null);
  };

  const rmAct = (dayIdx: number, id: string) => {
    setItin(prev => {
      const next    = [...prev];
      const removed = next[dayIdx].activities.find(a => a.id === id);
      next[dayIdx]  = { ...next[dayIdx], activities: next[dayIdx].activities.filter(a => a.id !== id) };
      if (removed) {
        setShowSuccessMsg(`✗ "${removed.excursion.title}" retiré`);
        setTimeout(() => setShowSuccessMsg(null), 2000);
      }
      return next;
    });
  };

  const saveNote = (dayIdx: number, id: string) => {
    setItin(prev => {
      const next = [...prev];
      next[dayIdx] = {
        ...next[dayIdx],
        activities: next[dayIdx].activities.map(a => a.id === id ? { ...a, note: noteText } : a),
      };
      return next;
    });
    setEditNote(null);
    setNoteText("");
  };

  const saveItinerary = async () => {
    if (!userId) { alert("Vous devez être connecté"); return; }
    setSaving(true);
    const payload = {
      user_id:                  userId,
      nb_jours:                 days,
      villes_selectionnees:     selCities,
      categories_selectionnees: [],
      plan:                     itin,
      updated_at:               new Date().toISOString(),
    };
    try {
      if (savedItId) {
        await sb.from("itineraires").update(payload).eq("id", savedItId);
      } else {
        const { data } = await sb
          .from("itineraires")
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (data) setSavedItId(data.id);
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const loadExcursionDetails = async (excursionId: string) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await sb.from("excursions").select("*").eq("id", excursionId).single();
      if (error) throw error;
      setSelectedExcursion(data as ExcursionDetail);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const DatePickerModal = () => {
    const today = new Date().toISOString().split("T")[0];
    const [sel, setSel] = useState("");

    const handleConfirm = () => {
      const picked = toDateStr(sel);
      if (!picked) return;
      setItin(prev => {
        const next   = [...prev];
        const compat = next[activeDay].activities.filter(act =>
          checkAvailable(act.excursion, picked),
        );
        next[activeDay] = { ...next[activeDay], date: picked, activities: compat };
        return next;
      });
      setShowDatePicker(false);
      setShowSuccessMsg(`📅 Date fixée au ${formatFr(picked, { day: "numeric", month: "long", year: "numeric" })}`);
      setTimeout(() => setShowSuccessMsg(null), 3000);
    };

    return (
      <div className="modal-overlay" onClick={() => setShowDatePicker(false)}>
        <div className="date-picker-box" onClick={e => e.stopPropagation()}>
          <div className="date-picker-header">
            <h3>Choisir la date de visite</h3>
            <button onClick={() => setShowDatePicker(false)}><X size={16} /></button>
          </div>
          <p className="date-picker-hint">📍 {currentDayCity}</p>
          <input
            type="date"
            className="date-picker-input"
            value={sel}
            min={today}
            onChange={e => setSel(e.target.value)}
          />
          <div className="date-picker-actions">
            <button className="date-cancel" onClick={() => setShowDatePicker(false)}>Annuler</button>
            <button className="date-confirm" onClick={handleConfirm} disabled={!sel}>
              <CheckCircle2 size={13} /> Confirmer la date
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (view === "result") return (
    <ItinerarySummary
      days={toSummaryDays(itin, selCities)}
      nbJours={days}
      selCities={selCities}
      saving={saving}
      saveOk={saveOk}
      savedItId={savedItId}
      onBack={() => setView("builder")}
      onEdit={() => setView("builder")}
      onSave={saveItinerary}
    />
  );

  const currentDay = itin[activeDay];
  const dayActs    = currentDay?.activities || [];
  const dayBudget  = dayActs.reduce((s, a) => s + a.excursion.price_per_person, 0);

  const slotActs = (slot: TimeKey) =>
    [...dayActs]
      .filter(a => a.time === slot)
      .sort((a, b) => (a.customTime || "").localeCompare(b.customTime || ""));

  return (
    <div className="bl-root">
      {showDatePicker && <DatePickerModal />}
      {showSuccessMsg  && <div className="success-toast">{showSuccessMsg}</div>}

      <div className="bl-top">
        <div className="bl-top-left">
          <button className="bl-back" onClick={() => router.push("/touriste/modeLibre")}>
            <ArrowLeft size={12} /> Retour
          </button>
          <span className="bl-chip">
            <Calendar size={11} />{days} jours · {selCities.join(" → ")}
          </span>
        </div>
        <div className="bl-top-right">
          {totAct > 0 && (
            <>
              <span className="bl-stat"><Layers size={11} />{totAct} activité{totAct > 1 ? "s" : ""}</span>
              <span className="bl-budget-badge"><PiggyBank size={11} />{totBudget} TND</span>
            </>
          )}
          <button className="bl-resume-btn" onClick={() => setView("result")}>
            Voir le résumé <ArrowRight size={12} />
          </button>
        </div>
      </div>

      <div className="bl-day-tabs">
        {itin.map((day, i) => (
          <button
            key={i}
            className={`bl-day-tab${activeDay === i ? " active" : ""}`}
            onClick={() => setActiveDay(i)}
          >
            <LocateFixed size={13} />
            Jour {i + 1} — {day.city}
            {!day.date && <span className="bl-day-tab-no-date">📅</span>}
            {day.activities.length > 0 && (
              <span className="bl-day-tab-cnt">{day.activities.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bl-body">

        <div className="bl-catalogue">
          <div className="bl-cat-header">

            <div className="bl-cat-header-top">
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                <div className="bl-cat-title">
                  <BookMarked size={13} color="#2B96A8" /> Excursions disponibles
                </div>
                {currentDayCity && (
                  <span className="bl-city-badge"><MapPin size={10} />{currentDayCity}</span>
                )}
                {currentDayDate ? (
                  <span className="bl-date-badge available">
                    <Calendar size={10} />
                    {formatFr(currentDayDate, { day: "numeric", month: "long" })}
                    <button className="edit-date-btn" onClick={() => setShowDatePicker(true)}>
                      <Edit3 size={9} />
                    </button>
                  </span>
                ) : (
                  <button className="bl-select-date-btn" onClick={() => setShowDatePicker(true)}>
                    <CalendarDays size={10} /> Choisir une date
                  </button>
                )}
              </div>

              {!ldExc && !errExc && (
                <span className="bl-results-count">
                  {currentDayDate ? (
                    <>
                      <CheckCircle2 size={9} color="#10B981" />
                      {availableCount} disponible{availableCount !== 1 ? "s" : ""}
                      {" "}/ {palette.length} le {formatFr(currentDayDate, { day: "numeric", month: "long" })}
                    </>
                  ) : (
                    <>📋 {palette.length} excursion{palette.length !== 1 ? "s" : ""} à {currentDayCity}</>
                  )}
                </span>
              )}
            </div>

            {currentDayDate && !ldExc && palette.length > 0 && (
              <div className="bl-availability-legend">
                <span className="legend-item available-legend"><CheckCircle2 size={9} /> Disponible</span>
                <span className="legend-item unavailable-legend"><AlertCircle  size={9} /> Indisponible ce jour</span>
              </div>
            )}

            <div className="bl-search-row">
              <Search size={12} color="#9CA3AF" className="bl-search-icon" />
              <input
                type="text"
                className="bl-search-input"
                placeholder="Rechercher une excursion..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="bl-filter-row">
              <span className="bl-filter-label"><Clock size={10} /> Durée :</span>
              <button
                className={`bl-filter-btn${filterDuration === "all"  ? " active" : ""}`}
                onClick={() => setFilterDuration("all")}
              >Toutes</button>
              <button
                className={`bl-filter-btn${filterDuration === "long" ? " active" : ""}`}
                onClick={() => setFilterDuration("long")}
              >+ de 6h</button>
            </div>
          </div>

          <div className="bl-cat-grid">
            {ldExc ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="exc-skeleton" />)
            ) : errExc ? (
              <div className="bl-cat-grid-full">
                <ErrorDisplay message={errExc} onRetry={loadAll} />
              </div>
            ) : palette.length === 0 ? (
              <div className="bl-cat-grid-full" style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
                <Calendar size={48} strokeWidth={1.2} style={{ opacity: .3, marginBottom: "1rem" }} />
                <p style={{ fontSize: ".9rem", fontWeight: 500 }}>
                  Aucune excursion trouvée à {currentDayCity}
                </p>
              </div>
            ) : (
              palette.map(exc => {
                const col     = cc(exc.categories?.[0]);
                const added   = isAdded(exc.id);
                const hasCons = excursionHasDateConstraints(exc.available_dates ?? null);
                const dispo = currentDayDate
                  ? checkAvailable(exc, currentDayDate)
                  : true;

                // Récupérer l'heure de départ spécifique pour la date
                const specificDepartureTime = currentDayDate 
                  ? getDepartureTimeForDate(exc.available_dates ?? null, currentDayDate)
                  : null;
                const displayDepartureTime = specificDepartureTime || exc.departure_time;

                return (
                  <div
                    key={exc.id}
                    className={`exc-card${currentDayDate && !dispo ? " not-available" : ""}`}
                    onClick={() => loadExcursionDetails(exc.id)}
                  >
                    {exc.photos?.[0] ? (
                      <div className="exc-card-img">
                        <img src={exc.photos[0]} alt={exc.title} />
                        <div className="exc-card-img-overlay" />
                        <span className="exc-card-cat">
                          {getCategoryIcon(exc.categories?.[0])} {exc.categories?.[0]}
                        </span>
                        {currentDayDate && (
                          <span className={`exc-availability-badge ${dispo ? "badge-ok" : "badge-ko"}`}>
                            {dispo ? <><CheckCircle2 size={8} /> Disponible</> : <><AlertCircle size={8} /> Indisponible</>}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="exc-card-no-img" style={{ background: `${col}18` }}>
                        <Camera size={24} color={col} />
                        {currentDayDate && (
                          <span className={`exc-availability-badge-flat ${dispo ? "badge-ok" : "badge-ko"}`}>
                            {dispo ? <><CheckCircle2 size={8} /> Disponible</> : <><AlertCircle size={8} /> Indisponible</>}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="exc-card-body">
                      <div className="exc-card-title">{exc.title}</div>

                      <div className="exc-card-meta">
                        <span className="exc-meta-item"><MapPin size={8} />{exc.city}</span>
                        <span className="exc-meta-item"><Clock  size={8} />{exc.duration_hours}h</span>
                        {exc.rating > 0 && (
                          <span className="exc-meta-item">
                            <Star size={8} color="#F59E0B" fill="#F59E0B" />{exc.rating}
                          </span>
                        )}
                      </div>

                      {!currentDayDate ? (
                        hasCons
                          ? <div className="exc-has-dates"><CalendarDays size={8} /> Dates spécifiques</div>
                          : <div className="exc-always-available"><CheckCircle2 size={8} /> Toujours disponible</div>
                      ) : dispo
                        ? <div className="exc-available-on-date"><CheckCircle2 size={8} /> Disponible ce jour</div>
                        : <div className="exc-not-available-on-date"><AlertCircle size={8} /> Indisponible ce jour</div>
                      }

                      {displayDepartureTime && (
                        <div className="exc-departure-time">
                          <Clock size={8} /> Départ : {displayDepartureTime.substring(0, 5)}
                        </div>
                      )}

                      <div className="exc-card-footer">
                        <span className="exc-card-price" style={{ color: col }}>
                          {exc.price_per_person} TND
                        </span>

                        <button
                          className={[
                            "exc-add-btn",
                            added                    ? "added"       : "",
                            currentDayDate && !dispo ? "unavailable" : "",
                          ].filter(Boolean).join(" ")}
                          disabled={added || (!!currentDayDate && !dispo)}
                          title={currentDayDate && !dispo ? "Non disponible à cette date" : ""}
                          onClick={e => {
                            e.stopPropagation();
                            if (currentDayDate && !dispo) return;
                            openSlotPicker(exc);
                          }}
                        >
                          {added ? (
                            <><CheckCircle2 size={10} /> Ajouté</>
                          ) : currentDayDate && !dispo ? (
                            <><AlertCircle  size={10} /> Indisponible</>
                          ) : (
                            <><Plus         size={10} /> Ajouter</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bl-planner">
          <div className="bl-planner-header">
            <div className="bl-planner-top">
              <div className="bl-planner-day-info">
                <div className="bl-planner-emoji"><LocateFixed size={13} /></div>
                <div>
                  <div className="bl-planner-day-name">Jour {activeDay + 1} — {currentDay?.city}</div>
                  <div className="bl-planner-date-row">
                    {currentDay?.date ? (
                      <span className="bl-planner-date-text">
                        📅 {formatFr(currentDay.date, { day: "numeric", month: "long", year: "numeric" })}
                        <button className="edit-date-btn" onClick={() => setShowDatePicker(true)}>
                          <Edit3 size={9} />
                        </button>
                      </span>
                    ) : (
                      <button className="bl-planner-date-btn" onClick={() => setShowDatePicker(true)}>
                        <CalendarDays size={10} /> Choisir une date
                      </button>
                    )}
                    <select
                      className="bl-city-select"
                      value={currentDay?.city}
                      onChange={e => {
                        const newCity = e.target.value;
                        setItin(prev => {
                          const next = [...prev];
                          next[activeDay] = { city: newCity, date: undefined, activities: [] };
                          return next;
                        });
                      }}
                    >
                      {villes.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
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
                  <button className="bl-nav-btn" disabled={activeDay === 0}
                    onClick={() => setActiveDay(p => p - 1)}>
                    <ChevronLeft size={13} />
                  </button>
                  <button className="bl-nav-btn" disabled={activeDay === days - 1}
                    onClick={() => setActiveDay(p => p + 1)}>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bl-planner-scroll">
            {dayActs.length === 0 ? (
              <div className="bl-planner-empty">
                <Plus size={36} strokeWidth={1.2} style={{ opacity: .3, marginBottom: ".75rem" }} />
                {currentDay?.date ? (
                  <>
                    <p>📅 {formatFr(currentDay.date, { weekday: "long", day: "numeric", month: "long" })}</p>
                    <p style={{ fontSize: "0.82rem", marginTop: "0.5rem" }}>
                      Cliquez sur "Ajouter" pour planifier vos excursions disponibles à cette date
                    </p>
                  </>
                ) : (
                  <>
                    <p>Ajoutez des excursions depuis le catalogue</p>
                    <p style={{ fontSize: "0.82rem", marginTop: "0.5rem", color: "#9CA3AF" }}>
                      Vous pouvez aussi{" "}
                      <button
                        className="bl-planner-date-btn"
                        style={{ display: "inline-flex", verticalAlign: "middle" }}
                        onClick={() => setShowDatePicker(true)}
                      >
                        <CalendarDays size={10} /> choisir une date
                      </button>{" "}
                      pour vérifier la disponibilité
                    </p>
                  </>
                )}
              </div>
            ) : (
              SLOTS.map(slot => {
                const acts       = slotActs(slot.key);
                const slotBudget = acts.reduce((s, a) => s + a.excursion.price_per_person, 0);
                return (
                  <div key={slot.key} className="bl-slot">
                    <div className="bl-slot-header">
                      {slot.icon}
                      <span className="bl-slot-label" style={{ color: slot.color }}>{slot.label}</span>
                      <span className="bl-slot-hint">{slot.hint}</span>
                      {acts.length > 0 && (
                        <span className="bl-slot-total">
                          <PiggyBank size={9} />
                          {slotBudget} TND · {acts.reduce((s, a) => s + a.excursion.duration_hours, 0)}h
                        </span>
                      )}
                    </div>
                    {acts.length === 0 ? (
                      <div className="bl-slot-empty">Aucune activité prévue</div>
                    ) : (
                      acts.map(act => {
                        const col = cc(act.excursion.categories?.[0]);
                        return (
                          <div key={act.id} className="act-card">
                            <div className="act-card-time">{act.customTime || slot.defaultTime}</div>
                            {act.excursion.photos?.[0] && (
                              <img src={act.excursion.photos[0]} alt="" className="act-card-img" />
                            )}
                            <div className="act-card-info">
                              <div className="act-card-title">{act.excursion.title}</div>
                              <div className="act-card-meta">
                                <span className="act-meta-item"><Clock size={8} />{act.excursion.duration_hours}h</span>
                                {act.excursion.rating > 0 && (
                                  <span className="act-meta-item">
                                    <Star size={8} color="#F59E0B" fill="#F59E0B" />{act.excursion.rating}
                                  </span>
                                )}
                              </div>
                              {act.note && (
                                <div className="act-card-note"><FileText size={8} />{act.note}</div>
                              )}
                            </div>
                            <span className="act-card-price" style={{ color: col }}>
                              {act.excursion.price_per_person} TND
                            </span>
                            <div className="act-actions">
                              <button className="act-action-btn note"
                                onClick={() => { setEditNote(act.id); setNoteText(act.note || ""); }}>
                                <FileText size={12} />
                              </button>
                              <button className="act-action-btn delete"
                                onClick={() => rmAct(activeDay, act.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {pendingExc && (
        <div className="modal-overlay" onClick={() => setPendingExc(null)}>
          <div className="slot-box" onClick={e => e.stopPropagation()}>
            <div className="slot-box-title">Programmer l'excursion</div>
            <p className="slot-box-sub">{pendingExc.title}</p>
            <p className="slot-box-info">
              🕐 Durée : {pendingExc.duration_hours}h · 💰 {pendingExc.price_per_person} TND
            </p>
            {currentDayDate && (
              <p className="slot-box-date">
                ✅ Disponible le {formatFr(currentDayDate, { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            {SLOTS.map(slot => (
              <div
                key={slot.key}
                className={`slot-option${pickSlot === slot.key ? " selected" : ""}`}
                onClick={() => {
                  setPickSlot(slot.key);
                  setPickTime(pendingExc.departure_time?.substring(0, 5) || slot.defaultTime);
                }}
              >
                <div className="slot-option-icon" style={{ background: `${slot.color}18` }}>{slot.icon}</div>
                <div className="slot-option-info">
                  <div className="slot-option-label" style={{ color: slot.color }}>{slot.label}</div>
                  <div className="slot-option-hint">{slot.hint}</div>
                </div>
                {pickSlot === slot.key && (
                  <input
                    type="time"
                    className="slot-time-input"
                    value={pickTime}
                    onChange={e => setPickTime(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                )}
              </div>
            ))}
            <div className="slot-box-actions">
              <button className="slot-cancel" onClick={() => setPendingExc(null)}>Annuler</button>
              <button className="slot-confirm" onClick={confirmAdd}>
                <CheckCircle2 size={13} /> Ajouter à l'itinéraire
              </button>
            </div>
          </div>
        </div>
      )}

      {editNote && (
        <div className="modal-overlay" onClick={() => setEditNote(null)}>
          <div className="note-box" onClick={e => e.stopPropagation()}>
            <div className="note-box-title">
              <FileText size={16} color="#2B96A8" /> Note personnelle
            </div>
            <textarea
              autoFocus
              className="note-textarea"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Ajoutez un rappel ou une information utile..."
              rows={3}
            />
            <div className="note-box-actions">
              <button className="note-cancel" onClick={() => setEditNote(null)}>Annuler</button>
              <button className="note-save" onClick={() => saveNote(activeDay, editNote)}>
                <CheckCircle2 size={13} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedExcursion && (
        <ExcursionDetailModal
          excursion={selectedExcursion}
          onClose={() => setSelectedExcursion(null)}
          onAdd={() => {
            const exc: Excursion = {
              id:               selectedExcursion.id,
              title:            selectedExcursion.title,
              city:             selectedExcursion.city,
              price_per_person: selectedExcursion.price_per_person,
              duration_hours:   selectedExcursion.duration_hours,
              rating:           selectedExcursion.rating,
              reviews_count:    selectedExcursion.reviews_count,
              categories:       selectedExcursion.categories,
              photos:           selectedExcursion.photos,
              departure_time:   selectedExcursion.depart_time ?? undefined,
              available_dates:  selectedExcursion.available_dates as AvailableDates,
            };
            openSlotPicker(exc);
            setSelectedExcursion(null);
          }}
        />
      )}

      {loadingDetails && <LoadingSpinner />}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <BuilderInner />
    </Suspense>
  );
}