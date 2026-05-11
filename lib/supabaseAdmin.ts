import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase ADMIN — bypass complet du RLS.
 * À utiliser UNIQUEMENT dans les API Routes côté serveur.
 * Ne jamais exposer au navigateur.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}

// Export direct pour compatibilité
export const supabaseAdmin = createAdminClient();