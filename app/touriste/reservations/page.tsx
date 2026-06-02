import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ReservationsClient from "./ReservationsClient";
import { Suspense } from "react";
import { StripeReturnHandler } from "../../components/paiement/StripeReturnHandler";

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
  payment_deadline?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
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
  const autoOpenId = resolvedParams?.pay;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "#6B7A8D", fontSize: 14 }}>
        Veuillez vous connecter pour voir vos réservations
      </p>
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

  // ✅ LIFO: order by created_at DESC (plus récent d'abord)
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count,
      total_price, platform_fee, status, payment_status,
      created_at, payment_deadline, paid_at,
      excursion:excursions(id, title, city, photos, duration_hours, price_per_person, rating)
    `)
    .eq("touriste_id", user.id)
    .neq("status", "cancelled")
    .gte("date", today)
    .order("created_at", { ascending: false }); // ⭐ LIFO

  if (error) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "#EF4444", fontSize: 14 }}>Erreur : {error.message}</p>
    </div>
  );

  const formattedReservations: Reservation[] = (reservations || [])
    .filter(r => r.excursion !== null && r.excursion !== undefined)
    .map(r => {
      const exc = Array.isArray(r.excursion) ? r.excursion[0] : r.excursion;
      const timeNormalized = r.time ? r.time.slice(0, 5) : "";
      return {
        id: r.id,
        booking_code: r.booking_code,
        date: r.date,
        time: timeNormalized,
        people_count: r.people_count,
        total_price: r.total_price,
        platform_fee: r.platform_fee,
        status: r.status,
        payment_status: r.payment_status || null,
        payment_deadline: r.payment_deadline || null,
        paid_at: (r as any).paid_at || null,
        created_at: (r as any).created_at || null,
        excursion: exc ? {
          id: exc.id,
          title: exc.title || "Excursion inconnue",
          city: exc.city || "",
          photos: exc.photos || [],
          duration_hours: exc.duration_hours || 0,
          price_per_person: exc.price_per_person || 0,
          rating: exc.rating || 0,
        } : null,
      };
    });

  return (
    <>
      <style>{`
        .resa-page {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #F8FAFC 0%, #F0F4F8 100%);
          box-sizing: border-box;
        }
        .resa-page-inner {
          max-width: 1600px;
          margin: 0 auto;
          padding: 48px 40px 80px;
          box-sizing: border-box;
        }
        @media (max-width: 1200px) {
          .resa-page-inner { padding: 36px 32px 64px; }
        }
        @media (max-width: 900px) {
          .resa-page-inner { padding: 28px 24px 48px; }
        }
        @media (max-width: 640px) {
          .resa-page-inner { padding: 20px 16px 40px; }
        }
      `}</style>

      <div className="resa-page">
        <Suspense fallback={null}>
          <StripeReturnHandler />
        </Suspense>

        <div className="resa-page-inner">
          <ReservationsClient
            reservations={formattedReservations}
            autoOpenId={autoOpenId}
          />
        </div>
      </div>
    </>
  );
}