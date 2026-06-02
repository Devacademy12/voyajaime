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
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Open+Sans:wght@400;500;600&display=swap');

  :root {
    --brand-dark:    #053366;
    --brand-primary: #02AFCF;
    --brand-lavender:#DCE5FF;
    --teal:          #2b96a8;
    --white:         #ffffff;
  }

  /* ── Section wrapper ── */
  .hcs-section {
    position: relative;
    overflow: hidden;
    padding: 88px 40px;
    background: var(--brand-dark);
  }

  /* Background image as subtle texture */
  .hcs-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0.10;
    pointer-events: none;
  }

  /* Gradient overlay for depth */
  .hcs-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(5,51,102,0.7) 0%,
      rgba(5,51,102,0.4) 100%
    );
    pointer-events: none;
  }

  /* Top accent line */
  .hcs-section::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--brand-primary);
    z-index: 1;
  }

  .hcs-inner {
    position: relative;
    z-index: 2;
    max-width: 1160px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1.45fr;
    gap: 32px;
    align-items: start;
  }

  /* ════════════════
     LEFT — info panel
  ════════════════ */
  .hcs-info-panel {
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0,0,0,0.25);
  }

  .hcs-info-header {
    background: var(--brand-dark);
    padding: 26px 28px 22px;
    border-bottom: 3px solid var(--brand-primary);
  }

  .hcs-eyebrow {
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: var(--brand-primary);
    text-transform: uppercase;
    letter-spacing: 2.2px;
    display: block;
    margin-bottom: 8px;
  }

  .hcs-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(18px, 2vw, 22px);
    font-weight: 800;
    color: var(--white);
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .hcs-items { padding: 4px 0; }

  .hcs-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 28px;
    border-bottom: 1px solid #f0f4f8;
    transition: background 0.15s;
  }
  .hcs-item:last-child { border-bottom: none; }
  .hcs-item:hover { background: #f8fafc; }

  .hcs-icon {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: var(--brand-lavender);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--brand-dark);
  }

  .hcs-ilabel {
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    margin-bottom: 4px;
  }

  .hcs-ivalue {
    font-size: 14px;
    font-weight: 600;
    color: var(--brand-dark);
    text-decoration: none;
    line-height: 1.4;
    display: block;
    transition: color .15s;
  }
  a.hcs-ivalue:hover { color: var(--brand-primary); }

  /* Status badge */
  .hcs-status {
    margin: 0 28px 22px;
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid rgba(34,197,94,0.2);
    border-left: 3px solid #22c55e;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hcs-status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.18);
  }
  .hcs-status-text {
    font-size: 12px;
    font-weight: 600;
    color: #166534;
    line-height: 1.3;
  }
  .hcs-status-text span {
    display: block;
    font-size: 11px;
    font-weight: 400;
    color: #4ade80;
    color: #15803d;
  }

  /* Full page link */
  .hcs-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin: 0 28px 24px;
    padding: 11px 0;
    border: 1.5px solid rgba(2,175,207,0.3);
    border-radius: 6px;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-primary);
    text-decoration: none;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    transition: background 0.15s, border-color 0.15s;
  }
  .hcs-more:hover {
    background: rgba(2,175,207,0.06);
    border-color: var(--brand-primary);
  }
  .hcs-more svg { transition: transform 0.15s; }
  .hcs-more:hover svg { transform: translateX(3px); }

  /* ════════════════
     RIGHT — form panel
  ════════════════ */
  .hcs-form-panel {
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0,0,0,0.25);
  }

  .hcs-form-header {
    background: var(--brand-dark);
    padding: 26px 32px 22px;
    border-bottom: 3px solid var(--brand-primary);
  }

  .hcs-form-eyebrow {
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: var(--brand-primary);
    text-transform: uppercase;
    letter-spacing: 2.2px;
    display: block;
    margin-bottom: 8px;
  }

  .hcs-form-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--white);
    letter-spacing: -0.3px;
  }

  .hcs-form-body {
    padding: 28px 32px 32px;
    background: var(--white);
  }

  /* Override child form styles for light bg */
  .hcs-form-body input,
  .hcs-form-body textarea,
  .hcs-form-body select {
    background: #f8fafc !important;
    border: 1.5px solid #e2e8f0 !important;
    border-radius: 6px !important;
    padding: 11px 14px !important;
    color: var(--brand-dark) !important;
    font-size: 14px !important;
    width: 100% !important;
    transition: border-color .15s, background .15s !important;
    font-family: 'Open Sans', sans-serif !important;
  }
  .hcs-form-body input:focus,
  .hcs-form-body textarea:focus,
  .hcs-form-body select:focus {
    outline: none !important;
    border-color: var(--brand-primary) !important;
    background: var(--white) !important;
    box-shadow: 0 0 0 3px rgba(2,175,207,0.1) !important;
  }
  .hcs-form-body input::placeholder,
  .hcs-form-body textarea::placeholder {
    color: #94a3b8 !important;
  }
  .hcs-form-body label {
    color: var(--brand-dark) !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    margin-bottom: 6px !important;
    display: block !important;
    font-family: 'Montserrat', sans-serif !important;
  }
  .hcs-form-body button[type="submit"],
  .hcs-form-body button:not([type="button"]) {
    background: var(--brand-primary) !important;
    border: none !important;
    border-radius: 6px !important;
    padding: 13px 28px !important;
    color: var(--white) !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
    cursor: pointer !important;
    font-family: 'Montserrat', sans-serif !important;
    transition: background .15s, transform .12s !important;
    box-shadow: 0 4px 14px rgba(2,175,207,0.3) !important;
    width: 100% !important;
  }
  .hcs-form-body button[type="submit"]:hover,
  .hcs-form-body button:not([type="button"]):hover {
    background: var(--teal) !important;
    transform: translateY(-1px) !important;
  }

  /* ════════════════
     RESPONSIVE
  ════════════════ */
  @media (max-width: 900px) {
    .hcs-inner   { grid-template-columns: 1fr; gap: 24px; }
    .hcs-section { padding: 64px 20px; }
  }
  @media (max-width: 480px) {
    .hcs-form-body { padding: 20px; }
    .hcs-item      { padding: 14px 20px; }
    .hcs-info-header, .hcs-form-header { padding: 20px; }
    .hcs-status, .hcs-more { margin-left: 20px; margin-right: 20px; }
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
    supabase.from("contact_content").select("key, value").then(({ data }) => {
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
    { icon: <Mail   size={19} strokeWidth={1.8} />, label: "Email",     value: email,   href: `mailto:${email}` },
    { icon: <Phone  size={19} strokeWidth={1.8} />, label: "Téléphone", value: phone,   href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: <MapPin size={19} strokeWidth={1.8} />, label: "Adresse",   value: address, href: undefined },
    { icon: <Clock  size={19} strokeWidth={1.8} />, label: "Horaires",  value: hours,   href: undefined },
  ];

  return (
    <section aria-labelledby="contact-section-heading">
      <style>{CSS}</style>

      <div className="hcs-section">
        {/* Muted background image */}
        {bgImage && (
          <div
            className="hcs-bg"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}
        <div className="hcs-overlay" />

        <div className="hcs-inner">

          {/* ── Left: coordonnées ── */}
          <aside className="hcs-info-panel">
            <div className="hcs-info-header">
              <span className="hcs-eyebrow">Nos coordonnées</span>
              <p className="hcs-title">Comment nous joindre</p>
            </div>

            <div className="hcs-items">
              {INFO.map((item, i) => (
                <div key={i} className="hcs-item">
                  <div className="hcs-icon">{item.icon}</div>
                  <div>
                    <p className="hcs-ilabel">{item.label}</p>
                    {item.href
                      ? <a href={item.href} className="hcs-ivalue">{item.value}</a>
                      : <span className="hcs-ivalue">{item.value}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            <div className="hcs-status">
              <span className="hcs-status-dot" />
              <div className="hcs-status-text">
                Équipe disponible
                <span>Réponse garantie sous 24h</span>
              </div>
            </div>

            <Link href="/contact" className="hcs-more">
              Page contact complète <ArrowRight size={13} />
            </Link>
          </aside>

          {/* ── Right: formulaire ── */}
          <div className="hcs-form-panel">
            <div className="hcs-form-header">
              <span className="hcs-form-eyebrow">Formulaire de contact</span>
              <p id="contact-section-heading" className="hcs-form-title">
                Envoyez-nous un message
              </p>
            </div>
            <div className="hcs-form-body">
              <ContactFormInline ctaLabel={ctaLabel} successMsg={successMsg} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}