"use client";

// components/admin/PaymentsUI.tsx
// ── RevenueChart · StatusPills · PaymentsToolbar · PaymentRow ─────────

import React, { useState } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronUp,
  CalendarDays, Users, MapPin, CreditCard, Wallet, Building2, Tag,
} from "lucide-react";
import { StatusBadge } from "../ui/index";
import { Paiement, PAIEMENT_STATUS, PaiementStatus, fmtDate, fmtAmount } from "../../../lib/paiement";

// ─── Types ────────────────────────────────────────────────────────────
interface Profile  { user_id: string; full_name: string | null; agency_name?: string | null }
interface Excursion { id: string; title: string; city: string }
type ResaMap  = Record<string, Record<string, unknown>>;
type ExcMap   = Record<string, Excursion>;
type PrestMap = Record<string, Profile>;
type TourMap  = Record<string, Profile>;

// ─── CSS ──────────────────────────────────────────────────────────────
const PAYMENTS_CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
  .ap-card   { background:white; border-radius:20px; border:1px solid #E5E7EB; padding:24px; margin-bottom:20px; animation:fadeUp .35s ease both; box-shadow:0 2px 12px rgba(0,0,0,.04); }
  .ap-kpis   { display:flex; gap:16px; flex-wrap:wrap; }
  .ap-btn    { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border:1.5px solid #E5E7EB; border-radius:10px; background:white; color:#374151; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
  .ap-btn:hover  { border-color:#02AFCF; color:#02AFCF; background:#EFF9FB; }
  .ap-btn.active { border-color:#02AFCF; color:#02AFCF; background:#EFF9FB; }
  .admin-page { max-width:1200px; margin:0 auto; padding:32px 24px; font-family:'Segoe UI',system-ui,sans-serif; }
  .admin-row-count { font-size:13px; color:#9CA3AF; margin-bottom:12px; font-weight:500; }
  .admin-cta-button { padding:11px 22px; background:#02AFCF; color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
  .pay-row-expand { width:100%; text-align:left; background:none; border:none; cursor:pointer; font-family:inherit; }
  .pay-row-wrap:hover { background:#FAFAFA !important; }
  .pill-btn { border:1.5px solid #E5E7EB; background:white; border-radius:10px; padding:7px 14px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
  .pill-btn:hover  { border-color:#02AFCF; color:#02AFCF; }
  .pill-btn.active { border-color:#02AFCF; background:#EFF9FB; color:#02AFCF; }
`;

// ─── RevenueChart ─────────────────────────────────────────────────────
export function RevenueChart({ data }: { data: { month: string; amount: number; fees: number }[] }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.amount, d.fees)), 1);

  return (
    <>
      <style>{PAYMENTS_CSS}</style>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>Revenus par mois</h3>
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: "4px 0 0" }}>6 derniers mois · en TND</p>
      </div>

      <div style={{ background: "white", borderRadius: 20, border: "1px solid #E5E7EB", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, minHeight: 220 }}>
          {data.map((item) => {
            const amountHeight = Math.max(10, Math.round((item.amount / maxValue) * 100));
            const feesHeight = Math.max(10, Math.round((item.fees / maxValue) * 100));
            return (
              <div key={item.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, width: "100%", height: 180 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 4 }}>
                    <div
                      style={{
                        height: `${amountHeight}%`,
                        background: "#02AFCF",
                        borderRadius: 12,
                      }}
                      title={`Volume ${fmtAmount(item.amount)} TND`}
                    />
                    <span style={{ fontSize: 10, color: "#FFFFFF", opacity: 0 }}>&nbsp;</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 4 }}>
                    <div
                      style={{
                        height: `${feesHeight}%`,
                        background: "#053366",
                        borderRadius: 12,
                      }}
                      title={`Commission ${fmtAmount(item.fees)} TND`}
                    />
                    <span style={{ fontSize: 10, color: "#FFFFFF", opacity: 0 }}>&nbsp;</span>
                  </div>
                </div>
                <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "#6B7280" }}>{item.month}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: 18, fontSize: 12, color: "#6B7280" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#02AFCF" }} />
            Volume total
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#053366" }} />
            Commission
          </div>
        </div>
      </div>
    </>
  );
}

// ─── StatusPills ─────────────────────────────────────────────────────
export function StatusPills({ paiements }: { paiements: Paiement[] }) {
  const counts: Record<string, number> = {};
  paiements.forEach(p => { counts[p.status] = (counts[p.status] ?? 0) + 1; });

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
      {Object.entries(PAIEMENT_STATUS).map(([key, cfg]) => {
        const count = counts[key] ?? 0;
        if (!count) return null;
        return (
          <div key={key} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "6px 14px",
            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
            borderRadius: 99, fontSize: 12, fontWeight: 700, color: cfg.color,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
            {cfg.label}
            <span style={{
              background: cfg.color, color: "white",
              borderRadius: 99, fontSize: 10, fontWeight: 900,
              padding: "1px 7px", marginLeft: 2,
            }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── PaymentsToolbar ─────────────────────────────────────────────────
export function PaymentsToolbar({
  search, onSearchChange,
  statusFilter, onStatusChange,
  sortBy, onSortChange,
  counts,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  sortBy: "date" | "amount";
  onSortChange: (v: "date" | "amount") => void;
  counts: Record<string, number>;
}) {
  const filterOptions = [
    { value: "all",          label: `Tous (${counts.all ?? 0})` },
    { value: "paid",         label: `Payés (${counts.paid ?? 0})` },
    { value: "pending",      label: `En attente (${counts.pending ?? 0})` },
    { value: "pending_cash", label: `Cash (${counts.pending_cash ?? 0})` },
    { value: "pending_bank", label: `Virement (${counts.pending_bank ?? 0})` },
    { value: "failed",       label: `Échoués (${counts.failed ?? 0})` },
    { value: "expired",      label: `Expirés (${counts.expired ?? 0})` },
    { value: "refunded",     label: `Remboursés (${counts.refunded ?? 0})` },
  ].filter(o => o.value === "all" || (counts[o.value] ?? 0) > 0);

  return (
    <div className="ap-card" style={{ padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>

        {/* Recherche */}
        <div style={{
          flex: 1, minWidth: 200,
          display: "flex", alignItems: "center", gap: 8,
          background: "#F9FAFB", border: "1.5px solid #E5E7EB",
          borderRadius: 12, padding: "9px 14px",
        }}>
          <Search size={15} color="#9CA3AF" strokeWidth={2} />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Chercher excursion, prestataire, code..."
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none",
            }}
          />
        </div>

        {/* Filtre statut */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filterOptions.map(o => (
            <button
              key={o.value}
              className={`pill-btn ${statusFilter === o.value ? "active" : ""}`}
              onClick={() => onStatusChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Tri */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`ap-btn ${sortBy === "date" ? "active" : ""}`}
            onClick={() => onSortChange("date")}
          >
            <SlidersHorizontal size={13} /> Date
          </button>
          <button
            className={`ap-btn ${sortBy === "amount" ? "active" : ""}`}
            onClick={() => onSortChange("amount")}
          >
            <SlidersHorizontal size={13} /> Montant
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PaymentRow ───────────────────────────────────────────────────────
export function PaymentRow({
  payment, index, resaMap, excMap, prestMap, touristeMap,
}: {
  payment: Paiement;
  index: number;
  resaMap: ResaMap;
  excMap: ExcMap;
  prestMap: PrestMap;
  touristeMap: TourMap;
}) {
  const [expanded, setExpanded] = useState(false);

  const resa   = resaMap[payment.reservation_id]  || {};
  const exc    = excMap[String(resa.excursion_id)] || ({} as Excursion);
  const prest  = prestMap[payment.prestataire_id]  || {} as Profile;
  const tour   = touristeMap[String(resa.touriste_id)] || {} as Profile;

  const amount = Number(payment.amount);
  const fee    = Number(payment.platform_fee);
  const net    = Number(payment.net_amount);

  // ✅ Fonction sécurisée pour récupérer la méthode de paiement
  const getPaymentMethod = () => {
    return (payment as any).payment_method || 
           (payment as any).method || 
           (payment as any).paymentType || 
           "cash";
  };

  const methodIcon = () => {
    const method = getPaymentMethod();
    switch (method) {
      case "flouci": return <CreditCard size={11} strokeWidth={2} />;
      case "cash":   return <Wallet     size={11} strokeWidth={2} />;
      case "bank":   return <Building2  size={11} strokeWidth={2} />;
      default:       return <CreditCard size={11} strokeWidth={2} />;
    }
  };

  const getPaymentMethodLabel = () => {
    const method = getPaymentMethod();
    switch (method) {
      case "flouci": return "Flouci";
      case "cash":   return "Espèces";
      case "bank":   return "Virement";
      default:       return method;
    }
  };

  return (
    <>
      <style>{PAYMENTS_CSS}</style>
      <div
        className="pay-row-wrap"
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          marginBottom: 8,
          overflow: "hidden",
          animation: "fadeUp .3s ease both",
          animationDelay: `${index * 0.03}s`,
          transition: "background .15s",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)",
        }}
      >
        {/* Ligne principale */}
        <button
          className="pay-row-expand"
          onClick={() => setExpanded(v => !v)}
          style={{ padding: "16px 20px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>

            {/* Icône statut */}
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: PAIEMENT_STATUS[payment.status as PaiementStatus]?.bg ?? "#F3F4F6",
              border: `1px solid ${PAIEMENT_STATUS[payment.status as PaiementStatus]?.border ?? "#E5E7EB"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CreditCard
                size={18}
                color={PAIEMENT_STATUS[payment.status as PaiementStatus]?.color ?? "#6B7280"}
                strokeWidth={1.5}
              />
            </div>

            {/* Excursion + prestataire */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 2, textAlign: "left" }}>
                {exc.title || "Excursion inconnue"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={10} strokeWidth={1.5} /> {exc.city || "—"}
                </span>
                <span style={{ color: "#E5E7EB" }}>·</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>
                  {prest.agency_name || prest.full_name || "—"}
                </span>
              </div>
            </div>

            {/* Date */}
            <div style={{ textAlign: "left", minWidth: 100 }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, marginBottom: 2 }}>Date</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{fmtDate(payment.created_at)}</p>
            </div>

            {/* Montants */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, marginBottom: 2 }}>Montant</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
                  {fmtAmount(amount)} <span style={{ fontSize: 11, color: "#9CA3AF" }}>TND</span>
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, marginBottom: 2 }}>Commission</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#02AFCF" }}>
                  +{fmtAmount(fee)} TND
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: .6, marginBottom: 2 }}>Net prestataire</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#053366" }}>
                  {fmtAmount(net)} TND
                </p>
              </div>
            </div>

            {/* Statut + méthode */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
              <StatusBadge status={payment.status} />
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#6B7280",
                display: "flex", alignItems: "center", gap: 3,
                background: "#F3F4F6", padding: "2px 8px", borderRadius: 6,
              }}>
                {methodIcon()}
                {getPaymentMethodLabel()}
              </span>
            </div>

            {/* Flèche */}
            <div style={{ marginLeft: 4, color: "#9CA3AF" }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </button>

        {/* Détail déroulant */}
        {expanded && (
          <div style={{
            borderTop: "1px solid #F3F4F6",
            padding: "16px 20px",
            background: "#FAFAFA",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 14,
          }}>
            {[
              { Icon: Tag,          label: "Code réservation",  value: String(resa.booking_code || "—") },
              { Icon: CalendarDays, label: "Date excursion",    value: resa.date ? fmtDate(String(resa.date)) : "—" },
              { Icon: Users,        label: "Voyageurs",         value: resa.people_count ? `${resa.people_count} pers.` : "—" },
              { Icon: Users,        label: "Touriste",          value: tour.full_name || "—" },
              { Icon: CreditCard,   label: "Statut réservation",value: String(resa.status || "—") },
              { Icon: MapPin,       label: "ID paiement",       value: payment.id.slice(0, 16) + "…" },
            ].map(({ Icon, label, value }) => (
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

            {/* Barre de décomposition des montants */}
            <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
              <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", gap: 1 }}>
                <div style={{ flex: net,    background: "#053366" }} title={`Net: ${net} TND`} />
                <div style={{ flex: fee,    background: "#02AFCF" }} title={`Commission: ${fee} TND`} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "#053366", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#053366" }} />
                  Net prestataire : {fmtAmount(net)} TND
                </span>
                <span style={{ fontSize: 11, color: "#02AFCF", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#02AFCF" }} />
                  Commission : {fmtAmount(fee)} TND
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}