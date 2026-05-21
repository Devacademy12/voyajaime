// app/components/touriste/BlogSection.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const COLORS: Record<string, string> = {
  Destination: "#2B96A8", Aventure: "#D97706", Culture: "#053366",
  Gastronomie: "#9CA3AF", Conseils: "#4A5568", Actualités: "#053366",
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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .bs-section { 
    padding: 100px 40px; 
    background: white; 
    font-family: 'DM Sans', sans-serif; 
  }

  /* ── Header ── */
  .bs-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-end; 
    margin-bottom: 60px; 
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .bs-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 3px;
    color: #2B96A8;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .bs-eyebrow::before {
    content: '';
    width: 30px;
    height: 2px;
    background: #2B96A8;
    border-radius: 2px;
  }

  .bs-h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 900;
    color: #053366;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin: 0;
  }

  .bs-link-all {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    font-size: 14px;
    font-weight: 700;
    color: #2B96A8;
    text-decoration: none;
    transition: all 0.3s;
    border: 1.5px solid #2B96A8;
    border-radius: 12px;
  }
  .bs-link-all:hover {
    gap: 12px;
    background: #2B96A8;
    color: white;
  }

  /* ── Featured large card ── */
  .bs-featured { 
    display: grid; 
    grid-template-columns: 1.1fr 0.9fr; 
    border-radius: 24px; 
    overflow: hidden; 
    background: #FAFAF9;
    text-decoration: none; 
    color: inherit; 
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
    margin-bottom: 40px;
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
    border: 1px solid #F3F4F6;
  }
  .bs-featured:hover { 
    transform: translateY(-8px);
    box-shadow: 0 30px 60px rgba(5, 51, 102, 0.08);
    border-color: #2B96A833;
  }
  .bs-featured:hover .bs-feat-img { transform: scale(1.05); }
  .bs-feat-img-wrap { overflow: hidden; position: relative; min-height: 400px; background: #EEF2FF; }
  .bs-feat-img { transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; inset: 0; }

  /* ── Small cards grid ── */
  .bs-grid { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 24px; 
    max-width: 1100px;
    margin: 0 auto;
  }
  .bs-card { 
    background: white; 
    border-radius: 20px; 
    overflow: hidden; 
    border: 1px solid #F3F4F6; 
    display: flex; 
    flex-direction: column; 
    text-decoration: none; 
    color: inherit; 
    transition: all 0.3s ease;
  }
  .bs-card:hover { 
    transform: translateY(-8px); 
    border-color: #2B96A8;
    box-shadow: 0 20px 40px rgba(43, 150, 168, 0.08);
  }
  .bs-card:hover .bs-card-img { transform: scale(1.08); }
  .bs-card-img-wrap { height: 200px; overflow: hidden; background: #EEF2FF; position: relative; flex-shrink: 0; }
  .bs-card-img { transition: transform 0.5s ease; width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; inset: 0; }

  /* ── Shared ── */
  .bs-cat { 
    display: inline-flex; 
    align-items: center; 
    padding: 6px 16px; 
    border-radius: 100px; 
    font-size: 11px; 
    font-weight: 800; 
    letter-spacing: 1px; 
    text-transform: uppercase; 
    color: white; 
    margin-bottom: 12px;
    width: fit-content;
    align-self: flex-start;
  }
  .bs-meta { display: flex; gap: 16px; font-size: 12px; color: #6B7280; font-weight: 500; }
  .bs-meta span { display: flex; align-items: center; gap: 5px; }
  .bs-read { 
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    font-size: 14px; 
    font-weight: 700; 
    color: #2B96A8; 
    text-decoration: none; 
    transition: all 0.2s; 
    margin-top: auto;
  }
  .bs-read:hover { gap: 12px; }

  .bs-cta-wrap {
    margin-top: 60px;
    display: flex;
    justify-content: center;
  }
  .bs-cta {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 16px 36px;
    background: #2B96A8;
    color: white;
    font-weight: 700;
    text-decoration: none;
    border-radius: 14px;
    transition: all 0.3s;
    border: 2px solid #2B96A8;
    box-shadow: 0 8px 20px rgba(43, 150, 168, 0.2);
  }
  .bs-cta:hover {
    background: transparent;
    color: #2B96A8;
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(43, 150, 168, 0.3);
  }

  @media(max-width: 900px) {
    .bs-featured { grid-template-columns: 1fr; }
    .bs-feat-img-wrap { min-height: 300px; }
    .bs-grid { grid-template-columns: 1fr 1fr; }
  }
  @media(max-width: 600px) {
    .bs-section { padding: 60px 20px; }
    .bs-grid { grid-template-columns: 1fr; }
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
          <div>
            <span className="bs-eyebrow">Récits de Voyage</span>
            <h2 className="bs-h2">Histoires & Inspirations</h2>
          </div>
          <Link href="/blog" className="bs-link-all">
            Voir le blog <ArrowRight size={16} />
          </Link>
        </div>

        {/* ── Featured card ── */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="bs-featured">
            {/* Image */}
            <div className="bs-feat-img-wrap">
              <BlogImage
                src={featured.cover_url || FALLBACK}
                alt={featured.title}
                className="bs-feat-img"
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,51,102,0.4), transparent 50%)" }} />
            </div>

            {/* Content */}
            <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 16 }}>
              <span className="bs-cat" style={{ background: COLORS[featured.category] || "#2B96A8" }}>
                {featured.category}
              </span>
              <h3 style={{ 
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(24px, 3vw, 36px)", 
                fontWeight: 900, 
                color: "#053366", 
                letterSpacing: "-0.5px", 
                lineHeight: 1.2, 
                margin: 0 
              }}>
                {featured.title}
              </h3>
              {featured.excerpt && (
                <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                  {featured.excerpt}
                </p>
              )}
              <div className="bs-meta">
                <span><Calendar size={14} />{fmtDate(featured.published_at || featured.created_at)}</span>
                <span><Clock size={14} />{readTime(featured.content)}</span>
              </div>
              <span className="bs-read">Lire l&apos;article <ArrowRight size={16} /></span>
            </div>
          </Link>
        )}

        {/* ── Grid 3 cards ── */}
        {rest.length > 0 && (
          <div className="bs-grid">
            {rest.map((post) => {
              const catColor = COLORS[post.category] || "#2B96A8";
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bs-card"
                >
                  {/* Cover */}
                  <div className="bs-card-img-wrap">
                    <BlogImage
                      src={post.cover_url || FALLBACK}
                      alt={post.title}
                      className="bs-card-img"
                    />
                    <div style={{ position: "absolute", bottom: 12, left: 12 }}>
                      <span className="bs-cat" style={{ background: catColor, margin: 0 }}>
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    <h4 style={{ 
                      fontSize: 18, 
                      fontWeight: 800, 
                      color: "#053366", 
                      lineHeight: 1.4, 
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {post.title}
                    </h4>
                    
                    <div className="bs-meta" style={{ marginTop: "auto" }}>
                      <span><Calendar size={12} />{fmtDate(post.published_at || post.created_at)}</span>
                    </div>
                    
                    <span className="bs-read" style={{ fontSize: 13 }}>
                      Lire la suite <ArrowRight size={14} />
                    </span>
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