// app/components/touriste/BlogSection.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { Calendar, Clock, ArrowRight } from "lucide-react";

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
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes bs-slideUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bs-slideRight{ from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes bs-expandW   { from{width:0} to{width:48px} }
  @keyframes bs-pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }

  .bs-section { padding:80px 48px; background:#FAFAF9; font-family:'DM Sans',sans-serif; }

  /* ── Header ── */
  .bs-header { text-align:center; margin-bottom:52px; }
  .bs-label  { display:inline-flex; align-items:center; gap:8px; margin-bottom:20px; animation:bs-slideRight .5s ease both; }
  .bs-dot    { width:7px; height:7px; border-radius:50%; background:#02AFCF; animation:bs-pulse 2s ease infinite; }
  .bs-label-text { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#6B7280; font-family:'DM Sans',sans-serif; }
  .bs-h2  { font-size:clamp(28px,3.5vw,40px); font-weight:800; color:#053366; margin:0 0 12px; letter-spacing:-.5px; line-height:1.15; font-family:'DM Sans',sans-serif; }
  .bs-h2 em { font-style:italic; color:#02AFCF; font-family:'Instrument Serif',serif; font-weight:400; }
  .bs-line { width:0; height:2px; background:#053366; margin:0 auto 16px; animation:bs-expandW .6s cubic-bezier(.4,0,.2,1) .2s both; }
  .bs-sub  { font-size:15px; color:#6B7280; max-width:420px; margin:0 auto; line-height:1.7; }

  /* ── Featured large card ── */
  .bs-featured { display:grid; grid-template-columns:1.2fr 1fr; border:1px solid #E5E7EB; border-radius:22px; overflow:hidden; background:white; text-decoration:none; color:inherit; transition:border-color .25s,transform .25s; margin-bottom:24px; animation:bs-slideUp .5s ease .1s both; opacity:0; animation-fill-mode:forwards; }
  .bs-featured:hover { border-color:rgba(2,175,207,.45); transform:translateY(-4px); }
  .bs-featured:hover .bs-feat-img { transform:scale(1.04); }
  .bs-feat-img { transition:transform .5s ease; width:100%; height:100%; object-fit:cover; display:block; }
  .bs-feat-num { position:absolute; bottom:12px; right:16px; font-family:'Syne',sans-serif; font-size:56px; font-weight:800; color:rgba(255,255,255,.13); line-height:1; pointer-events:none; }

  /* ── Small cards grid ── */
  .bs-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .bs-card { background:white; border-radius:18px; overflow:hidden; border:1px solid #E5E7EB; display:flex; flex-direction:column; text-decoration:none; color:inherit; transition:border-color .25s,transform .25s; animation:bs-slideUp .4s ease both; opacity:0; animation-fill-mode:forwards; }
  .bs-card:hover { transform:translateY(-5px); border-color:rgba(2,175,207,.35); }
  .bs-card:hover .bs-card-img { transform:scale(1.06); }
  .bs-card-img { transition:transform .45s ease; width:100%; height:100%; object-fit:cover; display:block; position:absolute; inset:0; }

  /* ── Shared ── */
  .bs-cat { display:inline-flex; align-items:center; padding:3px 11px; border-radius:20px; font-size:10px; font-weight:800; letter-spacing:.4px; text-transform:uppercase; color:white; }
  .bs-meta { display:flex; gap:12px; font-size:11px; color:#9CA3AF; flex-wrap:wrap; }
  .bs-meta span { display:flex; align-items:center; gap:3px; }
  .bs-read { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:#02AFCF; text-decoration:none; transition:gap .18s; }
  .bs-read:hover { gap:9px; }

  /* ── CTA ── */
  .bs-cta-wrap { text-align:center; margin-top:36px; }
  .bs-cta { display:inline-flex; align-items:center; gap:8px; padding:13px 28px; border-radius:30px; background:#053366; color:white; font-size:14px; font-weight:700; text-decoration:none; font-family:'DM Sans',sans-serif; transition:background .2s,transform .2s; }
  .bs-cta:hover { background:#02AFCF; transform:translateY(-2px); }

  @media(max-width:900px){
    .bs-featured { grid-template-columns:1fr !important; }
    .bs-grid     { grid-template-columns:1fr 1fr !important; }
  }
  @media(max-width:580px){
    .bs-section { padding:56px 20px; }
    .bs-grid    { grid-template-columns:1fr !important; }
  }
`;

export default function BlogSection() {
  const [featured, setFeatured] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;

    (async () => {
      try {
        const { data: fData } = await supabase
          .from("blog_posts")
          .select("id, slug, title, excerpt, cover_url, category, published_at, created_at, content, views")
          .eq("is_published", true)
          .eq("is_featured", true)
          .order("published_at", { ascending: false })
          .limit(1)
          .single();

        const { data: pData } = await supabase
          .from("blog_posts")
          .select("id, slug, title, excerpt, cover_url, category, published_at, created_at, content")
          .eq("is_published", true)
          .neq("id", fData?.id ?? "")
          .order("published_at", { ascending: false })
          .limit(3);

        if (!mounted) return;
        setFeatured(fData ?? null);
        setPosts(pData ?? []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) return null;
  const rest = posts || [];
  if (!featured && rest.length === 0) return null;

  return (
    <>
      <style>{CSS}</style>

      <section className="bs-section">

        {/* ── Header ── */}
        <div className="bs-header">
          <div className="bs-label">
            <div className="bs-dot" />
            <span className="bs-label-text">Notre Blog</span>
          </div>
          <h2 className="bs-h2">
            Histoires &amp; Inspirations
          </h2>
          <div className="bs-line" />
          <p className="bs-sub">
            Conseils de voyage, découvertes culturelles et récits d'aventure en Tunisie.
          </p>
        </div>

        {/* ── Featured card ── */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="bs-featured">
            {/* Image */}
            <div style={{ overflow: "hidden", minHeight: 340, background: "#EEF2FF", position: "relative" }}>
              <BlogImage
                src={featured.cover_url || FALLBACK}
                alt={featured.title}
                className="bs-feat-img"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(5,19,51,.35),transparent 60%)" }} />
              <div className="bs-feat-num">01</div>
            </div>

            {/* Content */}
            <div style={{ padding: "36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, borderLeft: "1px solid #E5E7EB" }}>
              <span className="bs-cat" style={{ background: COLORS[featured.category] || "#02AFCF", alignSelf: "flex-start" }}>
                {featured.category}
              </span>
              <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 400, color: "#053366", letterSpacing: "-0.4px", lineHeight: 1.2, margin: 0 }}>
                {featured.title}
              </h3>
              {featured.excerpt && (
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                  {featured.excerpt}
                </p>
              )}
              <div className="bs-meta">
                <span><Calendar size={10} />{fmtDate(featured.published_at || featured.created_at)}</span>
                <span><Clock size={10} />{readTime(featured.content)} de lecture</span>
              </div>
              <span className="bs-read">Lire l'article <ArrowRight size={13} /></span>
            </div>
          </Link>
        )}

        {/* ── Grid 3 cards ── */}
        {rest.length > 0 && (
          <div className="bs-grid">
            {rest.map((post, i) => {
              const catColor = COLORS[post.category] || "#02AFCF";
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bs-card"
                  style={{ animationDelay: `${.15 + i * .08}s` }}
                >
                  {/* Cover */}
                  <div style={{ height: 190, overflow: "hidden", background: "#EEF2FF", position: "relative", flexShrink: 0 }}>
                    <BlogImage
                      src={post.cover_url || FALLBACK}
                      alt={post.title}
                      className="bs-card-img"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(5,19,51,.25),transparent 55%)" }} />
                    <span className="bs-cat" style={{ position: "absolute", top: 12, left: 12, background: catColor }}>
                      {post.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 17, fontWeight: 400, color: "#053366", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div className="bs-meta" style={{ marginTop: "auto" }}>
                      <span><Calendar size={10} />{fmtDate(post.published_at || post.created_at)}</span>
                      <span><Clock size={10} />{readTime(post.content)} de lecture</span>
                    </div>
                    <span className="bs-read">Lire l'article <ArrowRight size={12} /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── CTA ── */}
        <div className="bs-cta-wrap">
          <Link href="/blog" className="bs-cta">
            Voir tous les articles <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}