import Link from "next/link";
import { Compass, ClipboardList, Mountain, Map, Search, Stars, ArrowRight, Building2 } from "lucide-react";
import { ROUTES } from "@/app/lib/routes";
import { SlideExcursion, FALLBACK_IMG } from "@/lib/homeUtils";

interface PathsSectionProps {
  slides:    SlideExcursion[];
  user:      { email?: string; id?: string } | null;
  openAuth:  (mode: "login" | "register" | "prestataire", redirect?: string) => void;
}

export default function PathsSection({ slides, user, openAuth }: PathsSectionProps) {
  const bgImg = slides[2]?.url || slides[0]?.url || FALLBACK_IMG;

  return (
    <section id="chemins" style={{ position: "relative", overflow: "hidden" }}>
      {/* Blurred background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "blur(3px) brightness(0.35)", transform: "scale(1.05)",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(4,12,22,0.65)" }} />

      <div
        style={{ position: "relative", zIndex: 1, padding: "96px 72px 108px", maxWidth: 1200, margin: "0 auto" }}
        className="section-pad"
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <h2 className="section-title section-title-light">
            Votre voyage en Tunisie,<br />à votre façon
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.58)", marginTop: 18, maxWidth: 520, margin: "18px auto 0", lineHeight: 1.7 }}>
            Trois approches pour découvrir la Tunisie — choisissez celle qui vous correspond.
          </p>
        </div>

        {/* 3 path cards */}
        <div className="paths-container" style={{ display: "flex", gap: 20 }}>

          {/* Mode Assisté */}
          <div className="path-card" style={{ background: "rgba(43,150,168,0.16)", borderColor: "rgba(43,150,168,0.4)" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(43,150,168,0.3)", border: "1px solid rgba(43,150,168,0.5)",
              alignSelf: "flex-start",
            }}>
              <Stars size={11} color="#A5F3FC" />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#A5F3FC", letterSpacing: 1 }}>ASSISTANT · SUR-MESURE</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
              <Compass size={40} color="rgba(255,255,255,0.9)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, letterSpacing: "-0.5px" }}>
                  Mode Assisté
                </h3>
                <p style={{ fontSize: 13, color: "#A5F3FC", fontWeight: 600 }}>Un itinéraire guidé par vos envies</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
              Répondez à quelques questions sur vos préférences. Nous préparons pour vous un itinéraire optimisé et local.
            </p>
            <Link
              href={ROUTES.ModeAssiste}
              className="path-card-btn"
              style={{ background: "#2B96A8", color: "white", boxShadow: "0 6px 22px rgba(43,150,168,0.42)", border: "2px solid #2B96A8" }}
            >
              Je veux qu&apos;on me propose <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mode Libre */}
          <div className="path-card" style={{ background: "rgba(255,255,255,0.09)", borderColor: "rgba(255,255,255,0.22)" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              alignSelf: "flex-start",
            }}>
              <Map size={11} color="rgba(255,255,255,0.65)" />
              <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.65)", letterSpacing: 1 }}>BUILDER · FLEXIBLE</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
              <ClipboardList size={40} color="rgba(255,255,255,0.88)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, letterSpacing: "-0.5px" }}>
                  Mode Libre
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Chaque détail, à votre main</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.68)", lineHeight: 1.7 }}>
              Construisez votre voyage de A à Z — choisissez chaque excursion, chaque jour, dans l&apos;ordre qui vous plaît.
            </p>
            <Link
              href="/modeLibre?mode=libre"
              className="path-card-btn"
              style={{ background: "rgba(255,255,255,0.15)", border: "2px solid white", color: "white" }}
            >
              Je crée mon itinéraire <ArrowRight size={15} />
            </Link>
          </div>

          {/* Juste Explorer */}
          <div className="path-card" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.14)" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)",
              alignSelf: "flex-start",
            }}>
              <Search size={11} color="rgba(255,255,255,0.52)" />
              <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.52)", letterSpacing: 1 }}>SANS COMPTE</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
              <Mountain size={40} color="rgba(255,255,255,0.88)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: "white", marginBottom: 4, letterSpacing: "-0.5px" }}>
                  Juste Explorer
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", fontWeight: 600 }}>Parcourez librement le catalogue</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.62)", lineHeight: 1.7 }}>
              Pas besoin de compte pour regarder. Parcourez toutes les excursions disponibles en Tunisie.
            </p>
            <Link
              href={ROUTES.excursions}
              className="path-card-btn"
              style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.6)", color: "white" }}
            >
              Découvrir le catalogue <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Prestataire banner */}
        <button
          className="presta-banner"
          onClick={() => openAuth("prestataire")}
          style={{ width: "100%", background: "none", border: "1px solid rgba(255,255,255,0.14)", fontFamily: "inherit", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Building2 size={22} color="rgba(255,255,255,0.7)" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 3 }}>Vous êtes prestataire ?</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", fontWeight: 500 }}>
                Listez vos excursions sur VoyajAime et touchez des milliers de voyageurs.
              </p>
            </div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)",
            color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Inscrivez votre activité <ArrowRight size={14} />
          </div>
        </button>
      </div>
    </section>
  );
}