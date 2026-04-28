"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import ItineraireDisplay from "@/app/components/itineraire/ItineraireDisplay";
import {
  MapPin, Calendar, Sparkles, Bot, Loader2, Plus, X,
} from "lucide-react";
import styles from "@/public/style/ModeAssiste.module.css";

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

/* ── Types ── */
type DateSlot = { max_people?: number; booked?: number; available?: number };

type Ville = {
  id: string; nom?: string; name?: string;
  city?: string; description?: string;
  [key: string]: unknown;
};
type Categorie = {
  id: string; nom?: string; name?: string;
  label?: string; [key: string]: unknown;
};
type Excursion = {
  id: string; title: string; city: string;
  price_per_person?: number; duration_hours?: number;
  description?: string; categories?: string[];
  photos?: string[]; languages?: string[];
  inclusions?: string[]; rating?: number;
  reviews_count?: number; max_people?: number;
  available_dates?: Record<string, DateSlot> | null;
};
type Activity = {
  id: string; name: string; description?: string;
  time?: string; duration?: string; price?: number; icon?: string;
  photos?: string | string[]; languages?: string | string[];
  inclusion?: string | string[]; city?: string; rating?: number;
  places_restantes?: number;
};
type DayPlan = {
  day: number; city: string; theme?: string;
  emoji?: string; date?: string; activities: Activity[];
};
type Itinerary = { title: string; days: DayPlan[] };
type CityDates = Record<string, string[]>;

/* ── Quick-pick day options ── */
const QUICK_DAYS = [1, 2, 3, 5, 7, 10, 14];

const LOADING_MSGS = [
  "Récupération des excursions depuis Supabase…",
  "Vérification des disponibilités par date…",
  "L'agent IA organise votre itinéraire…",
  "Finalisation jour par jour…",
];

/* ── Helper : parse itinerary depuis la réponse n8n ── */
function extractItinerary(raw: unknown): Itinerary {
  const item = Array.isArray(raw) ? raw[0] : raw;
  const r = item as Record<string, unknown>;
  const candidates = [
    r?.output, r?.message, r?.text,
    r?.json, r?.data, r?.itinerary, item,
  ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const p  = typeof c === "string" ? JSON.parse(c) : c;
      const pr = p as Record<string, unknown>;
      if (Array.isArray(pr?.days) && (pr.days as unknown[]).length > 0)
        return p as Itinerary;
      const nested = pr?.itinerary || pr?.result;
      if (nested && Array.isArray((nested as Record<string, unknown>)?.days))
        return nested as Itinerary;
    } catch { /* */ }
  }
  throw new Error("Impossible de trouver l'itinéraire dans la réponse n8n.");
}

/* ── Helper : résumé disponibilité d'une excursion pour les dates demandées ── */
function buildDateAvailabilitySummary(
  exc: Excursion,
  requestedDates: string[],
): string {
  if (!requestedDates.length)
    return "Aucune date spécifiée — excursion utilisable sans restriction.";
  if (!exc.available_dates)
    return "available_dates NULL — excursion disponible sans restriction de date.";

  const lines: string[] = [];
  for (const date of requestedDates) {
    const slot = exc.available_dates[date];
    if (!slot) {
      lines.push(`  • ${date} → ❌ Non disponible (date absente du planning)`);
    } else {
      const max    = slot.max_people ?? exc.max_people ?? 0;
      const booked = slot.booked    ?? 0;
      const avail  = slot.available ?? (max - booked);
      if (avail <= 0) {
        lines.push(`  • ${date} → ❌ Complet (0 place restante sur ${max})`);
      } else {
        lines.push(
          `  • ${date} → ✅ Disponible — ${avail} place${avail > 1 ? "s" : ""} restante${avail > 1 ? "s" : ""} sur ${max}`,
        );
      }
    }
  }
  return lines.join("\n");
}

/* ── Composant picker de date par ville ──
   Utilise <div role="button"> pour éviter <button> dans <button>   */
function CityDateInput({
  nom, label, todayStr, onAdd, className,
}: {
  nom: string; label: string; todayStr: string;
  onAdd: (nom: string, date: string) => void; className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      onClick={e => { e.stopPropagation(); inputRef.current?.showPicker?.(); }}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation(); inputRef.current?.showPicker?.();
        }
      }}
    >
      <Plus size={10} />
      <span>{label}</span>
      <input
        ref={inputRef}
        type="date"
        min={todayStr}
        style={{
          opacity: 0, position: "absolute",
          width: 0, height: 0, pointerEvents: "none",
        }}
        onChange={e => {
          if (e.target.value) { onAdd(nom, e.target.value); e.target.value = ""; }
        }}
      />
    </div>
  );
}

/* ════════════════════════════
   Main Component
════════════════════════════ */
export default function ModeAssiste() {
  const supabase = createClient();

  // ✅ CORRIGÉ : type générique sur une seule ligne
  const [step, setStep] = useState<"questions" | "generation" | "itineraire" | "resume">("questions");

  const [days,           setDays]           = useState(5);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityDates,      setCityDates]      = useState<CityDates>({});
  const [selectedCats,   setSelectedCats]   = useState<string[]>([]);

  const [villes,     setVilles]     = useState<Ville[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [dbLoading,  setDbLoading]  = useState(true);

  const [itinerary,  setItinerary]  = useState<Itinerary | null>(null);
  const [genError,   setGenError]   = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const msgIdxRef = useRef(0);

  const [showCheckout, setShowCheckout] = useState(false);
  const [saving,       setSaving]       = useState(false);

  // ✅ CORRIGÉ : type générique sur une seule ligne
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error" | "login">("idle");

  /* ── Computed ── */
  const totalPrice =
    itinerary?.days.reduce(
      (acc, d) =>
        acc + d.activities.reduce((a, act) => a + (Number(act.price) || 0), 0),
      0,
    ) ?? 0;

  const itineraryAsExc = itinerary
    ? {
        id: "itinerary-" + Date.now(),
        title: itinerary.title,
        city: selectedCities.join(", "),
        duration_hours: itinerary.days.length * 8,
        price_per_person: totalPrice,
        max_people: 20,
      }
    : null;

  const todayStr = new Date().toISOString().split("T")[0];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  /* ── Load Supabase ── */
  useEffect(() => {
    const load = async () => {
      setDbLoading(true);
      try {
        const [{ data: v }, { data: c }, { data: e }] = await Promise.all([
          supabase.from("villes").select("*").order("nom"),
          supabase.from("categories").select("*").order("nom"),
          supabase
            .from("excursions")
            .select(
              "id, title, city, description, duration_hours, price_per_person, " +
              "max_people, categories, languages, inclusions, photos, rating, available_dates",
            )
            .eq("is_active", true),
        ]);
        setVilles((v || []) as unknown as Ville[]);
        setCategories((c || []) as unknown as Categorie[]);
        setExcursions((e || []) as Excursion[]);
      } catch { /* silent */ } finally { setDbLoading(false); }
    };
    load();
  }, []);

  /* ── Toggle city ── */
  const toggleCity = (nom: string) => {
    setSelectedCities(p => {
      if (p.includes(nom)) {
        setCityDates(prev => {
          const d = { ...prev }; delete d[nom]; return d;
        });
        return p.filter(x => x !== nom);
      }
      return [...p, nom];
    });
  };

  const addCityDate = (nom: string, date: string) => {
    if (!date) return;
    setCityDates(prev => {
      const existing = prev[nom] || [];
      if (existing.includes(date)) return prev;
      return { ...prev, [nom]: [...existing, date].sort() };
    });
  };

  const removeCityDate = (nom: string, date: string) => {
    setCityDates(prev => {
      const updated = (prev[nom] || []).filter(d => d !== date);
      if (updated.length === 0) {
        const d = { ...prev }; delete d[nom]; return d;
      }
      return { ...prev, [nom]: updated };
    });
  };

  const toggleCat = (id: string) =>
    setSelectedCats(p =>
      p.includes(id) ? p.filter(x => x !== id) : [...p, id],
    );

  /* ════════════════════════════════════════════
     GENERATE
  ════════════════════════════════════════════ */
  const generate = async () => {
    if (!selectedCities.length || !selectedCats.length || !N8N_WEBHOOK_URL)
      return;

    setStep("generation"); setGenError("");
    msgIdxRef.current = 0; setLoadingMsg(LOADING_MSGS[0]);

    const iv = setInterval(() => {
      msgIdxRef.current = Math.min(
        msgIdxRef.current + 1, LOADING_MSGS.length - 1,
      );
      setLoadingMsg(LOADING_MSGS[msgIdxRef.current]);
    }, 2200);

    try {
      const catNames = selectedCats
        .map(id => categories.find(c => c.id === id)?.nom)
        .filter(Boolean) as string[];

      const citiesSummary = selectedCities
        .map(city => {
          const dates = cityDates[city] || [];
          if (dates.length === 0)
            return `  - ${city} : aucune date précisée (toutes les excursions disponibles)`;
          return `  - ${city} : ${dates.map(formatDate).join(", ")}`;
        })
        .join("\n");

      const relExc = excursions.filter(e => selectedCities.includes(e.city));

      const excursionsPayload = relExc.map(e => ({
        id:          e.id,
        name:        e.title,
        city:        e.city,
        description: e.description || "",
        duration:    e.duration_hours ? `${e.duration_hours}h` : "2h",
        price:       e.price_per_person || 0,
        max_people:  e.max_people || 10,
        categories:  e.categories || [],
        languages:   e.languages || [],
        inclusions:  e.inclusions || [],
        photos:      e.photos || [],
        rating:      e.rating ?? null,
        availability_for_requested_dates: buildDateAvailabilitySummary(
          e, cityDates[e.city] || [],
        ),
      }));

      const message = `Tu es un expert en tourisme tunisien et planificateur de voyages professionnel.

═══════════════════════════════════════════
DEMANDE DU TOURISTE
═══════════════════════════════════════════
Durée totale : ${days} jour${days > 1 ? "s" : ""}
Centres d'intérêt : ${catNames.join(", ")}

Villes souhaitées avec les DATES DE VISITE :
${citiesSummary}

═══════════════════════════════════════════
RÈGLES DE DISPONIBILITÉ (TRÈS IMPORTANT)
═══════════════════════════════════════════
Chaque excursion ci-dessous indique son statut pour les dates demandées
via le champ "availability_for_requested_dates" :

  ✅ Disponible     → tu peux l'inclure.
                      Mentionne le nombre de places restantes dans la description.
  ❌ Complet        → NE PAS inclure cette excursion pour cette date.
  ❌ Non disponible → NE PAS inclure cette excursion pour cette date.

  Si aucune date n'est précisée pour une ville
  → tu peux utiliser toutes les excursions de cette ville sans restriction.

═══════════════════════════════════════════
ÉTAPES OBLIGATOIRES
═══════════════════════════════════════════
1. Utilise l'outil Supabase pour récupérer toutes les excursions actives
   (is_active = true) des villes demandées.
2. Pour chaque excursion récupérée, vérifie le champ "available_dates" (JSONB)
   pour les dates saisies par le touriste :
     - Lis la clé correspondant à la date (format YYYY-MM-DD).
     - Calcule les places restantes = max_people - booked
       (ou champ "available" si présent).
     - Si places restantes <= 0  → ❌ Complet, ignore-la.
     - Si la date n'existe pas dans available_dates → ❌ Non disponible, ignore-la.
     - Si available_dates est NULL ou vide → disponible sans restriction.
3. Génère l'itinéraire en utilisant UNIQUEMENT les IDs EXACTS trouvés dans Supabase.
4. Si une ville n'a aucune excursion disponible sur ses dates → ne l'inclus pas.
5. Maximum 3 activités par jour, 1 seule ville par jour.
6. Varie les catégories dans la même journée.
7. Répartis sur matin / après-midi / soir.

═══════════════════════════════════════════
EXCURSIONS DISPONIBLES (pré-filtrées par ville)
═══════════════════════════════════════════
${JSON.stringify(excursionsPayload, null, 2)}

═══════════════════════════════════════════
FORMAT DE RÉPONSE OBLIGATOIRE
═══════════════════════════════════════════
Réponds UNIQUEMENT avec un JSON brut valide.
Aucun texte avant ou après. Aucune balise markdown.

{
  "title": "Titre court et évocateur du voyage en français",
  "days": [
    {
      "day": 1,
      "city": "Nom exact de la ville",
      "theme": "Thème de la journée",
      "date": "YYYY-MM-DD (si date précisée, sinon omettre)",
      "activities": [
        {
          "id": "id-exact-copié-depuis-supabase",
          "name": "Nom exact de l'excursion",
          "description": "Phrase courte. Mentionner les places restantes si limité.",
          "time": "09:00",
          "duration": "2h",
          "price": 45,
          "photos": ["url_photo_1"],
          "languages": ["Français", "Arabe"],
          "inclusion": ["Transport", "Guide"],
          "city": "Nom exact de la ville",
          "rating": 4.5,
          "places_restantes": 8
        }
      ]
    }
  ]
}

═══════════════════════════════════════════
RAPPELS CRITIQUES
═══════════════════════════════════════════
- Le champ "id" doit être copié EXACTEMENT tel quel depuis Supabase.
- Ne jamais inventer un ID ou une excursion absente de Supabase.
- Ne jamais inclure une excursion ❌ Complet ou ❌ Non disponible.
- Le champ "places_restantes" doit refléter la valeur réelle calculée.`;

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:    "generate",
          message,
          days,
          cities:    selectedCities,
          cityDates,
          interests: catNames,
        }),
      });

      clearInterval(iv);
      if (!res.ok) throw new Error(`n8n ${res.status}`);
      const data = extractItinerary(await res.json());
      setItinerary(data);
      setStep("itineraire");
    } catch (err) {
      clearInterval(iv);
      setGenError(err instanceof Error ? err.message : "Erreur inconnue");
      setStep("questions");
    }
  };

  /* ── Change one activity ── */
  const handleChangeActivity = (
    dayIdx: number, actIdx: number, alt: Activity,
  ) => {
    if (!itinerary) return;
    const upd: Itinerary = JSON.parse(JSON.stringify(itinerary));
    upd.days[dayIdx].activities[actIdx] = alt;
    setItinerary(upd);
  };

  /* ── Save ── */
  const saveItinerary = async () => {
    if (!itinerary) return;
    setSaving(true); setSaveStatus("idle");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus("login"); setSaving(false); return; }
      const catNames = selectedCats
        .map(id => categories.find(c => c.id === id)?.nom)
        .filter(Boolean) as string[];
      const { error } = await supabase.from("itineraires").insert({
        user_id:                  user.id,
        nb_jours:                 days,
        villes_selectionnees:     selectedCities,
        dates_villes:             cityDates,
        categories_selectionnees: catNames,
        plan:                     itinerary,
      });
      setSaveStatus(error ? "error" : "ok");
    } catch { setSaveStatus("error"); }
    finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  /* ── Reset ── */
  const resetAll = () => {
    setStep("questions"); setItinerary(null);
    setSelectedCities([]); setSelectedCats([]);
    setCityDates({}); setDays(5); setGenError("");
    setShowCheckout(false); setSaveStatus("idle");
  };

  /* ── Slider % ── */
  const sliderPct = `${((days - 1) / 13) * 100}%`;
  const pillParts: string[] = [];
  if (days) pillParts.push(`${days}j`);
  if (selectedCities.length) pillParts.push(selectedCities.join(", "));

  /* ════════ RENDER ════════ */
  return (
    <div className={styles.root}>
      <TouristeNav />
      <div style={{ paddingTop: 64 }} />

      {step === "questions" && (
        <div className={styles.heading}>
          <h1 className={styles.headingTitle}>
            Composez votre <span>voyage idéal</span>
          </h1>
          <p className={styles.headingDesc}>
            Sélectionnez vos préférences — l&apos;agent IA construit votre
            itinéraire jour par jour.
          </p>
        </div>
      )}

      <main className={styles.body}>

        {/* ══ QUESTIONS ══ */}
        {step === "questions" && (
          <>
            {genError && (
              <div className={styles.errBanner}>
                <strong>Erreur agent IA :</strong> {genError}
              </div>
            )}

            <div className={styles.cardsRow}>

              {/* ── Card 1 : Durée ── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Calendar size={14} color="#2B96A8" />
                  </div>
                  <div>
                    <p className={styles.cardTitle}>Durée du voyage</p>
                    <p className={styles.cardSub}>Glissez ou choisissez un raccourci</p>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.dureSliderRow}>
                    <div className={styles.dureSliderWrap}>
                      <input
                        type="range" min="1" max="14" step="1" value={days}
                        className={styles.range}
                        style={{ "--val": sliderPct } as React.CSSProperties}
                        onChange={e => setDays(Number(e.target.value))}
                      />
                      <div className={styles.rangeLabels}>
                        <span>1 jour</span><span>14 jours</span>
                      </div>
                    </div>
                    <div className={styles.daysDisplay}>
                      <span className={styles.daysNumber}>{days}</span>
                      <span className={styles.daysLabel}>JOURS</span>
                    </div>
                  </div>
                  <div className={styles.daysQuickRow}>
                    {QUICK_DAYS.map(n => (
                      <button
                        key={n}
                        className={`${styles.dayQuickBtn} ${days === n ? styles.dayQuickBtnOn : ""}`}
                        onClick={() => setDays(n)}
                      >
                        {n}j
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Card 2 : Catégories ── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Sparkles size={14} color="#2B96A8" />
                  </div>
                  <div>
                    <p className={styles.cardTitle}>Centres d&apos;intérêt</p>
                    <p className={styles.cardSub}>
                      {selectedCats.length === 0
                        ? "optionnel"
                        : `${selectedCats.length} sélectionné${selectedCats.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  {dbLoading ? (
                    <div className={styles.loadingText}>
                      <Loader2 size={13} className={styles.spin} /> Chargement…
                    </div>
                  ) : (
                    <div className={styles.chipsGrid}>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          className={`${styles.chip} ${selectedCats.includes(cat.id) ? styles.chipOn : ""}`}
                          onClick={() => toggleCat(cat.id)}
                        >
                          {String(cat.nom || cat.name || cat.label || "")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Card 3 : Villes ── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <MapPin size={14} color="#2B96A8" />
                  </div>
                  <div>
                    <p className={styles.cardTitle}>Villes à explorer</p>
                    <p className={styles.cardSub}>
                      Sélectionnez les destinations et ajoutez vos dates
                    </p>
                  </div>
                  {selectedCities.length > 0 && (
                    <span className={styles.cardBadge}>
                      {selectedCities.length} sélectionnée
                      {selectedCities.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  {dbLoading ? (
                    <div className={styles.loadingText}>
                      <Loader2 size={13} className={styles.spin} /> Chargement…
                    </div>
                  ) : (
                    <div className={styles.citiesGrid}>
                      {villes.map(v => {
                        const nom   = String(v.nom || v.name || "");
                        const desc  = String(v.description || "");
                        const on    = selectedCities.includes(nom);
                        const dates = cityDates[nom] || [];

                        return (
                          <button
                            key={v.id}
                            className={`${styles.cityCard} ${on ? styles.cityOn : ""}`}
                            onClick={() => toggleCity(nom)}
                          >
                            {on && (
                              <span className={styles.cityCheckDot}>
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                  <path
                                    d="M1.5 4L3.2 5.8L6.5 2.5"
                                    stroke="white" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            )}

                            <span className={styles.cityName}>{nom}</span>
                            {desc && <span className={styles.cityDesc}>{desc}</span>}

                            {on && (
                              <div
                                className={styles.cityDatesSection}
                                onClick={e => e.stopPropagation()}
                              >
                                {dates.length > 0 && (
                                  <div className={styles.cityDatePills}>
                                    {dates.map(d => (
                                      <span key={d} className={styles.cityDatePill}>
                                        <Calendar size={9} />
                                        {formatDate(d)}
                                        <span
                                          role="button"
                                          tabIndex={0}
                                          className={styles.cityDatePillRemove}
                                          onClick={e => {
                                            e.stopPropagation();
                                            removeCityDate(nom, d);
                                          }}
                                          onKeyDown={e => {
                                            if (e.key === "Enter" || e.key === " ") {
                                              e.stopPropagation();
                                              removeCityDate(nom, d);
                                            }
                                          }}
                                          title="Supprimer cette date"
                                        >
                                          <X size={9} />
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <CityDateInput
                                  nom={nom}
                                  label={
                                    dates.length === 0
                                      ? "Ajouter une date"
                                      : "Ajouter une autre date"
                                  }
                                  todayStr={todayStr}
                                  onAdd={addCityDate}
                                  className={styles.cityDateAddBtn}
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── CTA bar ── */}
            <div className={styles.footer}>
              {pillParts.length > 0 && (
                <div className={styles.selectionPill}>
                  <span>{pillParts.join(" · ")}</span>
                </div>
              )}
              <button
                className={styles.btnPrimary}
                onClick={generate}
                disabled={
                  !selectedCities.length ||
                  !selectedCats.length   ||
                  !N8N_WEBHOOK_URL
                }
              >
                <Bot size={16} /> Composer mon itinéraire →
              </button>
            </div>
          </>
        )}

        {/* ══ GÉNÉRATION ══ */}
        {step === "generation" && (
          <div className={styles.genScreen}>
            <div className={styles.genOrb}>
              <Bot size={34} color="white" strokeWidth={1.5} />
            </div>
            <h2 className={styles.genTitle}>
              L&apos;agent IA prépare votre voyage…
            </h2>
            <p className={styles.genMsg}>{loadingMsg}</p>
            <div className={styles.dots}>
              <div className={styles.dotAnim} />
              <div className={styles.dotAnim} />
              <div className={styles.dotAnim} />
            </div>
          </div>
        )}

        {/* ══ ITINÉRAIRE ══ */}
        {step === "itineraire" && itinerary && (
          <div className={styles.itiRoot}>
            <ItineraireDisplay
              itinerary={itinerary}
              selectedCities={selectedCities}
              selectedCats={selectedCats}
              categories={
                categories as { id: string; nom?: string; name?: string }[]
              }
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
        <CheckoutModal
          exc={itineraryAsExc}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}