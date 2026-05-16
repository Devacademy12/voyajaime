"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import {
  MapPin, Calendar, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, SlidersHorizontal, ChevronRight,
} from "lucide-react";

type Ville     = { id: string; nom: string; emoji?: string; region?: string; active: boolean };
type Categorie = { id: string; nom: string; emoji?: string; couleur?: string };

/* ─── Données des étapes ─── */
const STEPS = [
  { id: 1, label: "Durée",        icon: "📅", hint: "Combien de jours ?" },
  { id: 2, label: "Destinations", icon: "🗺️", hint: "Quelles villes ?" },
  { id: 3, label: "Intérêts",     icon: "✨", hint: "Vos centres d'intérêt" },
];

const QUICK_DAYS = [2, 3, 5, 7, 10, 14];

/* ─── CSS inline ─── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ml-root {
  min-height: 100vh;
  background: #F7F9FC;
  font-family: 'DM Sans', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
}

/* ── Topbar ── */
.ml-topbar {
  background: white;
  border-bottom: 1px solid #EEF1F5;
  padding: 18px 40px;
  text-align: center;
  box-shadow: 0 1px 6px rgba(0,0,0,.04);
}
.ml-topbar-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 14px; border-radius: 24px;
  background: rgba(43,150,168,.09);
  font-size: 11px; font-weight: 700; color: #2B96A8;
  letter-spacing: .06em; margin-bottom: 8px;
}
.ml-topbar h1 {
  font-family: 'Playfair Display', serif;
  font-size: 22px; font-weight: 900; color: #111827;
}
.ml-topbar h1 span { color: #2B96A8; }

/* ── Progress bar ── */
.ml-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 28px 40px 0;
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
}
.ml-step-item {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
}
.ml-step-circle {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
  border: 2px solid #E5E7EB;
  background: white;
  transition: all .3s ease;
  position: relative; z-index: 1;
}
.ml-step-circle.done   { background: #2B96A8; border-color: #2B96A8; }
.ml-step-circle.active { background: white; border-color: #2B96A8; box-shadow: 0 0 0 4px rgba(43,150,168,.15); }
.ml-step-circle.pending { background: white; border-color: #E5E7EB; }
.ml-step-label {
  font-size: 11px; font-weight: 600; color: #9CA3AF;
  margin-top: 6px; white-space: nowrap;
  position: absolute; top: 42px; left: 50%; transform: translateX(-50%);
  transition: color .3s;
}
.ml-step-label.active  { color: #2B96A8; }
.ml-step-label.done    { color: #2B96A8; }
.ml-step-connector {
  flex: 1; height: 2px;
  background: #E5E7EB;
  margin: 0 -2px;
  position: relative;
  transition: background .3s;
}
.ml-step-connector.done { background: #2B96A8; }

/* ── Content ── */
.ml-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px 40px;
}
.ml-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #EEF1F5;
  box-shadow: 0 4px 24px rgba(0,0,0,.06);
  padding: 40px;
  width: 100%;
  max-width: 580px;
  animation: ml-fadein .3s ease;
}
@keyframes ml-fadein {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}
.ml-card-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: rgba(43,150,168,.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; margin-bottom: 20px;
}
.ml-card h2 {
  font-family: 'Playfair Display', serif;
  font-size: 24px; font-weight: 900; color: #111827;
  margin-bottom: 6px;
}
.ml-card p.sub {
  font-size: 14px; color: #6B7280; margin-bottom: 28px; line-height: 1.6;
}

/* ── Durée slider ── */
.ml-slider-wrap {
  background: #F8FAFC;
  border-radius: 16px;
  border: 1px solid #EEF1F5;
  padding: 28px;
  margin-bottom: 20px;
}
.ml-days-display {
  text-align: center; margin-bottom: 20px;
}
.ml-days-num {
  font-family: 'Playfair Display', serif;
  font-size: 64px; font-weight: 900; color: #2B96A8;
  line-height: 1;
}
.ml-days-unit {
  font-size: 14px; color: #9CA3AF; font-weight: 600;
  text-transform: uppercase; letter-spacing: .08em;
  display: block; margin-top: 4px;
}
.ml-slider {
  width: 100%;
  height: 6px;
  accent-color: #2B96A8;
  cursor: pointer;
  margin-bottom: 8px;
}
.ml-slider-labels {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #C4C9D0;
}
.ml-quick-btns {
  display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;
}
.ml-quick-btn {
  padding: 7px 16px; border-radius: 20px;
  border: 1.5px solid #E5E7EB; background: white;
  color: #6B7280; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.ml-quick-btn:hover, .ml-quick-btn.active {
  border-color: #2B96A8; background: #2B96A8; color: white;
}

/* ── Villes grid ── */
.ml-villes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.ml-ville-btn {
  padding: 14px 10px; border-radius: 14px;
  border: 2px solid #EEF1F5; background: white;
  text-align: center; cursor: pointer; font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  transition: all .18s; position: relative;
}
.ml-ville-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(43,150,168,.22); }
.ml-ville-btn.selected {
  border-color: #2B96A8;
  background: rgba(43,150,168,.05);
  box-shadow: 0 6px 16px -6px rgba(43,150,168,.28);
}
.ml-ville-btn .check {
  position: absolute; top: 6px; right: 6px;
  width: 16px; height: 16px; background: #2B96A8; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.ml-ville-emoji { font-size: 22px; margin-bottom: 4px; display: block; }
.ml-ville-name  { font-size: 12px; font-weight: 700; color: #1F2937; }

/* ── Catégories ── */
.ml-cats-wrap {
  display: flex; flex-wrap: wrap; gap: 10px;
}
.ml-cat-chip {
  padding: 9px 16px; border-radius: 22px;
  border: 1.5px solid #E5E7EB; background: white;
  color: #6B7280; font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; gap: 6px;
  transition: all .15s;
}
.ml-cat-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,.08); }
.ml-cat-chip.active { font-weight: 700; border-width: 2px; }

/* ── Footer navigation ── */
.ml-footer {
  width: 100%; max-width: 580px;
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 24px; gap: 12px;
}
.ml-btn-back {
  display: flex; align-items: center; gap: 7px;
  padding: 13px 22px; border-radius: 13px;
  background: white; border: 1.5px solid #E5E7EB;
  color: #6B7280; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.ml-btn-back:hover { border-color: #C4C9D0; color: #374151; }
.ml-btn-next {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 28px; border-radius: 13px;
  background: #2B96A8; border: none;
  color: white; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all .2s;
  box-shadow: 0 4px 16px rgba(43,150,168,.35);
}
.ml-btn-next:hover:not(:disabled) {
  background: #248899;
  box-shadow: 0 6px 22px rgba(43,150,168,.45);
  transform: translateY(-1px);
}
.ml-btn-next:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
.ml-btn-start {
  background: linear-gradient(135deg, #2B96A8, #1d7a8a);
}

/* ── Résumé chips ── */
.ml-summary {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: 20px;
}
.ml-summary-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 20px;
  background: rgba(43,150,168,.08);
  border: 1px solid rgba(43,150,168,.2);
  font-size: 12px; font-weight: 600; color: #2B96A8;
}
`;

/* ═══════════════════════════════════════ */

function ConfigInner() {
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);

  const [step, setStep]         = useState(1);
  const [days, setDays]         = useState(3);
  const [selCities, setSelCities] = useState<string[]>([]);
  const [selCats, setSelCats]   = useState<string[]>([]);

  const [villes, setVilles]         = useState<Ville[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: v }, { data: c }] = await Promise.all([
        sb.from("villes").select("*").eq("active", true).order("nom"),
        sb.from("categories").select("*").order("nom"),
      ]);
      setVilles((v || []) as Ville[]);
      setCategories((c || []) as Categorie[]);
      setLoading(false);
    })();
  }, []);

  const toggleCity = (nom: string) =>
    setSelCities(p => p.includes(nom) ? p.filter(x => x !== nom) : [...p, nom]);

  const toggleCat = (id: string) =>
    setSelCats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const goToBuilder = () => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("cities", selCities.join(","));
    if (selCats.length > 0) params.set("cats", selCats.join(","));
    router.push(`/modeLibre/builder?${params.toString()}`);
  };

  const canNext = step === 1 ? true : step === 2 ? selCities.length > 0 : true;

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1);
    else goToBuilder();
  };

  return (
    <div className="ml-root">
      <style>{STYLE}</style>
      <TouristeNav />

      {/* Topbar */}
      <div className="ml-topbar">
        <div className="ml-topbar-badge">
          <SlidersHorizontal size={12} /> Mode Libre
        </div>
        <h1>Construisez votre voyage <span>à votre façon</span></h1>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 28 }}>
        <div className="ml-progress">
          {STEPS.map((s, i) => {
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="ml-step-item" style={{ flex: "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className={`ml-step-circle ${done ? "done" : active ? "active" : "pending"}`}>
                      {done
                        ? <CheckCircle2 size={18} color="white" />
                        : <span style={{ fontSize: 18 }}>{s.icon}</span>
                      }
                    </div>
                    <span className={`ml-step-label ${done ? "done" : active ? "active" : ""}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`ml-step-connector ${done ? "done" : ""}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="ml-content">

        {/* ─── Étape 1 : Durée ─── */}
        {step === 1 && (
          <div className="ml-card" key="step1">
            <div className="ml-card-icon">📅</div>
            <h2>Combien de jours ?</h2>
            <p className="sub">Choisissez la durée de votre séjour en Tunisie</p>
            <div className="ml-slider-wrap">
              <div className="ml-days-display">
                <span className="ml-days-num">{days}</span>
                <span className="ml-days-unit">jour{days > 1 ? "s" : ""}</span>
              </div>
              <input type="range" min={1} max={14} value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="ml-slider" />
              <div className="ml-slider-labels">
                <span>1 jour</span><span>14 jours</span>
              </div>
              <div className="ml-quick-btns">
                {QUICK_DAYS.map(d => (
                  <button key={d} className={`ml-quick-btn ${days === d ? "active" : ""}`}
                    onClick={() => setDays(d)}>
                    {d}j
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Étape 2 : Villes ─── */}
        {step === 2 && (
          <div className="ml-card" key="step2">
            <div className="ml-card-icon">🗺️</div>
            <h2>Quelles destinations ?</h2>
            <p className="sub">Sélectionnez les villes que vous souhaitez visiter</p>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Loader2 size={28} color="#2B96A8" style={{ animation: "spin .7s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <div className="ml-villes-grid">
                {villes.map(v => {
                  const selected = selCities.includes(v.nom);
                  return (
                    <button key={v.id} className={`ml-ville-btn ${selected ? "selected" : ""}`}
                      onClick={() => toggleCity(v.nom)}>
                      {selected && (
                        <div className="check">
                          <CheckCircle2 size={10} color="white" />
                        </div>
                      )}
                      <span className="ml-ville-emoji">{v.emoji || "📍"}</span>
                      <span className="ml-ville-name">{v.nom}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {selCities.length > 0 && (
              <div className="ml-summary">
                {selCities.map(c => (
                  <span key={c} className="ml-summary-chip">
                    <MapPin size={11} /> {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Étape 3 : Catégories ─── */}
        {step === 3 && (
          <div className="ml-card" key="step3">
            <div className="ml-card-icon">✨</div>
            <h2>Vos centres d'intérêt</h2>
            <p className="sub">Optionnel — aide à personnaliser votre itinéraire dans le builder</p>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Loader2 size={28} color="#2B96A8" style={{ animation: "spin .7s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <div className="ml-cats-wrap">
                {categories.map(cat => {
                  const active = selCats.includes(cat.id);
                  return (
                    <button key={cat.id}
                      className={`ml-cat-chip ${active ? "active" : ""}`}
                      style={active ? {
                        borderColor: cat.couleur || "#2B96A8",
                        color: cat.couleur || "#2B96A8",
                        background: `${cat.couleur || "#2B96A8"}12`,
                      } : {}}
                      onClick={() => toggleCat(cat.id)}>
                      {cat.emoji && <span>{cat.emoji}</span>}
                      {cat.nom}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Résumé final */}
            <div style={{
              marginTop: 28, padding: "16px 20px",
              background: "#F0FDF4", borderRadius: 14,
              border: "1px solid #BBF7D0",
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#065F46", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
                Récapitulatif
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className="ml-summary-chip"><Calendar size={11} /> {days} jour{days > 1 ? "s" : ""}</span>
                {selCities.map(c => (
                  <span key={c} className="ml-summary-chip"><MapPin size={11} /> {c}</span>
                ))}
                {selCats.length > 0 && (
                  <span className="ml-summary-chip"><Sparkles size={11} /> {selCats.length} intérêt{selCats.length > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="ml-footer">
          {step > 1 ? (
            <button className="ml-btn-back" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={15} /> Retour
            </button>
          ) : <div />}

          <button
            className={`ml-btn-next ${step === 3 ? "ml-btn-start" : ""}`}
            onClick={handleNext}
            disabled={!canNext}>
            {step === 3 ? (
              <><SlidersHorizontal size={15} /> Ouvrir le builder</>
            ) : (
              <>Continuer <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModeLibrePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F7F9FC" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation: "spin .7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ConfigInner />
    </Suspense>
  );
}