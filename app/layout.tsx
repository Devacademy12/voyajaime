import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoyajAime — Tourisme en Tunisie",
  description: "Planifiez votre voyage et réservez des excursions en Tunisie",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
