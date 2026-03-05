"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Heart,
  MessageCircle,
  Mountain,
  Wallet,
  Star,
  UserCircle,
  Users,
  Shield,
  FolderOpen,
  LogOut,
  MapPin,
} from "lucide-react";

type Role = "touriste" | "prestataire" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV: Record<Role, NavItem[]> = {
  touriste: [
    { label: "Accueil",          href: "/touriste/dashboard",    icon: <LayoutDashboard size={18} /> },
    { label: "Mon itinéraire",   href: "/touriste/itineraire",   icon: <Map size={18} /> },
    { label: "Mes réservations", href: "/touriste/reservations", icon: <CalendarDays size={18} /> },
    { label: "Mes favoris",      href: "/touriste/favoris",      icon: <Heart size={18} /> },
    { label: "Messages",         href: "/touriste/messages",     icon: <MessageCircle size={18} /> },
  ],
  prestataire: [
    { label: "Dashboard",      href: "/prestataire/dashboard",   icon: <LayoutDashboard size={18} /> },
    { label: "Mes excursions", href: "/prestataire/excursions",  icon: <Mountain size={18} /> },
    { label: "Réservations",   href: "/prestataire/reservations",icon: <CalendarDays size={18} /> },
    { label: "Paiements",      href: "/prestataire/paiements",   icon: <Wallet size={18} /> },
    { label: "Avis clients",   href: "/prestataire/avis",        icon: <Star size={18} /> },
    { label: "Messages",       href: "/prestataire/messages",    icon: <MessageCircle size={18} /> },
    { label: "Mon profil",     href: "/prestataire/profil",      icon: <UserCircle size={18} /> },
  ],
  admin: [
    { label: "Dashboard",        href: "/admin/dashboard",    icon: <LayoutDashboard size={18} /> },
    { label: "Prestataires",     href: "/admin/prestataires", icon: <Users size={18} /> },
    { label: "Excursions",       href: "/admin/excursions",   icon: <Mountain size={18} /> },
    { label: "Réservations",     href: "/admin/reservations", icon: <CalendarDays size={18} /> },
    { label: "Paiements",        href: "/admin/paiements",    icon: <Wallet size={18} /> },
    { label: "Avis & Modération",href: "/admin/avis",         icon: <Shield size={18} /> },
    { label: "Catalogue & Villes",href: "/admin/catalogue",   icon: <FolderOpen size={18} /> },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  touriste:     "Touriste",
  prestataire:  "Prestataire",
  admin:        "Administrateur",
};

interface SidebarProps {
  role: Role;
  userName?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const supabase = createClient();
  const pathname = usePathname();
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
            <span style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              color: pathname === item.href ? "#2B96A8" : "#9CA3AF",
              flexShrink: 0,
            }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px 8px 16px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ padding: "8px 12px", marginBottom: "6px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#4AABB8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserCircle size={18} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName || "Utilisateur"}
            </p>
            <p style={{ fontSize: "12px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{ width: "100%", padding: "9px 12px", background: "none", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "13px", color: "#6B7280", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8 }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "#FEF2F2";
            b.style.color = "#DC2626";
            b.style.borderColor = "#FECACA";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "none";
            b.style.color = "#6B7280";
            b.style.borderColor = "#E5E7EB";
          }}
        >
          <LogOut size={15} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}