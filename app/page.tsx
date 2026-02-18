// app/page.tsx
// REMPLACER le contenu actuel de votre app/page.tsx par ce code

import { redirect } from 'next/navigation'

// Option simple : la page d'accueil redirige vers /auth
// Le middleware s'occupe ensuite de rediriger vers le bon dashboard si déjà connecté
export default function HomePage() {
  redirect('/auth')
}