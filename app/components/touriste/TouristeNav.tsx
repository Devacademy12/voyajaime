"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import { Menu, X, ChevronDown, Wand2, Navigation, Compass } from "lucide-react";

const Logo = () => (
  <img
    src="/logo.png"
    alt="VoyajAime"
    className="gnav-logo-img"
    style={{ width: "auto", objectFit: "contain", display: "block" }}
  />
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
  const [avatarUrl,      setAvatarUrl]      = useState<string | null>(null);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [planOpen,       setPlanOpen]       = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn);

  const pathname = usePathname();
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsUserLoggedIn(!!session);
      if (session) {
        const { data: profile } = await supabase
          .from("profiles").select("full_name, avatar_url")
          .eq("user_id", session.user.id).single();
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsUserLoggedIn(!!session);
      if (!session) { setMenuOpen(false); setMobileOpen(false); setPlanOpen(false); }
    });
    return () => subscription.unsubscribe();
  }, [supabase, userName]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isUserLoggedIn) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles")
        .select("avatar_url").eq("user_id", user.id).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    })();
  }, [supabase, isUserLoggedIn]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsUserLoggedIn(false);
    setMenuOpen(false); setMobileOpen(false); setPlanOpen(false);
    router.push(ROUTES.home);
  };

  const touristeLinks = [
    { href: ROUTES.excursions,            label: "Explorer"        },
    { href: ROUTES.touriste.itineraires,  label: "Mes itinéraires" },
    { href: ROUTES.touriste.reservations, label: "Réservations"    },
    { href: ROUTES.about,                 label: "À propos"        },
    { href: ROUTES.blog,                  label: "Blog"            },
    { href: ROUTES.contact,               label: "Contact"         },
  ];

  const publicLinks = [
    { href: ROUTES.excursions, label: "Excursions",        anchor: false },
    { href: "#chemins",        label: "Comment ça marche", anchor: true  },
    { href: ROUTES.about,      label: "À propos",          anchor: false },
    { href: ROUTES.blog,       label: "Blog",              anchor: false },
    { href: ROUTES.contact,    label: "Contact",           anchor: false },
  ];

  const isActive = (href: string) =>
    href !== "#chemins" && (pathname === href || pathname.startsWith(href + "/"));

  const isPlanActive =
    pathname === ROUTES.touriste.ModeAssiste ||
    pathname === ROUTES.ModeAssiste ||
    pathname === ROUTES.touriste.modeLibre ||
    pathname === "/modeLibre" ||
    pathname.startsWith("/touriste/modeAssister") ||
    pathname.startsWith("/touriste/modeLibre") ||
    pathname.startsWith("/modeAssister") ||
    pathname.startsWith("/modeLibre");

  const initial = userName
    ? userName.charAt(0).toUpperCase()
    : isUserLoggedIn ? "T" : "";

  const isHeroPage = pathname === "/" || pathname === ROUTES.home;

  const onHero = isHeroPage && !scrolled;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

        .gnav * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Logo ── */
        .gnav-logo-img { height: 38px; transition: opacity 0.2s; display: block; }
        .gnav-logo-img:hover { opacity: 0.82; }

        /* ── Wrapper ── */
        .gnav-wrapper {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        /* scrolled: frosted glass card */
        .gnav-wrapper.scrolled {
          padding: 0 20px;
        }

        .gnav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 68px; padding: 0 28px;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        .gnav-wrapper.scrolled .gnav-inner {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px) saturate(1.6);
          -webkit-backdrop-filter: blur(20px) saturate(1.6);
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 2px rgba(15,23,42,0.04);
          height: 60px;
          margin-top: 10px;
          padding: 0 20px;
        }

        .gnav-wrapper:not(.scrolled) .gnav-inner {
          background: transparent;
          border: none;
          box-shadow: none;
        }

        /* ── Nav links ── */
        .glink {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 12px; border-radius: 9px;
          font-size: 13.5px; font-weight: 600; letter-spacing: -0.1px;
          text-decoration: none; white-space: nowrap;
          border: 1px solid transparent;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          font-family: 'DM Sans', sans-serif;
        }

        /* Hero transparent mode */
        .gnav-hero .glink {
          color: rgba(255,255,255,0.88);
        }
        .gnav-hero .glink:hover {
          color: white;
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.18);
        }
        .gnav-hero .glink.on {
          color: white;
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.22);
        }

        /* Scrolled / light mode */
        .gnav-light .glink {
          color: #334155;
        }
        .gnav-light .glink:hover {
          color: #2B96A8;
          background: rgba(43,150,168,0.07);
          border-color: rgba(43,150,168,0.12);
        }
        .gnav-light .glink.on {
          color: #2B96A8;
          font-weight: 700;
          background: rgba(43,150,168,0.08);
          border-color: rgba(43,150,168,0.14);
        }

        /* active dot indicator */
        .glink.on::after {
          content: '';
          display: block;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: currentColor;
          margin-left: 2px;
          flex-shrink: 0;
        }

        /* ── Planifier dropdown trigger ── */
        .g-plan-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 10px;
          font-size: 13.5px; font-weight: 700; letter-spacing: -0.1px;
          border: 1.5px solid; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          white-space: nowrap; background: none;
        }
        .gnav-hero .g-plan-btn {
          color: white; border-color: rgba(255,255,255,0.55);
        }
        .gnav-hero .g-plan-btn:hover {
          background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.8);
        }
        .gnav-hero .g-plan-btn.on {
          background: rgba(43,150,168,0.4); border-color: #2B96A8; color: white;
        }
        .gnav-light .g-plan-btn {
          color: #2B96A8; border-color: rgba(43,150,168,0.35);
        }
        .gnav-light .g-plan-btn:hover {
          background: rgba(43,150,168,0.06); border-color: #2B96A8;
        }
        .gnav-light .g-plan-btn.on {
          background: rgba(43,150,168,0.1); border-color: #2B96A8;
        }
        .g-plan-btn .chevron {
          transition: transform 0.2s; opacity: 0.75;
        }
        .g-plan-btn.open .chevron { transform: rotate(180deg); opacity: 1; }

        /* ── Dropdown ── */
        .g-plan-drop {
          position: absolute; top: calc(100% + 10px); left: 0;
          background: white;
          border: 1px solid rgba(15,23,42,0.07);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06);
          padding: 8px;
          min-width: 240px;
          z-index: 100;
          animation: dropIn 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .drop-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 9px;
          text-decoration: none; color: #1E293B;
          font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .drop-item:hover { background: #F1F5F9; }
        .drop-item .drop-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .drop-item .drop-sub {
          font-size: 11.5px; font-weight: 400; color: #64748B; display: block; margin-top: 1px;
        }

        /* ── User avatar dropdown ── */
        .drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: white;
          border: 1px solid rgba(15,23,42,0.07);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06);
          min-width: 220px; padding: 8px; z-index: 100;
          animation: dropIn 0.2s cubic-bezier(0.16,1,0.3,1);
          font-family: 'DM Sans', sans-serif;
        }
        .drop-header {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px 14px;
          border-bottom: 1px solid #F1F5F9; margin-bottom: 6px;
        }
        .drop-av {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #2B96A8, #053366);
          color: white; font-size: 15px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
        }
        .drop-av img { width: 100%; height: 100%; object-fit: cover; }
        .drop-name { font-size: 14px; font-weight: 700; color: #0F172A; }
        .drop-role {
          font-size: 11.5px; color: #64748B; display: flex;
          align-items: center; gap: 5px; margin-top: 2px;
        }
        .ddi {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 14px; border-radius: 9px;
          font-size: 13.5px; font-weight: 500; color: #1E293B;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s; cursor: pointer;
          background: none; border: none; width: 100%; text-align: left;
        }
        .ddi:hover { background: #F1F5F9; }
        .ddi.red { color: #EF4444; }
        .ddi.red:hover { background: #FEF2F2; }
        .drop-divider { height: 1px; background: #F1F5F9; margin: 6px 0; }

        /* ── Right controls ── */
        .g-fav {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          text-decoration: none; position: relative;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .gnav-hero .g-fav { color: rgba(255,255,255,0.85); }
        .gnav-hero .g-fav:hover { background: rgba(255,255,255,0.12); color: white; border-color: rgba(255,255,255,0.2); }
        .gnav-light .g-fav { color: #475569; }
        .gnav-light .g-fav:hover { background: rgba(43,150,168,0.07); color: #2B96A8; border-color: rgba(43,150,168,0.12); }
        .g-fav .nb {
          position: absolute; top: -4px; right: -4px;
          background: #EF4444; color: white;
          font-size: 9px; font-weight: 800;
          width: 17px; height: 17px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
        }

        .g-sep {
          width: 1px; height: 20px; margin: 0 4px;
          flex-shrink: 0;
        }
        .gnav-hero .g-sep { background: rgba(255,255,255,0.25); }
        .gnav-light .g-sep { background: #E2E8F0; }

        .av {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #2B96A8, #053366);
          color: white; font-size: 14px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; cursor: pointer;
          border: 2px solid rgba(43,150,168,0.3);
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .av img { width: 100%; height: 100%; object-fit: cover; }
        .av:hover { transform: scale(1.06); box-shadow: 0 4px 16px rgba(43,150,168,0.35); }

        /* ── Auth button ── */
        .g-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 10px;
          font-size: 13.5px; font-weight: 700; letter-spacing: 0.1px;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; border: 1.5px solid;
          white-space: nowrap;
        }
        .gnav-hero .g-btn {
          color: white; border-color: rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
        }
        .gnav-hero .g-btn:hover {
          background: white; color: #053366; border-color: white;
        }
        .gnav-light .g-btn {
          color: white; background: #2B96A8; border-color: #2B96A8;
          box-shadow: 0 4px 16px rgba(43,150,168,0.25);
        }
        .gnav-light .g-btn:hover {
          background: #227f90; border-color: #227f90;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(43,150,168,0.35);
        }

        /* ── Burger ── */
        .g-burger {
          display: none; width: 38px; height: 38px;
          align-items: center; justify-content: center;
          border-radius: 10px; border: 1.5px solid; cursor: pointer;
          background: none; transition: all 0.2s;
        }
        .gnav-hero .g-burger { color: white; border-color: rgba(255,255,255,0.4); }
        .gnav-hero .g-burger:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.7); }
        .gnav-light .g-burger { color: #334155; border-color: #E2E8F0; }
        .gnav-light .g-burger:hover { border-color: #2B96A8; color: #2B96A8; background: rgba(43,150,168,0.05); }

        /* ── Mobile drawer ── */
        .g-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 90vw);
          background: white;
          box-shadow: -8px 0 48px rgba(15,23,42,0.15);
          z-index: 1001; padding: 0;
          display: flex; flex-direction: column;
          transform: translateX(0);
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          overflow-y: auto;
          font-family: 'DM Sans', sans-serif;
        }
        .g-drawer.closed { transform: translateX(100%); }
        .g-drawer-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid #F1F5F9; flex-shrink: 0;
        }
        .g-drawer-body { padding: 16px 12px; flex: 1; }

        .g-mlink {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 14px; border-radius: 10px;
          font-size: 14px; font-weight: 600; color: #334155;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s; cursor: pointer;
          border: none; background: none; width: 100%; text-align: left;
        }
        .g-mlink:hover { background: #F8FAFC; color: #2B96A8; }
        .g-mlink.on {
          background: rgba(43,150,168,0.08); color: #2B96A8; font-weight: 700;
        }

        .g-plan-section {
          background: #F8FAFC; border-radius: 12px;
          padding: 14px 12px; margin-bottom: 10px;
        }
        .g-plan-label {
          font-size: 10.5px; font-weight: 800; color: #94A3B8;
          text-transform: uppercase; letter-spacing: 2px; padding: 0 6px;
          margin-bottom: 8px;
        }

        /* ── Mobile backdrop ── */
        .g-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(15,23,42,0.4);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Responsive visibility ── */
        @media (max-width: 900px) {
          .gnav-links-area { display: none !important; }
          .g-burger { display: flex !important; }
        }
        @media (min-width: 901px) {
          .g-drawer { display: none !important; }
          .g-backdrop { display: none !important; }
        }
      `}</style>

      {/* ── Backdrop mobile ── */}
      {mobileOpen && (
        <div className="g-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Navbar ── */}
      <header
        className={`gnav-wrapper${scrolled ? " scrolled" : ""}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className={`gnav-inner ${onHero ? "gnav-hero" : "gnav-light"}`}>

          {/* Logo */}
          <Link href={ROUTES.home} style={{ flexShrink: 0, display: "flex" }}>
            <Logo />
          </Link>

          {/* Links area */}
          <nav
            className="gnav-links-area"
            style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}
          >
            {/* Planifier dropdown */}
            <div style={{ position: "relative" }}>
              <button
                className={`g-plan-btn ${isPlanActive ? "on" : ""} ${planOpen ? "open" : ""}`}
                onClick={() => setPlanOpen(o => !o)}
              >
                <Compass size={14} style={{ flexShrink: 0 }} />
                Planifier
                <ChevronDown size={13} className="chevron" />
              </button>

              {planOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setPlanOpen(false)} />
                  <div className="g-plan-drop">
                    <Link
                      href={isUserLoggedIn ? ROUTES.touriste.ModeAssiste : ROUTES.ModeAssiste}
                      className="drop-item"
                      onClick={() => setPlanOpen(false)}
                    >
                      <div className="drop-icon" style={{ background: "rgba(2,175,207,0.1)" }}>
                        <Wand2 size={16} color="#02AFCF" />
                      </div>
                      <div>
                        <span style={{ display: "block" }}>Mode Assisté</span>
                        <span className="drop-sub">Itinéraire sur-mesure guidé</span>
                      </div>
                    </Link>
                    <Link
                      href={isUserLoggedIn ? ROUTES.touriste.modeLibre : "/modeLibre?mode=libre"}
                      className="drop-item"
                      onClick={() => setPlanOpen(false)}
                    >
                      <div className="drop-icon" style={{ background: "rgba(43,150,168,0.1)" }}>
                        <Navigation size={16} color="#2B96A8" />
                      </div>
                      <div>
                        <span style={{ display: "block" }}>Mode Libre</span>
                        <span className="drop-sub">Construisez votre voyage</span>
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Standard links */}
            {(isUserLoggedIn ? touristeLinks : publicLinks).map((l: any) =>
              l.anchor ? (
                <a key={l.href} href={l.href} className="glink" onClick={() => setMobileOpen(false)}>
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`glink${isActive(l.href) ? " on" : ""}`}
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              className="g-burger"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {isUserLoggedIn ? (
              <>
                <Link href={ROUTES.touriste.favoris} className="g-fav" aria-label="Favoris">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favCount > 0 && <span className="nb">{favCount > 9 ? "9+" : favCount}</span>}
                </Link>
                <div className="g-sep" />
                <div style={{ position: "relative" }}>
                  <button className="av" onClick={() => setMenuOpen(o => !o)}>
                    {avatarUrl ? <img src={avatarUrl} alt={initial} /> : initial}
                  </button>
                  {menuOpen && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 499 }} onClick={() => setMenuOpen(false)} />
                      <div className="drop">
                        <div className="drop-header">
                          <div className="drop-av">
                            {avatarUrl ? <img src={avatarUrl} alt={initial} /> : initial}
                          </div>
                          <div>
                            <p className="drop-name">{userName || "Touriste"}</p>
                            <span className="drop-role">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.18 19.79 19.79 0 0 1 1.64 .5a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                              Compte touriste
                            </span>
                          </div>
                        </div>
                        <Link href={ROUTES.touriste.profil} className="ddi" onClick={() => setMenuOpen(false)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          Mon profil
                        </Link>
                        <Link href={ROUTES.touriste.messages} className="ddi" onClick={() => setMenuOpen(false)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                          Messages
                        </Link>
                        {ROUTES.touriste.historique && (
                          <Link href={ROUTES.touriste.historique} className="ddi" onClick={() => setMenuOpen(false)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Historique
                          </Link>
                        )}
                        <div className="drop-divider" />
                        <button className="ddi red" onClick={handleSignOut}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                          Se déconnecter
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href={ROUTES.touriste.favoris} className="g-fav" aria-label="Favoris">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </Link>
                <div className="g-sep" />
                <Link href={ROUTES.auth} className="g-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <span>Connexion</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div className={`g-drawer ${mobileOpen ? "" : "closed"}`}>
        <div className="g-drawer-header">
          <Logo />
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid #E2E8F0", background: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#64748B",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="g-drawer-body">
          <div className="g-plan-section">
            <p className="g-plan-label">Planifier mon voyage</p>
            <Link
              href={isUserLoggedIn ? ROUTES.touriste.ModeAssiste : ROUTES.ModeAssiste}
              className={`g-mlink ${pathname.startsWith("/touriste/modeAssister") || pathname.startsWith("/modeAssister") ? "on" : ""}`}
              onClick={() => setMobileOpen(false)}
              style={{ marginBottom: 4 }}
            >
              <Wand2 size={16} color="#02AFCF" />
              Mode Assisté
            </Link>
            <Link
              href={isUserLoggedIn ? ROUTES.touriste.modeLibre : "/modeLibre?mode=libre"}
              className={`g-mlink ${pathname.startsWith("/touriste/modeLibre") || pathname.startsWith("/modeLibre") ? "on" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Navigation size={16} color="#2B96A8" />
              Mode Libre
            </Link>
          </div>

          {(isUserLoggedIn ? touristeLinks : publicLinks).map((l: any) =>
            l.anchor ? (
              <a key={l.href} href={l.href} className="g-mlink" onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            )
          )}

          <div style={{ borderTop: "1px solid #F1F5F9", marginTop: 12, paddingTop: 12 }}>
            {isUserLoggedIn ? (
              <button
                className="g-mlink"
                onClick={handleSignOut}
                style={{ color: "#EF4444", width: "100%" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Se déconnecter
              </button>
            ) : (
              <Link
                href={ROUTES.auth}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, #2B96A8, #053366)",
                  color: "white", borderRadius: 10,
                  textDecoration: "none", fontSize: 14, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}