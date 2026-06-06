import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { Metadata } from "next";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";
import ContactForm from "./ContactForm";
import { Mail, Phone, MapPin, Clock, ArrowRight, Send, MessageCircle } from "lucide-react";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contactez-nous | VoyajAime",
    description: "Une question sur nos excursions en Tunisie ? Contactez l'équipe VoyajAime — réponse sous 24h.",
    alternates: { canonical: "/contact" },
  };
}

interface ContactContent { key: string; value: string | null; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .contact-page-light {
    min-height: 100vh;
    background: linear-gradient(160deg, #EEF6F8 0%, #F7F9FC 50%, #EEF3FB 100%);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }

  .contact-page-light::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(11,122,138,0.07) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  .contact-page-light::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(5,51,102,0.05) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  /* ── Section principale ── */
  .cp-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 40px 100px;
    position: relative;
    z-index: 1;
  }

  /* ── Header centré ── */
  .cp-header {
    text-align: center;
    margin-bottom: 56px;
  }

  .cp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 20px;
    background: #E6F4F6;
    border: 1px solid rgba(11,122,138,0.2);
    margin-bottom: 16px;
  }
  .cp-eyebrow span {
    font-size: 10px;
    font-weight: 800;
    color: #0B7A8A;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }

  .cp-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 700;
    color: #053366;
    letter-spacing: -1px;
    line-height: 1.08;
    margin-bottom: 16px;
  }

  .cp-subtitle {
    font-size: 15px;
    color: #6B7280;
    line-height: 1.7;
    max-width: 460px;
    margin: 0 auto;
  }

  /* ── Grid 2 colonnes ── */
  .cp-grid {
    display: flex;
    gap: 28px;
    align-items: flex-start;
  }

  /* ── Carte info ── */
  .cp-info-card {
    flex: 1.2;
    background: white;
    border-radius: 24px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .cp-info-head {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #F3F4F6;
  }

  .cp-info-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    background: #E6F4F6;
    border: 1px solid rgba(11,122,138,0.2);
    margin-bottom: 16px;
  }
  .cp-info-badge span {
    font-size: 10px;
    font-weight: 800;
    color: #0B7A8A;
    letter-spacing: 1px;
  }

  .cp-info-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    font-weight: 700;
    color: #053366;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }

  .cp-info-desc {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.6;
  }

  /* Info items */
  .cp-info-items { padding: 8px 0; }

  .cp-info-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 24px;
    border-bottom: 1px solid #F3F4F6;
    transition: background 0.15s;
  }
  .cp-info-row:last-of-type { border-bottom: none; }
  .cp-info-row:hover { background: #F7F9FC; }

  .cp-info-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: #E6F4F6;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #0B7A8A;
  }

  .cp-info-label {
    font-size: 11px;
    font-weight: 700;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 3px;
  }

  .cp-info-value {
    font-size: 14px;
    font-weight: 600;
    color: #053366;
    text-decoration: none;
    transition: color 0.15s;
  }
  .cp-info-value:hover { color: #0B7A8A; }
  .cp-info-value-plain {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  /* Status badge */
  .cp-status {
    margin: 0 24px 16px;
    padding: 12px 16px;
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cp-status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
  }
  .cp-status-text {
    font-size: 13px;
    font-weight: 700;
    color: #15803d;
  }
  .cp-status-sub {
    font-size: 12px;
    color: #6B7280;
    margin-top: 1px;
  }

  /* Link vers page contact */
  .cp-more-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 24px 24px;
    padding: 12px 18px;
    background: #F7F9FC;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.15s;
  }
  .cp-more-link:hover {
    background: #E6F4F6;
    border-color: rgba(11,122,138,0.25);
  }
  .cp-more-link span {
    font-size: 13px;
    font-weight: 700;
    color: #374151;
  }

  /* ── Carte formulaire ── */
  .cp-form-card {
    flex: 1.8;
    background: white;
    border-radius: 24px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .cp-form-head {
    padding: 24px 28px 16px;
    border-bottom: 1px solid #F3F4F6;
  }

  .cp-form-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    background: #E6F4F6;
    border: 1px solid rgba(11,122,138,0.2);
    margin-bottom: 16px;
  }
  .cp-form-badge span {
    font-size: 10px;
    font-weight: 800;
    color: #0B7A8A;
    letter-spacing: 1px;
  }

  .cp-form-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 700;
    color: #053366;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }

  .cp-form-desc {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.6;
  }

  .cp-form-body { padding: 24px 28px 28px; }

  /* Override ContactForm for light context */
  .cp-form-light input,
  .cp-form-light textarea,
  .cp-form-light select {
    background: #F7F9FC !important;
    border: 1.5px solid #E5E7EB !important;
    border-radius: 12px !important;
    padding: 11px 14px !important;
    color: #111827 !important;
    font-size: 14px !important;
    width: 100% !important;
    font-family: 'Plus Jakarta Sans', inherit !important;
    transition: border-color 0.2s !important;
  }
  .cp-form-light input:focus,
  .cp-form-light textarea:focus {
    outline: none !important;
    border-color: #0B7A8A !important;
    background: white !important;
  }
  .cp-form-light input::placeholder,
  .cp-form-light textarea::placeholder {
    color: #9CA3AF !important;
  }
  .cp-form-light label {
    color: #374151 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    margin-bottom: 6px !important;
    display: block !important;
  }
  .cp-form-light button[type="submit"],
  .cp-form-light button:not([type="button"]) {
    background: #0B7A8A !important;
    border: none !important;
    border-radius: 40px !important;
    padding: 13px 28px !important;
    color: white !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    cursor: pointer !important;
    width: 100% !important;
    transition: all 0.2s !important;
    box-shadow: 0 4px 14px rgba(11,122,138,0.22) !important;
    font-family: inherit !important;
  }
  .cp-form-light button[type="submit"]:hover,
  .cp-form-light button:not([type="button"]):hover {
    background: #095f6c !important;
    transform: translateY(-1px) !important;
  }

  /* ── CTA Banner ── */
  .cp-cta {
    margin-top: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    padding: 20px 24px;
    background: white;
    border-radius: 18px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 6px rgba(0,0,0,0.03);
  }

  .cp-cta-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .cp-cta-icon {
    width: 44px; height: 44px;
    border-radius: 14px;
    background: #E6F4F6;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .cp-cta-title {
    font-size: 14px;
    font-weight: 700;
    color: #053366;
    margin-bottom: 3px;
  }

  .cp-cta-sub {
    font-size: 13px;
    color: #6B7280;
  }

  .cp-cta-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 24px;
    border-radius: 40px;
    background: #E6F4F6;
    border: 1px solid rgba(11,122,138,0.2);
    color: #0B7A8A;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .cp-cta-link:hover {
    background: #0B7A8A;
    color: white;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .cp-section { padding: 60px 24px 80px; }
    .cp-grid { flex-direction: column; }
    .cp-cta { flex-direction: column; align-items: flex-start; }
  }

  @media (max-width: 480px) {
    .cp-form-head { padding: 20px; }
    .cp-form-body { padding: 20px; }
    .cp-info-head { padding: 20px 20px 16px; }
    .cp-info-row { padding: 14px 20px; }
    .cp-more-link { margin: 0 20px 20px; }
    .cp-status { margin: 0 20px 16px; }
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contactez VoyajAime",
    url: "https://voyajaime.tn/contact",
  };

  const INFO_ITEMS = [
    { icon: <Mail   size={18} strokeWidth={1.8} />, label: "Email",     value: email,   href: `mailto:${email}` },
    { icon: <Phone  size={18} strokeWidth={1.8} />, label: "Téléphone", value: phone,   href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: <MapPin size={18} strokeWidth={1.8} />, label: "Adresse",   value: address, href: undefined },
    { icon: <Clock  size={18} strokeWidth={1.8} />, label: "Horaires",  value: hours,   href: undefined },
  ];

  return (
    <>
      <style>{CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TouristeNav />

      <div className="contact-page-light">
        <div style={{ paddingTop: 64 }} />

        <main className="cp-section">

          {/* ── Header ── */}
          <div className="cp-header">
            <div className="cp-eyebrow">
              <MessageCircle size={11} color="#0B7A8A" />
              <span>Contactez-nous</span>
            </div>
            <h1 className="cp-title">Prenons contact</h1>
            <p className="cp-subtitle">
              Une question ? Un projet sur mesure ? Écrivez-nous, nous vous répondons sous 24h.
            </p>
          </div>

          {/* ── Grid ── */}
          <div className="cp-grid">

            {/* ── Gauche : infos ── */}
            <div className="cp-info-card">
              <div className="cp-info-head">
                <div className="cp-info-badge">
                  <MessageCircle size={11} color="#0B7A8A" />
                  <span>Coordonnées</span>
                </div>
                <h2 className="cp-info-title">Comment nous joindre</h2>
                <p className="cp-info-desc">
                  Que ce soit par téléphone, email ou en personne, notre équipe est là pour vous guider.
                </p>
              </div>

              <div className="cp-info-items">
                {INFO_ITEMS.map((item, i) => (
                  <div key={i} className="cp-info-row">
                    <div className="cp-info-icon">{item.icon}</div>
                    <div>
                      <p className="cp-info-label">{item.label}</p>
                      {item.href
                        ? <a href={item.href} className="cp-info-value">{item.value}</a>
                        : <span className="cp-info-value-plain">{item.value}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="cp-status">
                <div className="cp-status-dot" />
                <div>
                  <p className="cp-status-text">Équipe disponible</p>
                  <p className="cp-status-sub">Réponse garantie sous 24h</p>
                </div>
              </div>

              <Link href="/excursions" className="cp-more-link">
                <span>Voir nos excursions</span>
                <ArrowRight size={14} color="#6B7280" />
              </Link>
            </div>

            {/* ── Droite : formulaire ── */}
            <div className="cp-form-card">
              <div className="cp-form-head">
                <div className="cp-form-badge">
                  <Send size={11} color="#0B7A8A" />
                  <span>Formulaire rapide</span>
                </div>
                <h2 className="cp-form-title">Envoyez-nous un message</h2>
                <p className="cp-form-desc">
                  Remplissez le formulaire ci-dessous, nous vous recontacterons dans les plus brefs délais.
                </p>
              </div>
              <div className="cp-form-body">
                <div className="cp-form-light">
                  <ContactForm ctaLabel={ctaLabel} successMsg={successMsg} />
                </div>
              </div>
            </div>

          </div>

          {/* ── CTA Banner ── */}
          <div className="cp-cta">
            <div className="cp-cta-left">
              <div className="cp-cta-icon">
                <Phone size={20} color="#0B7A8A" />
              </div>
              <div>
                <p className="cp-cta-title">Besoin d&apos;une réponse immédiate ?</p>
                <p className="cp-cta-sub">
                  Appelez-nous directement au <strong style={{ color: "#0B7A8A" }}>{phone}</strong>
                </p>
              </div>
            </div>
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="cp-cta-link">
              Appeler maintenant <ArrowRight size={13} />
            </a>
          </div>

        </main>

        <HomeFooter user={null} />
      </div>
    </>
  );
}