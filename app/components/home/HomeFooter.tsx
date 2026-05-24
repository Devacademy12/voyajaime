"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogIn, MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import { ROUTES } from "@/app/lib/routes";
import { Logo } from "@/lib/homeUtils";

interface HomeFooterProps {
  user:     { email?: string; id?: string } | null | undefined;
  openAuth?: (mode: "login" | "register" | "prestataire") => void;
}

export default function HomeFooter({ user, openAuth }: HomeFooterProps) {
  const router = useRouter();
  const handleOpenAuth = (mode: "login" | "register" | "prestataire") => {
    if (openAuth) return openAuth(mode);
    const url = mode ? `/auth?mode=${mode}` : "/auth";
    router.push(url);
  };
  const isLoggedIn = Boolean(user?.id);

  return (
    <footer style={{ background: "#0D1117", color: "white", fontFamily: "inherit" }}>

      {/* ── Main grid ── */}
      <div style={{
        padding: "60px 72px 40px",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 40,
      }}>

        {/* Col 1 — Brand avec logo au-dessus */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Logo />
          </div>
          <p style={{ 
            fontSize: 13, 
            color: "#6B7280", 
            lineHeight: 1.7, 
            maxWidth: 280, 
            margin: 0,
            marginTop: 0 
          }}>
            La plateforme de référence pour découvrir la Tunisie autrement. Des excursions authentiques, des guides passionnés.
          </p>
        </div>

        {/* Col 2 — Explorer */}
        <FooterCol title="Explorer" links={[
          { label: "Toutes les excursions", href: ROUTES.excursions },
        ]} />

        {/* Col 3 — Informations */}
        <FooterCol title="Informations" links={[
          { label: "À propos", href: "/about" },
          { label: "Comment ça marche", href: "#chemins" },
          { label: "Devenir prestataire", href: "#", onClick: () => handleOpenAuth("prestataire") },
          { label: "Conditions générales", href: "/cgv" },
          { label: "Politique de confidentialité", href: "/confidentialite" },
        ]} />

        {/* Col 4 — Contact */}
        <div>
          <ColTitle>Contact</ColTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: <MapPin size={14} />, text: "Tunis, Tunisie" },
              { icon: <Phone size={14} />, text: "+216 XX XXX XXX" },
              { icon: <Mail size={14} />, text: "contact@voyajaime.tn" },
            ].map(c => (
              <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 10, color: "#9CA3AF", fontSize: 13 }}>
                <span style={{ color: "#2B96A8", flexShrink: 0 }}>{c.icon}</span>
                {c.text}
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              {isLoggedIn ? (
                <Link
                  href={ROUTES.touriste.dashboard}
                  style={{
                    padding: "10px 20px", background: "#2B96A8", color: "white",
                    borderRadius: 30, textDecoration: "none", fontSize: 13, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}
                >
                  <User size={13} /> Mon espace
                </Link>
              ) : (
                <button
                  onClick={() => handleOpenAuth("login")}
                  style={{
                    padding: "10px 20px", background: "#2B96A8", color: "white",
                    borderRadius: 30, border: "none", fontSize: 13, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <LogIn size={13} /> Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        borderTop: "1px solid #1C2333",
        padding: "20px 72px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <p style={{ fontSize: 12, color: "#4B5563", margin: 0 }}>
          © 2026 VoyajAime. Tous droits réservés.
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "CGV", href: "/cgv" },
            { label: "Confidentialité", href: "/confidentialite" },
            { label: "Cookies", href: "/cookies" },
          ].map(l => (
            <Link
              key={l.label}
              href={l.href}
              style={{ color: "#4B5563", fontSize: 12, textDecoration: "none", transition: "color .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#4B5563"; }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
      color: "#4B5563", textTransform: "uppercase",
      marginBottom: 20, marginTop: 0,
    }}>
      {children}
    </p>
  );
}

function FooterCol({ title, links }: {
  title: string;
  links: { label: string; href: string; onClick?: () => void }[];
}) {
  return (
    <div>
      <ColTitle>{title}</ColTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map(l =>
          l.onClick ? (
            <button
              key={l.label}
              onClick={l.onClick}
              style={{
                color: "#9CA3AF", fontSize: 13, fontWeight: 500,
                background: "none", border: "none", cursor: "pointer",
                padding: 0, textAlign: "left", fontFamily: "inherit",
                transition: "color .15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#2B96A8"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
            >
              {l.label}
            </button>
          ) : (
            <Link
              key={l.label}
              href={l.href}
              style={{ color: "#9CA3AF", fontSize: 13, textDecoration: "none", fontWeight: 500, transition: "color .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#2B96A8"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#9CA3AF"; }}
            >
              {l.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}