"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Clock, CalendarDays, Star, Compass,
  CheckCircle, CreditCard, TrendingUp, Timer, Trash2, Users,
} from "lucide-react";

import { Reservation, STATUS_CFG, daysUntil, fmtDate } from "./type";
import CancellationModal from "./CancellationModal";

const CARD_CSS = `
  @keyframes rc-pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes rc-urgent { 0%,100%{background:#FEF2F2} 50%{background:#FEE2E2} }

  .rp-card {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #fff;
    border-radius: 18px;
    border: 1.5px solid #E2E8F0;
    overflow: hidden;
    transition: box-shadow .2s, border-color .2s, transform .2s;
    display: flex;
    flex-direction: column;
  }
  .rp-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,.09);
    border-color: #CBD5E1;
    transform: translateY(-2px);
  }

  /* ── Image ── */
  .rp-img {
    position: relative;
    height: 180px;
    overflow: hidden;
    background: #F1F5F9;
    flex-shrink: 0;
  }
  .rp-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .4s ease;
  }
  .rp-card:hover .rp-img img { transform: scale(1.04); }
  .rp-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.1) 55%, transparent 100%);
  }
  .rp-img-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* badges top */
  .rp-badges-top {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 6px;
  }
  .rp-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    backdrop-filter: blur(6px);
    letter-spacing: .02em;
  }
  .rp-status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    animation: rc-pulse 2.5s ease infinite;
  }
  .rp-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    backdrop-filter: blur(6px);
  }
  .rp-tag-paid  { background: rgba(13,148,136,.88); color: #fff; }
  .rp-tag-days  { background: rgba(15,23,42,.75);   color: #fff; }

  /* title over image */
  .rp-img-bottom {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 14px 14px 12px;
  }
  .rp-img-title {
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 5px;
    line-height: 1.25;
    text-shadow: 0 1px 4px rgba(0,0,0,.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rp-img-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .rp-img-meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: rgba(255,255,255,.85);
    font-weight: 500;
  }

  /* ── Body ── */
  .rp-body {
    padding: 14px 16px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  /* Info row — compact inline */
  .rp-info-row {
    display: flex;
    align-items: center;
    gap: 0;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    overflow: hidden;
  }
  .rp-info-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 9px 6px;
    gap: 3px;
    position: relative;
  }
  .rp-info-item + .rp-info-item::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 1px;
    background: #E2E8F0;
  }
  .rp-info-lbl {
    font-size: 10px;
    font-weight: 600;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: .05em;
    white-space: nowrap;
  }
  .rp-info-val {
    font-size: 13px;
    font-weight: 700;
    color: #0F172A;
    white-space: nowrap;
  }
  .rp-info-icon {
    color: #94A3B8;
    flex-shrink: 0;
  }

  /* Timer bar */
  .rp-timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
  }
  .rp-timer-normal  { background: #F0FDFA; color: #0D9488; border: 1px solid #CCFBF1; }
  .rp-timer-urgent  { background: #FEF2F2; color: #EF4444; border: 1px solid #FEE2E2; animation: rc-urgent 1.5s ease infinite; }
  .rp-timer-expired { background: #FEF2F2; color: #EF4444; border: 1px solid #FEE2E2; }
  .rp-timer-left  { display: flex; align-items: center; gap: 5px; }
  .rp-timer-clock { font-family: monospace; font-size: 13px; letter-spacing: .05em; }

  /* ── Footer ── */
  .rp-footer {
    padding: 12px 16px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid #F1F5F9;
    margin-top: 12px;
  }
  .rp-footer-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .rp-price {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .rp-price-amount {
    font-size: 18px;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.3px;
  }
  .rp-price-currency {
    font-size: 12px;
    font-weight: 600;
    color: #64748B;
  }
  .rp-booking-code {
    font-size: 10.5px;
    font-weight: 600;
    color: #94A3B8;
    font-family: 'Courier New', monospace;
    letter-spacing: .04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  /* Action buttons */
  .rp-footer-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .rp-btn-pay {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    background: #0D9488;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .15s, transform .1s;
    white-space: nowrap;
  }
  .rp-btn-pay:hover { background: #0F766E; transform: translateY(-1px); }

  .rp-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px; height: 34px;
    border-radius: 9px;
    border: 1.5px solid #E2E8F0;
    background: #fff;
    color: #475569;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color .15s, color .15s, background .15s;
    text-decoration: none;
    flex-shrink: 0;
  }
  .rp-btn-icon:hover { border-color: #CBD5E1; background: #F8FAFC; color: #0F172A; }
  .rp-btn-icon-danger:hover { border-color: #FCA5A5; background: #FEF2F2; color: #EF4444; }
`;

interface Props {
  r: Reservation;
  onPay: () => void;
  onRefresh?: () => void;
  onExpired?: (id: string) => void;
}

export default function ReservationCard({ r, onPay, onRefresh, onExpired }: Props) {
  const exc = r.excursion;
  const s   = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
  const photo = exc?.photos?.[0];

  const paid =
    r.payment_status === "paid" ||
    r.status === "confirmed" ||
    r.status === "completed";

  const days = daysUntil(r.date);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const expiredTriggered = useRef(false);

  useEffect(() => {
    if (r.status !== "pending" || paid || !r.payment_deadline) return;
    const deadline = new Date(r.payment_deadline).getTime();
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0 && !expiredTriggered.current) {
        expiredTriggered.current = true;
        onRefresh?.();
        onExpired?.(r.id);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [r.status, r.payment_deadline, paid, r.id, onRefresh, onExpired]);

  const urgent  = timeLeft !== null && timeLeft <= 300 && timeLeft > 0;
  const expired = timeLeft === 0;

  const infoItems = [
    {
      icon: <CalendarDays size={12} className="rp-info-icon" />,
      lbl: "Date",
      val: fmtDate(r.date, true),
    },
    {
      icon: <Clock size={12} className="rp-info-icon" />,
      lbl: "Heure",
      val: r.time,
    },
    {
      icon: <Users size={12} className="rp-info-icon" />,
      lbl: "Personnes",
      val: `${r.people_count}`,
    },
    {
      icon: <Clock size={12} className="rp-info-icon" />,
      lbl: "Durée",
      val: `${exc?.duration_hours ?? "–"}h`,
    },
  ];

  return (
    <>
      <style>{CARD_CSS}</style>

      <div className="rp-card">

        {/* ── Image ── */}
        <div className="rp-img">
          {photo
            ? <img src={photo} alt={exc?.title || ""} />
            : <div className="rp-img-empty"><Compass size={36} color="rgba(0,0,0,.15)" /></div>
          }
          <div className="rp-img-overlay" />

          {/* Badges top */}
          <div className="rp-badges-top">
            <div
              className="rp-status-pill"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
            >
              <span className="rp-status-dot" style={{ background: s.dot }} />
              {s.label}
            </div>

            {paid ? (
              <div className="rp-tag rp-tag-paid">
                <CheckCircle size={10} /> Payée
              </div>
            ) : days >= 0 ? (
              <div className="rp-tag rp-tag-days">
                <CalendarDays size={10} />
                {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J-${days}`}
              </div>
            ) : null}
          </div>

          {/* Title + meta over image */}
          <div className="rp-img-bottom">
            <h3 className="rp-img-title">{exc?.title ?? "Excursion"}</h3>
            <div className="rp-img-meta">
              {exc?.city    && <span><MapPin size={11} /> {exc.city}</span>}
              {exc?.duration_hours && <span><Clock size={11} /> {exc.duration_hours}h</span>}
              {exc?.rating  && (
                <span style={{ color: "#FCD34D" }}>
                  <Star size={11} /> {exc.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="rp-body">

          {/* Compact info row */}
          <div className="rp-info-row">
            {infoItems.map((item) => (
              <div key={item.lbl} className="rp-info-item">
                <span className="rp-info-lbl">{item.lbl}</span>
                <span className="rp-info-val">{item.val}</span>
              </div>
            ))}
          </div>

          {/* Timer */}
          {timeLeft !== null && timeLeft > 0 && (
            <div className={`rp-timer ${urgent ? "rp-timer-urgent" : "rp-timer-normal"}`}>
              <span className="rp-timer-left">
                <Timer size={12} />
                {urgent ? "⚡ Urgent — expire bientôt" : "Paiement requis avant"}
              </span>
              <span className="rp-timer-clock">
                {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                {String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>
          )}

          {expired && (
            <div className="rp-timer rp-timer-expired">
              <span className="rp-timer-left"><Timer size={12} /> Délai expiré</span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="rp-footer">
          <div className="rp-footer-left">
            <div className="rp-price">
              <span className="rp-price-amount">{r.total_price}</span>
              <span className="rp-price-currency">EUR</span>
            </div>
            <span className="rp-booking-code">#{r.booking_code}</span>
          </div>

          <div className="rp-footer-actions">
            {/* Bouton Payer */}
            {!paid && r.status !== "cancelled" && !expired && (
              <button className="rp-btn-pay" onClick={onPay}>
                <CreditCard size={13} /> Payer
              </button>
            )}

            {/* Détails + Annuler (si payé) */}
            {paid && (
              <>
                <Link
                  href={`/excursions/${exc?.id}`}
                  className="rp-btn-icon"
                  title="Voir les détails"
                >
                  <TrendingUp size={15} />
                </Link>
                <button
                  className="rp-btn-icon rp-btn-icon-danger"
                  onClick={() => setShowCancel(true)}
                  title="Annuler la réservation"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'annulation */}
      {showCancel && (
        <CancellationModal
          reservation={r}
          onClose={() => setShowCancel(false)}
          onCancelled={() => {
            setShowCancel(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}