# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # ESLint
```

## Architecture

**Voyajaime** is a Tunisian tourism excursion marketplace (French UI). Three user roles — touriste, prestataire (provider), admin — each with their own protected section.

### Tech Stack

- **Framework**: Next.js 16 (App Router), React 18, TypeScript
- **Database & Auth**: Supabase (`@supabase/ssr` for SSR-aware sessions)
- **Payments**: Stripe (checkout + webhooks)
- **Email**: Resend + Nodemailer
- **Styling**: Tailwind CSS + per-feature CSS modules in `public/style/`

### Supabase Clients — Use the Right One

| File | When to use |
|------|-------------|
| `lib/supabaseClient.ts` | Browser components (client components) |
| `lib/supabaseServer.ts` | Server Components, Route Handlers, Layouts |
| `lib/supabaseAdmin.ts` | Admin-only operations requiring service role (never expose to client) |

### Role-Based Access

Protection is implemented in each section's `layout.tsx` — **no middleware.ts**:

- `app/admin/layout.tsx` — redirects unless `profile.role === "admin"`
- `app/prestataire/layout.tsx` — redirects unless `role === "prestataire"` + `is_validated === true`; shows `ValidationPending` for unvalidated providers
- `app/touriste/layout.tsx` — redirects unless authenticated

### Auth Flow

- Auth modal (`app/components/auth/AuthModal.tsx`) handles login, tourist signup, and prestataire signup (agency info collected, awaits admin validation)
- OAuth callback (`app/api/auth/callback/route.ts`) creates a `profiles` row on first login and routes by role: touristes → `/`, prestataires/admins → `/[role]/dashboard`
- Password reset uses `app/api/auth/forgot-password/` and `reset-password/` routes

### Key Data Types

All interfaces live in `types/index.ts`: `Profile`, `Excursion`, `Reservation`, `Paiement`, `Avis`, `Favoris`, `Conversation`.

Centralized status definitions (labels, colors, icons for reservations, payments, reviews) are in `lib/statusConfig.ts` — always use this, don't hardcode status strings.

### Shared Utilities & Hooks

- `lib/useCrudOperation.ts` — generic delete/update patterns
- `lib/useListFiltering.ts` — search + filter logic for list pages
- `lib/useToast.ts` + `app/components/ui/Toast.tsx` — toast notifications
- `app/lib/sanitize.ts` — DOMPurify wrapper, use on any user-generated content before rendering
- `app/components/ui/` — shared UI: `StatusBadge`, `FilterTabs`, `DataList`, `SearchBar`, `StatCard`, `EmptyState`

### Payments

- Checkout flow: `app/api/paiement/stripe/checkout/route.ts`
- Webhook: `app/api/webhooks/stripe/route.ts`
- Paiements have `platform_fee` and `net_amount` (prestataire receives net amount)
- Utilities (formatting, CSV export): `lib/paiement.ts`

### Public Routes

`/` home, `/auth`, `/auth/reset-password`, `/excursions`, `/excursions/[id]`
