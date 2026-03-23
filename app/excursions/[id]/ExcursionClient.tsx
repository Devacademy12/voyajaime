"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  Heart, MapPin, Clock, Users, Star, MessageCircle,
  ChevronLeft, ChevronRight, Check, Globe, Send, X,
  Minus, Plus, Lock, ShieldCheck, RefreshCcw, HeadphonesIcon,
  ThumbsUp, CalendarDays, Tag, Camera, ChevronDown, ChevronUp, Loader2,
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
const CAT_COLORS: Record<string, string> = {
  Culture:"#2B96A8", Archéologie:"#8B5CF6", Nature:"#059669",
  Gastronomie:"#D97706", Aventure:"#DC2626", Relaxation:"#2563EB",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#F8F9FA;color:#111827}
.star-btn{background:none;border:none;cursor:pointer;font-size:30px;line-height:1;transition:transform .12s;padding:1px 2px}
.star-btn:hover{transform:scale(1.18)}
.thumb-strip::-webkit-scrollbar{height:4px}
.thumb-strip::-webkit-scrollbar-track{background:transparent}
.thumb-strip::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px}
.thumb{width:80px;height:60px;border-radius:10px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;transition:all .18s;flex-shrink:0}
.thumb.on{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,.15)}
.thumb img{width:100%;height:100%;object-fit:cover}
.avis-item{background:white;border-radius:16px;border:1px solid #EBEBEB;padding:20px;transition:box-shadow .2s}
.avis-item:hover{box-shadow:0 6px 22px rgba(0,0,0,.07)}
.like-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s}
.like-btn.on{background:#FEF2F2;border-color:#FECACA;color:#E11D48}
.like-btn:not(.on):hover{background:#F9FAFB;border-color:#D1D5DB}
.prest-card{cursor:pointer;transition:all .2s;border-radius:16px;padding:14px 16px;border:1.5px solid #F0F0F0;background:white}
.prest-card:hover{border-color:#2B96A8;box-shadow:0 4px 18px rgba(43,150,168,.12)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
.modal{background:white;border-radius:24px;padding:28px;width:100%;max-width:460px;max-height:88vh;overflow-y:auto;box-shadow:0 28px 80px rgba(0,0,0,.28)}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fu{animation:fadeUp .3s ease forwards}
.nav-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 14px rgba(0,0,0,.18);transition:all .18s;backdrop-filter:blur(6px)}
.nav-arrow:hover{background:white;transform:translateY(-50%) scale(1.08)}
.cta-primary{width:100%;padding:15px;background:#111827;color:white;border:none;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.cta-primary:hover:not(:disabled){background:#1f2937;transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.2)}
.cta-primary:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed}
.cta-sec{width:100%;padding:13px;background:white;color:#2B96A8;border:2px solid #B2E3EB;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px}
.cta-sec:hover{background:#EFF9FB}
.fav-btn{width:100%;padding:12px;background:#F9FAFB;color:#374151;border:1.5px solid #E5E7EB;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px}
.fav-btn.on{background:#FEF2F2;color:#DC2626;border-color:#FECACA}
.fav-btn:hover{border-color:#2B96A8;color:#2B96A8}
.counter-btn{width:42px;height:42px;border:none;background:#F3F4F6;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;font-family:'DM Sans',sans-serif}
.counter-btn:hover:not(:disabled){background:#E5E7EB}
.counter-btn:disabled{opacity:.4;cursor:not-allowed}
input:focus{border-color:#2B96A8!important;box-shadow:0 0 0 3px rgba(43,150,168,.08)!important;outline:none}
textarea:focus{border-color:#2B96A8!important;box-shadow:0 0 0 3px rgba(43,150,168,.08)!important;outline:none}
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
  const [people,          setPeople]          = useState(1);
  const [date,            setDate]            = useState("");

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
  const totalPrice = exc.price_per_person * people;
  const commission = Math.round(totalPrice * 0.1);
  const prestName  = prestataire?.agency_name || prestataire?.full_name || "Prestataire";
  const catColor   = (cat: string) => CAT_COLORS[cat] || "#2B96A8";

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
    // ✅ XSS : nettoie le commentaire avant envoi
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
    // ✅ XSS : nettoie le message avant envoi
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

  const LONG_DESC = exc.description?.length > 380;

  return (
    <>
      <style>{CSS}</style>
      <TouristeNav />

      <div style={{ maxWidth:1400, margin:"0 auto", padding:"32px 32px 100px" }}>

        {/* Titre + meta */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:10 }}>
            {exc.categories?.map(c => (
              <span key={c} style={{ padding:"4px 12px", background:`${catColor(c)}15`, color:catColor(c), borderRadius:20, fontSize:11, fontWeight:700, border:`1px solid ${catColor(c)}30` }}>
                {/* ✅ XSS : sanitize les catégories */}
                {sanitizeText(c)}
              </span>
            ))}
          </div>
          {/* ✅ XSS : sanitize le titre principal */}
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3vw,38px)", fontWeight:900, color:"#111827", letterSpacing:"-0.5px", lineHeight:1.12, marginBottom:10 }}>
            {sanitizeText(exc.title)}
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#6B7280", fontWeight:600 }}>
              {/* ✅ XSS : sanitize la ville */}
              <MapPin size={13} color="#2B96A8"/>{sanitizeText(exc.city)}
            </span>
            {avgRating && (
              <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, fontWeight:600 }}>
                <Star size={13} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>
                <span style={{ color:"#F59E0B", fontWeight:800 }}>{avgRating}</span>
                <span style={{ color:"#9CA3AF" }}>({avis.length} avis)</span>
              </span>
            )}
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#6B7280", fontWeight:600 }}>
              <Clock size={13}/>{exc.duration_hours}h
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#6B7280", fontWeight:600 }}>
              <Users size={13}/>Max {exc.max_people} pers.
            </span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:28 }}>

          {/* ─── LEFT ─── */}
          <div>
            {/* Galerie */}
            <div style={{ borderRadius:20, overflow:"hidden", position:"relative", marginBottom:10, boxShadow:"0 6px 28px rgba(0,0,0,.1)", background:"#E5E7EB", height:520 }}>
              <img src={photos[currentPhoto]} alt={sanitizeText(exc.title)}
                style={{ width:"100%", height:"100%", objectFit:"cover", transition:"opacity .4s" }}
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
              <button onClick={toggleFav}
                style={{ position:"absolute", top:14, right:14, width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,.92)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 14px rgba(0,0,0,.18)", transition:"transform .18s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}>
                <Heart size={20} fill={isFav?"#DC2626":"none"} color={isFav?"#DC2626":"#374151"} strokeWidth={2.5}/>
              </button>
              {photos.length > 1 && (
                <div style={{ position:"absolute", top:14, left:14, display:"flex", alignItems:"center", gap:5, padding:"5px 11px", background:"rgba(0,0,0,.45)", backdropFilter:"blur(8px)", borderRadius:20, color:"white", fontSize:12, fontWeight:700 }}>
                  <Camera size={12}/>{currentPhoto+1}/{photos.length}
                </div>
              )}
              {photos.length > 1 && <>
                <button className="nav-arrow" style={{ left:12 }} onClick={() => setCurrentPhoto(p => (p-1+photos.length)%photos.length)}>
                  <ChevronLeft size={18} color="#374151" strokeWidth={2.5}/>
                </button>
                <button className="nav-arrow" style={{ right:12 }} onClick={() => setCurrentPhoto(p => (p+1)%photos.length)}>
                  <ChevronRight size={18} color="#374151" strokeWidth={2.5}/>
                </button>
              </>}
            </div>

            {photos.length > 1 && (
              <div className="thumb-strip" style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20 }}>
                {photos.map((p, i) => (
                  <div key={i} className={`thumb ${currentPhoto===i?"on":""}`} onClick={() => setCurrentPhoto(i)}>
                    <img src={p} alt=""/>
                  </div>
                ))}
              </div>
            )}

            {/* Stats bar */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
              {[
                { icon:<Clock size={18} color="#2B96A8"/>,    label:"Durée",    val:`${exc.duration_hours}h`,  bg:"#EFF9FB" },
                { icon:<Users size={18} color="#8B5CF6"/>,    label:"Capacité", val:`${exc.max_people} pers.`, bg:"#F5F3FF" },
                { icon:<Star size={18} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>, label:"Note", val:avgRating?`${avgRating}/5`:"Nouveau", bg:"#FFFBEB" },
                { icon:<MessageCircle size={18} color="#059669"/>, label:"Avis", val:`${avis.length}`, bg:"#F0FDF4" },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:"13px 12px", display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(0,0,0,.05)" }}>
                  <div style={{ flexShrink:0 }}>{s.icon}</div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:800, color:"#111827", lineHeight:1 }}>{s.val}</p>
                    <p style={{ fontSize:10, color:"#6B7280", marginTop:2, fontWeight:500 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ background:"white", borderRadius:20, border:"1px solid #EBEBEB", padding:"24px", marginBottom:16 }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:3, height:18, background:"#2B96A8", borderRadius:2, display:"inline-block" }}/>
                À propos de cette excursion
              </h2>
              {/* ✅ XSS : sanitize la description */}
              <p style={{ fontSize:14.5, color:"#374151", lineHeight:1.9 }}>
                {LONG_DESC && !descExpanded
                  ? <>{sanitizeText(exc.description.slice(0, 380))}<span style={{ color:"#9CA3AF" }}>…</span></>
                  : sanitizeText(exc.description)
                }
              </p>
              {LONG_DESC && (
                <button onClick={() => setDescExpanded(p => !p)}
                  style={{ marginTop:10, background:"none", border:"none", color:"#2B96A8", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif", padding:0 }}>
                  {descExpanded ? <><ChevronUp size={15}/>Réduire</> : <><ChevronDown size={15}/>Lire la suite</>}
                </button>
              )}
            </div>

            {/* Inclusions */}
            {exc.inclusions?.length > 0 && (
              <div style={{ background:"white", borderRadius:20, border:"1px solid #EBEBEB", padding:"24px", marginBottom:16 }}>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:3, height:18, background:"#059669", borderRadius:2, display:"inline-block" }}/>
                  Ce qui est inclus
                </h2>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                  {exc.inclusions.map(inc => (
                    <div key={inc} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13.5, color:"#374151", padding:"8px 12px", background:"#F0FDF4", borderRadius:10, border:"1px solid #DCFCE7" }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background:"#059669", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Check size={12} color="white" strokeWidth={3}/>
                      </div>
                      {/* ✅ XSS : sanitize les inclusions */}
                      {sanitizeText(inc)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {exc.languages?.length > 0 && (
              <div style={{ background:"white", borderRadius:20, border:"1px solid #EBEBEB", padding:"24px", marginBottom:28 }}>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:3, height:18, background:"#8B5CF6", borderRadius:2, display:"inline-block" }}/>
                  Langues disponibles
                </h2>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {exc.languages.map(l => (
                    <span key={l} style={{ padding:"8px 16px", background:"#F5F3FF", borderRadius:20, fontSize:13, fontWeight:700, color:"#6D28D9", border:"1px solid #EDE9FE", display:"flex", alignItems:"center", gap:6 }}>
                      {/* ✅ XSS : sanitize les langues */}
                      <Globe size={13}/>{sanitizeText(l)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ══ AVIS ══ */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:"#111827", display:"flex", alignItems:"center", gap:10 }}>
                  Avis des voyageurs
                  {avgRating && (
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:16, color:"#374151", background:"#FFFBEB", padding:"4px 12px", borderRadius:20, border:"1px solid #FDE68A" }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>{avgRating}
                    </span>
                  )}
                </h2>
              </div>

              {user && !alreadyReviewed && !avisSuccess && (
                <div className="fu" style={{ background:"white", borderRadius:20, border:"1.5px solid #E5E7EB", padding:"24px", marginBottom:20 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:"#111827", marginBottom:3 }}>Partagez votre expérience</h3>
                  <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:16 }}>Votre avis sera publié après vérification</p>
                  {avisError && (
                    <div style={{ padding:"10px 14px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, fontSize:13, color:"#DC2626", marginBottom:14, display:"flex", alignItems:"center", gap:7 }}>
                      <X size={14}/>{avisError}
                    </div>
                  )}
                  <form onSubmit={submitAvis}>
                    <div style={{ display:"flex", alignItems:"center", gap:2, marginBottom:16 }}>
                      {STARS.map(s => (
                        <button key={s} type="button" className="star-btn"
                          onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setMyRating(s)}>
                          <Star size={28} fill={s<=(hoverRating||myRating)?"#F59E0B":"none"} color={s<=(hoverRating||myRating)?"#F59E0B":"#D1D5DB"} strokeWidth={1.5}/>
                        </button>
                      ))}
                      {myRating > 0 && (
                        <span style={{ marginLeft:10, fontSize:13, color:"#374151", fontWeight:700 }}>
                          {["","Très déçu","Décevant","Bien","Très bien","Excellent !"][myRating]}
                        </span>
                      )}
                    </div>
                    <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={4} required
                      placeholder="Décrivez votre expérience..."
                      style={{ width:"100%", padding:"13px 16px", border:"1.5px solid #E5E7EB", borderRadius:14, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"vertical", color:"#111827", background:"#FAFAFA", transition:"all .2s" }}
                    />
                    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
                      <button type="submit" disabled={avisLoading||myRating===0}
                        style={{ padding:"12px 26px", background:myRating>0?"#111827":"#E5E7EB", color:myRating>0?"white":"#9CA3AF", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:myRating>0?"pointer":"not-allowed", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", gap:7 }}>
                        {avisLoading ? <><Loader2 size={15} style={{ animation:"spin .65s linear infinite" }}/>Envoi...</> : <><Send size={14}/>Publier mon avis</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {avisSuccess && (
                <div style={{ padding:"16px 20px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:16, marginBottom:20, fontSize:14, color:"#15803D", fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                  <Check size={16} strokeWidth={3}/>Votre avis a été soumis ! Il sera publié après modération.
                </div>
              )}
              {alreadyReviewed && !avisSuccess && (
                <div style={{ padding:"12px 16px", background:"#EFF9FB", border:"1px solid #B2E3EB", borderRadius:14, marginBottom:20, fontSize:13, color:"#2B96A8", fontWeight:600, display:"flex", alignItems:"center", gap:7 }}>
                  <Check size={14} strokeWidth={3}/>Vous avez déjà soumis un avis pour cette excursion.
                </div>
              )}
              {!user && (
                <div style={{ padding:"20px 24px", background:"white", border:"1.5px solid #E5E7EB", borderRadius:18, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <p style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:3 }}>Vous avez vécu cette excursion ?</p>
                    <p style={{ fontSize:13, color:"#9CA3AF" }}>Connectez-vous pour partager votre avis</p>
                  </div>
                  <Link href="/auth" style={{ padding:"11px 22px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700 }}>Se connecter</Link>
                </div>
              )}

              {avis.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 20px", background:"white", borderRadius:20, border:"1px solid #EBEBEB" }}>
                  <MessageCircle size={44} color="#D1D5DB" style={{ margin:"0 auto 12px" }}/>
                  <p style={{ fontSize:16, fontWeight:700, color:"#374151", marginBottom:6 }}>Aucun avis pour le moment</p>
                  <p style={{ fontSize:13, color:"#9CA3AF" }}>Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {avis.map(a => (
                    <div key={a.id} className="avis-item">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:42, height:42, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#2B96A8,#1e7a8a)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:15, fontWeight:800 }}>
                            {a.touriste_avatar
                              ? <img src={a.touriste_avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                              : (a.touriste_name?.[0]||"T").toUpperCase()
                            }
                          </div>
                          <div>
                            {/* ✅ XSS : sanitize le nom du touriste */}
                            <p style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{sanitizeText(a.touriste_name||"Voyageur")}</p>
                            <p style={{ fontSize:11, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                              <CalendarDays size={10}/>{new Date(a.created_at).toLocaleDateString("fr-FR",{ day:"numeric",month:"long",year:"numeric" })}
                            </p>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:2 }}>
                          {STARS.map(s => <Star key={s} size={13} fill={s<=a.rating?"#F59E0B":"#E5E7EB"} color={s<=a.rating?"#F59E0B":"#E5E7EB"} strokeWidth={0}/>)}
                        </div>
                      </div>
                      {a.comment && (
                        <p style={{ fontSize:14, color:"#374151", lineHeight:1.75, paddingLeft:52, marginBottom:12 }}>
                          {/* ✅ XSS : sanitize le commentaire affiché */}
                          &ldquo;{sanitizeText(a.comment)}&rdquo;
                        </p>
                      )}
                      {a.prestataire_response && (
                        <div style={{ marginLeft:52, padding:"10px 14px", background:"rgba(43,150,168,.06)", borderRadius:10, borderLeft:"3px solid #2B96A8", marginBottom:12 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                            <div style={{ width:24, height:24, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#2B96A8,#1e7a8a)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, fontWeight:800 }}>
                              {prestataire?.avatar_url ? <img src={prestataire.avatar_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/> : sanitizeText(prestName)[0].toUpperCase()}
                            </div>
                            <p style={{ fontSize:12, fontWeight:800, color:"#2B96A8" }}>{sanitizeText(prestName)}</p>
                          </div>
                          {/* ✅ XSS : sanitize la réponse du prestataire */}
                          <p style={{ fontSize:13, color:"#374151", lineHeight:1.65 }}>{sanitizeText(a.prestataire_response)}</p>
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", paddingTop:10, borderTop:"1px solid #F3F4F6", marginTop:4 }}>
                        <button className={`like-btn ${likedIds.has(a.id)?"on":""}`} onClick={() => toggleLike(a.id)}>
                          <ThumbsUp size={13} fill={likedIds.has(a.id)?"#E11D48":"none"} strokeWidth={2}/>
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

          {/* ─── RIGHT STICKY ─── */}
          <div style={{ position:"sticky", top:76, height:"fit-content" }}>
            <div style={{ background:"white", borderRadius:24, border:"1px solid #EBEBEB", padding:"26px", boxShadow:"0 12px 48px rgba(0,0,0,.1)" }}>
              <div style={{ marginBottom:20, paddingBottom:18, borderBottom:"1px solid #F3F4F6" }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{ fontSize:34, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display',serif" }}>{exc.price_per_person}</span>
                  <span style={{ fontSize:15, fontWeight:600, color:"#374151" }}>TND</span>
                  <span style={{ fontSize:13, color:"#9CA3AF" }}>/ personne</span>
                </div>
                {avgRating && (
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:7 }}>
                    {STARS.map(s => <Star key={s} size={13} fill={s<=Math.round(Number(avgRating))?"#F59E0B":"#E5E7EB"} color={s<=Math.round(Number(avgRating))?"#F59E0B":"#E5E7EB"} strokeWidth={0}/>)}
                    <span style={{ fontSize:13, fontWeight:700, color:"#374151", marginLeft:3 }}>{avgRating}</span>
                    <span style={{ fontSize:12, color:"#9CA3AF" }}>({avis.length})</span>
                  </div>
                )}
              </div>

              <div style={{ background:"#F9FAFB", borderRadius:14, padding:"13px 14px", marginBottom:18 }}>
                {[
                  { icon:<Clock size={13} color="#6B7280"/>,  label:"Durée",     val:`${exc.duration_hours}h` },
                  { icon:<Users size={13} color="#6B7280"/>,  label:"Max",       val:`${exc.max_people} personnes` },
                  { icon:<MapPin size={13} color="#6B7280"/>, label:"Lieu",      val:sanitizeText(exc.city) },
                  { icon:<Tag size={13} color="#6B7280"/>,    label:"Catégorie", val:sanitizeText(exc.categories?.[0]||"—") },
                ].map((r, i) => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<3?"1px solid #EBEBEB":"none" }}>
                    <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:6 }}>{r.icon}{r.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <button className="cta-primary" onClick={() => { if(!user){sessionStorage.setItem("redirect_after_login",`/excursions/${exc.id}`);window.location.href="/auth";return;} setShowCheckout(true); }}>
                {user ? <><CalendarDays size={16}/>Réserver maintenant</> : <><Lock size={15}/>Connexion pour réserver</>}
              </button>
              <div style={{ height:9 }}/>
              {prestataire && (
                <button className="cta-sec" onClick={() => { if(!user){sessionStorage.setItem("redirect_after_login",`/excursions/${exc.id}`);window.location.href="/auth";return;} setShowMsgModal(true); }}>
                  <MessageCircle size={15}/>Envoyer un message
                </button>
              )}
              <div style={{ height:9 }}/>
              <button className={`fav-btn ${isFav?"on":""}`} onClick={toggleFav}>
                <Heart size={15} fill={isFav?"#DC2626":"none"} strokeWidth={2}/>
                {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>

              {prestataire && (
                <div style={{ marginTop:18, paddingTop:16, borderTop:"1px solid #F3F4F6" }}>
                  <p style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Votre guide</p>
                  <div className="prest-card" onClick={() => setShowPrestataire(true)}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:"2px solid #F0F0F0" }}>
                        {prestataire.avatar_url
                          ? <img src={prestataire.avatar_url} alt={sanitizeText(prestName)} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                          : <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#2B96A8,#1e7a8a)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:17 }}>{sanitizeText(prestName)[0].toUpperCase()}</div>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        {/* ✅ XSS : sanitize le nom du prestataire */}
                        <p style={{ fontSize:13, fontWeight:800, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sanitizeText(prestName)}</p>
                        {prestataire.city && <p style={{ fontSize:11, color:"#9CA3AF", marginTop:1, display:"flex", alignItems:"center", gap:3 }}><MapPin size={9}/>{sanitizeText(prestataire.city)}</p>}
                        <p style={{ fontSize:11, color:"#059669", fontWeight:700, marginTop:2, display:"flex", alignItems:"center", gap:4 }}><ShieldCheck size={11}/>Vérifié</p>
                      </div>
                      <ChevronRight size={16} color="#9CA3AF"/>
                    </div>
                    <p style={{ fontSize:11, color:"#2B96A8", fontWeight:600, marginTop:8, textAlign:"center" }}>Voir le profil complet</p>
                  </div>
                </div>
              )}

              <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #F3F4F6", display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { icon:<Lock size={12} color="#059669"/>,           text:"Paiement 100% sécurisé" },
                  { icon:<RefreshCcw size={12} color="#2563EB"/>,     text:"Annulation gratuite 24h avant" },
                  { icon:<HeadphonesIcon size={12} color="#8B5CF6"/>, text:"Support disponible 7j/7" },
                ].map(g => (
                  <p key={g.text} style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:7 }}>{g.icon}{g.text}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL MESSAGE ═══ */}
      {showMsgModal && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget){ setShowMsgModal(false); setMsgSent(false); } }}>
          <div className="modal fu">
            {msgSent ? (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ width:60, height:60, borderRadius:"50%", background:"#F0FDF4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><Check size={28} color="#15803D" strokeWidth={2.5}/></div>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#111827", marginBottom:8 }}>Message envoyé !</h3>
                <p style={{ fontSize:14, color:"#6B7280" }}>Redirection vers vos messages...</p>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#111827", marginBottom:4 }}>Contacter le guide</h3>
                    {/* ✅ XSS : sanitize le titre dans la modal */}
                    <p style={{ fontSize:13, color:"#9CA3AF" }}>À propos de : {sanitizeText(exc.title)}</p>
                  </div>
                  <button onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    style={{ background:"#F3F4F6", border:"none", cursor:"pointer", color:"#9CA3AF", width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <X size={15}/>
                  </button>
                </div>
                {prestataire && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#F9FAFB", borderRadius:12, marginBottom:16 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#2B96A8,#1e7a8a)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:14 }}>
                      {prestataire.avatar_url ? <img src={prestataire.avatar_url} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/> : sanitizeText(prestName)[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{sanitizeText(prestName)}</p>
                      <p style={{ fontSize:11, color:"#059669", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}><ShieldCheck size={11}/>Prestataire vérifié</p>
                    </div>
                  </div>
                )}
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Bonjour, j'aimerais avoir plus d'informations..."
                  style={{ width:"100%", height:110, padding:"12px 14px", border:"1.5px solid #E5E7EB", borderRadius:14, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"none", color:"#111827", lineHeight:1.6, transition:"all .2s", background:"#FAFAFA" }}
                />
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <button onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    style={{ flex:1, padding:12, border:"1px solid #E5E7EB", borderRadius:12, background:"none", cursor:"pointer", fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"#374151" }}>
                    Annuler
                  </button>
                  <button onClick={sendMessage} disabled={!msgText.trim()||msgSending}
                    style={{ flex:1, padding:12, border:"none", borderRadius:12, background:msgText.trim()?"#2B96A8":"#E5E7EB", color:msgText.trim()?"white":"#9CA3AF", cursor:msgText.trim()?"pointer":"not-allowed", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    {msgSending ? <><Loader2 size={15} style={{ animation:"spin .65s linear infinite" }}/>Envoi...</> : <><Send size={14}/>Envoyer</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL RÉSERVATION ═══ */}
      {showCheckout && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowCheckout(false); }}>
          <div className="modal fu">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#111827" }}>Réserver</h2>
              <button onClick={() => setShowCheckout(false)}
                style={{ background:"#F3F4F6", border:"none", cursor:"pointer", color:"#9CA3AF", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={{ background:"#F9FAFB", borderRadius:14, padding:"14px 16px", marginBottom:22 }}>
              {/* ✅ XSS : sanitize dans la modal réservation */}
              <p style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:4 }}>{sanitizeText(exc.title)}</p>
              <p style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><MapPin size={11}/>{sanitizeText(exc.city)}</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><Clock size={11}/>{exc.duration_hours}h</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><Tag size={11}/>{exc.price_per_person} TND/pers.</span>
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:22 }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:.5, textTransform:"uppercase", marginBottom:7 }}>
                  <CalendarDays size={12}/> Date
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #E5E7EB", borderRadius:12, fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"#111827", transition:"all .2s", background:"#FAFAFA" }}
                />
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:.5, textTransform:"uppercase", marginBottom:7 }}>
                  <Users size={12}/> Personnes
                </label>
                <div style={{ display:"flex", alignItems:"center", gap:14, padding:"8px 16px", border:"1.5px solid #E5E7EB", borderRadius:12, background:"#FAFAFA" }}>
                  <button className="counter-btn" type="button" onClick={() => setPeople(p => Math.max(1,p-1))} disabled={people<=1}><Minus size={15}/></button>
                  <span style={{ flex:1, textAlign:"center", fontSize:18, fontWeight:800, color:"#111827" }}>{people}</span>
                  <button className="counter-btn" type="button" onClick={() => setPeople(p => Math.min(exc.max_people,p+1))} disabled={people>=exc.max_people}><Plus size={15}/></button>
                </div>
                <p style={{ fontSize:11, color:"#9CA3AF", marginTop:5, display:"flex", alignItems:"center", gap:4 }}><Users size={10}/>Max {exc.max_people} personnes</p>
              </div>
            </div>
            <div style={{ background:"#F9FAFB", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", marginBottom:6 }}>
                <span>{exc.price_per_person} TND × {people} pers.</span><span>{totalPrice} TND</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", marginBottom:10 }}>
                <span>Frais de service (10%)</span><span>{commission} TND</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:900, color:"#111827", borderTop:"1px solid #E5E7EB", paddingTop:10 }}>
                <span>Total</span><span style={{ color:"#2B96A8" }}>{totalPrice+commission} TND</span>
              </div>
            </div>
            <button className="cta-primary" disabled={!date}
              style={{ background:date?"#111827":"#E5E7EB", color:date?"white":"#9CA3AF", cursor:date?"pointer":"not-allowed" }}
              onClick={() => { alert("Paiement en cours d'intégration !"); setShowCheckout(false); }}>
              {date ? <><Check size={16}/>{`Confirmer — ${totalPrice+commission} TND`}</> : <><CalendarDays size={15}/>Choisissez d&apos;abord une date</>}
            </button>
          </div>
        </div>
      )}

      {/* ═══ MODAL PRESTATAIRE ═══ */}
      {showPrestataire && prestataire && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowPrestataire(false); }}>
          <div className="modal fu">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#111827" }}>Votre guide</h2>
              <button onClick={() => setShowPrestataire(false)}
                style={{ background:"#F3F4F6", border:"none", cursor:"pointer", color:"#9CA3AF", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:20, paddingBottom:18, borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ width:76, height:76, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:"3px solid #F0F0F0", boxShadow:"0 4px 16px rgba(0,0,0,.08)" }}>
                {prestataire.avatar_url
                  ? <img src={prestataire.avatar_url} alt={sanitizeText(prestName)} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  : <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#2B96A8,#4AABB8)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:28 }}>{sanitizeText(prestName)[0].toUpperCase()}</div>
                }
              </div>
              <div>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#111827", marginBottom:4 }}>{sanitizeText(prestName)}</h3>
                {prestataire.full_name && prestataire.agency_name && (
                  <p style={{ fontSize:13, color:"#6B7280", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}><Users size={12}/>{sanitizeText(prestataire.full_name)}</p>
                )}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span style={{ padding:"3px 10px", background:"#F0FDF4", color:"#15803D", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #BBF7D0", display:"flex", alignItems:"center", gap:4 }}>
                    <ShieldCheck size={11}/>Vérifié
                  </span>
                  {prestataire.city && (
                    <span style={{ padding:"3px 10px", background:"#F3F4F6", color:"#374151", borderRadius:20, fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                      <MapPin size={10}/>{sanitizeText(prestataire.city)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {prestataire.description && (
              <div style={{ background:"#F9FAFB", borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:.5, marginBottom:7 }}>À propos</p>
                {/* ✅ XSS : sanitize la description du prestataire */}
                <p style={{ fontSize:14, color:"#374151", lineHeight:1.75 }}>{sanitizeText(prestataire.description)}</p>
              </div>
            )}
            {prestataire.phone && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, padding:"10px 0", borderBottom:"1px solid #F9FAFB", marginBottom:10 }}>
                <span style={{ color:"#6B7280", display:"flex", alignItems:"center", gap:6 }}><HeadphonesIcon size={13}/>Téléphone</span>
                <span style={{ fontWeight:700, color:"#111827" }}>{sanitizeText(prestataire.phone)}</span>
              </div>
            )}
            <button onClick={() => setShowPrestataire(false)} className="cta-primary" style={{ marginTop:8 }}>Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}