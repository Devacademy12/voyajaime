// ─────────────────────────────────────────────
//  routes.ts  —  toutes les URLs de l'application
//  Emplacement : /lib/routes.ts
// ─────────────────────────────────────────────

import ModeAssiste from "../modeAssister/page";

export const ROUTES = {

  // ── Public ──────────────────────────────────
  home:       "/",
  auth:       "/auth",
  excursions: "/excursions",
  excursion:  (id: string) => `/excursions/${id}`,
  ModeAssiste : "/modeAssister",
  about:      "/about",
  blog:       "/blog",
  contact:    "/contact",

  // ── Touriste ────────────────────────────────
  touriste: {
    dashboard:    "/touriste/dashboard",
    itineraires:   "/touriste/itineraires",
    modeLibre:   "/modeLibre",
    ModeAssiste : "/modeAssister",
    reservations: "/touriste/reservations",
    favoris:      "/touriste/favoris",
    messages:     "/touriste/messages",
    profil: "/touriste/profil",
    historique: "/touriste/historique",
  },

  // ── Prestataire ─────────────────────────────
  prestataire: {
    dashboard:    "/prestataire/dashboard",
    excursions:   "/prestataire/excursions",
    reservations: "/prestataire/paiements-reservations",
    avis:         "/prestataire/avis",
    messages:     "/prestataire/messages",
    profil:       "/prestataire/profil",
  },

  // ── Admin ───────────────────────────────────
  admin: {
    dashboard:     "/admin/dashboard",
    prestataires:  "/admin/prestataires",
    excursions:    "/admin/excursions",
    reservations:  "/admin/paiements-reservations",
    avis:          "/admin/avis",
    conversations: "/admin/conversations",
    catalogue:     "/admin/catalogue",
    slider:        "/admin/slider",
    blog:          "/admin/blog",
    about:         "/admin/about",
    contact:       "/admin/contact",
  },

} as const;