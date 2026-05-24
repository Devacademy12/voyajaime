"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabaseClient";
import {
  MapPin, Clock, Users, Star, Camera, Pencil, Trash2,
  PauseCircle, PlayCircle, CheckCircle2, FileText,
  Loader2, Mountain, AlertTriangle, Plus,
} from "lucide-react";

interface Excursion {
  id: string; title: string; city: string; duration_hours: number;
  price_per_person: number; max_people: number; rating: number;
  reviews_count: number; is_active: boolean;
  photos: string[]; categories: string[];
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

export default function ExcursionsListClient({
  excursions: initial, prestataireId,
}: {
  excursions: Excursion[];
  prestataireId: string;
}) {
  const supabase = createClient();
  const [excursions, setExcursions] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(id);
    const { error } = await supabase.from("excursions")
      .update({ is_active: !current }).eq("id", id).eq("prestataire_id", prestataireId);
    if (!error) {
      setExcursions(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
      showToast(!current ? "Excursion publiée !" : "Mise en brouillon");
    } else {
      showToast("Erreur lors de la mise à jour", false);
    }
    setLoading(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setLoading(id);
    const { error } = await supabase.from("excursions").delete()
      .eq("id", id).eq("prestataire_id", prestataireId);
    if (!error) {
      setExcursions(prev => prev.filter(e => e.id !== id));
      showToast("Excursion supprimée");
    } else {
      showToast("Erreur lors de la suppression", false);
    }
    setLoading(null);
  };

  const filtered = excursions.filter(e =>
    filter === "active" ? e.is_active : filter === "draft" ? !e.is_active : true
  );

  /* ── Empty state ── */
  if (!excursions.length) return (
    <div style={{
      textAlign: "center", padding: "60px 20px",
      background: "white", borderRadius: 18,
      border: "1.5px solid #E2E8F0",
    }}>
      <Mountain size={48} style={{ color: "#CBD5E1", margin: "0 auto 16px" }} />
      <p style={{ fontSize: 15, fontWeight: 800, color: "#053366", marginBottom: 6 }}>
        Aucune excursion
      </p>
      <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>
        Créez votre première excursion pour recevoir des réservations
      </p>
      <a href="/prestataire/excursions/nouveau" style={{
        padding: "10px 22px",
        background: "linear-gradient(135deg, #053366, #2B96A8)",
        color: "white", borderRadius: 12, textDecoration: "none",
        fontSize: 13, fontWeight: 700,
        display: "inline-flex", alignItems: "center", gap: 7,
        boxShadow: "0 4px 14px rgba(5,51,102,0.25)",
      }}>
        <Plus size={15} /> Créer une excursion
      </a>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes tin  {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .exc-card {
          background: white;
          border-radius: 18px;
          border: 1.5px solid #E2E8F0;
          overflow: hidden;
          transition: box-shadow .2s, transform .2s;
          position: relative;
          animation: fadeUp .35s ease both;
        }
        .exc-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(5,51,102,.09);
        }
        .exc-card-img {
          width: 100%; height: 200px; object-fit: cover;
          display: block; transition: transform .4s;
        }
        .exc-card:hover .exc-card-img { transform: scale(1.05); }

        /* Filtres — même style que pw-tab */
        .ftab {
          padding: 9px 18px; border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          cursor: pointer; font-size: 13px; font-weight: 600;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transition: all .18s; display: inline-flex;
          align-items: center; gap: 6px; white-space: nowrap;
          background: white; color: #94A3B8;
        }
        .ftab.on {
          background: #053366; color: white;
          border-color: transparent;
          box-shadow: 0 4px 14px rgba(5,51,102,.22);
        }
        .ftab:not(.on):hover { color: #053366; background: #F0F4F8; }

        /* Boutons actions */
        .exc-btn {
          padding: 8px 12px; border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          cursor: pointer; font-size: 13px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transition: all .18s; background: white;
          white-space: nowrap; display: flex;
          align-items: center; gap: 5px;
        }
        .exc-btn:disabled { opacity: .5; cursor: not-allowed; }
        .exc-btn:not(:disabled):hover {
          box-shadow: 0 2px 8px rgba(5,51,102,.1);
        }

        /* Toast */
        .exc-toast {
          position: fixed; top: 24px; right: 24px; z-index: 9999;
          padding: 12px 18px; border-radius: 12px;
          font-size: 13px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          box-shadow: 0 8px 24px rgba(5,51,102,.12);
          animation: tin .3s ease;
          display: flex; align-items: center; gap: 8px;
          border: 1.5px solid;
        }

        @media (max-width: 767px) {
          .exc-filters { flex-wrap: wrap !important; gap: 6px !important; }
          .ftab { font-size: 12px !important; padding: 7px 12px !important; }
          .exc-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .exc-card-img { height: 160px !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="exc-toast" style={{
          background: toast.ok ? "#EFF9FB" : "#FEF2F2",
          color:      toast.ok ? "#053366"  : "#B91C1C",
          borderColor: toast.ok ? "rgba(43,150,168,.25)" : "#FECACA",
        }}>
          {toast.ok
            ? <CheckCircle2 size={14} color="#2B96A8" />
            : <AlertTriangle size={14} color="#B91C1C" />}
          {toast.msg}
        </div>
      )}

      {/* Filtres */}
      <div className="exc-filters" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([
          { k: "all"    as const, label: `Toutes (${excursions.length})`,                            icon: null },
          { k: "active" as const, label: `Publiées (${excursions.filter(e => e.is_active).length})`, icon: <CheckCircle2 size={13} /> },
          { k: "draft"  as const, label: `Brouillons (${excursions.filter(e => !e.is_active).length})`, icon: <FileText size={13} /> },
        ]).map(t => (
          <button key={t.k} className={`ftab ${filter === t.k ? "on" : ""}`}
            onClick={() => setFilter(t.k)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Grille */}
      <div className="exc-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 18,
      }}>
        {filtered.map(exc => (
          <div key={exc.id} className="exc-card"
            onClick={e => {
              if ((e.target as HTMLElement).closest("button,a")) return;
              window.location.href = `/prestataire/excursions/${exc.id}`;
            }}
            style={{ cursor: "pointer" }}>

            {/* Image */}
            <div style={{ overflow: "hidden", position: "relative", height: 200, background: "#EFF9FB" }}>
              <img
                src={exc.photos?.find(Boolean) || FALLBACK}
                alt={exc.title}
                className="exc-card-img"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />

              {/* Badge statut */}
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 20,
                  fontSize: 11, fontWeight: 800,
                  backdropFilter: "blur(8px)", color: "white",
                  background: exc.is_active
                    ? "rgba(5,51,102,.82)"
                    : "rgba(148,163,184,.82)",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: exc.is_active ? "#2B96A8" : "rgba(255,255,255,.6)",
                    display: "inline-block",
                  }} />
                  {exc.is_active ? "Publié" : "Brouillon"}
                </span>
              </div>

              {/* Catégorie */}
              {exc.categories?.[0] && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  padding: "3px 10px",
                  background: "rgba(5,51,102,.62)",
                  backdropFilter: "blur(6px)",
                  borderRadius: 20, fontSize: 11,
                  color: "white", fontWeight: 600,
                }}>
                  {exc.categories[0]}
                </div>
              )}

              {/* Prix */}
              <div style={{
                position: "absolute", bottom: 10, right: 12,
                padding: "5px 12px",
                background: "rgba(5,51,102,.75)",
                backdropFilter: "blur(8px)",
                borderRadius: 20, fontSize: 14,
                fontWeight: 800, color: "white",
              }}>
                {exc.price_per_person} DT
              </div>

              {/* Nb photos */}
              {(exc.photos?.filter(Boolean).length || 0) > 1 && (
                <div style={{
                  position: "absolute", bottom: 10, left: 12,
                  padding: "3px 8px",
                  background: "rgba(43,150,168,.65)",
                  backdropFilter: "blur(6px)",
                  borderRadius: 12, fontSize: 11,
                  color: "white",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Camera size={11} /> {exc.photos.filter(Boolean).length}
                </div>
              )}
            </div>

            {/* Contenu */}
            <div style={{ padding: "16px 18px" }}>
              <h3 style={{
                fontSize: 15, fontWeight: 800,
                color: "#053366", marginBottom: 6, lineHeight: 1.3,
              }}>
                {exc.title}
              </h3>

              <div style={{
                display: "flex", gap: 12, fontSize: 12,
                color: "#94A3B8", marginBottom: 14,
                paddingBottom: 14,
                borderBottom: "1.5px solid #F1F5F9",
                flexWrap: "wrap",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={12} color="#2B96A8" /> {exc.city}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={12} color="#2B96A8" /> {exc.duration_hours}h
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Users size={12} color="#2B96A8" /> max {exc.max_people}
                </span>
                {exc.rating > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
                    <span style={{ color: "#053366", fontWeight: 700 }}>{exc.rating}</span>
                    <span style={{ color: "#CBD5E1" }}>({exc.reviews_count})</span>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                {/* Publier / Dépublier */}
                <button className="exc-btn" disabled={loading === exc.id}
                  onClick={() => toggleActive(exc.id, exc.is_active)}
                  style={{
                    flex: 1, justifyContent: "center",
                    color:       exc.is_active ? "#053366"  : "#059669",
                    background:  exc.is_active ? "#F0F4F8"  : "#ECFDF5",
                    borderColor: exc.is_active ? "#E2E8F0"  : "#A7F3D0",
                  }}>
                  {loading === exc.id
                    ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />
                    : exc.is_active
                    ? <><PauseCircle size={14} /> Dépublier</>
                    : <><PlayCircle  size={14} /> Publier</>
                  }
                </button>

                {/* Éditer */}
                <a href={`/prestataire/excursions/${exc.id}/edit`} style={{
                  padding: "8px 12px",
                  background: "#EFF9FB", color: "#2B96A8",
                  borderRadius: 10, textDecoration: "none",
                  display: "flex", alignItems: "center",
                  border: "1.5px solid rgba(43,150,168,.25)",
                  transition: "all .18s",
                }}>
                  <Pencil size={14} />
                </a>

                {/* Supprimer */}
                <button className="exc-btn" disabled={loading === exc.id}
                  onClick={() => handleDelete(exc.id, exc.title)}
                  style={{
                    padding: "8px 12px",
                    color: "#B91C1C",
                    borderColor: "#FECACA",
                    background: "#FEF2F2",
                  }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}