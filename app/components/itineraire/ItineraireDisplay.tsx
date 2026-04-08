"use client";

/**
 * Drop-in replacement for the `step === "itineraire"` block in ModeAssiste.tsx
 *
 * Changes vs original:
 * - All emoji icons replaced with Lucide-React icons
 * - Activity cards show excursion PHOTOS (carousel), name, city, price, time,
 *   duration, languages, inclusions, description
 * - Cleaner day-tab bar
 * - "Changer" alt-picker redesigned
 * - Full dark-mode compatibility via CSS variables
 *
 * Usage: paste this file next to ModeAssiste.tsx and import ItineraireDisplay.
 * Replace the `{step === "itineraire" && itinerary && ( ... )}` block with:
 *   <ItineraireDisplay {...props} />
 */

import React, { useState } from "react";
import {
  MapPin, Clock, Globe, Gift, RefreshCw, ChevronLeft,
  ChevronRight, CheckCircle, RotateCcw, Loader2,
  ImageOff, Star, Users, BadgeCheck, Calendar,
} from "lucide-react";

/* ─── Types (mirror ModeAssiste) ─── */
type Activity = {
  id: string;
  name: string;
  description?: string;
  time?: string;
  duration?: string;
  price?: number;
  icon?: string;
  photos?: string | string[];
  languages?: string | string[];
  inclusion?: string | string[];
  city?: string;
  rating?: number;
};

type DayPlan = {
  day: number;
  city: string;
  theme?: string;
  emoji?: string;
  activities: Activity[];
};

type Itinerary = { title: string; days: DayPlan[] };

type ItineraireDisplayProps = {
  itinerary: Itinerary;
  selectedCities: string[];
  selectedCats: string[];
  categories: { id: string; nom?: string; name?: string }[];
  excursions: {
    id: string; title: string; city: string;
    price_per_person?: number; duration_hours?: number;
    description?: string; categories?: string[];
    photos?: string[]; languages?: string[];
    inclusions?: string[]; rating?: number;
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
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { /* */ }
  return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}

function parsePhotos(val?: string | string[]): string[] {
  if (!val) return [];
  const list = parseList(val);
  return list.filter(u => u.startsWith("http") || u.startsWith("/"));
}

/* ─── Photo carousel ─── */
function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);

  if (!photos.length) {
    return (
      <div style={photoBox}>
        <ImageOff size={28} color="var(--color-text-secondary)" />
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 6 }}>
          Aucune photo
        </span>
      </div>
    );
  }

  return (
    <div style={{ ...photoBox, padding: 0, overflow: "hidden", position: "relative" }}>
      <img
        src={photos[idx]}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {photos.length > 1 && (
        <>
          <button style={arrowBtn("left")} onClick={() => setIdx((idx - 1 + photos.length) % photos.length)}>
            <ChevronLeft size={14} />
          </button>
          <button style={arrowBtn("right")} onClick={() => setIdx((idx + 1) % photos.length)}>
            <ChevronRight size={14} />
          </button>
          <div style={dotRow}>
            {photos.map((_, i) => (
              <span
                key={i}
                onClick={() => setIdx(i)}
                style={{ width: 5, height: 5, borderRadius: "50%", cursor: "pointer",
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.45)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Activity card ─── */
function ActivityCard({
  act, dayIdx, actIdx, onEdit,
}: {
  act: Activity; dayIdx: number; actIdx: number; onEdit: () => void;
}) {
  const photos   = parsePhotos(act.photos);
  const langs    = parseList(act.languages);
  const includes = parseList(act.inclusion);
  const price    = Number(act.price) || 0;

  return (
    <div style={card}>
      {/* Photo */}
      <PhotoCarousel photos={photos} alt={act.name} />

      {/* Body */}
      <div style={{ padding: "14px 16px 12px" }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
            {act.name}
          </h3>
          <span style={priceBadge(price)}>
            {price === 0 ? "Gratuit" : `${price} TND`}
          </span>
        </div>

        {/* Meta row */}
        <div style={metaRow}>
          {act.time && (
            <span style={metaItem}>
              <Clock size={12} style={{ flexShrink: 0 }} />
              {act.time}
            </span>
          )}
          {act.duration && (
            <span style={metaItem}>
              <Calendar size={12} style={{ flexShrink: 0 }} />
              {act.duration}
            </span>
          )}
          {act.city && (
            <span style={metaItem}>
              <MapPin size={12} style={{ flexShrink: 0 }} />
              {act.city}
            </span>
          )}
          {act.rating && (
            <span style={metaItem}>
              <Star size={12} style={{ flexShrink: 0, color: "#F59E0B" }} />
              {act.rating}
            </span>
          )}
        </div>

        {/* Description */}
        {act.description && (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            {act.description}
          </p>
        )}

        {/* Languages */}
        {langs.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Globe size={12} color="var(--color-text-secondary)" style={{ flexShrink: 0 }} />
            {langs.map((l, i) => (
              <span key={i} style={tagPill}>{l}</span>
            ))}
          </div>
        )}

        {/* Inclusions */}
        {includes.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Gift size={12} color="var(--color-text-secondary)" style={{ flexShrink: 0 }} />
            {includes.map((inc, i) => (
              <span key={i} style={{ ...tagPill, background: "var(--color-background-success)", color: "var(--color-text-success)" }}>
                {inc}
              </span>
            ))}
          </div>
        )}

        {/* Change button */}
        <button style={changeBtn} onClick={onEdit}>
          <RefreshCw size={12} />
          Changer cette activité
        </button>
      </div>
    </div>
  );
}

/* ─── Alt picker ─── */
function AltPicker({
  alternatives, currentName, onPick, onClose,
}: {
  alternatives: Activity[]; currentName: string; onPick: (a: Activity) => void; onClose: () => void;
}) {
  return (
    <div style={altPanel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
          Remplacer « {currentName} »
        </span>
        <button style={iconBtn} onClick={onClose}>
          <ChevronLeft size={14} /> Annuler
        </button>
      </div>

      {alternatives.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", textAlign: "center", padding: "16px 0" }}>
          Aucune alternative disponible.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alternatives.map((alt, i) => {
            const photos = parsePhotos(alt.photos);
            const price  = Number(alt.price) || 0;
            return (
              <button key={i} style={altCard} onClick={() => onPick(alt)}>
                {photos[0] && (
                  <img src={photos[0]} alt={alt.name} style={altThumb} />
                )}
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {alt.name}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
                    {alt.duration && (
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={10} />{alt.duration}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: price === 0 ? "var(--color-text-success)" : "var(--color-text-primary)", fontWeight: 500 }}>
                      {price === 0 ? "Gratuit" : `${price} TND`}
                    </span>
                  </div>
                  {alt.description && (
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {alt.description}
                    </p>
                  )}
                </div>
                <BadgeCheck size={16} style={{ color: "var(--color-text-info)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════ Main export ════════ */
export default function ItineraireDisplay({
  itinerary, selectedCities, excursions,
  totalPrice, saving, saveStatus,
  onBack, onReset, onCheckout, onSave, onChangeActivity,
}: ItineraireDisplayProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [editing, setEditing]     = useState<{ dayIdx: number; actIdx: number } | null>(null);

  const day = itinerary.days[activeDay];

  /* Build alternatives for current edit target */
  const alts: Activity[] = (() => {
    if (!editing) return [];
    const d      = itinerary.days[editing.dayIdx];
    const city   = d.city;
    const curId  = d.activities[editing.actIdx].id;
    const used   = new Set(itinerary.days.flatMap(dd => dd.activities.map(a => a.id)));
    return excursions
      .filter(e => e.city === city && e.id !== curId && !used.has(e.id))
      .slice(0, 6)
      .map(e => ({
        id: e.id, name: e.title, description: e.description,
        time: d.activities[editing.actIdx].time,
        duration: e.duration_hours ? `${e.duration_hours}h` : "2h",
        price: e.price_per_person || 0,
        photos: e.photos,
        languages: e.languages,
        inclusion: e.inclusions,
        city: e.city,
        rating: e.rating,
      }));
  })();

  const applyAlt = (alt: Activity) => {
    if (!editing) return;
    onChangeActivity(editing.dayIdx, editing.actIdx, alt);
    setEditing(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Header ── */}
      <div style={headerWrap}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.25 }}>
            {itinerary.title}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={12} /> {itinerary.days.length} jours
            <MapPin size={12} style={{ marginLeft: 4 }} /> {selectedCities.join(", ")}
          </p>
        </div>
        <button style={secondaryBtn} onClick={onBack}>
          <RefreshCw size={12} /> Modifier
        </button>
      </div>

      {/* ── Day tabs ── */}
      <div style={dayTabsWrap}>
        {itinerary.days.map((d, i) => (
          <button
            key={i}
            style={{ ...dayTab, ...(activeDay === i ? dayTabActive : {}) }}
            onClick={() => { setActiveDay(i); setEditing(null); }}
          >
            <span style={{ fontSize: 11, opacity: 0.7 }}>J{d.day}</span>
            <span style={{ fontSize: 12, fontWeight: activeDay === i ? 500 : 400 }}>{d.city}</span>
          </button>
        ))}
      </div>

      {/* ── Day banner ── */}
      <div style={dayBanner}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={dayCircle}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{day.day}</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {day.city}
            </p>
            {day.theme && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{day.theme}</p>
            )}
          </div>
        </div>
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
          <Users size={12} /> {day.activities.length} activité{day.activities.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Activities ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 0 8px" }}>
        {day.activities.map((act, ai) => (
          <div key={act.id || ai}>
            {editing?.dayIdx === activeDay && editing?.actIdx === ai ? (
              <AltPicker
                alternatives={alts}
                currentName={act.name}
                onPick={applyAlt}
                onClose={() => setEditing(null)}
              />
            ) : (
              <ActivityCard
                act={act}
                dayIdx={activeDay}
                actIdx={ai}
                onEdit={() => setEditing({ dayIdx: activeDay, actIdx: ai })}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Day nav ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <button
          style={{ ...secondaryBtn, visibility: activeDay > 0 ? "visible" : "hidden" }}
          onClick={() => { setActiveDay(activeDay - 1); setEditing(null); }}
        >
          <ChevronLeft size={13} /> Jour {activeDay}
        </button>
        {activeDay < itinerary.days.length - 1 ? (
          <button style={primaryBtn} onClick={() => { setActiveDay(activeDay + 1); setEditing(null); }}>
            Jour {activeDay + 2} <ChevronRight size={13} />
          </button>
        ) : (
          <button style={primaryBtn} onClick={onCheckout}>
            <CheckCircle size={13} /> Réserver
          </button>
        )}
      </div>

      {/* ── Save feedback ── */}
      {saveStatus === "ok"    && <div style={{ ...saveFeedback, color: "var(--color-text-success)", borderColor: "var(--color-border-success)" }}><CheckCircle size={13} /> Itinéraire sauvegardé !</div>}
      {saveStatus === "error" && <div style={{ ...saveFeedback, color: "var(--color-text-danger)", borderColor: "var(--color-border-danger)" }}>Erreur de sauvegarde. Réessayez.</div>}
      {saveStatus === "login" && <div style={{ ...saveFeedback, color: "var(--color-text-warning)", borderColor: "var(--color-border-warning)" }}>Connectez-vous pour sauvegarder.</div>}

      {/* ── Recap / CTA ── */}
      <div style={recapWrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Total estimé</p>
            <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {totalPrice} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-secondary)" }}>TND</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={secondaryBtn} onClick={onSave} disabled={saving || saveStatus === "ok"}>
              {saving
                ? <><Loader2 size={12} /> Sauvegarde…</>
                : saveStatus === "ok"
                ? <><CheckCircle size={12} /> Sauvegardé</>
                : "💾 Sauvegarder"}
            </button>
            <button style={primaryBtn} onClick={onCheckout}>
              Finaliser <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Reset ── */}
      <div style={{ textAlign: "center", marginTop: 6 }}>
        <button style={resetLink} onClick={onReset}>
          <RotateCcw size={10} /> Recommencer depuis le début
        </button>
      </div>

    </div>
  );
}

/* ════════ Styles ════════ */
const card: React.CSSProperties = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
  overflow: "hidden",
};

const photoBox: React.CSSProperties = {
  width: "100%", height: 200,
  background: "var(--color-background-secondary)",
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
};

const arrowBtn = (side: "left" | "right"): React.CSSProperties => ({
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  [side]: 8,
  background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%",
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: "#fff", padding: 0,
});

const dotRow: React.CSSProperties = {
  position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
  display: "flex", gap: 4,
};

const metaRow: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6,
};

const metaItem: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  fontSize: 12, color: "var(--color-text-secondary)",
};

const tagPill: React.CSSProperties = {
  fontSize: 11, padding: "2px 8px", borderRadius: 999,
  background: "var(--color-background-secondary)",
  color: "var(--color-text-secondary)",
  border: "0.5px solid var(--color-border-tertiary)",
};

const priceBadge = (price: number): React.CSSProperties => ({
  fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 999, flexShrink: 0,
  background: price === 0 ? "var(--color-background-success)" : "var(--color-background-info)",
  color: price === 0 ? "var(--color-text-success)" : "var(--color-text-info)",
});

const changeBtn: React.CSSProperties = {
  marginTop: 12, width: "100%",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "8px 0", borderRadius: "var(--border-radius-md)",
  border: "0.5px solid var(--color-border-secondary)",
  background: "transparent", cursor: "pointer",
  fontSize: 12, color: "var(--color-text-secondary)",
};

const altPanel: React.CSSProperties = {
  background: "var(--color-background-secondary)",
  border: "0.5px solid var(--color-border-secondary)",
  borderRadius: "var(--border-radius-lg)", padding: "14px 16px",
};

const altCard: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "10px 12px",
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-md)",
  cursor: "pointer", width: "100%",
};

const altThumb: React.CSSProperties = {
  width: 48, height: 48, objectFit: "cover",
  borderRadius: "var(--border-radius-md)", flexShrink: 0,
};

const headerWrap: React.CSSProperties = {
  display: "flex", gap: 12, alignItems: "flex-start",
  padding: "0 0 16px", marginBottom: 4,
  borderBottom: "0.5px solid var(--color-border-tertiary)",
};

const dayTabsWrap: React.CSSProperties = {
  display: "flex", gap: 6, overflowX: "auto", padding: "12px 0",
  scrollbarWidth: "none",
};

const dayTab: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "6px 14px", borderRadius: "var(--border-radius-md)",
  border: "0.5px solid var(--color-border-tertiary)",
  background: "transparent", cursor: "pointer", flexShrink: 0,
  fontSize: 12, color: "var(--color-text-secondary)",
};

const dayTabActive: React.CSSProperties = {
  background: "var(--color-background-info)",
  color: "var(--color-text-info)",
  borderColor: "var(--color-border-info)",
};

const dayBanner: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "10px 14px", marginBottom: 14,
  background: "var(--color-background-secondary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-md)",
};

const dayCircle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%",
  background: "var(--color-background-info)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--color-text-info)",
};

const primaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
  borderRadius: "var(--border-radius-md)", border: "none",
  background: "var(--color-background-info)", color: "var(--color-text-info)",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
  borderRadius: "var(--border-radius-md)",
  border: "0.5px solid var(--color-border-secondary)",
  background: "transparent", color: "var(--color-text-secondary)",
  fontSize: 12, cursor: "pointer",
};

const iconBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  border: "none", background: "transparent",
  fontSize: 12, color: "var(--color-text-secondary)", cursor: "pointer",
};

const saveFeedback: React.CSSProperties = {
  marginTop: 10, padding: "8px 14px", borderRadius: "var(--border-radius-md)",
  border: "0.5px solid", fontSize: 13,
  display: "flex", alignItems: "center", gap: 6,
};

const recapWrap: React.CSSProperties = {
  marginTop: 16, padding: "14px 16px",
  background: "var(--color-background-secondary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
};

const resetLink: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontSize: 11, color: "var(--color-text-secondary)",
  background: "none", border: "none", cursor: "pointer",
  padding: "8px 0",
};