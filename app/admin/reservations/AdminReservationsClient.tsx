"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Clock, CheckCircle, TrendingUp,
  Users, MapPin, Banknote, Search, ChevronDown,
  Waves, UserCheck, XCircle,
} from "lucide-react";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui";
import { RESERVATION_STATUS, ReservationStatus } from "../../../lib/statusConfig";

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
        {[
          { label: "Total",              value: String(reservations.length), color: "#2B96A8", bg: "#EFF9FB", border: "#BAE6FD", Icon: CalendarDays },
          { label: "En attente",         value: String(pending),             color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", Icon: Clock        },
          { label: "Confirmées",         value: String(confirmed),           color: "#059669", bg: "#ECFDF5", border: "#6EE7B7", Icon: CheckCircle  },
          { label: "Chiffre d'affaires", value: `${revenue} TND`,            color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", Icon: TrendingUp   },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "16px 18px", border: `1px solid ${s.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={17} color={s.color} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 19, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
          </div>
        ))}
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

        {/* Recherche */}
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={14} color="#9CA3AF" strokeWidth={2}
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, code, ville..."
            style={{
              width: "100%", padding: "8px 12px 8px 32px",
              border: "1.5px solid #E5E7EB", borderRadius: 20,
              fontSize: 13, color: "#111827", background: "white",
              outline: "none", fontFamily: "inherit",
              transition: "border-color .2s", boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2B96A8")}
            onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
          />
        </div>

        {/* Dropdown ville */}
        {cities.length > 0 && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setCityOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 14px", border: "1.5px solid #E5E7EB", borderRadius: 20,
                background: "white", color: cityFilter !== "all" ? "#2B96A8" : "#374151",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <MapPin size={13} color={cityFilter !== "all" ? "#2B96A8" : "#9CA3AF"} strokeWidth={2} />
              {cityFilter === "all" ? "Toutes les villes" : cityFilter}
              <ChevronDown size={13} color="#9CA3AF" strokeWidth={2} />
            </button>
            {cityOpen && (
              <div
                style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                  background: "white", border: "1px solid #E5E7EB", borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,.1)", minWidth: 180, overflow: "hidden",
                }}
                onMouseLeave={() => setCityOpen(false)}
              >
                {[{ key: "all", label: "Toutes les villes" }, ...cities.map((c) => ({ key: c, label: c }))].map((opt) => (
                  <button key={opt.key}
                    onClick={() => { setCityFilter(opt.key); setCityOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "10px 16px", border: "none",
                      background: cityFilter === opt.key ? "#EFF9FB" : "white",
                      color: cityFilter === opt.key ? "#2B96A8" : "#374151",
                      textAlign: "left", fontSize: 13, fontWeight: cityFilter === opt.key ? 700 : 500,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <MapPin size={12} color={cityFilter === opt.key ? "#2B96A8" : "#9CA3AF"} strokeWidth={1.5} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pills filtres */}
        {TABS.map((tab) => {
          const count  = tab.key === "all" ? reservations.length : (counts[tab.key] ?? 0);
          const active = filter === tab.key;
          return (
            <button key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "8px 16px", borderRadius: 20,
                border: active ? "none" : "1px solid #E5E7EB",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                fontFamily: "inherit",
                background: active ? "#2B96A8" : "white",
                color: active ? "white" : "#6B7280",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all .15s",
              }}
            >
              <tab.Icon size={13} strokeWidth={2} />
              {tab.label}
              <span style={{
                padding: "1px 7px", borderRadius: 20, fontSize: 12,
                background: active ? "rgba(255,255,255,.25)" : "#F3F4F6",
                color: active ? "white" : "#374151",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            {filter === "pending"
              ? <CheckCircle size={26} color="#9CA3AF" strokeWidth={1.5} />
              : <CalendarDays size={26} color="#9CA3AF" strokeWidth={1.5} />
            }
          </div>
          <p style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 6 }}>
            {search
              ? `Aucun résultat pour « ${search} »`
              : filter === "pending"
              ? "Aucune réservation en attente"
              : "Aucune réservation trouvée"}
          </p>
          {(search || filter !== "all" || cityFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setFilter("all"); setCityFilter("all"); }}
              style={{ marginTop: 12, padding: "8px 18px", background: "#F3F4F6", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((r) => {
            const s = RESERVATION_STATUS[r.status as ReservationStatus] ?? RESERVATION_STATUS.pending;
            return (
              <div key={r.id} style={{
                background: "white", borderRadius: 16, padding: "20px",
                border: `1px solid ${r.status === "pending" ? "#FEF3C7" : "#E5E7EB"}`,
                borderLeft: `4px solid ${s.dot}`,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20,
                transition: "box-shadow .15s",
              }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,.07)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
              >
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: r.status === "confirmed"
                        ? "linear-gradient(135deg, #2B96A8, #4AABB8)"
                        : r.status === "pending"
                        ? "linear-gradient(135deg, #F59E0B, #FBBF24)"
                        : "linear-gradient(135deg, #6B7280, #9CA3AF)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: 16,
                    }}>
                      {r.touriste_name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{r.touriste_name}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>#{r.booking_code}</p>
                    </div>

                    {/* Badge statut avec icône */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                    }}>
                      {s.icon && <s.icon size={11} strokeWidth={2.5} />}
                      {s.label}
                    </span>
                  </div>

                  {/* Détails en ligne avec icônes Lucide */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {r.excursion?.title && (
                      <span style={{ fontSize: 13, color: "#374151", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                        <Waves size={13} color="#2B96A8" strokeWidth={1.5} />
                        {r.excursion.title}
                      </span>
                    )}
                    {r.excursion?.city && (
                      <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} color="#9CA3AF" strokeWidth={1.5} />
                        {r.excursion.city}
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <CalendarDays size={12} color="#9CA3AF" strokeWidth={1.5} />
                      {fmtDate(r.date)} à {r.time}
                    </span>
                    <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <UserCheck size={12} color="#9CA3AF" strokeWidth={1.5} />
                      {r.people_count} personne{r.people_count > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Prix */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
                    {r.total_price} <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF" }}>TND</span>
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                    <Banknote size={10} color="#C4B8B0" strokeWidth={1.5} />
                    dont {r.platform_fee} TND comm.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}