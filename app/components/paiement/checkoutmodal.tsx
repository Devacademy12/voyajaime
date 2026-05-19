"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ShieldCheck,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Timer,
  History,
  MessageSquare,
  Calendar,
  Users,
  Compass,
  Ticket,
  Landmark,
  Smartphone,
  Lock
} from "lucide-react";
import {
  Reservation, STEPS,
  fmtDate, fmtCountdown,
} from "../reservation/type";
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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(autoStart ? 3 : 1);
  const [specialNote, setSpecialNote] = useState("");
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
    if (step === 4 || cancelled) return;
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
  if (step === 4) {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

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
  const base = reservation.total_price - reservation.platform_fee;
  const fee = reservation.platform_fee;
  const total = reservation.total_price;
  const timerColor = isUrgent ? "#EF4444" : "#0D9488";

  // Paiement Stripe Checkout
  async function handleStripePayment() {
     console.log("🆔 ID de réservation à envoyer:", reservation.id);
  console.log("📝 Type de l'ID:", typeof reservation.id);
  
  if (!reservation.id) {
    setError("ID de réservation invalide");
    return;
  }
  
  setLoading(true);
  setError("");
  
  try {
    const response = await fetch("/api/paiement/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservation_id: reservation.id,
        special_notes: specialNote,
        amount: total,
      }),
    });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur Stripe");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de paiement");
      setLoading(false);
    }
  }

  const BackBtn = () => (
    <button
      onClick={() => { setError(""); setStep(s => (s - 1) as 1 | 2 | 3 | 4); }}
      style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <ChevronLeft size={15} color="#64748B" />
    </button>
  );

  const CloseBtn = () => (
    <button
      onClick={onClose}
      style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <X size={14} color="#64748B" />
    </button>
  );

  return (
    <div className={styles["rp-overlay"]} onClick={e => { if (e.target === e.currentTarget && step !== 4) onClose(); }}>
      <div className={styles["rp-modal"]}>

        <div className={styles["rp-modal-head"]}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: step !== 4 && !cancelled ? 20 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {step > 1 && step < 4 && !cancelled && <BackBtn />}
              <div>
                {step !== 4 && !cancelled && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                    Étape {step} / 3
                  </p>
                )}
                <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: -.5 }}>
                  {cancelled && "Réservation expirée"}
                  {!cancelled && step === 1 && "Récapitulatif"}
                  {!cancelled && step === 2 && "Vos informations"}
                  {!cancelled && step === 3 && "Paiement sécurisé"}
                  {!cancelled && step === 4 && "Paiement confirmé"}
                </h2>
              </div>
            </div>
            {step !== 4 && <CloseBtn />}
          </div>

          {step !== 4 && !cancelled && (
            <>
              <div className={styles["rp-steps"]}>
                {STEPS.map((s, i) => (
                  <div key={s} className={styles["rp-step-seg"]}>
                    <div className={`${styles["rp-step-bar"]} ${i < step ? styles["rp-step-done"] : i === step - 1 ? styles["rp-step-active"] : styles["rp-step-inactive"]}`} />
                    <span className={styles["rp-step-label"]} style={{ color: i < step ? "#0D9488" : i === step - 1 ? "#475569" : "#CBD5E1" }}>{s}</span>
                  </div>
                ))}
              </div>

              <div className={`${styles["rp-modal-timer"]} ${isUrgent ? styles["rp-modal-timer-urgent"] : styles["rp-modal-timer-ok"]}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Timer size={12} color={timerColor} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: timerColor }}>
                    {isUrgent ? "⏰ Payez maintenant !" : "⏱️ Temps restant"}
                  </span>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: timerColor, background: isUrgent ? "rgba(239,68,68,.1)" : "rgba(13,148,136,.1)", padding: "3px 12px", borderRadius: 8 }}>
                  {fmtCountdown(timeLeft)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles["rp-modal-body"]}>

          {cancelled && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 10, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Timer size={32} color="#EF4444" strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 10, letterSpacing: -.5 }}>Délai expiré</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.8 }}>
                  Réservation <span style={{ color: "#475569", fontFamily: "monospace" }}>#{reservation.booking_code}</span> annulée automatiquement.
                </p>
              </div>
              <button onClick={onClose} style={{ padding: "13px 36px", background: "#0D9488", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Fermer
              </button>
            </div>
          )}

          {!cancelled && (
            <>
              {step === 1 && (
                <>
                  <div style={{ borderRadius: 14, overflow: "hidden", height: 160, position: "relative", background: "linear-gradient(135deg,#F0FDF4,#CCFBF1)" }}>
                    {exc?.photos?.[0] && <img src={exc.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.4),transparent 60%)" }} />
                    <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
                      <p style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 17, fontWeight: 700, color: "#FFFFFF", marginBottom: 4, textShadow: "0 1px 2px rgba(0,0,0,.2)" }}>{exc?.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.9)", display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={10} />{exc?.city}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { lbl: "📅 Date", val: fmtDate(reservation.date, true) },
                      { lbl: "⏰ Heure", val: reservation.time },
                      { lbl: "👥 Voyageurs", val: `${reservation.people_count} pers.` },
                      { lbl: "⏱️ Durée", val: `${exc?.duration_hours ?? "–"}h` },
                    ].map(({ lbl, val }) => (
                      <div key={lbl} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, color: "#94A3B8", marginBottom: 5 }}>{lbl}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ background: "#F8FAFC", padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#94A3B8", marginBottom: 12 }}>
                        💰 Détail des frais
                      </p>
                    </div>
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, color: "#64748B" }}>{exc?.price_per_person} EUR × {reservation.people_count} pers.</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>{base} EUR</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, color: "#64748B" }}>🎯 Frais de service</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>{fee} EUR</span>
                      </div>
                      <div style={{ height: 1, background: "#E2E8F0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Total</span>
                        <span style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 24, fontWeight: 700, color: "#0D9488" }}>{total} EUR</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setStep(2)} className={styles["rp-btn-primary"]}>
                    Continuer <ChevronRight size={16} />
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div style={{ display: "flex", gap: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#E2E8F0" }}>
                      {exc?.photos?.[0] && <img src={exc.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 3px" }}>{exc?.title}</p>
                      <p style={{ fontSize: 12, color: "#64748B" }}>{fmtDate(reservation.date)} · {reservation.people_count} pers.</p>
                    </div>
                    <p style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 18, fontWeight: 700, color: "#0D9488" }}>
                      {total} <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8" }}>EUR</span>
                    </p>
                  </div>

                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                      <MessageSquare size={13} color="#0D9488" /> 💬 Besoins spéciaux
                      <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>— optionnel</span>
                    </label>
                    <textarea
                      value={specialNote}
                      onChange={e => setSpecialNote(e.target.value)}
                      placeholder="Handicap, allergies, régimes alimentaires..."
                      rows={4}
                      style={{ width: "100%", padding: "13px 14px", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", color: "#1E293B", background: "#FFFFFF" }}
                    />
                  </div>

                  <button onClick={() => setStep(3)} className={styles["rp-btn-primary"]}>
                    Payer par carte <ChevronRight size={16} />
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderRadius: 16, padding: 22, textAlign: "center" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Montant à payer</p>
                    <p style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 46, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1, marginBottom: 6 }}>
                      {total}<span style={{ fontSize: 18, fontWeight: 500, color: "#94A3B8", marginLeft: 6 }}>EUR</span>
                    </p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>dont {fee} EUR de frais de service</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <button
                      onClick={handleStripePayment}
                      disabled={loading}
                      className={styles["rp-btn-primary"]}
                    >
                      {loading ? (
                        <><Loader2 size={16} className={styles["spin"]} /> Redirection Stripe...</>
                      ) : (
                        <><CreditCard size={16} /> Payer par carte bancaire</>
                      )}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px", background: "rgba(13,148,136,.05)", borderRadius: 10 }}>
                      <Lock size={12} color="#0D9488" />
                      <span style={{ fontSize: 11, color: "#64748B" }}>Paiement sécurisé par Stripe</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["Visa", "Mastercard", "AMEX"].map((card) => (
                          <span key={card} style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "#FFFFFF", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                            {card}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{ display: "flex", gap: 8, padding: "11px 14px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10 }}>
                      <AlertCircle size={14} color="#EF4444" />
                      <span style={{ fontSize: 13, color: "#EF4444" }}>{error}</span>
                    </div>
                  )}
                </>
              )}

              {step === 4 && (
                <>
                  <div style={{ textAlign: "center", paddingTop: 8 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(13,148,136,.1)", border: "1px solid rgba(13,148,136,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <CheckCircle size={32} color="#0D9488" strokeWidth={1.5} />
                    </div>
                    <h3 style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 8, letterSpacing: -.5 }}>
                      Paiement confirmé !
                    </h3>
                    <p style={{ fontSize: 14, color: "#64748B" }}>Un email de confirmation vous a été envoyé.</p>
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg,#F0FDF4,#CCFBF1)", padding: "20px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: 9, color: "rgba(15,23,42,.5)", fontWeight: 700, textTransform: "uppercase" }}>Excursion</p>
                          <p style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{exc?.title}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: "rgba(15,23,42,.5)", fontWeight: 700, textTransform: "uppercase" }}>Payé</p>
                          <p style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 24, fontWeight: 700, color: "#0D9488" }}>{total} EUR</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "18px 22px" }}>
                      {[
                        { Icon: Ticket, lbl: "Code", val: reservation.booking_code },
                        { Icon: Calendar, lbl: "Date", val: `${fmtDate(reservation.date, true)} · ${reservation.time}` },
                        { Icon: Users, lbl: "Voyageurs", val: `${reservation.people_count} pers.` },
                      ].map(({ Icon, lbl, val }) => (
                        <div key={lbl} className={styles["rp-info-row"]}>
                          <div className={styles["rp-info-icon"]}><Icon size={14} color="#0D9488" /></div>
                          <div>
                            <p className={styles["rp-info-lbl"]}>{lbl}</p>
                            <p className={styles["rp-info-val"]}>{val}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} className={styles["rp-btn-secondary"]}>Fermer</button>
                    <Link href="/touriste/historique" className={styles["rp-btn-primary"]} style={{ textAlign: "center" }}>
                      Voir historique
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}