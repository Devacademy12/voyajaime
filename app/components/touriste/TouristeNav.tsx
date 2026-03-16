"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  LayoutDashboard, Mountain, MessageCircle, Map,
  Heart, CalendarDays, User, LogOut, Plane, Menu, X,
} from "lucide-react";

export default function TouristeNav({ userName, favCount = 0 }: { userName?: string; favCount?: number }) {
  const [unreadMsg, setUnreadMsg] = useState(0);
  const pathname   = usePathname();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
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
    { href: "/touriste/dashboard",    icon: <LayoutDashboard size={16}/>, label: "Accueil" },
    { href: "/excursions",            icon: <Mountain size={16}/>,        label: "Excursions" },
    { href: "/touriste/itineraire",   icon: <Map size={16}/>,             label: "Mon itinéraire" },
    { href: "/touriste/reservations", icon: <CalendarDays size={16}/>,    label: "Réservations" },
    { href: "/touriste/favoris",      icon: <Heart size={16}/>,           label: favCount > 0 ? `Favoris (${favCount})` : "Favoris", isFavoris: true },
    { href: "/touriste/messages",     icon: <MessageCircle size={16}/>,   label: "Messages", badge: unreadMsg },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const initial  = userName ? userName.charAt(0).toUpperCase() : "T";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tnav *{box-sizing:border-box;margin:0;padding:0}
        .tnav{font-family:'DM Sans',sans-serif}
        .tlink{
          display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:20px;
          text-decoration:none;font-size:13px;font-weight:500;color:#053366;
          transition:all 0.18s;white-space:nowrap;border:1px solid transparent;position:relative;
        }
        .tlink:hover{background:#DCE5FF;color:#259FFC!important}
        .tlink.on{background:#DCE5FF;color:#02AFCF!important;font-weight:700;border-color:rgba(2,175,207,0.25)}
        .tlink.on-fav{background:#DCE5FF;color:#259FFC!important;font-weight:700;border-color:rgba(37,159,252,0.3)}
        .av{
          width:38px;height:38px;border-radius:50%;
          background:linear-gradient(135deg,#02AFCF,#053366);
          color:white;border:none;cursor:pointer;font-size:15px;font-weight:800;
          font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;
          transition:transform 0.15s,box-shadow 0.15s;flex-shrink:0;
          box-shadow:0 3px 10px rgba(2,175,207,0.35);
        }
        .av:hover{transform:scale(1.08);box-shadow:0 5px 16px rgba(2,175,207,0.5)}
        .drop{
          position:absolute;top:calc(100% + 10px);right:0;background:white;
          border:1px solid #E8EFFE;border-radius:18px;padding:6px;min-width:220px;
          box-shadow:0 14px 44px rgba(5,51,102,0.12);z-index:400;animation:dropIn 0.18s ease;
        }
        @keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .ddi{
          display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;
          text-decoration:none;font-size:13px;font-weight:500;color:#053366;cursor:pointer;
          border:none;background:none;font-family:'DM Sans',sans-serif;width:100%;text-align:left;transition:background 0.15s;
        }
        .ddi:hover{background:#DCE5FF;color:#259FFC}
        .ddi.red{color:#DC2626}.ddi.red:hover{background:#FEF2F2;color:#DC2626}

        /* ── Responsive ── */
        .tnav-links { display:flex; align-items:center; gap:2px; flex:1; justify-content:center; }
        .tnav-hamburger {
          display:none; background:none; border:1px solid #E8EFFE;
          cursor:pointer; padding:7px; border-radius:10px; color:#053366;
          align-items:center; justify-content:center;
        }
        .tnav-mobile {
          position:fixed; top:64px; left:0; right:0;
          background:white; border-bottom:1px solid #E8EFFE;
          padding:12px 16px 16px; z-index:199;
          box-shadow:0 8px 24px rgba(5,51,102,0.08);
          display:flex; flex-direction:column; gap:4px;
          max-height:calc(100vh - 64px); overflow-y:auto;
        }
        .tnav-mobile.closed { display:none; }
        .tnav-mobile .tlink { font-size:14px; padding:10px 14px; border-radius:12px; white-space:normal; }

        @media (max-width: 1024px) {
          .tnav-links     { display:none; }
          .tnav-hamburger { display:flex; }
        }
      `}</style>

      <header className="tnav" style={{
        position: "sticky", top: 0, zIndex: 200, height: 64,
        background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid #E8EFFE" : "1px solid #F0F4FF",
        boxShadow: scrolled ? "0 2px 16px rgba(5,51,102,0.07)" : "none",
        transition: "box-shadow 0.25s, border-color 0.25s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", gap: 16,
      }}>

        {/* Logo */}
        <Link href="/touriste/dashboard" style={{ display:"flex", alignItems:"center", textDecoration:"none", flexShrink:0 }}>
          <img
            src="/logo.png"
            alt="Voyaj'aime"
            style={{ height: 66, width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="tnav-links">
          {links.map(l => {
            const active = isActive(l.href);
            const cls    = active ? (l.isFavoris ? "tlink on-fav" : "tlink on") : "tlink";
            return (
              <Link key={l.href} href={l.href} className={cls}>
                {l.icon}
                {l.label}
                {(l.badge ?? 0) > 0 && (
                  <span style={{ position:"absolute", top:1, right:1, minWidth:16, height:16, background:"#EF4444", color:"white", borderRadius:8, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", border:"2px solid white" }}>
                    {(l.badge ?? 0) > 9 ? "9+" : l.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side : hamburger + avatar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>

          {/* Hamburger mobile */}
          <button className="tnav-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>

          {/* Avatar + dropdown */}
          <div style={{ position:"relative" }}>
            <button className="av" onClick={() => setMenuOpen(!menuOpen)}>{initial}</button>

            {menuOpen && (
              <>
                <div style={{ position:"fixed", inset:0, zIndex:399 }} onClick={() => setMenuOpen(false)} />
                <div className="drop">
                  <div style={{ padding:"10px 14px 12px", borderBottom:"1px solid #E8EFFE", marginBottom:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"white", flexShrink:0 }}>
                        {initial}
                      </div>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:"#053366" }}>{userName || "Touriste"}</p>
                        <span style={{ fontSize:11, color:"#02AFCF", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                          <Plane size={10}/> Compte touriste
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href="/touriste/profil"       className="ddi" onClick={() => setMenuOpen(false)}><User size={14}/> Mon profil</Link>
                  <Link href="/touriste/favoris"      className="ddi" onClick={() => setMenuOpen(false)}>
                    <Heart size={14}/> Mes favoris
                    {favCount > 0 && <span style={{ marginLeft:"auto", background:"#DCE5FF", color:"#259FFC", padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700 }}>{favCount}</span>}
                  </Link>
                  <Link href="/touriste/reservations" className="ddi" onClick={() => setMenuOpen(false)}><CalendarDays size={14}/> Mes réservations</Link>
                  <Link href="/touriste/itineraires"  className="ddi" onClick={() => setMenuOpen(false)}><Map size={14}/> Mes itinéraires</Link>
                  <Link href="/touriste/messages"     className="ddi" onClick={() => setMenuOpen(false)}>
                    <MessageCircle size={14}/> Messages
                    {unreadMsg > 0 && <span style={{ marginLeft:"auto", background:"#FEF2F2", color:"#EF4444", padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700 }}>{unreadMsg}</span>}
                  </Link>
                  <div style={{ borderTop:"1px solid #E8EFFE", marginTop:4, paddingTop:4 }}>
                    <button className="ddi red" onClick={handleSignOut}><LogOut size={14}/> Se déconnecter</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <div className={`tnav-mobile ${mobileOpen ? "" : "closed"}`}>
        {links.map(l => {
          const active = isActive(l.href);
          const cls    = active ? (l.isFavoris ? "tlink on-fav" : "tlink on") : "tlink";
          return (
            <Link key={l.href} href={l.href} className={cls}
              onClick={() => setMobileOpen(false)}
              style={{ position:"relative" }}>
              {l.icon}
              {l.label}
              {(l.badge ?? 0) > 0 && (
                <span style={{ marginLeft:"auto", background:"#EF4444", color:"white", padding:"1px 7px", borderRadius:10, fontSize:11, fontWeight:700 }}>
                  {(l.badge ?? 0) > 9 ? "9+" : l.badge}
                </span>
              )}
            </Link>
          );
        })}
        <div style={{ borderTop:"1px solid #E8EFFE", marginTop:4, paddingTop:8 }}>
          <button className="ddi red" style={{ width:"100%", borderRadius:12 }} onClick={handleSignOut}>
            <LogOut size={14}/> Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}