import { CalendarDays, Clock, CheckCircle, TrendingUp, MapPin, Search, ChevronDown, Waves, UserCheck, Banknote } from "lucide-react";
import { RESERVATION_STATUS, ReservationStatus } from "@/lib/statusConfig";

// ─── STAT CARD ───
interface StatCardProps {
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
  Icon: React.ElementType;
}

export function StatCard({ label, value, color, bg, border, Icon }: StatCardProps) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "16px 18px", border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={color} strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 19, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

// ─── SEARCH BAR ───
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
      <Search size={14} color="#9CA3AF" strokeWidth={2}
        style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher par nom, code, ville..."
        style={{
          width: "100%", padding: "8px 12px 8px 32px",
          border: "1.5px solid #E5E7EB", borderRadius: 20,
          fontSize: 13, color: "#111827", background: "white",
          outline: "none", fontFamily: "inherit",
          transition: "border-color .2s", boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#2B96A8")}
        onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
      />
    </div>
  );
}

// ─── CITY FILTER DROPDOWN ───
interface CityFilterProps {
  cities: string[];
  value: string;
  onChange: (city: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function CityFilter({ cities, value, onChange, isOpen, onToggle }: CityFilterProps) {
  if (cities.length === 0) return null;

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 14px", border: "1.5px solid #E5E7EB", borderRadius: 20,
          background: "white", color: value !== "all" ? "#2B96A8" : "#374151",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <MapPin size={13} color={value !== "all" ? "#2B96A8" : "#9CA3AF"} strokeWidth={2} />
        {value === "all" ? "Toutes les villes" : value}
        <ChevronDown size={13} color="#9CA3AF" strokeWidth={2} />
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
            background: "white", border: "1px solid #E5E7EB", borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,.1)", minWidth: 180, overflow: "hidden",
          }}
          onMouseLeave={onToggle}
        >
          {[{ key: "all", label: "Toutes les villes" }, ...cities.map((c) => ({ key: c, label: c }))].map((opt) => (
            <button key={opt.key}
              onClick={() => { onChange(opt.key); onToggle(); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "10px 16px", border: "none",
                background: value === opt.key ? "#EFF9FB" : "white",
                color: value === opt.key ? "#2B96A8" : "#374151",
                textAlign: "left", fontSize: 13, fontWeight: value === opt.key ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <MapPin size={12} color={value === opt.key ? "#2B96A8" : "#9CA3AF"} strokeWidth={1.5} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FILTER TABS ───
interface FilterTabsProps {
  tabs: Array<{ key: string; label: string; Icon: React.ElementType }>;
  active: string;
  counts: Record<string, number>;
  totalCount: number;
  onSelect: (key: string) => void;
}

export function FilterTabs({ tabs, active, counts, totalCount, onSelect }: FilterTabsProps) {
  return (
    <>
      {tabs.map((tab) => {
        const count = tab.key === "all" ? totalCount : (counts[tab.key] ?? 0);
        const isActive = active === tab.key;
        return (
          <button key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              padding: "8px 16px", borderRadius: 20,
              border: isActive ? "none" : "1px solid #E5E7EB",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              fontFamily: "inherit",
              background: isActive ? "#2B96A8" : "white",
              color: isActive ? "white" : "#6B7280",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all .15s",
            }}
          >
            <tab.Icon size={13} strokeWidth={2} />
            {tab.label}
            <span style={{
              padding: "1px 7px", borderRadius: 20, fontSize: 12,
              background: isActive ? "rgba(255,255,255,.25)" : "#F3F4F6",
              color: isActive ? "white" : "#374151",
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </>
  );
}

// ─── EMPTY STATE ───
interface EmptyStateProps {
  filter: string;
  search: string;
  onReset: () => void;
}

export function EmptyReservations({ filter, search, onReset }: EmptyStateProps) {
  return (
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
      <button
        onClick={onReset}
        style={{ marginTop: 12, padding: "8px 18px", background: "#F3F4F6", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}

// ─── RESERVATION ROW ───
interface ReservationRowProps {
  r: {
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
  };
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function ReservationRow({ r }: ReservationRowProps) {
  const s = RESERVATION_STATUS[r.status as ReservationStatus] ?? RESERVATION_STATUS.pending;

  return (
    <div style={{
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

        {/* Détails en ligne */}
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
}
