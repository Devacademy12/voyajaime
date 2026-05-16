"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import {
  Heart, LogOut, Menu, X, MessageCircle,
  User, Plane, Wand2, Navigation, ChevronDown,
} from "lucide-react";

const Logo = () => (
  <img src="/logo.png" alt="VoyajAime"
    className="gnav-logo-img"
    style={{ width: "auto", objectFit: "contain", display: "block" }} />
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
    { href: ROUTES.excursions,            icon: "ti-compass",     label: "Explorer" },
    { href: ROUTES.touriste.itineraires,  icon: "ti-map",         label: "Mes itinéraires" },
    { href: ROUTES.touriste.reservations, icon: "ti-calendar",    label: "Réservations" },
    { href: ROUTES.about,                 icon: "ti-help-circle", label: "À propos" },
    { href: ROUTES.blog,                  icon: "ti-book",        label: "Blog" },
    { href: ROUTES.contact,               icon: "ti-phone",       label: "Contact" },
  ];

  const publicLinks = [
    { href: ROUTES.excursions, icon: "ti-compass",      label: "Excursions",        anchor: false },
    { href: "#chemins",        icon: "ti-map",          label: "Comment ça marche", anchor: true  },
    { href: ROUTES.about,      icon: "ti-help-circle",  label: "À propos",          anchor: false },
    { href: ROUTES.blog,       icon: "ti-book",         label: "Blog",              anchor: false },
    { href: ROUTES.contact,    icon: "ti-phone",        label: "Contact",           anchor: false },
  ];

  const isActive = (href: string) => {
    if (href === "#chemins") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

        .gnav * { box-sizing: border-box; margin: 0; padding: 0; }
        .gnav    { font-family: 'DM Sans', sans-serif; }

        /* ── Nav link ── */
        .glink {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 13px; border-radius: 8px;
          font-size: 15px; font-weight: 600;
          color: #6B7A8D;
          text-decoration: none; white-space: nowrap;
          border: 1px solid transparent;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .glink i { font-size: 15px; opacity: 0.7; }
        .glink:hover {
          color: #2B96A8;
          background: rgba(43, 150, 168, 0.07);
          border-color: rgba(43, 150, 168, 0.12);
        }
        .glink:hover i { opacity: 1; }
        .glink.on {
          color: #053366; font-weight: 700;
          background: rgba(5, 51, 102, 0.05);
          border-color: rgba(5, 51, 102, 0.10);
        }
        .glink.on i { opacity: 1; }

        /* ── Planifier button ── */
        .glink-plan {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 13px; border-radius: 8px;
          font-size: 15px; font-weight: 600;
          color: #6B7A8D; white-space: nowrap;
          cursor: pointer; background: none;
          border: 1px solid transparent;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
        }
        .glink-plan i.main-icon { font-size: 15px; opacity: 0.7; }
        .glink-plan .chevron    { font-size: 15px; opacity: 0.4; transition: transform 0.2s ease, opacity 0.2s; }
        .glink-plan:hover {
          color: #2B96A8;
          background: rgba(43, 150, 168, 0.07);
          border-color: rgba(43, 150, 168, 0.12);
        }
        .glink-plan:hover i { opacity: 1; }
        .glink-plan.on {
          color: #053366; font-weight: 700;
          background: rgba(5, 51, 102, 0.05);
          border-color: rgba(5, 51, 102, 0.10);
        }
        .glink-plan.on i { opacity: 1; }
        .glink-plan.open .chevron { transform: rotate(180deg); opacity: 0.8; }

        /* ── Dropdown Planifier ── */
        .plan-drop {
          position: absolute; top: calc(100% + 8px); left: 50%;
          transform: translateX(-50%);
          background: #FFFFFF;
          border: 1px solid rgba(5, 51, 102, 0.10);
          border-radius: 14px; padding: 8px;
          min-width: 330px;
          box-shadow: 0 10px 32px rgba(5, 51, 102, 0.10), 0 2px 8px rgba(5, 51, 102, 0.05);
          z-index: 400;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .plan-card {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 11px 12px; border-radius: 9px;
          text-decoration: none; cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }
        .plan-card:hover       { background: rgba(43,150,168,0.06); border-color: rgba(43,150,168,0.14); }
        .plan-card.active-mode { background: rgba(43,150,168,0.08); border-color: rgba(43,150,168,0.20); }

        .plan-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .plan-icon i { font-size: 16px; }
        .plan-icon.assiste { background: rgba(2,175,207,0.10); border: 1px solid rgba(2,175,207,0.22); }
        .plan-icon.libre   { background: rgba(43,150,168,0.10); border: 1px solid rgba(43,150,168,0.22); }

        .plan-title { font-size: 15px; font-weight: 700; color: #053366; margin-bottom: 2px; font-family: 'DM Sans', sans-serif; }
        .plan-desc  { font-size: 15px;   color: #6B7A8D;   font-weight: 500; line-height: 1.45; font-family: 'DM Sans', sans-serif; }
        .plan-badge {
          display: inline-flex; align-items: center; gap: 3px; margin-top: 4px;
          padding: 2px 7px; border-radius: 20px;
          font-size: 10px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        }
        .plan-badge i { font-size: 9px; }
        .plan-badge.ai   { background: rgba(2,175,207,0.09);   color: #0891A8; border: 1px solid rgba(2,175,207,0.22); }
        .plan-badge.free { background: rgba(43,150,168,0.09);  color: #1E7A8A; border: 1px solid rgba(43,150,168,0.22); }
        .plan-divider    { height: 1px; background: rgba(5,51,102,0.08); margin: 3px 0; }

        /* ── Right actions ── */
        .g-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          border: 1.5px solid #2B96A8; background: transparent;
          font-size: 15px; font-weight: 700; color: #2B96A8;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          white-space: nowrap; text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .g-btn i { font-size: 14px; }
        .g-btn:hover { background: rgba(43,150,168,0.08); }

        .g-fav {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(5,51,102,0.10);
          color: #6B7A8D; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; text-decoration: none;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .g-fav i { font-size: 17px; }
        .g-fav:hover { background: rgba(5,51,102,0.05); color: #053366; border-color: rgba(5,51,102,0.15); }
        .nb {
          position: absolute; top: -3px; right: -3px;
          background: #DC2626; color: white; border-radius: 50%;
          width: 14px; height: 14px; font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid white;
        }

        .g-sep { width: 1px; height: 20px; background: rgba(5,51,102,0.08); flex-shrink: 0; }

        .av {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #02AFCF, #053366);
          color: white; border: 2px solid rgba(5,51,102,0.10);
          cursor: pointer; font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.15s, box-shadow 0.15s;
          flex-shrink: 0; overflow: hidden; padding: 0; background-color: unset;
        }
        .av:hover { border-color: #2B96A8; box-shadow: 0 0 0 3px rgba(43,150,168,0.15); }
        .av img   { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        /* ── Dropdown avatar ── */
        .drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: #FFFFFF; border: 1px solid rgba(5,51,102,0.10);
          border-radius: 14px; padding: 6px; min-width: 220px;
          box-shadow: 0 12px 36px rgba(5,51,102,0.12);
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
          color: #053366; cursor: pointer;
          border: none; background: none;
          font-family: 'DM Sans', sans-serif; width: 100%; text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .ddi:hover     { background: rgba(5,51,102,0.05); color: #2B96A8; }
        .ddi.red       { color: #DC2626; }
        .ddi.red:hover { background: #FEF2F2; color: #B91C1C; }

        /* ── Burger ── */
        .g-burger {
          display: none;
          background: rgba(5,51,102,0.06); border: 1px solid rgba(5,51,102,0.10);
          cursor: pointer; padding: 8px; border-radius: 8px;
          color: #053366;
          align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .g-burger:hover { background: rgba(5,51,102,0.10); }

        /* ── Drawer mobile ── */
        .g-drawer {
          position: fixed; top: 72px; left: 0; right: 0;
          background: #FFFFFF; border-bottom: 1px solid rgba(5,51,102,0.08);
          box-shadow: 0 8px 24px rgba(5,51,102,0.10);
          z-index: 199;
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 12px 14px;
        }
        .g-drawer.closed { display: none; }

        .g-mlink {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 8px;
          font-size: 14px; font-weight: 600;
          color: #053366; text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .g-mlink i { font-size: 16px; opacity: 0.7; }
        .g-mlink:hover, .g-mlink.on {
          background: rgba(43,150,168,0.08); color: #2B96A8; font-weight: 700;
        }
        .g-mlink:hover i, .g-mlink.on i { opacity: 1; }

        .g-plan-section { border-bottom: 1px solid rgba(5,51,102,0.08); margin-bottom: 4px; padding-bottom: 8px; }
        .g-plan-label {
          font-size: 10px; font-weight: 700; color: #6B7A8D;
          text-transform: uppercase; letter-spacing: 1px;
          padding: 2px 14px 8px; font-family: 'DM Sans', sans-serif;
        }

        /* ── Logo base size ── */
        .gnav-logo-img { height: 42px; }

        /* ── Responsive ── */
        @media (max-width: 1000px) {
          .g-center  { display: none !important; }
          .g-burger  { display: flex !important; }
        }

        /* ── Mobile ≤ 640px ── */
        @media (max-width: 640px) {
          .gnav-header { padding: 0 12px !important; gap: 6px !important; }
          .gnav-logo-img { height: 26px !important; }
          .g-btn {
            padding: 7px 9px !important;
            font-size: 0 !important;
            gap: 0 !important;
            border-radius: 8px !important;
            min-width: unset !important;
          }
          .g-btn i { font-size: 16px !important; }
          .g-btn-text { display: none !important; }
          .g-fav  { width: 32px !important; height: 32px !important; }
          .g-fav i { font-size: 15px !important; }
          .av     { width: 32px !important; height: 32px !important; font-size: 11px !important; }
          .g-burger { padding: 6px !important; }
          .g-sep { height: 16px !important; }
        }

        /* ── Très petit ≤ 380px ── */
        @media (max-width: 380px) {
          .gnav-logo-img { height: 22px !important; }
          .g-fav  { width: 28px !important; height: 28px !important; }
          .av     { width: 28px !important; height: 28px !important; }
        }
      `}</style>

      <header
        className="gnav gnav-header"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 200, height: 72,
          background: scrolled ? "rgba(250,250,252,0.99)" : "rgba(0,0,0,0)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: scrolled ? "1px solid rgba(5,51,102,0.08)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 24px rgba(5,51,102,0.08)" : "none",
          transition: "all 0.35s ease",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", gap: 16,
        }}
      >
        {/* Logo */}
        <Link href={ROUTES.home}
          style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
          <Logo />
        </Link>

        {/* Centre */}
        <nav className="g-center" style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center", gap: 2 }}>
          {isUserLoggedIn ? (
            <>
              {/* ── Dropdown Planifier EN PREMIER ── */}
              <div style={{ position: "relative" }}>
                <button
                  className={`glink-plan ${isPlanActive ? "on" : ""} ${planOpen ? "open" : ""}`}
                  onClick={() => setPlanOpen(o => !o)}
                >
                  <i className="ti ti-route main-icon" aria-hidden="true" />
                  Planifier
                  <i className="ti ti-chevron-down chevron" aria-hidden="true" />
                </button>

                {planOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 399 }}
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

              {/* ── Liens touristiques ── */}
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
              {/* ── Dropdown Planifier EN PREMIER (public) ── */}
              <div style={{ position: "relative" }}>
                <button
                  className={`glink-plan ${isPlanActive ? "on" : ""} ${planOpen ? "open" : ""}`}
                  onClick={() => setPlanOpen(o => !o)}
                >
                  <i className="ti ti-route main-icon" aria-hidden="true" />
                  Planifier
                  <i className="ti ti-chevron-down chevron" aria-hidden="true" />
                </button>

                {planOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 399 }}
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

              {/* ── Liens publics ── */}
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

        {/* Droite */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button className="g-burger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {isUserLoggedIn ? (
            <>
              <Link href={ROUTES.touriste.favoris} className="g-fav">
                <i className="ti ti-heart" aria-hidden="true" />
                {favCount > 0 && <span className="nb">{favCount > 9 ? "9+" : favCount}</span>}
              </Link>

              <div className="g-sep" />

              <div style={{ position: "relative" }}>
                <button className="av" onClick={() => setMenuOpen(o => !o)}>
                  {avatarUrl ? <img src={avatarUrl} alt={initial} /> : initial}
                </button>

                {menuOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 399 }}
                      onClick={() => setMenuOpen(false)} />
                    <div className="drop">
                      {/* Header profil */}
                      <div style={{
                        padding: "10px 12px 12px",
                        borderBottom: "1px solid rgba(5,51,102,0.08)",
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
                              ? <img src={avatarUrl} alt={initial}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

                      <div style={{ borderTop: "1px solid rgba(5,51,102,0.08)", marginTop: 4, paddingTop: 4 }}>
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
                <i className="ti ti-heart" aria-hidden="true" />
              </Link>
              <div className="g-sep" />
              <Link href={ROUTES.auth} className="g-btn">
                <i className="ti ti-user" aria-hidden="true" />
                <span className="g-btn-text">Connexion</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Drawer mobile ── */}
      <div className={`g-drawer ${mobileOpen ? "" : "closed"}`}>
        {isUserLoggedIn ? (
          <>
            {/* ── Planifier EN PREMIER dans le drawer ── */}
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

            {/* ── Liens touristiques ── */}
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
                style={{ width: "100%", borderRadius: 8, fontSize: 14 }}
                onClick={handleSignOut}
              >
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ── Planifier EN PREMIER dans le drawer (public) ── */}
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

            {/* ── Liens publics ── */}
            {publicLinks.map(l => (
              l.anchor ? (
                <a key={l.href} href={l.href} className="g-mlink"
                  onClick={() => setMobileOpen(false)}>
                  <i className={`ti ${l.icon}`} aria-hidden="true" /> {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href}
                  className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
                  onClick={() => setMobileOpen(false)}>
                  <i className={`ti ${l.icon}`} aria-hidden="true" /> {l.label}
                </Link>
              )
            ))}

            <div style={{ borderTop: "1px solid rgba(5,51,102,0.08)", marginTop: 6, paddingTop: 6 }}>
              <Link href={ROUTES.auth} onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 14px",
                  background: "linear-gradient(135deg, #2B96A8, #053366)",
                  color: "white", borderRadius: 8,
                  textDecoration: "none", fontSize: 14, fontWeight: 700,
                }}>
                <i className="ti ti-login" aria-hidden="true" /> Se connecter
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}