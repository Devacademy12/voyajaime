"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowRight, Calendar, MapPin, Layers, SlidersHorizontal,
  CheckCircle2, AlertCircle, RotateCw, RefreshCw, Database, Loader2,
} from "lucide-react";

/* ─────────────── TYPES ─────────────── */
type Categorie = { id: string; nom: string; emoji: string; couleur: string; };
type Ville     = { id: string; nom: string; emoji: string; region: string; description: string; active: boolean; };

function tog<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

/* ─────────────── CSS CONFIG ─────────────── */
const CSS_CONFIG = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.itineraire-config-page {
  height: calc(100vh - 64px);
  display: flex; flex-direction: column;
  background: #F0F4F6;
  font-family: 'DM Sans', system-ui, sans-serif;
  overflow: hidden;
}
.itineraire-topbar {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 12px 32px;
  background: white;
  border-bottom: 1px solid #EEF1F3;
  box-shadow: 0 1px 6px rgba(0,0,0,.04);
  position: relative;
}
.itineraire-topbar .badge {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 14px;
  background: rgba(43,150,168,.09); border-radius: 24px;
  font-size: 12px; font-weight: 700; color: #2B96A8;
  letter-spacing: .04em; margin-right: 12px;
}
.itineraire-topbar h1 {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 900; color: #111827;
}
.itineraire-topbar h1 span { color: #2B96A8; }
.itineraire-config-body {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 18px 28px 14px; overflow: hidden; gap: 16px;
}
.config-cards-row {
  display: flex; flex-direction: row;
  align-items: stretch; justify-content: center;
  gap: 18px; width: 100%; max-width: 1080px;
  height: 420px; flex-shrink: 0;
}
.config-card {
  flex: 1; min-width: 0;
  background: white; border-radius: 22px;
  border: 1px solid #EEF1F3;
  box-shadow: 0 4px 20px rgba(0,0,0,.06);
  overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow .22s, transform .22s;
}
.config-card:hover {
  box-shadow: 0 10px 36px rgba(43,150,168,.12);
  transform: translateY(-2px);
}
.card-header {
  display: flex; align-items: center; gap: 10px;
  padding: 15px 20px 12px;
  border-bottom: 1px solid #F3F4F6; flex-shrink: 0;
}
.card-header-icon {
  width: 28px; height: 28px; border-radius: 9px;
  background: rgba(43,150,168,.1);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.card-header h2 { font-size: 14px; font-weight: 800; color: #111827; }
.card-header .badge-count {
  margin-left: auto; font-size: 11px; font-weight: 700;
  color: #2B96A8; background: rgba(43,150,168,.09);
  padding: 2px 10px; border-radius: 20px;
}
.card-body { padding: 15px 20px; flex: 1; overflow-y: auto; overflow-x: hidden; }

.duree-slider-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.duree-slider-wrap { flex: 1; }
.duree-slider-wrap input[type=range] { width: 100%; height: 4px; accent-color: #2B96A8; cursor: pointer; }
.duree-slider-labels { display: flex; justify-content: space-between; margin-top: 5px; }
.duree-slider-labels span { font-size: 10px; color: #C4C9D0; }
.duree-display {
  text-align: center; background: rgba(43,150,168,.07);
  border: 1.5px solid rgba(43,150,168,.2);
  border-radius: 14px; padding: 8px 18px; flex-shrink: 0;
}
.duree-display .num {
  font-family: 'Playfair Display', serif;
  font-size: 34px; font-weight: 900; color: #2B96A8;
  line-height: 1; display: block;
}
.duree-display .unit {
  font-size: 10px; color: #6B7280;
  text-transform: uppercase; letter-spacing: .05em; font-weight: 600;
}
.duree-quick-row { display: flex; gap: 4px; }
.duree-quick-btn {
  flex: 1; padding: 5px 0; border-radius: 20px;
  border: 1.5px solid #E5E7EB; background: transparent;
  color: #9CA3AF; font-size: 11px; font-weight: 500;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.duree-quick-btn:hover, .duree-quick-btn.active {
  border-color: #2B96A8; background: #2B96A8; color: white; font-weight: 700;
}
.cats-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-chip {
  padding: 7px 13px; border-radius: 22px;
  border: 1.5px solid #E5E7EB; background: white;
  color: #6B7280; font-size: 12px; font-weight: 500;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; gap: 5px; transition: all .15s;
}
.cat-chip:hover { transform: translateY(-1px); }
.cat-chip.active { font-weight: 700; }
.villes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 8px;
}
.ville-btn {
  padding: 11px 8px; border-radius: 14px;
  border: 2px solid #F3F4F6; background: white;
  text-align: center; cursor: pointer; font-family: inherit;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  position: relative; transition: all .18s;
}
.ville-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(43,150,168,.22); }
.ville-btn.selected { border-color: #2B96A8; background: rgba(43,150,168,.05); box-shadow: 0 6px 16px -6px rgba(43,150,168,.28); }
.ville-btn .check-dot {
  position: absolute; top: 6px; right: 6px;
  width: 15px; height: 15px; background: #2B96A8; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.ville-btn .emoji { display: none; }
.ville-btn .name { font-size: 12px; font-weight: 600; color: #374151; }
.ville-btn.selected .name { font-weight: 700; color: #2B96A8; }
.ville-btn .desc { font-size: 10px; color: #9CA3AF; margin-top: 2px; }
.ville-btn.selected .desc { color: #2B96A8; }
.config-cta-bar { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.config-selection-pill {
  padding: 8px 18px; background: white; border-radius: 30px;
  border: 1px solid #E5E7EB; font-size: 12px; color: #374151;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}
.config-selection-pill .hl { color: #2B96A8; font-weight: 700; }
.cta-compose-btn {
  padding: 13px 44px; background: #2B96A8; color: white;
  border: none; border-radius: 50px;
  font-size: 15px; font-weight: 700; font-family: inherit;
  cursor: pointer; display: inline-flex; align-items: center; gap: 10px;
  box-shadow: 0 10px 28px -8px rgba(43,150,168,.55); transition: all .22s;
}
.cta-compose-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 36px -10px rgba(43,150,168,.65); }
.cta-compose-btn:disabled { background: #E5E7EB; color: #9CA3AF; box-shadow: none; cursor: not-allowed; }
.refresh-btn {
  margin-left: auto; background: none; border: none;
  cursor: pointer; color: #9CA3AF; display: flex; align-items: center; transition: color .15s;
}
.refresh-btn:hover { color: #2B96A8; }
@keyframes lp { 0%,100%{opacity:1} 50%{opacity:.4} }
.skeleton { animation: lp 1.5s ease infinite; background: #F3F4F6; border-radius: 12px; }
.db-error { text-align: center; padding: 24px 16px; }
.db-error .title { font-size: 13px; font-weight: 700; color: #DC2626; margin-bottom: 4px; }
.db-error .msg { font-size: 12px; color: #9CA3AF; margin-bottom: 14px; }
.retry-btn {
  padding: 7px 18px; background: #2B96A8; color: white;
  border: none; border-radius: 20px; font-size: 12px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: inherit;
}
.empty-state { text-align: center; padding: 28px 16px; }
.empty-state .title { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 4px; }
.empty-state .sub { font-size: 12px; color: #9CA3AF; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
@media (max-width: 860px) {
  .itineraire-config-page { height: auto; overflow: auto; }
  .itineraire-config-body { justify-content: flex-start; padding: 20px 16px 40px; overflow: visible; }
  .config-cards-row { flex-direction: column; height: auto; align-items: stretch; }
}
`;

/* ─────────────── SUB-COMPONENTS ─────────────── */
function LoadingGrid({ count = 6, height = 70 }: { count?: number; height?: number }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(95px,1fr))", gap:8 }}>
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

/* ════════════════════════════════════
   PAGE 1 — CONFIG
════════════════════════════════════ */
function ConfigInner() {
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);

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

  /* ── Navigation vers le builder ── */
  const goToBuilder = () => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("cities", selCities.join(","));
    if (selCats.length > 0) params.set("cats", selCats.join(","));
    router.push(`/touriste/modeLibre/builder?${params.toString()}`);
  };

  return (
    <div className="itineraire-config-page">
      <style>{CSS_CONFIG}</style>

      {/* Topbar */}
      <div className="itineraire-topbar">
        <div className="badge"><SlidersHorizontal size={13}/> Planificateur</div>
        <h1>Créez votre itinéraire <span>sur mesure</span></h1>
      </div>

      {/* Corps */}
      <div className="itineraire-config-body">
        <div className="config-cards-row">

          {/* ── Carte 1 : Durée ── */}
          <div className="config-card card-duree">
            <div className="card-header">
              <div className="card-header-icon"><Calendar size={14} color="#2B96A8"/></div>
              <h2>Durée du voyage</h2>
            </div>
            <div className="card-body">
              <div className="duree-slider-row">
                <div className="duree-slider-wrap">
                  <input type="range" min={1} max={14} value={days}
                    onChange={e => setDays(Number(e.target.value))}/>
                  <div className="duree-slider-labels">
                    <span>1 jour</span><span>14 jours</span>
                  </div>
                </div>
                <div className="duree-display">
                  <span className="num">{days}</span>
                  <span className="unit">{days > 1 ? "jours" : "jour"}</span>
                </div>
              </div>
              <div className="duree-quick-row">
                {[1,2,3,5,7,10,14].map(n => (
                  <button key={n} className={`duree-quick-btn${days === n ? " active" : ""}`}
                    onClick={() => setDays(n)}>
                    {n}j
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Carte 2 : Catégories ── */}
          <div className="config-card card-cats">
            <div className="card-header">
              <div className="card-header-icon"><Layers size={14} color="#2B96A8"/></div>
              <h2>Centres d&apos;intérêt</h2>
              <span style={{ fontSize:11, color:"#9CA3AF", marginLeft:4 }}>(optionnel)</span>
            </div>
            <div className="card-body">
              {ldCats ? (
                <div className="cats-wrap">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height:34, width:90, borderRadius:22 }}/>
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

          {/* ── Carte 3 : Villes ── */}
          <div className="config-card card-villes">
            <div className="card-header">
              <div className="card-header-icon"><MapPin size={14} color="#2B96A8"/></div>
              <h2>Villes à explorer</h2>
              {selCities.length > 0 && (
                <span className="badge-count">
                  {selCities.length} sélectionnée{selCities.length > 1 ? "s" : ""}
                </span>
              )}
              {!ldVilles && !errVilles && (
                <button className="refresh-btn" onClick={loadVilles}><RefreshCw size={13}/></button>
              )}
            </div>
            <div className="card-body">
              {ldVilles ? (
                <LoadingGrid count={12} height={70}/>
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
                        <span className="emoji">{c.emoji}</span>
                        <div className="name">{c.nom}</div>
                        <div className="desc">{c.description}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── CTA ── */}
        <div className="config-cta-bar">
          {selCities.length > 0 && (
            <div className="config-selection-pill">
              <span className="hl">{days} j</span>{" · "}
              {selCities.slice(0, 3).join(", ")}
              {selCities.length > 3 && <span className="hl"> +{selCities.length - 3}</span>}
            </div>
          )}
          <button className="cta-compose-btn" onClick={goToBuilder} disabled={selCities.length === 0}>
            Composer mon itinéraire <ArrowRight size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModeLibrePage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#F0F4F6" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation:"spin .7s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ConfigInner/>
    </Suspense>
  );
}