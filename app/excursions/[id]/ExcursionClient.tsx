"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";
import {
  Heart, MapPin, Clock, Users, Star, MessageCircle,
  ChevronLeft, ChevronRight, Check, Globe, Send, X,
  Lock, ShieldCheck, RefreshCcw, HeadphonesIcon,
  ThumbsUp, CalendarDays, Tag, Camera, ChevronDown, ChevronUp, Loader2,
  Sparkles, Award, ArrowRight,
} from "lucide-react";
import TouristeNav from "@/app/components/touriste/TouristeNav";

interface Excursion {
  id: string; title: string; city: string; description: string;
  duration_hours: number; price_per_person: number; max_people: number;
  categories: string[]; languages: string[]; inclusions: string[];
  photos: string[]; rating: number; reviews_count: number;
  is_active: boolean; prestataire_id: string;
}
interface Prestataire {
  user_id: string; full_name: string; agency_name: string | null;
  avatar_url: string | null; city: string | null;
  description: string | null; phone: string | null;
}
interface Avis {
  id: string; rating: number; comment: string; created_at: string;
  touriste_name: string; touriste_avatar: string | null;
  prestataire_response: string | null; likes_count: number;
}

const STARS = [1, 2, 3, 4, 5];
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1400&q=90&fit=crop";
const CAT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Culture:      { text: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
  Archéologie:  { text: "#5B21B6", bg: "#EDE9FE", border: "#DDD6FE" },
  Nature:       { text: "#065F46", bg: "#D1FAE5", border: "#A7F3D0" },
  Gastronomie:  { text: "#9A3412", bg: "#FEE2E2", border: "#FECACA" },
  Aventure:     { text: "#1E3A5F", bg: "#DBEAFE", border: "#BFDBFE" },
  Relaxation:   { text: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');

:root {
  --primary: #0B4F6C;
  --accent: #E8A838;
  --sand: #F7F3EE;
  --ink: #12100E;
  --muted: #7A7068;
  --border: #EAE5DE;
  --white: #FFFEFB;
}

*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:var(--sand);color:var(--ink)}

/* Gallery */
.gallery-main {
  position:relative;
  height:580px;
  border-radius:28px;
  overflow:hidden;
  background:#1a1a2e;
}
.gallery-main img {
  width:100%; height:100%; object-fit:cover;
  transition:transform .7s cubic-bezier(.25,.46,.45,.94),opacity .4s;
}
.gallery-main:hover img { transform:scale(1.03); }
.gallery-overlay {
  position:absolute; inset:0;
  background:linear-gradient(to top, rgba(18,16,14,.65) 0%, transparent 50%);
  pointer-events:none;
}

/* Nav arrows */
.g-arrow {
  position:absolute; top:50%; transform:translateY(-50%);
  width:48px; height:48px; border-radius:50%;
  background:rgba(255,255,255,.12);
  border:1.5px solid rgba(255,255,255,.25);
  backdrop-filter:blur(12px);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all .2s; color:white;
}
.g-arrow:hover { background:rgba(255,255,255,.22); transform:translateY(-50%) scale(1.07); }

/* Thumbs */
.thumb-rail { display:flex; gap:8px; overflow-x:auto; padding:2px 0; }
.thumb-rail::-webkit-scrollbar { height:3px; }
.thumb-rail::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
.thumb {
  width:76px; height:58px; border-radius:12px; overflow:hidden;
  cursor:pointer; flex-shrink:0;
  border:2.5px solid transparent; transition:all .2s;
  opacity:.65;
}
.thumb.on { border-color:var(--accent); opacity:1; box-shadow:0 0 0 3px rgba(232,168,56,.2); }
.thumb:hover:not(.on) { opacity:.9; }
.thumb img { width:100%; height:100%; object-fit:cover; }

/* Cards */
.glass-card {
  background:var(--white);
  border-radius:22px;
  border:1px solid var(--border);
  box-shadow:0 2px 20px rgba(11,79,108,.06);
  transition:box-shadow .25s;
}
.glass-card:hover { box-shadow:0 8px 36px rgba(11,79,108,.1); }

/* Stat pill */
.stat-pill {
  display:flex; align-items:center; gap:10px;
  padding:14px 16px; border-radius:16px;
  border:1px solid var(--border);
  background:var(--white);
  transition:all .2s;
}
.stat-pill:hover { border-color:var(--primary); transform:translateY(-2px); box-shadow:0 6px 20px rgba(11,79,108,.08); }

/* Section heading */
.s-heading {
  font-family:'Cormorant Garamond',serif;
  font-size:26px; font-weight:700; color:var(--ink);
  letter-spacing:-.3px; line-height:1.2;
  margin-bottom:18px;
  display:flex; align-items:center; gap:12px;
}
.s-heading::before {
  content:'';
  display:block; width:4px; height:26px;
  border-radius:4px;
  background:linear-gradient(180deg, var(--primary), var(--accent));
  flex-shrink:0;
}

/* Inclusion chip */
.inc-chip {
  display:flex; align-items:center; gap:9px;
  padding:10px 14px; border-radius:12px;
  background:linear-gradient(135deg,#F0FDF9,#E6F7FF);
  border:1px solid #B2E8D8; font-size:13px; color:#0B4F6C;
  font-weight:600; transition:all .2s;
}
.inc-chip:hover { background:linear-gradient(135deg,#E6F7FF,#D6EFF9); transform:translateX(3px); }

/* Review */
.review-card {
  background:var(--white); border-radius:18px;
  border:1px solid var(--border); padding:20px;
  transition:all .25s;
}
.review-card:hover { box-shadow:0 8px 28px rgba(11,79,108,.07); transform:translateY(-2px); }

/* Like btn */
.like-btn {
  display:inline-flex; align-items:center; gap:5px;
  padding:7px 14px; border-radius:20px;
  border:1.5px solid var(--border); background:var(--white);
  cursor:pointer; font-size:12px; font-weight:700;
  font-family:'Outfit',sans-serif; transition:all .18s; color:var(--muted);
}
.like-btn.on { background:#FFF0F3; border-color:#FECDD3; color:#E11D48; }
.like-btn:not(.on):hover { border-color:var(--primary); color:var(--primary); }

/* CTA buttons */
.btn-book {
  width:100%; padding:16px;
  background:linear-gradient(135deg,#0B4F6C,#0D6B90);
  color:white; border:none; border-radius:16px;
  font-size:15px; font-weight:700;
  cursor:pointer; font-family:'Outfit',sans-serif;
  transition:all .22s;
  display:flex; align-items:center; justify-content:center; gap:9px;
  letter-spacing:.1px;
  box-shadow:0 6px 20px rgba(11,79,108,.3);
}
.btn-book:hover:not(:disabled) {
  background:linear-gradient(135deg,#0D3F5A,#0B5F82);
  transform:translateY(-2px);
  box-shadow:0 10px 28px rgba(11,79,108,.38);
}
.btn-book:disabled { background:#E5E7EB; color:#9CA3AF; cursor:not-allowed; box-shadow:none; }

.btn-msg {
  width:100%; padding:13px;
  background:transparent; color:var(--primary);
  border:2px solid #B8D9E8; border-radius:14px;
  font-size:14px; font-weight:700;
  cursor:pointer; font-family:'Outfit',sans-serif;
  transition:all .2s;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.btn-msg:hover { background:#EBF5FA; border-color:var(--primary); }

.btn-fav {
  width:100%; padding:12px;
  background:transparent; color:var(--muted);
  border:1.5px solid var(--border); border-radius:13px;
  font-size:13.5px; font-weight:600;
  cursor:pointer; font-family:'Outfit',sans-serif;
  transition:all .18s;
  display:flex; align-items:center; justify-content:center; gap:7px;
}
.btn-fav.on { background:#FFF0F3; color:#E11D48; border-color:#FECDD3; }
.btn-fav:hover:not(.on) { border-color:#B8D9E8; color:var(--primary); }

/* Guide card */
.guide-card {
  border-radius:16px; padding:14px 16px;
  border:1.5px solid var(--border); background:var(--white);
  cursor:pointer; transition:all .22s;
}
.guide-card:hover { border-color:var(--primary); box-shadow:0 6px 24px rgba(11,79,108,.12); }

/* Modal */
.overlay {
  position:fixed; inset:0; background:rgba(18,16,14,.55);
  z-index:600; display:flex; align-items:center; justify-content:center;
  padding:20px; backdrop-filter:blur(8px);
}
.modal {
  background:var(--white); border-radius:28px; padding:30px;
  width:100%; max-width:480px; max-height:88vh; overflow-y:auto;
  box-shadow:0 40px 100px rgba(18,16,14,.32);
}

/* Star btn */
.star-btn { background:none; border:none; cursor:pointer; padding:2px 3px; transition:transform .12s; }
.star-btn:hover { transform:scale(1.2); }

/* Animations */
@keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin { to{transform:rotate(360deg)} }
.fu { animation:fadeUp .35s ease forwards; }
.spin-anim { animation:spin .7s linear infinite; }

/* Scrollbar */
::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:#D4C9BC; border-radius:4px; }

input:focus,textarea:focus {
  border-color:var(--primary)!important;
  box-shadow:0 0 0 3px rgba(11,79,108,.1)!important;
  outline:none;
}

/* Counter btn */
.counter-btn {
  width:40px; height:40px; border:none;
  background:#F3F4F6; border-radius:10px;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:all .15s; font-family:'Outfit',sans-serif;
}
.counter-btn:hover:not(:disabled) { background:#E5E7EB; }
.counter-btn:disabled { opacity:.35; cursor:not-allowed; }
`;

export default function ExcursionClient({
  exc, prestataire, initialAvis, myLikedIds = [],
}: {
  exc: Excursion; prestataire: Prestataire | null;
  initialAvis: Avis[]; myLikedIds: string[];
}) {
  const supabase = createClient();
  const [avis,            setAvis]            = useState(initialAvis);
  const [likedIds,        setLikedIds]        = useState<Set<string>>(new Set(myLikedIds));
  const [user,            setUser]            = useState<{ id: string; full_name: string } | null>(null);
  const [isFav,           setIsFav]           = useState(false);
  const [favId,           setFavId]           = useState<string | null>(null);
  const [currentPhoto,    setCurrentPhoto]    = useState(0);
  const [showPrestataire, setShowPrestataire] = useState(false);
  const [descExpanded,    setDescExpanded]    = useState(false);
  const [myRating,        setMyRating]        = useState(0);
  const [hoverRating,     setHoverRating]     = useState(0);
  const [myComment,       setMyComment]       = useState("");
  const [avisLoading,     setAvisLoading]     = useState(false);
  const [avisSuccess,     setAvisSuccess]     = useState(false);
  const [avisError,       setAvisError]       = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showMsgModal,    setShowMsgModal]    = useState(false);
  const [msgText,         setMsgText]         = useState("");
  const [msgSending,      setMsgSending]      = useState(false);
  const [msgSent,         setMsgSent]         = useState(false);
  const [showCheckout,    setShowCheckout]    = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", uid).single();
      setUser({ id: uid, full_name: profile?.full_name || data.user.email?.split("@")[0] || "Touriste" });
      supabase.from("favoris").select("id").eq("touriste_id", uid).eq("excursion_id", exc.id)
        .maybeSingle().then(({ data: fav }) => { if (fav) { setIsFav(true); setFavId(fav.id); } });
      supabase.from("avis").select("id").eq("touriste_id", uid).eq("excursion_id", exc.id)
        .maybeSingle().then(({ data: ex }) => setAlreadyReviewed(!!ex));
    });
  }, [exc.id]);

  const photos    = exc.photos?.filter(Boolean).length ? exc.photos.filter(Boolean) : [FALLBACK];
  const avgRating = avis.length
    ? (avis.reduce((s, a) => s + a.rating, 0) / avis.length).toFixed(1)
    : exc.rating ? exc.rating.toFixed(1) : null;
  const prestName = prestataire?.agency_name || prestataire?.full_name || "Prestataire";
  const catStyle  = (cat: string) => CAT_COLORS[cat] || { text: "#0B4F6C", bg: "#EBF5FA", border: "#B8D9E8" };
  const LONG_DESC = exc.description?.length > 400;

  const toggleFav = async () => {
    if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; return; }
    if (isFav && favId) {
      await supabase.from("favoris").delete().eq("id", favId);
      setIsFav(false); setFavId(null);
    } else {
      const { data } = await supabase.from("favoris").insert({ touriste_id: user.id, excursion_id: exc.id }).select("id").single();
      if (data) { setIsFav(true); setFavId(data.id); }
    }
  };

  const toggleLike = async (avisId: string) => {
    if (!user) { window.location.href = "/auth"; return; }
    const liked = likedIds.has(avisId);
    setLikedIds(prev => { const n = new Set(prev); liked ? n.delete(avisId) : n.add(avisId); return n; });
    setAvis(prev => prev.map(a => a.id === avisId
      ? { ...a, likes_count: liked ? Math.max(0, a.likes_count - 1) : a.likes_count + 1 } : a
    ));
    if (liked) {
      await supabase.from("avis_likes").delete().eq("avis_id", avisId).eq("user_id", user.id);
    } else {
      await supabase.from("avis_likes").insert({ avis_id: avisId, user_id: user.id });
    }
  };

  const submitAvis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/auth"; return; }
    if (myRating === 0) { setAvisError("Choisissez une note."); return; }
    const cleanComment = sanitizeText(myComment.trim());
    if (!cleanComment) { setAvisError("Écrivez un commentaire."); return; }
    setAvisLoading(true); setAvisError(null);
    const { error } = await supabase.from("avis").insert({
      excursion_id: exc.id, touriste_id: user.id,
      rating: myRating, comment: cleanComment,
      reservation_id: null, is_moderated: false,
    });
    setAvisLoading(false);
    if (error) { setAvisError(error.code === "23505" ? "Vous avez déjà soumis un avis." : error.message); return; }
    setAvisSuccess(true); setAlreadyReviewed(true);
  };

  const sendMessage = async () => {
    if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; return; }
    const cleanMsg = sanitizeText(msgText.trim());
    if (!cleanMsg || !prestataire || msgSending) return;
    setMsgSending(true);
    const { data: existing } = await supabase.from("conversations")
      .select("id").eq("touriste_id", user.id).eq("prestataire_id", exc.prestataire_id).eq("excursion_id", exc.id).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: newConv } = await supabase.from("conversations").insert({
        touriste_id: user.id, prestataire_id: exc.prestataire_id, excursion_id: exc.id,
        touriste_name: sanitizeText(user.full_name),
        prestataire_name: sanitizeText(prestataire.agency_name || prestataire.full_name),
      }).select().single();
      convId = newConv?.id;
    }
    if (convId) {
      await supabase.from("messages").insert({ conversation_id: convId, expediteur_id: user.id, contenu: cleanMsg, lu: false });
      setMsgSent(true); setMsgText("");
      setTimeout(() => { setShowMsgModal(false); setMsgSent(false); }, 2200);
    }
    setMsgSending(false);
  };

  return (
    <>
      <style>{CSS}</style>
      <TouristeNav />

      {/* ── Hero banner with breadcrumb ── */}
      <div style={{ background: "#FFFEFB", borderBottom: "1px solid #EAE5DE", padding: "14px 32px 0" }}>
        <div style={{ maxWidth: 1380, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 14 }}>
            <Link href="/excursions" style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 5, transition: "color .15s" }}>
              <ChevronLeft size={13} /> Excursions
            </Link>
            <span style={{ color: "#CBD5E1", fontSize: 11 }}>›</span>
            <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{sanitizeText(exc.city)}</span>
            <span style={{ color: "#CBD5E1", fontSize: 11 }}>›</span>
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sanitizeText(exc.title)}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 32px 80px" }}>

        {/* ── Title block ── */}
        <div style={{ background: "#FFFEFB", margin: "0 -32px 0", padding: "28px 32px 32px", borderBottom: "1px solid #EAE5DE" }}>
          <div style={{ maxWidth: 1380, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {exc.categories?.map(c => {
                const cs = catStyle(c);
                return (
                  <span key={c} style={{ padding: "4px 13px", background: cs.bg, color: cs.text, borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${cs.border}`, letterSpacing: ".3px" }}>
                    {sanitizeText(c)}
                  </span>
                );
              })}
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 700, color: "#12100E", letterSpacing: "-.5px", lineHeight: 1.1, marginBottom: 16, fontStyle: "italic" }}>
              {sanitizeText(exc.title)}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              {[
                { icon: <MapPin size={13} color="#7A7068" />, label: sanitizeText(exc.city) },
                { icon: <Clock size={13} color="#7A7068" />, label: `${exc.duration_hours}h de découverte` },
                { icon: <Users size={13} color="#7A7068" />, label: `Max ${exc.max_people} personnes` },
              ].map(m => (
                <span key={m.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7A7068", fontWeight: 500 }}>
                  {m.icon}{m.label}
                </span>
              ))}
              {avgRating && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "#FFFBEB", borderRadius: 20, border: "1px solid #FDE68A" }}>
                  <Star size={12} fill="#E8A838" color="#E8A838" strokeWidth={0} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#92400E" }}>{avgRating}</span>
                  <span style={{ fontSize: 12, color: "#B45309" }}>({avis.length} avis)</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, marginTop: 28, alignItems: "start" }}>

          {/* ─── LEFT ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Gallery */}
            <div>
              <div className="gallery-main">
                <img
                  src={photos[currentPhoto]} alt={sanitizeText(exc.title)}
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />
                <div className="gallery-overlay" />

                {/* Counter badge */}
                {photos.length > 1 && (
                  <div style={{ position: "absolute", top: 18, left: 18, display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "rgba(18,16,14,.5)", backdropFilter: "blur(12px)", borderRadius: 20, color: "white", fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,.15)" }}>
                    <Camera size={12} />{currentPhoto + 1} / {photos.length}
                  </div>
                )}

                {/* Fav button */}
                <button onClick={toggleFav}
                  style={{ position: "absolute", top: 18, right: 18, width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.15)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                >
                  <Heart size={19} fill={isFav ? "#E11D48" : "none"} color={isFav ? "#E11D48" : "white"} strokeWidth={2} />
                </button>

                {/* Title overlay */}
                <div style={{ position: "absolute", bottom: 22, left: 24, right: 24 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, color: "white", fontStyle: "italic", textShadow: "0 2px 12px rgba(0,0,0,.5)", lineHeight: 1.2 }}>
                    {sanitizeText(exc.city)}
                  </p>
                </div>

                {/* Arrows */}
                {photos.length > 1 && (
                  <>
                    <button className="g-arrow" style={{ left: 14 }} onClick={() => setCurrentPhoto(p => (p - 1 + photos.length) % photos.length)}>
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <button className="g-arrow" style={{ right: 14 }} onClick={() => setCurrentPhoto(p => (p + 1) % photos.length)}>
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="thumb-rail" style={{ marginTop: 10 }}>
                  {photos.map((p, i) => (
                    <div key={i} className={`thumb ${currentPhoto === i ? "on" : ""}`} onClick={() => setCurrentPhoto(i)}>
                      <img src={p} alt="" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { icon: <Clock size={20} color="#0B4F6C" />, label: "Durée", val: `${exc.duration_hours}h`, sub: "de visite" },
                { icon: <Users size={20} color="#5B21B6" />, label: "Groupe", val: `${exc.max_people}`, sub: "personnes max" },
                { icon: <Star size={20} fill="#E8A838" color="#E8A838" strokeWidth={0} />, label: "Note", val: avgRating ? `${avgRating}/5` : "Nouveau", sub: `${avis.length} avis` },
                { icon: <Globe size={20} color="#065F46" />, label: "Langues", val: `${exc.languages?.length || 1}`, sub: "disponibles" },
              ].map(s => (
                <div key={s.label} className="stat-pill">
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{s.val}</p>
                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, fontWeight: 500 }}>{s.label}</p>
                    <p style={{ fontSize: 9, color: "#B5AFA9", marginTop: 1 }}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="glass-card" style={{ padding: "26px 28px" }}>
              <h2 className="s-heading">À propos de cette excursion</h2>
              <p style={{ fontSize: 14.5, color: "#3D3730", lineHeight: 1.95, fontWeight: 400 }}>
                {LONG_DESC && !descExpanded
                  ? <>{sanitizeText(exc.description.slice(0, 400))}<span style={{ color: "#B5AFA9" }}>…</span></>
                  : sanitizeText(exc.description)
                }
              </p>
              {LONG_DESC && (
                <button onClick={() => setDescExpanded(p => !p)}
                  style={{ marginTop: 14, background: "none", border: "none", color: "var(--primary)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit',sans-serif", padding: 0, transition: "gap .2s" }}>
                  {descExpanded ? <><ChevronUp size={15} />Réduire</> : <><ChevronDown size={15} />Lire la suite</>}
                </button>
              )}
            </div>

            {/* Inclusions */}
            {exc.inclusions?.length > 0 && (
              <div className="glass-card" style={{ padding: "26px 28px" }}>
                <h2 className="s-heading">Ce qui est inclus</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {exc.inclusions.map(inc => (
                    <div key={inc} className="inc-chip">
                      <div style={{ width: 22, height: 22, borderRadius: 8, background: "linear-gradient(135deg,#0B4F6C,#0D6B90)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                      <span>{sanitizeText(inc)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {exc.languages?.length > 0 && (
              <div className="glass-card" style={{ padding: "26px 28px" }}>
                <h2 className="s-heading">Langues disponibles</h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {exc.languages.map(l => (
                    <span key={l} style={{ padding: "9px 18px", background: "var(--sand)", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "var(--primary)", border: "1.5px solid #D4C9BC", display: "flex", alignItems: "center", gap: 7, transition: "all .2s" }}>
                      <Globe size={13} color="#0B4F6C" />{sanitizeText(l)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ══ AVIS ══ */}
            <div>
              {/* Header avis */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, color: "var(--ink)", fontStyle: "italic" }}>
                    Avis des voyageurs
                  </h2>
                  {avgRating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 13px", background: "#FFFBEB", borderRadius: 20, border: "1px solid #FDE68A" }}>
                      <Star size={13} fill="#E8A838" color="#E8A838" strokeWidth={0} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#92400E" }}>{avgRating}</span>
                      <span style={{ fontSize: 12, color: "#B45309" }}>/ 5</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{avis.length} avis</span>
              </div>

              {/* Form avis */}
              {user && !alreadyReviewed && !avisSuccess && (
                <div className="fu glass-card" style={{ padding: "24px 26px", marginBottom: 16, border: "1.5px solid #D4C9BC" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                    <Sparkles size={16} color="#E8A838" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Partagez votre expérience</h3>
                  </div>
                  {avisError && (
                    <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                      <X size={14} />{avisError}
                    </div>
                  )}
                  <form onSubmit={submitAvis}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 16 }}>
                      {STARS.map(s => (
                        <button key={s} type="button" className="star-btn"
                          onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setMyRating(s)}>
                          <Star size={30} fill={s <= (hoverRating || myRating) ? "#E8A838" : "none"} color={s <= (hoverRating || myRating) ? "#E8A838" : "#D4C9BC"} strokeWidth={1.5} />
                        </button>
                      ))}
                      {myRating > 0 && (
                        <span style={{ marginLeft: 10, fontSize: 13, color: "var(--primary)", fontWeight: 700, background: "#EBF5FA", padding: "4px 12px", borderRadius: 20 }}>
                          {["", "Très déçu", "Décevant", "Bien", "Très bien", "Excellent !"][myRating]}
                        </span>
                      )}
                    </div>
                    <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={4} required
                      placeholder="Décrivez votre expérience..."
                      style={{ width: "100%", padding: "13px 16px", border: "1.5px solid var(--border)", borderRadius: 14, fontSize: 14, fontFamily: "'Outfit',sans-serif", resize: "vertical", color: "var(--ink)", background: "var(--sand)", transition: "all .2s", lineHeight: 1.7 }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                      <button type="submit" disabled={avisLoading || myRating === 0}
                        style={{ padding: "12px 26px", background: myRating > 0 ? "linear-gradient(135deg,#0B4F6C,#0D6B90)" : "#E5E7EB", color: myRating > 0 ? "white" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: myRating > 0 ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif", transition: "all .2s", display: "flex", alignItems: "center", gap: 7, boxShadow: myRating > 0 ? "0 4px 14px rgba(11,79,108,.25)" : "none" }}>
                        {avisLoading ? <><Loader2 size={15} className="spin-anim" />Envoi...</> : <><Send size={14} />Publier mon avis</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {avisSuccess && (
                <div style={{ padding: "16px 20px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 16, marginBottom: 18, fontSize: 14, color: "#065F46", fontWeight: 600, display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={15} color="#059669" strokeWidth={3} />
                  </div>
                  Votre avis a été soumis ! Il sera publié après modération.
                </div>
              )}
              {alreadyReviewed && !avisSuccess && (
                <div style={{ padding: "12px 16px", background: "#EBF5FA", border: "1px solid #B8D9E8", borderRadius: 14, marginBottom: 16, fontSize: 13, color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                  <Award size={14} />Vous avez déjà soumis un avis pour cette excursion.
                </div>
              )}
              {!user && (
                <div style={{ padding: "20px 24px", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 18, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Vous avez vécu cette excursion ?</p>
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>Connectez-vous pour partager votre avis</p>
                  </div>
                  <Link href="/auth" style={{ padding: "11px 22px", background: "linear-gradient(135deg,#0B4F6C,#0D6B90)", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(11,79,108,.25)" }}>
                    Se connecter
                  </Link>
                </div>
              )}

              {/* Liste avis */}
              {avis.length === 0 ? (
                <div style={{ textAlign: "center", padding: "52px 20px", background: "var(--white)", borderRadius: 22, border: "1.5px dashed var(--border)" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <MessageCircle size={28} color="#B5AFA9" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Aucun avis pour le moment</p>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {avis.map(a => (
                    <div key={a.id} className="review-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#0B4F6C,#0D6B90)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, fontWeight: 800, border: "2px solid #EAE5DE" }}>
                            {a.touriste_avatar
                              ? <img src={a.touriste_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : (a.touriste_name?.[0] || "T").toUpperCase()
                            }
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{sanitizeText(a.touriste_name || "Voyageur")}</p>
                            <p style={{ fontSize: 11, color: "#B5AFA9", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <CalendarDays size={10} />
                              {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                          {STARS.map(s => <Star key={s} size={13} fill={s <= a.rating ? "#E8A838" : "#EAE5DE"} color={s <= a.rating ? "#E8A838" : "#EAE5DE"} strokeWidth={0} />)}
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginLeft: 4 }}>{a.rating}/5</span>
                        </div>
                      </div>

                      {a.comment && (
                        <p style={{ fontSize: 14, color: "#3D3730", lineHeight: 1.8, paddingLeft: 56, marginBottom: 12, fontStyle: "italic" }}>
                          &ldquo;{sanitizeText(a.comment)}&rdquo;
                        </p>
                      )}

                      {a.prestataire_response && (
                        <div style={{ marginLeft: 56, padding: "12px 16px", background: "linear-gradient(135deg,#EBF5FA,#F0F8FF)", borderRadius: 12, borderLeft: "3px solid var(--primary)", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#0B4F6C,#0D6B90)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 800 }}>
                              {prestataire?.avatar_url ? <img src={prestataire.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : sanitizeText(prestName)[0].toUpperCase()}
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)" }}>{sanitizeText(prestName)}</p>
                            <span style={{ fontSize: 10, color: "#B8D9E8", fontWeight: 600 }}>· Guide</span>
                          </div>
                          <p style={{ fontSize: 13, color: "#3D3730", lineHeight: 1.7 }}>{sanitizeText(a.prestataire_response)}</p>
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                        <button className={`like-btn ${likedIds.has(a.id) ? "on" : ""}`} onClick={() => toggleLike(a.id)}>
                          <ThumbsUp size={13} fill={likedIds.has(a.id) ? "#E11D48" : "none"} strokeWidth={2} />
                          {a.likes_count > 0 && <span>{a.likes_count}</span>}
                          <span>Utile</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div style={{ position: "sticky", top: 24, height: "fit-content", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Booking card */}
            <div className="glass-card" style={{ padding: "26px", boxShadow: "0 16px 52px rgba(11,79,108,.13)" }}>

              {/* Price */}
              <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, fontWeight: 700, color: "var(--ink)", lineHeight: 1, letterSpacing: "-1px" }}>{exc.price_per_person}</span>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>TND</span>
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>par personne</p>
                  </div>
                </div>
                {avgRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {STARS.map(s => <Star key={s} size={13} fill={s <= Math.round(Number(avgRating)) ? "#E8A838" : "#EAE5DE"} color={s <= Math.round(Number(avgRating)) ? "#E8A838" : "#EAE5DE"} strokeWidth={0} />)}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginLeft: 4 }}>{avgRating}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>· {avis.length} avis</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ background: "var(--sand)", borderRadius: 14, padding: "4px 0", marginBottom: 20 }}>
                {[
                  { icon: <Clock size={13} color="var(--muted)" />, label: "Durée", val: `${exc.duration_hours} heures` },
                  { icon: <Users size={13} color="var(--muted)" />, label: "Groupe", val: `Max ${exc.max_people} pers.` },
                  { icon: <MapPin size={13} color="var(--muted)" />, label: "Ville", val: sanitizeText(exc.city) },
                  { icon: <Tag size={13} color="var(--muted)" />, label: "Type", val: sanitizeText(exc.categories?.[0] || "—") },
                ].map((r, i) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7, fontWeight: 500 }}>{r.icon}{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <button className="btn-book"
                onClick={() => {
                  if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; return; }
                  setShowCheckout(true);
                }}>
                {user ? <><CalendarDays size={16} />Réserver maintenant</> : <><Lock size={15} />Connexion pour réserver</>}
              </button>

              <div style={{ height: 8 }} />
              {prestataire && (
                <button className="btn-msg"
                  onClick={() => {
                    if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; return; }
                    setShowMsgModal(true);
                  }}>
                  <MessageCircle size={15} />Contacter le guide
                </button>
              )}
              <div style={{ height: 7 }} />
              <button className={`btn-fav ${isFav ? "on" : ""}`} onClick={toggleFav}>
                <Heart size={14} fill={isFav ? "#E11D48" : "none"} strokeWidth={2} />
                {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>

              {/* Trust badges */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  { icon: <Lock size={12} color="#065F46" />, text: "Paiement 100% sécurisé", bg: "#F0FDF4", c: "#065F46" },
                  { icon: <RefreshCcw size={12} color="#0B4F6C" />, text: "Annulation gratuite 24h avant", bg: "#EBF5FA", c: "#0B4F6C" },
                  { icon: <HeadphonesIcon size={12} color="#5B21B6" />, text: "Support disponible 7j/7", bg: "#EDE9FE", c: "#5B21B6" },
                ].map(g => (
                  <div key={g.text} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", background: g.bg, borderRadius: 9 }}>
                    {g.icon}
                    <p style={{ fontSize: 12, color: g.c, fontWeight: 600 }}>{g.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guide card */}
            {prestataire && (
              <div className="glass-card" style={{ padding: "20px 22px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#B5AFA9", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Votre guide</p>
                <div className="guide-card" onClick={() => setShowPrestataire(true)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
                      {prestataire.avatar_url
                        ? <img src={prestataire.avatar_url} alt={sanitizeText(prestName)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0B4F6C,#0D6B90)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18 }}>{sanitizeText(prestName)[0].toUpperCase()}</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sanitizeText(prestName)}</p>
                      {prestataire.city && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}><MapPin size={9} />{sanitizeText(prestataire.city)}</p>}
                      <p style={{ fontSize: 11, color: "#065F46", fontWeight: 700, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><ShieldCheck size={11} />Vérifié</p>
                    </div>
                    <ArrowRight size={15} color="#B5AFA9" />
                  </div>
                  <p style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, marginTop: 10, textAlign: "center" }}>Voir le profil complet →</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MODAL MESSAGE ═══ */}
      {showMsgModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) { setShowMsgModal(false); setMsgSent(false); } }}>
          <div className="modal fu">
            {msgSent ? (
              <div style={{ textAlign: "center", padding: "36px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", border: "2px solid #6EE7B7" }}>
                  <Check size={28} color="#059669" strokeWidth={2.5} />
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Message envoyé !</h3>
                <p style={{ fontSize: 14, color: "var(--muted)" }}>Redirection vers vos messages...</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Contacter le guide</h3>
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>À propos de : {sanitizeText(exc.title)}</p>
                  </div>
                  <button onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    style={{ background: "var(--sand)", border: "none", cursor: "pointer", color: "var(--muted)", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                    <X size={15} />
                  </button>
                </div>
                {prestataire && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--sand)", borderRadius: 14, marginBottom: 18, border: "1px solid var(--border)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#0B4F6C,#0D6B90)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14 }}>
                      {prestataire.avatar_url ? <img src={prestataire.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : sanitizeText(prestName)[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{sanitizeText(prestName)}</p>
                      <p style={{ fontSize: 11, color: "#065F46", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><ShieldCheck size={11} />Prestataire vérifié</p>
                    </div>
                  </div>
                )}
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Bonjour, j'aimerais avoir plus d'informations..."
                  style={{ width: "100%", height: 120, padding: "13px 16px", border: "1.5px solid var(--border)", borderRadius: 14, fontSize: 14, fontFamily: "'Outfit',sans-serif", resize: "none", color: "var(--ink)", lineHeight: 1.7, transition: "all .2s", background: "var(--sand)" }}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    style={{ flex: 1, padding: 12, border: "1.5px solid var(--border)", borderRadius: 12, background: "none", cursor: "pointer", fontSize: 14, fontFamily: "'Outfit',sans-serif", color: "var(--muted)", transition: "all .15s" }}>
                    Annuler
                  </button>
                  <button onClick={sendMessage} disabled={!msgText.trim() || msgSending}
                    style={{ flex: 2, padding: 12, border: "none", borderRadius: 12, background: msgText.trim() ? "linear-gradient(135deg,#0B4F6C,#0D6B90)" : "#E5E7EB", color: msgText.trim() ? "white" : "#9CA3AF", cursor: msgText.trim() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: msgText.trim() ? "0 4px 14px rgba(11,79,108,.25)" : "none" }}>
                    {msgSending ? <><Loader2 size={15} className="spin-anim" />Envoi...</> : <><Send size={14} />Envoyer</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL RÉSERVATION ═══ */}
      {showCheckout && (
        <CheckoutModal exc={exc} onClose={() => setShowCheckout(false)} />
      )}

      {/* ═══ MODAL PRESTATAIRE ═══ */}
      {showPrestataire && prestataire && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowPrestataire(false); }}>
          <div className="modal fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: "var(--ink)", fontStyle: "italic" }}>Votre guide</h2>
              <button onClick={() => setShowPrestataire(false)}
                style={{ background: "var(--sand)", border: "none", cursor: "pointer", color: "var(--muted)", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid var(--border)", boxShadow: "0 6px 22px rgba(0,0,0,.1)" }}>
                {prestataire.avatar_url
                  ? <img src={prestataire.avatar_url} alt={sanitizeText(prestName)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0B4F6C,#0D6B90)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 30 }}>{sanitizeText(prestName)[0].toUpperCase()}</div>
                }
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 5 }}>{sanitizeText(prestName)}</h3>
                {prestataire.full_name && prestataire.agency_name && (
                  <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}><Users size={12} />{sanitizeText(prestataire.full_name)}</p>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ padding: "4px 12px", background: "#D1FAE5", color: "#065F46", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid #A7F3D0", display: "flex", alignItems: "center", gap: 4 }}>
                    <ShieldCheck size={11} />Vérifié
                  </span>
                  {prestataire.city && (
                    <span style={{ padding: "4px 12px", background: "var(--sand)", color: "var(--muted)", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} />{sanitizeText(prestataire.city)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {prestataire.description && (
              <div style={{ background: "var(--sand)", borderRadius: 14, padding: "16px 18px", marginBottom: 18, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#B5AFA9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>À propos</p>
                <p style={{ fontSize: 14, color: "#3D3730", lineHeight: 1.8 }}>{sanitizeText(prestataire.description)}</p>
              </div>
            )}
            {prestataire.phone && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "12px 0", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
                <span style={{ color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}><HeadphonesIcon size={13} />Téléphone</span>
                <span style={{ fontWeight: 700, color: "var(--ink)" }}>{sanitizeText(prestataire.phone)}</span>
              </div>
            )}
            <button onClick={() => setShowPrestataire(false)} className="btn-book" style={{ marginTop: 8 }}>Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}