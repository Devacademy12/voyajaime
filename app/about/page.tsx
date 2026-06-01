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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --brand-dark:    #053366;
    --brand-primary: #02AFCF;
    --brand-blue:    #259FFC;
    --brand-lavender:#DCE5FF;
    --teal:          #2b96a8;
    --teal-light:    #4aabb8;
    --teal-dark:     #1e7a8a;
    --sand:          #f5f3f0;

    /* Derived */
    --white:         #ffffff;
    --gray-50:       #f8fafc;
    --gray-100:      #f1f5f9;
    --gray-200:      #e2e8f0;
    --gray-400:      #94a3b8;
    --gray-600:      #475569;
    --gray-700:      #334155;
    --dark-navy:     #021d3d;

    --shadow-sm:  0 1px 3px rgba(5,51,102,0.08), 0 1px 2px rgba(5,51,102,0.06);
    --shadow-md:  0 4px 16px rgba(5,51,102,0.10), 0 2px 6px rgba(5,51,102,0.06);
    --shadow-lg:  0 12px 40px rgba(5,51,102,0.14), 0 4px 12px rgba(5,51,102,0.08);
  }

  body {
    font-family: 'Open Sans', system-ui, sans-serif;
    background: var(--white);
    color: var(--gray-700);
    -webkit-font-smoothing: antialiased;
  }

  /* ── RICH CONTENT dark ── */
  .rich-dark p          { margin-bottom: 14px; line-height: 1.85; font-size: 15px; color: rgba(255,255,255,0.75); font-weight: 400; }
  .rich-dark h2         { font-size: 20px; font-weight: 700; color: var(--white); margin-bottom: 10px; font-family: 'Montserrat', sans-serif; }
  .rich-dark ul         { padding-left: 20px; margin-bottom: 14px; }
  .rich-dark ul li      { margin-bottom: 6px; line-height: 1.75; color: rgba(255,255,255,0.75); font-size: 14px; }
  .rich-dark blockquote { border-left: 3px solid var(--brand-primary); padding: 12px 20px; background: rgba(2,175,207,0.12); border-radius: 0 6px 6px 0; margin: 16px 0; color: rgba(255,255,255,0.7); font-style: italic; }
  .rich-dark a          { color: var(--brand-primary); text-decoration: underline; text-underline-offset: 3px; }
  .rich-dark strong     { font-weight: 700; color: var(--white); }

  /* ── RICH CONTENT light ── */
  .rich-light p         { margin-bottom: 14px; line-height: 1.85; font-size: 15px; color: var(--gray-600); font-weight: 400; }
  .rich-light ul        { padding-left: 20px; margin-bottom: 14px; }
  .rich-light ul li     { margin-bottom: 6px; line-height: 1.75; color: var(--gray-600); font-size: 14px; }
  .rich-light strong    { font-weight: 700; color: var(--brand-dark); }
  .rich-light a         { color: var(--teal); }

  /* ── EYEBROW TAG ── */
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border-radius: 3px;
    background: var(--brand-lavender);
    color: var(--brand-dark);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    margin-bottom: 18px;
    font-family: 'Montserrat', sans-serif;
  }
  .eyebrow::before {
    content: '';
    display: block;
    width: 16px;
    height: 2px;
    background: var(--brand-primary);
    border-radius: 2px;
  }

  .eyebrow-light {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border-radius: 3px;
    background: rgba(2,175,207,0.15);
    color: var(--brand-primary);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    margin-bottom: 18px;
    font-family: 'Montserrat', sans-serif;
  }
  .eyebrow-light::before {
    content: '';
    display: block;
    width: 16px;
    height: 2px;
    background: var(--brand-primary);
    border-radius: 2px;
  }

  /* ══════════════════════════
     HERO — full-bleed dark navy
     with diagonal bottom cut
  ══════════════════════════ */
  .hero-section {
    position: relative;
    background: var(--brand-dark);
    padding: 100px 48px 130px;
    overflow: hidden;
  }
  .hero-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 70% at 70% 50%, rgba(2,175,207,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 20% 80%, rgba(37,159,252,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  /* Diagonal clip at bottom */
  .hero-section::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    background: var(--white);
    clip-path: polygon(0 100%, 100% 0, 100% 100%);
  }
  .hero-inner {
    position: relative;
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 72px;
    align-items: center;
    z-index: 1;
  }
  .hero-inner.full { grid-template-columns: 1fr; max-width: 680px; }
  .hero-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(32px, 4vw, 58px);
    font-weight: 900;
    color: var(--white);
    line-height: 1.08;
    letter-spacing: -1px;
    margin-bottom: 20px;
  }
  .hero-title span {
    color: var(--brand-primary);
  }
  .hero-sub {
    font-size: 16px;
    font-weight: 400;
    color: rgba(255,255,255,0.68);
    line-height: 1.8;
    max-width: 430px;
    margin-bottom: 36px;
  }
  .hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 13px 28px;
    background: var(--brand-primary);
    color: var(--white);
    border-radius: 4px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-family: 'Montserrat', sans-serif;
    transition: background 0.2s, transform 0.15s;
    box-shadow: 0 4px 16px rgba(2,175,207,0.35);
  }
  .hero-cta:hover { background: var(--teal); transform: translateY(-1px); }
  .hero-img-wrap {
    position: relative;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .hero-img-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 3px solid rgba(2,175,207,0.3);
    border-radius: 6px;
    pointer-events: none;
  }
  .hero-img-wrap img {
    display: block;
    width: 100%;
    height: 400px;
    object-fit: cover;
  }
  /* Floating accent badge on hero image */
  .hero-badge {
    position: absolute;
    bottom: -18px;
    left: -18px;
    background: var(--brand-primary);
    color: var(--white);
    border-radius: 6px;
    padding: 16px 20px;
    box-shadow: var(--shadow-md);
    font-family: 'Montserrat', sans-serif;
    z-index: 2;
  }
  .hero-badge-num {
    font-size: 32px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 2px;
  }
  .hero-badge-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    opacity: 0.85;
  }

  /* ══════════════════════════
     MISSION — white bg, clean 2-col
  ══════════════════════════ */
  .mission-section {
    background: var(--white);
    padding: 96px 48px 80px;
    border-bottom: 1px solid var(--gray-200);
  }
  .mission-inner {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }
  .mission-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(24px, 2.8vw, 40px);
    font-weight: 800;
    color: var(--brand-dark);
    line-height: 1.12;
    letter-spacing: -0.8px;
    margin-bottom: 16px;
  }
  .mission-sub {
    font-size: 15px;
    font-weight: 400;
    color: var(--gray-600);
    line-height: 1.85;
    margin-bottom: 20px;
  }
  /* Right visual card — styled like reference blue panel */
  .mission-visual {
    background: var(--brand-dark);
    border-radius: 6px;
    padding: 44px 40px;
    position: relative;
    overflow: hidden;
  }
  .mission-visual::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(2,175,207,0.12);
    pointer-events: none;
  }
  .mission-visual::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -30px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(37,159,252,0.07);
    pointer-events: none;
  }
  .mission-visual-icon {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: var(--brand-primary);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px;
    position: relative; z-index: 1;
  }
  .mission-visual-quote {
    font-size: 16px;
    font-weight: 400;
    color: rgba(255,255,255,0.78);
    line-height: 1.9;
    font-style: italic;
    position: relative; z-index: 1;
    margin-bottom: 28px;
  }
  .mission-visual-divider {
    width: 40px; height: 3px;
    background: var(--brand-primary);
    border-radius: 2px;
    margin-bottom: 16px;
    position: relative; z-index: 1;
  }
  .mission-visual-author {
    font-family: 'Montserrat', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-primary);
    letter-spacing: 1.2px;
    text-transform: uppercase;
    position: relative; z-index: 1;
  }

  /* ══════════════════════════
     STATS — sand bg, horizontal
  ══════════════════════════ */
  .stats-section {
    background: var(--sand);
    padding: 72px 48px;
    border-bottom: 1px solid var(--gray-200);
  }
  .stats-heading {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(16px, 1.8vw, 22px);
    font-weight: 700;
    color: var(--brand-dark);
    text-align: center;
    margin-bottom: 48px;
    letter-spacing: -0.3px;
  }
  .stats-row {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    gap: 20px;
  }
  .stat-cell {
    background: var(--white);
    border-radius: 6px;
    padding: 36px 24px;
    text-align: center;
    border: 1px solid var(--gray-200);
    border-top: 4px solid var(--brand-primary);
    box-shadow: var(--shadow-sm);
    transition: transform 0.18s, box-shadow 0.18s, border-top-color 0.18s;
  }
  .stat-cell:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-top-color: var(--brand-dark);
  }
  .stat-num {
    font-family: 'Montserrat', sans-serif;
    font-size: 48px;
    font-weight: 900;
    color: var(--brand-dark);
    letter-spacing: -2px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .stat-num span { color: var(--brand-primary); }
  .stat-desc {
    font-size: 12px;
    font-weight: 600;
    color: var(--gray-400);
    letter-spacing: 1px;
    text-transform: uppercase;
    font-family: 'Montserrat', sans-serif;
  }

  /* ══════════════════════════
     VALUES — white bg, card grid
     matches "Nos Expertises" style
  ══════════════════════════ */
  .values-section {
    background: var(--white);
    padding: 88px 48px;
    border-bottom: 1px solid var(--gray-200);
  }
  .values-header {
    max-width: 1120px;
    margin: 0 auto 52px;
    text-align: center;
  }
  .values-header-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(26px, 2.8vw, 40px);
    font-weight: 800;
    color: var(--brand-dark);
    letter-spacing: -1px;
    line-height: 1.1;
    margin-bottom: 14px;
  }
  .values-header-title span { color: var(--brand-primary); }
  .values-header-sub {
    font-size: 15px;
    font-weight: 400;
    color: var(--gray-600);
    line-height: 1.75;
    max-width: 520px;
    margin: 0 auto;
  }
  .values-grid {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .value-item {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 6px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
    position: relative;
    overflow: hidden;
  }
  .value-item::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: var(--brand-primary);
    transform: scaleX(0);
    transition: transform 0.22s ease;
    transform-origin: left;
  }
  .value-item:hover {
    border-color: rgba(2,175,207,0.4);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  .value-item:hover::after { transform: scaleX(1); }
  /* "Active" / highlighted card — matches blue card in reference */
  .value-item.featured {
    background: var(--brand-dark);
    border-color: var(--brand-dark);
  }
  .value-item.featured::after { background: var(--brand-primary); transform: scaleX(1); }
  .value-item.featured .value-icon-box { background: rgba(2,175,207,0.2); border-color: rgba(2,175,207,0.3); color: var(--brand-primary); }
  .value-item.featured .value-item-title { color: var(--white); }
  .value-item.featured .value-item-text  { color: rgba(255,255,255,0.65); }
  .value-icon-box {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--brand-lavender);
    border: 1px solid rgba(5,51,102,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-dark);
    margin-bottom: 20px;
    transition: background 0.18s;
  }
  .value-item:not(.featured):hover .value-icon-box {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: var(--white);
  }
  .value-item-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--brand-dark);
    margin-bottom: 10px;
    letter-spacing: -0.2px;
  }
  .value-item-text {
    font-size: 13.5px;
    font-weight: 400;
    color: var(--gray-600);
    line-height: 1.72;
  }
  .value-link {
    margin-top: 20px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-primary);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-family: 'Montserrat', sans-serif;
  }
  .value-link svg { transition: transform 0.15s; }
  .value-link:hover svg { transform: translateX(3px); }

  /* ══════════════════════════
     TEAM — sand bg
  ══════════════════════════ */
  .team-section {
    background: var(--sand);
    padding: 88px 48px;
    border-bottom: 1px solid var(--gray-200);
  }
  .team-header {
    max-width: 1120px;
    margin: 0 auto 48px;
  }
  .team-section-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(24px, 2.8vw, 40px);
    font-weight: 800;
    color: var(--brand-dark);
    letter-spacing: -1px;
    line-height: 1.1;
    margin-bottom: 10px;
  }
  .team-section-sub {
    font-size: 15px;
    font-weight: 400;
    color: var(--gray-600);
    line-height: 1.75;
    max-width: 460px;
  }
  .team-grid {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .team-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
  }
  .team-card:hover {
    border-color: rgba(2,175,207,0.4);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  .team-photo { width: 100%; height: 220px; object-fit: cover; display: block; }
  .team-avatar {
    width: 100%; height: 220px;
    background: linear-gradient(145deg, var(--brand-lavender), #c9d8ff);
    display: flex; align-items: center; justify-content: center;
  }
  .team-avatar-letter {
    font-family: 'Montserrat', sans-serif;
    font-size: 64px; font-weight: 900; color: var(--brand-dark); opacity: 0.2;
  }
  .team-info { padding: 20px 22px 24px; }
  .team-name {
    font-family: 'Montserrat', sans-serif;
    font-size: 15px; font-weight: 700; color: var(--brand-dark); margin-bottom: 4px;
  }
  .team-role {
    font-size: 11px; font-weight: 700; color: var(--brand-primary);
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;
    font-family: 'Montserrat', sans-serif;
  }
  .team-bio { font-size: 13px; font-weight: 400; color: var(--gray-600); line-height: 1.68; }

  /* ══════════════════════════
     CTA — brand dark with accent
  ══════════════════════════ */
  .cta-section {
    background: var(--brand-dark);
    padding: 96px 48px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cta-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 80% at 80% 50%, rgba(2,175,207,0.1) 0%, transparent 65%),
      radial-gradient(ellipse 40% 60% at 10% 60%, rgba(37,159,252,0.07) 0%, transparent 60%);
    pointer-events: none;
  }
  .cta-title {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(26px, 3.5vw, 50px);
    font-weight: 900;
    color: var(--white);
    letter-spacing: -1.5px;
    line-height: 1.08;
    margin-bottom: 16px;
    position: relative;
  }
  .cta-title span { color: var(--brand-primary); }
  .cta-sub {
    font-size: 16px;
    font-weight: 400;
    color: rgba(255,255,255,0.6);
    line-height: 1.75;
    max-width: 440px;
    margin: 0 auto 40px;
    position: relative;
  }
  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 32px;
    background: var(--brand-primary);
    color: var(--white);
    border-radius: 4px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    font-family: 'Montserrat', sans-serif;
    transition: background 0.2s, gap 0.15s, transform 0.15s;
    box-shadow: 0 6px 24px rgba(2,175,207,0.4);
    position: relative;
  }
  .cta-btn:hover {
    background: var(--teal);
    gap: 16px;
    transform: translateY(-1px);
  }

  /* ══════════════════════════
     DIVIDER ACCENT
  ══════════════════════════ */
  .section-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .section-divider-line {
    width: 32px;
    height: 3px;
    border-radius: 2px;
    background: var(--brand-primary);
  }

  /* ══════════════════════════
     RESPONSIVE
  ══════════════════════════ */
  @media (max-width: 960px) {
    .hero-inner    { grid-template-columns: 1fr; gap: 40px; }
    .hero-sub      { max-width: 100%; }
    .hero-img-wrap img { height: 280px; }
    .mission-inner { grid-template-columns: 1fr; gap: 36px; }
    .values-grid   { grid-template-columns: repeat(2, 1fr); }
    .team-grid     { grid-template-columns: repeat(2, 1fr); }
    .stats-row     { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 640px) {
    .hero-section, .mission-section, .stats-section,
    .values-section, .team-section, .cta-section { padding: 60px 20px; }
    .hero-section { padding-bottom: 90px; }
    .hero-img-wrap img { height: 220px; }
    .hero-badge { display: none; }
    .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
    .stat-num  { font-size: 36px; }
    .values-grid { grid-template-columns: 1fr; }
    .team-grid { grid-template-columns: 1fr; }
    .cta-btn   { width: 100%; justify-content: center; }
  }
  @media (max-width: 380px) {
    .stats-row { grid-template-columns: 1fr !important; }
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

  const statsItems  = (stats?.meta?.items  as { value: string; label: string }[])                     ?? [];
  const valuesItems = (values?.meta?.items as { icon: string; title: string; text: string }[])         ?? [];
  const teamMembers = (team?.meta?.members as { name: string; role: string; photo: string; bio: string }[]) ?? [];

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
      <div style={{ paddingTop: 64 }} />

      {/* ── HERO ── */}
      {hero && (
        <section aria-label="Présentation" className="hero-section">
          <div className={`hero-inner${hero.image_url ? "" : " full"}`}>
            <div>
              <span className="eyebrow-light">À propos de nous</span>
              <h1 className="hero-title">{hero.title}</h1>
              {hero.subtitle && <p className="hero-sub">{hero.subtitle}</p>}
              {hero.content && (
                <div className="rich-dark" dangerouslySetInnerHTML={{ __html: hero.content }} />
              )}
              <Link href="/excursions" className="hero-cta">
                Découvrir nos excursions
                <ArrowRight size={16} />
              </Link>
            </div>
            {hero.image_url && (
              <div className="hero-img-wrap">
                <img src={hero.image_url} alt={hero.title ?? "VoyajAime"} />
                <div className="hero-badge">
                  <p className="hero-badge-num">+2K</p>
                  <p className="hero-badge-label">Voyageurs</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── MISSION ── */}
      {mission && (
        <section aria-labelledby="mission-heading" className="mission-section">
          <div className="mission-inner">
            <div>
              <span className="eyebrow">Notre mission</span>
              {mission.title && (
                <h2 id="mission-heading" className="mission-title">{mission.title}</h2>
              )}
              {mission.subtitle && <p className="mission-sub">{mission.subtitle}</p>}
              {mission.content && (
                <div className="rich-light" dangerouslySetInnerHTML={{ __html: mission.content }} />
              )}
            </div>
            <div className="mission-visual">
              <div className="mission-visual-icon">
                <Globe size={24} color="white" strokeWidth={1.8} />
              </div>
              <p className="mission-visual-quote">
                {mission.subtitle ?? "Notre engagement est de proposer des expériences de voyage authentiques, responsables et mémorables à travers toute la Tunisie."}
              </p>
              <div className="mission-visual-divider" />
              <p className="mission-visual-author">— VoyajAime, {new Date().getFullYear()}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── STATS ── */}
      {stats && statsItems.length > 0 && (
        <section aria-labelledby="stats-heading" className="stats-section">
          {stats.title && (
            <h2 id="stats-heading" className="stats-heading">{stats.title}</h2>
          )}
          <div
            className="stats-row"
            style={{ gridTemplateColumns: `repeat(${Math.min(statsItems.length, 4)}, 1fr)` }}
          >
            {statsItems.map((item, i) => (
              <div key={i} className="stat-cell">
                <p className="stat-num">{item.value}</p>
                <p className="stat-desc">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── VALEURS ── */}
      {values && valuesItems.length > 0 && (
        <section aria-labelledby="values-heading" className="values-section">
          <div className="values-header">
            <span className="eyebrow">Ce qui nous guide</span>
            {values.title && (
              <h2 id="values-heading" className="values-header-title">{values.title}</h2>
            )}
            {values.subtitle && (
              <p className="values-header-sub">{values.subtitle}</p>
            )}
          </div>
          <div className="values-grid">
            {valuesItems.map((item, i) => (
              <div key={i} className={`value-item${i === 1 ? " featured" : ""}`}>
                <div className="value-icon-box">
                  {ICON_MAP[item.icon] ?? <Star size={22} strokeWidth={1.8} />}
                </div>
                <p className="value-item-title">{item.title}</p>
                <p className="value-item-text">{item.text}</p>
                <a href="#" className="value-link">
                  En savoir plus <ArrowRight size={12} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ÉQUIPE ── */}
      {team && (
        <section aria-labelledby="team-heading" className="team-section">
          <div className="team-header">
            <span className="eyebrow">Notre équipe</span>
            {team.title && (
              <h2 id="team-heading" className="team-section-title">{team.title}</h2>
            )}
            {team.subtitle && <p className="team-section-sub">{team.subtitle}</p>}
          </div>

          {teamMembers.length > 0 && (
            <div className="team-grid">
              {teamMembers.map((m, i) => (
                <article key={i} className="team-card">
                  {m.photo ? (
                    <img className="team-photo" src={m.photo} alt={`${m.name} — ${m.role}`} />
                  ) : (
                    <div className="team-avatar">
                      <span className="team-avatar-letter">{m.name?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
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

      {/* ── CTA ── */}
      {cta && (
        <section aria-labelledby="cta-heading" className="cta-section">
          <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
            <span className="eyebrow-light">Passez à l'action</span>
            {cta.title && (
              <h2 id="cta-heading" className="cta-title">{cta.title}</h2>
            )}
            {cta.subtitle && <p className="cta-sub">{cta.subtitle}</p>}
            <Link href={(cta.meta?.button_url as string) ?? "/excursions"} className="cta-btn">
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