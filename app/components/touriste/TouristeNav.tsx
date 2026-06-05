"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";
import {
  Heart, LogOut, Menu, X, MessageCircle,
  User, Plane,
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

  // ── "Planifier" est le PREMIER lien pour les utilisateurs connectés ──
  const touristeLinks = [
    { href: ROUTES.excursions,            icon: "ti-compass",     label: "Explorer" },
    { href: ROUTES.touriste.itineraires,  icon: "ti-map",         label: "Mes itinéraires" },
    { href: ROUTES.touriste.reservations, icon: "ti-calendar",    label: "Réservations" },
    { href: ROUTES.about,                 icon: "ti-help-circle", label: "À propos" },
    { href: ROUTES.blog,                  icon: "ti-book",        label: "Blog" },
    { href: ROUTES.contact,               icon: "ti-phone",       label: "Contact" },
  ];

  // ── "Planifier" est le PREMIER lien pour les visiteurs publics ──
  const publicLinks = [
    { href: ROUTES.excursions, icon: "ti-compass",     label: "Excursions",        anchor: false },
    { href: "#chemins",        icon: "ti-map",         label: "Comment ça marche", anchor: true  },
    { href: ROUTES.about,      icon: "ti-help-circle", label: "À propos",          anchor: false },
    { href: ROUTES.blog,       icon: "ti-book",        label: "Blog",              anchor: false },
    { href: ROUTES.contact,    icon: "ti-phone",       label: "Contact",           anchor: false },
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
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

        .gnav * { box-sizing: border-box; margin: 0; padding: 0; }
        .gnav    { font-family: 'DM Sans', sans-serif; }

        .gnav-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          height: 100%;
        }

        /* ── Nav link standard ── */
        .glink {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 13px; border-radius: 8px;
          font-size: 17px; font-weight: 700;
          color: #259FFC;
          white-space: nowrap;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none; white-space: nowrap;
          border: 1px solid transparent;
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s, border-color 0.2s;
        }
        .glink i { font-size: 15px; opacity: 0.7; }
        .glink:hover {
          color: #053366;
          background: rgba(37,159,252,0.45);
          border-color: rgba(37,159,252,0.45);
        }
        .glink:hover i { opacity: 1; }
        .glink.on {
           color: #053366;
          background: rgba(37,159,252,0.45);
          border-color: rgba(37,159,252,0.45);
        }

        /* ══════════════════════════════════════════
           BOUTON "PLANIFIER" — Premier, mis en avant
           Couleur #259FFC, grand, gras, distinct
        ══════════════════════════════════════════ */
        .glink-plan {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 13px; border-radius: 8px;
          font-size: 17px; font-weight: 700;
          color:#259FFC;
          white-space: nowrap;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid transparent;
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s, border-color 0.2s;
          position: relative;
        }
        .glink-plan i.main-icon { font-size: 16px; opacity: 1; }
        .glink-plan .chevron    { font-size: 14px; opacity: 0.75; transition: transform 0.2s ease, opacity 0.2s; }
        .glink-plan:hover {
       color: #053366;
          background: rgba(37,159,252,0.45);
          border-color: rgba(37,159,252,0.45);
        }
        .glink-plan.on {
          color: #053366;
          background: rgba(37,159,252,0.45);
          border-color: rgba(37,159,252,0.45);
        }
        .glink-plan.open .chevron { transform: rotate(180deg); opacity: 1; }

        /* ── Dropdown Planifier ── */
        .plan-drop {
          position: absolute; top: calc(100% + 10px); left: 50%;
          transform: translateX(-50%);
          background: #FFFFFF;
          border: 1px solid rgba(37,159,252,0.15);
          border-radius: 14px; padding: 8px;
          min-width: 340px;
          box-shadow: 0 12px 40px rgba(37,159,252,0.14), 0 2px 10px rgba(5,51,102,0.06);
          z-index: 400;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .plan-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 13px; border-radius: 10px;
          text-decoration: none; cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }
        .plan-card:hover       { background: rgba(37,159,252,0.06); border-color: rgba(37,159,252,0.18); }
        .plan-card.active-mode { background: rgba(37,159,252,0.09); border-color: rgba(37,159,252,0.24); }
        .plan-icon {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .plan-icon i { font-size: 17px; }
        .plan-icon.assiste { background: rgba(37,159,252,0.10); border: 1px solid rgba(37,159,252,0.22); }
        .plan-icon.libre   { background: rgba(43,150,168,0.10);  border: 1px solid rgba(43,150,168,0.22); }
        .plan-title { font-size: 14px; font-weight: 800; color: #053366; margin-bottom: 3px; font-family: 'DM Sans', sans-serif; }
        .plan-desc  { font-size: 13px; color: #6B7A8D; font-weight: 500; line-height: 1.45; font-family: 'DM Sans', sans-serif; }
        .plan-badge {
          display: inline-flex; align-items: center; gap: 3px; margin-top: 5px;
          padding: 2px 8px; border-radius: 20px;
          font-size: 10px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        }
        .plan-badge i { font-size: 9px; }
        .plan-badge.ai   { background: rgba(37,159,252,0.09);  color: #1187e0; border: 1px solid rgba(37,159,252,0.22); }
        .plan-badge.free { background: rgba(43,150,168,0.09); color: #1E7A8A;  border: 1px solid rgba(43,150,168,0.22); }
        .plan-divider    { height: 1px; background: rgba(5,51,102,0.07); margin: 4px 0; }

        /* ══════════════════════════════════════════
           BOUTON CONNEXION — #259FFC, grand, gras
        ══════════════════════════════════════════ */
        .g-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 22px; border-radius: 10px;
          border: 2px solid #259FFC;
          background: #259FFC;
          font-size: 15px; font-weight: 800;
          color: #ffffff;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          white-space: nowrap; text-decoration: none;
          letter-spacing: 0.2px;
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s, border-color 0.2s;
          box-shadow: 0 4px 16px rgba(37,159,252,0.35);
        }
        .g-btn i { font-size: 16px; }
        .g-btn:hover {
          background: #1187e0;
          border-color: #1187e0;
          box-shadow: 0 6px 22px rgba(37,159,252,0.45);
          transform: translateY(-1px);
        }

        /* ── Favoris icon ── */
        .g-fav {
          width: 38px; height: 38px; border-radius: 50%;
          border: 1.5px solid rgba(5,51,102,0.12);
          color: #6B7A8D; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; text-decoration: none;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .g-fav i { font-size: 17px; }
        .g-fav:hover { background: rgba(5,51,102,0.05); color: #053366; border-color: rgba(5,51,102,0.2); }
        .nb {
          position: absolute; top: -3px; right: -3px;
          background: #DC2626; color: white; border-radius: 50%;
          width: 15px; height: 15px; font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
        }
        .g-sep { width: 1px; height: 22px; background: rgba(5,51,102,0.08); flex-shrink: 0; }

        /* ── Avatar ── */
        .av {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #259FFC, #053366);
          color: white; border: 2px solid rgba(37,159,252,0.2);
          cursor: pointer; font-size: 13px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.15s, box-shadow 0.15s;
          flex-shrink: 0; overflow: hidden; padding: 0; background-color: unset;
        }
        .av:hover { border-color: #259FFC; box-shadow: 0 0 0 3px rgba(37,159,252,0.18); }
        .av img   { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        /* ── Dropdown avatar ── */
        .drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: #FFFFFF; border: 1px solid rgba(5,51,102,0.10);
          border-radius: 14px; padding: 6px; min-width: 224px;
          box-shadow: 0 14px 40px rgba(5,51,102,0.12);
          z-index: 400;
          animation: dropInRight 0.18s ease;
        }
        @keyframes dropInRight {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ddi {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 12px; border-radius: 8px;
          text-decoration: none; font-size: 13px; font-weight: 600;
          color: #053366; cursor: pointer;
          border: none; background: none;
          font-family: 'DM Sans', sans-serif; width: 100%; text-align: left;
          transition: background 0.15s, color 0.15s;
        }
        .ddi:hover     { background: rgba(5,51,102,0.05); color: #1e7a8a; }
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
          box-shadow: 0 8px 28px rgba(5,51,102,0.10);
          z-index: 199;
          display: flex; flex-direction: column; gap: 2px;
          padding: 10px 12px 16px;
        }
        .g-drawer.closed { display: none; }

        .g-mlink {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 8px;
          font-size: 15px; font-weight: 700;
          color: #1e7a8a; text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .g-mlink i { font-size: 16px; opacity: 0.75; }
        .g-mlink:hover, .g-mlink.on {
          background: rgba(30,122,138,0.08); color: #155f6d; font-weight: 800;
        }
        .g-mlink:hover i, .g-mlink.on i { opacity: 1; }

        /* Planifier dans le drawer mobile */
        .g-mlink-plan {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 9px;
          font-size: 15px; font-weight: 800;
          color: #259FFC; text-decoration: none;
          background: rgba(37,159,252,0.06);
          border: 1px solid rgba(37,159,252,0.15);
          transition: background 0.15s, color 0.15s;
        }
        .g-mlink-plan i { font-size: 16px; }
        .g-mlink-plan:hover {
          background: rgba(37,159,252,0.12);
          border-color: rgba(37,159,252,0.28);
        }

        .g-plan-section { border-top: 1px solid rgba(5,51,102,0.08); margin-top: 6px; padding-top: 10px; }
        .g-plan-label {
          font-size: 10px; font-weight: 800; color: #6B7A8D;
          text-transform: uppercase; letter-spacing: 1.2px;
          padding: 2px 14px 8px; font-family: 'DM Sans', sans-serif;
        }

        /* ── Logo ── */
        .gnav-logo-img { height: 42px; }

        /* ── Responsive ── */
        @media (max-width: 1000px) {
          .g-center  { display: none !important; }
          .g-burger  { display: flex !important; }
        }
        @media (max-width: 1024px) {
          .gnav-inner { padding: 0 20px; }
        }
        @media (max-width: 640px) {
          .gnav-inner { padding: 0 12px; gap: 6px; }
          .gnav-logo-img { height: 26px !important; }
          .g-btn {
            padding: 8px 11px !important;
            font-size: 0 !important;
            gap: 0 !important;
            border-radius: 8px !important;
            min-width: unset !important;
          }
          .g-btn i { font-size: 17px !important; }
          .g-btn-text { display: none !important; }
          .g-fav  { width: 34px !important; height: 34px !important; }
          .g-fav i { font-size: 15px !important; }
          .av     { width: 34px !important; height: 34px !important; font-size: 11px !important; }
          .g-burger { padding: 6px !important; }
          .g-sep { height: 16px !important; }
        }
        @media (max-width: 380px) {
          .gnav-logo-img { height: 22px !important; }
          .g-fav  { width: 30px !important; height: 30px !important; }
          .av     { width: 30px !important; height: 30px !important; }
        }
      `}</style>

      <header
        suppressHydrationWarning
        className="gnav"
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 200, height: 72,
          background: scrolled ? "rgba(250,250,252,0.99)" : "rgba(0,0,0,0)",
          backdropFilter: scrolled ? "blur(18px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(5,51,102,0.08)" : "1px solid transparent",
          boxShadow: scrolled ? "0 4px 24px rgba(5,51,102,0.08)" : "none",
          transition: "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
        }}
      >
        <div className="gnav-inner">

          {/* Logo */}
          <Link href={ROUTES.home}
            style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <Logo />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="g-center" style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center", gap: 4 }}>
            {isUserLoggedIn ? (
              <>
                {/* ══ PLANIFIER EN PREMIER ══ */}
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
                            <i className="ti ti-wand" style={{ color: "#259FFC" }} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="plan-title">Mode Assisté</p>
                            <p className="plan-desc">Laissez notre IA concevoir votre itinéraire idéal selon vos préférences.</p>
                            <span className="plan-badge ai">
                              <i className="ti ti-wand" aria-hidden="true" /> Propulsé par l&apos;IA
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

                {/* Autres liens */}
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
                {/* ══ PLANIFIER EN PREMIER aussi pour les visiteurs ══ */}
                <div style={{ position: "relative" }}>
                  <button
                    className={`glink-plan ${planOpen ? "open" : ""}`}
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
                          className="plan-card"
                          onClick={() => setPlanOpen(false)}
                        >
                          <div className="plan-icon assiste">
                            <i className="ti ti-wand" style={{ color: "#259FFC" }} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="plan-title">Mode Assisté</p>
                            <p className="plan-desc">Laissez notre IA concevoir votre itinéraire idéal selon vos préférences.</p>
                            <span className="plan-badge ai">
                              <i className="ti ti-wand" aria-hidden="true" /> Propulsé par l&apos;IA
                            </span>
                          </div>
                        </Link>

                        <div className="plan-divider" />

                        <Link
                          href="/modeLibre?mode=libre"
                          className="plan-card"
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

                {/* Autres liens publics */}
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

          {/* ── Right actions ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button className="g-burger" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isUserLoggedIn ? (
              <>
                <Link href={ROUTES.touriste.favoris} className="g-fav" title="Mes favoris">
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
                        {/* Avatar header */}
                        <div style={{
                          padding: "10px 12px 12px",
                          borderBottom: "1px solid rgba(5,51,102,0.08)",
                          marginBottom: 4,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: "50%",
                              background: "linear-gradient(135deg,#259FFC,#053366)",
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
                                fontSize: 11, color: "#259FFC", fontWeight: 700,
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
                <Link href={ROUTES.touriste.favoris} className="g-fav" title="Favoris">
                  <i className="ti ti-heart" aria-hidden="true" />
                </Link>
                <div className="g-sep" />
                {/* ══ BOUTON CONNEXION — #259FFC, grand, gras ══ */}
                <Link href={ROUTES.auth} className="g-btn">
                  <i className="ti ti-user" aria-hidden="true" />
                  <span className="g-btn-text">Connexion</span>
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <div className={`g-drawer ${mobileOpen ? "" : "closed"}`}>
        {isUserLoggedIn ? (
          <>
            {/* ══ PLANIFIER EN PREMIER dans le mobile aussi ══ */}
            <div className="g-plan-section" style={{ border: "none", marginTop: 0, paddingTop: 0 }}>
              <p className="g-plan-label">Planifier mon voyage</p>
              <Link
                href={ROUTES.touriste.ModeAssiste}
                className={`g-mlink-plan ${
                  pathname.startsWith("/touriste/modeAssister") ? "on" : ""
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <i className="ti ti-wand" aria-hidden="true" />
                Mode Assisté — IA
              </Link>
              <div style={{ height: 6 }} />
              <Link
                href={ROUTES.touriste.modeLibre}
                className={`g-mlink-plan ${
                  pathname.startsWith("/touriste/modeLibre") ? "on" : ""
                }`}
                style={{ color: "#2B96A8", background: "rgba(43,150,168,0.06)", borderColor: "rgba(43,150,168,0.15)" }}
                onClick={() => setMobileOpen(false)}
              >
                <i className="ti ti-navigation" aria-hidden="true" />
                Mode Libre
              </Link>
            </div>

            <div style={{ borderTop: "1px solid rgba(5,51,102,0.08)", marginTop: 8, paddingTop: 8 }}>
              {touristeLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className={`g-mlink ${isActive(l.href) ? "on" : ""}`}
                  onClick={() => setMobileOpen(false)}>
                  <i className={`ti ${l.icon}`} aria-hidden="true" />
                  {l.label}
                </Link>
              ))}
            </div>

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
            {/* ══ PLANIFIER EN PREMIER dans le mobile visiteur ══ */}
            <div style={{ marginBottom: 6 }}>
              <p className="g-plan-label">Planifier mon voyage</p>
              <Link href={ROUTES.ModeAssiste} className="g-mlink-plan" onClick={() => setMobileOpen(false)}>
                <i className="ti ti-wand" aria-hidden="true" /> Mode Assisté — IA
              </Link>
              <div style={{ height: 6 }} />
              <Link
                href="/modeLibre?mode=libre"
                className="g-mlink-plan"
                style={{ color: "#2B96A8", background: "rgba(43,150,168,0.06)", borderColor: "rgba(43,150,168,0.15)" }}
                onClick={() => setMobileOpen(false)}
              >
                <i className="ti ti-navigation" aria-hidden="true" /> Mode Libre
              </Link>
            </div>

            <div style={{ borderTop: "1px solid rgba(5,51,102,0.08)", paddingTop: 8 }}>
              {publicLinks.map(l => (
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
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(5,51,102,0.08)", marginTop: 6, paddingTop: 6 }}>
              <Link href={ROUTES.auth} onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 16px",
                  background: "#259FFC",
                  color: "white", borderRadius: 10,
                  textDecoration: "none", fontSize: 15, fontWeight: 800,
                  boxShadow: "0 4px 16px rgba(37,159,252,0.35)",
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