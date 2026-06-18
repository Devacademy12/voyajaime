"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Map, Volume2, VolumeX, Star, Compass, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import styles from "./HeroSlider.module.css";

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

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1600&q=80";

const SLIDE_DURATION = 6000;
const FADE_DURATION  = 600;

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

  let imageUrl    = FALLBACK_IMG;
  let title       = raw.custom_title || "";
  let subtitle    = raw.custom_subtitle || "";
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

export default function HeroSlider() {
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
    <section className={styles.sliderSection} aria-label="Slider principal">

      {loading && (
        <div className={styles.skeletonShimmer} style={{ position: "absolute", inset: 0, zIndex: 50 }}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Chargement...</p>
          </div>
        </div>
      )}

      {!loading && !slides.length && (
        <div className={styles.fallbackContainer} style={{ backgroundImage: `url(${FALLBACK_IMG})` }}>
          <div className={styles.fallbackOverlay} />
          <div className={styles.fallbackContent}>
            <h1 className={styles.fallbackTitle}>Découvrez la Tunisie</h1>
            <p className={styles.fallbackSubtitle}>
              Des expériences uniques au cœur de la Méditerranée
            </p>
            <Link href={ROUTES.excursions} className={styles.btnPrimary}>
              <Compass size={18} /> Explorer maintenant
            </Link>
          </div>
        </div>
      )}

      {!loading && slide && (
        <>
          {slide.type === "video" && slide.videoUrl ? (
            <VideoBackground url={slide.videoUrl} muted={muted} />
          ) : (
            <div
              className={styles.slideBg}
              style={{
                backgroundImage: `url(${slide.imageUrl})`,
                opacity: fading ? 0 : 1,
                transform: fading ? "scale(1.05)" : "scale(1)",
              }}
            />
          )}

          <div className={styles.gradientOverlay} />
          <div className={styles.gradientTopOverlay} />
          <div className={styles.patternOverlay} />

          {slide.type === "video" && slide.videoUrl && !isYouTube(slide.videoUrl) && (
            <button className={styles.muteBtn} onClick={() => setMuted(m => !m)}>
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{muted ? "Activer le son" : "Couper le son"}</span>
            </button>
          )}

          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              {slide.subtitle && (
                <div className={styles.heroAnimate1} style={{
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
                  <MapPin size={14} style={{ color: slide.color }} />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "white",
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                  }}>
                    {slide.subtitle}
                  </span>
                </div>
              )}

              <h1 className={styles.heroAnimate2} style={{
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

              <div className={styles.heroAnimate3} style={{ marginBottom: 0 }}>
                {slide.categories?.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                    {slide.categories.slice(0, 3).map((cat, idx) => (
                      <div key={idx} className={styles.categoryBadge}>
                        <Star size={12} style={{ color: slide.color }} />
                        <span className={styles.categoryText}>{cat}</span>
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
                    maxWidth: "90%",
                  }}>
                    Vivez une expérience inoubliable au cœur de la Tunisie
                  </p>
                )}
              </div>
            </div>

            <div className={`${styles.heroAnimate4} ${styles.heroCtaGroup}`}>
              <a href="#chemins" className={styles.btnPrimary}>
                <Compass size={18} />
                <span>Planifier mon voyage</span>
              </a>
              {slide.type === "excursion" && slide.excursionId ? (
                <Link href={ROUTES.excursion(slide.excursionId)} className={styles.btnGhost} style={{ gap: 10 }}>
                  <Map size={18} />
                  <span>Découvrir l&apos;excursion</span>
                </Link>
              ) : (
                <Link href={ROUTES.excursions} className={styles.btnGhost} style={{ gap: 10 }}>
                  <ArrowRight size={18} />
                  <span>Explorer le catalogue</span>
                </Link>
              )}
            </div>
          </div>

          <div className={styles.navContainer}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={styles.dotBtn}
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  goTo(i);
                }}
                aria-label={`Slide ${i + 1}`}
              >
                {i === current ? (
                  <div className={styles.progressBar} style={{ background: `linear-gradient(90deg, ${slide.color}, ${slide.color}80)` }}>
                    <div className={styles.progressFill} style={{ width: `${progress}%`, background: "white" }} />
                  </div>
                ) : (
                  <div className={styles.dotInactive} />
                )}
              </button>
            ))}
          </div>

          <div className={styles.counter}>
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>

          <div
            className={styles.scrollIndicator}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
          >
            <ChevronDown size={28} color="white" strokeWidth={1.5} />
          </div>
        </>
      )}
    </section>
  );
}