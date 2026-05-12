import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { Metadata } from "next";
import TouristeNav from "@/app/components/touriste/TouristeNav";
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

/* ══ TYPES ══ */
interface ContactContent { key: string; value: string | null; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #0D1117; color: #fff; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  .fu  { animation: fadeUp .7s ease both; }
  .fi  { animation: fadeIn .6s ease both; }
  .fu1 { animation-delay:.08s; } .fu2 { animation-delay:.18s; }
  .fu3 { animation-delay:.28s; } .fu4 { animation-delay:.4s; }

  /* ── Hero ── */
  .contact-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;
  }

  /* Dark overlay sur l'image */
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(13,17,23,.72) 0%, rgba(13,17,23,.55) 40%, rgba(13,17,23,.88) 100%);
    z-index: 1;
  }
  .hero-bg {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
    z-index: 0;
    filter: brightness(.6);
  }

  /* ── Grain texture ── */
  .hero-grain {
    position: absolute; inset: 0; z-index: 2; opacity: .04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  /* ── Content wrapper ── */
  .hero-content {
    position: relative; z-index: 3;
    width: 100%; max-width: 1200px;
    margin: 0 auto;
    padding: 140px 40px 80px;
  }

  /* ── Title block ── */
  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(44px, 6vw, 80px);
    font-weight: 900;
    color: #fff;
    letter-spacing: -2.5px;
    line-height: 1.04;
    text-align: center;
    margin-bottom: 20px;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }
  .hero-sub {
    font-size: 17px; color: rgba(255,255,255,.65);
    text-align: center; line-height: 1.7;
    max-width: 480px; margin: 0 auto 64px;
  }

  /* ── Cards grid ── */
  .cards-grid {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }

  /* Glassmorphism card */
  .contact-card {
    background: rgba(255,255,255,.06);
    border: 1.5px solid rgba(255,255,255,.10);
    border-radius: 18px;
    padding: 28px 28px 32px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: background .2s, border-color .2s, transform .2s;
    display: flex; flex-direction: column; gap: 0;
  }
  .contact-card:hover {
    background: rgba(255,255,255,.09);
    border-color: rgba(255,255,255,.18);
    transform: translateY(-3px);
  }
  .contact-card.featured {
    background: rgba(2,175,207,.14);
    border-color: rgba(2,175,207,.35);
  }
  .contact-card.featured:hover {
    background: rgba(2,175,207,.20);
    border-color: rgba(2,175,207,.5);
  }

  /* Card badge */
  .card-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 11px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,.15);
    background: rgba(255,255,255,.07);
    font-size: 10px; font-weight: 800;
    color: rgba(255,255,255,.6);
    text-transform: uppercase; letter-spacing: 1.2px;
    margin-bottom: 22px; align-self: flex-start;
  }
  .card-badge.teal { border-color: rgba(2,175,207,.4); background: rgba(2,175,207,.12); color: #02AFCF; }

  /* Card icon */
  .card-icon {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px; flex-shrink: 0;
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 900; color: #fff;
    letter-spacing: -.5px; margin-bottom: 6px;
  }
  .card-subtitle {
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.5); margin-bottom: 16px;
  }
  .card-subtitle.teal { color: #02AFCF; }
  .card-desc {
    font-size: 14px; color: rgba(255,255,255,.55);
    line-height: 1.7; flex: 1; margin-bottom: 28px;
  }

  /* Card button */
  .card-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px;
    border-radius: 12px; font-size: 14px; font-weight: 700;
    text-decoration: none; cursor: pointer;
    transition: all .2s; border: none; font-family: inherit;
    width: 100%;
  }
  .card-btn.teal {
    background: #02AFCF; color: #fff;
    box-shadow: 0 4px 20px rgba(2,175,207,.35);
  }
  .card-btn.teal:hover { background: #00c4e8; box-shadow: 0 6px 28px rgba(2,175,207,.5); }
  .card-btn.dark {
    background: rgba(255,255,255,.10); color: #fff;
    border: 1.5px solid rgba(255,255,255,.15);
  }
  .card-btn.dark:hover { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.28); }

  /* ── Provider banner ── */
  .provider-banner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 28px;
    background: rgba(255,255,255,.05);
    border: 1.5px solid rgba(255,255,255,.10);
    border-radius: 14px;
    backdrop-filter: blur(10px);
    gap: 20px; flex-wrap: wrap;
  }
  .provider-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; background: rgba(255,255,255,.10);
    border: 1.5px solid rgba(255,255,255,.18);
    border-radius: 10px; color: #fff; font-size: 13px;
    font-weight: 700; text-decoration: none;
    transition: all .18s; white-space: nowrap; font-family: inherit;
  }
  .provider-btn:hover { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.35); }

  /* ── Info section ── */
  .info-section {
    background: #111827;
    padding: 80px 40px;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .info-grid {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start;
  }

  /* ── Contact info items ── */
  .info-item {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .info-item:last-child { border-bottom: none; }
  .info-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: rgba(2,175,207,.12); border: 1px solid rgba(2,175,207,.2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* ── Form ── */
  .form-wrap {
    background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 18px; padding: 36px;
  }

  /* ── Scrollbar ── */
  *::-webkit-scrollbar { width: 4px; }
  *::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }

  @media(max-width:960px){
    .cards-grid { grid-template-columns:1fr!important; }
    .info-grid  { grid-template-columns:1fr!important; gap:40px; }
  }
  @media(max-width:640px){
    .hero-content { padding:120px 20px 60px; }
    .contact-card { padding:22px; }
    .provider-banner { flex-direction:column; align-items:flex-start; }
    .info-section { padding:60px 20px; }
    .form-wrap { padding:24px; }
  }
`;

export default async function ContactPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase
    .from("contact_content")
    .select("key, value");

  const c = Object.fromEntries(
    (rows as ContactContent[] | null ?? []).map(r => [r.key, r.value ?? ""])
  );

  const heroTitle   = c.hero_title   || "Contactez-nous";
  const heroSub     = c.hero_subtitle || "Une question, une suggestion ? Notre équipe vous répond sous 24h.";
  const bgImage     = c.bg_image     || "";
  const email       = c.email        || "contact@voyajaime.tn";
  const phone       = c.phone        || "+216 XX XXX XXX";
  const address     = c.address      || "Tunis, Tunisie";
  const hours       = c.hours        || "Lun–Ven : 9h–18h";
  const ctaLabel    = c.cta_label    || "Envoyer le message";
  const successMsg  = c.success_msg  || "Message envoyé ! Nous vous répondrons sous 24h.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contactez VoyajAime",
    url: "https://voyajaime.tn/contact",
    description: heroSub,
  };

  return (
    <>
      <style>{CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TouristeNav />

      {/* ══ HERO DARK ══ */}
      <section className="contact-hero">
        {/* BG image */}
        <div
          className="hero-bg"
          style={{ backgroundImage: bgImage ? `url(${bgImage})` : "url('/images/contact-bg.jpg')" }}
        />
        <div className="hero-overlay" />
        <div className="hero-grain" />

        <div className="hero-content">
          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" style={{ marginBottom: 48, textAlign: "center" }}>
            <ol style={{ display: "flex", gap: 8, listStyle: "none", fontSize: 12, color: "rgba(255,255,255,.4)", justifyContent: "center" }}>
              <li><Link href="/" style={{ color: "rgba(255,255,255,.4)", textDecoration: "none" }}>Accueil</Link></li>
              <li style={{ color: "rgba(255,255,255,.2)" }}>›</li>
              <li style={{ color: "rgba(255,255,255,.7)", fontWeight: 600 }}>Contact</li>
            </ol>
          </nav>

          {/* Title */}
          <h1 className="hero-title fu fu1">{heroTitle}</h1>
          <p  className="hero-sub fu fu2">{heroSub}</p>

          {/* ── 3 cartes ── */}
          <div className="cards-grid fu fu3">

            {/* Carte 1 — Formulaire (featured) */}
            <div className="contact-card featured">
              <span className="card-badge teal">
                <Mail size={9}/> Contact direct
              </span>
              <div className="card-icon" style={{ background: "rgba(2,175,207,.18)", border: "1px solid rgba(2,175,207,.3)" }}>
                <Mail size={22} color="#02AFCF" strokeWidth={1.8}/>
              </div>
              <p className="card-title">Écrivez-nous</p>
              <p className="card-subtitle teal">Réponse sous 24h</p>
              <p className="card-desc">
                Envoyez-nous un message directement depuis cette page. Notre équipe vous répond rapidement avec une réponse personnalisée.
              </p>
              <a href="#contact-form" className="card-btn teal">
                Envoyer un message <span>→</span>
              </a>
            </div>

            {/* Carte 2 — Email/Téléphone */}
            <div className="contact-card">
              <span className="card-badge">
                <Phone size={9}/> Coordonnées
              </span>
              <div className="card-icon" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)" }}>
                <Phone size={22} color="rgba(255,255,255,.7)" strokeWidth={1.8}/>
              </div>
              <p className="card-title">Par téléphone</p>
              <p className="card-subtitle">Appel ou WhatsApp</p>
              <p className="card-desc">
                {phone}<br/>
                {hours}
              </p>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="card-btn dark">
                Appeler maintenant <span>→</span>
              </a>
            </div>

            {/* Carte 3 — Email */}
            <div className="contact-card">
              <span className="card-badge">
                <MapPin size={9}/> Email
              </span>
              <div className="card-icon" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)" }}>
                <Mail size={22} color="rgba(255,255,255,.7)" strokeWidth={1.8}/>
              </div>
              <p className="card-title">Par email</p>
              <p className="card-subtitle">Réponse sous 24h</p>
              <p className="card-desc">
                {email}<br/>
                Pour toute demande d'information ou de partenariat.
              </p>
              <a href={`mailto:${email}`} className="card-btn dark">
                Envoyer un email <span>→</span>
              </a>
            </div>
          </div>

          {/* ── Banner prestataire ── */}
          <div className="provider-banner fu fu4">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={18} color="rgba(255,255,255,.6)" strokeWidth={1.8}/>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Vous êtes prestataire ?</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>Listez vos excursions sur VoyajAime et touchez des milliers de voyageurs.</p>
              </div>
            </div>
            <Link href="/prestataire/inscription" className="provider-btn">
              Inscrivez votre activité <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ INFO + FORMULAIRE ══ */}
      <section className="info-section" id="contact-form">
        <div className="info-grid">

          {/* Infos de contact */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 16 }}>Nos coordonnées</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,3vw,38px)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 40 }}>
              Nous sommes là pour vous
            </h2>

            {[
              { icon: <Mail size={18} color="#02AFCF" strokeWidth={1.8}/>, label: "Email", value: email, href: `mailto:${email}` },
              { icon: <Phone size={18} color="#02AFCF" strokeWidth={1.8}/>, label: "Téléphone", value: phone, href: `tel:${phone.replace(/\s/g,"")}` },
              { icon: <MapPin size={18} color="#02AFCF" strokeWidth={1.8}/>, label: "Adresse", value: address, href: undefined },
              { icon: <Clock size={18} color="#02AFCF" strokeWidth={1.8}/>, label: "Horaires", value: hours, href: undefined },
            ].map((item, i) => (
              <div key={i} className="info-item">
                <div className="info-icon">{item.icon}</div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>{item.label}</p>
                  {item.href
                    ? <a href={item.href} style={{ fontSize: 15, fontWeight: 600, color: "#fff", textDecoration: "none" }}>{item.value}</a>
                    : <p style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{item.value}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire client */}
          <div className="form-wrap">
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 10 }}>Formulaire de contact</p>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 28, letterSpacing: "-.5px" }}>
              Envoyez-nous un message
            </h3>
            <ContactForm ctaLabel={ctaLabel} successMsg={successMsg} />
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#0D1117", borderTop: "1px solid rgba(255,255,255,.06)", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <p style={{ color: "rgba(255,255,255,.25)", fontSize: 13 }}>© 2026 VoyajAime — Tourisme authentique en Tunisie</p>
        <div style={{ display: "flex", gap: 24 }}>
          <Link href="/excursions" style={{ color: "rgba(255,255,255,.35)", fontSize: 13, textDecoration: "none" }}>Excursions →</Link>
          <Link href="/a-propos"   style={{ color: "rgba(255,255,255,.35)", fontSize: 13, textDecoration: "none" }}>À propos →</Link>
        </div>
      </footer>
    </>
  );
}