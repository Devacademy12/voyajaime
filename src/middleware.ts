import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques — jamais bloquées
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/auth/reset-password",
  "/excursions",
  "/blog",
  "/about",
  "/contact",
  "/api/auth/callback",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/webhooks/stripe",
];

// Préfixes publics (toutes sous-routes sont libres)
const PUBLIC_PREFIXES = [
  "/excursions/",
  "/blog/",
  "/api/auth/",
  "/api/webhooks/",
  "/_next/",
  "/favicon",
  "/images/",
  "/logo",
  "/brandmark",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques sans vérification Supabase
  if (isPublic(pathname)) return NextResponse.next();

  // Créer le client Supabase côté middleware (lecture/écriture des cookies)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propager les cookies de session dans la réponse
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Récupérer l'utilisateur (rafraîchit le token si nécessaire)
  const { data: { user } } = await supabase.auth.getUser();

  // ── Non connecté → rediriger vers /auth ──────────────────────────────────
  if (!user) {
    // Sauvegarder la page demandée pour rediriger après login
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Connecté : vérifier le rôle pour les sections protégées ─────────────
  // On ne fait la vérification de rôle que pour admin / prestataire
  // (le layout gère déjà le détail, le middleware bloque juste les non-connectés)

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      // Mauvais rôle → rediriger vers son espace ou l'accueil
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  if (pathname.startsWith("/prestataire")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "prestataire") {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  if (pathname.startsWith("/touriste")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "touriste") {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Appliquer le middleware sur toutes les routes SAUF :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - fichiers publics (images, fonts…)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)).*)",
  ],
};