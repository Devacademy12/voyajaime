"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import {
  LayoutDashboard, Map, CalendarDays, Heart, MessageCircle,
  Mountain, Wallet, Star, UserCircle, Users, Shield,
  FolderOpen, LogOut, Menu, X, History,
} from "lucide-react";

type Role = "touriste" | "prestataire" | "admin";
interface NavItem { label: string; href: string; icon: React.ReactNode; }

const NAV: Record<Role, NavItem[]> = {
  touriste: [
    { label: "Accueil",          href: ROUTES.touriste.dashboard,    icon: <LayoutDashboard size={18} /> },
    { label: "Mon itinéraire",   href: ROUTES.touriste.itineraires,   icon: <Map size={18} /> },  // ✅ Corrigé : itineraires
    { label: "Mes réservations", href: ROUTES.touriste.reservations, icon: <CalendarDays size={18} /> },
    { label: "Mes favoris",      href: ROUTES.touriste.favoris,      icon: <Heart size={18} /> },
    { label: "Messages",         href: ROUTES.touriste.messages,     icon: <MessageCircle size={18} /> },
    { label: "Historique",       href: ROUTES.touriste.historique,   icon: <History size={18} /> },
  ],
  prestataire: [
    { label: "Dashboard",      href: ROUTES.prestataire.dashboard,    icon: <LayoutDashboard size={18} /> },
    { label: "Mes excursions", href: ROUTES.prestataire.excursions,   icon: <Mountain size={18} /> },
    { label: "Réservations et paiements",   href: ROUTES.prestataire.reservations, icon: <CalendarDays size={18} /> },
    { label: "Avis clients",   href: ROUTES.prestataire.avis,         icon: <Star size={18} /> },
    { label: "Messages",       href: ROUTES.prestataire.messages,     icon: <MessageCircle size={18} /> },
    { label: "Mon profil",     href: ROUTES.prestataire.profil,       icon: <UserCircle size={18} /> },
  ],
  admin: [
    { label: "Dashboard",          href: ROUTES.admin.dashboard,     icon: <LayoutDashboard size={18} /> },
    { label: "Prestataires",       href: ROUTES.admin.prestataires,  icon: <Users size={18} /> },
    { label: "Excursions",         href: ROUTES.admin.excursions,    icon: <Mountain size={18} /> },
    { label: "Réservations et paiements",       href: ROUTES.admin.reservations,  icon: <CalendarDays size={18} /> },
    { label: "Avis & Modération",  href: ROUTES.admin.avis,          icon: <Shield size={18} /> },
    { label: "Conversations",      href: ROUTES.admin.conversations, icon: <MessageCircle size={18} /> },
    { label: "Catalogue & Villes", href: ROUTES.admin.catalogue,     icon: <FolderOpen size={18} /> },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  touriste:    "Touriste",
  prestataire: "Prestataire",
  admin:       "Administrateur",
};

interface SidebarProps {
  role: Role;
  userName?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const supabase   = createClient();
  const pathname   = usePathname();
  const router     = useRouter();
  const items      = NAV[role];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(ROUTES.auth);
  };

  const initial = (userName || "U").charAt(0).toUpperCase();

  function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        {/* ── Logo ── */}
        <div style={{ padding: "18px 16px 0" }}>
          <Link href={ROUTES.home} style={{ display: "flex", alignItems: "center", textDecoration: "none", marginBottom: 16 }}>
            <img
              src="/logo.png"
              alt="VoyajAime"
              style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }}
            />
          </Link>

          {/* ── Profil utilisateur ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
              background: "linear-gradient(135deg,#2B96A8,#1e7a8a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 2px 8px rgba(43,150,168,.3)",
              border: "2px solid rgba(43,150,168,.2)",
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={userName || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                : <span style={{ fontSize: 20, fontWeight: 800, color: "white" }}>{initial}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName || "Utilisateur"}
              </p>
              <span style={{ display: "inline-flex", alignItems: "center", marginTop: 3, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(43,150,168,.1)", color: "#2B96A8" }}>
                {ROLE_LABEL[role]}
              </span>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={onLinkClick}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10,
                  fontSize: 14, fontWeight: 500,
                  color: active ? "#2B96A8" : "#6B7280",
                  background: active ? "rgba(43,150,168,.1)" : "transparent",
                  textDecoration: "none",
                  marginBottom: 2,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(43,150,168,.06)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = active ? "rgba(43,150,168,.1)" : "transparent"; }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, flexShrink: 0, color: active ? "#2B96A8" : "#9CA3AF" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div style={{ padding: "10px 8px 16px", borderTop: "1px solid #F3F4F6" }}>
          <button
            onClick={handleSignOut}
            style={{ width: "100%", padding: "9px 12px", background: "none", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, color: "#6B7280", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = "#FEF2F2"; b.style.color = "#DC2626"; b.style.borderColor = "#FECACA"; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = "none"; b.style.color = "#6B7280"; b.style.borderColor = "#E5E7EB"; }}
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>

      </div>
    );
  }

  const asideBase: React.CSSProperties = {
    position: "fixed", top: 0, left: 0,
    height: "100vh", width: 240,
    background: "white", borderRight: "1px solid #E5E7EB",
    display: "flex", flexDirection: "column",
    zIndex: 50,
  };

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ position: "fixed", top: 14, left: 14, zIndex: 60, width: 40, height: 40, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} color="#374151" />
        </button>

        {drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 49 }} />
        )}

        <aside style={{ ...asideBase, transform: drawerOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s ease", boxShadow: drawerOpen ? "0 0 40px rgba(0,0,0,.15)" : "none", zIndex: 55 }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, border: "none", background: "#F3F4F6", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={15} color="#374151" />
          </button>
          <SidebarContent onLinkClick={() => setDrawerOpen(false)} />
        </aside>
      </>
    );
  }

  return (
    <aside style={asideBase}>
      <SidebarContent />
    </aside>
  );
}