"use client";

// app/admin/reservations/AdminReservationsClient.tsx

import { useState, useMemo } from "react";
import { CalendarDays, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";
import { RESERVATION_STATUS, ReservationStatus } from "../../../lib/statusConfig";
import {
  StatCard, SearchBar, CityFilter, FilterTabs,
  EmptyReservations, ReservationRow,
} from "../../components/admin/ReservationsUI";

// ─── Types ────────────────────────────────────────────────────────────
interface ResRow {
  id:           string;
  booking_code: string;
  date:         string;
  time:         string;
  people_count: number;
  total_price:  number;
  platform_fee: number;
  status:       string;
  touriste_name:string;
  excursion:    { title?: string; city?: string } | null;
}

type FilterKey = ReservationStatus | "all";

// ─── CSS ──────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
`;

// ─── Onglets de filtre ────────────────────────────────────────────────
const TABS: { key: FilterKey; label: string; Icon: React.ElementType }[] = [
  { key: "all",       label: "Toutes",     Icon: Users      },
  { key: "pending",   label: "En attente", Icon: RESERVATION_STATUS.pending.icon!   },
  { key: "confirmed", label: "Confirmées", Icon: RESERVATION_STATUS.confirmed.icon! },
  { key: "completed", label: "Terminées",  Icon: RESERVATION_STATUS.completed.icon! },
  { key: "cancelled", label: "Annulées",   Icon: RESERVATION_STATUS.cancelled.icon! },
];

// ═══════════════════════════════════════════════════════════════════════
export default function AdminReservationsClient({
  reservations = [],
  error,
}: {
  reservations: ResRow[];
  error?: string | null;
}) {
  const [filter,     setFilter]     = useState<FilterKey>("all");
  const [search,     setSearch]     = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [cityOpen,   setCityOpen]   = useState(false);

  // ── Liste des villes disponibles ─────────────────────────────────
  const cities = useMemo(() => {
    const set = new Set(
      reservations.map(r => r.excursion?.city).filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [reservations]);

  // ── Compteurs par statut ─────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    reservations.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [reservations]);

  // ── Liste filtrée ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = reservations;
    if (filter !== "all")     list = list.filter(r => r.status === filter);
    if (cityFilter !== "all") list = list.filter(r => r.excursion?.city === cityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.booking_code.toLowerCase().includes(q) ||
        r.touriste_name.toLowerCase().includes(q) ||
        (r.excursion?.title ?? "").toLowerCase().includes(q) ||
        (r.excursion?.city  ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [reservations, filter, cityFilter, search]);

  // ── KPIs ─────────────────────────────────────────────────────────
  const revenue   = Math.round(reservations.reduce((s, r) => s + r.total_price, 0));
  const pending   = counts.pending   ?? 0;
  const confirmed = counts.confirmed ?? 0;
  const cancelled = counts.cancelled ?? 0;

  // ═══════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <style>{PAGE_CSS}</style>

      {/* ── Header ── */}
      <div style={{
        background: "white", borderRadius: 20, border: "1px solid #E5E7EB",
        padding: "22px 26px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,.04)",
        animation: "fadeUp .3s ease both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg,#2B96A8,#0e7490)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(43,150,168,.35)",
          }}>
            <CalendarDays size={22} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.2 }}>
              Gestion des réservations
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
              {pending} en attente · {confirmed} confirmées · {reservations.length} total
            </p>
          </div>
        </div>

        {/* Résumé rapide */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {cancelled > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 700, color: "#991B1B",
              background: "#FEE2E2", border: "1px solid #FCA5A5",
              borderRadius: 99, padding: "4px 12px",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
              {cancelled} annulée{cancelled > 1 ? "s" : ""}
            </span>
          )}
          <span style={{
            fontSize: 12, fontWeight: 700, color: "#065F46",
            background: "#D1FAE5", border: "1px solid #6EE7B7",
            borderRadius: 99, padding: "4px 12px",
          }}>
            {revenue.toLocaleString("fr-FR")} TND de CA
          </span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14, marginBottom: 24,
      }}>
        <StatCard label="Total"            value={String(reservations.length)} color="#2B96A8" bg="#EFF9FB"  border="#BAE6FD" Icon={CalendarDays} />
        <StatCard label="En attente"       value={String(pending)}             color="#D97706" bg="#FFFBEB"  border="#FDE68A" Icon={Clock}        />
        <StatCard label="Confirmées"       value={String(confirmed)}           color="#059669" bg="#ECFDF5"  border="#6EE7B7" Icon={CheckCircle}  />
        <StatCard label="Chiffre d'affaires" value={`${revenue.toLocaleString("fr-FR")} TND`} color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" Icon={TrendingUp} />
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FCA5A5",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          fontSize: 13, color: "#DC2626", fontWeight: 600,
        }}>
          ⚠️ Erreur : {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #E5E7EB",
        padding: "14px 18px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        boxShadow: "0 1px 6px rgba(0,0,0,.04)",
        animation: "fadeUp .35s ease both",
        animationDelay: ".1s",
      }}>
        <SearchBar value={search} onChange={setSearch} />
        <CityFilter
          cities={cities}
          value={cityFilter}
          onChange={setCityFilter}
          isOpen={cityOpen}
          onToggle={() => setCityOpen(o => !o)}
        />
        <FilterTabs
          tabs={TABS}
          active={filter}
          counts={counts}
          totalCount={reservations.length}
          onSelect={key => setFilter(key as FilterKey)}
        />
      </div>

      {/* Compteur résultats */}
      <p style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500, marginBottom: 12 }}>
        {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        {(filter !== "all" || search || cityFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setFilter("all"); setCityFilter("all"); }}
            style={{
              marginLeft: 10, fontSize: 12, color: "#2B96A8", background: "none",
              border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            Réinitialiser
          </button>
        )}
      </p>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <EmptyReservations
          filter={filter}
          search={search}
          onReset={() => { setSearch(""); setFilter("all"); setCityFilter("all"); }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(r => (
            <ReservationRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
