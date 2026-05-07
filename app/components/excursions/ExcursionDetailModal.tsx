"use client";

import React, { useState } from "react";
import {
  X, Star, MapPin, Clock, Sunrise, Users, BookOpen, Layers,
  Languages, CheckCircle2, Check, AlertTriangle, Package,
  Ticket, Plus, Camera, Mountain, TreePine, Umbrella,
  Building2, Utensils, Bike, Heart, AlertCircle
} from "lucide-react";

type ExcursionDetail = {
  id: string;
  title: string;
  city: string;
  region: string | null;
  description: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  categories: string[];
  languages: string[];
  inclusions: string[];
  photos: string[];
  rating: number;
  reviews_count: number;
  meeting_point: string | null;
  difficulty: string | null;
  min_age: number | null;
  what_to_bring: string | null;
  not_included: string | null;
  important_info: string | null;
  cancel_policy: string | null;
  available_dates?: Array<{ date: string; departure_time?: string; departure_times?: string[]; time?: string; slots?: number }> | null;
  depart_time: string | null;
};

interface ExcursionDetailModalProps {
  excursion: ExcursionDetail | null;
  onClose: () => void;
  onAdd?: () => void;
}

const getDifficultyIcon = (difficulty: string | null) => {
  switch (difficulty?.toLowerCase()) {
    case 'facile': return <TreePine size={14} />;
    case 'moyen': return <Mountain size={14} />;
    case 'difficile': return <AlertTriangle size={14} />;
    default: return <MapPin size={14} />;
  }
};

const getDifficultyColor = (difficulty: string | null) => {
  switch (difficulty?.toLowerCase()) {
    case 'facile': return '#10B981';
    case 'moyen': return '#F59E0B';
    case 'difficile': return '#EF4444';
    default: return '#6B7280';
  }
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Aventure': <Mountain size={14} />,
    'Nature': <TreePine size={14} />,
    'Plage': <Umbrella size={14} />,
    'Culture': <Building2 size={14} />,
    'Gastronomie': <Utensils size={14} />,
    'Sport': <Bike size={14} />,
    'Bien-être': <Heart size={14} />,
    'Découverte': <Camera size={14} />,
  };
  return icons[category] || <MapPin size={14} />;
};

export function ExcursionDetailModal({ excursion, onClose, onAdd }: ExcursionDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  
  if (!excursion) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="excursion-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header avec images */}
        <div className="detail-header">
          {excursion.photos && excursion.photos.length > 0 ? (
            <div className="detail-image-slider">
              <img 
                src={excursion.photos[selectedImage]} 
                alt={excursion.title} 
                className="detail-main-image" 
              />
              {excursion.photos.length > 1 && (
                <div className="detail-thumbnails">
                  {excursion.photos.map((photo, idx) => (
                    <img 
                      key={idx} 
                      src={photo} 
                      alt="" 
                      className={`detail-thumbnail ${selectedImage === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImage(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="detail-no-image">
              <Camera size={48} color="#9CA3AF" />
            </div>
          )}
          
          <button className="detail-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body avec infos */}
        <div className="detail-body">
          <div className="detail-title-section">
            <h2 className="detail-title">{excursion.title}</h2>
            <div className="detail-rating">
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <span>{excursion.rating}</span>
              <span className="detail-reviews">({excursion.reviews_count} avis)</span>
            </div>
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <MapPin size={14} color="#6B7280" />
              <span>{excursion.city}{excursion.region ? `, ${excursion.region}` : ''}</span>
            </div>
            <div className="detail-meta-item">
              <Clock size={14} color="#6B7280" />
              <span>{excursion.duration_hours} heures</span>
            </div>
            {(() => {
              const timesSet = new Set<string>();
              if (excursion.available_dates && Array.isArray(excursion.available_dates)) {
                excursion.available_dates.forEach((d: any) => {
                  if (d.departure_times && Array.isArray(d.departure_times)) {
                    d.departure_times.forEach((t: string) => { if (t) timesSet.add(t.slice(0, 5)); });
                  } else {
                    const t = d.departure_time || d.time;
                    if (t) timesSet.add(t.slice(0, 5));
                  }
                });
              }
              if (timesSet.size === 0 && excursion.depart_time) timesSet.add(excursion.depart_time.slice(0, 5));
              const times = Array.from(timesSet).sort();
              if (times.length === 0) return null;
              return (
                <div className="detail-meta-item">
                  <Sunrise size={14} color="#6B7280" />
                  {times.length === 1
                    ? <span>Départ à {times[0]}</span>
                    : <span>Départs : {times.join(" · ")}</span>
                  }
                </div>
              );
            })()}
            {excursion.difficulty && (
              <div className="detail-meta-item">
                {getDifficultyIcon(excursion.difficulty)}
                <span style={{ color: getDifficultyColor(excursion.difficulty) }}>
                  {excursion.difficulty}
                </span>
              </div>
            )}
            {excursion.min_age && (
              <div className="detail-meta-item">
                <Users size={14} color="#6B7280" />
                <span>Âge minimum: {excursion.min_age} ans</span>
              </div>
            )}
            <div className="detail-meta-item">
              <Users size={14} color="#6B7280" />
              <span>Max {excursion.max_people} personnes</span>
            </div>
          </div>

          <div className="detail-price-section">
            <span className="detail-price">{excursion.price_per_person} EUR</span>
            <span className="detail-price-unit">/ personne</span>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">
              <BookOpen size={16} /> Description
            </h4>
            <p className="detail-description">{excursion.description}</p>
          </div>

          {excursion.categories && excursion.categories.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Layers size={16} /> Catégories
              </h4>
              <div className="detail-tags">
                {excursion.categories.map((cat, idx) => (
                  <span key={idx} className="detail-tag">
                    {getCategoryIcon(cat)} {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {excursion.languages && excursion.languages.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Languages size={16} /> Langues
              </h4>
              <div className="detail-tags">
                {excursion.languages.map((lang, idx) => (
                  <span key={idx} className="detail-tag-lang">{lang}</span>
                ))}
              </div>
            </div>
          )}

          {excursion.inclusions && excursion.inclusions.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <CheckCircle2 size={16} color="#10B981" /> Inclus
              </h4>
              <ul className="detail-list">
                {excursion.inclusions.map((item, idx) => (
                  <li key={idx}>
                    <Check size={12} color="#10B981" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {excursion.not_included && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <X size={16} color="#EF4444" /> Non inclus
              </h4>
              <p className="detail-text">{excursion.not_included}</p>
            </div>
          )}

          {excursion.meeting_point && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <MapPin size={16} /> Point de rendez-vous
              </h4>
              <p className="detail-text">{excursion.meeting_point}</p>
            </div>
          )}

          {excursion.what_to_bring && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Package size={16} /> À apporter
              </h4>
              <p className="detail-text">{excursion.what_to_bring}</p>
            </div>
          )}

          {excursion.important_info && (
            <div className="detail-section detail-important">
              <h4 className="detail-section-title">
                <AlertTriangle size={16} /> Informations importantes
              </h4>
              <p className="detail-text">{excursion.important_info}</p>
            </div>
          )}

          {excursion.cancel_policy && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Ticket size={16} /> Politique d'annulation
              </h4>
              <p className="detail-text">{excursion.cancel_policy}</p>
            </div>
          )}
        </div>

        <div className="detail-footer">
          <button className="detail-close-footer" onClick={onClose}>
            Fermer
          </button>
          <button className="detail-add-btn" onClick={onAdd}>
            <Plus size={14} /> Ajouter à mon itinéraire
          </button>
        </div>
      </div>
    </div>
  );
}