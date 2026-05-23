import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ReservationsClient from "./ReservationsClient";
import { Suspense } from "react";
import { StripeReturnHandler } from "../../components/paiement/StripeReturnHandler";

type Reservation = {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
  status: string; payment_status: string | null;
  payment_deadline?: string | null;
  paid_at?: string | null;           // ✅ AJOUTÉ
  excursion: {
    id: string; title: string; city: string; photos: string[];
    duration_hours: number; price_per_person: number; rating?: number;
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
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "#6B7A8D", fontSize: 14 }}>
        Veuillez vous connecter pour voir vos réservations
      </p>
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

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
    .order("date", { ascending: true });

  if (error) return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <p style={{ color: "#EF4444", fontSize: 14 }}>Erreur : {error.message}</p>
    </div>
  );

  const reservationIds = (reservations || []).map((r) => r.id);
  const { data: paiements } = reservationIds.length > 0
    ? await supabase
        .from("paiements")
        .select("reservation_id, status, paid_at")
        .in("reservation_id", reservationIds)
    : { data: [] };

  const paidMap = new Map<string, { status: string; paid_at: string | null }>();
  (paiements || []).forEach((p: any) => {
    if (p?.reservation_id && p.status === "paid") {
      paidMap.set(p.reservation_id, {
        status: p.status,
        paid_at: p.paid_at ?? null,
      });
    }
  });

  const formattedReservations: Reservation[] = (reservations || [])
    .filter(r => r.excursion !== null && r.excursion !== undefined)
    .map(r => {
      const excursionData = Array.isArray(r.excursion) ? r.excursion[0] : r.excursion;
      const paymentRow = paidMap.get(r.id);
      const isPaid = r.payment_status === "paid" || paymentRow?.status === "paid";
      return {
        id: r.id,
        booking_code: r.booking_code,
        date: r.date,
        time: r.time,
        people_count: r.people_count,
        total_price: r.total_price,
        platform_fee: r.platform_fee,
        status: isPaid && r.status === "pending" ? "confirmed" : r.status,
        payment_status: isPaid ? "paid" : (r.payment_status || null),
        payment_deadline: r.payment_deadline || null,
        paid_at: (r as any).paid_at || paymentRow?.paid_at || null,
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
    <>
      {/* ── Responsive wrapper styles ── */}
      <style>{`
        .resa-page-wrap {
          width: 100%;
          background: #F8FAFC;
          min-height: 100vh;
          position: relative;
          padding: 36px 0 60px;
          box-sizing: border-box;
        }
        @media (max-width: 900px) {
          .resa-page-wrap { padding: 24px 0 48px; }
        }
        @media (max-width: 640px) {
          .resa-page-wrap { padding: 16px 0 40px; }
        }
      `}</style>

      <div className="resa-page-wrap">
        <Suspense fallback={null}>
          <StripeReturnHandler />
        </Suspense>

        <ReservationsClient
          reservations={formattedReservations}
          autoOpenId={autoOpenId}
        />
      </div>
    </>
  );
}