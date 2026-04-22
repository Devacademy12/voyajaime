import type { Metadata } from "next";
import "./globals.css";
import "../public/style/prestataires.css";
import "../public/style/conversations.css";
import '../public/style/excursion-client.css';
export const metadata: Metadata = {
  title: "VoyajAime — Découvrez la Tunisie",
  description: "Plateforme de réservation d'excursions en Tunisie",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}