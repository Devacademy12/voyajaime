"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TouristeNav from "@/app/components/touriste/TouristeNav";

import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Clock, Star,
  Trash2, FileText, Search, CheckCircle2,
  PiggyBank, Layers, BookMarked, ChevronLeft, ChevronRight,
  Loader2, Sunrise, Sun, Moon,
  Plus, CalendarDays, Edit3, X, Camera, Mountain,
  MapPinned, LocateFixed, Landmark, Compass, Building2,
  Trees, Waves, UtensilsCrossed, Tent, Bike, Ship,
  ShoppingBag, Sparkles, Music, AlertCircle, Heart, HelpCircle,
  CalendarCheck, List, Map,
} from "lucide-react";

import { ExcursionDetailModal } from "@/app/components/excursions/ExcursionDetailModal";
import { LoadingSpinner } from "@/app/components/excursions/LoadingSpinner";
import { ErrorDisplay } from "@/app/components/excursions/ErrorDisplay";
import ItinerarySummary, { SummaryDayPlan } from "@/app/components/itineraire/ItinerarySummary";
import { HelpPanel } from "@/app/components/itineraire/HelpPanel";

import s from "@/public/style/builder.module.css";

/* ─── Types ─────────────────────────────────────────────── */
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
  available_dates?: any;
  max_people?: number;
  difficulty?: string;
  min_age?: number;
};

type AvailableDateItem = {
  date: string;
  departure_time?: string;
  departure_times?: string[];
  time?: string;
  slots?: number;
};

type ExcursionDetail = {
  id: string; title: string; city: string; region: string | null;
  description: string; duration_hours: number; price_per_person: number;
  max_people: number; categories: string[]; languages: string[];
  inclusions: string[]; photos: string[]; rating: number;
  reviews_count: number; meeting_point: string | null;
  difficulty: string | null; min_age: number | null;
  what_to_bring: string | null; not_included: string | null;
  important_info: string | null; cancel_policy: string | null;
  available_dates: AvailableDateItem[] | null | undefined;
  depart_time: string | null;
};

type Categorie    = { id: string; nom: string; emoji: string; couleur: string };
type Ville        = { id: string; nom: string; emoji: string; region: string; description: string; active: boolean };
type TimeKey      = "matin" | "aprem" | "soir";
type ActivityItem = { id: string; excursion: Excursion; note: string; time: TimeKey; customTime?: string };
type DayPlan      = { city: string; date?: string; activities: ActivityItem[] };
type ViewStep     = "builder" | "result";
type MobileTab    = "itinerary" | "excursions";

type AvailableSlot = {
  date: string;
  slots?: number;
  departure_time?: string;
  departure_times?: string[];
};

/* ─── Category icons ─────────────────────────────────────── */
const getCategoryIcon = (name?: string) => {
  const map: Record<string, React.ReactNode> = {
    "Nature":      <Trees size={12} />,
    "Plage":       <Waves size={12} />,
    "Culture":     <Landmark size={12} />,
    "Histoire":    <Compass size={12} />,
    "Gastronomie": <UtensilsCrossed size={12} />,
    "Aventure":    <Tent size={12} />,
    "Sport":       <Bike size={12} />,
    "Mer":         <Ship size={12} />,
    "Désert":      <Sun size={12} />,
    "Montagne":    <Mountain size={12} />,
    "Ville":       <Building2 size={12} />,
    "Shopping":    <ShoppingBag size={12} />,
    "Bien-être":   <Sparkles size={12} />,
    "Soirée":      <Music size={12} />,
    "Excursion":   <Compass size={12} />,
  };
  return map[name || ""] || <MapPinned size={12} />;
};

const BRAND = "#2B96A8";

const SLOTS = [
  { key: "matin" as TimeKey, label: "Matin",       icon: <Sunrise size={13} />, color: "#F59E0B", hint: "8h — 12h",  defaultTime: "09:00" },
  { key: "aprem" as TimeKey, label: "Après-midi",  icon: <Sun     size={13} />, color: "#2B96A8", hint: "13h — 17h", defaultTime: "13:00" },
  { key: "soir"  as TimeKey, label: "Soir",        icon: <Moon    size={13} />, color: "#8B5CF6", hint: "18h — 22h", defaultTime: "19:00" },
];

/* ─── Helpers ────────────────────────────────────────────── */
function normalizeDate(d: string): string {
  if (!d) return "";
  return String(d).trim().substring(0, 10);
}

function getSlots(available_dates: any): AvailableSlot[] {
  if (!available_dates) return [];
  if (Array.isArray(available_dates)) {
    if (available_dates.length === 0) return [];
    const first = available_dates[0];
    if (typeof first === "object" && first !== null && "date" in first) {
      return available_dates.map((item: any) => ({
        date:            normalizeDate(item.date),
        slots:           item.slots,
        departure_time:  item.departure_time,
        departure_times: item.departure_times,
      }));
    }
    if (typeof first === "string") {
      return available_dates.map((d: string) => ({ date: normalizeDate(d) }));
    }
  }
  if (typeof available_dates === "object" && available_dates !== null) {
    if (available_dates.dates && Array.isArray(available_dates.dates)) {
      return available_dates.dates.map((d: any) =>
        typeof d === "string"
          ? { date: normalizeDate(d) }
          : { date: normalizeDate(d.date), slots: d.slots, departure_time: d.departure_time }
      );
    }
  }
  return [];
}

function toSummaryDays(itin: DayPlan[], selCities: string[]): SummaryDayPlan[] {
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
        available_dates:  act.excursion.available_dates,
      },
    })),
  }));
}

/* ══════════════════════════════════════════════════════════
   BuilderInner
══════════════════════════════════════════════════════════ */
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
  const [user,      setUser]      = useState<{ id: string } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [savedItId, setSavedItId] = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [view,      setView]      = useState<ViewStep>("builder");

  /* Mobile tab state */
  const [mobileTab, setMobileTab] = useState<MobileTab>("excursions");

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [villes,     setVilles]     = useState<Ville[]>([]);
  const [allExc,     setAllExc]     = useState<Excursion[]>([]);
  const [ldExc,      setLdExc]      = useState(true);
  const [errExc,     setErrExc]     = useState<string | null>(null);

  const [search,         setSearch]         = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
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

  const steps = [
    { label: "ITINÉRAIRE VOYAGE" },
    { label: "CONSTRUIRE L'ITINÉRAIRE" },
    { label: "ÉVALUER LES PROJETS" },
    { label: "CRÉER LES VOYAGES" }
  ];

  const [priceRange, setPriceRange] = useState(100);
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const formatDate = (d: string, opts?: Intl.DateTimeFormatOptions) => {
    const nd = normalizeDate(d);
    if (!nd) return "";
    const [y, m, day] = nd.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("fr-FR",
      opts || { day: "numeric", month: "long", year: "numeric" }
    );
  };

  const isExcursionAvailableOnDate = useCallback((excursion: Excursion, date: string): boolean => {
    const avail = excursion.available_dates;
    if (avail === null || avail === undefined) return true;
    const nd = normalizeDate(date);
    if (!nd) return true;
    if (Array.isArray(avail)) {
      if (avail.length === 0) return true;
      const first = avail[0];
      if (typeof first === "object" && first !== null && "date" in first)
        return avail.some((item: any) => normalizeDate(item.date) === nd);
      if (typeof first === "string")
        return avail.some((d: string) => normalizeDate(d) === nd);
      return true;
    }
    if (typeof avail === "object" && avail !== null) {
      if (Object.keys(avail).length === 0) return true;
      if (avail.dates && Array.isArray(avail.dates)) {
        if (avail.dates.length === 0) return true;
        return avail.dates.some((item: any) =>
          typeof item === "string" ? normalizeDate(item) === nd : normalizeDate(item.date) === nd
        );
      }
      if (avail.start && avail.end) {
        const ns = normalizeDate(avail.start);
        const ne = normalizeDate(avail.end);
        const inRange = nd >= ns && nd <= ne;
        if (avail.days && Array.isArray(avail.days) && avail.days.length > 0) {
          if (!inRange) return false;
          const [y, m, dd] = nd.split("-").map(Number);
          const daysFr = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
          return avail.days.includes(daysFr[new Date(y, m - 1, dd).getDay()]);
        }
        return inRange;
      }
      if (avail.days && Array.isArray(avail.days)) {
        if (avail.days.length === 0) return true;
        const [y, m, dd] = nd.split("-").map(Number);
        const daysFr = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
        return avail.days.includes(daysFr[new Date(y, m - 1, dd).getDay()]);
      }
    }
    return true;
  }, []);

  const hasAvailableDates = useCallback((excursion: Excursion): boolean => {
    const avail = excursion.available_dates;
    if (!avail) return false;
    if (Array.isArray(avail)) return avail.length > 0;
    if (typeof avail === "object" && avail !== null) {
      if (Object.keys(avail).length === 0) return false;
      if (avail.dates && Array.isArray(avail.dates)) return avail.dates.length > 0;
      if (avail.start && avail.end) return true;
      if (avail.days && Array.isArray(avail.days)) return avail.days.length > 0;
    }
    return false;
  }, []);

  const getAvailableDatesForExcursion = useCallback((excursion: Excursion): string[] => {
    const slots = getSlots(excursion.available_dates);
    if (slots.length > 0) return slots.map(ss => ss.date);
    const avail = excursion.available_dates;
    if (!avail || typeof avail !== "object" || Array.isArray(avail)) return [];
    if (avail.start && avail.end) {
      const dates: string[] = [];
      const [ys, ms, ds] = normalizeDate(avail.start).split("-").map(Number);
      const [ye, me, de] = normalizeDate(avail.end).split("-").map(Number);
      const cur = new Date(ys, ms - 1, ds);
      const end = new Date(ye, me - 1, de);
      const daysFr = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
      while (cur <= end) {
        if (avail.days?.length > 0) {
          if (avail.days.includes(daysFr[cur.getDay()])) dates.push(cur.toISOString().split("T")[0]);
        } else {
          dates.push(cur.toISOString().split("T")[0]);
        }
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    }
    return [];
  }, []);

  const isTimeSlotAvailable = useCallback((dayIdx: number, startTime: string, durationHours: number): boolean => {
    const acts = itin[dayIdx]?.activities || [];
    const ns   = toMinutes(startTime);
    const ne   = ns + durationHours * 60;
    for (const act of acts) {
      const as = toMinutes(act.customTime || SLOTS.find(ss => ss.key === act.time)?.defaultTime || "09:00");
      const ae = as + act.excursion.duration_hours * 60;
      if (!(ne <= as || ns >= ae)) return false;
    }
    return true;
  }, [itin]);

  const getDepartureTimeForDate = useCallback((excursion: Excursion, date: string): string | undefined => {
    const slots = getSlots(excursion.available_dates);
    const nd    = normalizeDate(date);
    const slot  = slots.find(ss => ss.date === nd);
    return slot?.departure_time || excursion.departure_time;
  }, []);

  /* ── Load data ── */
  const loadAll = async () => {
    setLdExc(true);
    try {
      const [cR, vR, eR] = await Promise.all([
        sb.from("categories").select("*").order("nom"),
        sb.from("villes").select("*").eq("active", true).order("nom"),
        sb.from("excursions").select("*").eq("is_active", true).order("rating", { ascending: false }),
      ]);
      setCategories((cR.data || []) as Categorie[]);
      setVilles((vR.data || []) as Ville[]);
      if (eR.error) setErrExc(eR.error.message);
      else          setAllExc((eR.data || []) as Excursion[]);
    } catch (err) {
      console.error(err);
      setErrExc("Erreur lors du chargement des données");
    } finally {
      setLdExc(false);
    }
  };

  useEffect(() => {
    loadAll();
    setItin(Array.from({ length: days }, (_, i) => ({
      city:       selCities[i % selCities.length] || selCities[0] || "",
      activities: [],
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      setUser({ id: user.id });

      const { data: favs } = await sb
        .from("favoris")
        .select("excursion_id")
        .eq("touriste_id", user.id);
      if (favs) setFavorites(new Set(favs.map(f => f.excursion_id)));

      const { data } = await sb
        .from("itineraires").select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1).maybeSingle();
      if (data) setSavedItId(data.id);
    });
  }, [sb]);

  const currentDayCity = useMemo(() => itin[activeDay]?.city || "", [itin, activeDay]);
  const currentDayDate = useMemo(() => itin[activeDay]?.date,        [itin, activeDay]);

  const palette = useMemo(() => {
    const q = search.toLowerCase();
    let list = allExc.filter(e => {
      const matchSearch   = !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
      const matchCity     = !currentDayCity || e.city.toLowerCase() === currentDayCity.toLowerCase();
      const matchPrice    = e.price_per_person <= priceRange;
      const matchCategory = selectedCategory === "all" || e.categories?.includes(selectedCategory);
      
      let matchDuration = true;
      if (selectedDuration === "short") matchDuration = e.duration_hours <= 3;
      else if (selectedDuration === "medium") matchDuration = e.duration_hours > 3 && e.duration_hours <= 6;
      else if (selectedDuration === "long") matchDuration = e.duration_hours > 6;

      return matchSearch && matchCity && matchPrice && matchCategory && matchDuration;
    });

    if (currentDayDate && showOnlyAvailable) {
      list = list.filter(e => isExcursionAvailableOnDate(e, currentDayDate));
    }
    return list;
  }, [allExc, currentDayCity, search, priceRange, selectedCategory, selectedDuration, currentDayDate, showOnlyAvailable, isExcursionAvailableOnDate]);

  const availableCount = useMemo(
    () => currentDayDate
      ? palette.filter(e => isExcursionAvailableOnDate(e, currentDayDate)).length
      : palette.length,
    [palette, currentDayDate, isExcursionAvailableOnDate],
  );

  const totAct    = itin.reduce((acc, d) => acc + (d.activities?.length || 0), 0);
  const totBudget = itin.reduce((acc, d) =>
    acc + (d.activities?.reduce((ss, a) => ss + (a.excursion?.price_per_person || 0), 0) || 0), 0);
  const isAdded   = (id: string) => (itin[activeDay]?.activities || []).some(a => a.excursion.id === id);

  const toast = (msg: string) => {
    setShowSuccessMsg(msg);
    setTimeout(() => setShowSuccessMsg(null), 3000);
  };

  const openSlotPicker = (exc: Excursion) => {
    if (currentDayDate) {
      if (!isExcursionAvailableOnDate(exc, currentDayDate)) {
        const dispo = getAvailableDatesForExcursion(exc);
        if (dispo.length > 0) {
          alert(
            `⚠️ "${exc.title}" n'est pas disponible le ${formatDate(currentDayDate)}.\n\n` +
            `📅 Prochaines dates : ${dispo.slice(0, 5).map(d => formatDate(d)).join(", ")}` +
            (dispo.length > 5 ? "…" : "")
          );
        } else {
          alert(`⚠️ "${exc.title}" n'est pas disponible à cette date.`);
        }
        return;
      }
    }
    const depTime = currentDayDate
      ? getDepartureTimeForDate(exc, currentDayDate)
      : exc.departure_time;
    setPendingExc(exc);
    setPickSlot("matin");
    setPickTime(depTime?.substring(0, 5) || "09:00");
  };

  const confirmAdd = () => {
    if (!pendingExc) return;
    if (currentDayDate && !isExcursionAvailableOnDate(pendingExc, currentDayDate)) {
      alert(`❌ "${pendingExc.title}" n'est plus disponible à cette date.`);
      setPendingExc(null);
      return;
    }
    if (!isTimeSlotAvailable(activeDay, pickTime, pendingExc.duration_hours)) {
      alert("❌ Conflit d'horaires avec une autre activité.");
      return;
    }
    setItin(prev => {
      const n = [...prev];
      n[activeDay] = {
        ...n[activeDay],
        activities: [
          ...n[activeDay].activities,
          { id: `${Date.now()}-${Math.random()}`, excursion: pendingExc, note: "", time: pickSlot, customTime: pickTime },
        ],
      };
      return n;
    });
    toast(`✓ "${pendingExc.title}" ajouté à votre itinéraire`);
    setPendingExc(null);
  };

  const rmAct = (dayIdx: number, id: string) => {
    setItin(prev => {
      const n   = [...prev];
      const act = n[dayIdx].activities.find(a => a.id === id);
      n[dayIdx] = { ...n[dayIdx], activities: n[dayIdx].activities.filter(a => a.id !== id) };
      if (act) toast(`✗ "${act.excursion.title}" retiré`);
      return n;
    });
  };

  const saveNote = (dayIdx: number, id: string) => {
    setItin(prev => {
      const n = [...prev];
      n[dayIdx] = {
        ...n[dayIdx],
        activities: n[dayIdx].activities.map(a => a.id === id ? { ...a, note: noteText } : a),
      };
      return n;
    });
    setEditNote(null);
    setNoteText("");
  };

  const saveItinerary = async () => {
    if (!userId) { alert("Vous devez être connecté"); return; }
    setSaving(true);
    const payload = {
      user_id: userId,
      nb_jours: days,
      villes_selectionnees: selCities,
      categories_selectionnees: [],
      plan: itin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await sb.from("itineraires")
        .insert(payload)
        .select().single();
      
      if (error) throw error;
      if (data) setSavedItId(data.id);
      setSaveOk(true);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /* ── Date Picker Modal ── */
  const DatePickerModal = () => {
    const today = normalizeDate(new Date().toISOString());
    const [sel, setSel] = useState(currentDayDate ? normalizeDate(currentDayDate) : "");
    const handleConfirm = () => {
      if (!sel) return;
      const nd = normalizeDate(sel);
      setItin(prev => {
        const n = [...prev];
        n[activeDay] = {
          ...n[activeDay],
          date: nd,
          activities: n[activeDay].activities.filter(act => isExcursionAvailableOnDate(act.excursion, nd)),
        };
        return n;
      });
      setShowDatePicker(false);
      toast(`📅 Date fixée au ${formatDate(nd)}`);
    };
    return (
      <div className={s.overlay} onClick={() => setShowDatePicker(false)}>
        <div className={s.datePicker} onClick={e => e.stopPropagation()}>
          <div className={s.datePickerHeader}>
            <h3 className={s.datePickerTitle}>Choisir la date de visite</h3>
            <button className={s.closeBtn} onClick={() => setShowDatePicker(false)}>
              <X size={16} />
            </button>
          </div>
          <p className={s.datePickerHint}>
            <MapPin size={12} /> {currentDayCity}
          </p>
          <input
            type="date" className={s.dateInput}
            value={sel} min={today}
            onChange={e => setSel(e.target.value)}
          />
          <div className={s.dateActions}>
            <button className={s.cancelBtn} onClick={() => setShowDatePicker(false)}>Annuler</button>
            <button className={s.confirmBtn} onClick={handleConfirm} disabled={!sel}>
              <CheckCircle2 size={13} /> Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentStep = useMemo(() => {
    if (saveOk) return 3;
    if (view === "result") return 2;
    return 1;
  }, [view, saveOk]);

  const currentDay = itin[activeDay];

  /* ─── Mobile day selector strip ─── */
  const MobileDayStrip = () => (
    <div style={{
      display: "flex",
      overflowX: "auto",
      gap: "0.5rem",
      padding: "0.75rem 1rem",
      background: "#fff",
      borderBottom: "1px solid #E5E7EB",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    }}>
      {itin.map((day, dIdx) => (
        <button
          key={dIdx}
          onClick={() => {
            setActiveDay(dIdx);
            setMobileTab("excursions");
          }}
          style={{
            flexShrink: 0,
            padding: "0.4rem 0.85rem",
            borderRadius: "999px",
            border: activeDay === dIdx ? `2px solid ${BRAND}` : "2px solid #E5E7EB",
            background: activeDay === dIdx ? `${BRAND}12` : "#F9FAFB",
            color: activeDay === dIdx ? BRAND : "#6B7280",
            fontWeight: activeDay === dIdx ? 700 : 500,
            fontSize: "0.72rem",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            minWidth: "60px",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>J{dIdx + 1}</span>
          <span style={{ fontSize: "0.7rem", maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {day.city}
          </span>
          {day.activities.length > 0 && (
            <span style={{
              background: BRAND,
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.55rem",
              padding: "1px 5px",
              fontWeight: 700,
            }}>
              {day.activities.length} act.
            </span>
          )}
        </button>
      ))}
      <button
        onClick={() => setItin(prev => [...prev, { city: prev[prev.length-1]?.city || "", activities: [] }])}
        style={{
          flexShrink: 0,
          padding: "0.4rem 0.75rem",
          borderRadius: "999px",
          border: `2px dashed ${BRAND}`,
          background: "transparent",
          color: BRAND,
          fontSize: "0.72rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minWidth: "60px",
        }}
      >
        <Plus size={12} /> Jour
      </button>
    </div>
  );

  /* ─── Mobile bottom tab bar ─── */
  const MobileTabBar = () => (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: "flex",
      background: "#fff",
      borderTop: "1px solid #E5E7EB",
      zIndex: 100,
      boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
    }}>
      <button
        onClick={() => setMobileTab("excursions")}
        style={{
          flex: 1,
          padding: "0.7rem 0.5rem",
          border: "none",
          background: "transparent",
          color: mobileTab === "excursions" ? BRAND : "#9CA3AF",
          fontWeight: mobileTab === "excursions" ? 700 : 500,
          fontSize: "0.68rem",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          borderTop: mobileTab === "excursions" ? `2px solid ${BRAND}` : "2px solid transparent",
          transition: "all 0.2s",
        }}
      >
        <Search size={18} />
        Excursions
      </button>
      <button
        onClick={() => setMobileTab("itinerary")}
        style={{
          flex: 1,
          padding: "0.7rem 0.5rem",
          border: "none",
          background: "transparent",
          color: mobileTab === "itinerary" ? BRAND : "#9CA3AF",
          fontWeight: mobileTab === "itinerary" ? 700 : 500,
          fontSize: "0.68rem",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          borderTop: mobileTab === "itinerary" ? `2px solid ${BRAND}` : "2px solid transparent",
          transition: "all 0.2s",
          position: "relative",
        }}
      >
        <List size={18} />
        Itinéraire
        {totAct > 0 && (
          <span style={{
            position: "absolute",
            top: "6px",
            right: "calc(50% - 18px)",
            background: BRAND,
            color: "#fff",
            borderRadius: "999px",
            fontSize: "0.55rem",
            padding: "1px 5px",
            fontWeight: 700,
          }}>
            {totAct}
          </span>
        )}
      </button>
      <button
        onClick={() => setView("result")}
        style={{
          flex: 1,
          padding: "0.7rem 0.5rem",
          border: "none",
          background: BRAND,
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.68rem",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          transition: "all 0.2s",
        }}
      >
        <ArrowRight size={18} />
        Résumé
      </button>
    </div>
  );

  /* ─── Mobile itinerary panel ─── */
  const MobileItineraryPanel = () => (
    <div style={{ padding: "1rem", paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          JOUR {activeDay + 1} — {itin[activeDay]?.city}
        </h2>
        <button
          onClick={() => setShowDatePicker(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0.35rem 0.75rem",
            borderRadius: "999px",
            border: `1px solid ${BRAND}`,
            background: "transparent",
            color: BRAND,
            fontSize: "0.68rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Calendar size={11} />
          {itin[activeDay]?.date ? formatDate(itin[activeDay].date!, { day: "numeric", month: "short" }) : "FIXER DATE"}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        marginBottom: "1.25rem",
        padding: "0.75rem",
        background: "#F9FAFB",
        borderRadius: "10px",
        border: "1px solid #E5E7EB",
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: BRAND }}>{totAct}</div>
          <div style={{ fontSize: "0.62rem", color: "#6B7280" }}>activités</div>
        </div>
        <div style={{ width: "1px", background: "#E5E7EB" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10B981" }}>{totBudget}€</div>
          <div style={{ fontSize: "0.62rem", color: "#6B7280" }}>budget</div>
        </div>
        <div style={{ width: "1px", background: "#E5E7EB" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#8B5CF6" }}>{days}</div>
          <div style={{ fontSize: "0.62rem", color: "#6B7280" }}>jours</div>
        </div>
      </div>

      {/* Activities for current day */}
      {(itin[activeDay]?.activities?.length ?? 0) === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem 1rem",
          color: "#9CA3AF",
          border: "2px dashed #E5E7EB",
          borderRadius: "12px",
        }}>
          <Search size={32} style={{ marginBottom: "0.75rem", opacity: 0.4 }} />
          <p style={{ fontSize: "0.85rem", margin: 0 }}>Aucune activité pour ce jour</p>
          <p style={{ fontSize: "0.72rem", marginTop: "0.5rem" }}>Allez dans l'onglet Excursions pour en ajouter</p>
          <button
            onClick={() => setMobileTab("excursions")}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.25rem",
              background: BRAND,
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Explorer les excursions
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {itin[activeDay]?.activities.map((act) => (
            <div key={act.id} style={{
              display: "flex",
              gap: "0.75rem",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {act.excursion.photos?.[0] && (
                <img
                  src={act.excursion.photos[0]}
                  alt={act.excursion.title}
                  style={{ width: "80px", objectFit: "cover", flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, padding: "0.75rem 0.75rem 0.75rem 0", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: BRAND, fontWeight: 600, marginBottom: "2px" }}>
                      {act.customTime || "09:00"}
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                      {act.excursion.title}
                    </div>
                  </div>
                  <button
                    onClick={() => rmAct(activeDay, act.id)}
                    style={{
                      flexShrink: 0,
                      padding: "0.3rem",
                      background: "#FEF2F2",
                      border: "none",
                      borderRadius: "6px",
                      color: "#EF4444",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.4rem", fontSize: "0.68rem", color: "#6B7280" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={10} /> {act.excursion.duration_hours}h
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <PiggyBank size={10} /> {act.excursion.price_per_person}€
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All days overview */}
      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6B7280", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
          TOUS LES JOURS
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {itin.map((day, dIdx) => (
            <div
              key={dIdx}
              onClick={() => { setActiveDay(dIdx); setMobileTab("excursions"); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.65rem 1rem",
                background: dIdx === activeDay ? `${BRAND}10` : "#F9FAFB",
                border: dIdx === activeDay ? `1px solid ${BRAND}40` : "1px solid #E5E7EB",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "28px", height: "28px",
                  borderRadius: "50%",
                  background: dIdx === activeDay ? BRAND : "#E5E7EB",
                  color: dIdx === activeDay ? "#fff" : "#6B7280",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700,
                }}>
                  {dIdx + 1}
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#111827" }}>{day.city}</div>
                  {day.date && (
                    <div style={{ fontSize: "0.62rem", color: "#6B7280" }}>
                      {formatDate(day.date, { day: "numeric", month: "short" })}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {day.activities.length > 0 && (
                  <span style={{
                    background: BRAND,
                    color: "#fff",
                    borderRadius: "999px",
                    fontSize: "0.6rem",
                    padding: "2px 7px",
                    fontWeight: 700,
                  }}>
                    {day.activities.length}
                  </span>
                )}
                <ChevronRight size={14} color="#9CA3AF" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─── Mobile excursions panel ─── */
  const MobileExcursionsPanel = () => (
    <div style={{ paddingBottom: "5rem" }}>
      {/* Context bar */}
      <div style={{
        padding: "0.6rem 1rem",
        background: `${BRAND}08`,
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: BRAND, fontWeight: 600 }}>
          <MapPin size={12} /> {currentDay?.city}
          {currentDay?.date && (
            <> · <Calendar size={12} /> {formatDate(currentDay.date, { day: "numeric", month: "short" })}</>
          )}
        </div>
        {currentDay?.date && (
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.65rem", cursor: "pointer", color: BRAND, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={e => setShowOnlyAvailable(e.target.checked)}
            />
            Disponibles · {availableCount}/{palette.length}
          </label>
        )}
      </div>

      {/* Filters — horizontally scrollable */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        borderBottom: "1px solid #E5E7EB",
        alignItems: "center",
      }}>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{
            flexShrink: 0,
            padding: "0.4rem 0.65rem",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            background: "#fff",
            fontSize: "0.7rem",
            color: "#374151",
            cursor: "pointer",
          }}
        >
          <option value="all">Catégorie</option>
          {categories.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
        </select>

        <select
          value={selectedDuration}
          onChange={e => setSelectedDuration(e.target.value)}
          style={{
            flexShrink: 0,
            padding: "0.4rem 0.65rem",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            background: "#fff",
            fontSize: "0.7rem",
            color: "#374151",
            cursor: "pointer",
          }}
        >
          <option value="all">Durée</option>
          <option value="short">≤ 3h</option>
          <option value="medium">3–6h</option>
          <option value="long">&gt; 6h</option>
        </select>

        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 0.65rem",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
          background: "#fff",
          fontSize: "0.7rem",
          color: "#374151",
          minWidth: "130px",
        }}>
          <span style={{ whiteSpace: "nowrap" }}>≤ {priceRange}€</span>
          <input
            type="range" min="0" max="500" step="10"
            value={priceRange}
            onChange={e => setPriceRange(Number(e.target.value))}
            style={{ width: "70px", accentColor: BRAND }}
          />
        </div>

        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 0.65rem",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
          background: "#fff",
          minWidth: "130px",
        }}>
          <Search size={12} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: "0.7rem",
              color: "#374151",
              width: "100%",
              background: "transparent",
            }}
          />
        </div>
      </div>

      {/* Cards — vertical list on mobile */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.75rem 1rem" }}>
        {ldExc ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              height: "100px",
              borderRadius: "12px",
              background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }} />
          ))
        ) : palette.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9CA3AF" }}>
            <p>Aucune excursion trouvée.</p>
          </div>
        ) : (
          palette.map(exc => (
            <div
              key={exc.id}
              onClick={() => loadExcursionDetails(exc.id)}
              style={{
                display: "flex",
                gap: "0.75rem",
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ width: "90px", flexShrink: 0, position: "relative", background: "#F3F4F6" }}>
                {exc.photos?.[0] ? (
                  <img src={exc.photos[0]} alt={exc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={24} color="#D1D5DB" />
                  </div>
                )}
                {currentDay?.date && (
                  <div style={{
                    position: "absolute",
                    top: "6px",
                    left: "6px",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    background: isExcursionAvailableOnDate(exc, currentDay.date) ? "#D1FAE5" : "#FEE2E2",
                    color: isExcursionAvailableOnDate(exc, currentDay.date) ? "#059669" : "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}>
                    {isExcursionAvailableOnDate(exc, currentDay.date)
                      ? <><CheckCircle2 size={8} /> OK</>
                      : <><AlertCircle size={8} /> Indispo</>
                    }
                  </div>
                )}
              </div>

              <div style={{ flex: 1, padding: "0.75rem 0.75rem 0.75rem 0", minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111827", lineHeight: 1.3, marginBottom: "0.35rem" }}>
                  {exc.title}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.65rem", color: "#6B7280", marginBottom: "0.5rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={10} /> {exc.duration_hours > 0 ? `${exc.duration_hours}h` : "Variable"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <MapPin size={10} /> {exc.city}
                  </span>
                  {exc.rating > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <Star size={10} color="#F59E0B" fill="#F59E0B" /> {exc.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: BRAND }}>
                    {exc.price_per_person},00 €
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); openSlotPicker(exc); }}
                    style={{
                      padding: "0.35rem 0.85rem",
                      background: BRAND,
                      color: "#fff",
                      border: "none",
                      borderRadius: "999px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <>
      <TouristeNav favCount={favorites.size} isLoggedIn={!!user} />
      <div style={{ paddingTop: 64 }} />

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        /* ── Desktop layout ── */
        .builder-desktop-layout {
          display: flex;
          gap: 1.5rem;
        }
        .builder-itinerary-panel {
          width: 320px;
          flex-shrink: 0;
        }
        .builder-excursions-panel {
          flex: 1;
          min-width: 0;
        }
        .builder-mobile-day-strip  { display: none; }
        .builder-mobile-tab-bar    { display: none; }
        .builder-mobile-itinerary  { display: none; }
        .builder-mobile-excursions { display: none; }
        .builder-mobile-summary-btn { display: none; }

        /* ── Mobile layout (≤ 768px) ── */
        @media (max-width: 768px) {
          .builder-desktop-layout   { display: none !important; }
          .builder-mobile-day-strip  { display: block; }
          .builder-mobile-tab-bar    { display: flex; }
          .builder-mobile-itinerary  { display: block; }
          .builder-mobile-excursions { display: block; }
          .builder-mobile-summary-btn { display: flex; }

          /* Compact stepper on mobile */
          .builder-stepper-label { display: none; }
          .builder-stepper-container {
            padding: 0.5rem 1rem !important;
          }

          /* Header */
          .builder-header-title {
            font-size: 1rem !important;
            padding: 0.75rem 1rem 0 !important;
          }

          /* Success view */
          .builder-success-box {
            margin: 1rem !important;
            padding: 1.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .builder-header-title {
            font-size: 0.9rem !important;
          }
        }
      `}</style>

      <div className={s.root}>
        {showDatePicker && <DatePickerModal />}

        {/* Toast */}
        {showSuccessMsg && (
          <div className={s.toast}>
            <CheckCircle2 size={14} color={BRAND} />
            {showSuccessMsg}
          </div>
        )}

        {/* ══ HEADER ══ */}
        <h1 className={`${s.headerTitle} builder-header-title`}>
          Créer votre itinéraire de voyage
        </h1>

        {/* ══ STEPPER ══ */}
        <div className={`${s.stepperContainer} builder-stepper-container`}>
          <div className={s.stepper}>
            {steps.map((step, idx) => (
              <div key={idx} className={`${s.step} ${idx === currentStep ? s.stepActive : ""} ${idx < currentStep ? s.stepCompleted : ""}`}>
                <div className={s.stepCircle}>
                  {idx < currentStep ? <CheckCircle2 size={12} /> : null}
                </div>
                <span className={`${s.stepLabel} builder-stepper-label`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SAVE OK ══ */}
        {saveOk ? (
          <div className={`${s.successView} builder-success-box`}>
            <div className={s.successBox}>
              <div className={s.successIcon}>
                <CheckCircle2 size={48} color={BRAND} />
              </div>
              <h2 className={s.successTitle}>Itinéraire sauvegardé avec succès !</h2>
              <p className={s.successDesc}>
                Votre projet de voyage a été enregistré dans votre espace personnel.
                Vous pouvez maintenant le consulter, le modifier ou procéder à la réservation finale.
              </p>
              <div className={s.successActions}>
                <button className={s.primaryBtn} onClick={() => router.push("/touriste/itineraires")}>
                  VOIR MES ITINÉRAIRES
                </button>
                <button className={s.secondaryBtn} onClick={() => setSaveOk(false)}>
                  RETOURNER AU PATRIMOINE
                </button>
              </div>
            </div>
          </div>

        /* ══ RESULT / SUMMARY ══ */
        ) : view === "result" ? (
          <div className={s.summaryWrapper}>
            <ItinerarySummary
              days={toSummaryDays(itin, selCities)}
              nbJours={days}
              selCities={selCities}
              saving={saving}
              saveOk={saveOk}
              savedItId={savedItId}
              onBack={() => setView("builder")}
              onEdit={() => { setSaveOk(false); setView("builder"); }}
              onSave={saveItinerary}
            />
          </div>

        ) : (
          <>
            {/* ══════════════════════════════════
                DESKTOP LAYOUT
            ══════════════════════════════════ */}
            <div className={`${s.layoutMain} builder-desktop-layout`}>

              {/* LEFT: ITINERARY */}
              <div className={`${s.itineraryPanel} builder-itinerary-panel`}>
                <h2 className={s.panelTitle}>VOTRE ITINÉRAIRE JOUR PAR JOUR</h2>

                <div className={s.itineraryTimeline}>
                  {itin.map((day, dIdx) => (
                    <div key={dIdx} className={`${s.timelineItem} ${activeDay === dIdx ? s.timelineItemActive : ""}`}>
                      <div className={s.timelineDot} />
                      <div className={s.dayHeader}>
                        <div className={s.dayTitle}>
                          JOUR {dIdx + 1}
                          <span className={s.dayCityName}>{day.city}</span>
                          {day.date && (
                            <span className={s.dayDatePill} onClick={e => { e.stopPropagation(); setActiveDay(dIdx); setShowDatePicker(true); }}>
                              {formatDate(day.date, { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        <div className={s.dayHeaderActions}>
                          {!day.date && (
                            <button className={s.dayDateBtnSmall} onClick={e => { e.stopPropagation(); setActiveDay(dIdx); setShowDatePicker(true); }}>
                              <Calendar size={10} /> FIXER DATE
                            </button>
                          )}
                          <button className={s.dayAddBtn} onClick={e => {
                            e.stopPropagation();
                            setItin(prev => [...prev, { city: prev[prev.length - 1]?.city || "", activities: [] }]);
                          }}>
                            <Plus size={10} /> AJOUTER UN JOUR
                          </button>
                        </div>
                      </div>

                      <div className={s.activitySlots}>
                        {day.activities.length === 0 ? (
                          <>
                            <div className={s.activitySlot} onClick={() => setActiveDay(dIdx)}>Ajouter une excursion</div>
                            <div className={s.activitySlot} onClick={() => setActiveDay(dIdx)}>Ajouter une excursion</div>
                          </>
                        ) : (
                          <>
                            {day.activities.map(act => (
                              <div key={act.id} className={s.actCard} onClick={() => setActiveDay(dIdx)}>
                                <div className={s.actTime}>{act.customTime || "09:00"}</div>
                                {act.excursion.photos?.[0] && (
                                  <img src={act.excursion.photos[0]} alt="" className={s.actImg} />
                                )}
                                <div className={s.actInfo} style={{ flex: 1 }}>
                                  <div className={s.actTitle} style={{ fontSize: "0.75rem", fontWeight: 600 }}>{act.excursion.title}</div>
                                </div>
                                <div className={s.actActions}>
                                  <button className={s.actActionDelete} onClick={e => { e.stopPropagation(); rmAct(dIdx, act.id); }}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <div className={s.activitySlot} onClick={() => setActiveDay(dIdx)}>Ajouter une excursion</div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: EXCURSIONS */}
              <div className={`${s.excursionsPanel} builder-excursions-panel`}>
                <div className={s.panelTop}>
                  <h2 className={s.panelTitle}>EXPLORER LES EXCURSIONS</h2>
                  <button className={s.saveBtnFixed} onClick={() => setView("result")}>
                    <ArrowRight size={14} /> VOIR LE RÉSUMÉ
                  </button>
                </div>

                <div className={s.filterHeaderRow}>
                  <div className={s.dayContext}>
                    <MapPin size={12} /> {currentDay?.city}
                    {currentDay?.date && (
                      <>
                        <Calendar size={12} style={{ marginLeft: "4px" }} />
                        {formatDate(currentDay.date, { day: "numeric", month: "long" })}
                      </>
                    )}
                  </div>
                  {currentDay?.date && (
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", cursor: "pointer", color: BRAND, fontWeight: 600 }}>
                        <input type="checkbox" checked={showOnlyAvailable} onChange={e => setShowOnlyAvailable(e.target.checked)} />
                        DISPONIBLES UNIQUEMENT
                      </label>
                      <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 500 }}>
                        {availableCount} / {palette.length} disponibles
                      </div>
                    </div>
                  )}
                </div>

                <div className={s.filtersRow} style={{ marginBottom: "1.5rem" }}>
                  <select className={s.filterSelect} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="all">Categorie</option>
                    {categories.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                  </select>
                  <select className={s.filterSelect} value={selectedDuration} onChange={e => setSelectedDuration(e.target.value)}>
                    <option value="all">Durée</option>
                    <option value="short">Courte (≤ 3h)</option>
                    <option value="medium">Moyenne (3-6h)</option>
                    <option value="long">Longue ({">"} 6h)</option>
                  </select>
                  <div className={s.priceFilter}>
                    <div className={s.priceRangeLabel}>Prix: {priceRange} EUR</div>
                    <input type="range" min="0" max="500" step="10" className={s.rangeInput} value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} />
                  </div>
                  <div className={s.searchExcursion}>
                    <input type="text" className={s.searchInputMatch} placeholder="Rechercher" value={search} onChange={e => setSearch(e.target.value)} />
                    <Search size={14} className={s.searchIconMatch} />
                  </div>
                </div>

                <div className={s.gridMatch}>
                  {ldExc ? (
                    Array.from({ length: 6 }).map((_, i) => <div key={i} className={s.skeletonMatch} />)
                  ) : palette.length === 0 ? (
                    <div className={s.emptyState} style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem" }}>
                      <p style={{ color: "#9CA3AF" }}>Aucune excursion trouvée pour ces critères.</p>
                    </div>
                  ) : (
                    palette.map(exc => (
                      <div key={exc.id} className={s.cardMatch} onClick={() => loadExcursionDetails(exc.id)}>
                        <div className={s.cardImageMatch}>
                          {exc.photos?.[0] ? (
                            <img src={exc.photos[0]} alt={exc.title} />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <Camera size={32} className="text-slate-300" />
                            </div>
                          )}
                          {currentDay?.date && (
                            <div className={`${s.availabilityBadge} ${isExcursionAvailableOnDate(exc, currentDay.date) ? s.availOk : s.availKo}`}>
                              {isExcursionAvailableOnDate(exc, currentDay.date)
                                ? <><CheckCircle2 size={10} /> Disponible</>
                                : <><AlertCircle size={10} /> Indisponible</>
                              }
                            </div>
                          )}
                        </div>
                        <div className={s.cardInfoMatch}>
                          <h3 className={s.cardTitleMatch}>{exc.title}</h3>
                          <p className={s.cardDescMatch}>Découvrez cette magnifique excursion à {exc.city}. Profitez d'une expérience unique en Tunisie.</p>
                          <div className={s.cardMetaMatch}>
                            <span className="flex items-center gap-1"><Clock size={12} /> {exc.duration_hours > 0 ? `${exc.duration_hours} h` : "Durée variable"}</span>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {exc.city}</span>
                          </div>
                          <div className={s.cardFooterMatch}>
                            <span className={s.priceMatch}>{exc.price_per_person},00 €</span>
                            <button className={s.addBtnMatch} onClick={e => { e.stopPropagation(); openSlotPicker(exc); }}>
                              + AJOUTER
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════
                MOBILE LAYOUT
            ══════════════════════════════════ */}

            {/* Day selector strip */}
            <div className="builder-mobile-day-strip">
              <MobileDayStrip />
            </div>

            {/* Tab panels */}
            <div className="builder-mobile-itinerary" style={{ display: mobileTab === "itinerary" ? "block" : "none" }}>
              <MobileItineraryPanel />
            </div>
            <div className="builder-mobile-excursions" style={{ display: mobileTab === "excursions" ? "block" : "none" }}>
              <MobileExcursionsPanel />
            </div>

            {/* Bottom tab bar */}
            <div className="builder-mobile-tab-bar">
              <MobileTabBar />
            </div>
          </>
        )}

        {/* ══ Modal Slot Picker ══ */}
        {pendingExc && (
          <div className={s.overlay} onClick={() => setPendingExc(null)}>
            <div className={s.slotBox} onClick={e => e.stopPropagation()} style={{ margin: "0 1rem", maxWidth: "420px", width: "100%" }}>
              <div className={s.slotBoxTitle}>Programmer l'excursion</div>
              <p className={s.slotBoxExcTitle}>{pendingExc.title}</p>
              <p className={s.slotBoxMeta}>
                <Clock size={11} /> {pendingExc.duration_hours}h
                <span style={{ margin: "0 .35rem", color: "#D1D5DB" }}>·</span>
                <PiggyBank size={11} /> {pendingExc.price_per_person} EUR
              </p>
              {currentDayDate && (
                <div className={s.slotDateConfirm}>
                  <CheckCircle2 size={12} color={BRAND} />
                  Disponible le {formatDate(currentDayDate)}
                </div>
              )}
              {SLOTS.map(slot => (
                <div
                  key={slot.key}
                  className={`${s.slotOption} ${pickSlot === slot.key ? s.slotOptionSel : ""}`}
                  style={pickSlot === slot.key ? { borderColor: slot.color } : {}}
                  onClick={() => {
                    setPickSlot(slot.key);
                    const depTime = currentDayDate
                      ? getDepartureTimeForDate(pendingExc, currentDayDate)
                      : pendingExc.departure_time;
                    setPickTime(depTime?.substring(0, 5) || slot.defaultTime);
                  }}
                >
                  <div className={s.slotOptionIcon} style={{ background: `${slot.color}18` }}>
                    {React.cloneElement(slot.icon as React.ReactElement, { size: 14, color: slot.color })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className={s.slotOptionLabel} style={{ color: slot.color }}>{slot.label}</div>
                    <div className={s.slotOptionHint}>{slot.hint}</div>
                  </div>
                  {pickSlot === slot.key && (
                    <input
                      type="time" className={s.timeInput}
                      value={pickTime}
                      onChange={e => setPickTime(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                </div>
              ))}
              <div className={s.slotActions}>
                <button className={s.cancelBtn} onClick={() => setPendingExc(null)}>Annuler</button>
                <button className={s.confirmBtn} onClick={confirmAdd}>
                  <CheckCircle2 size={13} /> Ajouter à l'itinéraire
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Modal Note ══ */}
        {editNote && (
          <div className={s.overlay} onClick={() => setEditNote(null)}>
            <div className={s.noteBox} onClick={e => e.stopPropagation()} style={{ margin: "0 1rem", maxWidth: "420px", width: "100%" }}>
              <div className={s.noteTitle}>
                <FileText size={16} color={BRAND} /> Note personnelle
              </div>
              <textarea
                autoFocus className={s.noteTextarea}
                value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Ajoutez un rappel ou une information utile..."
                rows={3}
              />
              <div className={s.slotActions}>
                <button className={s.cancelBtn} onClick={() => setEditNote(null)}>Annuler</button>
                <button className={s.confirmBtn} onClick={() => saveNote(activeDay, editNote)}>
                  <CheckCircle2 size={13} /> Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Modal Excursion Detail ══ */}
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
                departure_time:   selectedExcursion.depart_time || undefined,
                available_dates:  selectedExcursion.available_dates,
              };
              openSlotPicker(exc);
              setSelectedExcursion(null);
            }}
          />
        )}

        {loadingDetails && <LoadingSpinner />}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   Export
══════════════════════════════════════════════════════════ */
export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: ".75rem" }}>
        <Loader2 size={32} color="#2B96A8" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <span style={{ color: "#9CA3AF", fontSize: ".85rem" }}>Chargement de l'itinéraire…</span>
      </div>
    }>
      <BuilderInner />
    </Suspense>
  );
}