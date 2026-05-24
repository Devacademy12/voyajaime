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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  .rc-wrap {
    font-family: 'DM Sans', system-ui, sans-serif;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Header ── */
  .rc-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 28px;
  }
  .rc-header-title {
    font-size: clamp(20px, 3vw, 26px);
    font-weight: 700;
    color: #0F172A;
    margin: 0 0 4px;
    letter-spacing: -0.3px;
  }
  .rc-header-sub {
    font-size: 13px;
    color: #94A3B8;
    margin: 0;
  }

  /* ── Refresh btn ── */
  .rc-refresh {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1.5px solid #E2E8F0;
    border-radius: 10px;
    background: #fff;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .15s, color .15s;
    white-space: nowrap;
  }
  .rc-refresh:hover:not(:disabled) { border-color: #2B96A8; color: #2B96A8; }
  .rc-refresh:disabled { opacity: .5; cursor: not-allowed; }

  /* ── Stats ── */
  .rc-stats {
    display: flex;
    gap: 10px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .rc-stat {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 120px;
    padding: 12px 16px;
    border-radius: 14px;
    border: 1.5px solid;
  }
  .rc-stat-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .rc-stat-num {
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    margin: 0;
  }
  .rc-stat-lbl {
    font-size: 11px;
    font-weight: 600;
    color: #94A3B8;
    margin: 3px 0 0;
  }

  /* ── Grid ── */
  .rc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 18px;
  }
  .rc-grid > * { animation: fadeUp .35s ease both; }

  /* ── Empty ── */
  .rc-empty {
    padding: 72px 24px;
    text-align: center;
    background: #fff;
    border-radius: 20px;
    border: 1.5px solid #E2E8F0;
  }
  .rc-empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #F1F5F9;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
  }
  .rc-empty h3 {
    font-size: 18px;
    font-weight: 700;
    color: #0F172A;
    margin: 0 0 8px;
  }
  .rc-empty p {
    font-size: 14px;
    color: #94A3B8;
    margin: 0 0 24px;
    line-height: 1.6;
  }
  .rc-empty-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .rc-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 20px;
    background: #0F172A;
    color: #fff;
    border-radius: 10px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    transition: background .15s;
  }
  .rc-btn-primary:hover { background: #1E293B; }
  .rc-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 18px;
    background: #fff;
    color: #475569;
    border: 1.5px solid #E2E8F0;
    border-radius: 10px;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .15s;
  }
  .rc-btn-secondary:hover { border-color: #CBD5E1; }

  @media (max-width: 640px) {
    .rc-stats { gap: 8px; }
    .rc-stat  { min-width: calc(50% - 4px); padding: 10px 12px; }
    .rc-grid  { grid-template-columns: 1fr; gap: 12px; }
    .rc-empty { padding: 48px 16px; border-radius: 16px; }
  }
  @media (max-width: 380px) {
    .rc-stat { min-width: 100%; }
  }
`;

interface Props {
  reservations: Reservation[];
  autoOpenId?: string;
}

function isExpired(r: Reservation) {
  const time = r.time ? r.time.slice(0, 5) : "23:59";
  return new Date(`${r.date}T${time}:00`).getTime() < Date.now();
}

function hasActivePending(r: Reservation) {
  if (r.status !== "pending") return false;
  if (!r.payment_deadline) return true;
  return new Date(r.payment_deadline).getTime() > Date.now();
}

export default function ReservationsClient({ reservations: init, autoOpenId }: Props) {
  const supabase = createClient();

  const [reservations, setReservations] = useState(init);
  const [checkout,     setCheckout]     = useState<Reservation | null>(null);
  const [loading,      setLoading]      = useState(false);

  const total     = reservations.length;
  const pending   = reservations.filter(r => r.status === "pending").length;
  const confirmed = reservations.filter(r => r.status === "confirmed").length;

  /* ── Move expired paid reservations to history ── */
  const moveExpiredToHistory = useCallback(async (list: Reservation[]) => {
    const expired = list.filter(r =>
      (r.payment_status === "paid" || r.status === "confirmed") && isExpired(r)
    );
    for (const r of expired) {
      try {
        await supabase.from("historique_reservations").insert({
          original_reservation_id: r.id,
          booking_code:    r.booking_code,
          excursion_id:    r.excursion?.id    ?? null,
          excursion_title: r.excursion?.title ?? null,
          excursion_city:  r.excursion?.city  ?? null,
          date:            r.date,
          time:            r.time,
          people_count:    r.people_count,
          total_price:     r.total_price,
          platform_fee:    r.platform_fee,
          payment_status:  "paid",
          payment_date:    new Date().toISOString(),
          moved_to_history: true,
        });
        await supabase
          .from("reservations")
          .update({ status: "completed" })
          .eq("id", r.id)
          .neq("status", "completed");
      } catch (e) { console.warn("history:", e); }
    }
  }, [supabase]);

  /* ── Handle unpaid expired ── */
  const handleUnpaidExpired = useCallback(async (id: string) => {
    const r = reservations.find(x => x.id === id);
    if (!r) return;
    try {
      await supabase.rpc("restore_slots_on_cancel", { p_reservation_id: id });
      await supabase
        .from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", id)
        .eq("status", "pending"); // ✅ ne touche que si encore pending
      await supabase.from("historique_reservations").insert({
        original_reservation_id: r.id,
        booking_code:    r.booking_code,
        excursion_id:    r.excursion?.id    ?? null,
        excursion_title: r.excursion?.title ?? null,
        excursion_city:  r.excursion?.city  ?? null,
        date:            r.date,
        time:            r.time,
        people_count:    r.people_count,
        total_price:     r.total_price,
        platform_fee:    r.platform_fee    ?? 0,
        payment_status:  "expired",
        payment_date:    new Date().toISOString(),
        moved_to_history: true,
      });
    } catch (e) { console.warn(e); }
    setReservations(prev => prev.filter(x => x.id !== id));
  }, [reservations, supabase]);

  /* ── Refresh ── */
  const refreshReservations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("reservations")
        .select("*, excursion:excursions(id,title,city,photos,duration_hours,price_per_person,meeting_point,rating)")
        .eq("touriste_id", user.id)
        .neq("status", "cancelled")
        .gte("date", today)
        .order("date", { ascending: true });
      if (error) throw error;
      const fresh = data || [];
      await moveExpiredToHistory(fresh);
      setReservations(fresh.filter(r => r.date >= today));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [supabase, moveExpiredToHistory]);

  /* ── Interval — uniquement si pending actif ── */
  useEffect(() => {
    const hasPending = reservations.some(hasActivePending);
    if (!hasPending) return;
    const id = setInterval(() => {
      if (reservations.some(hasActivePending)) refreshReservations();
    }, 30000);
    return () => clearInterval(id);
  }, [reservations, refreshReservations]);

  /* ── Init : déplacer les expirées ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { moveExpiredToHistory(init); }, []);

  /* ── Auto-open checkout depuis ?pay= ── */
  useEffect(() => {
    if (!autoOpenId) return;
    const target = reservations.find(r => r.id === autoOpenId);
    if (target && target.status === "pending" && target.payment_status !== "paid") {
      setCheckout(target);
    }
  }, [reservations, autoOpenId]);

  function handlePaid(id: string) {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status: "confirmed", payment_status: "paid" } : r)
    );
  }

  /* ── Stats config ── */
  const stats = [
    { icon: <CalendarDays size={14} color="#2B96A8"/>, num: total,     lbl: "Total",      bg: "#F8FAFC",  border: "#E2E8F0",            color: "#0F172A" },
    { icon: <AlertCircle  size={14} color="#D97706"/>, num: pending,   lbl: "En attente", bg: "#FFFBEB",  border: "#FDE68A",            color: "#D97706" },
    { icon: <CheckCircle2 size={14} color="#0D9488"/>, num: confirmed, lbl: "Confirmées", bg: "#F0FDFA",  border: "rgba(13,148,136,.2)", color: "#0D9488" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="rc-wrap">

        {/* ── Header ── */}
        <div className="rc-header">
          <div>
            <h1 className="rc-header-title">Mes réservations</h1>
            <p className="rc-header-sub">Gérez vos excursions en Tunisie</p>
          </div>
          <button
            className="rc-refresh"
            onClick={refreshReservations}
            disabled={loading}
          >
            <RefreshCcw
              size={13}
              style={loading ? { animation: "spin 1s linear infinite" } : {}}
            />
            {loading ? "Chargement…" : "Actualiser"}
          </button>
        </div>

        {/* ── Stats ── */}
        {total > 0 && (
          <div className="rc-stats">
            {stats.map(({ icon, num, lbl, bg, border, color }) => (
              <div key={lbl} className="rc-stat" style={{ background: bg, borderColor: border }}>
                <div className="rc-stat-icon">{icon}</div>
                <div>
                  <p className="rc-stat-num" style={{ color }}>{num}</p>
                  <p className="rc-stat-lbl">{lbl}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Contenu ── */}
        {total === 0 ? (
          <div className="rc-empty">
            <div className="rc-empty-icon">
              <Compass size={26} color="#94A3B8" strokeWidth={1.5}/>
            </div>
            <h3>Aucune réservation active</h3>
            <p>Explorez les excursions disponibles et planifiez votre prochain voyage.</p>
            <div className="rc-empty-actions">
              <Link href="/excursions" className="rc-btn-primary">
                <Sparkles size={13}/> Explorer <ArrowRight size={13}/>
              </Link>
              <Link href="/touriste/historique" className="rc-btn-secondary">
                <History size={13}/> Historique
              </Link>
            </div>
          </div>
        ) : (
          <div className="rc-grid">
            {reservations.map((r, i) => (
              <div key={r.id} style={{ animationDelay: `${i * 0.06}s` }}>
                <ReservationCard
                  r={r}
                  onPay={() => setCheckout(r)}
                  onExpired={handleUnpaidExpired}
                  onRefresh={refreshReservations}
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
    </>
  );
}