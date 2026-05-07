"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useToast } from "../../../../lib/useToast";
import { Toast } from "../../../components/ui/Toast";
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, Clock, Users,
  DollarSign, CheckCircle2, Hourglass, Star, Heart, MessageCircle,
  Pencil, Trash2, Eye, Building2, Package, Languages, CalendarDays,
  AlertCircle, Navigation, ShieldCheck, Info, ChevronDown, ChevronUp,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface DateDispo { date: string; slots: number; departure_time: string; }

interface Excursion {
  id: string; title: string; city: string; description: string;
  duration_hours: number; price_per_person: number; max_people: number;
  categories: string[]; languages: string[]; inclusions: string[];
  photos: string[]; rating: number; reviews_count: number; is_active: boolean;
  meeting_point?: string; difficulty?: string; min_age?: number;
  what_to_bring?: string; not_included?: string;
  important_info?: string; cancel_policy?: string;
  available_dates?: DateDispo[];
  depart_time?: string;
}

interface Avis {
  id: string; rating: number; comment: string; is_moderated: boolean;
  created_at: string; touriste_name: string;
  prestataire_response: string | null; likes_count: number; liked_by_me: boolean;
}

/* ─────────────────────────────────────────────
   Constantes
───────────────────────────────────────────── */
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1200&q=85&fit=crop";
const STARS = [1, 2, 3, 4, 5];

const DIFFICULTY_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  facile:    { label: "Facile",    color: "#059669", bg: "#F0FDF4", icon: "🟢" },
  modere:    { label: "Modéré",    color: "#D97706", bg: "#FFFBEB", icon: "🟡" },
  difficile: { label: "Difficile", color: "#DC2626", bg: "#FEF2F2", icon: "🔴" },
};

/* ─────────────────────────────────────────────
   Sous-composants
───────────────────────────────────────────── */
function DetailSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 18, border: "1px solid #F0F0F0", padding: "20px 22px", marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(43,150,168,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color="#2B96A8" />
        </div>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Pill({ label, color = "#2B96A8", bg = "rgba(43,150,168,.1)" }: { label: string; color?: string; bg?: string }) {
  return (
    <span style={{ padding: "5px 12px", background: bg, color, borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F9FAFB", fontSize: 13 }}>
      <span style={{ color: "#6B7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#111827", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Composant principal
───────────────────────────────────────────── */
export default function ExcursionDetailPrestataire({
  exc, avis: initialAvis, prestataireId, avgRating,
}: {
  exc: Excursion; avis: Avis[]; prestataireId: string; avgRating: string | null;
}) {
  const supabase = createClient();
  const [avis, setAvis] = useState(initialAvis);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showAllDates, setShowAllDates] = useState(false);

  const [replyingTo, setReplyingTo]   = useState<string | null>(null);
  const [replyText,  setReplyText]    = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingId,  setEditingId]    = useState<string | null>(null);
  const [editText,   setEditText]     = useState("");

  const { toast, showToast } = useToast();

  const photos  = exc.photos?.filter(Boolean).length ? exc.photos.filter(Boolean) : [FALLBACK];
  const pending  = avis.filter(a => !a.is_moderated).length;
  const approved = avis.filter(a => a.is_moderated);

  // Dates : tri chronologique, séparation passées / à venir
  const today = new Date().toISOString().slice(0, 10);
  const futureDates = (exc.available_dates || [])
    .filter(d => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastDates = (exc.available_dates || [])
    .filter(d => d.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const visibleDates = showAllDates ? futureDates : futureDates.slice(0, 5);

  /* ── Like ── */
  const toggleLike = async (avisId: string, liked: boolean, currentCount: number) => {
    setAvis(prev => prev.map(a => a.id === avisId
      ? { ...a, liked_by_me: !liked, likes_count: liked ? currentCount - 1 : currentCount + 1 } : a
    ));
    if (liked) {
      const { error } = await supabase.from("avis_likes").delete().eq("avis_id", avisId).eq("user_id", prestataireId);
      if (error) { setAvis(prev => prev.map(a => a.id === avisId ? { ...a, liked_by_me: liked, likes_count: currentCount } : a)); showToast("Erreur", false); }
      else await supabase.from("avis").update({ likes_count: currentCount - 1 }).eq("id", avisId);
    } else {
      const { error } = await supabase.from("avis_likes").insert({ avis_id: avisId, user_id: prestataireId });
      if (error) { setAvis(prev => prev.map(a => a.id === avisId ? { ...a, liked_by_me: liked, likes_count: currentCount } : a)); showToast("Erreur", false); }
      else await supabase.from("avis").update({ likes_count: currentCount + 1 }).eq("id", avisId);
    }
  };

  /* ── Réponses ── */
  const submitReply = async (avisId: string) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    const { error } = await supabase.from("avis").update({ prestataire_response: replyText.trim() }).eq("id", avisId);
    if (!error) { setAvis(prev => prev.map(a => a.id === avisId ? { ...a, prestataire_response: replyText.trim() } : a)); setReplyingTo(null); setReplyText(""); showToast("Réponse publiée !"); }
    else showToast("Erreur : " + error.message, false);
    setReplyLoading(false);
  };

  const saveEdit = async (avisId: string) => {
    if (!editText.trim()) return;
    setReplyLoading(true);
    const { error } = await supabase.from("avis").update({ prestataire_response: editText.trim() }).eq("id", avisId);
    if (!error) { setAvis(prev => prev.map(a => a.id === avisId ? { ...a, prestataire_response: editText.trim() } : a)); setEditingId(null); setEditText(""); showToast("Réponse modifiée !"); }
    else showToast("Erreur", false);
    setReplyLoading(false);
  };

  const deleteReply = async (avisId: string) => {
    if (!confirm("Supprimer votre réponse ?")) return;
    const { error } = await supabase.from("avis").update({ prestataire_response: null }).eq("id", avisId);
    if (!error) { setAvis(prev => prev.map(a => a.id === avisId ? { ...a, prestataire_response: null } : a)); showToast("Réponse supprimée"); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;font-family:'DM Sans',sans-serif}
        .thumb-p{width:72px;height:54px;border-radius:10px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;transition:all .2s;flex-shrink:0}
        .thumb-p.on{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,.15)}
        .thumb-p img{width:100%;height:100%;object-fit:cover}
        .avis-card{background:white;border-radius:18px;border:1px solid #F0F0F0;padding:20px 22px;margin-bottom:12px;transition:box-shadow .2s}
        .avis-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.07)}
        .reply-box{background:rgba(43,150,168,.05);border-radius:12px;padding:14px 16px;border-left:3px solid #2B96A8;margin-top:12px}
        .like-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s}
        .like-btn.liked{background:#FEF2F2;border-color:#FECACA;color:#E11D48}
        .like-btn:not(.liked){color:#6B7280}.like-btn:not(.liked):hover{background:#F9FAFB;border-color:#D1D5DB}
        .reply-btn{padding:7px 14px;border-radius:10px;border:1.5px solid #B2E3EB;background:white;cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s;color:#2B96A8;display:flex;align-items:center;gap:5px}
        .reply-btn:hover{background:rgba(43,150,168,.06)}
        .action-btn{padding:7px 14px;border-radius:10px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:5px}
        .date-chip{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#F8FAFC;border-radius:11px;border:1.5px solid #EEF2F7;margin-bottom:7px;font-size:13px;transition:border-color .15s}
        .date-chip:hover{border-color:#B2E3EB}
        .date-chip.past{opacity:.5}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease forwards}
      `}</style>

      <Toast toast={toast} />

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 13, color: "#9CA3AF" }}>
        <Link href="/prestataire/excursions" style={{ color: "#6B7280", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} /> Mes excursions
        </Link>
        <span>/</span>
        <span style={{ color: "#111827", fontWeight: 600 }}>{exc.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>

        {/* ══════════════ COLONNE GAUCHE ══════════════ */}
        <div>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {exc.categories?.map(c => (
                <Pill key={c} label={c} />
              ))}
              <span style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: exc.is_active ? "#F0FDF4" : "#F9FAFB", color: exc.is_active ? "#15803D" : "#9CA3AF", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                {exc.is_active ? "Publiée" : "Brouillon"}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", marginBottom: 6 }}>
              {exc.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: "#6B7280", display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={14} /> {exc.city}
              </span>
              <span style={{ fontSize: 14, color: "#6B7280", display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={14} /> {exc.duration_hours}h
              </span>
              <span style={{ fontSize: 14, color: "#6B7280", display: "flex", alignItems: "center", gap: 5 }}>
                <Users size={14} /> {exc.max_people} pers. max
              </span>
              {avgRating && (
                <span style={{ fontSize: 14, color: "#F59E0B", display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                  <Star size={14} fill="#F59E0B" /> {avgRating}/5
                </span>
              )}
            </div>
          </div>

          {/* Galerie */}
          <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "16/9", background: "#F3F4F6", marginBottom: 10, position: "relative" }}>
            <img src={photos[currentPhoto]} alt={exc.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity .3s" }}
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
            />
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
                <div style={{ position: "absolute", bottom: 12, right: 12, padding: "3px 10px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 700 }}>
                  {currentPhoto + 1}/{photos.length}
                </div>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
              {photos.map((p, i) => (
                <div key={i} className={`thumb-p ${currentPhoto === i ? "on" : ""}`} onClick={() => setCurrentPhoto(i)}>
                  <img src={p} alt="" />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <DetailSection icon={Info} title="Description">
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.85, margin: 0 }}>{exc.description}</p>
          </DetailSection>

          {/* Chiffres clés */}
          <DetailSection icon={DollarSign} title="Informations pratiques">
            <InfoRow label="Prix par personne"   value={<strong style={{ color: "#2B96A8", fontSize: 15 }}>{exc.price_per_person} EUR</strong>} />
            <InfoRow label="Durée"               value={`${exc.duration_hours} heure${exc.duration_hours > 1 ? "s" : ""}`} />
            <InfoRow label="Capacité maximale"   value={`${exc.max_people} personnes`} />
            {exc.depart_time && (
              <InfoRow label="Heure de départ"   value={exc.depart_time.slice(0, 5)} />
            )}
            {exc.meeting_point && (
              <InfoRow label="Point de rendez-vous" value={exc.meeting_point} />
            )}
            {exc.min_age && (
              <InfoRow label="Âge minimum"       value={`${exc.min_age} ans`} />
            )}
            {exc.difficulty && DIFFICULTY_STYLE[exc.difficulty] && (
              <InfoRow label="Niveau de difficulté" value={
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: DIFFICULTY_STYLE[exc.difficulty].bg, color: DIFFICULTY_STYLE[exc.difficulty].color }}>
                  {DIFFICULTY_STYLE[exc.difficulty].icon} {DIFFICULTY_STYLE[exc.difficulty].label}
                </span>
              } />
            )}
          </DetailSection>

          {/* Langues & Catégories */}
          <DetailSection icon={Languages} title="Langues parlées">
            {exc.languages?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {exc.languages.map(l => <Pill key={l} label={l} color="#7C3AED" bg="rgba(124,58,237,.08)" />)}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Non renseigné</p>
            )}
          </DetailSection>

          {/* Inclusions */}
          {exc.inclusions?.length > 0 && (
            <DetailSection icon={Package} title="Inclus dans le prix">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {exc.inclusions.map(i => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#F0FDF4", color: "#059669", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    <CheckCircle2 size={11} /> {i}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Non inclus & Ce qu'il faut apporter */}
          {(exc.not_included || exc.what_to_bring) && (
            <DetailSection icon={Package} title="Inclus et non inclus">
              <div style={{ display: "grid", gridTemplateColumns: exc.not_included && exc.what_to_bring ? "1fr 1fr" : "1fr", gap: 16 }}>
                {exc.not_included && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Non inclus</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{exc.not_included}</p>
                  </div>
                )}
                {exc.what_to_bring && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#D97706", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>À apporter</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{exc.what_to_bring}</p>
                  </div>
                )}
              </div>
            </DetailSection>
          )}

          {/* Informations importantes & annulation */}
          {(exc.important_info || exc.cancel_policy) && (
            <DetailSection icon={AlertCircle} title="Informations importantes">
              {exc.important_info && (
                <div style={{ padding: "12px 14px", background: "#FFFBEB", borderRadius: 12, border: "1px solid #FDE68A", marginBottom: exc.cancel_policy ? 12 : 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#D97706", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <AlertCircle size={12} /> Important
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{exc.important_info}</p>
                </div>
              )}
              {exc.cancel_policy && (
                <div style={{ padding: "12px 14px", background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#059669", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <ShieldCheck size={12} /> Politique d&apos;annulation
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, margin: 0 }}>{exc.cancel_policy}</p>
                </div>
              )}
            </DetailSection>
          )}

          {/* Disponibilités */}
          <DetailSection icon={CalendarDays} title={`Disponibilités${exc.available_dates?.length ? ` (${exc.available_dates.length})` : ""}`}>
            {!exc.available_dates?.length ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Aucune date renseignée</p>
            ) : (
              <>
                {/* Entête */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <span style={{ padding: "3px 10px", background: "#F0FDF4", color: "#059669", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {futureDates.length} à venir
                  </span>
                  {pastDates.length > 0 && (
                    <span style={{ padding: "3px 10px", background: "#F9FAFB", color: "#9CA3AF", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {pastDates.length} passée{pastDates.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Colonne header */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px 8px", borderBottom: "1px solid #F3F4F6", marginBottom: 8 }}>
                  {["Date", "Départ", "Places"].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px" }}>{h}</span>
                  ))}
                </div>

                {futureDates.length === 0 && (
                  <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>Aucune date à venir</p>
                )}

                {visibleDates.map(d => {
                  const dt = new Date(d.date + "T00:00:00");
                  return (
                    <div key={d.date} className="date-chip">
                      <span style={{ fontWeight: 700, color: "#111827", flex: 1 }}>
                        {dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#2B96A8", fontWeight: 700, minWidth: 70 }}>
                        <Clock size={11} /> {(d.departure_time || "—").slice(0, 5)}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#374151", fontWeight: 600, minWidth: 60, justifyContent: "flex-end" }}>
                        <Users size={11} color="#9CA3AF" /> {d.slots} pl.
                      </span>
                    </div>
                  );
                })}

                {futureDates.length > 5 && (
                  <button onClick={() => setShowAllDates(p => !p)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "9px", borderRadius: 10, background: "#F8FAFC", color: "#2B96A8", border: "1.5px solid #B2E3EB", cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>
                    {showAllDates ? <><ChevronUp size={13}/> Voir moins</> : <><ChevronDown size={13}/> Voir toutes les dates ({futureDates.length})</>}
                  </button>
                )}
              </>
            )}
          </DetailSection>

          {/* ════ AVIS ════ */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "#111827", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                Avis clients
                {avgRating && (
                  <span style={{ fontSize: 16, color: "#F59E0B", display: "flex", alignItems: "center", gap: 3 }}>
                    <Star size={15} fill="#F59E0B" /> {avgRating}
                  </span>
                )}
              </h2>
              <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                <span style={{ padding: "4px 10px", background: "#F0FDF4", color: "#15803D", borderRadius: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={11} /> {approved.length} publiés
                </span>
                {pending > 0 && (
                  <span style={{ padding: "4px 10px", background: "#FFFBEB", color: "#D97706", borderRadius: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <Hourglass size={11} /> {pending} en attente
                  </span>
                )}
              </div>
            </div>

            {avis.length === 0 ? (
              <div style={{ textAlign: "center", padding: "44px 20px", background: "white", borderRadius: 18, border: "1px solid #F0F0F0" }}>
                <MessageCircle size={40} style={{ color: "#E5E7EB", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>Aucun avis pour le moment</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>Les avis clients apparaîtront ici</p>
              </div>
            ) : (
              avis.map(a => (
                <div key={a.id} className="avis-card fu">
                  {!a.is_moderated && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#D97706", marginBottom: 10 }}>
                      <Hourglass size={11} /> En attente de modération
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                        {(a.touriste_name[0] || "C").toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{a.touriste_name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>
                          {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 1 }}>
                      {STARS.map(s => <Star key={s} size={15} fill={s <= a.rating ? "#F59E0B" : "none"} stroke={s <= a.rating ? "#F59E0B" : "#E5E7EB"} />)}
                    </div>
                  </div>

                  {a.comment && (
                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, paddingLeft: 50, marginBottom: 12 }}>
                      &ldquo;{a.comment}&rdquo;
                    </p>
                  )}

                  {/* Réponse existante */}
                  {a.prestataire_response && editingId !== a.id && (
                    <div className="reply-box">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: "#2B96A8", display: "flex", alignItems: "center", gap: 5, margin: 0 }}>
                          <Building2 size={13} /> Votre réponse
                        </p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="action-btn" onClick={() => { setEditingId(a.id); setEditText(a.prestataire_response || ""); }}
                            style={{ background: "#EFF9FB", color: "#2B96A8", fontSize: 11 }}>
                            <Pencil size={12} /> Modifier
                          </button>
                          <button className="action-btn" onClick={() => deleteReply(a.id)}
                            style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 11 }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0 }}>{a.prestataire_response}</p>
                    </div>
                  )}

                  {/* Formulaire modifier */}
                  {editingId === a.id && (
                    <div className="reply-box fu">
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#2B96A8", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <Pencil size={12} /> Modifier la réponse
                      </p>
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #B2E3EB", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none", marginBottom: 8, background: "white" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
                        onBlur={e => e.currentTarget.style.borderColor = "#B2E3EB"}
                      />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => { setEditingId(null); setEditText(""); }}
                          style={{ padding: "7px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          Annuler
                        </button>
                        <button onClick={() => saveEdit(a.id)} disabled={replyLoading || !editText.trim()}
                          style={{ padding: "7px 16px", background: editText.trim() ? "#2B96A8" : "#E5E7EB", color: editText.trim() ? "white" : "#9CA3AF", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: editText.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                          {replyLoading ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Formulaire nouvelle réponse */}
                  {replyingTo === a.id && (
                    <div className="reply-box fu">
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#2B96A8", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <MessageCircle size={12} /> Votre réponse
                      </p>
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                        placeholder="Répondez à cet avis..."
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #B2E3EB", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none", marginBottom: 8, background: "white" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
                        onBlur={e => e.currentTarget.style.borderColor = "#B2E3EB"}
                      />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          style={{ padding: "7px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          Annuler
                        </button>
                        <button onClick={() => submitReply(a.id)} disabled={replyLoading || !replyText.trim()}
                          style={{ padding: "7px 16px", background: replyText.trim() ? "#2B96A8" : "#E5E7EB", color: replyText.trim() ? "white" : "#9CA3AF", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: replyText.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                          {replyLoading ? "Envoi..." : "Publier la réponse"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                    <button className={`like-btn ${a.liked_by_me ? "liked" : ""}`} onClick={() => toggleLike(a.id, a.liked_by_me, a.likes_count)}>
                      <Heart size={15} fill={a.liked_by_me ? "currentColor" : "none"} />
                      {a.likes_count > 0 && <span>{a.likes_count}</span>}
                      <span>J&apos;aime</span>
                    </button>
                    {!a.prestataire_response && replyingTo !== a.id && (
                      <button className="reply-btn" onClick={() => { setReplyingTo(a.id); setReplyText(""); setEditingId(null); }}>
                        <MessageCircle size={13} /> Répondre
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══════════════ COLONNE DROITE ══════════════ */}
        <div style={{ position: "sticky", top: 80, height: "fit-content" }}>

          {/* Prix mis en avant */}
          <div style={{ background: "linear-gradient(135deg,#EFF9FB,#E0F5F8)", borderRadius: 20, border: "1px solid rgba(43,150,168,.2)", padding: "18px 20px", marginBottom: 14, textAlign: "center" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#2B96A8", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Prix par personne</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 4px", letterSpacing: "-1px" }}>{exc.price_per_person} <span style={{ fontSize: 16 }}>EUR</span></p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
              Commission 10% → vous recevez <strong style={{ color: "#059669" }}>{Math.round(exc.price_per_person * .9)} EUR</strong>
            </p>
          </div>

          {/* Statistiques */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #F0F0F0", padding: "20px", marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #F3F4F6" }}>
              Statistiques
            </h3>
            {[
              { label: "Durée",            val: `${exc.duration_hours}h`,                    icon: <Clock size={13} /> },
              { label: "Capacité max",     val: `${exc.max_people} pers.`,                   icon: <Users size={13} /> },
              { label: "Note moyenne",     val: avgRating ? `${avgRating}/5` : "—",          icon: <Star size={13} /> },
              { label: "Avis approuvés",   val: `${approved.length}`,                        icon: <CheckCircle2 size={13} /> },
              { label: "En attente",       val: `${pending}`,                                icon: <Hourglass size={13} /> },
              { label: "Dates à venir",    val: `${futureDates.length}`,                     icon: <CalendarDays size={13} /> },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "7px 0", borderBottom: "1px solid #F9FAFB" }}>
                <span style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>{s.icon} {s.label}</span>
                <span style={{ fontWeight: 700, color: "#111827" }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #F0F0F0", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href={`/excursions/${exc.id}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "11px 16px", background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .2s" }}>
                <Eye size={15} /> Voir la page publique
              </a>
              <a href={`/prestataire/excursions/${exc.id}/edit`}
                style={{ padding: "11px 16px", background: "rgba(43,150,168,.08)", color: "#2B96A8", border: "1px solid rgba(43,150,168,.2)", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Pencil size={15} /> Modifier l&apos;excursion
              </a>
              <Link href="/prestataire/excursions"
                style={{ padding: "11px 16px", background: "white", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <ArrowLeft size={15} /> Retour à mes excursions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}