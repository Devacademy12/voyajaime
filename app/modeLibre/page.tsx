"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import TouristeNav from "../components/touriste/TouristeNav";

import { createClient } from "@/lib/supabaseClient";
import {
  ArrowRight, ArrowLeft, Calendar, MapPin, Layers, SlidersHorizontal,
  CheckCircle2, AlertCircle, RotateCw, RefreshCw, Database, Loader2,
} from "lucide-react";

/* ─────────────── TYPES ─────────────── */
type Categorie = { id: string; nom: string; emoji: string; couleur: string; };
type Ville     = { id: string; nom: string; emoji: string; region: string; description: string; active: boolean; };

function tog<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

/* ─────────────── CSS ─────────────── */
const CSS_CONFIG = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; }

:root {
  --primary: #2B96A8;
  --title: #053366;
  --bg: #F6F9FB;
  --white: #ffffff;
  --border: #E8EDF2;
  --text: #374151;
  --muted: #9CA3AF;
}

.mlp-page {
  min-height: calc(100vh - 64px);
  background: var(--bg);
  font-family: 'DM Sans', system-ui, sans-serif;
  display: flex; flex-direction: column;
}

/* ── Topbar ── */
.mlp-topbar {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 14px 32px 12px;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 8px rgba(0,0,0,.04);
  gap: 10px;
}
.mlp-topbar .badge {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 14px; border-radius: 24px;
  background: rgba(43,150,168,.09);
  font-size: 12px; font-weight: 700; color: var(--primary);
  letter-spacing: .04em;
}
.mlp-topbar h1 {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 900; color: var(--title); margin: 0;
}
.mlp-topbar h1 span { color: var(--primary); }

/* ── Step progress indicator ── */
.mlp-steps-indicator {
  display: flex; align-items: center; justify-content: center;
  gap: 0; padding: 18px 32px 0; flex-shrink: 0;
}
.step-pip {
  display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1;
  max-width: 140px;
}
.step-pip-circle {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; font-family: 'DM Sans', sans-serif;
  border: 2px solid var(--border); background: var(--white);
  color: var(--muted); transition: all .3s ease; flex-shrink: 0;
  position: relative; z-index: 1;
}
.step-pip-circle.done   { background: var(--primary); border-color: var(--primary); color: white; }
.step-pip-circle.active { background: var(--title);   border-color: var(--title);   color: white; box-shadow: 0 4px 14px -3px rgba(5,51,102,.35); }
.step-pip-label {
  font-size: 10px; font-weight: 700; color: var(--muted);
  letter-spacing: .04em; text-transform: uppercase; white-space: nowrap;
  transition: color .3s;
}
.step-pip-label.active { color: var(--title); }
.step-pip-label.done   { color: var(--primary); }
.step-connector {
  height: 2px; flex: 1; max-width: 60px;
  background: var(--border); border-radius: 2px; margin-bottom: 18px;
  transition: background .3s;
  position: relative; top: -9px;
}
.step-connector.done { background: var(--primary); }

/* ── Main content area ── */
.mlp-body {
  flex: 1; display: flex; flex-direction: column;
  align-items: center;
  padding: 20px 20px 36px;
  overflow: hidden; position: relative;
}

/* ── Card carousel container ── */
.mlp-cards-viewport {
  width: 100%; max-width: 560px;
  position: relative; overflow: hidden;
  flex: 1; display: flex; flex-direction: column;
}

/* ── Individual card ── */
.mlp-card {
  background: var(--white); border-radius: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px -8px rgba(5,51,102,.10);
  display: flex; flex-direction: column;
  width: 100%; flex: 1;
  animation: mlpSlideIn .38s cubic-bezier(.22,.68,0,1.2) both;
}
.mlp-card.slide-left  { animation: mlpSlideInLeft .38s cubic-bezier(.22,.68,0,1.2) both; }
.mlp-card.slide-right { animation: mlpSlideInRight .38s cubic-bezier(.22,.68,0,1.2) both; }

@keyframes mlpSlideInLeft  { from { opacity:0; transform: translateX(60px)  scale(.97) } to { opacity:1; transform:translateX(0) scale(1) } }
@keyframes mlpSlideInRight { from { opacity:0; transform: translateX(-60px) scale(.97) } to { opacity:1; transform:translateX(0) scale(1) } }
@keyframes mlpSlideIn      { from { opacity:0; transform: translateY(14px)  scale(.98) } to { opacity:1; transform:translateY(0) scale(1) } }

.mlp-card-header {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid #F3F6F9; flex-shrink: 0;
}
.mlp-card-header-icon {
  width: 34px; height: 34px; border-radius: 11px;
  background: rgba(43,150,168,.10);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mlp-card-header h2 {
  font-size: 16px; font-weight: 800; color: var(--title); margin: 0;
}
.mlp-card-header .card-step-badge {
  margin-left: auto; font-size: 11px; font-weight: 700;
  color: var(--primary); background: rgba(43,150,168,.09);
  padding: 3px 11px; border-radius: 20px;
}
.mlp-card-body { padding: 20px 22px; flex: 1; overflow-y: auto; overflow-x: hidden; }

/* ── Durée ── */
.duree-display-big {
  text-align: center; margin: 14px auto 18px;
  background: linear-gradient(135deg, rgba(43,150,168,.06), rgba(5,51,102,.04));
  border: 2px solid rgba(43,150,168,.18);
  border-radius: 20px; padding: 18px 28px; max-width: 180px;
}
.duree-display-big .num {
  font-family: 'Playfair Display', serif;
  font-size: 52px; font-weight: 900; color: var(--title);
  line-height: 1; display: block;
}
.duree-display-big .unit {
  font-size: 12px; color: var(--primary);
  text-transform: uppercase; letter-spacing: .08em; font-weight: 700;
}
.duree-slider-full { width: 100%; height: 6px; accent-color: var(--primary); cursor: pointer; margin: 0 0 6px; }
.duree-slider-labels { display: flex; justify-content: space-between; margin-bottom: 16px; }
.duree-slider-labels span { font-size: 11px; color: var(--muted); }
.duree-quick-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.duree-quick-btn {
  padding: 7px 16px; border-radius: 22px;
  border: 2px solid var(--border); background: transparent;
  color: var(--muted); font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all .18s;
  min-width: 52px; text-align: center;
}
.duree-quick-btn:hover, .duree-quick-btn.active {
  border-color: var(--primary); background: var(--primary); color: white; font-weight: 700;
}

/* ── Catégories ── */
.cats-wrap { display: flex; flex-wrap: wrap; gap: 9px; }
.cat-chip {
  padding: 8px 15px; border-radius: 24px;
  border: 2px solid var(--border); background: var(--white);
  color: var(--text); font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; gap: 6px; transition: all .18s;
}
.cat-chip:hover { transform: translateY(-1px); box-shadow: 0 4px 10px -4px rgba(0,0,0,.12); }
.cat-chip.active { font-weight: 700; }
.cats-optional-note {
  font-size: 12px; color: var(--muted); margin-bottom: 14px; text-align: center;
  font-style: italic;
}

/* ── Villes ── */
.villes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 9px;
}
.ville-btn {
  padding: 12px 8px; border-radius: 16px;
  border: 2px solid var(--border); background: var(--white);
  text-align: center; cursor: pointer; font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  position: relative; transition: all .18s;
}
.ville-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(43,150,168,.22); }
.ville-btn.selected { border-color: var(--primary); background: rgba(43,150,168,.05); box-shadow: 0 6px 18px -6px rgba(43,150,168,.30); }
.ville-btn .check-dot {
  position: absolute; top: 7px; right: 7px;
  width: 16px; height: 16px; background: var(--primary); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.ville-btn .name { font-size: 12px; font-weight: 600; color: var(--text); }
.ville-btn.selected .name { font-weight: 700; color: var(--primary); }
.ville-btn .desc { font-size: 10px; color: var(--muted); margin-top: 2px; }
.ville-btn.selected .desc { color: rgba(43,150,168,.7); }

/* ── Refresh btn ── */
.refresh-btn {
  margin-left: auto; background: none; border: none;
  cursor: pointer; color: var(--muted); display: flex; align-items: center; transition: color .15s;
}
.refresh-btn:hover { color: var(--primary); }

/* ── Navigation footer ── */
.mlp-nav-footer {
  width: 100%; max-width: 560px; margin-top: 14px;
  display: flex; align-items: center; gap: 10px;
}
.nav-back-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 11px 22px; border-radius: 50px;
  border: 2px solid var(--border); background: var(--white);
  color: var(--text); font-size: 14px; font-weight: 700;
  font-family: inherit; cursor: pointer; transition: all .18s;
}
.nav-back-btn:hover { border-color: var(--title); color: var(--title); }
.nav-next-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px 28px; border-radius: 50px;
  border: none; background: var(--title); color: white;
  font-size: 15px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: all .22s;
  box-shadow: 0 10px 28px -8px rgba(5,51,102,.40);
}
.nav-next-btn.primary { background: var(--primary); box-shadow: 0 10px 28px -8px rgba(43,150,168,.50); }
.nav-next-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 36px -10px rgba(5,51,102,.50); }
.nav-next-btn.primary:hover:not(:disabled) { box-shadow: 0 16px 36px -10px rgba(43,150,168,.60); }
.nav-next-btn:disabled { background: #E5E7EB; color: var(--muted); box-shadow: none; cursor: not-allowed; transform: none; }

/* ── Selection summary pill ── */
.selection-pill {
  text-align: center; font-size: 12px; color: var(--text);
  background: var(--white); border: 1px solid var(--border);
  border-radius: 30px; padding: 6px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
  max-width: 560px; width: 100%; margin-top: 8px;
}
.selection-pill .hl { color: var(--primary); font-weight: 700; }

/* ── Skeleton / error / empty ── */
@keyframes lp { 0%,100%{opacity:1} 50%{opacity:.4} }
.skeleton { animation: lp 1.5s ease infinite; background: #F3F4F6; border-radius: 12px; }
.db-error { text-align: center; padding: 24px 16px; }
.db-error .title { font-size: 13px; font-weight: 700; color: #DC2626; margin-bottom: 4px; }
.db-error .msg { font-size: 12px; color: var(--muted); margin-bottom: 14px; }
.retry-btn {
  padding: 7px 18px; background: var(--primary); color: white;
  border: none; border-radius: 20px; font-size: 12px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: inherit;
}
.empty-state { text-align: center; padding: 28px 16px; }
.empty-state .title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.empty-state .sub { font-size: 12px; color: var(--muted); }

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }

@media (max-width: 640px) {
  .mlp-topbar { padding: 12px 16px; }
  .mlp-topbar h1 { font-size: 16px; }
  .mlp-body { padding: 16px 14px 28px; }
  .mlp-card-body { padding: 16px 16px; }
  .mlp-card-header { padding: 14px 16px 12px; }
  .villes-grid { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); }
  .duree-display-big .num { font-size: 42px; }
}
`;

/* ─────────────── SUB-COMPONENTS ─────────────── */
function LoadingGrid({ count = 6, height = 70 }: { count?: number; height?: number }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px,1fr))", gap:9 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }}/>
      ))}
    </div>
  );
}

function DbError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="db-error">
      <AlertCircle size={32} color="#DC2626" style={{ margin:"0 auto 10px", display:"block" }}/>
      <p className="title">Erreur de chargement</p>
      <p className="msg">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-btn">
          <RotateCw size={12}/> Réessayer
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="empty-state">
      <div style={{ display:"flex", justifyContent:"center", marginBottom:10, color:"#D1D5DB" }}>{icon}</div>
      <p className="title">{title}</p>
      <p className="sub">{sub}</p>
    </div>
  );
}

/* ─────────────── STEPS CONFIG ─────────────── */
const STEPS = [
  { label: "Durée",    icon: <Calendar size={15} color="#2B96A8"/> },
  { label: "Intérêts", icon: <Layers   size={15} color="#2B96A8"/> },
  { label: "Villes",   icon: <MapPin   size={15} color="#2B96A8"/> },
];

/* ════════════════════════════════════
   PAGE
════════════════════════════════════ */
function ConfigInner() {
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);

  const [step, setStep]         = useState(0); // 0 | 1 | 2
  const [slideDir, setSlideDir] = useState<"left"|"right">("left");
  const [animKey, setAnimKey]   = useState(0);

  const [days,      setDays]      = useState(3);
  const [selCities, setSelCities] = useState<string[]>([]);
  const [selCats,   setSelCats]   = useState<string[]>([]);

  const [villes,    setVilles]    = useState<Ville[]>([]);
  const [ldVilles,  setLdVilles]  = useState(true);
  const [errVilles, setErrVilles] = useState<string | null>(null);

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [ldCats,     setLdCats]     = useState(true);
  const [errCats,    setErrCats]    = useState<string | null>(null);

  const loadVilles = async () => {
    setLdVilles(true); setErrVilles(null);
    const { data, error } = await sb.from("villes").select("*").eq("active", true).order("nom");
    if (error) setErrVilles(error.message);
    else setVilles((data || []) as Ville[]);
    setLdVilles(false);
  };

  const loadCategories = async () => {
    setLdCats(true); setErrCats(null);
    const { data, error } = await sb.from("categories").select("*").order("nom");
    if (error) setErrCats(error.message);
    else setCategories((data || []) as Categorie[]);
    setLdCats(false);
  };

  useEffect(() => { loadVilles(); },     []);
  useEffect(() => { loadCategories(); }, []);

  const goStep = (next: number) => {
    setSlideDir(next > step ? "left" : "right");
    setAnimKey(k => k + 1);
    setStep(next);
  };

  const goToBuilder = () => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("cities", selCities.join(","));
    if (selCats.length > 0) params.set("cats", selCats.join(","));
    router.push(`/touriste/modeLibre/builder?${params.toString()}`);
  };

  /* ── Résumé sélection ── */
  const summaryPill = (
    <div className="selection-pill">
      <span className="hl">{days} jour{days > 1 ? "s" : ""}</span>
      {selCats.length > 0 && (
        <> · {selCats.slice(0, 2).join(", ")}{selCats.length > 2 && <span className="hl"> +{selCats.length - 2}</span>}</>
      )}
      {selCities.length > 0 && (
        <> · {selCities.slice(0, 2).join(", ")}{selCities.length > 2 && <span className="hl"> +{selCities.length - 2}</span>}</>
      )}
    </div>
  );

  return (
    <div className="mlp-page">
      <TouristeNav/>
      <style>{CSS_CONFIG}</style>

      {/* ── Topbar ── */}
      <div className="mlp-topbar">
        <div className="badge"><SlidersHorizontal size={13}/> Planificateur</div>
        <h1>Créez votre itinéraire <span>sur mesure</span></h1>
      </div>

      {/* ── Step indicator ── */}
      <div className="mlp-steps-indicator">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="step-pip">
              <div className={`step-pip-circle${i < step ? " done" : i === step ? " active" : ""}`}>
                {i < step ? <CheckCircle2 size={15} color="white"/> : i + 1}
              </div>
              <span className={`step-pip-label${i < step ? " done" : i === step ? " active" : ""}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector${i < step ? " done" : ""}`}/>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="mlp-body">
        <div className="mlp-cards-viewport">

          {/* ── STEP 0 : Durée ── */}
          {step === 0 && (
            <div key={`card-${animKey}`} className={`mlp-card slide-${slideDir}`}>
              <div className="mlp-card-header">
                <div className="mlp-card-header-icon"><Calendar size={15} color="#2B96A8"/></div>
                <h2>Durée du voyage</h2>
                <span className="card-step-badge">Étape 1 / 3</span>
              </div>
              <div className="mlp-card-body">
                <div className="duree-display-big">
                  <span className="num">{days}</span>
                  <span className="unit">{days > 1 ? "jours" : "jour"}</span>
                </div>
                <input
                  type="range" min={1} max={14} value={days}
                  className="duree-slider-full"
                  onChange={e => setDays(Number(e.target.value))}
                />
                <div className="duree-slider-labels">
                  <span>1 jour</span><span>14 jours</span>
                </div>
                <div className="duree-quick-row">
                  {[1, 2, 3, 5, 7, 10, 14].map(n => (
                    <button key={n}
                      className={`duree-quick-btn${days === n ? " active" : ""}`}
                      onClick={() => setDays(n)}>
                      {n}j
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1 : Catégories ── */}
          {step === 1 && (
            <div key={`card-${animKey}`} className={`mlp-card slide-${slideDir}`}>
              <div className="mlp-card-header">
                <div className="mlp-card-header-icon"><Layers size={15} color="#2B96A8"/></div>
                <h2>Centres d&apos;intérêt</h2>
                <span className="card-step-badge">Étape 2 / 3</span>
              </div>
              <div className="mlp-card-body">
                <p className="cats-optional-note">Optionnel — passez directement si vous voulez tout découvrir</p>
                {ldCats ? (
                  <div className="cats-wrap">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ height:36, width:100, borderRadius:24 }}/>
                    ))}
                  </div>
                ) : errCats ? (
                  <DbError message={errCats} onRetry={loadCategories}/>
                ) : categories.length === 0 ? (
                  <EmptyState icon={<Database size={28}/>} title="Aucune catégorie" sub="Ajoutez des catégories dans Supabase"/>
                ) : (
                  <div className="cats-wrap">
                    {categories.map(cat => {
                      const sel = selCats.includes(cat.nom);
                      return (
                        <button key={cat.id}
                          className={`cat-chip${sel ? " active" : ""}`}
                          onClick={() => setSelCats(tog(selCats, cat.nom))}
                          style={{
                            borderColor: sel ? cat.couleur : undefined,
                            background:  sel ? `${cat.couleur}12` : undefined,
                            color:       sel ? cat.couleur : undefined,
                            boxShadow:   sel ? `0 3px 10px -3px ${cat.couleur}40` : undefined,
                          }}>
                          <span>{cat.emoji}</span>{cat.nom}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2 : Villes ── */}
          {step === 2 && (
            <div key={`card-${animKey}`} className={`mlp-card slide-${slideDir}`}>
              <div className="mlp-card-header">
                <div className="mlp-card-header-icon"><MapPin size={15} color="#2B96A8"/></div>
                <h2>Villes à explorer</h2>
                {selCities.length > 0 && (
                  <span className="card-step-badge">
                    {selCities.length} sélectionnée{selCities.length > 1 ? "s" : ""}
                  </span>
                )}
                {!ldVilles && !errVilles && (
                  <button className="refresh-btn" onClick={loadVilles}><RefreshCw size={13}/></button>
                )}
              </div>
              <div className="mlp-card-body">
                {ldVilles ? (
                  <LoadingGrid count={12} height={72}/>
                ) : errVilles ? (
                  <DbError message={errVilles} onRetry={loadVilles}/>
                ) : villes.length === 0 ? (
                  <EmptyState icon={<MapPin size={36}/>} title="Aucune ville disponible" sub="Ajoutez des villes actives dans Supabase"/>
                ) : (
                  <div className="villes-grid">
                    {villes.map(c => {
                      const sel = selCities.includes(c.nom);
                      return (
                        <button key={c.id}
                          className={`ville-btn${sel ? " selected" : ""}`}
                          onClick={() => setSelCities(tog(selCities, c.nom))}>
                          {sel && (
                            <div className="check-dot">
                              <CheckCircle2 size={10} color="white"/>
                            </div>
                          )}
                          <div className="name">{c.nom}</div>
                          <div className="desc">{c.description}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ── Summary pill (toujours visible) ── */}
        {(selCities.length > 0 || selCats.length > 0 || step > 0) && summaryPill}

        {/* ── Navigation footer ── */}
        <div className="mlp-nav-footer">
          {step > 0 && (
            <button className="nav-back-btn" onClick={() => goStep(step - 1)}>
              <ArrowLeft size={16}/> Retour
            </button>
          )}

          {step < 2 && (
            <button className="nav-next-btn" onClick={() => goStep(step + 1)}>
              {step === 0 ? "Choisir mes intérêts" : "Choisir les villes"}
              <ArrowRight size={17}/>
            </button>
          )}

          {step === 2 && (
            <button
              className="nav-next-btn primary"
              onClick={goToBuilder}
              disabled={selCities.length === 0}>
              Composer mon itinéraire <ArrowRight size={17}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModeLibrePage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#F6F9FB" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation:"spin .7s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ConfigInner/>
    </Suspense>
  );
}