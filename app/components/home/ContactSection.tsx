import Link from "next/link";
import { Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react";
import ContactFormInline from "../contact/ContactFormInline";

interface ContactSectionProps {
  email?:      string;
  phone?:      string;
  address?:    string;
  hours?:      string;
  ctaLabel?:   string;
  successMsg?: string;
  bgImage?:    string;   // ← NOUVEAU
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .hcs-section {
    background: #0D1117;
    background-size: cover;
    background-position: center;
    padding: 96px 40px;
    position: relative;
    overflow: hidden;
  }

  /* Subtle top border accent */
  .hcs-section::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(2,175,207,.3), transparent);
  }

  /* Overlay sombre par-dessus l'image */
  .hcs-overlay {
    position: absolute;
    inset: 0;
    background: rgba(13,17,23,.80);
    pointer-events: none;
  }

  .hcs-inner {
    position: relative; /* au-dessus de l'overlay */
    z-index: 1;
    max-width: 1160px; margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 80px;
    align-items: start;
  }

  /* ── LEFT ── */
  .hcs-eyebrow {
    font-size: 11px; font-weight: 800;
    color: rgba(255,255,255,.35);
    text-transform: uppercase; letter-spacing: 2.5px;
    display: block; margin-bottom: 14px;
  }
  .hcs-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 3.5vw, 46px);
    font-weight: 900; color: #fff;
    letter-spacing: -1.5px; line-height: 1.08;
    margin-bottom: 40px;
  }

  .hcs-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .hcs-item:last-child { border-bottom: none; }

  .hcs-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(2,175,207,.12);
    border: 1px solid rgba(2,175,207,.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .hcs-ilabel {
    font-size: 10.5px; font-weight: 800;
    color: rgba(255,255,255,.32);
    text-transform: uppercase; letter-spacing: 1.2px;
    margin-bottom: 5px;
  }
  .hcs-ivalue {
    font-size: 15px; font-weight: 700; color: #fff;
    text-decoration: none; transition: color .18s;
  }
  .hcs-ivalue:hover { color: #02AFCF; }

  /* Full page link */
  .hcs-more {
    display: inline-flex; align-items: center; gap: 7px;
    margin-top: 28px;
    font-size: 13px; font-weight: 700; color: rgba(255,255,255,.45);
    text-decoration: none; transition: color .18s;
  }
  .hcs-more:hover { color: #02AFCF; }

  /* ── RIGHT — form box ── */
  .hcs-form-box {
    background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 18px;
    padding: 36px;
  }

  .hcs-form-eyebrow {
    font-size: 11px; font-weight: 800;
    color: rgba(255,255,255,.35);
    text-transform: uppercase; letter-spacing: 2.5px;
    display: block; margin-bottom: 10px;
  }
  .hcs-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 24px; font-weight: 900; color: #fff;
    letter-spacing: -.4px; margin-bottom: 28px;
  }

  @media(max-width:900px){
    .hcs-inner   { grid-template-columns:1fr!important; gap:48px; }
    .hcs-section { padding:64px 24px; }
  }
  @media(max-width:480px){
    .hcs-form-box { padding:22px; }
  }
`;

export default function ContactSection({
  email      = "contact@voyajaime.tn",
  phone      = "+216 XX XXX XXX",
  address    = "Tunis, Tunisie",
  hours      = "Lun–Ven : 9h–18h",
  ctaLabel   = "Envoyer le message",
  successMsg = "Message envoyé ! Nous vous répondrons sous 24h.",
  bgImage    = "",   // ← NOUVEAU
}: ContactSectionProps) {

  const INFO = [
    { icon: <Mail  size={17} color="#02AFCF" strokeWidth={1.8}/>, label:"EMAIL",     value: email,   href: `mailto:${email}` },
    { icon: <Phone size={17} color="#02AFCF" strokeWidth={1.8}/>, label:"TÉLÉPHONE", value: phone,   href: `tel:${phone.replace(/\s/g,"")}` },
    { icon: <MapPin size={17} color="#02AFCF" strokeWidth={1.8}/>,label:"ADRESSE",   value: address, href: undefined },
    { icon: <Clock size={17} color="#02AFCF" strokeWidth={1.8}/>, label:"HORAIRES",  value: hours,   href: undefined },
  ];

  return (
    <section aria-labelledby="contact-section-heading">
      <style>{CSS}</style>

      {/* ── bg_image appliqué ici via style inline ── */}
      <div
        className="hcs-section"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
      >
        {/* Overlay sombre uniquement quand une image est présente */}
        {bgImage && <div className="hcs-overlay" />}

        <div className="hcs-inner">

          {/* ── Gauche ── */}
          <div>
            <span className="hcs-eyebrow">Nos coordonnées</span>
            <h2 id="contact-section-heading" className="hcs-title">
              Nous sommes là pour vous
            </h2>

            {INFO.map((item, i) => (
              <div key={i} className="hcs-item">
                <div className="hcs-icon">{item.icon}</div>
                <div>
                  <p className="hcs-ilabel">{item.label}</p>
                  {item.href
                    ? <a href={item.href} className="hcs-ivalue">{item.value}</a>
                    : <p className="hcs-ivalue" style={{ cursor:"default" }}>{item.value}</p>}
                </div>
              </div>
            ))}

            <Link href="/contact" className="hcs-more">
              Voir la page contact complète <ArrowRight size={13}/>
            </Link>
          </div>

          {/* ── Droite : formulaire inline ── */}
          <div className="hcs-form-box">
            <span className="hcs-form-eyebrow">Formulaire de contact</span>
            <h3 className="hcs-form-title">Envoyez-nous un message</h3>
            <ContactFormInline ctaLabel={ctaLabel} successMsg={successMsg} />
          </div>

        </div>
      </div>
    </section>
  );
}