import Link from "next/link";
import { User, LogIn } from "lucide-react";
import { ROUTES } from "@/app/lib/routes";
import { Logo } from "@/lib/homeUtils";

interface HomeFooterProps {
  user:     { email?: string; id?: string } | null;
  openAuth: (mode: "login" | "register" | "prestataire") => void;
}

export default function HomeFooter({ user, openAuth }: HomeFooterProps) {
  return (
    <footer
      className="footer"
      style={{
        background: "#0D1117", padding: "36px 72px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo />
      </div>

      <p style={{ color: "#4B5563", fontSize: 13 }}>© 2026 VoyajAime — Tourisme en Tunisie</p>

      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <Link href={ROUTES.excursions} style={{ color: "#6B7280", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
          Excursions
        </Link>
        {user ? (
          <Link
            href={ROUTES.touriste.dashboard}
            style={{
              padding: "10px 20px", background: "#2B96A8", color: "white",
              borderRadius: 30, textDecoration: "none", fontSize: 13, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <User size={13} /> Mon espace
          </Link>
        ) : (
          <button
            onClick={() => openAuth("login")}
            style={{
              padding: "10px 20px", background: "#2B96A8", color: "white",
              borderRadius: 30, border: "none", fontSize: 13, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 6,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <LogIn size={13} /> Connexion
          </button>
        )}
      </div>
    </footer>
  );
}