import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { Heart, ShieldCheck, Globe, Star, ArrowRight, MapPin, Users } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";

/* ══ SEO ══ */
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("about_content")
    .select("title, subtitle")
    .eq("section", "hero")
    .single();
  return {
    title: data?.title ? `${data.title} — À propos | VoyajAime` : "À propos de VoyajAime — Tourisme authentique en Tunisie",
    description: data?.subtitle ?? "Découvrez VoyajAime, la plateforme qui connecte les voyageurs avec les meilleures excursions et prestataires locaux de Tunisie.",
    openGraph: { title: data?.title ?? "À propos de VoyajAime", description: data?.subtitle ?? "Tourisme authentique en Tunisie", type: "website" },
    alternates: { canonical: "/a-propos" },
  };
}

/* ══ TYPES ══ */
interface Section {
  id: string; section: string; title: string | null; subtitle: string | null;
  content: string | null; image_url: string | null; is_active: boolean;
  position: number; meta: Record<string, unknown>;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart:  <Heart  size={20} color="#fff" strokeWidth={1.8} />,
  shield: <ShieldCheck size={20} color="#fff" strokeWidth={1.8} />,
  globe:  <Globe  size={20} color="#fff" strokeWidth={1.8} />,
  star:   <Star   size={20} color="#fff" strokeWidth={1.8} />,
  map:    <MapPin size={20} color="#fff" strokeWidth={1.8} />,
  users:  <Users  size={20} color="#fff" strokeWidth={1.8} />,
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #ffffff; color: #111827; }

  /* ══════════════════════════════
     ANIMATIONS
  ══════════════════════════════ */
  @keyframes heroFadeUp {
    from { opacity:0; transform:translateY(36px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes heroSlideRight {
    from { opacity:0; transform:translateX(-28px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes heroImgReveal {
    from { opacity:0; transform:translateY(24px) scale(.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes heroBadgeIn {
    from { opacity:0; transform:translateX(-16px) scale(.9); }
    to   { opacity:1; transform:translateX(0) scale(1); }
  }
  @keyframes dotPulse   { 0%,100%{opacity:1;transform:scale(1);}  50%{opacity:.4;transform:scale(.75);} }
  @keyframes dotPulse2  { 0%,100%{opacity:.4;transform:scale(.75);} 50%{opacity:1;transform:scale(1);}  }
  @keyframes ctaPulse {
    0%,100% { box-shadow:0 4px 20px rgba(2,175,207,.35); }
    50%     { box-shadow:0 8px 36px rgba(2,175,207,.6); }
  }
  @keyframes countUp {
    from { opacity:0; transform:translateY(16px) scale(.85); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes revealUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes lineGrow {
    from { transform:scaleX(0); }
    to   { transform:scaleX(1); }
  }

  /* ══════════════════════════════
     SCROLL REVEAL
  ══════════════════════════════ */
  .reveal {
    opacity:0;
    transform:translateY(28px);
    transition:opacity .65s ease, transform .65s ease;
  }
  .reveal.visible {
    opacity:1;
    transform:translateY(0);
  }
  .reveal-delay-1 { transition-delay:.08s; }
  .reveal-delay-2 { transition-delay:.16s; }
  .reveal-delay-3 { transition-delay:.24s; }
  .reveal-delay-4 { transition-delay:.32s; }

  /* ══════════════════════════════
     HERO
  ══════════════════════════════ */
  .hero-badge {
    display:inline-flex; align-items:center; gap:8px;
    padding:7px 16px;
    background:linear-gradient(135deg,#EFF9FC,#D6F3FA);
    border:1px solid #A7E3F0; border-radius:24px;
    font-size:11px; font-weight:700; color:#053366;
    letter-spacing:.6px; text-transform:uppercase; margin-bottom:18px;
    animation:heroBadgeIn .55s cubic-bezier(.34,1.56,.64,1) both;
  }
  .hero-badge-dot {
    width:7px; height:7px; border-radius:50%; background:#02AFCF;
    animation:dotPulse 1.8s infinite;
    display:inline-block;
  }
  .hero-badge-dot2 {
    width:5px; height:5px; border-radius:50%; background:#02AFCF; opacity:.5;
    animation:dotPulse2 1.8s infinite;
    display:inline-block; margin-left:-2px;
  }

  .hero-title {
    font-family:'Playfair Display',serif;
    font-size:clamp(26px,5vw,64px);
    font-weight:900; color:#053366;
    letter-spacing:-1.5px; line-height:1.06;
    margin-bottom:20px;
    animation:heroFadeUp .7s .1s ease both;
  }
  .hero-sub {
    font-size:16px; color:#6B7280; line-height:1.72;
    max-width:480px; margin-bottom:24px;
    animation:heroFadeUp .7s .22s ease both;
  }
  .hero-content-wrap {
    animation:heroSlideRight .7s .05s ease both;
  }
  .hero-img-frame {
    border-radius:18px; overflow:hidden;
    border:1px solid #E5E7EB;
    box-shadow:0 28px 72px rgba(5,51,102,.10),0 6px 20px rgba(5,51,102,.07);
    animation:heroImgReveal .8s .15s cubic-bezier(.34,1.56,.64,1) both;
    transition:transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s;
  }
  .hero-img-frame:hover {
    transform:translateY(-7px) scale(1.012);
    box-shadow:0 36px 80px rgba(5,51,102,.14),0 10px 28px rgba(5,51,102,.09);
  }
  .hero-img-frame img {
    display:block; width:100%; object-fit:cover;
    transition:transform .5s ease;
  }
  .hero-img-frame:hover img { transform:scale(1.04); }

  /* ══════════════════════════════
     RICH CONTENT
  ══════════════════════════════ */
  .rich-content p          { margin-bottom:14px; line-height:1.85; font-size:16px; color:#4B5563; }
  .rich-content h1         { font-family:'Playfair Display',serif; font-size:28px; font-weight:900; color:#111827; margin-bottom:14px; }
  .rich-content h2         { font-family:'Playfair Display',serif; font-size:21px; font-weight:700; color:#111827; margin-bottom:10px; }
  .rich-content ul         { padding-left:20px; margin-bottom:14px; }
  .rich-content ul li      { margin-bottom:6px; line-height:1.75; color:#4B5563; }
  .rich-content blockquote { border-left:3px solid #02AFCF; padding:12px 18px; background:#EFF9FC; border-radius:0 8px 8px 0; margin:16px 0; font-style:italic; color:#6B7280; }
  .rich-content a          { color:#02AFCF; text-decoration:underline; text-underline-offset:2px; }
  .rich-content strong     { font-weight:700; color:#053366; }
  .rich-content hr         { border:none; border-top:1px solid #E5E7EB; margin:20px 0; }

  /* ══════════════════════════════
     DIVIDER ACCENT
  ══════════════════════════════ */
  .divider {
    width:32px; height:2px; background:#111827; border-radius:2px;
    display:inline-block;
  }
  .divider-accent {
    width:32px; height:2px; border-radius:2px;
    background:linear-gradient(90deg,#02AFCF,#053366);
    display:inline-block;
    transform-origin:left;
    animation:lineGrow .5s ease both;
  }

  /* ══════════════════════════════
     STAT CARDS
  ══════════════════════════════ */
  .stat-card {
    text-align:center; padding:28px 16px;
    border-radius:14px; background:#ffffff;
    border:1px solid #E5E7EB;
    position:relative; overflow:hidden;
    cursor:default;
    transition:transform .35s cubic-bezier(.34,1.56,.64,1), border-color .3s, box-shadow .3s;
  }
  .stat-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg,#02AFCF,#053366);
    transform:scaleX(0); transform-origin:left;
    transition:transform .4s ease;
  }
  .stat-card::after {
    content:''; position:absolute; bottom:-60px; right:-60px;
    width:120px; height:120px; border-radius:50%;
    background:rgba(2,175,207,.05);
    transition:all .5s ease;
  }
  .stat-card:hover {
    transform:translateY(-8px);
    border-color:#02AFCF;
    box-shadow:0 18px 44px rgba(2,175,207,.13),0 4px 14px rgba(2,175,207,.08);
  }
  .stat-card:hover::before { transform:scaleX(1); }
  .stat-card:hover::after  { width:280px; height:280px; bottom:-110px; right:-110px; }

  .stat-card:nth-child(1) { animation:countUp .55s .10s ease both; }
  .stat-card:nth-child(2) { animation:countUp .55s .20s ease both; }
  .stat-card:nth-child(3) { animation:countUp .55s .30s ease both; }
  .stat-card:nth-child(4) { animation:countUp .55s .40s ease both; }

  /* ══════════════════════════════
     VALUE CARDS
  ══════════════════════════════ */
  .value-card {
    padding:24px; border-radius:14px;
    background:white; border:1.5px solid #E5E7EB;
    position:relative; overflow:hidden;
    cursor:default;
    transition:transform .35s cubic-bezier(.34,1.56,.64,1), border-color .3s, box-shadow .3s;
  }
  .value-card::after {
    content:''; position:absolute; bottom:-50px; right:-50px;
    width:100px; height:100px; border-radius:50%;
    background:rgba(2,175,207,.06);
    transition:all .5s ease;
  }
  .value-card:hover {
    border-color:#02AFCF;
    transform:translateY(-6px) scale(1.018);
    box-shadow:0 14px 38px rgba(2,175,207,.12);
  }
  .value-card:hover::after { width:260px; height:260px; bottom:-100px; right:-100px; }

  .value-icon-wrap {
    width:46px; height:46px; border-radius:11px;
    background:#02AFCF;
    display:flex; align-items:center; justify-content:center; margin-bottom:16px;
    transition:transform .35s cubic-bezier(.34,1.56,.64,1), background .3s;
    box-shadow:0 4px 12px rgba(2,175,207,.28);
  }
  .value-card:hover .value-icon-wrap {
    background:#053366;
    transform:scale(1.14) rotate(-7deg);
    box-shadow:0 6px 18px rgba(5,51,102,.22);
  }

  /* ══════════════════════════════
     TEAM CARDS
  ══════════════════════════════ */
  .team-card {
    background:white; border-radius:14px; overflow:hidden;
    border:1px solid #E5E7EB;
    transition:transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s, border-color .3s;
  }
  .team-card:hover {
    transform:translateY(-10px);
    box-shadow:0 28px 64px rgba(5,51,102,.12),0 6px 18px rgba(5,51,102,.07);
    border-color:#C8EDF5;
  }
  .team-card .photo-wrap { overflow:hidden; }
  .team-card .photo-wrap img { transition:transform .5s ease; display:block; }
  .team-card:hover .photo-wrap img { transform:scale(1.06); }
  .team-card-avatar {
    width:100%; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,#E0F7FC,#EEF2FF);
    transition:background .3s;
  }
  .team-card:hover .team-card-avatar { background:linear-gradient(135deg,#D0F2F9,#E0E7FF); }

  /* ══════════════════════════════
     CTA BUTTON
  ══════════════════════════════ */
  .cta-btn {
    display:inline-flex; align-items:center; gap:10px;
    padding:14px 28px; background:#02AFCF; color:white;
    border-radius:12px; font-size:15px; font-weight:700;
    text-decoration:none;
    transition:all .3s cubic-bezier(.34,1.56,.64,1);
    letter-spacing:-.1px;
    animation:ctaPulse 2.8s infinite;
  }
  .cta-btn:hover {
    background:#053366;
    transform:translateY(-3px) scale(1.04);
    gap:16px;
    box-shadow:0 10px 30px rgba(5,51,102,.28);
    animation:none;
  }

  /* ══════════════════════════════
     SECTION LABEL
  ══════════════════════════════ */
  .section-label {
    font-size:11px; font-weight:800; color:#9CA3AF;
    text-transform:uppercase; letter-spacing:2.5px;
  }

  /* ══════════════════════════════
     HERO TEXT CARD
  ══════════════════════════════ */
  .hero-text-card {
    background:#ffffff;
    border:1.5px solid #E5E7EB;
    border-radius:20px;
    padding:36px 32px 32px;
    position:relative;
    overflow:hidden;
    box-shadow:0 8px 32px rgba(5,51,102,.07),0 2px 8px rgba(5,51,102,.04);
    animation:heroSlideRight .7s .05s ease both;
  }
  .hero-text-card::before {
    content:'';
    position:absolute; top:0; left:0;
    width:80px; height:80px;
    background:linear-gradient(135deg,rgba(2,175,207,.12),transparent);
    border-radius:0 0 80px 0;
    pointer-events:none;
  }
  .hero-text-card::after {
    content:'';
    position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg,#02AFCF,#053366,transparent);
    border-radius:20px 20px 0 0;
  }

  /* ══════════════════════════════
     MISSION CARD
  ══════════════════════════════ */
  .mission-card {
    background:#ffffff;
    border:1.5px solid #E5E7EB;
    border-radius:20px;
    padding:40px 36px 36px;
    position:relative;
    overflow:hidden;
    box-shadow:0 10px 36px rgba(5,51,102,.07),0 2px 10px rgba(5,51,102,.04);
    transition:box-shadow .3s, border-color .3s;
  }
  .mission-card:hover {
    border-color:#C8EDF5;
    box-shadow:0 16px 48px rgba(2,175,207,.10),0 4px 16px rgba(2,175,207,.06);
  }
  .mission-card::before {
    content:'';
    position:absolute; top:0; bottom:0; left:0; width:4px;
    background:linear-gradient(180deg,#02AFCF,#053366);
    border-radius:20px 0 0 20px;
  }
  .mission-card::after {
    content:'';
    position:absolute; bottom:-80px; right:-80px;
    width:220px; height:220px; border-radius:50%;
    background:radial-gradient(circle,rgba(2,175,207,.07) 0%,transparent 70%);
    pointer-events:none;
    transition:all .5s ease;
  }
  .mission-card:hover::after {
    width:300px; height:300px; bottom:-120px; right:-120px;
  }

  .mission-line {
    width:48px; height:3px; border-radius:2px;
    background:linear-gradient(90deg,#02AFCF,#053366);
    margin-bottom:20px;
    transform-origin:left;
  }
  .mission-line.visible { animation:lineGrow .6s .1s ease both; }

  /* ══════════════════════════════
     LAYOUT GRIDS — Base
  ══════════════════════════════ */
  .hero-grid {
    display:grid;
    gap:48px;
    align-items:center;
  }
  .stats-grid {
    display:grid;
    gap:16px;
  }
  .values-grid {
    display:grid;
    gap:16px;
  }
  .team-grid {
    display:grid;
    gap:20px;
  }
  .footer-inner {
    display:flex;
    justify-content:space-between;
    align-items:center;
    flex-wrap:wrap;
    gap:12px;
  }

  /* ══════════════════════════════
     RESPONSIVE — Tablette ≤ 900px
  ══════════════════════════════ */
  @media (max-width: 900px) {
    .hero-section  { padding: 64px 28px !important; }
    .hero-grid     { grid-template-columns: 1fr !important; gap: 28px !important; }
    .hero-img-frame { height: 280px !important; }
    .hero-img-frame img { height: 280px !important; }
    .hero-sub      { max-width: 100% !important; }

    .mission-section { padding: 64px 28px !important; }
    .mission-card    { padding: 32px 28px 28px !important; }

    .stats-section { padding: 60px 28px !important; }
    .stats-grid    { grid-template-columns: repeat(2, 1fr) !important; }

    .values-section { padding: 64px 28px !important; }
    .values-grid    { grid-template-columns: repeat(2, 1fr) !important; }

    .team-section  { padding: 64px 28px !important; }
    .team-grid     { grid-template-columns: repeat(2, 1fr) !important; }

    .cta-section   { padding: 72px 28px !important; }

    .footer-inner  { flex-direction: column; align-items: flex-start; }
  }

  /* ══════════════════════════════
     RESPONSIVE — Mobile ≤ 640px
  ══════════════════════════════ */
  @media (max-width: 640px) {
    /* Hero */
    .hero-section     { padding: 40px 16px !important; }
    .hero-text-card   { padding: 22px 18px 20px !important; border-radius: 16px !important; }
    .hero-title       { font-size: clamp(24px, 7vw, 34px) !important; letter-spacing: -1px !important; margin-bottom: 12px !important; }
    .hero-sub         { font-size: 15px !important; margin-bottom: 16px !important; }
    .hero-badge       { font-size: 10px !important; padding: 5px 11px !important; margin-bottom: 12px !important; }
    .hero-img-frame   { height: 210px !important; border-radius: 14px !important; }
    .hero-img-frame img { height: 210px !important; }

    /* Mission */
    .mission-section  { padding: 40px 16px !important; }
    .mission-card     { padding: 22px 18px 20px !important; border-radius: 16px !important; }

    /* Stats */
    .stats-section    { padding: 40px 16px !important; }
    .stats-grid       { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
    .stat-card        { padding: 20px 12px !important; }
    .stat-value       { font-size: 32px !important; }

    /* Values */
    .values-section   { padding: 40px 16px !important; }
    .values-grid      { grid-template-columns: 1fr !important; gap: 10px !important; }
    .value-card       { padding: 18px !important; }

    /* Team */
    .team-section     { padding: 40px 16px !important; }
    .team-grid        { grid-template-columns: 1fr !important; gap: 14px !important; }
    .team-photo-wrap  { height: 190px !important; }
    .team-photo-wrap img { height: 190px !important; }
    .team-card-avatar { height: 190px !important; }

    /* CTA */
    .cta-section      { padding: 52px 16px !important; }
    .cta-btn          { width: 100%; justify-content: center; padding: 13px 18px !important; font-size: 14px !important; }

    /* Misc */
    .section-label    { font-size: 10px !important; letter-spacing: 2px !important; }
    .rich-content p   { font-size: 15px !important; }

    /* Footer */
    footer            { padding: 18px 16px !important; }
    .footer-inner     { flex-direction: column; align-items: flex-start; gap: 10px; }
    .footer-links     { flex-direction: column !important; gap: 8px !important; }
  }

  /* ══════════════════════════════
     RESPONSIVE — Très petit ≤ 380px
  ══════════════════════════════ */
  @media (max-width: 380px) {
    .hero-title  { font-size: 22px !important; letter-spacing: -.5px !important; }
    .stats-grid  { grid-template-columns: 1fr !important; }
    .stat-value  { font-size: 28px !important; }
    .team-grid   { grid-template-columns: 1fr !important; }
  }
`;

const SCROLL_REVEAL_SCRIPT = `
(function(){
  var els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){
    els.forEach(function(e){ e.classList.add('visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  },{ threshold:0.13, rootMargin:'0px 0px -40px 0px' });
  els.forEach(function(e){ io.observe(e); });
})();
`;

export default async function AboutPage() {
  const supabase = await createServerSupabaseClient();

  const { data: sections } = await supabase
    .from("about_content")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  const get = (s: string) => sections?.find((x: Section) => x.section === s) as Section | undefined;
  const hero    = get("hero");
  const mission = get("mission");
  const stats   = get("stats");
  const values  = get("values");
  const team    = get("team");
  const cta     = get("cta");

  const jsonLd = {
    "@context":"https://schema.org","@type":"TravelAgency",
    name:"VoyajAime", description: hero?.subtitle ?? "Tourisme authentique en Tunisie",
    url:"https://voyajaime.tn/a-propos", foundingDate:"2024",
    areaServed:{ "@type":"Country", name:"Tunisie" },
  };

  return (
    <>
      <style>{CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TouristeNav />
      <div style={{ paddingTop: 64 }} />

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      {hero && (
        <section
          aria-label="Présentation"
          className="hero-section"
          style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "88px 40px" }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div
              className="hero-grid"
              style={{
                gridTemplateColumns: hero.image_url ? "1fr 1fr" : "1fr",
                maxWidth: hero.image_url ? "100%" : 720,
              }}
            >
              {/* Texte */}
              <div className="hero-text-card">
                <div className="hero-badge">
                  <span className="hero-badge-dot" />
                  <span className="hero-badge-dot2" />
                  À propos de VoyajAime
                </div>

                <h1 className="hero-title">{hero.title}</h1>

                {hero.subtitle && (
                  <p className="hero-sub">{hero.subtitle}</p>
                )}

                {hero.content && (
                  <div
                    className="rich-content"
                    style={{ animation: "heroFadeUp .7s .34s ease both", opacity: 0, animationFillMode: "forwards" }}
                    dangerouslySetInnerHTML={{ __html: hero.content }}
                  />
                )}
              </div>

              {/* Image */}
              {hero.image_url && (
                <div className="hero-img-frame" style={{ height: 400 }}>
                  <img
                    src={hero.image_url}
                    alt={hero.title ?? "VoyajAime"}
                    style={{ height: 400, width: "100%" }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          MISSION
      ══════════════════════════════ */}
      {mission && (
        <section
          aria-labelledby="mission-heading"
          className="reveal mission-section"
          style={{ padding: "88px 40px", background: "#F9FAFB" }}
        >
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div className="mission-card">
              <div className="mission-line reveal" style={{ marginBottom: 14 }} />

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <p className="section-label">Notre mission</p>
              </div>

              {mission.title && (
                <h2
                  id="mission-heading"
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "clamp(20px,3vw,40px)",
                    fontWeight: 900, color: "#053366",
                    letterSpacing: "-1px", marginBottom: 12, lineHeight: 1.12,
                  }}
                >
                  {mission.title}
                </h2>
              )}
              {mission.subtitle && (
                <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 24, lineHeight: 1.65 }}>
                  {mission.subtitle}
                </p>
              )}
              {mission.content && (
                <div className="rich-content" dangerouslySetInnerHTML={{ __html: mission.content }} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          STATS
      ══════════════════════════════ */}
      {stats && (stats.meta?.items as { value: string; label: string }[])?.length > 0 && (
        <section
          aria-labelledby="stats-heading"
          className="reveal stats-section"
          style={{ padding: "80px 40px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {stats.title && (
              <h2
                id="stats-heading"
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, color: "#053366",
                  textAlign: "center", marginBottom: 36, letterSpacing: "-.5px",
                }}
              >
                {stats.title}
              </h2>
            )}
            <div
              className="stats-grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min((stats.meta.items as []).length, 4)},1fr)`,
              }}
            >
              {(stats.meta.items as { value: string; label: string }[]).map((item, i) => (
                <div key={i} className="stat-card">
                  <p
                    className="stat-value"
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 44, fontWeight: 900, color: "#053366",
                      marginBottom: 8, lineHeight: 1,
                    }}
                  >
                    {item.value}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          VALEURS
      ══════════════════════════════ */}
      {values && (values.meta?.items as { icon: string; title: string; text: string }[])?.length > 0 && (
        <section
          aria-labelledby="values-heading"
          className="reveal values-section"
          style={{ padding: "88px 40px", background: "#ffffff" }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 14 }}>
                <div className="divider" />
                <p className="section-label">Ce qui nous guide</p>
                <div className="divider" />
              </div>
              {values.title && (
                <h2
                  id="values-heading"
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "clamp(20px,3vw,40px)",
                    fontWeight: 900, color: "#053366",
                    letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 10,
                  }}
                >
                  {values.title}
                </h2>
              )}
              {values.subtitle && (
                <p style={{ fontSize: 16, color: "#6B7280", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
                  {values.subtitle}
                </p>
              )}
            </div>

            <div
              className="values-grid"
              style={{
                gridTemplateColumns: `repeat(${Math.min((values.meta.items as []).length, 4)},1fr)`,
              }}
            >
              {(values.meta.items as { icon: string; title: string; text: string }[]).map((item, i) => (
                <div key={i} className={`value-card reveal reveal-delay-${(i % 4) + 1}`}>
                  <div className="value-icon-wrap">
                    {ICON_MAP[item.icon] ?? <Star size={20} color="#fff" strokeWidth={1.8} />}
                  </div>
                  <h3 style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 17, fontWeight: 800, color: "#053366", marginBottom: 8,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          ÉQUIPE
      ══════════════════════════════ */}
      {team && (
        <section
          aria-labelledby="team-heading"
          className="reveal team-section"
          style={{ padding: "88px 40px", background: "#F9FAFB", borderTop: "1px solid #E5E7EB" }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 14 }}>
                <div className="divider" />
                <p className="section-label">Notre équipe</p>
                <div className="divider" />
              </div>
              {team.title && (
                <h2
                  id="team-heading"
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "clamp(20px,3vw,40px)",
                    fontWeight: 900, color: "#053366",
                    letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 10,
                  }}
                >
                  {team.title}
                </h2>
              )}
              {team.subtitle && (
                <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.6 }}>{team.subtitle}</p>
              )}
              {team.content && (
                <div
                  className="rich-content"
                  style={{ maxWidth: 580, margin: "14px auto 0" }}
                  dangerouslySetInnerHTML={{ __html: team.content }}
                />
              )}
            </div>

            {((team.meta?.members ?? []) as { name: string; role: string; photo: string; bio: string }[]).length > 0 && (
              <div
                className="team-grid"
                style={{ gridTemplateColumns: "repeat(3,1fr)" }}
              >
                {(team.meta.members as { name: string; role: string; photo: string; bio: string }[]).map((m, i) => (
                  <article key={i} className={`team-card reveal reveal-delay-${(i % 3) + 1}`}>
                    <div className="photo-wrap team-photo-wrap" style={{ height: 220 }}>
                      {m.photo ? (
                        <img
                          src={m.photo}
                          alt={`${m.name} — ${m.role} chez VoyajAime`}
                          style={{ width: "100%", height: 220, objectFit: "cover" }}
                        />
                      ) : (
                        <div className="team-card-avatar" style={{ height: 220 }}>
                          <span style={{
                            fontFamily: "'Playfair Display',serif",
                            fontSize: 56, fontWeight: 900, color: "#053366", opacity: .25,
                          }}>
                            {m.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "20px" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#053366", marginBottom: 4 }}>
                        {m.name}
                      </h3>
                      <p style={{
                        fontSize: 11, fontWeight: 700, color: "#02AFCF",
                        marginBottom: 10, textTransform: "uppercase", letterSpacing: ".6px",
                      }}>
                        {m.role}
                      </p>
                      {m.bio && (
                        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.68 }}>{m.bio}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════
          CTA
      ══════════════════════════════ */}
      {cta && (
        <section
          aria-labelledby="cta-heading"
          className="reveal cta-section"
          style={{
            padding: "96px 40px",
            background: "linear-gradient(135deg,#F0F9FB 0%,#F9FAFB 50%,#EEF2FF 100%)",
            borderTop: "1px solid #E5E7EB",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)",
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(2,175,207,.07) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 580, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 14 }}>
              <div className="divider" />
              <p className="section-label">Prêt à partir ?</p>
              <div className="divider" />
            </div>

            {cta.title && (
              <h2
                id="cta-heading"
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(22px,3.5vw,48px)",
                  fontWeight: 900, color: "#053366",
                  letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: 14,
                }}
              >
                {cta.title}
              </h2>
            )}
            {cta.subtitle && (
              <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 14, lineHeight: 1.65 }}>
                {cta.subtitle}
              </p>
            )}
            {cta.content && (
              <div
                className="rich-content"
                style={{ marginBottom: 32 }}
                dangerouslySetInnerHTML={{ __html: cta.content }}
              />
            )}

            <Link
              href={(cta.meta?.button_url as string) ?? "/excursions"}
              className="cta-btn"
            >
              {(cta.meta?.button_text as string) ?? "Commencer l'aventure"}
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      )}
      

      <HomeFooter user={null} />
      <script dangerouslySetInnerHTML={{ __html: SCROLL_REVEAL_SCRIPT }} />
    </>
  );
}