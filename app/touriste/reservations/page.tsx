import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import ReservationsClient from "./ReservationsClient";

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

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count,
      total_price, platform_fee, status, created_at,
      excursion:excursions (title, city, photos, duration_hours, price_per_person)
    `)
    .eq("touriste_id", user.id)
    .order("created_at", { ascending: false });

  let paymentStatuses: Record<string, string> = {};
  try {
    const { data: ps } = await supabase
      .from("reservations")
      .select("id, payment_status")
      .eq("touriste_id", user.id);
    if (ps) ps.forEach((r: { id: string; payment_status?: string | null }) => {
      if (r.payment_status) paymentStatuses[r.id] = r.payment_status;
    });
  } catch (_) {}

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <p style={{ color: "#EF4444", marginBottom: 8 }}>Erreur lors du chargement des réservations</p>
        <p style={{ fontSize: 14, color: "#6B7280" }}>{error.message}</p>
      </div>
    );
  }

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
        price_per_person: r.excursion.price_per_person,
      } : null,
    }));

  const total = formattedReservations.length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#2B96A8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            MON ESPACE
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#111827", margin: 0 }}>Mes réservations</h1>
        </div>

        <Link
          href="/touriste/itineraire"
          style={{
            padding: "10px 22px",
            background: "#2B96A8",
            color: "white",
            borderRadius: 30,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Plus size={16} />
          Nouvelle réservation
        </Link>
      </div>

      {/* ── Count line ── */}
      <p style={{ fontSize: 14, color: "#6B7280", display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
        <CalendarDays size={14} style={{ color: "#2B96A8" }} />
        <strong style={{ color: "#111827" }}>{total}</strong>
        {total > 1 ? " réservations" : " réservation"}
      </p>

      {/* ── List ── */}
      <ReservationsClient reservations={formattedReservations} />
    </div>
  );
}