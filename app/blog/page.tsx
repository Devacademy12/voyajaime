import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import HomeFooter from "@/app/components/home/HomeFooter";
import { BlogImage } from "@/app/components/touriste/BlogImage";
import { Calendar, Clock, Eye, ArrowRight, BookOpen } from "lucide-react";

const COLORS: Record<string, string> = {
  Destination: "#02AFCF",
  Aventure: "#E11D48",
  Culture: "#7C3AED",
  Gastronomie: "#D97706",
  Conseils: "#059669",
  Actualités: "#053366",
};

const FALLBACK =
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1400&q=80";

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
  if (q) query = query.ilike("title", `%${q}%`);

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

  const { count: totalCount } = await supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  const uniqueCats = [
    ...new Set((cats || []).map((c: { category: string }) => c.category)),
  ];
  const all = posts || [];
  const rest = featured ? all.filter((p) => p.id !== featured.id) : all;

  return (
    <>
      <TouristeNav />

      {/* ══ HERO FEATURED ══ */}
      {featured && !cat && !q && (
        <Link
          href={`/blog/${featured.slug}`}
          style={{
            display: "block",
            position: "relative",
            height: 520,
            overflow: "hidden",
            marginTop: 60,
            textDecoration: "none",
          }}
        >
          {/* Image */}
          <BlogImage
            src={featured.cover_url || FALLBACK}
            alt={featured.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "brightness(0.52)",
            }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(5,19,50,.95) 0%, rgba(5,19,50,.45) 55%, transparent 100%)",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "40px 48px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 32,
            }}
          >
            {/* Left */}
            <div style={{ flex: 1, maxWidth: 620 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 14px",
                  borderRadius: 20,
                  background: "rgba(2,175,207,.18)",
                  border: "1px solid rgba(2,175,207,.4)",
                  color: "#02AFCF",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                {featured.category}
              </span>

              <h1
                style={{
                  fontSize: "clamp(24px, 3.2vw, 40px)",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.1,
                  letterSpacing: "-0.8px",
                  marginBottom: 12,
                }}
              >
                {featured.title}
              </h1>

              {featured.excerpt && (
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,.7)",
                    lineHeight: 1.75,
                    marginBottom: 20,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {featured.excerpt}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 12,
                  color: "rgba(255,255,255,.55)",
                  flexWrap: "wrap",
                }}
              >
                {featured.author_name && (
                  <>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "#02AFCF",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {featured.author_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span
                        style={{ color: "rgba(255,255,255,.85)", fontWeight: 500 }}
                      >
                        {featured.author_name}
                      </span>
                    </span>
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        background: "rgba(255,255,255,.35)",
                        borderRadius: "50%",
                      }}
                    />
                  </>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={11} />
                  {fmtDate(featured.published_at || featured.created_at)}
                </span>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    background: "rgba(255,255,255,.35)",
                    borderRadius: "50%",
                  }}
                />
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={11} />
                  {readTime(featured.content)} de lecture
                </span>
                {featured.views > 0 && (
                  <>
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        background: "rgba(255,255,255,.35)",
                        borderRadius: "50%",
                      }}
                    />
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <Eye size={11} />
                      {featured.views.toLocaleString("fr-FR")} vues
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 26px",
                background: "#02AFCF",
                color: "#fff",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Lire l'article
              <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      )}

      {/* Fallback top margin when no hero */}
      {(!featured || cat || q) && <div style={{ paddingTop: 64 }} />}

      {/* ══ CONTENT ══ */}
      <div
        style={{
          maxWidth: 1140,
          margin: "0 auto",
          padding: "0 40px 80px",
        }}
      >
        {/* ── Filters + Sort ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            margin: "32px 0 28px",
            flexWrap: "wrap",
          }}
        >
          {/* Category filters */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/blog"
              style={{
                padding: "7px 18px",
                borderRadius: 20,
                border: `1.5px solid ${!cat ? "#0D0F14" : "#E5E7EB"}`,
                background: !cat ? "#0D0F14" : "#fff",
                color: !cat ? "#fff" : "#374151",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              Tout
            </Link>
            {uniqueCats.map((c) => (
              <Link
                key={c}
                href={`/blog?cat=${c}`}
                style={{
                  padding: "7px 18px",
                  borderRadius: 20,
                  border: `1.5px solid ${cat === c ? COLORS[c] || "#053366" : "#E5E7EB"}`,
                  background: cat === c ? COLORS[c] || "#053366" : "#fff",
                  color: cat === c ? "#fff" : "#374151",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                }}
              >
                {c}
              </Link>
            ))}
          </div>

          {/* Article count */}
          <p style={{ fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>
            {rest.length} article{rest.length !== 1 ? "s" : ""}
            {cat ? ` · ${cat}` : ""}
          </p>
        </div>

        {/* ── Section label ── */}
        {rest.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 28,
                height: 2,
                background: "#053366",
                borderRadius: 2,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "3px",
                color: "#053366",
                textTransform: "uppercase",
              }}
            >
              {cat || "Tous les articles"}
            </p>
          </div>
        )}

        {/* ── Grid ── */}
        {rest.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {rest.map((post) => {
              const catColor = COLORS[post.category] || "#02AFCF";
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid #EBEBEB",
                    display: "flex",
                    flexDirection: "column",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {/* Cover */}
                  <div
                    style={{
                      height: 190,
                      overflow: "hidden",
                      background: "#EEF2FF",
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <BlogImage
                      src={post.cover_url || FALLBACK}
                      alt={post.title}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(5,19,51,.28) 0%, transparent 55%)",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 11px",
                        borderRadius: 20,
                        background: catColor,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: ".5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {post.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div
                    style={{
                      padding: "18px 18px 0",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0D0F14",
                        lineHeight: 1.3,
                        letterSpacing: "-.2px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          lineHeight: 1.65,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.excerpt}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: 11,
                        color: "#9CA3AF",
                        marginTop: "auto",
                        flexWrap: "wrap",
                        paddingBottom: 14,
                      }}
                    >
                      <span
                        style={{ display: "flex", alignItems: "center", gap: 3 }}
                      >
                        <Calendar size={10} />
                        {fmtDate(post.published_at || post.created_at)}
                      </span>
                      <span
                        style={{ display: "flex", alignItems: "center", gap: 3 }}
                      >
                        <Clock size={10} />
                        {readTime(post.content)} de lecture
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      borderTop: "1px solid #F3F4F6",
                      padding: "12px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#02AFCF",
                      }}
                    >
                      Lire l'article <ArrowRight size={12} />
                    </span>
                    {post.views > 0 && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          color: "#9CA3AF",
                        }}
                      >
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

        {/* ── Empty state ── */}
        {all.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <BookOpen size={48} color="#E5E7EB" style={{ marginBottom: 16 }} />
            <p
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Aucun article trouvé
            </p>
            <Link
              href="/blog"
              style={{
                fontSize: 14,
                color: "#02AFCF",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Voir tous les articles
            </Link>
          </div>
        )}
      </div>

      <HomeFooter user={null} />
    </>
  );
}