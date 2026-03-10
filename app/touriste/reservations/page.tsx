import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import ReservationsClient from "./ReservationsClient";

// Définir un type pour les réservations
type Reservation = {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  payment_status: string | null;
  excursion: {
    title: string;
    city: string;
    photos: string[];
    duration_hours: number;
    price_per_person: number;
  } | null;
};

export default async function TouristeReservations() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <p style={{ color: "#6B7280" }}>Veuillez vous connecter pour voir vos réservations</p>
      </div>
    );
  }

  // Fetch des réservations avec toutes les données nécessaires
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
      created_at,
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

  // Récupérer les payment_status séparément
  let paymentStatuses: Record<string, string> = {};
  try {
    const { data: ps } = await supabase
      .from("reservations")
      .select("id, payment_status")
      .eq("touriste_id", user.id);
    
    if (ps && ps.length > 0) {
      ps.forEach((r: { id: string; payment_status?: string | null }) => {
        if (r.payment_status) paymentStatuses[r.id] = r.payment_status;
      });
    }
  } catch (e) {
    console.log("Payment status column might not exist yet");
  }

  if (error) {
    console.error("Reservations fetch error:", error);
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <p style={{ color: "#EF4444", marginBottom: 8 }}>Erreur lors du chargement des réservations</p>
        <p style={{ fontSize: 14, color: "#6B7280" }}>{error.message}</p>
      </div>
    );
  }

  // Vérifier si nous avons des réservations
  console.log("Réservations brutes:", reservations);
  
  // Formater les réservations avec le bon typage
  const formattedReservations: Reservation[] = (reservations || [])
    .filter(r => r.excursion !== null)
    .map(r => ({
      id: r.id,
      booking_code: r.booking_code,
      date: r.date,
      time: r.time,
      people_count: r.people_count,
      total_price: r.total_price,
      platform_fee: r.platform_fee,
      status: r.status,
      payment_status: paymentStatuses[r.id] || null,
      excursion: r.excursion ? {
        title: r.excursion.title,
        city: r.excursion.city,
        photos: r.excursion.photos || [],
        duration_hours: r.excursion.duration_hours,
        price_per_person: r.excursion.price_per_person
      } : null
    }));

  console.log("Réservations formatées:", formattedReservations);

  return (
    <div style={{ 
      maxWidth: 1000, 
      margin: "0 auto", 
      padding: "40px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header simplifié */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 48,
        flexWrap: "wrap",
        gap: 20
      }}>
        <div>
          <p style={{ 
            fontSize: 13, 
            fontWeight: 500, 
            color: "#6B7280", 
            marginBottom: 4 
          }}>
            Mes réservations
          </p>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 600, 
            color: "#111827", 
            margin: 0
          }}>
            {formattedReservations.length} {formattedReservations.length > 1 ? "réservations" : "réservation"}
          </h1>
        </div>
        
        <Link 
          href="/touriste/itineraire"
          style={{ 
            padding: "10px 20px", 
            background: "#111827", 
            color: "white", 
            borderRadius: 30, 
            textDecoration: "none", 
            fontSize: 14, 
            fontWeight: 500, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 8,
            border: "none",
            transition: "opacity 0.2s"
          }}
        >
          <Plus size={18} /> 
          Nouvelle réservation
        </Link>
      </div>

      {/* Passer les réservations au composant client */}
      <ReservationsClient reservations={formattedReservations} />
    </div>
  );
}