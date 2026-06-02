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
  Tag, User, MessageSquare, ChevronRight,
} from "lucide-react";

const COLORS: Record<string, string> = {
  Destination: "#02AFCF", Aventure: "#E11D48", Culture: "#7C3AED",
  Gastronomie: "#D97706", Conseils: "#059669", Actualités: "#053366",
};
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function readTime(content: string | null) {
  if (!content) return "2 min";
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

const CSS = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Plus Jakarta Sans',system-ui,sans-serif; background:#FAFAF9; color:#111827; }

  @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideRight{ from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
  @keyframes expandW  { from{width:0} to{width:48px} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }

 /* ── HERO ── */
.hero{padding:70px 48px 56px;text-align:center;border-bottom:1px solid #E5E7EB;position:relative;background:#FAFAF9}
.hero-label{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:28px;animation:slideRight .5s ease both}
.hero-dot{width:8px;height:8px;border-radius:50%;background:#02AFCF;animation:pulse 2s ease infinite}
.hero-count{font-size:11px;font-weight:700;letter-spacing:2px;color:#02AFCF;border:1px solid #02AFCF;border-radius:20px;padding:2px 10px}
.hero-h1{font-size:clamp(28px,4vw,42px);font-weight:800;color:#053366;margin:0 0 32px;line-height:1.2;letter-spacing:-0.5px}
.hero-h1 em{font-style:italic;color:#02AFCF}
.hero-line{width:0;height:2px;background:#053366;margin:0 auto 28px;animation:expandW .6s cubic-bezier(.4,0,.2,1) .3s both}
.hero-sub{font-size:16px;color:#02AFCF;max-width:440px;line-height:1.75;animation:slideUp .5s ease .2s both;margin:0 auto}
  .detail-h1 {
    font-family:'Instrument Serif',serif;
    font-size:clamp(36px,5vw,64px);
    font-weight:400;
    color:#053366;
    letter-spacing:-2px;
    line-height:1.05;
    margin-bottom:28px;
    animation:slideUp .55s ease .1s both;
    max-width:780px;
  }
  .hero-line { width:0; height:2px; background:#053366; margin-bottom:24px; animation:expandW .6s cubic-bezier(.4,0,.2,1) .3s both; }
  .hero-meta  { display:flex; align-items:center; gap:18px; flex-wrap:wrap; animation:fadeIn .5s ease .3s both; opacity:0; animation-fill-mode:forwards; }
  .meta-item  { display:flex; align-items:center; gap:5px; font-size:13px; color:#6B7280; }

  /* ── TICKER ── */
  .ticker-wrap  { border-top:1px solid #E5E7EB; border-bottom:1px solid #E5E7EB; overflow:hidden; padding:14px 0; background:#FAFAF9; }
  .ticker-inner { display:flex; white-space:nowrap; animation:tickerMove 22s linear infinite; }
  @keyframes tickerMove { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .ticker-item  { font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#6B7280; padding:0 36px; border-right:1px solid #E5E7EB; }
  .ticker-item span { color:#02AFCF; margin-right:8px; }

  /* ── BREADCRUMB ── */
  .breadcrumb   { display:flex; align-items:center; gap:6px; font-size:12px; color:#9CA3AF; margin-bottom:24px; animation:slideRight .4s ease both; }
  .breadcrumb a { color:#9CA3AF; text-decoration:none; transition:color .15s; }
  .breadcrumb a:hover { color:#053366; }
  .breadcrumb span { color:#374151; font-weight:600; }

  /* ── ARTICLE BODY ── */
  .article-body { font-size:16px; line-height:1.9; color:#374151; }
  .article-body h1 { font-family:'Instrument Serif',serif; font-size:clamp(24px,3vw,36px); font-weight:400; color:#053366; margin:36px 0 14px; letter-spacing:-.5px; line-height:1.15; }
  .article-body h2 { font-family:'Instrument Serif',serif; font-size:clamp(20px,2.5vw,28px); font-weight:400; color:#053366; margin:30px 0 12px; letter-spacing:-.3px; }
  .article-body h3 { font-size:18px; font-weight:700; color:#111827; margin:22px 0 10px; font-family:'Syne',sans-serif; }
  .article-body p  { margin-bottom:18px; }
  .article-body ul, .article-body ol { padding-left:26px; margin-bottom:18px; }
  .article-body li { margin-bottom:8px; line-height:1.8; }
  .article-body blockquote {
    border-left:3px solid #02AFCF;
    padding:18px 24px;
    background:rgba(2,175,207,.04);
    border-radius:0 14px 14px 0;
    margin:24px 0;
    font-style:italic;
    color:#4B5563;
    font-size:17px;
    line-height:1.75;
    font-family:'Instrument Serif',serif;
  }
  .article-body a      { color:#02AFCF; text-decoration:underline; }
  .article-body strong { font-weight:700; color:#111827; }
  .article-body img    { max-width:100%; border-radius:14px; margin:18px 0; }
  .article-body hr     { border:none; border-top:1px solid #E5E7EB; margin:28px 0; }

  /* ── CARDS / WIDGETS ── */
  .widget { background:white; border-radius:18px; border:1px solid #E5E7EB; padding:24px; margin-bottom:18px; }
  .widget-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:800; color:#053366; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #E5E7EB; display:flex; align-items:center; gap:8px; }
  .widget-title::before { content:''; display:block; width:24px; height:2px; background:#02AFCF; border-radius:2px; flex-shrink:0; }

  /* ── TAG CHIPS ── */
  .tag-chip { display:inline-flex; align-items:center; padding:5px 13px; border-radius:20px; font-size:12px; font-weight:600; background:#F3F4F6; color:#374151; border:1px solid #E5E7EB; text-decoration:none; transition:all .18s; }
  .tag-chip:hover { background:#053366; color:white; border-color:#053366; }

  /* ── CAT PILL ── */
  .cat-pill { display:inline-flex; align-items:center; padding:4px 12px; border-radius:20px; font-size:10px; font-weight:800; letter-spacing:.4px; text-transform:uppercase; }

  /* ── RECENT POST ROW ── */
  .rec-post { display:flex; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid #F3F4F6; text-decoration:none; color:inherit; transition:all .2s; }
  .rec-post:last-child { border-bottom:none; }
  .rec-post:hover .rec-title { color:#02AFCF; }

  /* ── COMMENT CARD ── */
  .comment-card { display:flex; gap:14px; padding:20px; background:#F9FAFB; border-radius:16px; border:1px solid #E5E7EB; margin-bottom:12px; }

  /* ── POST NAV ── */
  .post-nav { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:36px; }
  .post-nav-card { padding:18px 20px; background:white; border-radius:16px; border:1.5px solid #E5E7EB; text-decoration:none; color:inherit; transition:all .22s; }
  .post-nav-card:hover { border-color:#02AFCF; transform:translateY(-2px); }

  /* ── SECTION LABEL ── */
  .section-label { display:flex; align-items:center; gap:10px; margin-bottom:20px; }
  .section-bar-cyan { width:32px; height:2px; background:#02AFCF; border-radius:2px; }
  .section-bar-navy { width:32px; height:2px; background:#053366; border-radius:2px; }
  .section-text-cyan { font-size:10px; font-weight:800; letter-spacing:3px; color:#02AFCF; text-transform:uppercase; }
  .section-text-navy { font-size:10px; font-weight:800; letter-spacing:3px; color:#053366; text-transform:uppercase; }

  /* ── RELATED CARDS ── */
  .related-card { background:white; border-radius:18px; overflow:hidden; border:1px solid #E5E7EB; text-decoration:none; color:inherit; transition:border-color .22s,transform .22s; display:block; }
  .related-card:hover { border-color:rgba(2,175,207,.4); transform:translateY(-4px); }
  .related-card:hover .related-img { transform:scale(1.05); }
  .related-img { transition:transform .4s ease; width:100%; height:100%; object-fit:cover; display:block; }

  @media(max-width:900px){
    .page-layout { grid-template-columns:1fr !important; }
    .sidebar      { display:none; }
    .post-nav     { grid-template-columns:1fr !important; }
  }
  @media(max-width:600px){
    .detail-hero { padding:48px 20px 40px !important; }
    .content-area { padding:0 20px 60px !important; }
    .article-wrap { padding:24px !important; }
  }
`;

const TICKER_CATS = ["Destination","Aventure","Culture","Gastronomie","Conseils","Actualités"];

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
      <div style={{ paddingTop: 64 }} />

      {/* ══ HERO ══ */}
      <header className="hero">
  
  <div className="hero-label">
    <span className="hero-cat" > Article {post.category}</span>
  </div>

  <h1 className="hero-h1">{post.title}</h1>

  <div className="hero-line" />

  {/* Meta centré */}
  <div className="hero-meta" style={{ justifyContent: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${catColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <User size={14} color={catColor} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{post.author_name || "VoyajAime"}</span>
    </div>
    <div className="meta-item"><Calendar size={12} />{fmtDate(post.published_at || post.created_at)}</div>
    <div className="meta-item"><Clock size={12} />{readTime(post.content)} de lecture</div>
    <div className="meta-item"><Eye size={12} />{post.views || 0} vues</div>
    <div className="meta-item"><MessageSquare size={12} />{(comments || []).length} commentaire{(comments || []).length !== 1 ? "s" : ""}</div>
  </div>
</header>
      {/* ══ TICKER ══ */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...TICKER_CATS, ...TICKER_CATS].map((c, i) => (
            <div key={i} className="ticker-item"><span>✦</span>{c}</div>
          ))}
        </div>
      </div>

      {/* ══ CONTENT + SIDEBAR ══ */}
      <div className="content-area" style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 48px 80px" }}>
        <div className="page-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32 }}>

          {/* ── LEFT — Article ── */}
          <div>
            {/* Cover */}
            {post.cover_url && (
              <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 36, border: "1px solid #E5E7EB" }}>
                <BlogImage
                  src={post.cover_url}
                  alt={post.title}
                  style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
                />
              </div>
            )}

            {/* Article body */}
            <div
              className="article-wrap"
              style={{ background: "white", borderRadius: 20, padding: "40px", border: "1px solid #E5E7EB", marginBottom: 28, animation: "slideUp .4s ease both" }}
            >
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: post.content || "<p>Contenu à venir…</p>" }}
              />

              {/* Tags */}
              {allTags.length > 0 && (
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #F3F4F6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Tag size={13} color="#9CA3AF" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px" }}>Tags :</span>
                    {allTags.map(tag => (
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
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                      <ArrowLeft size={11} />Article précédent
                    </div>
                    <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 15, fontWeight: 400, color: "#053366", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {prevPost.title}
                    </p>
                  </Link>
                ) : <div />}
                {nextPost ? (
                  <Link href={`/blog/${nextPost.slug}`} className="post-nav-card" style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                      Article suivant<ArrowRight size={11} />
                    </div>
                    <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 15, fontWeight: 400, color: "#053366", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {nextPost.title}
                    </p>
                  </Link>
                ) : <div />}
              </div>
            )}

            {/* ── Related posts ── */}
            {related && related.length > 0 && (
              <div style={{ marginTop: 44 }}>
                <div className="section-label">
                  <div className="section-bar-cyan" />
                  <span className="section-text-cyan">Articles similaires</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                  {related.map(r => (
                    <Link key={r.id} href={`/blog/${r.slug}`} className="related-card">
                      <div style={{ height: 145, overflow: "hidden", position: "relative", background: "#EEF2FF" }}>
                        <BlogImage src={r.cover_url || FALLBACK} alt={r.title} className="related-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(5,19,51,.25),transparent)" }} />
                        <span className="cat-pill" style={{ position: "absolute", top: 10, left: 10, background: COLORS[r.category] || "#02AFCF", color: "white", fontSize: 10 }}>{r.category}</span>
                      </div>
                      <div style={{ padding: "14px" }}>
                        <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 15, fontWeight: 400, color: "#053366", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.title}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={9} />{fmtDate(r.published_at || r.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Comments ── */}
            <div style={{ marginTop: 44 }}>
              <div className="section-label">
                <div className="section-bar-navy" />
                <span className="section-text-navy">{(comments || []).length} Commentaire{(comments || []).length !== 1 ? "s" : ""}</span>
              </div>

              {(comments || []).length > 0 ? (
                <div style={{ marginBottom: 32 }}>
                  {(comments || []).map((c: { id: string; author: string; body: string; created_at: string }) => (
                    <div key={c.id} className="comment-card">
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${catColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: catColor }}>{c.author?.[0]?.toUpperCase()}</span>
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
                <div style={{ textAlign: "center", padding: "28px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB", marginBottom: 28 }}>
                  <MessageSquare size={28} color="#E5E7EB" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14, color: "#9CA3AF" }}>Soyez le premier à commenter !</p>
                </div>
              )}

              {/* Comment form */}
              <div style={{ background: "white", borderRadius: 20, padding: "32px", border: "1px solid #E5E7EB" }}>
                <div className="section-label">
                  <div className="section-bar-cyan" />
                  <span className="section-text-cyan">Laisser un commentaire</span>
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.65 }}>
                  Votre commentaire sera publié après modération.
                </p>
                <CommentForm postId={post.id} />
              </div>
            </div>
          </div>

          {/* ── RIGHT — Sidebar ── */}
          <aside className="sidebar" style={{ position: "sticky", top: 84, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>

            {/* Search */}
            <div className="widget">
              <p className="widget-title">Rechercher</p>
              <form action="/blog" method="GET">
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    name="q"
                    placeholder="Rechercher…"
                    style={{ flex: 1, padding: "9px 13px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", color: "#111827" }}
                  />
                  <button type="submit" style={{ padding: "9px 13px", background: "#053366", color: "white", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Categories */}
            <div className="widget">
              <p className="widget-title">Catégories</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {uniqueCats.map(c => (
                  <Link
                    key={c}
                    href={`/blog?cat=${c}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 10px", borderRadius: 10, textDecoration: "none", color: "#374151", fontSize: 13, fontWeight: 600, transition: "all .18s", background: post.category === c ? `${COLORS[c] || "#02AFCF"}10` : "transparent" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS[c] || "#02AFCF" }} />
                      {c}
                    </span>
                    <ChevronRight size={12} color="#9CA3AF" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent posts */}
            <div className="widget">
              <p className="widget-title">Articles récents</p>
              {(recentPosts || []).map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="rec-post">
                  <div style={{ width: 56, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#EEF2FF" }}>
                    <BlogImage src={r.cover_url || FALLBACK} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="rec-title" style={{ fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", transition: "color .2s" }}>
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
                  {allTags.map(tag => (
                    <Link key={tag} href={`/blog?q=${tag}`} className="tag-chip">{tag}</Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="widget" style={{ background: "#053366", border: "none" }}>
              <p className="widget-title" style={{ color: "white", borderColor: "rgba(255,255,255,.12)", fontFamily: "'Syne',sans-serif" }}>
                Newsletter
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", marginBottom: 14, lineHeight: 1.65 }}>
                Recevez nos derniers articles directement dans votre boîte mail.
              </p>
              <NewsletterWidget />
            </div>

            {/* Back to blog */}
            <Link
              href="/blog"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "white", border: "1.5px solid #E5E7EB", borderRadius: 14, textDecoration: "none", color: "#374151", fontSize: 13, fontWeight: 600, transition: "all .2s", marginBottom: 8 }}
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