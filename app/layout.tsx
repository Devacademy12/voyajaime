import type { Metadata } from "next";
import "./globals.css";
import "../public/style/prestataires.css";
import "../public/style/conversations.css";
import '../public/style/excursion-client.css';
import '../public/style/excursion-detail.css';
// ✅ AJOUT : CSS transitions de page
import '../public/style/page-transitions.css';

import PageTransitionProvider from "@/app/components/PageTransitionProvider";

export const metadata: Metadata = {
  title: "VoyajAime — Découvrez la Tunisie",
  description: "Plateforme de réservation d'excursions en Tunisie",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/*
         * ✅ OPTIMISATION FONTS :
         * - dns-prefetch ajouté avant preconnect (évite un RTT supplémentaire)
         * - display=swap déjà présent → bon
         * - On supprime le double import dans page.tsx (voir commentaire ci-dessous)
         */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="main-font">
        {/* ✅ AJOUT : transitions fluides entre les pages */}
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>

        <style>{`
          .touriste-container {
            width: 100%;
            max-width: 1280px;
            margin-left: auto;
            margin-right: auto;
            padding-left: 24px;
            padding-right: 24px;
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          @media (max-width: 1024px) {
            .touriste-container { padding-left: 20px; padding-right: 20px; }
          }
          @media (max-width: 640px) {
            .touriste-container { padding-left: 16px; padding-right: 16px; }
          }
          .touriste-container > .messages-page-wrapper,
          .touriste-container > .ma2-page,
          .touriste-container > .mlp-page {
            width: calc(100% + 48px);
            margin-left: -24px;
            margin-right: -24px;
            max-width: none;
          }
          @media (max-width: 640px) {
            .touriste-container > .messages-page-wrapper,
            .touriste-container > .ma2-page,
            .touriste-container > .mlp-page {
              width: calc(100% + 32px);
              margin-left: -16px;
              margin-right: -16px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
