"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogIn, MapPin, Phone, Mail } from "tabler-icons-react";
import { ROUTES } from "@/app/lib/routes";
import { Logo } from "@/lib/homeUtils";

interface HomeFooterProps {
  user:     { email?: string; id?: string } | null | undefined;
  openAuth?: (mode: "login" | "register" | "prestataire") => void;
}

const FOOTER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .footer-v2 {
    background: #0F172A;
    color: white;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .footer-main-v2 {
    padding: 56px 64px 40px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px;
    max-width: 1280px;
    margin: 0 auto;
  }
  .footer-divider-v2 {
    height: 1px;
    background: #1E293B;
    margin: 0 64px;
    max-width: calc(1280px - 128px);
    margin-left: auto; margin-right: auto;
  }
  .footer-bottom-v2 {
    padding: 18px 64px;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 12px;
    max-width: 1280px; margin: 0 auto;
  }
  .footer-col-title-v2 {
    font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
    color: #475569; text-transform: uppercase;
    margin-bottom: 18px; margin-top: 0;
  }
  .footer-link-v2 {
    color: #64748B; font-size: 13px; text-decoration: none;
    font-weight: 500; transition: color 0.15s; display: block;
  }
  .footer-link-v2:hover { color: #2B96A8; }
  .footer-btn-v2 {
    color: #64748B; font-size: 13px; font-weight: 500;
    background: none; border: none; cursor: pointer;
    padding: 0; text-align: left; font-family: inherit;
    transition: color 0.15s;
  }
  .footer-btn-v2:hover { color: #2B96A8; }
  .footer-brand-desc {
    font-size: 13px; color: #475569; line-height: 1.7;
    max-width: 260px; margin: 0;
  }
  .footer-accent-btn {
    padding: 9px 18px; background: #0B7A8A; color: white;
    border-radius: 30px; text-decoration: none; font-size: 13px;
    font-weight: 700; display: inline-flex; align-items: center;
    gap: 6px; transition: all 0.2s; border: none; cursor: pointer;
    font-family: inherit;
  }
  .footer-accent-btn:hover { background: #095f6c; transform: translateY(-1px); }

  @media(max-width: 900px) {
    .footer-main-v2 { grid-template-columns: 1fr 1fr; padding: 40px 24px 28px; }
    .footer-divider-v2 { margin: 0 24px; }
    .footer-bottom-v2 { padding: 16px 24px; }
  }
  @media(max-width: 600px) {
    .footer-main-v2 { grid-template-columns: 1fr; }
  }
`;

export default function HomeFooter({ user, openAuth }: HomeFooterProps) {
  const router = useRouter();
  const handleOpenAuth = (mode: "login" | "register" | "prestataire") => {
    if (openAuth) return openAuth(mode);
    router.push(mode ? `/auth?mode=${mode}` : "/auth");
  };
  const isLoggedIn = Boolean(user?.id);

  return (
    <footer className="footer-v2">
      <style>{FOOTER_CSS}</style>

      {/* Main grid */}
      <div className="footer-main-v2">

        {/* Col 1 — Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Logo />
          </div>
          <p className="footer-brand-desc">
            La plateforme de référence pour découvrir la Tunisie autrement. Des excursions authentiques, des guides passionnés.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {isLoggedIn ? (
              <Link href={ROUTES.touriste.dashboard} className="footer-accent-btn">
                <User size={13} /> Mon espace
              </Link>
            ) : (
              <button onClick={() => handleOpenAuth("login")} className="footer-accent-btn">
                <LogIn size={13} /> Connexion
              </button>
            )}
          </div>
        </div>

        {/* Col 2 — Explorer */}
        <FooterCol title="Explorer" links={[
          { label: "Toutes les excursions", href: ROUTES.excursions },
        ]} onBtn={() => {}} />

        {/* Col 3 — Informations */}
        <div>
          <p className="footer-col-title-v2">Informations</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "À propos", href: "/about" },
              { label: "Comment ça marche", href: "#chemins" },
              { label: "Conditions générales", href: "/cgv" },
              { label: "Politique de confidentialité", href: "/confidentialite" },
            ].map(l => (
              <Link key={l.label} href={l.href} className="footer-link-v2">{l.label}</Link>
            ))}
            <button className="footer-btn-v2" onClick={() => handleOpenAuth("prestataire")}>
              Devenir prestataire
            </button>
          </div>
        </div>

        {/* Col 4 — Contact */}
        <div>
          <p className="footer-col-title-v2">Contact</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: <MapPin size={13} />, text: "Tunis, Tunisie" },
              { icon: <Phone size={13} />, text: "+216 XX XXX XXX" },
              { icon: <Mail size={13} />, text: "contact@voyajaime.tn" },
            ].map(c => (
              <div key={c.text} style={{ display: "flex", alignItems: "center", gap: 9, color: "#64748B", fontSize: 13 }}>
                <span style={{ color: "#2B96A8", flexShrink: 0 }}>{c.icon}</span>
                {c.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-divider-v2" />

      {/* Bottom bar */}
      <div className="footer-bottom-v2">
        <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
          © 2026 VoyajAime. Tous droits réservés.
        </p>
        <div style={{ display: "flex", gap: 18 }}>
          {[
            { label: "CGV", href: "/cgv" },
            { label: "Confidentialité", href: "/confidentialite" },
            { label: "Cookies", href: "/cookies" },
          ].map(l => (
            <Link key={l.label} href={l.href} className="footer-link-v2" style={{ fontSize: 12 }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, onBtn }: {
  title: string;
  links: { label: string; href: string }[];
  onBtn: () => void;
}) {
  return (
    <div>
      <p className="footer-col-title-v2">{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map(l => (
          <Link key={l.label} href={l.href} className="footer-link-v2">{l.label}</Link>
        ))}
      </div>
    </div>
  );
}
