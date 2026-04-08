"use client";

import { useState, useMemo } from "react";
import { CalendarDays, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui";
import { RESERVATION_STATUS, ReservationStatus } from "../../../lib/statusConfig";
import { StatCard, SearchBar, CityFilter, FilterTabs, EmptyReservations, ReservationRow } from "../../components/admin/ReservationsUI";

interface ResRow {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  touriste_name: string;
  excursion: { title?: string; city?: string } | null;
}

type FilterKey = ReservationStatus | "all";

const TABS: { key: FilterKey; label: string; Icon: React.ElementType }[] = [
  { key: "pending",   label: "En attente", Icon: RESERVATION_STATUS.pending.icon!   },
  { key: "confirmed", label: "Confirmées", Icon: RESERVATION_STATUS.confirmed.icon! },
  { key: "all",       label: "Tous",       Icon: Users       },
];

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminReservationsClient({
  reservations = [],
  error,
}: {
  reservations: ResRow[];
  error?: string | null;
}) {
  const [filter, setFilter]         = useState<FilterKey>("all");
  const [search, setSearch]         = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [cityOpen, setCityOpen]     = useState(false);

  const cities = useMemo(() => {
    const set = new Set(
      reservations.map((r) => r.excursion?.city).filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [reservations]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length };
    reservations.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [reservations]);

  const filtered = useMemo(() => {
    let list = reservations;
    if (filter !== "all")     list = list.filter((r) => r.status === filter);
    if (cityFilter !== "all") list = list.filter((r) => r.excursion?.city === cityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.booking_code.toLowerCase().includes(q) ||
          r.touriste_name.toLowerCase().includes(q) ||
          (r.excursion?.title ?? "").toLowerCase().includes(q) ||
          (r.excursion?.city ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [reservations, filter, cityFilter, search]);

  const revenue   = Math.round(reservations.reduce((s, r) => s + r.total_price, 0));
  const pending   = counts.pending   ?? 0;
  const confirmed = counts.confirmed ?? 0;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
          Gestion des réservations
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          {pending} en attente · {confirmed} confirmées · {reservations.length} total
        </p>
      </div>

      {/* ── Stats cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total" value={String(reservations.length)} color="#2B96A8" bg="#EFF9FB" border="#BAE6FD" Icon={CalendarDays} />
        <StatCard label="En attente" value={String(pending)} color="#D97706" bg="#FFFBEB" border="#FDE68A" Icon={Clock} />
        <StatCard label="Confirmées" value={String(confirmed)} color="#059669" bg="#ECFDF5" border="#6EE7B7" Icon={CheckCircle} />
        <StatCard label="Chiffre d'affaires" value={`${revenue} TND`} color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" Icon={TrendingUp} />
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #E5E7EB",
        padding: "14px 18px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <SearchBar value={search} onChange={setSearch} />
        <CityFilter cities={cities} value={cityFilter} onChange={setCityFilter} isOpen={cityOpen} onToggle={() => setCityOpen((o) => !o)} />
        <FilterTabs tabs={TABS} active={filter} counts={counts} totalCount={reservations.length} onSelect={(key) => setFilter(key as FilterKey)} />
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <EmptyReservations 
          filter={filter} 
          search={search} 
          onReset={() => { setSearch(""); setFilter("all"); setCityFilter("all"); }} 
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((r) => <ReservationRow key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}