"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react";
import ContactFormInline from "../contact/ContactFormInline";
import { createClient } from "@/lib/supabaseClient";

interface ContactSectionProps {
  email?:      string;
  phone?:      string;
  address?:    string;
  hours?:      string;
  ctaLabel?:   string;
  successMsg?: string;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Wrapper section ── */
  .hcs-section {
    min-height: 480px;
    background-color: #0A0F15;
    background-size: cover;
    background-position: center;
    padding: 96px 40px;
    position: relative;
    overflow: hidden;
  }

  /* Overlay plus foncé pour meilleur contraste */
  .hcs-section::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 15, 21, 0.85);
    z-index: 0;
  }

  /* Ligne déco en haut */
  .hcs-section::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(43,150,168,0.5), transparent);
    z-index: 1;
  }

  .hcs-inner {
    position: relative;
    z-index: 2;
    max-width: 1160px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 80px;
    align-items: start;
  }

  .hcs-eyebrow {
    font-size: 12px;
    font-weight: 800;
    color: #2B96A8;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    display: block;
    margin-bottom: 14px;
  }
  
  .hcs-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 3.5vw, 46px);
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -1.5px;
    line-height: 1.08;
    margin-bottom: 40px;
  }

  .hcs-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .hcs-item:last-child { border-bottom: none; }

  .hcs-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(43, 150, 168, 0.15);
    border: 1px solid rgba(43, 150, 168, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .hcs-ilabel {
    font-size: 11px;
    font-weight: 800;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 5px;
  }
  
  .hcs-ivalue {
    font-size: 15px;
    font-weight: 600;
    color: #FFFFFF;
    text-decoration: none;
    transition: color .18s;
  }
  .hcs-ivalue:hover { color: #2B96A8; }

  .hcs-more {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 28px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    transition: color .18s;
  }
  .hcs-more:hover { color: #2B96A8; }

  .hcs-form-box {
    background: rgba(15, 20, 28, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 36px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  .hcs-form-eyebrow {
    font-size: 11px;
    font-weight: 800;
    color: #2B96A8;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    display: block;
    margin-bottom: 10px;
  }
  
  .hcs-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -0.4px;
    margin-bottom: 28px;
  }

  /* Styles pour le formulaire intégré */
  .hcs-form-box input,
  .hcs-form-box textarea,
  .hcs-form-box select {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 12px 16px;
    color: #FFFFFF;
    font-size: 14px;
    width: 100%;
    transition: all .15s;
  }

  .hcs-form-box input:focus,
  .hcs-form-box textarea:focus,
  .hcs-form-box select:focus {
    outline: none;
    border-color: #2B96A8;
    background: rgba(255,255,255,0.12);
  }

  .hcs-form-box input::placeholder,
  .hcs-form-box textarea::placeholder {
    color: rgba(255,255,255,0.4);
  }

  .hcs-form-box label {
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    display: block;
  }

  .hcs-form-box button {
    background: #2B96A8;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    color: white;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all .15s;
  }

  .hcs-form-box button:hover {
    background: #1a7a8a;
    transform: translateY(-1px);
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
  email:      emailProp,
  phone:      phoneProp,
  address:    addressProp,
  hours:      hoursProp,
  ctaLabel:   ctaLabelProp,
  successMsg: successMsgProp,
}: ContactSectionProps) {
  const [rows, setRows] = useState<{ key: string; value: string | null }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("contact_content")
      .select("key, value")
      .then(({ data }) => {
        if (data) setRows(data);
      });
  }, []);

  const c = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""])),
    [rows]
  );

  const email      = emailProp      ?? c.email       ?? "contact@voyajaime.tn";
  const phone      = phoneProp      ?? c.phone       ?? "+216 XX XXX XXX";
  const address    = addressProp    ?? c.address     ?? "Tunis, Tunisie";
  const hours      = hoursProp      ?? c.hours       ?? "Lun–Ven : 9h–18h";
  const ctaLabel   = ctaLabelProp   ?? c.cta_label   ?? "Envoyer le message";
  const successMsg = successMsgProp ?? c.success_msg ?? "Message envoyé ! Nous vous répondrons sous 24h.";
  const bgImage    = c.bg_image     ?? "";

  const INFO = [
    { icon: <Mail  size={17} color="#2B96A8" strokeWidth={1.8}/>, label:"EMAIL",     value: email,   href: `mailto:${email}` },
    { icon: <Phone size={17} color="#2B96A8" strokeWidth={1.8}/>, label:"TÉLÉPHONE", value: phone,   href: `tel:${phone.replace(/\s/g,"")}` },
    { icon: <MapPin size={17} color="#2B96A8" strokeWidth={1.8}/>,label:"ADRESSE",   value: address, href: undefined },
    { icon: <Clock size={17} color="#2B96A8" strokeWidth={1.8}/>, label:"HORAIRES",  value: hours,   href: undefined },
  ];

  return (
    <section aria-labelledby="contact-section-heading">
      <style>{CSS}</style>

      <div
        className="hcs-section"
        style={bgImage ? {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : undefined}
      >

        <div className="hcs-inner">

          {/* ── Gauche ── */}
          <div>
            <span className="hcs-eyebrow">✦ Nos coordonnées</span>
            <h2 id="contact-section-heading" className="hcs-title">
              Nous sommes là<br />pour vous
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

          {/* ── Droite : formulaire ── */}
          <div className="hcs-form-box">
            <span className="hcs-form-eyebrow">✦ Formulaire de contact</span>
            <h3 className="hcs-form-title">Envoyez-nous un message</h3>
            <ContactFormInline ctaLabel={ctaLabel} successMsg={successMsg} />
          </div>

        </div>
      </div>
    </section>
  );
}