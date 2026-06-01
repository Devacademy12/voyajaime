import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { Metadata } from "next";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";
import ContactForm from "./ContactForm";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

/* ══ SEO ══ */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contactez-nous | VoyajAime",
    description: "Une question sur nos excursions en Tunisie ? Contactez l'équipe VoyajAime — réponse sous 24h.",
    alternates: { canonical: "/contact" },
  };
}

interface ContactContent { key: string; value: string | null; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Open+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --brand-dark:    #053366;
    --brand-primary: #02AFCF;
    --brand-blue:    #259FFC;
    --brand-lavender:#DCE5FF;
    --teal:          #2b96a8;
    --sand:          #f5f3f0;
    --white:         #ffffff;
  }

  body {
    font-family: 'Open Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ════════════════════════════════
     PAGE WRAPPER
     Background image is decorative only —
     the real content sits on opaque panels
  ════════════════════════════════ */
  .contact-page {
    min-height: 100vh;
    background: var(--brand-dark);
    position: relative;
    overflow: hidden;
  }

  /* Muted background image via pseudo-element */
  .contact-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: var(--bg-url);
    background-size: cover;
    background-position: center;
    opacity: 0.12;          /* very subtle — just texture */
    pointer-events: none;
    z-index: 0;
  }

  /* Dark gradient overlay bottom-to-top for depth */
  .contact-page::after {
    content: '';
    position: fixed;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(5,51,102,0.55) 0%,
      rgba(5,51,102,0.30) 50%,
      rgba(5,51,102,0.65) 100%
    );
    pointer-events: none;
    z-index: 0;
  }

  /* ════════════════════════════════
     HERO STRIP — narrow teal accent bar
  ════════════════════════════════ */
  .contact-hero {
    position: relative;
    z-index: 1;
    background: var(--brand-dark);
    border-bottom: 3px solid var(--brand-primary);
    padding: 48px 48px 40px;
    text-align: center;
  }
  .contact-hero-eyebrow {
    font-family: 'Montserrat', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--brand-primary);
    margin-bottom: 12px;
    display: block;
  }
  .contact-hero-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(26px, 3.5vw, 44px);
    font-weight: 900;
    color: var(--white);
    letter-spacing: -1px;
    line-height: 1.1;
  }
  .contact-hero-title span { color: var(--brand-primary); }
  .contact-hero-sub {
    margin-top: 12px;
    font-size: 15px;
    font-weight: 400;
    color: rgba(255,255,255,0.65);
    line-height: 1.7;
  }

  /* ════════════════════════════════
     MAIN GRID
  ════════════════════════════════ */
  .contact-section {
    position: relative;
    z-index: 1;
    max-width: 1160px;
    margin: 0 auto;
    padding: 64px 40px 96px;
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 32px;
    align-items: start;
  }

  /* ════════════════════════════════
     LEFT PANEL — solid navy card
  ════════════════════════════════ */
  .info-panel {
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  /* Colored header stripe */
  .info-panel-header {
    background: var(--brand-dark);
    padding: 28px 28px 24px;
    border-bottom: 3px solid var(--brand-primary);
  }
  .info-panel-header-label {
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--brand-primary);
    margin-bottom: 8px;
    display: block;
  }
  .info-panel-header-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--white);
    line-height: 1.2;
    letter-spacing: -0.3px;
  }

  /* Info items */
  .info-items { padding: 8px 0; }

  .info-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 28px;
    border-bottom: 1px solid #f0f4f8;
    transition: background 0.15s;
  }
  .info-item:last-child { border-bottom: none; }
  .info-item:hover { background: #f8fafc; }

  .info-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: var(--brand-lavender);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--brand-dark);
  }

  .info-text-label {
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 5px;
  }
  .info-text-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--brand-dark);
    text-decoration: none;
    line-height: 1.4;
    transition: color 0.15s;
    display: block;
  }
  a.info-text-value:hover { color: var(--brand-primary); }

  /* Response-time badge at bottom of panel */
  .info-badge {
    margin: 0 28px 24px;
    padding: 14px 18px;
    background: #f0f9ff;
    border: 1px solid rgba(2,175,207,0.25);
    border-left: 3px solid var(--brand-primary);
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .info-badge-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
  }
  .info-badge-text {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--brand-dark);
    line-height: 1.4;
  }
  .info-badge-text span {
    display: block;
    font-size: 11px;
    font-weight: 400;
    color: #64748b;
    margin-top: 1px;
  }

  /* ════════════════════════════════
     RIGHT PANEL — form card
  ════════════════════════════════ */
  .form-panel {
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  .form-panel-header {
    background: var(--brand-dark);
    padding: 28px 36px 24px;
    border-bottom: 3px solid var(--brand-primary);
  }
  .form-panel-eyebrow {
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--brand-primary);
    margin-bottom: 8px;
    display: block;
  }
  .form-panel-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--white);
    letter-spacing: -0.4px;
  }

  .form-panel-body {
    padding: 32px 36px 36px;
    background: var(--white);
  }

  /* ════════════════════════════════
     RESPONSIVE
  ════════════════════════════════ */
  @media (max-width: 900px) {
    .contact-section {
      grid-template-columns: 1fr;
      gap: 24px;
      padding: 48px 20px 72px;
    }
    .contact-hero { padding: 40px 20px 32px; }
  }
  @media (max-width: 480px) {
    .form-panel-body { padding: 24px 20px 28px; }
    .info-item { padding: 16px 20px; }
    .info-panel-header, .form-panel-header { padding: 22px 20px 18px; }
    .info-badge { margin: 0 20px 20px; }
  }
`;

export default async function ContactPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.from("contact_content").select("key, value");

  const c = Object.fromEntries(
    (rows as ContactContent[] | null ?? []).map(r => [r.key, r.value ?? ""])
  );

  const email      = c.email       || "contact@voyajaime.tn";
  const phone      = c.phone       || "+216 XX XXX XXX";
  const address    = c.address     || "Tunis, Tunisie";
  const hours      = c.hours       || "Lun–Ven : 9h–18h";
  const ctaLabel   = c.cta_label   || "Envoyer le message";
  const successMsg = c.success_msg || "Message envoyé ! Nous vous répondrons sous 24h.";
  const bgImage    = c.bg_image    || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contactez VoyajAime",
    url: "https://voyajaime.tn/contact",
  };

  const INFO_ITEMS = [
    { icon: <Mail   size={20} strokeWidth={1.8} />, label: "Email",     value: email,   href: `mailto:${email}` },
    { icon: <Phone  size={20} strokeWidth={1.8} />, label: "Téléphone", value: phone,   href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: <MapPin size={20} strokeWidth={1.8} />, label: "Adresse",   value: address, href: undefined },
    { icon: <Clock  size={20} strokeWidth={1.8} />, label: "Horaires",  value: hours,   href: undefined },
  ];

  return (
    <>
      <style>{CSS}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TouristeNav />

      <div
        className="contact-page"
        style={bgImage ? ({ "--bg-url": `url(${bgImage})` } as React.CSSProperties) : undefined}
      >
        <div style={{ paddingTop: 64 }} />

        {/* ── Hero strip ── */}
        <div className="contact-hero">
          <span className="contact-hero-eyebrow">Contactez-nous</span>
          <h1 className="contact-hero-title">
            Nous sommes là <span>pour vous aider</span>
          </h1>
          <p className="contact-hero-sub">
            Une question, une réservation ? Notre équipe répond sous 24h.
          </p>
        </div>

        {/* ── Main grid ── */}
        <main className="contact-section">

          {/* ── Left: coordonnées ── */}
          <aside className="info-panel">
            <div className="info-panel-header">
              <span className="info-panel-header-label">Nos coordonnées</span>
              <p className="info-panel-header-title">Comment nous joindre</p>
            </div>

            <div className="info-items">
              {INFO_ITEMS.map((item, i) => (
                <div key={i} className="info-item">
                  <div className="info-icon-wrap">{item.icon}</div>
                  <div>
                    <p className="info-text-label">{item.label}</p>
                    {item.href
                      ? <a href={item.href} className="info-text-value">{item.value}</a>
                      : <span className="info-text-value">{item.value}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            <div className="info-badge">
              <span className="info-badge-dot" />
              <div className="info-badge-text">
                Équipe disponible
                <span>Réponse garantie sous 24h</span>
              </div>
            </div>
          </aside>

          {/* ── Right: form ── */}
          <div className="form-panel">
            <div className="form-panel-header">
              <span className="form-panel-eyebrow">Formulaire de contact</span>
              <p className="form-panel-title">Envoyez-nous un message</p>
            </div>
            <div className="form-panel-body">
              <ContactForm ctaLabel={ctaLabel} successMsg={successMsg} />
            </div>
          </div>

        </main>

        <HomeFooter user={null} />
      </div>
    </>
  );
}