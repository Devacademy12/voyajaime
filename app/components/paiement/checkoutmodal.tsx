"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import {
  MapPin, ChevronLeft, X, Loader2, CheckCircle,
  CreditCard, AlertCircle, Timer, Calendar, Users, Ticket, ArrowRight, Lock, ShieldCheck
} from "lucide-react";
import { Reservation, fmtDate, fmtCountdown } from "../reservation/type";
import styles from "@/public/style/Reservations.module.css";

interface Props {
  reservation: Reservation;
  onClose: () => void;
  onPaid: (id: string) => void;
  autoStart?: boolean;
}

export default function CheckoutModal({ reservation, onClose, onPaid, autoStart = false }: Props) {
  const supabase = createClient();
  const exc = reservation.excursion;

  const [step, setStep] = useState<1 | 2 | 3>(autoStart ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function getSecondsLeft() {
    if (!reservation.payment_deadline) return 3600;
    return Math.max(0, Math.floor((new Date(reservation.payment_deadline).getTime() - Date.now()) / 1000));
  }

  const [timeLeft, setTimeLeft] = useState<number>(getSecondsLeft);

  useEffect(() => {
    if (step === 3 || cancelled) return;
    const remaining = getSecondsLeft();
    if (remaining <= 0) { triggerCancel(); return; }
    setTimeLeft(remaining);
    timerRef.current = setInterval(() => {
      const left = getSecondsLeft();
      setTimeLeft(left);
      if (left <= 0) { clearInterval(timerRef.current!); triggerCancel(); }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, cancelled]);

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  async function triggerCancel() {
    setCancelled(true);
    try {
      await supabase.rpc("restore_slots_on_cancel", { p_reservation_id: reservation.id });
      await supabase.from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", reservation.id).eq("status", "pending");
    } catch (e) { console.warn("Auto-cancel:", e); }
  }

  const isUrgent = timeLeft <= 300;
  const total = parseFloat(String(reservation.total_price)) || 0;

  async function handleStripePayment() {
    if (!reservation.id) { setError("ID de réservation invalide"); return; }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/paiement/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservation.id, amount: total }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur Stripe");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de paiement");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .co-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(10, 12, 18, 0.75);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: co-fade-in 0.2s ease;
        }
        @keyframes co-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .co-modal {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 460px;
          overflow: hidden;
          font-family: inherit'DM Sans', 'Helvetica Neue', sans-serif;
          animation: co-slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 32px 80px rgba(0,0,0,0.22);
        }
        @keyframes co-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .co-header {
          padding: 1.5rem 1.5rem 0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .co-step-label {
          font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: #94a3b8; margin: 0 0 4px;
        }
        .co-title {
          font-size: 20px; font-weight: 700; color: #0f172a;
          margin: 0; letter-spacing: -0.3px;
        }

        .co-icon-btn {
          width: 34px; height: 34px; border-radius: 50%;
          border: 1.5px solid #e2e8f0; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b; transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .co-icon-btn:hover { border-color: #cbd5e1; background: #f8fafc; }

        .co-progress {
          padding: 1rem 1.5rem 0;
          display: flex; gap: 6px; align-items: center;
        }
        .co-prog-bar { height: 2.5px; flex: 1; border-radius: 2px; transition: background 0.3s ease; }

        .co-body { padding: 1.25rem 1.5rem 1.5rem; }

        .co-excursion-card {
          border-radius: 14px; overflow: hidden;
          border: 1.5px solid #f1f5f9; margin-bottom: 1.25rem;
        }
        .co-exc-banner {
          background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
          padding: 1rem 1.125rem 1rem;
          display: flex; align-items: flex-end; justify-content: space-between;
          min-height: 80px; position: relative;
        }
        .co-exc-title { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 3px; }
        .co-exc-city { font-size: 12px; color: rgba(255,255,255,0.55); margin: 0; display: flex; align-items: center; gap: 4px; }
        .co-exc-rating {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px; padding: 4px 10px;
          font-size: 11px; font-weight: 700; color: #fbbf24;
        }
        .co-exc-meta {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          padding: 0.875rem 1.125rem;
          gap: 0; background: #fafafa;
        }
        .co-exc-meta-item { }
        .co-exc-meta-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; margin: 0 0 3px; }
        .co-exc-meta-val { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0; }

        .co-price-table {
          border: 1.5px solid #f1f5f9; border-radius: 14px;
          overflow: hidden; margin-bottom: 1.25rem;
        }
        .co-price-row {
          padding: 11px 14px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1.5px solid #f8fafc;
          font-size: 13px;
        }
        .co-price-row:last-child { border-bottom: none; }
        .co-price-row-label { color: #64748b; }
        .co-price-row-val { font-weight: 600; color: #334155; }
        .co-price-total {
          padding: 14px; display: flex; justify-content: space-between; align-items: center;
          background: #f8fafc;
        }
        .co-price-total-label { font-size: 14px; font-weight: 700; color: #0f172a; }
        .co-price-total-val { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }

        .co-timer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-radius: 10px; margin-bottom: 1.25rem;
          background: #f8fafc; border: 1.5px solid #f1f5f9;
          transition: all 0.3s ease;
        }
        .co-timer.urgent { background: #fff5f5; border-color: #fecaca; }
        .co-timer-label { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 6px; }
        .co-timer-label.urgent { color: #ef4444; }
        .co-timer-val { font-family: inherit'SF Mono', 'Fira Code', monospace; font-size: 14px; font-weight: 700; color: #334155; }
        .co-timer-val.urgent { color: #ef4444; }

        .co-btn-primary {
          width: 100%; padding: 14px 20px;
          background: #0f172a; color: #fff; border: none;
          border-radius: 12px; font-size: 14px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s ease; font-family: inheritinherit; letter-spacing: 0.1px;
        }
        .co-btn-primary:hover:not(:disabled) { background: #1e293b; transform: translateY(-1px); }
        .co-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .co-btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }

        .co-btn-secondary {
          flex: 1; padding: 12px;
          background: #fff; color: #334155;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.15s ease; font-family: inheritinherit;
        }
        .co-btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

        .co-summary-compact {
          background: #f8fafc; border-radius: 12px;
          padding: 12px 14px; margin-bottom: 1.25rem;
          display: flex; justify-content: space-between; align-items: center;
        }
        .co-summary-compact-left p { margin: 0; }
        .co-summary-sub { font-size: 11px; color: #94a3b8; margin-bottom: 2px !important; }
        .co-summary-name { font-size: 14px; font-weight: 600; color: #0f172a; }
        .co-summary-total { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }

        .co-secure-note {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin-top: 10px;
        }
        .co-secure-note span { font-size: 11px; color: #94a3b8; }

        .co-error {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; background: #fff5f5;
          border: 1.5px solid #fecaca; border-radius: 10px; margin-top: 12px;
        }
        .co-error span { font-size: 13px; color: #ef4444; font-weight: 600; }

        .co-success-icon {
          width: 60px; height: 60px; border-radius: 50%;
          background: #f0fdf4; border: 2px solid #bbf7d0;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          animation: co-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
        }
        @keyframes co-pop { from { opacity:0; transform: scale(0.5); } to { opacity:1; transform: scale(1); } }

        .co-receipt {
          border: 1.5px solid #f1f5f9; border-radius: 14px;
          overflow: hidden; margin-bottom: 1.25rem;
        }
        .co-receipt-row {
          padding: 11px 14px; display: flex; justify-content: space-between;
          align-items: center; border-bottom: 1.5px solid #f8fafc;
          font-size: 13px;
        }
        .co-receipt-row:last-child { border-bottom: none; }
        .co-receipt-label { color: #94a3b8; display: flex; align-items: center; gap: 8px; }
        .co-receipt-val { font-weight: 600; color: #0f172a; font-size: 13px; }

        .co-expired { text-align: center; padding: 2rem 0; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div
        className="co-overlay"
        onClick={e => { if (e.target === e.currentTarget && step !== 3 && !cancelled) onClose(); }}
      >
        <div className="co-modal">

          {/* ─── EXPIRED STATE ─── */}
          {cancelled && (
            <div className="co-body co-expired">
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff5f5", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Timer size={24} color="#ef4444" strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Délai expiré</h3>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.7 }}>
                La réservation <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#334155" }}>#{reservation.booking_code}</span> a été annulée automatiquement.
              </p>
              <button className="co-btn-primary" onClick={onClose}>Fermer</button>
            </div>
          )}

          {!cancelled && (
            <>
              {/* ─── STEP 1 — RÉCAPITULATIF ─── */}
              {step === 1 && (
                <>
                  <div className="co-header">
                    <div>
                      <p className="co-step-label">Étape 1 / 2</p>
                      <h2 className="co-title">Votre réservation</h2>
                    </div>
                    <button className="co-icon-btn" onClick={onClose} aria-label="Fermer">
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="co-progress">
                    <div className="co-prog-bar" style={{ background: "#0f172a" }} />
                    <div className="co-prog-bar" style={{ background: "#e2e8f0" }} />
                  </div>

                  <div className="co-body">
                    {/* Excursion card */}
                    <div className="co-excursion-card">
                      <div className="co-exc-banner" style={{ backgroundImage: exc?.photos?.[0] ? `linear-gradient(160deg, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.9) 100%), url(${exc.photos[0]})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                        <div>
                          <p className="co-exc-title">{exc?.title}</p>
                          <p className="co-exc-city"><MapPin size={11} strokeWidth={2.5} /> {exc?.city}</p>
                        </div>
                        <span className="co-exc-rating">★ 4.9</span>
                      </div>
                      <div className="co-exc-meta">
                        <div className="co-exc-meta-item">
                          <p className="co-exc-meta-label">Date</p>
                          <p className="co-exc-meta-val">{fmtDate(reservation.date, true)}</p>
                        </div>
                        <div className="co-exc-meta-item" style={{ borderLeft: "1.5px solid #f1f5f9", paddingLeft: 12 }}>
                          <p className="co-exc-meta-label">Heure</p>
                          <p className="co-exc-meta-val">{reservation.time}</p>
                        </div>
                        <div className="co-exc-meta-item" style={{ borderLeft: "1.5px solid #f1f5f9", paddingLeft: 12 }}>
                          <p className="co-exc-meta-label">Voyageurs</p>
                          <p className="co-exc-meta-val">{reservation.people_count} pers.</p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="co-price-table">
                      <div className="co-price-row">
                        <span className="co-price-row-label">Prix par personne</span>
                        <span className="co-price-row-val">{exc?.price_per_person} EUR</span>
                      </div>
                      <div className="co-price-row">
                        <span className="co-price-row-label">Voyageurs</span>
                        <span className="co-price-row-val">× {reservation.people_count}</span>
                      </div>
                      <div className="co-price-total">
                        <span className="co-price-total-label">Total</span>
                        <span className="co-price-total-val">{total} EUR</span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className={`co-timer${isUrgent ? " urgent" : ""}`}>
                      <span className={`co-timer-label${isUrgent ? " urgent" : ""}`}>
                        <Timer size={14} strokeWidth={2.5} />
                        {isUrgent ? "Payez vite !" : "Temps restant"}
                      </span>
                      <span className={`co-timer-val${isUrgent ? " urgent" : ""}`}>{fmtCountdown(timeLeft)}</span>
                    </div>

                    <button className="co-btn-primary" onClick={() => setStep(2)}>
                      Procéder au paiement <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </>
              )}

              {/* ─── STEP 2 — PAIEMENT ─── */}
              {step === 2 && (
                <>
                  <div className="co-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button className="co-icon-btn" onClick={() => { setError(""); setStep(1); }} aria-label="Retour">
                        <ChevronLeft size={16} strokeWidth={2.5} />
                      </button>
                      <div>
                        <p className="co-step-label">Étape 2 / 2</p>
                        <h2 className="co-title">Paiement sécurisé</h2>
                      </div>
                    </div>
                    <button className="co-icon-btn" onClick={onClose} aria-label="Fermer">
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="co-progress">
                    <div className="co-prog-bar" style={{ background: "#0f172a" }} />
                    <div className="co-prog-bar" style={{ background: "#0f172a" }} />
                  </div>

                  <div className="co-body">
                    {/* Compact summary */}
                    <div className="co-summary-compact">
                      <div className="co-summary-compact-left">
                        <p className="co-summary-sub">{exc?.title} · {reservation.people_count} pers.</p>
                        <p className="co-summary-name">Total à payer</p>
                      </div>
                      <span className="co-summary-total">{total} EUR</span>
                    </div>

                    {/* Timer */}
                    <div className={`co-timer${isUrgent ? " urgent" : ""}`} style={{ marginBottom: "1.25rem" }}>
                      <span className={`co-timer-label${isUrgent ? " urgent" : ""}`}>
                        <Timer size={14} strokeWidth={2.5} />
                        {isUrgent ? "Payez vite !" : "Temps restant"}
                      </span>
                      <span className={`co-timer-val${isUrgent ? " urgent" : ""}`}>{fmtCountdown(timeLeft)}</span>
                    </div>

                    {/* Pay button */}
                    <button
                      className="co-btn-primary"
                      onClick={handleStripePayment}
                      disabled={loading}
                    >
                      {loading ? (
                        <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Redirection en cours…</>
                      ) : (
                        <><Lock size={15} strokeWidth={2.5} /> Payer {total} EUR</>
                      )}
                    </button>

                    <div className="co-secure-note">
                      <ShieldCheck size={13} color="#94a3b8" strokeWidth={2} />
                      <span>Sécurisé par Stripe · chiffrement SSL</span>
                      {["Visa", "MC", "AMEX"].map(c => (
                        <span key={c} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", background: "#f1f5f9", borderRadius: 5, color: "#64748b", border: "1px solid #e2e8f0" }}>{c}</span>
                      ))}
                    </div>

                    {error && (
                      <div className="co-error">
                        <AlertCircle size={15} color="#ef4444" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ─── STEP 3 — SUCCÈS ─── */}
              {step === 3 && (
                <div className="co-body" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
                  <div className="co-success-icon">
                    <CheckCircle size={28} color="#16a34a" strokeWidth={2} />
                  </div>
                  <h3 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: -0.3 }}>Paiement confirmé !</h3>
                  <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.7 }}>Un email de confirmation avec tous les détails vous a été envoyé.</p>

                  <div className="co-receipt">
                    <div className="co-receipt-row">
                      <span className="co-receipt-label"><Ticket size={14} strokeWidth={2} /> Réservation</span>
                      <span className="co-receipt-val" style={{ fontFamily: "monospace" }}>#{reservation.booking_code}</span>
                    </div>
                    <div className="co-receipt-row">
                      <span className="co-receipt-label"><Calendar size={14} strokeWidth={2} /> Date</span>
                      <span className="co-receipt-val">{fmtDate(reservation.date, true)} à {reservation.time}</span>
                    </div>
                    <div className="co-receipt-row">
                      <span className="co-receipt-label"><Users size={14} strokeWidth={2} /> Voyageurs</span>
                      <span className="co-receipt-val">{reservation.people_count} personne{reservation.people_count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="co-receipt-row" style={{ background: "#f8fafc" }}>
                      <span className="co-receipt-label" style={{ color: "#0f172a", fontWeight: 700 }}>Montant payé</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{total} EUR</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="co-btn-secondary" onClick={onClose}>Fermer</button>
                    <Link
                      href="/touriste/historique"
                      style={{ flex: 1, padding: "12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", transition: "all 0.15s ease" }}
                    >
                      Voir l'historique <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}