import Link from "next/link";
import { MapPin, ChevronDown, Sparkles, Map } from "lucide-react";
import { ROUTES } from "@/app/lib/routes";
import { SlideExcursion, FALLBACK_IMG, formatCategories } from "@/lib/homeUtils";

interface HeroSliderProps {
  slides:        SlideExcursion[];
  slidesLoading: boolean;
  current:       number;
  fading:        boolean;
  progress:      number;
  goTo:          (idx: number) => void;
}

export default function HeroSlider({
  slides, slidesLoading, current, fading, progress, goTo,
}: HeroSliderProps) {
  const slide = slides[current] ?? {
    url: FALLBACK_IMG, city: "", region: "", categories: [], color: "#2B96A8", id: "",
  };

  return (
    <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>

      {/* Loading skeleton */}
      {slidesLoading && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg,#0D1117 0%,#1a2332 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 48, height: 48,
              border: "3px solid rgba(43,150,168,0.3)", borderTop: "3px solid #2B96A8",
              borderRadius: "50%", animation: "spin 0.9s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 500 }}>
              Chargement des excursions…
            </p>
          </div>
        </div>
      )}

      {/* Slide background */}
      <div
        className="slide-bg"
        style={{
          backgroundImage: `url(${slide.url})`,
          opacity: fading ? 0 : 1,
          transform: fading ? "scale(1.03)" : "scale(1)",
        }}
      />

      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.35) 55%,rgba(0,0,0,0.06) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)" }} />

      {/* Content */}
      <div
        key={current}
        className="hero-content"
        style={{ position: "absolute", top: "50%", left: 72, transform: "translateY(-54%)", maxWidth: 580 }}
      >
        {/* Region badge */}
        <div className="fu fu1" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 30,
          background: slide.color + "28", border: `1px solid ${slide.color}55`,
          backdropFilter: "blur(10px)", marginBottom: 20,
        }}>
          <MapPin size={13} color="white" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: 1.2, textTransform: "uppercase" }}>
            {slide.region}
          </span>
        </div>

        {/* Title */}
        <h1 className="fu fu2" style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "clamp(42px,5.5vw,72px)",
          fontWeight: 900, color: "white",
          lineHeight: 1.05, letterSpacing: "-2px",
          marginBottom: 18, textShadow: "0 2px 28px rgba(0,0,0,0.25)",
        }}>
          {slide.city}
        </h1>

        {/* Categories */}
        <div className="categories-container">
          {slide.categories?.length > 0 ? (
            <div style={{ marginBottom: 40 }}>
              {formatCategories(slide.categories)}
            </div>
          ) : (
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.82)", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              Découvrez cette excursion exceptionnelle en Tunisie
            </p>
          )}
        </div>

        {/* CTA buttons */}
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

      {/* Dots / progress */}
      <div style={{ position: "absolute", bottom: 44, left: 72, display: "flex", gap: 10, alignItems: "center" }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            {i === current ? (
              <div style={{ width: 38, height: 6, borderRadius: 3, background: slide.color, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${progress}%`,
                  background: "rgba(255,255,255,0.6)", transition: "width 0.06s linear",
                }} />
              </div>
            ) : (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div style={{
        position: "absolute", bottom: 48, right: 72,
        fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 1.5,
      }}>
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      {/* Scroll indicator */}
      <div style={{ position: "absolute", bottom: 32, left: "50%", animation: "bounce 2s infinite" }}>
        <ChevronDown size={22} color="rgba(255,255,255,0.38)" />
      </div>
    </section>
  );
}