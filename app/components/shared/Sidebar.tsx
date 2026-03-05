"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Role = "touriste" | "prestataire" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV: Record<Role, NavItem[]> = {
  touriste: [
    { label: "Accueil", href: "/touriste/dashboard", icon: "🏠" },
    { label: "Mon itinéraire", href: "/touriste/itineraire", icon: "🗺️" },
    { label: "Mes réservations", href: "/touriste/reservations", icon: "📅" },
    { label: "Mes favoris", href: "/touriste/favoris", icon: "❤️" },
    { label: "Messages", href: "/touriste/messages", icon: "💬" },
  ],
  prestataire: [
    { label: "Dashboard", href: "/prestataire/dashboard", icon: "📊" },
    { label: "Mes excursions", href: "/prestataire/excursions", icon: "🏔️" },
    { label: "Réservations", href: "/prestataire/reservations", icon: "📅" },
    { label: "Paiements", href: "/prestataire/paiements", icon: "💰" },
    { label: "Avis clients", href: "/prestataire/avis", icon: "⭐" },
    { label: "Messages", href: "/prestataire/messages", icon: "💬" },
    { label: "Mon profil", href: "/prestataire/profil", icon: "👤" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Prestataires", href: "/admin/prestataires", icon: "🏢" },
    { label: "Excursions", href: "/admin/excursions", icon: "🏔️" },
    { label: "Réservations", href: "/admin/reservations", icon: "📅" },
    { label: "Paiements", href: "/admin/paiements", icon: "💰" },
    { label: "Avis & Modération", href: "/admin/avis", icon: "🛡️" },
        { label: "Catalogue & Villes", href: "/admin/catalogue", icon: "🗂️" },

  ],
};

const ROLE_LABEL: Record<Role, string> = {
  touriste: "Touriste",
  prestataire: "Prestataire",
  admin: "Administrateur",
};

interface SidebarProps {
  role: Role;
  userName?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const supabase = createClient();
  const pathname = usePathname(); // ✅ Remplace window.location.pathname
  const items = NAV[role];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#2B96A8"/>
            <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>VoyajAime</span>
        </div>
        <span className="badge badge-teal" style={{ fontSize: "11px" }}>{ROLE_LABEL[role]}</span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
          >
            <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px 8px 16px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ padding: "8px 12px", marginBottom: "6px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName || "Utilisateur"}
          </p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail || ""}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{ width: "100%", padding: "9px 12px", background: "none", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "13px", color: "#6B7280", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.2s" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#FEE2E2";
            (e.currentTarget as HTMLButtonElement).style.color = "#DC2626";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#FECACA";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB";
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </aside>
  );
}