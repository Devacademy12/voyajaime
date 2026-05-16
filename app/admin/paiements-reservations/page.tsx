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

  /* ── Charger toutes les réservations avec les infos touriste & excursion ── */
  const { data: reservations, error: resaError } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count,
      total_price, platform_fee, status, payment_status,
      payment_method, created_at, paid_at, cancelled_at,
      special_needs, cancel_reason,
      touriste:profiles!reservations_touriste_id_fkey(full_name, phone, user_id),
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

  /* ── Charger tous les paiements ── */
  const { data: paiements } = await supabase
    .from("paiements")
    .select(`
      id, amount, platform_fee, net_amount, status, paid_at, created_at,
      reservation:reservations(
        id, booking_code, date, people_count, total_price,
        touriste:profiles!reservations_touriste_id_fkey(full_name, phone),
        excursion:excursions(title, city, prestataire_id)
      ),
      prestataire:profiles!paiements_prestataire_id_fkey(full_name, agency_name)
    `)
    .order("created_at", { ascending: false });

  /* ── Charger les excursions pour le suivi de capacité ── */
  const { data: excursions } = await supabase
    .from("excursions")
    .select("id, title, city, max_people, price_per_person, is_active")
    .eq("is_active", true)
    .order("title");

  /* ── Calculer les places réservées par excursion ── */
  const capacite: Record<string, number> = {};
  (reservations || []).forEach((r) => {
    if (r.excursion && r.status !== "cancelled") {
      const excId = (r.excursion as any).id;
      capacite[excId] = (capacite[excId] || 0) + r.people_count;
    }
  });

  return (
    <AdminReservationsClient
      reservations={(reservations || []) as any}
      paiements={(paiements || []) as any}
      excursions={(excursions || []) as any}
      capacite={capacite}
    />
  );
}