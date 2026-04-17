"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import {
  Heart, Lock, MapPin, Clock, Star, ChevronDown,
  ArrowRight, Sparkles, Map, Search, Bot, ClipboardList,
  Mountain, User, CalendarCheck, UserPlus, LogIn, Building2,
  Tag, Camera, Utensils, Compass, Sailboat, Landmark, Coffee
} from "lucide-react";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import AuthModal from "@/app/components/auth/AuthModal";

const SLIDE_COLORS = ["#2B96A8","#D97706","#7C3AED","#059669","#B45309","#E11D48","#0EA5E9"];

interface SlideExcursion {
  id: string;
  url: string;
  city: string;
  region: string;
  categories: string[];
  color: string;
}

const FALLBACK_IMG = "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1800&q=90";

interface Excursion {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number;
  photos: string[]; categories: string[];
}

const Logo = () => (
  <img src="/logo.png" alt="VoyajAime" style={{ height: 35, width: "auto", objectFit: "contain", display: "block" }} />
);

const SkeletonCard = () => (
  <div style={{ borderRadius: 18, overflow: "hidden", background: "white", border: "1px solid #F3F4F6" }}>
    <div style={{ height: 220, background: "linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ height: 16, width: "70%", borderRadius: 6, background: "#F3F4F6" }} />
      <div style={{ height: 12, width: "40%", borderRadius: 6, background: "#F3F4F6" }} />
    </div>
  </div>
);

// Fonction pour obtenir une icône en fonction de la catégorie
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("culture") || cat.includes("historique") || cat.includes("musée")) return <Landmark size={14} />;
  if (cat.includes("nature") || cat.includes("randonnée") || cat.includes("desert")) return <Compass size={14} />;
  if (cat.includes("culinaire") || cat.includes("gastronomie") || cat.includes("dégustation")) return <Utensils size={14} />;
  if (cat.includes("plage") || cat.includes("mer") || cat.includes("nautique")) return <Sailboat size={14} />;
  if (cat.includes("photo") || cat.includes("coucher")) return <Camera size={14} />;
  if (cat.includes("café") || cat.includes("thé")) return <Coffee size={14} />;
  return <Tag size={14} />;
};

// Fonction pour formater l'affichage des catégories
const formatCategories = (categories: string[]) => {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
      {categories.slice(0, 3).map((cat, idx) => (
        <span
          key={idx}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            backgroundColor: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color: "white",
            letterSpacing: 0.3,
            border: "1px solid rgba(255,255,255,0.2)"
          }}
        >
          {getCategoryIcon(cat)}
          {cat}
        </span>
      ))}
      {categories.length > 3 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)"
          }}
        >
          +{categories.length - 3}
        </span>
      )}
    </div>
  );
};

export default function HomePage() {
  const [current,    setCurrent]    = useState(0);
  const [fading,     setFading]     = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [user,       setUser]       = useState<{ email?: string; id?: string } | null>(null);
  const [favCount,   setFavCount]   = useState(0);
  const [userName,   setUserName]   = useState<string | undefined>(undefined);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excLoading, setExcLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | "prestataire">("login");
  const [slides, setSlides] = useState<SlideExcursion[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(true);

  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUser({ email: data.user.email, id: uid });
      const [favRes, profileRes] = await Promise.all([
        supabase.from("favoris").select("id", { count: "exact", head: true }).eq("touriste_id", uid),
        supabase.from("profiles").select("full_name").eq("user_id", uid).single(),
      ]);
      setFavCount(favRes.count || 0);
      if (profileRes.data?.full_name) setUserName(profileRes.data.full_name);
    });
  }, [supabase]);

  useEffect(() => {
    supabase.from("excursions")
      .select("id, title, city, price_per_person, duration_hours, rating, reviews_count, photos, categories")
      .eq("is_active", true).order("rating", { ascending: false }).limit(6)
      .then(({ data, error }) => {
        if (!error && data) setExcursions(data);
        setExcLoading(false);
      });
  }, [supabase]);

  /* ── Slider excursions depuis Supabase ── */
  useEffect(() => {
    supabase.from("excursions")
      .select("id, title, city, description, photos, categories")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(7)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: SlideExcursion[] = data.map((exc, i) => ({
            id: exc.id,
            url: exc.photos?.find(Boolean) || FALLBACK_IMG,
            city: exc.title,
            region: exc.city,
            categories: exc.categories || [],
            color: SLIDE_COLORS[i % SLIDE_COLORS.length],
          }));
          setSlides(mapped);
        }
        setSlidesLoading(false);
      });
  }, [supabase]);

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
        setTimeout(() => { setCurrent(p => slides.length > 0 ? (p + 1) % slides.length : 0); setFading(false); setProgress(0); }, 500);
      }
    }, TICK);
    return () => clearInterval(timer);
  }, [current]);

  const slide = slides[current] ?? { url: FALLBACK_IMG, city: "", region: "", categories: [], color: "#2B96A8", id: "" };

  const openAuth = (mode: "login" | "register" | "prestataire", redirect?: string) => {
    if (redirect) sessionStorage.setItem("redirect_after_login", redirect);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box }
        body { font-family:'DM Sans',sans-serif; background:#FAFAF9; color:#111827 }

        /* ── Slide ── */
        .slide-bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:opacity 0.6s ease, transform 0.6s ease }

        /* ── Section labels ── */
        .section-eyebrow {
          display:inline-flex; align-items:center; gap:8px;
          font-size:11px; font-weight:800; letter-spacing:3px; color:#2B96A8;
          text-transform:uppercase; margin-bottom:16px;
        }
        .section-eyebrow::before {
          content:''; width:24px; height:2px; background:#2B96A8; border-radius:2px; display:block;
        }
        .section-title {
          font-family:'Playfair Display',serif;
          font-size:clamp(32px,4vw,52px);
          font-weight:900; color: #053366;
          letter-spacing:-1.5px; line-height:1.1;
        }
        .section-title-light { color:white }

        /* ── Cards excursion ── */
        .exc-card { border-radius:20px; overflow:hidden; background:white; border:1px solid #F0F0F0; transition:all 0.25s ease; cursor:pointer; text-decoration:none; display:block; color:inherit }
        .exc-card:hover { transform:translateY(-6px); box-shadow:0 20px 56px rgba(0,0,0,0.1) }
        .exc-card img { transition:transform 0.45s ease; display:block }
        .exc-card:hover img { transform:scale(1.06) }

        /* ── Path cards ── */
        .path-card {
          flex:1; padding:32px 28px; border-radius:24px; border:1.5px solid;
          cursor:pointer; transition:all 0.3s; backdrop-filter:blur(16px);
          display:flex; flex-direction:column; gap:14px;
        }
        .path-card:hover { transform:translateY(-5px); filter:brightness(1.12) }
        .path-card-btn {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 22px; border-radius:14px;
          font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif;
          text-decoration:none; cursor:pointer; border:none;
          transition:all 0.2s; margin-top:auto;
        }
        .path-card-btn:hover { transform:translateY(-1px) }

        /* ── Buttons ── */
        .btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 28px; background:#2B96A8; color:white;
          border-radius:14px; font-size:15px; font-weight:700;
          font-family:'DM Sans',sans-serif; border:none; cursor:pointer;
          text-decoration:none; transition:all 0.2s;
          box-shadow:0 6px 24px rgba(43,150,168,0.35);
        }
        .btn-primary:hover { background:#2585966; transform:translateY(-1px); box-shadow:0 10px 32px rgba(43,150,168,0.45) }
        .btn-ghost {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 24px; background:rgba(255,255,255,0.13);
          backdrop-filter:blur(12px); border:1.5px solid rgba(255,255,255,0.38);
          color:white; border-radius:14px; font-size:15px; font-weight:600;
          font-family:'DM Sans',sans-serif; cursor:pointer; text-decoration:none; transition:all 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.22) }
        .btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 22px; background:white; border:1.5px solid #E5E7EB;
          color:#374151; border-radius:14px; font-size:14px; font-weight:600;
          font-family:'DM Sans',sans-serif; cursor:pointer; text-decoration:none; transition:all 0.2s;
        }
        .btn-outline:hover { border-color:#2B96A8; color:#2B96A8 }

        /* ── Prestataire banner ── */
        .presta-banner {
          display:flex; align-items:center; justify-content:space-between; gap:20px;
          padding:22px 32px; border-radius:18px;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15);
          margin-top:48px; cursor:pointer;
          transition:background 0.2s;
        }
        .presta-banner:hover { background:rgba(255,255,255,0.12) }

        /* ── Heart button ── */
        .heart-btn { position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.95); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s; box-shadow:0 2px 10px rgba(0,0,0,0.15); z-index:2 }
        .heart-btn:hover { transform:scale(1.15) }

        /* ── Animations ── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fu{animation:fadeUp 0.7s ease forwards;opacity:0}
        .fu1{animation-delay:0.1s}.fu2{animation-delay:0.25s}.fu3{animation-delay:0.4s}.fu4{animation-delay:0.55s}
        @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* ── Categories container animation ── */
        .categories-container {
          animation: fadeUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.35s;
        }

        /* ── Responsive ── */
        @media(max-width:900px){
          .paths-container{flex-direction:column!important}
          .grid-3{grid-template-columns:1fr 1fr!important}
          .hero-content{left:24px!important;right:24px!important;max-width:none!important}
          .hero-buttons{flex-direction:column!important;align-items:flex-start!important}
          .section-pad{padding:64px 24px!important}
          .footer{flex-direction:column!important;gap:24px!important;padding:32px 24px!important;text-align:center!important}
          .guest-cta{flex-direction:column!important;text-align:center!important}
          .presta-banner{flex-direction:column!important;text-align:center!important}
        }
        @media(max-width:600px){
          .grid-3{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <TouristeNav userName={userName} favCount={favCount} isLoggedIn={!!user} />
         <div style={{ paddingTop: 10 }} />

      {/* ══ HERO SLIDER ══ */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        {/* Loading skeleton */}
        {slidesLoading && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#0D1117 0%,#1a2332 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, border: "3px solid rgba(43,150,168,0.3)", borderTop: "3px solid #2B96A8", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 500 }}>Chargement des excursions…</p>
            </div>
          </div>
        )}
        
        <div className="slide-bg" style={{ backgroundImage: `url(${slide.url})`, opacity: fading ? 0 : 1, transform: fading ? "scale(1.03)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.35) 55%,rgba(0,0,0,0.06) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)" }} />

        <div key={current} className="hero-content" style={{ position: "absolute", top: "50%", left: 72, transform: "translateY(-54%)", maxWidth: 580 }}>
          <div className="fu fu1" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 30, background: slide.color + "28", border: `1px solid ${slide.color}55`, backdropFilter: "blur(10px)", marginBottom: 20 }}>
            <MapPin size={13} color="white" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: 1.2, textTransform: "uppercase" }}>{slide.region}</span>
          </div>
          <h1 className="fu fu2" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(42px,5.5vw,72px)", fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 18, textShadow: "0 2px 28px rgba(0,0,0,0.25)" }}>
            {slide.city}
          </h1>
          
          {/* CATEGORIES au lieu de la description */}
          <div className="categories-container">
            {slide.categories && slide.categories.length > 0 ? (
              <div style={{ marginBottom: 40 }}>
                {formatCategories(slide.categories)}
              </div>
            ) : (
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.82)", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
                Découvrez cette excursion exceptionnelle en Tunisie
              </p>
            )}
          </div>
          
          <div className="fu fu4 hero-buttons" style={{ display: "flex", gap: 14 }}>
            <a href="#chemins" className="btn-primary">
              <Sparkles size={16} /> Planifier mon voyage
            </a>
            {slide.id
              ? <Link href={ROUTES.excursion(slide.id)} className="btn-ghost">
                  <Map size={15} /> Voir cette excursion
                </Link>
              : <Link href={ROUTES.excursions} className="btn-ghost">
                  <Map size={15} /> Voir les excursions
                </Link>
            }
          </div>
        </div>

        {/* Dots */}
        <div style={{ position: "absolute", bottom: 44, left: 72, display: "flex", gap: 10, alignItems: "center" }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {i === current
                ? <div style={{ width: 38, height: 6, borderRadius: 3, background: slide.color, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.6)", transition: "width 0.06s linear" }} />
                  </div>
                : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />}
            </button>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 48, right: 72, fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 1.5 }}>
          {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
        <div style={{ position: "absolute", bottom: 32, left: "50%", animation: "bounce 2s infinite" }}>
          <ChevronDown size={22} color="rgba(255,255,255,0.38)" />
        </div>
      </section>

      {/* ══ CHEMINS PRINCIPAUX ══ */}
      <section id="chemins" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${slides[2]?.url || slides[0]?.url || FALLBACK_IMG})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(3px) brightness(0.35)", transform: "scale(1.05)" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(4,12,22,0.65)" }} />

        <div style={{ position: "relative", zIndex: 1, padding: "96px 72px 108px", maxWidth: 1200, margin: "0 auto" }} className="section-pad">
          {/* Header de section */}
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <h2 className="section-title section-title-light">
              Votre voyage en Tunisie,<br />à votre façon
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.58)", marginTop: 18, maxWidth: 520, margin: "18px auto 0", lineHeight: 1.7 }}>
              Trois approches pour découvrir la Tunisie — choisissez celle qui vous correspond.
            </p>
          </div>

          {/* 3 cards */}
          <div className="paths-container" style={{ display: "flex", gap: 20 }}>

            {/* Mode Assisté */}
            <div className="path-card" style={{ background: "rgba(43,150,168,0.16)", borderColor: "rgba(43,150,168,0.38)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(43,150,168,0.28)", border: "1px solid rgba(43,150,168,0.5)", alignSelf: "flex-start" }}>
                <Sparkles size={11} color="#7EDCED" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#7EDCED", letterSpacing: 1 }}>IA · RAPIDE</span>
              </div>
              <Bot size={40} color="rgba(255,255,255,0.88)" style={{ marginTop: 4 }} />
              <div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, letterSpacing: "-0.5px" }}>Mode Assisté</h3>
                <p style={{ fontSize: 13, color: "#7EDCED", fontWeight: 600 }}>Itinéraire généré par IA en 1 minute</p>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                Répondez à 3 questions simples. Notre IA génère votre itinéraire jour par jour, avec des alternatives locales.
              </p>
              <Link
                href={user ? ROUTES.touriste.ModeAssiste : "#"}
                onClick={!user ? (e) => { e.preventDefault(); openAuth("login", ROUTES.touriste.ModeAssiste); } : undefined}
                className="path-card-btn"
                style={{ background: "#2B96A8", color: "white", boxShadow: "0 6px 22px rgba(43,150,168,0.42)" }}
              >
                Je veux qu&apos;on me propose <ArrowRight size={15} />
              </Link>
            </div>

            {/* Mode Libre */}
            <div className="path-card" style={{ background: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.22)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", alignSelf: "flex-start" }}>
                <Map size={11} color="rgba(255,255,255,0.65)" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.65)", letterSpacing: 1 }}>BUILDER · FLEXIBLE</span>
              </div>
              <ClipboardList size={40} color="rgba(255,255,255,0.88)" style={{ marginTop: 4 }} />
              <div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, letterSpacing: "-0.5px" }}>Mode Libre</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Chaque détail, à votre main</p>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.68)", lineHeight: 1.7 }}>
                Construisez votre voyage de A à Z — choisissez chaque excursion, chaque jour, dans l&apos;ordre qui vous plaît.
              </p>
              <Link
                href={user ? `${ROUTES.touriste.modeLibre}?mode=libre` : "#"}
                onClick={!user ? (e) => { e.preventDefault(); openAuth("login"); } : undefined}
                className="path-card-btn"
                style={{ background: "rgba(255,255,255,0.14)", border: "1.5px solid rgba(255,255,255,0.32)", color: "white" }}
              >
                Je veux décider moi-même <ArrowRight size={15} />
              </Link>
            </div>

            {/* Explorer */}
            <div className="path-card" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.14)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", alignSelf: "flex-start" }}>
                <Search size={11} color="rgba(255,255,255,0.52)" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.52)", letterSpacing: 1 }}>SANS COMPTE</span>
              </div>
              <Mountain size={40} color="rgba(255,255,255,0.88)" style={{ marginTop: 4 }} />
              <div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, letterSpacing: "-0.5px" }}>Juste Explorer</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", fontWeight: 600 }}>Parcourez librement le catalogue</p>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
                Pas besoin de compte pour regarder. Parcourez toutes les excursions disponibles en Tunisie.
              </p>
              <Link
                href={ROUTES.excursions}
                className="path-card-btn"
                style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.28)", color: "rgba(255,255,255,0.82)" }}
              >
                Voir toutes les excursions <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Bannière prestataire */}
          <button
            className="presta-banner"
            onClick={() => openAuth("prestataire")}
            style={{ width: "100%", background: "none", border: "1px solid rgba(255,255,255,0.14)", fontFamily: "inherit", textAlign: "left" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={22} color="rgba(255,255,255,0.7)" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 3 }}>Vous êtes prestataire ?</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", fontWeight: 500 }}>Listez vos excursions sur VoyajAime et touchez des milliers de voyageurs.</p>
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
              Inscrivez votre activité <ArrowRight size={14} />
            </div>
          </button>
        </div>
      </section>

      {/* ══ EXCURSIONS POPULAIRES ══ */}
      <section style={{ padding: "96px 72px 80px", background: "#FAFAF9" }} className="section-pad">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 52, flexWrap: "wrap", gap: 20 }}>
            <div>
            
              <h2 className="section-title">
                Excursions<br />populaires
              </h2>
            </div>
            <Link href={ROUTES.excursions} className="btn-outline" style={{ marginBottom: 8 }}>
              Voir tout le catalogue <ArrowRight size={15} />
            </Link>
          </div>

          {/* Grid */}
          {excLoading && (
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!excLoading && excursions.length === 0 && (
            <div style={{ textAlign: "center", padding: "72px 20px", background: "white", borderRadius: 20, border: "1px solid #F0F0F0" }}>
              <Mountain size={48} style={{ color: "#E5E7EB", margin: "0 auto 16px" }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Aucune excursion disponible</p>
            </div>
          )}

          {!excLoading && excursions.length > 0 && (
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
              {excursions.map(exc => {
                const photo    = exc.photos?.find(Boolean) || FALLBACK_IMG;
                const category = exc.categories?.[0] || null;
                return (
                  <Link key={exc.id} href={ROUTES.excursion(exc.id)} className="exc-card">
                    <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                      <img src={photo} alt={exc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                      {category && (
                        <div style={{ position: "absolute", top: 14, left: 14 }}>
                          <span style={{ padding: "4px 11px", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "white", letterSpacing: 0.3 }}>{category}</span>
                        </div>
                      )}
                      <button className="heart-btn"
                        onClick={e => {
                          e.preventDefault();
                          if (!user) openAuth("login", ROUTES.excursion(exc.id));
                        }}>
                        {user ? <Heart size={16} color="#E11D48" /> : <Lock size={14} color="#6B7280" />}
                      </button>
                    </div>
                    <div style={{ padding: "18px 18px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4, lineHeight: 1.35 }}>{exc.title}</h3>
                          <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {exc.city}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{exc.price_per_person}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>TND / pers.</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
                        <div style={{ display: "flex", gap: 14 }}>
                          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {exc.duration_hours}h</span>
                          {exc.rating > 0 && (
                            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                              <Star size={12} fill="#F59E0B" stroke="#F59E0B" /> {Number(exc.rating).toFixed(1)}
                              {exc.reviews_count > 0 && <span style={{ color: "#C4C9D4" }}>({exc.reviews_count})</span>}
                            </span>
                          )}
                        </div>
                        <div style={{ padding: "7px 14px", background: user ? "#02AFCF" : "#F3F4F6", color: user ? "white" : "#9CA3AF", borderRadius: 10, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {user ? <><CalendarCheck size={13} /> Réserver</> : <><Lock size={12} /> Réserver</>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* CTA visiteur */}
          {!user && (
            <div className="guest-cta" style={{ marginTop: 56, padding: "40px 48px", background: "linear-gradient(135deg,#EFF9FB 0%,#F8FFFE 100%)", border: "1.5px solid #C5E9EF", borderRadius: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8, fontFamily: "'Playfair Display',serif", letterSpacing: "-0.5px" }}>
                  Envie de réserver ou sauvegarder ?
                </h3>
                <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6 }}>
                  Créez un compte gratuit — accès aux favoris, réservations et suivi de paiement.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                <button onClick={() => openAuth("register")} className="btn-primary" style={{ fontSize: 14, padding: "13px 24px" }}>
                  <UserPlus size={16} /> Créer un compte
                </button>
                <button onClick={() => openAuth("login")} className="btn-outline" style={{ fontSize: 14 }}>
                  <LogIn size={16} /> Se connecter
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="footer" style={{ background: "#0D1117", padding: "36px 72px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontFamily: "'Playfair Display',serif", color: "white", fontWeight: 700, fontSize: 16 }}>VoyajAime</span>
        </div>
        <p style={{ color: "#4B5563", fontSize: 13 }}>© 2026 VoyajAime — Tourisme en Tunisie</p>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link href={ROUTES.excursions} style={{ color: "#6B7280", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>Excursions</Link>
          {user
            ? <Link href={ROUTES.touriste.dashboard} style={{ padding: "10px 20px", background: "#2B96A8", color: "white", borderRadius: 30, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <User size={13} /> Mon espace
              </Link>
            : <button onClick={() => openAuth("login")} style={{ padding: "10px 20px", background: "#2B96A8", color: "white", borderRadius: 30, border: "none", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "inherit" }}>
                <LogIn size={13} /> Connexion
              </button>
          }
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
}