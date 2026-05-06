"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, Globe, RefreshCw, ChevronLeft,
  ChevronRight, CheckCircle, RotateCcw, Loader2,
  Star, Users, Calendar, DollarSign, Camera,
  Languages, Package, Heart, X, Sparkles, Map,
  ArrowRight, Navigation, Bookmark, Share2,
  ChevronDown, Tag, Timer, BadgeCheck,
} from "lucide-react";

/* ─── Types ─── */
type Activity = {
  id: string; name: string; description?: string; time?: string;
  duration?: string; price?: number; icon?: string;
  photos?: string | string[]; languages?: string | string[];
  inclusion?: string | string[]; city?: string;
  rating?: number; reviews_count?: number; max_people?: number;
};

type DayPlan = { day: number; city: string; theme?: string; emoji?: string; activities: Activity[] };
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
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { }
  return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}
function parsePhotos(val?: string | string[]): string[] {
  if (!val) return [];
  return parseList(val).filter(u => u.startsWith("http") || u.startsWith("/"));
}
function formatPrice(price?: number): string {
  if (!price) return "Gratuit";
  return `${price} TND`;
}

/* ─── Styles ─── */
const T = "#1a2e3b";   // primary text
const M = "#5a7a8d";   // muted text
const TEAL = "#2B96A8";
const TEAL_LIGHT = "rgba(43,150,168,0.1)";
const TEAL_BORDER = "rgba(43,150,168,0.25)";
const BORDER = "#e8edf2";
const BG = "#f5f8fa";
const WHITE = "#ffffff";
const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
const CARD_SHADOW_HOVER = "0 4px 12px rgba(0,0,0,0.1)";

const css = {
  root: {
    minHeight: "100vh",
    overflowY: "auto" as const,
    background: BG,
    color: T,
    fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
  } as React.CSSProperties,

  /* ── Header ── */
  header: {
    background: WHITE,
    borderBottom: `1px solid ${BORDER}`,
    padding: "24px 32px 20px",
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: 16,
    flexWrap: "wrap" as const,
  },
  headerLeft: { display: "flex", flexDirection: "column" as const, gap: 8 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: TEAL_LIGHT, border: `1px solid ${TEAL_BORDER}`,
    color: TEAL, borderRadius: 20, padding: "3px 10px",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", width: "fit-content",
  },
  title: { fontSize: 22, fontWeight: 700, color: T, lineHeight: 1.3, margin: 0 },
  metaRow: {
    display: "flex", flexWrap: "wrap" as const, gap: 12,
    alignItems: "center", fontSize: 12, color: M,
  },
  metaItem: { display: "flex", alignItems: "center", gap: 4 },

  /* ── Buttons ── */
  btnPrimary: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: TEAL, color: "#fff", border: "none", borderRadius: 12,
    padding: "11px 22px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", transition: "all 0.2s",
  } as React.CSSProperties,
  btnSecondary: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: WHITE, border: `1px solid ${BORDER}`,
    color: T, borderRadius: 12, padding: "10px 20px",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    boxShadow: CARD_SHADOW, transition: "all 0.2s",
  } as React.CSSProperties,
  btnGhost: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "transparent", border: "none",
    color: M, fontSize: 12, fontWeight: 500,
    cursor: "pointer", padding: "6px 0",
  } as React.CSSProperties,

  /* ── Day tabs ── */
  tabsWrap: {
    overflowX: "auto" as const,
    padding: "0 32px",
    borderBottom: `1px solid ${BORDER}`,
    display: "flex", gap: 4, background: WHITE,
    scrollbarWidth: "none" as const,
  },
  tab: (active: boolean): React.CSSProperties => ({
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "14px 20px", gap: 3,
    border: "none", background: "transparent",
    borderBottom: active ? `2px solid ${TEAL}` : "2px solid transparent",
    color: active ? TEAL : M,
    cursor: "pointer", whiteSpace: "nowrap" as const,
    fontSize: 13, fontWeight: active ? 600 : 400,
    transition: "all 0.15s", minWidth: 80,
  }),
  tabDay: { fontSize: 13, fontWeight: 600 },
  tabCity: { fontSize: 10, opacity: 0.75 },

  /* ── Day banner ── */
  dayBanner: {
    margin: "20px 32px 0",
    background: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: "18px 22px",
    display: "flex", alignItems: "center", gap: 16,
    boxShadow: CARD_SHADOW,
  },
  dayEmojiBox: {
    width: 48, height: 48, borderRadius: 12,
    background: TEAL_LIGHT,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, flexShrink: 0,
  },
  dayBannerTitle: { fontSize: 17, fontWeight: 700, color: T, margin: 0 },
  dayBannerTheme: { fontSize: 12, color: M, margin: "3px 0 0", fontStyle: "italic" },
  dayBannerCount: {
    marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
    background: TEAL_LIGHT, border: `1px solid ${TEAL_BORDER}`,
    borderRadius: 8, padding: "5px 10px",
    fontSize: 12, color: TEAL, fontWeight: 600, flexShrink: 0,
  },

  /* ── Activity list — single column ── */
  actGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    padding: "20px 32px 0",
  },

  /* ── Activity card — full-width horizontal ── */
  actCard: {
    display: "flex", gap: 0,
    background: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: 16, overflow: "hidden",
    boxShadow: CARD_SHADOW,
    transition: "box-shadow 0.2s, border-color 0.2s",
    minHeight: 150,
  },

  /* Left image column */
  actThumbCol: {
    width: 200, flexShrink: 0, position: "relative" as const,
    overflow: "hidden",
  },
  actThumbImg: {
    width: "100%", height: "100%", objectFit: "cover" as const,
    display: "block",
  },
  actThumbPlaceholder: {
    width: "100%", height: "100%", minHeight: 150,
    background: BG, border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#b0c4cf", flexDirection: "column" as const, gap: 6, fontSize: 11,
  },
  actTimeBadge: {
    position: "absolute" as const, bottom: 8, left: 8,
    background: "rgba(43,150,168,0.92)", color: "#fff",
    borderRadius: 6, padding: "3px 8px",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
  },

  /* Right content column */
  actContent: {
    flex: 1, display: "flex", flexDirection: "column" as const,
    padding: "14px 18px", minWidth: 0, gap: 0,
  },
  actNameRow: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: 10, marginBottom: 6,
  },
  actName: { fontSize: 15, fontWeight: 700, color: T, margin: 0, flex: 1, lineHeight: 1.35 },
  pricePill: (free: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    background: free ? "rgba(5,150,105,0.1)" : TEAL_LIGHT,
    border: `1px solid ${free ? "rgba(5,150,105,0.25)" : TEAL_BORDER}`,
    color: free ? "#059669" : TEAL,
    borderRadius: 8, padding: "3px 10px",
    fontSize: 13, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" as const,
  }),
  actMetaRow: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 8 },
  actMetaChip: {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: BG, border: `1px solid ${BORDER}`,
    borderRadius: 6, padding: "3px 8px", fontSize: 11, color: M,
  },
  actDesc: {
    fontSize: 12, color: M, lineHeight: 1.55, margin: "0 0 8px",
    display: "-webkit-box" as const,
    WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
  },
  tagsRow: { display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 8 },
  tag: (bg: string, color: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    background: bg, border: `1px solid ${color}22`,
    borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 500, color,
  }),
  actFooter: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginTop: "auto", paddingTop: 8,
    borderTop: `1px solid ${BORDER}`,
  },
  changeBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: WHITE, border: `1px solid ${BORDER}`,
    color: M, borderRadius: 8, padding: "6px 12px",
    fontSize: 11, fontWeight: 500, cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  ratingBadge: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#f59e0b", fontWeight: 600 },

  /* ── Alt Picker ── */
  altPanel: {
    background: WHITE, border: `1px solid ${TEAL_BORDER}`,
    borderRadius: 16, overflow: "hidden",
    boxShadow: CARD_SHADOW,
  },
  altHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: `1px solid ${BORDER}`,
    background: TEAL_LIGHT,
  },
  altTitle: { fontSize: 13, fontWeight: 600, color: T, margin: 0 },
  closeBtn: {
    background: WHITE, border: `1px solid ${BORDER}`,
    color: M, borderRadius: 6, width: 26, height: 26,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  } as React.CSSProperties,
  altList: { display: "flex", flexDirection: "column" as const },
  altCard: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 18px", borderBottom: `1px solid ${BORDER}`,
    cursor: "pointer", transition: "background 0.15s",
  } as React.CSSProperties,
  altThumb: {
    width: 48, height: 48, borderRadius: 8,
    objectFit: "cover" as const, flexShrink: 0,
    border: `1px solid ${BORDER}`,
  },
  altName: { fontSize: 13, fontWeight: 600, color: T },
  altPrice: (free: boolean): React.CSSProperties => ({
    fontSize: 11, fontWeight: 700, color: free ? "#059669" : TEAL,
  }),
  altMeta: { fontSize: 11, color: M, marginTop: 2 },
  altDesc: {
    fontSize: 11, color: "#8aa8bc",
    display: "-webkit-box" as const, WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical" as const, overflow: "hidden",
  },

  /* ── Day nav ── */
  dayNav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 32px 0", gap: 12,
  },

  /* ── Footer recap ── */
  recap: {
    margin: "24px 32px 32px",
    background: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: 18, padding: "20px 24px",
    display: "flex", flexWrap: "wrap" as const,
    alignItems: "center", gap: 20,
    boxShadow: CARD_SHADOW,
  },
  recapPrice: { display: "flex", flexDirection: "column" as const, gap: 2 },
  recapLabel: { fontSize: 11, color: M, fontWeight: 500, letterSpacing: "0.05em" },
  recapAmount: { fontSize: 28, fontWeight: 800, color: TEAL, lineHeight: 1 },
  recapSuffix: { fontSize: 13, color: M, fontWeight: 500 },
  recapNote: { fontSize: 10, color: "#b0c4cf", marginTop: 2 },
  recapActions: {
    marginLeft: "auto", display: "flex", alignItems: "center",
    gap: 10, flexWrap: "wrap" as const,
  },
  saveBtn: (status: string, saving: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 8,
    background: status === "ok" ? "rgba(5,150,105,0.1)" : TEAL,
    border: status === "ok" ? "1px solid rgba(5,150,105,0.25)" : "none",
    color: status === "ok" ? "#059669" : "#fff",
    borderRadius: 12, padding: "11px 20px",
    fontSize: 14, fontWeight: 600,
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.7 : 1, transition: "all 0.2s",
  }),
  feedback: (status: string): React.CSSProperties => ({
    width: "100%", padding: "10px 14px", borderRadius: 10,
    background: status === "ok" ? "rgba(5,150,105,0.08)" :
                status === "error" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
    border: `1px solid ${status === "ok" ? "rgba(5,150,105,0.2)" :
      status === "error" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
    color: status === "ok" ? "#059669" : status === "error" ? "#dc2626" : "#d97706",
    fontSize: 12, display: "flex", alignItems: "center", gap: 8,
  }),
  spin: { animation: "spin 1s linear infinite" } as React.CSSProperties,
} as const;

/* ─── Compact Thumbnail ─── */
function ActivityThumb({ photos, time }: { photos: string[]; time?: string }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) return (
    <div style={css.actThumbPlaceholder}>
      <Camera size={22} /><span>Aucune photo</span>
    </div>
  );
  return (
    <div style={{ position: "relative", height: "100%", minHeight: 150 }}>
      <img src={photos[idx]} alt="" style={css.actThumbImg} />
      {time && <div style={css.actTimeBadge}>{time}</div>}
      {photos.length > 1 && (
        <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
          <button
            style={{ background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", borderRadius: 4, width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            onClick={e => { e.stopPropagation(); setIdx((idx - 1 + photos.length) % photos.length); }}
          ><ChevronLeft size={11} /></button>
          <button
            style={{ background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", borderRadius: 4, width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            onClick={e => { e.stopPropagation(); setIdx((idx + 1) % photos.length); }}
          ><ChevronRight size={11} /></button>
        </div>
      )}
      {photos.length > 1 && (
        <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.45)", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 9 }}>
          {idx + 1}/{photos.length}
        </div>
      )}
    </div>
  );
}

/* ─── Activity Card — full-width horizontal ─── */
function ActivityCard({ activity, onEdit }: { activity: Activity; onEdit: () => void }) {
  const [hovered, setHovered] = useState(false);
  const photos = parsePhotos(activity.photos);
  const languages = parseList(activity.languages);
  const inclusions = parseList(activity.inclusion);
  const price = activity.price || 0;
  const free = price === 0;

  return (
    <div
      style={{ ...css.actCard, boxShadow: hovered ? CARD_SHADOW_HOVER : CARD_SHADOW, borderColor: hovered ? TEAL_BORDER : BORDER }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left: image */}
      <div style={css.actThumbCol}>
        <ActivityThumb photos={photos} time={activity.time} />
      </div>

      {/* Right: full details */}
      <div style={css.actContent}>
        {/* Name + price */}
        <div style={css.actNameRow}>
          <h4 style={css.actName}>{activity.name}</h4>
          <span style={css.pricePill(free)}>
            <DollarSign size={12} />{formatPrice(price)}
          </span>
        </div>

        {/* Meta chips */}
        <div style={css.actMetaRow}>
          {activity.duration && <span style={css.actMetaChip}><Timer size={11} />{activity.duration}</span>}
          {activity.city && <span style={css.actMetaChip}><MapPin size={11} />{activity.city}</span>}
          {activity.max_people && <span style={css.actMetaChip}><Users size={11} />Max {activity.max_people}</span>}
        </div>

        {/* Description — 3 lines */}
        {activity.description && <p style={css.actDesc}>{activity.description}</p>}

        {/* Tags: languages + inclusions */}
        <div style={css.tagsRow}>
          {languages.slice(0, 4).map((l, i) => (
            <span key={i} style={css.tag(TEAL_LIGHT, TEAL)}><Globe size={10} />{l}</span>
          ))}
          {inclusions.slice(0, 4).map((inc, i) => (
            <span key={i} style={css.tag(BG, M)}><BadgeCheck size={10} />{inc}</span>
          ))}
        </div>

        {/* Footer */}
        <div style={css.actFooter}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {activity.rating ? (
              <span style={css.ratingBadge}>
                <Star size={12} fill="#f59e0b" />
                {activity.rating}
                {activity.reviews_count && (
                  <span style={{ color: M, fontWeight: 400, fontSize: 11 }}>({activity.reviews_count} avis)</span>
                )}
              </span>
            ) : null}
          </div>
          <button style={css.changeBtn} onClick={onEdit}>
            <RefreshCw size={11} />Changer l&apos;activité
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Alternative Picker ─── */
function AlternativePicker({ alternatives, currentName, onPick, onClose }: {
  alternatives: Activity[]; currentName: string;
  onPick: (alt: Activity) => void; onClose: () => void;
}) {
  return (
    <div style={css.altPanel}>
      <div style={css.altHeader}>
        <h5 style={css.altTitle}>
          <RefreshCw size={12} style={{ display: "inline", marginRight: 6, color: TEAL }} />
          Remplacer &quot;{currentName}&quot;
        </h5>
        <button style={css.closeBtn} onClick={onClose}><X size={13} /></button>
      </div>
      {!alternatives.length ? (
        <p style={{ textAlign: "center", padding: 20, color: M, fontSize: 12 }}>
          Aucune alternative disponible dans cette ville.
        </p>
      ) : (
        <div style={css.altList}>
          {alternatives.map((alt, idx) => {
            const photos = parsePhotos(alt.photos);
            const price = alt.price || 0;
            return (
              <div
                key={idx} style={css.altCard}
                onClick={() => onPick(alt)}
                onMouseEnter={e => (e.currentTarget.style.background = TEAL_LIGHT)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {photos[0]
                  ? <img src={photos[0]} alt={alt.name} style={css.altThumb} />
                  : <div style={{ ...css.altThumb, background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={14} style={{ color: "#b0c4cf" }} />
                    </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                    <span style={css.altName}>{alt.name}</span>
                    <span style={css.altPrice(price === 0)}>{formatPrice(price)}</span>
                  </div>
                  <div style={css.altMeta}>
                    {alt.duration && <span>{alt.duration}</span>}
                    {alt.city && <span> · {alt.city}</span>}
                  </div>
                  {alt.description && <div style={css.altDesc}>{alt.description}</div>}
                </div>
                <ArrowRight size={14} style={{ color: TEAL, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════ MAIN ════════════════════ */
export default function ItineraireDisplay({
  itinerary, selectedCities, excursions, totalPrice,
  saving, saveStatus, onBack, onReset, onCheckout, onSave, onChangeActivity,
}: ItineraireDisplayProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [editing, setEditing] = useState<{ dayIdx: number; actIdx: number } | null>(null);

  const currentDay = itinerary.days[activeDay];
  const totalActivities = itinerary.days.reduce((s, d) => s + d.activities.length, 0);

  const getAlternatives = (): Activity[] => {
    if (!editing) return [];
    const day = itinerary.days[editing.dayIdx];
    const currentAct = day.activities[editing.actIdx];
    return excursions
      .filter(e => e.city === day.city && e.id !== currentAct.id)
      .slice(0, 6)
      .map(e => ({
        id: e.id, name: e.title, description: e.description,
        duration: e.duration_hours ? `${e.duration_hours}h` : "2h",
        price: e.price_per_person || 0,
        photos: e.photos, languages: e.languages,
        inclusion: e.inclusions, city: e.city, rating: e.rating,
        time: currentAct.time,
      }));
  };

  return (
    <div style={css.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        html, body, #__next, #root { height: 100%; margin: 0; padding: 0; }
        body { overflow: hidden; }
        ::-webkit-scrollbar { width: 5px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${TEAL_BORDER}; border-radius: 3px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={css.header}>
        <div style={css.headerLeft}>
          <div style={css.badge}><Sparkles size={11} />Itinéraire IA</div>
          <h2 style={css.title}>{itinerary.title}</h2>
          <div style={css.metaRow}>
            <span style={css.metaItem}><Calendar size={12} style={{ color: TEAL }} />{itinerary.days.length} jours</span>
            <span style={{ color: BORDER }}>·</span>
            <span style={css.metaItem}><Navigation size={12} style={{ color: TEAL }} />{selectedCities.join(" → ")}</span>
            <span style={{ color: BORDER }}>·</span>
            <span style={css.metaItem}><CheckCircle size={12} style={{ color: TEAL }} />{totalActivities} activités</span>
          </div>
        </div>
        <button
          style={css.btnSecondary}
          onClick={onBack}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = CARD_SHADOW_HOVER)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = CARD_SHADOW)}
        >
          <RefreshCw size={14} />Modifier
        </button>
      </div>

      {/* ── DAY TABS ── */}
      <div style={css.tabsWrap}>
        {itinerary.days.map((day, idx) => (
          <button
            key={idx}
            style={css.tab(activeDay === idx)}
            onClick={() => { setActiveDay(idx); setEditing(null); }}
          >
            <span style={css.tabDay}>Jour {day.day}</span>
            <span style={css.tabCity}>{day.city}</span>
          </button>
        ))}
      </div>

      {/* ── DAY BANNER ── */}
      <div style={css.dayBanner}>
        <div style={css.dayEmojiBox}>{currentDay.emoji || "🗺️"}</div>
        <div>
          <h3 style={css.dayBannerTitle}>Jour {currentDay.day} — {currentDay.city}</h3>
          {currentDay.theme && <p style={css.dayBannerTheme}>{currentDay.theme}</p>}
        </div>
        <div style={css.dayBannerCount}>
          <CheckCircle size={12} />
          {currentDay.activities.length} activité{currentDay.activities.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* ── ACTIVITIES GRID ── */}
      <div style={css.actGrid}>
        {currentDay.activities.map((activity, actIdx) => (
          <div key={activity.id || actIdx}>
            {editing?.dayIdx === activeDay && editing?.actIdx === actIdx ? (
              <AlternativePicker
                alternatives={getAlternatives()}
                currentName={activity.name}
                onPick={alt => { onChangeActivity(activeDay, actIdx, alt); setEditing(null); }}
                onClose={() => setEditing(null)}
              />
            ) : (
              <ActivityCard
                activity={activity}
                onEdit={() => setEditing({ dayIdx: activeDay, actIdx })}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── DAY NAVIGATION ── */}
      <div style={css.dayNav}>
        <button
          style={{ ...css.btnSecondary, opacity: activeDay === 0 ? 0.4 : 1 }}
          onClick={() => activeDay > 0 && setActiveDay(activeDay - 1)}
          disabled={activeDay === 0}
        >
          <ChevronLeft size={14} />Précédent
        </button>

        {activeDay < itinerary.days.length - 1 ? (
          <button
            style={css.btnPrimary}
            onClick={() => setActiveDay(activeDay + 1)}
            onMouseEnter={e => (e.currentTarget.style.background = "#249aac")}
            onMouseLeave={e => (e.currentTarget.style.background = TEAL)}
          >
            Jour suivant<ChevronRight size={14} />
          </button>
        ) : (
          <button
            style={{ ...css.btnPrimary, background: "#059669" }}
            onClick={onCheckout}
          >
            <Map size={14} />Finaliser la réservation
          </button>
        )}
      </div>

      {/* ── RECAP FOOTER ── */}
      <div style={css.recap}>
        <div style={css.recapPrice}>
          <span style={css.recapLabel}>TOTAL ESTIMÉ</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={css.recapAmount}>{totalPrice}</span>
            <span style={css.recapSuffix}>TND</span>
          </div>
          <span style={css.recapNote}>*Par personne, hors options</span>
        </div>

        <div style={css.recapActions}>
          <button style={css.btnGhost} onClick={onReset}>
            <RotateCcw size={12} />Nouvel itinéraire
          </button>
          <button style={css.saveBtn(saveStatus, saving)} onClick={onSave} disabled={saving}>
            {saving ? (<><Loader2 size={14} style={css.spin} />Sauvegarde…</>)
              : saveStatus === "ok" ? (<><CheckCircle size={14} />Sauvegardé</>)
              : (<><Bookmark size={14} />Sauvegarder</>)}
          </button>
          <button
            style={css.btnPrimary} onClick={onCheckout}
            onMouseEnter={e => (e.currentTarget.style.background = "#249aac")}
            onMouseLeave={e => (e.currentTarget.style.background = TEAL)}
          >
            <Map size={14} />Réserver
          </button>
        </div>

        {saveStatus !== "idle" && (
          <div style={css.feedback(saveStatus)}>
            {saveStatus === "ok" && <><CheckCircle size={13} /> Itinéraire sauvegardé avec succès !</>}
            {saveStatus === "error" && "Erreur lors de la sauvegarde. Réessayez."}
            {saveStatus === "login" && "Connectez-vous pour sauvegarder votre itinéraire."}
          </div>
        )}
      </div>
    </div>
  );
}
