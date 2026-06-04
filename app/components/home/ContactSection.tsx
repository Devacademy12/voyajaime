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
    <section id="contact" style={{ position: "relative", overflow: "hidden" }}>
      {/* Blurred background */}
      {bgImage && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(3px) brightness(0.35)", transform: "scale(1.05)",
        }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "rgba(4,12,22,0.75)" }} />

      <div
        style={{ position: "relative", zIndex: 1, padding: "96px 72px 108px", maxWidth: 1200, margin: "0 auto" }}
        className="section-pad"
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "white", letterSpacing: "-1px", margin: 0 }}>
            Prenons contact
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.58)", marginTop: 18, maxWidth: 520, margin: "18px auto 0", lineHeight: 1.7 }}>
            Une question ? Un projet sur mesure ? Écrivez-nous, nous vous répondons sous 24h.
          </p>
        </div>

        {/* 2 columns: info + form */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          
          {/* ── LEFT: Contact Info Card ── */}
          <div style={{
            flex: 1.2,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20,
                background: "rgba(43,150,168,0.3)", border: "1px solid rgba(43,150,168,0.5)",
                alignSelf: "flex-start", marginBottom: 20,
              }}>
                <MessageCircle size={11} color="#A5F3FC" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#A5F3FC", letterSpacing: 1 }}>COORDONNÉES</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "white", marginBottom: 8, letterSpacing: "-0.5px" }}>
                Comment nous joindre
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                Que ce soit par téléphone, email ou en personne, notre équipe est là pour vous guider.
              </p>
            </div>

            <div style={{ padding: "8px 0" }}>
              {INFO.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "18px 28px",
                  borderBottom: i < INFO.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  transition: "background 0.15s",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: "rgba(43,150,168,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, color: "#A5F3FC",
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                      {item.label}
                    </p>
                    {item.href
                      ? <a href={item.href} style={{ fontSize: 15, fontWeight: 600, color: "white", textDecoration: "none", transition: "color 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#A5F3FC"} onMouseLeave={(e) => e.currentTarget.style.color = "white"}>{item.value}</a>
                      : <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>{item.value}</span>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Status badge */}
            <div style={{
              margin: "8px 28px 20px",
              padding: "14px 18px",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 16,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#22c55e", flexShrink: 0,
                boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
              }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 2 }}>Équipe disponible</p>
                <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>Réponse garantie sous 24h</p>
              </div>
            </div>

            <Link
              href="/contact"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                margin: "0 28px 28px",
                padding: "14px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: 0.5 }}>Page contact complète</span>
              <ArrowRight size={15} color="rgba(255,255,255,0.6)" />
            </Link>
          </div>

          {/* ── RIGHT: Form Card ── */}
          <div style={{
            flex: 1.8,
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20,
                background: "rgba(43,150,168,0.3)", border: "1px solid rgba(43,150,168,0.5)",
                alignSelf: "flex-start", marginBottom: 20,
              }}>
                <Send size={11} color="#A5F3FC" />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#A5F3FC", letterSpacing: 1 }}>FORMULAIRE RAPIDE</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: "white", marginBottom: 8, letterSpacing: "-0.5px" }}>
                Envoyez-nous un message
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                Remplissez le formulaire ci-dessous, nous vous recontacterons dans les plus brefs délais.
              </p>
            </div>

            <div style={{ padding: "28px 32px 32px" }}>
              {/* Form wrapper with custom styles */}
              <div className="contact-form-dark">
                <ContactFormInline ctaLabel={ctaLabel} successMsg={successMsg} />
              </div>
            </div>
          </div>
        </div>

        {/* Additional CTA banner */}
        <div style={{
          marginTop: 48,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 20,
          padding: "20px 28px",
          background: "rgba(43,150,168,0.12)",
          borderRadius: 24,
          border: "1px solid rgba(43,150,168,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: "rgba(43,150,168,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Phone size={22} color="#A5F3FC" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>Besoin d&apos;une réponse immédiate ?</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Appelez-nous directement au <strong style={{ color: "#A5F3FC" }}>{phone}</strong></p>
            </div>
          </div>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "12px 28px", borderRadius: 40,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white", fontSize: 13, fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Appeler maintenant <ArrowRight size={14} />
          </a>
        </div>
      </div>

      <style jsx>{`
        .section-title-light {
          font-size: 40px;
          font-weight: 900;
          color: white;
          letter-spacing: -1px;
        }
        
        /* Dark mode styles for ContactFormInline */
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
        
        @media (max-width: 900px) {
          .section-title-light { font-size: 32px; }
          div[style*="padding: 96px 72px"] { padding: 64px 24px !important; }
          div[style*="display: flex; gap: 32px"] { flex-direction: column; }
        }
        
        @media (max-width: 640px) {
          .section-title-light { font-size: 28px; }
        }
      `}</style>
    </section>
  );
}