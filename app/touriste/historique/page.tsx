import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import HistoriqueClient from "./HistoriqueClient";

export default async function HistoriquePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const today = new Date().toISOString().split("T")[0];

  // 1. Réservations annulées
  const { data: cancelled } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count, total_price,
      platform_fee, status, payment_status, created_at,
      excursion:excursions(title, city, photos, duration_hours, price_per_person)
    `)
    .eq("touriste_id", user.id)
    .eq("status", "cancelled")
    .order("created_at", { ascending: false });

  // 2. Réservations dont la date est passée (complétées ou confirmées avec date < aujourd'hui)
  const { data: past } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count, total_price,
      platform_fee, status, payment_status, created_at,
      excursion:excursions(title, city, photos, duration_hours, price_per_person)
    `)
    .eq("touriste_id", user.id)
    .in("status", ["confirmed", "completed"])
    .lt("date", today)
    .order("date", { ascending: false });

  const all = [
    ...(cancelled || []).map(r => ({ ...r, history_type: "cancelled" as const })),
    ...(past     || []).map(r => ({ ...r, history_type: r.status === "completed" ? "completed" as const : "passed" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return <HistoriqueClient reservations={all} />;
}