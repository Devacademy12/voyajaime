import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { CalendarDays, AlertCircle, Clock } from "lucide-react";
import ReservationsClient from "./ReservationsClient";

type Reservation = {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
  status: string; payment_status: string | null; payment_deadline?: string | null;
  excursion: { 
    id: string;                              // ✅ Ajout de l'id
    title: string; 
    city: string; 
    photos: string[]; 
    duration_hours: number; 
    price_per_person: number; 
  } | null;
};

export default async function TouristeReservations({
  searchParams,
}: {
  searchParams: Promise<{ pay?: string }>;
}) {
  const resolvedParams = await searchParams;
  const autoOpenId     = resolvedParams?.pay;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return (
    <div style={{ textAlign:"center", padding:48 }}>
      <p style={{ color:"#4a6080" }}>Veuillez vous connecter pour voir vos réservations</p>
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

  // ✅ Requête avec l'id de l'excursion
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count,
      total_price, platform_fee, status, created_at, payment_deadline,
      excursion:excursions(id, title, city, photos, duration_hours, price_per_person)
    `)
    .eq("touriste_id", user.id)
    .neq("status", "cancelled")
    .gte("date", today)
    .order("date", { ascending: true });

  let paymentStatuses: Record<string, string> = {};
  try {
    const { data: ps } = await supabase.from("reservations").select("id, payment_status").eq("touriste_id", user.id);
    if (ps) ps.forEach((r: { id: string; payment_status?: string | null }) => {
      if (r.payment_status) paymentStatuses[r.id] = r.payment_status;
    });
  } catch (_) {}

  if (error) return (
    <div style={{ textAlign:"center", padding:48 }}>
      <p style={{ color:"#EF4444" }}>Erreur : {error.message}</p>
    </div>
  );

  // ✅ Formatage avec l'id
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
        payment_status: paymentStatuses[r.id] || null,
        payment_deadline: r.payment_deadline,
        excursion: excursionData ? {
          id: excursionData.id,                                    // ✅ Inclut l'id
          title: excursionData.title || "Excursion inconnue", 
          city: excursionData.city || "",
          photos: excursionData.photos || [],
          duration_hours: excursionData.duration_hours || 0,
          price_per_person: excursionData.price_per_person || 0,
        } : null,
      };
    });

  const total = formattedReservations.length;
  const hasPendingPayments = formattedReservations.some(
    r => r.status === "pending" && r.payment_status !== "paid"
  );

  const { count: histCount } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("touriste_id", user.id)
    .or(`status.eq.cancelled,and(status.in.(confirmed,completed),date.lt.${today})`);

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 32px", background:"white", minHeight:"100vh" }}>
      {/* ... styles et header ... */}
      
      <ReservationsClient
        reservations={formattedReservations}
        autoOpenId={autoOpenId}
      />
    </div>
  );
}