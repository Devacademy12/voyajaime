"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import {
  Mountain, Map, Heart, CalendarDays, User,
  LogOut, Plane, Menu, X, MessageCircle,
  Compass, LogIn, UserPlus, HelpCircle,
} from "lucide-react";

const Logo = () => (
  <img src="/logo.png" alt="VoyajAime"
    style={{ height: 35, width: "auto", objectFit: "contain", display: "block" }} />
);

export default function TouristeNav({
  userName,
  favCount = 0,
  isLoggedIn = false,
}: {
  userName?: string;
  favCount?: number;
  isLoggedIn?: boolean;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Vérifier l'état de connexion au chargement et quand les props changent
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsUserLoggedIn(!!session);
      
      // Si l'utilisateur est connecté mais que userName n'est pas fourni, essayer de le récupérer
      if (session && !userName) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    };
    
    checkAuth();
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsUserLoggedIn(!!session);
      if (!session) {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase, userName]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserLoggedIn) return;
    
    const fetchAvatar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    
    fetchAvatar();
  }, [supabase, isUserLoggedIn]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsUserLoggedIn(false);
    setMenuOpen(false);
    setMobileOpen(false);
    router.push(ROUTES.home);
  };

  const touristeLinks = [
    { href: ROUTES.excursions, icon: <Compass size={15} />, label: "Explorer" },
    { href: ROUTES.touriste.itineraires, icon: <Map size={15} />, label: "Mes itinéraires" },
    { href: ROUTES.touriste.reservations, icon: <CalendarDays size={15} />, label: "Réservations" },
  ];

  const publicLinks = [
    { href: ROUTES.excursions, icon: <Compass size={15} />, label: "Excursions", anchor: false },
    { href: "#chemins", icon: <Map size={15} />, label: "Comment ça marche", anchor: true },
  ];

  const isActive = (href: string) => {
    if (href === "#chemins") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };
  
  const initial = userName
    ? userName.charAt(0).toUpperCase()
    : isUserLoggedIn ? "T" : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .gnav *{box-sizing:border-box;margin:0;padding:0}
        .gnav{font-family:'DM Sans',sans-serif}

        .glink{
          display:flex;align-items:center;gap:6px;padding:8px 14px;
          font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);text-decoration:none;
          border-bottom:2px solid transparent;white-space:nowrap;
          transition:color 0.15s,border-color 0.15s;
        }
        .glink:hover{color:rgba(255,255,255,1)}
        .glink.on{color:#2B96A8;border-bottom-color:#2B96A8;font-weight:800}

        .g-btn{
          display:inline-flex;align-items:center;gap:6px;
          padding:7px 14px;border-radius:8px;
          border:0.5px solid rgba(186, 216, 252, 0.2);background:rgba(184, 219, 248, 0.08);
          font-size:13px;font-weight:600;color:rgba(255,255,255,0.85);
          cursor:pointer;font-family:'DM Sans',sans-serif;
          white-space:nowrap;text-decoration:none;transition:background 0.15s;
        }
        .g-btn:hover{background:hsla(210, 80%, 82%, 0.15)}
        .g-btn.prime{border:1.5px solid #2B96A8;color:#2B96A8;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:700}
        .g-btn.prime:hover{background:rgba(173, 232, 243, 0.12)}

        .g-fav{
          width:36px;height:36px;border-radius:50%;
          border:0.5px solid rgba(168, 209, 248, 0.2);background:rgba(165, 224, 244, 0.08);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;position:relative;transition:background 0.15s;
          text-decoration:none;
        }
        .g-fav:hover{background:rgba(255,255,255,0.15)}
        .nb{
          position:absolute;top:-3px;right:-3px;background:#DC2626;color:white;
          border-radius:50%;width:14px;height:14px;font-size:9px;font-weight:700;
          display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(0,0,0,0.4);
        }

        .g-sep{width:0.5px;height:20px;background:rgba(255,255,255,0.15);flex-shrink:0}

        .av{
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#02AFCF,#053366);
          color:white;border:2px solid rgba(2,175,207,0.4);cursor:pointer;
          font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;
          display:flex;align-items:center;justify-content:center;
          transition:transform 0.15s;flex-shrink:0;overflow:hidden;padding:0;
        }
        .av:hover{transform:scale(1.06)}
        .av img{width:100%;height:100%;object-fit:cover;border-radius:50%}

        .drop{
          position:absolute;top:calc(100% + 10px);right:0;background:white;
          border:1px solid #E8EFFE;border-radius:16px;padding:6px;min-width:220px;
          box-shadow:0 12px 36px rgba(0,0,0,0.25);z-index:400;
          animation:dropIn 0.18s ease;
        }
        @keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .ddi{
          display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;
          text-decoration:none;font-size:13px;font-weight:600;color:#053366;cursor:pointer;
          border:none;background:none;font-family:'DM Sans',sans-serif;width:100%;
          text-align:left;transition:background 0.15s;
        }
        .ddi:hover{background:#DCE5FF;color:#259FFC}
        .ddi.red{color:#DC2626}.ddi.red:hover{background:#FEF2F2;color:#DC2626}

        .g-burger{
          display:none;background:rgba(255,255,255,0.08);border:0.5px solid rgba(255,255,255,0.2);
          cursor:pointer;padding:8px;border-radius:8px;color:rgba(255,255,255,0.85);
          align-items:center;justify-content:center;
        }
        .g-burger:hover{background:rgba(255,255,255,0.15)}

        .g-drawer{
          position:fixed;top:64px;left:0;right:0;
          background:rgba(0,0,0,0.92);backdrop-filter:blur(20px);
          border-bottom:1px solid rgba(154, 200, 249, 0.08);z-index:199;
          box-shadow:0 8px 24px rgba(0,0,0,0.4);
          display:flex;flex-direction:column;gap:4px;padding:12px 16px 16px;
        }
        .g-drawer.closed{display:none}
        .g-mlink{
          display:flex;align-items:center;gap:8px;padding:11px 14px;border-radius:10px;
          font-size:15px;font-weight:600;color:rgba(255,255,255,0.85);text-decoration:none;
          transition:background 0.15s;
        }
        .g-mlink:hover,.g-mlink.on{background:rgba(138, 228, 244, 0.15);color:#2B96A8;font-weight:700}

        @media(max-width:1000px){
          .g-center{display:none!important}
          .g-burger{display:flex!important}
          .g-prime{display:none!important}
        }
        @media(max-width:640px){
          .gnav-header{padding:0 16px!important}
          .g-manage{display:none!important}
        }
      `}</style>

      <header className="gnav gnav-header" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: 64,
        background: scrolled
          ? "rgba(14, 89, 147, 0.85)"
          : "rgba(15, 116, 184, 0.25)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: scrolled
          ? "1px solid rgba(47, 46, 46, 0.08)"
          : "1px solid transparent",
        boxShadow: scrolled
          ? "0 6px 30px rgba(0,0,0,0.25)"
          : "none",
        transition: "all 0.35s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        gap: 16,
      }}>
        {/* Logo */}
        <Link href={ROUTES.home}
          style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
          <Logo />
        </Link>

        {/* Liens centre */}
        <nav className="g-center" style={{ display: "flex", alignItems: "center", flex: 1, justifyContent:"right" }}>
          {isUserLoggedIn
            ? touristeLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className={`glink ${isActive(l.href) ? "on" : ""}`}>
                  {l.icon} {l.label}
                </Link>
              ))
            : publicLinks.map(l =>
                l.anchor
                  ? <a key={l.href} href={l.href} className="glink">{l.icon} {l.label}</a>
                  : <Link key={l.href} href={l.href}
                      className={`glink ${isActive(l.href) ? "on" : ""}`}>
                      {l.icon} {l.label}
                    </Link>
              )
          }
        </nav>

        {/* Actions droite */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Hamburger mobile */}
          <button className="g-burger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {isUserLoggedIn ? (
            <>
              {/* Favoris */}
              <Link href={ROUTES.touriste.favoris} className="g-fav">
                <Heart size={16} color="#6B7280" />
                {favCount > 0 && <span className="nb">{favCount > 9 ? "9+" : favCount}</span>}
              </Link>

              <div className="g-sep" />

              {/* Avatar + dropdown */}
              <div style={{ position: "relative" }}>
                <button className="av" onClick={() => setMenuOpen(o => !o)}>
                  {avatarUrl ? <img src={avatarUrl} alt={initial} /> : initial}
                </button>
                {menuOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 399 }}
                      onClick={() => setMenuOpen(false)} />
                    <div className="drop">
                      <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid #E8EFFE", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#02AFCF,#053366)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white", flexShrink: 0, overflow: "hidden" }}>
                            {avatarUrl ? <img src={avatarUrl} alt={initial} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#053366" }}>{userName || "Touriste"}</p>
                            <span style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <Plane size={10} /> Compte touriste
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href={ROUTES.touriste.profil} className="ddi" onClick={() => setMenuOpen(false)}><User size={16} /> Mon profil</Link>
                      <Link href={ROUTES.touriste.favoris} className="ddi" onClick={() => setMenuOpen(false)}>
                        <Heart size={16} /> Mes favoris
                        {favCount > 0 && <span style={{ marginLeft: "auto", background: "#DCE5FF", color: "#259FFC", padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{favCount}</span>}
                      </Link>
                      <Link href={ROUTES.touriste.reservations} className="ddi" onClick={() => setMenuOpen(false)}><CalendarDays size={16} /> Mes réservations</Link>
                      <Link href={ROUTES.touriste.itineraire} className="ddi" onClick={() => setMenuOpen(false)}><Map size={16} /> Mon itinéraire</Link>
                      <Link href={ROUTES.touriste.messages} className="ddi" onClick={() => setMenuOpen(false)}><MessageCircle size={16} /> Messages</Link>
                      <div style={{ borderTop: "1px solid #E8EFFE", marginTop: 4, paddingTop: 4 }}>
                        <button className="ddi red" onClick={handleSignOut}><LogOut size={16} /> Se déconnecter</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Non connecté */}
              <button className="g-btn prime g-prime">
                <HelpCircle size={14} /> Qu'est-ce que Prime ?
              </button>

              <div className="g-sep" />

              <Link href={ROUTES.touriste.favoris} className="g-fav">
                <Heart size={18} color="#6B7280" />
              </Link>

              <div className="g-sep" />

              <Link href={ROUTES.auth} className="g-btn">
                <User size={18} /> Connexion
              </Link>

              
            </>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`g-drawer ${mobileOpen ? "" : "closed"}`}>
        {(isUserLoggedIn ? touristeLinks : publicLinks).map(l => (
          <Link key={l.href} href={l.href}
            className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
            onClick={() => setMobileOpen(false)}>
            {l.icon} {l.label}
          </Link>
        ))}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 4, paddingTop: 8 }}>
          {isUserLoggedIn
            ? <button className="ddi red" style={{ width: "100%", borderRadius: 10, color: "#DC2626", background: "transparent", fontWeight: 600 }} onClick={handleSignOut}>
                <LogOut size={14} /> Se déconnecter
              </button>
            : <Link href={ROUTES.auth} onClick={() => setMobileOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 14px", background: "#2B96A8", color: "white", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
                <LogIn size={14} /> Se connecter
              </Link>
          }
        </div>
      </div>
    </>
  );
}