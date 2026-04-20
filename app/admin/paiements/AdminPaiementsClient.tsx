"use client";

// app/admin/paiements/AdminPaiementsClient.tsx

import { useState, useMemo } from "react";
import { TrendingUp, Coins, ArrowUpRight, BarChart3 } from "lucide-react";
import StatCard   from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import { Toast, StatusBadge } from "../../components/ui/index";
import { useToast }          from "../../../lib/useToast";
import { useListFiltering }  from "../../../lib/useListFiltering";
import {
  RevenueChart, StatusPills, PaymentsToolbar, PaymentRow,
} from "../../components/admin/PaymentsUI";
import {
  Paiement, PaiementStatus, PAIEMENT_STATUS, fmtMonth, exportCSV,
} from "../../../lib/paiement";

// ─── Types locaux ─────────────────────────────────────────────────────
interface Profile {
  user_id: string;
  full_name: string | null;
  agency_name?: string | null;
}
interface Excursion {
  id: string;
  title: string;
  city: string;
}
interface Props {
  paiements:    Paiement[];
  prestataires: Profile[];
  reservations: Record<string, unknown>[];
  excursions:   Excursion[];
  touristes:    Profile[];
}

// ─── CSS global page ──────────────────────────────────────────────────
const PAGE_CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
  .admin-page { max-width:1200px; margin:0 auto; padding:32px 24px; }
  .ap-card    { background:white; border-radius:20px; border:1px solid #E5E7EB; padding:24px; margin-bottom:20px; animation:fadeUp .35s ease both; box-shadow:0 2px 12px rgba(0,0,0,.04); }
  .ap-kpis    { display:flex; gap:16px; flex-wrap:wrap; }
  .ap-btn     { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border:1.5px solid #E5E7EB; border-radius:10px; background:white; color:#374151; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
  .ap-btn:hover  { border-color:#02AFCF; color:#02AFCF; background:#EFF9FB; }
  .ap-btn.active { border-color:#02AFCF; color:#02AFCF; background:#EFF9FB; }
  .admin-row-count   { font-size:13px; color:#9CA3AF; margin-bottom:12px; font-weight:500; }
  .admin-cta-button  { padding:11px 22px; background:#02AFCF; color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
`;

// ═══════════════════════════════════════════════════════════════════════
export default function AdminPaiementsClient({
  paiements, prestataires, reservations, excursions, touristes,
}: Props) {
  const [sortBy,     setSortBy]     = useState<"date" | "amount">("date");
  const [showChart,  setShowChart]  = useState(false);
  const { toast, showToast } = useToast();

  // ── Maps lookup ───────────────────────────────────────────────────
  const prestMap = useMemo(
    () => Object.fromEntries(prestataires.map(p => [p.user_id, p])),
    [prestataires],
  );
  const resaMap = useMemo(
    () => Object.fromEntries(reservations.map(r => [String(r.id), r])),
    [reservations],
  );
  const excMap = useMemo(
    () => Object.fromEntries(excursions.map(e => [e.id, e])),
    [excursions],
  );
  const touristeMap = useMemo(
    () => Object.fromEntries(touristes.map(t => [t.user_id, t])),
    [touristes],
  );

  // ── Filtrage ──────────────────────────────────────────────────────
  const {
    search, setSearch,
    filter: statusFilter, setFilter: setStatusFilter,
    filtered: filteredPayments,
  } = useListFiltering<Paiement>({
    data: paiements,
    filterFn: (p, f) => f === "all" || p.status === f,
    searchFn: (p, q) => {
      const resa  = resaMap[p.reservation_id] || {};
      const exc   = excMap[String(resa.excursion_id)] || ({} as Excursion);
      const prest = prestMap[p.prestataire_id] || { agency_name: "", full_name: "" };
      return [exc.title, exc.city, prest.agency_name || prest.full_name, resa.booking_code]
        .some(v => String(v || "").toLowerCase().includes(q));
    },
  });

  // ── Tri ───────────────────────────────────────────────────────────
  const sortedPayments = useMemo(
    () => [...filteredPayments].sort((a, b) =>
      sortBy === "amount"
        ? Number(b.amount)     - Number(a.amount)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [filteredPayments, sortBy],
  );

  // ── KPIs ──────────────────────────────────────────────────────────
  const totalVolume = useMemo(
    () => paiements.reduce((s, p) => s + Number(p.amount), 0),
    [paiements],
  );
  const totalFees = useMemo(
    () => paiements.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.platform_fee), 0),
    [paiements],
  );
  const totalNet = useMemo(
    () => paiements.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0),
    [paiements],
  );

  // ── Graphique ─────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const byMonth: Record<string, { amount: number; fees: number }> = {};
    for (const p of paiements) {
      const key = fmtMonth(p.created_at);
      if (!byMonth[key]) byMonth[key] = { amount: 0, fees: 0 };
      byMonth[key].amount += Number(p.amount);
      byMonth[key].fees   += Number(p.platform_fee);
    }
    return Object.entries(byMonth).slice(-6).map(([month, v]) => ({ month, ...v }));
  }, [paiements]);

  // ── Compteurs par statut ──────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: paiements.length };
    paiements.forEach(p => { c[p.status] = (c[p.status] ?? 0) + 1; });
    return c;
  }, [paiements]);

  // ── Export CSV ────────────────────────────────────────────────────
  function handleExport() {
    const rows = sortedPayments.map(p => {
      const resa  = resaMap[p.reservation_id]      || {};
      const exc   = excMap[String(resa.excursion_id)] || ({} as Excursion);
      const prest = prestMap[p.prestataire_id]      || {} as Profile;
      const tour  = touristeMap[String(resa.touriste_id)] || {} as Profile;
      return {
        Date:             p.created_at,
        Excursion:        exc.title  || "—",
        Ville:            exc.city   || "—",
        Prestataire:      (prest as Profile).agency_name || (prest as Profile).full_name || "—",
        Touriste:         (tour  as Profile).full_name || "—",
        Code:             String(resa.booking_code || "—"),
        "Montant TND":    Number(p.amount),
        "Commission TND": Number(p.platform_fee),
        "Net TND":        Number(p.net_amount),
        Statut:           PAIEMENT_STATUS[p.status as PaiementStatus]?.label ?? p.status,
      };
    });
    exportCSV(rows, `paiements_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`${rows.length} paiement(s) exporté(s)`);
  }

  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="admin-page">
      <style>{PAGE_CSS}</style>
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div className="ap-card" style={{ marginBottom: 24 }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,#02AFCF,#053366)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(2,175,207,.35)",
            }}>
              <Coins size={22} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#053366", margin: 0, lineHeight: 1.2 }}>
                Paiements & Finances
              </h1>
              <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
                {paiements.length} transaction{paiements.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={`ap-btn ${showChart ? "active" : ""}`}
              onClick={() => setShowChart(v => !v)}
              type="button"
            >
              <BarChart3 size={14} /> Graphique
            </button>
            <button
              className="ap-btn active"
              onClick={handleExport}
              type="button"
            >
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="ap-kpis ap-card" style={{ animationDelay: ".07s" }}>
        <StatCard
          label="Volume total"
          value={totalVolume}
          suffix="TND"
          icon={<TrendingUp size={22} />}
          color="#02AFCF"
          bg="rgba(2,175,207,.1)"
          border="rgba(2,175,207,.2)"
          delay={0}
        />
        <StatCard
          label="Commission encaissée"
          value={totalFees}
          suffix="TND"
          icon={<Coins size={22} />}
          color="#259FFC"
          bg="rgba(37,159,252,.1)"
          border="rgba(37,159,252,.2)"
          delay={0.07}
        />
        <StatCard
          label="Versé aux prestataires"
          value={totalNet}
          suffix="TND"
          icon={<ArrowUpRight size={22} />}
          color="#053366"
          bg="rgba(5,51,102,.08)"
          border="rgba(5,51,102,.15)"
          delay={0.14}
        />
      </div>

      {/* ── Status Pills ── */}
      <StatusPills paiements={paiements} />

      {/* ── Graphique (toggle) ── */}
      {showChart && chartData.length > 0 && (
        <div className="ap-card" style={{ animationDelay: ".18s" }}>
          <RevenueChart data={chartData} />
        </div>
      )}

      {/* ── Barre de filtres ── */}
      <PaymentsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        counts={counts}
      />

      <p className="admin-row-count">
        {sortedPayments.length} résultat{sortedPayments.length !== 1 ? "s" : ""}
      </p>

      {/* ── Liste ── */}
      {sortedPayments.length === 0 ? (
        <EmptyState
          icon={<Coins size={28} color="#02AFCF" strokeWidth={1.5} />}
          title="Aucun paiement trouvé"
          subtitle="Essayez d'autres filtres ou termes de recherche"
          action={
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="admin-cta-button"
              type="button"
            >
              Réinitialiser les filtres
            </button>
          }
        />
      ) : (
        <div>
          {sortedPayments.map((payment, index) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              index={index}
              resaMap={resaMap}
              excMap={excMap}
              prestMap={prestMap}
              touristeMap={touristeMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
