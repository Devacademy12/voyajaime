"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin, Clock, CalendarDays, Users, Star, Compass,
  CheckCircle, CreditCard, TrendingUp, Timer,
} from "lucide-react";
import { Reservation, STATUS_CFG, daysUntil, fmtDate } from "./type";
import styles from "@/public/style/Reservations.module.css";

interface Props {
  r: Reservation;
  onPay: () => void;
  onRefresh?: () => void;
  onExpired?: (id: string) => void;
}

export default function ReservationCard({ r, onPay, onRefresh, onExpired }: Props) {
  const exc   = r.excursion;
  const s     = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
  const photo = exc?.photos?.[0];
  const paid  = r.payment_status === "paid" || r.status === "confirmed" || r.status === "completed";
  const days  = daysUntil(r.date);

  const [timeLeftCard, setTimeLeftCard] = useState<number | null>(null);

  useEffect(() => {
    if (r.status !== "pending" || paid || !r.payment_deadline) return;
    const deadline = new Date(r.payment_deadline).getTime();
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeftCard(left);
      if (left === 0) {
        if (onRefresh) onRefresh();
        if (onExpired) onExpired(r.id);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [r.status, r.payment_deadline, paid, onRefresh, onExpired, r.id]);

  const cardUrgent = timeLeftCard !== null && timeLeftCard <= 300 && timeLeftCard > 0;
  const timerColor = cardUrgent ? "#EF4444" : "#0D9488";

  return (
    <div className={styles["rp-card"]}>

      {/* ── Image ── */}
      <div className={styles["rp-img-wrap"]}>
        {photo
          ? <img src={photo} alt={exc?.title || ""} />
          : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Compass size={40} color="rgba(0,0,0,.15)" strokeWidth={1} />
            </div>
          )
        }
        <div className={styles["rp-img-gradient"]} />

        {/* Status pill */}
        <div className={styles["rp-status"]} style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
          <span className={styles["rp-status-dot"]} style={{ background: s.dot }} />
          {s.label}
        </div>

        {/* Right badge: Paid or Days */}
        {paid ? (
          <div className={styles["rp-paid-tag"]}>
            <CheckCircle size={10} strokeWidth={2.5} /> Payée
          </div>
        ) : days >= 0 && (
          <div className={styles["rp-days-tag"]}>
            <CalendarDays size={10} />
            {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J-${days}`}
          </div>
        )}

        {/* Title overlay */}
        <div className={styles["rp-img-info"]}>
          <h3 className={styles["rp-img-title"]}>{exc?.title ?? "Excursion"}</h3>
          <div className={styles["rp-img-meta"]}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={10} />{exc?.city}
            </span>
            {exc?.duration_hours && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} />{exc.duration_hours}h
              </span>
            )}
            {exc?.rating && exc.rating > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#F59E0B" }}>
                <Star size={10} fill="#F59E0B" />{exc.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles["rp-body"]}>
        <div className={styles["rp-details"]}>
          {[
            { lbl: "Date",      val: fmtDate(r.date, true) },
            { lbl: "Heure",     val: r.time },
            { lbl: "Personnes", val: `${r.people_count}p` },
            { lbl: "Durée",     val: `${exc?.duration_hours ?? "–"}h` },
          ].map(({ lbl, val }) => (
            <div key={lbl} className={styles["rp-detail"]}>
              <p className={styles["rp-detail-lbl"]}>{lbl}</p>
              <p className={styles["rp-detail-val"]}>{val}</p>
            </div>
          ))}
        </div>

        {/* Countdown timer */}
        {timeLeftCard !== null && timeLeftCard > 0 && (
          <div className={`${styles["rp-timer-bar"]} ${cardUrgent ? styles["rp-timer-urgent"] : styles["rp-timer-normal"]}`}>
            <span style={{ fontSize: 11, fontWeight: 600, color: timerColor, display: "flex", alignItems: "center", gap: 5 }}>
              <Timer size={11} />
              {cardUrgent ? "Urgent — expiré bientôt" : "Paiement requis avant"}
            </span>
            <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 800, color: timerColor }}>
              {Math.floor(timeLeftCard / 60).toString().padStart(2, "0")}:
              {(timeLeftCard % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}

        {timeLeftCard === 0 && (
          <div style={{ padding: "9px 12px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 700 }}>Délai expiré — annulée automatiquement</span>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className={styles["rp-footer"]}>
        <div>
          <p className={styles["rp-price-label"]}>Total</p>
          <p className={styles["rp-price-amount"]}>
            {r.total_price} <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>EUR</span>
          </p>
          <p className={styles["rp-booking-code"]}>#{r.booking_code}</p>
        </div>

        {!paid && r.status !== "cancelled" && timeLeftCard !== 0 && (
          <button onClick={onPay} className={styles["rp-pay-btn"]}>
            <CreditCard size={13} strokeWidth={2} /> Payer
          </button>
        )}

        {paid && (
          <Link
            href={`/excursions/${exc?.id}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "rgba(13,148,136,.08)", color: "#0D9488", border: "1px solid rgba(13,148,136,.2)", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
          >
            <TrendingUp size={12} /> Détails
          </Link>
        )}
      </div>
    </div>
  );
}