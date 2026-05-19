"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, AlertTriangle, CreditCard, CheckCircle,
  Flame, X, ArrowRight, ShieldCheck, Lock,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface BookingItem {
  title: string;
  date: string;
  time: string;
  people: number;
  total: number;
  bookingCode: string;
}

interface Props {
  bookings: BookingItem[];
  grandTotal: number;
  /** Délai en secondes avant suppression (défaut : 3600 = 1h) */
  expiresInSeconds?: number;
  onPay: () => void;
  onCancel?: () => void;
}

/* ─── CSS ────────────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .pcm-overlay {
    position: fixed; inset: 0; z-index: 1100;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    background: rgba(5, 8, 18, 0.82);
    backdrop-filter: blur(12px);
    animation: pcmFadeIn .25s ease;
  }

  .pcm-shell {
    width: 100%; max-width: 480px;
    background: #0D1117;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04);
    animation: pcmSlideUp .35s cubic-bezier(.34,1.4,.64,1);
    font-family: 'DM Sans', sans-serif;
  }

  /* Top urgency bar */
  .pcm-urgency-bar {
    height: 3px; width: 100%;
    background: linear-gradient(90deg, #FF4D4D, #FF9A3C, #FFD700);
    background-size: 200% 100%;
    animation: pcmShimmer 2s linear infinite;
  }

  /* Header */
  .pcm-header {
    padding: 28px 28px 20px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    position: relative;
  }

  /* Timer ring */
  .pcm-timer-wrap {
    display: flex; align-items: center; gap: 18px; margin-bottom: 20px;
  }
  .pcm-ring-svg { flex-shrink: 0; transform: rotate(-90deg); }
  .pcm-ring-bg { fill: none; stroke: rgba(255,255,255,.06); stroke-width: 5; }
  .pcm-ring-fill {
    fill: none; stroke-width: 5; stroke-linecap: round;
    transition: stroke-dashoffset .5s linear, stroke .5s ease;
  }
  .pcm-digits {
    font-family: 'Syne', sans-serif;
    font-size: 36px; font-weight: 800; letter-spacing: -1px;
    line-height: 1; color: white;
  }
  .pcm-digits.urgent { color: #FF4D4D; animation: pcmPulse 1s ease infinite; }
  .pcm-timer-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1.5px; color: rgba(255,255,255,.35); margin-top: 4px;
  }

  /* Warning banner */
  .pcm-warning {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255, 77, 77, .08);
    border: 1px solid rgba(255, 77, 77, .2);
    border-radius: 12px; padding: 12px 14px;
    font-size: 13px; color: rgba(255,255,255,.7); line-height: 1.5;
  }
  .pcm-warning strong { color: #FF6B6B; }

  /* Booking list */
  .pcm-body { padding: 20px 28px; display: flex; flex-direction: column; gap: 10px; }

  .pcm-booking-row {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; padding: 14px 16px;
    display: flex; align-items: center; gap: 12px;
  }
  .pcm-booking-icon {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, rgba(43,150,168,.3), rgba(43,150,168,.1));
    border: 1px solid rgba(43,150,168,.2);
    display: flex; align-items: center; justify-content: center;
  }
  .pcm-booking-info { flex: 1; overflow: hidden; }
  .pcm-booking-title {
    font-size: 13px; font-weight: 700; color: white;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .pcm-booking-meta { font-size: 11px; color: rgba(255,255,255,.4); }
  .pcm-booking-code {
    font-family: 'Syne', monospace; font-size: 10px; font-weight: 700;
    color: #2B96A8; letter-spacing: .5px; text-transform: uppercase;
    background: rgba(43,150,168,.1); border: 1px solid rgba(43,150,168,.2);
    border-radius: 6px; padding: 2px 6px; flex-shrink: 0;
  }

  /* Total */
  .pcm-total-row {
    margin: 4px 0 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.06); border-radius: 14px;
  }
  .pcm-total-label { font-size: 13px; color: rgba(255,255,255,.5); font-weight: 600; }
  .pcm-total-amount {
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
    color: white; letter-spacing: -.5px;
  }

  /* Footer */
  .pcm-footer { padding: 16px 28px 28px; display: flex; flex-direction: column; gap: 10px; }

  .pcm-pay-btn {
    width: 100%; padding: 17px; border: none; border-radius: 16px;
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    gap: 10px; transition: all .2s; position: relative; overflow: hidden;
    letter-spacing: .3px;
    background: linear-gradient(135deg, #2B96A8 0%, #1b7a90 50%, #155f72 100%);
    color: white;
    box-shadow: 0 4px 24px rgba(43,150,168,.35), 0 0 0 1px rgba(43,150,168,.4);
  }
  .pcm-pay-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 60%);
  }
  .pcm-pay-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(43,150,168,.5), 0 0 0 1px rgba(43,150,168,.6);
  }
  .pcm-pay-btn:active { transform: translateY(0); }

  .pcm-cancel-btn {
    width: 100%; padding: 12px; border: none; background: transparent;
    cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: rgba(255,255,255,.3); transition: color .15s; font-weight: 600;
  }
  .pcm-cancel-btn:hover { color: rgba(255,255,255,.55); }

  .pcm-trust {
    display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;
    margin-top: 2px;
  }
  .pcm-trust-item {
    font-size: 11px; color: rgba(255,255,255,.25);
    display: flex; align-items: center; gap: 5px;
  }

  /* Expired state */
  .pcm-expired-content {
    padding: 40px 28px 28px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .pcm-expired-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(255,77,77,.1); border: 1px solid rgba(255,77,77,.2);
    display: flex; align-items: center; justify-content: center;
  }

  /* Close btn */
  .pcm-close {
    position: absolute; top: 20px; right: 20px;
    width: 30px; height: 30px; border-radius: 50%; border: none;
    background: rgba(255,255,255,.06); cursor: pointer; color: rgba(255,255,255,.4);
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .pcm-close:hover { background: rgba(255,255,255,.1); color: white; }

  @keyframes pcmFadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes pcmSlideUp { from { opacity: 0; transform: translateY(30px) scale(.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
  @keyframes pcmShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
  @keyframes pcmPulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }

  @media (max-width: 520px) {
    .pcm-shell { border-radius: 20px; }
    .pcm-header, .pcm-body, .pcm-footer { padding-left: 20px; padding-right: 20px; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/* ─── Main Component ─────────────────────────────────────────────────── */

export default function PaymentCountdownModal({
  bookings,
  grandTotal,
  expiresInSeconds = 3600,
  onPay,
  onCancel,
}: Props) {
  const [remaining, setRemaining] = useState(expiresInSeconds);
  const [expired,   setExpired]   = useState(false);

  useEffect(() => {
    if (remaining <= 0) { setExpired(true); return; }
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(id); setExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const progress    = remaining / expiresInSeconds;           // 1 → 0
  const isUrgent    = remaining <= 300;                       // ≤ 5 min
  const radius      = 34;
  const circumf     = 2 * Math.PI * radius;
  const dashOffset  = circumf * (1 - progress);
  const ringColor   = isUrgent ? "#FF4D4D" : remaining < 1800 ? "#F59E0B" : "#2B96A8";

  /* ── Expired screen ── */
  if (expired) {
    return (
      <>
        <style>{CSS}</style>
        <div className="pcm-overlay">
          <div className="pcm-shell">
            <div className="pcm-urgency-bar" style={{ background: "#FF4D4D", animation: "none" }} />
            <div className="pcm-expired-content">
              <div className="pcm-expired-icon">
                <AlertTriangle size={28} color="#FF4D4D" />
              </div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"white", margin:0 }}>
                Réservation expirée
              </h2>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", margin:0, lineHeight:1.6, maxWidth:300 }}>
                Le délai de paiement de <strong style={{ color:"rgba(255,255,255,.7)" }}>1 heure</strong> est écoulé.
                Votre réservation a été automatiquement annulée.
              </p>
              <button
                className="pcm-pay-btn"
                style={{ background:"linear-gradient(135deg,#374151,#1F2937)", boxShadow:"none", marginTop:6, maxWidth:280 }}
                onClick={onCancel}
              >
                Retour aux excursions
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Main countdown screen ── */
  return (
    <>
      <style>{CSS}</style>
      <div className="pcm-overlay">
        <div className="pcm-shell">
          <div className="pcm-urgency-bar" />

          {/* Header */}
          <div className="pcm-header">
            <button className="pcm-close" onClick={onCancel} aria-label="Fermer">
              <X size={14} />
            </button>

            {/* Timer ring + digits */}
            <div className="pcm-timer-wrap">
              <svg className="pcm-ring-svg" width={80} height={80} viewBox="0 0 80 80">
                <circle className="pcm-ring-bg" cx={40} cy={40} r={radius} />
                <circle
                  className="pcm-ring-fill"
                  cx={40} cy={40} r={radius}
                  stroke={ringColor}
                  strokeDasharray={circumf}
                  strokeDashoffset={dashOffset}
                />
                {/* Inner icon */}
                <g transform="translate(40,40)">
                  <circle r={24} fill="rgba(255,255,255,.04)" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={14} fill={ringColor}>
                    ⏱
                  </text>
                </g>
              </svg>

              <div>
                <div className={`pcm-digits ${isUrgent ? "urgent" : ""}`}>
                  {formatTime(remaining)}
                </div>
                <div className="pcm-timer-label">
                  {isUrgent ? "⚠️ Dépêchez-vous !" : "Temps restant pour payer"}
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="pcm-warning">
              <Flame size={15} color="#FF6B6B" style={{ marginTop:1, flexShrink:0 }} />
              <span>
                Votre réservation sera <strong>automatiquement supprimée</strong> si le paiement n'est pas effectué dans le temps imparti. Les places seront libérées.
              </span>
            </div>
          </div>

          {/* Booking list */}
          <div className="pcm-body">
            {bookings.map((b, i) => (
              <div key={i} className="pcm-booking-row">
                <div className="pcm-booking-icon">
                  <CheckCircle size={16} color="#2B96A8" />
                </div>
                <div className="pcm-booking-info">
                  <div className="pcm-booking-title">{b.title}</div>
                  <div className="pcm-booking-meta">
                    {new Date(b.date).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })}
                    {" · "}{b.time}{" · "}{b.people} pers.
                  </div>
                </div>
                <div className="pcm-booking-code">{b.bookingCode.slice(0, 10)}</div>
              </div>
            ))}

            {/* Total */}
            <div className="pcm-total-row">
              <span className="pcm-total-label">Total à régler</span>
              <span className="pcm-total-amount">{grandTotal} EUR</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pcm-footer">
            <button className="pcm-pay-btn" onClick={onPay}>
              <CreditCard size={17} />
              Payer maintenant
              <ArrowRight size={15} style={{ marginLeft:2 }} />
            </button>

            <div className="pcm-trust">
              {[
                { icon: <Lock size={10} />,       label: "Paiement sécurisé" },
                { icon: <ShieldCheck size={10} />, label: "Données chiffrées" },
              ].map(t => (
                <span key={t.label} className="pcm-trust-item">{t.icon}{t.label}</span>
              ))}
            </div>

            <button className="pcm-cancel-btn" onClick={onCancel}>
              Annuler ma réservation
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


/* ─── Usage example (supprimer en prod) ─────────────────────────────── */

/**
 * INTÉGRATION dans CheckoutModal (app/components/excursions/CheckoutModal) :
 *
 * 1. Ajouter l'état : const [showPayment, setShowPayment] = useState(false);
 *
 * 2. Dans le bloc status === "success", remplacer le bouton "Fermer" par :
 *    <button onClick={() => setShowPayment(true)}>Procéder au paiement</button>
 *
 * 3. Rendre le modal conditionnel :
 *    {showPayment && (
 *      <PaymentCountdownModal
 *        bookings={confirmedItems.map((p, i) => ({
 *          title:       p.exc.title,
 *          date:        p.selectedDate,
 *          time:        p.selectedSlot!.time,
 *          people:      p.people,
 *          total:       (p.selectedSlot!.price * p.people) * 1.1,
 *          bookingCode: bookingCodes[i],
 *        }))}
 *        grandTotal={grandTotal}
 *        expiresInSeconds={3600}
 *        onPay={() => {
 *          // Naviguer vers app/components/paiement/CheckoutModal
 *          setShowPayment(false);
 *          router.push("/paiement");
 *        }}
 *        onCancel={() => {
 *          setShowPayment(false);
 *          onClose?.();
 *        }}
 *      />
 *    )}
 */