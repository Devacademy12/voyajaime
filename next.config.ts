import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Optimisation images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ✅ Compression gzip/brotli
  compress: true,

  // ✅ Cache des assets statiques
  async headers() {
    return [
      {
        source: "/style/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;