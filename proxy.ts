import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes protégées par rôle
const PROTECTED: Record<string, string[]> = {
  touriste:    ["/touriste"],
  prestataire: ["/prestataire"],
  admin:       ["/admin"],
};

// Routes publiques
const PUBLIC_PATHS = ["/", "/auth", "/excursions", "/api/auth", "/api/register-prestataire", "/_next", "/favicon", "/logo"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Pas connecté → redirige vers /auth
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = user.user_metadata?.role as string | undefined;

  // Mauvais rôle → redirige vers son dashboard
  for (const [requiredRole, paths] of Object.entries(PROTECTED)) {
    if (paths.some(p => pathname.startsWith(p))) {
      if (role !== requiredRole) {
        const url = request.nextUrl.clone();
        url.pathname = role ? `/${role}/dashboard` : "/auth";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};