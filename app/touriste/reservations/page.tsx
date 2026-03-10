import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { Plus } from "lucide-react";
import ReservationsClient from "./ReservationsClient";

export default async function TouristeReservations() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Non connecté</p>;
  }

  // Fetch minimal — sans colonnes optionnelles (payment_status, meeting_point)
  // pour éviter que la query échoue si ces colonnes n'existent pas encore
  const { data: reservations, error } = await supabase
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
      excursion:excursions (
        title,
        city,
        photos,
        duration_hours,
        price_per_person
      )
    `)
    .eq("touriste_id", user.id)
    .order("created_at", { ascending: false });

  // Tentative de fetch des colonnes optionnelles séparément
  let paymentStatuses: Record<string, string> = {};
  try {
    const { data: ps } = await supabase
      .from("reservations")
      .select("id, payment_status")
      .eq("touriste_id", user.id);
    if (ps) {
      ps.forEach((r: { id: string; payment_status?: string }) => {
        if (r.payment_status) paymentStatuses[r.id] = r.payment_status;
      });
    }
  } catch {
    // colonne payment_status n'existe pas encore — on ignore
  }

  if (error) {
    console.error("Reservations fetch error:", error);
  }

  const list = (reservations || []).map(r => ({
    ...r,
    payment_status: paymentStatuses[r.id] || null,
  }));

  const total     = list.length;
  const pending   = list.filter(r => r.status === "pending").length;
  const confirmed = list.filter(r => r.status === "confirmed").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#2B96A8", textTransform: "uppercase", marginBottom: 8 }}>MON ESPACE</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>Mes réservations</h1>
        </div>
        <Link href="/touriste/itineraire"
          style={{ padding: "11px 22px", background: "#111827", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} strokeWidth={2.5} /> Nouvelle réservation
        </Link>
      </div>

      {/* Debug temporaire — à supprimer après vérification */}
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
          Erreur Supabase : {error.message}
        </div>
      )}

      <ReservationsClient
        reservations={list as Parameters<typeof ReservationsClient>[0]["reservations"]}
        total={total}
        pending={pending}
        confirmed={confirmed}
      />
    </div>
  );
}