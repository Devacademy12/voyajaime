"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";

import HomeStyles        from "@/app/components/home/HomeStyles";
import HeroSlider        from "@/app/components/home/HeroSlider";
import PathsSection      from "@/app/components/home/PathsSection";
import PopularExcursions from "@/app/components/home/PopularExcursions";
import AboutSection      from "@/app/components/home/AboutSection";
import BlogSection       from "@/app/components/home/BlogSection";
import HomeFooter        from "@/app/components/home/HomeFooter";
import TouristeNav       from "@/app/components/touriste/TouristeNav";

const ContactSection = dynamic(
  () => import("@/app/components/home/ContactSection"),
  { ssr: false }
);

import { SlideExcursion, Excursion } from "@/lib/homeUtils";

const CSS_PAGE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .home-root *, .home-root *::before, .home-root *::after {
    box-sizing: border-box;
  }

  .home-section-reveal {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.6s cubic-bezier(.16,1,.3,1), transform 0.6s cubic-bezier(.16,1,.3,1);
  }
  .home-section-reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .home-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #E5E7EB 20%, #E5E7EB 80%, transparent);
    margin: 0;
    border: none;
  }

  .cities-strip {
    background: #F7F9FC;
    padding: 88px 0;
    overflow: hidden;
  }
  .cities-strip-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 64px;
  }
  .cities-strip-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .cities-grid {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 10px;
    scrollbar-width: none;
    margin: 0 -64px;
    padding-left: 64px;
    padding-right: 64px;
  }
  .cities-grid::-webkit-scrollbar { display: none; }

  .city-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 3 / 4;
    cursor: pointer;
    text-decoration: none;
    display: block;
    transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    flex: 0 0 240px;
    scroll-snap-align: start;
  }
  .city-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 44px rgba(0,0,0,0.14);
  }
  .city-card-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
    z-index: 1;
  }
  .city-card:hover .city-card-img { transform: scale(1.07); }
  .city-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.08) 55%, transparent 100%);
    z-index: 2;
  }
  .city-card-name {
    position: absolute; bottom: 13px; left: 13px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; font-weight: 700; color: white;
    letter-spacing: -0.2px; z-index: 3;
  }
  .city-card-count {
    position: absolute; bottom: 36px; left: 14px;
    font-size: 10px; font-weight: 700;
    color: rgba(255,255,255,0.65);
    text-transform: uppercase; letter-spacing: 1.5px; z-index: 3;
  }

  @media (max-width: 1024px) {
    .cities-strip-inner { padding: 0 24px; }
    .cities-grid { margin: 0 -24px; padding-left: 24px; padding-right: 24px; }
    .city-card { flex: 0 0 200px; }
  }
  @media (max-width: 640px) {
    .cities-strip { padding: 56px 0; }
    .city-card { flex: 0 0 160px; }
  }
`;

const CITIES = [
  { name: "Tunis",    img: "/images/cities/tunis.webp",    count: 24 },
  { name: "Djerba",   img: "/images/cities/Djerba.webp",   count: 18 },
  { name: "Sousse",   img: "/images/cities/sousse.webp",   count: 12 },
  { name: "Hammamet", img: "/images/cities/hammamet.webp", count: 9  },
  { name: "Kairouan", img: "/images/cities/Kairouan.webp", count: 7  },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

export default function HomePage() {
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user,       setUser]       = useState<{ email?: string; id?: string } | null>(null);
  const [slides,     setSlides]     = useState<SlideExcursion[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excLoading, setExcLoading] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser({ email: session.user.email, id: session.user.id });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { email: session.user.email, id: session.user.id } : null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    supabase
      .from("excursions")
      .select("id, title, city, price_per_person, duration_hours, rating, reviews_count, categories, photos")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setExcursions(data as Excursion[]);
        setExcLoading(false);
      });
  }, [supabase]);

  // Cache la navbar quand on scroll hors du hero
  useEffect(() => {
    const heroEl = document.getElementById("hero-section");
    if (!heroEl) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    obs.observe(heroEl);
    return () => obs.disconnect();
  }, []);

  const openAuth = (mode: "login" | "register" | "prestataire", redirect?: string) => {
    if (redirect) sessionStorage.setItem("redirect_after_login", redirect);
    router.push(`/auth?mode=${mode}`);
  };

  const refCities  = useReveal();
  const refExc     = useReveal();
  const refPaths   = useReveal();
  const refAbout   = useReveal();
  const refBlog    = useReveal();
  const refContact = useReveal();

  return (
    <div className="home-root">
      <HomeStyles />
      <style>{CSS_PAGE}</style>

      {/* Navbar fixe, visible uniquement sur le hero */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        opacity: heroVisible ? 1 : 0,
        pointerEvents: heroVisible ? "auto" : "none",
        transition: "opacity 0.3s ease",
      }}>
        <TouristeNav
          userName={user ? (user.email?.split("@")[0] || "Touriste") : undefined}
          isLoggedIn={!!user?.id}
        />
      </div>

      {/* 1. HERO SLIDER */}
      <div id="hero-section">
        <HeroSlider />
      </div>

      {/* 2. PATHS SECTION */}
      <div ref={refPaths} className="home-section-reveal" id="chemins">
        <PathsSection
          slides={slides}
          user={user}
          openAuth={openAuth}
        />
      </div>

      <hr className="home-divider" />

      {/* 3. EXCURSIONS POPULAIRES */}
      <div ref={refExc} className="home-section-reveal">
        <PopularExcursions
          excursions={excursions}
          excLoading={excLoading}
          user={user}
          openAuth={openAuth}
        />
      </div>

      <hr className="home-divider" />

      {/* 4. NOS DESTINATIONS */}
      <div ref={refCities} className="home-section-reveal cities-strip">
        <div className="cities-strip-inner">
          <div className="cities-strip-header">
            <div>
              <p className="section-eyebrow" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Nos destinations
              </p>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(26px, 3.5vw, 42px)",
                fontWeight: 700, color: "#053366",
                letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0,
              }}>
                Explorez la Tunisie
              </h2>
            </div>
            <a href={ROUTES.excursions}
              style={{
                fontSize: 13, fontWeight: 700, color: "#0B7A8A",
                textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap",
                padding: "9px 18px", border: "1.5px solid rgba(11,122,138,0.3)",
                borderRadius: 10, transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E6F4F6";
                e.currentTarget.style.borderColor = "#0B7A8A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(11,122,138,0.3)";
              }}
            >
              Voir toutes les villes →
            </a>
          </div>

          <div className="cities-grid">
            {CITIES.map((city, i) => (
              <a
                key={i}
                href={`${ROUTES.excursions}?city=${encodeURIComponent(city.name)}`}
                className="city-card"
              >
                <img src={city.img} alt={city.name} className="city-card-img" loading="eager" decoding="async" />
                <div className="city-card-overlay" />
                <span className="city-card-count">{city.count} excursions</span>
                <span className="city-card-name">{city.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <hr className="home-divider" />

      {/* 5. ABOUT */}
      <div ref={refAbout} className="home-section-reveal">
        <AboutSection />
      </div>

      <hr className="home-divider" />

      {/* 6. BLOG */}
      <div ref={refBlog} className="home-section-reveal">
        <BlogSection />
      </div>

      {/* 7. CONTACT */}
      <div ref={refContact} className="home-section-reveal" suppressHydrationWarning>
        <ContactSection />
      </div>

      {/* 8. FOOTER */}
      <HomeFooter user={user} openAuth={openAuth} />
    </div>
  );
}