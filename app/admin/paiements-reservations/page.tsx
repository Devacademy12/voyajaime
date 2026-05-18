// app/admin/paiements-reservations/page.tsx
// ─────────────────────────────────────────────────────────────────────
// Charge TOUTES les réservations (payées, en attente, annulées)
// + les paiements associés quand ils existent.
// ─────────────────────────────────────────────────────────────────────

import { createAdminClient } from "@/lib/supabaseAdmin";
import AdminPaiementsReservationsClient from "./AdminPaiementsReservationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPaiements() {
  const supabase = createAdminClient();

  // ── 1. Toutes les réservations (pas de filtre sur les paiements) ───
  // FIX: on récupère touriste_id qui manquait dans le select original
  const { data: reservations = [], error: errResa } = await supabase
    .from("reservations")
    .select(`
      id,
      booking_code,
      date,
      time,
      people_count,
      total_price,
      platform_fee,
      status,
      payment_status,
      payment_method,
      excursion_id,
      touriste_id,
      itineraire_id,
      created_at,
      payment_deadline,
      paid_at,
      cancelled_at,
      cancel_reason,
      special_needs,
      special_notes
    `)
    .order("created_at", { ascending: false });

  if (errResa) {
    console.error("Erreur reservations :", errResa.message);
  }

  // ── 2. Paiements — tous, pour joindre aux réservations ─────────────
  // FIX: on charge TOUS les paiements sans filtre
  const { data: paiements = [], error: errPay } = await supabase
    .from("paiements")
    .select("*")
    .order("created_at", { ascending: false });

  if (errPay) {
    console.error("Erreur paiements :", errPay.message);
  }

  // ── 3. IDs à résoudre ─────────────────────────────────────────────
  const excursionIds  = [...new Set((reservations ?? []).map(r => r.excursion_id).filter(Boolean))];
  const touristeIds   = [...new Set((reservations ?? []).map(r => r.touriste_id).filter(Boolean))];
  // prestataire_id vient des paiements
  const prestIds      = [...new Set((paiements ?? []).map(p => p.prestataire_id).filter(Boolean))];

  // ── 4. Excursions ─────────────────────────────────────────────────
  const { data: excursions = [] } = excursionIds.length > 0
    ? await supabase
        .from("excursions")
        .select("id, title, city, description, duration, difficulty, max_people, price_per_person, photo_url, includes")
        .in("id", excursionIds)
    : { data: [] };

  // ── 5. Profils touristes ──────────────────────────────────────────
  const { data: touristes = [] } = touristeIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, phone")
        .in("user_id", touristeIds)
    : { data: [] };

  // ── 6. Profils prestataires ───────────────────────────────────────
  const { data: prestataires = [] } = prestIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, agency_name")
        .in("user_id", prestIds)
    : { data: [] };

  return (
    <AdminPaiementsReservationsClient
      paiements={paiements ?? []}
      reservations={reservations ?? []}
      touristes={touristes ?? []}
      prestataires={prestataires ?? []}
      excursions={excursions ?? []}
    />
  );
}