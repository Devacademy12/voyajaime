"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  CalendarDays, MapPin, Clock, Users, Sparkles,
  CheckCircle, CreditCard, Wallet, Building2,
  ChevronRight, ChevronLeft, MessageSquare, X, Loader2,
  ShieldCheck, ArrowRight, Ticket, Phone, Navigation,
  AlertCircle, ExternalLink, Timer, History,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface Excursion {
  title: string;
  city: string;
  photos: string[];
  duration_hours: number;
  price_per_person: number;
  meeting_point?: string;
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
  excursion: Excursion | null;
}

// ─── Constantes ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string;
}> = {
  pending:   { label: "En attente", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A", dot: "#F59E0B" },
  confirmed: { label: "Confirmée",  color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7", dot: "#10B981" },
  completed: { label: "Terminée",   color: "#1E40AF", bg: "#DBEAFE", border: "#93C5FD", dot: "#3B82F6" },
  cancelled: { label: "Annulée",    color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444" },
};

type PayMethod = "flouci" | "cash" | "bank";

const PAY_METHODS: { id: PayMethod; label: string; sub: string; Icon: React.ElementType }[] = [
  { id: "flouci", label: "Paiement en ligne",   sub: "Carte bancaire · CIB · Flouci",  Icon: CreditCard },
  { id: "cash",   label: "Espèces sur place",   sub: "Paiement à la rencontre",         Icon: Wallet     },
  { id: "bank",   label: "Virement bancaire",   sub: "RIB transmis par email",          Icon: Building2  },
];

const STEPS = ["Revue", "Informations", "Paiement"];

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string, short = false) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (short) return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ─── CSS global ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes rspin  { from { transform: rotate(0deg)   } to { transform: rotate(360deg) } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
  @keyframes pulse  { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
  .resa-card { animation: fadeIn .3s ease both; }
  .resa-card:hover { box-shadow: 0 10px 32px rgba(0,0,0,.12) !important; transform: translateY(-2px) !important; }
  .pay-method:hover { border-color: #2B96A8 !important; background: #F0FDF9 !important; }
  .pay-btn-primary { background: #2B96A8; color: white; }
  .pay-btn-primary:hover { background: #1e7a8a; box-shadow: 0 6px 20px rgba(43,150,168,.4); }
  .pay-btn-dark { background: #111827; color: white; }
  .pay-btn-dark:hover { background: #1f2937; }
  .timer-urgent { animation: pulse .8s ease-in-out infinite; }
`;

// ═══════════════════════════════════════════════════════════════════════
//  CheckoutModal
// ═══════════════════════════════════════════════════════════════════════
function CheckoutModal({
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
  const exc      = reservation.excursion;

  const [step,        setStep]      = useState<1 | 2 | 3 | 4>(autoStart ? 3 : 1);
  const [specialNote, setSpecialNote] = useState("");
  const [payMethod,   setPayMethod]   = useState<PayMethod>("flouci");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [flouciUrl,   setFlouciUrl]   = useState<string | null>(null);
  const [cancelled,   setCancelled]   = useState(false);

  // ── Calcul du temps restant ─────────────────────────────────────────
  function getSecondsLeft() {
    if (!reservation.payment_deadline) return 3600;
    const deadline = new Date(reservation.payment_deadline).getTime();
    const now      = Date.now();
    const diff     = Math.floor((deadline - now) / 1000);
    return Math.max(0, diff);
  }

  const [timeLeft, setTimeLeft] = useState<number>(getSecondsLeft);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === 4 || cancelled) return;

    const remaining = getSecondsLeft();
    if (remaining <= 0) { triggerCancel(); return; }
    setTimeLeft(remaining);

    timerRef.current = setInterval(() => {
      const left = getSecondsLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current!);
        triggerCancel();
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cancelled, reservation.payment_deadline]);

  async function triggerCancel() {
    setCancelled(true);
    try {
      await supabase
        .from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", reservation.id)
        .eq("status", "pending");
    } catch (e) {
      console.warn("Auto-cancel error:", e);
    }
  }

  function fmtCountdown(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const isUrgent = timeLeft <= 300;

  const base  = reservation.total_price - reservation.platform_fee;
  const fee   = reservation.platform_fee;
  const total = reservation.total_price;

  // ── Copie dans l'historique après paiement ──────────────────────────
  async function addToHistory() {
    try {
      const { data: res, error } = await supabase
        .from("reservations")
        .select(`
          id, booking_code, date, time, people_count, total_price, platform_fee,
          payment_method, status, excursion:excursions(title, city)
        `)
        .eq("id", reservation.id)
        .single();

      if (error || !res) return;

      await supabase
        .from("historique_reservations")
        .insert({
          original_reservation_id: res.id,
          booking_code: res.booking_code,
          excursion_title: res.excursion?.title,
          excursion_city: res.excursion?.city,
          date: res.date,
          time: res.time,
          people_count: res.people_count,
          total_price: res.total_price,
          platform_fee: res.platform_fee,
          payment_method: res.payment_method || payMethod,
          payment_status: "paid",
          payment_date: new Date().toISOString(),
        });
    } catch (e) {
      console.warn("addToHistory error:", e);
    }
  }

  // ── Notification n8n ────────────────────────────────────────────────
  async function notifyN8n(method: PayMethod) {
    const { data: { user } } = await supabase.auth.getUser();
    fetch("/api/n8n-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event:             "payment_confirmed",
        touriste_name:     user?.user_metadata?.full_name || user?.email || "Touriste",
        touriste_email:    user?.email || "",
        excursion_title:   exc?.title   || "Excursion",
        excursion_city:    exc?.city    || "",
        prestataire_name:  "Prestataire",
        prestataire_email: process.env.NEXT_PUBLIC_PRESTATAIRE_NOTIFY_EMAIL || "",
        booking_code:      reservation.booking_code,
        date:              reservation.date,
        people_count:      reservation.people_count,
        total_price:       total,
        payment_method:    method,
        special_notes:     specialNote || "",
      }),
    }).catch(err => console.warn("[n8n] non disponible:", err));
  }

  // ── Paiement Flouci ─────────────────────────────────────────────────
  async function handleFlouci() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/paiement/flouci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reservation_id: reservation.id,
          special_notes: specialNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur Flouci");
      
      if (specialNote) {
        await supabase.from("reservations").update({ special_notes: specialNote }).eq("id", reservation.id);
      }
      
      setFlouciUrl(data.payment_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'initialisation du paiement.");
    } finally {
      setLoading(false);
    }
  }

  // ── Paiement cash / virement ────────────────────────────────────────
  async function handleLocalPay() {
    setLoading(true);
    setError("");
    try {
      const { error: e1 } = await supabase
        .from("reservations")
        .update({
          payment_status: "paid",
          payment_method: payMethod,
          special_notes:  specialNote || null,
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", reservation.id);

      if (e1) throw e1;

      // ✅ Copie dans l'historique
      await addToHistory();
      await notifyN8n(payMethod);

      if (timerRef.current) clearInterval(timerRef.current);

      setStep(4);
      onPaid(reservation.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la confirmation.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (payMethod === "flouci") await handleFlouci();
    else await handleLocalPay();
  }

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && step !== 4) onClose();
  }, [step, onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(17,24,39,.72)",
        backdropFilter: "blur(8px)",
        zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={handleOverlayClick}
    >
      <div style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: 520,
        maxHeight: "94vh", overflowY: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,.3)",
        display: "flex", flexDirection: "column",
      }}>

        {/* ── Sticky header ── */}
        <div style={{
          position: "sticky", top: 0, background: "white", zIndex: 10,
          borderBottom: "1px solid #F3F4F6", padding: "20px 24px 16px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: step !== 4 && !cancelled ? 16 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {step > 1 && step < 4 && !cancelled && (
                <button
                  onClick={() => { setError(""); setFlouciUrl(null); setStep(s => (s - 1) as 1|2|3|4); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronLeft size={16} color="#374151" />
                </button>
              )}
              <div>
                {step !== 4 && !cancelled && (
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                    Étape {step} sur 3
                  </p>
                )}
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
                  {cancelled          && "⏱ Réservation expirée"}
                  {!cancelled && step === 1 && "Revue de la réservation"}
                  {!cancelled && step === 2 && "Informations voyageur"}
                  {!cancelled && step === 3 && "Paiement"}
                  {!cancelled && step === 4 && "✓ Paiement confirmé"}
                </h2>
              </div>
            </div>
            {step !== 4 && (
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={15} color="#374151" />
              </button>
            )}
          </div>

          {/* Barre de progression */}
          {step !== 4 && !cancelled && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ height: 3, borderRadius: 99, background: i < step ? "#2B96A8" : "#E5E7EB", transition: "background .3s" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: i < step ? "#2B96A8" : i === step - 1 ? "#111827" : "#9CA3AF", textAlign: "center" }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Compte à rebours ── */}
          {step !== 4 && !cancelled && (
            <div
              className={isUrgent ? "timer-urgent" : ""}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 14px",
                background: isUrgent ? "#FEF2F2" : "#F0FDF9",
                border: `1.5px solid ${isUrgent ? "#FCA5A5" : "#A7F3D0"}`,
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Timer size={13} color={isUrgent ? "#DC2626" : "#059669"} strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 600, color: isUrgent ? "#DC2626" : "#059669" }}>
                  {isUrgent ? "⚠ Dernier délai — payez vite !" : "Temps restant pour payer"}
                </span>
              </div>
              <span style={{
                fontFamily: "monospace", fontSize: 15, fontWeight: 900,
                color: isUrgent ? "#DC2626" : "#065F46",
                background: isUrgent ? "#FEE2E2" : "#D1FAE5",
                padding: "2px 10px", borderRadius: 8,
              }}>
                {fmtCountdown(timeLeft)}
              </span>
            </div>
          )}
          

          {/* ⭐ MESSAGE D'INFORMATION EXPIRATION ⭐ */}
          {step !== 4 && !cancelled && (
            <div style={{
              padding: "10px 14px",
              background: "#FEF3C7",
              borderLeft: "4px solid #F59E0B",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <AlertCircle size={16} color="#D97706" />
              <span style={{ fontSize: 12, color: "#92400E" }}>
                ⏰ Cette réservation sera <strong>automatiquement annulée</strong> si le paiement n'est pas finalisé sous <strong>1 heure</strong>.
              </span>
            </div>
          )}
        </div>

        {/* ── Contenu scrollable ── */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>

          {/* ══ ÉCRAN EXPIRÉ ════════════════════════════════════════════ */}
          {cancelled && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 12, textAlign: "center" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg,#FEE2E2,#FECaca)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "4px solid #FCA5A5",
              }}>
                <Timer size={38} color="#EF4444" strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 8 }}>Délai expiré</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.8, maxWidth: 340 }}>
                  Votre réservation <strong style={{ color: "#374151" }}>#{reservation.booking_code}</strong> a été
                  {" "}<strong style={{ color: "#DC2626" }}>automatiquement annulée</strong> car le délai d'1 heure
                  pour effectuer le paiement est dépassé.
                </p>
              </div>
              <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", maxWidth: 340 }}>
                <p style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>
                  💡 Vous pouvez créer une nouvelle réservation à tout moment depuis la page des excursions.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ padding: "13px 36px", background: "#111827", color: "white", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
              >
                Fermer
              </button>
            </div>
          )}

          {!cancelled && (<>

          {/* ══ STEP 1 — Revue ══════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ borderRadius: 16, overflow: "hidden", height: 180, background: "linear-gradient(135deg,#2B96A8,#0e7490)", position: "relative" }}>
                {exc?.photos?.[0] && <img src={exc.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 50%)" }} />
                <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 4 }}>{exc?.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={12} color="rgba(255,255,255,.8)" strokeWidth={2} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,.9)", fontWeight: 500 }}>{exc?.city}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Date",      value: fmtDate(reservation.date, true),     Icon: CalendarDays },
                  { label: "Heure",     value: reservation.time,                     Icon: Clock        },
                  { label: "Voyageurs", value: `${reservation.people_count} pers.`, Icon: Users        },
                  { label: "Durée",     value: `${exc?.duration_hours ?? "–"}h`,     Icon: Clock        },
                ].map(({ label, value, Icon }) => (
                  <div key={label} style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", border: "1px solid #F3F4F6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Icon size={13} color="#9CA3AF" strokeWidth={1.5} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .5 }}>{label}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ background: "#F9FAFB", padding: "14px 18px", borderBottom: "1px solid #E5E7EB" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: .8 }}>Détail des frais</p>
                </div>
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: "#374151" }}>{exc?.price_per_person} TND × {reservation.people_count} pers.</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{base} TND</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: "#374151" }}>Frais de service</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{fee} TND</span>
                  </div>
                  <div style={{ height: 1, background: "#E5E7EB" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#2B96A8" }}>{total} TND</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                <ShieldCheck size={16} color="#16A34A" strokeWidth={1.5} />
                <span style={{ fontSize: 13, color: "#15803D", fontWeight: 600 }}>Annulation gratuite jusqu'à 24h avant</span>
              </div>

              <button onClick={() => setStep(2)} className="pay-btn-dark"
                style={{ width: "100%", padding: 15, border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}>
                Continuer <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* ══ STEP 2 — Informations ═══════════════════════════════════ */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "12px 14px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#E5E7EB" }}>
                  {exc?.photos?.[0] && <img src={exc.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{exc?.title}</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>{fmtDate(reservation.date)} · {reservation.people_count} pers.</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{total} <span style={{ fontSize: 11, fontWeight: 500 }}>TND</span></p>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
                  <MessageSquare size={14} color="#2B96A8" strokeWidth={2} />
                  Besoins spéciaux
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400, marginLeft: 4 }}>— optionnel</span>
                </label>
                <textarea
                  value={specialNote}
                  onChange={e => setSpecialNote(e.target.value)}
                  placeholder="Handicap, allergies, préférences particulières…"
                  rows={4}
                  style={{
                    width: "100%", padding: "13px 14px",
                    border: "1.5px solid #E5E7EB", borderRadius: 12,
                    fontSize: 14, fontFamily: "inherit", outline: "none",
                    resize: "vertical", color: "#111827", background: "#FAFAFA",
                    boxSizing: "border-box", lineHeight: 1.6, transition: "border-color .2s",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#2B96A8")}
                  onBlur={e  => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>

              <button onClick={() => setStep(3)} className="pay-btn-dark"
                style={{ width: "100%", padding: 15, border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}>
                Passer au paiement <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* ══ STEP 3 — Paiement ═══════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "linear-gradient(135deg,#0e7490,#2B96A8)", borderRadius: 18, padding: "22px 24px", color: "white", textAlign: "center" }}>
                <p style={{ fontSize: 13, opacity: .8, marginBottom: 6, fontWeight: 500 }}>Montant total à payer</p>
                <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1px" }}>
                  {total} <span style={{ fontSize: 18, fontWeight: 600, opacity: .8 }}>TND</span>
                </p>
                <p style={{ fontSize: 12, opacity: .65, marginTop: 6 }}>dont {fee} TND de frais de service</p>
              </div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Choisissez votre méthode de paiement</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PAY_METHODS.map(m => (
                    <button key={m.id} className="pay-method"
                      onClick={() => { setPayMethod(m.id); setError(""); setFlouciUrl(null); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                        border: `2px solid ${payMethod === m.id ? "#2B96A8" : "#E5E7EB"}`,
                        borderRadius: 14, background: payMethod === m.id ? "#EFF9FB" : "white",
                        cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "inherit",
                      }}
                    >
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: payMethod === m.id ? "#2B96A8" : "#F3F4F6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "background .15s",
                      }}>
                        <m.Icon size={18} color={payMethod === m.id ? "white" : "#6B7280"} strokeWidth={1.5} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{m.label}</p>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{m.sub}</p>
                      </div>
                      {m.id === "flouci" && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", background: "#DCFCE7", color: "#15803D", borderRadius: 20 }}>
                          Recommandé
                        </span>
                      )}
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: `2px solid ${payMethod === m.id ? "#2B96A8" : "#D1D5DB"}`,
                        background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {payMethod === m.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2B96A8" }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ display: "flex", gap: 8, padding: "11px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12 }}>
                  <AlertCircle size={15} color="#DC2626" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: "#DC2626" }}>{error}</span>
                </div>
              )}

              {flouciUrl && (
                <div style={{ padding: "14px 16px", background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={14} strokeWidth={2.5} /> Lien de paiement prêt
                  </p>
                  <a href={flouciUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px", background: "#16A34A", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                    <ExternalLink size={15} /> Payer {total} TND via Flouci
                  </a>
                  <p style={{ fontSize: 11, color: "#6B7280", textAlign: "center", marginTop: 8 }}>
                    Vous serez redirigé vers la page sécurisée Flouci
                  </p>
                </div>
              )}

              {!flouciUrl && (
                <button onClick={handlePay} disabled={loading} className="pay-btn-primary"
                  style={{
                    width: "100%", padding: 16, border: "none", borderRadius: 14,
                    fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(43,150,168,.4)", transition: "all .2s",
                  }}>
                  {loading
                    ? <><Loader2 size={17} style={{ animation: "rspin 1s linear infinite" }} /> Traitement en cours…</>
                    : payMethod === "flouci"
                      ? <><CreditCard size={17} strokeWidth={2} /> Générer le lien Flouci · {total} TND</>
                      : <><CheckCircle size={17} strokeWidth={2.5} /> Confirmer · {total} TND</>
                  }
                </button>
              )}

              <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <ShieldCheck size={12} color="#9CA3AF" strokeWidth={1.5} />
                Paiement 100% sécurisé · VoyajAime
              </p>
            </div>
          )}

          {/* ══ STEP 4 — Succès ════════════════════════════════════════ */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>

              <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", background: "#D1FAE5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", border: "4px solid #A7F3D0",
                }}>
                  <CheckCircle size={36} color="#10B981" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 6 }}>Paiement enregistré !</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
                  Votre réservation est confirmée et ajoutée à votre historique. 📧
                </p>
              </div>

              {/* Ticket */}
              <div style={{ border: "2px solid #E5E7EB", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#0e7490,#2B96A8)", padding: "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Excursion</p>
                      <p style={{ fontSize: 17, fontWeight: 800, color: "white" }}>{exc?.title}</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={11} strokeWidth={2} /> {exc?.city}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Total payé</p>
                      <p style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{total} TND</p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { Icon: Ticket,       label: "Code de réservation", value: reservation.booking_code },
                    { Icon: CalendarDays, label: "Date & heure",         value: `${fmtDate(reservation.date)} · ${reservation.time}` },
                    { Icon: Users,        label: "Voyageurs",            value: `${reservation.people_count} personne${reservation.people_count > 1 ? "s" : ""}` },
                    { Icon: Navigation,   label: "Lieu de rendez-vous",  value: exc?.meeting_point || exc?.city || "Communiqué par le prestataire" },
                    { Icon: Phone,        label: "Contact d'urgence",    value: "+216 70 000 000" },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EFF9FB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={15} color="#2B96A8" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", padding: "0 10px", borderTop: "2px dashed #E5E7EB" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#F3F4F6", border: "2px solid #E5E7EB", flexShrink: 0, marginLeft: -20 }} />
                  <div style={{ flex: 1 }} />
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#F3F4F6", border: "2px solid #E5E7EB", flexShrink: 0, marginRight: -20 }} />
                </div>

                <div style={{ padding: "14px 22px 18px", background: "#F9FAFB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#065F46" }}>Paiement confirmé</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>#{reservation.booking_code}</span>
                </div>
              </div>

              {/* ✅ Bouton Historique */}
              <div style={{ background: "linear-gradient(135deg,#EFF9FB,#D1FAE5)", border: "1.5px solid #6EE7B7", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#2B96A8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <History size={20} color="white" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>Excursion ajoutée à votre historique</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>Retrouvez tous vos voyages dans la section Historique</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose}
                  style={{ flex: 1, padding: 14, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Fermer
                </button>
                <Link href="/touriste/historique" onClick={onClose}
                  style={{ flex: 2, padding: 14, background: "#111827", color: "white", borderRadius: 14, textDecoration: "none", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <History size={15} /> Voir l'historique
                </Link>
              </div>
            </div>
          )}
          </>)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  ReservationCard
// ═══════════════════════════════════════════════════════════════════════
function ReservationCard({ r, onPay }: { r: Reservation; onPay: () => void }) {
  const exc   = r.excursion;
  const s     = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
  const photo = exc?.photos?.[0];
  const paid  = r.payment_status === "paid" || r.payment_status === "pending_cash" || r.payment_status === "pending_bank" || r.status === "confirmed" || r.status === "completed";

  const [timeLeftCard, setTimeLeftCard] = useState<number | null>(null);

  useEffect(() => {
    if (r.status !== "pending" || paid || !r.payment_deadline) return;
    const deadline = new Date(r.payment_deadline).getTime();
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeftCard(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [r.status, r.payment_deadline, paid]);

  const cardUrgent = timeLeftCard !== null && timeLeftCard <= 300;

  return (
    <div
      className="resa-card"
      style={{
        background: "white", borderRadius: 20, border: "1px solid #E5E7EB",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)", transition: "box-shadow .2s, transform .2s",
      }}
    >
      <div style={{ position: "relative", height: 220, flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#2B96A8,#0e7490)" }}>
        {photo
          ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarDays size={32} color="rgba(255,255,255,.35)" />
            </div>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)" }} />

        <span style={{
          position: "absolute", top: 12, left: 12,
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", background: s.bg, border: `1px solid ${s.border}`,
          borderRadius: 99, fontSize: 11, fontWeight: 700, color: s.color,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
          {s.label}
        </span>

        {paid && (
          <span style={{
            position: "absolute", top: 12, right: 12,
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", background: "#D1FAE5", border: "1px solid #6EE7B7",
            borderRadius: 99, fontSize: 11, fontWeight: 700, color: "#065F46",
          }}>
            <CreditCard size={10} strokeWidth={2.5} /> Payée
          </span>
        )}

        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {exc?.title ?? "Excursion"}
          </h3>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} strokeWidth={1.5} />{exc?.city}
          </span>
        </div>
      </div>

      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 5 }}>
            <CalendarDays size={11} color="#9CA3AF" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            {fmtDate(r.date, true)} · {r.time}
          </span>
          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 5 }}>
            <Users size={11} color="#9CA3AF" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            {r.people_count} pers.
            {exc?.duration_hours && (
              <>
                <span style={{ color: "#E5E7EB", margin: "0 2px" }}>·</span>
                <Clock size={11} color="#9CA3AF" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                {exc.duration_hours}h
              </>
            )}
          </span>
        </div>

        {timeLeftCard !== null && timeLeftCard > 0 && (
          <div className={cardUrgent ? "timer-urgent" : ""} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 10px",
            background: cardUrgent ? "#FEF2F2" : "#F0FDF9",
            border: `1px solid ${cardUrgent ? "#FCA5A5" : "#A7F3D0"}`,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 11, color: cardUrgent ? "#DC2626" : "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <Timer size={11} /> {cardUrgent ? "Urgent !" : "Expiration dans"}
            </span>
            <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 800, color: cardUrgent ? "#DC2626" : "#065F46" }}>
              {Math.floor(timeLeftCard / 60).toString().padStart(2,"0")}:{(timeLeftCard % 60).toString().padStart(2,"0")}
            </span>
          </div>
        )}

        {timeLeftCard === 0 && (
          <div style={{ padding: "6px 10px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 700 }}>⏱ Délai expiré — réservation annulée</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 6 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace", background: "#F9FAFB", padding: "3px 8px", borderRadius: 6, border: "1px solid #E5E7EB" }}>
            #{r.booking_code}
          </span>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>{r.total_price}</span>
            <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 3 }}>TND</span>
          </div>
        </div>
      </div>

      {!paid && r.status !== "cancelled" && (
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "12px 16px" }}>
          <button onClick={onPay} className="pay-btn-dark"
            style={{
              width: "100%", padding: "11px 16px", border: "none", borderRadius: 12,
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "background .2s",
            }}>
            <CreditCard size={13} strokeWidth={2} />
            Payer maintenant · {r.total_price} TND
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  Export principal
// ═══════════════════════════════════════════════════════════════════════
export default function ReservationsClient({
  reservations: init,
  autoOpenId,
}: {
  reservations: Reservation[];
  total?: number;
  pending?: number;
  confirmed?: number;
  autoOpenId?: string;
}) {
  const [reservations, setReservations] = useState(init);
  const [checkout,     setCheckout]     = useState<Reservation | null>(null);

  const total     = reservations.length;
  const pending   = reservations.filter(r => r.status === "pending").length;
  const confirmed = reservations.filter(r => r.status === "confirmed").length;

  useEffect(() => {
    if (autoOpenId) {
      const target = reservations.find(r => r.id === autoOpenId);
      if (target && target.payment_status !== "paid" && target.status !== "cancelled") {
        setCheckout(target);
      }
    } else {
      const latestUnpaid = reservations
        .filter(r => r.status === "pending" && !r.payment_status)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latestUnpaid) setCheckout(latestUnpaid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePaid(id: string) {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, payment_status: "paid", status: "confirmed" } : r)
    );
  }

  return (
    <div>
      <style>{GLOBAL_CSS}</style>

      {total > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { dot: "#2B96A8", count: total,     label: "réservation",  color: "#2B96A8" },
            { dot: "#F59E0B", count: pending,   label: "en attente",    color: "#D97706" },
            { dot: "#10B981", count: confirmed, label: "confirmée",     color: "#059669" },
          ].map(({ dot, count, label, color }, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6B7280", fontWeight: 500 }}>
              {i > 0 && <span style={{ color: "#D1D5DB" }}>·</span>}
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 800, color }}>{count}</span> {label}{count > 1 ? "s" : ""}
            </span>
          ))}
        </div>
      )}

      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 24, border: "1px solid #E5E7EB" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#EFF9FB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CalendarDays size={32} color="#2B96A8" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Aucune réservation</h3>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
            Découvrez les excursions et planifiez votre prochain voyage en Tunisie
          </p>
          <Link href="/excursions" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 26px", background: "#2B96A8", color: "white",
            borderRadius: 14, textDecoration: "none", fontSize: 14, fontWeight: 700,
            boxShadow: "0 4px 14px rgba(43,150,168,.35)",
          }}>
            <Sparkles size={16} /> Explorer les excursions <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {reservations.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <ReservationCard r={r} onPay={() => setCheckout(r)} />
            </div>
          ))}
        </div>
      )}

      {checkout && (
        <CheckoutModal
          reservation={checkout}
          onClose={() => setCheckout(null)}
          onPaid={handlePaid}
          autoStart={!!autoOpenId && checkout.id === autoOpenId}
        />
      )}
    </div>
  );
}