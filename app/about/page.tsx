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
    openGraph: {
      title: data?.title ?? "À propos de VoyajAime",
      description: data?.subtitle ?? "Tourisme authentique en Tunisie",
      type: "website",
    },
    alternates: { canonical: "/about" },
  };
}

/* ══ TYPES ══ */
interface Section {
  id: string; section: string; title: string | null; subtitle: string | null;
  content: string | null; image_url: string | null; is_active: boolean;
  position: number; meta: Record<string, unknown>;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart:  <Heart  size={22} strokeWidth={1.8} />,
  shield: <ShieldCheck size={22} strokeWidth={1.8} />,
  globe:  <Globe  size={22} strokeWidth={1.8} />,
  star:   <Star   size={22} strokeWidth={1.8} />,
  map:    <MapPin size={22} strokeWidth={1.8} />,
  users:  <Users  size={22} strokeWidth={1.8} />,
};

/* ══ CSS — tokens identiques à BlogPage + HomeSlider ══ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #F7F8FA;
    color: #374151;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes slideUp   { from { opacity:0; transform:translateY(28px); filter:blur(5px); } to { opacity:1; transform:translateY(0); filter:blur(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes float     { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(10px)} }

  /* ── RICH content dark ── */
  .rich-dark p         { margin-bottom:14px; line-height:1.85; font-size:15px; color:rgba(255,255,255,0.7); }
  .rich-dark h2        { font-family:'Playfair Display',serif; font-size:20px; font-weight:900; color:#fff; margin-bottom:10px; }
  .rich-dark ul        { padding-left:20px; margin-bottom:14px; }
  .rich-dark ul li     { margin-bottom:6px; line-height:1.75; color:rgba(255,255,255,0.7); font-size:14px; }
  .rich-dark blockquote{ border-left:3px solid #02AFCF; padding:12px 20px; background:rgba(2,175,207,0.12); border-radius:0 12px 12px 0; margin:16px 0; color:rgba(255,255,255,0.7); font-style:italic; }
  .rich-dark strong    { font-weight:700; color:#fff; }

  /* ── RICH content light ── */
  .rich-light p        { margin-bottom:14px; line-height:1.85; font-size:15px; color:#6B7280; }
  .rich-light ul       { padding-left:20px; margin-bottom:14px; }
  .rich-light ul li    { margin-bottom:6px; line-height:1.75; color:#6B7280; font-size:14px; }
  .rich-light strong   { font-weight:700; color:#053366; }
  .rich-light a        { color:#02AFCF; }

  /* ── section label (identique BlogPage) ── */
  .section-label { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .label-bar     { width:28px; height:2px; border-radius:2px; }
  .label-bar-cyan{ background:#02AFCF; }
  .label-bar-navy{ background:#053366; }
  .label-text    { font-size:10px; font-weight:800; letter-spacing:3px; text-transform:uppercase; }
  .label-text-cyan{ color:#02AFCF; }
  .label-text-navy{ color:#053366; }

  /* ── pill badge (identique aux filter pills de BlogPage) ── */
  .pill-badge {
    display:inline-flex; align-items:center; gap:7px;
    padding:5px 16px; border-radius:100px;
    font-size:10px; font-weight:800; letter-spacing:1.8px; text-transform:uppercase;
    margin-bottom:20px;
  }
  .pill-badge-cyan {
    background:rgba(2,175,207,0.14); border:1px solid rgba(2,175,207,0.4); color:#02AFCF;
  }
  .pill-badge-light {
    background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); color:rgba(255,255,255,0.85);
  }
  .pill-badge-navy {
    background:rgba(5,51,102,0.08); border:1px solid rgba(5,51,102,0.18); color:#053366;
  }
  .pill-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }

  /* ══════════════════════════════════════
     HERO — image plein écran (= BlogPage)
  ══════════════════════════════════════ */
  .hero-wrap {
    position:relative; height:580px; overflow:hidden; margin-top:60px;
  }
  .hero-img {
    position:absolute; ; width:100%; height:100%;
    object-fit:cover; display:block; filter:brightness(0.52);
  }
  .hero-overlay-l {
    position:absolute; inset:0;
    background:linear-gradient(to right, rgba(0,0,0,.82) 0%, rgba(0,0,0,.42) 52%, rgba(0,0,0,.12) 100%);
  }
  .hero-overlay-b {
    position:absolute; inset:0;
    background:linear-gradient(to top, rgba(5,51,102,.75) 0%, transparent 52%);
  }
  .hero-grid-overlay {
    position:absolute; inset:0;
    background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
    background-size:48px 48px;
    pointer-events:none;
  }
  .hero-content {
    position:absolute; bottom:0; left:10%; 
    padding:0 40px 44px;
    animation:slideUp .7s cubic-bezier(.34,1.2,.64,1) .1s both;
  }
  .hero-title {
    font-family:'Playfair Display',serif;
    font-size:clamp(32px,4.5vw,60px);
    font-weight:900; color:#fff;
    line-height:1.05; letter-spacing:-2px;
    margin-bottom:18px;
    text-shadow:0 4px 40px rgba(0,0,0,.3);
    max-width:680px;
  }
  .hero-title em { font-style:normal; color:#02AFCF; }
  .hero-subtitle {
    font-size:16px; color:rgba(255,255,255,.65);
    line-height:1.75; max-width:540px; margin-bottom:28px;
  }
  .hero-cta {
    display:inline-flex; align-items:center; gap:10px;
    padding:14px 30px; background:#02AFCF; color:#fff;
    border-radius:12px; font-size:14px; font-weight:700;
    text-decoration:none; border:2px solid #02AFCF;
    transition:all .35s cubic-bezier(.34,1.2,.64,1);
    box-shadow:0 8px 28px rgba(2,175,207,.35);
  }
  .hero-cta:hover { background:transparent; color:#02AFCF; transform:translateY(-3px); }

  /* badge flottant sur image hero */
  .hero-float-badge {
    position:absolute; top:28px; right:36px; z-index:5;
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 18px; border-radius:100px;
    background:rgba(0,0,0,.45); backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,.18);
    color:rgba(255,255,255,.85); font-size:12px; font-weight:700;
  }
  .hero-float-badge-dot { width:7px; height:7px; border-radius:50%; background:#02AFCF; }

  /* scroll hint */
  .scroll-hint {
    position:absolute; bottom:20px; left:50%;
    animation:float 2.4s ease-in-out infinite;
    opacity:.6; cursor:pointer; transition:opacity .3s;
  }
  .scroll-hint:hover { opacity:1; }

  /* ══════════════════════════════════════
     MISSION — blanc, 2 colonnes
  ══════════════════════════════════════ */
  .mission-wrap {
    background:#fff; padding:96px 40px 88px;
    border-bottom:1px solid #EBEBEB;
  }
  .mission-inner {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center;
  }
  .mission-title {
    font-family:'Playfair Display',serif;
    font-size:clamp(26px,3vw,42px);
    font-weight:900; color:#053366;
    line-height:1.1; letter-spacing:-1px; margin-bottom:16px;
  }
  .mission-sub {
    font-size:15px; color:#6B7280; line-height:1.85; margin-bottom:20px;
  }
  /* Panneau quote (= même style que PathsSection) */
  .mission-panel {
    background:#053366; border-radius:20px; padding:44px 40px;
    position:relative; overflow:hidden;
  }
  .mission-panel::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:180px; height:180px; border-radius:50%;
    background:rgba(2,175,207,.12); pointer-events:none;
  }
  .mission-panel::after {
    content:''; position:absolute; bottom:-60px; left:-30px;
    width:200px; height:200px; border-radius:50%;
    background:rgba(37,159,252,.07); pointer-events:none;
  }
  .mission-panel-icon {
    width:52px; height:52px; border-radius:50%; background:#02AFCF;
    display:flex; align-items:center; justify-content:center;
    margin-bottom:24px; position:relative; z-index:1;
  }
  .mission-panel-quote {
    font-family:'Playfair Display',serif;
    font-size:17px; font-weight:700; font-style:italic;
    color:rgba(255,255,255,.82); line-height:1.75;
    position:relative; z-index:1; margin-bottom:28px;
  }
  .mission-panel-bar  { width:36px; height:2px; background:#02AFCF; border-radius:2px; margin-bottom:14px; position:relative; z-index:1; }
  .mission-panel-author {
    font-size:11px; font-weight:800; color:#02AFCF;
    letter-spacing:2px; text-transform:uppercase;
    position:relative; z-index:1;
  }

  /* ══════════════════════════════════════
     STATS — #F7F8FA, cards blanches
  ══════════════════════════════════════ */
  .stats-wrap {
    background:#F7F8FA; padding:80px 40px;
    border-bottom:1px solid #EBEBEB;
  }
  .stats-heading-row {
    max-width:1200px; margin:0 auto 48px;
    display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap;
  }
  .stats-row {
    max-width:1200px; margin:0 auto;
    display:grid; gap:18px;
  }
  .stat-card {
    background:#fff; border-radius:20px;
    border:1px solid #EBEBEB; border-top:3px solid #02AFCF;
    padding:36px 24px; text-align:center;
    transition:transform .25s cubic-bezier(.34,1.2,.64,1), box-shadow .25s ease, border-top-color .25s;
  }
  .stat-card:hover {
    transform:translateY(-5px);
    box-shadow:0 20px 48px rgba(5,51,102,.1);
    border-top-color:#053366;
  }
  .stat-num {
    font-family:'Playfair Display',serif;
    font-size:52px; font-weight:900; color:#053366;
    letter-spacing:-2px; line-height:1; margin-bottom:8px;
  }
  .stat-num span { color:#02AFCF; }
  .stat-label {
    font-size:11px; font-weight:800; color:#9CA3AF;
    letter-spacing:2px; text-transform:uppercase;
  }

  /* ══════════════════════════════════════
     VALEURS — blanc, grid cards
     (= même pattern que PopularExcursions)
  ══════════════════════════════════════ */
  .values-wrap {
    background:#fff; padding:96px 40px 88px;
    border-bottom:1px solid #EBEBEB;
  }
  .values-header { max-width:1200px; margin:0 auto 52px; }
  .values-title {
    font-family:'Playfair Display',serif;
    font-size:clamp(28px,3vw,44px);
    font-weight:900; color:#053366;
    letter-spacing:-1.5px; line-height:1.1; margin-bottom:14px;
  }
  .values-sub { font-size:15px; color:#6B7280; line-height:1.75; max-width:520px; }

  .values-grid {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
  }
  /* card standard */
  .value-card {
    background:#fff; border-radius:20px;
    border:1px solid #EBEBEB; padding:32px 28px;
    display:flex; flex-direction:column; gap:0;
    transition:transform .3s cubic-bezier(.34,1.2,.64,1), box-shadow .3s ease, border-color .3s;
    position:relative; overflow:hidden;
  }
  .value-card::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
    background:#02AFCF; transform:scaleX(0); transition:transform .25s ease; transform-origin:left;
  }
  .value-card:hover { transform:translateY(-5px); box-shadow:0 20px 48px rgba(5,51,102,.1); border-color:rgba(2,175,207,.35); }
  .value-card:hover::after { transform:scaleX(1); }

  /* card featured (= PathsSection dark card) */
  .value-card.featured {
    background:#053366; border-color:#053366;
  }
  .value-card.featured::after { background:#02AFCF; transform:scaleX(1); }
  .value-card.featured .v-icon  { background:rgba(2,175,207,.2); border-color:rgba(2,175,207,.3); color:#02AFCF; }
  .value-card.featured .v-title { color:#fff; }
  .value-card.featured .v-text  { color:rgba(255,255,255,.62); }
  .value-card.featured .v-link  { color:#02AFCF; }

  .v-icon {
    width:52px; height:52px; border-radius:14px;
    background:#EEF2FF; border:1px solid rgba(5,51,102,.1);
    display:flex; align-items:center; justify-content:center;
    color:#053366; margin-bottom:20px;
    transition:background .2s, color .2s;
  }
  .value-card:not(.featured):hover .v-icon {
    background:#02AFCF; border-color:#02AFCF; color:#fff;
  }
  .v-title {
    font-family:'Playfair Display',serif;
    font-size:17px; font-weight:800; color:#053366;
    margin-bottom:10px; letter-spacing:-.3px;
  }
  .v-text  { font-size:13.5px; color:#6B7280; line-height:1.72; }
  .v-link  {
    margin-top:20px; display:inline-flex; align-items:center; gap:5px;
    font-size:12px; font-weight:700; color:#02AFCF;
    text-decoration:none; text-transform:uppercase; letter-spacing:.8px;
  }
  .v-link svg { transition:transform .15s; }
  .v-link:hover svg { transform:translateX(3px); }

  /* ══════════════════════════════════════
     TEAM — #F7F8FA, cards blanches
  ══════════════════════════════════════ */
  .team-wrap {
    background:#F7F8FA; padding:96px 40px 88px;
    border-bottom:1px solid #EBEBEB;
  }
  .team-header { max-width:1200px; margin:0 auto 48px; }
  .team-title {
    font-family:'Playfair Display',serif;
    font-size:clamp(26px,3vw,42px);
    font-weight:900; color:#053366;
    letter-spacing:-1.5px; line-height:1.1; margin-bottom:10px;
  }
  .team-sub { font-size:15px; color:#6B7280; line-height:1.75; max-width:460px; }

  .team-grid {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:repeat(3,1fr); gap:20px;
  }
  .team-card {
    background:#fff; border-radius:20px;
    border:1px solid #EBEBEB; overflow:hidden;
    transition:transform .3s cubic-bezier(.34,1.2,.64,1), box-shadow .3s, border-color .3s;
  }
  .team-card:hover {
    transform:translateY(-5px);
    box-shadow:0 20px 48px rgba(5,51,102,.1);
    border-color:rgba(2,175,207,.35);
  }
  .team-card:hover .team-photo { transform:scale(1.05); }
  .team-photo-wrap { height:240px; overflow:hidden; position:relative; background:#EEF2FF; }
  .team-photo { width:100%; height:100%; object-fit:cover; display:block; transition:transform .45s ease; }
  .team-photo-overlay {
    position:absolute; inset:0;
    background:linear-gradient(to top, rgba(5,19,51,.28), transparent 55%);
  }
  .team-avatar {
    width:100%; height:240px; background:linear-gradient(145deg, #DCE5FF, #c9d8ff);
    display:flex; align-items:center; justify-content:center;
  }
  .team-avatar-letter {
    font-family:'Playfair Display',serif;
    font-size:72px; font-weight:900; color:#053366; opacity:.18;
  }
  .team-info { padding:20px 22px 24px; }
  .team-name {
    font-family:'Playfair Display',serif;
    font-size:17px; font-weight:800; color:#053366; margin-bottom:4px;
  }
  .team-role {
    font-size:11px; font-weight:800; color:#02AFCF;
    text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px;
  }
  .team-bio { font-size:13px; color:#6B7280; line-height:1.68; }

  /* ══════════════════════════════════════
     CTA — dark navy (= PathsSection)
  ══════════════════════════════════════ */
  .cta-wrap {
    position:relative; overflow:hidden;
    background:#053366; padding:96px 40px;
    text-align:center;
  }
  .cta-wrap::before {
    content:''; position:absolute; inset:0;
    background:
      radial-gradient(ellipse 55% 80% at 80% 50%, rgba(2,175,207,.12) 0%, transparent 65%),
      radial-gradient(ellipse 40% 60% at 10% 60%, rgba(37,159,252,.07) 0%, transparent 60%);
    pointer-events:none;
  }
  .cta-grid-overlay {
    position:absolute; inset:0;
    background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
    background-size:48px 48px; pointer-events:none;
  }
  .cta-inner { max-width:600px; margin:0 auto; position:relative; z-index:1; }
  .cta-title {
    font-family:'Playfair Display',serif;
    font-size:clamp(28px,4vw,52px);
    font-weight:900; color:#fff;
    letter-spacing:-2px; line-height:1.05; margin-bottom:16px;
  }
  .cta-title em { font-style:normal; color:#02AFCF; }
  .cta-sub {
    font-size:16px; color:rgba(255,255,255,.58);
    line-height:1.75; max-width:440px; margin:0 auto 40px;
  }
  .cta-btn {
    display:inline-flex; align-items:center; gap:10px;
    padding:15px 32px; background:#02AFCF; color:#fff;
    border-radius:12px; font-size:14px; font-weight:700;
    text-decoration:none; border:2px solid #02AFCF;
    transition:all .35s cubic-bezier(.34,1.2,.64,1);
    box-shadow:0 8px 28px rgba(2,175,207,.35);
  }
  .cta-btn:hover { background:transparent; color:#02AFCF; transform:translateY(-3px); gap:14px; }

  /* ══ RESPONSIVE ══ */
  @media (max-width:1024px) {
    .mission-inner { grid-template-columns:1fr; gap:36px; }
    .values-grid   { grid-template-columns:repeat(2,1fr); }
    .team-grid     { grid-template-columns:repeat(2,1fr); }
    .stats-row     { grid-template-columns:repeat(2,1fr) !important; }
  }
  @media (max-width:640px) {
    .hero-wrap   { height:440px; }
    .hero-content{ padding:0 20px 32px; }
    .hero-float-badge { display:none; }
    .mission-wrap,.values-wrap,.team-wrap,.cta-wrap,.stats-wrap { padding:64px 20px; }
    .values-grid { grid-template-columns:1fr; }
    .team-grid   { grid-template-columns:1fr; }
    .stats-row   { grid-template-columns:repeat(2,1fr) !important; }
    .stat-num    { font-size:40px; }
    .cta-btn     { width:100%; justify-content:center; }
  }
  @media (max-width:380px) {
    .stats-row { grid-template-columns:1fr !important; }
  }
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

  const statsItems  = (stats?.meta?.items   as { value: string; label: string }[])                       ?? [];
  const valuesItems = (values?.meta?.items  as { icon: string; title: string; text: string }[])          ?? [];
  const teamMembers = (team?.meta?.members  as { name: string; role: string; photo: string; bio: string }[]) ?? [];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "TravelAgency",
    name: "VoyajAime", description: hero?.subtitle ?? "Tourisme authentique en Tunisie",
    url: "https://voyajaime.tn/about", foundingDate: "2024",
    areaServed: { "@type": "Country", name: "Tunisie" },
  };

  return (
    <>
      <style>{CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TouristeNav />

      {/* ══ HERO — plein écran image (= BlogDetailPage) ═══════════════════════ */}
      {hero && (
        <div className="hero-wrap">
          {/* Image */}
          <div style={{ position: "absolute", inset: 0 }}>
            {hero.image_url ? (
              <img
                src={hero.image_url}
                alt={hero.title ?? "VoyajAime"}
                className="hero-img"
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, #071e3d 0%, #1a3a5c 60%, #0d2340 100%)",
              }} />
            )}
          </div>

          {/* Overlays */}
          <div className="hero-overlay-l" />
          <div className="hero-overlay-b" />
          <div className="hero-grid-overlay" />

          

          {/* Contenu bas gauche */}
          <div className="hero-content">
            <div className="pill-badge pill-badge-cyan" style={{ marginBottom: 20 }}>
              <span className="pill-dot" />
              À propos de nous
            </div>

            <h1 className="hero-title">
              {hero.title ?? "Nous rendons la Tunisie <em>inoubliable</em>"}
            </h1>

            {hero.subtitle && (
              <p className="hero-subtitle">{hero.subtitle}</p>
            )}

            {hero.content && (
              <div className="rich-dark" style={{ marginBottom: 28 }}
                dangerouslySetInnerHTML={{ __html: hero.content }} />
            )}

            <Link href="/excursions" className="hero-cta">
              Découvrir nos excursions <ArrowRight size={16} />
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="scroll-hint">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      )}

      {!hero && <div style={{ paddingTop: 80 }} />}

      {/* ══ MISSION ══════════════════════════════════════════════════════════ */}
      {mission && (
        <section aria-labelledby="mission-heading" className="mission-wrap">
          <div className="mission-inner">
            {/* Texte */}
            <div>
              <div className="section-label">
                <div className="label-bar label-bar-cyan" />
                <span className="label-text label-text-cyan">Notre mission</span>
              </div>
              {mission.title && (
                <h2 id="mission-heading" className="mission-title">{mission.title}</h2>
              )}
              {mission.subtitle && (
                <p className="mission-sub">{mission.subtitle}</p>
              )}
              {mission.content && (
                <div className="rich-light"
                  dangerouslySetInnerHTML={{ __html: mission.content }} />
              )}
            </div>

            {/* Panneau quote */}
            <div className="mission-panel">
              <div className="mission-panel-icon">
                <Globe size={24} color="white" strokeWidth={1.8} />
              </div>
              <p className="mission-panel-quote">
                {mission.subtitle ?? "Notre engagement est de proposer des expériences de voyage authentiques, responsables et mémorables à travers toute la Tunisie."}
              </p>
              <div className="mission-panel-bar" />
              <p className="mission-panel-author">— VoyajAime, {new Date().getFullYear()}</p>
            </div>
          </div>
        </section>
      )}

      {/* ══ STATS ════════════════════════════════════════════════════════════ */}
      {stats && statsItems.length > 0 && (
        <section aria-labelledby="stats-heading" className="stats-wrap">
          <div className="stats-heading-row">
            <div>
              <div className="section-label">
                <div className="label-bar label-bar-navy" />
                <span className="label-text label-text-navy">En chiffres</span>
              </div>
              {stats.title && (
                <h2 id="stats-heading" style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(24px, 2.8vw, 38px)",
                  fontWeight: 900, color: "#053366",
                  letterSpacing: "-1px", lineHeight: 1.1,
                }}>
                  {stats.title}
                </h2>
              )}
            </div>
          </div>
          <div
            className="stats-row"
            style={{ gridTemplateColumns: `repeat(${Math.min(statsItems.length, 4)}, 1fr)` }}
          >
            {statsItems.map((item, i) => (
              <div key={i} className="stat-card">
                <p className="stat-num">{item.value}</p>
                <p className="stat-label">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ VALEURS ══════════════════════════════════════════════════════════ */}
      {values && valuesItems.length > 0 && (
        <section aria-labelledby="values-heading" className="values-wrap">
          <div className="values-header">
            <div className="section-label">
              <div className="label-bar label-bar-cyan" />
              <span className="label-text label-text-cyan">Ce qui nous guide</span>
            </div>
            {values.title && (
              <h2 id="values-heading" className="values-title">{values.title}</h2>
            )}
            {values.subtitle && (
              <p className="values-sub">{values.subtitle}</p>
            )}
          </div>

          <div className="values-grid">
            {valuesItems.map((item, i) => (
              <div key={i} className={`value-card${i === 1 ? " featured" : ""}`}>
                <div className="v-icon">
                  {ICON_MAP[item.icon] ?? <Star size={22} strokeWidth={1.8} />}
                </div>
                <p className="v-title">{item.title}</p>
                <p className="v-text">{item.text}</p>
                <a href="#" className="v-link">
                  En savoir plus <ArrowRight size={12} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ ÉQUIPE ═══════════════════════════════════════════════════════════ */}
      {team && (
        <section aria-labelledby="team-heading" className="team-wrap">
          <div className="team-header">
            <div className="section-label">
              <div className="label-bar label-bar-navy" />
              <span className="label-text label-text-navy">Notre équipe</span>
            </div>
            {team.title && (
              <h2 id="team-heading" className="team-title">{team.title}</h2>
            )}
            {team.subtitle && <p className="team-sub">{team.subtitle}</p>}
          </div>

          {teamMembers.length > 0 && (
            <div className="team-grid">
              {teamMembers.map((m, i) => (
                <article key={i} className="team-card">
                  <div className="team-photo-wrap">
                    {m.photo ? (
                      <>
                        <img className="team-photo" src={m.photo} alt={`${m.name} — ${m.role}`} />
                        <div className="team-photo-overlay" />
                      </>
                    ) : (
                      <div className="team-avatar">
                        <span className="team-avatar-letter">{m.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="team-info">
                    <p className="team-name">{m.name}</p>
                    <p className="team-role">{m.role}</p>
                    {m.bio && <p className="team-bio">{m.bio}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      {cta && (
        <section aria-labelledby="cta-heading" className="cta-wrap">
          <div className="cta-grid-overlay" />
          <div className="cta-inner">
            <div className="pill-badge pill-badge-light" style={{ marginBottom: 20 }}>
              <span className="pill-dot" />
              Passez à l'action
            </div>
            {cta.title && (
              <h2 id="cta-heading" className="cta-title"
                dangerouslySetInnerHTML={{ __html: cta.title }} />
            )}
            {cta.subtitle && <p className="cta-sub">{cta.subtitle}</p>}
            <Link
              href={(cta.meta?.button_url as string) ?? "/excursions"}
              className="cta-btn"
            >
              {(cta.meta?.button_text as string) ?? "Commencer l'aventure"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      <HomeFooter user={null} />
    </>
  );
}