"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Sparkles, Map, Play, Volume2, VolumeX, Star, Calendar, Users, Compass } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExcursionRow {
  id: string;
  title: string;
  city: string;
  photos: string[];
  categories: string[];
  rating: number;
}

interface RawSlide {
  id: string;
  position: number;
  type: "excursion" | "video" | "custom";
  excursion_id: string | null;
  video_url: string | null;
  custom_image_url: string | null;
  custom_title: string | null;
  custom_subtitle: string | null;
  custom_color: string;
  is_active: boolean;
  excursion?: ExcursionRow | ExcursionRow[] | null;
}

interface SlideDisplay {
  id: string;
  type: "excursion" | "video" | "custom";
  excursionId: string | null;
  imageUrl: string;
  videoUrl: string | null;
  title: string;
  subtitle: string;
  color: string;
  categories: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1600&q=80";

const SLIDE_DURATION = 6000;
const FADE_DURATION  = 600;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeEmbed(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match
    ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&rel=0&modestbranding=1`
    : null;
}

function rawToDisplay(raw: RawSlide): SlideDisplay {
  const exc: ExcursionRow | null = Array.isArray(raw.excursion)
    ? (raw.excursion[0] ?? null)
    : (raw.excursion ?? null);

  let imageUrl = FALLBACK_IMG;
  let title    = raw.custom_title || "";
  let subtitle = raw.custom_subtitle || "";
  let categories: string[] = [];
  let excursionId: string | null = null;

  if (raw.type === "excursion" && exc) {
    imageUrl    = exc.photos?.[0] || FALLBACK_IMG;
    title       = raw.custom_title || exc.title;
    subtitle    = raw.custom_subtitle || exc.city;
    categories  = exc.categories || [];
    excursionId = exc.id;
  } else if (raw.type === "video") {
    imageUrl = raw.custom_image_url || FALLBACK_IMG;
    title    = raw.custom_title  || "Découvrez la Tunisie";
    subtitle = raw.custom_subtitle || "";
  } else {
    imageUrl = raw.custom_image_url || FALLBACK_IMG;
    title    = raw.custom_title  || "Découvrez la Tunisie";
    subtitle = raw.custom_subtitle || "";
  }

  return {
    id: raw.id, type: raw.type, excursionId,
    imageUrl, videoUrl: raw.video_url || null,
    title, subtitle,
    color: raw.custom_color || "#02AFCF",
    categories,
  };
}

// ─── Video Background ─────────────────────────────────────────────────────────

function VideoBackground({ url, muted }: { url: string; muted: boolean }) {
  const embedUrl = isYouTube(url) ? getYouTubeEmbed(url) : null;

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          border: "none", pointerEvents: "none",
          transform: "scale(1.08)",
        }}
        allow="autoplay; fullscreen"
        title="hero-video"
      />
    );
  }

  return (
    <video
      src={url} autoPlay loop playsInline muted={muted}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomeSlider() {
  const supabase = createClient();

  const [slides,   setSlides]   = useState<SlideDisplay[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [current,  setCurrent]  = useState(0);
  const [fading,   setFading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted,    setMuted]    = useState(true);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef  = useRef(true);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchSlides() {
      try {
        const { data, error } = await supabase
          .from("home_slider")
          .select(`
            id, position, type,
            excursion_id, video_url,
            custom_image_url, custom_title, custom_subtitle, custom_color,
            is_active,
            excursion:excursions (
              id, title, city, photos, categories, rating
            )
          `)
          .eq("is_active", true)
          .order("position", { ascending: true });

        if (cancelled) return;
        if (error || !data?.length) { setLoading(false); return; }
        setSlides((data as unknown as RawSlide[]).map(rawToDisplay));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSlides();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-advance ──────────────────────────────────────────────────────────
  const goTo = useCallback((idx: number) => {
    if (!mountedRef.current) return;
    setFading(true);
    setProgress(0);
    if (timerRef.current)    clearInterval(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setTimeout(() => {
      if (!mountedRef.current) return;
      setCurrent(idx);
      setFading(false);
      let elapsed = 0;
      progressRef.current = setInterval(() => {
        elapsed += 60;
        setProgress(Math.min((elapsed / SLIDE_DURATION) * 100, 100));
      }, 60);
    }, FADE_DURATION);
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    setProgress(0);
    let elapsed = 0;
    progressRef.current = setInterval(() => {
      elapsed += 60;
      setProgress(Math.min((elapsed / SLIDE_DURATION) * 100, 100));
    }, 60);
    timerRef.current = setInterval(() => {
      setCurrent(prev => { goTo((prev + 1) % slides.length); return prev; });
    }, SLIDE_DURATION);
    return () => {
      if (timerRef.current)    clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [slides.length, goTo]);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!slides.length) return;
      if (e.key === "ArrowRight") goTo((current + 1) % slides.length);
      if (e.key === "ArrowLeft")  goTo((current - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length, current, goTo]);

  const slide = slides[current];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap');

        @keyframes spin { 
          to { transform: rotate(360deg) } 
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(12px) translateX(-50%); }
        }
        
        @keyframes slideUp {
          0% { 
            opacity: 0; 
            transform: translateY(40px);
            filter: blur(8px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0);
            filter: blur(0);
          }
        }
        
        @keyframes fadeInScale {
          0% { 
            opacity: 0; 
            transform: scale(0.95);
          }
          100% { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .slide-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity, transform;
        }

        .hero-animate-1 { 
          animation: slideUp 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) 0.1s both; 
        }
        .hero-animate-2 { 
          animation: slideUp 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) 0.2s both; 
        }
        .hero-animate-3 { 
          animation: slideUp 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) 0.35s both; 
        }
        .hero-animate-4 { 
          animation: slideUp 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) 0.5s both; 
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 16px 36px; border-radius: 100px;
          background: linear-gradient(135deg, #02AFCF 0%, #0891b2 100%);
          color: white; font-size: 16px; font-weight: 700;
          text-decoration: none; font-family: 'Inter', sans-serif;
          transition: all 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
          box-shadow: 0 8px 28px rgba(2, 175, 207, 0.35);
          white-space: nowrap;
          letter-spacing: 0.3px;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .btn-primary:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 16px 40px rgba(2, 175, 207, 0.5);
          gap: 14px;
        }
        
        .btn-primary:hover::before {
          left: 100%;
        }
        
        .btn-primary:active { transform: translateY(-2px); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 16px 36px; border-radius: 100px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          color: white; font-size: 16px; font-weight: 600;
          text-decoration: none; font-family: 'Inter', sans-serif;
          transition: all 0.4s cubic-bezier(0.34, 1.2, 0.64, 1);
          white-space: nowrap;
          letter-spacing: 0.3px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .btn-ghost::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .btn-ghost:hover { 
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.7);
          transform: translateY(-4px);
          gap: 14px;
        }
        
        .btn-ghost:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .btn-ghost:active { transform: translateY(-2px); }

        .dot-btn { 
          background: none; 
          border: none; 
          cursor: pointer; 
          padding: 8px;
          transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
        }
        
        .dot-btn:hover { 
          transform: scale(1.2); 
        }
        
        .dot-btn:hover .dot-inactive {
          background: rgba(255, 255, 255, 0.8);
          transform: scale(1.1);
        }

        .mute-btn {
          position: absolute; 
          bottom: 32px; 
          right: 32px;
          background: rgba(0, 0, 0, 0.6); 
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white; 
          border-radius: 100px; 
          padding: 10px 20px;
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 10px;
          font-size: 13px; 
          font-weight: 500; 
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
          z-index: 20;
        }
        
        .mute-btn:hover { 
          background: rgba(0, 0, 0, 0.8);
          border-color: rgba(255, 255, 255, 0.4);
          transform: scale(1.05);
        }

        .skeleton-shimmer {
          background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          background-size: 200% 100%;
          animation: shimmer 1.8s infinite;
        }

        @media (max-width: 768px) {
          .btn-primary, .btn-ghost {
            padding: 12px 24px;
            font-size: 14px;
          }
          .btn-primary svg, .btn-ghost svg {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>

      <section
        style={{ 
          position: "relative", 
          height: "100vh", 
          overflow: "hidden", 
          fontFamily: "'Inter', system-ui, sans-serif" 
        }}
        aria-label="Slider principal"
      >

        {/* ── Loading ── */}
        {loading && (
          <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0, zIndex: 50 }}>
            <div style={{ 
              position:"absolute", inset:0, display:"flex", 
              alignItems:"center", justifyContent:"center", 
              flexDirection:"column", gap:24 
            }}>
              <div style={{ 
                width: 60, height: 60, 
                border: "3px solid rgba(2,175,207,0.2)", 
                borderTop: "3px solid #02AFCF", 
                borderRadius: "50%", 
                animation: "spin .9s linear infinite" 
              }}/>
              <p style={{ 
                color:"rgba(255,255,255,0.6)", 
                fontSize: 14, 
                fontWeight: 500,
                letterSpacing: 1
              }}>
                Chargement...
              </p>
            </div>
          </div>
        )}

        {/* ── Fallback ── */}
        {!loading && !slides.length && (
          <div style={{ 
            position:"absolute", inset:0, 
            backgroundImage:`url(${FALLBACK_IMG})`, 
            backgroundSize:"cover", backgroundPosition:"center" 
          }}>
            <div style={{ 
              position:"absolute", inset:0, 
              background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 100%)" 
            }}/>
            <div style={{ 
              position:"absolute", 
              top:"50%", left:"50%", 
              transform:"translate(-50%, -50%)", 
              textAlign:"center", 
              width:"100%",
              maxWidth: 700,
              padding: "0 24px"
            }}>
              <h1 style={{ 
                fontFamily:"'Playfair Display', serif", 
                fontSize:"clamp(42px, 6vw, 72px)", 
                fontWeight: 900, 
                color:"white", 
                marginBottom: 24,
                lineHeight: 1.1,
                letterSpacing: "-2px"
              }}>
                Découvrez la Tunisie
              </h1>
              <p style={{
                fontSize: "clamp(16px, 2vw, 18px)",
                color: "rgba(255,255,255,0.9)",
                marginBottom: 32,
                lineHeight: 1.6
              }}>
                Des expériences uniques au cœur de la Méditerranée
              </p>
              <Link href={ROUTES.excursions} className="btn-primary" style={{ display: "inline-flex" }}>
                <Compass size={18}/> Explorer maintenant
              </Link>
            </div>
          </div>
        )}

        {/* ── Slides ── */}
        {!loading && slide && (
          <>
            {/* Background */}
            {slide.type === "video" && slide.videoUrl ? (
              <VideoBackground url={slide.videoUrl} muted={muted}/>
            ) : (
              <div
                className="slide-bg"
                style={{
                  backgroundImage: `url(${slide.imageUrl})`,
                  opacity: fading ? 0 : 1,
                  transform: fading ? "scale(1.05)" : "scale(1)",
                }}
              />
            )}

            {/* Overlays modernes */}
            <div style={{ 

              position:"absolute", 
              background: "linear-gradient(100deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.45) 45%, rgba(0,0,0,.15) 100%)" 
            }}/>
            <div style={{ 
              position:"absolute", inset:0,
              background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 60%)" 
            }}/>
            
            {/* Subtle pattern overlay */}
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle at 20% 40%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
              pointerEvents: "none"
            }}/>
            
            {/* Mute button */}
            {slide.type === "video" && slide.videoUrl && !isYouTube(slide.videoUrl) && (
              <button className="mute-btn" onClick={() => setMuted(m => !m)}>
                {muted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                <span>{muted ? "Activer le son" : "Couper le son"}</span>
              </button>
            )}

            {/* ─── Hero Content amélioré ─── */}
            <div
              key={current}
              style={{
                position: "absolute",
                top: "50%",
                left: "max(6%, 80px)",
                transform: "translateY(-50%)",
                maxWidth: "min(680px, 85%)",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                zIndex: 15,
              }}
            >
              {/* Badge avec icône */}
              {slide.subtitle && (
                <div className="hero-animate-1" style={{
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 10,
                  padding: "8px 20px", 
                  borderRadius: 100,
                  background: `${slide.color}15`,
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${slide.color}40`,
                  marginBottom: 28,
                }}>
                  <MapPin size={14} style={{ color: slide.color }}/>
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: "white", 
                    letterSpacing: 1.8, 
                    textTransform: "uppercase" 
                  }}>
                    {slide.subtitle}
                  </span>
                </div>
              )}

              {/* Titre principal */}
              <h1 className="hero-animate-2" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(40px, 5vw, 68px)",
                fontWeight: 800,
                color: "white",
                lineHeight: 1.05,
                letterSpacing: "-2.5px",
                marginBottom: 24,
                textShadow: "0 4px 40px rgba(0,0,0,0.3)",
                maxWidth: "100%",
              }}>
                {slide.title}
              </h1>

              {/* Catégories avec design amélioré */}
              <div className="hero-animate-3" style={{ marginBottom: 36 }}>
                {slide.categories?.length > 0 ? (
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: 12,
                    alignItems: "center"
                  }}>
                    {slide.categories.slice(0, 3).map((cat, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 100,
                          background: "rgba(255,255,255,0.1)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)"
                        }}
                      >
                        <Star size={12} style={{ color: slide.color }}/>
                        <span style={{ 
                          fontSize: 13, 
                          color: "white", 
                          fontWeight: 500,
                          letterSpacing: 0.3,
                        }}>
                          {cat}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ 
                    fontSize: 17, 
                    color: "rgba(255,255,255,0.9)", 
                    lineHeight: 1.5,
                    margin: 0,
                    fontWeight: 500,
                    maxWidth: "90%"
                  }}>
                    Vivez une expérience inoubliable au cœur de la Tunisie
                  </p>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="hero-animate-4" style={{ 
                display: "flex", 
                gap: 18, 
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                <a href="#chemins" className="btn-primary">
                  <Sparkles size={18}/> 
                  <span>Planifier mon voyage</span>
                </a>
                {slide.type === "excursion" && slide.excursionId
                  ? <Link href={ROUTES.excursion(slide.excursionId)} className="btn-ghost">
                      <Map size={18}/> 
                      <span>Découvrir</span>
                    </Link>
                  : <Link href={ROUTES.excursions} className="btn-ghost">
                      <Compass size={18}/> 
                      <span>Explorer</span>
                    </Link>
                }
              </div>
            </div>

            {/* ─── Navigation Dots avec animation de progression ─── */}
            <div style={{ 
              position:"absolute", 
              bottom: 48, 
              left: "50%",
              transform: "translateX(-50%)",
              display:"flex", 
              gap: 16, 
              alignItems:"center",
              zIndex: 15,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
              padding: "8px 20px",
              borderRadius: 100,
              border: "1px solid rgba(255,255,255,0.15)"
            }}>
              {slides.map((_, i) => (
                <button key={i} className="dot-btn"
                  onClick={() => { 
                    if (timerRef.current) clearInterval(timerRef.current); 
                    goTo(i); 
                  }}
                  aria-label={`Slide ${i + 1}`}
                >
                  {i === current ? (
                    <div style={{ 
                      width: 48, 
                      height: 4, 
                      borderRadius: 4, 
                      background: `linear-gradient(90deg, ${slide.color}, ${slide.color}80)`,
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <div style={{ 
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height:"100%", 
                        width:`${progress}%`, 
                        background:"white",
                        transition:"width .06s linear",
                        borderRadius: 4
                      }}/>
                    </div>
                  ) : (
                    <div className="dot-inactive" style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: "50%", 
                      background: "rgba(255,255,255,0.4)",
                      transition: "all 0.3s ease",
                    }}/>
                  )}
                </button>
              ))}
            </div>

            {/* ─── Compteur élégant ─── */}
            <div style={{ 
              position:"absolute", 
              bottom: 54, 
              right: "max(5%, 48px)", 
              fontSize: 14, 
              color: "rgba(255,255,255,0.6)", 
              fontWeight: 600, 
              letterSpacing: 3,
              fontFamily: "'Inter', monospace",
              zIndex: 15,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
              padding: "6px 14px",
              borderRadius: 100,
              border: "1px solid rgba(255,255,255,0.15)"
            }}>
              {String(current + 1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}
            </div>

            {/* ─── Scroll Indicator animé ─── */}
            <div style={{ 
              position:"absolute", 
              bottom: 28, 
              left:"50%", 
              transform: "translateX(-50%)",
              animation:"float 2.5s ease-in-out infinite",
              opacity: 0.7,
              zIndex: 15,
              cursor: "pointer",
              transition: "opacity 0.3s"
            }}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              <ChevronDown size={28} color="white" strokeWidth={1.5}/>
            </div>
          </>
        )}
      </section>
    </>
  );
}