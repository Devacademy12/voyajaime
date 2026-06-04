import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { Metadata } from "next";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";
import ContactForm from "./ContactForm";
import { Mail, Phone, MapPin, Clock, ArrowRight, Send, MessageCircle } from "lucide-react";
import Link from "next/link";

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
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #0D1117; color: #fff; }

  /* ── Page wrapper ── */
  .contact-page {
    min-height: 100vh;
    background: #0D1117;
    position: relative;
    overflow: hidden;
  }

  /* Background overlay */
  .contact-page::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(4,12,22,0.75);
    z-index: 0;
  }

  /* Blurred background image */
  .contact-bg-blur {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(3px) brightness(0.35);
    transform: scale(1.05);
    z-index: 0;
  }

  /* Main content */
  .contact-content {
    position: relative;
    z-index: 2;
  }

  /* ── Main section ── */
  .contact-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 40px 100px;
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 80px;
    align-items: start;
  }

  /* ══ LEFT — coordonnées ══ */
  .info-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    background: rgba(43,150,168,0.3);
    border: 1px solid rgba(43,150,168,0.5);
    margin-bottom: 20px;
  }
  .info-badge span {
    font-size: 10px;
    font-weight: 800;
    color: #A5F3FC;
    letter-spacing: 1px;
  }
  .info-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 900;
    color: #fff;
    letter-spacing: -1.5px;
    line-height: 1.06;
    margin-bottom: 24px;
  }
  .info-description {
    font-size: 16px;
    color: rgba(255,255,255,0.55);
    line-height: 1.7;
    margin-bottom: 48px;
  }

  /* Info items */
  .info-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid rgba(255,255,255,.07);
    transition: background 0.15s;
  }
  .info-item:last-child { border-bottom: none; }
  .info-item:hover { background: rgba(255,255,255,0.02); padding-left: 8px; margin-left: -8px; border-radius: 12px; }

  .info-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: rgba(43,150,168,0.2);
    border: 1px solid rgba(43,150,168,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #A5F3FC;
  }

  .info-label {
    font-size: 11px;
    font-weight: 800;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 6px;
  }
  .info-value {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    text-decoration: none;
    transition: color .18s;
  }
  .info-value:hover { color: #A5F3FC; }

  /* Status badge */
  .status-badge {
    margin-top: 28px;
    padding: 16px 20px;
    background: rgba(34,197,94,0.12);
    border: 1px solid rgba(34,197,94,0.25);
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
  }
  .status-text {
    font-size: 14px;
    font-weight: 700;
    color: #4ade80;
  }
  .status-subtext {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    margin-top: 2px;
  }

  /* ══ RIGHT — formulaire ══ */
  .form-box {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 32px;
    overflow: hidden;
  }

  .form-header {
    padding: 28px 32px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .form-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    background: rgba(43,150,168,0.3);
    border: 1px solid rgba(43,150,168,0.5);
    margin-bottom: 20px;
  }
  .form-badge span {
    font-size: 10px;
    font-weight: 800;
    color: #A5F3FC;
    letter-spacing: 1px;
  }
  .form-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }
  .form-description {
    font-size: 14px;
    color: rgba(255,255,255,0.55);
    line-height: 1.6;
  }

  .form-body {
    padding: 28px 32px 32px;
  }

  /* Dark mode styles for ContactForm */
  .contact-form-dark input,
  .contact-form-dark textarea,
  .contact-form-dark select {
    background: rgba(255,255,255,0.08) !important;
    border: 1px solid rgba(255,255,255,0.15) !important;
    border-radius: 16px !important;
    padding: 12px 16px !important;
    color: white !important;
    font-size: 14px !important;
    width: 100% !important;
    font-family: inherit !important;
  }
  .contact-form-dark input:focus,
  .contact-form-dark textarea:focus,
  .contact-form-dark select:focus {
    outline: none !important;
    border-color: #2B96A8 !important;
    background: rgba(255,255,255,0.12) !important;
  }
  .contact-form-dark input::placeholder,
  .contact-form-dark textarea::placeholder {
    color: rgba(255,255,255,0.4) !important;
  }
  .contact-form-dark label {
    color: rgba(255,255,255,0.7) !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    margin-bottom: 6px !important;
    display: block !important;
  }
  .contact-form-dark button[type="submit"],
  .contact-form-dark button:not([type="button"]) {
    background: #2B96A8 !important;
    border: none !important;
    border-radius: 40px !important;
    padding: 14px 28px !important;
    color: white !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    letter-spacing: 0.5px !important;
    cursor: pointer !important;
    width: 100% !important;
    transition: all 0.15s !important;
  }
  .contact-form-dark button[type="submit"]:hover,
  .contact-form-dark button:not([type="button"]):hover {
    background: #1e6f7e !important;
    transform: translateY(-1px) !important;
  }

  /* ── Footer ── */
  .contact-footer {
    background: rgba(13,17,23,.92);
    border-top: 1px solid rgba(255,255,255,.06);
    padding: 24px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  /* CTA Banner */
  .cta-banner {
    max-width: 1200px;
    margin: -40px auto 0;
    padding: 0 40px 60px;
    position: relative;
    z-index: 2;
  }
  .cta-banner-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    padding: 20px 28px;
    background: rgba(43,150,168,0.12);
    border-radius: 24px;
    border: 1px solid rgba(43,150,168,0.25);
  }
  .cta-banner-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cta-banner-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: rgba(43,150,168,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cta-banner-text h4 {
    font-size: 15px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
  }
  .cta-banner-text p {
    font-size: 13px;
    color: rgba(255,255,255,0.55);
  }
  .cta-banner-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 28px;
    border-radius: 40px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .cta-banner-link:hover {
    background: rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }

  @media(max-width: 900px){
    .contact-section {
      grid-template-columns: 1fr !important;
      gap: 48px;
      padding: 60px 24px 80px;
    }
    .cta-banner { padding: 0 24px 60px; }
    .cta-banner-inner { flex-direction: column; text-align: center; }
    .cta-banner-content { flex-direction: column; text-align: center; }
  }
  @media(max-width: 480px){
    .form-header { padding: 20px; }
    .form-body { padding: 20px; }
    .info-item:hover { padding-left: 0; margin-left: 0; }
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
    { icon: <Mail  size={18} strokeWidth={1.8}/>, label:"EMAIL",    value: email,   href: `mailto:${email}` },
    { icon: <Phone size={18} strokeWidth={1.8}/>, label:"TÉLÉPHONE",value: phone,   href: `tel:${phone.replace(/\s/g,"")}` },
    { icon: <MapPin size={18} strokeWidth={1.8}/>,label:"ADRESSE",  value: address, href: undefined },
    { icon: <Clock size={18} strokeWidth={1.8}/>, label:"HORAIRES", value: hours,   href: undefined },
  ];

  return (
    <>
      <style>{CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TouristeNav />

      <div className="contact-page">
        {/* Blurred background image */}
        {bgImage && (
          <div
            className="contact-bg-blur"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}

        <div className="contact-content">
          <div style={{ paddingTop: 64 }} />

          <main className="contact-section">

            {/* ── Gauche : coordonnées ── */}
            <div>
              <div className="info-badge">
                <MessageCircle size={11} color="#A5F3FC" />
                <span>NOS COORDONNÉES</span>
              </div>
              <h1 className="info-title">Nous sommes là pour vous</h1>
              <p className="info-description">
                Que ce soit par téléphone, email ou en personne, notre équipe est là pour vous guider et répondre à toutes vos questions.
              </p>

              {INFO_ITEMS.map((item, i) => (
                <div key={i} className="info-item">
                  <div className="info-icon">{item.icon}</div>
                  <div>
                    <p className="info-label">{item.label}</p>
                    {item.href
                      ? <a href={item.href} className="info-value">{item.value}</a>
                      : <p className="info-value" style={{ cursor:"default" }}>{item.value}</p>}
                  </div>
                </div>
              ))}

             </div>
            {/* ── Droite : formulaire ── */}
            <div className="form-box">
              <div className="form-header">
                <div className="form-badge">
                  <Send size={11} color="#A5F3FC" />
                  <span>FORMULAIRE RAPIDE</span>
                </div>
                <h2 className="form-title">Envoyez-nous un message</h2>
                <p className="form-description">
                  Remplissez le formulaire ci-dessous, nous vous recontacterons dans les plus brefs délais.
                </p>
              </div>
              <div className="form-body">
                <div className="contact-form-dark">
                  <ContactForm ctaLabel={ctaLabel} successMsg={successMsg} />
                </div>
              </div>
            </div>

          </main>

          {/* CTA Banner */}
          <div className="cta-banner">
            <div className="cta-banner-inner">
              <div className="cta-banner-content">
                <div className="cta-banner-icon">
                  <Phone size={22} color="#A5F3FC" />
                </div>
                <div className="cta-banner-text">
                  <h4>Besoin d&apos;une réponse immédiate ?</h4>
                  <p>Appelez-nous directement au <strong style={{ color: "#A5F3FC" }}>{phone}</strong></p>
                </div>
              </div>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="cta-banner-link"
              >
                Appeler maintenant <ArrowRight size={14} />
              </a>
            </div>
          </div>

          <HomeFooter user={null} />
        </div>
      </div>
    </>
  );
}