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
  Wand2, Navigation, ChevronDown,
} from "lucide-react";

const Logo = () => (
  <img src="/logo.png" alt="VoyajAime"
    style={{ height: 42, width: "auto", objectFit: "contain", display: "block" }} />
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
  const [planOpen, setPlanOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsUserLoggedIn(!!session);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsUserLoggedIn(!!session);
      if (!session) { setMenuOpen(false); setMobileOpen(false); setPlanOpen(false); }
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
    setPlanOpen(false);
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

  const isPlanActive =
    pathname === ROUTES.touriste.ModeAssiste ||
    pathname === ROUTES.touriste.modeLibre ||
    pathname.startsWith("/touriste/modeAssister") ||
    pathname.startsWith("/touriste/modeLibre");

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
          display:flex;align-items:center;gap:7px;padding:10px 16px;
          font-size:17px;font-weight:700;color:#2B96A8;text-decoration:none;
          border-bottom:2px solid transparent;white-space:nowrap;
          transition:color 0.15s,border-color 0.15s,border-width 0.15s;
          
        }
        .glink:hover{color:#02AFCF)}
        .glink.on{color:#053366;border-bottom-color:#053366;font-weight:800}

        /* ── Planning dropdown trigger ── */
        .glink-plan{
          display:flex;align-items:center;gap:7px;padding:10px 16px;
          font-size:17px;font-weight:700;color:#2B96A8;
          border-bottom:2px solid transparent;white-space:nowrap;
          transition:color 0.15s,border-color 0.15s;
          cursor:pointer;background:none;border-top:none;border-left:none;border-right:none;
          font-family:'DM Sans',sans-serif;
        }
        .glink-plan:hover { color: var(--nav-accent); background: rgba(43, 150, 168, 0.06); }
        .glink-plan.on    { color: var(--nav-accent); border-bottom-color: var(--nav-accent); font-weight: 700; }
        .glink-plan .chevron { transition: transform 0.2s ease; opacity: 0.5; }
        .glink-plan.open .chevron { transform: rotate(180deg); opacity: 1; }
 
        /* ── Dropdown Planifier ── */
        .plan-drop {
          position: absolute; top: calc(100% + 8px); left: 50%;
          transform: translateX(-50%);
          background: #FFFFFF;
          border: 1px solid var(--nav-border);
          border-radius: 16px; padding: 8px;
          min-width: 340px;
          box-shadow: 0 12px 40px rgba(5, 51, 102, 0.12), 0 2px 8px rgba(5, 51, 102, 0.06);
          z-index: 400;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
 
        .plan-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 14px; border-radius: 10px;
          text-decoration: none; cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }
        .plan-card:hover        { background: rgba(43, 150, 168, 0.06); border-color: rgba(43, 150, 168, 0.15); }
        .plan-card.active-mode  { background: rgba(43, 150, 168, 0.08); border-color: rgba(43, 150, 168, 0.2); }
 
        .plan-icon {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .plan-icon.assiste { background: rgba(2, 175, 207, 0.10); border: 1px solid rgba(2, 175, 207, 0.25); }
        .plan-icon.libre   { background: rgba(43, 150, 168, 0.10); border: 1px solid rgba(43, 150, 168, 0.25); }
 
        .plan-title { font-size: 13px; font-weight: 700; color: var(--nav-primary); margin-bottom: 2px; font-family: 'DM Sans', sans-serif; }
        .plan-desc  { font-size: 11.5px; color: var(--nav-muted); font-weight: 500; line-height: 1.5; font-family: 'DM Sans', sans-serif; }
        .plan-badge {
          display: inline-flex; align-items: center; gap: 4px; margin-top: 5px;
          padding: 2px 8px; border-radius: 20px;
          font-size: 10px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        }
        .plan-badge.ai   { background: rgba(2, 175, 207, 0.10); color: #0891A8; border: 1px solid rgba(2, 175, 207, 0.25); }
        .plan-badge.free { background: rgba(43, 150, 168, 0.10); color: #1E7A8A; border: 1px solid rgba(43, 150, 168, 0.25); }
        .plan-divider { height: 1px; background: var(--nav-divider); margin: 4px 0; }
.g-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          border: 1.5px solid var(--nav-accent);
          background: transparent;
          font-size: 13px; font-weight: 700; color: var(--nav-accent);
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          white-space: nowrap; text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .g-btn:hover { background: rgba(43, 150, 168, 0.08); }
 
        /* ── Favori ── */
        .g-fav {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1.5px solid rgba(5, 51, 102, 0.05);
          color: var(--nav-muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative;
          text-decoration: none;
          transition: background 0.15s, border-color 0.15s;
        }
        .g-fav:hover { background: rgba(5, 51, 102, 0.05); border-color:rgba(5, 51, 102, 0.05) ; color: rgba(5, 51, 102, 0.05); }
        .nb {
          position: absolute; top: -3px; right: -3px;
          background: #DC2626; color: white;
          border-radius: 50%; width: 14px; height: 14px;
          font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid white;
        }
 
        /* ── Séparateur ── */
        .g-sep { width: 1px; height: 20px; background: var(--nav-divider); flex-shrink: 0; }
 
        /* ── Avatar ── */
        .av {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, var(--nav-accent2), var(--nav-primary));
          color: white; border: 2px solid var(--nav-border);
          cursor: pointer; font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.15s, box-shadow 0.15s;
          flex-shrink: 0; overflow: hidden; padding: 0;
        }
        .av:hover { border-color: var(--nav-accent); box-shadow: 0 0 0 3px rgba(43, 150, 168, 0.15); }
        .av img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
 
        /* ── Dropdown avatar ── */
        .drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: #FFFFFF;
          border: 1px solid var(--nav-border);
          border-radius: 14px; padding: 6px; min-width: 220px;
          box-shadow: 0 12px 36px rgba(5, 51, 102, 0.12);
          z-index: 400;
          animation: dropInRight 0.18s ease;
        }
        @keyframes dropInRight {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ddi {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px; border-radius: 8px;
          text-decoration: none; font-size: 13px; font-weight: 600;
          color: var(--nav-primary); cursor: pointer;
          border: none; background: none;
          font-family: 'DM Sans', sans-serif; width: 100%; text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .ddi:hover      { background: rgba(5, 51, 102, 0.05); color: var(--nav-accent); }
        .ddi.red        { color: #DC2626; }
        .ddi.red:hover  { background: #FEF2F2; color: #B91C1C; }
 
        /* ── Burger ── */
        .g-burger {
          display: none;
          background: rgba(5, 51, 102, 0.06);
          border: 1px solid var(--nav-border);
          cursor: pointer; padding: 8px; border-radius: 8px;
          color: var(--nav-primary);
          align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .g-burger:hover { background: rgba(5, 51, 102, 0.10); }
 
        /* ── Drawer mobile ── */
        .g-drawer {
          position: fixed; top: 72px; left: 0; right: 0;
          background: #FFFFFF;
          border-bottom: 1px solid var(--nav-border);
          box-shadow: 0 8px 24px rgba(5, 51, 102, 0.10);
          z-index: 199;
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 12px 14px;
        }
        .g-drawer.closed { display: none; }
 
        .g-mlink {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 8px;
          font-size: 15px; font-weight: 600;
          color: var(--nav-primary); text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .g-mlink:hover, .g-mlink.on {
          background: rgba(43, 150, 168, 0.08);
          color: var(--nav-accent); font-weight: 700;
        }
 
        .g-plan-section {
          border-top: 1px solid var(--nav-divider);
          margin-top: 4px; padding-top: 8px;
        }
        .g-plan-label {
          font-size: 10px; font-weight: 700; color: var(--nav-muted);
          text-transform: uppercase; letter-spacing: 1px;
          padding: 2px 14px 8px; font-family: 'DM Sans', sans-serif;
        }
 
        /* ── Responsive ── */
        @media (max-width: 1000px) {
          .g-center  { display: none !important; }
          .g-burger  { display: flex !important; }
        }
        @media (max-width: 640px) {
          .gnav-header { padding: 0 16px !important; }
        }
      `}</style>

      <header className="gnav gnav-header" style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
        height: 76,
        background: scrolled ? "rgba(250, 250, 252, 0.99)" : "rgba(0,.0,0,0,0)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: scrolled ? "1px solid rgba(47, 46, 46, 0.08)" : "1px solid transparent",
        boxShadow: scrolled ? "0 6px 30px rgba(0,0,0,0.25)" : "none",
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
        <nav className="g-center" style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center" }}>
          {isUserLoggedIn ? (
            <>
              {touristeLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className={`glink ${isActive(l.href) ? "on" : ""}`}>
                  {l.icon} {l.label}
                </Link>
              ))}
 
              {/* Dropdown Planifier */}
              <div style={{ position: "relative" }}>
                <button
                  className={`glink-plan ${isPlanActive ? "on" : ""} ${planOpen ? "open" : ""}`}
                  onClick={() => setPlanOpen(o => !o)}
                >
                  <Map size={15} />
                  Planifier
                  <ChevronDown size={13} className="chevron" />
                </button>
 
                {planOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 399 }}
                      onClick={() => setPlanOpen(false)} />
                    <div className="plan-drop">
                      <Link
                        href={ROUTES.touriste.ModeAssiste}
                        className={`plan-card ${pathname === ROUTES.touriste.ModeAssiste || pathname.startsWith("/touriste/modeAssister") ? "active-mode" : ""}`}
                        onClick={() => setPlanOpen(false)}
                      >
                        <div className="plan-icon assiste">
                          <Wand2 size={17} color="#02AFCF" />
                        </div>
                        <div>
                          <p className="plan-title">Mode Assisté</p>
                          <p className="plan-desc">Laissez notre IA concevoir votre itinéraire idéal selon vos préférences.</p>
                          <span className="plan-badge ai"><Wand2 size={8} /> Propulsé par l'IA</span>
                        </div>
                      </Link>
 
                      <div className="plan-divider" />
 
                      <Link
                        href={ROUTES.touriste.modeLibre}
                        className={`plan-card ${pathname === ROUTES.touriste.modeLibre || pathname.startsWith("/touriste/modeLibre") ? "active-mode" : ""}`}
                        onClick={() => setPlanOpen(false)}
                      >
                        <div className="plan-icon libre">
                          <Navigation size={17} color="#2B96A8" />
                        </div>
                        <div>
                          <p className="plan-title">Mode Libre</p>
                          <p className="plan-desc">Construisez votre voyage étape par étape, selon vos propres choix.</p>
                          <span className="plan-badge free"><Navigation size={8} /> Personnalisé</span>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            publicLinks.map(l =>
              l.anchor
                ? <a key={l.href} href={l.href} className="glink">{l.icon} {l.label}</a>
                : <Link key={l.href} href={l.href}
                    className={`glink ${isActive(l.href) ? "on" : ""}`}>
                    {l.icon} {l.label}
                  </Link>
            )
          )}
        </nav>
 
        {/* Actions droite */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button className="g-burger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
 
          {isUserLoggedIn ? (
            <>
              <Link href={ROUTES.touriste.favoris} className="g-fav">
                <Heart size={16} />
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
                      {/* En-tête profil */}
                      <div style={{
                        padding: "10px 12px 12px",
                        borderBottom: "1px solid rgba(5, 51, 102, 0.08)",
                        marginBottom: 4,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "linear-gradient(135deg,#02AFCF,#053366)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 800, color: "white",
                            flexShrink: 0, overflow: "hidden",
                          }}>
                            {avatarUrl
                              ? <img src={avatarUrl} alt={initial} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : initial}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#053366" }}>
                              {userName || "Touriste"}
                            </p>
                            <span style={{
                              fontSize: 11, color: "#2B96A8", fontWeight: 600,
                              display: "flex", alignItems: "center", gap: 4,
                            }}>
                              <Plane size={10} /> Compte touriste
                            </span>
                          </div>
                        </div>
                      </div>
 
                      <Link href={ROUTES.touriste.profil} className="ddi" onClick={() => setMenuOpen(false)}>
                        <User size={15} /> Mon profil
                      </Link>
                      <Link href={ROUTES.touriste.messages} className="ddi" onClick={() => setMenuOpen(false)}>
                        <MessageCircle size={15} /> Messages
                      </Link>
                      {ROUTES.touriste.historique && (
                        <Link href={ROUTES.touriste.historique} className="ddi" onClick={() => setMenuOpen(false)}>
                          <MessageCircle size={15} /> Historique
                        </Link>
                      )}
 
                      <div style={{ borderTop: "1px solid rgba(5, 51, 102, 0.08)", marginTop: 4, paddingTop: 4 }}>
                        <button className="ddi red" onClick={handleSignOut}>
                          <LogOut size={15} /> Se déconnecter
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href={ROUTES.touriste.favoris} className="g-fav">
                <Heart size={16} />
              </Link>
              <div className="g-sep" />
              <Link href={ROUTES.auth} className="g-btn">
                <User size={15} /> Connexion
              </Link>
            </>
          )}
        </div>
      </header>
 
      {/* ── Drawer mobile ── */}
      <div className={`g-drawer ${mobileOpen ? "" : "closed"}`}>
        {isUserLoggedIn ? (
          <>
            {touristeLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}>
                {l.icon} {l.label}
              </Link>
            ))}
 
            <div className="g-plan-section">
              <p className="g-plan-label">Planifier mon voyage</p>
              <Link
                href={ROUTES.touriste.ModeAssiste}
                className={`g-mlink ${pathname.startsWith("/touriste/modeAssister") ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Wand2 size={15} /> Mode Assisté
              </Link>
              <Link
                href={ROUTES.touriste.modeLibre}
                className={`g-mlink ${pathname.startsWith("/touriste/modeLibre") ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Navigation size={15} /> Mode Libre
              </Link>
            </div>
 
            <div style={{ borderTop: "1px solid rgba(5, 51, 102, 0.08)", marginTop: 6, paddingTop: 6 }}>
              <button
                className="ddi red"
                style={{ width: "100%", borderRadius: 8, fontSize: 14 }}
                onClick={handleSignOut}
              >
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          </>
        ) : (
          <>
            {publicLinks.map(l => (
              l.anchor ? (
                <a key={l.href} href={l.href} className="g-mlink" onClick={() => setMobileOpen(false)}>
                  {l.icon} {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href}
                  className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
                  onClick={() => setMobileOpen(false)}>
                  {l.icon} {l.label}
                </Link>
              )
            ))}
            <div style={{ borderTop: "1px solid rgba(5, 51, 102, 0.08)", marginTop: 6, paddingTop: 6 }}>
              <Link href={ROUTES.auth} onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 14px",
                  background: "linear-gradient(135deg, #2B96A8, #053366)",
                  color: "white", borderRadius: 8,
                  textDecoration: "none", fontSize: 14, fontWeight: 700,
                }}>
                <LogIn size={15} /> Se connecter
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}