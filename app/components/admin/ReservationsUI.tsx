"use client";

// components/admin/ReservationsUI.tsx
// ── StatCard · SearchBar · CityFilter · FilterTabs · EmptyReservations · ReservationRow

import React, { useState } from "react";
import {
  Search, MapPin, ChevronDown, ChevronUp, ChevronRight,
  CalendarDays, Clock, Users, CreditCard, Tag,
  CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";
import { RESERVATION_STATUS, ReservationStatus } from "../../../lib/statusConfig";

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

// ─── CSS ──────────────────────────────────────────────────────────────
const RES_CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
  @keyframes dropIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }
  .res-card { animation: fadeUp .3s ease both; }
  .res-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.09) !important; transform: translateY(-1px); transition: all .18s; }
  .res-row-btn { width:100%; text-align:left; background:none; border:none; cursor:pointer; font-family:inherit; padding:0; }
  .res-tab { border:1.5px solid #E5E7EB; border-radius:10px; padding:8px 14px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; display:inline-flex; align-items:center; gap:6px; background:white; color:#6B7280; }
  .res-tab:hover  { border-color:#2B96A8; color:#2B96A8; }
  .res-tab.active { border-color:#2B96A8; background:#EFF9FB; color:#2B96A8; }
  .city-dropdown  { animation: dropIn .15s ease both; position:absolute; top:calc(100% + 6px); left:0; min-width:200px; background:white; border:1.5px solid #E5E7EB; border-radius:14px; box-shadow:0 12px 36px rgba(0,0,0,.12); z-index:200; overflow:hidden; }
  .city-opt { padding:10px 14px; font-size:13px; font-weight:600; cursor:pointer; transition:background .1s; color:#374151; }
  .city-opt:hover  { background:#F9FAFB; }
  .city-opt.active { background:#EFF9FB; color:#2B96A8; }
  .reset-btn { padding:11px 22px; background:#2B96A8; color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
  .reset-btn:hover { background:#1e7a8a; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getStatusCfg(status: string) {
  return RESERVATION_STATUS[status as ReservationStatus] ?? {
    label: status, color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", dot: "#9CA3AF",
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  StatCard
// ═══════════════════════════════════════════════════════════════════════
export function StatCard({
  label, value, color, bg, border, Icon,
}: {
  label: string; value: string;
  color: string; bg: string; border: string;
  Icon: React.ElementType;
}) {
  return (
    <>
      <style>{RES_CSS}</style>
      <div style={{
        background: "white", borderRadius: 18,
        border: `1.5px solid ${border}`,
        padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 2px 10px rgba(0,0,0,.04)",
        animation: "fadeUp .35s ease both",
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: bg, border: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={20} color={color} strokeWidth={1.8} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .8, marginBottom: 3 }}>
            {label}
          </p>
          <p style={{ fontSize: 20, fontWeight: 900, color: "#111827", lineHeight: 1 }}>
            {value}
          </p>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  SearchBar
// ═══════════════════════════════════════════════════════════════════════
export function SearchBar({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      flex: 1, minWidth: 200,
      display: "flex", alignItems: "center", gap: 8,
      background: "#F9FAFB", border: "1.5px solid #E5E7EB",
      borderRadius: 12, padding: "9px 14px",
      transition: "border-color .15s",
    }}>
      <Search size={15} color="#9CA3AF" strokeWidth={2} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Code, touriste, excursion, ville…"
        style={{
          flex: 1, border: "none", background: "transparent",
          fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
        >
          <XCircle size={14} color="#9CA3AF" />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  CityFilter
// ═══════════════════════════════════════════════════════════════════════
export function CityFilter({
  cities, value, onChange, isOpen, onToggle,
}: {
  cities: string[]; value: string;
  onChange: (v: string) => void;
  isOpen: boolean; onToggle: () => void;
}) {
  if (!cities.length) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onToggle}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 14px",
          border: `1.5px solid ${value !== "all" ? "#2B96A8" : "#E5E7EB"}`,
          borderRadius: 12,
          background: value !== "all" ? "#EFF9FB" : "white",
          color: value !== "all" ? "#2B96A8" : "#374151",
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          transition: "all .15s",
        }}
      >
        <MapPin size={14} strokeWidth={2} />
        {value === "all" ? "Toutes villes" : value}
        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {isOpen && (
        <div className="city-dropdown">
          <div
            className={`city-opt ${value === "all" ? "active" : ""}`}
            onClick={() => { onChange("all"); onToggle(); }}
          >
            Toutes les villes
          </div>
          {cities.map(city => (
            <div
              key={city}
              className={`city-opt ${value === city ? "active" : ""}`}
              onClick={() => { onChange(city); onToggle(); }}
            >
              {city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  FilterTabs
// ═══════════════════════════════════════════════════════════════════════
export function FilterTabs({
  tabs, active, counts, totalCount, onSelect,
}: {
  tabs: { key: string; label: string; Icon: React.ElementType }[];
  active: string;
  counts: Record<string, number>;
  totalCount: number;
  onSelect: (key: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tabs.map(({ key, label, Icon }) => {
        const count = key === "all" ? totalCount : (counts[key] ?? 0);
        const isActive = active === key;
        const cfg = key !== "all" ? getStatusCfg(key) : null;
        return (
          <button
            key={key}
            className={`res-tab ${isActive ? "active" : ""}`}
            onClick={() => onSelect(key)}
            style={isActive && cfg ? {
              borderColor: cfg.color,
              background: cfg.bg,
              color: cfg.color,
            } : {}}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
            <span style={{
              background: isActive ? (cfg?.color ?? "#2B96A8") : "#E5E7EB",
              color: isActive ? "white" : "#6B7280",
              borderRadius: 99, fontSize: 10, fontWeight: 800,
              padding: "1px 7px", minWidth: 20, textAlign: "center",
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  EmptyReservations
// ═══════════════════════════════════════════════════════════════════════
export function EmptyReservations({
  filter, search, onReset,
}: { filter: string; search: string; onReset: () => void }) {
  const isFiltered = filter !== "all" || search.trim().length > 0;

  return (
    <div style={{
      textAlign: "center", padding: "72px 24px",
      background: "white", borderRadius: 20,
      border: "1px solid #E5E7EB",
      animation: "fadeUp .3s ease both",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <CalendarDays size={30} color="#9CA3AF" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
        {isFiltered ? "Aucun résultat" : "Aucune réservation"}
      </h3>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
        {isFiltered
          ? "Essayez d'autres filtres ou termes de recherche"
          : "Les réservations apparaîtront ici"}
      </p>
      {isFiltered && (
        <button className="reset-btn" onClick={onReset}>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  ReservationRow — carte dépliable
// ═══════════════════════════════════════════════════════════════════════
export function ReservationRow({ r }: { r: ResRow }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getStatusCfg(r.status);
  const fee = Number(r.platform_fee ?? 0);
  const net = Number(r.total_price ?? 0) - fee;

  return (
    <>
      <style>{RES_CSS}</style>
      <div
        className="res-card"
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          borderLeft: `4px solid ${cfg.dot}`,
        }}
      >
        {/* ── Ligne principale ── */}
        <button
          className="res-row-btn"
          onClick={() => setExpanded(v => !v)}
          style={{ padding: "16px 20px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>

            {/* Icône statut */}
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: cfg.bg, border: `1.5px solid ${cfg.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {cfg.icon && <cfg.icon size={20} color={cfg.color} strokeWidth={1.5} />}
            </div>

            {/* Excursion + ville */}
            <div style={{ flex: 1, minWidth: 160, textAlign: "left" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 2, lineHeight: 1.3 }}>
                {r.excursion?.title ?? "Excursion inconnue"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {r.excursion?.city && (
                  <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}>
                    <MapPin size={10} strokeWidth={1.5} /> {r.excursion.city}
                  </span>
                )}
                <span style={{ color: "#E5E7EB" }}>·</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>
                  {r.touriste_name}
                </span>
              </div>
            </div>

            {/* Date & heure */}
            <div style={{ textAlign: "left", minWidth: 90 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .7, marginBottom: 3 }}>
                Date
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                {fmtDate(r.date)}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{r.time}</p>
            </div>

            {/* Voyageurs */}
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .7, marginBottom: 3 }}>
                Pers.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                <Users size={13} color="#6B7280" strokeWidth={1.5} />
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{r.people_count}</p>
              </div>
            </div>

            {/* Montant */}
            <div style={{ textAlign: "right", minWidth: 90 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .7, marginBottom: 3 }}>
                Montant
              </p>
              <p style={{ fontSize: 17, fontWeight: 900, color: "#111827", lineHeight: 1 }}>
                {r.total_price.toLocaleString("fr-FR")}
                <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 3, fontWeight: 500 }}>EUR</span>
              </p>
            </div>

            {/* Statut badge */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 12px",
              background: cfg.bg, border: `1.5px solid ${cfg.border}`,
              borderRadius: 99, fontSize: 11, fontWeight: 700, color: cfg.color,
              whiteSpace: "nowrap",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
              {cfg.label}
            </span>

            {/* Code réservation */}
            <span style={{
              fontSize: 11, color: "#9CA3AF", fontFamily: "monospace",
              background: "#F9FAFB", padding: "3px 9px",
              borderRadius: 7, border: "1px solid #E5E7EB",
              whiteSpace: "nowrap",
            }}>
              #{r.booking_code}
            </span>

            {/* Flèche */}
            <div style={{ color: "#9CA3AF", marginLeft: "auto" }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </button>

        {/* ── Détail déroulant ── */}
        {expanded && (
          <div style={{
            borderTop: "1px solid #F3F4F6",
            padding: "16px 20px",
            background: "#FAFAFA",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}>
              {[
                { icon: Tag,          label: "Code",          value: `#${r.booking_code}` },
                { icon: CalendarDays, label: "Date excursion", value: fmtDate(r.date) },
                { icon: Clock,        label: "Heure départ",  value: r.time },
                { icon: Users,        label: "Voyageurs",     value: `${r.people_count} pers.` },
                { icon: CreditCard,   label: "Total",         value: `${r.total_price.toLocaleString("fr-FR")} EUR` },
                { icon: CreditCard,   label: "Commission",    value: `${fee.toLocaleString("fr-FR")} EUR` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <Icon size={11} color="#9CA3AF" strokeWidth={1.5} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .6 }}>
                      {label}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Barre de décomposition */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", height: 7, borderRadius: 99, overflow: "hidden", gap: 1 }}>
                <div style={{ flex: net, background: "#2B96A8" }} title={`Net: ${net} EUR`} />
                <div style={{ flex: fee, background: "#F59E0B", opacity: .85 }} title={`Commission: ${fee} EUR`} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "#2B96A8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#2B96A8" }} />
                  Net prestataire : {net.toLocaleString("fr-FR")} EUR
                </span>
                <span style={{ fontSize: 11, color: "#D97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#F59E0B" }} />
                  Commission : {fee.toLocaleString("fr-FR")} EUR
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
