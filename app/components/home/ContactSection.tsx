import Link from "next/link";
import { Mail, Phone, ArrowRight, MessageSquare } from "lucide-react";

interface ContactSectionProps {
  email?: string;
  phone?: string;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Home contact section ── */
  .hcs-wrap {
    position: relative; overflow: hidden;
    background: #0D1117;
    padding: 96px 40px;
  }

  /* Subtle grain */
  .hcs-grain {
    position: absolute; inset: 0; opacity: .03; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .hcs-inner {
    position: relative; z-index: 1;
    max-width: 1160px; margin: 0 auto;
  }

  /* Header */
  .hcs-header {
    text-align: center; margin-bottom: 56px;
  }
  .hcs-eyebrow {
    font-size: 11px; font-weight: 800; color: rgba(255,255,255,.35);
    text-transform: uppercase; letter-spacing: 2.5px;
    display: block; margin-bottom: 14px;
  }
  .hcs-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 3.5vw, 44px);
    font-weight: 900; color: #fff;
    letter-spacing: -1.2px; line-height: 1.1;
    max-width: 480px; margin: 0 auto 14px;
  }
  .hcs-sub {
    font-size: 16px; color: rgba(255,255,255,.45);
    line-height: 1.7; max-width: 400px; margin: 0 auto;
  }

  /* Cards */
  .hcs-grid {
    display: grid; grid-template-columns: 1.15fr 1fr 1fr; gap: 14px;
    margin-bottom: 20px;
  }

  .hcs-card {
    background: rgba(255,255,255,.05);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 16px; padding: 26px;
    display: flex; flex-direction: column; gap: 0;
    transition: background .2s, border-color .2s, transform .2s;
    text-decoration: none; color: inherit;
  }
  .hcs-card:hover {
    background: rgba(255,255,255,.08);
    border-color: rgba(255,255,255,.15);
    transform: translateY(-3px);
  }
  .hcs-card.accent {
    background: rgba(2,175,207,.12);
    border-color: rgba(2,175,207,.28);
  }
  .hcs-card.accent:hover {
    background: rgba(2,175,207,.18);
    border-color: rgba(2,175,207,.45);
  }

  .hcs-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.05);
    font-size: 9.5px; font-weight: 800;
    color: rgba(255,255,255,.45);
    text-transform: uppercase; letter-spacing: 1px;
    margin-bottom: 18px; align-self: flex-start;
  }
  .hcs-badge.teal { border-color: rgba(2,175,207,.35); background: rgba(2,175,207,.1); color: #02AFCF; }

  .hcs-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px; flex-shrink: 0;
  }

  .hcs-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px; font-weight: 900; color: #fff;
    letter-spacing: -.3px; margin-bottom: 5px;
  }
  .hcs-card-sub {
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,.4); margin-bottom: 14px;
  }
  .hcs-card-sub.teal { color: #02AFCF; }
  .hcs-card-desc {
    font-size: 13px; color: rgba(255,255,255,.45);
    line-height: 1.68; flex: 1; margin-bottom: 22px;
  }

  .hcs-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-radius: 10px;
    font-size: 13px; font-weight: 700;
    text-decoration: none; transition: all .18s;
    border: none; font-family: inherit; cursor: pointer; width: 100%;
  }
  .hcs-btn.teal { background:#02AFCF; color:#fff; box-shadow:0 3px 14px rgba(2,175,207,.3); }
  .hcs-btn.teal:hover { background:#00c4e8; }
  .hcs-btn.ghost { background:rgba(255,255,255,.08); color:#fff; border:1.5px solid rgba(255,255,255,.12); }
  .hcs-btn.ghost:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.22); }

  /* Provider bar */
  .hcs-provider {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px;
    background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 12px; gap: 16px; flex-wrap: wrap;
  }
  .hcs-provider-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; background: rgba(255,255,255,.08);
    border: 1.5px solid rgba(255,255,255,.15);
    border-radius: 9px; color: #fff;
    font-size: 13px; font-weight: 700;
    text-decoration: none; transition: all .18s;
    white-space: nowrap; font-family: inherit;
  }
  .hcs-provider-btn:hover { background:rgba(255,255,255,.15); border-color:rgba(255,255,255,.28); }

  @media(max-width:880px){
    .hcs-grid { grid-template-columns:1fr!important; }
    .hcs-provider { flex-direction:column; align-items:flex-start; }
    .hcs-wrap { padding:64px 20px; }
  }
`;

export default function ContactSection({ email, phone }: ContactSectionProps) {
  return (
    <section aria-labelledby="hcs-heading">
      <style>{CSS}</style>
      <div className="hcs-wrap">
        <div className="hcs-grain" />
        <div className="hcs-inner">

          {/* Header */}
          <div className="hcs-header">
            <span className="hcs-eyebrow">Nous contacter</span>
            <h2 id="hcs-heading" className="hcs-title">
              Une question sur votre voyage ?
            </h2>
            <p className="hcs-sub">
              Trois façons de nous joindre — choisissez celle qui vous correspond.
            </p>
          </div>

          {/* 3 cartes */}
          <div className="hcs-grid">

            {/* Formulaire */}
            <Link href="/contact#contact-form" className="hcs-card accent">
              <span className="hcs-badge teal"><Mail size={8}/> Contact direct</span>
              <div className="hcs-icon" style={{ background:"rgba(2,175,207,.15)", border:"1px solid rgba(2,175,207,.25)" }}>
                <MessageSquare size={20} color="#02AFCF" strokeWidth={1.8}/>
              </div>
              <p className="hcs-card-title">Écrivez-nous</p>
              <p className="hcs-card-sub teal">Réponse sous 24h</p>
              <p className="hcs-card-desc">
                Envoyez-nous votre question directement. Notre équipe vous répond avec une réponse personnalisée.
              </p>
              <span className="hcs-btn teal">
                Envoyer un message <ArrowRight size={13}/>
              </span>
            </Link>

            {/* Téléphone */}
            <Link href={phone ? `tel:${phone.replace(/\s/g,"")}` : "/contact"} className="hcs-card">
              <span className="hcs-badge">Appel direct</span>
              <div className="hcs-icon" style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)" }}>
                <Phone size={20} color="rgba(255,255,255,.65)" strokeWidth={1.8}/>
              </div>
              <p className="hcs-card-title">Par téléphone</p>
              <p className="hcs-card-sub">Appel ou WhatsApp</p>
              <p className="hcs-card-desc">
                {phone || "+216 XX XXX XXX"}<br/>
                Lun–Ven : 9h–18h
              </p>
              <span className="hcs-btn ghost">
                Appeler maintenant <ArrowRight size={13}/>
              </span>
            </Link>

            {/* Email */}
            <Link href={email ? `mailto:${email}` : "/contact"} className="hcs-card">
              <span className="hcs-badge">Email</span>
              <div className="hcs-icon" style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)" }}>
                <Mail size={20} color="rgba(255,255,255,.65)" strokeWidth={1.8}/>
              </div>
              <p className="hcs-card-title">Par email</p>
              <p className="hcs-card-sub">Réponse sous 24h</p>
              <p className="hcs-card-desc">
                {email || "contact@voyajaime.tn"}<br/>
                Pour toute demande ou partenariat.
              </p>
              <span className="hcs-btn ghost">
                Envoyer un email <ArrowRight size={13}/>
              </span>
            </Link>
          </div>

          {/* Banner prestataire */}
          <div className="hcs-provider">
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Mail size={16} color="rgba(255,255,255,.5)" strokeWidth={1.8}/>
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:3 }}>Vous êtes prestataire ?</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>Listez vos excursions sur VoyajAime et touchez des milliers de voyageurs.</p>
              </div>
            </div>
            <Link href="/prestataire/inscription" className="hcs-provider-btn">
              Inscrivez votre activité <ArrowRight size={13}/>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}