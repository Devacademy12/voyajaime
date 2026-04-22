// app/admin/paiements-reservations/page.tsx
// ─────────────────────────────────────────────────────────────────────
// Page serveur : récupère toutes les données et les passe au client.
// La réservation n'apparaît QUE si elle est liée à un paiement.
// ─────────────────────────────────────────────────────────────────────

import { createAdminClient } from "@/lib/supabaseAdmin";
import AdminPaiementsReservationsClient from "./AdminPaiementsReservationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPaiements() {
  const supabase = createAdminClient();

  // ── 1. Paiements ──────────────────────────────────────────────────
  const { data: paiements = [], error: errPay } = await supabase
    .from("paiements")
    .select("*")
    .order("created_at", { ascending: false });

  if (errPay) {
    console.error("Erreur paiements :", errPay.message);
  }

  // IDs de réservations liées aux paiements
  const resaIds = [...new Set((paiements ?? []).map(p => p.reservation_id).filter(Boolean))];

  // ── 2. Réservations (uniquement celles liées à un paiement) ───────
  const { data: reservations = [] } = await supabase
    .from("reservations")
    .select("id, booking_code, date, time, people_count, total_price, platform_fee, status, excursion_id, created_at, touriste_id")
    .in("id", resaIds.length > 0 ? resaIds : ["00000000-0000-0000-0000-000000000000"]);

  // ── 3. IDs excursions + touristes ─────────────────────────────────
  const excursionIds = [...new Set((reservations ?? []).map(r => (r as any).excursion_id).filter(Boolean))];
  const touristeIds  = [...new Set((reservations ?? []).map(r => (r as any).touriste_id).filter(Boolean))];
  const prestIds     = [...new Set((paiements   ?? []).map(p => p.prestataire_id).filter(Boolean))];

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