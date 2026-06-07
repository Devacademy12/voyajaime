// app/components/paiement/checkoutmodal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import {
  MapPin, ChevronLeft, ChevronRight, X, Loader2,
  CheckCircle, CreditCard, AlertCircle, Timer,
  MessageSquare, Calendar, Users, Ticket, Lock,
} from "lucide-react";
import { Reservation, STEPS, fmtDate, fmtCountdown } from "./type";

interface Props {
  reservation: Reservation;
  onClose: () => void;
  onPaid: (id: string) => void;
  autoStart?: boolean;
}

export default function CheckoutModal({ reservation, onClose, onPaid, autoStart = false }: Props) {
  const supabase = createClient();
  const exc = reservation.excursion;

  const [mounted,     setMounted]     = useState(false);
  const [step,        setStep]        = useState<1 | 2 | 3 | 4>(autoStart ? 3 : 1);
  const [specialNote, setSpecialNote] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [cancelled,   setCancelled]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SSR-safe portal
  useEffect(() => { setMounted(true); }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cancelled]);

  async function triggerCancel() {
    setCancelled(true);
    try {
      await supabase.rpc("restore_slots_on_cancel", { p_reservation_id: reservation.id });
      await supabase.from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", reservation.id).eq("status", "pending");
    } catch (e) { console.warn("Auto-cancel:", e); }
  }

  async function handleStripePayment() {
    if (!reservation.id) { setError("ID de réservation invalide"); return; }
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
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de paiement");
      setLoading(false);
    }
  }

  const isUrgent   = timeLeft <= 300;
  const base       = reservation.total_price - reservation.platform_fee;
  const fee        = reservation.platform_fee;
  const total      = reservation.total_price;
  const timerColor = isUrgent ? "#EF4444" : "#0D9488";

  if (!mounted) return null;

  // ── Styles inline (plus de dépendance au CSS module) ────────────────────────

  const S = {
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(15,23,42,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      padding: "16px",
    } as React.CSSProperties,

    modal: {
      background: "#FFFFFF",
      borderRadius: 24,
      width: "100%",
      maxWidth: 480,
      maxHeight: "90vh",
      overflowY: "auto" as const,
      boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column" as const,
      position: "relative" as const,
    } as React.CSSProperties,

    head: {
      padding: "24px 24px 0",
      borderBottom: "1px solid #F1F5F9",
      paddingBottom: 16,
    } as React.CSSProperties,

    body: {
      padding: "20px 24px 24px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 16,
    } as React.CSSProperties,

    btnPrimary: {
      width: "100%",
      padding: "14px 20px",
      background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)",
      color: "white",
      border: "none",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: "inherit",
      transition: "opacity 0.15s, transform 0.15s",
      textDecoration: "none",
    } as React.CSSProperties,

    btnSecondary: {
      flex: 1,
      padding: "13px 20px",
      background: "#F8FAFC",
      color: "#475569",
      border: "1px solid #E2E8F0",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: "inherit",
    } as React.CSSProperties,

    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "1px solid #E2E8F0",
      background: "#F8FAFC",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    } as React.CSSProperties,

    infoRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid #F1F5F9",
    } as React.CSSProperties,

    infoIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: "rgba(13,148,136,.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    } as React.CSSProperties,

    stepBar: (active: boolean, done: boolean) => ({
      height: 3,
      borderRadius: 4,
      background: done ? "#0D9488" : active ? "#0D9488" : "#E2E8F0",
      opacity: active ? 1 : done ? 0.6 : 1,
      flex: 1,
      transition: "background 0.3s",
    } as React.CSSProperties),
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const content = (
    <div
      style={S.overlay}
      onClick={e => { if (e.target === e.currentTarget && step !== 4) onClose(); }}
    >
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* ── HEAD ── */}
        <div style={S.head}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: step !== 4 && !cancelled ? 16 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {step > 1 && step < 4 && !cancelled && (
                <button style={S.iconBtn} onClick={() => { setError(""); setStep(s => (s - 1) as 1|2|3|4); }}>
                  <ChevronLeft size={15} color="#64748B" />
                </button>
              )}
              <div>
                {step !== 4 && !cancelled && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 }}>
                    Étape {step} / 3
                  </p>
                )}
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0, letterSpacing: -0.5 }}>
                  {cancelled              && "Réservation expirée"}
                  {!cancelled && step === 1 && "Récapitulatif"}
                  {!cancelled && step === 2 && "Vos informations"}
                  {!cancelled && step === 3 && "Paiement sécurisé"}
                  {!cancelled && step === 4 && "Paiement confirmé"}
                </h2>
              </div>
            </div>
            {step !== 4 && (
              <button style={S.iconBtn} onClick={onClose}>
                <X size={14} color="#64748B" />
              </button>
            )}
          </div>

          {/* Steps + Timer */}
          {step !== 4 && !cancelled && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                {STEPS.map((s, i) => (
                  <div key={s}>
                    <div style={S.stepBar(i === step - 1, i < step - 1)} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: i < step ? "#0D9488" : i === step - 1 ? "#475569" : "#CBD5E1", marginTop: 4, display: "block" }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 14px",
                background: isUrgent ? "rgba(239,68,68,.06)" : "rgba(13,148,136,.06)",
                border: `1px solid ${isUrgent ? "rgba(239,68,68,.2)" : "rgba(13,148,136,.2)"}`,
                borderRadius: 10,
                marginBottom: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Timer size={12} color={timerColor} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: timerColor }}>
                    {isUrgent ? "⏰ Payez maintenant !" : "⏱️ Temps restant"}
                  </span>
                </div>
                <span style={{
                  fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: timerColor,
                  background: isUrgent ? "rgba(239,68,68,.1)" : "rgba(13,148,136,.1)",
                  padding: "3px 12px", borderRadius: 8,
                }}>
                  {fmtCountdown(timeLeft)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── BODY ── */}
        <div style={S.body}>

          {/* EXPIRÉ */}
          {cancelled && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 10, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Timer size={32} color="#EF4444" strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>Délai expiré</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.8 }}>
                  Réservation <span style={{ color: "#475569", fontFamily: "monospace" }}>#{reservation.booking_code}</span> annulée automatiquement.
                </p>
              </div>
              <button onClick={onClose} style={{ ...S.btnPrimary, width: "auto", padding: "13px 36px" }}>
                Fermer
              </button>
            </div>
          )}

          {!cancelled && (
            <>
              {/* ÉTAPE 1 — Récapitulatif */}
              {step === 1 && (
                <>
                  <div style={{ borderRadius: 14, overflow: "hidden", height: 160, position: "relative", background: "linear-gradient(135deg,#F0FDF4,#CCFBF1)" }}>
                    {exc?.photos?.[0] && (
                      <img src={exc.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.45),transparent 60%)" }} />
                    <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
                      <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 4, textShadow: "0 1px 2px rgba(0,0,0,.3)" }}>{exc?.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.9)", display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={10} />{exc?.city}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { lbl: "📅 Date",      val: fmtDate(reservation.date, true) },
                      { lbl: "⏰ Heure",     val: reservation.time               },
                      { lbl: "👥 Voyageurs", val: `${reservation.people_count} pers.` },
                      { lbl: "⏱️ Durée",    val: `${exc?.duration_hours ?? "–"}h` },
                    ].map(({ lbl, val }) => (
                      <div key={lbl} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#94A3B8", marginBottom: 5 }}>{lbl}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ background: "#F8FAFC", padding: "12px 16px", borderBottom: "1px solid #E2E8F0" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#94A3B8" }}>💰 Détail des frais</p>
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
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Total</span>
                        <span style={{ fontSize: 24, fontWeight: 700, color: "#0D9488" }}>{total} EUR</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setStep(2)} style={S.btnPrimary}>
                    Continuer <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* ÉTAPE 2 — Informations */}
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
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#0D9488" }}>
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
                      style={{ width: "100%", padding: "13px 14px", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", color: "#1E293B", background: "#FFFFFF", boxSizing: "border-box" }}
                    />
                  </div>

                  <button onClick={() => setStep(3)} style={S.btnPrimary}>
                    Payer par carte <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* ÉTAPE 3 — Paiement */}
              {step === 3 && (
                <>
                  <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderRadius: 16, padding: 22, textAlign: "center" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                      Montant à payer
                    </p>
                    <p style={{ fontSize: 46, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-2px", lineHeight: 1, marginBottom: 6 }}>
                      {total}<span style={{ fontSize: 18, fontWeight: 500, color: "#94A3B8", marginLeft: 6 }}>EUR</span>
                    </p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>dont {fee} EUR de frais de service</p>
                  </div>

                  <button
                    onClick={handleStripePayment}
                    disabled={loading}
                    style={{
                      ...S.btnPrimary,
                      opacity: loading ? 0.7 : 1,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading
                      ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Redirection Stripe...</>
                      : <><CreditCard size={16} /> Payer par carte bancaire</>
                    }
                  </button>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 12, background: "rgba(13,148,136,.05)", borderRadius: 10 }}>
                    <Lock size={12} color="#0D9488" />
                    <span style={{ fontSize: 11, color: "#64748B" }}>Paiement sécurisé par Stripe</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Visa", "MC", "AMEX"].map(c => (
                        <span key={c} style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: "#fff", borderRadius: 6, border: "1px solid #E2E8F0" }}>{c}</span>
                      ))}
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

              {/* ÉTAPE 4 — Confirmé */}
              {step === 4 && (
                <>
                  <div style={{ textAlign: "center", paddingTop: 8 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(13,148,136,.1)", border: "1px solid rgba(13,148,136,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <CheckCircle size={32} color="#0D9488" strokeWidth={1.5} />
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Paiement confirmé !</h3>
                    <p style={{ fontSize: 14, color: "#64748B" }}>Un email de confirmation vous a été envoyé.</p>
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 18, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg,#F0FDF4,#CCFBF1)", padding: "20px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: 9, color: "rgba(15,23,42,.5)", fontWeight: 700, textTransform: "uppercase" }}>Excursion</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{exc?.title}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: "rgba(15,23,42,.5)", fontWeight: 700, textTransform: "uppercase" }}>Payé</p>
                          <p style={{ fontSize: 24, fontWeight: 700, color: "#0D9488" }}>{total} EUR</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "18px 22px" }}>
                      {[
                        { Icon: Ticket,   lbl: "Code",      val: reservation.booking_code },
                        { Icon: Calendar, lbl: "Date",      val: `${fmtDate(reservation.date, true)} · ${reservation.time}` },
                        { Icon: Users,    lbl: "Voyageurs", val: `${reservation.people_count} pers.` },
                      ].map(({ Icon, lbl, val }, idx, arr) => (
                        <div key={lbl} style={{ ...S.infoRow, borderBottom: idx === arr.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                          <div style={S.infoIcon}><Icon size={14} color="#0D9488" /></div>
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{lbl}</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{val}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} style={S.btnSecondary}>Fermer</button>
                    <Link href="/touriste/historique" style={{ ...S.btnPrimary, flex: 1 }}>
                      Voir historique
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Animation spin globale */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── createPortal → document.body, échappe tout stacking context ─────────────
  return createPortal(content, document.body);
}