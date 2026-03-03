import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ReservationsClient from "./ReservationsClient";

export default async function PrestataireReservations() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: excursions } = await supabase
    .from("excursions").select("id").eq("prestataire_id", user!.id);
  const excIds = excursions?.map((e) => e.id) || [];

  const { data: reservations } = excIds.length
    ? await supabase
        .from("reservations")
        .select("*, excursion:excursions(title, city), touriste:profiles!touriste_id(full_name, phone)")
        .in("excursion_id", excIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Réservations reçues</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>
          {reservations?.filter((r) => r.status === "pending").length || 0} en attente ·{" "}
          {reservations?.length || 0} au total
        </p>
      </div>
      <ReservationsClient reservations={reservations || []} />
    </div>
  );
}
