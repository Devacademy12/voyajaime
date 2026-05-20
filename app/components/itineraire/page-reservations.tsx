"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Reservation } from "./type";
import ReservationCard from "./Reservationcard";
import CheckoutModal   from "./CheckoutModal";
import {
  Loader2, Compass, RefreshCcw, Ticket,
  CheckCircle, Clock, XCircle, CalendarDays,
} from "lucide-react";
import styles from "@/public/style/Reservations.module.css";

/* ─── Types ──────────────────────────────────────────────────────────── */

type FilterTab = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: "all",       label: "Toutes",    icon: <Ticket     size={13} /> },
  { key: "pending",   label: "En attente", icon: <Clock      size={13} /> },
  { key: "confirmed", label: "Confirmées", icon: <CheckCircle size={13} /> },
  { key: "completed", label: "Terminées",  icon: <CalendarDays size={13} /> },
  { key: "cancelled", label: "Annulées",   icon: <XCircle    size={13} /> },
];

/* ─── Inner component (uses useSearchParams) ─────────────────────────── */

function ReservationsInner() {
  const supabase     = createClient();
  const router       = useRouter();
  const searchParams = useSearchParams();

  /* ── State ── */
  const [reservations,      setReservations]      = useState<Reservation[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [refreshing,        setRefreshing]        = useState(false);
  const [activeFilter,      setActiveFilter]      = useState<FilterTab>("all");
  const [checkoutReservation, setCheckoutReservation] = useState<Reservation | null>(null);

  /* ── Charger les réservations ── */
  const fetchReservations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          excursion:excursions (
            id, title, city, duration_hours,
            price_per_person, max_people, photos, rating
          )
        `)
        .eq("touriste_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations((data as Reservation[]) || []);
    } catch (err) {
      console.error("[Reservations] fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, router]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  /* ── Auto-ouvrir si ?pay=<reservation_id> présent (Option A) ── */
  useEffect(() => {
    const payId = searchParams.get("pay");
    if (!payId || reservations.length === 0) return;

    const target = reservations.find(r => r.id === payId);
    if (target && target.payment_status !== "paid" && target.status !== "cancelled") {
      setCheckoutReservation(target);
      // Nettoyer l'URL sans recharger la page
      router.replace("/touriste/reservations", { scroll: false });
    }
  }, [searchParams, reservations, router]);

  /* ── Filtrage ── */
  const filtered = reservations.filter(r =>
    activeFilter === "all" ? true : r.status === activeFilter
  );

  /* ── Compteurs par statut ── */
  const counts: Record<FilterTab, number> = {
    all:       reservations.length,
    pending:   reservations.filter(r => r.status === "pending").length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    completed: reservations.filter(r => r.status === "completed").length,
    cancelled: reservations.filter(r => r.status === "cancelled").length,
  };

  /* ── Callbacks ── */
  const handlePay = (r: Reservation) => setCheckoutReservation(r);

  const handlePaid = (id: string) => {
    setCheckoutReservation(null);
    fetchReservations(true);
  };

  const handleExpired = (id: string) => {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status: "cancelled", payment_status: "expired" } : r)
    );
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg,#EFF9FB,#D0F0F5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Loader2 size={24} color="#2B96A8" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <p style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 500 }}>Chargement de vos réservations…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className={styles["rp-page"]}>

      {/* ── Header ── */}
      <div className={styles["rp-header"]}>
        <div>
          <h1 className={styles["rp-title"]}>Mes réservations</h1>
          <p className={styles["rp-subtitle"]}>
            {reservations.length} réservation{reservations.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => fetchReservations(true)}
          disabled={refreshing}
          className={styles["rp-refresh-btn"]}
          title="Rafraîchir"
        >
          <RefreshCcw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Actualisation…" : "Actualiser"}
        </button>
      </div>

      {/* ── Tabs filtre ── */}
      <div className={styles["rp-tabs"]}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles["rp-tab"]} ${activeFilter === tab.key ? styles["rp-tab-active"] : ""}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.icon}
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`${styles["rp-tab-count"]} ${activeFilter === tab.key ? styles["rp-tab-count-active"] : ""}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      {filtered.length === 0 ? (
        <div className={styles["rp-empty"]}>
          <div className={styles["rp-empty-icon"]}>
            <Compass size={36} color="#D1D5DB" strokeWidth={1.2} />
          </div>
          <h3 className={styles["rp-empty-title"]}>
            {activeFilter === "all" ? "Aucune réservation" : `Aucune réservation ${TABS.find(t => t.key === activeFilter)?.label.toLowerCase()}`}
          </h3>
          <p className={styles["rp-empty-text"]}>
            {activeFilter === "all"
              ? "Explorez nos excursions et réservez votre première aventure !"
              : "Changez de filtre pour voir d'autres réservations."}
          </p>
        </div>
      ) : (
        <div className={styles["rp-grid"]}>
          {filtered.map(r => (
            <ReservationCard
              key={r.id}
              r={r}
              onPay={() => handlePay(r)}
              onRefresh={() => fetchReservations(true)}
              onExpired={handleExpired}
            />
          ))}
        </div>
      )}

      {/* ── CheckoutModal (paiement Stripe) ── */}
      {checkoutReservation && (
        <CheckoutModal
          reservation={checkoutReservation}
          autoStart={false}
          onClose={() => setCheckoutReservation(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}

/* ─── Page export avec Suspense (requis pour useSearchParams) ────────── */

export default function ReservationsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ReservationsInner />
    </Suspense>
  );
}
