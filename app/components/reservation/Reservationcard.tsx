"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Clock, CalendarDays, Star, Compass,
  CheckCircle, CreditCard, TrendingUp, Timer, Trash2,
} from "lucide-react";

import { Reservation, STATUS_CFG, daysUntil, fmtDate } from "./type";
import CancellationModal from "./CancellationModal";
import styles from "@/public/style/Reservations.module.css";

interface Props {
  r: Reservation;
  onPay: () => void;
  onRefresh?: () => void;
  onExpired?: (id: string) => void;
}

export default function ReservationCard({ r, onPay, onRefresh, onExpired }: Props) {
  const exc = r.excursion;
  const s = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
  const photo = exc?.photos?.[0];

  const paid =
    r.payment_status === "paid" ||
    r.status === "confirmed" ||
    r.status === "completed";

  const days = daysUntil(r.date);

  const [timeLeftCard, setTimeLeftCard] = useState<number | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  // ✅ STOP DOUBLE CALL
  const expiredTriggered = useRef(false);

  useEffect(() => {
    if (r.status !== "pending" || paid || !r.payment_deadline) return;

    const deadline = new Date(r.payment_deadline).getTime();

    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeftCard(left);

      // ✅ ONLY ONCE
      if (left === 0 && !expiredTriggered.current) {
        expiredTriggered.current = true;

        // refresh UI
        onRefresh?.();

        // notify parent ONCE
        onExpired?.(r.id);
      }
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [r.status, r.payment_deadline, paid, r.id, onRefresh, onExpired]);

  const cardUrgent =
    timeLeftCard !== null && timeLeftCard <= 300 && timeLeftCard > 0;

  const timerColor = cardUrgent ? "#EF4444" : "#0D9488";

  return (
    <div className={styles["rp-card"]}>

      {/* IMAGE */}
      <div className={styles["rp-img-wrap"]}>
        {photo ? (
          <img src={photo} alt={exc?.title || ""} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Compass size={40} color="rgba(0,0,0,.15)" />
          </div>
        )}

        <div className={styles["rp-img-gradient"]} />

        {/* STATUS */}
        <div
          className={styles["rp-status"]}
          style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
        >
          <span className={styles["rp-status-dot"]} style={{ background: s.dot }} />
          {s.label}
        </div>

        {/* PAID / DAYS */}
        {paid ? (
          <div className={styles["rp-paid-tag"]}>
            <CheckCircle size={10} /> Payée
          </div>
        ) : days >= 0 ? (
          <div className={styles["rp-days-tag"]}>
            <CalendarDays size={10} />
            {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J-${days}`}
          </div>
        ) : null}

        {/* TITLE */}
        <div className={styles["rp-img-info"]}>
          <h3 className={styles["rp-img-title"]}>
            {exc?.title ?? "Excursion"}
          </h3>

          <div className={styles["rp-img-meta"]}>
            <span><MapPin size={10} /> {exc?.city}</span>
            <span><Clock size={10} /> {exc?.duration_hours}h</span>
            {exc?.rating ? (
              <span style={{ color: "#F59E0B" }}>
                <Star size={10} /> {exc.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className={styles["rp-body"]}>
        <div className={styles["rp-details"]}>
          {[
            { lbl: "Date", val: fmtDate(r.date, true) },
            { lbl: "Heure", val: r.time },
            { lbl: "Personnes", val: `${r.people_count}p` },
            { lbl: "Durée", val: `${exc?.duration_hours ?? "–"}h` },
          ].map((d) => (
            <div key={d.lbl} className={styles["rp-detail"]}>
              <p>{d.lbl}</p>
              <p>{d.val}</p>
            </div>
          ))}
        </div>

        {/* TIMER */}
        {timeLeftCard !== null && timeLeftCard > 0 && (
          <div
            className={styles["rp-timer-bar"]}
            style={{ color: timerColor }}
          >
            <span>
              <Timer size={11} />{" "}
              {cardUrgent ? "Urgent" : "Paiement requis"}
            </span>

            <span style={{ fontFamily: "monospace" }}>
              {String(Math.floor(timeLeftCard / 60)).padStart(2, "0")}:
              {String(timeLeftCard % 60).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* EXPIRED */}
        {timeLeftCard === 0 && (
          <div style={{ color: "#EF4444", fontWeight: 700 }}>
            Délai expiré
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className={styles["rp-footer"]}>
        <div>
          <p>Total</p>
          <p>
            {r.total_price} <span>EUR</span>
          </p>
          <p>#{r.booking_code}</p>
        </div>

        {!paid && r.status !== "cancelled" && timeLeftCard !== 0 && (
          <button onClick={onPay} className={styles["rp-pay-btn"]}>
            <CreditCard size={13} /> Payer
          </button>
        )}

        {paid && (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/excursions/${exc?.id}`}>
              <TrendingUp size={12} /> Détails
            </Link>

            <button onClick={() => setShowCancellationModal(true)}>
              <Trash2 size={12} /> Annuler
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showCancellationModal && (
        <CancellationModal
          reservation={r}
          onClose={() => setShowCancellationModal(false)}
          onCancelled={() => {
            setShowCancellationModal(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}