"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Sparkles, ArrowRight, History, Compass, RefreshCcw, Loader2,
  CheckCircle2, AlertCircle, CalendarDays,
} from "lucide-react";
import { Reservation } from "@/app/components/reservation/type";
import ReservationCard from "@/app/components/reservation/Reservationcard";
import CheckoutModal from "@/app/components/paiement/checkoutmodal";

/* ────────────────────────────────
   CSS Responsive
──────────────────────────────── */
const RESPONSIVE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .resa-wrap { font-family:'DM Sans',sans-serif; width:100%; }

  .resa-page-header {
    display:flex; justify-content:space-between; flex-wrap:wrap;
    margin-bottom:32px; gap:16px;
  }

  .resa-stats { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:32px; }

  .resa-stat-card {
    display:flex; align-items:center; gap:12px;
    padding:14px 20px; border-radius:16px;
    border:1.5px solid; flex:1; min-width:130px;
  }

  .resa-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(340px,1fr));
    gap:20px;
  }

  .resa-empty {
    text-align:center;
    padding:80px 24px;
    border-radius:24px;
    background:#fff;
    border:1px solid #E2E8F0;
  }

  .resa-refresh-btn {
    display:flex; align-items:center; gap:6px;
    padding:9px 16px;
    border-radius:10px;
    border:1px solid #2B96A8;
    background:#fff;
    cursor:pointer;
  }
`;

/* ────────────────────────────────
   Types
──────────────────────────────── */
interface Props {
  reservations: Reservation[];
  autoOpenId?: string;
}

/* ────────────────────────────────
   Helpers
──────────────────────────────── */
function isExpired(r: Reservation) {
  const time = r.time ? r.time.slice(0, 5) : "23:59";
  return new Date(`${r.date}T${time}:00`).getTime() < Date.now();
}

function hasActivePending(r: Reservation) {
  if (r.status !== "pending") return false;
  if (!r.payment_deadline) return true;
  return new Date(r.payment_deadline).getTime() > Date.now();
}

/* ────────────────────────────────
   Component
──────────────────────────────── */
export default function ReservationsClient({ reservations: init, autoOpenId }: Props) {
  const supabase = createClient();

  const [reservations, setReservations] = useState(init);
  const [checkout, setCheckout] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);

  const total = reservations.length;
  const pending = reservations.filter(r => r.status === "pending").length;
  const confirmed = reservations.filter(r => r.status === "confirmed").length;

  /* ────────────────────────────────
     Move to history (safe)
  ──────────────────────────────── */
  const moveExpiredToHistory = useCallback(async (list: Reservation[]) => {
    const expired = list.filter(r =>
      (r.payment_status === "paid" || r.status === "confirmed") &&
      isExpired(r)
    );

    for (const r of expired) {
      try {
        await supabase.from("historique_reservations").insert({
          original_reservation_id: r.id,
          booking_code: r.booking_code,
          excursion_id: r.excursion?.id,
          excursion_title: r.excursion?.title,
          excursion_city: r.excursion?.city,
          date: r.date,
          time: r.time,
          people_count: r.people_count,
          total_price: r.total_price,
          platform_fee: r.platform_fee,
          payment_status: "paid",
          payment_date: new Date().toISOString(),
        });

        await supabase
          .from("reservations")
          .update({ status: "completed" })
          .eq("id", r.id);

      } catch (e) {
        console.warn("history error:", e);
      }
    }
  }, [supabase]);

  /* ────────────────────────────────
     Handle unpaid expired
  ──────────────────────────────── */
  const handleUnpaidExpired = useCallback(async (id: string) => {
    const r = reservations.find(x => x.id === id);
    if (!r) return;

    try {
      await supabase.rpc("restore_slots_on_cancel", { p_reservation_id: id });

      await supabase
        .from("reservations")
        .update({
          status: "cancelled",
          payment_status: "expired",
        })
        .eq("id", id);

      await supabase.from("historique_reservations").insert({
        original_reservation_id: r.id,
        booking_code: r.booking_code,
        excursion_id: r.excursion?.id,
        excursion_title: r.excursion?.title,
        excursion_city: r.excursion?.city,
        date: r.date,
        time: r.time,
        people_count: r.people_count,
        total_price: r.total_price,
        payment_status: "expired",
        payment_date: new Date().toISOString(),
      });

    } catch (e) {
      console.warn(e);
    }

    setReservations(prev => prev.filter(x => x.id !== id));
  }, [reservations, supabase]);

  /* ────────────────────────────────
     Refresh
  ──────────────────────────────── */
  const refreshReservations = useCallback(async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("reservations")
        .select(`*, excursion:excursions(*)`)
        .eq("touriste_id", user.id)
        .neq("status", "cancelled")
        .gte("date", today)
        .order("date");

      if (error) throw error;

      const fresh = data || [];

      await moveExpiredToHistory(fresh);

      setReservations(fresh);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase, moveExpiredToHistory]);

  /* ────────────────────────────────
     Interval SAFE (no spam)
  ──────────────────────────────── */
  useEffect(() => {
    const hasPending = reservations.some(hasActivePending);
    if (!hasPending) return;

    const interval = setInterval(() => {
      if (reservations.some(hasActivePending)) {
        refreshReservations();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [reservations, refreshReservations]);

  /* ────────────────────────────────
     Auto open checkout
  ──────────────────────────────── */
  useEffect(() => {
    if (!autoOpenId) return;

    const target = reservations.find(r => r.id === autoOpenId);

    if (target && target.status === "pending") {
      setCheckout(target);
    }
  }, [reservations, autoOpenId]);

  /* ────────────────────────────────
     Paid handler
  ──────────────────────────────── */
  function handlePaid(id: string) {
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: "confirmed", payment_status: "paid" }
          : r
      )
    );
  }

  /* ────────────────────────────────
     UI
  ──────────────────────────────── */
  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      <div className="resa-wrap">

        {/* HEADER */}
        <div className="resa-page-header">
          <div>
            <h2>Mes réservations</h2>
          </div>

          <button className="resa-refresh-btn" onClick={refreshReservations}>
            <RefreshCcw size={14} />
            Actualiser
          </button>
        </div>

        {/* STATS */}
        <div className="resa-stats">
          <div className="resa-stat-card">Total: {total}</div>
          <div className="resa-stat-card">Pending: {pending}</div>
          <div className="resa-stat-card">Confirmées: {confirmed}</div>
        </div>

        {/* EMPTY */}
        {total === 0 ? (
          <div className="resa-empty">
            <Compass size={40} />
            <p>Aucune réservation</p>
            <Link href="/excursions">Explorer</Link>
          </div>
        ) : (
          <div className="resa-grid">
            {reservations.map(r => (
              <ReservationCard
                key={r.id}
                r={r}
                onPay={() => setCheckout(r)}
                onExpired={handleUnpaidExpired}
                onRefresh={refreshReservations}
              />
            ))}
          </div>
        )}

        {/* CHECKOUT */}
        {checkout && (
          <CheckoutModal
            reservation={checkout}
            onClose={() => setCheckout(null)}
            onPaid={handlePaid}
          />
        )}
      </div>
    </>
  );
}