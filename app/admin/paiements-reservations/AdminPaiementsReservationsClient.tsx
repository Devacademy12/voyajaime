"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, Coins, ArrowUpRight, Search, Download,
  CalendarDays, Clock, MapPin, Mail, Phone, Hash,
  Users, AlertTriangle, Accessibility, Nut, Heart, Baby,
  BarChart3, CreditCard, Building2, Star, Layers,
  CheckCircle2, XCircle, Clock3, ChevronDown, ChevronUp,
  Eye, Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────
export interface Paiement {
  id: string;
  reservation_id: string;
  prestataire_id: string;
  amount: number | string;
  platform_fee: number | string;
  net_amount: number | string;
  status: "paid" | "pending" | "refunded" | "failed";
  created_at: string;
  payment_method?: string;
  transaction_ref?: string;
}
export interface Reservation {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  excursion_id: string;
  created_at: string;
  special_requests?: string | null;
  has_disability?: boolean | null;
  disability_details?: string | null;
  has_allergy?: boolean | null;
  allergy_details?: string | null;
  has_infant?: boolean | null;
  infant_count?: number | null;
  medical_notes?: string | null;
}
export interface TouristeProfile {
  user_id: string;
  full_name: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
}
export interface PrestataireProfile {
  user_id: string;
  full_name: string | null;
  agency_name?: string | null;
}
export interface Excursion {
  id: string;
  title: string;
  city: string;
  description?: string | null;
  duration?: string | null;
  difficulty?: string | null;
  max_people?: number | null;
  price_per_person?: number | null;
  photo_url?: string | null;
  includes?: string[] | null;
}
interface Props {
  paiements: Paiement[];
  reservations: Reservation[];
  touristes: TouristeProfile[];
  prestataires: PrestataireProfile[];
  excursions: Excursion[];
}

// ─── Helpers ──────────────────────────────────────────────────────────
const n = (v: number | string) => Number(v) || 0;

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function fmtDT(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Détermine le statut "métier" d'une réservation :
 *  - "en_cours"  : payée + date future (pas encore passée)
 *  - "annule"    : payée puis annulée (statut cancelled)
 *  - "termine"   : payée + date passée (excursion effectuée)
 *  - "pending"   : réservée mais pas encore payée
 */
function getReservationBusinessStatus(
  reservation: Reservation | null,
  payment: Paiement
): "en_cours" | "annule" | "termine" | "pending" | "failed" {
  if (!reservation) return payment.status === "failed" ? "failed" : "pending";

  const resaStatus = (reservation.status || "").toLowerCase();
  if (resaStatus === "cancelled" || resaStatus === "annulé" || resaStatus === "annule") return "annule";
  if (payment.status === "failed") return "failed";
  if (payment.status === "pending") return "pending";

  const now = new Date();
  const excursionDate = new Date(reservation.date.includes("T") ? reservation.date : reservation.date + "T00:00:00");
  if (excursionDate < now) return "termine";
  return "en_cours";
}

const STATUS_CFG = {
  en_cours: {
    label: "En cours",
    color: "#0369A1",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#3B82F6",
    icon: <Clock3 size={12} />,
  },
  annule: {
    label: "Annulé",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#EF4444",
    icon: <XCircle size={12} />,
  },
  termine: {
    label: "Terminé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    dot: "#10B981",
    icon: <CheckCircle2 size={12} />,
  },
  pending: {
    label: "En attente",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
    icon: <Clock3 size={12} />,
  },
  failed: {
    label: "Échoué",
    color: "#9333EA",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dot: "#8B5CF6",
    icon: <XCircle size={12} />,
  },
} as const;

// ─── Avatar ───────────────────────────────────────────────────────────
function Avatar({ url, name, size = 32 }: { url?: string | null; name?: string | null; size?: number }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const [err, setErr] = useState(false);
  if (url && !err) return (
    <img src={url} alt={name || ""} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
  const colors = ["#0EA5E9", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#EF4444", "#6366F1"];
  const color = colors[(name || "?").charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.38, fontWeight: 800,
      color: "white", letterSpacing: -0.5,
    }}>{initials}</div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: keyof typeof STATUS_CFG }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ color: cfg.dot, display: "flex" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────
function DetailDrawer({ payment, reservation, touriste, excursion, prestataire, onClose }: {
  payment: Paiement;
  reservation: Reservation | null;
  touriste: TouristeProfile | null;
  excursion: Excursion | null;
  prestataire: PrestataireProfile | null;
  onClose: () => void;
}) {
  const bizStatus = getReservationBusinessStatus(reservation, payment);
  const cfg = STATUS_CFG[bizStatus];

  const hasSpecial = reservation && (
    reservation.has_disability || reservation.has_allergy ||
    reservation.has_infant || reservation.special_requests ||
    reservation.medical_notes
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 640,
        maxHeight: "85vh", overflowY: "auto",
        padding: "28px 28px 40px",
        animation: "slideUp .25s ease both",
        boxShadow: "0 -8px 40px rgba(0,0,0,.2)",
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 99, margin: "0 auto 24px" }} />

        {/* Header drawer */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
          <Avatar url={touriste?.avatar_url} name={touriste?.full_name} size={48} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
              {touriste?.full_name || "Client inconnu"}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {touriste?.email && <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}><Mail size={11} /> {touriste.email}</span>}
              {touriste?.phone && <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} /> {touriste.phone}</span>}
            </div>
          </div>
          <StatusBadge status={bizStatus} />
        </div>

        {/* Alerte cas spéciaux */}
        {hasSpecial && (
          <div style={{ display: "flex", gap: 8, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400E", fontWeight: 600 }}>
            <AlertTriangle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Cas particulier — vérifier les besoins spéciaux avant confirmation</span>
          </div>
        )}

        {/* Excursion */}
        {excursion && (
          <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "14px 16px", marginBottom: 18, border: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .6, margin: "0 0 8px" }}>Excursion</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {excursion.photo_url ? (
                <img src={excursion.photo_url} alt={excursion.title} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "linear-gradient(135deg,#1a3a5c,#0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={20} color="white" />
                </div>
              )}
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 3px" }}>{excursion.title}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 600 }}><MapPin size={10} style={{ display: "inline" }} /> {excursion.city}</span>
                  {excursion.duration && <span style={{ fontSize: 11, color: "#64748B" }}>· {excursion.duration}</span>}
                  {excursion.difficulty && <span style={{ fontSize: 11, color: "#64748B" }}>· {excursion.difficulty}</span>}
                  {prestataire && <span style={{ fontSize: 11, color: "#64748B" }}>· {prestataire.agency_name || prestataire.full_name}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grille infos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Code réservation", value: reservation?.booking_code || "—", mono: true },
            { label: "Date excursion",   value: reservation ? fmtDate(reservation.date) : "—" },
            { label: "Heure",            value: reservation?.time || "—" },
            { label: "Réservé le",       value: reservation ? fmtDate(reservation.created_at) : "—" },
            { label: "Voyageurs",        value: reservation ? `${reservation.people_count} pers.` : "—" },
            { label: "Méthode paiement", value: payment.payment_method || "—" },
          ].map((item, i) => (
            <div key={i} style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", border: "1px solid #F1F5F9" }}>
              <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 4px" }}>{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0, fontFamily: item.mono ? "monospace" : "inherit" }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Montants */}
        <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: 16, padding: "18px 20px", marginBottom: 18 }}>
          <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .6, margin: "0 0 14px" }}>Récapitulatif financier</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 2px" }}>Montant total</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: "white", margin: 0, lineHeight: 1 }}>
                {n(payment.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} <span style={{ fontSize: 14, fontWeight: 400, color: "#64748B" }}>EUR</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>Net : {n(payment.net_amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Commission : {n(payment.platform_fee).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR</div>
            </div>
          </div>
          {payment.transaction_ref && (
            <p style={{ fontSize: 10, color: "#475569", marginTop: 12, fontFamily: "monospace", margin: "12px 0 0" }}>Réf. {payment.transaction_ref}</p>
          )}
        </div>

        {/* Cas spéciaux */}
        {hasSpecial && reservation && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {reservation.has_disability && (
              <span style={{ fontSize: 12, padding: "5px 11px", borderRadius: 10, background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #BFDBFE", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Accessibility size={12} /> Handicap{reservation.disability_details ? ` — ${reservation.disability_details}` : ""}
              </span>
            )}
            {reservation.has_allergy && (
              <span style={{ fontSize: 12, padding: "5px 11px", borderRadius: 10, background: "#FFFBEB", color: "#B45309", border: "1.5px solid #FDE68A", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Nut size={12} /> Allergie{reservation.allergy_details ? ` — ${reservation.allergy_details}` : ""}
              </span>
            )}
            {reservation.has_infant && (
              <span style={{ fontSize: 12, padding: "5px 11px", borderRadius: 10, background: "#FDF2F8", color: "#BE185D", border: "1.5px solid #FBCFE8", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Baby size={12} /> Nourrisson{reservation.infant_count ? ` (${reservation.infant_count})` : ""}
              </span>
            )}
            {reservation.medical_notes && (
              <span style={{ fontSize: 12, padding: "5px 11px", borderRadius: 10, background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Heart size={12} /> {reservation.medical_notes}
              </span>
            )}
          </div>
        )}

        {/* Inclus */}
        {excursion?.includes && excursion.includes.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: .5 }}>Inclus</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {excursion.includes.map((item, i) => (
                <span key={i} style={{ fontSize: 12, padding: "4px 11px", borderRadius: 99, background: "#F0F9FF", color: "#0369A1", border: "1px solid #BAE6FD", fontWeight: 600 }}>✓ {item}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function AdminPaiementsReservationsClient({
  paiements, reservations, touristes, prestataires, excursions,
}: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "en_cours" | "annule" | "termine" | "pending" | "failed">("all");
  const [sortBy,       setSortBy]       = useState<"date" | "amount">("date");
  const [selected,     setSelected]     = useState<string | null>(null);

  const resaMap  = useMemo(() => Object.fromEntries(reservations.map(r => [r.id, r])), [reservations]);
  const tourMap  = useMemo(() => Object.fromEntries(touristes.map(t => [t.user_id, t])), [touristes]);
  const prestMap = useMemo(() => Object.fromEntries(prestataires.map(p => [p.user_id, p])), [prestataires]);
  const excMap   = useMemo(() => Object.fromEntries(excursions.map(e => [e.id, e])), [excursions]);

  const transactions = useMemo(() => paiements.map(p => {
    const resa       = resaMap[p.reservation_id] ?? null;
    const touriste   = resa ? (tourMap[(resa as any).touriste_id] ?? null) : null;
    const excursion  = resa ? (excMap[(resa as any).excursion_id] ?? null) : null;
    const prestataire = prestMap[p.prestataire_id] ?? null;
    const bizStatus  = getReservationBusinessStatus(resa, p);
    return { payment: p, reservation: resa, touriste, excursion, prestataire, bizStatus };
  }), [paiements, resaMap, tourMap, excMap, prestMap]);

  const filtered = useMemo(() => transactions.filter(({ bizStatus, touriste, excursion, reservation }) => {
    if (statusFilter !== "all" && bizStatus !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [touriste?.full_name, touriste?.email, excursion?.title, excursion?.city, (reservation as any)?.booking_code]
      .some(v => (v || "").toLowerCase().includes(q));
  }), [transactions, statusFilter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) =>
    sortBy === "amount"
      ? n(b.payment.amount) - n(a.payment.amount)
      : new Date(b.payment.created_at).getTime() - new Date(a.payment.created_at).getTime()
  ), [filtered, sortBy]);

  const kpis = useMemo(() => {
    const paid = paiements.filter(p => p.status === "paid");
    return {
      volume:     paiements.reduce((s, p) => s + n(p.amount), 0),
      commission: paid.reduce((s, p) => s + n(p.platform_fee), 0),
      net:        paid.reduce((s, p) => s + n(p.net_amount), 0),
      nbTotal:    paiements.length,
    };
  }, [paiements, reservations]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: transactions.length };
    transactions.forEach(({ bizStatus }) => { c[bizStatus] = (c[bizStatus] ?? 0) + 1; });
    return c;
  }, [transactions]);

  const selectedTx = selected ? transactions.find(t => t.payment.id === selected) : null;

  function handleExport() {
    const headers = ["Code","Client","Email","Excursion","Ville","Date excursion","Réservé le","Places","Montant (EUR)","Commission (EUR)","Net (EUR)","Statut"];
    const rows = sorted.map(({ payment, touriste, excursion, reservation, bizStatus }) => [
      (reservation as any)?.booking_code || "—",
      touriste?.full_name || "—", touriste?.email || "—",
      excursion?.title || "—", excursion?.city || "—",
      reservation ? fmtDate((reservation as any).date) : "—",
      fmtDT(payment.created_at),
      (reservation as any)?.people_count ?? "—",
      n(payment.amount).toFixed(2), n(payment.platform_fee).toFixed(2), n(payment.net_amount).toFixed(2),
      STATUS_CFG[bizStatus]?.label ?? bizStatus,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `reservations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="adm-root">
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <div className="adm-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="adm-header-icon">
            <CreditCard size={22} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="adm-title">Paiements & Réservations</h1>
            <p className="adm-subtitle">{kpis.nbTotal} transaction{kpis.nbTotal !== 1 ? "s" : ""} au total</p>
          </div>
        </div>
        <button className="adm-export-btn" onClick={handleExport}>
          <Download size={13} /> Exporter CSV
        </button>
      </div>

      {/* ══ KPIs ══ */}
      <div className="adm-kpis">
        {[
          { label: "Volume total",       value: kpis.volume,     icon: <TrendingUp size={18} />, color: "#1a3a5c", shade: "#EFF6FF", border: "#BFDBFE" },
          { label: "Commissions",        value: kpis.commission, icon: <Coins size={18} />,      color: "#4338CA", shade: "#EEF2FF", border: "#C7D2FE" },
          { label: "Reversé prestats.",  value: kpis.net,        icon: <ArrowUpRight size={18} />,color:"#065F46", shade: "#ECFDF5", border: "#A7F3D0" },
          { label: "Transactions",       value: kpis.nbTotal,    icon: <Layers size={18} />,     color: "#92400E", shade: "#FFFBEB", border: "#FDE68A", noEur: true },
        ].map((k, i) => (
          <div key={i} className="adm-kpi" style={{ background: k.shade, borderColor: k.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .6 }}>{k.label}</span>
              <span style={{ color: k.color, background: `${k.color}18`, borderRadius: 8, padding: "5px 6px", display: "flex" }}>{k.icon}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 900, color: k.color, margin: 0, lineHeight: 1 }}>
              {typeof k.value === "number" ? k.value.toLocaleString("fr-FR", k.noEur ? {} : { minimumFractionDigits: 2 }) : k.value}
              {!k.noEur && <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", marginLeft: 4 }}>EUR</span>}
            </p>
          </div>
        ))}
      </div>

      {/* ══ TOOLBAR ══ */}
      <div className="adm-toolbar">
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="adm-search" type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher client, email, excursion, code…" />
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={13} color="#94A3B8" />
          {(["all", "en_cours", "annule", "termine", "pending"] as const).map(s => {
            const cfg = s !== "all" ? STATUS_CFG[s] : null;
            const cnt = counts[s] ?? 0;
            if (s !== "all" && !cnt) return null;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`adm-pill ${active ? "adm-pill--active" : ""}`}
                style={active && cfg ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border } : {}}>
                {cfg && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />}
                {s === "all" ? "Tous" : cfg?.label}
                <span style={{ opacity: .65, fontSize: 11 }}>({cnt})</span>
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", gap: 6, borderLeft: "1px solid #E2E8F0", paddingLeft: 12 }}>
          <button className={`adm-sort ${sortBy === "date" ? "adm-sort--on" : ""}`} onClick={() => setSortBy("date")}>
            <CalendarDays size={12} /> Date
          </button>
          <button className={`adm-sort ${sortBy === "amount" ? "adm-sort--on" : ""}`} onClick={() => setSortBy("amount")}>
            <TrendingUp size={12} /> Montant
          </button>
        </div>
      </div>

      {/* Compteur + reset */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0 14px" }}>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{sorted.length} résultat{sorted.length !== 1 ? "s" : ""}</p>
        {(statusFilter !== "all" || search) && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
            style={{ fontSize: 12, color: "#0EA5E9", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* ══ TABLE ══ */}
      {sorted.length === 0 ? (
        <div className="adm-empty">
          <CreditCard size={28} color="#CBD5E1" strokeWidth={1.5} />
          <p style={{ fontWeight: 700, color: "#334155", margin: "12px 0 4px" }}>Aucune transaction trouvée</p>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>Essayez d'autres filtres</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Client</th>
                <th>Excursion</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ payment, reservation, touriste, excursion, bizStatus }, i) => {
                const cfg = STATUS_CFG[bizStatus];
                const hasAlert = reservation && (reservation.has_disability || reservation.has_allergy || reservation.has_infant || reservation.medical_notes);
                return (
                  <tr key={payment.id} className="adm-row" style={{ animationDelay: `${i * 0.03}s` }}
                    onClick={() => setSelected(payment.id)}>
                    <td>
                      <code style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", background: "#F1F5F9", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                        {(reservation as any)?.booking_code || payment.id.slice(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar url={touriste?.avatar_url} name={touriste?.full_name} size={34} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 1px", whiteSpace: "nowrap" }}>
                            {touriste?.full_name || "Client inconnu"}
                            {hasAlert && <span style={{ marginLeft: 6, color: "#F59E0B" }} title="Cas spécial">⚠</span>}
                          </p>
                          {touriste?.email && <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{touriste.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 1px", whiteSpace: "nowrap" }}>
                          {excursion?.title || "—"}
                        </p>
                        {excursion?.city && (
                          <p style={{ fontSize: 11, color: "#0EA5E9", margin: 0, display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
                            <MapPin size={10} /> {excursion.city}
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>
                      {reservation ? fmtDate(reservation.date) : "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>
                      {/* Pour une excursion, check-out = date + durée estimée */}
                      {reservation ? fmtDate(reservation.date) : "—"}
                    </td>
                    <td>
                      <StatusBadge status={bizStatus} />
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <p style={{ fontSize: 15, fontWeight: 900, color: "#0F172A", margin: 0 }}>
                        {n(payment.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                        <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 3 }}>EUR</span>
                      </p>
                      {reservation?.people_count && (
                        <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                          {reservation.people_count} pers.
                        </p>
                      )}
                    </td>
                    <td>
                      <button className="adm-view-btn" onClick={e => { e.stopPropagation(); setSelected(payment.id); }}>
                        <Eye size={13} /> Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ DRAWER DÉTAIL ══ */}
      {selectedTx && (
        <DetailDrawer
          payment={selectedTx.payment}
          reservation={selectedTx.reservation}
          touriste={selectedTx.touriste}
          excursion={selectedTx.excursion}
          prestataire={selectedTx.prestataire}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

  @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:none; } }

  .adm-root {
    max-width: 1200px; margin: 0 auto; padding: 32px 24px;
    font-family: 'DM Sans', system-ui, sans-serif; color: #0F172A;
    background: #F8FAFC; min-height: 100vh;
  }

  /* Header */
  .adm-header {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, #0F172A 0%, #1a3a5c 100%);
    border-radius: 18px; padding: 20px 24px; margin-bottom: 18px;
    animation: fadeUp .3s ease both;
    box-shadow: 0 4px 20px rgba(15,23,42,.3);
  }
  .adm-header-icon {
    width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
    background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2);
    display: flex; align-items: center; justify-content: center;
  }
  .adm-title    { font-size: 20px; font-weight: 800; color: white; margin: 0; }
  .adm-subtitle { font-size: 12px; color: rgba(255,255,255,.55); margin: 3px 0 0; }

  .adm-export-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 10px;
    background: rgba(255,255,255,.12); color: white;
    border: 1px solid rgba(255,255,255,.2);
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: inherit; transition: all .15s;
  }
  .adm-export-btn:hover { background: rgba(255,255,255,.22); }

  /* KPIs */
  .adm-kpis {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px; margin-bottom: 18px;
  }
  .adm-kpi {
    border-radius: 14px; border: 1.5px solid;
    padding: 16px 18px;
    animation: fadeUp .35s ease both;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    transition: transform .2s, box-shadow .2s;
  }
  .adm-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.08); }

  /* Toolbar */
  .adm-toolbar {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: white; border-radius: 14px;
    border: 1px solid #E2E8F0; padding: 12px 16px; margin-bottom: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    animation: fadeUp .35s ease .1s both;
  }
  .adm-search {
    width: 100%; padding: 9px 13px 9px 36px;
    border: 1.5px solid #E2E8F0; border-radius: 10px;
    font-size: 13px; font-family: inherit; outline: none;
    color: #0F172A; background: #F8FAFC; transition: all .2s; box-sizing: border-box;
  }
  .adm-search:focus { border-color: #0EA5E9; background: white; box-shadow: 0 0 0 3px rgba(14,165,233,.1); }
  .adm-search::placeholder { color: #94A3B8; }

  .adm-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 11px; border-radius: 99px;
    border: 1.5px solid #E2E8F0; background: white;
    color: #475569; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all .15s; white-space: nowrap;
  }
  .adm-pill:hover     { border-color: #CBD5E1; }
  .adm-pill--active   { }

  .adm-sort {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 9px;
    border: 1.5px solid #E2E8F0; background: white;
    color: #475569; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all .15s;
  }
  .adm-sort--on { border-color: #1a3a5c; color: #1a3a5c; background: #EFF6FF; }

  /* Table */
  .adm-table-wrap {
    background: white; border-radius: 16px;
    border: 1px solid #E2E8F0;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    overflow: hidden;
    animation: fadeUp .35s ease .15s both;
  }
  .adm-table {
    width: 100%; border-collapse: collapse;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .adm-table thead tr {
    background: #F8FAFC; border-bottom: 2px solid #E2E8F0;
  }
  .adm-table th {
    padding: 13px 16px; text-align: left;
    font-size: 11px; font-weight: 700; color: #64748B;
    text-transform: uppercase; letter-spacing: .6px; white-space: nowrap;
  }
  .adm-row {
    border-bottom: 1px solid #F1F5F9;
    cursor: pointer; transition: background .15s;
    animation: fadeUp .3s ease both;
  }
  .adm-row:last-child { border-bottom: none; }
  .adm-row:hover { background: #F8FAFC; }
  .adm-table td { padding: 14px 16px; vertical-align: middle; }

  .adm-view-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 8px;
    background: #F1F5F9; color: #475569;
    border: 1px solid #E2E8F0; font-size: 12px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all .15s; white-space: nowrap;
  }
  .adm-view-btn:hover { background: #EFF6FF; color: #0369A1; border-color: #BAE6FD; }

  /* Empty */
  .adm-empty {
    text-align: center; padding: 60px 24px;
    background: white; border-radius: 16px; border: 1px solid #E2E8F0;
  }

  @media (max-width: 768px) {
    .adm-root { padding: 16px 12px; }
    .adm-kpis { grid-template-columns: 1fr 1fr; }
    .adm-table-wrap { overflow-x: auto; }
    .adm-table { min-width: 700px; }
  }
`;