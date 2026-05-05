"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { Sparkles, ArrowRight, History, Compass, RefreshCcw, Loader2 } from "lucide-react";
import { Reservation, TODAY } from "@/app/components/reservation/type";
import ReservationCard from "@/app/components/reservation/Reservationcard";
import CheckoutModal from "@/app/components/reservation/checkoutmodal";
import styles from "@/app/components/reservation/Reservations.module.css";

interface Props {
  reservations: Reservation[];
  autoOpenId?: string;
}

export default function ReservationsClient({ reservations: init, autoOpenId }: Props) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(init);
  const [checkout,     setCheckout]     = useState<Reservation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const total     = reservations.length;
  const pending   = reservations.filter(r => r.status === "pending").length;
  const confirmed = reservations.filter(r => r.status === "confirmed").length;

  // ── Move paid past reservations to history ────────────────────────────
  const moveExpiredToHistory = useCallback(async (resas: Reservation[]) => {
    const expired = resas.filter(r => {
      const isPaid = r.payment_status === "paid" || r.status === "confirmed" || r.status === "completed";
      return isPaid && r.date < TODAY;
    });
    for (const r of expired) {
      try {
        const exc = r.excursion;
        await supabase.from("historique_reservations").insert({
          original_reservation_id: r.id,
          booking_code:    r.booking_code,
          excursion_id:    exc?.id    || null,
          excursion_title: exc?.title || null,
          excursion_city:  exc?.city  || null,
          date: r.date, time: r.time,
          people_count: r.people_count,
          total_price: r.total_price,
          platform_fee: r.platform_fee,
          payment_method: "confirmed",
          payment_status: "paid",
          payment_date: new Date().toISOString(),
          moved_to_history: true,
        });
        await supabase.from("reservations")
          .update({ status: "completed" })
          .eq("id", r.id)
          .neq("status", "completed");
      } catch (e) { console.warn("moveExpiredToHistory:", e); }
    }
  }, [supabase]);

  // ── Handle unpaid expired reservations ───────────────────────────────
  const handleUnpaidExpired = useCallback(async (reservationId: string) => {
    const r = reservations.find(res => res.id === reservationId);
    if (!r) return;
    try {
      await supabase.rpc("restore_slots_on_cancel", { p_reservation_id: reservationId });
      await supabase.from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", reservationId).eq("status", "pending");
      const exc = r.excursion;
      await supabase.from("historique_reservations").insert({
        original_reservation_id: r.id,
        booking_code:    r.booking_code,
        excursion_id:    exc?.id    || null,
        excursion_title: exc?.title || null,
        excursion_city:  exc?.city  || null,
        date: r.date, time: r.time,
        people_count: r.people_count,
        total_price: r.total_price,
        platform_fee: r.platform_fee,
        payment_method: null,
        payment_status: "expired",
        payment_date: new Date().toISOString(),
        moved_to_history: true,
      });
    } catch (e) { console.warn("handleUnpaidExpired:", e); }
    setTimeout(() => {
      setReservations(prev => prev.filter(res => res.id !== reservationId));
    }, 3000);
  }, [reservations, supabase]);

  // ── Refresh ───────────────────────────────────────────────────────────
  const refreshReservations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("reservations")
        .select("*, excursion:excursions(id, title, city, photos, duration_hours, price_per_person, meeting_point, rating)")
        .eq("touriste_id", user.id)
        .neq("status", "cancelled")
        .gte("date", today)
        .order("date", { ascending: true });
      if (error) throw error;
      const fresh = data || [];
      await moveExpiredToHistory(fresh);
      setReservations(fresh.filter(r => r.date >= today));
    } catch (err) {
      console.error("Erreur refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase, moveExpiredToHistory]);

  // Auto-refresh every 30s when pending reservations exist
  useEffect(() => {
    const interval = setInterval(() => {
      if (reservations.some(r => r.status === "pending")) refreshReservations();
    }, 30000);
    return () => clearInterval(interval);
  }, [reservations, refreshReservations]);

  // Move past reservations on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { moveExpiredToHistory(init); }, []);

  // Auto-open checkout
  useEffect(() => {
    if (autoOpenId) {
      const target = reservations.find(r => r.id === autoOpenId);
      if (target && target.payment_status !== "paid" && target.status !== "cancelled") setCheckout(target);
    } else {
      const latestUnpaid = reservations
        .filter(r => r.status === "pending" && !r.payment_status)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latestUnpaid) setCheckout(latestUnpaid);
    }
  }, [reservations, autoOpenId]);

  function handlePaid(id: string) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, payment_status: "paid", status: "confirmed" } : r));
    setCheckout(null);
    setTimeout(() => refreshReservations(), 2000);
  }

  return (
    <div className={styles["rp-root"]}>

      {/* ── Header ── */}
      <div className={styles["rp-header"]}>
        <div>
          <p className={styles["rp-eyebrow"]}>Mes voyages</p>
          <h1 className={styles["rp-title"]}>Réservations</h1>
          <p className={styles["rp-subtitle"]}>Gérez et suivez vos aventures en Tunisie</p>
        </div>
        <button onClick={refreshReservations} disabled={isRefreshing} className={styles["rp-refresh-btn"]}>
          <RefreshCcw size={13} className={isRefreshing ? styles["spin"] : ""} /> Actualiser
        </button>
      </div>

      {/* ── Stats bar ── */}
      {total > 0 && (
        <div className={styles["rp-stats"]}>
          {[
            { icon: "🗺️", num: total,     lbl: "Total",      color: "#0D9488" },
            { icon: "⏳",  num: pending,   lbl: "En attente", color: "#F59E0B" },
            { icon: "✅",  num: confirmed, lbl: "Confirmées", color: "#0D9488" },
          ].map(({ icon, num, lbl, color }) => (
            <div key={lbl} className={styles["rp-stat"]}>
              <span className={styles["rp-stat-icon"]}>{icon}</span>
              <div>
                <p className={styles["rp-stat-num"]} style={{ color }}>{num}</p>
                <p className={styles["rp-stat-label"]}>{lbl}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Refreshing toast ── */}
      {isRefreshing && (
        <div className={styles["rp-toast"]}>
          <Loader2 size={13} className={styles["spin"]} /> Mise à jour…
        </div>
      )}

      {/* ── Empty state ── */}
      {total === 0 ? (
        <div className={styles["rp-empty"]}>
          <div className={styles["rp-empty-ring"]}>
            <Compass size={32} color="#0D9488" strokeWidth={1.5} />
          </div>
          <h3 className={styles["rp-empty-title"]}>Aucune réservation active</h3>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 32, lineHeight: 1.7 }}>
            Découvrez les excursions et planifiez votre prochain voyage
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/excursions" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#0D9488", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              <Sparkles size={15} /> Explorer les excursions <ArrowRight size={14} />
            </Link>
            <Link href="/touriste/historique" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", background: "#FFFFFF", color: "#475569", border: "1px solid #E2E8F0", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              <History size={14} /> Historique
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles["rp-grid"]}>
          {reservations.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * .08}s` }}>
              <ReservationCard
                r={r}
                onPay={() => setCheckout(r)}
                onRefresh={refreshReservations}
                onExpired={handleUnpaidExpired}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Checkout modal ── */}
      {checkout && (
        <CheckoutModal
          reservation={checkout}
          onClose={() => setCheckout(null)}
          onPaid={handlePaid}
          autoStart={!!autoOpenId && checkout.id === autoOpenId}
        />
      )}
    </div>
  );
}