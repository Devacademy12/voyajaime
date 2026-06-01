import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { Calendar, Clock, Eye, ArrowRight, BookOpen, Search, ChevronRight } from "lucide-react";

const COLORS: Record<string, string> = {
  Destination: "#02AFCF",
  Aventure:    "#E11D48",
  Culture:     "#7C3AED",
  Gastronomie: "#D97706",
  Conseils:    "#059669",
  Actualités:  "#053366",
};
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1200&q=80";

function readTime(content: string | null) {
  if (!content) return "2 min";
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --primary:#02AFCF;
  --navy:#053366;
  --dark:#0D0F14;
  --bg:#F8F9FB;
  --white:#ffffff;
  --border:#E5E7EB;
  --text:#374151;
  --muted:#6B7280;
  --light:#9CA3AF;
}

/* ── HERO SLIDER ── */
.blog-hero{
  position:relative;
  width:100%;
  height:520px;
  overflow:hidden;
  background:var(--dark);
}
.blog-hero-img{
  position:absolute;inset:0;
  width:100%;height:100%;object-fit:cover;
  transition:transform 8s ease;
}
.blog-hero:hover .blog-hero-img{transform:scale(1.04)}
.blog-hero-overlay{
  position:absolute;inset:0;
  background:linear-gradient(
    to top,
    rgba(5,19,51,.90) 0%,
    rgba(5,19,51,.55) 45%,
    rgba(5,19,51,.15) 100%
  );
}
.blog-hero-content{
  position:absolute;bottom:0;left:0;right:0;
  padding:40px 48px;
  display:flex;align-items:flex-end;justify-content:space-between;gap:32px;
}
.blog-hero-left{flex:1;min-width:0}
.blog-hero-cat{
  display:inline-flex;align-items:center;
  padding:5px 14px;border-radius:20px;
  font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
  margin-bottom:14px;
}
.blog-hero-title{
  font-family:'Syne',sans-serif;
  font-size:clamp(22px,3.5vw,38px);
  font-weight:800;color:#fff;
  line-height:1.15;margin-bottom:12px;
  text-shadow:0 2px 12px rgba(0,0,0,.3);
}
.blog-hero-excerpt{
  font-size:14px;color:rgba(255,255,255,.75);
  line-height:1.65;max-width:560px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  margin-bottom:18px;
}
.blog-hero-meta{
  display:flex;align-items:center;gap:16px;
  font-size:12px;color:rgba(255,255,255,.6);flex-wrap:wrap;
}
.blog-hero-meta span{display:flex;align-items:center;gap:5px}
.blog-hero-cta{
  display:inline-flex;align-items:center;gap:7px;
  background:var(--primary);color:#fff;
  padding:11px 22px;border-radius:50px;
  font-size:13px;font-weight:700;text-decoration:none;
  white-space:nowrap;flex-shrink:0;align-self:flex-end;
  transition:transform .2s,box-shadow .2s;
  box-shadow:0 6px 20px -4px rgba(2,175,207,.55);
  font-family:'DM Sans',sans-serif;
}
.blog-hero-cta:hover{transform:translateY(-2px);box-shadow:0 10px 28px -4px rgba(2,175,207,.65)}

/* Slide dots */
.blog-hero-dots{
  position:absolute;bottom:20px;right:48px;
  display:flex;gap:7px;align-items:center;
}
.blog-dot{
  width:7px;height:7px;border-radius:50%;
  background:rgba(255,255,255,.35);border:none;cursor:pointer;padding:0;
  transition:all .2s;
}
.blog-dot.active{background:#fff;width:22px;border-radius:4px}

/* ── SECTION HEADER ── */
.section-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:24px;padding-bottom:14px;
  border-bottom:1px solid var(--border);
}
.section-title{
  display:flex;align-items:center;gap:10px;
  font-family:'Syne',sans-serif;
  font-size:20px;font-weight:800;color:var(--navy);
}
.section-title::before{
  content:'';display:block;
  width:4px;height:22px;background:var(--primary);border-radius:2px;
}
.section-link{
  display:flex;align-items:center;gap:4px;
  font-size:12px;font-weight:700;color:var(--primary);text-decoration:none;
  transition:gap .18s;
}
.section-link:hover{gap:8px}

/* ── FILTERS BAR ── */
.filters-bar{
  display:flex;align-items:center;justify-content:space-between;
  gap:12px;flex-wrap:wrap;
  padding:18px 0 20px;
}
.filters-left{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;flex-wrap:nowrap}
.filters-left::-webkit-scrollbar{display:none}
.f-chip{
  display:inline-flex;align-items:center;
  padding:7px 17px;border-radius:20px;
  border:1.5px solid var(--border);background:var(--white);
  font-size:12px;font-weight:600;color:var(--text);
  text-decoration:none;white-space:nowrap;transition:all .18s;
  font-family:'DM Sans',sans-serif;
}
.f-chip:hover{border-color:var(--primary);color:var(--primary)}
.f-chip.active{background:var(--navy);border-color:var(--navy);color:#fff}

.sort-select{
  display:flex;align-items:center;gap:6px;
  padding:7px 14px;border-radius:20px;
  border:1.5px solid var(--border);background:var(--white);
  font-size:12px;font-weight:600;color:var(--text);
  font-family:'DM Sans',sans-serif;cursor:pointer;outline:none;
}

/* ── BLOG GRID ── */
.blog-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:20px;
}

/* ── BLOG CARD ── */
.blog-card{
  background:var(--white);border-radius:16px;
  border:1px solid var(--border);
  display:flex;flex-direction:column;
  text-decoration:none;color:inherit;
  overflow:hidden;
  transition:transform .22s,box-shadow .22s,border-color .22s;
}
.blog-card:hover{
  transform:translateY(-5px);
  box-shadow:0 16px 40px -12px rgba(5,51,102,.14);
  border-color:rgba(2,175,207,.3);
}
.blog-card:hover .bc-img-inner{transform:scale(1.07)}

.bc-img{
  position:relative;height:195px;overflow:hidden;
  background:#EEF2FF;flex-shrink:0;
}
.bc-img-inner{
  position:absolute;inset:0;
  width:100%;height:100%;object-fit:cover;
  transition:transform .45s ease;
}
.bc-img-overlay{
  position:absolute;inset:0;
  background:linear-gradient(to top,rgba(5,19,51,.3) 0%,transparent 55%);
}
.bc-cat{
  position:absolute;top:12px;left:12px;
  display:inline-flex;align-items:center;
  padding:4px 11px;border-radius:20px;
  font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;
  color:#fff;
}
.bc-body{
  padding:18px;flex:1;display:flex;flex-direction:column;gap:8px;
}
.bc-title{
  font-family:'Syne',sans-serif;
  font-size:16px;font-weight:700;color:var(--dark);
  line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.bc-excerpt{
  font-size:12px;color:var(--muted);line-height:1.65;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.bc-meta{
  display:flex;align-items:center;gap:10px;
  font-size:11px;color:var(--light);margin-top:auto;flex-wrap:wrap;
}
.bc-meta span{display:flex;align-items:center;gap:3px}
.bc-read{
  display:inline-flex;align-items:center;gap:5px;
  font-size:12px;font-weight:700;color:var(--primary);
  text-decoration:none;margin-top:4px;
  transition:gap .18s;
}
.bc-read:hover{gap:9px}

/* ── FEATURED WIDE CARD (first card in grid) ── */
.blog-card.wide{
  grid-column:span 2;
  flex-direction:row;
}
.blog-card.wide .bc-img{
  width:52%;height:auto;flex-shrink:0;border-radius:0;
}
.blog-card.wide .bc-body{
  padding:24px 26px;justify-content:center;gap:12px;
}
.blog-card.wide .bc-title{
  font-size:20px;-webkit-line-clamp:3;
}
.blog-card.wide .bc-excerpt{
  -webkit-line-clamp:3;
}

/* ── EMPTY ── */
.empty-state{
  text-align:center;padding:80px 20px;
  display:flex;flex-direction:column;align-items:center;gap:14px;
}

/* ── RESPONSIVE ── */
@media(max-width:1024px){
  .blog-grid{grid-template-columns:repeat(2,1fr)}
  .blog-card.wide{grid-column:span 2}
  .blog-hero-content{padding:32px 28px}
}
@media(max-width:700px){
  .blog-hero{height:420px}
  .blog-hero-content{padding:24px 18px;flex-direction:column;align-items:flex-start;gap:16px}
  .blog-hero-cta{align-self:flex-start}
  .blog-grid{grid-template-columns:1fr}
  .blog-card.wide{grid-column:span 1;flex-direction:column}
  .blog-card.wide .bc-img{width:100%;height:200px}
  .blog-hero-dots{right:18px}
}

@keyframes fadeUp{
  from{opacity:0;transform:translateY(18px)}
  to{opacity:1;transform:translateY(0)}
}
.blog-card{
  animation:fadeUp .4s ease both;
}
`;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,cover_url,category,tags,author_name,views,created_at,published_at,content")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (cat) query = query.eq("category", cat);
  if (q)   query = query.ilike("title", `%${q}%`);

  const { data: posts } = await query;

  const { data: featured } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,cover_url,category,author_name,views,created_at,published_at,content")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  const { data: cats } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("is_published", true);

  const uniqueCats = [...new Set((cats || []).map((c: { category: string }) => c.category))];
  const all  = posts || [];
  const rest = featured ? all.filter(p => p.id !== featured.id) : all;

  return (
    <>
      <style>{CSS}</style>
      <TouristeNav />
      <div style={{ paddingTop: 64 }} />

      {/* ══════════════════════════════════════
          HERO — Article à la une plein écran
      ══════════════════════════════════════ */}
      {featured && !cat && !q ? (
        <Link href={`/blog/${featured.slug}`} className="blog-hero" style={{ display: "block", textDecoration: "none" }}>
          <BlogImage
            src={featured.cover_url || FALLBACK}
            alt={featured.title}
            className="blog-hero-img"
          />
          <div className="blog-hero-overlay" />

          <div className="blog-hero-content">
            <div className="blog-hero-left">
              <div
                className="blog-hero-cat"
                style={{
                  background: `${COLORS[featured.category] || "#02AFCF"}30`,
                  color: COLORS[featured.category] || "#02AFCF",
                  border: `1px solid ${COLORS[featured.category] || "#02AFCF"}60`,
                }}
              >
                {featured.category}
              </div>
              <h1 className="blog-hero-title">{featured.title}</h1>
              {featured.excerpt && (
                <p className="blog-hero-excerpt">{featured.excerpt}</p>
              )}
              <div className="blog-hero-meta">
                {featured.author_name && (
                  <span style={{ fontWeight: 600, color: "rgba(255,255,255,.85)" }}>
                    {featured.author_name}
                  </span>
                )}
                <span><Calendar size={11} />{fmtDate(featured.published_at || featured.created_at)}</span>
                <span><Clock size={11} />{readTime(featured.content)} de lecture</span>
                {featured.views > 0 && <span><Eye size={11} />{featured.views} vues</span>}
              </div>
            </div>

            <span className="blog-hero-cta" onClick={e => e.stopPropagation()}>
              Lire l&apos;article <ArrowRight size={14} />
            </span>
          </div>

          {/* Dots décoratifs */}
          <div className="blog-hero-dots">
            <div className="blog-dot active" />
            <div className="blog-dot" />
            <div className="blog-dot" />
          </div>
        </Link>
      ) : (
        /* Hero fallback si filtres actifs */
        <div style={{
          background: `linear-gradient(135deg, var(--navy, #053366) 0%, #0a5a8a 100%)`,
          padding: "44px 48px",
        }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(24px,4vw,36px)",
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}>
            {cat ? `Articles · ${cat}` : `Résultats pour "${q}"`}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.65)" }}>
            {all.length} article{all.length !== 1 ? "s" : ""} trouvé{all.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECTION ARTICLES
      ══════════════════════════════════════ */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 32px 80px" }}>

        {/* ── Titre section + Filtres ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22, fontWeight: 800, color: "#053366",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ display: "block", width: 4, height: 24, background: "#02AFCF", borderRadius: 2 }} />
            Blog
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>
            Conseils de voyage, découvertes culturelles et récits d&apos;aventure pour préparer votre prochain séjour en Tunisie.
          </p>
        </div>

        {/* ── Filtres + Sort ── */}
        <div className="filters-bar">
          <div className="filters-left">
            <Link href="/blog" className={`f-chip${!cat ? " active" : ""}`}>Tout</Link>
            {uniqueCats.map(c => (
              <Link
                key={c}
                href={`/blog?cat=${c}`}
                className={`f-chip${cat === c ? " active" : ""}`}
                style={cat === c ? {
                  background: COLORS[c] || "#053366",
                  borderColor: COLORS[c] || "#053366",
                  color: "#fff",
                } : {}}
              >
                {c}
              </Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Trier par :</span>
            <div className="sort-select">Récents <ChevronRight size={12} /></div>
          </div>
        </div>

        {/* ── Grille articles ── */}
        {all.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} color="#E5E7EB" />
            <p style={{ fontSize: 17, fontWeight: 600, color: "#374151" }}>Aucun article trouvé</p>
            <Link href="/blog" style={{ fontSize: 14, color: "#02AFCF", fontWeight: 600, textDecoration: "none" }}>
              Voir tous les articles →
            </Link>
          </div>
        ) : (
          <div className="blog-grid">
            {rest.map((post, i) => {
              const catColor = COLORS[post.category] || "#02AFCF";
              // Le premier article de la grille prend 2 colonnes
              const isWide = i === 0 && !cat && !q;
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`blog-card${isWide ? " wide" : ""}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="bc-img">
                    <BlogImage
                      src={post.cover_url || FALLBACK}
                      alt={post.title}
                      className="bc-img-inner"
                    />
                    <div className="bc-img-overlay" />
                    <span className="bc-cat" style={{ background: catColor }}>
                      {post.category}
                    </span>
                  </div>

                  <div className="bc-body">
                    <h3 className="bc-title">{post.title}</h3>
                    {post.excerpt && <p className="bc-excerpt">{post.excerpt}</p>}
                    <div className="bc-meta">
                      {post.author_name && (
                        <span style={{ fontWeight: 600, color: "#374151" }}>{post.author_name}</span>
                      )}
                      <span><Calendar size={10} />{fmtDate(post.published_at || post.created_at)}</span>
                      <span><Clock size={10} />{readTime(post.content)} de lecture</span>
                    </div>
                    <span className="bc-read">
                      Lire l&apos;article <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <HomeFooter user={null} />
    </>
  );
}