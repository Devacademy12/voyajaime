"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabaseClient";
import ExcursionClient from "@/app/excursions/[id]/ExcursionClient";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import ItineraireDisplay from "@/app/components/itineraire/ItineraireDisplay";
import {
  MapPin, Sparkles, Bot, Loader2, ChevronLeft, ChevronRight, CalendarDays,
  Heart, ArrowRight, CheckCircle, Euro, AlertTriangle,
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

/* ── Constantes ── */
const LOADING_MSGS = [
  "Analyse des meilleures excursions disponibles...",
  "Cartographie de votre itinéraire personnalisé...",
  "L'agent IA consulte les recommandations locales...",
  "Organisation jour par jour de votre séjour...",
  "Sélection des activités les mieux notées...",
];

const MONTHS_FULL  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTHS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
const DAYS_FR      = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

/* ── Helpers ── */
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}
function fmtShort(d: Date) {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/**
 * Vérifie si deux plages de dates se chevauchent.
 * Retourne true si elles se superposent (même un seul jour commun).
 */
function datesOverlap(
  start1: Date | null, end1: Date | null,
  start2: Date | null, end2: Date | null
): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  // Normalise à minuit pour éviter les décalages horaires
  const s1 = new Date(start1); s1.setHours(0, 0, 0, 0);
  const e1 = new Date(end1);   e1.setHours(0, 0, 0, 0);
  const s2 = new Date(start2); s2.setHours(0, 0, 0, 0);
  const e2 = new Date(end2);   e2.setHours(0, 0, 0, 0);
  // Chevauchement : les deux intervalles se croisent si s1 <= e2 ET s2 <= e1
  return s1 <= e2 && s2 <= e1;
}

/**
 * Retourne l'ensemble des dates déjà réservées par les AUTRES villes.
 * Utilisé pour griser les jours dans MiniCalPop.
 */
function getBlockedDates(cityDates: CityDateRange[], excludeCity: string): { start: Date; end: Date }[] {
  return cityDates
    .filter((c) => c.city !== excludeCity && c.start && c.end)
    .map((c) => ({ start: c.start!, end: c.end! }));
}

/* ════════════════════════════
   MiniCalPop
════════════════════════════ */
function MiniCalPop({
  value,
  onChange,
  minDate,
  onClose,
  blockedRanges,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  minDate?: Date | null;
  onClose: () => void;
  blockedRanges?: { start: Date; end: Date }[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [cursor, setCursor] = useState(() => {
    const ref = value || minDate || today;
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  });

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  let firstDayIndex = new Date(year, month, 1).getDay();
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isBlocked = (day: number | null): boolean => {
    if (!day || !blockedRanges || blockedRanges.length === 0) return false;
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return blockedRanges.some((range) => {
      const s = new Date(range.start); s.setHours(0, 0, 0, 0);
      const e = new Date(range.end);   e.setHours(0, 0, 0, 0);
      return date >= s && date <= e;
    });
  };

  const isDisabled = (day: number | null) => {
    if (!day) return true;
    const date = new Date(year, month, day);
    if (date < today) return true;
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    if (isBlocked(day)) return true;
    return false;
  };

  const isSelected = (day: number | null) => {
    if (!day || !value) return false;
    return value.getDate() === day && value.getMonth() === month && value.getFullYear() === year;
  };

  return (
    <div className="ma-cal-pop" onClick={(e) => e.stopPropagation()} style={{ width: "260px", padding: "10px", fontSize: "12px" }}>
      <div className="ma-cal-pop-header">
        <button className="ma-cal-nav-btn" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft size={16} />
        </button>
        <span className="ma-cal-month-label">{MONTHS_FULL[month]} {year}</span>
        <button className="ma-cal-nav-btn" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="ma-cal-days-header">
        {DAYS_FR.map((d) => (
          <div key={d} className="ma-cal-day-name">{d}</div>
        ))}
      </div>

      <div className="ma-cal-grid">
        {cells.map((day, idx) => {
          const disabled = isDisabled(day);
          const blocked  = isBlocked(day);
          const selected = isSelected(day);
          return (
            <button
              key={idx}
              disabled={disabled}
              title={blocked && day ? "Date réservée pour une autre ville" : undefined}
              onClick={() => {
                if (day && !disabled) {
                  onChange(new Date(year, month, day));
                  onClose();
                }
              }}
              className={[
                "ma-cal-day-btn",
                selected  ? "ma-cal-day-btn-selected" : "",
                blocked   ? "ma-cal-day-btn-blocked"  : "",
              ].join(" ")}
            >
              {day || ""}
            </button>
          );
        })}
      </div>

      {blockedRanges && blockedRanges.length > 0 && (
        <div className="ma-cal-legend">
          <span className="ma-cal-legend-dot ma-cal-legend-dot-blocked" />
          <span>Dates réservées pour une autre ville</span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════
   CityDateRow
════════════════════════════ */
function CityDateRow({
  cdr,
  onStart,
  onEnd,
  allCityDates,
}: {
  cdr: CityDateRange;
  onStart: (d: Date) => void;
  onEnd: (d: Date) => void;
  allCityDates: CityDateRange[];
}) {
  const [openPop, setOpenPop] = useState<"start" | "end" | null>(null);

  const minEnd = cdr.start
    ? new Date(cdr.start.getFullYear(), cdr.start.getMonth(), cdr.start.getDate())
    : undefined;

  const nights = cdr.start && cdr.end ? daysBetween(cdr.start, cdr.end) : 0;

  // Dates bloquées par les autres villes
  const blockedRanges = getBlockedDates(allCityDates, cdr.city);

  const calPortal = openPop
    ? createPortal(
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setOpenPop(null)}
          />
          <div
            style={{
              position: "fixed",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%) scale(0.85)",
              transformOrigin: "top center",
              zIndex: 9999,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              borderRadius: 12,
              background: "#fff",
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <MiniCalPop
              value={openPop === "start" ? cdr.start : cdr.end}
              onChange={(d) => {
                if (openPop === "start") onStart(d);
                else onEnd(d);
                setOpenPop(null);
              }}
              minDate={openPop === "end" ? minEnd : undefined}
              onClose={() => setOpenPop(null)}
              blockedRanges={blockedRanges}
            />
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <div className="ma-city-date-row">
        <div className="ma-city-date-row-left">
          <span className="ma-city-name">{cdr.city}</span>
          {nights > 0 && (
            <span className="ma-city-nights">
              • {nights} jour{nights > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="ma-city-date-btns">
          <button
            onClick={() => setOpenPop(openPop === "start" ? null : "start")}
            className={["ma-date-btn", cdr.start ? "ma-date-btn-active" : ""].join(" ")}
          >
            <CalendarDays size={12} />
            {cdr.start ? fmtShort(cdr.start) : "Arrivée"}
          </button>

          <ArrowRight size={14} color="#94a3b8" />

          <button
            onClick={() => { if (cdr.start) setOpenPop(openPop === "end" ? null : "end"); }}
            className={[
              "ma-date-btn",
              cdr.end ? "ma-date-btn-active" : "",
              !cdr.start ? "ma-date-btn-disabled" : "",
            ].join(" ")}
          >
            <CalendarDays size={12} />
            {cdr.end ? fmtShort(cdr.end) : "Départ"}
          </button>
        </div>
      </div>

      {calPortal}
    </>
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
      const p  = typeof c === "string" ? JSON.parse(c) : c;
      const pr = p as Record<string, unknown>;
      if (Array.isArray(pr?.days) && (pr.days as unknown[]).length > 0) return p as Itinerary;
      const nested = pr?.itinerary || pr?.result;
      if (nested && Array.isArray((nested as Record<string, unknown>)?.days)) return nested as Itinerary;
    } catch { /* continue */ }
  }
  throw new Error("Impossible de trouver l'itinéraire dans la réponse n8n.");
}

/* ════════════════════════════
   Main Component
════════════════════════════ */
export default function ModeAssiste() {
  const supabase = createClient();

  const [step, setStep]                   = useState<"questions" | "generation" | "itineraire">("questions");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityDates, setCityDates]           = useState<CityDateRange[]>([]);
  const [selectedCats, setSelectedCats]     = useState<string[]>([]);
  const [budget, setBudget]                 = useState<string>("");

  const [villes, setVilles]         = useState<Ville[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [dbLoading, setDbLoading]   = useState(true);

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [genError, setGenError]   = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const msgIdxRef = useRef(0);

  // ── Erreur de chevauchement de dates ──
  const [dateError, setDateError] = useState("");

  const [showCheckout, setShowCheckout] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveStatus, setSaveStatus]     = useState<"idle" | "ok" | "error" | "login">("idle");

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

  const canGenerate =
    selectedCities.length > 0 && selectedCats.length > 0 && allDatesSet && !dateError && !!N8N_WEBHOOK_URL;

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
      } catch { /* silent */ }
      finally { setDbLoading(false); }
    })();
  }, []);

  /* ── City toggle ── */
  const toggleCity = (nom: string) => {
    setSelectedCities((prev) => {
      const next = prev.includes(nom)
        ? prev.filter((x) => x !== nom)
        : [...prev, nom];
      setCityDates(
        next.map((c) => cityDates.find((cd) => cd.city === c) ?? { city: c, start: null, end: null })
      );
      // Réinitialise l'erreur si une ville est désélectionnée (résout potentiellement le conflit)
      setDateError("");
      return next;
    });
  };

  const toggleCat = (id: string) =>
    setSelectedCats((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /* ── updateCityStart avec contrôle de chevauchement ── */
  const updateCityStart = (city: string, d: Date) => {
    // Récupère la date de fin actuelle pour cette ville
    const currentEnd = cityDates.find((c) => c.city === city)?.end ?? null;

    // Vérifie le chevauchement avec les autres villes
    const conflict = cityDates.find(
      (cdr) =>
        cdr.city !== city &&
        datesOverlap(d, currentEnd, cdr.start, cdr.end)
    );

    if (conflict) {
      setDateError(
        `Conflit avec "${conflict.city}" : les séjours se chevauchent. Choisissez des dates sans superposition.`
      );
      return; // Bloque la mise à jour
    }

    setDateError("");
    setCityDates((prev) =>
      prev.map((cdr) => {
        if (cdr.city !== city) return cdr;
        return { ...cdr, start: d, end: cdr.end && cdr.end < d ? null : cdr.end };
      })
    );
  };

  /* ── updateCityEnd avec contrôle de chevauchement ── */
  const updateCityEnd = (city: string, d: Date) => {
    // Récupère la date de début actuelle pour cette ville
    const currentStart = cityDates.find((c) => c.city === city)?.start ?? null;

    // Vérifie le chevauchement avec les autres villes
    const conflict = cityDates.find(
      (cdr) =>
        cdr.city !== city &&
        datesOverlap(currentStart, d, cdr.start, cdr.end)
    );

    if (conflict) {
      setDateError(
        `Conflit avec "${conflict.city}" : les séjours se chevauchent. Choisissez des dates sans superposition.`
      );
      return; // Bloque la mise à jour
    }

    setDateError("");
    setCityDates((prev) =>
      prev.map((cdr) => (cdr.city !== city ? cdr : { ...cdr, end: d }))
    );
  };

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
        to:   cdr.end!.toLocaleDateString("fr-FR"),
        days: daysBetween(cdr.start!, cdr.end!),
      }));

      const budgetLine = budget ? `Budget total du voyageur : ${budget} €. Essaie de respecter ce budget.` : "";

      const message = `Tu es un expert en tourisme tunisien.
Crée un itinéraire de ${totalDays} jours avec ce programme par ville :
${citySchedule.map((s) => `- ${s.city} : du ${s.from} au ${s.to} (${s.days} jours)`).join("\n")}
Intérêts: ${catNames.join(", ")}
${budgetLine}
Excursions disponibles (utilise UNIQUEMENT celles-ci):
${JSON.stringify(
  relExc.map((e) => ({
    id: e.id, name: e.title, city: e.city,
    price: e.price_per_person || 0,
    duration: e.duration_hours ? `${e.duration_hours}h` : "2h",
    description: e.description || "",
    photos: e.photos || [], languages: e.languages || [],
    inclusions: e.inclusions || [], rating: e.rating,
  })),
  null, 2
)}
RÈGLES: max 3 activités/jour, respecte les dates par ville, IDs exacts, JSON uniquement.
Format: { "title": "Titre", "days": [{ "day":1,"city":"Ville","date":"DD/MM/YYYY","theme":"Thème","activities":[{"id":"...","name":"...","description":"...","photos":["url"],"time":"09:00","duration":"2h","price":45,"languages":["Français"],"inclusion":["Transport"],"city":"Ville","rating":4.5}] }] }`;

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          message, totalDays, citySchedule,
          cities: selectedCities,
          interests: catNames,
          budget: budget ? Number(budget) : null,
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
        budget: budget ? Number(budget) : null,
        city_schedule: cityDates.map((cdr) => ({
          city: cdr.city,
          start: cdr.start?.toISOString(),
          end:   cdr.end?.toISOString(),
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
    setBudget("");
    setGenError("");
    setDateError("");
    setShowCheckout(false);
    setSaveStatus("idle");
  };

  const pillParts: string[] = [];
  if (totalDays > 0) pillParts.push(`${totalDays} jours`);
  if (selectedCities.length) pillParts.push(selectedCities.join(", "));

  /* ════════ RENDER ════════ */
  return (
    <div className={styles.root}>
      <TouristeNav />

      {step === "questions" && (
        <div className="ma-topbar">
          <div className="ma-topbar-badge">
            <Sparkles size={13} /> Planificateur
          </div>
          <h1>Composez votre itinéraire <span>sur mesure</span></h1>
        </div>
      )}

      <main className="ma-main">

        {step === "questions" && (
          <>
            {genError && (
              <div className="ma-err-banner">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="ma-err-dot" />
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

            <div className="ma-cards-row">

              {/* ── Card 1 : Villes ── */}
              <div className="ma-card">
                <div className="ma-card-header">
                  <div className="ma-card-header-left">
                    <div className="ma-card-icon">
                      <MapPin size={18} color="#2B96A8" />
                    </div>
                    <div>
                      <p className="ma-card-title">Destinations</p>
                      <p className="ma-card-sub">Choisissez vos villes</p>
                    </div>
                  </div>
                  {selectedCities.length > 0 && (
                    <span className="ma-badge-count">
                      {selectedCities.length} sélectionnée{selectedCities.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="ma-card-body">
                  {dbLoading ? (
                    <div className="ma-loading-row">
                      <Loader2 size={18} className={styles.spin} />
                      <span style={{ color: "#64748b" }}>Chargement des destinations...</span>
                    </div>
                  ) : (
                    <div className="ma-cities-grid">
                      {villes.map((v) => {
                        const nom = String(v.nom || v.name || "");
                        const on  = selectedCities.includes(nom);
                        return (
                          <button
                            key={v.id}
                            onClick={() => toggleCity(nom)}
                            className={["ma-city-btn", on ? "ma-city-btn-on" : ""].join(" ")}
                          >
                            <span className="ma-city-btn-label">{nom}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Card 2 : Calendrier ── */}
              <div className={["ma-card", selectedCities.length === 0 ? "ma-card-disabled" : ""].join(" ")}>
                <div className="ma-card-header">
                  <div className="ma-card-header-left">
                    <div className="ma-card-icon">
                      <CalendarDays size={18} color="#2B96A8" />
                    </div>
                    <div>
                      <p className="ma-card-title">Calendrier</p>
                      <p className="ma-card-sub">
                        {selectedCities.length === 0
                          ? "Sélectionnez d'abord une ville"
                          : totalDays > 0
                          ? `${totalDays} jours au total`
                          : "Définissez les dates"}
                      </p>
                    </div>
                  </div>
                  {totalDays > 0 && (
                    <span className="ma-badge-days">🗓️ {totalDays}j</span>
                  )}
                </div>

                <div className="ma-card-body">
                  {selectedCities.length === 0 ? (
                    <div className="ma-cal-empty">
                      <div className="ma-cal-empty-icon">
                        <MapPin size={24} color="#94a3b8" />
                      </div>
                      <p className="ma-cal-empty-text">
                        Choisissez vos villes à gauche pour organiser votre calendrier
                      </p>
                    </div>
                  ) : (
                    <div className="ma-city-dates-list">
                      <p className="ma-dates-step-label">
                        {cityDates.filter((c) => c.start && c.end).length}/{cityDates.length} étapes configurées
                      </p>

                      {/* ── Bannière d'erreur de chevauchement ── */}
                      {dateError && (
                        <div className="ma-date-conflict-banner">
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <AlertTriangle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span>{dateError}</span>
                          </div>
                          <button onClick={() => setDateError("")}>✕</button>
                        </div>
                      )}

                      {cityDates.map((cdr) => (
                        <CityDateRow
                          key={cdr.city}
                          cdr={cdr}
                          allCityDates={cityDates}
                          onStart={(d) => updateCityStart(cdr.city, d)}
                          onEnd={(d)   => updateCityEnd(cdr.city, d)}
                        />
                      ))}

                      {allDatesSet && !dateError && (
                        <div className="ma-recap-box">
                          <div className="ma-recap-title">
                            <CheckCircle size={14} color="#2B96A8" />
                            Récapitulatif du séjour
                          </div>
                          <div className="ma-recap-pills">
                            {cityDates.map(
                              (cdr) =>
                                cdr.start && cdr.end && (
                                  <span key={cdr.city} className="ma-recap-pill">
                                    <MapPin size={10} />
                                    {cdr.city} · {fmtShort(cdr.start)} → {fmtShort(cdr.end)}
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

              {/* ── Card 3 : Centres d'intérêt ── */}
              <div className={["ma-card", !allDatesSet ? "ma-card-disabled" : ""].join(" ")}>
                <div className="ma-card-header">
                  <div className="ma-card-header-left">
                    <div className="ma-card-icon">
                      <Heart size={18} color="#2B96A8" />
                    </div>
                    <div>
                      <p className="ma-card-title">Centres d&apos;intérêt</p>
                      <p className="ma-card-sub">
                        {!allDatesSet
                          ? "Définissez d'abord les dates"
                          : selectedCats.length === 0
                          ? "Optionnel"
                          : `${selectedCats.length} sélectionné${selectedCats.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="ma-card-body">
                  {dbLoading ? (
                    <div className="ma-loading-row">
                      <Loader2 size={18} className={styles.spin} />
                      <span style={{ color: "#64748b" }}>Chargement des catégories...</span>
                    </div>
                  ) : (
                    <div className="ma-cats-wrap">
                      {categories.map((cat) => {
                        const catName  = String(cat.nom || cat.name || cat.label || "");
                        const isOn     = selectedCats.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCat(cat.id)}
                            className={["ma-cat-chip", isOn ? "ma-cat-chip-on" : ""].join(" ")}
                          >
                            <Sparkles size={12} />
                            {catName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Budget ── */}
                  <div style={{ marginTop: 20, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <Euro size={14} color="#2B96A8" />
                      Budget total (optionnel)
                    </p>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        min={0}
                        placeholder="Ex: 500"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 36px 10px 12px",
                          borderRadius: 10,
                          border: "1.5px solid #e2e8f0",
                          fontSize: 14,
                          color: "#1e293b",
                          outline: "none",
                          background: "#f8fafc",
                          boxSizing: "border-box",
                          transition: "border-color 0.2s",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#2B96A8"}
                        onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                      />
                      <span style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        fontSize: 14,
                        fontWeight: 600,
                        pointerEvents: "none",
                      }}>€</span>
                    </div>
                    {budget && Number(budget) > 0 && (
                      <p style={{ fontSize: 11, color: "#2B96A8", marginTop: 6 }}>
                        Budget de <strong>{Number(budget).toLocaleString("fr-FR")} €</strong> pris en compte
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* ── Footer CTA ── */}
            <div className="ma-footer">
              {pillParts.length > 0 && (
                <div className="ma-footer-pill">
                  <span>{selectedCities.length > 0 ? selectedCities.slice(0,3).join(", ") + (selectedCities.length > 3 ? ` +${selectedCities.length - 3}` : "") : ""}</span>
                  {totalDays > 0 && <>{" · "}<span>{totalDays} j</span></>}
                  {budget && Number(budget) > 0 && <>{" · "}<span>{Number(budget).toLocaleString("fr-FR")} €</span></>}
                </div>
              )}

              {/* Message d'avertissement si chevauchement encore actif */}
              {dateError && (
                <p style={{ fontSize: 12, color: "#c2410c", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={13} />
                  Corrigez les conflits de dates avant de générer
                </p>
              )}

              <button
                onClick={generate}
                disabled={!canGenerate}
                className="ma-generate-btn"
                title={dateError ? "Résolvez les conflits de dates d'abord" : undefined}
              >
                <Bot size={18} /> Générer mon itinéraire <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === "generation" && (
          <div className="ma-gen-screen">
            <div className="ma-gen-orb">
              <Bot size={32} color="#ffffff" strokeWidth={1.5} />
            </div>
            <h2 className="ma-gen-title">L&apos;agent IA prépare votre voyage…</h2>
            <p className="ma-gen-msg">{loadingMsg}</p>
            <div className="ma-gen-dots">
              {[0, 200, 400].map((delay) => (
                <div
                  key={delay}
                  className="ma-gen-dot"
                  style={{ animation: `ma-bounce 1.4s infinite ${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "itineraire" && itinerary && (
          <div style={{ flex: 1, overflow: "auto" }}>
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

      {showCheckout && itineraryAsExc && (
        <ExcursionClient exc={itineraryAsExc} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}