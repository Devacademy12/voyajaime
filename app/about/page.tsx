import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { Heart, ShieldCheck, Globe, Star, ArrowRight, MapPin, Users, MessageCircle, Phone } from "lucide-react";
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: linear-gradient(160deg, #EEF6F8 0%, #F7F9FC 50%, #EEF3FB 100%);
    color: #374151;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Page wrapper ── */
  .about-page {
    min-height: 100vh;
    background: linear-gradient(160deg, #EEF6F8 0%, #F7F9FC 50%, #EEF3FB 100%);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }
  .about-page::before {
    content: '';
    position: absolute; top: -120px; right: -120px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(11,122,138,0.07) 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }
  .about-page::after {
    content: '';
    position: absolute; bottom: -80px; left: -80px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(5,51,102,0.05) 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }

  /* ── Eyebrow badge ── */
  .ab-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 20px;
    background: #E6F4F6; border: 1px solid rgba(11,122,138,0.2);
    margin-bottom: 16px;
  }
  .ab-badge span {
    font-size: 10px; font-weight: 800; color: #0B7A8A;
    letter-spacing: 1.2px; text-transform: uppercase;
  }

  /* ── Rich content ── */
  .rich-light p        { margin-bottom: 14px; line-height: 1.85; font-size: 15px; color: #6B7280; }
  .rich-light ul       { padding-left: 20px; margin-bottom: 14px; }
  .rich-light ul li    { margin-bottom: 6px; line-height: 1.75; color: #6B7280; font-size: 14px; }
  .rich-light strong   { font-weight: 700; color: #053366; }
  .rich-light a        { color: #0B7A8A; }

  /* ══════════════════════════════════════
     HERO — image avec overlay light
  ══════════════════════════════════════ */
  .ab-hero {
    position: relative; height: 520px; overflow: hidden; margin-top: 64px;
    border-bottom: 1px solid #E5E7EB;
  }
  .ab-hero-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; display: block; filter: brightness(0.45);
  }
  .ab-hero-fallback {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, #053366 0%, #0B7A8A 100%);
  }
  .ab-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to right, rgba(5,51,102,0.82) 0%, rgba(5,51,102,0.45) 55%, rgba(11,122,138,0.15) 100%);
  }
  .ab-hero-overlay-b {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(5,51,102,0.6) 0%, transparent 50%);
  }
  .ab-hero-content {
    position: absolute; bottom: 0; left: 0;
    padding: 0 64px 52px;
    max-width: 760px;
  }
  .ab-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(34px, 4.5vw, 58px);
    font-weight: 700; color: #fff;
    line-height: 1.07; letter-spacing: -1.5px;
    margin-bottom: 16px;
  }
  .ab-hero-subtitle {
    font-size: 16px; color: rgba(255,255,255,0.68);
    line-height: 1.75; max-width: 520px; margin-bottom: 28px;
  }
  .ab-hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 28px; background: #0B7A8A; color: #fff;
    border-radius: 40px; font-size: 14px; font-weight: 700;
    text-decoration: none; transition: all 0.2s;
    box-shadow: 0 6px 20px rgba(11,122,138,0.35);
  }
  .ab-hero-cta:hover { background: #095f6c; transform: translateY(-2px); }

  /* Float badge hero */
  .ab-hero-float {
    position: absolute; top: 28px; right: 40px;
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 100px;
    background: rgba(255,255,255,0.12); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 700;
  }
  .ab-hero-float-dot { width: 7px; height: 7px; border-radius: 50%; background: #A5F3FC; }

  /* ══════════════════════════════════════
     SECTION WRAPPER COMMUN
  ══════════════════════════════════════ */
  .ab-section {
    padding: 80px 40px;
    position: relative; z-index: 1;
  }
  .ab-section-inner {
    max-width: 1200px; margin: 0 auto;
  }

  /* White sections */
  .ab-section-white { background: white; border-bottom: 1px solid #E5E7EB; }
  /* Gray sections */
  .ab-section-gray  { background: #F7F9FC; border-bottom: 1px solid #E5E7EB; }

  /* Section header */
  .ab-section-header { margin-bottom: 48px; }
  .ab-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(28px, 3vw, 44px);
    font-weight: 700; color: #053366;
    letter-spacing: -1px; line-height: 1.1; margin-bottom: 12px;
  }
  .ab-section-sub {
    font-size: 15px; color: #6B7280; line-height: 1.75; max-width: 500px;
  }

  /* ══════════════════════════════════════
     MISSION — 2 colonnes
  ══════════════════════════════════════ */
  .ab-mission-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: stretch;
  }

  /* Carte info mission */
  .ab-mission-card {
    background: white; border-radius: 24px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    padding: 36px;
  }

  /* Panneau teal mission */
  .ab-mission-panel {
    background: #053366; border-radius: 24px;
    border: 1px solid #053366;
    padding: 40px 36px; position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .ab-mission-panel::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(11,122,138,0.2); pointer-events: none;
  }
  .ab-mission-panel::after {
    content: ''; position: absolute; bottom: -60px; left: -30px;
    width: 200px; height: 200px; border-radius: 50%;
    background: rgba(165,243,252,0.06); pointer-events: none;
  }
  .ab-mission-panel-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(11,122,138,0.3); border: 1px solid rgba(11,122,138,0.4);
    display: flex; align-items: center; justify-content: center;
    color: #A5F3FC; margin-bottom: 24px; position: relative; z-index: 1;
  }
  .ab-mission-panel-quote {
    font-family: 'Cormorant Garamond', serif;
    font-size: 19px; font-weight: 600; font-style: italic;
    color: rgba(255,255,255,0.85); line-height: 1.75;
    position: relative; z-index: 1; margin-bottom: 28px;
  }
  .ab-mission-panel-bar {
    width: 32px; height: 2px; background: #0B7A8A;
    border-radius: 2px; margin-bottom: 12px; position: relative; z-index: 1;
  }
  .ab-mission-panel-author {
    font-size: 11px; font-weight: 800; color: #A5F3FC;
    letter-spacing: 2px; text-transform: uppercase;
    position: relative; z-index: 1;
  }

  /* ══════════════════════════════════════
     STATS — cards blanches
  ══════════════════════════════════════ */
  .ab-stats-grid {
    display: grid; gap: 18px;
  }
  .ab-stat-card {
    background: white; border-radius: 20px;
    border: 1px solid #E5E7EB;
    border-top: 3px solid #0B7A8A;
    padding: 36px 24px; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: transform 0.25s, box-shadow 0.25s, border-top-color 0.25s;
  }
  .ab-stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 48px rgba(5,51,102,0.1);
    border-top-color: #053366;
  }
  .ab-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 52px; font-weight: 700; color: #053366;
    letter-spacing: -2px; line-height: 1; margin-bottom: 8px;
  }
  .ab-stat-num span { color: #0B7A8A; }
  .ab-stat-label {
    font-size: 11px; font-weight: 800; color: #9CA3AF;
    letter-spacing: 2px; text-transform: uppercase;
  }

  /* ══════════════════════════════════════
     VALEURS — cards blanches
  ══════════════════════════════════════ */
  .ab-values-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .ab-value-card {
    background: white; border-radius: 20px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    padding: 32px 28px;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  }
  .ab-value-card::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: #0B7A8A; transform: scaleX(0);
    transition: transform 0.25s ease; transform-origin: left;
  }
  .ab-value-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 48px rgba(5,51,102,0.1);
    border-color: rgba(11,122,138,0.35);
  }
  .ab-value-card:hover::after { transform: scaleX(1); }

  /* featured card (navy) */
  .ab-value-card.featured {
    background: #053366; border-color: #053366;
  }
  .ab-value-card.featured::after { background: #0B7A8A; transform: scaleX(1); }
  .ab-value-card.featured .ab-v-icon  { background: rgba(11,122,138,0.25); border-color: rgba(11,122,138,0.35); color: #A5F3FC; }
  .ab-value-card.featured .ab-v-title { color: #fff; }
  .ab-value-card.featured .ab-v-text  { color: rgba(255,255,255,0.6); }
  .ab-value-card.featured .ab-v-link  { color: #A5F3FC; }

  .ab-v-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: #E6F4F6; border: 1px solid rgba(11,122,138,0.15);
    display: flex; align-items: center; justify-content: center;
    color: #0B7A8A; margin-bottom: 20px;
    transition: background 0.2s, color 0.2s;
  }
  .ab-value-card:not(.featured):hover .ab-v-icon {
    background: #0B7A8A; border-color: #0B7A8A; color: #fff;
  }
  .ab-v-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 19px; font-weight: 700; color: #053366;
    margin-bottom: 10px; letter-spacing: -0.3px;
  }
  .ab-v-text  { font-size: 13.5px; color: #6B7280; line-height: 1.72; }
  .ab-v-link  {
    margin-top: 20px; display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 700; color: #0B7A8A;
    text-decoration: none; text-transform: uppercase; letter-spacing: 0.8px;
  }
  .ab-v-link svg { transition: transform 0.15s; }
  .ab-v-link:hover svg { transform: translateX(3px); }

  /* ══════════════════════════════════════
     ÉQUIPE — cards blanches
  ══════════════════════════════════════ */
  .ab-team-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
  }
  .ab-team-card {
    background: white; border-radius: 20px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  }
  .ab-team-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 48px rgba(5,51,102,0.1);
    border-color: rgba(11,122,138,0.35);
  }
  .ab-team-card:hover .ab-team-photo { transform: scale(1.05); }
  .ab-team-photo-wrap {
    height: 220px; overflow: hidden;
    position: relative; background: #E6F4F6;
  }
  .ab-team-photo {
    width: 100%; height: 100%; object-fit: cover;
    display: block; transition: transform 0.45s ease;
  }
  .ab-team-photo-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(5,51,102,0.2), transparent 55%);
  }
  .ab-team-avatar {
    width: 100%; height: 220px;
    background: linear-gradient(145deg, #E6F4F6, #c9e9ed);
    display: flex; align-items: center; justify-content: center;
  }
  .ab-team-avatar-letter {
    font-family: 'Cormorant Garamond', serif;
    font-size: 72px; font-weight: 700; color: #0B7A8A; opacity: 0.25;
  }
  .ab-team-info { padding: 20px 22px 24px; }
  .ab-team-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px; font-weight: 700; color: #053366; margin-bottom: 4px;
  }
  .ab-team-role {
    font-size: 11px; font-weight: 800; color: #0B7A8A;
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;
  }
  .ab-team-bio { font-size: 13px; color: #6B7280; line-height: 1.68; }

  /* ══════════════════════════════════════
     CTA BANNER — style ContactSection
  ══════════════════════════════════════ */
  .ab-cta-section {
    padding: 80px 40px; position: relative; z-index: 1;
    background: #F7F9FC; border-top: 1px solid #E5E7EB;
  }
  .ab-cta-inner {
    max-width: 1200px; margin: 0 auto; text-align: center;
  }
  .ab-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(30px, 4vw, 50px);
    font-weight: 700; color: #053366;
    letter-spacing: -1.5px; line-height: 1.08; margin-bottom: 14px;
  }
  .ab-cta-sub {
    font-size: 15px; color: #6B7280;
    line-height: 1.75; max-width: 440px; margin: 0 auto 36px;
  }
  .ab-cta-btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 32px; background: #0B7A8A; color: #fff;
    border-radius: 40px; font-size: 14px; font-weight: 700;
    text-decoration: none; transition: all 0.2s;
    box-shadow: 0 6px 20px rgba(11,122,138,0.28);
  }
  .ab-cta-btn:hover { background: #095f6c; transform: translateY(-2px); }

  /* CTA bar bas (= ContactSection) */
  .ab-cta-bar {
    max-width: 1200px; margin: 36px auto 0;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 20px;
    padding: 20px 24px; background: white;
    border-radius: 18px; border: 1px solid #E5E7EB;
    box-shadow: 0 1px 6px rgba(0,0,0,0.03);
  }
  .ab-cta-bar-left { display: flex; align-items: center; gap: 14px; }
  .ab-cta-bar-icon {
    width: 44px; height: 44px; border-radius: 14px;
    background: #E6F4F6;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ab-cta-bar-title {
    font-size: 14px; font-weight: 700; color: #053366; margin-bottom: 3px;
  }
  .ab-cta-bar-sub { font-size: 13px; color: #6B7280; }
  .ab-cta-bar-link {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 24px; border-radius: 40px;
    background: #E6F4F6; border: 1px solid rgba(11,122,138,0.2);
    color: #0B7A8A; font-size: 13px; font-weight: 700;
    text-decoration: none; white-space: nowrap; transition: all 0.2s;
  }
  .ab-cta-bar-link:hover { background: #0B7A8A; color: white; }

  /* ══ RESPONSIVE ══ */
  @media (max-width: 1024px) {
    .ab-mission-grid { grid-template-columns: 1fr; }
    .ab-values-grid  { grid-template-columns: repeat(2, 1fr); }
    .ab-team-grid    { grid-template-columns: repeat(2, 1fr); }
    .ab-stats-grid   { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 768px) {
    .ab-section { padding: 60px 24px; }
    .ab-hero-content { padding: 0 24px 36px; }
    .ab-hero-float { display: none; }
    .ab-cta-section { padding: 60px 24px; }
    .ab-cta-bar { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 640px) {
    .ab-hero { height: 440px; }
    .ab-values-grid { grid-template-columns: 1fr; }
    .ab-team-grid   { grid-template-columns: 1fr; }
    .ab-stats-grid  { grid-template-columns: repeat(2, 1fr) !important; }
    .ab-stat-num    { font-size: 42px; }
    .ab-cta-btn     { width: 100%; justify-content: center; }
  }
  @media (max-width: 380px) {
    .ab-stats-grid { grid-template-columns: 1fr !important; }
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

  const statsItems  = (stats?.meta?.items   as { value: string; label: string }[])                            ?? [];
  const valuesItems = (values?.meta?.items  as { icon: string; title: string; text: string }[])               ?? [];
  const teamMembers = (team?.meta?.members  as { name: string; role: string; photo: string; bio: string }[])  ?? [];

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

      <div className="about-page">

        {/* ══ HERO ══ */}
        {hero && (
          <div className="ab-hero">
            {hero.image_url
              ? <img src={hero.image_url} alt={hero.title ?? "VoyajAime"} className="ab-hero-img" />
              : <div className="ab-hero-fallback" />
            }
            <div className="ab-hero-overlay" />
            <div className="ab-hero-overlay-b" />

            <div className="ab-hero-float">
              <span className="ab-hero-float-dot" />
              À propos de VoyajAime
            </div>

            <div className="ab-hero-content">
              <div className="ab-badge" style={{ background: "rgba(165,243,252,0.15)", borderColor: "rgba(165,243,252,0.3)" }}>
                <MessageCircle size={11} color="#A5F3FC" />
                <span style={{ color: "#A5F3FC" }}>Notre histoire</span>
              </div>
              <h1 className="ab-hero-title">{hero.title ?? "Nous rendons la Tunisie inoubliable"}</h1>
              {hero.subtitle && <p className="ab-hero-subtitle">{hero.subtitle}</p>}
              <Link href="/excursions" className="ab-hero-cta">
                Découvrir nos excursions <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}

        {!hero && <div style={{ paddingTop: 80 }} />}

        {/* ══ MISSION ══ */}
        {mission && (
          <section aria-labelledby="mission-heading" className={`ab-section ab-section-white`}>
            <div className="ab-section-inner">
              <div className="ab-mission-grid">

                {/* Texte */}
                <div className="ab-mission-card">
                  <div className="ab-badge">
                    <Globe size={11} color="#0B7A8A" />
                    <span>Notre mission</span>
                  </div>
                  {mission.title && (
                    <h2 id="mission-heading" className="ab-section-title">{mission.title}</h2>
                  )}
                  {mission.subtitle && (
                    <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.8, marginBottom: 16 }}>{mission.subtitle}</p>
                  )}
                  {mission.content && (
                    <div className="rich-light" dangerouslySetInnerHTML={{ __html: mission.content }} />
                  )}
                </div>

                {/* Panneau quote */}
                <div className="ab-mission-panel">
                  <div className="ab-mission-panel-icon">
                    <Globe size={22} color="#A5F3FC" strokeWidth={1.8} />
                  </div>
                  <p className="ab-mission-panel-quote">
                    {mission.subtitle ?? "Notre engagement est de proposer des expériences de voyage authentiques, responsables et mémorables à travers toute la Tunisie."}
                  </p>
                  <div>
                    <div className="ab-mission-panel-bar" />
                    <p className="ab-mission-panel-author">— VoyajAime, {new Date().getFullYear()}</p>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* ══ STATS ══ */}
        {stats && statsItems.length > 0 && (
          <section aria-labelledby="stats-heading" className={`ab-section ab-section-gray`}>
            <div className="ab-section-inner">
              <div className="ab-section-header">
                <div className="ab-badge">
                  <span>En chiffres</span>
                </div>
                {stats.title && (
                  <h2 id="stats-heading" className="ab-section-title">{stats.title}</h2>
                )}
              </div>
              <div
                className="ab-stats-grid"
                style={{ gridTemplateColumns: `repeat(${Math.min(statsItems.length, 4)}, 1fr)` }}
              >
                {statsItems.map((item, i) => (
                  <div key={i} className="ab-stat-card">
                    <p className="ab-stat-num">{item.value}</p>
                    <p className="ab-stat-label">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ VALEURS ══ */}
        {values && valuesItems.length > 0 && (
          <section aria-labelledby="values-heading" className={`ab-section ab-section-white`}>
            <div className="ab-section-inner">
              <div className="ab-section-header">
                <div className="ab-badge">
                  <Star size={11} color="#0B7A8A" />
                  <span>Ce qui nous guide</span>
                </div>
                {values.title && (
                  <h2 id="values-heading" className="ab-section-title">{values.title}</h2>
                )}
                {values.subtitle && <p className="ab-section-sub">{values.subtitle}</p>}
              </div>

              <div className="ab-values-grid">
                {valuesItems.map((item, i) => (
                  <div key={i} className={`ab-value-card${i === 1 ? " featured" : ""}`}>
                    <div className="ab-v-icon">
                      {ICON_MAP[item.icon] ?? <Star size={22} strokeWidth={1.8} />}
                    </div>
                    <p className="ab-v-title">{item.title}</p>
                    <p className="ab-v-text">{item.text}</p>
                    <a href="#" className="ab-v-link">
                      En savoir plus <ArrowRight size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ ÉQUIPE ══ */}
        {team && (
          <section aria-labelledby="team-heading" className={`ab-section ab-section-gray`}>
            <div className="ab-section-inner">
              <div className="ab-section-header">
                <div className="ab-badge">
                  <Users size={11} color="#0B7A8A" />
                  <span>Notre équipe</span>
                </div>
                {team.title && (
                  <h2 id="team-heading" className="ab-section-title">{team.title}</h2>
                )}
                {team.subtitle && <p className="ab-section-sub">{team.subtitle}</p>}
              </div>

              {teamMembers.length > 0 && (
                <div className="ab-team-grid">
                  {teamMembers.map((m, i) => (
                    <article key={i} className="ab-team-card">
                      <div className="ab-team-photo-wrap">
                        {m.photo ? (
                          <>
                            <img className="ab-team-photo" src={m.photo} alt={`${m.name} — ${m.role}`} />
                            <div className="ab-team-photo-overlay" />
                          </>
                        ) : (
                          <div className="ab-team-avatar">
                            <span className="ab-team-avatar-letter">{m.name?.[0]?.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="ab-team-info">
                        <p className="ab-team-name">{m.name}</p>
                        <p className="ab-team-role">{m.role}</p>
                        {m.bio && <p className="ab-team-bio">{m.bio}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══ CTA ══ */}
        <section aria-labelledby="cta-heading" className="ab-cta-section">
          <div className="ab-cta-inner">
            <div className="ab-badge" style={{ marginBottom: 20 }}>
              <span>Passez à l'action</span>
            </div>
            {cta?.title ? (
              <h2 id="cta-heading" className="ab-cta-title"
                dangerouslySetInnerHTML={{ __html: cta.title }} />
            ) : (
              <h2 id="cta-heading" className="ab-cta-title">Prêt pour l'aventure ?</h2>
            )}
            <p className="ab-cta-sub">
              {cta?.subtitle ?? "Explorez nos excursions et vivez des moments inoubliables en Tunisie."}
            </p>
            <Link
              href={(cta?.meta?.button_url as string) ?? "/excursions"}
              className="ab-cta-btn"
            >
              {(cta?.meta?.button_text as string) ?? "Commencer l'aventure"}
              <ArrowRight size={15} />
            </Link>

            {/* CTA bar */}
            <div className="ab-cta-bar">
              <div className="ab-cta-bar-left">
                <div className="ab-cta-bar-icon">
                  <Phone size={20} color="#0B7A8A" />
                </div>
                <div>
                  <p className="ab-cta-bar-title">Une question sur nos excursions ?</p>
                  <p className="ab-cta-bar-sub">Notre équipe vous répond sous 24h</p>
                </div>
              </div>
              <Link href="/contact" className="ab-cta-bar-link">
                Nous contacter <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        <HomeFooter user={null} />
      </div>
    </>
  );
}