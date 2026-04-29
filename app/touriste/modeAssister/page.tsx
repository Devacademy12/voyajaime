"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import ItineraireDisplay from "@/app/components/itineraire/ItineraireDisplay";
import {
  MapPin, Sparkles, Bot, Loader2, ChevronLeft, ChevronRight, CalendarDays,
  Heart, ArrowRight, CheckCircle,
} from "lucide-react";
import styles from "@/public/style/ModeAssiste.module.css";

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

/* ── Types ── */
type Ville     = { id: string; nom?: string; name?: string; city?: string; description?: string; [key: string]: unknown };
type Categorie = { id: string; nom?: string; name?: string; label?: string; [key: string]: unknown };
type Excursion = {
  id: string; title: string; city: string;
  price_per_person?: number; duration_hours?: number;
  description?: string; categories?: string[];
  photos?: string[]; languages?: string[];
  inclusions?: string[]; rating?: number; reviews_count?: number; max_people?: number;
};
type Activity = {
  id: string; name: string; description?: string;
  time?: string; duration?: string; price?: number; icon?: string;
  photos?: string | string[]; languages?: string | string[];
  inclusion?: string | string[]; city?: string; rating?: number;
};
type DayPlan   = { day: number; city: string; theme?: string; emoji?: string; activities: Activity[] };
type Itinerary = { title: string; days: DayPlan[] };

type CityDateRange = {
  city: string;
  start: Date | null;
  end: Date | null;
};

const LOADING_MSGS = [
  "Analyse des meilleures excursions disponibles...",
  "Cartographie de votre itinéraire personnalisé...",
  "L'agent IA consulte les recommandations locales...",
  "Organisation jour par jour de votre séjour...",
  "Sélection des activités les mieux notées...",
];

const MONTHS_FULL = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const THEME = {
  primary: "#2B96A8",
  primaryDark: "#1e7a8c",
  primaryLight: "#e0f4f7",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray300: "#cbd5e1",
  gray400: "#94a3b8",
  gray500: "#64748b",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1e293b",
  gray900: "#0f172a",
  white: "#ffffff",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
};

/* ── helpers ── */
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}
function fmtShort(d: Date) {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
function fmtLong(d: Date) {
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

/* ── Calendar Popover ── */
function MiniCalPop({
  value,
  onChange,
  minDate,
  onClose,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  minDate?: Date | null;
  onClose: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [cursor, setCursor] = useState(() => {
    const ref = value || minDate || today;
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  let firstDayIndex = new Date(year, month, 1).getDay();
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isDisabled = (day: number | null) => {
    if (!day) return true;
    const date = new Date(year, month, day);
    if (date < today) return true;
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    return false;
  };

  const isSelected = (day: number | null) => {
    if (!day || !value) return false;
    return value.getDate() === day && value.getMonth() === month && value.getFullYear() === year;
  };

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 1000,
        top: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: THEME.white,
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)",
        border: `1px solid ${THEME.gray200}`,
        padding: 16,
        width: 280,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          style={{
            background: THEME.gray100, border: "none", cursor: "pointer",
            color: THEME.gray600, padding: "6px 10px", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: THEME.gray800 }}>
          {MONTHS_FULL[month]} {year}
        </span>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          style={{
            background: THEME.gray100, border: "none", cursor: "pointer",
            color: THEME.gray600, padding: "6px 10px", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {DAYS_FR.map((day) => (
          <div key={day} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: THEME.gray400, padding: "6px 0" }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, index) => {
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          return (
            <button
              key={index}
              disabled={disabled}
              onClick={() => {
                if (day && !disabled) {
                  onChange(new Date(year, month, day));
                  onClose();
                }
              }}
              style={{
                padding: "8px 4px", borderRadius: 8, border: "none",
                fontSize: 12, fontWeight: selected ? 600 : 400,
                cursor: disabled ? "default" : "pointer",
                background: selected ? THEME.primary : "transparent",
                color: selected ? THEME.white : disabled ? THEME.gray300 : THEME.gray700,
                transition: "all 0.2s",
              }}
            >
              {day || ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── City Date Row ── */
function CityDateRow({
  cdr,
  onStart,
  onEnd,
}: {
  cdr: CityDateRange;
  onStart: (d: Date) => void;
  onEnd: (d: Date) => void;
}) {
  const [openPop, setOpenPop] = useState<"start" | "end" | null>(null);
  const nights = cdr.start && cdr.end ? daysBetween(cdr.start, cdr.end) : 0;
  const minEnd = cdr.start
    ? new Date(cdr.start.getFullYear(), cdr.start.getMonth(), cdr.start.getDate() + 1)
    : undefined;

  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openPop) return;
    const handler = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setOpenPop(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openPop]);

  return (
    <div
      ref={rowRef}
      style={{
        background: THEME.gray50,
        border: `1px solid ${THEME.gray200}`,
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s",
      }}
    >
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: THEME.gray800 }}>{cdr.city}</span>
        {nights > 0 && (
          <span style={{ fontSize: 12, color: THEME.gray500, marginLeft: 8 }}>
            • {nights} jour{nights > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpenPop(openPop === "start" ? null : "start")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: cdr.start ? THEME.primary : THEME.white,
              border: `1px solid ${cdr.start ? THEME.primary : THEME.gray200}`,
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontSize: 12, fontWeight: 500,
              color: cdr.start ? THEME.white : THEME.gray600,
              transition: "all 0.2s",
            }}
          >
            <CalendarDays size={12} />
            {cdr.start ? fmtShort(cdr.start) : "Arrivée"}
          </button>
          {openPop === "start" && (
            <MiniCalPop
              value={cdr.start}
              onChange={(d) => { onStart(d); setOpenPop(null); }}
              onClose={() => setOpenPop(null)}
            />
          )}
        </div>

        <ArrowRight size={14} color={THEME.gray400} />

        <div style={{ position: "relative" }}>
          <button
            onClick={() => { if (cdr.start) setOpenPop(openPop === "end" ? null : "end"); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: cdr.end ? THEME.primary : THEME.white,
              border: `1px solid ${cdr.end ? THEME.primary : THEME.gray200}`,
              borderRadius: 8, padding: "6px 12px",
              cursor: cdr.start ? "pointer" : "default",
              fontSize: 12, fontWeight: 500,
              color: cdr.end ? THEME.white : THEME.gray400,
              opacity: cdr.start ? 1 : 0.6,
              transition: "all 0.2s",
            }}
          >
            <CalendarDays size={12} />
            {cdr.end ? fmtShort(cdr.end) : "Départ"}
          </button>
          {openPop === "end" && cdr.start && (
            <MiniCalPop
              value={cdr.end}
              onChange={(d) => { onEnd(d); setOpenPop(null); }}
              minDate={minEnd}
              onClose={() => setOpenPop(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Extract itinerary helper ── */
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
    } catch {
      // continue
    }
  }
  throw new Error("Impossible de trouver l'itinéraire dans la réponse n8n.");
}

/* ════════════════════════════
   Main Component
════════════════════════════ */
export default function ModeAssiste() {
  const supabase = createClient();

  const [step, setStep] = useState<"questions" | "generation" | "itineraire">("questions");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityDates, setCityDates] = useState<CityDateRange[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const [villes, setVilles] = useState<Ville[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [genError, setGenError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const msgIdxRef = useRef(0);

  const [showCheckout, setShowCheckout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error" | "login">("idle");

  /* ── Derived ── */
  const totalDays = cityDates.reduce(
    (acc, cdr) => acc + (cdr.start && cdr.end ? daysBetween(cdr.start, cdr.end) : 0),
    0
  );
  const allDatesSet = cityDates.length > 0 && cityDates.every((c) => c.start && c.end);

  const totalPrice =
    itinerary?.days.reduce(
      (acc, d) => acc + d.activities.reduce((a, act) => a + (Number(act.price) || 0), 0),
      0
    ) ?? 0;

  const itineraryAsExc = itinerary
    ? {
        id: "itinerary-" + Date.now(),
        title: itinerary.title,
        city: selectedCities.join(", "),
        duration_hours: totalDays * 8,
        price_per_person: totalPrice,
        max_people: 20,
      }
    : null;

  /* ── Load Supabase ── */
  useEffect(() => {
    (async () => {
      setDbLoading(true);
      try {
        const [{ data: v }, { data: c }, { data: e }] = await Promise.all([
          supabase.from("villes").select("*").order("nom"),
          supabase.from("categories").select("*").order("nom"),
          supabase.from("excursions").select("*").eq("is_active", true),
        ]);
        setVilles((v || []) as unknown as Ville[]);
        setCategories((c || []) as unknown as Categorie[]);
        setExcursions((e || []) as Excursion[]);
      } catch {
        // silent
      } finally {
        setDbLoading(false);
      }
    })();
  }, []);

  /* ── City toggle ── */
  const toggleCity = (nom: string) => {
    setSelectedCities((prev) => {
      const next = prev.includes(nom) ? prev.filter((x) => x !== nom) : [...prev, nom];
      setCityDates(
        next.map(
          (c) => cityDates.find((cd) => cd.city === c) ?? { city: c, start: null, end: null }
        )
      );
      return next;
    });
  };

  const toggleCat = (id: string) =>
    setSelectedCats((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const updateCityStart = (city: string, d: Date) =>
    setCityDates((prev) =>
      prev.map((cdr) => {
        if (cdr.city !== city) return cdr;
        return { ...cdr, start: d, end: cdr.end && cdr.end <= d ? null : cdr.end };
      })
    );

  const updateCityEnd = (city: string, d: Date) =>
    setCityDates((prev) => prev.map((cdr) => (cdr.city !== city ? cdr : { ...cdr, end: d })));

  /* ── Generate ── */
  const generate = async () => {
    if (!canGenerate) return;
    setStep("generation");
    setGenError("");
    msgIdxRef.current = 0;
    setLoadingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => {
      msgIdxRef.current = Math.min(msgIdxRef.current + 1, LOADING_MSGS.length - 1);
      setLoadingMsg(LOADING_MSGS[msgIdxRef.current]);
    }, 2000);

    try {
      const relExc = excursions.filter((e) => selectedCities.includes(e.city));
      const catNames = selectedCats
        .map((id) => categories.find((c) => c.id === id)?.nom)
        .filter(Boolean);
      const citySchedule = cityDates.map((cdr) => ({
        city: cdr.city,
        from: cdr.start!.toLocaleDateString("fr-FR"),
        to: cdr.end!.toLocaleDateString("fr-FR"),
        days: daysBetween(cdr.start!, cdr.end!),
      }));

      const message = `Tu es un expert en tourisme tunisien.
Crée un itinéraire de ${totalDays} jours avec ce programme par ville :
${citySchedule.map((s) => `- ${s.city} : du ${s.from} au ${s.to} (${s.days} jours)`).join("\n")}
Intérêts: ${catNames.join(", ")}
Excursions disponibles (utilise UNIQUEMENT celles-ci):
${JSON.stringify(
  relExc.map((e) => ({
    id: e.id,
    name: e.title,
    city: e.city,
    price: e.price_per_person || 0,
    duration: e.duration_hours ? `${e.duration_hours}h` : "2h",
    description: e.description || "",
    photos: e.photos || [],
    languages: e.languages || [],
    inclusions: e.inclusions || [],
    rating: e.rating,
  })),
  null,
  2
)}
RÈGLES: max 3 activités/jour, respecte les dates par ville, IDs exacts, JSON uniquement.
Format: { "title": "Titre", "days": [{ "day":1,"city":"Ville","date":"DD/MM/YYYY","theme":"Thème","activities":[{"id":"...","name":"...","description":"...","photos":["url"],"time":"09:00","duration":"2h","price":45,"languages":["Français"],"inclusion":["Transport"],"city":"Ville","rating":4.5}] }] }`;

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          message,
          totalDays,
          citySchedule,
          cities: selectedCities,
          interests: catNames,
        }),
      });
      clearInterval(iv);
      if (!res.ok) throw new Error(`n8n ${res.status}`);
      setItinerary(extractItinerary(await res.json()));
      setStep("itineraire");
    } catch (err) {
      clearInterval(iv);
      setGenError(err instanceof Error ? err.message : "Erreur inconnue");
      setStep("questions");
    }
  };

  const handleChangeActivity = (dayIdx: number, actIdx: number, alt: Activity) => {
    if (!itinerary) return;
    const upd: Itinerary = JSON.parse(JSON.stringify(itinerary));
    upd.days[dayIdx].activities[actIdx] = alt;
    setItinerary(upd);
  };

  const saveItinerary = async () => {
    if (!itinerary) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus("login"); setSaving(false); return; }
      const catNames = selectedCats
        .map((id) => categories.find((c) => c.id === id)?.nom)
        .filter(Boolean) as string[];
      const { error } = await supabase.from("itineraires").insert({
        user_id: user.id,
        nb_jours: totalDays,
        villes_selectionnees: selectedCities,
        categories_selectionnees: catNames,
        city_schedule: cityDates.map((cdr) => ({
          city: cdr.city,
          start: cdr.start?.toISOString(),
          end: cdr.end?.toISOString(),
        })),
        plan: itinerary,
      });
      setSaveStatus(error ? "error" : "ok");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  const resetAll = () => {
    setStep("questions");
    setItinerary(null);
    setSelectedCities([]);
    setCityDates([]);
    setSelectedCats([]);
    setGenError("");
    setShowCheckout(false);
    setSaveStatus("idle");
  };

  const pillParts: string[] = [];
  if (totalDays > 0) pillParts.push(`${totalDays} jours`);
  if (selectedCities.length) pillParts.push(selectedCities.join(", "));

  const canGenerate =
    selectedCities.length > 0 && selectedCats.length > 0 && allDatesSet && !!N8N_WEBHOOK_URL;

  /* ════════ RENDER ════════ */
  return (
    <>
      {/* ── Global page wrapper : scroll naturel sur toute la page ── */}
      <div
        className={styles.root}
        style={{
          minHeight: "100vh",          /* ← plus de height fixe */
          display: "flex",
          flexDirection: "column",
          background: THEME.gray50,
          /* pas de overflow: hidden ici */
        }}
      >
        <TouristeNav />

        {/* ── Hero header (step questions uniquement) ── */}
        {step === "questions" && (
          <div style={{ paddingTop: 80, paddingBottom: 8, textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  background: THEME.primaryLight,
                  display: "inline-flex",
                  padding: "8px 20px",
                  borderRadius: 100,
                  color: THEME.primary,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ✨ Planificateur de voyage intelligent
              </span>
            </div>
            <h1 style={{ fontSize: 40, fontWeight: 700, color: THEME.gray800, marginBottom: 12 }}>
              Composez votre{" "}
              <span style={{ color: THEME.primary }}>voyage idéal</span>
            </h1>
            <p style={{ fontSize: 15, color: THEME.gray500, maxWidth: 600, margin: "0 auto" }}>
              Sélectionnez vos préférences — l&apos;agent IA construit votre itinéraire personnalisé
              jour par jour.
            </p>
          </div>
        )}

        {/* ── Main content ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "24px 32px 40px",
            /* pas de overflow: hidden */
          }}
        >
          {/* ════ STEP : questions ════ */}
          {step === "questions" && (
            <>
              {/* Bandeau d'erreur */}
              {genError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: `1px solid ${THEME.error}30`,
                    borderRadius: 12,
                    padding: "12px 20px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: THEME.error }} />
                    <span style={{ color: "#991b1b", fontSize: 13 }}>
                      <strong>Erreur :</strong> {genError}
                    </span>
                  </div>
                  <button
                    onClick={() => setGenError("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* ── 3 cards côte à côte ── */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  alignItems: "flex-start",   /* ← les cards s'étendent selon leur contenu */
                }}
              >
                {/* ── Card 1 : Villes ── */}
                <div
                  style={{
                    flex: 1,
                    background: THEME.white,
                    borderRadius: 20,
                    border: `1px solid ${THEME.gray200}`,
                    display: "flex",
                    flexDirection: "column",
                    /* pas de overflow: hidden */
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${THEME.gray100}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: THEME.primaryLight,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <MapPin size={18} color={THEME.primary} />
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: THEME.gray800 }}>Destinations</p>
                          <p style={{ fontSize: 12, color: THEME.gray500, margin: 0 }}>Choisissez vos villes</p>
                        </div>
                      </div>
                      {selectedCities.length > 0 && (
                        <span
                          style={{
                            background: `${THEME.primary}15`, padding: "4px 12px",
                            borderRadius: 20, fontSize: 12, fontWeight: 500, color: THEME.primary,
                          }}
                        >
                          {selectedCities.length} sélectionnée{selectedCities.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body — pas de scroll */}
                  <div style={{ padding: "20px 24px" }}>
                    {dbLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", padding: 40 }}>
                        <Loader2 size={18} className={styles.spin} />
                        <span style={{ color: THEME.gray500 }}>Chargement des destinations...</span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                          gap: 10,
                        }}
                      >
                        {villes.map((v) => {
                          const nom = String(v.nom || v.name || "");
                          const on = selectedCities.includes(nom);
                          return (
                            <button
                              key={v.id}
                              onClick={() => toggleCity(nom)}
                              style={{
                                background: on ? THEME.primary : THEME.white,
                                border: on ? "none" : `1px solid ${THEME.gray200}`,
                                borderRadius: 10, padding: "10px 8px",
                                cursor: "pointer", transition: "all 0.2s", textAlign: "center",
                              }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 500, color: on ? THEME.white : THEME.gray700, display: "block" }}>
                                {nom}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card 2 : Dates ── */}
                <div
                  style={{
                    flex: 1,
                    background: THEME.white,
                    borderRadius: 20,
                    border: `1px solid ${THEME.gray200}`,
                    display: "flex",
                    flexDirection: "column",
                    opacity: selectedCities.length === 0 ? 0.5 : 1,
                    pointerEvents: selectedCities.length === 0 ? "none" : "auto",
                    transition: "opacity 0.35s",
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${THEME.gray100}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: THEME.primaryLight,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <CalendarDays size={18} color={THEME.primary} />
                        </div>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: THEME.gray800 }}>Calendrier</p>
                          <p style={{ fontSize: 12, color: THEME.gray500, margin: 0 }}>
                            {selectedCities.length === 0
                              ? "Sélectionnez d'abord une ville"
                              : totalDays > 0
                              ? `${totalDays} jours au total`
                              : "Définissez les dates"}
                          </p>
                        </div>
                      </div>
                      {totalDays > 0 && (
                        <span
                          style={{
                            background: `${THEME.warning}15`, padding: "4px 12px",
                            borderRadius: 20, fontSize: 12, fontWeight: 500, color: THEME.warning,
                          }}
                        >
                          🗓️ {totalDays}j
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "20px 24px" }}>
                    {selectedCities.length === 0 ? (
                      <div
                        style={{
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          gap: 16, padding: "40px 20px",
                        }}
                      >
                        <div
                          style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: THEME.gray100,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <MapPin size={24} color={THEME.gray400} />
                        </div>
                        <p style={{ fontSize: 13, textAlign: "center", maxWidth: 200, lineHeight: 1.5, color: THEME.gray500 }}>
                          Choisissez vos villes à gauche pour organiser votre calendrier
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <p
                          style={{
                            fontSize: 11, fontWeight: 600, color: THEME.gray400,
                            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
                          }}
                        >
                          {cityDates.filter((c) => c.start && c.end).length}/{cityDates.length} étapes configurées
                        </p>

                        {cityDates.map((cdr) => (
                          <CityDateRow
                            key={cdr.city}
                            cdr={cdr}
                            onStart={(d) => updateCityStart(cdr.city, d)}
                            onEnd={(d) => updateCityEnd(cdr.city, d)}
                          />
                        ))}

                        {allDatesSet && (
                          <div
                            style={{
                              marginTop: 16, padding: "12px 16px",
                              borderRadius: 12, background: THEME.primaryLight,
                              border: `1px solid ${THEME.primary}20`,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <CheckCircle size={14} color={THEME.primary} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: THEME.primaryDark }}>
                                Récapitulatif du séjour
                              </span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {cityDates.map(
                                (cdr) =>
                                  cdr.start &&
                                  cdr.end && (
                                    <span
                                      key={cdr.city}
                                      style={{
                                        fontSize: 11, color: THEME.gray600,
                                        background: THEME.white, borderRadius: 20,
                                        padding: "4px 12px",
                                        display: "flex", alignItems: "center", gap: 4,
                                      }}
                                    >
                                      <MapPin size={10} /> {cdr.city} · {fmtShort(cdr.start)} → {fmtShort(cdr.end)}
                                    </span>
                                  )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card 3 : Catégories ── */}
                <div
                  style={{
                    flex: 1,
                    background: THEME.white,
                    borderRadius: 20,
                    border: `1px solid ${THEME.gray200}`,
                    display: "flex",
                    flexDirection: "column",
                    opacity: !allDatesSet ? 0.5 : 1,
                    pointerEvents: !allDatesSet ? "none" : "auto",
                    transition: "opacity 0.35s",
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${THEME.gray100}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: THEME.primaryLight,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Heart size={18} color={THEME.primary} />
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: THEME.gray800 }}>
                          Centres d&apos;intérêt
                        </p>
                        <p style={{ fontSize: 12, color: THEME.gray500, margin: 0 }}>
                          {!allDatesSet
                            ? "Définissez d'abord les dates"
                            : selectedCats.length === 0
                            ? "Optionnel"
                            : `${selectedCats.length} sélectionné${selectedCats.length > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "20px 24px" }}>
                    {dbLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", padding: 40 }}>
                        <Loader2 size={18} className={styles.spin} />
                        <span style={{ color: THEME.gray500 }}>Chargement des catégories...</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {categories.map((cat) => {
                          const catName = String(cat.nom || cat.name || cat.label || "");
                          const isSelected = selectedCats.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              onClick={() => toggleCat(cat.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: isSelected ? THEME.primary : THEME.white,
                                border: isSelected ? "none" : `1px solid ${THEME.gray200}`,
                                borderRadius: 40, padding: "6px 16px",
                                fontSize: 13, fontWeight: 500,
                                color: isSelected ? THEME.white : THEME.gray700,
                                cursor: "pointer", transition: "all 0.2s",
                              }}
                            >
                              <Sparkles size={12} />
                              {catName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Footer CTA ── */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: `1px solid ${THEME.gray200}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {pillParts.length > 0 ? (
                  <div
                    style={{
                      background: THEME.gray100, borderRadius: 40,
                      padding: "6px 16px",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: THEME.gray500 }}>📋</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: THEME.gray700 }}>
                      {pillParts.join(" · ")}
                    </span>
                  </div>
                ) : (
                  <div />
                )}
                <button
                  onClick={generate}
                  disabled={!canGenerate}
                  style={{
                    background: canGenerate ? THEME.primary : THEME.gray300,
                    border: "none", borderRadius: 40,
                    padding: "10px 24px",
                    color: THEME.white, fontWeight: 600, fontSize: 14,
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: canGenerate ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}
                >
                  <Bot size={18} /> Générer mon itinéraire →
                </button>
              </div>
            </>
          )}

          {/* ════ STEP : génération ════ */}
          {step === "generation" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                minHeight: "60vh",
              }}
            >
              <div
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  background: THEME.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <Bot size={32} color={THEME.white} strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: THEME.gray800, margin: 0 }}>
                L&apos;agent IA prépare votre voyage…
              </h2>
              <p style={{ fontSize: 14, color: THEME.gray500, margin: 0 }}>{loadingMsg}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    style={{
                      width: 6, height: 6, borderRadius: 3,
                      background: THEME.primary,
                      animation: `bounce 1.4s infinite ${delay}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ════ STEP : itinéraire ════ */}
          {step === "itineraire" && itinerary && (
            /* Pas de overflow: auto — le contenu s'étire naturellement */
            <div>
              <ItineraireDisplay
                itinerary={itinerary}
                selectedCities={selectedCities}
                selectedCats={selectedCats}
                categories={categories as { id: string; nom?: string; name?: string }[]}
                excursions={excursions}
                totalPrice={totalPrice}
                saving={saving}
                saveStatus={saveStatus}
                onBack={() => setStep("questions")}
                onReset={resetAll}
                onCheckout={() => setShowCheckout(true)}
                onSave={saveItinerary}
                onChangeActivity={handleChangeActivity}
              />
            </div>
          )}
        </main>
      </div>

      {/* ── Checkout modal ── */}
      {showCheckout && itineraryAsExc && (
        <CheckoutModal exc={itineraryAsExc} onClose={() => setShowCheckout(false)} />
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}