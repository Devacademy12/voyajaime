// app/components/touriste/BlogSection.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const COLORS: Record<string, string> = {
  Destination: "#0B7A8A", Aventure: "#D97706", Culture: "#053366",
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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .bs-section-v2 {
    padding: 96px 40px;
    background: white;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .bs-header-v2 {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: 52px; max-width: 1100px;
    margin-left: auto; margin-right: auto;
    flex-wrap: wrap; gap: 20px;
  }

  .bs-h2-v2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(28px, 4.5vw, 44px);
    font-weight: 700; color: #053366;
    letter-spacing: -0.5px; line-height: 1.1; margin: 0;
  }

  .bs-link-all-v2 {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 20px; font-size: 13px; font-weight: 700;
    color: #0B7A8A; text-decoration: none; transition: all 0.25s;
    border: 1.5px solid #0B7A8A; border-radius: 10px;
  }
  .bs-link-all-v2:hover { gap: 12px; background: #0B7A8A; color: white; }

  /* Featured large card */
  .bs-featured-v2 {
    display: grid; grid-template-columns: 1.1fr 0.9fr;
    border-radius: 20px; overflow: hidden;
    background: #F7F9FC;
    text-decoration: none; color: inherit;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 32px; max-width: 1100px;
    margin-left: auto; margin-right: auto;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }
  .bs-featured-v2:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 48px rgba(5,51,102,0.07);
    border-color: rgba(11,122,138,0.2);
  }
  .bs-featured-v2:hover .bs-feat-img-v2 { transform: scale(1.05); }
  .bs-feat-img-wrap-v2 { overflow: hidden; position: relative; min-height: 380px; background: #EEF2FF; }
  .bs-feat-img-v2 { transition: transform 0.55s cubic-bezier(0.165, 0.84, 0.44, 1); width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; inset: 0; }

  /* Small cards */
  .bs-grid-v2 {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; max-width: 1100px; margin: 0 auto;
  }
  .bs-card-v2 {
    background: white; border-radius: 16px; overflow: hidden;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 5px rgba(0,0,0,0.04);
    display: flex; flex-direction: column;
    text-decoration: none; color: inherit;
    transition: all 0.28s ease;
  }
  .bs-card-v2:hover {
    transform: translateY(-6px);
    border-color: rgba(11,122,138,0.2);
    box-shadow: 0 16px 36px rgba(11,122,138,0.07);
  }
  .bs-card-v2:hover .bs-card-img-v2 { transform: scale(1.07); }
  .bs-card-img-wrap-v2 { height: 190px; overflow: hidden; background: #EEF2FF; position: relative; flex-shrink: 0; }
  .bs-card-img-v2 { transition: transform 0.5s ease; width: 100%; height: 100%; object-fit: cover; display: block; position: absolute; inset: 0; }

  .bs-cat-v2 {
    display: inline-flex; align-items: center;
    padding: 5px 14px; border-radius: 100px;
    font-size: 10px; font-weight: 800; letter-spacing: 1px;
    text-transform: uppercase; color: white;
    margin-bottom: 10px; width: fit-content; align-self: flex-start;
  }
  .bs-meta-v2 { display: flex; gap: 14px; font-size: 12px; color: #9CA3AF; font-weight: 500; }
  .bs-meta-v2 span { display: flex; align-items: center; gap: 5px; }
  .bs-read-v2 {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 700; color: #0B7A8A;
    text-decoration: none; transition: all 0.2s; margin-top: auto;
  }
  .bs-read-v2:hover { gap: 11px; }

  .bs-cta-v2 {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 32px; background: #0B7A8A; color: white;
    font-weight: 700; text-decoration: none; border-radius: 12px;
    transition: all 0.25s; border: 2px solid #0B7A8A;
    box-shadow: 0 6px 16px rgba(11,122,138,0.2);
  }
  .bs-cta-v2:hover {
    background: transparent; color: #0B7A8A;
    transform: translateY(-2px);
  }

  @media(max-width: 900px) {
    .bs-featured-v2 { grid-template-columns: 1fr; }
    .bs-feat-img-wrap-v2 { min-height: 260px; }
    .bs-grid-v2 { grid-template-columns: 1fr 1fr; }
    .bs-section-v2 { padding: 56px 20px; }
  }
  @media(max-width: 600px) {
    .bs-grid-v2 { grid-template-columns: 1fr; }
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
          .limit(1).single();

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
      <section className="bs-section-v2">

        {/* Header */}
        <div className="bs-header-v2">
          <div>
            <p className="section-eyebrow">Récits de Voyage</p>
            <h2 className="bs-h2-v2">Histoires &amp; Inspirations</h2>
          </div>
          <Link href="/blog" className="bs-link-all-v2">
            Voir le blog <ArrowRight size={15} />
          </Link>
        </div>

        {/* Featured card */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="bs-featured-v2">
            <div className="bs-feat-img-wrap-v2">
              <BlogImage
                src={featured.cover_url || FALLBACK}
                alt={featured.title}
                className="bs-feat-img-v2"
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,51,102,0.25), transparent 50%)" }} />
            </div>

            <div style={{ padding: "36px", display: "flex", flexDirection: "column", gap: 14, background: "white" }}>
              <span className="bs-cat-v2" style={{ background: COLORS[featured.category] || "#0B7A8A" }}>
                {featured.category}
              </span>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(22px, 2.5vw, 32px)",
                fontWeight: 700, color: "#053366",
                letterSpacing: "-0.3px", lineHeight: 1.2, margin: 0,
              }}>
                {featured.title}
              </h3>
              {featured.excerpt && (
                <p style={{ fontSize: 15, color: "#4B5563", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                  {featured.excerpt}
                </p>
              )}
              <div className="bs-meta-v2">
                <span><Calendar size={13} />{fmtDate(featured.published_at || featured.created_at)}</span>
                <span><Clock size={13} />{readTime(featured.content)}</span>
              </div>
              <span className="bs-read-v2">Lire l&apos;article <ArrowRight size={15} /></span>
            </div>
          </Link>
        )}

        {/* Grid 3 cards */}
        {rest.length > 0 && (
          <div className="bs-grid-v2">
            {rest.map((post) => {
              const catColor = COLORS[post.category] || "#0B7A8A";
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="bs-card-v2">
                  <div className="bs-card-img-wrap-v2">
                    <BlogImage
                      src={post.cover_url || FALLBACK}
                      alt={post.title}
                      className="bs-card-img-v2"
                    />
                    <div style={{ position: "absolute", bottom: 10, left: 10 }}>
                      <span className="bs-cat-v2" style={{ background: catColor, margin: 0 }}>
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    <h4 style={{
                      fontSize: 17, fontWeight: 700, color: "#053366", lineHeight: 1.35, margin: 0,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {post.title}
                    </h4>
                    <div className="bs-meta-v2" style={{ marginTop: "auto" }}>
                      <span><Calendar size={12} />{fmtDate(post.published_at || post.created_at)}</span>
                    </div>
                    <span className="bs-read-v2" style={{ fontSize: 13 }}>
                      Lire la suite <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 52, display: "flex", justifyContent: "center" }}>
          <Link href="/blog" className="bs-cta-v2">
            Voir tous les articles <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
