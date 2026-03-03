import { createClient } from "@supabase/supabase-js";

// ⚠️ SERVICE_ROLE — bypass toutes les RLS
// Utiliser UNIQUEMENT dans les Server Components / API routes
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}