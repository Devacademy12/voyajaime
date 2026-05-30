import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voyajaime.tn";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/excursions",
          "/excursions/",
          "/blog",
          "/blog/",
          "/contact",
          "/a-propos",
        ],
        disallow: [
          "/admin/",
          "/touriste/",
          "/prestataire/",
          "/auth/",
          "/api/",
          "/_next/",
          "/404",
          "/500",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}