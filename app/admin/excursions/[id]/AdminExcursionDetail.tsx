"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronRight, MapPin, Calendar, Star, Clock,
  Wallet, Users, CheckCircle, AlertTriangle, MessageCircle,
  Trash2, ThumbsUp, Eye, Building2, Phone, X, Globe, ChevronLeft,
  Camera, Shield,
} from "lucide-react";

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
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showPrestataire, setShowPrestataire] = useState(false);
  const [myLikes, setMyLikes]     = useState<Set<string>>(new Set());

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

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

      {toast && (
        <div className="toast-ad" style={{ background: toast.ok ? "#F0FDF4" : "#FEF2F2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}` }}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

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
          <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "16/9", background: "#F3F4F6", position: "relative", marginBottom: 10 }}>
            <img src={photos[currentPhoto]} alt={exc.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity .3s" }}
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
            {photos.length > 1 && (
              <>
                <button onClick={() => setCurrentPhoto(p => (p - 1 + photos.length) % photos.length)}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setCurrentPhoto(p => (p + 1) % photos.length)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={18} />
                </button>
                <div style={{ position: "absolute", bottom: 10, right: 12, padding: "3px 9px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <Camera size={11} /> {currentPhoto + 1}/{photos.length}
                </div>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
              {photos.map((p, i) => (
                <div key={i} className={`thumb-a ${currentPhoto === i ? "on" : ""}`} onClick={() => setCurrentPhoto(i)}>
                  <img src={p} alt="" />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0F0F0", padding: "20px 22px", marginTop: 16, marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Description</h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>{exc.description || "Aucune description."}</p>
          </div>

          {/* Inclusions + Langues */}
          {(exc.inclusions?.length > 0 || exc.languages?.length > 0) && (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0F0F0", padding: "20px 22px", marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {exc.inclusions?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Inclusions</h3>
                  {exc.inclusions.map(inc => (
                    <div key={inc} style={{ display: "flex", gap: 7, fontSize: 13, color: "#374151", marginBottom: 5, alignItems: "center" }}>
                      <CheckCircle size={13} color="#15803D" strokeWidth={2} style={{ flexShrink: 0 }} />{inc}
                    </div>
                  ))}
                </div>
              )}
              {exc.languages?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Langues</h3>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {exc.languages.map(l => (
                      <span key={l} style={{ padding: "4px 12px", background: "#F3F4F6", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#374151", display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Globe size={11} color="#6B7280" strokeWidth={1.5} />{l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
              <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: 16, border: "1px solid #F0F0F0" }}>
                <MessageCircle size={36} color="#D1D5DB" strokeWidth={1.5} style={{ marginBottom: 10 }} />
                <p style={{ fontWeight: 700, color: "#374151" }}>Aucun avis</p>
              </div>
            ) : (
              avis.map(a => (
                <div key={a.id} className="av-card fu"
                  style={{ borderLeft: `4px solid ${a.is_moderated ? "#2B96A8" : "#F59E0B"}` }}>

                  {!a.is_moderated && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#D97706", marginBottom: 10 }}>
                      <Clock size={10} /> En attente de modération
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 }}>
                        {a.touriste_avatar
                          ? <img src={a.touriste_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : (a.touriste_name[0] || "?").toUpperCase()
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{a.touriste_name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                          {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 1 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= a.rating ? "#F59E0B" : "none"} color={s <= a.rating ? "#F59E0B" : "#E5E7EB"} strokeWidth={1.5} />)}
                    </div>
                  </div>

                  {/* Commentaire */}
                  {a.comment && (
                    <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px 10px 50px", marginBottom: 12 }}>
                      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>&ldquo;{a.comment}&rdquo;</p>
                    </div>
                  )}

                  {/* Réponse prestataire */}
                  {a.prestataire_response && (
                    <div style={{ marginLeft: 48, padding: "10px 14px", background: "rgba(43,150,168,.06)", borderRadius: 10, borderLeft: "3px solid #2B96A8", marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "#2B96A8", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                        <Building2 size={11} /> Réponse du prestataire
                      </p>
                      <p style={{ fontSize: 13, color: "#374151" }}>{a.prestataire_response}</p>
                    </div>
                  )}

                  {/* Actions bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid #F3F4F6", marginTop: 6 }}>
                    <button className={`like-btn ${myLikes.has(a.id) ? "on" : ""}`} onClick={() => toggleLike(a.id)}>
                      <ThumbsUp size={13} fill={myLikes.has(a.id) ? "currentColor" : "none"} />
                      {(a.likes_count + (myLikes.has(a.id) ? 1 : 0)) > 0 && (
                        <span>{a.likes_count + (myLikes.has(a.id) ? 1 : 0)}</span>
                      )}
                      <span>J&apos;aime</span>
                    </button>
                    <div style={{ flex: 1 }} />
                    {!a.is_moderated && (
                      <button className="abtn" disabled={loadingId === a.id} onClick={() => approveAvis(a.id)}
                        style={{ color: "#15803D", borderColor: "#BBF7D0", background: "#F0FDF4" }}>
                        <CheckCircle size={13} />{loadingId === a.id ? "..." : "Approuver"}
                      </button>
                    )}
                    <button className="abtn" disabled={loadingId === a.id} onClick={() => deleteAvis(a.id)}
                      style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}>
                      <Trash2 size={13} />{loadingId === a.id ? "..." : "Supprimer"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── DROITE sticky ── */}
        <div style={{ position: "sticky", top: 80, height: "fit-content" }}>

          {/* Stats */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #F0F0F0", padding: "20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 7 }}>
              <Shield size={14} color="#2B96A8" strokeWidth={1.5} /> Statistiques
            </h3>
            {[
              { label: "Prix / pers.", val: `${exc.price_per_person} TND`, Icon: Wallet    },
              { label: "Durée",         val: `${exc.duration_hours}h`,       Icon: Clock     },
              { label: "Capacité",      val: `${exc.max_people} pers.`,      Icon: Users     },
              { label: "Note moy.",     val: avgRating ? `${avgRating}/5` : "—", Icon: Star },
              { label: "Réservations",  val: `${reservations.length}`,       Icon: Calendar  },
              { label: "Confirmées",    val: `${reservations.filter(r => r.status === "confirmed").length}`, Icon: CheckCircle },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
                  <s.Icon size={13} color="#9CA3AF" strokeWidth={1.5} />{s.label}
                </span>
                <span style={{ fontWeight: 800, color: "#111827" }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Prestataire card */}
          {prestataire && (
            <div onClick={() => setShowPrestataire(true)}
              style={{ background: "white", borderRadius: 18, border: "1.5px solid #E5E7EB", padding: "18px 20px", marginBottom: 14, cursor: "pointer", transition: "all .2s", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2B96A8"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(43,150,168,.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,.05)"; }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 12 }}>PRESTATAIRE</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #F0F0F0" }}>
                  {prestataire.avatar_url
                    ? <img src={prestataire.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2B96A8,#4AABB8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18 }}>
                        {prestName[0].toUpperCase()}
                      </div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prestName}</p>
                  {prestataire.city && (
                    <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <MapPin size={11} color="#C4B8B0" strokeWidth={1.5} />{prestataire.city}
                    </p>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, color: prestataire.is_validated ? "#15803D" : "#D97706", background: prestataire.is_validated ? "#F0FDF4" : "#FFFBEB", padding: "2px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4 }}>
                    {prestataire.is_validated ? <CheckCircle size={9} /> : <Clock size={9} />}
                    {prestataire.is_validated ? "Validé" : "En attente"}
                  </span>
                </div>
                <ChevronRight size={16} color="#9CA3AF" />
              </div>
              <p style={{ fontSize: 11, color: "#2B96A8", fontWeight: 600, marginTop: 10, textAlign: "center" }}>
                Cliquez pour voir le profil complet
              </p>
            </div>
          )}

          {/* Actions admin */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #F0F0F0", padding: "18px 20px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Actions admin</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href={`/excursions/${exc.id}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "10px 14px", background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Eye size={14} strokeWidth={1.5} /> Page publique
              </a>
              <Link href="/admin/excursions"
                style={{ padding: "10px 14px", background: "white", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <ArrowLeft size={14} strokeWidth={1.5} /> Retour
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL PRESTATAIRE ── */}
      {showPrestataire && prestataire && (
        <div className="overlay-bg" onClick={e => { if (e.target === e.currentTarget) setShowPrestataire(false); }}>
          <div className="modal-box fu">
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "#111827" }}>
                Profil prestataire
              </h2>
              <button onClick={() => setShowPrestataire(false)}
                style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Avatar + Nom */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, paddingBottom: 20, borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #F0F0F0" }}>
                  {prestataire.avatar_url
                    ? <img src={prestataire.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2B96A8,#4AABB8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 28 }}>
                        {prestName[0].toUpperCase()}
                      </div>
                  }
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 3 }}>{prestName}</h3>
                  {prestataire.full_name && prestataire.agency_name && (
                    <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Users size={12} color="#9CA3AF" strokeWidth={1.5} />{prestataire.full_name}
                    </p>
                  )}
                  <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: prestataire.is_validated ? "#F0FDF4" : "#FFFBEB", color: prestataire.is_validated ? "#15803D" : "#D97706", border: `1px solid ${prestataire.is_validated ? "#BBF7D0" : "#FDE68A"}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {prestataire.is_validated ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {prestataire.is_validated ? "Compte validé" : "En attente de validation"}
                  </span>
                </div>
              </div>

              {/* Détails */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {[
                  { Icon: MapPin,   label: "Ville",      val: prestataire.city || "—" },
                  { Icon: Phone,    label: "Téléphone",  val: prestataire.phone || "—" },
                  { Icon: Calendar, label: "Inscrit le", val: new Date(prestataire.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "8px 0", borderBottom: "1px solid #F9FAFB" }}>
                    <span style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
                      <row.Icon size={13} color="#9CA3AF" strokeWidth={1.5} />{row.label}
                    </span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>{row.val}</span>
                  </div>
                ))}
              </div>

              {prestataire.description && (
                <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Description</p>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{prestataire.description}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <Link href="/admin/prestataires" onClick={() => setShowPrestataire(false)}
                  style={{ flex: 1, padding: "11px 14px", background: "rgba(43,150,168,.08)", color: "#2B96A8", border: "1.5px solid rgba(43,150,168,.2)", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Building2 size={14} /> Gérer les prestataires
                </Link>
                <button onClick={() => setShowPrestataire(false)}
                  style={{ padding: "11px 18px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={14} /> Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}