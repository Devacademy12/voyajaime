"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Users, CreditCard, TrendingUp, Download,
  Search, CheckCircle2, Clock, Wallet, MapPin, Star,
  AlertCircle, XCircle, ArrowUpRight,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface TouristeProfile { full_name: string | null; phone: string | null; }
interface ExcursionInfo { id: string; title: string; city: string; price_per_person: number; max_people: number; }
interface Reservation {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number; net_amount: number;
  status: string; payment_status: string | null; payment_method: string | null;
  created_at: string; paid_at: string | null; cancelled_at: string | null;
  special_needs: string | null; cancel_reason: string | null;
  touriste: TouristeProfile | null;
  excursion: ExcursionInfo | null;
}
interface Paiement {
  id: string; amount: number; platform_fee: number; net_amount: number;
  status: string; paid_at: string | null; created_at: string;
  reservation: {
    id: string; booking_code: string; date: string; time: string;
    people_count: number; total_price: number;
    touriste: TouristeProfile | null;
    excursion: { id: string; title: string; city: string } | null;
  } | null;
}
interface ExcursionCap {
  id: string; title: string; city: string; max_people: number;
  price_per_person: number; is_active: boolean;
}
interface SlotInfo { booked: number; date: string; time: string; }

interface Props {
  reservations: Reservation[];
  paiements: Paiement[];
  excursions: ExcursionCap[];
  capacite: Record<string, Record<string, SlotInfo>>;
  prestataireInfo: { full_name: string | null; agency_name: string | null; };
}

/* ─── CSS ───────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  *, *::before, *::after { box-sizing: border-box; }

  .pw {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #F0F4F8;
    min-height: 100vh;
    padding: 32px 48px 72px;
    width: 100%;
  }

  /* ── Header banner ── */
  .pw-banner {
    background: linear-gradient(135deg, #053366 0%, #0A5A8A 60%, #2B96A8 100%);
    border-radius: 20px;
    padding: 28px 32px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
    animation: fadeUp .4s ease both;
  }
  .pw-banner::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .pw-banner-label {
    font-size: 11px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: rgba(255,255,255,.55); margin-bottom: 6px;
  }
  .pw-banner-title {
    font-size: clamp(20px, 3.5vw, 28px); font-weight: 800;
    color: #fff; margin: 0 0 4px; line-height: 1.15;
  }
  .pw-banner-sub {
    font-size: 13px; color: rgba(255,255,255,.65); margin: 0;
  }
  .pw-banner-badge {
    position: absolute; right: 32px; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
    border-radius: 50px; padding: 8px 18px;
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,.9);
    display: flex; align-items: center; gap: 6px;
    backdrop-filter: blur(8px);
  }

  /* ── Tabs ── */
  .pw-tabs {
    display: flex; gap: 4px;
    background: #fff; border-radius: 14px;
    padding: 4px; margin-bottom: 24px;
    border: 1.5px solid #E2E8F0;
    width: fit-content;
    animation: fadeUp .45s ease both;
  }
  .pw-tab {
    padding: 8px 20px; border: none; background: none;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: #94A3B8; cursor: pointer; border-radius: 10px;
    display: flex; align-items: center; gap: 7px; transition: all .18s;
  }
  .pw-tab.active {
    background: linear-gradient(135deg, #053366, #2B96A8);
    color: #fff; box-shadow: 0 4px 14px rgba(43,150,168,.3);
  }
  .pw-tab:hover:not(.active) { color: #053366; background: #F0F4F8; }

  /* ── Metrics ── */
  .pw-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 14px; margin-bottom: 22px;
  }
  .pw-metric {
    background: #fff; border-radius: 16px; border: 1.5px solid #E2E8F0;
    padding: 18px 20px; animation: fadeUp .5s ease both;
    transition: box-shadow .2s, transform .2s;
    position: relative; overflow: hidden;
  }
  .pw-metric:hover { box-shadow: 0 8px 24px rgba(5,51,102,.08); transform: translateY(-2px); }
  .pw-metric-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px;
  }
  .pw-metric-num { font-size: 22px; font-weight: 800; color: #053366; margin: 0; line-height: 1; }
  .pw-metric-lbl { font-size: 11px; color: #94A3B8; margin: 5px 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

  /* Net payout highlight card */
  .pw-metric.highlight {
    background: linear-gradient(135deg, #053366 0%, #2B96A8 100%);
    border-color: transparent;
  }
  .pw-metric.highlight .pw-metric-num { color: #fff; }
  .pw-metric.highlight .pw-metric-lbl { color: rgba(255,255,255,.6); }

  /* ── Info box ── */
  .pw-info {
    display: flex; align-items: center; gap: 10px;
    background: #EFF9FB; border: 1.5px solid rgba(43,150,168,.22);
    border-radius: 12px; padding: 11px 16px;
    font-size: 13px; color: #053366; margin-bottom: 16px;
  }
  .pw-info strong { color: #2B96A8; }

  /* Fee breakdown inline */
  .fee-row {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #94A3B8; margin-top: 4px;
  }
  .fee-row .fee-gross { text-decoration: line-through; color: #CBD5E1; }
  .fee-row .fee-pct { background: #FCEBEB; color: #A32D2D; border-radius: 6px; padding: 1px 6px; font-weight: 700; font-size: 10px; }
  .fee-row .fee-net { color: #0F6E56; font-weight: 700; }

  /* ── Toolbar ── */
  .pw-toolbar {
    display: flex; gap: 10px; margin-bottom: 14px;
    flex-wrap: wrap; align-items: center;
  }
  .pw-search {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid #E2E8F0;
    border-radius: 10px; padding: 9px 14px; flex: 1;
    min-width: 200px; max-width: 340px;
  }
  .pw-search input {
    border: none; outline: none; background: transparent;
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    color: #053366; width: 100%;
  }
  .pw-select {
    padding: 9px 14px; border-radius: 10px; border: 1.5px solid #E2E8F0;
    background: #fff; font-size: 13px; font-family: 'DM Sans', sans-serif;
    color: #053366; cursor: pointer; outline: none;
  }
  .pw-export {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 10px;
    border: 1.5px solid rgba(43,150,168,.25); background: #EFF9FB;
    color: #2B96A8; font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    margin-left: auto; transition: all .15s;
  }
  .pw-export:hover { background: rgba(43,150,168,.15); }

  /* ── Table ── */
  .pw-table-wrap {
    background: #fff; border-radius: 16px; border: 1.5px solid #E2E8F0;
    overflow: hidden; overflow-x: auto;
  }
  table { width: 100%; border-collapse: collapse; min-width: 780px; }
  thead th {
    padding: 11px 16px; text-align: left; font-size: 10px; font-weight: 700;
    color: #94A3B8; background: #F8FAFC; border-bottom: 1.5px solid #E2E8F0;
    letter-spacing: .07em; text-transform: uppercase; white-space: nowrap;
  }
  tbody td {
    padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9;
    color: #2D3748; vertical-align: middle; white-space: nowrap;
    max-width: 200px; overflow: hidden; text-overflow: ellipsis;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #F8FAFC; }

  .group-header td {
    background: #EFF9FB; font-weight: 700; font-size: 12px;
    color: #053366; padding: 7px 16px; border-bottom: 1px solid #E2E8F0;
  }
  .group-header td:first-child { border-left: 3px solid #2B96A8; }

  /* ── Badges ── */
  .badge {
    display: inline-block; font-size: 11px; font-weight: 700;
    padding: 3px 9px; border-radius: 20px;
  }
  .b-confirmed { background: #EAF3DE; color: #3B6D11; }
  .b-pending   { background: #FFFBEB; color: #D97706; }
  .b-completed { background: #EFF9FB; color: #0F6E56; }
  .b-cancelled { background: #FCEBEB; color: #A32D2D; }
  .b-paid      { background: #E1F5EE; color: #0F6E56; }
  .b-unpaid    { background: #FFFBEB; color: #D97706; }
  .b-expired   { background: #FCEBEB; color: #A32D2D; }
  .b-refunded  { background: #EFF9FB; color: #185FA5; }
  .b-full      { background: #FCEBEB; color: #A32D2D; }
  .b-available { background: #E1F5EE; color: #0F6E56; }
  .b-low       { background: #FFFBEB; color: #D97706; }

  /* ── Avatar ── */
  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: #E6F1FB; color: #185FA5;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; margin-right: 8px; flex-shrink: 0;
  }
  .tc { display: flex; align-items: center; }

  /* ── Chips ── */
  .chip-date {
    display: inline-flex; align-items: center; gap: 5px;
    background: #E6F1FB; color: #185FA5;
    border-radius: 8px; padding: 3px 10px; font-size: 12px; font-weight: 600;
  }
  .chip-time {
    display: inline-flex; align-items: center; gap: 4px;
    background: #F1F5F9; color: #475569;
    border-radius: 8px; padding: 3px 9px; font-size: 12px; font-weight: 600;
  }

  /* ── Net amount display ── */
  .net-amount {
    font-weight: 700; color: #0F6E56; font-size: 14px;
  }
  .gross-amount {
    font-size: 11px; color: #CBD5E1; text-decoration: line-through; display: block;
  }

  /* ── Progress ── */
  .prog-bar {
    height: 6px; border-radius: 3px; background: #E2E8F0; width: 100px; overflow: hidden;
  }
  .prog-fill { height: 100%; border-radius: 3px; }

  .cap-over { color: #A32D2D; font-weight: 700; }
  .cap-low  { color: #D97706; }
  .cap-ok   { color: #0F6E56; }

  /* ── Payout summary card ── */
  .payout-card {
    background: #fff; border: 1.5px solid #E2E8F0; border-radius: 16px;
    padding: 20px 24px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
    animation: fadeUp .4s ease both;
  }
  .payout-card-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #053366, #2B96A8);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .payout-divider { width: 1px; height: 40px; background: #E2E8F0; }
  .payout-item-lbl { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
  .payout-item-val { font-size: 18px; font-weight: 800; color: #053366; margin-top: 2px; }
  .payout-item-val.net { color: #0F6E56; }
  .payout-item-val.fee { color: #E24B4A; }

  @media (max-width: 900px) { .pw { padding: 20px 20px 48px; } .pw-banner-badge { display: none; } }
  @media (max-width: 640px) {
    .pw { padding: 14px 12px 40px; }
    .pw-metrics { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .pw-export  { margin-left: 0; width: 100%; justify-content: center; }
    .pw-tabs    { width: 100%; }
    .pw-tab     { flex: 1; justify-content: center; }
  }
`;

/* ─── Helpers ──────────────────────────────────────────────── */
function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmt(n: number) { return n.toFixed(2) + " DT"; }
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

type Tab = "reservations" | "paiements" | "capacite";

/* ─── Component ─────────────────────────────────────────────── */
export default function PrestaReservationsClient({
  reservations, paiements, excursions, capacite, prestataireInfo,
}: Props) {
  const [tab, setTab] = useState<Tab>("reservations");
  const [resaSearch, setResaSearch] = useState("");
  const [resaStatus, setResaStatus] = useState("");
  const [paySearch,  setPaySearch]  = useState("");
  const [payStatus,  setPayStatus]  = useState("");
  const [capSearch,  setCapSearch]  = useState("");

  const displayName = prestataireInfo.agency_name || prestataireInfo.full_name || "Prestataire";

  /* ── Filtered reservations ── */
  const filteredResa = useMemo(() => reservations.filter((r) => {
    const q    = resaSearch.toLowerCase();
    const name = r.touriste?.full_name?.toLowerCase() || "";
    const exc  = r.excursion?.title?.toLowerCase() || "";
    const code = r.booking_code.toLowerCase();
    return (!q || name.includes(q) || exc.includes(q) || code.includes(q))
        && (!resaStatus || r.status === resaStatus);
  }), [reservations, resaSearch, resaStatus]);

  /* ── Filtered paiements ── */
  const filteredPay = useMemo(() => paiements.filter((p) => {
    const q    = paySearch.toLowerCase();
    const name = p.reservation?.touriste?.full_name?.toLowerCase() || "";
    const exc  = p.reservation?.excursion?.title?.toLowerCase() || "";
    return (!q || name.includes(q) || exc.includes(q))
        && (!payStatus || p.status === payStatus);
  }), [paiements, paySearch, payStatus]);

  /* ── Reservation stats ── */
  const resaStats = useMemo(() => {
    const paid = reservations.filter((r) => r.payment_status === "paid");
    return {
      total:     reservations.length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      pending:   reservations.filter((r) => r.status === "pending").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      revenue:   paid.reduce((a, b) => a + b.net_amount, 0),
      grossRevenue: paid.reduce((a, b) => a + b.total_price, 0),
    };
  }, [reservations]);

  /* ── Payment stats ── */
  const payStats = useMemo(() => {
    const paid    = paiements.filter((p) => p.status === "paid");
    const gross   = paid.reduce((a, b) => a + b.amount, 0);
    const netTotal = gross * 0.90;
    const feeTotal = gross * 0.10;
    return { gross, netTotal, feeTotal, count: paid.length, pending: paiements.filter((p) => p.status === "pending").length };
  }, [paiements]);

  /* ── Capacité rows ── */
  type CapRow = {
    excursionId: string; excursionTitle: string; excursionCity: string;
    maxPeople: number; date: string; time: string; booked: number;
  };
  const excMap = useMemo(() => {
    const m: Record<string, ExcursionCap> = {};
    excursions.forEach((e) => { m[e.id] = e; });
    return m;
  }, [excursions]);

  const capRows = useMemo((): CapRow[] => {
    const rows: CapRow[] = [];
    Object.entries(capacite).forEach(([excId, slots]) => {
      const exc = excMap[excId];
      if (!exc) return;
      Object.values(slots).forEach((slot) => {
        rows.push({
          excursionId:    excId,
          excursionTitle: exc.title,
          excursionCity:  exc.city,
          maxPeople:      exc.max_people,
          date:           slot.date,
          time:           slot.time,
          booked:         slot.booked,
        });
      });
    });
    rows.sort((a, b) => {
      const t = a.excursionTitle.localeCompare(b.excursionTitle);
      if (t !== 0) return t;
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return a.time.localeCompare(b.time);
    });
    return rows;
  }, [capacite, excMap]);

  const filteredCapRows = useMemo(() => {
    if (!capSearch.trim()) return capRows;
    const q = capSearch.toLowerCase();
    return capRows.filter(
      (r) => r.excursionTitle.toLowerCase().includes(q) || r.excursionCity.toLowerCase().includes(q)
    );
  }, [capRows, capSearch]);

  const groupedCapRows = useMemo(() => {
    const groups: { excursionId: string; excursionTitle: string; excursionCity: string; maxPeople: number; slots: CapRow[] }[] = [];
    let currentId = "";
    filteredCapRows.forEach((row) => {
      if (row.excursionId !== currentId) {
        currentId = row.excursionId;
        groups.push({ excursionId: row.excursionId, excursionTitle: row.excursionTitle, excursionCity: row.excursionCity, maxPeople: row.maxPeople, slots: [row] });
      } else {
        groups[groups.length - 1].slots.push(row);
      }
    });
    return groups;
  }, [filteredCapRows]);

  const capStats = useMemo(() => ({
    totalSlots:   capRows.length,
    fullSlots:    capRows.filter((r) => r.booked >= r.maxPeople).length,
    totalBooked:  capRows.reduce((a, r) => a + r.booked, 0),
  }), [capRows]);

  /* ── CSV export ── */
  function exportCSV(type: Tab) {
    let headers: string[];
    let rows: (string | number | null)[][];

    if (type === "reservations") {
      headers = ["Code", "Touriste", "Téléphone", "Excursion", "Ville", "Date", "Heure", "Personnes", "Prix brut", "Frais app (10%)", "Net reçu", "Statut", "Paiement", "Créé le"];
      rows = filteredResa.map((r) => [
        r.booking_code, r.touriste?.full_name || "—", r.touriste?.phone || "—",
        r.excursion?.title || "—", r.excursion?.city || "—",
        r.date, r.time, r.people_count,
        r.total_price, r.platform_fee, r.net_amount,
        r.status, r.payment_status || "—", fmtDate(r.created_at),
      ]);
    } else if (type === "paiements") {
      headers = ["Touriste", "Téléphone", "Excursion", "Ville", "Date excursion", "Heure", "Personnes", "Prix brut", "Frais app (10%)", "Net reçu (90%)", "Payé le", "Statut"];
      rows = filteredPay.map((p) => [
        p.reservation?.touriste?.full_name || "—",
        p.reservation?.touriste?.phone || "—",
        p.reservation?.excursion?.title || "—",
        p.reservation?.excursion?.city || "—",
        p.reservation?.date || "—",
        p.reservation?.time || "—",
        p.reservation?.people_count || 0,
        p.amount, p.platform_fee.toFixed(2), p.net_amount.toFixed(2),
        fmtDate(p.paid_at), p.status,
      ]);
    } else {
      headers = ["Excursion", "Ville", "Date", "Heure", "Réservées", "Max", "Disponibles", "%"];
      rows = filteredCapRows.map((r) => [
        r.excursionTitle, r.excursionCity, r.date, r.time,
        r.booked, r.maxPeople, Math.max(0, r.maxPeople - r.booked),
        Math.round((r.booked / r.maxPeople) * 100) + "%",
      ]);
    }

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="pw">

        {/* ── Banner ── */}
        <div className="pw-banner">
          <p className="pw-banner-label">Espace prestataire</p>
          <h1 className="pw-banner-title">Réservations & Paiements</h1>
          <p className="pw-banner-sub">Suivi complet de vos excursions, touristes et revenus nets</p>
          <div className="pw-banner-badge">
            <Star size={13} />
            {displayName}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="pw-tabs">
          {([
            { id: "reservations", label: "Réservations", icon: <CalendarDays size={14} /> },
            { id: "paiements",    label: "Paiements",    icon: <Wallet size={14} /> },
            { id: "capacite",     label: "Capacité",     icon: <Users size={14} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(({ id, label, icon }) => (
            <button
              key={id}
              className={`pw-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ══ RESERVATIONS ══ */}
        {tab === "reservations" && (
          <>
            <div className="pw-metrics">
              {[
                { icon: <CalendarDays size={17} color="#2B96A8" />, bg: "#EFF9FB", num: resaStats.total,     lbl: "Total réservations", cls: "" },
                { icon: <CheckCircle2 size={17} color="#0F6E56" />, bg: "#E1F5EE", num: resaStats.confirmed, lbl: "Confirmées",          cls: "" },
                { icon: <Clock        size={17} color="#D97706" />, bg: "#FFFBEB", num: resaStats.pending,   lbl: "En attente",         cls: "" },
                { icon: <XCircle      size={17} color="#A32D2D" />, bg: "#FCEBEB", num: resaStats.cancelled, lbl: "Annulées",           cls: "" },
                { icon: <Wallet       size={17} color="#fff"    />, bg: "transparent", num: fmt(resaStats.revenue), lbl: "Net reçu (90%)", cls: "highlight" },
              ].map(({ icon, bg, num, lbl, cls }) => (
                <div key={lbl} className={`pw-metric ${cls}`}>
                  <div className="pw-metric-icon" style={{ background: bg }}>{icon}</div>
                  <p className="pw-metric-num">{num}</p>
                  <p className="pw-metric-lbl">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="pw-info">
              <AlertCircle size={15} color="#2B96A8" />
              <span>
                Le prix affiché dans la colonne <strong>Net reçu</strong> est votre part après déduction des&nbsp;
                <strong style={{ color: "#E24B4A" }}>10% de frais Pander</strong>.
              </span>
            </div>

            <div className="pw-toolbar">
              <div className="pw-search">
                <Search size={13} color="#94A3B8" />
                <input
                  placeholder="Touriste, excursion, code…"
                  value={resaSearch}
                  onChange={(e) => setResaSearch(e.target.value)}
                />
              </div>
              <select className="pw-select" value={resaStatus} onChange={(e) => setResaStatus(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <button className="pw-export" onClick={() => exportCSV("reservations")}>
                <Download size={13} /> Exporter CSV
              </button>
            </div>

            <div className="pw-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Touriste</th>
                    <th>Téléphone</th>
                    <th>Excursion</th>
                    <th>Ville</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Pers.</th>
                    <th>Prix brut</th>
                    <th>Net reçu (−10%)</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResa.length === 0 ? (
                    <tr><td colSpan={12} style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
                      Aucune réservation trouvée
                    </td></tr>
                  ) : filteredResa.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="tc">
                          <span className="avatar">{initials(r.touriste?.full_name ?? null)}</span>
                          <span>{r.touriste?.full_name || "—"}</span>
                        </div>
                      </td>
                      <td style={{ color: "#94A3B8" }}>{r.touriste?.phone || "—"}</td>
                      <td title={r.excursion?.title}>{r.excursion?.title || "—"}</td>
                      <td>
                        {r.excursion?.city
                          ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={11} color="#94A3B8" />{r.excursion.city}
                            </span>
                          : "—"}
                      </td>
                      <td>
                        <span className="chip-date">
                          <CalendarDays size={11} />{fmtDate(r.date)}
                        </span>
                      </td>
                      <td>
                        <span className="chip-time">
                          <Clock size={11} />{r.time}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{r.people_count}</td>
                      <td>
                        <span style={{ color: "#CBD5E1", fontSize: 13 }}>{fmt(r.total_price)}</span>
                      </td>
                      <td>
                        <span className="net-amount">{fmt(r.net_amount)}</span>
                        <span className="gross-amount">
                          −{fmt(r.platform_fee)} frais
                        </span>
                      </td>
                      <td>
                        <span className={`badge b-${r.status}`}>
                          {r.status === "confirmed" ? "Confirmé"
                            : r.status === "pending" ? "En attente"
                            : r.status === "completed" ? "Terminé"
                            : "Annulé"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge b-${r.payment_status || "unpaid"}`}>
                          {r.payment_status === "paid" ? "Payé"
                            : r.payment_status === "expired" ? "Expiré"
                            : "Non payé"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#2B96A8" }}>
                        {r.booking_code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ PAIEMENTS ══ */}
        {tab === "paiements" && (
          <>
            {/* Payout summary */}
            <div className="payout-card">
              <div className="payout-card-icon">
                <Wallet size={22} color="#fff" />
              </div>
              <div>
                <div className="payout-item-lbl">Total perçu (brut)</div>
                <div className="payout-item-val">{fmt(payStats.gross)}</div>
              </div>
              <div className="payout-divider" />
              <div>
                <div className="payout-item-lbl">Frais Pander (10%)</div>
                <div className="payout-item-val fee">−{fmt(payStats.feeTotal)}</div>
              </div>
              <div className="payout-divider" />
              <div>
                <div className="payout-item-lbl">Net reçu (90%)</div>
                <div className="payout-item-val net">{fmt(payStats.netTotal)}</div>
              </div>
              <div className="payout-divider" />
              <div>
                <div className="payout-item-lbl">Paiements reçus</div>
                <div className="payout-item-val">{payStats.count}</div>
              </div>
              {payStats.pending > 0 && (
                <>
                  <div className="payout-divider" />
                  <div>
                    <div className="payout-item-lbl">En attente</div>
                    <div className="payout-item-val" style={{ color: "#D97706" }}>{payStats.pending}</div>
                  </div>
                </>
              )}
            </div>

            <div className="pw-info">
              <CreditCard size={15} color="#2B96A8" />
              <span>
                Pander prélève <strong style={{ color: "#E24B4A" }}>10% de frais</strong> sur chaque paiement.
                Le montant affiché en <strong style={{ color: "#0F6E56" }}>vert</strong> est ce que vous recevez réellement.
              </span>
            </div>

            <div className="pw-toolbar">
              <div className="pw-search">
                <Search size={13} color="#94A3B8" />
                <input
                  placeholder="Touriste ou excursion…"
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                />
              </div>
              <select className="pw-select" value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
                <option value="">Tous</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="refunded">Remboursé</option>
              </select>
              <button className="pw-export" onClick={() => exportCSV("paiements")}>
                <Download size={13} /> Exporter CSV
              </button>
            </div>

            <div className="pw-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Touriste</th>
                    <th>Téléphone</th>
                    <th>Excursion</th>
                    <th>Ville</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Pers.</th>
                    <th>Prix brut</th>
                    <th>Frais (10%)</th>
                    <th>Net reçu (90%)</th>
                    <th>Payé le</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPay.length === 0 ? (
                    <tr><td colSpan={12} style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
                      Aucun paiement trouvé
                    </td></tr>
                  ) : filteredPay.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="tc">
                          <span className="avatar">{initials(p.reservation?.touriste?.full_name ?? null)}</span>
                          <span>{p.reservation?.touriste?.full_name || "—"}</span>
                        </div>
                      </td>
                      <td style={{ color: "#94A3B8" }}>{p.reservation?.touriste?.phone || "—"}</td>
                      <td title={p.reservation?.excursion?.title}>{p.reservation?.excursion?.title || "—"}</td>
                      <td>
                        {p.reservation?.excursion?.city
                          ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={11} color="#94A3B8" />{p.reservation.excursion.city}
                            </span>
                          : "—"}
                      </td>
                      <td>
                        {p.reservation?.date
                          ? <span className="chip-date"><CalendarDays size={11} />{fmtDate(p.reservation.date)}</span>
                          : "—"}
                      </td>
                      <td>
                        {p.reservation?.time
                          ? <span className="chip-time"><Clock size={11} />{p.reservation.time}</span>
                          : "—"}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{p.reservation?.people_count || "—"}</td>

                      {/* Gross */}
                      <td style={{ color: "#CBD5E1" }}>{fmt(p.amount)}</td>

                      {/* Fee */}
                      <td style={{ color: "#E24B4A", fontWeight: 600 }}>−{fmt(p.platform_fee)}</td>

                      {/* Net — highlighted */}
                      <td>
                        <span className="net-amount" style={{ fontSize: 15 }}>
                          {fmt(p.net_amount)}
                        </span>
                      </td>

                      <td style={{ fontSize: 12, color: "#64748B" }}>{fmtDate(p.paid_at)}</td>
                      <td>
                        <span className={`badge b-${p.status}`}>
                          {p.status === "paid" ? "Payé"
                            : p.status === "refunded" ? "Remboursé"
                            : "En attente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ CAPACITE ══ */}
        {tab === "capacite" && (
          <>
            <div className="pw-metrics" style={{ marginBottom: 18 }}>
              {[
                { icon: <CalendarDays size={17} color="#2B96A8" />, bg: "#EFF9FB", num: capStats.totalSlots,  lbl: "Créneaux actifs",    cls: "" },
                { icon: <Users        size={17} color="#0F6E56" />, bg: "#E1F5EE", num: capStats.totalBooked, lbl: "Personnes réservées", cls: "" },
                { icon: <AlertCircle  size={17} color="#A32D2D" />, bg: "#FCEBEB", num: capStats.fullSlots,   lbl: "Créneaux complets",  cls: "" },
              ].map(({ icon, bg, num, lbl, cls }) => (
                <div key={lbl} className={`pw-metric ${cls}`}>
                  <div className="pw-metric-icon" style={{ background: bg }}>{icon}</div>
                  <p className="pw-metric-num">{num}</p>
                  <p className="pw-metric-lbl">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="pw-info">
              <Users size={15} color="#2B96A8" />
              <span>
                Capacité calculée <strong>par créneau (date + heure)</strong> pour chaque excursion.
                Les réservations annulées sont exclues du calcul.
              </span>
            </div>

            <div className="pw-toolbar">
              <div className="pw-search">
                <Search size={13} color="#94A3B8" />
                <input
                  placeholder="Rechercher excursion ou ville…"
                  value={capSearch}
                  onChange={(e) => setCapSearch(e.target.value)}
                />
              </div>
              <button className="pw-export" onClick={() => exportCSV("capacite")}>
                <Download size={13} /> Exporter CSV
              </button>
            </div>

            <div className="pw-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Excursion</th>
                    <th>Ville</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Réservées</th>
                    <th>Capacité max</th>
                    <th>Disponibles</th>
                    <th>Remplissage</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedCapRows.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
                      Aucune donnée de capacité disponible
                    </td></tr>
                  ) : groupedCapRows.map((group) => (
                    <>
                      <tr key={`grp-${group.excursionId}`} className="group-header">
                        <td colSpan={9}>
                          {group.excursionTitle}
                          <span style={{ fontWeight: 400, color: "#64748B", marginLeft: 10, fontSize: 11 }}>
                            <MapPin size={10} style={{ verticalAlign: "middle" }} /> {group.excursionCity}
                            &nbsp;·&nbsp;max {group.maxPeople} pers. / créneau
                            &nbsp;·&nbsp;{group.slots.length} créneau{group.slots.length > 1 ? "x" : ""}
                          </span>
                        </td>
                      </tr>
                      {group.slots.map((slot) => {
                        const avail    = slot.maxPeople - slot.booked;
                        const pct      = Math.min(100, Math.round((slot.booked / slot.maxPeople) * 100));
                        const over     = slot.booked > slot.maxPeople;
                        const isFull   = avail <= 0;
                        const isLow    = !isFull && avail <= Math.ceil(slot.maxPeople * 0.2);
                        const barColor = over ? "#E24B4A" : pct > 80 ? "#EF9F27" : "#1D9E75";
                        const statusLabel = over ? "Dépassé ⚠" : isFull ? "Complet" : isLow ? "Quasi-plein" : "Disponible";
                        const statusCls   = over || isFull ? "b-full" : isLow ? "b-low" : "b-available";

                        return (
                          <tr key={`${group.excursionId}-${slot.date}-${slot.time}`}>
                            <td style={{ color: "#94A3B8", paddingLeft: 28 }} />
                            <td style={{ color: "#94A3B8" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <MapPin size={11} color="#94A3B8" />{group.excursionCity}
                              </span>
                            </td>
                            <td>
                              <span className="chip-date">
                                <CalendarDays size={11} />{fmtDateShort(slot.date)}
                              </span>
                            </td>
                            <td>
                              <span className="chip-time">
                                <Clock size={11} />{slot.time}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 700, color: over ? "#A32D2D" : "#053366" }}>
                              {slot.booked}{over && <span style={{ fontSize: 11, color: "#A32D2D", marginLeft: 4 }}>⚠</span>}
                            </td>
                            <td style={{ textAlign: "center", color: "#94A3B8" }}>{slot.maxPeople}</td>
                            <td style={{ textAlign: "center" }}>
                              <span className={over || isFull ? "cap-over" : isLow ? "cap-low" : "cap-ok"}>
                                {Math.max(0, avail)}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div className="prog-bar">
                                  <div className="prog-fill" style={{ width: `${pct}%`, background: barColor }} />
                                </div>
                                <span style={{ fontSize: 12, color: "#94A3B8", minWidth: 34 }}>{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${statusCls}`}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </>
  );
}