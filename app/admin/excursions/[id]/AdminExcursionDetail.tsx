"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "../../../../lib/useToast";
import { Toast } from "../../../components/ui/Toast";
import {
  ArrowLeft, ChevronRight, MapPin, Calendar, Star, Clock,
  Wallet, Users, CheckCircle, AlertTriangle, MessageCircle,
  Trash2, ThumbsUp, Eye, Building2, Phone, X, Globe, ChevronLeft,
  Camera, Shield,
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
  const [avis, setAvis]           = useState(initialAvis);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showPrestataire, setShowPrestataire] = useState(false);
  const [myLikes, setMyLikes]     = useState<Set<string>>(new Set());

  const { toast, showToast } = useToast();

  const photos = exc.photos?.filter(Boolean).length ? exc.photos.filter(Boolean) : [FALLBACK];
  const approvedAvis = avis.filter(a => a.is_moderated);
  const avgRating = approvedAvis.length
    ? (approvedAvis.reduce((s, a) => s + a.rating, 0) / approvedAvis.length).toFixed(1) : null;

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
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
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
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        .thumb-a{width:72px;height:54px;border-radius:10px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;transition:all .2s;flex-shrink:0}
        .thumb-a.on{border-color:#2B96A8}
        .thumb-a img{width:100%;height:100%;object-fit:cover}
        .av-card{background:white;border-radius:16px;border:1px solid #F0F0F0;padding:18px 20px;margin-bottom:10px;transition:box-shadow .2s}
        .av-card:hover{box-shadow:0 4px 18px rgba(0,0,0,.07)}
        .abtn{padding:7px 13px;border-radius:9px;border:1px solid #E5E7EB;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s;background:white;display:inline-flex;align-items:center;gap:5px}
        .abtn:disabled{opacity:.5;cursor:not-allowed}
        .like-btn{display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s}
        .like-btn.on{background:#FEF2F2;border-color:#FECACA;color:#E11D48}
        .like-btn:not(.on):hover{background:#F9FAFB}
        .toast-ad{position:fixed;top:22px;right:22px;z-index:9999;padding:12px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:inherit;box-shadow:0 8px 28px rgba(0,0,0,.12);animation:tin .3s ease;display:flex;align-items:center;gap:8px}
        .overlay-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:24px}
        .modal-box{background:white;border-radius:24px;width:100%;max-width:520px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.2)}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease}
      `}</style>

      <Toast toast={toast} />

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, fontSize: 13, color: "#9CA3AF" }}>
        <Link href="/admin/excursions" style={{ color: "#6B7280", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
          <ArrowLeft size={14} strokeWidth={2} /> Excursions
        </Link>
        <ChevronRight size={13} color="#D1D5DB" />
        <span style={{ color: "#111827", fontWeight: 600 }}>{exc.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 28 }}>

        {/* ── GAUCHE ── */}
        <div>
          {/* Badges + Titre */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {exc.categories?.map(c => (
                <span key={c} style={{ padding: "3px 10px", background: "rgba(43,150,168,.1)", color: "#2B96A8", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c}</span>
              ))}
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: exc.is_active ? "#F0FDF4" : "#F9FAFB", color: exc.is_active ? "#15803D" : "#9CA3AF", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                {exc.is_active ? "Actif" : "Brouillon"}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#111827", marginBottom: 6, letterSpacing: "-.5px" }}>
              {exc.title}
            </h1>
            <p style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin size={13} color="#9CA3AF" strokeWidth={1.5} />{exc.city}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Calendar size={13} color="#9CA3AF" strokeWidth={1.5} />
                créée le {new Date(exc.created_at).toLocaleDateString("fr-FR")}
              </span>
            </p>
          </div>

          {/* Galerie */}
          <PhotoGallery photos={photos} currentPhoto={currentPhoto} setCurrentPhoto={setCurrentPhoto} title={exc.title} FALLBACK={FALLBACK} />

          {/* Description */}
          <DescriptionSection description={exc.description} />

          {/* Inclusions + Langues */}
          <InclusionsLanguages inclusions={exc.inclusions} languages={exc.languages} />

          {/* ── AVIS ── */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
                Avis
                {avgRating && (
                  <span style={{ fontSize: 16, color: "#F59E0B", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Star size={16} fill="#F59E0B" color="#F59E0B" /> {avgRating}
                  </span>
                )}
              </h2>
              <div style={{ display: "flex", gap: 7, fontSize: 12 }}>
                <span style={{ padding: "3px 10px", background: "#F0FDF4", color: "#15803D", borderRadius: 20, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle size={10} /> {approvedAvis.length} publiés
                </span>
                {avis.filter(a => !a.is_moderated).length > 0 && (
                  <span style={{ padding: "3px 10px", background: "#FFFBEB", color: "#D97706", borderRadius: 20, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} /> {avis.filter(a => !a.is_moderated).length} en attente
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

        {/* ── DROITE sticky ── */}
        <div style={{ position: "sticky", top: 80, height: "fit-content" }}>

          {/* Stats */}
          <StatsCard exc={exc} reservations={reservations} avgRating={avgRating} />

          {/* Prestataire card */}
          <PrestatairesCard prestataire={prestataire} prestName={prestName} setShowPrestataire={setShowPrestataire} />

          {/* Actions admin */}
          <ActionsButtons exc={exc} />
        </div>
      </div>

      {/* ── MODAL PRESTATAIRE ── */}
      <PrestastaireModal showPrestataire={showPrestataire} setShowPrestataire={setShowPrestataire} prestataire={prestataire} prestName={prestName} />
    </>
  );
}