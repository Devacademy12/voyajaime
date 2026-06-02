import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { Metadata } from "next";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";
import ContactForm from "./ContactForm";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
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
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
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
  .info-eyebrow {
    font-size: 11px; font-weight: 800;
    color: rgba(255,255,255,.35);
    text-transform: uppercase; letter-spacing: 2.5px;
    display: block; margin-bottom: 16px;
  }
  .info-title {
    font-family: inherit'Playfair Display', serif;
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 900; color: #fff;
    letter-spacing: -1.5px; line-height: 1.06;
    margin-bottom: 48px;
  }

  /* Info items */
  .info-item {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .info-item:last-child { border-bottom: none; }

  .info-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(2,175,207,.14);
    border: 1px solid rgba(2,175,207,.22);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .info-label {
    font-size: 11px; font-weight: 800;
    color: rgba(255,255,255,.35);
    text-transform: uppercase; letter-spacing: 1.2px;
    margin-bottom: 6px;
  }
  .info-value {
    font-size: 16px; font-weight: 700; color: #fff;
    text-decoration: none; transition: color .18s;
  }
  .info-value:hover { color: #02AFCF; }

  /* ══ RIGHT — formulaire ══ */
  .form-box {
    background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 20px;
    padding: 40px;
  }

  .form-eyebrow {
    font-size: 11px; font-weight: 800;
    color: rgba(255,255,255,.35);
    text-transform: uppercase; letter-spacing: 2.5px;
    display: block; margin-bottom: 12px;
  }
  .form-title {
    font-family: inherit'Playfair Display', serif;
    font-size: 28px; font-weight: 900; color: #fff;
    letter-spacing: -.5px; margin-bottom: 32px;
  }

  /* ── Footer ── */
  .contact-footer {
    background: rgba(13,17,23,.92);
    border-top: 1px solid rgba(255,255,255,.06);
    padding: 24px 40px;
    display: flex; justify-content: space-between;
    align-items: center; flex-wrap: wrap; gap: 12px;
  }

  @media(max-width:900px){
    .contact-section {
      grid-template-columns: 1fr !important;
      gap: 48px;
      padding: 60px 24px 80px;
    }
  }
  @media(max-width:480px){
    .form-box { padding: 24px; }
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
  const bgImage    = c.bg_image    || "";   // ← IMAGE DE FOND

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contactez VoyajAime",
    url: "https://voyajaime.tn/contact",
  };

  const INFO_ITEMS = [
    { icon: <Mail  size={18} color="#02AFCF" strokeWidth={1.8}/>, label:"EMAIL",    value: email,   href: `mailto:${email}` },
    { icon: <Phone size={18} color="#02AFCF" strokeWidth={1.8}/>, label:"TÉLÉPHONE",value: phone,   href: `tel:${phone.replace(/\s/g,"")}` },
    { icon: <MapPin size={18} color="#02AFCF" strokeWidth={1.8}/>,label:"ADRESSE",  value: address, href: undefined },
    { icon: <Clock size={18} color="#02AFCF" strokeWidth={1.8}/>, label:"HORAIRES", value: hours,   href: undefined },
  ];

  return (
    <>
      <style>{CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TouristeNav />

      {/* ── bg_image appliqué ici via style inline ── */}
      <div
        className="contact-page"
        style={bgImage ? {
          backgroundImage: `linear-gradient(rgba(13,17,23,.80), rgba(13,17,23,.80)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        } : undefined}
      >
        <div style={{ paddingTop: 64 }} />

        <main className="contact-section">

          {/* ── Gauche : coordonnées ── */}
          <div>
            <span className="info-eyebrow">Nos coordonnées</span>
            <h1 className="info-title">Nous sommes là pour vous</h1>

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
            <span className="form-eyebrow">Formulaire de contact</span>
            <h2 className="form-title">Envoyez-nous un message</h2>
            <ContactForm ctaLabel={ctaLabel} successMsg={successMsg} />
          </div>

        </main>

             <HomeFooter user={null} />
       
      </div>
    </>
  );
}