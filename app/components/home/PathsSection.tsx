import Link from "next/link";
import { Compass, ClipboardList, Mountain, Map, Search, Stars, ArrowRight, Building2 } from "lucide-react";
import { ROUTES } from "@/app/lib/routes";
import { SlideExcursion, FALLBACK_IMG } from "@/lib/homeUtils";

interface PathsSectionProps {
  slides:    SlideExcursion[];
  user:      { email?: string; id?: string } | null;
  openAuth:  (mode: "login" | "register" | "prestataire", redirect?: string) => void;
}

const PATHS_CSS = `
  .paths-section {
    background: linear-gradient(160deg, #EEF6F8 0%, #F7F9FC 50%, #EEF3FB 100%);
    position: relative;
    overflow: hidden;
  }
  .paths-section::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(11,122,138,0.07) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .paths-section::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(5,51,102,0.05) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  .path-card-light {
    flex: 1;
    padding: 28px 24px;
    border-radius: 20px;
    background: white;
    border: 1.5px solid #E5E7EB;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(.16,1,.3,1);
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    overflow: hidden;
  }
  .path-card-light::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent-grad, linear-gradient(90deg, #0B7A8A, #2B96A8));
    opacity: 0;
    transition: opacity 0.3s;
  }
  .path-card-light:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.09);
    border-color: rgba(11,122,138,0.25);
  }
  .path-card-light:hover::before {
    opacity: 1;
  }

  .path-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 20px;
    font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
    text-transform: uppercase; align-self: flex-start;
  }

  .path-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 10px;
    font-size: 13px; font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #0B7A8A; color: white;
    text-decoration: none; border: 2px solid #0B7A8A;
    cursor: pointer; transition: all 0.2s; margin-top: auto;
    box-shadow: 0 4px 14px rgba(11,122,138,0.25);
  }
  .path-btn-primary:hover {
    background: transparent; color: #0B7A8A;
    transform: translateY(-1px);
  }

  .path-btn-outline {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 10px;
    font-size: 13px; font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: white; color: #374151;
    text-decoration: none; border: 1.5px solid #D1D5DB;
    cursor: pointer; transition: all 0.2s; margin-top: auto;
  }
  .path-btn-outline:hover {
    border-color: #0B7A8A; color: #0B7A8A; background: #E6F4F6;
    transform: translateY(-1px);
  }

  .presta-banner-light {
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    padding: 20px 26px; border-radius: 16px;
    background: white; border: 1.5px solid #E5E7EB;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    margin-top: 32px; cursor: pointer; transition: all 0.2s;
    width: 100%;
  }
  .presta-banner-light:hover {
    border-color: rgba(5,51,102,0.2);
    box-shadow: 0 8px 24px rgba(5,51,102,0.06);
  }

 @media(max-width:900px){
  .paths-container-light { flex-direction: column !important; }
}

@media(max-width:640px){
  .presta-banner-light {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }
  .presta-banner-light > div:first-child {
    width: 100%;
  }
  .presta-banner-light > div:last-child {
    align-self: stretch;
    justify-content: center;
  }
}
`;

export default function PathsSection({ slides, user, openAuth }: PathsSectionProps) {
  return (
    <section className="paths-section" id="chemins">
      <style>{PATHS_CSS}</style>

      <div
        style={{ position: "relative", zIndex: 1, padding: "88px 64px 100px", maxWidth: 1200, margin: "0 auto" }}
        className="section-pad"
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p className="section-eyebrow">Comment voyager</p>
          <h2 className="section-title">
            Votre voyage en Tunisie,<br />à votre façon
          </h2>
          <p style={{ fontSize: 16, color: "#6B7280", marginTop: 16, maxWidth: 500, margin: "16px auto 0", lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Trois approches pour découvrir la Tunisie — choisissez celle qui vous correspond.
          </p>
        </div>

        {/* 3 path cards */}
        <div className="paths-container-light" style={{ display: "flex", gap: 20 }}>

          {/* Mode Assisté */}
          <div
            className="path-card-light"
            style={{ "--accent-grad": "linear-gradient(90deg, #0B7A8A, #2B96A8)" } as React.CSSProperties}
          >
            <div className="path-badge" style={{ background: "#E6F4F6", border: "1px solid rgba(11,122,138,0.2)" }}>
              <Stars size={10} color="#0B7A8A" />
              <span style={{ color: "#0B7A8A" }}>ASSISTANT · SUR-MESURE</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "#E6F4F6",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Compass size={26} color="#0B7A8A" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#053366", marginBottom: 2, letterSpacing: "-0.3px" }}>
                  Mode Assisté
                </h3>
                <p style={{ fontSize: 12, color: "#0B7A8A", fontWeight: 600 }}>Un itinéraire guidé par vos envies</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
              Répondez à quelques questions sur vos préférences. Nous préparons pour vous un itinéraire optimisé et local.
            </p>
            <Link href={ROUTES.ModeAssiste} className="path-btn-primary">
              Je veux qu&apos;on me propose <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mode Libre */}
          <div
            className="path-card-light"
            style={{ "--accent-grad": "linear-gradient(90deg, #053366, #1a5ca3)" } as React.CSSProperties}
          >
            <div className="path-badge" style={{ background: "#EEF3FB", border: "1px solid rgba(5,51,102,0.15)" }}>
              <Map size={10} color="#053366" />
              <span style={{ color: "#053366" }}>BUILDER · FLEXIBLE</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "#EEF3FB",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ClipboardList size={26} color="#053366" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#053366", marginBottom: 2, letterSpacing: "-0.3px" }}>
                  Mode Libre
                </h3>
                <p style={{ fontSize: 12, color: "#4A7DB5", fontWeight: 600 }}>Chaque détail, à votre main</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
              Construisez votre voyage de A à Z — choisissez chaque excursion, chaque jour, dans l&apos;ordre qui vous plaît.
            </p>
            <Link
              href="/modeLibre?mode=libre"
              className="path-btn-outline"
              style={{ borderColor: "#053366", color: "#053366" }}
            >
              Je crée mon itinéraire <ArrowRight size={14} />
            </Link>
          </div>

          {/* Juste Explorer */}
          <div className="path-card-light" style={{ background: "#FAFAF9" }}>
            <div className="path-badge" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
              <Search size={10} color="#6B7280" />
              <span style={{ color: "#6B7280" }}>SANS COMPTE</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Mountain size={26} color="#6B7280" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#374151", marginBottom: 2, letterSpacing: "-0.3px" }}>
                  Juste Explorer
                </h3>
                <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Parcourez librement le catalogue</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
              Pas besoin de compte pour regarder. Parcourez toutes les excursions disponibles en Tunisie.
            </p>
            <Link href={ROUTES.excursions} className="path-btn-outline">
              Découvrir le catalogue <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Prestataire banner */}
        <button
          className="presta-banner-light"
          onClick={() => openAuth("prestataire")}
          style={{ fontFamily: "inherit", textAlign: "left", background: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "#EEF3FB",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Building2 size={20} color="#053366" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", marginBottom: 2 }}>Vous êtes prestataire ?</p>
              <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
                Listez vos excursions sur VoyajAime et touchez des milliers de voyageurs.
              </p>
            </div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 10,
            background: "#EEF3FB", border: "1px solid rgba(5,51,102,0.15)",
            color: "#053366", fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Inscrivez votre activité <ArrowRight size={13} />
          </div>
        </button>
      </div>
    </section>
  );
}
