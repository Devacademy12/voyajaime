"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

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

const STARS = [1,2,3,4,5];
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1200&q=85&fit=crop";

export default function ExcursionClient({
  exc, prestataire, initialAvis, myLikedIds = [],
}: {
  exc: Excursion; prestataire: Prestataire | null;
  initialAvis: Avis[]; myLikedIds: string[];
}) {
  const supabase = createClient();
  const [avis, setAvis] = useState(initialAvis);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set(myLikedIds));
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showPrestataire, setShowPrestataire] = useState(false);

  // Avis form
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [avisLoading, setAvisLoading] = useState(false);
  const [avisSuccess, setAvisSuccess] = useState(false);
  const [avisError, setAvisError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [people, setPeople] = useState(1);
  const [date, setDate] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUser({ id: uid });
      supabase.from("favoris").select("id").eq("touriste_id", uid).eq("excursion_id", exc.id)
        .maybeSingle().then(({ data: fav }) => { if (fav) { setIsFav(true); setFavId(fav.id); } });
      supabase.from("avis").select("id").eq("touriste_id", uid).eq("excursion_id", exc.id)
        .maybeSingle().then(({ data: ex }) => setAlreadyReviewed(!!ex));
    });
  }, [exc.id]);

  const photos = exc.photos?.filter(Boolean).length ? exc.photos.filter(Boolean) : [FALLBACK];
  const avgRating = avis.length
    ? (avis.reduce((s, a) => s + a.rating, 0) / avis.length).toFixed(1)
    : exc.rating ? exc.rating.toFixed(1) : null;
  const totalPrice = exc.price_per_person * people;
  const commission = Math.round(totalPrice * 0.1);
  const prestName = prestataire?.agency_name || prestataire?.full_name || "Prestataire";

  // ── FAVORI ──
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

  // ── LIKE AVIS ──
  const toggleLike = async (avisId: string) => {
    if (!user) { window.location.href = "/auth"; return; }
    const liked = likedIds.has(avisId);

    // Optimiste
    setLikedIds(prev => { const n = new Set(prev); liked ? n.delete(avisId) : n.add(avisId); return n; });
    setAvis(prev => prev.map(a => a.id === avisId
      ? { ...a, likes_count: liked ? Math.max(0, a.likes_count - 1) : a.likes_count + 1 }
      : a
    ));

    if (liked) {
      const { error } = await supabase.from("avis_likes").delete().eq("avis_id", avisId).eq("user_id", user.id);
      if (!error) await supabase.from("avis").update({ likes_count: avis.find(a => a.id === avisId)!.likes_count - 1 }).eq("id", avisId);
    } else {
      const { error } = await supabase.from("avis_likes").insert({ avis_id: avisId, user_id: user.id });
      if (!error) await supabase.from("avis").update({ likes_count: avis.find(a => a.id === avisId)!.likes_count + 1 }).eq("id", avisId);
    }
  };

  // ── SOUMETTRE AVIS ──
  const submitAvis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/auth"; return; }
    if (myRating === 0) { setAvisError("Choisissez une note."); return; }
    if (!myComment.trim()) { setAvisError("Écrivez un commentaire."); return; }
    setAvisLoading(true); setAvisError(null);
    const { error } = await supabase.from("avis").insert({
      excursion_id: exc.id, touriste_id: user.id,
      rating: myRating, comment: myComment.trim(),
      reservation_id: null, is_moderated: false,
    });
    setAvisLoading(false);
    if (error) { setAvisError(error.code === "23505" ? "Vous avez déjà soumis un avis." : error.message); return; }
    setAvisSuccess(true); setAlreadyReviewed(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#F8F9FA;color:#111827}
        .star-btn{background:none;border:none;cursor:pointer;font-size:32px;line-height:1;transition:transform .15s;padding:2px}
        .star-btn:hover{transform:scale(1.2)}
        .thumb{width:76px;height:58px;border-radius:10px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;transition:all .2s;flex-shrink:0}
        .thumb.on{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,.15)}
        .thumb img{width:100%;height:100%;object-fit:cover}
        .card-section{background:white;border-radius:20px;border:1px solid #EBEBEB;padding:24px;margin-bottom:16px}
        .avis-item{background:white;border-radius:16px;border:1px solid #EBEBEB;padding:20px;margin-bottom:10px;transition:box-shadow .2s}
        .avis-item:hover{box-shadow:0 4px 18px rgba(0,0,0,.07)}
        .like-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s}
        .like-btn.on{background:#FEF2F2;border-color:#FECACA;color:#E11D48}
        .like-btn:not(.on):hover{background:#F9FAFB;border-color:#D1D5DB}
        .prest-card{cursor:pointer;transition:all .2s;border-radius:16px;padding:14px 16px;border:1.5px solid #F0F0F0;background:white}
        .prest-card:hover{border-color:#2B96A8;box-shadow:0 4px 18px rgba(43,150,168,.12)}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:white;border-radius:24px;padding:32px;width:100%;max-width:460px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.25)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fu{animation:fadeUp .35s ease forwards}
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{ position:"sticky",top:0,zIndex:200,background:"rgba(255,255,255,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid #EBEBEB",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 52px",boxShadow:"0 1px 12px rgba(0,0,0,.06)" }}>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:9,textDecoration:"none" }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#2B96A8"/>
            <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
          </svg>
          <span style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:"#111" }}>voyajaime</span>
        </Link>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <Link href="/excursions" style={{ fontSize:13,color:"#6B7280",textDecoration:"none",fontWeight:500 }}>← Toutes les excursions</Link>
          {user
            ? <Link href="/touriste/favoris" style={{ padding:"8px 16px",background:"#F3F4F6",color:"#374151",borderRadius:20,textDecoration:"none",fontSize:13,fontWeight:700 }}>Mon espace</Link>
            : <Link href="/auth" style={{ padding:"8px 18px",background:"#2B96A8",color:"white",borderRadius:20,textDecoration:"none",fontSize:13,fontWeight:700 }}>Connexion</Link>
          }
        </div>
      </header>

      <div style={{ maxWidth:1120,margin:"0 auto",padding:"40px 48px 100px" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 350px",gap:36 }}>

          {/* ─── GAUCHE ─── */}
          <div>
            {/* Badges + Titre */}
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
              {exc.categories?.map(c => (
                <span key={c} style={{ padding:"4px 12px",background:"rgba(43,150,168,.1)",color:"#1e7a8a",borderRadius:20,fontSize:12,fontWeight:700 }}>{c}</span>
              ))}
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,3vw,36px)",fontWeight:900,color:"#111827",letterSpacing:"-0.5px",marginBottom:6,lineHeight:1.15 }}>
              {exc.title}
            </h1>
            <p style={{ fontSize:14,color:"#6B7280",marginBottom:22,display:"flex",alignItems:"center",gap:5 }}>
              📍 <span>{exc.city}</span>
              {avgRating && <><span style={{ margin:"0 6px",color:"#D1D5DB" }}>·</span><span>⭐ {avgRating}</span><span style={{ color:"#9CA3AF" }}>({avis.length} avis)</span></>}
            </p>

            {/* Galerie */}
            <div style={{ borderRadius:20,overflow:"hidden",aspectRatio:"16/9",background:"#E5E7EB",position:"relative",marginBottom:10,boxShadow:"0 4px 20px rgba(0,0,0,.08)" }}>
              <img src={photos[currentPhoto]} alt={exc.title}
                style={{ width:"100%",height:"100%",objectFit:"cover",transition:"opacity .4s" }}
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />
              <button onClick={toggleFav}
                style={{ position:"absolute",top:16,right:16,width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,.92)",border:"none",cursor:"pointer",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 16px rgba(0,0,0,.15)",transition:"transform .2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform="scale(1.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform="scale(1)"}>
                {isFav ? "❤️" : "🤍"}
              </button>
              {photos.length > 1 && (
                <>
                  <button onClick={() => setCurrentPhoto(p => (p-1+photos.length)%photos.length)}
                    style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.85)",border:"none",cursor:"pointer",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
                  <button onClick={() => setCurrentPhoto(p => (p+1)%photos.length)}
                    style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.85)",border:"none",cursor:"pointer",fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
                  <div style={{ position:"absolute",bottom:12,right:14,padding:"3px 10px",background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",borderRadius:20,fontSize:11,color:"white",fontWeight:700 }}>
                    {currentPhoto+1}/{photos.length}
                  </div>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div style={{ display:"flex",gap:8,overflowX:"auto",paddingBottom:6,marginBottom:8 }}>
                {photos.map((p,i) => (
                  <div key={i} className={`thumb ${currentPhoto===i?"on":""}`} onClick={() => setCurrentPhoto(i)}>
                    <img src={p} alt="" />
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:20,marginBottom:4 }}>
              {[
                { icon:"⏱️",label:"Durée",val:`${exc.duration_hours}h` },
                { icon:"👥",label:"Capacité",val:`${exc.max_people} pers.` },
                { icon:"⭐",label:"Note",val:avgRating?`${avgRating}/5`:"Nouveau" },
                { icon:"💬",label:"Avis",val:`${avis.length}` },
              ].map(s => (
                <div key={s.label} style={{ background:"white",borderRadius:14,border:"1px solid #EBEBEB",padding:"14px 10px",textAlign:"center" }}>
                  <p style={{ fontSize:22,marginBottom:4 }}>{s.icon}</p>
                  <p style={{ fontSize:15,fontWeight:800,color:"#111827" }}>{s.val}</p>
                  <p style={{ fontSize:11,color:"#9CA3AF",marginTop:1 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="card-section" style={{ marginTop:16 }}>
              <h2 style={{ fontSize:17,fontWeight:800,color:"#111827",marginBottom:12 }}>À propos de cette excursion</h2>
              <p style={{ fontSize:14.5,color:"#374151",lineHeight:1.85 }}>{exc.description}</p>
            </div>

            {/* Inclusions */}
            {exc.inclusions?.length > 0 && (
              <div className="card-section">
                <h2 style={{ fontSize:17,fontWeight:800,color:"#111827",marginBottom:14 }}>Ce qui est inclus</h2>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                  {exc.inclusions.map(inc => (
                    <div key={inc} style={{ display:"flex",alignItems:"center",gap:9,fontSize:13.5,color:"#374151",padding:"5px 0" }}>
                      <div style={{ width:22,height:22,borderRadius:"50%",background:"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#15803D",fontWeight:800,flexShrink:0 }}>✓</div>
                      {inc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {exc.languages?.length > 0 && (
              <div className="card-section">
                <h2 style={{ fontSize:17,fontWeight:800,color:"#111827",marginBottom:12 }}>Langues disponibles</h2>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                  {exc.languages.map(l => (
                    <span key={l} style={{ padding:"7px 16px",background:"#F3F4F6",borderRadius:20,fontSize:13,fontWeight:600,color:"#374151" }}>🌍 {l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── AVIS ── */}
            <div style={{ marginTop:32 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:"#111827" }}>
                  Avis {avgRating && <span style={{ color:"#F59E0B",fontSize:18 }}>★ {avgRating}</span>}
                </h2>
              </div>

              {/* Formulaire */}
              {user && !alreadyReviewed && !avisSuccess && (
                <div className="fu" style={{ background:"white",borderRadius:20,border:"1.5px solid #E5E7EB",padding:"24px",marginBottom:20 }}>
                  <h3 style={{ fontSize:16,fontWeight:800,color:"#111827",marginBottom:4 }}>Partagez votre expérience</h3>
                  <p style={{ fontSize:13,color:"#9CA3AF",marginBottom:18 }}>Votre avis sera publié après vérification</p>
                  {avisError && <div style={{ padding:"10px 14px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,fontSize:13,color:"#DC2626",marginBottom:14 }}>{avisError}</div>}
                  <form onSubmit={submitAvis}>
                    <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:18 }}>
                      {STARS.map(s => (
                        <button key={s} type="button" className="star-btn"
                          onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setMyRating(s)}>
                          <span style={{ color:s<=(hoverRating||myRating)?"#F59E0B":"#D1D5DB" }}>★</span>
                        </button>
                      ))}
                      {myRating > 0 && (
                        <span style={{ marginLeft:10,fontSize:13,color:"#374151",fontWeight:700 }}>
                          {["","Très déçu 😞","Décevant 😕","Bien 🙂","Très bien 😊","Excellent ! 🤩"][myRating]}
                        </span>
                      )}
                    </div>
                    <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={4} required
                      placeholder="Décrivez votre expérience..."
                      style={{ width:"100%",padding:"13px 16px",border:"1.5px solid #E5E7EB",borderRadius:14,fontSize:14,fontFamily:"'DM Sans',sans-serif",resize:"vertical",outline:"none",color:"#111827",background:"#FAFAFA",transition:"border-color .2s" }}
                      onFocus={e => e.currentTarget.style.borderColor="#2B96A8"}
                      onBlur={e => e.currentTarget.style.borderColor="#E5E7EB"}
                    />
                    <div style={{ display:"flex",justifyContent:"flex-end",marginTop:12 }}>
                      <button type="submit" disabled={avisLoading||myRating===0}
                        style={{ padding:"12px 26px",background:myRating>0?"#111827":"#E5E7EB",color:myRating>0?"white":"#9CA3AF",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:myRating>0?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",transition:"all .2s" }}>
                        {avisLoading ? <><span style={{ display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin .65s linear infinite",marginRight:8 }} />Envoi...</> : "Publier mon avis →"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {avisSuccess && (
                <div style={{ padding:"16px 20px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:16,marginBottom:20,fontSize:14,color:"#15803D",fontWeight:600 }}>
                  ✅ Votre avis a été soumis ! Il sera publié après modération. Merci 🙏
                </div>
              )}
              {alreadyReviewed && !avisSuccess && (
                <div style={{ padding:"13px 18px",background:"#EFF9FB",border:"1px solid #B2E3EB",borderRadius:14,marginBottom:20,fontSize:13,color:"#2B96A8",fontWeight:600 }}>
                  ✅ Vous avez déjà soumis un avis pour cette excursion.
                </div>
              )}
              {!user && (
                <div style={{ padding:"20px 24px",background:"white",border:"1.5px solid #E5E7EB",borderRadius:18,marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <p style={{ fontSize:15,fontWeight:700,color:"#111827",marginBottom:3 }}>Vous avez vécu cette excursion ?</p>
                    <p style={{ fontSize:13,color:"#9CA3AF" }}>Connectez-vous pour partager votre avis</p>
                  </div>
                  <Link href="/auth" style={{ padding:"11px 22px",background:"#2B96A8",color:"white",borderRadius:12,textDecoration:"none",fontSize:14,fontWeight:700 }}>
                    Se connecter
                  </Link>
                </div>
              )}

              {/* Liste avis */}
              {avis.length === 0 ? (
                <div style={{ textAlign:"center",padding:"48px 20px",background:"white",borderRadius:20,border:"1px solid #EBEBEB" }}>
                  <p style={{ fontSize:44,marginBottom:12 }}>💬</p>
                  <p style={{ fontSize:16,fontWeight:700,color:"#374151" }}>Aucun avis pour le moment</p>
                  <p style={{ fontSize:13,color:"#9CA3AF",marginTop:6 }}>Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                avis.map(a => (
                  <div key={a.id} className="avis-item">
                    {/* Header */}
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ width:40,height:40,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"linear-gradient(135deg,#2B96A8,#1e7a8a)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:15,fontWeight:800 }}>
                          {a.touriste_avatar
                            ? <img src={a.touriste_avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                            : (a.touriste_name?.[0]||"T").toUpperCase()
                          }
                        </div>
                        <div>
                          <p style={{ fontSize:14,fontWeight:700,color:"#111827" }}>{a.touriste_name||"Voyageur"}</p>
                          <p style={{ fontSize:11,color:"#9CA3AF" }}>{new Date(a.created_at).toLocaleDateString("fr-FR",{ day:"numeric",month:"long",year:"numeric" })}</p>
                        </div>
                      </div>
                      <div style={{ display:"flex",gap:1 }}>
                        {STARS.map(s => <span key={s} style={{ fontSize:14,color:s<=a.rating?"#F59E0B":"#E5E7EB" }}>★</span>)}
                      </div>
                    </div>

                    {/* Commentaire */}
                    {a.comment && (
                      <p style={{ fontSize:14,color:"#374151",lineHeight:1.75,paddingLeft:50,marginBottom:12 }}>
                        &ldquo;{a.comment}&rdquo;
                      </p>
                    )}

                    {/* Réponse prestataire */}
                    {a.prestataire_response && (
                      <div style={{ marginLeft:50,padding:"10px 14px",background:"rgba(43,150,168,.06)",borderRadius:10,borderLeft:"3px solid #2B96A8",marginBottom:12 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                          {/* Mini avatar prestataire */}
                          <div style={{ width:24,height:24,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"linear-gradient(135deg,#2B96A8,#1e7a8a)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,fontWeight:800 }}>
                            {prestataire?.avatar_url
                              ? <img src={prestataire.avatar_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                              : prestName[0].toUpperCase()
                            }
                          </div>
                          <p style={{ fontSize:12,fontWeight:800,color:"#2B96A8" }}>{prestName}</p>
                        </div>
                        <p style={{ fontSize:13,color:"#374151",lineHeight:1.65 }}>{a.prestataire_response}</p>
                      </div>
                    )}

                    {/* Barre actions — Like */}
                    <div style={{ display:"flex",alignItems:"center",paddingTop:10,borderTop:"1px solid #F3F4F6",marginTop:4 }}>
                      <button
                        className={`like-btn ${likedIds.has(a.id)?"on":""}`}
                        onClick={() => toggleLike(a.id)}>
                        <span style={{ fontSize:15 }}>{likedIds.has(a.id) ? "❤️" : "🤍"}</span>
                        {(a.likes_count) > 0 && <span>{a.likes_count}</span>}
                        <span>J&apos;aime</span>
                      </button>
                      {!user && (
                        <span style={{ fontSize:12,color:"#9CA3AF",marginLeft:10 }}>Connectez-vous pour liker</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ─── DROITE sticky ─── */}
          <div style={{ position:"sticky",top:80,height:"fit-content" }}>
            <div style={{ background:"white",borderRadius:24,border:"1px solid #EBEBEB",padding:"28px",boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
              {/* Prix */}
              <div style={{ marginBottom:22 }}>
                <div style={{ display:"flex",alignItems:"baseline",gap:5,flexWrap:"wrap" }}>
                  <span style={{ fontSize:32,fontWeight:900,color:"#111827" }}>{exc.price_per_person}</span>
                  <span style={{ fontSize:15,fontWeight:600,color:"#374151" }}>TND</span>
                  <span style={{ fontSize:13,color:"#9CA3AF" }}>/ personne</span>
                </div>
                {avgRating && (
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:8 }}>
                    {STARS.map(s => <span key={s} style={{ fontSize:14,color:s<=Math.round(Number(avgRating))?"#F59E0B":"#E5E7EB" }}>★</span>)}
                    <span style={{ fontSize:14,fontWeight:700,color:"#374151" }}>{avgRating}</span>
                    <span style={{ fontSize:12,color:"#9CA3AF" }}>({avis.length})</span>
                  </div>
                )}
              </div>

              {/* Infos */}
              <div style={{ background:"#F9FAFB",borderRadius:14,padding:"14px 16px",marginBottom:20 }}>
                {[
                  { icon:"⏱️",label:"Durée",val:`${exc.duration_hours}h` },
                  { icon:"👥",label:"Max",val:`${exc.max_people} personnes` },
                  { icon:"📍",label:"Lieu",val:exc.city },
                ].map((r,i) => (
                  <div key={r.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<2?"1px solid #EBEBEB":"none" }}>
                    <span style={{ fontSize:13,color:"#6B7280" }}>{r.icon} {r.label}</span>
                    <span style={{ fontSize:13,fontWeight:700,color:"#111827" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              {/* CTA Réserver */}
              <button
                onClick={() => { if(!user){sessionStorage.setItem("redirect_after_login",`/excursions/${exc.id}`);window.location.href="/auth";return;} setShowCheckout(true); }}
                style={{ width:"100%",padding:"15px",background:"#111827",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s",marginBottom:10 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#1f2937"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="#111827"}>
                {user ? "🗓️ Réserver maintenant" : "🔒 Connexion pour réserver"}
              </button>

              <button onClick={toggleFav}
                style={{ width:"100%",padding:"12px",background:isFav?"#FEF2F2":"#F9FAFB",color:isFav?"#DC2626":"#374151",border:`1.5px solid ${isFav?"#FECACA":"#E5E7EB"}`,borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s" }}>
                {isFav ? "❤️ Retiré des favoris" : "🤍 Ajouter aux favoris"}
              </button>

              {/* ── PRESTATAIRE CLIQUABLE ── */}
              {prestataire && (
                <div style={{ marginTop:18,paddingTop:16,borderTop:"1px solid #F3F4F6" }}>
                  <p style={{ fontSize:11,fontWeight:700,color:"#9CA3AF",letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Votre guide</p>
                  <div className="prest-card" onClick={() => setShowPrestataire(true)}>
                    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                      {/* Avatar */}
                      <div style={{ width:46,height:46,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"2px solid #F0F0F0" }}>
                        {prestataire.avatar_url
                          ? <img src={prestataire.avatar_url} alt={prestName} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                          : (
                            <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#2B96A8,#1e7a8a)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:18 }}>
                              {prestName[0].toUpperCase()}
                            </div>
                          )
                        }
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:13,fontWeight:800,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{prestName}</p>
                        {prestataire.city && <p style={{ fontSize:11,color:"#9CA3AF",marginTop:1 }}>📍 {prestataire.city}</p>}
                        <p style={{ fontSize:11,color:"#059669",fontWeight:600,marginTop:2 }}>✅ Prestataire vérifié</p>
                      </div>
                      <span style={{ fontSize:16,color:"#9CA3AF" }}>→</span>
                    </div>
                    <p style={{ fontSize:11,color:"#2B96A8",fontWeight:600,marginTop:8,textAlign:"center" }}>Voir le profil</p>
                  </div>
                </div>
              )}

              {/* Garanties */}
              <div style={{ marginTop:18,paddingTop:16,borderTop:"1px solid #F3F4F6",display:"flex",flexDirection:"column",gap:7 }}>
                {["🔒 Paiement 100% sécurisé","↩️ Annulation gratuite 24h avant","💬 Support disponible 7j/7"].map(g => (
                  <p key={g} style={{ fontSize:12,color:"#6B7280",display:"flex",alignItems:"center",gap:6 }}>{g}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL RÉSERVATION ── */}
      {showCheckout && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowCheckout(false); }}>
          <div className="modal fu">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"#111827" }}>Réserver</h2>
              <button onClick={() => setShowCheckout(false)} style={{ background:"#F3F4F6",border:"none",fontSize:18,cursor:"pointer",color:"#9CA3AF",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            </div>
            <div style={{ background:"#F9FAFB",borderRadius:14,padding:"14px 16px",marginBottom:22 }}>
              <p style={{ fontSize:15,fontWeight:700,color:"#111827" }}>{exc.title}</p>
              <p style={{ fontSize:13,color:"#6B7280",marginTop:3 }}>📍 {exc.city} · ⏱️ {exc.duration_hours}h · {exc.price_per_person} TND/pers.</p>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:16,marginBottom:22 }}>
              <div>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",letterSpacing:.5,textTransform:"uppercase",marginBottom:7 }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width:"100%",padding:"13px 14px",border:"1.5px solid #E5E7EB",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#111827",transition:"border-color .2s" }}
                  onFocus={e => e.currentTarget.style.borderColor="#2B96A8"}
                  onBlur={e => e.currentTarget.style.borderColor="#E5E7EB"}
                />
              </div>
              <div>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:"#374151",letterSpacing:.5,textTransform:"uppercase",marginBottom:7 }}>Personnes</label>
                <div style={{ display:"flex",alignItems:"center",border:"1.5px solid #E5E7EB",borderRadius:12,overflow:"hidden" }}>
                  <button type="button" onClick={() => setPeople(p => Math.max(1,p-1))} style={{ width:48,padding:"13px",background:"#F9FAFB",border:"none",borderRight:"1px solid #E5E7EB",cursor:"pointer",fontSize:20,fontWeight:700,color:"#374151" }}>−</button>
                  <span style={{ flex:1,textAlign:"center",fontSize:16,fontWeight:800,color:"#111827" }}>{people}</span>
                  <button type="button" onClick={() => setPeople(p => Math.min(exc.max_people,p+1))} style={{ width:48,padding:"13px",background:"#F9FAFB",border:"none",borderLeft:"1px solid #E5E7EB",cursor:"pointer",fontSize:20,fontWeight:700,color:"#374151" }}>+</button>
                </div>
                <p style={{ fontSize:11,color:"#9CA3AF",marginTop:5 }}>Max {exc.max_people} personnes</p>
              </div>
            </div>
            <div style={{ background:"#F9FAFB",borderRadius:14,padding:"14px 16px",marginBottom:20 }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#6B7280",marginBottom:6 }}>
                <span>{exc.price_per_person} TND × {people} pers.</span><span>{totalPrice} TND</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#6B7280",marginBottom:10 }}>
                <span>Frais de service (10%)</span><span>{commission} TND</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:900,color:"#111827",borderTop:"1px solid #E5E7EB",paddingTop:10 }}>
                <span>Total</span><span style={{ color:"#2B96A8" }}>{totalPrice+commission} TND</span>
              </div>
            </div>
            <button disabled={!date}
              onClick={() => { alert("Paiement en cours d'intégration !"); setShowCheckout(false); }}
              style={{ width:"100%",padding:"15px",background:date?"#111827":"#E5E7EB",color:date?"white":"#9CA3AF",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:date?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif" }}>
              {date ? `Confirmer — ${totalPrice+commission} TND →` : "Choisissez d'abord une date"}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL PRESTATAIRE ── */}
      {showPrestataire && prestataire && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowPrestataire(false); }}>
          <div className="modal fu">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"#111827" }}>Votre guide</h2>
              <button onClick={() => setShowPrestataire(false)} style={{ background:"#F3F4F6",border:"none",fontSize:18,cursor:"pointer",color:"#9CA3AF",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            </div>

            {/* Avatar + nom */}
            <div style={{ display:"flex",alignItems:"center",gap:18,marginBottom:20,paddingBottom:18,borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ width:76,height:76,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"3px solid #F0F0F0",boxShadow:"0 4px 16px rgba(0,0,0,.08)" }}>
                {prestataire.avatar_url
                  ? <img src={prestataire.avatar_url} alt={prestName} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                  : (
                    <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#2B96A8,#4AABB8)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:28 }}>
                      {prestName[0].toUpperCase()}
                    </div>
                  )
                }
              </div>
              <div>
                <h3 style={{ fontSize:18,fontWeight:800,color:"#111827",marginBottom:4 }}>{prestName}</h3>
                {prestataire.full_name && prestataire.agency_name && (
                  <p style={{ fontSize:13,color:"#6B7280",marginBottom:6 }}>👤 {prestataire.full_name}</p>
                )}
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  <span style={{ padding:"3px 10px",background:"#F0FDF4",color:"#15803D",borderRadius:20,fontSize:11,fontWeight:700,border:"1px solid #BBF7D0" }}>✅ Prestataire vérifié</span>
                  {prestataire.city && (
                    <span style={{ padding:"3px 10px",background:"#F3F4F6",color:"#374151",borderRadius:20,fontSize:11,fontWeight:600 }}>📍 {prestataire.city}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {prestataire.description && (
              <div style={{ background:"#F9FAFB",borderRadius:12,padding:"14px 16px",marginBottom:18 }}>
                <p style={{ fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:.5,marginBottom:7 }}>À propos</p>
                <p style={{ fontSize:14,color:"#374151",lineHeight:1.75 }}>{prestataire.description}</p>
              </div>
            )}

            {/* Coordonnées */}
            {prestataire.phone && (
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"10px 0",borderBottom:"1px solid #F9FAFB",marginBottom:10 }}>
                <span style={{ color:"#6B7280" }}>📞 Téléphone</span>
                <span style={{ fontWeight:700,color:"#111827" }}>{prestataire.phone}</span>
              </div>
            )}

            <button onClick={() => setShowPrestataire(false)}
              style={{ width:"100%",padding:"13px",background:"#111827",color:"white",border:"none",borderRadius:14,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:8 }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}