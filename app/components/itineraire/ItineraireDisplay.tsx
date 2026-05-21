"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, Globe, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, RotateCcw, Star, Users, Calendar, DollarSign,
  Languages, BadgeCheck, Sparkles, Navigation, ArrowRight,
  Timer, Camera, Heart, Save, X, ChevronDown,
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
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { }
  return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}
function parsePhotos(val?: string | string[]): string[] {
  return parseList(val).filter(u => u.startsWith("http") || u.startsWith("/"));
}
function fmtPrice(price?: number) {
  if (!price) return "Inclus";
  return `${price} EUR`;
}

/* ─── CSS ─── */
const TEAL = "#2B96A8";
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.itin-root {
  min-height: 100vh;
  background: #F5F8FA;
  font-family: inherit'DM Sans', system-ui, sans-serif;
  color: #1a2e3b;
}

/* ── Header ── */
.itin-header {
  background: white;
  border-bottom: 1px solid #e8edf2;
  padding: 24px 40px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 2px 12px rgba(0,0,0,.04);
}
.itin-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(43,150,168,.1);
  border: 1px solid rgba(43,150,168,.2);
  color: #2B96A8; border-radius: 20px;
  padding: 3px 12px; font-size: 11px; font-weight: 700;
  letter-spacing: .06em; margin-bottom: 8px;
}
.itin-title {
  font-family: inherit'Playfair Display', serif;
  font-size: 24px; font-weight: 900; color: #111827;
  margin-bottom: 10px; line-height: 1.3;
}
.itin-meta {
  display: flex; flex-wrap: wrap; gap: 16px;
  font-size: 13px; color: #6B7280;
}
.itin-meta span {
  display: flex; align-items: center; gap: 5px;
}
.itin-header-actions {
  display: flex; gap: 10px; align-items: center; flex-shrink: 0;
}
.itin-btn-ghost {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px; border-radius: 11px;
  border: 1.5px solid #E5E7EB; background: white;
  color: #374151; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inheritinherit; transition: all .15s;
}
.itin-btn-ghost:hover { border-color: #2B96A8; color: #2B96A8; }
.itin-btn-primary {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 22px; border-radius: 11px;
  background: #2B96A8; border: none;
  color: white; font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inheritinherit;
  box-shadow: 0 4px 12px rgba(43,150,168,.3);
  transition: all .2s;
}
.itin-btn-primary:hover { background: #248899; box-shadow: 0 6px 18px rgba(43,150,168,.4); }

/* ── Day tabs ── */
.itin-tabs {
  background: white;
  border-bottom: 1px solid #e8edf2;
  padding: 0 40px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
}
.itin-tabs::-webkit-scrollbar { height: 3px; }
.itin-tab {
  display: flex; flex-direction: column;
  align-items: center; padding: 14px 20px;
  border: none; background: none; cursor: pointer;
  font-family: inheritinherit; border-bottom: 3px solid transparent;
  transition: all .2s; white-space: nowrap; min-width: 80px;
}
.itin-tab:hover { background: rgba(43,150,168,.04); }
.itin-tab.active { border-bottom-color: #2B96A8; }
.itin-tab-day {
  font-size: 11px; font-weight: 700; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: .06em;
}
.itin-tab.active .itin-tab-day { color: #2B96A8; }
.itin-tab-city { font-size: 13px; font-weight: 700; color: #374151; margin-top: 2px; }
.itin-tab.active .itin-tab-city { color: #111827; }
.itin-tab-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #E5E7EB; margin-top: 4px;
}
.itin-tab.active .itin-tab-dot { background: #2B96A8; }

/* ── Day header ── */
.itin-day-header {
  background: linear-gradient(135deg, #0F172A 0%, #1a3a4a 100%);
  padding: 28px 40px;
  display: flex; align-items: center; gap: 18px;
  position: relative; overflow: hidden;
}
.itin-day-header::after {
  content: '';
  position: absolute; top: 0; right: 0;
  width: 200px; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(43,150,168,.1));
}
.itin-day-emoji {
  width: 56px; height: 56px; border-radius: 16px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
}
.itin-day-title {
  font-family: inherit'Playfair Display', serif;
  font-size: 22px; font-weight: 900; color: white;
}
.itin-day-theme {
  font-size: 13px; color: rgba(255,255,255,.55); margin-top: 4px;
}
.itin-day-count {
  margin-left: auto;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 20px;
  background: rgba(43,150,168,.25);
  border: 1px solid rgba(43,150,168,.4);
  font-size: 12px; font-weight: 700; color: #7EDCED;
  flex-shrink: 0; z-index: 1;
}

/* ── Activities list ── */
.itin-acts {
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* ── Activity card ── */
.itin-act-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e8edf2;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  overflow: hidden;
  transition: all .25s;
}
.itin-act-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  transform: translateY(-2px);
  border-color: rgba(43,150,168,.25);
}

/* Timeline dot */
.itin-act-time-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #F8FAFB, #F0F4F7);
  border-bottom: 1px solid #EEF1F5;
}
.itin-act-time-dot {
  width: 32px; height: 32px; border-radius: 10px;
  background: #2B96A8;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.itin-act-time-label {
  font-size: 13px; font-weight: 800; color: #2B96A8; letter-spacing: .02em;
}
.itin-act-num {
  margin-left: auto;
  width: 24px; height: 24px; border-radius: 8px;
  background: rgba(43,150,168,.1); color: #2B96A8;
  font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}

/* Card body */
.itin-act-body {
  display: flex; gap: 0;
}
.itin-act-photo {
  width: 200px; flex-shrink: 0;
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #1a3a4a, #0F172A);
}
.itin-act-photo img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform .4s;
}
.itin-act-card:hover .itin-act-photo img { transform: scale(1.05); }
.itin-act-photo-placeholder {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; color: rgba(255,255,255,.35);
  font-size: 11px; font-weight: 600;
  min-height: 180px;
}
.itin-act-photo-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to right, transparent 60%, white);
}

/* Card content */
.itin-act-content {
  flex: 1; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 10px;
}
.itin-act-name-row {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 12px;
}
.itin-act-name {
  font-family: inherit'Playfair Display', serif;
  font-size: 18px; font-weight: 700; color: #111827;
  line-height: 1.3; flex: 1;
}
.itin-price-pill {
  padding: 5px 12px; border-radius: 20px;
  font-size: 13px; font-weight: 800;
  flex-shrink: 0;
  background: rgba(43,150,168,.1);
  color: #2B96A8;
  border: 1px solid rgba(43,150,168,.2);
}
.itin-price-pill.free {
  background: rgba(16,185,129,.1);
  color: #059669;
  border-color: rgba(16,185,129,.2);
}

/* Meta chips */
.itin-act-meta {
  display: flex; flex-wrap: wrap; gap: 7px;
}
.itin-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  background: #F3F4F6; color: #6B7280;
}

/* Description */
.itin-act-desc {
  font-size: 13px; color: #6B7280; line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tags */
.itin-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.itin-tag {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 6px;
  font-size: 11px; font-weight: 600;
}
.itin-tag-lang { background: rgba(43,150,168,.08); color: #2B96A8; }
.itin-tag-inc  { background: #F3F4F6; color: #6B7280; }

/* Footer */
.itin-act-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto; padding-top: 8px;
  border-top: 1px solid #F3F4F6;
}
.itin-rating {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: #111827;
}
.itin-change-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 9px;
  border: 1.5px solid #E5E7EB; background: white;
  color: #6B7280; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inheritinherit; transition: all .15s;
}
.itin-change-btn:hover { border-color: #2B96A8; color: #2B96A8; background: rgba(43,150,168,.04); }

/* ── Total bar ── */
.itin-total-bar {
  background: white; border-top: 1px solid #e8edf2;
  padding: 20px 40px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; flex-wrap: wrap;
  box-shadow: 0 -4px 16px rgba(0,0,0,.04);
  position: sticky; bottom: 0; z-index: 10;
}
.itin-total-label { font-size: 13px; color: #6B7280; font-weight: 500; }
.itin-total-amount {
  font-family: inherit'Playfair Display', serif;
  font-size: 28px; font-weight: 900; color: #111827;
}
.itin-total-amount span { font-size: 14px; color: #9CA3AF; font-weight: 400; margin-left: 4px; }
.itin-total-actions { display: flex; gap: 10px; }

/* ── Alternative picker modal ── */
.itin-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.itin-alt-box {
  background: white; border-radius: 24px;
  width: 100%; max-width: 560px;
  max-height: 80vh; overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,.25);
  animation: itin-slide-up .25s ease;
}
@keyframes itin-slide-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: none; }
}
.itin-alt-header {
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F6;
  display: flex; align-items: center; justify-content: space-between;
}
.itin-alt-title { font-size: 16px; font-weight: 800; color: #111827; }
.itin-close-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: none; background: #F3F4F6;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s;
}
.itin-close-btn:hover { background: #E5E7EB; }
.itin-alt-list { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.itin-alt-item {
  display: flex; gap: 14px; padding: 14px; border-radius: 14px;
  border: 1.5px solid #E5E7EB; cursor: pointer;
  transition: all .15s; align-items: center;
}
.itin-alt-item:hover { border-color: #2B96A8; background: rgba(43,150,168,.03); }
.itin-alt-thumb {
  width: 64px; height: 64px; border-radius: 10px;
  overflow: hidden; flex-shrink: 0; background: #F3F4F6;
}
.itin-alt-thumb img { width: 100%; height: 100%; object-fit: cover; }
.itin-alt-name { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.itin-alt-meta { font-size: 12px; color: #6B7280; display: flex; gap: 8px; flex-wrap: wrap; }

/* Save status */
.itin-save-ok    { color: #059669; }
.itin-save-err   { color: #DC2626; }
.itin-save-login { color: #D97706; }

@keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── ActivityCard ─── */
function ActivityCard({
  activity, actIdx, onEdit,
}: { activity: Activity; actIdx: number; onEdit: () => void }) {
  const photos    = parsePhotos(activity.photos);
  const languages = parseList(activity.languages);
  const inclusions = parseList(activity.inclusion);
  const price  = activity.price || 0;
  const free   = price === 0;
  const photo  = photos[0];

  return (
    <div className="itin-act-card">
      {/* Time row */}
      <div className="itin-act-time-row">
        <div className="itin-act-time-dot">
          <Timer size={14} color="white" />
        </div>
        <span className="itin-act-time-label">
          {activity.time || `Activité ${actIdx + 1}`}
        </span>
        <div className="itin-act-num">{actIdx + 1}</div>
      </div>

      {/* Body */}
      <div className="itin-act-body">
        {/* Photo */}
        <div className="itin-act-photo" style={{ minHeight: 180 }}>
          {photo ? (
            <>
              <img src={photo} alt={activity.name} loading="lazy" />
              <div className="itin-act-photo-overlay" />
            </>
          ) : (
            <div className="itin-act-photo-placeholder">
              <Camera size={28} strokeWidth={1.5} />
              <span>Photo</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="itin-act-content">
          {/* Name + price */}
          <div className="itin-act-name-row">
            <h4 className="itin-act-name">{activity.name}</h4>
            <span className={`itin-price-pill ${free ? "free" : ""}`}>
              {free ? "Inclus" : `${price} EUR`}
            </span>
          </div>

          {/* Meta chips */}
          <div className="itin-act-meta">
            {activity.duration && (
              <span className="itin-chip">
                <Clock size={11} color="#2B96A8" /> {activity.duration}
              </span>
            )}
            {activity.city && (
              <span className="itin-chip">
                <MapPin size={11} color="#2B96A8" /> {activity.city}
              </span>
            )}
            {activity.max_people && (
              <span className="itin-chip">
                <Users size={11} /> Max {activity.max_people} pers.
              </span>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <p className="itin-act-desc">{activity.description}</p>
          )}

          {/* Tags */}
          {(languages.length > 0 || inclusions.length > 0) && (
            <div className="itin-tags">
              {languages.slice(0, 3).map((l, i) => (
                <span key={i} className="itin-tag itin-tag-lang">
                  <Globe size={10} /> {l}
                </span>
              ))}
              {inclusions.slice(0, 3).map((inc, i) => (
                <span key={i} className="itin-tag itin-tag-inc">
                  <BadgeCheck size={10} /> {inc}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="itin-act-footer">
            <div className="itin-rating">
              {activity.rating ? (
                <>
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <span>{activity.rating}</span>
                  {activity.reviews_count && (
                    <span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: 12 }}>
                      ({activity.reviews_count} avis)
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: "#D1D5DB", fontSize: 12 }}>Pas encore noté</span>
              )}
            </div>
            <button className="itin-change-btn" onClick={onEdit}>
              <RefreshCw size={11} /> Changer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AlternativePicker ─── */
function AlternativePicker({ alternatives, currentName, onPick, onClose }: {
  alternatives: { id: string; title: string; city: string; price_per_person?: number;
    duration_hours?: number; photos?: string[]; rating?: number }[];
  currentName: string;
  onPick: (alt: Activity) => void;
  onClose: () => void;
}) {
  return (
    <div className="itin-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="itin-alt-box">
        <div className="itin-alt-header">
          <div>
            <div className="itin-alt-title">Choisir une alternative</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>
              Remplace « {currentName} »
            </div>
          </div>
          <button className="itin-close-btn" onClick={onClose}>
            <X size={16} color="#6B7280" />
          </button>
        </div>
        {alternatives.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF" }}>
            <Camera size={32} strokeWidth={1.5} style={{ marginBottom: 12, opacity: .4 }} />
            <p>Aucune alternative disponible dans cette ville</p>
          </div>
        ) : (
          <div className="itin-alt-list">
            {alternatives.map(exc => (
              <div key={exc.id} className="itin-alt-item"
                onClick={() => onPick({
                  id: exc.id, name: exc.title, city: exc.city,
                  price: exc.price_per_person || 0,
                  duration: exc.duration_hours ? `${exc.duration_hours}h` : "2h",
                  photos: exc.photos, rating: exc.rating,
                })}>
                <div className="itin-alt-thumb">
                  {exc.photos?.[0]
                    ? <img src={exc.photos[0]} alt={exc.title} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Camera size={20} color="#D1D5DB" />
                      </div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div className="itin-alt-name">{exc.title}</div>
                  <div className="itin-alt-meta">
                    {exc.price_per_person && <span>{exc.price_per_person} EUR</span>}
                    {exc.duration_hours && <span>{exc.duration_hours}h</span>}
                    {exc.rating && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={10} fill="#F59E0B" color="#F59E0B" /> {exc.rating}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight size={16} color="#2B96A8" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */

export default function ItineraireDisplay({
  itinerary, selectedCities, excursions, totalPrice,
  saving, saveStatus, onBack, onReset, onCheckout, onSave, onChangeActivity,
}: ItineraireDisplayProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [editing, setEditing] = useState<{ dayIdx: number; actIdx: number } | null>(null);

  const currentDay = itinerary.days[activeDay];
  const totalActivities = itinerary.days.reduce((s, d) => s + d.activities.length, 0);

  const getAlternatives = () => {
    if (!editing) return [];
    const day = itinerary.days[editing.dayIdx];
    const cur = day.activities[editing.actIdx];
    return excursions
      .filter(e => e.city === day.city && e.id !== cur.id)
      .slice(0, 8);
  };

  return (
    <div className="itin-root">
      <style>{STYLE}</style>

      {/* Header */}
      <div className="itin-header">
        <div>
          <div className="itin-badge"><Sparkles size={11} /> Itinéraire généré</div>
          <h1 className="itin-title">{itinerary.title}</h1>
          <div className="itin-meta">
            <span><Calendar size={13} color={TEAL} /> {itinerary.days.length} jours</span>
            <span>·</span>
            <span><Navigation size={13} color={TEAL} /> {selectedCities.join(" → ")}</span>
            <span>·</span>
            <span><CheckCircle size={13} color={TEAL} /> {totalActivities} activités</span>
          </div>
        </div>
        <div className="itin-header-actions">
          <button className="itin-btn-ghost" onClick={onReset}>
            <RotateCcw size={14} /> Recommencer
          </button>
          <button className="itin-btn-ghost" onClick={onBack}>
            <ChevronLeft size={14} /> Modifier
          </button>
          <button className="itin-btn-ghost" onClick={onSave} disabled={saving}>
            <Save size={14} />
            {saving ? "..." : saveStatus === "ok" ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="itin-tabs">
        {itinerary.days.map((day, idx) => (
          <button key={idx}
            className={`itin-tab ${activeDay === idx ? "active" : ""}`}
            onClick={() => { setActiveDay(idx); setEditing(null); }}>
            <span className="itin-tab-day">Jour {day.day}</span>
            <span className="itin-tab-city">{day.city}</span>
            <div className="itin-tab-dot" />
          </button>
        ))}
      </div>

      {/* Day header */}
      <div className="itin-day-header">
        <div className="itin-day-emoji">{currentDay.emoji || "🗺️"}</div>
        <div>
          <h2 className="itin-day-title">
            Jour {currentDay.day} — {currentDay.city}
          </h2>
          {currentDay.theme && (
            <p className="itin-day-theme">{currentDay.theme}</p>
          )}
        </div>
        <div className="itin-day-count">
          <CheckCircle size={13} />
          {currentDay.activities.length} activité{currentDay.activities.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Activities */}
      <div className="itin-acts">
        {currentDay.activities.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "white", borderRadius: 20, border: "1px dashed #E5E7EB",
          }}>
            <Camera size={40} strokeWidth={1.5} color="#D1D5DB" style={{ marginBottom: 12 }} />
            <p style={{ color: "#9CA3AF", fontSize: 15 }}>Aucune activité pour cette journée</p>
          </div>
        ) : (
          currentDay.activities.map((act, actIdx) => (
            <ActivityCard
              key={act.id || actIdx}
              activity={act}
              actIdx={actIdx}
              onEdit={() => setEditing({ dayIdx: activeDay, actIdx })}
            />
          ))
        )}

        {/* Nav jours */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
          <button
            className="itin-btn-ghost"
            disabled={activeDay === 0}
            onClick={() => setActiveDay(p => p - 1)}
            style={{ opacity: activeDay === 0 ? .4 : 1 }}>
            <ChevronLeft size={15} /> Jour précédent
          </button>
          <button
            className="itin-btn-ghost"
            disabled={activeDay === itinerary.days.length - 1}
            onClick={() => setActiveDay(p => p + 1)}
            style={{ opacity: activeDay === itinerary.days.length - 1 ? .4 : 1 }}>
            Jour suivant <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Total bar */}
      <div className="itin-total-bar">
        <div>
          <div className="itin-total-label">Total estimé</div>
          <div className="itin-total-amount">
            {totalPrice} <span>EUR</span>
          </div>
        </div>
        <div className="itin-total-actions">
          {saveStatus === "login" && (
            <span className="itin-save-login" style={{ fontSize: 13, fontWeight: 600 }}>
              Connectez-vous pour sauvegarder
            </span>
          )}
          <button className="itin-btn-primary" onClick={onCheckout}>
            <Heart size={14} /> Réserver l'itinéraire
          </button>
        </div>
      </div>

      {/* Alternative picker */}
      {editing && (
        <AlternativePicker
          alternatives={getAlternatives()}
          currentName={itinerary.days[editing.dayIdx].activities[editing.actIdx].name}
          onPick={(alt) => {
            onChangeActivity(editing.dayIdx, editing.actIdx, alt);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}