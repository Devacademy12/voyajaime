"use client";

import React, { useState } from "react";
import {
  MapPin, Clock, Globe, Gift, RefreshCw, ChevronLeft,
  ChevronRight, CheckCircle, RotateCcw, Loader2,
  ImageOff, Star, Users, Calendar, DollarSign, Camera,
  Languages, Package, Heart, X,
} from "lucide-react";
import styles from "@/public/style/ModeAssiste.module.css";

/* ─── Types ─── */
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
  reviews_count?: number;
  max_people?: number;
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

function formatPrice(price?: number): string {
  if (!price) return "Gratuit";
  return `${price} TND`;
}

/* ─── Photo Gallery Component ─── */
function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className={styles.photoPlaceholder}>
        <Camera size={32} />
        <span>Aucune photo</span>
      </div>
    );
  }

  const next = () => setCurrentIndex((currentIndex + 1) % photos.length);
  const prev = () => setCurrentIndex((currentIndex - 1 + photos.length) % photos.length);

  return (
    <div className={styles.photoGallery}>
      <img src={photos[currentIndex]} alt={`${title} - ${currentIndex + 1}`} />
      {photos.length > 1 && (
        <>
          <button className={styles.galleryNavPrev} onClick={prev}>
            <ChevronLeft size={20} />
          </button>
          <button className={styles.galleryNavNext} onClick={next}>
            <ChevronRight size={20} />
          </button>
          <div className={styles.galleryDots}>
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={`${styles.galleryDot} ${idx === currentIndex ? styles.galleryDotActive : ""}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Activity Card Component ─── */
function ActivityCard({ activity, onEdit }: { activity: Activity; onEdit: () => void }) {
  const photos = parsePhotos(activity.photos);
  const languages = parseList(activity.languages);
  const inclusions = parseList(activity.inclusion);
  const price = activity.price || 0;

  return (
    <div className={styles.actCard}>
      <PhotoGallery photos={photos} title={activity.name} />
      
      <div className={styles.actInfo}>
        <div className={styles.actTop}>
          <h4 className={styles.actName}>{activity.name}</h4>
          <span className={`${styles.priceBadge} ${price === 0 ? styles.priceBadgeFree : ""}`}>
            <DollarSign size={12} />
            {formatPrice(price)}
          </span>
        </div>

        <div className={styles.actMeta}>
          {activity.time && (
            <span>
              <Clock size={12} />
              {activity.time}
            </span>
          )}
          {activity.duration && (
            <span>
              <Calendar size={12} />
              {activity.duration}
            </span>
          )}
          {activity.city && (
            <span>
              <MapPin size={12} />
              {activity.city}
            </span>
          )}
          {activity.rating && (
            <span>
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              {activity.rating}
              {activity.reviews_count && <span>({activity.reviews_count})</span>}
            </span>
          )}
          {activity.max_people && (
            <span>
              <Users size={12} />
              Max {activity.max_people}
            </span>
          )}
        </div>

        {activity.description && (
          <p className={styles.actDesc}>{activity.description}</p>
        )}

        {languages.length > 0 && (
          <div className={styles.actLanguages}>
            <Languages size={12} />
            <span>{languages.join(" • ")}</span>
          </div>
        )}

        {inclusions.length > 0 && (
          <div className={styles.actInclusions}>
            <Package size={12} />
            <div className={styles.inclusionList}>
              {inclusions.slice(0, 3).map((inc, i) => (
                <span key={i} className={styles.inclusionTag}>{inc}</span>
              ))}
              {inclusions.length > 3 && <span>+{inclusions.length - 3}</span>}
            </div>
          </div>
        )}

        <button className={styles.changeBtn} onClick={onEdit}>
          <RefreshCw size={12} />
          Changer cette activité
        </button>
      </div>
    </div>
  );
}

/* ─── Alternative Picker Component ─── */
function AlternativePicker({
  alternatives,
  currentName,
  onPick,
  onClose,
}: {
  alternatives: Activity[];
  currentName: string;
  onPick: (alt: Activity) => void;
  onClose: () => void;
}) {
  if (!alternatives.length) {
    return (
      <div className={styles.altPanel}>
        <div className={styles.altHeader}>
          <h5 className={styles.altTitle}>Aucune alternative</h5>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#6B7280", textAlign: "center", padding: 12 }}>
          Aucune autre activité disponible dans cette ville.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.altPanel}>
      <div className={styles.altHeader}>
        <h5 className={styles.altTitle}>Remplacer "{currentName}"</h5>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      
      <div className={styles.altList}>
        {alternatives.map((alt, idx) => {
          const photos = parsePhotos(alt.photos);
          const price = alt.price || 0;
          
          return (
            <div
              key={idx}
              className={styles.altCard}
              onClick={() => onPick(alt)}
            >
              {photos[0] && (
                <img src={photos[0]} alt={alt.name} className={styles.altThumb} />
              )}
              <div className={styles.altInfo}>
                <div className={styles.altTop}>
                  <span className={styles.altName}>{alt.name}</span>
                  <span className={`${styles.altPrice} ${price === 0 ? styles.altPriceFree : ""}`}>
                    {formatPrice(price)}
                  </span>
                </div>
                <div className={styles.altMeta}>
                  {alt.duration && <span>⏱️ {alt.duration}</span>}
                  {alt.city && <span>📍 {alt.city}</span>}
                </div>
                {alt.description && (
                  <div className={styles.altDesc}>{alt.description}</div>
                )}
              </div>
              <Heart size={16} className={styles.altSelect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════ MAIN COMPONENT ════════ */
export default function ItineraireDisplay({
  itinerary,
  selectedCities,
  excursions,
  totalPrice,
  saving,
  saveStatus,
  onBack,
  onReset,
  onCheckout,
  onSave,
  onChangeActivity,
}: ItineraireDisplayProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [editing, setEditing] = useState<{ dayIdx: number; actIdx: number } | null>(null);

  const currentDay = itinerary.days[activeDay];

  // Générer des alternatives pour l'activité en cours d'édition
  const getAlternatives = (): Activity[] => {
    if (!editing) return [];
    
    const day = itinerary.days[editing.dayIdx];
    const currentAct = day.activities[editing.actIdx];
    const city = day.city;
    
    // Filtrer les excursions de la même ville
    return excursions
      .filter(exc => exc.city === city && exc.id !== currentAct.id)
      .slice(0, 5)
      .map(exc => ({
        id: exc.id,
        name: exc.title,
        description: exc.description,
        duration: exc.duration_hours ? `${exc.duration_hours}h` : "2h",
        price: exc.price_per_person || 0,
        photos: exc.photos,
        languages: exc.languages,
        inclusion: exc.inclusions,
        city: exc.city,
        rating: exc.rating,
        time: currentAct.time,
      }));
  };

  const handleSelectAlternative = (alt: Activity) => {
    if (editing) {
      onChangeActivity(editing.dayIdx, editing.actIdx, alt);
      setEditing(null);
    }
  };

  const totalActivities = itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);

  return (
    <div className={styles.itiRoot}>
      {/* Header */}
      <div className={styles.itiHeader}>
        <div>
          <h2 className={styles.itiTitle}>{itinerary.title}</h2>
          <p className={styles.itiMeta}>
            <span>
              <Calendar size={12} style={{ display: "inline", marginRight: 4 }} />
              {itinerary.days.length} jours
            </span>
            <span>
              <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
              {selectedCities.join(" → ")}
            </span>
            <span>
              <CheckCircle size={12} style={{ display: "inline", marginRight: 4 }} />
              {totalActivities} activités
            </span>
          </p>
        </div>
        <button className={styles.btnSecondary} onClick={onBack}>
          <RefreshCw size={14} />
          Modifier
        </button>
      </div>

      {/* Day Navigation Tabs */}
      <div className={styles.dayTabs}>
        {itinerary.days.map((day, idx) => (
          <button
            key={idx}
            className={`${styles.dayTab} ${activeDay === idx ? styles.dayTabOn : ""}`}
            onClick={() => {
              setActiveDay(idx);
              setEditing(null);
            }}
          >
            <span>Jour {day.day}</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{day.city}</span>
          </button>
        ))}
      </div>

      {/* Current Day Banner */}
      <div className={styles.dayBanner}>
        <div className={styles.dayBannerEmoji}>
          {currentDay.emoji || "📍"}
        </div>
        <div>
          <h3 className={styles.dayBannerName}>
            Jour {currentDay.day} : {currentDay.city}
          </h3>
          {currentDay.theme && (
            <p className={styles.dayBannerTheme}>{currentDay.theme}</p>
          )}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}>
          <Users size={14} style={{ display: "inline", marginRight: 4 }} />
          {currentDay.activities.length} activité{currentDay.activities.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Activities List */}
      <div className={styles.itiBody}>
        {currentDay.activities.map((activity, actIdx) => (
          <div key={activity.id || actIdx}>
            {editing?.dayIdx === activeDay && editing?.actIdx === actIdx ? (
              <AlternativePicker
                alternatives={getAlternatives()}
                currentName={activity.name}
                onPick={handleSelectAlternative}
                onClose={() => setEditing(null)}
              />
            ) : (
              <ActivityCard
                activity={activity}
                onEdit={() => setEditing({ dayIdx: activeDay, actIdx: actIdx })}
              />
            )}
          </div>
        ))}
      </div>

      {/* Day Navigation Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 24px 16px 24px", gap: 12 }}>
        <button
          className={styles.btnSecondary}
          onClick={() => activeDay > 0 && setActiveDay(activeDay - 1)}
          disabled={activeDay === 0}
          style={{ opacity: activeDay === 0 ? 0.5 : 1, cursor: activeDay === 0 ? "not-allowed" : "pointer" }}
        >
          <ChevronLeft size={14} />
          Jour précédent
        </button>
        
        {activeDay < itinerary.days.length - 1 ? (
          <button
            className={styles.btnPrimary}
            onClick={() => setActiveDay(activeDay + 1)}
            style={{ padding: "8px 24px" }}
          >
            Jour suivant
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={onCheckout}
            style={{ padding: "8px 24px", background: "#10B981" }}
          >
            Finaliser la réservation
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Footer Recap */}
      <div className={styles.recap}>
        <div className={styles.recapPrice}>
          <span className={styles.recapPriceLabel}>Total estimé</span>
          <div>
            <span className={styles.recapPriceValue}>{totalPrice}</span>
            <span className={styles.recapPriceSuffix}>TND</span>
          </div>
          <small style={{ fontSize: 9, color: "#9CA3AF" }}>
            *Prix par personne, hors options
          </small>
        </div>

        <div className={styles.recapActions}>
          <button className={styles.resetLink} onClick={onReset}>
            <RotateCcw size={12} />
            Nouvel itinéraire
          </button>

          <button className={styles.saveBtn} onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={14} className={styles.spin} />
                Sauvegarde...
              </>
            ) : saveStatus === "ok" ? (
              <>
                <CheckCircle size={14} />
                Sauvegardé
              </>
            ) : (
              <>
                <Heart size={14} />
                Sauvegarder
              </>
            )}
          </button>
        </div>

        {/* Save Status Feedback */}
        {saveStatus !== "idle" && (
          <div className={`${styles.saveFeedback} ${
            saveStatus === "ok" ? styles.saveFeedbackOk :
            saveStatus === "error" ? styles.saveFeedbackErr :
            styles.saveFeedbackLogin
          }`}>
            {saveStatus === "ok" && <CheckCircle size={14} />}
            {saveStatus === "ok" && "Itinéraire sauvegardé avec succès !"}
            {saveStatus === "error" && "Erreur lors de la sauvegarde. Veuillez réessayer."}
            {saveStatus === "login" && "Connectez-vous pour sauvegarder votre itinéraire."}
          </div>
        )}
      </div>
    </div>
  );
}