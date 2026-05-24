"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import Link from "next/link";
import {
  Heart, Star, Clock, MapPin, ArrowRight,
  SlidersHorizontal, Loader, Compass,
  CalendarDays, Share2,
} from "lucide-react";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";

interface DateDispo { date: string; slots: number; }
interface Excursion {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number; max_people: number;
  photos: string[]; categories: string[];
  available_dates?: DateDispo[] | null;
}
interface Favori { id: string; excursion: Excursion | Excursion[] | null; }

function getExc(f: Favori): Excursion | null {
  if (!f.excursion) return null;
  if (Array.isArray(f.excursion)) return f.excursion[0] ?? null;
  return f.excursion;
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80";

const CSS = `
  @keyframes cardIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes heartPop{ 0%{transform:scale(1)} 40%{transform:scale(1.35)} 70%{transform:scale(.9)} 100%{transform:scale(1)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  /* ── Grid ── */
  .fav-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 1024px) {
    .fav-grid { grid-template-columns: repeat(2,1fr); gap:16px; }
  }
  @media (max-width: 640px) {
    .fav-grid { grid-template-columns: 1fr; gap:12px; }
  }

  /* ── Card desktop/tablet ── */
  .fav-card {
    background: white;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #EBEBEB;
    box-shadow: 0 2px 10px rgba(5,51,102,.06);
    display: flex;
    flex-direction: column;
    transition: box-shadow .22s, transform .22s;
    animation: cardIn .35s ease both;
  }
  .fav-card:hover {
    box-shadow: 0 10px 32px rgba(5,51,102,.11);
    transform: translateY(-3px);
  }
  .fav-card:hover .fav-img { transform: scale(1.04); }
  .fav-img {
    width:100%; height:100%; object-fit:cover; display:block;
    transition: transform .45s ease;
  }

  /* ── Card mobile : layout vertical avec bouton sous prix ── */
  @media (max-width: 640px) {
    .fav-card {
      flex-direction: column !important;
      border-radius: 14px !important;
      height: auto !important;
    }
    /* Photo en haut */
    .fav-photo-wrap {
      width: 100% !important;
      height: 160px !important;
      position: relative;
    }
    /* Body en bas */
    .fav-body {
      padding: 12px !important;
    }
    /* Titre */
    .fav-title {
      font-size: 14px !important;
      white-space: normal !important;
      overflow: visible !important;
      line-height: 1.3 !important;
      margin-bottom: 4px !important;
    }
    /* Ville */
    .fav-city { 
      font-size: 12px !important; 
      margin-bottom: 8px !important; 
    }
    /* Header avec titre et prix sur même ligne */
    .fav-header-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      gap: 8px !important;
      margin-bottom: 6px !important;
    }
    /* Prix container */
    .fav-price-container {
      text-align: right !important;
      flex-shrink: 0 !important;
    }
    .fav-price {
      font-size: 16px !important;
      font-weight: 900 !important;
      color: #053366 !important;
      line-height: 1 !important;
    }
    .fav-price-unit { 
      font-size: 10px !important; 
      color: #9CA3AF !important;
    }
    /* Meta info (durée + note) */
    .fav-meta {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      margin-bottom: 12px !important;
      padding-bottom: 10px !important;
      border-bottom: 1px solid #F3F4F6 !important;
    }
    .fav-meta-item {
      font-size: 12px !important;
      color: #6B7280 !important;
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    /* Boutons container */
    .fav-buttons {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      margin-top: 4px !important;
    }
    .fav-detail-btn {
      flex: 1 !important;
      justify-content: center !important;
      padding: 10px 12px !important;
      font-size: 13px !important;
    }
    .fav-reserve-btn {
      flex: 1.5 !important;
      justify-content: center !important;
      padding: 10px 12px !important;
      font-size: 13px !important;
    }
    .fav-share-btn {
      width: 38px !important;
      height: 38px !important;
    }
    /* Cacher l'ancien footer */
    .fav-footer {
      display: none !important;
    }
    /* Heart btn repositionné */
    .fav-heart-btn {
      top: 8px !important;
      right: 8px !important;
      width: 30px !important;
      height: 30px !important;
    }
    /* Cat badge */
    .fav-cat {
      top: 8px !important;
      left: 8px !important;
      font-size: 10px !important;
      padding: 3px 8px !important;
    }
  }

  /* ── Badges / buttons ── */
  .fav-heart-btn {
    position: absolute; top: 10px; right: 10px;
    width: 32px; height: 32px; border-radius: 50%;
    background: white; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,.14);
    transition: transform .18s;
    z-index: 3;
  }
  .fav-heart-btn:hover { transform: scale(1.1); }
  .fav-heart-btn.removing { animation: heartPop .4s ease; }

  .fav-cat {
    position: absolute; top: 10px; left: 10px;
    padding: 4px 9px;
    background: rgba(15,23,42,.7);
    backdrop-filter: blur(6px);
    border-radius: 20px;
    font-size: 11px; font-weight: 700; color: white;
    pointer-events: none; z-index: 3;
  }

  .fav-reserve-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 13px;
    background: linear-gradient(135deg,#02AFCF,#0891b2);
    color: white; border: none; border-radius: 10px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: inherit; white-space: nowrap;
    transition: all .18s;
    box-shadow: 0 3px 10px rgba(2,175,207,.25);
    flex-shrink: 0;
  }
  .fav-reserve-btn:hover:not(:disabled) {
    background: linear-gradient(135deg,#0891b2,#0369a1);
    transform: translateY(-1px);
  }
  .fav-reserve-btn:disabled { opacity:.5; cursor:not-allowed; }

  .fav-detail-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 8px 12px;
    background: #F0F7FF; color: #053366;
    border-radius: 10px; text-decoration: none;
    font-size: 12px; font-weight: 600;
    border: 1px solid #DBEAFE;
    transition: background .15s; white-space: nowrap; flex-shrink: 0;
  }
  .fav-detail-btn:hover { background: #DBEAFE; }

  .fav-share-btn {
    width: 32px; height: 32px;
    border-radius: 9px; background: #F3F4F6;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background .15s;
  }
  .fav-share-btn:hover { background: #E5E7EB; }

  /* ── Toolbar ── */
  .fav-toolbar {
    display: flex; flex-wrap: wrap;
    align-items: center; justify-content: space-between;
    gap: 10px; margin-bottom: 20px;
  }
  .fav-sort {
    padding: 8px 12px 8px 30px;
    border: 1.5px solid #E5E7EB; border-radius: 10px;
    font-size: 13px; color: #374151;
    background: white; cursor: pointer; outline: none;
    appearance: none; font-family: inherit;
    transition: border .15s;
  }
  .fav-sort:focus { border-color: #02AFCF; }
  @media (max-width: 640px) {
    .fav-toolbar { flex-direction: column; align-items: flex-start; }
    .fav-sort { font-size: 12px; }
  }

  /* ── Toast ── */
  .fav-toast {
    position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
    background: #1E293B; color: white;
    padding: 10px 18px; border-radius: 26px;
    font-size: 13px; font-weight: 600;
    box-shadow: 0 6px 22px rgba(0,0,0,.2);
    animation: slideUp .26s ease;
    z-index: 9999; white-space: nowrap;
    display: flex; align-items: center; gap: 6px;
  }

  /* ── Empty ── */
  .fav-empty {
    text-align: center;
    padding: 60px 20px;
  }
  .fav-empty-icon {
    width: 60px; height: 60px;
    border-radius: 50%; background: #FEF2F2;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .fav-empty h3 {
    font-size: 18px; font-weight: 700;
    color: #053366; margin-bottom: 8px;
  }
  .fav-empty p {
    font-size: 13px; color: #6B7280;
    line-height: 1.7; max-width: 300px;
    margin: 0 auto 22px;
  }
  .fav-cta {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 20px;
    background: linear-gradient(135deg,#02AFCF,#053366);
    color: white; border-radius: 12px; text-decoration: none;
    font-size: 14px; font-weight: 700;
    box-shadow: 0 4px 14px rgba(2,175,207,.26);
    transition: all .2s;
  }
  .fav-cta:hover { transform: translateY(-2px); }
`;

export default function FavorisClient({ favoris: init, userId }: { favoris: Favori[]; userId: string }) {
  const supabase = createClient();
  const [favoris,      setFavoris]      = useState(init);
  const [removing,     setRemoving]     = useState<string | null>(null);
  const [sort,         setSort]         = useState<"default"|"price_asc"|"price_desc"|"rating">("default");
  const [modalExc,     setModalExc]     = useState<Excursion | null>(null);
  const [loadingDates, setLoadingDates] = useState<string | null>(null);
  const [toast,        setToast]        = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleRemove = async (favId: string, title: string) => {
    setRemoving(favId);
    await supabase.from("favoris").delete().eq("id", favId).eq("touriste_id", userId);
    setFavoris(p => p.filter(f => f.id !== favId));
    setRemoving(null);
    showToast(`"${title}" retiré des favoris`);
  };

  const handleShare = async (exc: Excursion) => {
    const url = `${window.location.origin}/excursions/${exc.id}`;
    try {
      if (navigator.share) await navigator.share({ title: exc.title, url });
      else { await navigator.clipboard.writeText(url); showToast("Lien copié !"); }
    } catch {}
  };

  const openCheckout = async (exc: Excursion) => {
    if (exc.available_dates !== undefined) { setModalExc(exc); return; }
    setLoadingDates(exc.id);
    const { data, error } = await supabase.from("excursions").select("available_dates").eq("id", exc.id).single();
    setLoadingDates(null);
    const enriched: Excursion = { ...exc, available_dates: (!error && data?.available_dates) ? data.available_dates : null };
    setFavoris(prev => prev.map(f => {
      const e = getExc(f);
      if (e?.id !== exc.id) return f;
      return { ...f, excursion: Array.isArray(f.excursion) ? [enriched] : enriched };
    }));
    setModalExc(enriched);
  };

  const sorted = [...favoris].sort((a, b) => {
    const ea = getExc(a), eb = getExc(b);
    if (!ea || !eb) return 0;
    if (sort === "price_asc")  return ea.price_per_person - eb.price_per_person;
    if (sort === "price_desc") return eb.price_per_person - ea.price_per_person;
    if (sort === "rating")     return eb.rating - ea.rating;
    return 0;
  });

  if (!favoris.length) return (
    <>
      <style>{CSS}</style>
      <div className="fav-empty">
        <div className="fav-empty-icon">
          <Heart size={28} color="#FDA4AF" strokeWidth={1.5}/>
        </div>
        <h3>Aucun favori pour l&apos;instant</h3>
        <p>Parcourez les excursions et cliquez sur le cœur pour sauvegarder vos préférées</p>
        <Link href="/excursions" className="fav-cta">
          <Compass size={14}/> Découvrir les excursions <ArrowRight size={14}/>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>

      {/* Toolbar */}
      <div className="fav-toolbar">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Heart size={13} color="#F43F5E" fill="#F43F5E"/>
          </div>
          <p style={{ fontSize:13, color:"#6B7280", margin:0 }}>
            <span style={{ fontWeight:800, color:"#053366" }}>{favoris.length}</span>
            {" "}excursion{favoris.length > 1 ? "s" : ""} sauvegardée{favoris.length > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
          <SlidersHorizontal size={12} color="#9CA3AF" style={{ position:"absolute", left:10, pointerEvents:"none" }}/>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="fav-sort">
            <option value="default">Ordre d&apos;ajout</option>
            <option value="rating">Meilleures notes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* Grid */}
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
              style={{ animationDelay:`${i * 0.05}s`, opacity: isRemoving ? 0.45 : 1, transition:"opacity .3s" }}
            >
              {/* Photo */}
              <div
                className="fav-photo-wrap"
                style={{ position:"relative", height:190, overflow:"hidden", background:"#EEF2FF", flexShrink:0 }}
              >
                <img src={exc.photos?.[0] || FALLBACK} alt={sanitizeText(exc.title)} className="fav-img"/>
                {exc.categories?.[0] && (
                  <div className="fav-cat">{sanitizeText(exc.categories[0])}</div>
                )}
                <button
                  className={`fav-heart-btn${isRemoving ? " removing" : ""}`}
                  onClick={() => handleRemove(f.id, sanitizeText(exc.title))}
                  disabled={isRemoving}
                  title="Retirer des favoris"
                >
                  {isRemoving
                    ? <Loader size={12} color="#9CA3AF" style={{ animation:"spin 1s linear infinite" }}/>
                    : <Heart size={13} color="#F43F5E" fill="#F43F5E"/>
                  }
                </button>
              </div>

              {/* Body - Version desktop */}
              <div
                className="fav-body"
                style={{ padding:"13px 14px 14px", display:"flex", flexDirection:"column", flex:1 }}
              >
                {/* Version Desktop */}
                <div className="desktop-view">
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:4 }}>
                    <Link href={`/excursions/${exc.id}`} style={{ textDecoration:"none", flex:1, minWidth:0 }}>
                      <h3
                        className="fav-title"
                        style={{ fontSize:14, fontWeight:800, color:"#053366", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                        title={sanitizeText(exc.title)}
                      >
                        {sanitizeText(exc.title)}
                      </h3>
                    </Link>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <span className="fav-price" style={{ fontSize:16, fontWeight:900, color:"#053366", lineHeight:1 }}>
                        {exc.price_per_person}
                      </span>
                      {" "}
                      <span className="fav-price-unit" style={{ fontSize:11, color:"#9CA3AF" }}>EUR</span>
                      <div style={{ fontSize:10, color:"#9CA3AF" }}>/ pers.</div>
                    </div>
                  </div>

                  <p className="fav-city" style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4, margin:"0 0 10px" }}>
                    <MapPin size={11} color="#02AFCF" strokeWidth={2}/>
                    {sanitizeText(exc.city)}
                  </p>

                  <div className="fav-footer" style={{ borderTop:"1px solid #F3F4F6", paddingTop:9, marginTop:"auto", display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                    <div className="fav-meta" style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                      <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:3 }}>
                        <Clock size={11} color="#9CA3AF"/>
                        {exc.duration_hours}h
                      </span>
                      {exc.rating > 0 && (
                        <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:3 }}>
                          <Star size={11} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>
                          <span style={{ fontWeight:700, color:"#374151" }}>{exc.rating}</span>
                          <span style={{ color:"#D1D5DB", fontSize:11 }}>({exc.reviews_count})</span>
                        </span>
                      )}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <button className="fav-share-btn" onClick={() => handleShare(exc)} title="Partager">
                        <Share2 size={12} color="#6B7280"/>
                      </button>
                      <Link href={`/excursions/${exc.id}`} className="fav-detail-btn">
                        Détails
                      </Link>
                      <button
                        onClick={() => openCheckout(exc)}
                        disabled={isLoadingThis}
                        className="fav-reserve-btn"
                      >
                        {isLoadingThis
                          ? <Loader size={12} style={{ animation:"spin 1s linear infinite" }}/>
                          : <><CalendarDays size={12}/> Réserver</>
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Version Mobile - Layout vertical avec bouton sous prix */}
                <div className="mobile-view">
                  {/* Header avec titre et prix */}
                  <div className="fav-header-row">
                    <Link href={`/excursions/${exc.id}`} style={{ textDecoration:"none", flex:1 }}>
                      <h3 className="fav-title" title={sanitizeText(exc.title)}>
                        {sanitizeText(exc.title)}
                      </h3>
                    </Link>
                    <div className="fav-price-container">
                      <span className="fav-price">{exc.price_per_person}</span>
                      <span className="fav-price-unit"> EUR</span>
                      <div style={{ fontSize:9, color:"#9CA3AF" }}>/pers.</div>
                    </div>
                  </div>

                  {/* Ville */}
                  <p className="fav-city">
                    <MapPin size={11} color="#02AFCF" strokeWidth={2}/>
                    {sanitizeText(exc.city)}
                  </p>

                  {/* Durée et note */}
                  <div className="fav-meta">
                    <span className="fav-meta-item">
                      <Clock size={11} color="#9CA3AF"/>
                      {exc.duration_hours}h
                    </span>
                    {exc.rating > 0 && (
                      <span className="fav-meta-item">
                        <Star size={11} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>
                        <span style={{ fontWeight:700, color:"#374151" }}>{exc.rating}</span>
                        <span style={{ color:"#D1D5DB", fontSize:11 }}>({exc.reviews_count})</span>
                      </span>
                    )}
                  </div>

                  {/* Boutons */}
                  <div className="fav-buttons">
                    <button className="fav-share-btn" onClick={() => handleShare(exc)} title="Partager">
                      <Share2 size={13} color="#6B7280"/>
                    </button>
                    <Link href={`/excursions/${exc.id}`} className="fav-detail-btn">
                      Détails
                    </Link>
                    <button
                      onClick={() => openCheckout(exc)}
                      disabled={isLoadingThis}
                      className="fav-reserve-btn"
                    >
                      {isLoadingThis
                        ? <Loader size={13} style={{ animation:"spin 1s linear infinite" }}/>
                        : <><CalendarDays size={13}/> Réserver</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .desktop-view { display: block; }
        .mobile-view { display: none; }
        @media (max-width: 640px) {
          .desktop-view { display: none; }
          .mobile-view { display: block; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fav-toast">
          <Heart size={12} color="#FDA4AF" fill="#FDA4AF"/>
          {toast}
        </div>
      )}

      {/* CheckoutModal */}
      {modalExc && (
        <CheckoutModal exc={modalExc} onClose={() => setModalExc(null)}/>
      )}
    </>
  );
}