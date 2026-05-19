"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Sparkles, ArrowRight, History, Compass, RefreshCcw, Loader2,
  MapPin, Clock, Users, Calendar, CreditCard, CheckCircle2,
  AlertCircle, CalendarDays, Coins, Bot, PenLine,
} from "lucide-react";
import { Reservation, TODAY } from "@/app/components/reservation/type";
import ReservationCard from "@/app/components/reservation/Reservationcard";
import CheckoutModal from "@/app/components/paiement/checkoutmodal";

/* ─────────────────────────────────────────
   Responsive CSS
───────────────────────────────────────── */
const RESPONSIVE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }

  /* ── Wrapper ── */
  .resa-wrap {
    font-family: 'DM Sans', system-ui, sans-serif;
    width: 100%;
    box-sizing: border-box;
  }

  /* ── Page header ── */
  .resa-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  /* ── Stats bar ── */
  .resa-stats {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }
  .resa-stat-card {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; border-radius: 16px;
    min-width: 130px; flex: 1;
    border: 1.5px solid;
    box-sizing: border-box;
  }
  .resa-stat-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: #FFFFFF;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(5,51,102,0.08);
  }

  /* ── Grid ── */
  .resa-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }
  .resa-grid-item { animation: fadeUp 0.4s ease both; }

  /* ── Empty state ── */
  .resa-empty {
    text-align: center;
    padding: 80px 24px;
    background: #FFFFFF;
    border-radius: 24px;
    border: 1.5px solid #E2E8F0;
  }
  .resa-empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #EFF9FB 0%, #D0F0F5 100%);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    border: 2px solid rgba(43,150,168,.25);
  }

  /* ── Refresh button ── */
  .resa-refresh-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid rgba(43,150,168,.25);
    background: #FFFFFF;
    color: #2B96A8; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all .15s;
  }
  .resa-refresh-btn:hover  { background: rgba(43,150,168,.06); border-color: #2B96A8; }
  .resa-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── CTA buttons (empty state) ── */
  .resa-cta-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 24px;
    background: linear-gradient(135deg, #2B96A8, #053366);
    color: white; border-radius: 40px;
    text-decoration: none; font-size: 14px; font-weight: 700;
    box-shadow: 0 4px 16px rgba(43,150,168,.35);
    transition: all .18s;
  }
  .resa-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(43,150,168,.4); }

  .resa-cta-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 20px;
    background: #FFFFFF; color: #6B7A8D;
    border: 1.5px solid rgba(5,51,102,.12);
    border-radius: 40px;
    text-decoration: none; font-size: 14px; font-weight: 600;
    transition: all .15s;
  }
  .resa-cta-secondary:hover { background: rgba(5,51,102,.04); color: #053366; }

  /* ────────────────────────────────
     TABLET  ≤ 900px
  ──────────────────────────────── */
  @media (max-width: 900px) {
    .resa-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
  }

  /* ────────────────────────────────
     MOBILE  ≤ 640px
  ──────────────────────────────── */
  @media (max-width: 640px) {
    .resa-page-header { margin-bottom: 20px; }

    /* Stats : 2 par ligne */
    .resa-stats { gap: 8px; margin-bottom: 20px; }
    .resa-stat-card { padding: 10px 14px; min-width: calc(50% - 4px); }
    .resa-stat-icon { width: 30px; height: 30px; border-radius: 8px; }

    /* Grid : 1 colonne */
    .resa-grid { grid-template-columns: 1fr; gap: 12px; }

    /* Empty state */
    .resa-empty { padding: 48px 16px; border-radius: 16px; }
    .resa-empty-icon { width: 56px; height: 56px; }

    /* Refresh btn compact */
    .resa-refresh-btn { padding: 7px 12px; font-size: 12px; }

    /* CTA stack */
    .resa-cta-row { flex-direction: column; align-items: stretch !important; }
    .resa-cta-primary,
    .resa-cta-secondary { justify-content: center; width: 100%; box-sizing: border-box; }
  }

  /* ────────────────────────────────
     VERY SMALL  ≤ 380px
  ──────────────────────────────── */
  @media (max-width: 380px) {
    .resa-stat-card { padding: 8px 10px; min-width: 100%; }
    .resa-stats { flex-direction: column; }
  }
`;

interface Props {
  reservations: Reservation[];
  autoOpenId?: string;
}

// ✅ Helper : vérifier si une réservation est vraiment expirée (date+time passée)
function isReservationDateTimePassed(r: Reservation): boolean {
  const timeStr = r.time
    ? (typeof r.time === "string" ? r.time.slice(0, 5) : "23:59")
    : "23:59";
  const resaDateTime = new Date(`${r.date}T${timeStr}:00`).getTime();
  return resaDateTime < Date.now();
}

// ✅ Helper : vérifier si la deadline de paiement est dépassée
function isPaymentDeadlinePassed(r: Reservation): boolean {
  if (!r.payment_deadline) return false;
  return new Date(r.payment_deadline).getTime() < Date.now();
}

export default function ReservationsClient({ reservations: init, autoOpenId }: Props) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(init);
  const [checkout,     setCheckout]     = useState<Reservation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const total     = reservations.length;
  const pending   = reservations.filter(r => r.status === "pending").length;
  const confirmed = reservations.filter(r => r.status === "confirmed").length;

  /* ── Move expired PAID reservations to history ── */
  const moveExpiredToHistory = useCallback(async (resas: Reservation[]) => {
    // ✅ CORRIGÉ : vérifier date ET heure, pas seulement la date
    const expired = resas.filter(r => {
      const isPaid =
        r.payment_status === "paid" ||
        r.status === "confirmed" ||
        r.status === "completed";
      if (!isPaid) return false;
      return isReservationDateTimePassed(r);
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

  /* ── Handle unpaid expired (deadline 1h dépassée) ── */
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

  /* ── Refresh ── */
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
      // ✅ CORRIGÉ : ne pas ouvrir si déjà payé OU déjà confirmé OU deadline dépassée
      if (
        target &&
        target.payment_status !== "paid" &&
        target.status !== "cancelled" &&
        target.status !== "confirmed" &&       // ✅ AJOUTÉ
        !isPaymentDeadlinePassed(target)       // ✅ AJOUTÉ
      ) {
        setCheckout(target);
      }
    } else {
      // ✅ CORRIGÉ : ne pas ouvrir le checkout si deadline dépassée
      const latestUnpaid = reservations
        .filter(r => {
          if (r.status !== "pending") return false;
          if (r.payment_status === "paid") return false;
          // Ne pas ouvrir si la deadline est passée
          if (isPaymentDeadlinePassed(r)) return false;
          return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latestUnpaid) setCheckout(latestUnpaid);
    }
  }, [reservations, autoOpenId]);

  function handlePaid(id: string) {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, payment_status: "paid", status: "confirmed" } : r)
    );
    setCheckout(null);
    setTimeout(() => refreshReservations(), 2000);
  }

  /* ── Stats config ── */
  const stats = [
    {
      icon: <CalendarDays size={15} color="#2B96A8" />,
      num: total, lbl: "Total",
      bg: "#EFF9FB", border: "rgba(43,150,168,.20)", numColor: "#053366",
    },
    {
      icon: <AlertCircle size={15} color="#D97706" />,
      num: pending, lbl: "En attente",
      bg: "#FFFBEB", border: "#FDE68A", numColor: "#D97706",
    },
    {
      icon: <CheckCircle2 size={15} color="#02AFCF" />,
      num: confirmed, lbl: "Confirmées",
      bg: "#EFF9FB", border: "rgba(2,175,207,.25)", numColor: "#02AFCF",
    },
  ];

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      <div className="resa-wrap">

        {/* ── Page header ── */}
        <div className="resa-page-header">
          <div>
            <p style={{
              fontSize: 12, fontWeight: 700, color: "#2B96A8",
              letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 6, margin: "0 0 6px",
            }}>
              Mes voyages
            </p>
            <h1 style={{
              fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700,
              color: "#053366", margin: "0 0 6px",
            }}>
              Réservations
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
              Gérez et suivez vos aventures en Tunisie
            </p>
          </div>

          {/* Refresh */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isRefreshing && (
              <span style={{
                fontSize: 12, color: "#2B96A8",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                Mise à jour…
              </span>
            )}
            <button
              className="resa-refresh-btn"
              onClick={refreshReservations}
              disabled={isRefreshing}
            >
              <RefreshCcw
                size={13}
                style={isRefreshing ? { animation: "spin 1s linear infinite" } : {}}
              />
              Actualiser
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        {total > 0 && (
          <div className="resa-stats">
            {stats.map(({ icon, num, lbl, bg, border, numColor }) => (
              <div
                key={lbl}
                className="resa-stat-card"
                style={{ background: bg, borderColor: border }}
              >
                <div className="resa-stat-icon">{icon}</div>
                <div>
                  <p style={{
                    fontSize: 22, fontWeight: 800,
                    color: numColor, margin: 0, lineHeight: 1,
                  }}>
                    {num}
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: "3px 0 0", fontWeight: 600 }}>
                    {lbl}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {total === 0 ? (
          <div className="resa-empty">
            <div className="resa-empty-icon">
              <Compass size={28} color="#2B96A8" strokeWidth={1.5} />
            </div>
            <h3 style={{
              fontSize: "clamp(17px,4vw,20px)", fontWeight: 700,
              color: "#053366", marginBottom: 10,
            }}>
              Aucune réservation active
            </h3>
            <p style={{
              fontSize: 14, color: "#9CA3AF",
              lineHeight: 1.7, maxWidth: 340,
              margin: "0 auto 32px",
            }}>
              Découvrez les excursions et planifiez votre prochain voyage en Tunisie
            </p>
            <div
              className="resa-cta-row"
              style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
            >
              <Link href="/excursions" className="resa-cta-primary">
                <Sparkles size={14} /> Explorer les excursions <ArrowRight size={14} />
              </Link>
              <Link href="/touriste/historique" className="resa-cta-secondary">
                <History size={14} /> Historique
              </Link>
            </div>
          </div>
        ) : (
          <div className="resa-grid">
            {reservations.map((r, i) => (
              <div
                key={r.id}
                className="resa-grid-item"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
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
    </>
  );
}