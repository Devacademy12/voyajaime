import { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient();
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voyajaime.tn";

  // ── Pages statiques ──────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              `${BASE_URL}`,
      lastModified:     new Date(),
      changeFrequency:  "daily",
      priority:         1.0,
    },
    {
      url:              `${BASE_URL}/excursions`,
      lastModified:     new Date(),
      changeFrequency:  "daily",
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/blog`,
      lastModified:     new Date(),
      changeFrequency:  "weekly",
      priority:         0.8,
    },
    {
      url:              `${BASE_URL}/a-propos`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.6,
    },
    {
      url:              `${BASE_URL}/contact`,
      lastModified:     new Date(),
      changeFrequency:  "monthly",
      priority:         0.6,
    },
  ];

  // ── Pages excursions dynamiques ──────────────────────────────────
  const { data: excursions } = await supabase
    .from("excursions")
    .select("id, updated_at")
    .eq("is_active", true);

  const excursionPages: MetadataRoute.Sitemap = (excursions || []).map((exc) => ({
    url:              `${BASE_URL}/excursions/${exc.id}`,
    lastModified:     new Date(exc.updated_at || new Date()),
    changeFrequency:  "weekly" as const,
    priority:         0.85,
  }));

  // ── Pages blog dynamiques ─────────────────────────────────────────
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true);

  const blogPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url:              `${BASE_URL}/blog/${post.slug}`,
    lastModified:     new Date(post.updated_at || new Date()),
    changeFrequency:  "monthly" as const,
    priority:         0.7,
  }));

  return [...staticPages, ...excursionPages, ...blogPages];
}