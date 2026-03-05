"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const SLIDES = [
  { url: "https://images.pexels.com/photos/27599624/pexels-photo-27599624.jpeg?auto=compress&cs=tinysrgb&w=1800", city: "Sidi Bou Saïd", region: "Gouvernorat de Tunis", desc: "Le village aux maisons bleues et blanches suspendu sur la Méditerranée", color: "#2B96A8", emoji: "🏛️" },
  { url: "/images/sahara.webp", city: "Désert du Sahara", region: "Gouvernorat de Kébili", desc: "Dunes infinies, nuits étoilées et silence absolu à Douz", color: "#D97706", emoji: "🐪" },
  { url: "https://images.pexels.com/photos/27631749/pexels-photo-27631749.jpeg?auto=compress&cs=tinysrgb&w=1800", city: "Médina de Tunis", region: "Patrimoine UNESCO", desc: "Labyrinthe millénaire de ruelles, souks et palais ottomans", color: "#7C3AED", emoji: "🕌" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=90&fit=crop", city: "Île de Djerba", region: "Gouvernorat de Médenine", desc: "Plages de sable blanc et eaux turquoise de la Méditerranée", color: "#059669", emoji: "🏖️" },
  { url: "/images/Tozeur.jpg", city: "Tozeur & Oasis", region: "Sud-Ouest tunisien", desc: "Palmiers, sources d'eau fraîche et architecture en briques de sable", color: "#B45309", emoji: "🌴" },
];

const EXCURSIONS_PREVIEW = [
  { title: "Médina de Tunis", city: "Tunis", price: 45, duration: "3h", rating: 4.9, reviews: 128, tag: "Bestseller", tagColor: "#2B96A8", img: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop" },
  { title: "Sidi Bou Saïd", city: "Tunis", price: 35, duration: "2h30", rating: 4.8, reviews: 94, tag: "Populaire", tagColor: "#7C3AED", img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80&fit=crop" },
  { title: "Sahara à Douz", city: "Kébili", price: 95, duration: "Journée", rating: 5.0, reviews: 67, tag: "Coup de ❤️", tagColor: "#DC2626", img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80&fit=crop" },
  { title: "Île de Djerba", city: "Djerba", price: 55, duration: "Demi-journée", rating: 4.7, reviews: 203, tag: "Nouveauté", tagColor: "#059669", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&fit=crop" },
  { title: "Oasis de Tozeur", city: "Tozeur", price: 75, duration: "5h", rating: 4.9, reviews: 45, tag: "Exclusif", tagColor: "#D97706", img: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80&fit=crop" },
  { title: "El Jem — Amphithéâtre", city: "El Jem", price: 40, duration: "4h", rating: 4.8, reviews: 112, tag: "Incontournable", tagColor: "#2B96A8", img: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop" },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [favCount, setFavCount] = useState(0);
  const supabase = createClient();

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email });
        // Get fav count
        supabase.from("favoris").select("id", { count: "exact", head: true })
          .eq("touriste_id", data.user.id)
          .then(({ count }) => setFavCount(count || 0));
      }
    });
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const goTo = useCallback((idx: number) => {
    if (idx === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); setProgress(0); }, 500);
  }, [current]);

  useEffect(() => {
    const DURATION = 6000; const TICK = 60; let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += TICK;
      setProgress((elapsed / DURATION) * 100);
      if (elapsed >= DURATION) {
        elapsed = 0;
        setFading(true);
        setTimeout(() => { setCurrent((p) => (p + 1) % SLIDES.length); setFading(false); setProgress(0); }, 500);
      }
    }, TICK);
    return () => clearInterval(timer);
  }, [current]);

  const slide = SLIDES[current];

  const handleAuthRequired = (e: React.MouseEvent, action: string) => {
    if (!user) {
      e.preventDefault();
      // Save intended destination and redirect to auth
      sessionStorage.setItem("redirect_after_login", action);
      window.location.href = "/auth";
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'DM Sans',sans-serif;background:#FAFAF9}
        .nav-a{text-decoration:none;font-size:14px;font-weight:500;transition:color 0.2s}
        .nav-a:hover{color:#2B96A8!important}
        .slide-bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity 0.6s ease,transform 0.6s ease}
        .exc-card{border-radius:18px;overflow:hidden;background:white;border:1px solid #F3F4F6;transition:all 0.25s ease;cursor:pointer}
        .exc-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,0.1)}
        .exc-card img{transition:transform 0.4s ease}
        .exc-card:hover img{transform:scale(1.05)}
        .path-card{flex:1;padding:28px 22px;border-radius:20px;border:1.5px solid;cursor:pointer;transition:all 0.3s;backdrop-filter:blur(16px);display:flex;flex-direction:column;gap:10px}
        .path-card:hover{transform:translateY(-4px);filter:brightness(1.15)}
        .heart-btn{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
        .heart-btn:hover{transform:scale(1.15)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.7s ease forwards;opacity:0}
        .fu1{animation-delay:0.1s}.fu2{animation-delay:0.25s}.fu3{animation-delay:0.4s}.fu4{animation-delay:0.55s}
        @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:68, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 52px", background:scrolled?"rgba(255,255,255,0.97)":"transparent", backdropFilter:scrolled?"blur(20px)":"none", borderBottom:scrolled?"1px solid rgba(0,0,0,0.07)":"none", transition:"all 0.35s" }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#2B96A8"/>
            <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
          </svg>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:scrolled?"#111":"white", transition:"color 0.3s", letterSpacing:"-0.3px" }}>voyajaime</span>
        </Link>

        <nav style={{ display:"flex", alignItems:"center", gap:28 }}>
          <Link href="/excursions" className="nav-a" style={{ color:scrolled?"#374151":"rgba(255,255,255,0.88)" }}>Excursions</Link>
          <a href="#chemins" className="nav-a" style={{ color:scrolled?"#374151":"rgba(255,255,255,0.88)" }}>Comment ça marche</a>

          {/* Favoris — nécessite auth */}
          {user ? (
            <Link href="/touriste/favoris" style={{ position:"relative", textDecoration:"none", color:scrolled?"#374151":"rgba(255,255,255,0.88)", fontSize:14, fontWeight:500 }}>
               Favoris
              {favCount > 0 && (
                <span style={{ position:"absolute", top:-6, right:-10, background:"#DC2626", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {favCount}
                </span>
              )}
            </Link>
          ) : (
            <button onClick={(e) => handleAuthRequired(e, "/touriste/favoris")}
              style={{ background:"none", border:"none", cursor:"pointer", color:scrolled?"#374151":"rgba(255,255,255,0.88)", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif" }}>
               Favoris
            </button>
          )}

          {user ? (
            <Link href="/touriste/reservations" style={{ padding:"10px 20px", background:scrolled?"#2B96A8":"rgba(255,255,255,0.18)", border:scrolled?"none":"1.5px solid rgba(255,255,255,0.45)", color:"white", borderRadius:30, textDecoration:"none", fontSize:14, fontWeight:700, transition:"all 0.2s", backdropFilter:"blur(8px)" }}>
              Mon espace
            </Link>
          ) : (
            <Link href="/auth" style={{ padding:"10px 22px", background:scrolled?"#2B96A8":"rgba(255,255,255,0.18)", border:scrolled?"none":"1.5px solid rgba(255,255,255,0.45)", color:"white", borderRadius:30, textDecoration:"none", fontSize:14, fontWeight:700, backdropFilter:"blur(8px)", transition:"all 0.2s" }}>
              Connexion
            </Link>
          )}
        </nav>
      </header>

      {/* ── HERO SLIDER ── */}
      <section style={{ position:"relative", height:"100vh", overflow:"hidden" }}>
        <div className="slide-bg" style={{ backgroundImage:`url(${slide.url})`, opacity:fading?0:1, transform:fading?"scale(1.03)":"scale(1)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 55%,rgba(0,0,0,0.05) 100%)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 50%)" }} />

        {/* Content */}
        <div key={current} style={{ position:"absolute", top:"50%", left:72, transform:"translateY(-54%)", maxWidth:560 }}>
          <div className="fu fu1" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:30, background:slide.color+"28", border:`1px solid ${slide.color}55`, backdropFilter:"blur(10px)", marginBottom:18 }}>
            <span style={{ fontSize:16 }}>{slide.emoji}</span>
            <span style={{ fontSize:11, fontWeight:700, color:"white", letterSpacing:1, textTransform:"uppercase" }}>{slide.region}</span>
          </div>
          <h1 className="fu fu2" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(42px,5.5vw,68px)", fontWeight:900, color:"white", lineHeight:1.08, letterSpacing:"-1.5px", marginBottom:16, textShadow:"0 2px 24px rgba(0,0,0,0.25)" }}>
            {slide.city}
          </h1>
          <p className="fu fu3" style={{ fontSize:17, color:"rgba(255,255,255,0.82)", lineHeight:1.65, marginBottom:36 }}>{slide.desc}</p>
          <div className="fu fu4" style={{ display:"flex", gap:12 }}>
            <a href="#chemins" style={{ padding:"14px 28px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:15, fontWeight:700, boxShadow:"0 8px 28px rgba(43,150,168,0.5)", display:"flex", alignItems:"center", gap:8 }}>
              ✨ Planifier mon voyage
            </a>
            <Link href="/excursions" style={{ padding:"14px 24px", background:"rgba(255,255,255,0.13)", backdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.38)", color:"white", borderRadius:12, textDecoration:"none", fontSize:15, fontWeight:600 }}>
              Voir les excursions
            </Link>
          </div>
        </div>

        {/* Dots */}
        <div style={{ position:"absolute", bottom:40, left:72, display:"flex", gap:10, alignItems:"center" }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              {i === current ? (
                <div style={{ width:36, height:6, borderRadius:3, background:slide.color, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${progress}%`, background:"rgba(255,255,255,0.6)", transition:"width 0.06s linear" }} />
                </div>
              ) : (
                <div style={{ width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.4)" }} />
              )}
            </button>
          ))}
        </div>
        <div style={{ position:"absolute", bottom:44, right:72, fontSize:13, color:"rgba(255,255,255,0.45)", fontWeight:600, letterSpacing:1 }}>
          {String(current+1).padStart(2,"0")} / {String(SLIDES.length).padStart(2,"0")}
        </div>
        <div style={{ position:"absolute", bottom:32, left:"50%", animation:"bounce 2s infinite" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* ── CHEMINS PRINCIPAUX ── */}
      <section id="chemins" style={{ position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`url(${SLIDES[2].url})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(3px) brightness(0.4)", transform:"scale(1.05)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(5,15,25,0.6)" }} />

        <div style={{ position:"relative", zIndex:1, padding:"90px 72px 100px", maxWidth:1160, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"#2B96A8", textTransform:"uppercase", marginBottom:14 }}>CHEMINS PRINCIPAUX</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(32px,4vw,50px)", fontWeight:900, color:"white", letterSpacing:"-1px" }}>
              Explorez la Tunisie<br/>à votre façon
            </h2>
            <p style={{ marginTop:14, fontSize:16, color:"rgba(255,255,255,0.6)" }}>
              Trouvez votre aventure idéale ou composez votre séjour sur mesure
            </p>
          </div>

          <div style={{ display:"flex", gap:16 }}>
            {/* Mode Assisté */}
            <div className="path-card" style={{ background:"rgba(43,150,168,0.18)", borderColor:"rgba(43,150,168,0.4)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(43,150,168,0.3)", border:"1px solid rgba(43,150,168,0.5)", alignSelf:"flex-start" }}>
                <span style={{ fontSize:10, fontWeight:800, color:"#7EDCED", letterSpacing:0.8 }}>✨ RAPIDE</span>
              </div>
              <div style={{ fontSize:36 }}>🤖</div>
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", marginBottom:2 }}>Mode Assisté</h3>
                <p style={{ fontSize:12, color:"#7EDCED", fontWeight:600 }}>Rapide & Intelligent</p>
              </div>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.72)", lineHeight:1.6 }}>
                Répondez à 3 questions, on génère votre itinéraire jour par jour automatiquement
              </p>
              <Link href={user ? "/touriste/itineraire?mode=assiste" : "/auth?redirect=itineraire"} style={{ display:"inline-flex", alignItems:"center", padding:"11px 20px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700, marginTop:"auto", boxShadow:"0 6px 20px rgba(43,150,168,0.45)" }}>
                Je veux qu&apos;on me propose →
              </Link>
            </div>

            {/* Mode Libre */}
            <div className="path-card" style={{ background:"rgba(255,255,255,0.1)", borderColor:"rgba(255,255,255,0.25)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", alignSelf:"flex-start" }}>
                <span style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.65)", letterSpacing:0.8 }}>🗺️ FLEXIBLE</span>
              </div>
              <div style={{ fontSize:36 }}>📋</div>
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", marginBottom:2 }}>Mode Libre</h3>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>Totalement personnalisé</p>
              </div>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.72)", lineHeight:1.6 }}>
                Construisez votre voyage de A à Z — choisissez chaque excursion, chaque jour
              </p>
              <Link href={user ? "/touriste/itineraire?mode=libre" : "/auth?redirect=itineraire"} style={{ display:"inline-flex", padding:"11px 20px", background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.35)", color:"white", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700, marginTop:"auto" }}>
                Je veux décider moi-même →
              </Link>
            </div>

            {/* Juste Browser */}
            <div className="path-card" style={{ background:"rgba(255,255,255,0.06)", borderColor:"rgba(255,255,255,0.18)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", alignSelf:"flex-start" }}>
                <span style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.55)", letterSpacing:0.8 }}>🔍 EXPLORER</span>
              </div>
              <div style={{ fontSize:36 }}>🏔️</div>
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", marginBottom:2 }}>Juste Explorer</h3>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:600 }}>Naviguez librement</p>
              </div>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>
                Parcourez toutes les excursions disponibles — pas besoin de compte pour regarder
              </p>
              <Link href="/excursions" style={{ display:"inline-flex", padding:"11px 20px", background:"transparent", border:"1.5px solid rgba(255,255,255,0.25)", color:"rgba(255,255,255,0.8)", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700, marginTop:"auto" }}>
                Voir toutes les excursions →
              </Link>
            </div>
          </div>

          {/* Prestataire link */}
          <div style={{ textAlign:"center", marginTop:40 }}>
            <Link href="/auth?type=prestataire" style={{ fontSize:14, color:"rgba(255,255,255,0.45)", textDecoration:"none", borderBottom:"1px solid rgba(255,255,255,0.2)", paddingBottom:2 }}>
              Vous êtes prestataire ? Inscrivez votre activité →
            </Link>
          </div>
        </div>
      </section>

      {/* ── EXCURSIONS POPULAIRES ── */}
      <section style={{ padding:"90px 72px", background:"white" }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:44 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"#2B96A8", textTransform:"uppercase", marginBottom:10 }}>EXCURSIONS</p>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, color:"#111827", letterSpacing:"-0.5px" }}>Les plus populaires</h2>
            </div>
            <Link href="/excursions" style={{ fontSize:14, color:"#2B96A8", fontWeight:600, textDecoration:"none" }}>Voir toutes →</Link>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {EXCURSIONS_PREVIEW.map((exc, i) => (
              <div key={i} className="exc-card">
                <div style={{ position:"relative", height:200, overflow:"hidden" }}>
                  <img src={exc.img} alt={exc.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  <div style={{ position:"absolute", top:12, left:12 }}>
                    <span style={{ padding:"4px 10px", background:exc.tagColor, borderRadius:20, fontSize:11, fontWeight:700, color:"white" }}>{exc.tag}</span>
                  </div>
                  {/* Cœur — nécessite auth */}
                  <button className="heart-btn"
                    onClick={(e) => {
                      if (!user) { e.preventDefault(); sessionStorage.setItem("redirect_after_login", "/excursions"); window.location.href = "/auth"; }
                    }}
                    title={user ? "Ajouter aux favoris" : "Connectez-vous pour sauvegarder"}
                  >
                    {user ? "♡" : "🔒"}
                  </button>
                </div>
                <div style={{ padding:"16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:2 }}>{exc.title}</h3>
                      <p style={{ fontSize:12, color:"#9CA3AF" }}>📍 {exc.city}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{exc.price} <span style={{ fontSize:12, fontWeight:500 }}>TND</span></p>
                      <p style={{ fontSize:11, color:"#9CA3AF" }}>/ personne</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                    <div style={{ display:"flex", gap:12 }}>
                      <span style={{ fontSize:12, color:"#6B7280" }}>⏱️ {exc.duration}</span>
                      <span style={{ fontSize:12, color:"#6B7280" }}>⭐ {exc.rating} ({exc.reviews})</span>
                    </div>
                    <button
                      onClick={(e) => { if (!user) { e.preventDefault(); sessionStorage.setItem("redirect_after_login", "/excursions"); window.location.href = "/auth"; } }}
                      style={{ padding:"7px 14px", background:user?"#2B96A8":"#E5E7EB", color:user?"white":"#6B7280", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                    >
                      {user ? "Réserver" : "🔒 Réserver"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Guest CTA */}
          {!user && (
            <div style={{ marginTop:48, padding:"32px 40px", background:"linear-gradient(135deg,#EFF9FB,#F0FFFE)", border:"1.5px solid #B2E3EB", borderRadius:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:6 }}>Envie de sauvegarder ou réserver ?</h3>
                <p style={{ fontSize:14, color:"#6B7280" }}>Créez un compte gratuit pour accéder aux favoris, réservations et paiements</p>
              </div>
              <div style={{ display:"flex", gap:10, flexShrink:0 }}>
                <Link href="/auth" style={{ padding:"12px 24px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(43,150,168,0.35)" }}>
                  Créer un compte
                </Link>
                <Link href="/auth" style={{ padding:"12px 20px", background:"white", border:"1.5px solid #E5E7EB", color:"#374151", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:600 }}>
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#0D1117", padding:"32px 72px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#2B96A8"/>
            <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
          </svg>
          <span style={{ fontFamily:"'Playfair Display',serif", color:"white", fontWeight:700, fontSize:16 }}>voyajaime</span>
        </div>
        <p style={{ color:"#4B5563", fontSize:13 }}>© 2026 VoyajAime — Tourisme en Tunisie 🇹🇳</p>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <Link href="/excursions" style={{ color:"#6B7280", fontSize:13, textDecoration:"none" }}>Excursions</Link>
          {user
            ? <Link href="/touriste/reservations" style={{ padding:"9px 18px", background:"#2B96A8", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700 }}>Mon espace</Link>
            : <Link href="/auth" style={{ padding:"9px 18px", background:"#2B96A8", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700 }}>Connexion</Link>
          }
        </div>
      </footer>
    </>
  );
}