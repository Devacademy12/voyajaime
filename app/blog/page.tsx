import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { Calendar, Clock, Eye, ArrowRight, BookOpen, Compass } from "lucide-react";

// ─── Design tokens (matches app palette) ─────────────────────────────────────

const COLORS: Record<string, string> = {
  Destination: "#02AFCF",
  Aventure:    "#E11D48",
  Culture:     "#7C3AED",
  Gastronomie: "#D97706",
  Conseils:    "#059669",
  Actualités:  "#053366",
};

const FALLBACK =
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1400&q=80";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readTime(content: string | null) {
  if (!content) return "2 min";
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, cover_url, category, tags, author_name, views, created_at, published_at, content"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (cat) query = query.eq("category", cat);
  if (q)   query = query.ilike("title", `%${q}%`);

  const { data: posts } = await query;

  const { data: featured } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, cover_url, category, tags, author_name, views, created_at, published_at, content"
    )
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  const { data: cats } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("is_published", true);

  const uniqueCats = [
    ...new Set((cats || []).map((c: { category: string }) => c.category)),
  ];
  const all  = posts || [];
  const rest = featured ? all.filter((p) => p.id !== featured.id) : all;

  return (
    <>
      {/* ── Google Fonts (same as app) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0);   }
        }

        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(10px); }
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }

        .blog-page { font-family: 'DM Sans', system-ui, sans-serif; background: #F7F8FA; min-height: 100vh; }

        /* ── Hero ── */
        .hero-link { display: block; position: relative; height: 580px; overflow: hidden; margin-top: 60px; text-decoration: none; }
        .hero-link:hover .hero-cta { background: transparent; color: #02AFCF; }

        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(100deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.45) 48%, rgba(0,0,0,.18) 100%);
        }
        .hero-overlay-bottom {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(5,51,102,.7) 0%, transparent 55%);
        }

        .hero-content {
          position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 1280px;
          padding: 40px 40px;
          display: flex; align-items: flex-end; justify-content: space-between; gap: 40px;
        }

        .hero-left { flex: 1; max-width: 680px; animation: slideUp 0.7s cubic-bezier(0.34,1.2,0.64,1) 0.1s both; }
        .hero-right { flex-shrink: 0; animation: slideUp 0.7s cubic-bezier(0.34,1.2,0.64,1) 0.3s both; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 16px; border-radius: 100px;
          background: rgba(2,175,207,.15); border: 1px solid rgba(2,175,207,.4);
          color: #02AFCF; font-size: 10px; font-weight: 800;
          letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px;
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.8vw, 52px);
          font-weight: 900; color: #fff; line-height: 1.05;
          letter-spacing: -2px; margin-bottom: 16px;
          text-shadow: 0 4px 40px rgba(0,0,0,0.3);
        }

        .hero-excerpt {
          font-size: 15px; color: rgba(255,255,255,.7); line-height: 1.75;
          margin-bottom: 22px;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        .hero-meta { display: flex; align-items: center; gap: 14px; font-size: 12px; color: rgba(255,255,255,.5); flex-wrap: wrap; }
        .hero-meta-dot { width: 3px; height: 3px; background: rgba(255,255,255,.3); border-radius: 50%; }
        .hero-meta-item { display: flex; align-items: center; gap: 5px; }

        .hero-avatar {
          width: 28px; height: 28px; border-radius: 50%; background: #02AFCF;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: #fff; flex-shrink: 0;
        }

        .hero-cta {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 15px 30px; background: #02AFCF; color: #fff;
          border-radius: 12px; font-size: 14px; font-weight: 700;
          white-space: nowrap; border: 2px solid #02AFCF;
          transition: all 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
          box-shadow: 0 8px 28px rgba(2,175,207,0.35);
        }
        .hero-cta:hover { background: transparent; color: #02AFCF; transform: translateY(-3px); }

        /* ── Scroll indicator ── */
        .scroll-hint {
          position: absolute; bottom: 24px; left: 50%;
          animation: float 2.4s ease-in-out infinite;
          opacity: .65; z-index: 15; cursor: pointer; transition: opacity .3s;
        }
        .scroll-hint:hover { opacity: 1; }

        /* ── Filter bar ── */
        .filter-bar {
          max-width: 1200px; margin: 0 auto; padding: 0 40px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-top: 40px; flex-wrap: wrap;
        }

        .filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }

        .pill {
          padding: 7px 20px; border-radius: 100px;
          font-size: 12px; font-weight: 700; text-decoration: none;
          white-space: nowrap; display: inline-block;
          transition: all 0.25s ease; border: 1.5px solid transparent;
          cursor: pointer;
        }
        .pill-active { background: #053366; color: #fff; border-color: #053366; }
        .pill-idle   { background: #fff;    color: #374151; border-color: #E5E7EB; }
        .pill-idle:hover { border-color: #053366; color: #053366; }

        .filter-count { font-size: 12px; color: #9CA3AF; white-space: nowrap; }

        /* ── Section label ── */
        .section-label {
          max-width: 1200px; margin: 28px auto 20px; padding: 0 40px;
          display: flex; align-items: center; gap: 10px;
        }
        .label-bar { width: 28px; height: 2px; background: #053366; border-radius: 2px; }
        .label-text {
          font-size: 10px; font-weight: 800; letter-spacing: 3px;
          color: #053366; text-transform: uppercase;
        }

        /* ── Grid ── */
        .posts-grid {
          max-width: 1200px; margin: 0 auto; padding: 0 40px 96px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px;
        }

        /* ── Card ── */
        .post-card {
          background: #fff; border-radius: 20px; overflow: hidden;
          border: 1px solid #EBEBEB; display: flex; flex-direction: column;
          text-decoration: none; color: inherit;
          transition: transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .post-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(5,51,102,.1);
          border-color: #d0d5e8;
        }
        .post-card:hover .card-img { transform: scale(1.06); }
        .post-card:hover .card-read { gap: 8px; }

        .card-img-wrap { height: 200px; overflow: hidden; background: #EEF2FF; position: relative; flex-shrink: 0; }
        .card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }

        .card-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(5,19,51,.3) 0%, transparent 55%);
        }

        .card-cat-badge {
          position: absolute; top: 13px; left: 13px;
          display: inline-flex; align-items: center;
          padding: 4px 12px; border-radius: 100px;
          font-size: 10px; font-weight: 800; letter-spacing: .5px;
          text-transform: uppercase; color: #fff;
        }

        .card-body { padding: 20px 20px 0; flex: 1; display: flex; flex-direction: column; gap: 8px; }

        .card-title {
          font-size: 16px; font-weight: 700; color: #0D0F14;
          line-height: 1.3; letter-spacing: -.2px;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          font-family: 'Playfair Display', serif;
        }

        .card-excerpt {
          font-size: 12.5px; color: #6B7280; line-height: 1.65;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        .card-meta {
          display: flex; gap: 12px; font-size: 11px; color: #9CA3AF;
          margin-top: auto; padding-bottom: 16px; flex-wrap: wrap; align-items: center;
        }
        .card-meta-item { display: flex; align-items: center; gap: 3px; }

        .card-footer {
          border-top: 1px solid #F3F4F6; padding: 13px 20px;
          display: flex; justify-content: space-between; align-items: center;
        }

        .card-read {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 700; color: #02AFCF;
          transition: gap 0.25s ease;
        }

        .card-views { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9CA3AF; }

        /* ── Empty state ── */
        .empty-state {
          max-width: 1200px; margin: 40px auto 96px; padding: 0 40px;
          text-align: center;
        }
        .empty-inner {
          background: #fff; border-radius: 24px; border: 1px solid #EBEBEB;
          padding: 80px 40px;
        }
        .empty-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: #F3F4F6; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }

        /* ── No hero padding ── */
        .no-hero-pad { padding-top: 80px; }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .posts-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .posts-grid { grid-template-columns: 1fr; padding: 0 20px 64px; }
          .hero-link   { height: 480px; }
          .hero-content { flex-direction: column; align-items: stretch; padding: 24px; gap: 20px; }
          .hero-right  { display: none; }
          .filter-bar, .section-label { padding: 0 20px; }
        }
      `}</style>

      <div className="blog-page">
        <TouristeNav />

        {/* ══ HERO FEATURED ══════════════════════════════════════════════════════ */}
        {featured && !cat && !q ? (
          <Link href={`/blog/${featured.slug}`} className="hero-link">
            {/* BG image */}
            <BlogImage
              src={featured.cover_url || FALLBACK}
              alt={featured.title}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover", display: "block",
                filter: "brightness(0.55)",
              }}
            />

            {/* Overlays */}
            <div className="hero-overlay" />
            <div className="hero-overlay-bottom" />

            {/* Content */}
            <div className="hero-content">
              {/* Left */}
              <div className="hero-left">
                <div className="hero-badge">
                  <Compass size={11} />
                  {featured.category}
                </div>

                <h1 className="hero-title">{featured.title}</h1>

                {featured.excerpt && (
                  <p className="hero-excerpt">{featured.excerpt}</p>
                )}

                <div className="hero-meta">
                  {featured.author_name && (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className="hero-avatar">
                          {featured.author_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <span style={{ color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
                          {featured.author_name}
                        </span>
                      </span>
                      <span className="hero-meta-dot" />
                    </>
                  )}
                  <span className="hero-meta-item">
                    <Calendar size={11} />
                    {fmtDate(featured.published_at || featured.created_at)}
                  </span>
                  <span className="hero-meta-dot" />
                  <span className="hero-meta-item">
                    <Clock size={11} />
                    {readTime(featured.content)} de lecture
                  </span>
                  {featured.views > 0 && (
                    <>
                      <span className="hero-meta-dot" />
                      <span className="hero-meta-item">
                        <Eye size={11} />
                        {featured.views.toLocaleString("fr-FR")} vues
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="hero-right">
                <span className="hero-cta">
                  Lire l'article <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Scroll hint */}
            <div className="scroll-hint">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </Link>
        ) : (
          <div className="no-hero-pad" />
        )}

        {/* ══ FILTER BAR ════════════════════════════════════════════════════════ */}
        <div className="filter-bar">
          <div className="filter-pills">
            <Link href="/blog" className={`pill ${!cat ? "pill-active" : "pill-idle"}`}>
              Tout
            </Link>
            {uniqueCats.map((c) => (
              <Link
                key={c}
                href={`/blog?cat=${c}`}
                className={`pill ${cat === c ? "pill-active" : "pill-idle"}`}
                style={
                  cat === c
                    ? { background: COLORS[c] || "#053366", borderColor: COLORS[c] || "#053366" }
                    : {}
                }
              >
                {c}
              </Link>
            ))}
          </div>
          <span className="filter-count">
            {rest.length} article{rest.length !== 1 ? "s" : ""}
            {cat ? ` · ${cat}` : ""}
          </span>
        </div>

        {/* ══ SECTION LABEL ═════════════════════════════════════════════════════ */}
        {rest.length > 0 && (
          <div className="section-label">
            <div className="label-bar" />
            <span className="label-text">{cat || "Tous les articles"}</span>
          </div>
        )}

        {/* ══ GRID ══════════════════════════════════════════════════════════════ */}
        {rest.length > 0 && (
          <div className="posts-grid">
            {rest.map((post) => {
              const catColor = COLORS[post.category] || "#02AFCF";
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="post-card">
                  {/* Cover */}
                  <div className="card-img-wrap">
                    <BlogImage
                      src={post.cover_url || FALLBACK}
                      alt={post.title}
                      className="card-img"
                      style={{ position: "absolute", inset: 0 }}
                    />
                    <div className="card-img-overlay" />
                    <span className="card-cat-badge" style={{ background: catColor }}>
                      {post.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="card-body">
                    <h3 className="card-title">{post.title}</h3>
                    {post.excerpt && (
                      <p className="card-excerpt">{post.excerpt}</p>
                    )}
                    <div className="card-meta">
                      <span className="card-meta-item">
                        <Calendar size={10} />
                        {fmtDate(post.published_at || post.created_at)}
                      </span>
                      <span className="card-meta-item">
                        <Clock size={10} />
                        {readTime(post.content)} de lecture
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="card-footer">
                    <span className="card-read">
                      Lire l'article <ArrowRight size={12} />
                    </span>
                    {post.views > 0 && (
                      <span className="card-views">
                        <Eye size={10} />
                        {post.views.toLocaleString("fr-FR")}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ══ EMPTY STATE ═══════════════════════════════════════════════════════ */}
        {all.length === 0 && (
          <div className="empty-state">
            <div className="empty-inner">
              <div className="empty-icon">
                <BookOpen size={32} color="#9CA3AF" />
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                Aucun article trouvé
              </p>
              <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 24 }}>
                Essayez une autre catégorie ou revenez plus tard.
              </p>
              <Link
                href="/blog"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 28px", background: "#053366", color: "#fff",
                  borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                Voir tous les articles <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        <HomeFooter user={null} />
      </div>
    </>
  );
}