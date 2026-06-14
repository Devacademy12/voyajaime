"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Clock, CalendarDays, Star, Compass,
  CheckCircle, CreditCard, Timer,
} from "lucide-react";

import { Reservation, STATUS_CFG, daysUntil, fmtDate } from "./type";
import CancellationModal from "./CancellationModal";

const CARD_CSS = `
  @keyframes rc-pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes rc-urgent { 0%,100%{background:#FEF2F2} 50%{background:#FEE2E2} }

  .rp-card {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #E2E8F0;
    overflow: hidden;
    transition: box-shadow .2s, border-color .2s, transform .2s;
    display: flex;
    flex-direction: column;
  }
  .rp-card:hover {
    box-shadow: 0 8px 28px rgba(0,0,0,.1);
    border-color: #CBD5E1;
    transform: translateY(-3px);
  }

  /* ── Image (top) ── */
  .rp-img {
    position: relative;
    width: 100%;
    height: 170px;
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
    background: linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,.08) 55%, transparent 100%);
  }
  .rp-img-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* badges */
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
  .rp-tag-paid { background: rgba(13,148,136,.88); color: #fff; }
  .rp-tag-days { background: rgba(15,23,42,.75);   color: #fff; }

  /* title + meta overlaid bottom of image */
  .rp-img-bottom {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 12px 14px 11px;
  }
  .rp-img-title {
    font-size: 14px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 5px;
    line-height: 1.25;
    text-shadow: 0 1px 4px rgba(0,0,0,.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rp-img-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
  }
  .rp-img-meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255,255,255,.88);
    font-weight: 500;
    white-space: nowrap;
  }

  /* ── Body (below image) ── */
  .rp-body {
    display: flex;
    flex-direction: column;
    padding: 13px 14px 14px;
    gap: 10px;
    flex: 1;
  }

  /* Info row */
  .rp-info-row {
    display: flex;
    align-items: center;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    overflow: hidden;
  }
  .rp-info-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    gap: 2px;
    position: relative;
  }
  .rp-info-item + .rp-info-item::before {
    content: '';
    position: absolute;
    left: 0; top: 18%; bottom: 18%;
    width: 1px;
    background: #E2E8F0;
  }
  .rp-info-lbl {
    font-size: 9.5px;
    font-weight: 600;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: .05em;
    white-space: nowrap;
  }
  .rp-info-val {
    font-size: 12.5px;
    font-weight: 700;
    color: #0F172A;
    white-space: nowrap;
  }

  /* Timer */
  .rp-timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 11px;
    border-radius: 9px;
    font-size: 11.5px;
    font-weight: 700;
  }
  .rp-timer-normal  { background: #F0FDFA; color: #0D9488; border: 1px solid #CCFBF1; }
  .rp-timer-urgent  { background: #FEF2F2; color: #EF4444; border: 1px solid #FEE2E2; animation: rc-urgent 1.5s ease infinite; }
  .rp-timer-expired { background: #FEF2F2; color: #EF4444; border: 1px solid #FEE2E2; }
  .rp-timer-left  { display: flex; align-items: center; gap: 5px; }
  .rp-timer-clock { font-family: monospace; font-size: 12px; letter-spacing: .05em; }

  /* Footer */
  .rp-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
    padding-top: 2px;
  }
  .rp-footer-left { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .rp-price { display: flex; align-items: baseline; gap: 4px; }
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
    font-size: 10px;
    font-weight: 600;
    color: #94A3B8;
    font-family: 'Courier New', monospace;
    letter-spacing: .04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  /* Buttons */
  .rp-footer-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

  .rp-btn-pay {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 15px;
    background: #0D9488;
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .15s, transform .1s;
    white-space: nowrap;
  }
  .rp-btn-pay:hover { background: #0F766E; transform: translateY(-1px); }

  .rp-btn-details {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    background: #fff;
    color: #2B96A8;
    border: 1.5px solid #2B96A8;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .15s, transform .1s;
    white-space: nowrap;
    text-decoration: none;
  }
  .rp-btn-details:hover { background: #EBF8FA; transform: translateY(-1px); }

  .rp-btn-cancel {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    background: #EF4444;
    color: #fff;
    border: 1.5px solid #EF4444;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .15s, transform .1s;
    white-space: nowrap;
  }
  .rp-btn-cancel:hover { background: #DC2626; border-color: #DC2626; transform: translateY(-1px); }
`;

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

  const paid =
    r.payment_status === "paid" ||
    r.status === "confirmed" ||
    r.status === "completed";

  const days = daysUntil(r.date);
  const [timeLeft, setTimeLeft]   = useState<number | null>(null);
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
    { lbl: "Date",      val: fmtDate(r.date, true) },
    { lbl: "Heure",     val: r.time },
    { lbl: "Personnes", val: `${r.people_count}` },
    { lbl: "Durée",     val: `${exc?.duration_hours ?? "–"}h` },
  ];

  return (
    <>
      <style>{CARD_CSS}</style>

      <div className="rp-card">

        {/* ── Image (top) ── */}
        <div className="rp-img">
          {photo
            ? <img src={photo} alt={exc?.title || ""} />
            : <div className="rp-img-empty"><Compass size={36} color="rgba(0,0,0,.15)" /></div>
          }
          <div className="rp-img-overlay" />

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

          <div className="rp-img-bottom">
            <h3 className="rp-img-title">{exc?.title ?? "Excursion"}</h3>
            <div className="rp-img-meta">
              {exc?.city         && <span><MapPin size={11} /> {exc.city}</span>}
              {exc?.duration_hours && <span><Clock  size={11} /> {exc.duration_hours}h</span>}
              {exc?.rating       && (
                <span style={{ color: "#FCD34D" }}>
                  <Star size={11} /> {exc.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body (below image) ── */}
        <div className="rp-body">

          {/* Info grid */}
          <div className="rp-info-row">
            {infoItems.map((item) => (
              <div key={item.lbl} className="rp-info-item">
                <span className="rp-info-lbl">{item.lbl}</span>
                <span className="rp-info-val">{item.val}</span>
              </div>
            ))}
          </div>

          {/* Countdown timer */}
          {timeLeft !== null && timeLeft > 0 && (
            <div className={`rp-timer ${urgent ? "rp-timer-urgent" : "rp-timer-normal"}`}>
              <span className="rp-timer-left">
                <Timer size={12} />
                {urgent ? "⚡ Expire bientôt" : "Paiement avant"}
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

          {/* Footer : price + actions */}
          <div className="rp-footer">
            <div className="rp-footer-left">
              <div className="rp-price">
                <span className="rp-price-amount">{r.total_price}</span>
                <span className="rp-price-currency">EUR</span>
              </div>
              <span className="rp-booking-code">#{r.booking_code}</span>
            </div>

            <div className="rp-footer-actions">
              {!paid && r.status !== "cancelled" && !expired && (
                <button className="rp-btn-pay" onClick={onPay}>
                  <CreditCard size={13} /> Payer
                </button>
              )}

              {paid && (
                <>
                  <Link href={`/excursions/${exc?.id}`} className="rp-btn-details">
                    Détails
                  </Link>
                  <button className="rp-btn-cancel" onClick={() => setShowCancel(true)}>
                    Annuler
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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