"use client";

import {
  ChevronLeft, ChevronRight, Camera, MapPin, Calendar, CheckCircle,
  Globe, MessageCircle, Clock, Star, ThumbsUp, Trash2, Building2,
  Phone, X, Users, Shield, Wallet, Eye, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Avis {
  id: string; rating: number; comment: string; is_moderated: boolean;
  created_at: string; touriste_name: string; touriste_avatar: string | null;
  prestataire_response: string | null; likes_count: number;
}

interface Prestataire {
  user_id: string; full_name: string; agency_name: string | null;
  city: string | null; phone: string | null; description: string | null;
  is_validated: boolean; avatar_url: string | null; email?: string; created_at: string;
}

interface Exc {
  id: string;
  price_per_person: number;
  duration_hours: number;
  max_people: number;
  categories?: string[];
}

interface Reservation { id: string; status: string; }

// ─── PHOTO GALLERY ───
export function PhotoGallery({ photos, currentPhoto, setCurrentPhoto, title, FALLBACK }: any) {
  return (
    <>
      <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "16/9", background: "#F3F4F6", position: "relative", marginBottom: 10 }}>
        <img src={photos[currentPhoto]} alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity .3s" }}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
        {photos.length > 1 && (
          <>
            <button onClick={() => setCurrentPhoto((p: number) => (p - 1 + photos.length) % photos.length)}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentPhoto((p: number) => (p + 1) % photos.length)}
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
          {photos.map((p: string, i: number) => (
            <div key={i} className="thumb-a" style={{ width: 72, height: 54, borderRadius: 10, overflow: "hidden", cursor: "pointer", border: currentPhoto === i ? "2.5px solid #2B96A8" : "2.5px solid transparent", transition: "all .2s", flexShrink: 0 }} onClick={() => setCurrentPhoto(i)}>
              <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── DESCRIPTION SECTION ───
export function DescriptionSection({ description }: { description?: string }) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0F0F0", padding: "20px 22px", marginTop: 16, marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Description</h2>
      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>{description || "Aucune description."}</p>
    </div>
  );
}

// ─── INCLUSIONS + LANGUAGES ───
export function InclusionsLanguages({ inclusions, languages }: { inclusions?: string[]; languages?: string[] }) {
  if (!inclusions?.length && !languages?.length) return null;
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0F0F0", padding: "20px 22px", marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {inclusions && inclusions.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Inclusions</h3>
          {inclusions.map((inc: string) => (
            <div key={inc} style={{ display: "flex", gap: 7, fontSize: 13, color: "#374151", marginBottom: 5, alignItems: "center" }}>
              <CheckCircle size={13} color="#15803D" strokeWidth={2} style={{ flexShrink: 0 }} />{inc}
            </div>
          ))}
        </div>
      )}
      {languages && languages.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Langues</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {languages.map((l: string) => (
              <span key={l} style={{ padding: "4px 12px", background: "#F3F4F6", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#374151", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Globe size={11} color="#6B7280" strokeWidth={1.5} />{l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REVIEW CARD ───
export function ReviewCard({ avis, myLikes, toggleLike, loadingId, approveAvis, deleteAvis }: any) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: `1px solid #F0F0F0`, borderLeft: `4px solid ${avis.is_moderated ? "#2B96A8" : "#F59E0B"}`, padding: "18px 20px", marginBottom: 10, transition: "box-shadow .2s" }} onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(0,0,0,.07)"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>

      {!avis.is_moderated && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#D97706", marginBottom: 10 }}>
          <Clock size={10} /> En attente de modération
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 }}>
            {avis.touriste_avatar
              ? <img src={avis.touriste_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (avis.touriste_name[0] || "?").toUpperCase()
            }
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{avis.touriste_name}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>
              {new Date(avis.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 1 }}>
          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= avis.rating ? "#F59E0B" : "none"} color={s <= avis.rating ? "#F59E0B" : "#E5E7EB"} strokeWidth={1.5} />)}
        </div>
      </div>

      {/* Commentaire */}
      {avis.comment && (
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px 10px 50px", marginBottom: 12 }}>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>&ldquo;{avis.comment}&rdquo;</p>
        </div>
      )}

      {/* Réponse prestataire */}
      {avis.prestataire_response && (
        <div style={{ marginLeft: 48, padding: "10px 14px", background: "rgba(43,150,168,.06)", borderRadius: 10, borderLeft: "3px solid #2B96A8", marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#2B96A8", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <Building2 size={11} /> Réponse du prestataire
          </p>
          <p style={{ fontSize: 13, color: "#374151" }}>{avis.prestataire_response}</p>
        </div>
      )}

      {/* Actions bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid #F3F4F6", marginTop: 6 }}>
        <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 20, border: myLikes.has(avis.id) ? "1.5px solid #FECACA" : "1.5px solid #E5E7EB", background: myLikes.has(avis.id) ? "#FEF2F2" : "white", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", color: myLikes.has(avis.id) ? "#E11D48" : "inherit" }} onClick={() => toggleLike(avis.id)}>
          <ThumbsUp size={13} fill={myLikes.has(avis.id) ? "currentColor" : "none"} />
          {(avis.likes_count + (myLikes.has(avis.id) ? 1 : 0)) > 0 && <span>{avis.likes_count + (myLikes.has(avis.id) ? 1 : 0)}</span>}
          <span>J&apos;aime</span>
        </button>
        <div style={{ flex: 1 }} />
        {!avis.is_moderated && (
          <button style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid #BBF7D0", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", background: "#F0FDF4", display: "inline-flex", alignItems: "center", gap: 5, color: "#15803D", opacity: loadingId === avis.id ? 0.5 : 1 }} disabled={loadingId === avis.id} onClick={() => approveAvis(avis.id)}>
            <CheckCircle size={13} />{loadingId === avis.id ? "..." : "Approuver"}
          </button>
        )}
        <button style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid #FECACA", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", background: "#FEF2F2", display: "inline-flex", alignItems: "center", gap: 5, color: "#DC2626", opacity: loadingId === avis.id ? 0.5 : 1 }} disabled={loadingId === avis.id} onClick={() => deleteAvis(avis.id)}>
          <Trash2 size={13} />{loadingId === avis.id ? "..." : "Supprimer"}
        </button>
      </div>
    </div>
  );
}

// ─── STATS CARD ───
export function StatsCard({ exc, reservations, avgRating }: any) {
  const stats = [
    { label: "Prix / pers.", val: `${exc.price_per_person} EUR`, Icon: Wallet },
    { label: "Durée", val: `${exc.duration_hours}h`, Icon: Clock },
    { label: "Capacité", val: `${exc.max_people} pers.`, Icon: Users },
    { label: "Note moy.", val: avgRating ? `${avgRating}/5` : "—", Icon: Star },
    { label: "Réservations", val: `${reservations.length}`, Icon: Calendar },
    { label: "Confirmées", val: `${reservations.filter((r: Reservation) => r.status === "confirmed").length}`, Icon: CheckCircle },
  ];

  return (
    <div style={{ background: "white", borderRadius: 18, border: "1px solid #F0F0F0", padding: "20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 7 }}>
        <Shield size={14} color="#2B96A8" strokeWidth={1.5} /> Statistiques
      </h3>
      {stats.map(s => (
        <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 10 }}>
          <span style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
            <s.Icon size={13} color="#9CA3AF" strokeWidth={1.5} />{s.label}
          </span>
          <span style={{ fontWeight: 800, color: "#111827" }}>{s.val}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PRESTATAIRE CARD ───
export function PrestatairesCard({ prestataire, prestName, setShowPrestataire }: any) {
  if (!prestataire) return null;
  return (
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
  );
}

// ─── PRESTATAIRE MODAL ───
export function PrestastaireModal({ showPrestataire, setShowPrestataire, prestataire, prestName }: any) {
  if (!showPrestataire || !prestataire) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => { if (e.target === e.currentTarget) setShowPrestataire(false); }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.2)", animation: "fadeUp .3s ease" }}>
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
              { Icon: MapPin, label: "Ville", val: prestataire.city || "—" },
              { Icon: Phone, label: "Téléphone", val: prestataire.phone || "—" },
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
  );
}

// ─── ACTIONS BUTTONS ───
export function ActionsButtons({ exc }: any) {
  return (
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
  );
}

// ─── EMPTY REVIEWS ───
export function EmptyReviews() {
  return (
    <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: 16, border: "1px solid #F0F0F0" }}>
      <MessageCircle size={36} color="#D1D5DB" strokeWidth={1.5} style={{ marginBottom: 10, display: "inline-block" }} />
      <p style={{ fontWeight: 700, color: "#374151", marginTop: 10 }}>Aucun avis</p>
    </div>
  );
}
