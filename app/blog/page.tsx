import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";

import { BlogImage } from "@/app/components/touriste/BlogImage";
import { Calendar, Clock, Eye, ArrowRight, BookOpen } from "lucide-react";

const COLORS: Record<string, string> = {
  Destination: "#02AFCF", Aventure: "#E11D48", Culture: "#7C3AED",
  Gastronomie: "#D97706", Conseils: "#059669", Actualités: "#053366",
};
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80";

function readTime(content: string | null) {
  if (!content) return "2 min";
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}

  @keyframes slideUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes expandW{from{width:0}to{width:48px}}
  @keyframes tickerMove{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  /* ── HERO ── */
  .hero{padding:70px 48px 56px; text-align:center; border-bottom:1px solid #E5E7EB;position:relative;background:#FAFAF9}
  .hero-label{display:flex;align-items:center;gap:10px;margin-bottom:28px;animation:slideRight .5s ease both}
  .hero-dot{width:8px;height:8px;border-radius:50%;background:#02AFCF;animation:pulse 2s ease infinite}
  .hero-label-text{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6B7280}
  .hero-count{font-size:11px;font-weight:700;letter-spacing:2px;color:#02AFCF;border:1px solid #02AFCF;border-radius:20px;padding:2px 10px}
  .hero-h1{font-size: clamp(28px, 4vw, 42px);font-weight: 800;color:#053366; margin: 0 0 32px; line-height: 1.2;  letter-spacing: -0.5px;}
  .hero-h1 em{font-style:italic;color:#02AFCF}
  .hero-line{width:0;height:2px;background:#0D0F14;margin-bottom:28px;animation:expandW .6s cubic-bezier(.4,0,.2,1) .3s both}
  .hero-sub{font-size:16px;color:#02AFCF;max-width:440px;line-height:1.75;animation:slideUp .5s ease .2s both;margin:0 auto}

  /* ── TICKER ── */
  .ticker-wrap{border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;overflow:hidden;padding:14px 0;background:#FAFAF9}
  .ticker-inner{display:flex;gap:0;white-space:nowrap;animation:tickerMove 22s linear infinite}
  .ticker-item{font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#6B7280;padding:0 36px;border-right:1px solid #E5E7EB}
  .ticker-item span{color:#02AFCF;margin-right:8px}

  /* ── FILTERS ── */
  .cat-filter{padding:7px 18px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;font-size:12px;font-weight:600;cursor:pointer;color:#374151;transition:all .18s;white-space:nowrap;text-decoration:none;display:inline-block;font-family:'DM Sans',sans-serif}
  .cat-filter.active{background:#0D0F14;border-color:#0D0F14;color:white}
  .cat-filter:not(.active):hover{border-color:#02AFCF;color:#02AFCF}

  /* ── FEATURED ── */
  .featured-card{background:white;border-radius:20px;overflow:hidden;border:1px solid #E5E7EB;display:grid;grid-template-columns:1.3fr 1fr;text-decoration:none;color:inherit;transition:border-color .25s,transform .25s;animation:slideUp .5s ease .35s both;opacity:0;animation-fill-mode:forwards}
  .featured-card:hover{border-color:rgba(2,175,207,.4);transform:translateY(-3px)}
  .featured-card:hover .feat-img{transform:scale(1.04)}
  .feat-img{transition:transform .5s ease;width:100%;height:100%;object-fit:cover;display:block}
  .feat-num{position:absolute;top:16px;left:16px;font-family:'Syne',sans-serif;font-size:72px;font-weight:800;color:rgba(255,255,255,.12);line-height:1;pointer-events:none}

  /* ── BLOG CARDS ── */
  .blog-card{background:white;border-radius:18px;overflow:hidden;border:1px solid #E5E7EB;display:flex;flex-direction:column;text-decoration:none;color:inherit;transition:border-color .25s,transform .25s;animation:slideUp .4s ease both}
  .blog-card:hover{transform:translateY(-5px);border-color:rgba(2,175,207,.35)}
  .blog-card:hover .card-img{transform:scale(1.06)}
  .card-img{transition:transform .45s ease;width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}

  .cat-pill{display:inline-flex;align-items:center;padding:4px 11px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.3px;text-transform:uppercase}
  .read-more{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#02AFCF;transition:gap .2s;text-decoration:none}
  .read-more:hover{gap:10px}

  @media(max-width:900px){
    .featured-card{grid-template-columns:1fr!important}
    .blog-grid{grid-template-columns:1fr 1fr!important}
  }
  @media(max-width:600px){
    .blog-grid{grid-template-columns:1fr!important}
    .hero{padding:48px 20px 40px!important}
    .hero-h1{font-size:44px!important;letter-spacing:-1.5px!important}
  }
`;

const TICKER_CATS = ["Destination","Aventure","Culture","Gastronomie","Conseils","Actualités"];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_url, category, tags, author_name, views, created_at, published_at, content")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (cat) query = query.eq("category", cat);
  if (q)   query = query.ilike("title", `%${q}%`);

  const { data: posts }    = await query;
  const { data: featured } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_url, category, tags, author_name, views, created_at, published_at, content")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  const { data: cats } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("is_published", true);

  const { count: totalCount } = await supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  const uniqueCats = [...new Set((cats || []).map((c: { category: string }) => c.category))];
  const all  = posts || [];
  const rest = featured ? all.filter(p => p.id !== featured.id) : all;

  return (
    <>
      <style>{CSS}</style>
      <TouristeNav />
      <div style={{ paddingTop: 64 }} />

      {/* ══ HERO ══ */}
      <header className="hero"> 
        <h1 className="hero-h1">
          Histoires &amp;
          Inspirations<br />
          de Tunisie
        </h1>
        <p className="hero-sub">
          Conseils de voyage, découvertes culturelles et récits d'aventure pour préparer votre prochain séjour en Tunisie.
        </p>
      </header>

      {/* ══ TICKER ══ */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...TICKER_CATS, ...TICKER_CATS].map((c, i) => (
            <div key={i} className="ticker-item">
              <span>✦</span>{c}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 48px 80px" }}>

        {/* ── Filtres catégorie ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, margin: "28px 0 36px", scrollbarWidth: "none", animation: "fadeIn .5s ease .4s both", opacity: 0, animationFillMode: "forwards" as const }}>
          <Link href="/blog" className={`cat-filter ${!cat ? "active" : ""}`}>Tout</Link>
          {uniqueCats.map(c => (
            <Link
              key={c}
              href={`/blog?cat=${c}`}
              className={`cat-filter ${cat === c ? "active" : ""}`}
              style={cat === c ? {
                background: COLORS[c] || "#053366",
                borderColor: COLORS[c] || "#053366",
                color: "white",
              } : {}}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* ── Article à la une ── */}
        {featured && !cat && !q && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 2, background: "#02AFCF", borderRadius: 2 }} />
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "3px", color: "#02AFCF", textTransform: "uppercase" }}>À la une</p>
            </div>

            <Link href={`/blog/${featured.slug}`} className="featured-card">
              {/* Image */}
              <div style={{ overflow: "hidden", minHeight: 380, background: "#EEF2FF", position: "relative" }}>
                <BlogImage
                  src={featured.cover_url || FALLBACK}
                  alt={featured.title}
                  className="feat-img"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(5,51,102,.15),transparent)" }} />
                <div className="feat-num">01</div>
              </div>

              {/* Content */}
              <div style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, borderLeft: "1px solid #E5E7EB" }}>
                <span
                  className="cat-pill"
                  style={{ background: `${COLORS[featured.category] || "#02AFCF"}18`, color: COLORS[featured.category] || "#02AFCF", alignSelf: "flex-start" }}
                >
                  {featured.category}
                </span>
                <h2 style={{  fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 400, color: "#0D0F14", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {featured.excerpt}
                  </p>
                )}
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#9CA3AF", flexWrap: "wrap", marginTop: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={10} />{fmtDate(featured.published_at || featured.created_at)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{readTime(featured.content)} de lecture</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={10} />{featured.views} vues</span>
                </div>
                <span className="read-more">Lire l'article <ArrowRight size={13} /></span>
              </div>
            </Link>
          </div>
        )}

        {/* ── Grille articles ── */}
        {rest.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <div style={{ width: 32, height: 2, background: "#053366", borderRadius: 2 }} />
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "3px", color: "#053366", textTransform: "uppercase" }}>
                {cat || "Tous les articles"}
              </p>
            </div>
            <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
              {rest.map((post, i) => {
                const catColor = COLORS[post.category] || "#02AFCF";
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card" style={{ animationDelay: `${i * .06}s` }}>
                    {/* Cover */}
                    <div style={{ height: 195, overflow: "hidden", background: "#EEF2FF", position: "relative", flexShrink: 0 }}>
                      <BlogImage
                        src={post.cover_url || FALLBACK}
                        alt={post.title}
                        className="card-img"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(5,19,51,.28) 0%,transparent 55%)" }} />
                      <span className="cat-pill" style={{ position: "absolute", top: 12, left: 12, background: catColor, color: "white" }}>
                        {post.category}
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 400, color: "#0D0F14", lineHeight: 1.3, letterSpacing: "-0.1px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {post.excerpt}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#9CA3AF", marginTop: "auto", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} />{fmtDate(post.published_at || post.created_at)}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{readTime(post.content)} de lecture</span>
                      </div>
                      <span className="read-more">Lire l'article <ArrowRight size={12} /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {all.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <BookOpen size={48} color="#E5E7EB" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Aucun article trouvé</p>
            <Link href="/blog" style={{ fontSize: 14, color: "#02AFCF", fontWeight: 600, textDecoration: "none" }}>
              Voir tous les articles
            </Link>
          </div>
        )}
      </div>

    <HomeFooter user={null} />
     
    </>
  );
}