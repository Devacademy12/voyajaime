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
  @keyframes fadeUp { 
    from { opacity: 0; transform: translateY(12px); } 
    to { opacity: 1; transform: translateY(0); } 
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .rc-wrap {
    font-family: 'DM Sans', system-ui, sans-serif;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Header ── */
  .rc-header {
    border-bottom: 1px solid #EBEBEB;
    padding: 28px 0 24px;
    margin-bottom: 32px;
    animation: fadeUp .35s ease both;
  }
  .rc-header-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 16px;
  }
  .rc-header-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 900;
    color: #053366;
    margin: 0 0 4px;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }
  .rc-header-sub {
    font-size: 13px;
    color: #9CA3AF;
    margin: 0;
    font-weight: 500;
  }

  /* ── Refresh btn ── */
  .rc-refresh {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border: 1.5px solid #E5E7EB;
    border-radius: 12px;
    background: #fff;
    color: #6B7280;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all .2s;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0,0,0,.02);
  }
  .rc-refresh:hover:not(:disabled) { 
    border-color: #02AFCF; 
    color: #02AFCF;
    box-shadow: 0 4px 12px rgba(2,175,207,.12);
    transform: translateY(-1px);
  }
  .rc-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Stats ── */
  .rc-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 32px;
  }
  .rc-stat {
    background: white;
    border-radius: 18px;
    border: 1px solid #EBEBEB;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
    animation: fadeUp .35s ease both;
    transition: all .22s;
  }
  .rc-stat:hover {
    box-shadow: 0 10px 32px rgba(0,0,0,.1);
    transform: translateY(-3px);
  }
  .rc-stat-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .rc-stat-num {
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
    margin: 0;
    letter-spacing: -0.3px;
    color: #111827;
  }
  .rc-stat-lbl {
    font-size: 12px;
    font-weight: 600;
    color: #9CA3AF;
    margin: 4px 0 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Grid ── */
  .rc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
  }
  .rc-grid > * { animation: fadeUp .35s ease both; }

  /* ── Empty ── */
  .rc-empty {
    padding: 80px 32px;
    text-align: center;
    background: white;
    border-radius: 24px;
    border: 1px solid #EBEBEB;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
  }
  .rc-empty-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(2,175,207,.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }
  .rc-empty h3 {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 900;
    color: #053366;
    margin: 0 0 10px;
  }
  .rc-empty p {
    font-size: 14px;
    color: #9CA3AF;
    margin: 0 0 28px;
    line-height: 1.6;
    max-width: 380px;
    margin-left: auto;
    margin-right: auto;
  }
  .rc-empty-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .rc-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #02AFCF 0%, #053366 100%);
    color: #fff;
    border-radius: 14px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    transition: all .2s;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(2,175,207,.25);
  }
  .rc-btn-primary:hover { 
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(2,175,207,.35);
  }
  .rc-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 12px 22px;
    background: white;
    color: #374151;
    border: 1.5px solid #E5E7EB;
    border-radius: 14px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    transition: all .2s;
    cursor: pointer;
  }
  .rc-btn-secondary:hover { 
    border-color: #02AFCF;
    color: #02AFCF;
    box-shadow: 0 4px 12px rgba(2,175,207,.12);
  }

  @media (max-width: 900px) {
    .rc-stats { grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .rc-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  }
  @media (max-width: 640px) {
    .rc-header { padding: 20px 0 18px; margin-bottom: 20px; }
    .rc-header-title { font-size: 22px; }
    .rc-header-inner { flex-direction: column; align-items: flex-start; gap: 12px; }
    .rc-stats { grid-template-columns: 1fr; gap: 10px; }
    .rc-stat { padding: 14px 16px; border-radius: 14px; }
    .rc-grid { grid-template-columns: 1fr; gap: 14px; }
    .rc-empty { padding: 56px 20px; border-radius: 20px; }
    .rc-empty h3 { font-size: 18px; }
    .rc-empty-actions { gap: 8px; }
    .rc-btn-primary, .rc-btn-secondary { padding: 10px 18px; font-size: 13px; }
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
        .eq("status", "pending");
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
        .order("created_at", { ascending: false });
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
    {
      icon: <CalendarDays size={18} color="#2B96A8"/>,
      num: total, lbl: "Total",
      iconBg: "rgba(43,150,168,.1)",
    },
    {
      icon: <AlertCircle size={18} color="#D97706"/>,
      num: pending, lbl: "En attente",
      iconBg: "rgba(217,119,6,.1)",
    },
    {
      icon: <CheckCircle2 size={18} color="#10B981"/>,
      num: confirmed, lbl: "Confirmées",
      iconBg: "rgba(16,185,129,.1)",
    },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="rc-wrap">

        {/* ── Header ── */}
        <div className="rc-header">
          <div className="rc-header-inner">
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
        </div>

        {/* ── Stats ── */}
        {total > 0 && (
          <div className="rc-stats">
            {stats.map(({ icon, num, lbl, iconBg }, i) => (
              <div key={lbl} className="rc-stat" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="rc-stat-icon" style={{ background: iconBg }}>
                  {icon}
                </div>
                <div>
                  <p className="rc-stat-num">{num}</p>
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
              <Compass size={28} color="#02AFCF" strokeWidth={1.5}/>
            </div>
            <h3>Aucune réservation active</h3>
            <p>Explorez les excursions disponibles et planifiez votre prochain voyage en Tunisie.</p>
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
