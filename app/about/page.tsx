import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { Heart, ShieldCheck, Globe, Star, ArrowRight, MapPin, Users } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import TouristeNav from "@/app/components/touriste/TouristeNav";

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
interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null;
  cover_image: string | null; category: string | null; published_at: string | null;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart:  <Heart  size={20} color="#374151" strokeWidth={1.8} />,
  shield: <ShieldCheck size={20} color="#374151" strokeWidth={1.8} />,
  globe:  <Globe  size={20} color="#374151" strokeWidth={1.8} />,
  star:   <Star   size={20} color="#374151" strokeWidth={1.8} />,
  map:    <MapPin size={20} color="#374151" strokeWidth={1.8} />,
  users:  <Users  size={20} color="#374151" strokeWidth={1.8} />,
};

const PLACEHOLDER_POSTS: BlogPost[] = [
  { id:"1", slug:"hidden-gems",  title:'Top 10 Hidden Gems: Uncover Top Secret Destinations Off the Beaten Path"', excerpt:"Browse through our handpicked selection of destinations and tour packages, each designed to inspire and delight.", cover_image:null, category:"Solo Travel", published_at:null },
  { id:"2", slug:"beach-1", title:"Unveiling the Best Beach Destinations", excerpt:"Browse through our handpicked selection of destinations", cover_image:null, category:"Solo Travel", published_at:null },
  { id:"3", slug:"beach-2", title:"Unveiling the Best Beach Destinations", excerpt:"Browse through our handpicked selection of destinations", cover_image:null, category:"Solo Travel", published_at:null },
  { id:"4", slug:"beach-3", title:"Unveiling the Best Beach Destinations", excerpt:"Browse through our handpicked selection of destinations", cover_image:null, category:"Solo Travel", published_at:null },
  { id:"5", slug:"beach-4", title:"Unveiling the Best Beach Destinations", excerpt:"Browse through our handpicked selection of destinations", cover_image:null, category:"Solo Travel", published_at:null },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #ffffff; color: #111827; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .fu  { animation: fadeUp .6s ease both; }
  .fu1 { animation-delay: .05s; } .fu2 { animation-delay: .15s; } .fu3 { animation-delay: .25s; } .fu4 { animation-delay: .35s; }

  /* ── Rich content ── */
  .rich-content p          { margin-bottom:14px; line-height:1.85; font-size:16px; color:#4B5563; }
  .rich-content h1         { font-family:'Playfair Display',serif; font-size:28px; font-weight:900; color:#111827; margin-bottom:14px; }
  .rich-content h2         { font-family:'Playfair Display',serif; font-size:21px; font-weight:700; color:#111827; margin-bottom:10px; }
  .rich-content ul         { padding-left:20px; margin-bottom:14px; }
  .rich-content ul li      { margin-bottom:6px; line-height:1.75; color:#4B5563; }
  .rich-content blockquote { border-left:3px solid #D1D5DB; padding:12px 18px; background:#F9FAFB; border-radius:0 8px 8px 0; margin:16px 0; font-style:italic; color:#6B7280; }
  .rich-content a          { color:#111827; text-decoration:underline; text-underline-offset:2px; }
  .rich-content strong     { font-weight:700; color:#111827; }
  .rich-content hr         { border:none; border-top:1px solid #E5E7EB; margin:20px 0; }

  /* ── Divider accent ── */
  .divider { width:32px; height:2px; background:#111827; border-radius:2px; }

  /* ── Stat cards ── */
  .stat-card {
    text-align:center; padding:32px 20px;
    border-radius:12px; background:#F9FAFB;
    border:1px solid #E5E7EB; transition:all .2s;
  }
  .stat-card:hover { background:#F3F4F6; border-color:#D1D5DB; }

  /* ── Value cards ── */
  .value-card {
    padding:28px; border-radius:12px;
    background:white; border:1px solid #E5E7EB;
    transition:all .2s;
  }
  .value-card:hover { border-color:#9CA3AF; box-shadow:0 4px 16px rgba(0,0,0,.06); }

  /* ── Team cards ── */
  .team-card {
    background:white; border-radius:12px;
    overflow:hidden; border:1px solid #E5E7EB;
    transition:all .2s;
  }
  .team-card:hover { border-color:#9CA3AF; box-shadow:0 4px 16px rgba(0,0,0,.06); }

  /* ── CTA button ── */
  .cta-btn {
    display:inline-flex; align-items:center; gap:10px;
    padding:16px 32px; background:#02AFCF; color:white;
    border-radius:10px; font-size:15px; font-weight:700;
    text-decoration:none; transition:all .2s; letter-spacing:-.1px;
  }
  .cta-btn:hover { background:#053366; transform:translateY(-1px); gap:14px; }

  /* ── Blog ── */
  .blog-layout {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:40px;
    align-items:start;
  }
  .blog-featured {
    display:flex; flex-direction:column;
    text-decoration:none; color:inherit;
  }
  .blog-featured-img-wrap {
    width:100%; overflow:hidden; background:#F3F4F6;
  }
  .blog-featured-img {
    width:100%; height:260px; object-fit:cover; display:block;
    transition:transform .3s;
  }
  .blog-featured:hover .blog-featured-img { transform:scale(1.02); }

  .blog-featured-body { padding:20px 0 0; }
  .blog-featured-title {
    font-family:'Playfair Display',serif;
    font-size:20px; font-weight:900; color:#111827;
    line-height:1.28; margin-bottom:10px; letter-spacing:-.2px;
  }

  .blog-small-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:20px;
  }
  .blog-small-card {
    display:flex; flex-direction:column;
    text-decoration:none; color:inherit;
  }
  .blog-small-img-wrap { width:100%; overflow:hidden; background:#F3F4F6; }
  .blog-small-img {
    width:100%; height:136px; object-fit:cover; display:block;
    transition:transform .3s;
  }
  .blog-small-card:hover .blog-small-img { transform:scale(1.03); }
  .blog-small-body { padding:10px 0 0; }
  .blog-small-title {
    font-family:'Playfair Display',serif;
    font-size:14px; font-weight:800; color:#111827;
    line-height:1.32; margin-bottom:6px;
  }

  .blog-tag    { display:block; font-size:11px; font-weight:700; color:#6B7280; letter-spacing:.4px; margin-bottom:7px; text-transform:uppercase; }
  .blog-excerpt { font-size:13px; color:#6B7280; line-height:1.65; }

  /* ── Section label ── */
  .section-label {
    font-size:11px; font-weight:800; color:#9CA3AF;
    text-transform:uppercase; letter-spacing:2.5px;
  }

  /* ── Responsive ── */
  @media(max-width:900px){
    .blog-layout      { grid-template-columns:1fr!important; gap:28px; }
    .stats-grid       { grid-template-columns:1fr 1fr!important; }
    .values-grid      { grid-template-columns:1fr 1fr!important; }
    .team-grid        { grid-template-columns:1fr 1fr!important; }
  }
  @media(max-width:560px){
    .blog-small-grid  { grid-template-columns:1fr; }
    .values-grid      { grid-template-columns:1fr!important; }
    .team-grid        { grid-template-columns:1fr!important; }
    .stats-grid       { grid-template-columns:1fr!important; }
  }
`;

/* ── Image placeholder ── */
function BlogImgPlaceholder({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", width:"100%", ...style }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#E5E7EB"/>
        <path d="M4 24l8-9 5 5 4-4 7 8H4z" fill="#D1D5DB"/>
        <circle cx="22" cy="10" r="3.5" fill="#D1D5DB"/>
      </svg>
    </div>
  );
}

export default async function AboutPage() {
  const supabase = await createServerSupabaseClient();

  const { data: sections } = await supabase
    .from("about_content")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });

  let posts: BlogPost[] = PLACEHOLDER_POSTS;
  try {
    const { data: blogData } = await supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,cover_image,category,published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(5);
    if (blogData && blogData.length > 0) posts = blogData as BlogPost[];
  } catch { /* table inexistante */ }

  const get = (s: string) => sections?.find((x: Section) => x.section === s) as Section | undefined;
  const hero    = get("hero");
  const mission = get("mission");
  const stats   = get("stats");
  const values  = get("values");
  const team    = get("team");
  const cta     = get("cta");

  const featured   = posts[0];
  const smallCards = posts.slice(1, 5);

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
      <div style={{ paddingTop:64 }} />

      {/* ══ HERO ══ */}
      {hero && (
        <section
          aria-label="Présentation"
          style={{ background:"#F9FAFB", borderBottom:"1px solid #E5E7EB", padding:"80px 40px" }}
        >
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
           

            <div style={{ display:"grid", gridTemplateColumns: hero.image_url ? "1fr 1fr" : "1fr", gap:64, alignItems:"center", maxWidth: hero.image_url ? "100%" : 720 }}>
              <div>
                <p className="fu fu1 section-label" style={{ marginBottom:16 }}>À propos de VoyajAime</p>
                <h1
                  className="fu fu2"
                  style={{
                    fontFamily:"'Playfair Display',serif",
                    fontSize:"clamp(36px,5vw,60px)",
                    fontWeight:900,
                    color:"#053366",
                    letterSpacing:"-2px",
                    lineHeight:1.06,
                    marginBottom:20,
                  }}
                >
                  {hero.title}
                </h1>
                {hero.subtitle && (
                  <p className="fu fu3" style={{ fontSize:17, color:"#6B7280", lineHeight:1.7, marginBottom:24, maxWidth:480 }}>
                    {hero.subtitle}
                  </p>
                )}
                {hero.content && (
                  <div className="fu fu4 rich-content" dangerouslySetInnerHTML={{ __html: hero.content }} />
                )}
              </div>

              {hero.image_url && (
                <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid #E5E7EB" }}>
                  <img
                    src={hero.image_url}
                    alt={hero.title ?? "VoyajAime"}
                    style={{ width:"100%", height:380, objectFit:"cover", display:"block" }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══ MISSION ══ */}
      {mission && (
        <section aria-labelledby="mission-heading" style={{ padding:"80px 40px", background:"#ffffff" }}>
          <div style={{ maxWidth:860, margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div className="divider" />
              <p className="section-label">Notre mission</p>
            </div>
            {mission.title && (
              <h2 id="mission-heading" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3vw,40px)", fontWeight:900, color:"#053366", letterSpacing:"-1px", marginBottom:12, lineHeight:1.12 }}>
                {mission.title}
              </h2>
            )}
            {mission.subtitle && (
              <p style={{ fontSize:17, color:"#6B7280", marginBottom:24, lineHeight:1.65 }}>{mission.subtitle}</p>
            )}
            {mission.content && (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: mission.content }} />
            )}
          </div>
        </section>
      )}

      {/* ══ STATS ══ */}
      {stats && (stats.meta?.items as { value:string; label:string }[])?.length > 0 && (
        <section aria-labelledby="stats-heading" style={{ padding:"72px 40px", background:"#F9FAFB", borderTop:"1px solid #E5E7EB", borderBottom:"1px solid #E5E7EB" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            {stats.title && (
              <h2 id="stats-heading" style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:900, color:"#053366", textAlign:"center", marginBottom:40, letterSpacing:"-.5px" }}>
                {stats.title}
              </h2>
            )}
            <div
              className="stats-grid"
              style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min((stats.meta.items as []).length,4)},1fr)`, gap:18 }}
            >
              {(stats.meta.items as { value:string; label:string }[]).map((item, i) => (
                <div key={i} className="stat-card">
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:900, color:"#053366", marginBottom:8, lineHeight:1 }}>
                    {item.value}
                  </p>
                  <p style={{ fontSize:13, fontWeight:600, color:"#6B7280" }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ VALEURS ══ */}
      {values && (values.meta?.items as { icon:string; title:string; text:string }[])?.length > 0 && (
        <section aria-labelledby="values-heading" style={{ padding:"80px 40px", background:"#ffffff" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:14 }}>
                <div className="divider" />
                <p className="section-label">Ce qui nous guide</p>
                <div className="divider" />
              </div>
              {values.title && (
                <h2 id="values-heading" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3vw,40px)", fontWeight:900, color:"#053366", letterSpacing:"-1px", lineHeight:1.1, marginBottom:10 }}>
                  {values.title}
                </h2>
              )}
              {values.subtitle && (
                <p style={{ fontSize:16, color:"#6B7280", maxWidth:480, margin:"0 auto", lineHeight:1.65 }}>{values.subtitle}</p>
              )}
            </div>
            <div
              className="values-grid"
              style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min((values.meta.items as []).length,4)},1fr)`, gap:16 }}
            >
              {(values.meta.items as { icon:string; title:string; text:string }[]).map((item, i) => (
                <div key={i} className="value-card">
                  <div style={{ width:44, height:44, borderRadius:10, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                    {ICON_MAP[item.icon] ?? <Star size={20} color="#374151" strokeWidth={1.8} />}
                  </div>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:800, color:"#053366", marginBottom:8 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize:14, color:"#6B7280", lineHeight:1.72 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ ÉQUIPE ══ */}
      {team && (
        <section aria-labelledby="team-heading" style={{ padding:"80px 40px", background:"#F9FAFB", borderTop:"1px solid #E5E7EB" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:14 }}>
                <div className="divider" />
                <p className="section-label">Notre équipe</p>
                <div className="divider" />
              </div>
              {team.title && (
                <h2 id="team-heading" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3vw,40px)", fontWeight:900, color:"#053366", letterSpacing:"-1px", lineHeight:1.1, marginBottom:10 }}>
                  {team.title}
                </h2>
              )}
              {team.subtitle && <p style={{ fontSize:16, color:"#6B7280", lineHeight:1.6 }}>{team.subtitle}</p>}
              {team.content && (
                <div className="rich-content" style={{ maxWidth:580, margin:"14px auto 0" }} dangerouslySetInnerHTML={{ __html: team.content }} />
              )}
            </div>

            {((team.meta?.members ?? []) as { name:string; role:string; photo:string; bio:string }[]).length > 0 && (
              <div className="team-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
                {(team.meta.members as { name:string; role:string; photo:string; bio:string }[]).map((m, i) => (
                  <article key={i} className="team-card">
                    <div style={{ height:200, overflow:"hidden", background:"#E5E7EB" }}>
                      {m.photo
                        ? <img src={m.photo} alt={`${m.name} — ${m.role} chez VoyajAime`} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : (
                          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"#F3F4F6" }}>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:"#D1D5DB" }}>
                              {m.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                    </div>
                    <div style={{ padding:"20px" }}>
                      <h3 style={{ fontSize:15, fontWeight:800, color:"#053366", marginBottom:4 }}>{m.name}</h3>
                      <p style={{ fontSize:12, fontWeight:700, color:"#6B7280", marginBottom:10, textTransform:"uppercase", letterSpacing:".5px" }}>{m.role}</p>
                      {m.bio && <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.65 }}>{m.bio}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

         
      {/* ══ CTA ══ */}
      {cta && (
        <section
          aria-labelledby="cta-heading"
          style={{ padding:"80px 40px", background:"#F9FAFB", borderTop:"1px solid #E5E7EB", textAlign:"center" }}
        >
          <div style={{ maxWidth:580, margin:"0 auto" }}>
            {cta.title && (
              <h2 id="cta-heading" style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,3.5vw,44px)", fontWeight:900, color:"#053366", letterSpacing:"-1px", lineHeight:1.1, marginBottom:14 }}>
                {cta.title}
              </h2>
            )}
            {cta.subtitle && (
              <p style={{ fontSize:17, color:"#6B7280", marginBottom:12, lineHeight:1.65 }}>{cta.subtitle}</p>
            )}
            {cta.content && (
              <div className="rich-content" style={{ marginBottom:32 }} dangerouslySetInnerHTML={{ __html: cta.content }} />
            )}
            <Link href={(cta.meta?.button_url as string) ?? "/excursions"} className="cta-btn">
              {(cta.meta?.button_text as string) ?? "Commencer l'aventure"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ background:"#F3F4F6", borderTop:"1px solid #E5E7EB", padding:"24px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <p style={{ color:"#9CA3AF", fontSize:13 }}>© 2026 VoyajAime — Tourisme authentique en Tunisie</p>
        <div style={{ display:"flex", gap:24 }}>
          <Link href="/excursions" style={{ color:"#6B7280", fontSize:13, textDecoration:"none", fontWeight:500 }}>Excursions →</Link>
          <Link href="/contact"    style={{ color:"#6B7280", fontSize:13, textDecoration:"none", fontWeight:500 }}>Contact →</Link>
        </div>
      </footer>
    </>
  );
}