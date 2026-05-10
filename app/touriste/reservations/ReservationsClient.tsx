"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { Sparkles, ArrowRight, History, Compass, RefreshCcw, Loader2, MapPin, Clock, Users, Calendar, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Reservation, TODAY } from "@/app/components/reservation/type";
import ReservationCard from "@/app/components/reservation/Reservationcard";
import CheckoutModal from "@/app/components/reservation/checkoutmodal";

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (reservations.some(r => r.status === "pending")) refreshReservations();
    }, 30000);
    return () => clearInterval(interval);
  }, [reservations, refreshReservations]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { moveExpiredToHistory(init); }, []);

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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0D9488", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Mes voyages
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F172A", margin: 0, marginBottom: 6 }}>
            Réservations
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
            Gérez et suivez vos aventures en Tunisie
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isRefreshing && (
            <span style={{ fontSize: 13, color: "#0D9488", display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Mise à jour…
            </span>
          )}
          <button
            onClick={refreshReservations}
            disabled={isRefreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 10,
              border: "1.5px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#475569", fontSize: 13, fontWeight: 600,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            <RefreshCcw size={13} style={isRefreshing ? { animation: "spin 1s linear infinite" } : {}} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {total > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            { icon: <Calendar size={16} color="#0D9488" />, num: total,     lbl: "Total",      bg: "#F0FDFA", border: "#CCFBF1", numColor: "#0D9488" },
            { icon: <AlertCircle size={16} color="#D97706" />, num: pending,   lbl: "En attente", bg: "#FFFBEB", border: "#FDE68A", numColor: "#D97706" },
            { icon: <CheckCircle2 size={16} color="#0D9488" />, num: confirmed, lbl: "Confirmées", bg: "#F0FDFA", border: "#CCFBF1", numColor: "#0D9488" },
          ].map(({ icon, num, lbl, bg, border, numColor }) => (
            <div key={lbl} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 20px", borderRadius: 12,
              background: bg, border: `1.5px solid ${border}`,
              minWidth: 140, flex: 1,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: numColor, margin: 0, lineHeight: 1 }}>{num}</p>
                <p style={{ fontSize: 12, color: "#64748B", margin: 0, marginTop: 2 }}>{lbl}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {total === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 24px",
          background: "#FFFFFF", borderRadius: 20,
          border: "1.5px solid #E2E8F0",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            border: "2px solid #99F6E4",
          }}>
            <Compass size={30} color="#0D9488" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
            Aucune réservation active
          </h3>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 32, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 32px" }}>
            Découvrez les excursions et planifiez votre prochain voyage en Tunisie
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/excursions" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 24px", background: "#0D9488", color: "white",
              borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700,
              boxShadow: "0 4px 14px rgba(13,148,136,0.3)",
            }}>
              <Sparkles size={14} /> Explorer les excursions <ArrowRight size={14} />
            </Link>
            <Link href="/touriste/historique" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 20px", background: "#FFFFFF", color: "#475569",
              border: "1.5px solid #E2E8F0", borderRadius: 12,
              textDecoration: "none", fontSize: 14, fontWeight: 600,
            }}>
              <History size={14} /> Historique
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {reservations.map((r, i) => (
            <div key={r.id} style={{ animation: `fadeUp 0.4s ease both`, animationDelay: `${i * 0.08}s` }}>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}