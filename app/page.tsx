"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import {
  Heart, Lock, MapPin, Clock, Star, ChevronDown,
  ArrowRight, Sparkles, Map, Search, Bot, ClipboardList,
  Mountain, User, CalendarCheck, UserPlus, LogIn, Menu, X,
} from "lucide-react";

const SLIDES = [
  { url: "https://images.pexels.com/photos/27599624/pexels-photo-27599624.jpeg?auto=compress&cs=tinysrgb&w=1800", city: "Sidi Bou Saïd",  region: "Gouvernorat de Tunis",   desc: "Le village aux maisons bleues et blanches suspendu sur la Méditerranée", color: "#02AFCF" },
  { url: "/images/sahara.webp",                                                                                    city: "Désert du Sahara",region: "Gouvernorat de Kébili",  desc: "Dunes infinies, nuits étoilées et silence absolu à Douz",               color: "#259FFC" },
  { url: "https://images.pexels.com/photos/27631749/pexels-photo-27631749.jpeg?auto=compress&cs=tinysrgb&w=1800", city: "Médina de Tunis", region: "Patrimoine UNESCO",      desc: "Labyrinthe millénaire de ruelles, souks et palais ottomans",            color: "#053366" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=90&fit=crop",                    city: "Île de Djerba",   region: "Gouvernorat de Médenine", desc: "Plages de sable blanc et eaux turquoise de la Méditerranée",            color: "#02AFCF" },
  { url: "/images/Tozeur.jpg",                                                                                    city: "Tozeur & Oasis",  region: "Sud-Ouest tunisien",      desc: "Palmiers, sources d'eau fraîche et architecture en briques de sable",  color: "#259FFC" },
];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

interface Excursion {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number;
  photos: string[]; categories: string[];
}

const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#02AFCF"/>
    <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
  </svg>
);

const SkeletonCard = () => (
  <div style={{ borderRadius:18, overflow:"hidden", background:"white", border:"1px solid #EEF2FF" }}>
    <div style={{ height:200, background:"linear-gradient(90deg,#EEF2FF 25%,#DCE5FF 50%,#EEF2FF 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }} />
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ height:16, width:"70%", borderRadius:6, background:"#EEF2FF" }} />
      <div style={{ height:12, width:"40%", borderRadius:6, background:"#EEF2FF" }} />
      <div style={{ height:12, width:"55%", borderRadius:6, background:"#EEF2FF" }} />
    </div>
  </div>
);

export default function HomePage() {
  const [current, setCurrent]   = useState(0);
  const [fading,  setFading]    = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [user, setUser]         = useState<{ email?: string; id?: string } | null>(null);
  const [favCount, setFavCount] = useState(0);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excLoading, setExcLoading] = useState(true);
  const [navOpen, setNavOpen]   = useState(false);
  const supabase = createClient();

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

  useEffect(() => {
    supabase.from("excursions")
      .select("id, title, city, price_per_person, duration_hours, rating, reviews_count, photos, categories")
      .eq("is_active", true).order("rating", { ascending: false }).limit(6)
      .then(({ data, error }) => { if (!error && data) setExcursions(data); setExcLoading(false); });
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
        elapsed = 0; setFading(true);
        setTimeout(() => { setCurrent(p => (p + 1) % SLIDES.length); setFading(false); setProgress(0); }, 500);
      }
    }, TICK);
    return () => clearInterval(timer);
  }, [current]);

  const slide = SLIDES[current];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'DM Sans',sans-serif;background:#F8FAFF;overflow-x:hidden}

        /* Nav */
        .nav-a{text-decoration:none;font-size:14px;font-weight:500;transition:color 0.2s}
        .nav-a:hover{color:#02AFCF!important}

        /* Slider */
        .slide-bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity 0.6s ease,transform 0.6s ease}

        /* Cards */
        .exc-card{border-radius:18px;overflow:hidden;background:white;border:1px solid #EEF2FF;transition:all 0.25s ease;cursor:pointer;text-decoration:none;display:block;color:inherit;box-shadow:0 2px 10px rgba(5,51,102,.05)}
        .exc-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(5,51,102,.12)}
        .exc-card img{transition:transform 0.4s ease;display:block}
        .exc-card:hover img{transform:scale(1.05)}
        .heart-btn{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:2}
        .heart-btn:hover{transform:scale(1.15)}

        /* Path cards */
        .path-card{padding:28px 22px;border-radius:20px;border:1.5px solid;cursor:pointer;transition:all 0.3s;backdrop-filter:blur(16px);display:flex;flex-direction:column;gap:10px}
        .path-card:hover{transform:translateY(-4px);filter:brightness(1.12)}

        /* Animations */
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.7s ease forwards;opacity:0}
        .fu1{animation-delay:0.1s}.fu2{animation-delay:0.25s}.fu3{animation-delay:0.4s}.fu4{animation-delay:0.55s}
        @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* ── Layout classes ── */
        .exc-grid          { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .paths-grid        { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .section-wrap      { padding-left:72px; padding-right:72px; }
        .hero-content      { position:absolute; top:50%; left:72px; transform:translateY(-54%); max-width:580px; }
        .hero-dots         { position:absolute; bottom:40px; left:72px; display:flex; gap:10px; align-items:center; }
        .hero-counter      { position:absolute; bottom:44px; right:72px; font-size:13px; color:rgba(255,255,255,0.45); font-weight:600; letter-spacing:1px; }
        .hero-btns         { display:flex; gap:12px; flex-wrap:wrap; }
        .chemins-wrap      { padding:90px 72px 100px; max-width:1160px; margin:0 auto; }
        .footer-inner      { display:flex; justify-content:space-between; align-items:center; padding:32px 72px; }
        .guest-cta         { display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; }
        .guest-cta-btns    { display:flex; gap:10px; flex-shrink:0; }
        .nav-links         { display:flex; align-items:center; gap:24px; }
        .nav-hamburger     { display:none; background:none; border:none; cursor:pointer; padding:6px; border-radius:10px; }
        .nav-mobile        { display:none; }
        .exc-section-header{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:44px; }

        @media(max-width:900px){
          .exc-grid    { grid-template-columns:repeat(2,1fr); gap:14px; }
          .paths-grid  { grid-template-columns:1fr; }
          .section-wrap{ padding-left:28px; padding-right:28px; }
          .hero-content{ left:28px; right:28px; max-width:100%; }
          .hero-dots   { left:28px; }
          .hero-counter{ display:none; }
          .chemins-wrap{ padding:64px 28px 72px; }
          .footer-inner{ flex-direction:column; gap:18px; text-align:center; padding:28px; }
        }
        @media(max-width:600px){
          .exc-grid          { grid-template-columns:1fr; gap:14px; }
          .nav-links         { display:none; }
          .nav-hamburger     { display:flex; align-items:center; justify-content:center; }
          .nav-mobile        { position:fixed; top:68px; left:0; right:0; background:white; border-bottom:1px solid #DCE5FF; padding:16px 20px; display:flex; flex-direction:column; gap:12px; z-index:199; box-shadow:0 8px 24px rgba(5,51,102,.1); }
          .nav-mobile.closed { display:none; }
          .hero-content      { left:18px; right:18px; top:56%; transform:translateY(-50%); }
          .hero-btns         { flex-direction:column; }
          .hero-btns a       { justify-content:center; }
          .section-wrap      { padding-left:16px; padding-right:16px; }
          .chemins-wrap      { padding:52px 16px 60px; }
          .footer-inner      { padding:24px 16px; gap:14px; }
          .exc-section-header{ flex-direction:column; align-items:flex-start; gap:10px; margin-bottom:28px; }
          .guest-cta         { flex-direction:column; }
          .guest-cta-btns    { width:100%; }
          .guest-cta-btns a  { flex:1; justify-content:center; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200, height:68,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 28px",
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #DCE5FF" : "none",
        boxShadow: scrolled ? "0 2px 16px rgba(5,51,102,.07)" : "none",
        transition:"all 0.35s",
      }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <Logo size={32} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:scrolled?"#053366":"white", transition:"color 0.3s", letterSpacing:"-0.3px" }}>voyajaime</span>
        </Link>

        {/* Desktop */}
        <nav className="nav-links">
          <Link href="/excursions" className="nav-a" style={{ color:scrolled?"#374151":"rgba(255,255,255,0.88)" }}>Excursions</Link>
          <a href="#chemins" className="nav-a" style={{ color:scrolled?"#374151":"rgba(255,255,255,0.88)" }}>Comment ça marche</a>
          {user ? (
            <Link href="/touriste/favoris" style={{ position:"relative", textDecoration:"none", color:scrolled?"#374151":"rgba(255,255,255,0.88)", fontSize:14, fontWeight:500, display:"flex", alignItems:"center", gap:5 }}>
              <Heart size={15}/> Favoris
              {favCount > 0 && <span style={{ position:"absolute", top:-6, right:-10, background:"#EF4444", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{favCount}</span>}
            </Link>
          ) : (
            <button onClick={() => { window.location.href = "/auth"; }} style={{ background:"none", border:"none", cursor:"pointer", color:scrolled?"#374151":"rgba(255,255,255,0.88)", fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:5 }}>
              <Heart size={15}/> Favoris
            </button>
          )}
          {user
            ? <Link href="/touriste/reservations" style={{ padding:"10px 20px", background:scrolled?"linear-gradient(135deg,#02AFCF,#259FFC)":"rgba(255,255,255,0.18)", border:scrolled?"none":"1.5px solid rgba(255,255,255,0.45)", color:"white", borderRadius:30, textDecoration:"none", fontSize:14, fontWeight:700, backdropFilter:"blur(8px)", display:"inline-flex", alignItems:"center", gap:6, boxShadow:scrolled?"0 4px 14px rgba(2,175,207,.35)":"none" }}>
                <User size={14}/> Mon espace
              </Link>
            : <Link href="/auth" style={{ padding:"10px 22px", background:scrolled?"linear-gradient(135deg,#02AFCF,#259FFC)":"rgba(255,255,255,0.18)", border:scrolled?"none":"1.5px solid rgba(255,255,255,0.45)", color:"white", borderRadius:30, textDecoration:"none", fontSize:14, fontWeight:700, backdropFilter:"blur(8px)", display:"inline-flex", alignItems:"center", gap:6, boxShadow:scrolled?"0 4px 14px rgba(2,175,207,.35)":"none" }}>
                <LogIn size={14}/> Connexion
              </Link>
          }
        </nav>

        {/* Hamburger */}
        <button className="nav-hamburger" onClick={() => setNavOpen(o => !o)} style={{ color:scrolled?"#053366":"white" }}>
          {navOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </header>

      {/* Mobile menu */}
      <div className={`nav-mobile ${navOpen ? "" : "closed"}`}>
        <Link href="/excursions" onClick={() => setNavOpen(false)} style={{ fontSize:15, fontWeight:500, color:"#053366", textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}>
          <Mountain size={16} color="#02AFCF"/> Excursions
        </Link>
        <a href="#chemins" onClick={() => setNavOpen(false)} style={{ fontSize:15, fontWeight:500, color:"#053366", textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}>
          <Sparkles size={16} color="#02AFCF"/> Comment ça marche
        </a>
        <Link href={user ? "/touriste/favoris" : "/auth"} onClick={() => setNavOpen(false)} style={{ fontSize:15, fontWeight:500, color:"#053366", textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}>
          <Heart size={16} color="#02AFCF"/> Favoris {favCount > 0 && `(${favCount})`}
        </Link>
        <Link href={user ? "/touriste/reservations" : "/auth"} onClick={() => setNavOpen(false)}
          style={{ padding:"12px 20px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:"0 4px 14px rgba(2,175,207,.35)" }}>
          {user ? <><User size={15}/> Mon espace</> : <><LogIn size={15}/> Connexion</>}
        </Link>
      </div>

      {/* ── HERO ── */}
      <section style={{ position:"relative", height:"100vh", overflow:"hidden" }}>
        <div className="slide-bg" style={{ backgroundImage:`url(${slide.url})`, opacity:fading?0:1, transform:fading?"scale(1.03)":"scale(1)" }}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(5,51,102,0.82) 0%,rgba(5,51,102,0.35) 55%,rgba(5,51,102,0.05) 100%)" }}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(5,51,102,0.55) 0%,transparent 50%)" }}/>

        <div key={current} className="hero-content">
          <div className="fu fu1" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:30, background:"rgba(2,175,207,0.22)", border:"1px solid rgba(2,175,207,0.5)", backdropFilter:"blur(10px)", marginBottom:18 }}>
            <MapPin size={13} color="#7EDCED"/>
            <span style={{ fontSize:11, fontWeight:700, color:"#7EDCED", letterSpacing:1, textTransform:"uppercase" }}>{slide.region}</span>
          </div>
          <h1 className="fu fu2" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(34px,5.5vw,68px)", fontWeight:900, color:"white", lineHeight:1.08, letterSpacing:"-1.5px", marginBottom:16, textShadow:"0 2px 24px rgba(5,51,102,0.4)" }}>
            {slide.city}
          </h1>
          <p className="fu fu3" style={{ fontSize:"clamp(14px,2vw,17px)", color:"rgba(255,255,255,0.85)", lineHeight:1.65, marginBottom:32 }}>{slide.desc}</p>
          <div className="fu fu4 hero-btns">
            <a href="#chemins" style={{ padding:"13px 24px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 8px 28px rgba(2,175,207,0.5)", display:"inline-flex", alignItems:"center", gap:8 }}>
              <Sparkles size={16}/> Planifier mon voyage
            </a>
            <Link href="/excursions" style={{ padding:"13px 22px", background:"rgba(255,255,255,0.13)", backdropFilter:"blur(12px)", border:"1.5px solid rgba(255,255,255,0.35)", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:600, display:"inline-flex", alignItems:"center", gap:8 }}>
              <Map size={15}/> Voir les excursions
            </Link>
          </div>
        </div>

        <div className="hero-dots">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
              {i === current
                ? <div style={{ width:36, height:6, borderRadius:3, background:"#02AFCF", overflow:"hidden" }}><div style={{ height:"100%", width:`${progress}%`, background:"rgba(255,255,255,0.6)", transition:"width 0.06s linear" }}/></div>
                : <div style={{ width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.4)" }}/>
              }
            </button>
          ))}
        </div>
        <div className="hero-counter">{String(current+1).padStart(2,"0")} / {String(SLIDES.length).padStart(2,"0")}</div>
        <div style={{ position:"absolute", bottom:32, left:"50%", animation:"bounce 2s infinite" }}>
          <ChevronDown size={20} color="rgba(255,255,255,0.45)"/>
        </div>
      </section>

      {/* ── CHEMINS ── */}
      <section id="chemins" style={{ position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`url(${SLIDES[0].url})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(3px) brightness(0.35)", transform:"scale(1.05)" }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(5,51,102,0.72)" }}/>

        <div className="chemins-wrap" style={{ position:"relative", zIndex:1 }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"#02AFCF", textTransform:"uppercase", marginBottom:14 }}>CHEMINS PRINCIPAUX</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,4vw,50px)", fontWeight:900, color:"white", letterSpacing:"-1px" }}>
              Explorez la Tunisie<br/>à votre façon
            </h2>
            <p style={{ marginTop:14, fontSize:15, color:"rgba(220,229,255,0.7)" }}>Trouvez votre aventure idéale ou composez votre séjour sur mesure</p>
          </div>

          <div className="paths-grid">
            {[
              {
                bg:"rgba(2,175,207,0.15)", bc:"rgba(2,175,207,0.4)",
                badge:<><Sparkles size={11} color="#7EDCED"/><span style={{fontSize:10,fontWeight:800,color:"#7EDCED",letterSpacing:0.8}}>RAPIDE</span></>,
                icon:<Bot size={36} color="#7EDCED"/>,
                title:"Mode Assisté", sub:"Rapide & Intelligent", subColor:"#7EDCED",
                desc:"Répondez à 3 questions, on génère votre itinéraire jour par jour automatiquement",
                href:user?"/touriste/itineraire?mode=assiste":"/auth?redirect=itineraire",
                btnBg:"linear-gradient(135deg,#02AFCF,#259FFC)", btnBorder:"none", btnShadow:"0 6px 20px rgba(2,175,207,0.45)",
                btnLabel:"Je veux qu'on me propose",
              },
              {
                bg:"rgba(220,229,255,0.08)", bc:"rgba(220,229,255,0.25)",
                badge:<><Map size={11} color="#DCE5FF"/><span style={{fontSize:10,fontWeight:800,color:"#DCE5FF",letterSpacing:0.8}}>FLEXIBLE</span></>,
                icon:<ClipboardList size={36} color="#DCE5FF"/>,
                title:"Mode Libre", sub:"Totalement personnalisé", subColor:"rgba(220,229,255,0.7)",
                desc:"Construisez votre voyage de A à Z — choisissez chaque excursion, chaque jour",
                href:user?"/touriste/itineraire?mode=libre":"/auth?redirect=itineraire",
                btnBg:"rgba(255,255,255,0.13)", btnBorder:"1.5px solid rgba(255,255,255,0.35)", btnShadow:"none",
                btnLabel:"Je veux décider moi-même",
              },
              {
                bg:"rgba(255,255,255,0.05)", bc:"rgba(255,255,255,0.15)",
                badge:<><Search size={11} color="rgba(220,229,255,0.6)"/><span style={{fontSize:10,fontWeight:800,color:"rgba(220,229,255,0.6)",letterSpacing:0.8}}>EXPLORER</span></>,
                icon:<Mountain size={36} color="rgba(220,229,255,0.8)"/>,
                title:"Juste Explorer", sub:"Naviguez librement", subColor:"rgba(220,229,255,0.5)",
                desc:"Parcourez toutes les excursions disponibles — pas besoin de compte pour regarder",
                href:"/excursions",
                btnBg:"transparent", btnBorder:"1.5px solid rgba(220,229,255,0.3)", btnShadow:"none",
                btnLabel:"Voir toutes les excursions",
              },
            ].map((c, i) => (
              <div key={i} className="path-card" style={{ background:c.bg, borderColor:c.bc }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.15)", alignSelf:"flex-start" }}>
                  {c.badge}
                </div>
                {c.icon}
                <div>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", marginBottom:2 }}>{c.title}</h3>
                  <p style={{ fontSize:12, color:c.subColor, fontWeight:600 }}>{c.sub}</p>
                </div>
                <p style={{ fontSize:13.5, color:"rgba(220,229,255,0.75)", lineHeight:1.6 }}>{c.desc}</p>
                <Link href={c.href} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px", color:"white", borderRadius:12, textDecoration:"none", fontSize:13, fontWeight:700, marginTop:"auto", background:c.btnBg, border:c.btnBorder, boxShadow:c.btnShadow }}>
                  {c.btnLabel} <ArrowRight size={14}/>
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign:"center", marginTop:40 }}>
            <Link href="/auth?type=prestataire" style={{ fontSize:14, color:"rgba(220,229,255,0.5)", textDecoration:"none", borderBottom:"1px solid rgba(220,229,255,0.25)", paddingBottom:2 }}>
              Vous êtes prestataire ? Inscrivez votre activité →
            </Link>
          </div>
        </div>
      </section>

      {/* ── EXCURSIONS ── */}
      <section style={{ paddingTop:80, paddingBottom:80, background:"#F8FAFF" }}>
        <div className="section-wrap" style={{ maxWidth:1160, margin:"0 auto" }}>
          <div className="exc-section-header">
            <div>
              <p style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:"#02AFCF", textTransform:"uppercase", marginBottom:10 }}>EXCURSIONS</p>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3.5vw,36px)", fontWeight:900, color:"#053366", letterSpacing:"-0.5px" }}>Les plus populaires</h2>
            </div>
            <Link href="/excursions" style={{ fontSize:14, color:"#259FFC", fontWeight:700, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
              Voir toutes <ArrowRight size={14}/>
            </Link>
          </div>

          {excLoading && <div className="exc-grid">{Array.from({length:6}).map((_,i) => <SkeletonCard key={i}/>)}</div>}

          {!excLoading && excursions.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", background:"white", borderRadius:20, border:"1px solid #EEF2FF" }}>
              <Mountain size={48} style={{ color:"#DCE5FF", margin:"0 auto 16px" }}/>
              <p style={{ fontSize:16, fontWeight:700, color:"#053366", marginBottom:8 }}>Aucune excursion disponible pour le moment</p>
              <p style={{ fontSize:13, color:"#9CA3AF" }}>Revenez bientôt, de nouvelles aventures arrivent !</p>
            </div>
          )}

          {!excLoading && excursions.length > 0 && (
            <div className="exc-grid">
              {excursions.map(exc => {
                const photo    = exc.photos?.find(Boolean) || FALLBACK_IMG;
                const category = exc.categories?.[0] || null;
                return (
                  <Link key={exc.id} href={`/excursions/${exc.id}`} className="exc-card">
                    <div style={{ position:"relative", height:200, overflow:"hidden" }}>
                      <img src={photo} alt={exc.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}/>
                      {category && (
                        <div style={{ position:"absolute", top:12, left:12 }}>
                          <span style={{ padding:"4px 10px", background:"rgba(5,51,102,0.65)", backdropFilter:"blur(6px)", borderRadius:20, fontSize:11, fontWeight:700, color:"white" }}>{category}</span>
                        </div>
                      )}
                      <button className="heart-btn"
                        onClick={e => { e.preventDefault(); if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; } }}
                        title={user ? "Ajouter aux favoris" : "Connectez-vous"}>
                        {user ? <Heart size={16} color="#E11D48"/> : <Lock size={14} color="#6B7280"/>}
                      </button>
                    </div>
                    <div style={{ padding:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div style={{ minWidth:0 }}>
                          <h3 style={{ fontSize:15, fontWeight:700, color:"#053366", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{exc.title}</h3>
                          <p style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}><MapPin size={11}/> {exc.city}</p>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                          <p style={{ fontSize:18, fontWeight:800, color:"#053366" }}>{exc.price_per_person} <span style={{ fontSize:12, fontWeight:500, color:"#9CA3AF" }}>TND</span></p>
                          <p style={{ fontSize:11, color:"#9CA3AF" }}>/ personne</p>
                        </div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, flexWrap:"wrap", gap:8 }}>
                        <div style={{ display:"flex", gap:10 }}>
                          <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}><Clock size={12}/> {exc.duration_hours}h</span>
                          {exc.rating > 0 && (
                            <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                              <Star size={12} fill="#F59E0B" stroke="#F59E0B"/> {Number(exc.rating).toFixed(1)}
                              {exc.reviews_count > 0 && <span style={{ color:"#9CA3AF" }}>({exc.reviews_count})</span>}
                            </span>
                          )}
                        </div>
                        <div style={{ padding:"7px 14px", background:user?"linear-gradient(135deg,#02AFCF,#259FFC)":"#EEF2FF", color:user?"white":"#9CA3AF", borderRadius:8, fontSize:12, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5, flexShrink:0, boxShadow:user?"0 2px 8px rgba(2,175,207,.3)":"none" }}>
                          {user ? <><CalendarCheck size={13}/> Réserver</> : <><Lock size={12}/> Réserver</>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!user && (
            <div style={{ marginTop:48, padding:"28px 32px", background:"linear-gradient(135deg,rgba(2,175,207,.08),rgba(37,159,252,.05))", border:"1.5px solid rgba(2,175,207,.25)", borderRadius:20 }}>
              <div className="guest-cta">
                <div>
                  <h3 style={{ fontSize:18, fontWeight:700, color:"#053366", marginBottom:6 }}>Envie de sauvegarder ou réserver ?</h3>
                  <p style={{ fontSize:14, color:"#6B7280" }}>Créez un compte gratuit pour accéder aux favoris, réservations et paiements</p>
                </div>
                <div className="guest-cta-btns">
                  <Link href="/auth" style={{ padding:"12px 24px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(2,175,207,.4)", display:"inline-flex", alignItems:"center", gap:7, whiteSpace:"nowrap" }}>
                    <UserPlus size={15}/> Créer un compte
                  </Link>
                  <Link href="/auth" style={{ padding:"12px 20px", background:"white", border:"1.5px solid #DCE5FF", color:"#053366", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:600, display:"inline-flex", alignItems:"center", gap:7, whiteSpace:"nowrap" }}>
                    <LogIn size={15}/> Se connecter
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#053366" }}>
        <div className="footer-inner">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Logo size={26}/>
            <span style={{ fontFamily:"'Playfair Display',serif", color:"white", fontWeight:700, fontSize:16 }}>voyajaime</span>
          </div>
          <p style={{ color:"rgba(220,229,255,0.45)", fontSize:13 }}>© 2026 VoyajAime — Tourisme en Tunisie</p>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <Link href="/excursions" style={{ color:"rgba(220,229,255,0.55)", fontSize:13, textDecoration:"none" }}>Excursions</Link>
            {user
              ? <Link href="/touriste/reservations" style={{ padding:"9px 18px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700, display:"inline-flex", alignItems:"center", gap:6, boxShadow:"0 3px 10px rgba(2,175,207,.4)" }}>
                  <User size={13}/> Mon espace
                </Link>
              : <Link href="/auth" style={{ padding:"9px 18px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700, display:"inline-flex", alignItems:"center", gap:6, boxShadow:"0 3px 10px rgba(2,175,207,.4)" }}>
                  <LogIn size={13}/> Connexion
                </Link>
            }
          </div>
        </div>
      </footer>
    </>
  );
}