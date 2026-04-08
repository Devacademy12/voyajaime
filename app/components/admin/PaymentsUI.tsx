import { Building2, CalendarDays, Users, BarChart2, Download, Filter } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";
import SearchBar from "../ui/SearchBar";
import { PAIEMENT_STATUS, PaiementStatus, fmtDate } from "@/lib/paiement";

// ─── REVENUE CHART ───
export function RevenueChart({ data }: { data: { month: string; amount: number; fees: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        border: "1px solid #EEF2FF",
        padding: "20px 24px",
        marginBottom: 20,
        boxShadow: "0 2px 12px rgba(5,51,102,.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(2,175,207,.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart2 size={14} color="#02AFCF" strokeWidth={1.5} />
          </div>
          Revenus par mois
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#9CA3AF" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: "linear-gradient(135deg,#02AFCF,#259FFC)",
                display: "inline-block",
              }}
            />{" "}
            Volume
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#EEF2FF", border: "1px solid #DCE5FF", display: "inline-block" }} /> Commission
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, overflowX: "auto", paddingBottom: 4 }}>
        {data.map((d) => (
          <div key={d.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 52, flex: 1 }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                justifyContent: "flex-end",
                height: 100,
              }}
            >
              <div
                style={{
                  width: "60%",
                  borderRadius: "3px 3px 0 0",
                  height: `${(d.fees / max) * 100}px`,
                  background: "#EEF2FF",
                  border: "1px solid #DCE5FF",
                  minHeight: d.fees > 0 ? 4 : 0,
                }}
              />
              <div
                style={{
                  width: "100%",
                  borderRadius: "4px 4px 0 0",
                  height: `${(d.amount / max) * 100}px`,
                  background: "linear-gradient(180deg,#02AFCF,#259FFC)",
                  minHeight: d.amount > 0 ? 4 : 0,
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", whiteSpace: "nowrap" }}>
              {d.month.split(" ")[0].slice(0, 3)}
            </span>
            <span style={{ fontSize: 10, color: "#053366", fontWeight: 700 }}>{d.amount} TND</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STATUS PILLS ───
interface StatusPillsProps {
  paiements: any[];
}

export function StatusPills({ paiements }: StatusPillsProps) {
  return (
    <div className="ap-pills ap-card" style={{ animationDelay: ".14s" }}>
      {(["paid", "pending", "refunded"] as PaiementStatus[]).map((key) => {
        const cfg = PAIEMENT_STATUS[key];
        const count = paiements.filter((p) => p.status === key).length;
        return (
          <div
            key={key}
            style={{
              background: "white",
              border: `1px solid ${cfg.bg}`,
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#053366", margin: 0, lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0", fontWeight: 500 }}>{cfg.label}</p>
            </div>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── PAYMENTS TOOLBAR ───
interface PaymentsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: PaiementStatus | "all";
  onStatusChange: (status: PaiementStatus | "all") => void;
  sortBy: "date" | "amount";
  onSortChange: (sort: "date" | "amount") => void;
  counts: Record<string, number>;
}

export function PaymentsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  counts,
}: PaymentsToolbarProps) {
  return (
    <div className="ap-card" style={{ background: "white", borderRadius: 16, border: "1px solid #EEF2FF", padding: "14px 16px", marginBottom: 16, animationDelay: ".2s" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <SearchBar value={search} onChange={onSearchChange} placeholder="Excursion, prestataire, code réservation..." />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "paid", "pending", "refunded"] as const).map((s) => (
            <button
              key={s}
              className={`ap-ftab ${statusFilter === s ? "on" : ""}`}
              onClick={() => onStatusChange(s as any)}
              style={{ cursor: "pointer" }}
            >
              {s === "all" ? `Tous (${counts.all})` : `${PAIEMENT_STATUS[s].label} (${counts[s] ?? 0})`}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={14} color="#9CA3AF" />
          <select
            className="ap-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as "date" | "amount")}
            style={{ cursor: "pointer" }}
          >
            <option value="date">Plus récents</option>
            <option value="amount">Montant ↓</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENT ROW ───
interface PaymentRowProps {
  payment: any;
  index: number;
  resaMap: Record<string, any>;
  excMap: Record<string, any>;
  prestMap: Record<string, any>;
  touristeMap: Record<string, any>;
}

export function PaymentRow({ payment: p, index, resaMap, excMap, prestMap, touristeMap }: PaymentRowProps) {
  const resa = resaMap[p.reservation_id] || {};
  const exc = excMap[String(resa.excursion_id)] || {};
  const prest = prestMap[p.prestataire_id] || {};
  const tour = touristeMap[String(resa.touriste_id)] || {};

  return (
    <div key={p.id} className="ap-card ap-row" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="ap-row-meta">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#053366", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {exc.title || "—"}
            </span>
            {exc.city && (
              <span style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600, padding: "2px 8px", background: "rgba(2,175,207,.08)", borderRadius: 20 }}>
                {exc.city}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "#02AFCF", fontWeight: 700 }}>#{String(resa.booking_code || "—")}</span>
            {(prest.agency_name || prest.full_name) && (
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                <Building2 size={11} color="#9CA3AF" />
                {prest.agency_name || prest.full_name}
              </span>
            )}
            {tour.full_name && (
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={11} color="#9CA3AF" />
                {tour.full_name}
              </span>
            )}
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <CalendarDays size={11} color="#9CA3AF" />
              {fmtDate(p.created_at)}
            </span>
          </div>
        </div>
        <div className="ap-row-right" style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, marginLeft: 16 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 17, fontWeight: 900, color: "#053366", margin: 0 }}>
              {Number(p.amount)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span>
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 4, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, color: "#259FFC", fontWeight: 600 }}>Comm. {Number(p.platform_fee)} TND</span>
              <span style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600 }}>Net {Number(p.net_amount)} TND</span>
            </div>
          </div>
          <StatusBadge status={p.status} config={PAIEMENT_STATUS} />
        </div>
      </div>
    </div>
  );
}
