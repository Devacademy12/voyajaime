import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ReservationsClient from "./ReservationsClient";
import { Clock, CalendarDays } from "lucide-react";

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

  const pendingCount = reservations?.filter((r) => r.status === "pending").length || 0;
  const totalCount   = reservations?.length || 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Réservations reçues</h1>
        <p style={{ color: "#6B7280", marginTop: "6px", display: "flex", alignItems: "center", gap: 14, fontSize: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Clock size={14} style={{ color: "#D97706" }} />
            <span><strong style={{ color: "#111827" }}>{pendingCount}</strong> en attente</span>
          </span>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <CalendarDays size={14} style={{ color: "#6B7280" }} />
            <span><strong style={{ color: "#111827" }}>{totalCount}</strong> au total</span>
          </span>
        </p>
      </div>
      <ReservationsClient reservations={reservations || []} />
    </div>
  );
}