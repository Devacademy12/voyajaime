import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Vérifie la session dans une API route et retourne l'utilisateur.
 * Usage:
 *   const { user, error } = await requireAuth();
 *   if (error) return error;
 */
export async function requireAuth(requiredRole?: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  // Vérification du rôle si demandée
  if (requiredRole) {
    const role = user.user_metadata?.role;
    if (role !== requiredRole) {
      return {
        user: null,
        error: NextResponse.json({ error: "Accès interdit" }, { status: 403 }),
      };
    }
  }

  return { user, error: null };
}

/**
 * Crée un client Supabase admin (service role) — à utiliser côté serveur uniquement
 */
export function createAdminClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}