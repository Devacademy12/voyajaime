import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { notFound } from "next/navigation";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { CommentForm } from "@/app/components/touriste/CommentForm";
import { NewsletterWidget } from "@/app/components/touriste/NewsletterWidget";
import HomeFooter from "@/app/components/home/HomeFooter";
import {
  Calendar, Clock, Eye, ArrowLeft, ArrowRight,
  Tag, MessageSquare, ChevronRight,
} from "lucide-react";

// ─── Design tokens — identiques à BlogPage ────────────────────────────────────

const COLORS: Record<string, string> = {
  Destination: "#02AFCF",
  Aventure:    "#E11D48",
  Culture:     "#7C3AED",
  Gastronomie: "#D97706",
  Conseils:    "#059669",
  Actualités:  "#053366",
};

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function readTime(content: string | null) {
  if (!content) return "2 min";
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #F7F8FA; color: #111827; }

  @keyframes slideUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideRight{ from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }

  /* ── COVER HERO (remplace l'ancien hero centré) ── */
  .cover-hero { display: block; }

  .cover-overlay {
    position: absolute; inset: 0;
    background:
      linear-gradient(to right, rgba(0,0,0,.80) 0%, rgba(0,0,0,.45) 55%, rgba(0,0,0,.10) 100%),
      linear-gradient(to top, rgba(5,51,102,.70) 0%, transparent 50%);
  }

  .cover-content {
    position: absolute;left: 10%; transform: translateX(-50%);
    bottom: 0;
    width: 100%; max-width: 1280px;
    padding:40px 40px;
    box-sizing: border-box;
    animation: slideUp .6s cubic-bezier(.34,1.2,.64,1) .1s both;
  }

  .cover-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 14px; border-radius: 100px;
    font-size: 10px; font-weight: 800;
    letter-spacing: 1.8px; text-transform: uppercase;
    margin-bottom: 14px;
    background: rgba(2,175,207,.15);
    border: 1px solid rgba(2,175,207,.4);
    color: #7EE8F8;
  }

  .cover-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(26px, 3.5vw, 44px);
    font-weight: 900; color: #fff;
    line-height: 1.08; letter-spacing: -1.5px;
    margin-bottom: 16px;
    text-shadow: 0 2px 20px rgba(0,0,0,.3);
    max-width: 620px;
  }

  .cover-excerpt {
    font-size: 15px; color: rgba(255,255,255,.65);
    line-height: 1.7; max-width: 520px;
    margin-bottom: 22px;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  .cover-meta {
    display: flex; align-items: center; gap: 14px;
    font-size: 12px; color: rgba(255,255,255,.45);
    flex-wrap: wrap;
  }
  .cover-meta-item { display: flex; align-items: center; gap: 5px; }
  .cover-meta-sep  { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,.25); }

  .cover-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: #02AFCF; display: inline-flex;
    align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; color: #fff; flex-shrink: 0;
  }

  /* ── BREADCRUMB ── */
  .breadcrumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #9CA3AF;
    margin-bottom: 28px;
    animation: slideRight .4s ease both;
  }
  .breadcrumb a { color: #9CA3AF; text-decoration: none; transition: color .15s; }
  .breadcrumb a:hover { color: #053366; }
  .breadcrumb span { color: #374151; font-weight: 600; }

  /* ── ARTICLE BODY ── */
  .article-body { font-size: 16px; line-height: 1.9; color: #374151; }
  .article-body h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(24px, 3vw, 34px); font-weight: 900;
    color: #053366; margin: 36px 0 14px;
    letter-spacing: -.8px; line-height: 1.15;
  }
  .article-body h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(20px, 2.5vw, 26px); font-weight: 800;
    color: #053366; margin: 30px 0 12px; letter-spacing: -.4px;
  }
  .article-body h3 {
    font-size: 18px; font-weight: 700;
    color: #0D0F14; margin: 22px 0 10px;
  }
  .article-body p  { margin-bottom: 18px; }
  .article-body ul, .article-body ol { padding-left: 26px; margin-bottom: 18px; }
  .article-body li { margin-bottom: 8px; line-height: 1.8; }
  .article-body blockquote {
    border-left: 3px solid #02AFCF;
    padding: 18px 24px;
    background: rgba(2,175,207,.05);
    border-radius: 0 14px 14px 0;
    margin: 24px 0;
    font-style: italic;
    color: #4B5563;
    font-size: 16px;
    line-height: 1.8;
    font-family: 'Playfair Display', serif;
  }
  .article-body a      { color: #02AFCF; text-decoration: underline; }
  .article-body strong { font-weight: 700; color: #111827; }
  .article-body img    { max-width: 100%; border-radius: 14px; margin: 18px 0; }
  .article-body hr     { border: none; border-top: 1px solid #E5E7EB; margin: 28px 0; }

  /* ── WIDGET SIDEBAR ── */
  .widget {
    background: white; border-radius: 20px;
    border: 1px solid #EBEBEB; padding: 22px;
    margin-bottom: 16px;
  }
  .widget-title {
    font-size: 10px; font-weight: 800; letter-spacing: 3px;
    color: #053366; text-transform: uppercase;
    margin-bottom: 16px; padding-bottom: 12px;
    border-bottom: 1px solid #F3F4F6;
    display: flex; align-items: center; gap: 8px;
  }
  .widget-title::before {
    content: ''; display: block;
    width: 24px; height: 2px;
    background: #02AFCF; border-radius: 2px; flex-shrink: 0;
  }

  /* ── TAG CHIPS ── */
  .tag-chip {
    display: inline-flex; align-items: center;
    padding: 5px 13px; border-radius: 100px;
    font-size: 12px; font-weight: 600;
    background: #F3F4F6; color: #374151;
    border: 1px solid #E5E7EB; text-decoration: none;
    transition: all .18s;
  }
  .tag-chip:hover { background: #053366; color: white; border-color: #053366; }

  /* ── CAT PILL ── */
  .cat-pill {
    display: inline-flex; align-items: center;
    padding: 4px 12px; border-radius: 100px;
    font-size: 10px; font-weight: 800;
    letter-spacing: .4px; text-transform: uppercase;
  }

  /* ── RECENT POST ROW ── */
  .rec-post {
    display: flex; gap: 12px; align-items: center;
    padding: 10px 0; border-bottom: 1px solid #F3F4F6;
    text-decoration: none; color: inherit; transition: all .2s;
  }
  .rec-post:last-child { border-bottom: none; }
  .rec-post:hover .rec-title { color: #02AFCF; }

  /* ── COMMENT CARD ── */
  .comment-card {
    display: flex; gap: 14px; padding: 20px;
    background: #F9FAFB; border-radius: 16px;
    border: 1px solid #EBEBEB; margin-bottom: 12px;
  }

  /* ── POST NAV ── */
  .post-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 36px; }
  .post-nav-card {
    padding: 18px 20px; background: white;
    border-radius: 16px; border: 1.5px solid #EBEBEB;
    text-decoration: none; color: inherit; transition: all .22s;
  }
  .post-nav-card:hover { border-color: #02AFCF; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(2,175,207,.12); }

  /* ── SECTION LABEL (identique à BlogPage) ── */
  .section-label { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .label-bar-cyan { width: 28px; height: 2px; background: #02AFCF; border-radius: 2px; }
  .label-bar-navy { width: 28px; height: 2px; background: #053366; border-radius: 2px; }
  .label-text-cyan { font-size: 10px; font-weight: 800; letter-spacing: 3px; color: #02AFCF; text-transform: uppercase; }
  .label-text-navy { font-size: 10px; font-weight: 800; letter-spacing: 3px; color: #053366; text-transform: uppercase; }

  /* ── RELATED CARDS (identique aux cards BlogPage) ── */
  .related-card {
    background: white; border-radius: 20px; overflow: hidden;
    border: 1px solid #EBEBEB; text-decoration: none; color: inherit;
    transition: transform .3s cubic-bezier(.34,1.2,.64,1), box-shadow .3s ease, border-color .3s ease;
    display: block;
  }
  .related-card:hover { border-color: rgba(2,175,207,.4); transform: translateY(-5px); box-shadow: 0 20px 48px rgba(5,51,102,.1); }
  .related-card:hover .related-img { transform: scale(1.06); }
  .related-img { transition: transform .45s ease; width: 100%; height: 100%; object-fit: cover; display: block; }

  /* ── ARTICLE WRAP ── */
  .article-wrap {
    background: white; border-radius: 20px; padding: 40px;
    border: 1px solid #EBEBEB; margin-bottom: 28px;
    animation: slideUp .4s ease both;
  }

  /* ── FILTER PILL (lien catégorie sidebar) ── */
  .cat-sidebar-link {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 10px; border-radius: 12px;
    text-decoration: none; color: #374151;
    font-size: 13px; font-weight: 600; transition: all .18s;
  }
  .cat-sidebar-link:hover { background: #F3F4F6; }

  @media (max-width: 1024px) {
    .page-layout { grid-template-columns: 1fr !important; }
    .sidebar     { display: none !important; }
    .post-nav    { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 640px) {
    .cover-hero   { height: 420px; }
    .cover-content{ padding: 0 20px 28px; }
    .content-area { padding: 0 20px 64px !important; }
    .article-wrap { padding: 24px !important; }
    .related-grid { grid-template-columns: 1fr !important; }
  }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

  await supabase
    .from("blog_posts")
    .update({ views: (post.views || 0) + 1 })
    .eq("id", post.id);

  const { data: recentPosts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, cover_url, published_at, created_at, category")
    .eq("is_published", true)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(4);

  const { data: allCats } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("is_published", true);

  const { data: comments } = await supabase
    .from("blog_comments")
    .select("*")
    .eq("post_id", post.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });

  const { data: related } = await supabase
    .from("blog_posts")
    .select("id, slug, title, cover_url, category, published_at, created_at, excerpt")
    .eq("is_published", true)
    .eq("category", post.category)
    .neq("id", post.id)
    .limit(3);

  const { data: prevPost } = await supabase
    .from("blog_posts")
    .select("slug, title")
    .eq("is_published", true)
    .lt("published_at", post.published_at || post.created_at)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  const { data: nextPost } = await supabase
    .from("blog_posts")
    .select("slug, title")
    .eq("is_published", true)
    .gt("published_at", post.published_at || post.created_at)
    .order("published_at", { ascending: true })
    .limit(1)
    .single();

  const uniqueCats = [...new Set((allCats || []).map((c: { category: string }) => c.category))];
  const catColor   = COLORS[post.category] || "#02AFCF";
  const allTags    = (post.tags || []) as string[];

  return (
    <>
      <style>{CSS}</style>
      <TouristeNav />

      {/* ══ COVER HERO — remplace l'ancien hero centré blanc ══════════════════ */}
      <div className="cover-hero" style={{ position: "relative", height: 480, overflow: "hidden", marginTop: 60 }}>
        {/* Image wrapper absolu — indépendant du rendu interne de BlogImage */}
        <div style={{ position: "absolute", inset: 0 }}>
          <BlogImage
            src={post.cover_url || FALLBACK}
            alt={post.title}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", display: "block",
              filter: "brightness(0.58)",
            }}
          />
        </div>
        <div className="cover-overlay" />

        <div className="cover-content">
          {/* Badge catégorie */}
          <div>
            <span className="cover-badge" style={{ borderColor: `${catColor}55`, color: catColor, background: `${catColor}18` }}>
              {post.category}
            </span>
          </div>

          {/* Titre */}
          <h1 className="cover-title">{post.title}</h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="cover-excerpt">{post.excerpt}</p>
          )}

          {/* Méta */}
          <div className="cover-meta">
            {post.author_name && (
              <>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="cover-avatar">
                    {post.author_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,.82)", fontWeight: 600 }}>
                    {post.author_name}
                  </span>
                </span>
                <span className="cover-meta-sep" />
              </>
            )}
            <span className="cover-meta-item">
              <Calendar size={11} />
              {fmtDate(post.published_at || post.created_at)}
            </span>
            <span className="cover-meta-sep" />
            <span className="cover-meta-item">
              <Clock size={11} />
              {readTime(post.content)} de lecture
            </span>
            {post.views > 0 && (
              <>
                <span className="cover-meta-sep" />
                <span className="cover-meta-item">
                  <Eye size={11} />
                  {(post.views || 0).toLocaleString("fr-FR")} vues
                </span>
              </>
            )}
            {(comments || []).length > 0 && (
              <>
                <span className="cover-meta-sep" />
                <span className="cover-meta-item">
                  <MessageSquare size={11} />
                  {(comments || []).length} commentaire{(comments || []).length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ CONTENT + SIDEBAR ════════════════════════════════════════════════ */}
      <div
        className="content-area"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 40px 80px" }}
      >
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/">Accueil</Link>
          <ChevronRight size={12} />
          <Link href="/blog">Blog</Link>
          <ChevronRight size={12} />
          <Link href={`/blog?cat=${post.category}`}>{post.category}</Link>
          <ChevronRight size={12} />
          <span style={{
            maxWidth: 240, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {post.title}
          </span>
        </div>

        <div
          className="page-layout"
          style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}
        >
          {/* ── LEFT — Article ────────────────────────────────────────────── */}
          <div>
            {/* Article body */}
            <div className="article-wrap">
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: post.content || "<p>Contenu à venir…</p>" }}
              />

              {/* Tags */}
              {allTags.length > 0 && (
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #F3F4F6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Tag size={13} color="#9CA3AF" />
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                      textTransform: "uppercase", letterSpacing: ".5px",
                    }}>
                      Tags :
                    </span>
                    {allTags.map((tag) => (
                      <Link key={tag} href={`/blog?q=${tag}`} className="tag-chip">{tag}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Prev / Next ── */}
            {(prevPost || nextPost) && (
              <div className="post-nav">
                {prevPost ? (
                  <Link href={`/blog/${prevPost.slug}`} className="post-nav-card">
                    <div style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                      textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8,
                    }}>
                      <ArrowLeft size={11} /> Article précédent
                    </div>
                    <p style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 15, fontWeight: 800, color: "#053366",
                      lineHeight: 1.35,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {prevPost.title}
                    </p>
                  </Link>
                ) : <div />}

                {nextPost ? (
                  <Link href={`/blog/${nextPost.slug}`} className="post-nav-card" style={{ textAlign: "right" }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5,
                      fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                      textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8,
                    }}>
                      Article suivant <ArrowRight size={11} />
                    </div>
                    <p style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 15, fontWeight: 800, color: "#053366",
                      lineHeight: 1.35,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {nextPost.title}
                    </p>
                  </Link>
                ) : <div />}
              </div>
            )}

            {/* ── Articles similaires ── */}
            {related && related.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div className="section-label">
                  <div className="label-bar-cyan" />
                  <span className="label-text-cyan">Articles similaires</span>
                </div>
                <div
                  className="related-grid"
                  style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}
                >
                  {related.map((r) => (
                    <Link key={r.id} href={`/blog/${r.slug}`} className="related-card">
                      {/* Cover */}
                      <div style={{ height: 150, overflow: "hidden", position: "relative", background: "#EEF2FF" }}>
                        <BlogImage
                          src={r.cover_url || FALLBACK}
                          alt={r.title}
                          className="related-img"
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,19,51,.28), transparent 55%)" }} />
                        <span
                          className="cat-pill"
                          style={{
                            position: "absolute", top: 10, left: 10,
                            background: COLORS[r.category] || "#02AFCF", color: "white",
                          }}
                        >
                          {r.category}
                        </span>
                      </div>
                      {/* Body */}
                      <div style={{ padding: "14px 16px 16px" }}>
                        <p style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 14, fontWeight: 800, color: "#053366",
                          lineHeight: 1.3,
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                          marginBottom: 8,
                        }}>
                          {r.title}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={9} />{fmtDate(r.published_at || r.created_at)}
                        </p>
                      </div>
                      {/* Footer */}
                      <div style={{
                        borderTop: "1px solid #F3F4F6", padding: "10px 16px",
                        display: "flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 700, color: "#02AFCF",
                      }}>
                        Lire l'article <ArrowRight size={12} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Commentaires ── */}
            <div style={{ marginTop: 48 }}>
              <div className="section-label">
                <div className="label-bar-navy" />
                <span className="label-text-navy">
                  {(comments || []).length} Commentaire{(comments || []).length !== 1 ? "s" : ""}
                </span>
              </div>

              {(comments || []).length > 0 ? (
                <div style={{ marginBottom: 28 }}>
                  {(comments || []).map((c: { id: string; author: string; body: string; created_at: string }) => (
                    <div key={c.id} className="comment-card">
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: `${catColor}18`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: catColor }}>
                          {c.author?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{c.author}</p>
                          <p style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtDate(c.created_at)}</p>
                        </div>
                        <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75 }}>{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: "center", padding: "28px",
                  background: "white", borderRadius: 16,
                  border: "1px solid #EBEBEB", marginBottom: 28,
                }}>
                  <MessageSquare size={28} color="#E5E7EB" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14, color: "#9CA3AF" }}>Soyez le premier à commenter !</p>
                </div>
              )}

              {/* Formulaire */}
              <div className="article-wrap" style={{ marginBottom: 0 }}>
                <div className="section-label">
                  <div className="label-bar-cyan" />
                  <span className="label-text-cyan">Laisser un commentaire</span>
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.65 }}>
                  Votre commentaire sera publié après modération.
                </p>
                <CommentForm postId={post.id} />
              </div>
            </div>
          </div>

          {/* ── RIGHT — Sidebar ───────────────────────────────────────────── */}
          <aside
            className="sidebar"
            style={{ position: "sticky", top: 84, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}
          >
            {/* Recherche */}
            <div className="widget">
              <p className="widget-title">Rechercher</p>
              <form action="/blog" method="GET">
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    name="q"
                    placeholder="Rechercher…"
                    style={{
                      flex: 1, padding: "9px 13px",
                      border: "1.5px solid #E5E7EB", borderRadius: 10,
                      fontSize: 13, fontFamily: "inherit", outline: "none", color: "#111827",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "9px 13px", background: "#053366",
                      color: "white", border: "none", borderRadius: 10,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Catégories */}
            <div className="widget">
              <p className="widget-title">Catégories</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {uniqueCats.map((c) => (
                  <Link
                    key={c}
                    href={`/blog?cat=${c}`}
                    className="cat-sidebar-link"
                    style={
                      post.category === c
                        ? { background: `${COLORS[c] || "#02AFCF"}12`, color: COLORS[c] || "#02AFCF" }
                        : {}
                    }
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS[c] || "#02AFCF", flexShrink: 0 }} />
                      {c}
                    </span>
                    <ChevronRight size={12} color="#9CA3AF" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Articles récents */}
            <div className="widget">
              <p className="widget-title">Articles récents</p>
              {(recentPosts || []).map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="rec-post">
                  <div style={{ width: 56, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#EEF2FF" }}>
                    <BlogImage
                      src={r.cover_url || FALLBACK}
                      alt={r.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="rec-title"
                      style={{
                        fontSize: 12, fontWeight: 600, color: "#111827",
                        lineHeight: 1.35, transition: "color .2s",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}
                    >
                      {r.title}
                    </p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                      <Calendar size={9} />{fmtDate(r.published_at || r.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="widget">
                <p className="widget-title">Tags</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allTags.map((tag) => (
                    <Link key={tag} href={`/blog?q=${tag}`} className="tag-chip">{tag}</Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="widget" style={{ background: "#053366", border: "none" }}>
              <p className="widget-title" style={{ color: "white", borderColor: "rgba(255,255,255,.12)" }}>
                Newsletter
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 14, lineHeight: 1.65 }}>
                Recevez nos derniers articles directement dans votre boîte mail.
              </p>
              <NewsletterWidget />
            </div>

            {/* Retour au blog */}
            <Link
              href="/blog"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px", background: "white",
                border: "1.5px solid #EBEBEB", borderRadius: 14,
                textDecoration: "none", color: "#374151",
                fontSize: 13, fontWeight: 600, transition: "all .2s",
              }}
            >
              <ArrowLeft size={13} /> Retour au blog
            </Link>
          </aside>
        </div>
      </div>

      <HomeFooter user={null} />
    </>
  );
}