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
  heart:  <Heart  size={20} strokeWidth={1.6} />,
  shield: <ShieldCheck size={20} strokeWidth={1.6} />,
  globe:  <Globe  size={20} strokeWidth={1.6} />,
  star:   <Star   size={20} strokeWidth={1.6} />,
  map:    <MapPin size={20} strokeWidth={1.6} />,
  users:  <Users  size={20} strokeWidth={1.6} />,
};

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --dark:      #0d1117;
    --dark-2:    #161b27;
    --dark-3:    #1e2536;
    --teal:      #02AFCF;
    --teal-dim:  rgba(2,175,207,0.12);
    --teal-dim2: rgba(2,175,207,0.07);
    --white:     #ffffff;
    --off-white: #f0f4f8;
    --muted:     rgba(255,255,255,0.52);
    --muted2:    rgba(255,255,255,0.28);
    --border:    rgba(255,255,255,0.08);
    --border-lt: #e4eaf0;
    --navy:      #053366;
  }

  body {
    font-family: inherit'Plus Jakarta Sans', system-ui, sans-serif;
    background: var(--dark);
    color: var(--white);
    -webkit-font-smoothing: antialiased;
  }

  /* ── RICH CONTENT dark ── */
  .rich-dark p          { margin-bottom: 14px; line-height: 1.85; font-size: 15px; color: var(--muted); font-weight: 300; }
  .rich-dark h2         { font-size: 20px; font-weight: 700; color: var(--white); margin-bottom: 10px; }
  .rich-dark ul         { padding-left: 20px; margin-bottom: 14px; }
  .rich-dark ul li      { margin-bottom: 6px; line-height: 1.75; color: var(--muted); font-size: 14px; }
  .rich-dark blockquote { border-left: 2px solid var(--teal); padding: 12px 20px; background: var(--teal-dim); border-radius: 0 6px 6px 0; margin: 16px 0; color: var(--muted); font-style: italic; }
  .rich-dark a          { color: var(--teal); text-decoration: underline; text-underline-offset: 3px; }
  .rich-dark strong     { font-weight: 700; color: var(--white); }

  /* ── RICH CONTENT light ── */
  .rich-light p         { margin-bottom: 14px; line-height: 1.85; font-size: 15px; color: #4B5563; font-weight: 300; }
  .rich-light ul        { padding-left: 20px; margin-bottom: 14px; }
  .rich-light ul li     { margin-bottom: 6px; line-height: 1.75; color: #4B5563; font-size: 14px; }
  .rich-light strong    { font-weight: 700; color: var(--navy); }
  .rich-light a         { color: var(--teal); }

  /* ── TAG / EYEBROW ── */
  .tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 100px;
    border: 1px solid var(--teal);
    color: var(--teal);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .tag-light {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 100px;
    border: 1px solid rgba(2,175,207,0.4);
    color: var(--teal);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  /* ══════════════════════════
     HERO — dark bg, 2-col
  ══════════════════════════ */
  .hero-section {
    background: var(--dark);
    padding: 96px 48px 88px;
    border-bottom: 1px solid var(--border);
  }
  .hero-inner {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 72px;
    align-items: center;
  }
  .hero-inner.full { grid-template-columns: 1fr; max-width: 720px; }
  .hero-title {
    font-size: clamp(34px, 4.5vw, 62px);
    font-weight: 800;
    color: var(--white);
    line-height: 1.06;
    letter-spacing: -1.5px;
    margin-bottom: 20px;
  }
  .hero-title span { color: var(--teal); }
  .hero-sub {
    font-size: 16px;
    font-weight: 300;
    color: var(--muted);
    line-height: 1.8;
    max-width: 440px;
    margin-bottom: 32px;
  }
  .hero-img-wrap {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--dark-3);
  }
  .hero-img-wrap img {
    display: block;
    width: 100%;
    height: 420px;
    object-fit: cover;
    opacity: 0.9;
  }

  /* ══════════════════════════
     MISSION — light bg
  ══════════════════════════ */
  .mission-section {
    background: var(--off-white);
    padding: 88px 48px;
    border-bottom: 1px solid var(--border-lt);
  }
  .mission-inner {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 72px;
    align-items: center;
  }
  .mission-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--teal);
    margin-bottom: 14px;
  }
  .mission-title {
    font-size: clamp(26px, 3vw, 44px);
    font-weight: 800;
    color: var(--navy);
    line-height: 1.1;
    letter-spacing: -1px;
    margin-bottom: 16px;
  }
  .mission-sub {
    font-size: 16px;
    font-weight: 300;
    color: #4B5563;
    line-height: 1.8;
    margin-bottom: 20px;
  }
  /* Decorative right side */
  .mission-visual {
    background:  var(--dark);
    border-radius: 16px;
    padding: 40px 36px;
    border: 1px solid rgba(2,175,207,0.2);
  }
  .mission-visual-quote {
    font-size: 15px;
    font-weight: 300;
    color: rgba(255,255,255,0.7);
    line-height: 1.85;
    font-style: italic;
    border-left: 3px solid var(--teal);
    padding-left: 20px;
  }
  .mission-visual-author {
    margin-top: 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--teal);
    letter-spacing: 0.5px;
  }

  /* ══════════════════════════
     STATS — dark bg, horizontal strip
  ══════════════════════════ */
  .stats-section {
    background: var(--off-white);
    padding: 72px 48px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .stats-heading {
    font-size: clamp(18px, 2vw, 26px);
    font-weight: 700;
    color: var(--navy);
    text-align: center;
    margin-bottom: 48px;
    letter-spacing: -0.5px;
  }
  .stats-row {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .stat-cell {
    padding: 40px 28px;
    text-align: center;
    border-right: 1px solid var(--border);
    background: var(--dark-3);
    transition: background 0.18s;
  }
  .stat-cell:last-child { border-right: none; }
  .stat-cell:hover { background:  var(--teal); }
  .stat-num {
    font-size: 52px;
    font-weight: 800;
    color: var(--white);
    letter-spacing: -2px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .stat-num span { color: var(--teal); }
  .stat-desc {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* ══════════════════════════
     VALUES — dark bg, 2-col list
  ══════════════════════════ */
  .values-section {
    background: var(--off-white);
    padding: 88px 48px;
    border-bottom: 1px solid var(--border);
  }
  .values-header {
    max-width: 1120px;
    margin: 0 auto 52px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: end;
  }
  .values-header-title {
    font-size: clamp(28px, 3vw, 46px);
    font-weight: 800;
    color: var(--navy);
    letter-spacing: -1.5px;
    line-height: 1.08;
  }
  .values-header-title span { color: var(--teal); }
  .values-header-sub {
    font-size: 15px;
    font-weight: 300;
    color: var(--muted);
    line-height: 1.8;
  }
  .values-grid {
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .value-item {
    background: var(--dark-2);
    padding: 28px 32px;
    display: flex;
    gap: 20px;
    align-items: flex-start;
    transition: background 0.18s;
  }
  .value-item:hover { background: var(--dark-3); }
  .value-icon-box {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--teal-dim);
    border: 1px solid rgba(2,175,207,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--teal);
    transition: background 0.18s;
  }
  .value-item:hover .value-icon-box { background: var(--teal-dim2); }
  .value-item-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 6px;
    letter-spacing: -0.2px;
  }
  .value-item-text {
    font-size: 13.5px;
    font-weight: 300;
    color: var(--muted);
    line-height: 1.72;
  }

  /* ══════════════════════════
     TEAM — light bg
  ══════════════════════════ */
  .team-section {
    background: var(--off-white);
    padding: 88px 48px;
    border-bottom: 1px solid var(--border-lt);
  }
  .team-header {
    max-width: 1120px;
    margin: 0 auto 48px;
    text-align: center;
  }
  .team-section-title {
    font-size: clamp(26px, 3vw, 44px);
    font-weight: 800;
    color: var(--navy);
    letter-spacing: -1.2px;
    line-height: 1.1;
    margin-bottom: 12px;
  }
  .team-section-sub {
    font-size: 15.5px;
    font-weight: 300;
    color: #4B5563;
    line-height: 1.75;
    max-width: 480px;
    margin: 0 auto;
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
    border: 1px solid var(--border-lt);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .team-card:hover {
    border-color: rgba(2,175,207,0.35);
    box-shadow: 0 8px 32px rgba(2,175,207,0.09);
  }
  .team-photo { width: 100%; height: 220px; object-fit: cover; display: block; }
  .team-avatar {
    width: 100%; height: 220px;
    background: linear-gradient(160deg, #dff4f9, #eef2ff);
    display: flex; align-items: center; justify-content: center;
  }
  .team-avatar-letter {
    font-size: 64px; font-weight: 800; color: var(--navy); opacity: 0.15; letter-spacing: -2px;
  }
  .team-info { padding: 20px 22px 22px; }
  .team-name { font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
  .team-role {
    font-size: 11px; font-weight: 600; color: var(--teal);
    text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px;
  }
  .team-bio { font-size: 13px; font-weight: 300; color: #4B5563; line-height: 1.68; }

  /* ══════════════════════════
     CTA — dark navy
  ══════════════════════════ */
  .cta-section {
    background:  var(--off-white);
    padding: 96px 48px;
    text-align: center;
    border-top: 1px solid rgba(2,175,207,0.15);
  }
  .cta-title {
    font-size: clamp(28px, 4vw, 56px);
    font-weight: 800;
    color: var(--navy);
    letter-spacing: -2px;
    line-height: 1.06;
    margin-bottom: 16px;
  }
  .cta-title span { color: var(--teal); }
  .cta-sub {
    font-size: 16px;
    font-weight: 300;
    color: rgba(255,255,255,0.55);
    line-height: 1.75;
    max-width: 460px;
    margin: 0 auto 40px;
  }
  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 15px 30px;
    background:  var(--teal);
    color: var(--off-white);
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    letter-spacing: 0.2px;
    transition: background 0.2s, gap 0.18s;
  }
  .cta-btn:hover { background: #019ab8; gap: 16px; }

  /* ══════════════════════════
     RESPONSIVE
  ══════════════════════════ */
  @media (max-width: 960px) {
    .hero-inner    { grid-template-columns: 1fr; gap: 32px; }
    .hero-sub      { max-width: 100%; }
    .hero-img-wrap img { height: 280px; }
    .mission-inner { grid-template-columns: 1fr; gap: 32px; }
    .values-header { grid-template-columns: 1fr; gap: 12px; }
    .values-grid   { grid-template-columns: 1fr; }
    .team-grid     { grid-template-columns: repeat(2, 1fr); }
    .stats-row     { grid-template-columns: repeat(2, 1fr) !important; }
    .stat-cell:nth-child(2) { border-right: none; }
    .stat-cell:nth-child(odd) { border-right: 1px solid var(--border); }
    .stat-cell { border-bottom: 1px solid var(--border); }
    .stat-cell:last-child, .stat-cell:nth-last-child(2):nth-child(odd) { border-bottom: none; }
  }
  @media (max-width: 640px) {
    .hero-section, .mission-section, .stats-section,
    .values-section, .team-section, .cta-section { padding: 56px 20px; }
    .hero-img-wrap img { height: 220px; }
    .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
    .stat-num  { font-size: 38px; }
    .team-grid { grid-template-columns: 1fr; }
    .cta-btn   { width: 100%; justify-content: center; }
  }
  @media (max-width: 380px) {
    .stats-row { grid-template-columns: 1fr !important; }
    .stat-cell { border-right: none !important; }
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
              <span className="tag">À propos</span>
              <h1 className="hero-title">{hero.title}</h1>
              {hero.subtitle && <p className="hero-sub">{hero.subtitle}</p>}
              {hero.content && (
                <div className="rich-dark" dangerouslySetInnerHTML={{ __html: hero.content }} />
              )}
            </div>
            {hero.image_url && (
              <div className="hero-img-wrap">
                <img src={hero.image_url} alt={hero.title ?? "VoyajAime"} />
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
              <p className="mission-label">Notre mission</p>
              {mission.title && (
                <h2 id="mission-heading" className="mission-title">{mission.title}</h2>
              )}
              {mission.subtitle && <p className="mission-sub">{mission.subtitle}</p>}
              {mission.content && (
                <div className="rich-light" dangerouslySetInnerHTML={{ __html: mission.content }} />
              )}
            </div>
            {/* Decorative block — always shown for layout balance */}
            <div className="mission-visual">
              <p className="mission-visual-quote">
                {mission.subtitle ?? "Notre engagement est de proposer des expériences de voyage authentiques, responsables et mémorables à travers toute la Tunisie."}
              </p>
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
            <div>
              <span className="tag">Ce qui nous guide</span>
              {values.title && (
                <h2 id="values-heading" className="values-header-title">{values.title}</h2>
              )}
            </div>
            {values.subtitle && (
              <p className="values-header-sub">{values.subtitle}</p>
            )}
          </div>
          <div className="values-grid">
            {valuesItems.map((item, i) => (
              <div key={i} className="value-item">
                <div className="value-icon-box">
                  {ICON_MAP[item.icon] ?? <Star size={20} strokeWidth={1.6} />}
                </div>
                <div>
                  <p className="value-item-title">{item.title}</p>
                  <p className="value-item-text">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ÉQUIPE ── */}
      {team && (
        <section aria-labelledby="team-heading" className="team-section">
          <div className="team-header">
            <span className="tag-light">Notre équipe</span>
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
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
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