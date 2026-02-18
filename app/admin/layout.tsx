"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Users,
  MapPin,
  MessageSquare,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Tag,
  Building2,
  BarChart3,
} from "lucide-react";

// ─── Couleurs Voyajaime ───────────────────────────────────────────────────────
// Teal principal tiré du logo : #0BBEC9
// Fond sidebar sombre : #06202A

const navItems = [
  {
    label: "TABLEAU DE BORD",
    items: [
      {
        icon: LayoutDashboard,
        label: "Performances",
        href: "/admin",
      },
    ],
  },
  {
    label: "GESTION",
    items: [
      {
        icon: Users,
        label: "Prestataires",
        href: "/admin/prestataires",
        sub: [
          { label: "Voir profils", href: "/admin/prestataires" },
          { label: "En attente", href: "/admin/prestataires?filter=pending" },
        ],
      },
      {
        icon: MapPin,
        label: "Excursions",
        href: "/admin/excursions",
        sub: [
          { label: "Toutes", href: "/admin/excursions" },
          { label: "En attente", href: "/admin/excursions?filter=pending" },
        ],
      },
      {
        icon: MessageSquare,
        label: "Avis",
        href: "/admin/avis",
        sub: [
          { label: "Tous", href: "/admin/avis" },
          { label: "En attente", href: "/admin/avis?filter=pending" },
        ],
      },
    ],
  },
  {
    label: "CONFIGURATION",
    items: [
      {
        icon: Settings,
        label: "Application",
        href: "/admin/configuration",
        sub: [
          { label: "Catégories", href: "/admin/configuration?tab=categories" },
          { label: "Villes", href: "/admin/configuration?tab=villes" },
        ],
      },
    ],
  },
];

type NavItem = (typeof navItems)[0]["items"][0];

function SidebarItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.sub?.some((s) => pathname === s.href) ?? false);
  const [open, setOpen] = useState(!!isActive);
  const Icon = item.icon;

  return (
    <div>
      <button
        onClick={() => item.sub ? setOpen(!open) : undefined}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
        style={{
          background: isActive
            ? "linear-gradient(135deg, rgba(11,190,201,0.2), rgba(11,190,201,0.08))"
            : "transparent",
          color: isActive ? "#0BBEC9" : "rgba(255,255,255,0.6)",
          border: isActive ? "1px solid rgba(11,190,201,0.25)" : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
          }
        }}
      >
        {item.sub ? (
          <>
            <Icon size={17} style={{ flexShrink: 0 }} />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              size={13}
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                opacity: 0.5,
              }}
            />
          </>
        ) : (
          <Link href={item.href} className="flex items-center gap-3 w-full">
            <Icon size={17} style={{ flexShrink: 0 }} />
            <span className="flex-1 text-left">{item.label}</span>
          </Link>
        )}
      </button>

      {item.sub && open && (
        <div className="ml-4 mt-1 space-y-0.5 pl-4 border-l" style={{ borderColor: "rgba(11,190,201,0.2)" }}>
          {item.sub.map((s) => {
            const subActive = pathname + (typeof window !== "undefined" ? window.location.search : "") === s.href || pathname === s.href;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center gap-2 py-2 px-2 text-xs rounded-lg transition-all"
                style={{
                  color: subActive ? "#0BBEC9" : "rgba(255,255,255,0.45)",
                  fontWeight: subActive ? 600 : 400,
                }}
              >
                <ChevronRight size={11} />
                {s.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getInitials(user: User | null): string {
  if (!user) return "A";
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "";
  return name.split(/[\s@]+/).map((p: string) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

function getDisplayName(user: User | null): string {
  if (!user) return "Admin";
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin";
}

// ─── Logo Voyajaime SVG ───────────────────────────────────────────────────────
function VoyajaimeLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z"
        fill="#0BBEC9"
      />
      <path
        d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z"
        fill="white"
      />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.push("/auth");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = getInitials(user);
  const displayName = getDisplayName(user);

  return (
    <div className="flex h-screen" style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif", background: "#F0F7F8" }}>

      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: sidebarOpen ? "260px" : "0px",
          overflow: "hidden",
          background: "linear-gradient(180deg, #062830 0%, #041E25 100%)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <VoyajaimeLogo size={34} />
          <div>
            <span className="font-bold text-white text-base tracking-tight">Voyajaime</span>
            <p className="text-[10px]" style={{ color: "#0BBEC9", letterSpacing: "0.12em" }}>ADMIN</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navItems.map((section) => (
            <div key={section.label}>
              <p className="text-[9px] font-bold px-3 mb-2.5 tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid #0BBEC9" }} />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #0BBEC9, #089aA8)", color: "white" }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "rgba(255,100,100,0.8)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,80,80,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={16} />
            <span>{loggingOut ? "Déconnexion..." : "Déconnexion"}</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center px-5 gap-4 flex-shrink-0"
          style={{
            height: "64px",
            background: "white",
            borderBottom: "1px solid rgba(11,190,201,0.12)",
            boxShadow: "0 1px 12px rgba(11,190,201,0.06)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#0BBEC9" }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-xs"
            style={{ background: "#F0F7F8", border: "1px solid rgba(11,190,201,0.15)" }}
          >
            <Search size={14} style={{ color: "#0BBEC9" }} />
            <input
              placeholder="Rechercher..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: "#374151" }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="p-2 rounded-xl relative transition-colors"
              style={{ color: "#64748b" }}
            >
              <Bell size={18} />
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: "#0BBEC9" }}
              />
            </button>

            <div
              className="flex items-center gap-2.5 pl-3 ml-1"
              style={{ borderLeft: "1px solid rgba(11,190,201,0.15)" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full" style={{ border: "2px solid #0BBEC9" }} />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #0BBEC9, #089AA8)" }}
                >
                  {initials}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold" style={{ color: "#062830" }}>{displayName}</p>
                <p className="text-[10px]" style={{ color: "#0BBEC9" }}>Administrateur</p>
              </div>
              <ChevronDown size={13} style={{ color: "#94a3b8" }} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}