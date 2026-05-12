// ─────────────────────────────────────────────
//  routes.ts  —  toutes les URLs de l'application
//  Emplacement : /lib/routes.ts
// ─────────────────────────────────────────────
export const ROUTES = {

  // ── Public ──────────────────────────────────
  home:       "/",
  auth:       "/auth",
  excursions: "/excursions",
  excursion:  (id: string) => `/excursions/${id}`,
  ModeAssiste : "/modeAssister",
  about:      "/about",
  blog:       "/blog",
  blogCat:    (cat: string) => `/blog?cat=${encodeURIComponent(cat)}`,
  blogSearch: (q: string)   => `/blog?q=${encodeURIComponent(q)}`,
  contact:    "/contact",

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
    reservations: "/prestataire/paiements-reservations",
    avis:         "/prestataire/avis",
    messages:     "/prestataire/messages",
    profil: "/prestataire/profil",
    completerProfil: "/prestataire/completer-profil",
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
    slider:       "/admin/slider",
    blog:         "/admin/blog",
    about:        "/admin/about",
  },

} as const;