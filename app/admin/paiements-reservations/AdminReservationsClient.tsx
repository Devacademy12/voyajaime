"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Users, CreditCard, TrendingUp, Download,
  Search, Filter, CheckCircle2, AlertCircle, XCircle, Clock,
  RefreshCcw, Building2,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface TouristeProfile { full_name: string | null; phone: string | null; user_id?: string; }
interface ExcursionInfo   { id: string; title: string; city: string; price_per_person: number; max_people: number; prestataire_id?: string; }
interface Reservation {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
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
    id: string; booking_code: string; date: string; people_count: number; total_price: number;
    touriste: TouristeProfile | null;
    excursion: { title: string; city: string } | null;
  } | null;
  prestataire: { full_name: string | null; agency_name: string | null } | null;
}
interface ExcursionCap {
  id: string; title: string; city: string; max_people: number;
  price_per_person: number; is_active: boolean;
}

interface Props {
  reservations: Reservation[];
  paiements: Paiement[];
  excursions: ExcursionCap[];
  capacite: Record<string, number>;
}

/* ─── CSS ───────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .admin-wrap {
    font-family: 'DM Sans', system-ui, sans-serif;
    width: 100%; box-sizing: border-box;
    background: #F8FAFC; min-height: 100vh;
    padding: 32px 48px 64px;
  }
  .admin-tabs {
    display: flex; gap: 4px;
    border-bottom: 1.5px solid #E2E8F0;
    margin-bottom: 28px;
  }
  .admin-tab {
    padding: 10px 20px; border: none; background: none;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    color: #9CA3AF; cursor: pointer;
    border-bottom: 2px solid transparent; margin-bottom: -1.5px;
    display: flex; align-items: center; gap: 6px; transition: all .15s;
  }
  .admin-tab.active { color: #053366; border-bottom-color: #2B96A8; }
  .admin-tab:hover:not(.active) { color: #053366; }

  .metrics-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 14px; margin-bottom: 24px;
  }
  .metric-card {
    background: #FFFFFF; border-radius: 16px;
    border: 1.5px solid #E2E8F0; padding: 16px 20px;
    animation: fadeUp .4s ease both;
  }
  .metric-icon {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px;
  }
  .metric-num  { font-size: 24px; font-weight: 800; color: #053366; margin: 0; line-height: 1; }
  .metric-lbl  { font-size: 11px; color: #9CA3AF; margin: 4px 0 0; font-weight: 600; }

  .toolbar {
    display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
  }
  .search-box {
    display: flex; align-items: center; gap: 8px;
    background: #FFFFFF; border: 1.5px solid #E2E8F0;
    border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 200px; max-width: 340px;
  }
  .search-box input {
    border: none; outline: none; background: transparent;
    font-size: 13px; font-family: 'DM Sans', sans-serif; color: #053366; width: 100%;
  }
  .filter-select {
    padding: 9px 14px; border-radius: 10px; border: 1.5px solid #E2E8F0;
    background: #FFFFFF; font-size: 13px; font-family: 'DM Sans', sans-serif;
    color: #053366; cursor: pointer; outline: none;
  }
  .export-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 10px;
    border: 1.5px solid rgba(43,150,168,.25);
    background: #EFF9FB; color: #2B96A8;
    font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; margin-left: auto; transition: all .15s;
  }
  .export-btn:hover { background: rgba(43,150,168,.12); }

  .table-wrap {
    background: #FFFFFF; border-radius: 16px; border: 1.5px solid #E2E8F0; overflow: hidden;
    overflow-x: auto;
  }
  table { width: 100%; border-collapse: collapse; min-width: 750px; }
  thead th {
    padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700;
    color: #9CA3AF; background: #F8FAFC; border-bottom: 1.5px solid #E2E8F0;
    letter-spacing: .06em; text-transform: uppercase; white-space: nowrap;
  }
  tbody td {
    padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9;
    color: #2D3748; vertical-align: middle; white-space: nowrap; max-width: 180px;
    overflow: hidden; text-overflow: ellipsis;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #F8FAFC; }

  .badge {
    display: inline-block; font-size: 11px; font-weight: 700;
    padding: 3px 9px; border-radius: 20px;
  }
  .b-confirmed  { background: #EAF3DE; color: #3B6D11; }
  .b-pending    { background: #FFFBEB; color: #D97706; }
  .b-completed  { background: #EFF9FB; color: #0F6E56; }
  .b-cancelled  { background: #FCEBEB; color: #A32D2D; }
  .b-paid       { background: #E1F5EE; color: #0F6E56; }
  .b-unpaid     { background: #FFFBEB; color: #D97706; }
  .b-expired    { background: #FCEBEB; color: #A32D2D; }
  .b-refunded   { background: #EFF9FB; color: #185FA5; }

  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: #E6F1FB; color: #185FA5;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; margin-right: 8px; flex-shrink: 0;
  }
  .tourist-cell { display: flex; align-items: center; }

  .progress-bar {
    height: 6px; border-radius: 3px; background: #E2E8F0; width: 120px; overflow: hidden;
  }
  .progress-fill { height: 100%; border-radius: 3px; }
  .cap-over  { color: #A32D2D; font-weight: 700; }
  .cap-low   { color: #D97706; }
  .cap-ok    { color: #0F6E56; }

  .info-box {
    background: #EFF9FB; border: 1.5px solid rgba(43,150,168,.2);
    border-radius: 12px; padding: 12px 18px; font-size: 13px;
    color: #053366; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
  }

  @media (max-width: 900px) { .admin-wrap { padding: 20px 20px 48px; } }
  @media (max-width: 640px) {
    .admin-wrap { padding: 14px 12px 40px; }
    .metrics-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .export-btn  { margin-left: 0; width: 100%; justify-content: center; }
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

type Tab = "reservations" | "paiements" | "capacite";

/* ─── Component ─────────────────────────────────────────────── */
export default function AdminReservationsClient({ reservations, paiements, excursions, capacite }: Props) {
  const [tab, setTab] = useState<Tab>("reservations");
  const [resaSearch, setResaSearch] = useState("");
  const [resaStatus, setResaStatus] = useState("");
  const [paySearch,  setPaySearch]  = useState("");
  const [payStatus,  setPayStatus]  = useState("");

  /* ── Filtered reservations ── */
  const filteredResa = useMemo(() => {
    return reservations.filter((r) => {
      const q = resaSearch.toLowerCase();
      const name = r.touriste?.full_name?.toLowerCase() || "";
      const exc  = r.excursion?.title?.toLowerCase() || "";
      const code = r.booking_code.toLowerCase();
      const matchQ  = !q || name.includes(q) || exc.includes(q) || code.includes(q);
      const matchSt = !resaStatus || r.status === resaStatus;
      return matchQ && matchSt;
    });
  }, [reservations, resaSearch, resaStatus]);

  /* ── Filtered paiements ── */
  const filteredPay = useMemo(() => {
    return paiements.filter((p) => {
      const q    = paySearch.toLowerCase();
      const name = p.reservation?.touriste?.full_name?.toLowerCase() || "";
      const exc  = p.reservation?.excursion?.title?.toLowerCase() || "";
      const matchQ  = !q || name.includes(q) || exc.includes(q);
      const matchSt = !payStatus || p.status === payStatus;
      return matchQ && matchSt;
    });
  }, [paiements, paySearch, payStatus]);

  /* ── Reservation stats ── */
  const resaStats = useMemo(() => ({
    total:     reservations.length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    pending:   reservations.filter((r) => r.status === "pending").length,
    revenue:   reservations.filter((r) => r.payment_status === "paid").reduce((a, b) => a + b.total_price, 0),
  }), [reservations]);

  /* ── Payment stats ── */
  const payStats = useMemo(() => {
    const paid = paiements.filter((p) => p.status === "paid");
    const total = paid.reduce((a, b) => a + b.amount, 0);
    return {
      total,
      pander:    total * 0.10,
      prestataire: total * 0.90,
      count:     paid.length,
    };
  }, [paiements]);

  /* ── CSV export ── */
  function exportCSV(type: "reservations" | "paiements") {
    let headers: string[];
    let rows: (string | number | null)[][];

    if (type === "reservations") {
      headers = ["Code", "Touriste", "Téléphone", "Excursion", "Ville", "Date", "Heure", "Personnes", "Prix total", "Commission", "Statut", "Paiement", "Créé le"];
      rows = filteredResa.map((r) => [
        r.booking_code,
        r.touriste?.full_name || "—",
        r.touriste?.phone || "—",
        r.excursion?.title || "—",
        r.excursion?.city || "—",
        r.date, r.time, r.people_count,
        r.total_price, r.platform_fee,
        r.status, r.payment_status || "—",
        fmtDate(r.created_at),
      ]);
    } else {
      headers = ["Touriste", "Téléphone", "Excursion", "Ville", "Date excursion", "Personnes", "Total", "Part Pander (10%)", "Part Prestataire (90%)", "Prestataire", "Payé le", "Statut"];
      rows = filteredPay.map((p) => [
        p.reservation?.touriste?.full_name || "—",
        p.reservation?.touriste?.phone || "—",
        p.reservation?.excursion?.title || "—",
        p.reservation?.excursion?.city || "—",
        p.reservation?.date || "—",
        p.reservation?.people_count || 0,
        p.amount,
        (p.amount * 0.10).toFixed(2),
        (p.amount * 0.90).toFixed(2),
        p.prestataire?.agency_name || p.prestataire?.full_name || "—",
        fmtDate(p.paid_at),
        p.status,
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
      <div className="admin-wrap">
        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#2B96A8", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
            Administration
          </p>
          <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, color: "#053366", margin: "0 0 6px" }}>
            Réservations & Paiements
          </h1>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Supervision complète des réservations et flux financiers
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="admin-tabs">
          {([
            { id: "reservations", label: "Réservations", icon: <CalendarDays size={14} /> },
            { id: "paiements",    label: "Paiements",    icon: <CreditCard size={14} /> },
            { id: "capacite",     label: "Capacité",     icon: <Users size={14} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(({ id, label, icon }) => (
            <button
              key={id}
              className={`admin-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ══ RESERVATIONS TAB ══ */}
        {tab === "reservations" && (
          <>
            <div className="metrics-row">
              {[
                { icon: <CalendarDays size={16} color="#2B96A8" />, bg: "#EFF9FB", num: resaStats.total,     lbl: "Total",       numColor: "#053366" },
                { icon: <CheckCircle2 size={16} color="#0F6E56" />, bg: "#E1F5EE", num: resaStats.confirmed, lbl: "Confirmées",  numColor: "#0F6E56" },
                { icon: <Clock        size={16} color="#D97706" />, bg: "#FFFBEB", num: resaStats.pending,   lbl: "En attente",  numColor: "#D97706" },
                { icon: <TrendingUp   size={16} color="#2B96A8" />, bg: "#EFF9FB", num: fmt(resaStats.revenue), lbl: "Revenus perçus", numColor: "#2B96A8" },
              ].map(({ icon, bg, num, lbl, numColor }) => (
                <div key={lbl} className="metric-card">
                  <div className="metric-icon" style={{ background: bg }}>{icon}</div>
                  <p className="metric-num" style={{ color: numColor }}>{num}</p>
                  <p className="metric-lbl">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="toolbar">
              <div className="search-box">
                <Search size={13} color="#9CA3AF" />
                <input
                  placeholder="Rechercher touriste, excursion, code…"
                  value={resaSearch}
                  onChange={(e) => setResaSearch(e.target.value)}
                />
              </div>
              <select className="filter-select" value={resaStatus} onChange={(e) => setResaStatus(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <button className="export-btn" onClick={() => exportCSV("reservations")}>
                <Download size={13} /> Exporter CSV
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Touriste</th>
                    <th>Téléphone</th>
                    <th>Excursion</th>
                    <th>Ville</th>
                    <th>Date</th>
                    <th>Pers.</th>
                    <th>Prix total</th>
                    <th>Commission</th>
                    <th>Statut</th>
                    <th>Paiement</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResa.length === 0 ? (
                    <tr><td colSpan={11} style={{ textAlign: "center", padding: "3rem", color: "#9CA3AF" }}>
                      Aucune réservation trouvée
                    </td></tr>
                  ) : filteredResa.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="tourist-cell">
                          <span className="avatar">{initials(r.touriste?.full_name ?? null)}</span>
                          <span>{r.touriste?.full_name || "—"}</span>
                        </div>
                      </td>
                      <td style={{ color: "#9CA3AF" }}>{r.touriste?.phone || "—"}</td>
                      <td title={r.excursion?.title}>{r.excursion?.title || "—"}</td>
                      <td>{r.excursion?.city || "—"}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td style={{ textAlign: "center" }}>{r.people_count}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(r.total_price)}</td>
                      <td style={{ color: "#2B96A8" }}>{fmt(r.platform_fee)}</td>
                      <td>
                        <span className={`badge b-${r.status}`}>
                          {r.status === "confirmed" ? "Confirmé" : r.status === "pending" ? "En attente" : r.status === "completed" ? "Terminé" : "Annulé"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge b-${r.payment_status || "unpaid"}`}>
                          {r.payment_status === "paid" ? "Payé" : r.payment_status === "expired" ? "Expiré" : "Non payé"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "#2B96A8" }}>{r.booking_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ PAIEMENTS TAB ══ */}
        {tab === "paiements" && (
          <>
            <div className="metrics-row">
              {[
                { icon: <TrendingUp   size={16} color="#2B96A8" />, bg: "#EFF9FB", num: fmt(payStats.total),       lbl: "Revenu total",       numColor: "#053366" },
                { icon: <CreditCard   size={16} color="#D97706" />, bg: "#FFFBEB", num: fmt(payStats.pander),      lbl: "Part Pander (10%)",  numColor: "#D97706" },
                { icon: <Building2    size={16} color="#0F6E56" />, bg: "#E1F5EE", num: fmt(payStats.prestataire), lbl: "Prestataires (90%)", numColor: "#0F6E56" },
                { icon: <CheckCircle2 size={16} color="#2B96A8" />, bg: "#EFF9FB", num: payStats.count,            lbl: "Paiements reçus",    numColor: "#2B96A8" },
              ].map(({ icon, bg, num, lbl, numColor }) => (
                <div key={lbl} className="metric-card">
                  <div className="metric-icon" style={{ background: bg }}>{icon}</div>
                  <p className="metric-num" style={{ color: numColor }}>{num}</p>
                  <p className="metric-lbl">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="info-box">
              <CreditCard size={16} color="#2B96A8" />
              <span>
                Répartition automatique : <strong>Pander garde 10%</strong> de chaque paiement — le <strong>prestataire reçoit 90%</strong>.
              </span>
            </div>

            <div className="toolbar">
              <div className="search-box">
                <Search size={13} color="#9CA3AF" />
                <input
                  placeholder="Rechercher touriste ou excursion…"
                  value={paySearch}
                  onChange={(e) => setPaySearch(e.target.value)}
                />
              </div>
              <select className="filter-select" value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
                <option value="">Tous</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="refunded">Remboursé</option>
              </select>
              <button className="export-btn" onClick={() => exportCSV("paiements")}>
                <Download size={13} /> Exporter CSV
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Touriste</th>
                    <th>Téléphone</th>
                    <th>Excursion</th>
                    <th>Ville</th>
                    <th>Date excursion</th>
                    <th>Total</th>
                    <th>Pander 10%</th>
                    <th>Prestataire 90%</th>
                    <th>Prestataire</th>
                    <th>Payé le</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPay.length === 0 ? (
                    <tr><td colSpan={11} style={{ textAlign: "center", padding: "3rem", color: "#9CA3AF" }}>
                      Aucun paiement trouvé
                    </td></tr>
                  ) : filteredPay.map((p) => {
                    const total = p.amount;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="tourist-cell">
                            <span className="avatar">{initials(p.reservation?.touriste?.full_name ?? null)}</span>
                            <span>{p.reservation?.touriste?.full_name || "—"}</span>
                          </div>
                        </td>
                        <td style={{ color: "#9CA3AF" }}>{p.reservation?.touriste?.phone || "—"}</td>
                        <td title={p.reservation?.excursion?.title}>{p.reservation?.excursion?.title || "—"}</td>
                        <td>{p.reservation?.excursion?.city || "—"}</td>
                        <td>{fmtDate(p.reservation?.date ?? null)}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(total)}</td>
                        <td style={{ color: "#D97706", fontWeight: 600 }}>{fmt(total * 0.10)}</td>
                        <td style={{ color: "#0F6E56", fontWeight: 600 }}>{fmt(total * 0.90)}</td>
                        <td style={{ color: "#9CA3AF", fontSize: 12 }}>
                          {p.prestataire?.agency_name || p.prestataire?.full_name || "—"}
                        </td>
                        <td style={{ fontSize: 12 }}>{fmtDate(p.paid_at)}</td>
                        <td>
                          <span className={`badge b-${p.status}`}>
                            {p.status === "paid" ? "Payé" : p.status === "refunded" ? "Remboursé" : "En attente"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ CAPACITE TAB ══ */}
        {tab === "capacite" && (
          <>
            <div className="info-box" style={{ marginBottom: 20 }}>
              <Users size={16} color="#2B96A8" />
              <span>
                Les réservations sont bloquées automatiquement quand la capacité max est atteinte.
                Les lignes en rouge indiquent un dépassement à corriger.
              </span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Excursion</th>
                    <th>Ville</th>
                    <th>Prix / pers.</th>
                    <th>Max places</th>
                    <th>Réservées</th>
                    <th>Disponibles</th>
                    <th>Remplissage</th>
                  </tr>
                </thead>
                <tbody>
                  {excursions.map((exc) => {
                    const booked = capacite[exc.id] || 0;
                    const avail  = exc.max_people - booked;
                    const pct    = Math.min(100, Math.round((booked / exc.max_people) * 100));
                    const over   = booked > exc.max_people;
                    const barColor = over ? "#E24B4A" : pct > 80 ? "#EF9F27" : "#1D9E75";

                    return (
                      <tr key={exc.id}>
                        <td style={{ fontWeight: 600 }} title={exc.title}>{exc.title}</td>
                        <td>{exc.city}</td>
                        <td>{fmt(exc.price_per_person)}</td>
                        <td style={{ textAlign: "center" }}>{exc.max_people}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={over ? "cap-over" : ""}>{booked}</span>
                          {over && <span style={{ fontSize: 11, color: "#A32D2D", marginLeft: 4 }}>⚠ dépassé</span>}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={avail <= 0 ? "cap-over" : avail <= 2 ? "cap-low" : "cap-ok"}>
                            {Math.max(0, avail)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#9CA3AF", minWidth: 30 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {excursions.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#9CA3AF" }}>
                      Aucune excursion active
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}