// ─────────────────────────────────────────────
//  routes.ts  —  toutes les URLs de l'application
//  Emplacement : /lib/routes.ts
// ─────────────────────────────────────────────

import ModeAssiste from "../touriste/modeAssister/page";

export const ROUTES = {

  // ── Public ──────────────────────────────────
  home:       "/",
  auth:       "/auth",
  excursions: "/excursions",
  excursion:  (id: string) => `/excursions/${id}`,
  ModeAssiste : "/modeAssister",

  // ── Touriste ────────────────────────────────
  touriste: {
    dashboard:    "/touriste/dashboard",
    itineraires:   "/touriste/itineraires",
    modeLibre:   "/touriste/modeLibre",
    ModeAssiste : "/touriste/modeAssister",
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
    reservations: "/prestataire/reservations",
    paiements:    "/prestataire/paiements",
    avis:         "/prestataire/avis",
    messages:     "/prestataire/messages",
    profil:       "/prestataire/profil",
  },

  // ── Admin ───────────────────────────────────
  admin: {
    dashboard:     "/admin/dashboard",
    prestataires:  "/admin/prestataires",
    excursions:    "/admin/excursions",
    reservations:  "/admin/reservations",
    paiements:     "/admin/paiements",
    avis:          "/admin/avis",
    conversations: "/admin/conversations",
    catalogue:     "/admin/catalogue",
  },

} as const;