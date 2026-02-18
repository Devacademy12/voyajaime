# 🚀 Guide d'implémentation - voyaj'aime

## Ce qui est déjà fait ✅
- `app/auth/page.tsx` — Page d'authentification (login + register + OAuth)
- `lib/supabaseClient.ts` — Client Supabase
- `globals.css` — Styles globaux

---

## Ce qu'on vient de créer 🆕

### 1. `middleware.ts` (racine du projet)
Protection automatique des routes selon le rôle. **À copier à la racine du projet.**

### 2. Layouts des dashboards
- `app/touriste/layout.tsx` — Sidebar bleue (touriste)
- `app/prestataire/layout.tsx` — Sidebar orange (prestataire)  
- `app/admin/layout.tsx` — Sidebar sombre (admin)

### 3. `supabase-schema.sql` — Schéma de la base de données

---

## Prochaines étapes (ordre à suivre)

### Étape 1 : Configurer Supabase
1. Aller sur [supabase.com](https://supabase.com) → votre projet
2. Onglet **SQL Editor** → coller et exécuter `supabase-schema.sql`
3. Onglet **Authentication > Providers** → activer Google & Facebook

### Étape 2 : Modifier la page d'auth pour gérer le rôle
Dans `app/auth/page.tsx`, lors du `signUp`, passer le rôle dans les metadata :

```typescript
// Pour un touriste (par défaut)
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role: 'touriste' },  // ← ajouter cette ligne
    emailRedirectTo: `${window.location.origin}/api/auth/callback`,
  },
})

// Pour un prestataire (bouton "Je suis prestataire")
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role: 'prestataire' },  // ← rôle différent
    emailRedirectTo: `${window.location.origin}/api/auth/callback`,
  },
})
```

### Étape 3 : Créer le callback API
Créer `app/api/auth/callback/route.ts` :

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
    )
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (user) {
      // Récupérer le rôle et rediriger
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      return NextResponse.redirect(new URL(`/${profile?.role || 'touriste'}`, request.url))
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

### Étape 4 : Créer les pages des dashboards

Commencer par :
- `app/touriste/page.tsx` — Page d'accueil touriste
- `app/prestataire/page.tsx` — Vue d'ensemble prestataire  
- `app/admin/page.tsx` — Vue d'ensemble admin

---

## Structure des dossiers à créer dans l'ordre

```
Semaine 1 : Auth + Dashboards (squelettes)
  ✅ app/auth/page.tsx
  🔧 middleware.ts
  🔧 app/touriste/layout.tsx + page.tsx
  🔧 app/prestataire/layout.tsx + page.tsx
  🔧 app/admin/layout.tsx + page.tsx

Semaine 2-3 : Excursions (browse + détail)
  📁 app/(public)/excursions/
  📁 components/excursion/

Semaine 4-5 : Itinéraires (mode assisté + libre)
  📁 app/touriste/itineraire/
  📁 components/itineraire/

Semaine 6 : Favoris + Checkout
  📁 app/touriste/favoris/
  📁 app/(public)/checkout/

Semaine 7-8 : Dashboard prestataire complet
  📁 app/prestataire/excursions/
  📁 app/prestataire/reservations/

Semaine 9-10 : Admin + Tests
```

---

## Variables d'environnement (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Pour admin uniquement, ne jamais exposer côté client
```
