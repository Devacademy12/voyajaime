"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
<<<<<<< HEAD
=======
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Heart,
  MessageCircle,
  Mountain,
  UserCircle,
  LogOut,
  MapPin,
  Plane,
} from "lucide-react";
>>>>>>> 5e804c02d612727b600645cc5b07477675ca426d

export default function TouristeNav({ userName, favCount = 0 }: { userName?: string; favCount?: number }) {
  const [unreadMsg, setUnreadMsg] = useState(0);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: convs } = await supabase
        .from("conversations")
        .select("messages(lu, expediteur_id)")
        .eq("touriste_id", user.id);
      if (convs) {
        const total = (convs as Record<string, unknown>[]).reduce((s, c) => {
          const msgs = (c.messages as { lu: boolean; expediteur_id: string }[]) || [];
          return s + msgs.filter(m => !m.lu && m.expediteur_id !== user.id).length;
        }, 0);
        setUnreadMsg(total);
      }
    });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const links = [
<<<<<<< HEAD
    { href: "/excursions",            icon: "🏔️", label: "Excursions",  badge: 0 },
    { href: "/touriste/messages",     icon: "msg", label: "Messages",    badge: unreadMsg },
    { href: "/touriste/itineraires",  icon: "🗺️", label: "Itinéraires", badge: 0 },
    { href: "/touriste/favoris",      icon: "❤️",  label: favCount > 0 ? `Favoris (${favCount})` : "Favoris", badge: 0 },
    { href: "/touriste/reservations", icon: "📅",  label: "Réservations", badge: 0 },
=======
    { label: "Accueil",          href: "/touriste/dashboard",    icon: <LayoutDashboard size={16} /> },
    { label: "Excursions",       href: "/excursions",            icon: <Mountain size={16} /> },
    { label: "Mon itinéraire",   href: "/touriste/itineraire",   icon: <Map size={16} /> },
    { label: "Mes réservations", href: "/touriste/reservations", icon: <CalendarDays size={16} /> },
    { label: "Mes favoris",      href: "/touriste/favoris",      icon: <Heart size={16} /> },
    { label: "Messages",         href: "/touriste/messages",     icon: <MessageCircle size={16} />, badge: unreadMsg },
>>>>>>> 5e804c02d612727b600645cc5b07477675ca426d
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        .tnav *{box-sizing:border-box;margin:0;padding:0}
        .tnav{font-family:'DM Sans',sans-serif}
        .tlink{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:10px;text-decoration:none;font-size:13.5px;font-weight:500;transition:all 0.18s;white-space:nowrap}
        .tlink:hover{background:rgba(43,150,168,0.09);color:#2B96A8!important}
        .tlink.on{background:rgba(43,150,168,0.11);color:#2B96A8!important;font-weight:700}
        .av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2B96A8,#1e7a8a);color:white;border:none;cursor:pointer;font-size:14px;font-weight:800;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;transition:transform 0.15s;flex-shrink:0}
        .av:hover{transform:scale(1.08)}
        .drop{position:absolute;top:calc(100% + 10px);right:0;background:white;border:1px solid #E5E7EB;border-radius:16px;padding:6px;min-width:220px;box-shadow:0 12px 40px rgba(0,0,0,0.12);z-index:400;animation:dropIn 0.18s ease}
        @keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .ddi{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:500;color:#374151;cursor:pointer;border:none;background:none;font-family:'DM Sans',sans-serif;width:100%;text-align:left;transition:background 0.15s}
        .ddi:hover{background:#F9FAFB}
        .ddi.red{color:#DC2626}.ddi.red:hover{background:#FEF2F2}
      `}</style>

      <header className="tnav" style={{
        position: "sticky", top: 0, zIndex: 200,
        height: 64,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid #F3F4F6",
        boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow 0.25s",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        gap: 24,
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#2B96A8"/>
            <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
          </svg>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 900, color: "#111", letterSpacing: "-0.3px" }}>voyajaime</span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`tlink ${isActive(l.href) ? "on" : ""}`}
              style={{ color: isActive(l.href) ? "#2B96A8" : "#374151", position: "relative" }}
            >
              {l.icon}
              {l.label}
              {(l.badge ?? 0) > 0 && (
                <span style={{ position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, background: "#EF4444", color: "white", borderRadius: 8, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", border: "1.5px solid white" }}>
                  {(l.badge ?? 0) > 9 ? "9+" : l.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Avatar + dropdown */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button className="av" onClick={() => setMenuOpen(!menuOpen)}>
            {userName ? userName.charAt(0).toUpperCase() : "T"}
          </button>

          {menuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 399 }} onClick={() => setMenuOpen(false)} />
              <div className="drop">

                {/* User info */}
                <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid #F3F4F6", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>
                      {userName ? userName.charAt(0).toUpperCase() : "T"}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{userName || "Touriste"}</p>
                      <span style={{ fontSize: 11, color: "#2B96A8", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <Plane size={11} /> Compte touriste
                      </span>
                    </div>
                  </div>
                </div>

<<<<<<< HEAD
                <Link href="/touriste/profil" className="ddi" onClick={() => setMenuOpen(false)}>👤 Mon profil</Link>
                <Link href="/touriste/favoris" className="ddi" onClick={() => setMenuOpen(false)}>❤️ Mes favoris {favCount > 0 && <span style={{ marginLeft: "auto", background: "#FEF2F2", color: "#DC2626", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{favCount}</span>}</Link>
                <Link href="/touriste/reservations" className="ddi" onClick={() => setMenuOpen(false)}>📅 Mes réservations</Link>
                <Link href="/touriste/itineraires" className="ddi" onClick={() => setMenuOpen(false)}>🗺️ Mes itinéraires</Link>
                <Link href="/touriste/messages" className="ddi" onClick={() => setMenuOpen(false)}>
                  💬 Mes messages
                  {unreadMsg > 0 && <span style={{ marginLeft: "auto", background: "#FEF2F2", color: "#EF4444", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{unreadMsg}</span>}
=======
                <Link href="/touriste/profil" className="ddi" onClick={() => setMenuOpen(false)}>
                  <UserCircle size={15} style={{ flexShrink: 0 }} /> Mon profil
                </Link>

                <Link href="/touriste/favoris" className="ddi" onClick={() => setMenuOpen(false)}>
                  <Heart size={15} style={{ flexShrink: 0 }} /> Mes favoris
                  {favCount > 0 && (
                    <span style={{ marginLeft: "auto", background: "#FEF2F2", color: "#DC2626", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                      {favCount}
                    </span>
                  )}
                </Link>

                <Link href="/touriste/reservations" className="ddi" onClick={() => setMenuOpen(false)}>
                  <CalendarDays size={15} style={{ flexShrink: 0 }} /> Mes réservations
                </Link>

                <Link href="/touriste/itineraire" className="ddi" onClick={() => setMenuOpen(false)}>
                  <Map size={15} style={{ flexShrink: 0 }} /> Mon itinéraire
                </Link>

                <Link href="/touriste/messages" className="ddi" onClick={() => setMenuOpen(false)}>
                  <MessageCircle size={15} style={{ flexShrink: 0 }} /> Mes messages
                  {unreadMsg > 0 && (
                    <span style={{ marginLeft: "auto", background: "#FEF2F2", color: "#EF4444", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                      {unreadMsg}
                    </span>
                  )}
                </Link>

                <Link href="/excursions" className="ddi" onClick={() => setMenuOpen(false)}>
                  <Mountain size={15} style={{ flexShrink: 0 }} /> Toutes les excursions
>>>>>>> 5e804c02d612727b600645cc5b07477675ca426d
                </Link>

                <div style={{ borderTop: "1px solid #F3F4F6", marginTop: 4, paddingTop: 4 }}>
                  <button className="ddi red" onClick={handleSignOut}>
                    <LogOut size={15} style={{ flexShrink: 0 }} /> Se déconnecter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}