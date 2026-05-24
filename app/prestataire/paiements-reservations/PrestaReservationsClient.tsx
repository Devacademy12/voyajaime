"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Users, CreditCard, TrendingUp, Download,
  Search, CheckCircle2, Clock, Wallet, MapPin, Star,
  AlertCircle, XCircle, ArrowUpRight, ChevronDown, ChevronUp,
  BarChart2, Banknote, Eye,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface TouristeProfile { full_name: string | null; phone: string | null; }
interface ExcursionInfo { id: string; title: string; city: string; price_per_person: number; max_people: number; }
interface Reservation {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number; net_amount: number;
  status: string; payment_status: string | null; payment_method: string | null;
  payment_deadline: string | null;
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
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(43,150,168,.25); }
    70%  { box-shadow: 0 0 0 8px rgba(43,150,168,0); }
    100% { box-shadow: 0 0 0 0 rgba(43,150,168,0); }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pw {
    font-family: inherit'Plus Jakarta Sans', system-ui, sans-serif;
    background: #F5F7FA;
    min-height: 100vh;
    padding: 28px 36px 64px;
    width: 100%;
  }

  /* ── Header ── */
  .pw-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    animation: fadeUp .35s ease both;
    flex-wrap: wrap;
  }
  .pw-header-left {}
  .pw-header-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: #EFF9FB; border: 1px solid rgba(43,150,168,.22);
    border-radius: 20px; padding: 4px 12px;
    font-size: 11px; font-weight: 700; color: #2B96A8;
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 10px;
  }
  .pw-header-title {
    font-size: clamp(22px, 4vw, 30px); font-weight: 800;
    color: #053366; line-height: 1.1; letter-spacing: -.02em;
  }
  .pw-header-sub {
    font-size: 13px; color: #94A3B8; margin-top: 5px; font-weight: 500;
  }
  .pw-header-badge {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
    padding: 10px 16px; flex-shrink: 0; align-self: flex-start;
  }
  .pw-header-badge-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #053366, #2B96A8);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #fff;
  }
  .pw-header-badge-name {
    font-size: 13px; font-weight: 700; color: #053366;
  }
  .pw-header-badge-role {
    font-size: 11px; color: #94A3B8; font-weight: 500;
  }

  /* ── Tabs ── */
  .pw-tabs {
    display: flex; gap: 2px;
    background: #fff; border-radius: 14px;
    padding: 5px; margin-bottom: 24px;
    border: 1.5px solid #E2E8F0;
    width: fit-content;
    animation: fadeUp .4s ease both;
    overflow-x: auto; max-width: 100%;
  }
  .pw-tab {
    padding: 9px 18px; border: none; background: none;
    font-family: inherit'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: #94A3B8; cursor: pointer; border-radius: 10px;
    display: flex; align-items: center; gap: 7px; transition: all .18s;
    white-space: nowrap;
  }
  .pw-tab.active {
    background: #053366;
    color: #fff; box-shadow: 0 4px 16px rgba(5,51,102,.22);
  }
  .pw-tab.active .tab-accent { color: rgba(255,255,255,.6); }
  .pw-tab:hover:not(.active) { color: #053366; background: #F0F4F8; }
  .tab-accent {
    font-size: 11px; background: rgba(43,150,168,.12);
    color: #2B96A8; border-radius: 6px; padding: 1px 6px; font-weight: 700;
  }

  /* ── Metrics grid ── */
  .pw-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px; margin-bottom: 20px;
  }
  .pw-metric {
    background: #fff; border-radius: 16px; border: 1.5px solid #E2E8F0;
    padding: 18px 20px; animation: fadeUp .45s ease both;
    transition: box-shadow .2s, transform .2s; cursor: default;
  }
  .pw-metric:hover { box-shadow: 0 6px 20px rgba(5,51,102,.07); transform: translateY(-2px); }
  .pw-metric-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .pw-metric-icon {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .pw-metric-trend {
    font-size: 10px; font-weight: 700; color: #2B96A8;
    background: #EFF9FB; border-radius: 6px; padding: 2px 6px;
  }
  .pw-metric-num { font-size: 24px; font-weight: 800; color: #053366; line-height: 1; letter-spacing: -.02em; }
  .pw-metric-lbl { font-size: 11px; color: #94A3B8; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

  .pw-metric.accent {
    background: #053366; border-color: transparent;
  }
  .pw-metric.accent .pw-metric-num { color: #fff; }
  .pw-metric.accent .pw-metric-lbl { color: rgba(255,255,255,.5); }
  .pw-metric.accent .pw-metric-trend { background: rgba(255,255,255,.15); color: rgba(255,255,255,.85); }

  /* ── Info banner ── */
  .pw-info {
    display: flex; align-items: flex-start; gap: 10px;
    background: #EFF9FB; border: 1px solid rgba(43,150,168,.2);
    border-left: 3px solid #2B96A8;
    border-radius: 10px; padding: 11px 14px;
    font-size: 12.5px; color: #334155; margin-bottom: 16px;
    line-height: 1.55;
  }
  .pw-info strong { color: #053366; }
  .pw-info-icon { margin-top: 1px; flex-shrink: 0; }

  /* ── Toolbar ── */
  .pw-toolbar {
    display: flex; gap: 8px; margin-bottom: 14px;
    flex-wrap: wrap; align-items: center;
  }
  .pw-search {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid #E2E8F0;
    border-radius: 10px; padding: 9px 14px;
    flex: 1; min-width: 180px; max-width: 320px;
    transition: border-color .15s;
  }
  .pw-search:focus-within { border-color: #2B96A8; }
  .pw-search input {
    border: none; outline: none; background: transparent;
    font-size: 13px; font-family: inherit'Plus Jakarta Sans', sans-serif;
    color: #053366; width: 100%;
  }
  .pw-search input::placeholder { color: #CBD5E1; }
  .pw-select {
    padding: 9px 12px; border-radius: 10px; border: 1.5px solid #E2E8F0;
    background: #fff; font-size: 13px; font-family: inherit'Plus Jakarta Sans', sans-serif;
    color: #053366; cursor: pointer; outline: none;
    transition: border-color .15s;
  }
  .pw-select:focus { border-color: #2B96A8; }
  .pw-export {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid #E2E8F0; background: #fff;
    color: #053366; font-size: 13px; font-weight: 600;
    font-family: inherit'Plus Jakarta Sans', sans-serif; cursor: pointer;
    margin-left: auto; transition: all .15s;
  }
  .pw-export:hover { border-color: #2B96A8; color: #2B96A8; background: #EFF9FB; }

  /* ── Table card ── */
  .pw-table-card {
    background: #fff; border-radius: 16px; border: 1.5px solid #E2E8F0;
    overflow: hidden;
  }
  .pw-table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 720px; }
  thead th {
    padding: 11px 16px; text-align: left; font-size: 10px; font-weight: 700;
    color: #94A3B8; background: #F8FAFC; border-bottom: 1.5px solid #E2E8F0;
    letter-spacing: .07em; text-transform: uppercase; white-space: nowrap;
  }
  tbody td {
    padding: 13px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9;
    color: #2D3748; vertical-align: middle; white-space: nowrap;
    max-width: 200px; overflow: hidden; text-overflow: ellipsis;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #F8FBFF; }

  .group-header td {
    background: #F0F9FB; font-weight: 700; font-size: 12px;
    color: #053366; padding: 8px 16px; border-bottom: 1px solid #E2E8F0;
    border-top: 1px solid #E2E8F0;
  }
  .group-header td:first-child { border-left: 3px solid #2B96A8; }

  /* ── "Voir tout" footer ── */
  .pw-table-footer {
    padding: 12px 16px; border-top: 1.5px solid #F1F5F9;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
  }
  .pw-footer-count {
    font-size: 12px; color: #94A3B8; font-weight: 500;
  }
  .pw-voir-tout {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px;
    border: 1.5px solid rgba(43,150,168,.3); background: #EFF9FB;
    color: #2B96A8; font-size: 12.5px; font-weight: 700;
    font-family: inherit'Plus Jakarta Sans', sans-serif; cursor: pointer;
    transition: all .15s;
  }
  .pw-voir-tout:hover { background: rgba(43,150,168,.15); border-color: #2B96A8; }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 700;
    padding: 3px 8px; border-radius: 20px;
  }
  .badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .b-confirmed { background: #EAF3DE; color: #3B6D11; }
  .b-confirmed::before { background: #3B6D11; }
  .b-pending   { background: #FFFBEB; color: #D97706; }
  .b-pending::before { background: #D97706; }
  .b-completed { background: #EFF9FB; color: #0B7A6B; }
  .b-completed::before { background: #0B7A6B; }
  .b-cancelled { background: #FEF2F2; color: #B91C1C; }
  .b-cancelled::before { background: #B91C1C; }
  .b-paid      { background: #ECFDF5; color: #059669; }
  .b-paid::before { background: #059669; }
  .b-unpaid    { background: #FFFBEB; color: #D97706; }
  .b-unpaid::before { background: #D97706; }
  .b-expired   { background: #FEF2F2; color: #B91C1C; }
  .b-expired::before { background: #B91C1C; }
  .b-refunded  { background: #EFF9FB; color: #185FA5; }
  .b-refunded::before { background: #185FA5; }
  .b-full      { background: #FEF2F2; color: #B91C1C; }
  .b-full::before { background: #B91C1C; }
  .b-available { background: #ECFDF5; color: #059669; }
  .b-available::before { background: #059669; }
  .b-low       { background: #FFFBEB; color: #D97706; }
  .b-low::before { background: #D97706; }

  /* ── Avatar ── */
  .avatar {
    width: 30px; height: 30px; border-radius: 8px;
    background: #EFF9FB; color: #2B96A8;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; margin-right: 8px; flex-shrink: 0;
  }
  .tc { display: flex; align-items: center; }

  /* ── Chips ── */
  .chip-date {
    display: inline-flex; align-items: center; gap: 5px;
    background: #EFF9FB; color: #185FA5;
    border-radius: 6px; padding: 3px 9px; font-size: 12px; font-weight: 600;
  }
  .chip-time {
    display: inline-flex; align-items: center; gap: 4px;
    background: #F1F5F9; color: #475569;
    border-radius: 6px; padding: 3px 8px; font-size: 12px; font-weight: 600;
  }

  /* ── Net amount ── */
  .net-amount { font-weight: 700; color: #059669; font-size: 14px; }
  .gross-amount { font-size: 11px; color: #CBD5E1; text-decoration: line-through; display: block; }

  /* ── Progress ── */
  .prog-bar {
    height: 5px; border-radius: 3px; background: #E2E8F0; width: 90px; overflow: hidden;
  }
  .prog-fill { height: 100%; border-radius: 3px; }
  .cap-over { color: #B91C1C; font-weight: 700; }
  .cap-low  { color: #D97706; }
  .cap-ok   { color: #059669; }

  /* ── Payout summary ── */
  .payout-card {
    background: #fff; border: 1.5px solid #E2E8F0; border-radius: 16px;
    padding: 20px 24px; margin-bottom: 18px;
    display: flex; align-items: center; gap: 0; flex-wrap: wrap;
    animation: fadeUp .4s ease both; overflow: hidden;
  }
  .payout-item {
    padding: 8px 24px; flex: 1; min-width: 130px;
    border-right: 1px solid #E2E8F0;
  }
  .payout-item:first-child { padding-left: 0; }
  .payout-item:last-child { border-right: none; }
  .payout-item-lbl { font-size: 10px; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
  .payout-item-val { font-size: 20px; font-weight: 800; color: #053366; margin-top: 3px; letter-spacing: -.02em; }
  .payout-item-val.net { color: #059669; }
  .payout-item-val.fee { color: #DC2626; }

  /* ── Empty state ── */
  .empty-state {
    text-align: center; padding: 52px 20px; color: #94A3B8;
  }
  .empty-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: #F1F5F9; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
  }
  .empty-title { font-size: 14px; font-weight: 700; color: #CBD5E1; }
  .empty-sub { font-size: 12px; margin-top: 4px; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .pw { padding: 20px 24px 48px; }
    .payout-item { min-width: 110px; padding: 8px 16px; }
  }
  @media (max-width: 768px) {
    .pw { padding: 16px 14px 40px; }
    .pw-metrics { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .pw-export  { margin-left: 0; }
    .pw-tabs    { width: 100%; }
    .pw-search  { max-width: 100%; }
    .payout-card { flex-direction: column; gap: 0; }
    .payout-item { border-right: none; border-bottom: 1px solid #F1F5F9; padding: 12px 0; min-width: unset; width: 100%; }
    .payout-item:last-child { border-bottom: none; }
    .pw-header-badge { display: none; }
  }
  @media (max-width: 480px) {
    .pw { padding: 12px 10px 32px; }
    .pw-metrics { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .pw-metric { padding: 14px 14px; }
    .pw-metric-num { font-size: 18px; }
    .pw-tab { padding: 8px 12px; font-size: 12px; }
  }
`;

/* ─── Helpers ──────────────────────────────────────────────── */
const PREVIEW_ROWS = 8;

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmt(n: number) { return n.toFixed(2) + " DT"; }
function fmtDate(s: string | null) {
  if (!s) return "—";
  const d = s.includes("T") ? new Date(s) : new Date(s + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function getEffectivePaymentStatus(r: Reservation): string {
  if (r.payment_status === "paid") return "paid";
  if (r.payment_status === "expired") return "expired";
  if (r.status === "pending" && r.payment_deadline) {
    if (new Date(r.payment_deadline).getTime() < Date.now()) return "expired";
  }
  return r.payment_status || "unpaid";
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

  // "Voir tout" toggles
  const [showAllResa, setShowAllResa] = useState(false);
  const [showAllPay,  setShowAllPay]  = useState(false);
  const [showAllCap,  setShowAllCap]  = useState(false);

  const displayName = prestataireInfo.agency_name || prestataireInfo.full_name || "Prestataire";
  const displayInitials = initials(displayName);

  /* ── Filtered reservations ── */
  const filteredResa = useMemo(() => reservations.filter((r) => {
    const q = resaSearch.toLowerCase();
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

  /* ── Stats ── */
  const resaStats = useMemo(() => {
    const paid = reservations.filter((r) => r.payment_status === "paid");
    return {
      total:     reservations.length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      pending:   reservations.filter((r) => r.status === "pending").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      revenue:   paid.reduce((a, b) => a + b.net_amount, 0),
    };
  }, [reservations]);

  const payStats = useMemo(() => {
    const paid     = paiements.filter((p) => p.status === "paid");
    const gross    = paid.reduce((a, b) => a + b.amount, 0);
    const netTotal = paid.reduce((a, b) => a + b.net_amount, 0);
    const feeTotal = paid.reduce((a, b) => a + b.platform_fee, 0);
    return { gross, netTotal, feeTotal, count: paid.length, pending: paiements.filter((p) => p.status === "pending").length };
  }, [paiements]);

  /* ── Capacité ── */
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
          excursionId: excId, excursionTitle: exc.title, excursionCity: exc.city,
          maxPeople: exc.max_people, date: slot.date, time: slot.time, booked: slot.booked,
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
    totalSlots:  capRows.length,
    fullSlots:   capRows.filter((r) => r.booked >= r.maxPeople).length,
    totalBooked: capRows.reduce((a, r) => a + r.booked, 0),
  }), [capRows]);

  // For capacité "voir tout" — flatten grouped for counting
  const flatCapRows = useMemo(() => groupedCapRows.flatMap(g => g.slots), [groupedCapRows]);

  /* ── CSV export ── */
  function exportCSV(type: Tab) {
    let headers: string[];
    let rows: (string | number | null)[][];
    if (type === "reservations") {
      headers = ["Code","Touriste","Téléphone","Excursion","Ville","Date","Heure","Personnes","Prix brut","Frais app (10%)","Net reçu","Statut","Paiement","Créé le"];
      rows = filteredResa.map((r) => [r.booking_code, r.touriste?.full_name||"—", r.touriste?.phone||"—", r.excursion?.title||"—", r.excursion?.city||"—", r.date, r.time, r.people_count, r.total_price, r.platform_fee, r.net_amount, r.status, r.payment_status||"—", fmtDate(r.created_at)]);
    } else if (type === "paiements") {
      headers = ["Touriste","Téléphone","Excursion","Ville","Date","Heure","Personnes","Prix brut","Frais app (10%)","Net reçu (90%)","Payé le","Statut"];
      rows = filteredPay.map((p) => [p.reservation?.touriste?.full_name||"—", p.reservation?.touriste?.phone||"—", p.reservation?.excursion?.title||"—", p.reservation?.excursion?.city||"—", p.reservation?.date||"—", p.reservation?.time||"—", p.reservation?.people_count||0, p.amount, p.platform_fee.toFixed(2), p.net_amount.toFixed(2), fmtDate(p.paid_at), p.status]);
    } else {
      headers = ["Excursion","Ville","Date","Heure","Réservées","Max","Disponibles","%"];
      rows = filteredCapRows.map((r) => [r.excursionTitle, r.excursionCity, r.date, r.time, r.booked, r.maxPeople, Math.max(0, r.maxPeople - r.booked), Math.round((r.booked/r.maxPeople)*100)+"%"]);
    }
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${type}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  /* ── Displayed rows ── */
  const visibleResa = showAllResa ? filteredResa : filteredResa.slice(0, PREVIEW_ROWS);
  const visiblePay  = showAllPay  ? filteredPay  : filteredPay.slice(0, PREVIEW_ROWS);

  // For cap groups — count visible slots
  const visibleCapGroups = useMemo(() => {
    if (showAllCap) return groupedCapRows;
    let remaining = PREVIEW_ROWS;
    const result = [];
    for (const group of groupedCapRows) {
      if (remaining <= 0) break;
      const slots = group.slots.slice(0, remaining);
      result.push({ ...group, slots });
      remaining -= slots.length;
    }
    return result;
  }, [groupedCapRows, showAllCap]);

  return (
    <>
      <style>{CSS}</style>
      <div className="pw">

        {/* ── Header ── */}
        <div className="pw-header">
          <div className="pw-header-left">
            <h1 className="pw-header-title">Réservations & Paiements</h1>
          </div>
          
        </div>

        {/* ── Tabs ── */}
        <div className="pw-tabs">
          {([
            { id: "reservations", label: "Réservations", icon: <CalendarDays size={14} />, count: reservations.length },
            { id: "paiements",    label: "Paiements",    icon: <Banknote size={14} />,     count: paiements.length },
            { id: "capacite",     label: "Capacité",     icon: <BarChart2 size={14} />,    count: capRows.length },
          ] as { id: Tab; label: string; icon: React.ReactNode; count: number }[]).map(({ id, label, icon, count }) => (
            <button key={id} className={`pw-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
              {icon} {label}
              <span className="tab-accent">{count}</span>
            </button>
          ))}
        </div>

        {/* ══ RESERVATIONS ══ */}
        {tab === "reservations" && (
          <>
            <div className="pw-metrics">
              {[
                { icon: <CalendarDays size={16} color="#2B96A8" />, bg: "#EFF9FB", num: resaStats.total,     lbl: "Total",       cls: "" },
                { icon: <CheckCircle2 size={16} color="#059669" />, bg: "#ECFDF5", num: resaStats.confirmed, lbl: "Confirmées",  cls: "" },
                { icon: <Clock        size={16} color="#D97706" />, bg: "#FFFBEB", num: resaStats.pending,   lbl: "En attente",  cls: "" },
                { icon: <XCircle      size={16} color="#B91C1C" />, bg: "#FEF2F2", num: resaStats.cancelled, lbl: "Annulées",    cls: "" },
                { icon: <Wallet       size={16} color="#fff"    />, bg: "transparent", num: fmt(resaStats.revenue), lbl: "Net reçu (90%)", cls: "accent" },
              ].map(({ icon, bg, num, lbl, cls }) => (
                <div key={lbl} className={`pw-metric ${cls}`}>
                  <div className="pw-metric-top">
                    <div className="pw-metric-icon" style={{ background: bg }}>{icon}</div>
                  </div>
                  <p className="pw-metric-num">{num}</p>
                  <p className="pw-metric-lbl">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="pw-info">
              <AlertCircle size={14} color="#2B96A8" className="pw-info-icon" />
              <span>
                La colonne <strong>Net reçu</strong> affiche votre part après déduction des{" "}
                <strong style={{ color: "#DC2626" }}>10% de frais Pander</strong>.
              </span>
            </div>

            <div className="pw-toolbar">
              <div className="pw-search">
                <Search size={13} color="#CBD5E1" />
                <input placeholder="Touriste, excursion, code…" value={resaSearch} onChange={(e) => setResaSearch(e.target.value)} />
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

            <div className="pw-table-card">
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
                      <tr>
                        <td colSpan={12}>
                          <div className="empty-state">
                            <div className="empty-icon"><CalendarDays size={20} color="#CBD5E1" /></div>
                            <div className="empty-title">Aucune réservation trouvée</div>
                            <div className="empty-sub">Modifiez vos filtres pour afficher des résultats</div>
                          </div>
                        </td>
                      </tr>
                    ) : visibleResa.map((r) => {
                      const ep = getEffectivePaymentStatus(r);
                      return (
                        <tr key={r.id}>
                          <td><div className="tc"><span className="avatar">{initials(r.touriste?.full_name ?? null)}</span><span>{r.touriste?.full_name || "—"}</span></div></td>
                          <td style={{ color: "#94A3B8" }}>{r.touriste?.phone || "—"}</td>
                          <td title={r.excursion?.title}>{r.excursion?.title || "—"}</td>
                          <td>{r.excursion?.city ? <span style={{ display:"flex",alignItems:"center",gap:4 }}><MapPin size={11} color="#CBD5E1" />{r.excursion.city}</span> : "—"}</td>
                          <td><span className="chip-date"><CalendarDays size={10} />{fmtDate(r.date)}</span></td>
                          <td><span className="chip-time"><Clock size={10} />{r.time}</span></td>
                          <td style={{ textAlign:"center", fontWeight:700, color:"#053366" }}>{r.people_count}</td>
                          <td style={{ color:"#CBD5E1", fontSize:12 }}>{fmt(r.total_price)}</td>
                          <td>
                            <span className="net-amount">{fmt(r.net_amount)}</span>
                            <span className="gross-amount">−{fmt(r.platform_fee)} frais</span>
                          </td>
                          <td><span className={`badge b-${r.status}`}>{r.status==="confirmed"?"Confirmé":r.status==="pending"?"En attente":r.status==="completed"?"Terminé":"Annulé"}</span></td>
                          <td><span className={`badge b-${ep}`}>{ep==="paid"?"Payé":ep==="expired"?"Expiré":"Non payé"}</span></td>
                          <td style={{ fontFamily:"monospace", fontSize:11, color:"#2B96A8", letterSpacing:".03em" }}>{r.booking_code}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredResa.length > PREVIEW_ROWS && (
                <div className="pw-table-footer">
                  <span className="pw-footer-count">
                    {showAllResa ? filteredResa.length : Math.min(PREVIEW_ROWS, filteredResa.length)} / {filteredResa.length} réservations
                  </span>
                  <button className="pw-voir-tout" onClick={() => setShowAllResa(!showAllResa)}>
                    <Eye size={13} />
                    {showAllResa ? "Réduire" : `Voir tout (${filteredResa.length})`}
                    {showAllResa ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ PAIEMENTS ══ */}
        {tab === "paiements" && (
          <>
            <div className="payout-card">
              <div className="payout-item">
                <div className="payout-item-lbl">Total brut perçu</div>
                <div className="payout-item-val">{fmt(payStats.gross)}</div>
              </div>
              <div className="payout-item">
                <div className="payout-item-lbl">Frais Pander (10%)</div>
                <div className="payout-item-val fee">−{fmt(payStats.feeTotal)}</div>
              </div>
              <div className="payout-item">
                <div className="payout-item-lbl">Net reçu (90%)</div>
                <div className="payout-item-val net">{fmt(payStats.netTotal)}</div>
              </div>
              <div className="payout-item">
                <div className="payout-item-lbl">Paiements reçus</div>
                <div className="payout-item-val">{payStats.count}</div>
              </div>
              {payStats.pending > 0 && (
                <div className="payout-item">
                  <div className="payout-item-lbl">En attente</div>
                  <div className="payout-item-val" style={{ color:"#D97706" }}>{payStats.pending}</div>
                </div>
              )}
            </div>

            <div className="pw-info">
              <CreditCard size={14} color="#2B96A8" className="pw-info-icon" />
              <span>
                Pander prélève <strong style={{ color:"#DC2626" }}>10% de frais</strong> sur chaque paiement.
                Le montant en <strong style={{ color:"#059669" }}>vert</strong> est ce que vous recevez réellement.
              </span>
            </div>

            <div className="pw-toolbar">
              <div className="pw-search">
                <Search size={13} color="#CBD5E1" />
                <input placeholder="Touriste ou excursion…" value={paySearch} onChange={(e) => setPaySearch(e.target.value)} />
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

            <div className="pw-table-card">
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
                      <tr>
                        <td colSpan={12}>
                          <div className="empty-state">
                            <div className="empty-icon"><Banknote size={20} color="#CBD5E1" /></div>
                            <div className="empty-title">Aucun paiement trouvé</div>
                            <div className="empty-sub">Modifiez vos filtres pour afficher des résultats</div>
                          </div>
                        </td>
                      </tr>
                    ) : visiblePay.map((p) => (
                      <tr key={p.id}>
                        <td><div className="tc"><span className="avatar">{initials(p.reservation?.touriste?.full_name??null)}</span><span>{p.reservation?.touriste?.full_name||"—"}</span></div></td>
                        <td style={{ color:"#94A3B8" }}>{p.reservation?.touriste?.phone||"—"}</td>
                        <td title={p.reservation?.excursion?.title}>{p.reservation?.excursion?.title||"—"}</td>
                        <td>{p.reservation?.excursion?.city?<span style={{display:"flex",alignItems:"center",gap:4}}><MapPin size={11} color="#CBD5E1"/>{p.reservation.excursion.city}</span>:"—"}</td>
                        <td>{p.reservation?.date?<span className="chip-date"><CalendarDays size={10}/>{fmtDate(p.reservation.date)}</span>:"—"}</td>
                        <td>{p.reservation?.time?<span className="chip-time"><Clock size={10}/>{p.reservation.time}</span>:"—"}</td>
                        <td style={{textAlign:"center",fontWeight:700,color:"#053366"}}>{p.reservation?.people_count||"—"}</td>
                        <td style={{color:"#CBD5E1",fontSize:12}}>{fmt(p.amount)}</td>
                        <td style={{color:"#DC2626",fontWeight:600}}>−{fmt(p.platform_fee)}</td>
                        <td><span className="net-amount" style={{fontSize:15}}>{fmt(p.net_amount)}</span></td>
                        <td style={{fontSize:12,color:"#64748B"}}>{fmtDate(p.paid_at)}</td>
                        <td><span className={`badge b-${p.status}`}>{p.status==="paid"?"Payé":p.status==="refunded"?"Remboursé":"En attente"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPay.length > PREVIEW_ROWS && (
                <div className="pw-table-footer">
                  <span className="pw-footer-count">
                    {showAllPay ? filteredPay.length : Math.min(PREVIEW_ROWS, filteredPay.length)} / {filteredPay.length} paiements
                  </span>
                  <button className="pw-voir-tout" onClick={() => setShowAllPay(!showAllPay)}>
                    <Eye size={13} />
                    {showAllPay ? "Réduire" : `Voir tout (${filteredPay.length})`}
                    {showAllPay ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ CAPACITE ══ */}
        {tab === "capacite" && (
          <>
            <div className="pw-metrics" style={{ marginBottom:18 }}>
              {[
                { icon: <CalendarDays size={16} color="#2B96A8" />, bg: "#EFF9FB", num: capStats.totalSlots,  lbl: "Créneaux actifs",    cls: "" },
                { icon: <Users        size={16} color="#059669" />, bg: "#ECFDF5", num: capStats.totalBooked, lbl: "Personnes réservées", cls: "" },
                { icon: <AlertCircle  size={16} color="#B91C1C" />, bg: "#FEF2F2", num: capStats.fullSlots,   lbl: "Créneaux complets",   cls: "" },
              ].map(({ icon, bg, num, lbl, cls }) => (
                <div key={lbl} className={`pw-metric ${cls}`}>
                  <div className="pw-metric-top">
                    <div className="pw-metric-icon" style={{ background: bg }}>{icon}</div>
                  </div>
                  <p className="pw-metric-num">{num}</p>
                  <p className="pw-metric-lbl">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="pw-info">
              <Users size={14} color="#2B96A8" className="pw-info-icon" />
              <span>
                Capacité calculée <strong>par créneau (date + heure)</strong>.
                Les réservations annulées et les pending expirés sont exclus.
              </span>
            </div>

            <div className="pw-toolbar">
              <div className="pw-search">
                <Search size={13} color="#CBD5E1" />
                <input placeholder="Excursion ou ville…" value={capSearch} onChange={(e) => setCapSearch(e.target.value)} />
              </div>
              <button className="pw-export" onClick={() => exportCSV("capacite")}>
                <Download size={13} /> Exporter CSV
              </button>
            </div>

            <div className="pw-table-card">
              <div className="pw-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Excursion</th>
                      <th>Ville</th>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Réservées</th>
                      <th>Max</th>
                      <th>Disponibles</th>
                      <th>Remplissage</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedCapRows.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="empty-state">
                            <div className="empty-icon"><BarChart2 size={20} color="#CBD5E1" /></div>
                            <div className="empty-title">Aucune donnée de capacité</div>
                            <div className="empty-sub">Aucun créneau actif trouvé</div>
                          </div>
                        </td>
                      </tr>
                    ) : visibleCapGroups.map((group) => (
                      <>
                        <tr key={`grp-${group.excursionId}`} className="group-header">
                          <td colSpan={9}>
                            {group.excursionTitle}
                            <span style={{ fontWeight:400, color:"#64748B", marginLeft:10, fontSize:11 }}>
                              <MapPin size={10} style={{ verticalAlign:"middle" }} /> {group.excursionCity}
                              &nbsp;·&nbsp;max {group.maxPeople} pers. / créneau
                              &nbsp;·&nbsp;{group.slots.length} créneau{group.slots.length>1?"x":""}
                            </span>
                          </td>
                        </tr>
                        {group.slots.map((slot) => {
                          const avail    = slot.maxPeople - slot.booked;
                          const pct      = Math.min(100, Math.round((slot.booked / slot.maxPeople) * 100));
                          const over     = slot.booked > slot.maxPeople;
                          const isFull   = avail <= 0;
                          const isLow    = !isFull && avail <= Math.ceil(slot.maxPeople * 0.2);
                          const barColor = over ? "#DC2626" : pct > 80 ? "#D97706" : "#2B96A8";
                          const statusLabel = over ? "Dépassé ⚠" : isFull ? "Complet" : isLow ? "Quasi-plein" : "Disponible";
                          const statusCls   = over || isFull ? "b-full" : isLow ? "b-low" : "b-available";
                          return (
                            <tr key={`${group.excursionId}-${slot.date}-${slot.time}`}>
                              <td style={{ color:"#94A3B8", paddingLeft:28 }} />
                              <td style={{ color:"#94A3B8" }}>
                                <span style={{ display:"flex",alignItems:"center",gap:4 }}>
                                  <MapPin size={11} color="#CBD5E1" />{group.excursionCity}
                                </span>
                              </td>
                              <td><span className="chip-date"><CalendarDays size={10} />{fmtDateShort(slot.date)}</span></td>
                              <td><span className="chip-time"><Clock size={10} />{slot.time}</span></td>
                              <td style={{ textAlign:"center", fontWeight:700, color:over?"#B91C1C":"#053366" }}>
                                {slot.booked}{over && <span style={{ fontSize:11,color:"#B91C1C",marginLeft:4 }}>⚠</span>}
                              </td>
                              <td style={{ textAlign:"center", color:"#94A3B8" }}>{slot.maxPeople}</td>
                              <td style={{ textAlign:"center" }}>
                                <span className={over||isFull?"cap-over":isLow?"cap-low":"cap-ok"}>{Math.max(0,avail)}</span>
                              </td>
                              <td>
                                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                                  <div className="prog-bar">
                                    <div className="prog-fill" style={{ width:`${pct}%`,background:barColor }} />
                                  </div>
                                  <span style={{ fontSize:12,color:"#94A3B8",minWidth:34 }}>{pct}%</span>
                                </div>
                              </td>
                              <td><span className={`badge ${statusCls}`}>{statusLabel}</span></td>
                            </tr>
                          );
                        })}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              {flatCapRows.length > PREVIEW_ROWS && (
                <div className="pw-table-footer">
                  <span className="pw-footer-count">
                    {showAllCap ? flatCapRows.length : Math.min(PREVIEW_ROWS, flatCapRows.length)} / {flatCapRows.length} créneaux
                  </span>
                  <button className="pw-voir-tout" onClick={() => setShowAllCap(!showAllCap)}>
                    <Eye size={13} />
                    {showAllCap ? "Réduire" : `Voir tout (${flatCapRows.length})`}
                    {showAllCap ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </>
  );
}