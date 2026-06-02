"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, Coins, ArrowUpRight, Search, Download,
  CalendarDays, MapPin, Mail, Phone,
  Users, Heart, Star, Layers,
  CheckCircle2, XCircle, Clock3,
  Eye, Filter, Timer,
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
  payment_status: string;
  payment_method?: string | null;
  excursion_id: string;
  touriste_id: string;
  itineraire_id?: string | null;
  created_at: string;
  payment_deadline?: string | null;
  paid_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  special_needs?: string | null;
  special_notes?: string | null;
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
const n = (v: number | string | undefined | null) => Number(v) || 0;

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
 * Calcule le statut métier final.
 *
 * La plateforme fonctionne ainsi :
 *  1. Touriste réserve → reservation créée (status:"pending", payment_status:"unpaid")
 *     Aucune ligne dans `paiements` à ce stade.
 *  2. Si paiement dans l'heure → payment_status devient "paid", une ligne est créée dans `paiements`
 *  3. Sinon → auto-cancel → status:"cancelled", payment_status:"expired"
 *
 * Donc on s'appuie sur reservation.payment_status et reservation.status,
 * PAS sur la présence d'un enregistrement dans paiements.
 */
function getBizStatus(reservation: Reservation): "en_attente" | "en_cours" | "termine" | "annule" | "rembourse" {
  const resaStatus    = (reservation.status || "").toLowerCase();
  const paymentStatus = (reservation.payment_status || "").toLowerCase();

  if (resaStatus === "cancelled" || resaStatus === "annulé" || resaStatus === "annule" || paymentStatus === "expired") {
    return "annule";
  }
  if (paymentStatus === "refunded") return "rembourse";
  if (paymentStatus !== "paid") return "en_attente";

  const now      = new Date();
  const excDate  = new Date(reservation.date.includes("T") ? reservation.date : reservation.date + "T00:00:00");
  return excDate < now ? "termine" : "en_cours";
}

type BizStatus = "en_attente" | "en_cours" | "termine" | "annule" | "rembourse";

const STATUS_CFG: Record<BizStatus, { label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode }> = {
  en_attente: { label: "En attente",  color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", icon: <Timer size={12} /> },
  en_cours:   { label: "En cours",    color: "#0369A1", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", icon: <Clock3 size={12} /> },
  termine:    { label: "Terminé",     color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", dot: "#10B981", icon: <CheckCircle2 size={12} /> },
  annule:     { label: "Annulé",      color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444", icon: <XCircle size={12} /> },
  rembourse:  { label: "Remboursé",   color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE", dot: "#8B5CF6", icon: <ArrowUpRight size={12} /> },
};

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
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "white" }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: BizStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ color: cfg.dot, display: "flex" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────
function DetailDrawer({ reservation, payment, touriste, excursion, bizStatus, onClose }: {
  reservation: Reservation;
  payment: Paiement | null;
  touriste: TouristeProfile | null;
  excursion: Excursion | null;
  bizStatus: BizStatus;
  onClose: () => void;
}) {
  const total = n(reservation.total_price);
  const fee   = n(reservation.platform_fee);
  const net   = total - fee;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto", padding: "28px 28px 40px", animation: "slideUp .25s ease both", boxShadow: "0 -8px 40px rgba(0,0,0,.2)" }}>
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 99, margin: "0 auto 24px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <Avatar url={touriste?.avatar_url} name={touriste?.full_name} size={48} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>{touriste?.full_name || "Client inconnu"}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {touriste?.email && <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}><Mail size={11} /> {touriste.email}</span>}
              {touriste?.phone && <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} /> {touriste.phone}</span>}
            </div>
          </div>
          <StatusBadge status={bizStatus} />
        </div>

        {/* Alerte délai paiement */}
        {bizStatus === "en_attente" && reservation.payment_deadline && (
          <div style={{ display: "flex", gap: 8, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400E", fontWeight: 600 }}>
            <Timer size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Délai de paiement expire le <strong>{fmtDT(reservation.payment_deadline)}</strong> — sera annulée automatiquement si non payée.</span>
          </div>
        )}

        {/* Motif annulation */}
        {bizStatus === "annule" && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#DC2626" }}>
            <strong>Annulé</strong>{reservation.cancel_reason ? ` — ${reservation.cancel_reason}` : (reservation.payment_status === "expired" ? " — délai de paiement expiré" : "")}
          </div>
        )}

        {/* Excursion */}
        {excursion && (
          <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "14px 16px", marginBottom: 18, border: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: .6, margin: "0 0 8px" }}>Excursion</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {excursion.photo_url
                ? <img src={excursion.photo_url} alt={excursion.title} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: 10, background: "linear-gradient(135deg,#1a3a5c,#0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MapPin size={20} color="white" /></div>
              }
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: "0 0 3px" }}>{excursion.title}</p>
                <span style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 600 }}><MapPin size={10} style={{ display: "inline" }} /> {excursion.city}</span>
                {excursion.duration && <span style={{ fontSize: 11, color: "#64748B" }}> · {excursion.duration}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Grille infos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Code réservation", value: reservation.booking_code, mono: true },
            { label: "Date excursion",   value: fmtDate(reservation.date) },
            { label: "Heure",            value: reservation.time || "—" },
            { label: "Réservé le",       value: fmtDT(reservation.created_at) },
            { label: "Voyageurs",        value: `${reservation.people_count} pers.` },
            { label: "Statut paiement",  value: reservation.payment_status || "—" },
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
                {total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#64748B", marginLeft: 4 }}>EUR</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>
                Net : {(payment ? n(payment.net_amount) : net).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                Commission : {fee.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} EUR
              </div>
            </div>
          </div>
          {!payment && bizStatus === "en_attente" && (
            <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 10, fontWeight: 600 }}>⚠ Paiement non encore effectué</p>
          )}
          {payment?.transaction_ref && (
            <p style={{ fontSize: 10, color: "#475569", marginTop: 12, fontFamily: "monospace" }}>Réf. {payment.transaction_ref}</p>
          )}
        </div>

        {/* Cas spéciaux */}
        {(reservation.special_needs || reservation.special_notes) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {reservation.special_needs && (
              <span style={{ fontSize: 12, padding: "5px 11px", borderRadius: 10, background: "#FDF2F8", color: "#BE185D", border: "1.5px solid #FBCFE8", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Star size={12} /> {reservation.special_needs}
              </span>
            )}
            {reservation.special_notes && (
              <span style={{ fontSize: 12, padding: "5px 11px", borderRadius: 10, background: "#FFFBEB", color: "#B45309", border: "1.5px solid #FDE68A", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Heart size={12} /> {reservation.special_notes}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function AdminPaiementsReservationsClient({ paiements, reservations, touristes, prestataires, excursions }: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BizStatus>("all");
  const [sortBy,       setSortBy]       = useState<"date" | "amount">("date");
  const [selected,     setSelected]     = useState<string | null>(null);

  const tourMap      = useMemo(() => Object.fromEntries(touristes.map(t => [t.user_id, t])), [touristes]);
  const excMap       = useMemo(() => Object.fromEntries(excursions.map(e => [e.id, e])), [excursions]);
  const prestMap     = useMemo(() => Object.fromEntries(prestataires.map(p => [p.user_id, p])), [prestataires]);

  // FIX PRINCIPAL : index des paiements par reservation_id
  const payByResaId  = useMemo(() => {
    const m: Record<string, Paiement> = {};
    paiements.forEach(p => { if (p.reservation_id) m[p.reservation_id] = p; });
    return m;
  }, [paiements]);

  // Enrichissement : chaque réservation est affichée, paiement optionnel
  const transactions = useMemo(() => reservations.map(r => {
    const payment     = payByResaId[r.id] ?? null;
    const touriste    = tourMap[r.touriste_id] ?? null;   // FIX: touriste_id sur la réservation
    const excursion   = excMap[r.excursion_id] ?? null;
    const prestataire = payment ? (prestMap[payment.prestataire_id] ?? null) : null;
    const bizStatus   = getBizStatus(r);
    return { reservation: r, payment, touriste, excursion, prestataire, bizStatus };
  }), [reservations, payByResaId, tourMap, excMap, prestMap]);

  const filtered = useMemo(() => transactions.filter(({ bizStatus, touriste, excursion, reservation }) => {
    if (statusFilter !== "all" && bizStatus !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [touriste?.full_name, touriste?.email, excursion?.title, excursion?.city, reservation.booking_code].some(v => (v || "").toLowerCase().includes(q));
  }), [transactions, statusFilter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) =>
    sortBy === "amount"
      ? n(b.reservation.total_price) - n(a.reservation.total_price)
      : new Date(b.reservation.created_at).getTime() - new Date(a.reservation.created_at).getTime()
  ), [filtered, sortBy]);

  const kpis = useMemo(() => {
    const paid = transactions.filter(t => t.bizStatus === "termine" || t.bizStatus === "en_cours");
    return {
      volume:     paid.reduce((s, t) => s + n(t.reservation.total_price), 0),
      commission: paid.reduce((s, t) => s + n(t.reservation.platform_fee), 0),
      nbTotal:    transactions.length,
      nbPending:  transactions.filter(t => t.bizStatus === "en_attente").length,
    };
  }, [transactions]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: transactions.length };
    transactions.forEach(({ bizStatus }) => { c[bizStatus] = (c[bizStatus] ?? 0) + 1; });
    return c;
  }, [transactions]);

  const selectedTx = selected ? transactions.find(t => t.reservation.id === selected) : null;

  function handleExport() {
    const headers = ["Code", "Client", "Email", "Excursion", "Ville", "Date", "Places", "Montant EUR", "Commission EUR", "Statut"];
    const rows = sorted.map(({ reservation, touriste, excursion, bizStatus }) => [
      reservation.booking_code || "—",
      touriste?.full_name || "—", touriste?.email || "—",
      excursion?.title || "—", excursion?.city || "—",
      fmtDate(reservation.date),
      reservation.people_count,
      n(reservation.total_price).toFixed(2),
      n(reservation.platform_fee).toFixed(2),
      STATUS_CFG[bizStatus]?.label,
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

      {/* HEADER */}
      <div className="adm-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="adm-header-icon"><Timer size={22} color="white" strokeWidth={1.8} /></div>
          <div>
            <h1 className="adm-title">Paiements & Réservations</h1>
            <p className="adm-subtitle">
              {kpis.nbTotal} réservation{kpis.nbTotal !== 1 ? "s" : ""} · {kpis.nbPending} en attente de paiement
            </p>
          </div>
        </div>
        <button className="adm-export-btn" onClick={handleExport}><Download size={13} /> Exporter CSV</button>
      </div>

      {/* KPIs */}
      <div className="adm-kpis">
        {[
          { label: "Volume encaissé",    value: kpis.volume,     icon: <TrendingUp size={18} />, color: "#1a3a5c", shade: "#EFF6FF", border: "#BFDBFE", eur: true },
          { label: "Commissions",        value: kpis.commission, icon: <Coins size={18} />,      color: "#4338CA", shade: "#EEF2FF", border: "#C7D2FE", eur: true },
          { label: "Total réservations", value: kpis.nbTotal,    icon: <Layers size={18} />,     color: "#92400E", shade: "#FFFBEB", border: "#FDE68A", eur: false },
          { label: "En attente paiement",value: kpis.nbPending,  icon: <Timer size={18} />,      color: "#B45309", shade: "#FFFBEB", border: "#FDE68A", eur: false },
        ].map((k, i) => (
          <div key={i} className="adm-kpi" style={{ background: k.shade, borderColor: k.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .6 }}>{k.label}</span>
              <span style={{ color: k.color, background: `${k.color}18`, borderRadius: 8, padding: "5px 6px", display: "flex" }}>{k.icon}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 900, color: k.color, margin: 0 }}>
              {k.value.toLocaleString("fr-FR", k.eur ? { minimumFractionDigits: 2 } : {})}
              {k.eur && <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", marginLeft: 4 }}>EUR</span>}
            </p>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="adm-toolbar">
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="adm-search" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Code, client, email, excursion…" />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={13} color="#94A3B8" />
          {(["all", "en_attente", "en_cours", "termine", "annule", "rembourse"] as const).map(s => {
            const cfg = s !== "all" ? STATUS_CFG[s] : null;
            const cnt = counts[s] ?? 0;
            if (s !== "all" && !cnt) return null;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} className={`adm-pill ${active ? "adm-pill--active" : ""}`}
                style={active && cfg ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border } : {}}>
                {cfg && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />}
                {s === "all" ? "Tous" : cfg?.label}
                <span style={{ opacity: .65, fontSize: 11 }}>({cnt})</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, borderLeft: "1px solid #E2E8F0", paddingLeft: 12 }}>
          <button className={`adm-sort ${sortBy === "date" ? "adm-sort--on" : ""}`} onClick={() => setSortBy("date")}><CalendarDays size={12} /> Date</button>
          <button className={`adm-sort ${sortBy === "amount" ? "adm-sort--on" : ""}`} onClick={() => setSortBy("amount")}><TrendingUp size={12} /> Montant</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "10px 0 14px" }}>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{sorted.length} résultat{sorted.length !== 1 ? "s" : ""}</p>
        {(statusFilter !== "all" || search) && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
            style={{ fontSize: 12, color: "#0EA5E9", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* TABLE */}
      {sorted.length === 0 ? (
        <div className="adm-empty">
          <Timer size={28} color="#CBD5E1" strokeWidth={1.5} />
          <p style={{ fontWeight: 700, color: "#334155", margin: "12px 0 4px" }}>Aucune réservation trouvée</p>
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
                <th>Date</th>
                <th>Voyageurs</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ reservation, touriste, excursion, bizStatus }, i) => (
                <tr key={reservation.id} className="adm-row" style={{ animationDelay: `${i * 0.03}s` }} onClick={() => setSelected(reservation.id)}>
                  <td>
                    <code style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", background: "#F1F5F9", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                      {reservation.booking_code || reservation.id.slice(0, 8).toUpperCase()}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar url={touriste?.avatar_url} name={touriste?.full_name} size={34} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 1px", whiteSpace: "nowrap" }}>
                          {touriste?.full_name || "Client inconnu"}
                          {(reservation.special_needs || reservation.special_notes) && <span style={{ marginLeft: 6, color: "#F59E0B" }}>⚠</span>}
                        </p>
                        {touriste?.email && <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{touriste.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: "0 0 1px", whiteSpace: "nowrap" }}>{excursion?.title || "—"}</p>
                    {excursion?.city && <p style={{ fontSize: 11, color: "#0EA5E9", margin: 0, display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}><MapPin size={10} /> {excursion.city}</p>}
                  </td>
                  <td style={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>
                    <div>{fmtDate(reservation.date)}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{reservation.time || ""}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#475569" }}>
                      <Users size={12} color="#94A3B8" /> {reservation.people_count}
                    </div>
                  </td>
                  <td><StatusBadge status={bizStatus} /></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color: "#0F172A", margin: 0 }}>
                      {n(reservation.total_price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                      <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 3 }}>EUR</span>
                    </p>
                  </td>
                  <td>
                    <button className="adm-view-btn" onClick={e => { e.stopPropagation(); setSelected(reservation.id); }}>
                      <Eye size={13} /> Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTx && (
        <DetailDrawer
          reservation={selectedTx.reservation}
          payment={selectedTx.payment}
          touriste={selectedTx.touriste}
          excursion={selectedTx.excursion}
          bizStatus={selectedTx.bizStatus}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

const CSS = `
  @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:none; } }
  .adm-root { max-width:1200px; margin:0 auto; padding:32px 24px; font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:#0F172A; background:#F8FAFC; min-height:100vh; }
  .adm-header { display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#0F172A 0%,#1a3a5c 100%); border-radius:18px; padding:20px 24px; margin-bottom:18px; animation:fadeUp .3s ease both; box-shadow:0 4px 20px rgba(15,23,42,.3); }
  .adm-header-icon { width:46px; height:46px; border-radius:13px; flex-shrink:0; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; }
  .adm-title { font-size:20px; font-weight:800; color:white; margin:0; }
  .adm-subtitle { font-size:12px; color:rgba(255,255,255,.55); margin:3px 0 0; }
  .adm-export-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:10px; background:rgba(255,255,255,.12); color:white; border:1px solid rgba(255,255,255,.2); font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .adm-export-btn:hover { background:rgba(255,255,255,.22); }
  .adm-kpis { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:12px; margin-bottom:18px; }
  .adm-kpi { border-radius:14px; border:1.5px solid; padding:16px 18px; animation:fadeUp .35s ease both; box-shadow:0 1px 4px rgba(0,0,0,.04); transition:transform .2s,box-shadow .2s; }
  .adm-kpi:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.08); }
  .adm-toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; background:white; border-radius:14px; border:1px solid #E2E8F0; padding:12px 16px; margin-bottom:8px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
  .adm-search { width:100%; padding:9px 13px 9px 36px; border:1.5px solid #E2E8F0; border-radius:10px; font-size:13px; font-family:inherit; outline:none; color:#0F172A; background:#F8FAFC; transition:all .2s; box-sizing:border-box; }
  .adm-search:focus { border-color:#0EA5E9; background:white; box-shadow:0 0 0 3px rgba(14,165,233,.1); }
  .adm-search::placeholder { color:#94A3B8; }
  .adm-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:99px; border:1.5px solid #E2E8F0; background:white; color:#475569; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap; }
  .adm-sort { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:9px; border:1.5px solid #E2E8F0; background:white; color:#475569; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
  .adm-sort--on { border-color:#1a3a5c; color:#1a3a5c; background:#EFF6FF; }
  .adm-table-wrap { background:white; border-radius:16px; border:1px solid #E2E8F0; box-shadow:0 1px 4px rgba(0,0,0,.05); overflow:hidden; animation:fadeUp .35s ease .15s both; }
  .adm-table { width:100%; border-collapse:collapse; font-family:'DM Sans',system-ui,sans-serif; }
  .adm-table thead tr { background:#F8FAFC; border-bottom:2px solid #E2E8F0; }
  .adm-table th { padding:13px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.6px; white-space:nowrap; }
  .adm-row { border-bottom:1px solid #F1F5F9; cursor:pointer; transition:background .15s; animation:fadeUp .3s ease both; }
  .adm-row:last-child { border-bottom:none; }
  .adm-row:hover { background:#F8FAFC; }
  .adm-table td { padding:14px 16px; vertical-align:middle; }
  .adm-view-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px; background:#F1F5F9; color:#475569; border:1px solid #E2E8F0; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap; }
  .adm-view-btn:hover { background:#EFF6FF; color:#0369A1; border-color:#BAE6FD; }
  .adm-empty { text-align:center; padding:60px 24px; background:white; border-radius:16px; border:1px solid #E2E8F0; }
  @media (max-width:768px) { .adm-root { padding:16px 12px; } .adm-kpis { grid-template-columns:1fr 1fr; } .adm-table-wrap { overflow-x:auto; } .adm-table { min-width:700px; } }
`;