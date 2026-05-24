"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";

// ── Composants sections ──────────────────────────────────────────────────────
import HomeStyles        from "@/app/components/home/HomeStyles";
import TouristeNav       from "@/app/components/touriste/TouristeNav";
import HeroSlider        from "@/app/components/home/HeroSlider";
import PathsSection      from "@/app/components/home/PathsSection";
import PopularExcursions from "@/app/components/home/PopularExcursions";
import AboutSection      from "@/app/components/home/AboutSection";
import BlogSection       from "@/app/components/home/BlogSection";
import ContactSection    from "@/app/components/home/ContactSection";
import HomeFooter        from "@/app/components/home/HomeFooter";

// ── Types ────────────────────────────────────────────────────────────────────
import { SlideExcursion, Excursion } from "@/lib/homeUtils";

// ─────────────────────────────────────────────────────────────────────────────

const CSS_PAGE = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Reset local ── */
  .home-root *, .home-root *::before, .home-root *::after {
    box-sizing: border-box;
  }

  /* ── Section fade-in on scroll ── */
  .home-section-reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.65s cubic-bezier(.16,1,.3,1), transform 0.65s cubic-bezier(.16,1,.3,1);
  }
  .home-section-reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Trust bar ── */
  .trust-bar {
    background: #fff;
    border-bottom: 1px solid #F0F0F0;
    padding: 0;
    overflow: hidden;
  }
  .trust-bar-inner {
    display: flex;
    align-items: stretch;
  }
  .trust-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 18px 24px;
    border-right: 1px solid #F0F0F0;
    transition: background 0.2s;
    cursor: default;
  }
  .trust-item:last-child { border-right: none; }
  .trust-item:hover { background: #F8FAFF; }
  .trust-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
  }
  .trust-label { font-size: 13px; font-weight: 700; color: #1E293B; font-family: inherit'DM Sans', sans-serif; }
  .trust-sub   { font-size: 11px; color: #94A3B8; font-weight: 500; font-family: inherit'DM Sans', sans-serif; }

  /* ── Section divider ── */
  .home-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #E2E8F0 20%, #E2E8F0 80%, transparent);
    margin: 0;
    border: none;
  }

  /* ── "Nos destinations" quick city links ── */
  .cities-strip {
    background: #fff;
    padding: 56px 0;
    overflow: hidden;
  }
  .cities-strip-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
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
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
  }
  .city-card {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 3/4;
    cursor: pointer;
    text-decoration: none;
    display: block;
    transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s;
  }
  .city-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.18);
  }
  .city-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  .city-card:hover .city-card-img { transform: scale(1.08); }
  .city-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.1) 55%, transparent 100%);
  }
  .city-card-name {
    position: absolute; bottom: 14px; left: 14px;
    font-family: inherit'Playfair Display', serif;
    font-size: 16px; font-weight: 700;
    color: white; letter-spacing: -0.3px;
  }
  .city-card-count {
    position: absolute; bottom: 36px; left: 14px;
    font-size: 10px; font-weight: 700;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase; letter-spacing: 1.5px;
  }

  /* ── Newsletter ── */
  .newsletter-section {
    background: #053366; /* Bleu profond brand */
    padding: 80px 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .newsletter-section::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: rgba(43, 150, 168, 0.1);
    border-radius: 50%;
  }
  .newsletter-section::after {
    content: '';
    position: absolute;
    bottom: -150px;
    left: -150px;
    width: 400px;
    height: 400px;
    background: rgba(43, 150, 168, 0.05);
    border-radius: 50%;
  }
    overflow: hidden;
  }
  .newsletter-section::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(circle at 25% 50%, rgba(255,255,255,0.06) 1px, transparent 1px),
                      radial-gradient(circle at 75% 20%, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 48px 48px, 32px 32px;
    pointer-events: none;
  }
  .newsletter-inner {
    position: relative; z-index: 1;
    max-width: 560px; margin: 0 auto;
  }
  .newsletter-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 5px 14px; border-radius: 100px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    font-size: 11px; font-weight: 700;
    color: rgba(255,255,255,0.8);
    text-transform: uppercase; letter-spacing: 2px;
    margin-bottom: 20px;
    font-family: inherit'DM Sans', sans-serif;
  }
  .newsletter-title {
    font-family: inherit'Playfair Display', serif;
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 900; color: white;
    letter-spacing: -1px; line-height: 1.1;
    margin-bottom: 12px;
  }
  .newsletter-sub {
    font-size: 15px; color: rgba(255,255,255,0.65);
    line-height: 1.6; margin-bottom: 32px;
    font-family: inherit'DM Sans', sans-serif;
  }
  .newsletter-form {
    display: flex; gap: 10px;
    max-width: 440px; margin: 0 auto;
  }
  .newsletter-input {
    flex: 1;
    padding: 14px 18px;
    border-radius: 12px;
    border: 1.5px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(12px);
    color: white; font-size: 14px;
    font-family: inherit'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .newsletter-input::placeholder { color: rgba(255,255,255,0.45); }
  .newsletter-input:focus {
    border-color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.15);
  }
  .newsletter-btn {
    padding: 14px 22px;
    border-radius: 12px;
    background: white; color: #053366;
    font-size: 14px; font-weight: 800;
    border: none; cursor: pointer;
    font-family: inherit'DM Sans', sans-serif;
    white-space: nowrap;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  .newsletter-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .cities-grid { grid-template-columns: repeat(3, 1fr) !important; }
  }
  @media (max-width: 640px) {
    .trust-bar-inner { flex-wrap: wrap; }
    .trust-item { flex: 1 1 50%; border-bottom: 1px solid #F0F0F0; }
    .cities-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .newsletter-form { flex-direction: column; }
    .newsletter-btn { width: 100%; justify-content: center; }
  }
`;

// ── Destinations avec images Unsplash ─────────────────────────────────────────
const CITIES = [
  { name: "Tunis",     img: "https://imgs.search.brave.com/ekbH45D9ocaj-uhA_z7OJbSlbCSFgEACAklo_Y6Kphk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTI1/NTc5MTE1Ni9waG90/by9zdHJlZXQtaW4t/c291c3NlLXR1bmlz/aWEuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPXo4RjV5N0FC/ZjRxellTZmU2V3Ez/VngxNUtrVlFoZkhT/Uk0tU0xGREpkYVk9", count: 24 },
  { name: "Djerba",    img: "https://imgs.search.brave.com/wUgvPgaV1SGn1DR0eaq5kkVInRMeryIu48dLWsAgsuQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9kamVy/YmF5LmNvbS93cC1j/b250ZW50L3VwbG9h/ZHMvMjAyNS8wNS9U/b3VyLWRlLWxpbGUt/RGplcmJhLnBuZw", count: 18 },
  { name: "Sousse",    img: "https://imgs.search.brave.com/7psac7T8Ljdty4B77lqZh9Zp5vR0Q--KMV4h7y3Q_ZE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTM3/MTcxNDM5MS9waG90/by90dW5pc2lhLXNv/dXNzZS1tZWRpbmEu/anBnP3M9NjEyeDYx/MiZ3PTAmaz0yMCZj/PXJ4MEdjQVRRd201/c0Y4V1FBY195QkRQ/OExwNXdDaFFfVVdp/UktocFZLNEU9", count: 12 },
  { name: "Hammamet",  img: "https://imgs.search.brave.com/RyD4-EAWsB7ZAFNjJ1jMxr-CPgQMabjHwxUwdyET2X0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/Y2FudHJhdmVsd2ls/bHRyYXZlbC5jb20v/d3AtY29udGVudC91/cGxvYWRzL3RoaW5n/cy10by1kby1oYW1t/YW1ldC10dW5pc2lh/LW9sZC1tZWRpbmEu/anBn", count: 9  },
  { name: "Kairouan",  img: "https://imgs.search.brave.com/Q0ZBbUY-9oGKYHA7ORVPcNeu65JC0udcRz5FppxZVJ8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zYWNy/ZWRzaXRlcy5jb20v/aW1hZ2VzL2Fmcmlj/YS90dW5pc2lhL0th/aXJvdWFuLUdyZWF0/LU1vc3F1ZS0xLndl/YnA", count: 7  },
];



// ── Reveal hook ───────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router  = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user,       setUser]       = useState<{ email?: string; id?: string } | null>(null);
  const [slides,     setSlides]     = useState<SlideExcursion[]>([]);
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excLoading, setExcLoading] = useState(true);
  const [newsletter, setNewsletter] = useState("");
  const [nlSent,     setNlSent]     = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser({ email: session.user.email, id: session.user.id });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { email: session.user.email, id: session.user.id } : null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // ── Excursions populaires ─────────────────────────────────────────────────
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

  // ── openAuth helper ──────────────────────────────────────────────────────
  const openAuth = (mode: "login" | "register" | "prestataire", redirect?: string) => {
    if (redirect) sessionStorage.setItem("redirect_after_login", redirect);
    router.push(`/auth?mode=${mode}`);
  };

  // ── Newsletter ───────────────────────────────────────────────────────────
  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletter.trim()) return;
    // Insert into Supabase newsletter table (si elle existe)
    supabase.from("newsletter_subscribers").insert({ email: newsletter.trim() }).then(() => {
      setNlSent(true);
    });
  };

  // ── Section refs pour animations ────────────────────────────────────────
  const refTrust   = useReveal();
  const refCities  = useReveal();
  const refExc     = useReveal();
  const refPaths   = useReveal();
  const refAbout   = useReveal();
  const refBlog    = useReveal();
  const refNewsl   = useReveal();
  const refContact = useReveal();

  return (
    <div className="home-root">
      <HomeStyles />
      <style>{CSS_PAGE}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <TouristeNav
        userName={user ? (user.email?.split("@")[0] || "Touriste") : undefined}
        isLoggedIn={!!user?.id}
      />

      {/* ── 1. HERO SLIDER — fullscreen, pas de container ────────────── */}
      <HeroSlider />

    

      {/* ── 3. PATHS SECTION (Mode Assisté / Libre / Explorer) ──────── */}
      <div ref={refPaths} className="home-section-reveal" id="chemins">
        <PathsSection
          slides={slides}
          user={user}
          openAuth={openAuth}
        />
      </div>

      <hr className="home-divider" />

      {/* ── 4. EXCURSIONS POPULAIRES ─────────────────────────────────── */}
      <div ref={refExc} className="home-section-reveal">
        <PopularExcursions
          excursions={excursions}
          excLoading={excLoading}
          user={user}
          openAuth={openAuth}
        />
      </div>

      <hr className="home-divider" />

      {/* ── 5. NOS DESTINATIONS — cities strip ───────────────────────── */}
      <div ref={refCities} className="home-section-reveal cities-strip">
        <div className="cities-strip-inner">
          <div className="cities-strip-header">
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#02AFCF", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                Nos destinations
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 900, color: "#053366", letterSpacing: "-1px", lineHeight: 1.1, margin: 0 }}>
                Explorez la Tunisie
              </h2>
            </div>
            <a
              href={ROUTES.excursions}
              style={{ fontSize: 13, fontWeight: 700, color: "#02AFCF", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
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
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <img src={city.img} alt={city.name} className="city-card-img" />
                <div className="city-card-overlay" />
                <span className="city-card-count">{city.count} excursions</span>
                <span className="city-card-name">{city.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <hr className="home-divider" />

      {/* ── 6. ABOUT ─────────────────────────────────────────────────── */}
      <div ref={refAbout} className="home-section-reveal">
        <AboutSection />
      </div>

      <hr className="home-divider" />

      {/* ── 7. BLOG ──────────────────────────────────────────────────── */}
      <div ref={refBlog} className="home-section-reveal">
        <BlogSection />
      </div>

     

      {/* ── 9. CONTACT ───────────────────────────────────────────────── */}
      <div ref={refContact} className="home-section-reveal">
        <ContactSection />
      </div>

      {/* ── 10. FOOTER ───────────────────────────────────────────────── */}
      <HomeFooter user={user} openAuth={openAuth} />
    </div>
  );
}