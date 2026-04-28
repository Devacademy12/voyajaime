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
      excursion_id,
      excursions!reservations_excursion_id_fkey(title, city, photos, duration_hours, price_per_person)
    `)
    .eq("touriste_id", user.id)
    .eq("status", "cancelled")
    .order("created_at", { ascending: false });

  // 2. Réservations dont la date est passée
  const { data: past } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count, total_price,
      platform_fee, status, payment_status, created_at,
      excursion_id,
      excursions!reservations_excursion_id_fkey(title, city, photos, duration_hours, price_per_person)
    `)
    .eq("touriste_id", user.id)
    .in("status", ["confirmed", "completed"])
    .lt("date", today)
    .order("date", { ascending: false });

  const formatReservation = (r: any, type: "cancelled" | "completed" | "passed") => {
    // La relation excursions est un objet unique
    const excursionData = r.excursions;
    
    return {
      id: r.id,
      booking_code: r.booking_code,
      date: r.date,
      time: r.time,
      people_count: r.people_count,
      total_price: r.total_price,
      platform_fee: r.platform_fee,
      status: r.status,
      payment_status: r.payment_status,
      created_at: r.created_at,
      history_type: type,
      excursion: {
        title: excursionData?.title || "Excursion inconnue",
        city: excursionData?.city || "",
        photos: excursionData?.photos || [],
        duration_hours: excursionData?.duration_hours || 0,
        price_per_person: excursionData?.price_per_person || 0,
      }
    };
  };

  const all = [
    ...(cancelled || []).map(r => formatReservation(r, "cancelled")),
    ...(past || []).map(r => formatReservation(r, r.status === "completed" ? "completed" : "passed")),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return <HistoriqueClient reservations={all} />;
}