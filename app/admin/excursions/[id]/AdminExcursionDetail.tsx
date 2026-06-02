"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "../../../../lib/useToast";
import { Toast } from "../../../components/ui/Toast";
import {
  ArrowLeft, ChevronRight, MapPin, Calendar, Star, Clock,
  CheckCircle, Trash2, ThumbsUp,
} from "lucide-react";
import {
  PhotoGallery, DescriptionSection, InclusionsLanguages, ReviewCard,
  StatsCard, PrestatairesCard, PrestastaireModal, ActionsButtons, EmptyReviews,
} from "../../../components/admin/ExcursionsUI";

interface Exc {
  id: string; title: string; city: string; description: string;
  duration_hours: number; price_per_person: number; max_people: number;
  categories: string[]; languages: string[]; inclusions: string[];
  photos: string[]; rating: number; reviews_count: number;
  is_active: boolean; prestataire_id: string; created_at: string;
}
interface Prestataire {
  user_id: string; full_name: string; agency_name: string | null;
  city: string | null; phone: string | null; description: string | null;
  is_validated: boolean; avatar_url: string | null; email?: string; created_at: string;
}
interface Avis {
  id: string; rating: number; comment: string; is_moderated: boolean;
  created_at: string; touriste_name: string; touriste_avatar: string | null;
  prestataire_response: string | null; likes_count: number;
}
interface Reservation { id: string; status: string; }

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1200&q=85&fit=crop";

export default function AdminExcursionDetail({
  exc, prestataire, avis: initialAvis, reservations,
}: {
  exc: Exc; prestataire: Prestataire | null;
  avis: Avis[]; reservations: Reservation[];
}) {
  const [avis, setAvis]                 = useState(initialAvis);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [loadingId, setLoadingId]       = useState<string | null>(null);
  const [showPrestataire, setShowPrestataire] = useState(false);
  const [myLikes, setMyLikes]           = useState<Set<string>>(new Set());

  const { toast, showToast } = useToast();

  const photos        = exc.photos?.filter(Boolean).length ? exc.photos.filter(Boolean) : [FALLBACK];
  const approvedAvis  = avis.filter(a =>  a.is_moderated);
  const pendingAvis   = avis.filter(a => !a.is_moderated);
  const avgRating     = approvedAvis.length
    ? (approvedAvis.reduce((s, a) => s + a.rating, 0) / approvedAvis.length).toFixed(1)
    : null;

  const deleteAvis = async (id: string) => {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/moderate-avis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avisId: id, action: "delete" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setAvis(prev => prev.filter(a => a.id !== id));
      showToast("Avis supprimé");
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, "error"); }
    setLoadingId(null);
  };

  const approveAvis = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/moderate-avis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avisId: id, action: "approve" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setAvis(prev => prev.map(a => a.id === id ? { ...a, is_moderated: true } : a));
      showToast("Avis approuvé");
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, "error"); }
    setLoadingId(null);
  };

  const toggleLike = (avisId: string) => {
    const liked = myLikes.has(avisId);
    setMyLikes(prev => { const n = new Set(prev); liked ? n.delete(avisId) : n.add(avisId); return n; });
    setAvis(prev => prev.map(a => a.id === avisId
      ? { ...a, likes_count: liked ? Math.max(0, a.likes_count - 1) : a.likes_count + 1 } : a));
  };

  const prestName = prestataire?.agency_name || prestataire?.full_name || "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Breadcrumb ── */
        .bc-link {
          color: #6B7280; text-decoration: none; font-weight: 600; font-size: 12px;
          display: inline-flex; align-items: center; gap: 5px;
          transition: color .15s;
        }
        .bc-link:hover { color: #02AFCF; }

        /* ── Category / status chips ── */
        .chip-cat {
          padding: 3px 10px; background: rgba(2,175,207,.1); color: #02AFCF;
          border: 1px solid rgba(2,175,207,.2);
          border-radius: 20px; font-size: 11px; font-weight: 700;
        }
        .chip-active {
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(2,175,207,.08); color: #02AFCF; border: 1px solid rgba(2,175,207,.2);
        }
        .chip-draft {
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800;
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(107,114,128,.08); color: #9CA3AF; border: 1px solid #EEF2FF;
        }

        /* ── Avis card ── */
        .av-card {
          background: white; border-radius: 14px; border: 1px solid #EEF2FF;
          padding: 18px 20px; margin-bottom: 8px; transition: box-shadow .2s, border-color .2s;
        }
        .av-card:hover { box-shadow: 0 4px 18px rgba(5,51,102,.07); border-color: #DCE5FF; }

        /* ── Avis action buttons ── */
        .abtn {
          padding: 6px 13px; border-radius: 8px; border: none;
          cursor: pointer; font-size: 11px; font-weight: 700; font-family: inherit;
          transition: all .2s; display: inline-flex; align-items: center; gap: 5px;
        }
        .abtn:disabled { opacity: .45; cursor: not-allowed; }
        .abtn-teal { background: rgba(2,175,207,.1);  color: #02AFCF; }
        .abtn-teal:hover:not(:disabled) { background: rgba(2,175,207,.18); }
        .abtn-red  { background: rgba(220,38,38,.08); color: #DC2626; }
        .abtn-red:hover:not(:disabled)  { background: rgba(220,38,38,.15); }

        /* ── Like button ── */
        .like-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 20px;
          border: 1px solid #EEF2FF; background: white;
          cursor: pointer; font-size: 11px; font-weight: 700; font-family: inherit;
          transition: all .2s;
        }
        .like-btn.on  { background: #FEF2F2; border-color: #FECACA; color: #E11D48; }
        .like-btn:not(.on):hover { background: #F8FAFF; border-color: #DCE5FF; }

        /* ── Photo thumbs ── */
        .thumb-a {
          width: 72px; height: 54px; border-radius: 10px; overflow: hidden;
          cursor: pointer; border: 2px solid transparent; transition: all .2s; flex-shrink: 0;
        }
        .thumb-a.on { border-color: #02AFCF; box-shadow: 0 0 0 2px rgba(2,175,207,.2); }
        .thumb-a img { width: 100%; height: 100%; object-fit: cover; }

        /* ── Section headings ── */
        .sec-title {
          font-size: 16px; font-weight: 800; color: #053366;
          display: flex; align-items: center; gap: 8px; margin: 0 0 14px;
          letter-spacing: -0.2px;
        }
        .sec-icon {
          width: 26px; height: 26px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* ── Avis status badges (inside header) ── */
        .avis-badge {
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 4px;
        }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp .3s ease; }
      `}</style>

      <Toast toast={toast} />

      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 12 }}>
        <Link href="/admin/excursions" className="bc-link">
          <ArrowLeft size={13} strokeWidth={2} /> Excursions
        </Link>
        <ChevronRight size={12} color="#D1D5DB" />
        <span style={{ color: "#053366", fontWeight: 700, fontSize: 12 }}>{exc.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 24 }}>

        {/* ═══════════════ GAUCHE ═══════════════ */}
        <div>

          {/* ── Chips + Titre ── */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {exc.categories?.map(c => (
                <span key={c} className="chip-cat">{c}</span>
              ))}
              <span className={exc.is_active ? "chip-active" : "chip-draft"}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                {exc.is_active ? "Actif" : "Brouillon"}
              </span>
            </div>

            <h1 style={{
              fontFamily: "'DM Sans',system-ui,sans-serif",
              fontSize: 24, fontWeight: 900, color: "#053366",
              margin: "0 0 8px", letterSpacing: "-0.5px", lineHeight: 1.2,
            }}>
              {exc.title}
            </h1>

            <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 12, margin: 0, fontWeight: 500 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} strokeWidth={1.5} />{exc.city}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Calendar size={12} strokeWidth={1.5} />
                créée le {new Date(exc.created_at).toLocaleDateString("fr-FR")}
              </span>
            </p>
          </div>

          {/* ── Galerie ── */}
          <PhotoGallery
            photos={photos}
            currentPhoto={currentPhoto}
            setCurrentPhoto={setCurrentPhoto}
            title={exc.title}
            FALLBACK={FALLBACK}
          />

          {/* ── Description ── */}
          <DescriptionSection description={exc.description} />

          {/* ── Inclusions + Langues ── */}
          <InclusionsLanguages inclusions={exc.inclusions} languages={exc.languages} />

          {/* ═══════ AVIS ═══════ */}
          <div style={{ marginTop: 28 }}>

            {/* Avis header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="sec-title" style={{ margin: 0 }}>
                <span className="sec-icon" style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)" }}>
                  <Star size={13} color="#F59E0B" strokeWidth={1.5} />
                </span>
                Avis
                {avgRating && (
                  <span style={{ fontSize: 14, color: "#F59E0B", display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800 }}>
                    <Star size={13} fill="#F59E0B" color="#F59E0B" /> {avgRating}
                  </span>
                )}
              </h2>

              <div style={{ display: "flex", gap: 6 }}>
                <span className="avis-badge" style={{ background: "rgba(2,175,207,.1)", color: "#02AFCF", border: "1px solid rgba(2,175,207,.2)" }}>
                  <CheckCircle size={9} /> {approvedAvis.length} publiés
                </span>
                {pendingAvis.length > 0 && (
                  <span className="avis-badge" style={{ background: "rgba(217,119,6,.1)", color: "#D97706", border: "1px solid rgba(217,119,6,.2)" }}>
                    <Clock size={9} /> {pendingAvis.length} en attente
                  </span>
                )}
              </div>
            </div>

            {avis.length === 0 ? (
              <EmptyReviews />
            ) : (
              avis.map(a => (
                <ReviewCard
                  key={a.id}
                  avis={a}
                  myLikes={myLikes}
                  toggleLike={toggleLike}
                  loadingId={loadingId}
                  approveAvis={approveAvis}
                  deleteAvis={deleteAvis}
                />
              ))
            )}
          </div>
        </div>

        {/* ═══════════════ DROITE sticky ═══════════════ */}
        <div style={{ position: "sticky", top: 80, height: "fit-content", display: "flex", flexDirection: "column", gap: 12 }}>
          <StatsCard exc={exc} reservations={reservations} avgRating={avgRating} />
          <PrestatairesCard prestataire={prestataire} prestName={prestName} setShowPrestataire={setShowPrestataire} />
          <ActionsButtons exc={exc} />
        </div>
      </div>

      {/* ── Modal prestataire ── */}
      <PrestastaireModal
        showPrestataire={showPrestataire}
        setShowPrestataire={setShowPrestataire}
        prestataire={prestataire}
        prestName={prestName}
      />
    </>
  );
}