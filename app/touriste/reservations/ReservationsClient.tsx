"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  CalendarDays, MapPin, Clock, Users, Sparkles,
  CheckCircle, CreditCard, Wallet, Building2,
  ChevronRight, ChevronLeft, MessageSquare, X, Loader2,
  ShieldCheck, ArrowRight, Ticket, Phone, Navigation,
  AlertCircle, ExternalLink, Timer, History, RefreshCcw,
  Star, TrendingUp, Compass,
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
type PayMethod = "flouci" | "cash" | "bank";
const PAY_METHODS: { id: PayMethod; label: string; sub: string; Icon: React.ElementType }[] = [
  { id: "flouci", label: "Paiement en ligne",  sub: "Carte bancaire · CIB · Flouci", Icon: CreditCard },
  { id: "cash",   label: "Espèces sur place",  sub: "Paiement à la rencontre",       Icon: Wallet     },
  { id: "bank",   label: "Virement bancaire",  sub: "RIB transmis par email",        Icon: Building2  },
];
const STEPS = ["Revue", "Infos", "Paiement"];
const TODAY = new Date().toISOString().split("T")[0];

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string, short = false) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (short) return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  const excDate = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((excDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Global CSS ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600;700&family=Satoshi:wght@400;500;600;700&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,600,700&display=swap');

  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
  @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes scanline{ from{background-position:0 0} to{background-position:0 100%} }
  @keyframes blink   { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 99%{opacity:0} }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .rp-root {
    font-family: 'Satoshi', 'DM Sans', system-ui, sans-serif;
    background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
    min-height: 100vh;
    padding: 48px 40px 80px;
    max-width: 1280px;
    margin: 0 auto;
    color: #1E293B;
  }

  /* ── Header ── */
  .rp-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 48px;
    flex-wrap: wrap;
    gap: 20px;
  }
  .rp-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #0D9488;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rp-eyebrow::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 2px;
    background: #0D9488;
    border-radius: 2px;
  }
  .rp-title {
    font-family: 'Clash Display', 'Syne', sans-serif;
    font-size: 48px;
    font-weight: 700;
    color: #0F172A;
    letter-spacing: -2.5px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .rp-subtitle {
    font-size: 14px;
    color: #64748B;
    font-weight: 500;
  }

  /* ── Action buttons ── */
  .rp-refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    font-family: inherit;
    transition: all .2s;
    margin-top: 6px;
  }
  .rp-refresh-btn:hover {
    border-color: #CBD5E1;
    color: #1E293B;
    background: #FFFFFF;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
  }

  /* ── Stats ── */
  .rp-stats {
    display: flex;
    gap: 1px;
    margin-bottom: 40px;
    background: #E2E8F0;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #E2E8F0;
  }
  .rp-stat {
    flex: 1;
    padding: 20px 24px;
    background: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .rp-stat-icon {
    font-size: 20px;
    line-height: 1;
  }
  .rp-stat-num {
    font-family: 'Clash Display', sans-serif;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }
  .rp-stat-label {
    font-size: 11px;
    color: #64748B;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .8px;
    margin-top: 3px;
  }

  /* ── Grid ── */
  .rp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
  }
  @media (max-width: 860px) {
    .rp-root { padding: 28px 20px 60px; }
    .rp-title { font-size: 32px; }
    .rp-grid { grid-template-columns: 1fr; }
    .rp-stats { flex-direction: column; }
  }

  /* ── Card ── */
  .rp-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    overflow: hidden;
    animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both;
    transition: border-color .2s, box-shadow .2s;
    position: relative;
  }
  .rp-card:hover {
    border-color: #CBD5E1;
    box-shadow: 0 20px 40px rgba(0,0,0,.08), 0 0 0 1px rgba(13,148,136,.06);
  }

  /* ── Card image ── */
  .rp-img-wrap {
    position: relative;
    height: 200px;
    overflow: hidden;
    background: linear-gradient(135deg, #F0FDF4, #CCFBF1);
  }
  .rp-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .5s ease;
  }
  .rp-card:hover .rp-img-wrap img { transform: scale(1.04); }
  .rp-img-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,.05) 0%, rgba(0,0,0,.4) 100%);
  }

  /* Overlay text on image */
  .rp-img-info {
    position: absolute;
    bottom: 16px;
    left: 18px;
    right: 18px;
  }
  .rp-img-title {
    font-family: 'Clash Display', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -.5px;
    margin-bottom: 6px;
    line-height: 1.2;
    text-shadow: 0 1px 3px rgba(0,0,0,.3);
  }
  .rp-img-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: rgba(255,255,255,.9);
    text-shadow: 0 1px 2px rgba(0,0,0,.2);
  }

  /* ── Status pill ── */
  .rp-status {
    position: absolute;
    top: 14px;
    left: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .3px;
    backdrop-filter: blur(12px);
  }
  .rp-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  /* ── Paid badge ── */
  .rp-paid-tag {
    position: absolute;
    top: 14px;
    right: 14px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: rgba(16,185,129,.95);
    border-radius: 99px;
    font-size: 10px;
    font-weight: 700;
    color: white;
    backdrop-filter: blur(8px);
  }

  /* Days badge */
  .rp-days-tag {
    position: absolute;
    top: 14px;
    right: 14px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    background: rgba(15,23,42,.85);
    border: 1px solid rgba(13,148,136,.5);
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    color: #0D9488;
    backdrop-filter: blur(8px);
  }

  /* ── Card body ── */
  .rp-body {
    padding: 20px 20px 0;
  }

  /* ── Details row ── */
  .rp-details {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }
  .rp-detail {
    padding: 10px 12px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
  }
  .rp-detail-lbl {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .8px;
    color: #94A3B8;
    margin-bottom: 4px;
  }
  .rp-detail-val {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
  }

  /* ── Timer bar ── */
  .rp-timer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 10px;
    margin-bottom: 16px;
    border: 1px solid;
  }
  .rp-timer-normal { background: #F0FDF4; border-color: #D1FAE5; }
  .rp-timer-urgent { background: #FEF2F2; border-color: #FEE2E2; animation: pulse .9s ease infinite; }

  /* ── Footer ── */
  .rp-footer {
    border-top: 1px solid #F1F5F9;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .rp-price-amount {
    font-family: 'Clash Display', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #0F172A;
    line-height: 1;
  }
  .rp-price-label {
    font-size: 10px;
    color: #64748B;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: 4px;
  }
  .rp-booking-code {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: #94A3B8;
    margin-top: 4px;
  }

  /* ── Pay button ── */
  .rp-pay-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: #0D9488;
    color: #FFFFFF;
    border: none;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all .2s;
  }
  .rp-pay-btn:hover {
    background: #0F766E;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(13,148,136,.3);
  }

  /* ── Empty state ── */
  .rp-empty {
    text-align: center;
    padding: 100px 24px;
    background: #FFFFFF;
    border-radius: 24px;
    border: 1px solid #E2E8F0;
  }
  .rp-empty-ring {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 28px;
    background: #F8FAFC;
  }

  /* ── Refreshing toast ── */
  .rp-toast {
    position: fixed;
    bottom: 28px;
    right: 28px;
    background: #FFFFFF;
    color: #475569;
    border: 1px solid #E2E8F0;
    padding: 11px 18px;
    border-radius: 40px;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0,0,0,.1);
    animation: fadeUp .2s ease;
  }

  /* ── Modal overlay ── */
  .rp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.6);
    backdrop-filter: blur(12px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn .15s ease;
  }

  /* ── Modal box ── */
  .rp-modal {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 24px;
    width: 100%;
    max-width: 480px;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 40px 100px rgba(0,0,0,.2);
    overflow: hidden;
  }
  .rp-modal-head {
    padding: 24px 26px 20px;
    border-bottom: 1px solid #F1F5F9;
    flex-shrink: 0;
  }
  .rp-modal-body {
    padding: 26px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* ── Progress steps ── */
  .rp-steps {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }
  .rp-step-seg {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  .rp-step-bar {
    height: 2px;
    width: 100%;
    border-radius: 99px;
    transition: background .3s;
  }
  .rp-step-active   { background: #0D9488; }
  .rp-step-done     { background: #0D9488; }
  .rp-step-inactive { background: #E2E8F0; }
  .rp-step-label    { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; }

  /* Modal countdown */
  .rp-modal-timer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid;
    margin-bottom: 0;
  }
  .rp-modal-timer-ok     { background: #F0FDF4; border-color: #D1FAE5; }
  .rp-modal-timer-urgent { background: #FEF2F2; border-color: #FEE2E2; animation: pulse .8s ease infinite; }

  /* Pay method button */
  .rp-method-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: all .15s;
    width: 100%;
  }
  .rp-method-active   { background: #F0FDF4; border-color: #0D9488; }
  .rp-method-inactive { background: #F8FAFC; border-color: #E2E8F0; }
  .rp-method-inactive:hover { border-color: #CBD5E1; background: #FFFFFF; }

  /* Modal primary button */
  .rp-btn-primary {
    width: 100%;
    padding: 16px;
    background: #0D9488;
    color: #FFFFFF;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all .2s;
  }
  .rp-btn-primary:hover:not(:disabled) {
    background: #0F766E;
    box-shadow: 0 8px 24px rgba(13,148,136,.3);
  }
  .rp-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

  .rp-btn-secondary {
    flex: 1;
    padding: 14px;
    background: #F8FAFC;
    color: #475569;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all .2s;
  }
  .rp-btn-secondary:hover { background: #F1F5F9; color: #1E293B; }

  /* Info row in modal */
  .rp-info-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .rp-info-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .rp-info-lbl { font-size: 9px; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 3px; }
  .rp-info-val { font-size: 14px; font-weight: 700; color: #1E293B; }

  /* Ticket tear */
  .rp-ticket-tear {
    display: flex;
    align-items: center;
    padding: 0 4px;
  }
  .rp-tear-circle {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    flex-shrink: 0;
  }
  .rp-tear-line {
    flex: 1;
    border-top: 1.5px dashed #E2E8F0;
  }

  textarea:focus { outline: none; }
`;

// ═══════════════════════════════════════════════════════════════════════
//  CheckoutModal
// ═══════════════════════════════════════════════════════════════════════
function CheckoutModal({
  reservation, onClose, onPaid, autoStart = false,
}: {
  reservation: Reservation;
  onClose: () => void;
  onPaid: (id: string) => void;
  autoStart?: boolean;
}) {
  const supabase = createClient();
  const exc      = reservation.excursion;

  const [step,        setStep]      = useState<1|2|3|4>(autoStart ? 3 : 1);
  const [specialNote, setSpecialNote] = useState("");
  const [payMethod,   setPayMethod]   = useState<PayMethod>("flouci");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [flouciUrl,   setFlouciUrl]   = useState<string|null>(null);
  const [cancelled,   setCancelled]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

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
      await supabase.rpc('restore_slots_on_cancel', { p_reservation_id: reservation.id });
      await supabase.from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", reservation.id).eq("status", "pending");
    } catch (e) { console.warn("Auto-cancel:", e); }
  }

  function fmtCountdown(secs: number) {
    const m = Math.floor(secs/60).toString().padStart(2,"0");
    const s = (secs%60).toString().padStart(2,"0");
    return `${m}:${s}`;
  }

  const isUrgent = timeLeft <= 300;
  const base  = reservation.total_price - reservation.platform_fee;
  const fee   = reservation.platform_fee;
  const total = reservation.total_price;

  async function addToHistory(paymentMethod: PayMethod) {
    try {
      const { data: res, error } = await supabase
        .from("reservations")
        .select("id, booking_code, date, time, people_count, total_price, platform_fee, payment_method, status, excursion_id, excursions:excursions!reservations_excursion_id_fkey(id, title, city)")
        .eq("id", reservation.id).single();
      if (error || !res) return;
      let excursionData: { id: string; title: string; city: string } | null = null;
      if (res.excursions) {
        excursionData = Array.isArray(res.excursions) ? res.excursions[0] : res.excursions;
      }
      await supabase.from("historique_reservations").insert({
        original_reservation_id: res.id,
        booking_code: res.booking_code,
        excursion_id: excursionData?.id || null,
        excursion_title: excursionData?.title || null,
        excursion_city: excursionData?.city || null,
        date: res.date, time: res.time,
        people_count: res.people_count,
        total_price: res.total_price,
        platform_fee: res.platform_fee,
        payment_method: paymentMethod,
        payment_status: "paid",
        payment_date: new Date().toISOString(),
      });
    } catch (e) { console.warn("addToHistory:", e); }
  }

  async function notifyN8n(method: PayMethod) {
    const { data: { user } } = await supabase.auth.getUser();
    fetch("/api/n8n-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "payment_confirmed",
        touriste_name: user?.user_metadata?.full_name || user?.email || "Touriste",
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
    }).catch(err => console.warn("[n8n]:", err));
  }

  async function handleFlouci() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/paiement/flouci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservation.id, special_notes: specialNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur Flouci");
      if (specialNote) await supabase.from("reservations").update({ special_notes: specialNote }).eq("id", reservation.id);
      setFlouciUrl(data.payment_url);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur paiement."); }
    finally { setLoading(false); }
  }

  async function handleLocalPay() {
    setLoading(true); setError("");
    try {
      const { error: e1 } = await supabase.from("reservations").update({
        payment_status: "paid", payment_method: payMethod,
        special_notes: specialNote || null,
        status: "confirmed", paid_at: new Date().toISOString(),
      }).eq("id", reservation.id);
      if (e1) throw e1;
      await addToHistory(payMethod);
      await notifyN8n(payMethod);
      if (timerRef.current) clearInterval(timerRef.current);
      setStep(4); onPaid(reservation.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur confirmation."); }
    finally { setLoading(false); }
  }

  async function handlePay() {
    if (payMethod === "flouci") await handleFlouci();
    else await handleLocalPay();
  }

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, color:"#94A3B8", marginBottom:12 }}>{children}</p>
  );

  return (
    <div className="rp-overlay" onClick={e => { if (e.target === e.currentTarget && step !== 4) onClose(); }}>
      <div className="rp-modal">

        {/* Header */}
        <div className="rp-modal-head">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: step !== 4 && !cancelled ? 20 : 0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {step > 1 && step < 4 && !cancelled && (
                <button onClick={() => { setError(""); setFlouciUrl(null); setStep(s => (s-1) as 1|2|3|4); }}
                  style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"#F8FAFC", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <ChevronLeft size={15} color="#64748B"/>
                </button>
              )}
              <div>
                {step !== 4 && !cancelled && (
                  <p style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1.5, marginBottom:4 }}>
                    Étape {step} / 3
                  </p>
                )}
                <h2 style={{ fontFamily:"'Clash Display', sans-serif", fontSize:20, fontWeight:700, color:"#0F172A", margin:0, letterSpacing:-.5 }}>
                  {cancelled            && "Réservation expirée"}
                  {!cancelled && step===1 && "Récapitulatif"}
                  {!cancelled && step===2 && "Vos informations"}
                  {!cancelled && step===3 && "Mode de paiement"}
                  {!cancelled && step===4 && "Paiement confirmé"}
                </h2>
              </div>
            </div>
            {step !== 4 && (
              <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"#F8FAFC", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={14} color="#64748B"/>
              </button>
            )}
          </div>

          {step !== 4 && !cancelled && (<>
            {/* Steps */}
            <div className="rp-steps">
              {STEPS.map((s, i) => (
                <div key={s} className="rp-step-seg">
                  <div className={`rp-step-bar ${i < step ? "rp-step-done" : i === step-1 ? "rp-step-active" : "rp-step-inactive"}`}/>
                  <span className="rp-step-label" style={{ color: i < step ? "#0D9488" : i===step-1 ? "#475569" : "#CBD5E1" }}>{s}</span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <div className={`rp-modal-timer ${isUrgent ? "rp-modal-timer-urgent" : "rp-modal-timer-ok"}`}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <Timer size={12} color={isUrgent ? "#EF4444" : "#0D9488"}/>
                <span style={{ fontSize:12, fontWeight:600, color: isUrgent ? "#EF4444" : "#0D9488" }}>
                  {isUrgent ? "Payez maintenant !" : "Temps restant"}
                </span>
              </div>
              <span style={{ fontFamily:"monospace", fontSize:15, fontWeight:900, color: isUrgent ? "#EF4444" : "#0D9488", background: isUrgent ? "rgba(239,68,68,.1)" : "rgba(13,148,136,.1)", padding:"3px 12px", borderRadius:8 }}>
                {fmtCountdown(timeLeft)}
              </span>
            </div>
          </>)}
        </div>

        {/* Body */}
        <div className="rp-modal-body">

          {/* Expired */}
          {cancelled && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:10, textAlign:"center" }}>
              <div style={{ width:72, height:72, borderRadius:20, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Timer size={32} color="#EF4444" strokeWidth={1.5}/>
              </div>
              <div>
                <h3 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:700, color:"#0F172A", marginBottom:10, letterSpacing:-.5 }}>Délai expiré</h3>
                <p style={{ fontSize:14, color:"#64748B", lineHeight:1.8 }}>
                  Réservation <span style={{ color:"#475569", fontFamily:"monospace" }}>#{reservation.booking_code}</span> annulée automatiquement.
                </p>
              </div>
              <div style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", borderRadius:12, padding:"14px 18px" }}>
                <p style={{ fontSize:13, color:"#F59E0B", fontWeight:600 }}>Créez une nouvelle réservation depuis la page excursions.</p>
              </div>
              <button onClick={onClose} style={{ padding:"13px 36px", background:"#0D9488", color:"white", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Fermer
              </button>
            </div>
          )}

          {!cancelled && (<>

            {/* STEP 1 – Review */}
            {step === 1 && (
              <>
                <div style={{ borderRadius:14, overflow:"hidden", height:160, position:"relative", background:"linear-gradient(135deg,#F0FDF4,#CCFBF1)" }}>
                  {exc?.photos?.[0] && <img src={exc.photos[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,.4),transparent 60%)" }}/>
                  <div style={{ position:"absolute", bottom:14, left:16, right:16 }}>
                    <p style={{ fontFamily:"'Clash Display',sans-serif", fontSize:17, fontWeight:700, color:"#FFFFFF", marginBottom:4, textShadow:"0 1px 2px rgba(0,0,0,.2)" }}>{exc?.title}</p>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,.9)", display:"flex", alignItems:"center", gap:4, textShadow:"0 1px 1px rgba(0,0,0,.1)" }}>
                      <MapPin size={10}/>{exc?.city}
                    </p>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { lbl:"Date",      val: fmtDate(reservation.date, true) },
                    { lbl:"Heure",     val: reservation.time },
                    { lbl:"Voyageurs", val: `${reservation.people_count} pers.` },
                    { lbl:"Durée",     val: `${exc?.duration_hours ?? "–"}h` },
                  ].map(({ lbl, val }) => (
                    <div key={lbl} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:12, padding:"12px 14px" }}>
                      <p style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, color:"#94A3B8", marginBottom:5 }}>{lbl}</p>
                      <p style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>{val}</p>
                    </div>
                  ))}
                </div>

                <div style={{ border:"1px solid #E2E8F0", borderRadius:14, overflow:"hidden" }}>
                  <div style={{ background:"#F8FAFC", padding:"12px 16px", borderBottom:"1px solid #E2E8F0" }}>
                    <p style={{ fontSize:10, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:1 }}>Détail des frais</p>
                  </div>
                  <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:14, color:"#64748B" }}>{exc?.price_per_person} TND × {reservation.people_count} pers.</span>
                      <span style={{ fontSize:14, fontWeight:700, color:"#334155" }}>{base} TND</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:14, color:"#64748B" }}>Frais de service</span>
                      <span style={{ fontSize:14, fontWeight:700, color:"#334155" }}>{fee} TND</span>
                    </div>
                    <div style={{ height:1, background:"#E2E8F0" }}/>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Clash Display',sans-serif", fontSize:14, fontWeight:700, color:"#0F172A" }}>Total</span>
                      <span style={{ fontFamily:"'Clash Display',sans-serif", fontSize:24, fontWeight:700, color:"#0D9488" }}>{total} TND</span>
                    </div>
                  </div>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", background:"rgba(13,148,136,.05)", borderRadius:10, border:"1px solid rgba(13,148,136,.15)" }}>
                  <ShieldCheck size={14} color="#0D9488"/>
                  <span style={{ fontSize:12, color:"#0D9488", fontWeight:600 }}>Annulation gratuite jusqu'à 24h avant</span>
                </div>

                <button onClick={() => setStep(2)} className="rp-btn-primary">
                  Continuer <ChevronRight size={16}/>
                </button>
              </>
            )}

            {/* STEP 2 – Notes */}
            {step === 2 && (
              <>
                <div style={{ display:"flex", gap:12, background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ width:44, height:44, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#E2E8F0" }}>
                    {exc?.photos?.[0] && <img src={exc.photos[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", margin:"0 0 3px" }}>{exc?.title}</p>
                    <p style={{ fontSize:12, color:"#64748B" }}>{fmtDate(reservation.date)} · {reservation.people_count} pers.</p>
                  </div>
                  <p style={{ fontFamily:"'Clash Display',sans-serif", fontSize:18, fontWeight:700, color:"#0D9488" }}>{total} <span style={{ fontSize:11, fontWeight:500, color:"#94A3B8" }}>TND</span></p>
                </div>

                <div>
                  <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700, color:"#475569", marginBottom:10 }}>
                    <MessageSquare size={13} color="#0D9488"/> Besoins spéciaux
                    <span style={{ fontSize:11, color:"#94A3B8", fontWeight:400 }}>— optionnel</span>
                  </label>
                  <textarea
                    value={specialNote} onChange={e => setSpecialNote(e.target.value)}
                    placeholder="Handicap, allergies, préférences…"
                    rows={4}
                    style={{ width:"100%", padding:"13px 14px", border:"1px solid #E2E8F0", borderRadius:12, fontSize:14, fontFamily:"inherit", outline:"none", resize:"vertical", color:"#1E293B", background:"#FFFFFF", boxSizing:"border-box", lineHeight:1.6, transition:"border-color .2s" }}
                    onFocus={e => (e.target.style.borderColor="#0D9488")}
                    onBlur={e  => (e.target.style.borderColor="#E2E8F0")}
                  />
                </div>

                <button onClick={() => setStep(3)} className="rp-btn-primary">
                  Choisir le paiement <ChevronRight size={16}/>
                </button>
              </>
            )}

            {/* STEP 3 – Payment */}
            {step === 3 && (
              <>
                <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:16, padding:"22px", textAlign:"center" }}>
                  <p style={{ fontSize:10, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>Montant à payer</p>
                  <p style={{ fontFamily:"'Clash Display',sans-serif", fontSize:46, fontWeight:700, color:"#0F172A", letterSpacing:"-2px", lineHeight:1, marginBottom:6 }}>
                    {total}<span style={{ fontSize:18, fontWeight:500, color:"#64748B", marginLeft:6 }}>TND</span>
                  </p>
                  <p style={{ fontSize:11, color:"#94A3B8" }}>dont {fee} TND de frais de service</p>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {PAY_METHODS.map(m => (
                    <button key={m.id} className={`rp-method-btn ${payMethod===m.id ? "rp-method-active" : "rp-method-inactive"}`}
                      onClick={() => { setPayMethod(m.id); setError(""); setFlouciUrl(null); }}>
                      <div style={{ width:42, height:42, borderRadius:10, background: payMethod===m.id ? "rgba(13,148,136,.1)" : "#FFFFFF", border:`1px solid ${payMethod===m.id ? "#0D9488" : "#E2E8F0"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
                        <m.Icon size={17} color={payMethod===m.id ? "#0D9488" : "#94A3B8"} strokeWidth={1.5}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:14, fontWeight:700, color: payMethod===m.id ? "#0F172A" : "#475569", margin:"0 0 2px" }}>{m.label}</p>
                        <p style={{ fontSize:12, color:"#94A3B8", margin:0 }}>{m.sub}</p>
                      </div>
                      {m.id==="flouci" && <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", background:"rgba(13,148,136,.1)", color:"#0D9488", borderRadius:20, border:"1px solid rgba(13,148,136,.2)" }}>Recommandé</span>}
                      <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${payMethod===m.id ? "#0D9488" : "#CBD5E1"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {payMethod===m.id && <div style={{ width:8, height:8, borderRadius:"50%", background:"#0D9488" }}/>}
                      </div>
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{ display:"flex", gap:8, padding:"11px 14px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:10 }}>
                    <AlertCircle size={14} color="#EF4444" style={{ flexShrink:0 }}/>
                    <span style={{ fontSize:13, color:"#EF4444" }}>{error}</span>
                  </div>
                )}

                {flouciUrl && (
                  <div style={{ padding:"16px", background:"rgba(13,148,136,.06)", border:"1px solid rgba(13,148,136,.2)", borderRadius:14 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:"#0D9488", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
                      <CheckCircle size={13}/> Lien de paiement prêt
                    </p>
                    <a href={flouciUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px", background:"#0D9488", color:"white", borderRadius:12, fontSize:14, fontWeight:700, textDecoration:"none" }}>
                      <ExternalLink size={14}/> Payer {total} TND via Flouci
                    </a>
                  </div>
                )}

                {!flouciUrl && (
                  <button onClick={handlePay} disabled={loading} className="rp-btn-primary">
                    {loading
                      ? <><Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/> Traitement…</>
                      : payMethod==="flouci"
                        ? <><CreditCard size={16}/> Générer le lien · {total} TND</>
                        : <><CheckCircle size={16}/> Confirmer · {total} TND</>
                    }
                  </button>
                )}

                <p style={{ textAlign:"center", fontSize:11, color:"#94A3B8", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  <ShieldCheck size={11}/> Paiement sécurisé · VoyajAime
                </p>
              </>
            )}

            {/* STEP 4 – Success */}
            {step === 4 && (
              <>
                <div style={{ textAlign:"center", paddingTop:8 }}>
                  <div style={{ width:64, height:64, borderRadius:18, background:"rgba(13,148,136,.1)", border:"1px solid rgba(13,148,136,.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                    <CheckCircle size={32} color="#0D9488" strokeWidth={1.5}/>
                  </div>
                  <h3 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:700, color:"#0F172A", marginBottom:8, letterSpacing:-.5 }}>Réservation confirmée</h3>
                  <p style={{ fontSize:14, color:"#64748B" }}>Un email de confirmation vous a été envoyé.</p>
                </div>

                {/* Ticket */}
                <div style={{ border:"1px solid #E2E8F0", borderRadius:18, overflow:"hidden" }}>
                  <div style={{ background:"linear-gradient(135deg,#F0FDF4,#CCFBF1)", padding:"20px 22px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <p style={{ fontSize:9, color:"rgba(15,23,42,.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Excursion</p>
                        <p style={{ fontFamily:"'Clash Display',sans-serif", fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:6, letterSpacing:-.3 }}>{exc?.title}</p>
                        <p style={{ fontSize:11, color:"#475569", display:"flex", alignItems:"center", gap:4 }}><MapPin size={10}/>{exc?.city}</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:9, color:"rgba(15,23,42,.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>Payé</p>
                        <p style={{ fontFamily:"'Clash Display',sans-serif", fontSize:24, fontWeight:700, color:"#0D9488" }}>{total} TND</p>
                      </div>
                    </div>
                  </div>

                  <div className="rp-ticket-tear" style={{ borderTop:"1px dashed #E2E8F0", borderBottom:"1px dashed #E2E8F0", padding:"0 -18px" }}>
                    <div className="rp-tear-circle" style={{ marginLeft:-10 }}/>
                    <div className="rp-tear-line"/>
                    <div className="rp-tear-circle" style={{ marginRight:-10 }}/>
                  </div>

                  <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:14 }}>
                    {[
                      { Icon:Ticket,       lbl:"Code",        val: reservation.booking_code },
                      { Icon:CalendarDays, lbl:"Date · Heure", val: `${fmtDate(reservation.date, true)} · ${reservation.time}` },
                      { Icon:Users,        lbl:"Voyageurs",   val: `${reservation.people_count} personne${reservation.people_count>1?"s":""}` },
                      { Icon:Navigation,   lbl:"RDV",         val: exc?.meeting_point || exc?.city || "Communiqué par le prestataire" },
                    ].map(({ Icon, lbl, val }) => (
                      <div key={lbl} className="rp-info-row">
                        <div className="rp-info-icon"><Icon size={14} color="#0D9488" strokeWidth={1.5}/></div>
                        <div>
                          <p className="rp-info-lbl">{lbl}</p>
                          <p className="rp-info-val">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={onClose} className="rp-btn-secondary">Fermer</button>
                  <Link href="/touriste/historique" onClick={onClose}
                    style={{ flex:2, padding:14, background:"#0D9488", color:"white", borderRadius:14, textDecoration:"none", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <History size={14}/> Voir l'historique
                  </Link>
                </div>
              </>
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
const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  pending:   { label:"En attente",  dot:"#F59E0B", text:"#F59E0B", bg:"rgba(245,158,11,.1)",  border:"rgba(245,158,11,.25)" },
  confirmed: { label:"Confirmée",   dot:"#0D9488", text:"#0D9488", bg:"rgba(13,148,136,.1)",  border:"rgba(13,148,136,.25)" },
  completed: { label:"Terminée",    dot:"#3B82F6", text:"#3B82F6", bg:"rgba(59,130,246,.1)",  border:"rgba(59,130,246,.25)" },
  cancelled: { label:"Annulée",     dot:"#EF4444", text:"#EF4444", bg:"rgba(239,68,68,.1)",   border:"rgba(239,68,68,.25)"  },
};

function ReservationCard({ r, onPay, onRefresh, onExpired }: { r: Reservation; onPay: () => void; onRefresh?: () => void; onExpired?: (id: string) => void }) {
  const exc  = r.excursion;
  const s    = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
  const photo = exc?.photos?.[0];
  const paid  = r.payment_status === "paid" || r.status === "confirmed" || r.status === "completed";
  const days  = daysUntil(r.date);

  const [timeLeftCard, setTimeLeftCard] = useState<number|null>(null);

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

  return (
    <div className="rp-card">
      {/* Image */}
      <div className="rp-img-wrap">
        {photo
          ? <img src={photo} alt={exc?.title || ""}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Compass size={40} color="rgba(0,0,0,.15)" strokeWidth={1}/>
            </div>
        }
        <div className="rp-img-gradient"/>

        {/* Status */}
        <div className="rp-status" style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.text }}>
          <span className="rp-status-dot" style={{ background:s.dot }}/>
          {s.label}
        </div>

        {/* Paid or days badge — right side */}
        {paid ? (
          <div className="rp-paid-tag">
            <CheckCircle size={10} strokeWidth={2.5}/> Payée
          </div>
        ) : days >= 0 && (
          <div className="rp-days-tag">
            <CalendarDays size={10}/>
            {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `J-${days}`}
          </div>
        )}

        {/* Title on image */}
        <div className="rp-img-info">
          <h3 className="rp-img-title">{exc?.title ?? "Excursion"}</h3>
          <div className="rp-img-meta">
            <span style={{ display:"flex", alignItems:"center", gap:4 }}>
              <MapPin size={10}/>{exc?.city}
            </span>
            {exc?.duration_hours && (
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <Clock size={10}/>{exc.duration_hours}h
              </span>
            )}
            {exc?.rating && exc.rating > 0 && (
              <span style={{ display:"flex", alignItems:"center", gap:4, color:"#F59E0B" }}>
                <Star size={10} fill="#F59E0B"/>{exc.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="rp-body">
        {/* Details */}
        <div className="rp-details">
          {[
            { lbl:"Date",      val: fmtDate(r.date, true) },
            { lbl:"Heure",     val: r.time },
            { lbl:"Personnes", val: `${r.people_count}p` },
            { lbl:"Durée",     val: `${exc?.duration_hours ?? "–"}h` },
          ].map(({ lbl, val }) => (
            <div key={lbl} className="rp-detail">
              <p className="rp-detail-lbl">{lbl}</p>
              <p className="rp-detail-val">{val}</p>
            </div>
          ))}
        </div>

        {/* Timer */}
        {timeLeftCard !== null && timeLeftCard > 0 && (
          <div className={`rp-timer-bar ${cardUrgent ? "rp-timer-urgent" : "rp-timer-normal"}`}>
            <span style={{ fontSize:11, fontWeight:600, color: cardUrgent ? "#EF4444" : "#0D9488", display:"flex", alignItems:"center", gap:5 }}>
              <Timer size={11}/>{cardUrgent ? "Urgent — expiré bientôt" : "Paiement requis avant"}
            </span>
            <span style={{ fontSize:13, fontFamily:"monospace", fontWeight:800, color: cardUrgent ? "#EF4444" : "#0D9488" }}>
              {Math.floor(timeLeftCard/60).toString().padStart(2,"0")}:{(timeLeftCard%60).toString().padStart(2,"0")}
            </span>
          </div>
        )}

        {timeLeftCard === 0 && (
          <div style={{ padding:"9px 12px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", borderRadius:10, marginBottom:14 }}>
            <span style={{ fontSize:11, color:"#EF4444", fontWeight:700 }}>Délai expiré — annulée automatiquement</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="rp-footer">
        <div>
          <p className="rp-price-label">Total</p>
          <p className="rp-price-amount">{r.total_price} <span style={{ fontSize:12, fontWeight:500, color:"#94A3B8" }}>TND</span></p>
          <p className="rp-booking-code">#{r.booking_code}</p>
        </div>

        {!paid && r.status !== "cancelled" && timeLeftCard !== 0 && (
          <button onClick={onPay} className="rp-pay-btn">
            <CreditCard size={13} strokeWidth={2}/> Payer
          </button>
        )}

        {paid && (
          <Link href={`/excursions/${exc?.id}`}
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 16px", background:"rgba(13,148,136,.08)", color:"#0D9488", border:"1px solid rgba(13,148,136,.2)", borderRadius:10, fontSize:12, fontWeight:700, textDecoration:"none" }}>
            <TrendingUp size={12}/> Détails
          </Link>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  Main export
// ═══════════════════════════════════════════════════════════════════════
export default function ReservationsClient({
  reservations: init,
  autoOpenId,
}: {
  reservations: Reservation[];
  autoOpenId?: string;
}) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(init);
  const [checkout,     setCheckout]     = useState<Reservation|null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const total     = reservations.length;
  const pending   = reservations.filter(r => r.status === "pending").length;
  const confirmed = reservations.filter(r => r.status === "confirmed").length;

  // ── Move expired reservations (past date, paid) to history ───────────
  const moveExpiredToHistory = useCallback(async (resas: Reservation[]) => {
    const expired = resas.filter(r => {
      const isPaid = r.payment_status === "paid" || r.status === "confirmed" || r.status === "completed";
      return isPaid && r.date < TODAY;
    });
    for (const r of expired) {
      try {
        const exc = r.excursion;
        await supabase.from("historique_reservations").insert({
          original_reservation_id: r.id,
          booking_code:    r.booking_code,
          excursion_id:    exc?.id    || null,
          excursion_title: exc?.title || null,
          excursion_city:  exc?.city  || null,
          date: r.date, time: r.time,
          people_count: r.people_count,
          total_price: r.total_price,
          platform_fee: r.platform_fee,
          payment_method: "confirmed",
          payment_status: "paid",
          payment_date: new Date().toISOString(),
          moved_to_history: true,
        });
        await supabase.from("reservations")
          .update({ status: "completed" })
          .eq("id", r.id)
          .neq("status", "completed");
      } catch (e) { console.warn("moveExpiredToHistory:", e); }
    }
  }, [supabase]);

  // ── Move unpaid expired reservations to history then remove from view ─
  const handleUnpaidExpired = useCallback(async (reservationId: string) => {
    // Find the reservation
    const r = reservations.find(res => res.id === reservationId);
    if (!r) return;

    try {
      // Cancel in DB
      await supabase.rpc('restore_slots_on_cancel', { p_reservation_id: reservationId });
      await supabase.from("reservations")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", reservationId)
        .eq("status", "pending");

      // Add to history as expired
      const exc = r.excursion;
      await supabase.from("historique_reservations").insert({
        original_reservation_id: r.id,
        booking_code:    r.booking_code,
        excursion_id:    exc?.id    || null,
        excursion_title: exc?.title || null,
        excursion_city:  exc?.city  || null,
        date: r.date, time: r.time,
        people_count: r.people_count,
        total_price: r.total_price,
        platform_fee: r.platform_fee,
        payment_method: null,
        payment_status: "expired",
        payment_date: new Date().toISOString(),
        moved_to_history: true,
      });
    } catch (e) {
      console.warn("handleUnpaidExpired:", e);
    }

    // Remove from current list after a short delay (so user sees "expired" state briefly)
    setTimeout(() => {
      setReservations(prev => prev.filter(res => res.id !== reservationId));
    }, 3000);
  }, [reservations, supabase]);

  const refreshReservations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("reservations")
        .select(`*, excursion:excursions(id, title, city, photos, duration_hours, price_per_person, meeting_point, rating)`)
        .eq("touriste_id", user.id)
        .neq("status", "cancelled")
        .gte("date", today)
        .order("date", { ascending: true });
      if (error) throw error;
      const fresh = data || [];
      await moveExpiredToHistory(fresh);
      setReservations(fresh.filter(r => r.date >= today));
    } catch (err) {
      console.error("Erreur refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase, moveExpiredToHistory]);

  // Auto-refresh every 30s when there are pending reservations
  useEffect(() => {
    const interval = setInterval(() => {
      if (reservations.some(r => r.status === "pending")) refreshReservations();
    }, 30000);
    return () => clearInterval(interval);
  }, [reservations, refreshReservations]);

  // Move past reservations on mount
  useEffect(() => { moveExpiredToHistory(init); }, []);

  // Auto-open checkout
  useEffect(() => {
    if (autoOpenId) {
      const target = reservations.find(r => r.id === autoOpenId);
      if (target && target.payment_status !== "paid" && target.status !== "cancelled") setCheckout(target);
    } else {
      const latestUnpaid = reservations
        .filter(r => r.status === "pending" && !r.payment_status)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latestUnpaid) setCheckout(latestUnpaid);
    }
  }, [reservations, autoOpenId]);

  function handlePaid(id: string) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, payment_status:"paid", status:"confirmed" } : r));
    setCheckout(null);
    setTimeout(() => refreshReservations(), 2000);
  }

  return (
    <div className="rp-root">
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div className="rp-header">
        <div>
          <p className="rp-eyebrow">Mes voyages</p>
          <h1 className="rp-title">Réservations</h1>
          <p className="rp-subtitle">Gérez et suivez vos aventures en Tunisie</p>
        </div>
        <button onClick={refreshReservations} disabled={isRefreshing} className="rp-refresh-btn">
          <RefreshCcw size={13} style={isRefreshing ? { animation:"spin 1s linear infinite" } : {}}/> Actualiser
        </button>
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="rp-stats">
          {[
            { icon:"🗺️", num:total,     lbl:"Total",      color:"#0D9488" },
            { icon:"⏳",  num:pending,   lbl:"En attente", color:"#F59E0B" },
            { icon:"✅",  num:confirmed, lbl:"Confirmées", color:"#0D9488" },
          ].map(({ icon, num, lbl, color }) => (
            <div key={lbl} className="rp-stat">
              <span className="rp-stat-icon">{icon}</span>
              <div>
                <p className="rp-stat-num" style={{ color }}>{num}</p>
                <p className="rp-stat-label">{lbl}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refreshing toast */}
      {isRefreshing && (
        <div className="rp-toast">
          <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> Mise à jour…
        </div>
      )}

      {/* Empty state */}
      {total === 0 ? (
        <div className="rp-empty">
          <div className="rp-empty-ring">
            <Compass size={32} color="#0D9488" strokeWidth={1.5}/>
          </div>
          <h3 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:24, fontWeight:700, color:"#0F172A", marginBottom:10, letterSpacing:-.5 }}>
            Aucune réservation active
          </h3>
          <p style={{ fontSize:14, color:"#64748B", marginBottom:32, lineHeight:1.7 }}>
            Découvrez les excursions et planifiez votre prochain voyage
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/excursions" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 28px", background:"#0D9488", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700 }}>
              <Sparkles size={15}/> Explorer les excursions <ArrowRight size={14}/>
            </Link>
            <Link href="/touriste/historique" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 24px", background:"#FFFFFF", color:"#475569", border:"1px solid #E2E8F0", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700 }}>
              <History size={14}/> Historique
            </Link>
          </div>
        </div>
      ) : (
        <div className="rp-grid">
          {reservations.map((r, i) => (
            <div key={r.id} style={{ animationDelay:`${i * .08}s` }}>
              <ReservationCard
                r={r}
                onPay={() => setCheckout(r)}
                onRefresh={refreshReservations}
                onExpired={handleUnpaidExpired}
              />
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