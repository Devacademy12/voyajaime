import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { notFound } from "next/navigation";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { CommentForm } from "@/app/components/touriste/CommentForm";
import { NewsletterWidget } from "@/app/components/touriste/NewsletterWidget";
import {
  Calendar, Clock, Eye, ArrowLeft, ArrowRight,
  Tag, User, MessageSquare, ChevronRight, BookOpen,
} from "lucide-react";

/* ── helpers ── */
const COLORS: Record<string, string> = {
  Destination:"#02AFCF", Aventure:"#E11D48", Culture:"#7C3AED",
  Gastronomie:"#D97706", Conseils:"#059669", Actualités:"#053366",
};
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
}
function readTime(content: string | null) {
  if (!content) return "2 min";
  const words = content.replace(/<[^>]*>/g,"").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',system-ui,sans-serif; background:#F4F6FA; color:#111827; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  /* ── Article rich content ── */
  .article-body { font-size:16px; line-height:1.85; color:#374151; }
  .article-body h1 { font-family:'Playfair Display',serif; font-size:clamp(24px,3vw,36px); font-weight:900; color:#053366; margin:32px 0 14px; letter-spacing:-.5px; line-height:1.15; }
  .article-body h2 { font-family:'Playfair Display',serif; font-size:clamp(20px,2.5vw,28px); font-weight:800; color:#053366; margin:28px 0 12px; letter-spacing:-.3px; }
  .article-body h3 { font-size:18px; font-weight:800; color:#111827; margin:22px 0 10px; }
  .article-body p  { margin-bottom:16px; }
  .article-body ul, .article-body ol { padding-left:24px; margin-bottom:16px; }
  .article-body li { margin-bottom:8px; line-height:1.75; }
  .article-body blockquote {
    border-left:4px solid #02AFCF;
    padding:16px 22px;
    background:rgba(2,175,207,.05);
    border-radius:0 14px 14px 0;
    margin:22px 0;
    font-style:italic;
    color:#4B5563;
    font-size:17px;
    line-height:1.7;
  }
  .article-body a    { color:#02AFCF; text-decoration:underline; }
  .article-body strong { font-weight:700; color:#111827; }
  .article-body em   { font-style:italic; }
  .article-body hr   { border:none; border-top:1px solid #E5E7EB; margin:24px 0; }
  .article-body img  { max-width:100%; border-radius:14px; margin:16px 0; }

  /* ── Sidebar widgets ── */
  .widget { background:white; border-radius:18px; border:1px solid #E5E7EB; padding:24px; margin-bottom:20px; }
  .widget-title { font-family:'Playfair Display',serif; font-size:16px; font-weight:900; color:#053366; margin-bottom:18px; padding-bottom:12px; border-bottom:2px solid #F3F4F6; position:relative; }
  .widget-title::after { content:''; position:absolute; bottom:-2px; left:0; width:36px; height:2px; background:#02AFCF; border-radius:2px; }

  /* ── Tag chips ── */
  .tag-chip { display:inline-flex; align-items:center; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:600; background:#F3F4F6; color:#374151; border:1px solid #E5E7EB; text-decoration:none; transition:all .18s; }
  .tag-chip:hover { background:#053366; color:white; border-color:#053366; }

  /* ── Cat filter pill ── */
  .cat-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:.3px; text-transform:uppercase; }

  /* ── Recent post row ── */
  .rec-post { display:flex; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid #F3F4F6; text-decoration:none; color:inherit; transition:all .2s; }
  .rec-post:last-child { border-bottom:none; }
  .rec-post:hover p { color:#02AFCF; }

  /* ── Comment card ── */
  .comment-card { display:flex; gap:14px; padding:20px; background:#F9FAFB; border-radius:16px; border:1px solid #E5E7EB; margin-bottom:14px; }

  /* ── Breadcrumb ── */
  .breadcrumb { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,.6); }
  .breadcrumb a { color:rgba(255,255,255,.6); text-decoration:none; }
  .breadcrumb a:hover { color:white; }

  /* ── Nav post links ── */
  .post-nav { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:40px; }
  .post-nav-card { padding:18px 20px; background:white; border-radius:16px; border:1.5px solid #E5E7EB; text-decoration:none; color:inherit; transition:all .2s; }
  .post-nav-card:hover { border-color:#02AFCF; box-shadow:0 6px 20px rgba(2,175,207,.12); }

  @media(max-width:900px){
    .page-layout { grid-template-columns:1fr !important; }
    .sidebar { display:none; }
  }
  @media(max-width:600px){
    .hero-banner { padding:48px 24px !important; }
    .article-wrap { padding:24px !important; }
    .post-nav { grid-template-columns:1fr !important; }
  }
`;

/* ═══════════════════════════════
   PAGE
═══════════════════════════════ */
export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }  = await params;
  const supabase  = await createServerSupabaseClient();

  /* Main post */
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

  /* Increment views */
  await supabase
    .from("blog_posts")
    .update({ views: (post.views || 0) + 1 })
    .eq("id", post.id);

  /* Sidebar data */
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

  /* Related posts */
  const { data: related } = await supabase
    .from("blog_posts")
    .select("id, slug, title, cover_url, category, published_at, created_at, excerpt")
    .eq("is_published", true)
    .eq("category", post.category)
    .neq("id", post.id)
    .limit(3);

  /* Prev / next */
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

      {/* ══ HERO BANNER ══ */}
      <section className="hero-banner" style={{
        background: `linear-gradient(135deg, #053366 0%, #0a4a8a 50%, #02AFCF 100%)`,
        padding: "56px 40px 64px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Cover image as subtle bg */}
        {post.cover_url && (
          <>
            <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
              <BlogImage src={post.cover_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.18 }}/>
            </div>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(5,51,102,.85), rgba(2,175,207,.75))" }}/>
          </>
        )}
        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
          {/* Breadcrumb */}
          <div className="breadcrumb" style={{ marginBottom:20 }}>
            <Link href="/">Accueil</Link>
            <ChevronRight size={12}/>
            <Link href="/blog">Blog</Link>
            <ChevronRight size={12}/>
            <span style={{ color:"rgba(255,255,255,.85)" }}>{post.title}</span>
          </div>

          {/* Category */}
          <span className="cat-pill" style={{ background:`${catColor}`, color:"white", marginBottom:16, display:"inline-flex", boxShadow:`0 4px 14px ${catColor}55` }}>
            {post.category}
          </span>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(28px,4vw,52px)",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
            marginBottom: 18,
            maxWidth: 780,
          }}>
            {post.title}
          </h1>

          {/* Meta row */}
          <div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,.15)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <User size={15} color="white"/>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.85)" }}>{post.author_name || "VoyajAime"}</span>
            </div>
            {[
              { icon:<Calendar size={13}/>, text: fmtDate(post.published_at || post.created_at) },
              { icon:<Clock size={13}/>,    text: `${readTime(post.content)} de lecture` },
              { icon:<Eye size={13}/>,      text: `${post.views || 0} vues` },
              { icon:<MessageSquare size={13}/>, text: `${(comments||[]).length} commentaire${(comments||[]).length !== 1 ? "s" : ""}` },
            ].map((m, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"rgba(255,255,255,.65)" }}>
                {m.icon}{m.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTENT + SIDEBAR ══ */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 40px 80px" }}>
        <div className="page-layout" style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:32 }}>

          {/* ────────────────────────────────
              LEFT — Article
          ──────────────────────────────── */}
          <div>
            {/* Cover image */}
            {post.cover_url && (
              <div style={{ borderRadius:22, overflow:"hidden", marginBottom:36, boxShadow:"0 12px 48px rgba(5,51,102,.12)" }}>
                <BlogImage
                  src={post.cover_url}
                  alt={post.title}
                  style={{ width:"100%", height:420, objectFit:"cover", display:"block" }}
                />
              </div>
            )}

            {/* Article card */}
            <div className="article-wrap" style={{ background:"white", borderRadius:22, padding:"40px", border:"1px solid #E5E7EB", boxShadow:"0 4px 24px rgba(5,51,102,.05)", marginBottom:28, animation:"fadeUp .4s ease both" }}>
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: post.content || "<p>Contenu à venir…</p>" }}
              />

              {/* Tags */}
              {allTags.length > 0 && (
                <div style={{ marginTop:32, paddingTop:24, borderTop:"1px solid #F3F4F6" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <Tag size={14} color="#9CA3AF"/>
                    <span style={{ fontSize:12, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px" }}>Tags :</span>
                    {allTags.map(tag => (
                      <Link key={tag} href={`/blog?q=${tag}`} className="tag-chip">{tag}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Prev / Next navigation ── */}
            {(prevPost || nextPost) && (
              <div className="post-nav">
                {prevPost ? (
                  <Link href={`/blog/${prevPost.slug}`} className="post-nav-card" style={{ textAlign:"left" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>
                      <ArrowLeft size={12}/>Article précédent
                    </div>
                    <p style={{ fontSize:14, fontWeight:800, color:"#053366", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                      {prevPost.title}
                    </p>
                  </Link>
                ) : <div/>}
                {nextPost ? (
                  <Link href={`/blog/${nextPost.slug}`} className="post-nav-card" style={{ textAlign:"right" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6, fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>
                      Article suivant<ArrowRight size={12}/>
                    </div>
                    <p style={{ fontSize:14, fontWeight:800, color:"#053366", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                      {nextPost.title}
                    </p>
                  </Link>
                ) : <div/>}
              </div>
            )}

            {/* ── Related posts ── */}
            {related && related.length > 0 && (
              <div style={{ marginTop:40 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                  <div style={{ width:28, height:3, background:"#02AFCF", borderRadius:2 }}/>
                  <p style={{ fontSize:11, fontWeight:800, letterSpacing:"2px", color:"#02AFCF", textTransform:"uppercase" }}>Articles similaires</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  {related.map(r => (
                    <Link key={r.id} href={`/blog/${r.slug}`} style={{ background:"white", borderRadius:18, overflow:"hidden", border:"1px solid #E5E7EB", textDecoration:"none", color:"inherit", transition:"all .22s", display:"block" }}>
                      <div style={{ height:140, overflow:"hidden", position:"relative", background:"#EEF2FF" }}>
                        <BlogImage src={r.cover_url || FALLBACK} alt={r.title} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .4s", display:"block" }}/>
                        <span className="cat-pill" style={{ position:"absolute", top:10, left:10, background:COLORS[r.category]||"#02AFCF", color:"white", fontSize:10 }}>{r.category}</span>
                      </div>
                      <div style={{ padding:"14px" }}>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:800, color:"#053366", lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{r.title}</p>
                        <p style={{ fontSize:11, color:"#9CA3AF", marginTop:6, display:"flex", alignItems:"center", gap:4 }}><Calendar size={9}/>{fmtDate(r.published_at || r.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Comments ── */}
            <div style={{ marginTop:40 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
                <div style={{ width:28, height:3, background:"#053366", borderRadius:2 }}/>
                <p style={{ fontSize:11, fontWeight:800, letterSpacing:"2px", color:"#053366", textTransform:"uppercase" }}>
                  {(comments||[]).length} Commentaire{(comments||[]).length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Comment list */}
              {(comments || []).length > 0 ? (
                <div style={{ marginBottom:32 }}>
                  {(comments || []).map((c: { id: string; author: string; body: string; created_at: string }) => (
                    <div key={c.id} className="comment-card">
                      <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontSize:17, fontWeight:900, color:"white" }}>{c.author?.[0]?.toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                          <p style={{ fontWeight:800, fontSize:14, color:"#111827" }}>{c.author}</p>
                          <p style={{ fontSize:11, color:"#9CA3AF" }}>{fmtDate(c.created_at)}</p>
                        </div>
                        <p style={{ fontSize:14, color:"#4B5563", lineHeight:1.7 }}>{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"28px", background:"#F9FAFB", borderRadius:16, border:"1px dashed #E5E7EB", marginBottom:32 }}>
                  <MessageSquare size={28} color="#D1D5DB" style={{ marginBottom:8 }}/>
                  <p style={{ fontSize:14, color:"#9CA3AF" }}>Soyez le premier à commenter !</p>
                </div>
              )}

              {/* Leave a comment */}
              <div style={{ background:"white", borderRadius:22, padding:"32px", border:"1px solid #E5E7EB" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
                  <div style={{ width:28, height:3, background:"#02AFCF", borderRadius:2 }}/>
                  <p style={{ fontSize:11, fontWeight:800, letterSpacing:"2px", color:"#02AFCF", textTransform:"uppercase" }}>Laisser un commentaire</p>
                </div>
                <p style={{ fontSize:13, color:"#6B7280", marginBottom:20 }}>Connectez-vous ou commentez en tant qu'invité. Votre commentaire sera publié après modération.</p>
                <CommentForm postId={post.id} />
              </div>
            </div>
          </div>

          {/* ────────────────────────────────
              RIGHT — Sidebar
          ──────────────────────────────── */}
          <aside className="sidebar" style={{ position:"sticky", top:84, alignSelf:"start", maxHeight:"calc(100vh - 100px)", overflowY:"auto" }}>

            {/* Search */}
            <div className="widget">
              <p className="widget-title">Rechercher</p>
              <form action="/blog" method="GET">
                <div style={{ display:"flex", gap:8 }}>
                  <input name="q" placeholder="Rechercher un article…"
                    style={{ flex:1, padding:"10px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:13, fontFamily:"inherit", outline:"none", color:"#111827" }}/>
                  <button type="submit" style={{ padding:"10px 14px", background:"linear-gradient(135deg,#02AFCF,#053366)", color:"white", border:"none", borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Categories */}
            <div className="widget">
              <p className="widget-title">Catégories</p>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {uniqueCats.map(c => (
                  <Link key={c} href={`/blog?cat=${c}`} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 10px", borderRadius:10, textDecoration:"none", color:"#374151", fontSize:14, fontWeight:600, transition:"all .18s", background: post.category === c ? "rgba(2,175,207,.08)" : "transparent" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background: COLORS[c] || "#02AFCF" }}/>
                      {c}
                    </span>
                    <ChevronRight size={13} color="#9CA3AF"/>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent posts */}
            <div className="widget">
              <p className="widget-title">Articles récents</p>
              {(recentPosts || []).map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="rec-post">
                  <div style={{ width:58, height:50, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#EEF2FF" }}>
                    <BlogImage src={r.cover_url || FALLBACK} alt={r.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:"#111827", lineHeight:1.35, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", transition:"color .2s" }}>
                      {r.title}
                    </p>
                    <p style={{ fontSize:11, color:"#9CA3AF", marginTop:4, display:"flex", alignItems:"center", gap:3 }}>
                      <Calendar size={9}/>{fmtDate(r.published_at || r.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="widget">
                <p className="widget-title">Tags</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {allTags.map(tag => (
                    <Link key={tag} href={`/blog?q=${tag}`} className="tag-chip">{tag}</Link>
                  ))}
                </div>
              </div>
            )}

            {/* Featured image banner */}
            {post.cover_url && (
              <div style={{ borderRadius:18, overflow:"hidden", marginBottom:20, position:"relative", height:200 }}>
                <BlogImage src={post.cover_url} alt={post.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(5,51,102,.85),rgba(5,51,102,.25))", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"16px" }}>
                  <span className="cat-pill" style={{ background:catColor, color:"white", marginBottom:8, fontSize:10, alignSelf:"flex-start" }}>{post.category}</span>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:800, color:"white", lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{post.title}</p>
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="widget" style={{ background:"linear-gradient(135deg,#053366,#02AFCF)", border:"none" }}>
              <p className="widget-title" style={{ color:"white", borderColor:"rgba(255,255,255,.15)" }}>
                Newsletter
                <span style={{ display:"block", height:2, width:36, background:"rgba(255,255,255,.5)", borderRadius:2, marginTop:10 }}/>
              </p>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.7)", marginBottom:14, lineHeight:1.6 }}>
                Recevez nos derniers articles directement dans votre boîte mail.
              </p>
              <NewsletterWidget/>
            </div>

            {/* Back to blog */}
            <Link href="/blog" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", background:"white", border:"1.5px solid #E5E7EB", borderRadius:14, textDecoration:"none", color:"#374151", fontSize:13, fontWeight:700, transition:"all .2s", marginBottom:20 }}>
              <ArrowLeft size={14}/> Retour au blog
            </Link>

          </aside>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ background:"#0D1117", padding:"22px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <p style={{ color:"#374151", fontSize:13 }}>© 2026 VoyajAime — Tourisme en Tunisie</p>
        <Link href="/excursions" style={{ color:"#6B7280", fontSize:13, textDecoration:"none", fontWeight:500 }}>
          Voir les excursions →
        </Link>
      </div>
    </>
  );
}