"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Sparkles, Map, Play, Volume2, VolumeX } from "lucide-react";
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
    color: raw.custom_color || "#2B96A8",
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes bounce { 0%,100%{transform:translateY(0) translateX(-50%)} 50%{transform:translateY(8px) translateX(-50%)} }
        @keyframes heroIn { 
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .slide-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          transition: opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease;
          will-change: opacity, transform;
        }

        /* Animations des éléments */
        .hero-animate-1 { animation: heroIn 0.6s cubic-bezier(0.22, 0.68, 0, 1.2) 0.05s both; }
        .hero-animate-2 { animation: heroIn 0.6s cubic-bezier(0.22, 0.68, 0, 1.2) 0.15s both; }
        .hero-animate-3 { animation: heroIn 0.6s cubic-bezier(0.22, 0.68, 0, 1.2) 0.25s both; }
        .hero-animate-4 { animation: heroIn 0.6s cubic-bezier(0.22, 0.68, 0, 1.2) 0.35s both; }

        /* Boutons améliorés */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 28px; border-radius: 14px;
          background: linear-gradient(135deg, #02AFCF, #053366);
          color: white; font-size: 15px; font-weight: 700;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s cubic-bezier(0.22, 0.68, 0, 1.2);
          box-shadow: 0 8px 24px rgba(2,175,207,.35);
          white-space: nowrap;
          letter-spacing: 0.3px;
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 12px 32px rgba(2,175,207,.55);
          gap: 12px;
        }
        .btn-primary:active { transform: translateY(-1px); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 28px; border-radius: 14px;
          background: rgba(255,255,255,.15);
          border: 1.5px solid rgba(255,255,255,.4);
          backdrop-filter: blur(12px);
          color: white; font-size: 15px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: all 0.3s cubic-bezier(0.22, 0.68, 0, 1.2);
          white-space: nowrap;
          letter-spacing: 0.3px;
          cursor: pointer;
        }
        .btn-ghost:hover { 
          background: rgba(255,255,255,.25);
          border-color: rgba(255,255,255,.6);
          transform: translateY(-3px);
          gap: 12px;
        }
        .btn-ghost:active { transform: translateY(-1px); }

        .dot-btn { 
          background: none; 
          border: none; 
          cursor: pointer; 
          padding: 8px;
          transition: transform 0.2s;
        }
        .dot-btn:hover { transform: scale(1.1); }

        .mute-btn {
          position: absolute; top: 24px; right: 72px;
          background: rgba(255,255,255,.15); 
          border: 1.5px solid rgba(255,255,255,.3);
          backdrop-filter: blur(12px); 
          color: white; 
          border-radius: 40px; 
          padding: 10px 18px;
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px;
          font-size: 13px; 
          font-weight: 600; 
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          z-index: 20;
        }
        .mute-btn:hover { 
          background: rgba(255,255,255,.25);
          transform: scale(1.02);
        }

        .skeleton-shimmer {
          background: linear-gradient(90deg, #1a2332 0%, #243447 50%, #1a2332 100%);
          background-size: 200% 100%;
          animation: shimmer 1.8s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }

        /* Media queries pour responsive */
        @media (max-width: 768px) {
          .btn-primary, .btn-ghost {
            padding: 10px 20px;
            font-size: 13px;
          }
          .btn-primary svg, .btn-ghost svg {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>

      <section
        style={{ 
          position: "relative", 
          height: "100vh", 
          overflow: "hidden", 
          fontFamily: "'DM Sans', system-ui, sans-serif" 
        }}
        aria-label="Slider principal"
      >

        {/* ── Loading ── */}
        {loading && (
          <div className="skeleton-shimmer" style={{ position: "absolute", inset: 0, zIndex: 50 }}>
            <div style={{ 
              position:"absolute", inset:0, display:"flex", 
              alignItems:"center", justifyContent:"center", 
              flexDirection:"column", gap:20 
            }}>
              <div style={{ 
                width: 52, height: 52, 
                border: "3px solid rgba(43,150,168,0.3)", 
                borderTop: "3px solid #2B96A8", 
                borderRadius: "50%", 
                animation: "spin .9s linear infinite" 
              }}/>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, fontWeight:500 }}>
                Chargement des excursions…
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
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.65)" }}/>
            <div style={{ position:"absolute", top:"50%", left: "5%", right: "5%", transform:"translateY(-50%)", maxWidth: 650 }}>
              <h1 style={{ 
                fontFamily:"'Playfair Display',serif", 
                fontSize:"clamp(40px,5vw,68px)", 
                fontWeight:900, 
                color:"white", 
                marginBottom:24,
                lineHeight: 1.1,
                letterSpacing: "-1.5px"
              }}>
                Découvrez la Tunisie
              </h1>
              <Link href={ROUTES.excursions} className="btn-primary" style={{ display: "inline-flex" }}>
                <Map size={18}/> Voir les excursions
              </Link>
            </div>
          </div>
        )}

        {/* ── Slides ── */}
        {!loading && slide && (
          <>
            {/* Background avec overlay amélioré */}
            {slide.type === "video" && slide.videoUrl ? (
              <VideoBackground url={slide.videoUrl} muted={muted}/>
            ) : (
              <div
                className="slide-bg"
                style={{
                  backgroundImage: `url(${slide.imageUrl})`,
                  opacity: fading ? 0 : 1,
                  transform: fading ? "scale(1.04)" : "scale(1)",
                }}
              />
            )}

            {/* Overlays dégradés plus sophistiqués */}
            <div style={{ 
              position:"absolute", 
              background: "linear-gradient(100deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.45) 45%, rgba(0,0,0,.15) 100%)" 
            }}/>
            <div style={{ 
              position:"absolute",inset:0, 
              background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 60%)" 
            }}/>

            {/* PAS DE BOUTON PLAY POUR LES VIDÉOS - SUPPRIMÉ */}
            
            {/* Mute button - uniquement pour les vidéos non-YouTube */}
            {slide.type === "video" && slide.videoUrl && !isYouTube(slide.videoUrl) && (
              <button className="mute-btn" onClick={() => setMuted(m => !m)}>
                {muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                {muted ? "Son désactivé" : "Son activé"}
              </button>
            )}

            {/* ─── Hero content amélioré avec meilleurs espacements ─── */}
            <div
              key={current}
              style={{
                position: "absolute",
                top: "50%",
                left: "max(5%, 48px)",
                transform: "translateY(-50%)",
                maxWidth: "min(620px, 85%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                zIndex: 15,
              }}
            >
              {/* Badge ville - au-dessus du titre */}
              {slide.subtitle && (
                <div className="hero-animate-1" style={{
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 8,
                  padding: "6px 16px", 
                  borderRadius: 40,
                  background: `${slide.color}20`,
                  border: `1px solid ${slide.color}60`,
                  backdropFilter: "blur(12px)",
                  marginBottom: 24,
                }}>
                  <MapPin size={14} color="white"/>
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: "white", 
                    letterSpacing: 1.5, 
                    textTransform: "uppercase" 
                  }}>
                    {slide.subtitle}
                  </span>
                </div>
              )}

              {/* Titre principal - bien clair */}
              <h1 className="hero-animate-2" style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 4.5vw, 62px)",
                fontWeight: 900,
                color: "white",
                lineHeight: 1.08,
                letterSpacing: "-2px",
                marginBottom: 20,
                textShadow: "0 2px 30px rgba(0,0,0,.3)",
                maxWidth: "100%",
              }}>
                {slide.title}
              </h1>

              {/* Sous-titre / Catégories */}
              <div className="hero-animate-3" style={{ marginBottom: 32 }}>
                {slide.categories?.length > 0 ? (
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: 12,
                    alignItems: "center"
                  }}>
                    {slide.categories.slice(0, 3).map((cat, idx) => (
                      <span key={idx} style={{ 
                        fontSize: 14, 
                        color: "rgba(255,255,255,.85)", 
                        fontWeight: 500,
                        letterSpacing: 0.3,
                      }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ 
                    fontSize: 16, 
                    color: "rgba(255,255,255,.85)", 
                    lineHeight: 1.5,
                    margin: 0,
                    fontWeight: 500,
                  }}>
                    Découvrez cette excursion exceptionnelle en Tunisie
                  </p>
                )}
              </div>

              {/* Boutons avec meilleur espacement */}
              <div className="hero-animate-4" style={{ 
                display: "flex", 
                gap: 16, 
                flexWrap: "wrap",
                alignItems: "center",
              }}>
                <a href="#chemins" className="btn-primary">
                  <Sparkles size={16}/> Planifier mon voyage
                </a>
                {slide.type === "excursion" && slide.excursionId
                  ? <Link href={ROUTES.excursion(slide.excursionId)} className="btn-ghost">
                      <Map size={16}/> Voir cette excursion
                    </Link>
                  : <Link href={ROUTES.excursions} className="btn-ghost">
                      <Map size={16}/> Voir les excursions
                    </Link>
                }
              </div>
            </div>

            {/* ─── Dots de navigation ─── */}
            <div style={{ 
              position:"absolute", 
              bottom: 48, 
              left: "max(5%, 48px)", 
              display:"flex", 
              gap: 12, 
              alignItems:"center",
              zIndex: 15,
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
                      width: 42, 
                      height: 6, 
                      borderRadius: 4, 
                      background: slide.color, 
                      overflow: "hidden" 
                    }}>
                      <div style={{ 
                        height:"100%", 
                        width:`${progress}%`, 
                        background:"rgba(255,255,255,.7)", 
                        transition:"width .06s linear" 
                      }}/>
                    </div>
                  ) : (
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: "50%", 
                      background: "rgba(255,255,255,.4)",
                      transition: "all 0.2s",
                    }}/>
                  )}
                </button>
              ))}
            </div>

            {/* ─── Compteur de slides ─── */}
            <div style={{ 
              position:"absolute", 
              bottom: 52, 
              right: "max(5%, 48px)", 
              fontSize: 13, 
              color: "rgba(255,255,255,.5)", 
              fontWeight: 600, 
              letterSpacing: 2,
              fontFamily: "'DM Sans', monospace",
              zIndex: 15,
            }}>
              {String(current + 1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}
            </div>

            {/* ─── Indicateur de scroll ─── */}
            <div style={{ 
              position:"absolute", 
              bottom: 32, 
              left:"50%", 
              transform: "translateX(-50%)",
              animation:"bounce 2s infinite",
              opacity: 0.6,
              zIndex: 15,
            }}>
              <ChevronDown size={24} color="white"/>
            </div>
          </>
        )}
      </section>
    </>
  );
}