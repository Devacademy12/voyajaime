import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.NEXT_PUBLIC_SUPABASE_URL,   // ✅ .env (pas juste process.)
    process.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Export direct pour compatibilité
export const supabase = createBrowserClient(
  process.NEXT_PUBLIC_SUPABASE_URL,
  process.NEXT_PUBLIC_SUPABASE_ANON_KEY
)