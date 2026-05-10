import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ReservationsClient from "./ReservationsClient";
import { Suspense } from "react";
import { StripeReturnHandler } from "./StripeReturnHandler";

type Reservation = {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
  status: string; payment_status: string | null; payment_deadline?: string | null;
  excursion: {
    id: string;
    title: string;
    city: string;
    photos: string[];
    duration_hours: number;
    price_per_person: number;
    rating?: number;
  } | null;
};

export default async function TouristeReservations({
  searchParams,
}: {
  searchParams: Promise<{ pay?: string; session_id?: string; success?: string; canceled?: string }>;
}) {
  const resolvedParams = await searchParams;
  const autoOpenId     = resolvedParams?.pay;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return (
    <div style={{ textAlign: "center", padding: 48 }}>
      <p style={{ color: "#4a6080" }}>Veuillez vous connecter pour voir vos réservations</p>
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

  // ✅ FIX : payment_status inclus directement dans le select principal
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count,
      total_price, platform_fee, status, payment_status,
      created_at, payment_deadline,
      excursion:excursions(id, title, city, photos, duration_hours, price_per_person, rating)
    `)
    .eq("touriste_id", user.id)
    .neq("status", "cancelled")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) return (
    <div style={{ textAlign: "center", padding: 48 }}>
      <p style={{ color: "#EF4444" }}>Erreur : {error.message}</p>
    </div>
  );

  const formattedReservations: Reservation[] = (reservations || [])
    .filter(r => r.excursion !== null && r.excursion !== undefined)
    .map(r => {
      const excursionData = Array.isArray(r.excursion) ? r.excursion[0] : r.excursion;
      return {
        id: r.id,
        booking_code: r.booking_code,
        date: r.date,
        time: r.time,
        people_count: r.people_count,
        total_price: r.total_price,
        platform_fee: r.platform_fee,
        status: r.status,
        payment_status: r.payment_status || null, // ✅ vient directement du select
        payment_deadline: r.payment_deadline,
        excursion: excursionData ? {
          id: excursionData.id,
          title: excursionData.title || "Excursion inconnue",
          city: excursionData.city || "",
          photos: excursionData.photos || [],
          duration_hours: excursionData.duration_hours || 0,
          price_per_person: excursionData.price_per_person || 0,
          rating: excursionData.rating || 0,
        } : null,
      };
    });

  return (
    <div style={{ width: "75%", background: "#F8FAFC", minHeight: "100vh", position: "relative", padding: "32px 0 60px", margin: "0 auto" }}>

      {/* ✅ Handler Stripe — gère le retour success/cancel depuis Stripe Checkout */}
      <Suspense fallback={null}>
        <StripeReturnHandler />
      </Suspense>

      <ReservationsClient
        reservations={formattedReservations}
        autoOpenId={autoOpenId}
      />
    </div>
  );
}