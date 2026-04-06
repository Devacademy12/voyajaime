"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import {
  MapPin, Clock, Sparkles, ChevronRight, ChevronLeft,
  RotateCcw, CheckCircle, Calendar, Bot,
  RefreshCw, X, Loader2,
} from "lucide-react";
import styles from "@/public/style/ModeAssiste.module.css";

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

/* ── Types ── */
type Ville     = { id: string; nom?: string; name?: string; city?: string; description?: string; [key: string]: unknown; };
type Categorie = { id: string; nom?: string; name?: string; label?: string; [key: string]: unknown; };
type Excursion = {
  id: string; title: string; city: string;
  price_per_person?: number; duration_hours?: number;
  description?: string; categories?: string[];
};
type Activity = {
  id: string; name: string; description?: string;
  time: string; duration: string; price: number; icon?: string;
};
type DayPlan   = { day: number; city: string; theme?: string; emoji?: string; activities: Activity[]; };
type Itinerary = { title: string; days: DayPlan[]; };

/* ── Quick-pick day options ── */
const QUICK_DAYS = [1, 2, 3, 5, 7, 10, 14];

const LOADING_MSGS = [
  "Récupération des excursions depuis la base…",
  "Analyse des activités disponibles…",
  "L'agent IA organise votre itinéraire…",
  "Finalisation jour par jour…",
];

function cityEmoji(city: string) {
  const map: Record<string, string> = {
    Tunis: "🏛️", Sousse: "🏖️", Sfax: "🏭", Djerba: "🌴",
    Tozeur: "🌵", Carthage: "🏺", Hammamet: "🌊", Kairouan: "🕌",
  };
  return map[city] || "📍";
}

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

/* ════════════════════════════════════════════
   Component
════════════════════════════════════════════ */
export default function ModeAssiste() {
  const supabase = createClient();

  const [step, setStep]             = useState<"questions" | "generation" | "itineraire">("questions");
  const [days, setDays]             = useState(5);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCats,   setSelectedCats]   = useState<string[]>([]);

  const [villes,     setVilles]     = useState<Ville[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [dbLoading,  setDbLoading]  = useState(true);

  const [itinerary,  setItinerary]  = useState<Itinerary | null>(null);
  const [genError,   setGenError]   = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [activeDay,  setActiveDay]  = useState(0);
  const msgIdxRef = useRef(0);

  const [editing,    setEditing]    = useState<{ dayIdx: number; actIdx: number } | null>(null);
  const [altOptions, setAltOptions] = useState<Activity[]>([]);

  const [showCheckout, setShowCheckout] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saveStatus,   setSaveStatus]   = useState<"idle" | "ok" | "error" | "login">("idle");

  const totalPrice = itinerary?.days.reduce(
    (acc, d) => acc + d.activities.reduce((a, act) => a + (Number(act.price) || 0), 0), 0
  ) ?? 0;

  const itineraryAsExc = itinerary ? {
    id:               "itinerary-" + Date.now(),
    title:            itinerary.title,
    city:             selectedCities.join(", "),
    duration_hours:   itinerary.days.length * 8,
    price_per_person: totalPrice,
    max_people:       20,
  } : null;

  /* ── Load Supabase ── */
  useEffect(() => {
    const load = async () => {
      setDbLoading(true);
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
        if (ve || ce || ee) throw new Error("Erreur chargement");
        setVilles((v || []) as unknown as Ville[]);
        setCategories((c || []) as unknown as Categorie[]);
        setExcursions((e || []) as Excursion[]);
      } catch {
        // silent
      } finally {
        setDbLoading(false);
      }
    };
    load();
  }, []);

  const toggleCity = (nom: string) =>
    setSelectedCities(p => p.includes(nom) ? p.filter(x => x !== nom) : [...p, nom]);
  const toggleCat  = (id: string) =>
    setSelectedCats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  /* ── Generate ── */
  const generate = async () => {
    if (!selectedCities.length || !selectedCats.length || !N8N_WEBHOOK_URL) return;
    setStep("generation"); setGenError("");
    msgIdxRef.current = 0; setLoadingMsg(LOADING_MSGS[0]);
    const iv = setInterval(() => {
      msgIdxRef.current = Math.min(msgIdxRef.current + 1, LOADING_MSGS.length - 1);
      setLoadingMsg(LOADING_MSGS[msgIdxRef.current]);
    }, 2200);
    try {
      const relExc   = excursions.filter(e => selectedCities.includes(e.city));
      const catNames = selectedCats.map(id => categories.find(c => c.id === id)?.nom).filter(Boolean);
      const message  = `Tu es un expert en tourisme tunisien.
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
        body: JSON.stringify({ action: "generate", message, days, cities: selectedCities, interests: catNames }),
      });
      clearInterval(iv);
      if (!res.ok) throw new Error(`n8n ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = extractItinerary(await res.json());
      setItinerary(data); setActiveDay(0); setStep("itineraire");
    } catch (err) {
      clearInterval(iv);
      setGenError(err instanceof Error ? err.message : "Erreur inconnue");
      setStep("questions");
    }
  };

  /* ── Alternatives ── */
  const openEdit = (dayIdx: number, actIdx: number) => {
    setEditing({ dayIdx, actIdx });
    const city  = itinerary!.days[dayIdx].city;
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
        user_id: user.id, nb_jours: days,
        villes_selectionnees: selectedCities,
        categories_selectionnees: catNames,
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
    setStep("questions"); setItinerary(null); setSelectedCities([]);
    setSelectedCats([]); setDays(5); setActiveDay(0); setGenError("");
    setShowCheckout(false); setSaveStatus("idle");
  };

  /* ── Slider percent for CSS custom property ── */
  const sliderPct = `${((days - 1) / 13) * 100}%`;

  /* ── Selection pill text ── */
  const pillParts: string[] = [];
  if (days) pillParts.push(`${days}j`);
  if (selectedCities.length) pillParts.push(selectedCities.join(", "));

  /* ════════ RENDER ════════ */
  return (
    <div className={styles.root}>

       <TouristeNav />
            <div style={{ paddingTop: 64 }}>   </div>
           

      {step === "questions" && (
        <div className={styles.heading}>
          <h1 className={styles.headingTitle}>
            Composez votre <span>voyage idéal</span>
          </h1>
          <p className={styles.headingDesc}>
            Sélectionnez vos préférences — l&apos;agent IA construit votre itinéraire jour par jour.
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

              {/* ─── Card 1 — Durée ─── */}
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
                  {/* Slider + big display side by side */}
                  <div className={styles.dureSliderRow}>
                    <div className={styles.dureSliderWrap}>
                      <input
                        type="range"
                        min="1" max="14" step="1"
                        value={days}
                        className={styles.range}
                        style={{ "--val": sliderPct } as React.CSSProperties}
                        onChange={e => setDays(Number(e.target.value))}
                      />
                      <div className={styles.rangeLabels}>
                        <span>1 jour</span>
                        <span>14 jours</span>
                      </div>
                    </div>
                    <div className={styles.daysDisplay}>
                      <span className={styles.daysNumber}>{days}</span>
                      <span className={styles.daysLabel}>JOURS</span>
                    </div>
                  </div>

                  {/* Quick-pick pills */}
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

              {/* ─── Card 2 — Catégories ─── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <Sparkles size={14} color="#2B96A8" />
                  </div>
                  <div>
                    <p className={styles.cardTitle}>Centres d&apos;intérêt</p>
                    <p className={styles.cardSub}>
                      {selectedCats.length === 0 ? "optionnel" : `${selectedCats.length} sélectionné${selectedCats.length > 1 ? "s" : ""}`}
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

              {/* ─── Card 3 — Villes ─── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <MapPin size={14} color="#2B96A8" />
                  </div>
                  <div>
                    <p className={styles.cardTitle}>Villes à explorer</p>
                    <p className={styles.cardSub}>Sélectionnez les destinations</p>
                  </div>
                  {selectedCities.length > 0 && (
                    <span className={styles.cardBadge}>
                      {selectedCities.length} sélectionnée{selectedCities.length > 1 ? "s" : ""}
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
                        const nom  = String(v.nom || v.name || "");
                        const desc = String(v.description || "");
                        const on   = selectedCities.includes(nom);
                        return (
                          <button
                            key={v.id}
                            className={`${styles.cityCard} ${on ? styles.cityOn : ""}`}
                            onClick={() => toggleCity(nom)}
                          >
                            {on && (
                              <span className={styles.cityCheckDot}>
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                  <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </span>
                            )}
                            <span className={styles.cityName}>{nom}</span>
                            {desc && <span className={styles.cityDesc}>{desc}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* CTA bar */}
            <div className={styles.footer}>
              {pillParts.length > 0 && (
                <div className={styles.selectionPill}>
                  <span>{pillParts.join(" · ")}</span>
                </div>
              )}
              <button
                className={styles.btnPrimary}
                onClick={generate}
                disabled={!selectedCities.length || !selectedCats.length || !N8N_WEBHOOK_URL}
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
            <h2 className={styles.genTitle}>L&apos;agent IA prépare votre voyage…</h2>
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

            <div className={styles.itiHeader}>
              <div>
                <h1 className={styles.itiTitle}>{itinerary.title}</h1>
                <p className={styles.itiMeta}>{itinerary.days.length} jours · {selectedCities.join(", ")}</p>
              </div>
              <button className={styles.btnSecondary} onClick={() => setStep("questions")}>
                <RefreshCw size={12} /> Modifier
              </button>
            </div>

            <div className={styles.dayTabs}>
              {itinerary.days.map((d, i) => (
                <button
                  key={i}
                  className={`${styles.dayTab} ${activeDay === i ? styles.dayTabOn : ""}`}
                  onClick={() => setActiveDay(i)}
                >
                  {d.emoji || cityEmoji(d.city)} Jour {d.day}
                </button>
              ))}
            </div>

            {(() => {
              const day = itinerary.days[activeDay];
              return (
                <div className={styles.itiBody}>
                  <div className={styles.dayBanner}>
                    <span className={styles.dayBannerEmoji}>{day.emoji || cityEmoji(day.city)}</span>
                    <div>
                      <p className={styles.dayBannerName}>Jour {day.day} — {day.city}</p>
                      {day.theme && <p className={styles.dayBannerTheme}>{day.theme}</p>}
                    </div>
                  </div>

                  {day.activities.map((act, ai) => (
                    <div key={act.id || ai}>
                      {editing?.dayIdx === activeDay && editing?.actIdx === ai ? (
                        <div className={styles.altPanel}>
                          <div className={styles.altHeader}>
                            <p className={styles.altTitle}>Alternatives pour « {act.name} »</p>
                            <button className={styles.closeBtn} onClick={() => { setEditing(null); setAltOptions([]); }}>
                              <X size={14} />
                            </button>
                          </div>
                          {altOptions.length === 0 ? (
                            <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", padding: 12 }}>
                              Aucune alternative disponible pour {day.city}.
                            </p>
                          ) : altOptions.map((alt, oi) => (
                            <div key={oi} className={styles.altCard} onClick={() => applyAlt(alt)}>
                              <div className={styles.altTop}>
                                <p className={styles.altName}>{alt.name}</p>
                                <span className={styles.priceBadge}>
                                  {!alt.price || alt.price === 0 ? "Gratuit" : `${alt.price} TND`}
                                </span>
                              </div>
                              {alt.description && <p style={{ fontSize: 11, color: "#6B7280", margin: "3px 0" }}>{alt.description}</p>}
                              <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0 }}>⏱ {alt.duration}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.actCard}>
                          <div className={styles.actEmoji}>{act.icon || "🗺️"}</div>
                          <div className={styles.actInfo}>
                            <div className={styles.actTop}>
                              <div style={{ minWidth: 0 }}>
                                <p className={styles.actName}>{act.name}</p>
                                <p className={styles.actMeta}><Clock size={10} /> {act.time} · {act.duration}</p>
                              </div>
                              <span className={styles.priceBadge}>
                                {!act.price || act.price === 0 ? "Gratuit" : `${act.price} TND`}
                              </span>
                            </div>
                            {act.description && <p className={styles.actDesc}>{act.description}</p>}
                          </div>
                          <button className={styles.changeBtn} onClick={() => openEdit(activeDay, ai)}>
                            <RefreshCw size={11} /> Changer
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ display: "flex", justifyContent: "space-between", flexShrink: 0, marginTop: 2 }}>
                    <button
                      className={styles.btnSecondary}
                      style={{ visibility: activeDay > 0 ? "visible" : "hidden" }}
                      onClick={() => setActiveDay(activeDay - 1)}
                    >
                      <ChevronLeft size={13} /> Jour {activeDay}
                    </button>
                    {activeDay < itinerary.days.length - 1 ? (
                      <button className={styles.btnPrimary} style={{ padding: "10px 24px", fontSize: 13 }} onClick={() => setActiveDay(activeDay + 1)}>
                        Jour {activeDay + 2} <ChevronRight size={13} />
                      </button>
                    ) : (
                      <button className={styles.btnPrimary} style={{ padding: "10px 24px", fontSize: 13 }} onClick={() => setShowCheckout(true)}>
                        <CheckCircle size={13} /> Réserver
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {saveStatus === "ok"    && <div className={`${styles.saveFeedback} ${styles.saveFeedbackOk}`}><CheckCircle size={13} /> Itinéraire sauvegardé !</div>}
            {saveStatus === "error" && <div className={`${styles.saveFeedback} ${styles.saveFeedbackErr}`}>✕ Erreur de sauvegarde. Réessayez.</div>}
            {saveStatus === "login" && <div className={`${styles.saveFeedback} ${styles.saveFeedbackLogin}`}>🔒 Connectez-vous pour sauvegarder.</div>}

            <div className={styles.recap}>
              <div className={styles.recapPrice}>
                <p className={styles.recapPriceLabel}>Total estimé</p>
                <p className={styles.recapPriceValue}>{totalPrice}<span className={styles.recapPriceSuffix}>TND</span></p>
              </div>
              <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                {itinerary.days.length} jours · {selectedCities.join(", ")}
              </p>
              <div className={styles.recapActions}>
                <button className={styles.saveBtn} onClick={saveItinerary} disabled={saving || saveStatus === "ok"}>
                  {saving
                    ? <><Loader2 size={12} className={styles.spin} /> Sauvegarde…</>
                    : saveStatus === "ok"
                    ? <><CheckCircle size={12} /> Sauvegardé !</>
                    : <>💾 Sauvegarder</>}
                </button>
                <button className={styles.btnPrimary} style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => setShowCheckout(true)}>
                  Finaliser <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button className={styles.resetLink} onClick={resetAll}>
                <RotateCcw size={10} /> Recommencer depuis le début
              </button>
            </div>
          </div>
        )}

      </main>

      {showCheckout && itineraryAsExc && (
        <CheckoutModal exc={itineraryAsExc} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}