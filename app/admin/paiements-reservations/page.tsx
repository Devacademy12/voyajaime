import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import AdminReservationsClient from "./AdminReservationsClient";

export default async function AdminReservationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /* ── Vérifier que l'utilisateur est admin ── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  /* ── 1. Réservations (sans jointure profiles — touriste_id → auth.users) ── */
  const { data: reservationsRaw, error: resaError } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count, touriste_id,
      total_price, platform_fee, status, payment_status,
      payment_method, created_at, paid_at, cancelled_at,
      special_needs, cancel_reason,
      excursion:excursions(id, title, city, price_per_person, max_people, prestataire_id)
    `)
    .order("created_at", { ascending: false });

  if (resaError) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#EF4444" }}>
        Erreur : {resaError.message}
      </div>
    );
  }

  /* ── 2. Récupérer tous les profils touristes concernés ── */
  const touristeIds = [...new Set(
    (reservationsRaw || []).map((r) => r.touriste_id).filter(Boolean)
  )];

  const { data: touristesProfiles } = touristeIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", touristeIds)
    : { data: [] };

  const profilesMap: Record<string, { full_name: string | null; phone: string | null }> = {};
  (touristesProfiles || []).forEach((p) => {
    profilesMap[p.user_id] = { full_name: p.full_name, phone: p.phone };
  });

  /* ── 3. Fusionner réservations + profils ── */
  const reservations = (reservationsRaw || []).map((r) => ({
    ...r,
    touriste: r.touriste_id ? (profilesMap[r.touriste_id] ?? { full_name: null, phone: null }) : null,
  }));

  /* ── 4. Paiements ── */
  const { data: paiementsRaw } = await supabase
    .from("paiements")
    .select(`
      id, amount, platform_fee, net_amount, status, paid_at, created_at,
      prestataire_id,
      reservation:reservations(
        id, booking_code, date, people_count, total_price, touriste_id,
        excursion:excursions(title, city, prestataire_id)
      )
    `)
    .order("created_at", { ascending: false });

  /* ── 5. Profils pour paiements (touristes + prestataires) ── */
  const payTouristeIds = [...new Set(
    (paiementsRaw || [])
      .map((p) => (p.reservation as any)?.touriste_id)
      .filter(Boolean)
  )];
  const prestatairesIds = [...new Set(
    (paiementsRaw || []).map((p) => p.prestataire_id).filter(Boolean)
  )];
  const allPayProfileIds = [...new Set([...payTouristeIds, ...prestatairesIds])];

  const { data: payProfiles } = allPayProfileIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, phone, agency_name")
        .in("user_id", allPayProfileIds)
    : { data: [] };

  const payProfilesMap: Record<string, { full_name: string | null; phone: string | null; agency_name: string | null }> = {};
  (payProfiles || []).forEach((p) => {
    payProfilesMap[p.user_id] = { full_name: p.full_name, phone: p.phone, agency_name: p.agency_name };
  });

  /* ── 6. Fusionner paiements + profils ── */
  const paiements = (paiementsRaw || []).map((p) => {
    const resa = p.reservation as any;
    return {
      ...p,
      reservation: resa
        ? {
            ...resa,
            touriste: resa.touriste_id ? (payProfilesMap[resa.touriste_id] ?? { full_name: null, phone: null }) : null,
          }
        : null,
      prestataire: p.prestataire_id ? (payProfilesMap[p.prestataire_id] ?? { full_name: null, agency_name: null }) : null,
    };
  });

  /* ── 7. Excursions pour le suivi de capacité ── */
  const { data: excursions } = await supabase
    .from("excursions")
    .select("id, title, city, max_people, price_per_person, is_active")
    .eq("is_active", true)
    .order("title");

  /* ── 8. Calculer les places réservées par excursion ── */
  const capacite: Record<string, number> = {};
  reservations.forEach((r) => {
    const excId = (r.excursion as any)?.id;
    if (excId && r.status !== "cancelled") {
      capacite[excId] = (capacite[excId] || 0) + r.people_count;
    }
  });

  return (
    <AdminReservationsClient
      reservations={reservations as any}
      paiements={paiements as any}
      excursions={(excursions || []) as any}
      capacite={capacite}
    />
  );
}