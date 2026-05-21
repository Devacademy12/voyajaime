"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import Link from "next/link";
import {
  Heart, Star, Clock, MapPin, ArrowRight,
  SlidersHorizontal, Loader, Compass, Eye,
  CalendarDays, Trash2, Share2, X,
} from "lucide-react";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";

/* ── Types ─────────────────────────────────────────────────────── */
interface DateDispo {
  date: string;
  slots: number;
}

interface Excursion {
  id: string;
  title: string;
  city: string;
  price_per_person: number;
  duration_hours: number;
  rating: number;
  reviews_count: number;
  max_people: number;
  photos: string[];
  categories: string[];
  available_dates?: DateDispo[] | null;
}

interface Favori {
  id: string;
  excursion: Excursion | Excursion[] | null;
}

/* ── Helper ─────────────────────────────────────────────────────── */
function getExc(f: Favori): Excursion | null {
  if (!f.excursion) return null;
  if (Array.isArray(f.excursion)) return f.excursion[0] ?? null;
  return f.excursion;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80";

/* ── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
  @keyframes cardIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes heartPop{ 0%{transform:scale(1)} 40%{transform:scale(1.35)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  /* ── Card ── */
  .fav-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid #EBEBEB;
    box-shadow: 0 2px 14px rgba(5,51,102,0.06);
    transition: box-shadow 0.26s ease, transform 0.26s ease;
    animation: cardIn 0.38s ease both;
    display: flex;
    flex-direction: column;
  }
  .fav-card:hover {
    box-shadow: 0 14px 44px rgba(5,51,102,0.13);
    transform: translateY(-4px);
  }
  .fav-card:hover .card-img { transform: scale(1.05); }
  .card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
  }

  /* ── Heart button ── */
  .heart-btn {
    position: absolute; top: 12px; right: 12px;
    width: 36px; height: 36px; border-radius: 50%;
    background: white; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.18);
    transition: transform 0.18s, box-shadow 0.18s;
    z-index: 3;
  }
  .heart-btn:hover { transform: scale(1.12); box-shadow: 0 4px 16px rgba(244,63,94,0.28); }
  .heart-btn.removing { animation: heartPop 0.4s ease; }

  /* ── Category badge ── */
  .cat-badge {
    position: absolute; top: 12px; left: 12px;
    padding: 5px 12px;
    background: rgba(15,23,42,0.72);
    backdrop-filter: blur(8px);
    border-radius: 20px;
    font-size: 11px; font-weight: 700; color: white;
    letter-spacing: 0.3px;
    pointer-events: none; z-index: 3;
  }

  /* ── Reserve button ── */
  .reserve-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 10px 15px;
    background: linear-gradient(135deg, #02AFCF, #0891b2);
    color: white; border: none; border-radius: 12px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: inheritinherit; white-space: nowrap;
    transition: all 0.18s;
    box-shadow: 0 4px 14px rgba(2,175,207,0.32);
    flex-shrink: 0;
  }
  .reserve-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0891b2, #0369a1);
    box-shadow: 0 6px 20px rgba(2,175,207,0.45);
    transform: translateY(-1px);
  }
  .reserve-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Details link btn ── */
  .detail-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
    padding: 10px 14px;
    background: #F0F7FF; color: #053366;
    border-radius: 12px; text-decoration: none;
    font-size: 12px; font-weight: 600;
    border: 1px solid #DBEAFE;
    transition: all 0.18s; white-space: nowrap; flex-shrink: 0;
  }
  .detail-btn:hover { background: #DBEAFE; border-color: #93C5FD; }

  /* ── Sort select ── */
  .sort-select {
    padding: 9px 14px 9px 34px;
    border: 1.5px solid #E5E7EB; border-radius: 12px;
    font-size: 13px; font-family: inheritinherit; color: #374151;
    background: white; cursor: pointer; outline: none;
    appearance: none; transition: border 0.18s;
  }
  .sort-select:focus { border-color: #02AFCF; }

  /* ── Toast notification ── */
  .fav-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: #1E293B; color: white;
    padding: 12px 22px; border-radius: 30px;
    font-size: 13px; font-weight: 600;
    box-shadow: 0 8px 28px rgba(0,0,0,0.25);
    animation: slideUp 0.3s ease;
    z-index: 9999; white-space: nowrap;
    display: flex; align-items: center; gap: 8px;
  }

  /* ── Empty state CTA ── */
  .cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px;
    background: linear-gradient(135deg, #02AFCF, #053366);
    color: white; border-radius: 14px; text-decoration: none;
    font-size: 14px; font-weight: 700; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(2,175,207,0.3);
  }
  .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(2,175,207,0.4); }

  /* ── Responsive grid ── */

  /* Desktop: 3 colonnes max */
  .fav-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 20px;
  }

  /* Tablet */
  @media (max-width: 900px) {
    .fav-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .fav-toolbar { flex-direction: column; align-items: flex-start !important; gap: 10px !important; }
  }

  /* Mobile */
  @media (max-width: 560px) {
    .fav-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    /* Card horizontale sur mobile */
    .fav-card {
      flex-direction: row !important;
      border-radius: 16px !important;
      height: 130px;
    }
    .fav-card-photo {
      width: 120px !important;
      min-width: 120px !important;
      height: 100% !important;
    }
    .fav-card-body {
      padding: 12px 14px !important;
      flex: 1;
      min-width: 0;
    }

    /* Sur mobile card horizontale: on réorganise le body */
    .fav-card-title-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 2px !important;
      margin-bottom: 4px !important;
    }
    .fav-card-price-block {
      /* prix plus compact */
    }
    .fav-price-value { font-size: 15px !important; }
    .fav-price-label { display: none !important; }

    .fav-card-meta { margin-bottom: 6px !important; }
    .fav-card-footer {
      padding-top: 6px !important;
      margin-top: auto !important;
    }
    /* Cacher le bouton détails sur mobile pour gagner de la place */
    .detail-btn { display: none !important; }
    .reserve-btn { font-size: 12px !important; padding: 8px 14px !important; border-radius: 10px !important; }

    /* heart btn repositionné */
    .heart-btn { top: 8px !important; right: 8px !important; width: 30px !important; height: 30px !important; }
    .cat-badge { top: 8px !important; left: 8px !important; font-size: 10px !important; padding: 3px 8px !important; }

    /* Toolbar */
    .fav-toolbar { gap: 8px !important; }
    .sort-select { font-size: 12px !important; padding: 8px 12px 8px 30px !important; }
  }

  /* Très petit mobile */
  @media (max-width: 380px) {
    .fav-card { height: 115px; }
    .fav-card-photo { width: 100px !important; min-width: 100px !important; }
  }
`;

/* ═══════════════════════════════════════════════════════════════ */
export default function FavorisClient({
  favoris: init,
  userId,
}: {
  favoris: Favori[];
  userId: string;
}) {
  const supabase = createClient();
  const [favoris,      setFavoris]      = useState(init);
  const [removing,     setRemoving]     = useState<string | null>(null);
  const [sort,         setSort]         = useState<"default" | "price_asc" | "price_desc" | "rating">("default");
  const [modalExc,     setModalExc]     = useState<Excursion | null>(null);
  const [loadingDates, setLoadingDates] = useState<string | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);

  /* ── Toast helper ─────────────────────────────────────────── */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  /* ── Supprimer un favori ─────────────────────────────────── */
  const handleRemove = async (favId: string, title: string) => {
    setRemoving(favId);
    await supabase.from("favoris").delete().eq("id", favId).eq("touriste_id", userId);
    setFavoris((p) => p.filter((f) => f.id !== favId));
    setRemoving(null);
    showToast(`"${title}" retiré des favoris`);
  };

  /* ── Partager un favori ───────────────────────────────────── */
  const handleShare = async (exc: Excursion) => {
    const url = `${window.location.origin}/excursions/${exc.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: exc.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Lien copié dans le presse-papiers !");
      }
    } catch {
      // user cancelled share
    }
  };

  /* ── Ouvrir CheckoutModal ─────────────────────────────────── */
  const openCheckout = async (exc: Excursion) => {
    if (exc.available_dates !== undefined) { setModalExc(exc); return; }
    setLoadingDates(exc.id);
    const { data, error } = await supabase.from("excursions").select("available_dates").eq("id", exc.id).single();
    setLoadingDates(null);
    const enriched: Excursion = {
      ...exc,
      available_dates: (!error && data?.available_dates) ? data.available_dates : null,
    };
    setFavoris((prev) =>
      prev.map((f) => {
        const e = getExc(f);
        if (e?.id !== exc.id) return f;
        return { ...f, excursion: Array.isArray(f.excursion) ? [enriched] : enriched };
      })
    );
    setModalExc(enriched);
  };

  /* ── Tri ──────────────────────────────────────────────────── */
  const sorted = [...favoris].sort((a, b) => {
    const ea = getExc(a), eb = getExc(b);
    if (!ea || !eb) return 0;
    if (sort === "price_asc")  return ea.price_per_person - eb.price_per_person;
    if (sort === "price_desc") return eb.price_per_person - ea.price_per_person;
    if (sort === "rating")     return eb.rating - ea.rating;
    return 0;
  });

  /* ── Empty state ──────────────────────────────────────────── */
  if (!favoris.length)
    return (
      <>
        <style>{CSS}</style>
        <div style={{ textAlign: "center", padding: "72px 24px" }}>
          <div style={{ background: "linear-gradient(135deg,#FEF2F2,#FFF0F3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", width: 72, height: 72, borderRadius: "50%", boxShadow: "0 8px 24px rgba(244,63,94,0.15)" }}>
            <Heart size={36} color="#FDA4AF" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#053366", marginBottom: 8 }}>
            Aucun favori pour l&apos;instant
          </h3>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 28px" }}>
            Parcourez les excursions et cliquez sur l&apos;icône cœur pour sauvegarder vos préférées
          </p>
          <Link href="/excursions" className="cta-btn">
            <Compass size={16} /> Découvrir les excursions <ArrowRight size={16} />
          </Link>
        </div>
      </>
    );

  /* ── Rendu ────────────────────────────────────────────────── */
  return (
    <>
      <style>{CSS}</style>

      {/* ── Toolbar ── */}
      <div
        className="fav-toolbar"
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#FEF2F2,#FFF0F3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={15} color="#F43F5E" fill="#F43F5E" />
          </div>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
            <span style={{ fontWeight: 800, color: "#053366" }}>{favoris.length}</span>
            {" "}excursion{favoris.length > 1 ? "s" : ""} sauvegardée{favoris.length > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <SlidersHorizontal size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, pointerEvents: "none" }} />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="sort-select">
            <option value="default">Ordre d&apos;ajout</option>
            <option value="rating">Meilleures notes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="fav-grid">
        {sorted.map((f, i) => {
          const exc = getExc(f);
          if (!exc) return null;
          const isLoadingThis = loadingDates === exc.id;
          const isRemoving    = removing === f.id;

          return (
            <div
              key={f.id}
              className="fav-card"
              style={{ animationDelay: `${i * 0.055}s`, opacity: isRemoving ? 0.5 : 1, transition: "opacity 0.3s" }}
            >

              {/* ── Photo ── */}
              <div
                className="fav-card-photo"
                style={{ position: "relative", height: 200, overflow: "hidden", background: "#EEF2FF", flexShrink: 0 }}
              >
                <img
                  src={exc.photos?.[0] || FALLBACK_IMG}
                  alt={sanitizeText(exc.title)}
                  className="card-img"
                />

                {/* Catégorie badge */}
                {exc.categories?.[0] && (
                  <div className="cat-badge">{sanitizeText(exc.categories[0])}</div>
                )}

                {/* Bouton cœur (retirer) */}
                <button
                  className={`heart-btn${isRemoving ? " removing" : ""}`}
                  onClick={() => handleRemove(f.id, sanitizeText(exc.title))}
                  disabled={isRemoving}
                  title="Retirer des favoris"
                >
                  {isRemoving
                    ? <Loader size={14} color="#9CA3AF" style={{ animation: "spin 1s linear infinite" }} />
                    : <Heart size={15} color="#F43F5E" fill="#F43F5E" />
                  }
                </button>
              </div>

              {/* ── Body ── */}
              <div
                className="fav-card-body"
                style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}
              >

                {/* Titre + Prix */}
                <div
                  className="fav-card-title-row"
                  style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}
                >
                  <Link href={`/excursions/${exc.id}`} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
                    <h3
                      style={{ fontSize: 15, fontWeight: 800, color: "#053366", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.2px", lineHeight: 1.35 }}
                      title={sanitizeText(exc.title)}
                    >
                      {sanitizeText(exc.title)}
                    </h3>
                  </Link>

                  {/* Prix */}
                  <div className="fav-card-price-block" style={{ textAlign: "right", flexShrink: 0 }}>
                    <span className="fav-price-value" style={{ fontSize: 18, fontWeight: 900, color: "#053366", lineHeight: 1 }}>
                      {exc.price_per_person}{" "}
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>EUR</span>
                    </span>
                    <br />
                    <span className="fav-price-label" style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>/ personne</span>
                  </div>
                </div>

                {/* Ville */}
                <p
                  className="fav-card-meta"
                  style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4, margin: "0 0 12px" }}
                >
                  <MapPin size={11} color="#02AFCF" strokeWidth={2} />
                  {sanitizeText(exc.city)}
                </p>

                {/* Séparateur + infos + actions */}
                <div
                  className="fav-card-footer"
                  style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10, marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                >
                  {/* Durée + Note */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} color="#9CA3AF" strokeWidth={2} />
                      {exc.duration_hours}h
                    </span>
                    {exc.rating > 0 && (
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={11} fill="#F59E0B" color="#F59E0B" strokeWidth={0} />
                        <span style={{ fontWeight: 700, color: "#374151" }}>{exc.rating}</span>
                        <span style={{ color: "#D1D5DB", fontSize: 11 }}>({exc.reviews_count})</span>
                      </span>
                    )}
                  </div>

                  {/* Boutons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Partager */}
                    <button
                      onClick={() => handleShare(exc)}
                      title="Partager"
                      style={{ width: 34, height: 34, borderRadius: 10, background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.18s" }}
                      onMouseOver={e => (e.currentTarget.style.background = "#E5E7EB")}
                      onMouseOut={e => (e.currentTarget.style.background = "#F3F4F6")}
                    >
                      <Share2 size={13} color="#6B7280" />
                    </button>

                    {/* Voir détails */}
                    <Link href={`/excursions/${exc.id}`} className="detail-btn">
                      <Eye size={13} /> Détails
                    </Link>

                    {/* Réserver */}
                    <button
                      onClick={() => openCheckout(exc)}
                      disabled={isLoadingThis}
                      className="reserve-btn"
                    >
                      {isLoadingThis
                        ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Chargement...</>
                        : <><CalendarDays size={13} /> Réserver</>
                      }
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fav-toast">
          <Heart size={14} color="#FDA4AF" fill="#FDA4AF" />
          {toast}
        </div>
      )}

      {/* ── CheckoutModal ── */}
      {modalExc && (
        <CheckoutModal
          exc={modalExc}
          onClose={() => setModalExc(null)}
        />
      )}
    </>
  );
}