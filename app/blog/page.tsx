import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import TouristeNav from "@/app/components/touriste/TouristeNav";
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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',system-ui,sans-serif;background:#FAFAF9;color:#111827}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

  .blog-card{background:white;border-radius:22px;overflow:hidden;border:1px solid #EBEBEB;transition:all .28s;display:flex;flex-direction:column;animation:fadeUp .4s ease both;cursor:pointer;text-decoration:none;color:inherit}
  .blog-card:hover{transform:translateY(-6px);box-shadow:0 20px 56px rgba(5,51,102,.12);border-color:#DCE5FF}
  .blog-card:hover .card-img{transform:scale(1.06)}
  .card-img{transition:transform .45s ease;width:100%;height:100%;object-fit:cover;display:block}

  .featured-card{background:white;border-radius:28px;overflow:hidden;border:1px solid #EBEBEB;display:grid;grid-template-columns:1.2fr 1fr;min-height:400px;animation:fadeUp .5s ease both;text-decoration:none;color:inherit;transition:all .28s;box-shadow:0 4px 24px rgba(5,51,102,.06)}
  .featured-card:hover{transform:translateY(-4px);box-shadow:0 20px 56px rgba(5,51,102,.14)}
  .featured-card:hover .feat-img{transform:scale(1.04)}
  .feat-img{transition:transform .45s ease;width:100%;height:100%;object-fit:cover;display:block}

  .cat-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:.3px;text-transform:uppercase}

  .cat-filter{padding:8px 18px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;font-size:13px;font-weight:600;cursor:pointer;color:#374151;transition:all .18s;font-family:'DM Sans',sans-serif;white-space:nowrap;text-decoration:none;display:inline-block}
  .cat-filter.active{background:#053366;border-color:#053366;color:white}
  .cat-filter:not(.active):hover{border-color:#02AFCF;color:#02AFCF}

  .read-more{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#02AFCF;transition:gap .2s;text-decoration:none}
  .read-more:hover{gap:10px}

  @media(max-width:900px){
    .featured-card{grid-template-columns:1fr!important;min-height:auto!important}
    .blog-grid{grid-template-columns:1fr 1fr!important}
  }
  @media(max-width:600px){
    .blog-grid{grid-template-columns:1fr!important}
    .hero-h1{font-size:36px!important}
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

  const uniqueCats = [...new Set((cats || []).map((c: { category: string }) => c.category))];
  const all  = posts || [];
  const rest = featured ? all.filter(p => p.id !== featured.id) : all;

  return (
    <>
      <style>{CSS}</style>
      <TouristeNav />
      <div style={{ paddingTop: 64 }} />

      {/* ══ HERO ══ */}
      <section style={{ background: "linear-gradient(135deg,#053366 0%,#0a4a8a 50%,#02AFCF 100%)", padding: "72px 40px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .05, backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <BookOpen size={18} color="rgba(255,255,255,.6)" strokeWidth={1.8} />
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "3px", color: "rgba(255,255,255,.6)", textTransform: "uppercase" }}>Notre Blog</p>
          </div>
          <h1 className="hero-h1" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(38px,5vw,60px)", fontWeight: 900, color: "white", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: 16, maxWidth: 620 }}>
            Histoires & Inspirations<br />
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,.7)" }}>de Tunisie</em>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", maxWidth: 480, lineHeight: 1.7 }}>
            Conseils de voyage, découvertes culturelles et récits d'aventure pour préparer votre prochain séjour en Tunisie.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 40px 80px" }}>

        {/* ── Filtres catégorie ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 40, scrollbarWidth: "none" }}>
          <Link href="/blog" className={`cat-filter ${!cat ? "active" : ""}`}>Tout</Link>
          {uniqueCats.map(c => (
            <Link
              key={c}
              href={`/blog?cat=${c}`}
              className={`cat-filter ${cat === c ? "active" : ""}`}
              style={{
                borderColor: cat === c ? (COLORS[c] || "#053366") : "#E5E7EB",
                background:  cat === c ? (COLORS[c] || "#053366") : "white",
                color:       cat === c ? "white" : "#374151",
              }}
            >
              {c}
            </Link>
          ))}
        </div>

        {/* ── Article à la une ── */}
        {featured && !cat && !q && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, background: "#02AFCF", borderRadius: 2 }} />
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2px", color: "#02AFCF", textTransform: "uppercase" }}>À la une</p>
            </div>
            <Link href={`/blog/${featured.slug}`} className="featured-card">
              {/* Image — BlogImage handles onError client-side */}
              <div style={{ overflow: "hidden", minHeight: 400, background: "#EEF2FF", position: "relative" }}>
                <BlogImage
                  src={featured.cover_url || FALLBACK}
                  alt={featured.title}
                  className="feat-img"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(5,51,102,.3),transparent)" }} />
              </div>

              {/* Content */}
              <div style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
                <span className="cat-pill" style={{ background: `${COLORS[featured.category] || "#02AFCF"}15`, color: COLORS[featured.category] || "#02AFCF", alignSelf: "flex-start" }}>
                  {featured.category}
                </span>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 900, color: "#053366", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {featured.excerpt}
                  </p>
                )}
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#9CA3AF", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />{fmtDate(featured.published_at || featured.created_at)}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{readTime(featured.content)} de lecture</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={11} />{featured.views} vues</span>
                </div>
                <span className="read-more">Lire l'article <ArrowRight size={14} /></span>
              </div>
            </Link>
          </div>
        )}

        {/* ── Grille articles ── */}
        {rest.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <div style={{ width: 28, height: 3, background: "#053366", borderRadius: 2 }} />
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2px", color: "#053366", textTransform: "uppercase" }}>
                {cat || "Tous les articles"}
              </p>
            </div>
            <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
              {rest.map((post, i) => {
                const catColor = COLORS[post.category] || "#02AFCF";
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card" style={{ animationDelay: `${i * .06}s` }}>
                    {/* Cover */}
                    <div style={{ height: 200, overflow: "hidden", background: "#EEF2FF", position: "relative", flexShrink: 0 }}>
                      <BlogImage
                        src={post.cover_url || FALLBACK}
                        alt={post.title}
                        className="card-img"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(5,19,51,.3) 0%,transparent 50%)" }} />
                      <span className="cat-pill" style={{ position: "absolute", top: 12, left: 12, background: catColor, color: "white", boxShadow: `0 4px 12px ${catColor}44` }}>
                        {post.category}
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 800, color: "#053366", lineHeight: 1.3, letterSpacing: "-0.2px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {post.excerpt}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9CA3AF", marginTop: "auto", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} />{fmtDate(post.published_at || post.created_at)}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{readTime(post.content)} de lecture</span>
                      </div>
                      <span className="read-more" style={{ fontSize: 12 }}>Lire l'article <ArrowRight size={12} /></span>
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
            <BookOpen size={48} color="#DCE5FF" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Aucun article trouvé</p>
            <Link href="/blog" style={{ fontSize: 14, color: "#02AFCF", fontWeight: 600, textDecoration: "none" }}>
              Voir tous les articles
            </Link>
          </div>
        )}
      </div>

      {/* ── Footer minimal ── */}
      <div style={{ background: "#0D1117", padding: "22px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <p style={{ color: "#374151", fontSize: 13 }}>© 2026 VoyajAime — Tourisme en Tunisie</p>
        <Link href="/excursions" style={{ color: "#6B7280", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
          Voir les excursions →
        </Link>
      </div>
    </>
  );
}