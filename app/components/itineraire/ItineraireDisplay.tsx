"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin, Clock, Globe, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, RotateCcw, Star, Users, Sparkles, Navigation,
  ArrowRight, Camera, Heart, Save, X, Plus, Info,
  BadgeCheck, Sunrise, Sun, Moon, Download, Share2,
  Bookmark, Compass,
} from "lucide-react";
import "@/public/style/itineraire.css";
/* ─── Types ─── */
type Activity = {
  id: string; name: string; description?: string; time?: string;
  duration?: string; price?: number; icon?: string;
  photos?: string | string[]; languages?: string | string[];
  inclusion?: string | string[]; city?: string;
  rating?: number; reviews_count?: number; max_people?: number;
  is_free_day?: boolean;
};
type DayPlan = {
  day: number; city: string; date?: string;
  theme?: string; emoji?: string; activities: Activity[];
};
type Itinerary = { title: string; days: DayPlan[] };

type ItineraireDisplayProps = {
  itinerary: Itinerary;
  selectedCities: string[];
  selectedCats?: string[];
  categories?: { id: string; nom?: string; name?: string }[];
  excursions: {
    id: string; title: string; city: string;
    price_per_person?: number; duration_hours?: number;
    description?: string; categories?: string[];
    photos?: string[]; languages?: string[];
    inclusions?: string[]; rating?: number; reviews_count?: number;
  }[];
  totalPrice: number;
  saving: boolean;
  saveStatus: "idle" | "ok" | "error" | "login";
  onBack: () => void;
  onReset: () => void;
  onCheckout: () => void;
  onSave: () => void;
  onChangeActivity: (dayIdx: number, actIdx: number, alt: Activity) => void;
};

/* ─── Helpers ─── */
function parseList(val?: string | string[]): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch {}
  return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}
function parsePhotos(val?: string | string[]): string[] {
  return parseList(val).filter(u => u.startsWith("http") || u.startsWith("/"));
}
function getSlot(time?: string): "morning" | "afternoon" | "evening" | "unset" {
  if (!time) return "unset";
  const h = parseInt(time.split(":")[0] ?? time.split("h")[0] ?? "0", 10);
  if (isNaN(h)) return "unset";
  if (h < 13) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/* ─── Slot config ─── */
const SLOTS = [
  { key: "morning" as const, label: "Matin", time: "8h00 – 12h00" },
  { key: "afternoon" as const, label: "Après-midi", time: "13h00 – 17h00" },
  { key: "evening" as const, label: "Soir", time: "18h00 – 22h00" },
];

/* ─── ActivityCard ─── */
function ActivityCard({ activity, onEdit }: { activity: Activity; onEdit: () => void }) {
  const photos = parsePhotos(activity.photos);
  const languages = parseList(activity.languages);
  const inclusions = parseList(activity.inclusion);
  const price = activity.price || 0;
  const isFree = price === 0;
  const photo = photos[0];

  if (activity.is_free_day) {
    return (
      <div className="v2-act free-day">
        <div className="v2-act-body" style={{ padding: "16px 20px" }}>
          <div className="v2-act-top">
            <div className="v2-act-name free">{activity.name}</div>
            <span className="v2-price free">Gratuit</span>
          </div>
          {activity.description && (
            <p className="v2-act-desc">{activity.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="v2-act">
      <div className="v2-act-img">
        {photo ? (
          <img src={photo} alt={activity.name} loading="lazy" />
        ) : (
          <div className="v2-act-img-ph">
            <Camera size={26} strokeWidth={1.5} />
            <span>Photo</span>
          </div>
        )}
        {activity.time && (
          <div className="v2-act-time-tag">
            <Clock size={10} />
            {activity.time}
          </div>
        )}
      </div>

      <div className="v2-act-body">
        <div className="v2-act-top">
          <div className="v2-act-name">{activity.name}</div>
          <span className={`v2-price ${isFree ? "free" : ""}`}>
            {isFree ? "Inclus" : `${price} EUR`}
          </span>
        </div>

        <div className="v2-chips">
          {activity.duration && (
            <span className="v2-chip"><Clock size={10} color="#2B96A8" /> {activity.duration}</span>
          )}
          {activity.city && (
            <span className="v2-chip"><MapPin size={10} color="#2B96A8" /> {activity.city}</span>
          )}
          {activity.max_people && (
            <span className="v2-chip"><Users size={10} /> Max {activity.max_people}</span>
          )}
        </div>

        {activity.description && (
          <p className="v2-act-desc">{activity.description}</p>
        )}

        {(languages.length > 0 || inclusions.length > 0) && (
          <div className="v2-tags">
            {languages.slice(0, 2).map((l, i) => (
              <span key={i} className="v2-tag v2-tag-lang">
                <Globe size={9} /> {l}
              </span>
            ))}
            {inclusions.slice(0, 3).map((inc, i) => (
              <span key={i} className="v2-tag v2-tag-inc">
                <BadgeCheck size={9} /> {inc}
              </span>
            ))}
          </div>
        )}

        <div className="v2-act-footer">
          <div className="v2-rating">
            {activity.rating ? (
              <>
                <Star size={12} fill="#2B96A8" color="#2B96A8" />
                <span>{activity.rating}</span>
                {activity.reviews_count && (
                  <span style={{ fontWeight: 400, color: "#94A3B8", fontSize: 11 }}>
                    ({activity.reviews_count} avis)
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: "#CBD5E1", fontSize: 11 }}>Pas encore noté</span>
            )}
          </div>
          <div className="v2-act-btns">
            <button className="v2-btn-sm">
              <Info size={10} /> Détails
            </button>
            <button className="v2-btn-sm" onClick={onEdit}>
              <RefreshCw size={10} /> Changer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AlternativePicker ─── */
function AlternativePicker({ alternatives, currentName, onPick, onClose }: {
  alternatives: {
    id: string; title: string; city: string;
    price_per_person?: number; duration_hours?: number;
    photos?: string[]; rating?: number;
  }[];
  currentName: string;
  onPick: (alt: Activity) => void;
  onClose: () => void;
}) {
  return (
    <div className="v2-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="v2-alt-box">
        <div className="v2-alt-hdr">
          <div>
            <div className="v2-alt-title">Choisir une alternative</div>
            <div className="v2-alt-sub">Remplace « {currentName} »</div>
          </div>
          <button className="v2-close" onClick={onClose}><X size={14} color="#6B7280" /></button>
        </div>
        {alternatives.length === 0 ? (
          <div className="v2-no-alt">
            <Camera size={30} strokeWidth={1.5} style={{ opacity: .3, marginBottom: 10 }} />
            <p style={{ fontSize: 13 }}>Aucune alternative dans cette ville</p>
          </div>
        ) : (
          <div className="v2-alt-list">
            {alternatives.map(exc => (
              <div key={exc.id} className="v2-alt-item"
                onClick={() => onPick({
                  id: exc.id, name: exc.title, city: exc.city,
                  price: exc.price_per_person || 0,
                  duration: exc.duration_hours ? `${exc.duration_hours}h` : "2h",
                  photos: exc.photos, rating: exc.rating,
                })}>
                <div className="v2-alt-thumb">
                  {exc.photos?.[0]
                    ? <img src={exc.photos[0]} alt={exc.title} />
                    : <Camera size={16} color="#CBD5E1" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="v2-alt-name">{exc.title}</div>
                  <div className="v2-alt-meta">
                    {exc.price_per_person != null && <span>{exc.price_per_person} EUR</span>}
                    {exc.duration_hours && <span>{exc.duration_hours}h</span>}
                    {exc.rating && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={9} fill="#2B96A8" color="#2B96A8" /> {exc.rating}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight size={14} color="#2B96A8" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */

export default function ItineraireDisplay({
  itinerary, selectedCities, excursions, totalPrice,
  saving, saveStatus, onBack, onReset, onCheckout, onSave, onChangeActivity,
}: ItineraireDisplayProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [editing, setEditing] = useState<{ dayIdx: number; actIdx: number } | null>(null);

  // Charger le CSS une seule fois
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/itineraire.css';
    document.head.appendChild(link);
    return () => {
      // Ne pas supprimer car d'autres pages pourraient l'utiliser
      // document.head.removeChild(link);
    };
  }, []);

  const currentDay = itinerary.days[activeDay];
  const totalActivities = itinerary.days.reduce((s, d) => s + d.activities.length, 0);
  const dayPrice = currentDay.activities.reduce((a, act) => a + (Number(act.price) || 0), 0);

  function activitiesForSlot(slot: "morning" | "afternoon" | "evening") {
    const slotted = currentDay.activities.filter(a => getSlot(a.time) === slot);
    if (slot === "morning" && slotted.length === 0) {
      return currentDay.activities.filter(a => getSlot(a.time) === "unset");
    }
    return slotted;
  }

  function slotTotal(slot: "morning" | "afternoon" | "evening") {
    return activitiesForSlot(slot).reduce((a, act) => a + (Number(act.price) || 0), 0);
  }

  function globalIdx(act: Activity) {
    return currentDay.activities.findIndex(a => a.id === act.id);
  }

  const getAlternatives = () => {
    if (!editing) return [];
    const day = itinerary.days[editing.dayIdx];
    const cur = day.activities[editing.actIdx];
    return excursions.filter(e => e.city === day.city && e.id !== cur.id).slice(0, 8);
  };

  return (
    <div className="v2-root">
      {/* NAV */}
      <nav className="v2-nav">
        <div className="v2-logo">
        </div>
        <div className="v2-nav-actions">
          <button className="v2-btn-ghost" onClick={onReset}>
            <RotateCcw size={13} /> Recommencer
          </button>
          <button className="v2-btn-ghost" onClick={onBack}>
            <ChevronLeft size={13} /> Modifier
          </button>
          <button className="v2-btn-ghost" onClick={onSave} disabled={saving}>
            <Bookmark size={13} />
            {saving ? "..." : saveStatus === "ok" ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
          <button className="v2-btn-teal" onClick={onCheckout}>
            <Heart size={13} /> Réserver
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="v2-hero">
        <div>
          <div className="v2-hero-pill">
            <Sparkles size={10} /> Généré par IA
          </div>
          <div className="v2-hero-title">{itinerary.title}</div>
          <div className="v2-hero-sub">{selectedCities.join(" → ")}</div>
        </div>
        <div className="v2-hero-stats">
          <div className="v2-stat">
            <span className="v2-stat-val">{itinerary.days.length}</span>
            <span className="v2-stat-lbl">Jours</span>
          </div>
          <div className="v2-stat">
            <span className="v2-stat-val">{selectedCities.length}</span>
            <span className="v2-stat-lbl">Villes</span>
          </div>
          <div className="v2-stat">
            <span className="v2-stat-val">{totalActivities}</span>
            <span className="v2-stat-lbl">Activités</span>
          </div>
          <div className="v2-stat">
            <span className="v2-stat-val">{totalPrice.toLocaleString("fr-FR")}</span>
            <span className="v2-stat-lbl">EUR total</span>
          </div>
        </div>
      </div>

     
      {/* MAIN */}
      <div className="v2-main">

        {/* SIDEBAR */}
        <aside className="v2-sidebar">
          <div>
            <div className="v2-section-label">Jours du voyage</div>
            {itinerary.days.map((day, idx) => (
              <div key={idx}
                className={`v2-dli ${activeDay === idx ? "active" : ""}`}
                onClick={() => { setActiveDay(idx); setEditing(null); }}>
                <div className="v2-dli-num">{day.day}</div>
                <div className="v2-dli-info">
                  <div className="v2-dli-city">{day.city}</div>
                  {day.theme && <div className="v2-dli-sub">{day.theme}</div>}
                </div>
                <span className="v2-dli-badge">
                  {day.activities.length > 0 ? `${day.activities.length} act.` : "—"}
                </span>
              </div>
            ))}
            <button className="v2-add-day" style={{ marginTop: 8 }}>
              <Plus size={13} /> Ajouter un jour
            </button>
          </div>

          <div className="v2-summary">
            <div className="v2-section-label" style={{ marginBottom: 10 }}>Récapitulatif</div>
            <div className="v2-sum-row">
              <span className="v2-sum-key"><Clock size={12} /> Durée</span>
              <span className="v2-sum-val">{itinerary.days.length} jours</span>
            </div>
            <div className="v2-sum-row">
              <span className="v2-sum-key"><MapPin size={12} /> Villes</span>
              <span className="v2-sum-val">{selectedCities.length} étapes</span>
            </div>
            <div className="v2-sum-row">
              <span className="v2-sum-key"><CheckCircle size={12} /> Activités</span>
              <span className="v2-sum-val">{totalActivities} au total</span>
            </div>
            <div className="v2-sum-total">
              <span className="v2-sum-total-lbl">Budget estimé</span>
              <span className="v2-sum-total-val">{totalPrice.toLocaleString("fr-FR")} EUR</span>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="v2-content">

          {/* Day header */}
          <div className="v2-day-hdr">
            <div className="v2-day-icon">
              <Navigation size={20} color="#2B96A8" />
            </div>
            <div>
              <div className="v2-day-htitle">Jour {currentDay.day} — {currentDay.city}</div>
              <div className="v2-day-hsub">
                {currentDay.date || ""}
                {currentDay.theme ? ` · ${currentDay.theme}` : ""}
              </div>
            </div>
            <div className="v2-day-hbadge">
              <CheckCircle size={12} />
              {currentDay.activities.length} activité{currentDay.activities.length !== 1 ? "s" : ""}
              {dayPrice > 0 && ` · ${dayPrice} EUR`}
            </div>
          </div>

          {currentDay.activities.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              background: "var(--surface)", borderRadius: "var(--r-lg)",
              border: "1.5px dashed var(--border2)",
            }}>
              <Camera size={36} strokeWidth={1.5} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <p style={{ color: "#94A3B8", fontSize: 14 }}>Aucune activité pour cette journée</p>
            </div>
          ) : (
            SLOTS.map(({ key, label, time }) => {
              const acts = activitiesForSlot(key);
              const sp = slotTotal(key);
              return (
                <div key={key} className="v2-slot">
                  <div className="v2-slot-head">
                    <div className="v2-slot-stripe" />
                    <span className="v2-slot-name">{label}</span>
                    <span className="v2-slot-time">{time}</span>
                    {sp > 0 && <span className="v2-slot-total">{sp} EUR</span>}
                  </div>

                  {acts.length === 0 ? (
                    <div className="v2-slot-empty">
                      Aucune activité — ajoutez-en une ci-dessous
                    </div>
                  ) : (
                    acts.map(act => (
                      <ActivityCard
                        key={act.id}
                        activity={act}
                        onEdit={() => setEditing({ dayIdx: activeDay, actIdx: globalIdx(act) })}
                      />
                    ))
                  )}

                  <button className="v2-add-act">
                    <Plus size={13} /> Ajouter une activité au {label.toLowerCase()}
                  </button>
                </div>
              );
            })
          )}

          <div className="v2-day-nav">
            <button className="v2-btn-ghost"
              disabled={activeDay === 0}
              onClick={() => setActiveDay(p => p - 1)}
              style={{ opacity: activeDay === 0 ? .35 : 1 }}>
              <ChevronLeft size={14} /> Jour précédent
            </button>
            <button className="v2-btn-ghost"
              disabled={activeDay === itinerary.days.length - 1}
              onClick={() => setActiveDay(p => p + 1)}
              style={{ opacity: activeDay === itinerary.days.length - 1 ? .35 : 1 }}>
              Jour suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="v2-bottom">
        <div>
          <div className="v2-total-lbl">Budget total estimé</div>
          <div className="v2-total-amt">
            {totalPrice.toLocaleString("fr-FR")}
            <span className="v2-total-eur">EUR</span>
          </div>
        </div>
        <div className="v2-bottom-right">
          {saveStatus === "ok" && <span className="v2-save-ok">✓ Sauvegardé</span>}
          {saveStatus === "error" && <span className="v2-save-err">Erreur de sauvegarde</span>}
          {saveStatus === "login" && <span className="v2-save-login">Connectez-vous d'abord</span>}
          <button className="v2-btn-ghost">
            <Download size={13} /> PDF
          </button>
          <button className="v2-btn-ghost">
            <Share2 size={13} /> Partager
          </button>
          <button className="v2-btn-teal" onClick={onCheckout}>
            <Heart size={13} /> Réserver l&apos;itinéraire
          </button>
        </div>
      </div>

      {/* ALT PICKER */}
      {editing && (
        <AlternativePicker
          alternatives={getAlternatives()}
          currentName={itinerary.days[editing.dayIdx].activities[editing.actIdx]?.name ?? ""}
          onPick={alt => { onChangeActivity(editing.dayIdx, editing.actIdx, alt); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}