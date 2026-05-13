import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/auth/reset-password",
  "/excursions",
  "/blog",
  "/about",
  "/contact",
  "/completer-profil",
  "/modeAssister",
  "/modeLibre",
  "/api/auth/callback",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/webhooks/stripe",
  "/api/register-prestataire",
];

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
  "/modeAssister/",
  "/modeLibre/",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("user_id", user.id).single();
    if (!profile || profile.role !== "admin")
      return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (pathname.startsWith("/prestataire")) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("user_id", user.id).single();
    if (!profile || profile.role !== "prestataire")
      return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (pathname.startsWith("/touriste")) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("user_id", user.id).single();
    if (!profile || profile.role !== "touriste")
      return NextResponse.redirect(new URL("/auth", request.url));
  }

  return response;
}

export const runtime = "nodejs";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)).*)",
  ],
};