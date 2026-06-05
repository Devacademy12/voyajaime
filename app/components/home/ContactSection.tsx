"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, ArrowRight, Send, MessageCircle } from "lucide-react";
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

const CONTACT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .contact-section-v2 {
    background: linear-gradient(160deg, #EEF6F8 0%, #F7F9FC 50%, #EEF3FB 100%);
    padding: 88px 64px 100px;
    position: relative;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .contact-section-v2::before {
    content: '';
    position: absolute; top: -80px; right: -80px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(11,122,138,0.07) 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }

  .contact-info-card {
    flex: 1.2;
    background: white;
    border-radius: 24px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .contact-form-card {
    flex: 1.8;
    background: white;
    border-radius: 24px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .contact-info-row {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 24px;
    border-bottom: 1px solid #F3F4F6;
    transition: background 0.15s;
  }
  .contact-info-row:last-of-type { border-bottom: none; }
  .contact-info-row:hover { background: #F7F9FC; }

  .contact-status-badge {
    margin: 8px 24px 16px;
    padding: 12px 16px;
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-radius: 12px;
    display: flex; align-items: center; gap: 10px;
  }

  .contact-cta-bar {
    margin-top: 40px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 20px;
    padding: 20px 24px;
    background: white;
    border-radius: 18px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 6px rgba(0,0,0,0.03);
  }

  /* Override ContactFormInline for light context */
  .contact-form-light input,
  .contact-form-light textarea,
  .contact-form-light select {
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
  .contact-form-light input:focus,
  .contact-form-light textarea:focus {
    outline: none !important;
    border-color: #0B7A8A !important;
    background: white !important;
  }
  .contact-form-light input::placeholder,
  .contact-form-light textarea::placeholder {
    color: #9CA3AF !important;
  }
  .contact-form-light label {
    color: #374151 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    margin-bottom: 6px !important;
    display: block !important;
  }
  .contact-form-light button[type="submit"],
  .contact-form-light button:not([type="button"]) {
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
  .contact-form-light button[type="submit"]:hover,
  .contact-form-light button:not([type="button"]):hover {
    background: #095f6c !important;
    transform: translateY(-1px) !important;
  }

  @media(max-width: 900px) {
    .contact-section-v2 { padding: 56px 20px 72px; }
    .contact-cols { flex-direction: column !important; }
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

  const INFO = [
    { icon: <Mail   size={18} strokeWidth={1.8} />, label: "Email",     value: email,   href: `mailto:${email}` },
    { icon: <Phone  size={18} strokeWidth={1.8} />, label: "Téléphone", value: phone,   href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: <MapPin size={18} strokeWidth={1.8} />, label: "Adresse",   value: address, href: undefined },
    { icon: <Clock  size={18} strokeWidth={1.8} />, label: "Horaires",  value: hours,   href: undefined },
  ];

  return (
    <section id="contact" className="contact-section-v2">
      <style>{CONTACT_CSS}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p className="section-eyebrow">Contactez-nous</p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 700, color: "#053366",
            letterSpacing: "-0.5px", margin: 0,
          }}>
            Prenons contact
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280", marginTop: 14, maxWidth: 480, margin: "14px auto 0", lineHeight: 1.7 }}>
            Une question ? Un projet sur mesure ? Écrivez-nous, nous vous répondons sous 24h.
          </p>
        </div>

        {/* 2 columns: info + form */}
        <div className="contact-cols" style={{ display: "flex", gap: 28 }}>

          {/* LEFT: Contact Info Card */}
          <div className="contact-info-card">
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 20,
                background: "#E6F4F6", border: "1px solid rgba(11,122,138,0.2)",
                alignSelf: "flex-start", marginBottom: 16,
              }}>
                <MessageCircle size={11} color="#0B7A8A" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#0B7A8A", letterSpacing: 1 }}>COORDONNÉES</span>
              </div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#053366", marginBottom: 6, letterSpacing: "-0.3px" }}>
                Comment nous joindre
              </h3>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                Que ce soit par téléphone, email ou en personne, notre équipe est là pour vous guider.
              </p>
            </div>

            <div style={{ padding: "8px 0" }}>
              {INFO.map((item, i) => (
                <div key={i} className="contact-info-row">
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "#E6F4F6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, color: "#0B7A8A",
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
                      {item.label}
                    </p>
                    {item.href
                      ? <a href={item.href} style={{ fontSize: 14, fontWeight: 600, color: "#053366", textDecoration: "none" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#0B7A8A"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#053366"}
                        >{item.value}</a>
                      : <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{item.value}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

           

            <Link
              href="/contact"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                margin: "0 24px 24px",
                padding: "12px 18px",
                background: "#F7F9FC",
                border: "1px solid #E5E7EB",
                borderRadius: 14,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E6F4F6";
                e.currentTarget.style.borderColor = "rgba(11,122,138,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F7F9FC";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Page contact complète</span>
              <ArrowRight size={14} color="#6B7280" />
            </Link>
          </div>

          {/* RIGHT: Form Card */}
          <div className="contact-form-card">
            <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 20,
                background: "#E6F4F6", border: "1px solid rgba(11,122,138,0.2)",
                alignSelf: "flex-start", marginBottom: 16,
              }}>
                <Send size={11} color="#0B7A8A" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#0B7A8A", letterSpacing: 1 }}>FORMULAIRE RAPIDE</span>
              </div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#053366", marginBottom: 6, letterSpacing: "-0.3px" }}>
                Envoyez-nous un message
              </h3>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                Remplissez le formulaire ci-dessous, nous vous recontacterons dans les plus brefs délais.
              </p>
            </div>

            <div style={{ padding: "24px 28px 28px" }}>
              <div className="contact-form-light">
                <ContactFormInline ctaLabel={ctaLabel} successMsg={successMsg} />
              </div>
            </div>
          </div>
        </div>

        {/* CTA bar */}
        <div className="contact-cta-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "#E6F4F6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Phone size={20} color="#0B7A8A" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", marginBottom: 3 }}>Besoin d&apos;une réponse immédiate ?</p>
              <p style={{ fontSize: 13, color: "#6B7280" }}>Appelez-nous directement au <strong style={{ color: "#0B7A8A" }}>{phone}</strong></p>
            </div>
          </div>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 24px", borderRadius: 40,
              background: "#E6F4F6", border: "1px solid rgba(11,122,138,0.2)",
              color: "#0B7A8A", fontSize: 13, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0B7A8A"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#E6F4F6"; e.currentTarget.style.color = "#0B7A8A"; }}
          >
            Appeler maintenant <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
