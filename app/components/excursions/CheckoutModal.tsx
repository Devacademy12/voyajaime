"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  CalendarDays, MapPin, Wallet, Building2,
  ChevronRight, ChevronLeft, MessageSquare, X, Loader2,
  ShieldCheck, Ticket, Navigation,
  AlertCircle, Timer, History, Users,
  CheckCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────
interface Excursion {
  id: string;
  title: string;
  city: string;
  photos: string[];
  duration_hours: number;
  price_per_person: number;
  meeting_point?: string;
  rating?: number;
}

interface Reservation {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  payment_status?: string | null;
  payment_deadline?: string | null;
  excursion_id?: string;
  excursion: Excursion | null;
}

// ─── Constants ────────────────────────────────────────────────────────
type PayMethod = "cash" | "bank";

const PAY_METHODS: {
  id: PayMethod;
  label: string;
  sub: string;
  Icon: React.ElementType;
}[] = [
  {
    id: "cash",
    label: "Espèces sur place",
    sub: "Paiement à la rencontre avec le guide",
    Icon: Wallet,
  },
  {
    id: "bank",
    label: "Virement bancaire",
    sub: "RIB transmis par email après confirmation",
    Icon: Building2,
  },
];

const STEPS = ["Récapitulatif", "Informations", "Paiement"];

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string, short = false) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (short)
    return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return dt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── CSS ──────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600;700&family=Satoshi:wght@400;500;600;700&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,600,700&display=swap');

  @keyframes cm-spin    { to { transform: rotate(360deg) } }
  @keyframes cm-fadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes cm-slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
  @keyframes cm-pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }

  .cm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .82);
    backdrop-filter: blur(14px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: cm-fadeIn .15s ease;
  }

  .cm-box {
    background: #0D1117;
    border: 1px solid #1E293B;
    border-radius: 26px;
    width: 100%;
    max-width: 460px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 48px 120px rgba(0,0,0,.7);
    overflow: hidden;
    font-family: 'Satoshi', 'DM Sans', system-ui, sans-serif;
    animation: cm-slideUp .25s cubic-bezier(.22,1,.36,1);
  }

  /* Head */
  .cm-head {
    padding: 22px 24px 18px;
    border-bottom: 1px solid #111825;
    flex-shrink: 0;
  }
  .cm-head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0;
  }

  /* Progress */
  .cm-progress {
    display: flex;
    gap: 5px;
    margin: 16px 0 10px;
  }
  .cm-prog-seg {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  .cm-prog-bar {
    height: 2px;
    width: 100%;
    border-radius: 99px;
    transition: background .3s;
  }
  .cm-prog-done     { background: #3DD6AC; }
  .cm-prog-current  { background: #3DD6AC; }
  .cm-prog-pending  { background: #1A2233; }
  .cm-prog-lbl {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Timer */
  .cm-timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 13px;
    border-radius: 10px;
    border: 1px solid;
  }
  .cm-timer-ok     { background: #051A11; border-color: #0D3B26; }
  .cm-timer-urgent { background: #1A0505; border-color: #3B0D0D; animation: cm-pulse .85s ease infinite; }

  /* Scrollable body */
  .cm-body {
    padding: 22px 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .cm-body::-webkit-scrollbar { width: 3px; }
  .cm-body::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 3px; }

  /* Section label */
  .cm-section-lbl {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #334155;
    margin-bottom: 10px;
  }

  /* Info grid */
  .cm-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .cm-info-cell {
    background: #0A0C10;
    border: 1px solid #151C28;
    border-radius: 11px;
    padding: 11px 13px;
  }
  .cm-info-cell-lbl {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: #334155;
    margin-bottom: 4px;
  }
  .cm-info-cell-val {
    font-size: 13px;
    font-weight: 700;
    color: #94A3B8;
  }

  /* Price breakdown */
  .cm-price-box {
    border: 1px solid #1A2233;
    border-radius: 14px;
    overflow: hidden;
  }
  .cm-price-head {
    background: #0A0C10;
    padding: 11px 15px;
    border-bottom: 1px solid #111825;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #334155;
  }
  .cm-price-body {
    padding: 14px 15px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .cm-price-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #475569;
  }
  .cm-price-row span:last-child { font-weight: 700; color: #94A3B8; }
  .cm-price-divider { height: 1px; background: #111825; }
  .cm-price-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 700;
    color: #F1F5F9;
  }
  .cm-price-total-num {
    font-family: 'Clash Display', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #3DD6AC;
    letter-spacing: -.5px;
  }

  /* Total hero */
  .cm-total-hero {
    background: #0A0C10;
    border: 1px solid #1A2233;
    border-radius: 16px;
    padding: 22px;
    text-align: center;
  }

  /* Payment method button */
  .cm-method {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 15px;
    border-radius: 13px;
    border: 1px solid;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: all .15s;
    width: 100%;
    background: none;
  }
  .cm-method-active   { background: #051A11; border-color: #3DD6AC; }
  .cm-method-inactive { background: #0A0C10; border-color: #1A2233; }
  .cm-method-inactive:hover { border-color: #2D3F55; background: #0D1117; }

  /* Buttons */
  .cm-btn-primary {
    width: 100%;
    padding: 15px;
    background: #3DD6AC;
    color: #08090C;
    border: none;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    transition: all .2s;
  }
  .cm-btn-primary:hover:not(:disabled) {
    background: #5FDFBA;
    box-shadow: 0 8px 24px rgba(61,214,172,.28);
  }
  .cm-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

  .cm-btn-ghost {
    flex: 1;
    padding: 13px;
    background: #0A0C10;
    color: #475569;
    border: 1px solid #1A2233;
    border-radius: 13px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: all .2s;
  }
  .cm-btn-ghost:hover { background: #111825; color: #64748B; }

  /* Success ticket */
  .cm-ticket {
    border: 1px solid #1A2233;
    border-radius: 18px;
    overflow: hidden;
  }
  .cm-ticket-head {
    background: linear-gradient(135deg, #0A1628, #0D2240);
    padding: 20px 22px;
  }
  .cm-ticket-body {
    padding: 18px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .cm-ticket-foot {
    border-top: 1.5px dashed #1A2233;
    padding: 12px 22px;
    background: #0A0C10;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .cm-ticket-info { display: flex; align-items: flex-start; gap: 13px; }
  .cm-ticket-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: #0A0C10;
    border: 1px solid #151C28;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .cm-ticket-lbl { font-size: 9px; color: #334155; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
  .cm-ticket-val { font-size: 13px; font-weight: 700; color: #E2E8F0; }

  /* Error banner */
  .cm-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    background: rgba(239,68,68,.07);
    border: 1px solid rgba(239,68,68,.2);
    border-radius: 10px;
    font-size: 13px;
    color: #EF4444;
  }

  /* Expired state */
  .cm-expired-icon {
    width: 68px;
    height: 68px;
    border-radius: 18px;
    background: rgba(239,68,68,.1);
    border: 1px solid rgba(239,68,68,.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
  }

  /* Icon button */
  .cm-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #1E293B;
    background: #0A0C10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .15s;
  }
  .cm-icon-btn:hover { background: #111825; }

  textarea:focus { outline: none; }
`;

// ═══════════════════════════════════════════════════════════════════════
//  CheckoutModal
// ═══════════════════════════════════════════════════════════════════════
export default function CheckoutModal({
  reservation,
  onClose,
  onPaid,
  autoStart = false,
}: {
  reservation: Reservation;
  onClose: () => void;
  onPaid: (id: string) => void;
  autoStart?: boolean;
}) {
  const supabase = createClient();
  const exc = reservation.excursion;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(autoStart ? 3 : 1);
  const [specialNote, setSpecialNote] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function getSecondsLeft() {
    if (!reservation.payment_deadline) return 3600;
    return Math.max(
      0,
      Math.floor(
        (new Date(reservation.payment_deadline).getTime() - Date.now()) / 1000
      )
    );
  }

  const [timeLeft, setTimeLeft] = useState<number>(getSecondsLeft);

  useEffect(() => {
    if (step === 4 || cancelled) return;
    const remaining = getSecondsLeft();
    if (remaining <= 0) {
      triggerCancel();
      return;
    }
    setTimeLeft(remaining);
    timerRef.current = setInterval(() => {
      const left = getSecondsLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current!);
        triggerCancel();
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cancelled]);

  async function triggerCancel() {
    setCancelled(true);
    try {
      await supabase.rpc("restore_slots_on_cancel", {
        p_reservation_id: reservation.id,
      });
      await supabase
        .from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", reservation.id)
        .eq("status", "pending");
    } catch (e) {
      console.warn("Auto-cancel:", e);
    }
  }

  function fmtCountdown(secs: number) {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const isUrgent = timeLeft <= 300;
  const base = reservation.total_price - reservation.platform_fee;
  const fee = reservation.platform_fee;
  const total = reservation.total_price;

  // ── Add to history ─────────────────────────────────────────────────
  async function addToHistory(paymentMethod: PayMethod) {
    try {
      const { data: res, error } = await supabase
        .from("reservations")
        .select(
          "id, booking_code, date, time, people_count, total_price, platform_fee, excursion_id, excursions:excursions!reservations_excursion_id_fkey(id, title, city)"
        )
        .eq("id", reservation.id)
        .single();
      if (error || !res) return;
      const excursionData = Array.isArray(res.excursions)
        ? res.excursions[0]
        : res.excursions;
      await supabase.from("historique_reservations").insert({
        original_reservation_id: res.id,
        booking_code: res.booking_code,
        excursion_id: excursionData?.id || null,
        excursion_title: excursionData?.title || null,
        excursion_city: excursionData?.city || null,
        date: res.date,
        time: res.time,
        people_count: res.people_count,
        total_price: res.total_price,
        platform_fee: res.platform_fee,
        payment_method: paymentMethod,
        payment_status: "paid",
        payment_date: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("addToHistory:", e);
    }
  }

  // ── Notify n8n ─────────────────────────────────────────────────────
  async function notifyN8n(method: PayMethod) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    fetch("/api/n8n-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "payment_confirmed",
        touriste_name:
          user?.user_metadata?.full_name || user?.email || "Touriste",
        touriste_email: user?.email || "",
        excursion_title: exc?.title || "Excursion",
        excursion_city: exc?.city || "",
        booking_code: reservation.booking_code,
        date: reservation.date,
        people_count: reservation.people_count,
        total_price: total,
        payment_method: method,
        special_notes: specialNote || "",
      }),
    }).catch((err) => console.warn("[n8n]:", err));
  }

  // ── Confirm payment ────────────────────────────────────────────────
  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const { error: e1 } = await supabase
        .from("reservations")
        .update({
          payment_status: "paid",
          payment_method: payMethod,
          special_notes: specialNote || null,
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", reservation.id);
      if (e1) throw e1;
      await addToHistory(payMethod);
      await notifyN8n(payMethod);
      if (timerRef.current) clearInterval(timerRef.current);
      setStep(4);
      onPaid(reservation.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de la confirmation."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Back button ────────────────────────────────────────────────────
  function goBack() {
    setError("");
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  }

  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div
        className="cm-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && step !== 4) onClose();
        }}
      >
        <div className="cm-box">
          {/* ── HEAD ── */}
          <div className="cm-head">
            <div className="cm-head-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {step > 1 && step < 4 && !cancelled && (
                  <button className="cm-icon-btn" onClick={goBack}>
                    <ChevronLeft size={14} color="#64748B" />
                  </button>
                )}
                <div>
                  {step !== 4 && !cancelled && (
                    <p
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#334155",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        marginBottom: 3,
                      }}
                    >
                      Étape {step} / 3
                    </p>
                  )}
                  <h2
                    style={{
                      fontFamily: "'Clash Display', sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#F1F5F9",
                      letterSpacing: "-.4px",
                    }}
                  >
                    {cancelled && "Réservation expirée"}
                    {!cancelled && step === 1 && "Récapitulatif"}
                    {!cancelled && step === 2 && "Vos informations"}
                    {!cancelled && step === 3 && "Mode de paiement"}
                    {!cancelled && step === 4 && "Paiement confirmé"}
                  </h2>
                </div>
              </div>

              {step !== 4 && (
                <button className="cm-icon-btn" onClick={onClose}>
                  <X size={14} color="#64748B" />
                </button>
              )}
            </div>

            {/* Progress + Timer (steps 1-3, not cancelled) */}
            {step !== 4 && !cancelled && (
              <>
                <div className="cm-progress">
                  {STEPS.map((s, i) => (
                    <div key={s} className="cm-prog-seg">
                      <div
                        className={`cm-prog-bar ${
                          i < step
                            ? "cm-prog-done"
                            : i === step - 1
                            ? "cm-prog-current"
                            : "cm-prog-pending"
                        }`}
                      />
                      <span
                        className="cm-prog-lbl"
                        style={{
                          color:
                            i < step
                              ? "#3DD6AC"
                              : i === step - 1
                              ? "#94A3B8"
                              : "#334155",
                        }}
                      >
                        {s}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className={`cm-timer ${
                    isUrgent ? "cm-timer-urgent" : "cm-timer-ok"
                  }`}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Timer
                      size={12}
                      color={isUrgent ? "#EF4444" : "#3DD6AC"}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: isUrgent ? "#EF4444" : "#3DD6AC",
                      }}
                    >
                      {isUrgent ? "Payez maintenant !" : "Temps restant"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 900,
                      color: isUrgent ? "#EF4444" : "#3DD6AC",
                      background: isUrgent
                        ? "rgba(239,68,68,.1)"
                        : "rgba(61,214,172,.1)",
                      padding: "3px 12px",
                      borderRadius: 8,
                    }}
                  >
                    {fmtCountdown(timeLeft)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="cm-body">

            {/* ── EXPIRED ── */}
            {cancelled && (
              <div
                style={{
                  textAlign: "center",
                  padding: "10px 0 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div className="cm-expired-icon">
                  <Timer size={30} color="#EF4444" strokeWidth={1.5} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Clash Display',sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#F1F5F9",
                      marginBottom: 8,
                      letterSpacing: "-.4px",
                    }}
                  >
                    Délai expiré
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#64748B",
                      lineHeight: 1.8,
                    }}
                  >
                    La réservation{" "}
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "#94A3B8",
                        fontSize: 12,
                      }}
                    >
                      #{reservation.booking_code}
                    </span>{" "}
                    a été annulée automatiquement.
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(245,158,11,.07)",
                    border: "1px solid rgba(245,158,11,.2)",
                    borderRadius: 12,
                    padding: "13px 16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: "#F59E0B",
                      fontWeight: 600,
                    }}
                  >
                    Créez une nouvelle réservation depuis les excursions.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    padding: "13px 36px",
                    background: "#3DD6AC",
                    color: "#08090C",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Fermer
                </button>
              </div>
            )}

            {!cancelled && (
              <>
                {/* ── STEP 1 — Review ── */}
                {step === 1 && (
                  <>
                    {/* Excursion photo + title */}
                    <div
                      style={{
                        borderRadius: 13,
                        overflow: "hidden",
                        height: 150,
                        position: "relative",
                        background:
                          "linear-gradient(135deg,#0A1A2E,#0D2240)",
                        flexShrink: 0,
                      }}
                    >
                      {exc?.photos?.[0] && (
                        <img
                          src={exc.photos[0]}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: "brightness(.72)",
                          }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top,rgba(8,9,12,.85),transparent 55%)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 13,
                          left: 15,
                          right: 15,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Clash Display',sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#F1F5F9",
                            marginBottom: 5,
                            letterSpacing: "-.3px",
                          }}
                        >
                          {exc?.title}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,.6)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <MapPin size={10} />
                          {exc?.city}
                        </p>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="cm-info-grid">
                      {[
                        { lbl: "Date", val: fmtDate(reservation.date, true) },
                        { lbl: "Heure", val: reservation.time },
                        {
                          lbl: "Voyageurs",
                          val: `${reservation.people_count} pers.`,
                        },
                        {
                          lbl: "Durée",
                          val: `${exc?.duration_hours ?? "–"}h`,
                        },
                      ].map(({ lbl, val }) => (
                        <div key={lbl} className="cm-info-cell">
                          <p className="cm-info-cell-lbl">{lbl}</p>
                          <p className="cm-info-cell-val">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Price breakdown */}
                    <div className="cm-price-box">
                      <div className="cm-price-head">Détail des frais</div>
                      <div className="cm-price-body">
                        <div className="cm-price-row">
                          <span>
                            {exc?.price_per_person} TND ×{" "}
                            {reservation.people_count} pers.
                          </span>
                          <span>{base} TND</span>
                        </div>
                        <div className="cm-price-row">
                          <span>Frais de service</span>
                          <span>{fee} TND</span>
                        </div>
                        <div className="cm-price-divider" />
                        <div className="cm-price-total">
                          <span>Total</span>
                          <span className="cm-price-total-num">
                            {total} TND
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Free cancellation */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 13px",
                        background: "rgba(61,214,172,.05)",
                        border: "1px solid rgba(61,214,172,.15)",
                        borderRadius: 10,
                      }}
                    >
                      <ShieldCheck size={13} color="#3DD6AC" />
                      <span
                        style={{
                          fontSize: 12,
                          color: "#3DD6AC",
                          fontWeight: 600,
                        }}
                      >
                        Annulation gratuite jusqu'à 24h avant
                      </span>
                    </div>

                    <button
                      className="cm-btn-primary"
                      onClick={() => setStep(2)}
                    >
                      Continuer <ChevronRight size={15} />
                    </button>
                  </>
                )}

                {/* ── STEP 2 — Info / special needs ── */}
                {step === 2 && (
                  <>
                    {/* Mini recap */}
                    <div
                      style={{
                        display: "flex",
                        gap: 11,
                        background: "#0A0C10",
                        border: "1px solid #151C28",
                        borderRadius: 13,
                        padding: "13px 15px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 9,
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "#1A2233",
                        }}
                      >
                        {exc?.photos?.[0] && (
                          <img
                            src={exc.photos[0]}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#E2E8F0",
                            margin: "0 0 3px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {exc?.title}
                        </p>
                        <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>
                          {fmtDate(reservation.date)} · {reservation.people_count} pers.
                        </p>
                      </div>
                      <p
                        style={{
                          fontFamily: "'Clash Display',sans-serif",
                          fontSize: 17,
                          fontWeight: 700,
                          color: "#3DD6AC",
                          flexShrink: 0,
                        }}
                      >
                        {total}{" "}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: "#334155",
                          }}
                        >
                          TND
                        </span>
                      </p>
                    </div>

                    {/* Special needs */}
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#94A3B8",
                          marginBottom: 10,
                        }}
                      >
                        <MessageSquare size={12} color="#3DD6AC" />
                        Besoins spéciaux
                        <span
                          style={{
                            fontSize: 11,
                            color: "#334155",
                            fontWeight: 400,
                          }}
                        >
                          — optionnel
                        </span>
                      </label>
                      <textarea
                        value={specialNote}
                        onChange={(e) => setSpecialNote(e.target.value)}
                        placeholder="Handicap, allergies, préférences particulières…"
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "12px 13px",
                          border: "1px solid #1A2233",
                          borderRadius: 11,
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical",
                          color: "#E2E8F0",
                          background: "#0A0C10",
                          boxSizing: "border-box",
                          lineHeight: 1.6,
                          transition: "border-color .2s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#3DD6AC")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "#1A2233")
                        }
                      />
                    </div>

                    <button
                      className="cm-btn-primary"
                      onClick={() => setStep(3)}
                    >
                      Choisir le paiement <ChevronRight size={15} />
                    </button>
                  </>
                )}

                {/* ── STEP 3 — Payment method ── */}
                {step === 3 && (
                  <>
                    {/* Total hero */}
                    <div className="cm-total-hero">
                      <p
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#334155",
                          textTransform: "uppercase",
                          letterSpacing: 2,
                          marginBottom: 8,
                        }}
                      >
                        Montant total
                      </p>
                      <p
                        style={{
                          fontFamily: "'Clash Display',sans-serif",
                          fontSize: 44,
                          fontWeight: 700,
                          color: "#F1F5F9",
                          letterSpacing: "-2px",
                          lineHeight: 1,
                          marginBottom: 6,
                        }}
                      >
                        {total}
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: "#334155",
                            marginLeft: 8,
                          }}
                        >
                          TND
                        </span>
                      </p>
                      <p style={{ fontSize: 11, color: "#334155" }}>
                        dont {fee} TND de frais de service
                      </p>
                    </div>

                    {/* Methods */}
                    <div>
                      <p className="cm-section-lbl">Méthode de paiement</p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {PAY_METHODS.map((m) => (
                          <button
                            key={m.id}
                            className={`cm-method ${
                              payMethod === m.id
                                ? "cm-method-active"
                                : "cm-method-inactive"
                            }`}
                            onClick={() => {
                              setPayMethod(m.id);
                              setError("");
                            }}
                          >
                            {/* Icon */}
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 10,
                                background:
                                  payMethod === m.id
                                    ? "rgba(61,214,172,.15)"
                                    : "#151C28",
                                border: `1px solid ${
                                  payMethod === m.id
                                    ? "rgba(61,214,172,.3)"
                                    : "#1A2233"
                                }`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "all .15s",
                              }}
                            >
                              <m.Icon
                                size={17}
                                color={
                                  payMethod === m.id ? "#3DD6AC" : "#475569"
                                }
                                strokeWidth={1.5}
                              />
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1 }}>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color:
                                    payMethod === m.id ? "#E2E8F0" : "#64748B",
                                  margin: "0 0 2px",
                                }}
                              >
                                {m.label}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#334155",
                                  margin: 0,
                                }}
                              >
                                {m.sub}
                              </p>
                            </div>

                            {/* Radio */}
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: `2px solid ${
                                  payMethod === m.id ? "#3DD6AC" : "#334155"
                                }`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {payMethod === m.id && (
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#3DD6AC",
                                  }}
                                />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info note per method */}
                    <div
                      style={{
                        padding: "11px 13px",
                        background:
                          payMethod === "cash"
                            ? "rgba(245,158,11,.07)"
                            : "rgba(96,165,250,.07)",
                        border: `1px solid ${
                          payMethod === "cash"
                            ? "rgba(245,158,11,.2)"
                            : "rgba(96,165,250,.2)"
                        }`,
                        borderRadius: 10,
                        fontSize: 12,
                        color: payMethod === "cash" ? "#F59E0B" : "#60A5FA",
                        fontWeight: 600,
                        lineHeight: 1.6,
                      }}
                    >
                      {payMethod === "cash"
                        ? "💵 Vous paierez directement le guide au point de rendez-vous. Munissez-vous du montant exact."
                        : "🏦 Vous recevrez le RIB par email après confirmation. Le paiement doit être effectué sous 48h."}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="cm-error">
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        {error}
                      </div>
                    )}

                    {/* Confirm button */}
                    <button
                      className="cm-btn-primary"
                      onClick={handleConfirm}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2
                            size={15}
                            style={{ animation: "cm-spin 1s linear infinite" }}
                          />
                          Confirmation…
                        </>
                      ) : (
                        <>
                          <CheckCircle size={15} />
                          Confirmer la réservation · {total} TND
                        </>
                      )}
                    </button>

                    <p
                      style={{
                        textAlign: "center",
                        fontSize: 11,
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                      }}
                    >
                      <ShieldCheck size={11} /> Réservation sécurisée ·
                      VoyajAime
                    </p>
                  </>
                )}

                {/* ── STEP 4 — Success ── */}
                {step === 4 && (
                  <>
                    {/* Success header */}
                    <div style={{ textAlign: "center", paddingTop: 6 }}>
                      <div
                        style={{
                          width: 62,
                          height: 62,
                          borderRadius: 16,
                          background: "rgba(61,214,172,.1)",
                          border: "1px solid rgba(61,214,172,.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 14px",
                        }}
                      >
                        <CheckCircle
                          size={30}
                          color="#3DD6AC"
                          strokeWidth={1.5}
                        />
                      </div>
                      <h3
                        style={{
                          fontFamily: "'Clash Display',sans-serif",
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#F1F5F9",
                          marginBottom: 6,
                          letterSpacing: "-.4px",
                        }}
                      >
                        Réservation confirmée
                      </h3>
                      <p style={{ fontSize: 13, color: "#475569" }}>
                        Un email de confirmation vous a été envoyé.
                      </p>
                    </div>

                    {/* Ticket */}
                    <div className="cm-ticket">
                      <div className="cm-ticket-head">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: 9,
                                color: "rgba(255,255,255,.4)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 1.5,
                                marginBottom: 5,
                              }}
                            >
                              Excursion
                            </p>
                            <p
                              style={{
                                fontFamily: "'Clash Display',sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: "white",
                                marginBottom: 5,
                                letterSpacing: "-.3px",
                              }}
                            >
                              {exc?.title}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,.5)",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <MapPin size={10} />
                              {exc?.city}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p
                              style={{
                                fontSize: 9,
                                color: "rgba(255,255,255,.4)",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 1.5,
                                marginBottom: 5,
                              }}
                            >
                              Montant
                            </p>
                            <p
                              style={{
                                fontFamily: "'Clash Display',sans-serif",
                                fontSize: 22,
                                fontWeight: 700,
                                color: "#3DD6AC",
                              }}
                            >
                              {total} TND
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="cm-ticket-body">
                        {[
                          {
                            Icon: Ticket,
                            lbl: "Code",
                            val: reservation.booking_code,
                          },
                          {
                            Icon: CalendarDays,
                            lbl: "Date · Heure",
                            val: `${fmtDate(reservation.date, true)} · ${reservation.time}`,
                          },
                          {
                            Icon: Users,
                            lbl: "Voyageurs",
                            val: `${reservation.people_count} personne${reservation.people_count > 1 ? "s" : ""}`,
                          },
                          {
                            Icon: Navigation,
                            lbl: "Point de RDV",
                            val:
                              exc?.meeting_point ||
                              exc?.city ||
                              "Communiqué par le prestataire",
                          },
                        ].map(({ Icon, lbl, val }) => (
                          <div key={lbl} className="cm-ticket-info">
                            <div className="cm-ticket-icon">
                              <Icon
                                size={13}
                                color="#3DD6AC"
                                strokeWidth={1.5}
                              />
                            </div>
                            <div>
                              <p className="cm-ticket-lbl">{lbl}</p>
                              <p className="cm-ticket-val">{val}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="cm-ticket-foot">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#3DD6AC",
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#3DD6AC",
                            }}
                          >
                            Confirmée
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#334155",
                            fontFamily: "monospace",
                          }}
                        >
                          #{reservation.booking_code}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="cm-btn-ghost" onClick={onClose}>
                        Fermer
                      </button>
                      <Link
                        href="/touriste/historique"
                        onClick={onClose}
                        style={{
                          flex: 2,
                          padding: 13,
                          background: "#3DD6AC",
                          color: "#08090C",
                          borderRadius: 13,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7,
                        }}
                      >
                        <History size={14} /> Voir l'historique
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}