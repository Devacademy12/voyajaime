"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import { LogOut, Menu, X, MessageCircle, User, Plane, Clock, ChevronDown } from "lucide-react";

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

  /* ── Auth ── */
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

  /* ── Scroll ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Avatar refresh ── */
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

  /* ── Links ── */
  const touristeLinks = [
    { href: ROUTES.excursions,            icon: "ti-compass",     label: "Explorer"        },
    { href: ROUTES.touriste.itineraires,  icon: "ti-map",         label: "Mes itinéraires" },
    { href: ROUTES.touriste.reservations, icon: "ti-calendar",    label: "Réservations"    },
    { href: ROUTES.about,                 icon: "ti-help-circle", label: "À propos"        },
    { href: ROUTES.blog,                  icon: "ti-book",        label: "Blog"            },
    { href: ROUTES.contact,               icon: "ti-phone",       label: "Contact"         },
  ];

  const publicLinks = [
    { href: ROUTES.excursions, icon: "ti-compass",     label: "Excursions",        anchor: false },
    { href: "#chemins",        icon: "ti-map",         label: "Comment ça marche", anchor: true  },
    { href: ROUTES.about,      icon: "ti-help-circle", label: "À propos",          anchor: false },
    { href: ROUTES.blog,       icon: "ti-book",        label: "Blog",              anchor: false },
    { href: ROUTES.contact,    icon: "ti-phone",       label: "Contact",           anchor: false },
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

  /* ── Is hero page (needs dark nav text when not scrolled)? ── */
  const isHeroPage = pathname === "/" || pathname === ROUTES.home;

  /*
    Text color logic:
    - Hero page + not scrolled → white (on image background)
    - Everything else           → dark (#1E293B)
    scrolled always uses dark bg so dark text is fine
  */
  const navTextColor   = isHeroPage && !scrolled ? "rgba(255,255,255,0.92)" : "#1E293B";
  const navTextHover   = isHeroPage && !scrolled ? "#ffffff"                : "#2B96A8";
  const navBg =
    scrolled
      ? "#FFFFFF"
      : isHeroPage
      ? "transparent"
      : "#FFFFFF";
  const navBorder =
    scrolled
      ? "1px solid rgba(5,51,102,0.10)"
      : isHeroPage
      ? "1px solid transparent"
      : "1px solid rgba(5,51,102,0.10)";
  const navShadow =
    scrolled
      ? "0 2px 20px rgba(5,51,102,0.08)"
      : isHeroPage
      ? "none"
      : "0 2px 20px rgba(5,51,102,0.06)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

        /* ── Reset ── */
        .gnav * { box-sizing: border-box; margin: 0; padding: 0; }
        .gnav    { font-family: 'DM Sans', sans-serif; }

        /* ── Logo ── */
        .gnav-logo-img { height: 40px; transition: opacity 0.2s; }
        .gnav-logo-img:hover { opacity: 0.85; }

        /* ── Nav link ── */
        .glink {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 11px; border-radius: 8px;
          font-size: 14px; font-weight: 600; letter-spacing: -0.1px;
          color: var(--gnav-text);
          text-decoration: none; white-space: nowrap;
          border: 1px solid transparent;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .glink i { font-size: 14px; opacity: 0.65; transition: opacity 0.15s; }
        .glink:hover {
          color: #2B96A8;
          background: rgba(43,150,168,0.09);
          border-color: rgba(43,150,168,0.14);
        }
        .glink:hover i { opacity: 1; }
        .glink.on {
          color: #2B96A8; font-weight: 700;
          background: rgba(43,150,168,0.09);
          border-color: rgba(43,150,168,0.16);
        }
        .glink.on i { opacity: 1; }

        /* Override for hero transparent bg — white links */
        .gnav-hero-mode .glink       { color: rgba(255,255,255,0.88); }
        .gnav-hero-mode .glink:hover { color: #fff; background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
        .gnav-hero-mode .glink.on    { color: #fff; background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.25); }

        /* ── Planifier button ── */
        .glink-plan {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 11px; border-radius: 8px;
          font-size: 14px; font-weight: 600; letter-spacing: -0.1px;
          color: var(--gnav-text); white-space: nowrap;
          cursor: pointer; background: none;
          border: 1px solid transparent;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
        }
        .glink-plan i.mi { font-size: 14px; opacity: 0.65; }
        .glink-plan .chev { font-size: 13px; opacity: 0.5; transition: transform 0.2s, opacity 0.15s; }
        .glink-plan:hover       { color: #2B96A8; background: rgba(43,150,168,0.09); border-color: rgba(43,150,168,0.14); }
        .glink-plan:hover i     { opacity: 1; }
        .glink-plan.on          { color: #2B96A8; font-weight: 700; background: rgba(43,150,168,0.09); border-color: rgba(43,150,168,0.16); }
        .glink-plan.on i        { opacity: 1; }
        .glink-plan.open .chev  { transform: rotate(180deg); opacity: 0.8; }

        .gnav-hero-mode .glink-plan       { color: rgba(255,255,255,0.88); }
        .gnav-hero-mode .glink-plan:hover { color: #fff; background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
        .gnav-hero-mode .glink-plan.on    { color: #fff; background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.25); }

        /* ── Planifier dropdown ── */
        .plan-drop {
          position: absolute; top: calc(100% + 10px); left: 50%;
          transform: translateX(-50%);
          background: #FFFFFF;
          border: 1px solid rgba(5,51,102,0.10);
          border-radius: 16px; padding: 8px;
          min-width: 340px;
          box-shadow: 0 16px 48px rgba(5,51,102,0.14), 0 4px 12px rgba(5,51,102,0.07);
          z-index: 500;
          animation: dropIn 0.16s cubic-bezier(.16,1,.3,1);
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
        }
        .plan-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 13px; border-radius: 10px;
          text-decoration: none; cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }
        .plan-card:hover       { background: rgba(43,150,168,0.06); border-color: rgba(43,150,168,0.14); }
        .plan-card.active-mode { background: rgba(43,150,168,0.08); border-color: rgba(43,150,168,0.20); }

        .plan-icon {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .plan-icon i { font-size: 17px; }
        .plan-icon.assiste { background: rgba(2,175,207,0.10); border: 1px solid rgba(2,175,207,0.22); }
        .plan-icon.libre   { background: rgba(43,150,168,0.10); border: 1px solid rgba(43,150,168,0.22); }

        .plan-title { font-size: 14px; font-weight: 700; color: #053366; margin-bottom: 2px; font-family: 'DM Sans', sans-serif; }
        .plan-desc  { font-size: 13px; color: #64748B; font-weight: 500; line-height: 1.5; font-family: 'DM Sans', sans-serif; }
        .plan-badge {
          display: inline-flex; align-items: center; gap: 3px; margin-top: 5px;
          padding: 2px 8px; border-radius: 20px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.2px;
          font-family: 'DM Sans', sans-serif;
        }
        .plan-badge i { font-size: 9px; }
        .plan-badge.ai   { background: rgba(2,175,207,0.09);  color: #0891A8; border: 1px solid rgba(2,175,207,0.22); }
        .plan-badge.free { background: rgba(43,150,168,0.09); color: #1E7A8A; border: 1px solid rgba(43,150,168,0.22); }
        .plan-divider    { height: 1px; background: rgba(5,51,102,0.07); margin: 4px 0; }

        /* ── Right actions ── */
        .g-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 18px; border-radius: 9px;
          background: linear-gradient(135deg, #02AFCF, #0891A8);
          border: none;
          font-size: 14px; font-weight: 700; color: #fff;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          white-space: nowrap; text-decoration: none;
          box-shadow: 0 2px 10px rgba(2,175,207,0.30);
          transition: opacity 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .g-btn i { font-size: 14px; }
        .g-btn:hover { opacity: 0.92; box-shadow: 0 4px 16px rgba(2,175,207,0.38); transform: translateY(-1px); }

        /* Hero override — outlined white button */
        .gnav-hero-mode .g-btn {
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.55);
          color: #fff;
          box-shadow: none;
          backdrop-filter: blur(6px);
        }
        .gnav-hero-mode .g-btn:hover {
          background: rgba(255,255,255,0.25);
          border-color: rgba(255,255,255,0.80);
          box-shadow: none;
          transform: translateY(-1px);
        }

        /* Fav icon button */
        .g-fav {
          width: 38px; height: 38px; border-radius: 50%;
          border: 1.5px solid rgba(5,51,102,0.12);
          color: #64748B; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; text-decoration: none;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .g-fav i { font-size: 18px; }
        .g-fav:hover { background: rgba(5,51,102,0.05); color: #E11D48; border-color: rgba(225,29,72,0.25); }
        .gnav-hero-mode .g-fav { border-color: rgba(255,255,255,0.35); color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.10); }
        .gnav-hero-mode .g-fav:hover { background: rgba(255,255,255,0.20); border-color: rgba(255,255,255,0.60); color: #fff; }
        .nb {
          position: absolute; top: -3px; right: -3px;
          background: #E11D48; color: white; border-radius: 50%;
          width: 16px; height: 16px; font-size: 9px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white; font-family: 'DM Sans', sans-serif;
        }

        .g-sep { width: 1px; height: 22px; background: rgba(5,51,102,0.10); flex-shrink: 0; }
        .gnav-hero-mode .g-sep { background: rgba(255,255,255,0.25); }

        /* Avatar button */
        .av {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #02AFCF, #053366);
          color: white;
          border: 2px solid rgba(255,255,255,0.7);
          box-shadow: 0 0 0 1.5px rgba(5,51,102,0.15);
          cursor: pointer; font-size: 14px; font-weight: 800;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center;
          transition: box-shadow 0.15s, transform 0.1s;
          flex-shrink: 0; overflow: hidden; padding: 0;
        }
        .av:hover { box-shadow: 0 0 0 3px rgba(43,150,168,0.30); transform: scale(1.04); }
        .av img   { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        /* Avatar dropdown */
        .drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: #FFFFFF; border: 1px solid rgba(5,51,102,0.10);
          border-radius: 16px; padding: 6px; min-width: 230px;
          box-shadow: 0 16px 48px rgba(5,51,102,0.14), 0 4px 12px rgba(5,51,102,0.06);
          z-index: 500;
          animation: dropInRight 0.16s cubic-bezier(.16,1,.3,1);
        }
        @keyframes dropInRight {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .drop-header {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(5,51,102,0.07);
          margin-bottom: 4px;
          display: flex; align-items: center; gap: 10px;
        }
        .drop-av {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg,#02AFCF,#053366);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: white;
          overflow: hidden;
        }
        .drop-av img { width: 100%; height: 100%; object-fit: cover; }
        .drop-name   { font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 2px; font-family: 'DM Sans', sans-serif; }
        .drop-role   { font-size: 11px; color: #2B96A8; font-weight: 600; display: flex; align-items: center; gap: 4px; font-family: 'DM Sans', sans-serif; }

        .ddi {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 13px; border-radius: 9px;
          text-decoration: none; font-size: 13px; font-weight: 600;
          color: #1E293B; cursor: pointer;
          border: none; background: none;
          font-family: 'DM Sans', sans-serif; width: 100%; text-align: left;
          transition: background 0.13s, color 0.13s;
        }
        .ddi i { font-size: 15px; opacity: 0.7; }
        .ddi:hover      { background: rgba(43,150,168,0.07); color: #2B96A8; }
        .ddi:hover i    { opacity: 1; }
        .ddi.red        { color: #DC2626; }
        .ddi.red:hover  { background: #FEF2F2; color: #B91C1C; }
        .ddi.red i      { opacity: 0.8; }
        .drop-divider   { height: 1px; background: rgba(5,51,102,0.07); margin: 4px 2px; }

        /* ── Burger ── */
        .g-burger {
          display: none; background: none;
          border: 1.5px solid rgba(5,51,102,0.14);
          cursor: pointer; padding: 7px; border-radius: 9px;
          color: #1E293B; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .g-burger:hover { background: rgba(5,51,102,0.06); }
        .gnav-hero-mode .g-burger { border-color: rgba(255,255,255,0.35); color: white; background: rgba(255,255,255,0.10); }
        .gnav-hero-mode .g-burger:hover { background: rgba(255,255,255,0.20); }

        /* ── Mobile drawer ── */
        .g-drawer {
          position: fixed; top: 68px; left: 0; right: 0;
          background: #FFFFFF;
          border-bottom: 1px solid rgba(5,51,102,0.09);
          box-shadow: 0 12px 32px rgba(5,51,102,0.10);
          z-index: 490;
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 14px 16px;
          max-height: calc(100vh - 68px);
          overflow-y: auto;
        }
        .g-drawer.closed { display: none; }

        .g-mlink {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 9px;
          font-size: 14px; font-weight: 600;
          color: #1E293B; text-decoration: none;
          border: 1px solid transparent;
          transition: background 0.13s, color 0.13s, border-color 0.13s;
          font-family: 'DM Sans', sans-serif;
        }
        .g-mlink i { font-size: 16px; opacity: 0.6; }
        .g-mlink:hover, .g-mlink.on {
          background: rgba(43,150,168,0.07);
          border-color: rgba(43,150,168,0.13);
          color: #2B96A8; font-weight: 700;
        }
        .g-mlink:hover i, .g-mlink.on i { opacity: 1; }

        .g-plan-section {
          border-bottom: 1px solid rgba(5,51,102,0.07);
          margin-bottom: 6px; padding-bottom: 8px;
        }
        .g-plan-label {
          font-size: 10px; font-weight: 800; color: #94A3B8;
          text-transform: uppercase; letter-spacing: 1.2px;
          padding: 4px 14px 8px;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Responsive ── */
        @media (max-width: 1020px) {
          .g-center  { display: none !important; }
          .g-burger  { display: flex !important; }
        }

        /* ── Mobile ≤ 640px ── */
        @media (max-width: 640px) {
          .gnav-inner { padding: 0 14px !important; }
          .gnav-logo-img { height: 30px !important; }
          .g-btn-text { display: none !important; }
          .g-btn { padding: 7px 10px !important; gap: 0 !important; }
          .g-fav  { width: 34px !important; height: 34px !important; }
          .g-fav i { font-size: 16px !important; }
          .av     { width: 34px !important; height: 34px !important; font-size: 12px !important; }
          .g-burger { padding: 6px !important; }
        }

        /* ── Very small ≤ 380px ── */
        @media (max-width: 380px) {
          .gnav-logo-img { height: 26px !important; }
          .g-fav  { width: 30px !important; height: 30px !important; }
          .av     { width: 30px !important; height: 30px !important; }
        }
      `}</style>

      {/* CSS variable scoped to nav element */}
      <style>{`
        .gnav-inner { --gnav-text: ${navTextColor}; }
      `}</style>

      <header
        className={`gnav${isHeroPage && !scrolled ? " gnav-hero-mode" : ""}`}
        style={{
          position:  "fixed", top: 0, left: 0, right: 0,
          zIndex:    200, height: 68,
          background: navBg,
          backdropFilter: scrolled ? "blur(20px)" : isHeroPage ? "none" : "blur(0px)",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: navBorder,
          boxShadow:    navShadow,
          transition:   "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
        }}
      >
        {/* Inner wrapper — centré avec max-width */}
        <div
          className="gnav-inner"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 28px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* ── Logo ── */}
          <Link href={ROUTES.home}
            style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <Logo />
          </Link>

          {/* ── Centre ── */}
          <nav className="g-center"
            style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center", gap: 2 }}>
            {isUserLoggedIn ? (
              <>
                {/* Planifier dropdown */}
                <div style={{ position: "relative" }}>
                  <button
                    className={`glink-plan ${isPlanActive ? "on" : ""} ${planOpen ? "open" : ""}`}
                    onClick={() => setPlanOpen(o => !o)}
                  >
                    <i className="ti ti-route mi" aria-hidden="true" />
                    Planifier
                    <i className="ti ti-chevron-down chev" aria-hidden="true" />
                  </button>

                  {planOpen && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 499 }}
                        onClick={() => setPlanOpen(false)} />
                      <div className="plan-drop">
                        <Link
                          href={ROUTES.touriste.ModeAssiste}
                          className={`plan-card ${
                            pathname === ROUTES.touriste.ModeAssiste ||
                            pathname.startsWith("/touriste/modeAssister") ? "active-mode" : ""
                          }`}
                          onClick={() => setPlanOpen(false)}
                        >
                          <div className="plan-icon assiste">
                            <i className="ti ti-wand" style={{ color: "#02AFCF" }} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="plan-title">Mode Assisté</p>
                            <p className="plan-desc">Laissez notre IA concevoir votre itinéraire idéal selon vos préférences.</p>
                            <span className="plan-badge ai">
                              <i className="ti ti-wand" aria-hidden="true" /> Propulsé par l'IA
                            </span>
                          </div>
                        </Link>
                        <div className="plan-divider" />
                        <Link
                          href={ROUTES.touriste.modeLibre}
                          className={`plan-card ${
                            pathname === ROUTES.touriste.modeLibre ||
                            pathname.startsWith("/touriste/modeLibre") ? "active-mode" : ""
                          }`}
                          onClick={() => setPlanOpen(false)}
                        >
                          <div className="plan-icon libre">
                            <i className="ti ti-navigation" style={{ color: "#2B96A8" }} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="plan-title">Mode Libre</p>
                            <p className="plan-desc">Construisez votre voyage étape par étape, selon vos propres choix.</p>
                            <span className="plan-badge free">
                              <i className="ti ti-navigation" aria-hidden="true" /> Personnalisé
                            </span>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Liens touriste */}
                {touristeLinks.map(l => (
                  <Link key={l.href} href={l.href}
                    className={`glink ${isActive(l.href) ? "on" : ""}`}>
                    <i className={`ti ${l.icon}`} aria-hidden="true" />
                    {l.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {/* Planifier dropdown (public) */}
                <div style={{ position: "relative" }}>
                  <button
                    className={`glink-plan ${isPlanActive ? "on" : ""} ${planOpen ? "open" : ""}`}
                    onClick={() => setPlanOpen(o => !o)}
                  >
                    <i className="ti ti-route mi" aria-hidden="true" />
                    Planifier
                    <i className="ti ti-chevron-down chev" aria-hidden="true" />
                  </button>

                  {planOpen && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 499 }}
                        onClick={() => setPlanOpen(false)} />
                      <div className="plan-drop">
                        <Link
                          href={ROUTES.ModeAssiste}
                          className={`plan-card ${
                            pathname === ROUTES.ModeAssiste ||
                            pathname.startsWith("/modeAssister") ? "active-mode" : ""
                          }`}
                          onClick={() => setPlanOpen(false)}
                        >
                          <div className="plan-icon assiste">
                            <i className="ti ti-wand" style={{ color: "#02AFCF" }} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="plan-title">Mode Assisté</p>
                            <p className="plan-desc">Laissez notre IA concevoir votre itinéraire idéal selon vos préférences.</p>
                            <span className="plan-badge ai">
                              <i className="ti ti-wand" aria-hidden="true" /> Propulsé par l'IA
                            </span>
                          </div>
                        </Link>
                        <div className="plan-divider" />
                        <Link
                          href={ROUTES.touriste.modeLibre}
                          className={`plan-card ${
                            pathname === ROUTES.touriste.modeLibre ||
                            pathname.startsWith("/modeLibre") ? "active-mode" : ""
                          }`}
                          onClick={() => setPlanOpen(false)}
                        >
                          <div className="plan-icon libre">
                            <i className="ti ti-navigation" style={{ color: "#2B96A8" }} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="plan-title">Mode Libre</p>
                            <p className="plan-desc">Construisez votre voyage étape par étape, selon vos propres choix.</p>
                            <span className="plan-badge free">
                              <i className="ti ti-navigation" aria-hidden="true" /> Personnalisé
                            </span>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Liens publics */}
                {publicLinks.map(l =>
                  l.anchor
                    ? <a key={l.href} href={l.href} className="glink">
                        <i className={`ti ${l.icon}`} aria-hidden="true" /> {l.label}
                      </a>
                    : <Link key={l.href} href={l.href}
                        className={`glink ${isActive(l.href) ? "on" : ""}`}>
                        <i className={`ti ${l.icon}`} aria-hidden="true" /> {l.label}
                      </Link>
                )}
              </>
            )}
          </nav>

          {/* ── Droite ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

            {/* Burger (mobile) */}
            <button className="g-burger" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isUserLoggedIn ? (
              <>
                {/* Favoris */}
                <Link href={ROUTES.touriste.favoris} className="g-fav">
                  <i className="ti ti-heart" aria-hidden="true" />
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
                      <div style={{ position: "fixed", inset: 0, zIndex: 499 }}
                        onClick={() => setMenuOpen(false)} />
                      <div className="drop">
                        {/* Header profil */}
                        <div className="drop-header">
                          <div className="drop-av">
                            {avatarUrl
                              ? <img src={avatarUrl} alt={initial} />
                              : initial}
                          </div>
                          <div>
                            <p className="drop-name">{userName || "Touriste"}</p>
                            <span className="drop-role">
                              <i className="ti ti-plane" style={{ fontSize: 11 }} aria-hidden="true" />
                              Compte touriste
                            </span>
                          </div>
                        </div>

                        <Link href={ROUTES.touriste.profil} className="ddi" onClick={() => setMenuOpen(false)}>
                          <i className="ti ti-user" aria-hidden="true" /> Mon profil
                        </Link>
                        <Link href={ROUTES.touriste.messages} className="ddi" onClick={() => setMenuOpen(false)}>
                          <i className="ti ti-message-circle" aria-hidden="true" /> Messages
                        </Link>
                        {ROUTES.touriste.historique && (
                          <Link href={ROUTES.touriste.historique} className="ddi" onClick={() => setMenuOpen(false)}>
                            <i className="ti ti-clock" aria-hidden="true" /> Historique
                          </Link>
                        )}

                        <div className="drop-divider" />
                        <button className="ddi red" onClick={handleSignOut}>
                          <i className="ti ti-logout" aria-hidden="true" /> Se déconnecter
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Favoris (non connecté) */}
                <Link href={ROUTES.touriste.favoris} className="g-fav">
                  <i className="ti ti-heart" aria-hidden="true" />
                </Link>
                <div className="g-sep" />
                {/* Bouton connexion */}
                <Link href={ROUTES.auth} className="g-btn">
                  <i className="ti ti-user" aria-hidden="true" />
                  <span className="g-btn-text">Connexion</span>
                </Link>
              </>
            )}
          </div>
        </div>{/* fin gnav-inner */}
      </header>

      {/* ── Drawer mobile ── */}
      <div className={`g-drawer ${mobileOpen ? "" : "closed"}`}>
        {isUserLoggedIn ? (
          <>
            {/* Planifier EN PREMIER */}
            <div className="g-plan-section">
              <p className="g-plan-label">Planifier mon voyage</p>
              <Link
                href={ROUTES.touriste.ModeAssiste}
                className={`g-mlink ${pathname.startsWith("/touriste/modeAssister") ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <i className="ti ti-wand" style={{ color: "#02AFCF" }} aria-hidden="true" />
                Mode Assisté
              </Link>
              <Link
                href={ROUTES.touriste.modeLibre}
                className={`g-mlink ${pathname.startsWith("/touriste/modeLibre") ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <i className="ti ti-navigation" style={{ color: "#2B96A8" }} aria-hidden="true" />
                Mode Libre
              </Link>
            </div>

            {touristeLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}>
                <i className={`ti ${l.icon}`} aria-hidden="true" />
                {l.label}
              </Link>
            ))}

            <div style={{ borderTop: "1px solid rgba(5,51,102,0.08)", marginTop: 6, paddingTop: 6 }}>
              <button
                className="ddi red"
                style={{ width: "100%", borderRadius: 9, fontSize: 14 }}
                onClick={handleSignOut}
              >
                <i className="ti ti-logout" aria-hidden="true" /> Se déconnecter
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Planifier EN PREMIER (public) */}
            <div className="g-plan-section">
              <p className="g-plan-label">Planifier mon voyage</p>
              <Link
                href={ROUTES.ModeAssiste}
                className={`g-mlink ${pathname.startsWith("/modeAssister") ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <i className="ti ti-wand" style={{ color: "#02AFCF" }} aria-hidden="true" />
                Mode Assisté
              </Link>
              <Link
                href={ROUTES.touriste.modeLibre}
                className={`g-mlink ${pathname.startsWith("/modeLibre") ? "on" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <i className="ti ti-navigation" style={{ color: "#2B96A8" }} aria-hidden="true" />
                Mode Libre
              </Link>
            </div>

            {publicLinks.map(l =>
              l.anchor ? (
                <a key={l.href} href={l.href} className="g-mlink" onClick={() => setMobileOpen(false)}>
                  <i className={`ti ${l.icon}`} aria-hidden="true" /> {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href}
                  className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
                  onClick={() => setMobileOpen(false)}>
                  <i className={`ti ${l.icon}`} aria-hidden="true" /> {l.label}
                </Link>
              )
            )}

            <div style={{ borderTop: "1px solid rgba(5,51,102,0.08)", marginTop: 6, paddingTop: 6 }}>
              <Link
                href={ROUTES.auth}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, #02AFCF, #053366)",
                  color: "white", borderRadius: 9,
                  textDecoration: "none", fontSize: 14, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <i className="ti ti-login" aria-hidden="true" /> Se connecter
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}