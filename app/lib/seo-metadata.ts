// ================================================
//  seo-metadata.ts — Metadata globale VoyajAime
//  Emplacement : src/app/layout.tsx  (importer ici)
// ================================================

import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voyajaime.tn";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Titre ──────────────────────────────────────
  title: {
    default:  "VoyajAime — Excursions & Voyages en Tunisie",
    template: "%s | VoyajAime",
  },

  // ── Description ────────────────────────────────
  description:
    "Découvrez les meilleures excursions en Tunisie. Sidi Bou Saïd, Sahara, Djerba, Kairouan — planifiez votre voyage sur mesure avec VoyajAime.",

  // ── Mots-clés ──────────────────────────────────
  keywords: [
    "excursions Tunisie",
    "voyage Tunisie",
    "tourisme Tunisie",
    "VoyajAime",
    "Sidi Bou Said",
    "Sahara Tunisie",
    "Djerba",
    "Kairouan",
    "excursion Tunis",
    "circuit Tunisie",
    "guide touriste Tunisie",
    "réservation excursion",
  ],

  // ── Auteur ─────────────────────────────────────
  authors: [{ name: "VoyajAime", url: BASE_URL }],
  creator: "VoyajAime",
  publisher: "VoyajAime",

  // ── Open Graph (Facebook, LinkedIn…) ───────────
  openGraph: {
    type:        "website",
    locale:      "fr_TN",
    url:         BASE_URL,
    siteName:    "VoyajAime",
    title:       "VoyajAime — Excursions & Voyages en Tunisie",
    description: "Découvrez les meilleures excursions en Tunisie. Planifiez votre voyage sur mesure.",
    images: [
      {
        url:    `${BASE_URL}/og-image.jpg`,
        width:  1200,
        height: 630,
        alt:    "VoyajAime — Tourisme en Tunisie",
      },
    ],
  },

  // ── Twitter Card ────────────────────────────────
  twitter: {
    card:        "summary_large_image",
    title:       "VoyajAime — Excursions & Voyages en Tunisie",
    description: "Découvrez les meilleures excursions en Tunisie.",
    images:      [`${BASE_URL}/og-image.jpg`],
    creator:     "@voyajaime",
  },

  // ── Robots ─────────────────────────────────────
  robots: {
    index:              true,
    follow:             true,
    nocache:            false,
    googleBot: {
      index:              true,
      follow:             true,
      noimageindex:       false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },

  // ── Icônes ─────────────────────────────────────
  icons: {
    icon:        "/favicon.ico",
    shortcut:    "/favicon-16x16.png",
    apple:       "/apple-touch-icon.png",
  },

  // ── Manifest (PWA) ──────────────────────────────
  manifest: "/manifest.json",

  // ── Canonical ──────────────────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: {
      "fr-TN": BASE_URL,
      "ar-TN": `${BASE_URL}/ar`,
    },
  },

  // ── Vérification Search Console ────────────────
  // verification: {
  //   google: "VOTRE_CODE_GOOGLE_SEARCH_CONSOLE",
  // },
};


// ── Metadata par page ────────────────────────────
// Utiliser dans chaque page comme :
//
//  export const metadata: Metadata = generateMetadata({
//    title: "Excursions en Tunisie",
//    description: "Toutes nos excursions disponibles...",
//    path: "/excursions",
//  });

export function generatePageMetadata({
  title,
  description,
  path = "/",
  image,
}: {
  title:        string;
  description:  string;
  path?:        string;
  image?:       string;
}): Metadata {
  const url      = `${BASE_URL}${path}`;
  const ogImage  = image || `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      title,
      description,
      images: [ogImage],
    },
  };
}