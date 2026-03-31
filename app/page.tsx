"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import {
  Heart, Lock, MapPin, Clock, Star, ChevronDown,
  ArrowRight, Sparkles, Map, Search, Bot, ClipboardList,
  Mountain, User, CalendarCheck, UserPlus, LogIn, Menu, X,
} from "lucide-react";

const SLIDES = [
  { url: "https://images.pexels.com/photos/27599624/pexels-photo-27599624.jpeg?auto=compress&cs=tinysrgb&w=1800", city: "Sidi Bou Saïd", region: "Gouvernorat de Tunis", desc: "Le village aux maisons bleues et blanches suspendu sur la Méditerranée", color: "#2B96A8" },
  { url: "/images/sahara.webp", city: "Désert du Sahara", region: "Gouvernorat de Kébili", desc: "Dunes infinies, nuits étoilées et silence absolu à Douz", color: "#D97706" },
  { url: "https://images.pexels.com/photos/27631749/pexels-photo-27631749.jpeg?auto=compress&cs=tinysrgb&w=1800", city: "Médina de Tunis", region: "Patrimoine UNESCO", desc: "Labyrinthe millénaire de ruelles, souks et palais ottomans", color: "#7C3AED" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=90&fit=crop", city: "Île de Djerba", region: "Gouvernorat de Médenine", desc: "Plages de sable blanc et eaux turquoise de la Méditerranée", color: "#059669" },
  { url: "/images/Tozeur.jpg", city: "Tozeur & Oasis", region: "Sud-Ouest tunisien", desc: "Palmiers, sources d'eau fraîche et architecture en briques de sable", color: "#B45309" },
];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

interface Excursion {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number;
  photos: string[]; categories: string[];
}

const Logo = ({ size = 32 }: { size?: number }) => (
  <img src="/brandmark.png" alt="VoyajAime" width={size} height={size} style={{ objectFit:"contain", display:"block" }} />
);

const SkeletonCard = () => (
  <div style={{ borderRadius:18, overflow:"hidden", background:"white", border:"1px solid #F3F4F6" }}>
    <div style={{ height:200, background:"linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ height:16, width:"70%", borderRadius:6, background:"#F3F4F6" }} />
      <div style={{ height:12, width:"40%", borderRadius:6, background:"#F3F4F6" }} />
      <div style={{ height:12, width:"55%", borderRadius:6, background:"#F3F4F6" }} />
    </div>
  </div>
);

export default function HomePage() {
  const [current,    setCurrent]    = useState(0);
  const [fading,     setFading]     = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [user,       setUser]       = useState<{ email?: string; id?: string } | null>(null);
  const [favCount,   setFavCount]   = useState(0);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excLoading, setExcLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  // Auth + favoris
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email, id: data.user.id });
        supabase.from("favoris").select("id", { count: "exact", head: true })
          .eq("touriste_id", data.user.id)
          .then(({ count }) => setFavCount(count || 0));
      }
    });
  }, []);

  // Excursions depuis Supabase
  useEffect(() => {
    supabase
      .from("excursions")
      .select("id, title, city, price_per_person, duration_hours, rating, reviews_count, photos, categories")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!error && data) setExcursions(data);
        setExcLoading(false);
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
        setTimeout(() => { setCurrent(p => (p + 1) % SLIDES.length); setFading(false); setProgress(0); }, 500);
      }
    }, TICK);
    return () => clearInterval(timer);
  }, [current]);

  const slide = SLIDES[current];

  const handleAuthRequired = (e: React.MouseEvent, redirect: string) => {
    if (!user) {
      e.preventDefault();
      sessionStorage.setItem("redirect_after_login", redirect);
      window.location.href = ROUTES.auth;
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
        .exc-card{border-radius:18px;overflow:hidden;background:white;border:1px solid #F3F4F6;transition:all 0.25s ease;cursor:pointer;text-decoration:none;display:block;color:inherit}
        .exc-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,0.1)}
        .exc-card img{transition:transform 0.4s ease;display:block}
        .exc-card:hover img{transform:scale(1.05)}
        .path-card{flex:1;padding:28px 22px;border-radius:20px;border:1.5px solid;cursor:pointer;transition:all 0.3s;backdrop-filter:blur(16px);display:flex;flex-direction:column;gap:10px}
        .path-card:hover{transform:translateY(-4px);filter:brightness(1.15)}
        .heart-btn{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:2}
        .heart-btn:hover{transform:scale(1.15)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.7s ease forwards;opacity:0}
        .fu1{animation-delay:0.1s}.fu2{animation-delay:0.25s}.fu3{animation-delay:0.4s}.fu4{animation-delay:0.55s}
        @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .mobile-stack { flex-direction: column !important; }
          .mobile-padding { padding: 0 20px !important; }
          .hero-title { font-size: 32px !important; }
          .hero-desc { font-size: 14px !important; margin-bottom: 24px !important; }
          .hero-buttons { flex-direction: column !important; gap: 12px !important; width: 100% !important; }
          .hero-buttons a, .hero-buttons button { width: 100% !important; justify-content: center !important; }
          .section-padding { padding: 50px 20px !important; }
          .grid-cols-3 { grid-template-columns: 1fr !important; gap: 16px !important; }
          .paths-container { flex-direction: column !important; gap: 20px !important; }
          .guest-cta { flex-direction: column !important; text-align: center !important; gap: 20px !important; }
          .guest-cta-buttons { width: 100% !important; flex-direction: column !important; }
          .footer { flex-direction: column !important; gap: 20px !important; text-align: center !important; padding: 32px 20px !important; }
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-menu { position: fixed; top: 68px; left: 0; right: 0; background: white; padding: 20px; flex-direction: column; gap: 16px; border-bottom: 1px solid #F3F4F6; z-index: 199; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
          .hero-content { left: 20px !important; right: 20px !important; max-width: none !important; width: auto !important; transform: translateY(-50%) !important; }
          .slider-dots { left: 20px !important; bottom: 30px !important; }
          .slider-counter { right: 20px !important; bottom: 30px !important; }
          .navbar { padding: 0 20px !important; }
          .footer-links { flex-wrap: wrap !important; justify-content: center !important; gap: 12px !important; }
        }
        
        @media (max-width: 480px) {
          .hero-title { font-size: 28px !important; }
          .section-title { font-size: 28px !important; }
          .path-card { padding: 20px 16px !important; }
          .exc-card { margin: 0 !important; }
        }
        
        .show-mobile { display: none; }
        .mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; align-items: center; justify-content: center; }
      `}</style>

      {/* ── NAVBAR ── */}
      <header className="navbar" style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:68, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 52px", background:scrolled?"rgba(255,255,255,0.97)":"transparent", backdropFilter:scrolled?"blur(20px)":"none", borderBottom:scrolled?"1px solid rgba(0,0,0,0.07)":"none", transition:"all 0.35s" }}>
        <Link href={ROUTES.home} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <Logo size={32} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:scrolled?"#111":"white", transition:"color 0.3s", letterSpacing:"-0.3px" }}>voyajaime</span>
        </Link>

        <nav className="nav-links" style={{ display:"flex", alignItems:"center", gap:28 }}>
          <Link href={ROUTES.excursions} className="nav-a" style={{ color:scrolled?"#374151":"rgba(255,255,255,0.88)" }}>Excursions</Link>
          <a href="#chemins" className="nav-a" style={{ color:scrolled?"#374151":"rgba(255,255,255,0.88)" }}>Comment ça marche</a>

          {user ? (
            <Link href={ROUTES.touriste.favoris} style={{ position:"relative", textDecoration:"none", color:scrolled?"#374151":"rgba(255,255,255,0.88)", fontSize:14, fontWeight:500, display:"flex", alignItems:"center", gap:5 }}>
              <Heart size={15} /> Favoris
              {favCount > 0 && (
                <span style={{ position:"absolute", top:-6, right:-10, background:"#DC2626", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {favCount}
                </span>
              )}
            </Link>
          ) : (
            <button onClick={e => handleAuthRequired(e, ROUTES.touriste.favoris)}
              style={{ background:"none", border:"none", cursor:"pointer", color:scrolled?"#374151":"rgba(255,255,255,0.88)", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:5 }}>
              <Heart size={15} /> Favoris
            </button>
          )}

          {user ? (
            <Link href={ROUTES.excursions} style={{ padding:"10px 20px", background:scrolled?"#2B96A8":"rgba(255,255,255,0.18)", border:scrolled?"none":"1.5px solid rgba(255,255,255,0.45)", color:"white", borderRadius:30, textDecoration:"none", fontSize:14, fontWeight:700, transition:"all 0.2s", backdropFilter:"blur(8px)", display:"inline-flex", alignItems:"center", gap:6 }}>
              <User size={14} /> Mon espace
            </Link>
          ) : (
            <Link href={ROUTES.auth} style={{ padding:"10px 22px", background:scrolled?"#2B96A8":"rgba(255,255,255,0.18)", border:scrolled?"none":"1.5px solid rgba(255,255,255,0.45)", color:"white", borderRadius:30, textDecoration:"none", fontSize:14, fontWeight:700, backdropFilter:"blur(8px)", transition:"all 0.2s", display:"inline-flex", alignItems:"center", gap:6 }}>
              <LogIn size={14} /> Connexion
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: scrolled ? "#374151" : "white" }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu" style={{ position:"fixed", top:68, left:0, right:0, background:"white", padding:"20px", flexDirection:"column", gap:16, borderBottom:"1px solid #F3F4F6", zIndex:199, boxShadow:"0 8px 16px rgba(0,0,0,0.1)", display:"flex" }}>
          <Link href={ROUTES.excursions} style={{ textDecoration:"none", fontSize:16, fontWeight:500, color:"#374151", padding:"8px 0" }} onClick={() => setMobileMenuOpen(false)}>Excursions</Link>
          <a href="#chemins" style={{ textDecoration:"none", fontSize:16, fontWeight:500, color:"#374151", padding:"8px 0" }} onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a>
          
          {user ? (
            <Link href={ROUTES.touriste.favoris} style={{ textDecoration:"none", fontSize:16, fontWeight:500, color:"#374151", padding:"8px 0", display:"flex", alignItems:"center", gap:5 }} onClick={() => setMobileMenuOpen(false)}>
              <Heart size={16} /> Favoris {favCount > 0 && <span style={{ background:"#DC2626", color:"white", borderRadius:"50%", width:18, height:18, fontSize:11, display:"inline-flex", alignItems:"center", justifyContent:"center", marginLeft:6 }}>{favCount}</span>}
            </Link>
          ) : (
            <button onClick={e => { handleAuthRequired(e, ROUTES.touriste.favoris); setMobileMenuOpen(false); }} style={{ background:"none", border:"none", fontSize:16, fontWeight:500, color:"#374151", padding:"8px 0", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
              <Heart size={16} /> Favoris
            </button>
          )}
          
          {user ? (
            <Link href={ROUTES.excursions} style={{ padding:"10px 20px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6, justifyContent:"center" }} onClick={() => setMobileMenuOpen(false)}>
              <User size={14} /> Mon espace
            </Link>
          ) : (
            <Link href={ROUTES.auth} style={{ padding:"10px 20px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6, justifyContent:"center" }} onClick={() => setMobileMenuOpen(false)}>
              <LogIn size={14} /> Connexion
            </Link>
          )}
        </div>
      )}

      {/* ── HERO SLIDER ── */}
      <section style={{ position:"relative", height:"100vh", overflow:"hidden" }}>
        <div className="slide-bg" style={{ backgroundImage:`url(${slide.url})`, opacity:fading?0:1, transform:fading?"scale(1.03)":"scale(1)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 55%,rgba(0,0,0,0.05) 100%)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 50%)" }} />

        <div key={current} className="hero-content" style={{ position:"absolute", top:"50%", left:72, transform:"translateY(-54%)", maxWidth:560 }}>
          <div className="fu fu1" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:30, background:slide.color+"28", border:`1px solid ${slide.color}55`, backdropFilter:"blur(10px)", marginBottom:18 }}>
            <MapPin size={13} color="white" />
            <span style={{ fontSize:11, fontWeight:700, color:"white", letterSpacing:1, textTransform:"uppercase" }}>{slide.region}</span>
          </div>
          <h1 className="fu fu2 hero-title" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(42px,5.5vw,68px)", fontWeight:900, color:"white", lineHeight:1.08, letterSpacing:"-1.5px", marginBottom:16, textShadow:"0 2px 24px rgba(0,0,0,0.25)" }}>
            {slide.city}
          </h1>
          <p className="fu fu3 hero-desc" style={{ fontSize:17, color:"rgba(255,255,255,0.82)", lineHeight:1.65, marginBottom:36 }}>{slide.desc}</p>
          <div className="fu fu4 hero-buttons" style={{ display:"flex", gap:12 }}>
            <a href="#chemins" style={{ padding:"14px 28px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:15, fontWeight:700, boxShadow:"0 8px 28px rgba(43,150,168,0.5)", display:"inline-flex", alignItems:"center", gap:8 }}>
              <Sparkles size={16} /> Planifier mon voyage
            </a>
            <Link href={ROUTES.excursions} style={{ padding:"14px 24px", background:"rgba(255,255,255,0.13)", backdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.38)", color:"white", borderRadius:12, textDecoration:"none", fontSize:15, fontWeight:600, display:"inline-flex", alignItems:"center", gap:8 }}>
              <Map size={15} /> Voir les excursions
            </Link>
          </div>
        </div>

        {/* Dots */}
        <div className="slider-dots" style={{ position:"absolute", bottom:40, left:72, display:"flex", gap:10, alignItems:"center" }}>
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
        <div className="slider-counter" style={{ position:"absolute", bottom:44, right:72, fontSize:13, color:"rgba(255,255,255,0.45)", fontWeight:600, letterSpacing:1 }}>
          {String(current+1).padStart(2,"0")} / {String(SLIDES.length).padStart(2,"0")}
        </div>
        <div style={{ position:"absolute", bottom:32, left:"50%", animation:"bounce 2s infinite" }}>
          <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
        </div>
      </section>

      {/* ── CHEMINS PRINCIPAUX ── */}
      <section id="chemins" style={{ position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`url(${SLIDES[2].url})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(3px) brightness(0.4)", transform:"scale(1.05)" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(5,15,25,0.6)" }} />

        <div style={{ position:"relative", zIndex:1, padding:"90px 72px 100px", maxWidth:1160, margin:"0 auto" }} className="section-padding">
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"#2B96A8", textTransform:"uppercase", marginBottom:14 }}>CHEMINS PRINCIPAUX</p>
            <h2 className="section-title" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(32px,4vw,50px)", fontWeight:900, color:"white", letterSpacing:"-1px" }}>
              Explorez la Tunisie<br/>à votre façon
            </h2>
            <p style={{ marginTop:14, fontSize:16, color:"rgba(255,255,255,0.6)" }}>
              Trouvez votre aventure idéale ou composez votre séjour sur mesure
            </p>
          </div>

          <div className="paths-container" style={{ display:"flex", gap:16 }}>
            {/* Mode Assisté */}
            <div className="path-card" style={{ background:"rgba(43,150,168,0.18)", borderColor:"rgba(43,150,168,0.4)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(43,150,168,0.3)", border:"1px solid rgba(43,150,168,0.5)", alignSelf:"flex-start" }}>
                <Sparkles size={11} color="#7EDCED" />
                <span style={{ fontSize:10, fontWeight:800, color:"#7EDCED", letterSpacing:0.8 }}>RAPIDE</span>
              </div>
              <Bot size={36} color="rgba(255,255,255,0.85)" />
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", marginBottom:2 }}>Mode Assisté</h3>
                <p style={{ fontSize:12, color:"#7EDCED", fontWeight:600 }}>Rapide & Intelligent</p>
              </div>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.72)", lineHeight:1.6 }}>
                Répondez à 3 questions, on génère votre itinéraire jour par jour automatiquement
              </p>
              <Link
                href={user ? ROUTES.touriste.itineraires : `${ROUTES.auth}?redirect=itineraire`}
                style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700, marginTop:"auto", boxShadow:"0 6px 20px rgba(43,150,168,0.45)" }}>
                Je veux qu&apos;on me propose <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mode Libre */}
            <div className="path-card" style={{ background:"rgba(255,255,255,0.1)", borderColor:"rgba(255,255,255,0.25)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", alignSelf:"flex-start" }}>
                <Map size={11} color="rgba(255,255,255,0.65)" />
                <span style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.65)", letterSpacing:0.8 }}>FLEXIBLE</span>
              </div>
              <ClipboardList size={36} color="rgba(255,255,255,0.85)" />
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", marginBottom:2 }}>Mode Libre</h3>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>Totalement personnalisé</p>
              </div>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.72)", lineHeight:1.6 }}>
                Construisez votre voyage de A à Z — choisissez chaque excursion, chaque jour
              </p>
              <Link
                href={user ? `${ROUTES.touriste.itineraire}?mode=libre` : `${ROUTES.auth}?redirect=itineraire`}
                style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px", background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.35)", color:"white", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700, marginTop:"auto" }}>
                Je veux décider moi-même <ArrowRight size={14} />
              </Link>
            </div>

            {/* Juste Explorer */}
            <div className="path-card" style={{ background:"rgba(255,255,255,0.06)", borderColor:"rgba(255,255,255,0.18)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", alignSelf:"flex-start" }}>
                <Search size={11} color="rgba(255,255,255,0.55)" />
                <span style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.55)", letterSpacing:0.8 }}>EXPLORER</span>
              </div>
              <Mountain size={36} color="rgba(255,255,255,0.85)" />
              <div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", marginBottom:2 }}>Juste Explorer</h3>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:600 }}>Naviguez librement</p>
              </div>
              <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>
                Parcourez toutes les excursions disponibles — pas besoin de compte pour regarder
              </p>
              <Link href={ROUTES.excursions} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px", background:"transparent", border:"1.5px solid rgba(255,255,255,0.25)", color:"rgba(255,255,255,0.8)", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700, marginTop:"auto" }}>
                Voir toutes les excursions <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div style={{ textAlign:"center", marginTop:40 }}>
            <Link href={`${ROUTES.auth}?type=prestataire`} style={{ fontSize:14, color:"rgba(255,255,255,0.45)", textDecoration:"none", borderBottom:"1px solid rgba(255,255,255,0.2)", paddingBottom:2 }}>
              Vous êtes prestataire ? Inscrivez votre activité →
            </Link>
          </div>
        </div>
      </section>
{/* ── EXCURSIONS POPULAIRES ── */}
<section style={{ padding:"90px 72px", background:"white" }} className="section-padding">
  <div style={{ maxWidth:1160, margin:"0 auto" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:44, flexWrap:"wrap", gap:16 }}>
      <div>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"#2B96A8", textTransform:"uppercase", marginBottom:10 }}>EXCURSIONS</p>
        <h2 className="section-title" style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, color:"#111827", letterSpacing:"-0.5px" }}>Les plus populaires</h2>
      </div>
      <Link href={ROUTES.excursions} style={{ fontSize:14, color:"#2B96A8", fontWeight:600, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:5 }}>
        Voir toutes <ArrowRight size={14} />
      </Link>
    </div>

    {excLoading && (
      <div className="excursions-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )}

    {!excLoading && excursions.length === 0 && (
      <div style={{ textAlign:"center", padding:"60px 20px", background:"#F9FAFB", borderRadius:20, border:"1px solid #F3F4F6" }}>
        <Mountain size={48} style={{ color:"#E5E7EB", margin:"0 auto 16px" }} />
        <p style={{ fontSize:16, fontWeight:700, color:"#374151", marginBottom:8 }}>Aucune excursion disponible pour le moment</p>
        <p style={{ fontSize:13, color:"#9CA3AF" }}>Revenez bientôt, de nouvelles aventures arrivent !</p>
      </div>
    )}

    {!excLoading && excursions.length > 0 && (
      <div className="excursions-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {excursions.map(exc => {
          const photo    = exc.photos?.find(Boolean) || FALLBACK_IMG;
          const category = exc.categories?.[0] || null;
          return (
            <Link key={exc.id} href={ROUTES.excursion(exc.id)} className="exc-card">
              <div style={{ position:"relative", height:200, overflow:"hidden" }}>
                <img src={photo} alt={exc.title}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                {category && (
                  <div style={{ position:"absolute", top:12, left:12 }}>
                    <span style={{ padding:"4px 10px", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", borderRadius:20, fontSize:11, fontWeight:700, color:"white" }}>
                      {category}
                    </span>
                  </div>
                )}
                <button className="heart-btn"
                  onClick={e => {
                    e.preventDefault();
                    if (!user) { sessionStorage.setItem("redirect_after_login", ROUTES.excursion(exc.id)); window.location.href = ROUTES.auth; }
                  }}
                  title={user ? "Ajouter aux favoris" : "Connectez-vous pour sauvegarder"}>
                  {user ? <Heart size={16} color="#E11D48"/> : <Lock size={14} color="#6B7280"/>}
                </button>
              </div>

              <div style={{ padding:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, flexWrap:"wrap", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:2 }}>{exc.title}</h3>
                    <p style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                      <MapPin size={11}/> {exc.city}
                    </p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{exc.price_per_person} <span style={{ fontSize:12, fontWeight:500 }}>TND</span></p>
                    <p style={{ fontSize:11, color:"#9CA3AF" }}>/ personne</p>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, flexWrap:"wrap", gap:8 }}>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                      <Clock size={12}/> {exc.duration_hours}h
                    </span>
                    {exc.rating > 0 && (
                      <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                        <Star size={12} fill="#F59E0B" stroke="#F59E0B"/> {Number(exc.rating).toFixed(1)}
                        {exc.reviews_count > 0 && <span style={{ color:"#9CA3AF" }}>({exc.reviews_count})</span>}
                      </span>
                    )}
                  </div>
                  <div style={{ padding:"7px 14px", background:user?"#2B96A8":"#E5E7EB", color:user?"white":"#6B7280", borderRadius:8, fontSize:12, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
                    {user ? <><CalendarCheck size={13}/> Réserver</> : <><Lock size={12}/> Réserver</>}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    )}

    {/* Guest CTA */}
    {!user && (
      <div className="guest-cta" style={{ marginTop:48, padding:"32px 40px", background:"linear-gradient(135deg,#EFF9FB,#F0FFFE)", border:"1.5px solid #B2E3EB", borderRadius:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h3 style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:6 }}>Envie de sauvegarder ou réserver ?</h3>
          <p style={{ fontSize:14, color:"#6B7280" }}>Créez un compte gratuit pour accéder aux favoris, réservations et paiements</p>
        </div>
        <div className="guest-cta-buttons" style={{ display:"flex", gap:10, flexShrink:0 }}>
          <Link href={ROUTES.auth} style={{ padding:"12px 24px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(43,150,168,0.35)", display:"inline-flex", alignItems:"center", gap:7 }}>
            <UserPlus size={15}/> Créer un compte
          </Link>
          <Link href={ROUTES.auth} style={{ padding:"12px 20px", background:"white", border:"1.5px solid #E5E7EB", color:"#374151", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:600, display:"inline-flex", alignItems:"center", gap:7 }}>
            <LogIn size={15}/> Se connecter
          </Link>
        </div>
      </div>
    )}
  </div>
</section>

{/* ── FOOTER ── */}
<footer className="footer" style={{ background:"#0D1117", padding:"32px 72px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
    <Logo size={26} />
    <span style={{ fontFamily:"'Playfair Display',serif", color:"white", fontWeight:700, fontSize:16 }}>voyajaime</span>
  </div>
  <p style={{ color:"#4B5563", fontSize:13 }}>© 2026 VoyajAime — Tourisme en Tunisie</p>
  <div className="footer-links" style={{ display:"flex", gap:16, alignItems:"center" }}>
    <Link href={ROUTES.excursions} style={{ color:"#6B7280", fontSize:13, textDecoration:"none" }}>Excursions</Link>
    {user
      ? <Link href={ROUTES.touriste.reservations} style={{ padding:"9px 18px", background:"#2B96A8", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700, display:"inline-flex", alignItems:"center", gap:6 }}>
          <User size={13}/> Mon espace
        </Link>
      : <Link href={ROUTES.auth} style={{ padding:"9px 18px", background:"#2B96A8", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700, display:"inline-flex", alignItems:"center", gap:6 }}>
          <LogIn size={13}/> Connexion
        </Link>
    }
  </div>
</footer>
  </>
 );
}
 