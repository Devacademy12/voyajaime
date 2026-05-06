"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, Coins, ArrowUpRight, Search, Download,
  CalendarDays, Clock, MapPin, Mail, Phone, Hash,
  Users, ChevronDown, ChevronUp, AlertTriangle,
  Accessibility, Nut, Heart, Baby, BarChart3,
  CreditCard, Building2, Star, Layers,
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

// ─── Configs ──────────────────────────────────────────────────────────
const PAY_CFG = {
  paid:     { label: "Payé",        color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", dot: "#10B981" },
  pending:  { label: "En attente",  color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" },
  refunded: { label: "Remboursé",   color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE", dot: "#8B5CF6" },
  failed:   { label: "Échoué",      color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────
const n = (v: number | string) => Number(v) || 0;

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function fmtShort(d: string) {
  if (!d) return "—";
  return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function fmtDT(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────
function Avatar({ url, name, size = 48 }: { url?: string | null; name?: string | null; size?: number }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const [err, setErr] = useState(false);
  if (url && !err) return (
    <img
      src={url} alt={name || ""}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2.5px solid white", boxShadow: "0 2px 8px rgba(0,0,0,.12)" }}
    />
  );
  const colors = ["#0EA5E9","#8B5CF6","#EC4899","#F59E0B","#10B981","#EF4444","#6366F1"];
  const color  = colors[(name || "?").charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.36, fontWeight: 800,
      color: "white", border: "2.5px solid white",
      boxShadow: "0 2px 8px rgba(0,0,0,.15)", letterSpacing: -0.5,
    }}>{initials}</div>
  );
}

// ─── Badge Cas Spécial ────────────────────────────────────────────────
function SpecialBadge({ icon, label, detail, color, bg, border }: {
  icon: React.ReactNode; label: string; detail?: string | null;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px", borderRadius: 10,
      background: bg, border: `1.5px solid ${border}`,
      fontSize: 12, fontWeight: 600, color,
    }}>
      <span style={{ color, display: "flex" }}>{icon}</span>
      <span>{label}{detail ? ` — ${detail}` : ""}</span>
    </div>
  );
}

// ─── Carte Transaction ────────────────────────────────────────────────
function TransactionCard({ payment, reservation, touriste, excursion, prestataire, index }: {
  payment: Paiement;
  reservation: Reservation | null;
  touriste: TouristeProfile | null;
  excursion: Excursion | null;
  prestataire: PrestataireProfile | null;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const pay = PAY_CFG[payment.status] ?? PAY_CFG.pending;

  const hasSpecial = reservation && (
    reservation.has_disability || reservation.has_allergy ||
    reservation.has_infant || reservation.special_requests ||
    reservation.medical_notes
  );

  const netPct = n(payment.amount) > 0
    ? Math.round((n(payment.net_amount) / n(payment.amount)) * 100) : 0;

  return (
    <article className="txn-card" style={{ animationDelay: `${index * 0.05}s` }}>

      {/* ── Bande colorée statut ── */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        borderRadius: "16px 0 0 16px",
        background: `linear-gradient(180deg, ${pay.dot}, ${pay.dot}88)`,
      }} />

      {/* ── Alerte cas spécial ── */}
      {hasSpecial && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FFFBEB", border: "1px solid #FDE68A",
          borderRadius: 10, padding: "7px 12px", marginBottom: 14,
          fontSize: 12, color: "#92400E", fontWeight: 600,
        }}>
          <AlertTriangle size={14} color="#F59E0B" />
          Cas particulier — vérifier les besoins spéciaux avant confirmation
        </div>
      )}

      {/* ── Corps principal ── */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Avatar + statut */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Avatar url={touriste?.avatar_url} name={touriste?.full_name} size={52} />
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px",
            borderRadius: 99, background: pay.bg,
            color: pay.color, border: `1px solid ${pay.border}`,
            whiteSpace: "nowrap",
          }}>{pay.label}</span>
        </div>

        {/* Infos client */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: "0 0 4px" }}>
              {touriste?.full_name || "Client inconnu"}
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {touriste?.email && (
                <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 5 }}>
                  <Mail size={12} color="#94A3B8" /> {touriste.email}
                </span>
              )}
              {touriste?.phone && (
                <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 5 }}>
                  <Phone size={12} color="#94A3B8" /> {touriste.phone}
                </span>
              )}
            </div>
          </div>

          {/* Détails réservation */}
          {reservation && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 8,
            }}>
              {[
                { icon: <Hash size={11} />,         label: "Code",       value: reservation.booking_code, mono: true },
                { icon: <CalendarDays size={11} />,  label: "Excursion",  value: fmtDate(reservation.date) },
                { icon: <Clock size={11} />,          label: "Heure",      value: reservation.time || "—" },
                { icon: <Clock size={11} />,          label: "Réservé le", value: fmtShort(reservation.created_at) },
                { icon: <Users size={11} />,          label: "Places",     value: `${reservation.people_count} personne${reservation.people_count > 1 ? "s" : ""}` },
              ].map((item, i) => (
                <div key={i} style={{
                  background: "#F8FAFC", borderRadius: 10,
                  padding: "8px 11px", border: "1px solid #F1F5F9",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94A3B8", marginBottom: 3 }}>
                    {item.icon}
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{item.label}</span>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: "#0F172A",
                    fontFamily: item.mono ? "monospace" : "inherit",
                  }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Badges cas spéciaux */}
          {hasSpecial && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {reservation?.has_disability && (
                <SpecialBadge icon={<Accessibility size={13} />} label="Handicap"
                  detail={reservation.disability_details}
                  color="#1D4ED8" bg="#EFF6FF" border="#BFDBFE" />
              )}
              {reservation?.has_allergy && (
                <SpecialBadge icon={<Nut size={13} />} label="Allergie"
                  detail={reservation.allergy_details}
                  color="#B45309" bg="#FFFBEB" border="#FDE68A" />
              )}
              {reservation?.has_infant && (
                <SpecialBadge icon={<Baby size={13} />}
                  label={`Nourrisson${(reservation.infant_count ?? 0) > 1 ? "s" : ""}`}
                  detail={reservation.infant_count ? `${reservation.infant_count}` : null}
                  color="#BE185D" bg="#FDF2F8" border="#FBCFE8" />
              )}
              {reservation?.medical_notes && (
                <SpecialBadge icon={<Heart size={13} />} label="Note médicale"
                  detail={reservation.medical_notes}
                  color="#DC2626" bg="#FEF2F2" border="#FECACA" />
              )}
              {reservation?.special_requests && !reservation?.has_disability && !reservation?.has_allergy && (
                <SpecialBadge icon={<Star size={13} />} label="Demande spéciale"
                  detail={reservation.special_requests}
                  color="#0369A1" bg="#F0F9FF" border="#BAE6FD" />
              )}
            </div>
          )}
        </div>

        {/* Colonne droite : montants */}
        <div style={{ flexShrink: 0, minWidth: 160, textAlign: "right" }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: "0 0 2px", lineHeight: 1 }}>
            {n(payment.amount).toLocaleString("fr-FR")}
            <span style={{ fontSize: 13, fontWeight: 500, color: "#94A3B8" }}> TND</span>
          </p>
          <p style={{ fontSize: 12, color: "#10B981", fontWeight: 700, margin: "4px 0 2px" }}>
            Net : {n(payment.net_amount).toLocaleString("fr-FR")} TND
          </p>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
            Commission : {n(payment.platform_fee).toLocaleString("fr-FR")} TND
          </p>

          {/* Barre net/total */}
          <div style={{ marginTop: 10, height: 5, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${netPct}%`,
              background: "linear-gradient(90deg,#10B981,#059669)",
              borderRadius: 99, transition: "width .6s ease",
            }} />
          </div>
          <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 3, textAlign: "right" }}>
            {netPct}% reversé
          </p>
        </div>
      </div>

      {/* ── Bandeau Excursion ── */}
      {excursion && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "12px 16px",
              background: open ? "#F0F9FF" : "#F8FAFC",
              border: `1.5px solid ${open ? "#BAE6FD" : "#E2E8F0"}`,
              borderRadius: open ? "14px 14px 0 0" : 14,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all .2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {excursion.photo_url ? (
                <img src={excursion.photo_url} alt={excursion.title} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#0EA5E9,#0284C7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={18} color="white" strokeWidth={1.8} />
                </div>
              )}
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: 0 }}>{excursion.title}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "#0EA5E9", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                    <MapPin size={10} /> {excursion.city}
                  </span>
                  {excursion.duration && <span style={{ fontSize: 11, color: "#64748B" }}>· {excursion.duration}</span>}
                  {excursion.difficulty && <span style={{ fontSize: 11, color: "#64748B" }}>· {excursion.difficulty}</span>}
                  {prestataire && (
                    <span style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 3 }}>
                      · <Building2 size={10} /> {prestataire.agency_name || prestataire.full_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0EA5E9", fontSize: 12, fontWeight: 700 }}>
              {open ? "Réduire" : "Voir détails"}
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {/* Détails étendus */}
          {open && (
            <div style={{
              border: "1.5px solid #BAE6FD", borderTop: "none",
              borderRadius: "0 0 14px 14px", padding: "16px",
              background: "#F0F9FF",
            }}>
              {excursion.description && (
                <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, margin: "0 0 14px" }}>
                  {excursion.description}
                </p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Montant total",   value: `${n(payment.amount)} TND`,       color: "#0F172A" },
                  { label: "Commission",      value: `${n(payment.platform_fee)} TND`,  color: "#F59E0B" },
                  { label: "Net prestataire", value: `${n(payment.net_amount)} TND`,   color: "#059669" },
                  { label: "Nombre de places",value: `${reservation?.people_count ?? "—"}`, color: "#0EA5E9" },
                  ...(excursion.max_people ? [{ label: "Capacité max", value: `${excursion.max_people} pers.`, color: "#64748B" }] : []),
                  ...(excursion.price_per_person ? [{ label: "Prix / pers.", value: `${excursion.price_per_person} TND`, color: "#64748B" }] : []),
                ].map((item, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 10, padding: "9px 12px", border: "1px solid #E0F2FE" }}>
                    <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: .4 }}>{item.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: item.color, margin: "3px 0 0" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {excursion.includes && excursion.includes.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 7, textTransform: "uppercase", letterSpacing: .5 }}>Inclus dans l'excursion</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {excursion.includes.map((item, i) => (
                      <span key={i} style={{
                        fontSize: 12, padding: "4px 11px", borderRadius: 99,
                        background: "white", color: "#0369A1",
                        border: "1px solid #BAE6FD", fontWeight: 600,
                      }}>✓ {item}</span>
                    ))}
                  </div>
                </div>
              )}

              {payment.transaction_ref && (
                <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 12, fontFamily: "monospace" }}>
                  Réf. : {payment.transaction_ref}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function AdminPaiementsReservationsClient({
  paiements, reservations, touristes, prestataires, excursions,
}: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Paiement["status"]>("all");
  const [sortBy,       setSortBy]       = useState<"date" | "amount">("date");
  const [showChart,    setShowChart]    = useState(false);

  const resaMap  = useMemo(() => Object.fromEntries(reservations.map(r => [r.id, r])), [reservations]);
  const tourMap  = useMemo(() => Object.fromEntries(touristes.map(t => [t.user_id, t])), [touristes]);
  const prestMap = useMemo(() => Object.fromEntries(prestataires.map(p => [p.user_id, p])), [prestataires]);
  const excMap   = useMemo(() => Object.fromEntries(excursions.map(e => [e.id, e])), [excursions]);

  const transactions = useMemo(() => paiements.map(p => {
    const resa      = resaMap[p.reservation_id] ?? null;
    const touriste  = resa ? (tourMap[(resa as any).touriste_id] ?? null) : null;
    const excursion = resa ? (excMap[(resa as any).excursion_id] ?? null) : null;
    const prestataire = prestMap[p.prestataire_id] ?? null;
    return { payment: p, reservation: resa, touriste, excursion, prestataire };
  }), [paiements, resaMap, tourMap, excMap, prestMap]);

  const filtered = useMemo(() => transactions.filter(({ payment, touriste, excursion, reservation }) => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
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
      nbPaid:     paid.length,
      nbPending:  paiements.filter(p => p.status === "pending").length,
      nbSpecial:  reservations.filter(r => r.has_disability || r.has_allergy || r.has_infant || r.medical_notes).length,
    };
  }, [paiements, reservations]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: paiements.length };
    paiements.forEach(p => { c[p.status] = (c[p.status] ?? 0) + 1; });
    return c;
  }, [paiements]);

  const chartData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of paiements) {
      const key = new Date(p.created_at).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      m[key] = (m[key] ?? 0) + n(p.amount);
    }
    return Object.entries(m).slice(-6);
  }, [paiements]);

  function handleExport() {
    const headers = ["Date","Client","Email","Téléphone","Excursion","Ville","Date excursion","Heure","Places","Montant","Commission","Net","Statut","Code","Handicap","Allergie","Note médicale"];
    const rows = sorted.map(({ payment, touriste, excursion, reservation }) => [
      fmtDT(payment.created_at),
      touriste?.full_name || "—", touriste?.email || "—", touriste?.phone || "—",
      excursion?.title || "—", excursion?.city || "—",
      reservation ? fmtDate((reservation as any).date) : "—",
      (reservation as any)?.time || "—",
      (reservation as any)?.people_count ?? "—",
      n(payment.amount), n(payment.platform_fee), n(payment.net_amount),
      PAY_CFG[payment.status]?.label ?? payment.status,
      (reservation as any)?.booking_code || "—",
      (reservation as any)?.has_disability ? ((reservation as any).disability_details || "Oui") : "Non",
      (reservation as any)?.has_allergy ? ((reservation as any).allergy_details || "Oui") : "Non",
      (reservation as any)?.medical_notes || "—",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="apr-root">
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <div className="apr-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="apr-header-icon">
            <CreditCard size={24} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="apr-title">Paiements & Réservations</h1>
            <p className="apr-subtitle">
              {paiements.length} transaction{paiements.length !== 1 ? "s" : ""} ·
              {kpis.nbPaid} payée{kpis.nbPaid !== 1 ? "s" : ""} ·
              {kpis.nbPending} en attente
              {kpis.nbSpecial > 0 && <span className="apr-special-badge">⚠ {kpis.nbSpecial} cas spécial{kpis.nbSpecial > 1 ? "s" : ""}</span>}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className={`apr-btn ${showChart ? "apr-btn--active" : ""}`} onClick={() => setShowChart(v => !v)}>
            <BarChart3 size={14} /> Graphique
          </button>
          <button className="apr-btn apr-btn--primary" onClick={handleExport}>
            <Download size={14} /> Exporter CSV
          </button>
        </div>
      </div>

      {/* ══ KPIs ══ */}
      <div className="apr-kpis">
        {[
          { label: "Volume total",          value: kpis.volume,      suffix: "TND", icon: <TrendingUp size={20} />,  color: "#0EA5E9", shade: "#F0F9FF", border: "#BAE6FD" },
          { label: "Commissions",           value: kpis.commission,  suffix: "TND", icon: <Coins size={20} />,       color: "#8B5CF6", shade: "#F5F3FF", border: "#DDD6FE" },
          { label: "Reversé prestataires",  value: kpis.net,         suffix: "TND", icon: <ArrowUpRight size={20} />,color: "#059669", shade: "#ECFDF5", border: "#A7F3D0" },
          { label: "Transactions",          value: paiements.length, suffix: "",    icon: <Layers size={20} />,      color: "#F59E0B", shade: "#FFFBEB", border: "#FDE68A" },
        ].map((k, i) => (
          <div key={i} className="apr-kpi-card" style={{ borderColor: k.border, background: k.shade }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p className="apr-kpi-label">{k.label}</p>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                {k.icon}
              </div>
            </div>
            <p className="apr-kpi-value" style={{ color: k.color }}>
              {typeof k.value === "number" ? k.value.toLocaleString("fr-FR") : k.value}
              {k.suffix && <span className="apr-kpi-suffix"> {k.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* ══ GRAPHIQUE ══ */}
      {showChart && chartData.length > 0 && (
        <div className="apr-chart-card">
          <h3 className="apr-chart-title">Revenus mensuels</h3>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100, padding: "0 4px" }}>
            {(() => {
              const maxV = Math.max(...chartData.map(([, v]) => v), 1);
              return chartData.map(([month, val]) => (
                <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>{val.toLocaleString("fr-FR")}</span>
                  <div style={{ width: "100%", height: `${(val / maxV) * 90}%`, minHeight: 6, background: "linear-gradient(to top,#0EA5E9,#38BDF8)", borderRadius: "5px 5px 0 0" }} />
                  <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{month}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ══ FILTRES ══ */}
      <div className="apr-toolbar">
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="apr-search" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher client, email, excursion, code…" />
        </div>

        {/* Status */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "paid", "pending", "refunded", "failed"] as const).map(s => {
            const cfg = s !== "all" ? PAY_CFG[s] : null;
            const count = counts[s] ?? 0;
            if (s !== "all" && !count) return null;
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)} className={`apr-pill ${active ? "apr-pill--active" : ""}`}
                style={active && cfg ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border } : {}}>
                {cfg && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />}
                {s === "all" ? "Tous" : cfg?.label} <span style={{ opacity: .65 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", gap: 6 }}>
          <button className={`apr-sort ${sortBy === "date" ? "apr-sort--active" : ""}`} onClick={() => setSortBy("date")}>
            <CalendarDays size={12} /> Date
          </button>
          <button className={`apr-sort ${sortBy === "amount" ? "apr-sort--active" : ""}`} onClick={() => setSortBy("amount")}>
            <TrendingUp size={12} /> Montant
          </button>
        </div>
      </div>

      {/* Compteur */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 16px" }}>
        <p style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500, margin: 0 }}>
          {sorted.length} résultat{sorted.length !== 1 ? "s" : ""}
        </p>
        {(statusFilter !== "all" || search) && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="apr-reset">
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* ══ LISTE ══ */}
      {sorted.length === 0 ? (
        <div className="apr-empty">
          <div className="apr-empty-icon"><CreditCard size={28} color="#CBD5E1" strokeWidth={1.5} /></div>
          <p style={{ fontWeight: 700, color: "#334155", fontSize: 16, margin: "0 0 6px" }}>Aucune transaction trouvée</p>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: 0 }}>Essayez d'autres filtres ou termes de recherche</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sorted.map(({ payment, reservation, touriste, excursion, prestataire }, i) => (
            <TransactionCard
              key={payment.id}
              payment={payment}
              reservation={reservation as Reservation | null}
              touriste={touriste}
              excursion={excursion}
              prestataire={prestataire}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: none; }
  }

  .apr-root {
    max-width: 1160px;
    margin: 0 auto;
    padding: 36px 28px;
    font-family: 'Inter', system-ui, sans-serif;
    color: #0F172A;
  }

  /* Header */
  .apr-header {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
    background: white; border-radius: 20px;
    border: 1px solid #E2E8F0; padding: 22px 26px;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
    animation: fadeUp .3s ease both;
  }
  .apr-header-icon {
    width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
    background: linear-gradient(135deg,#0EA5E9,#0369A1);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(14,165,233,.35);
  }
  .apr-title  { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; }
  .apr-subtitle { font-size: 13px; color: #64748B; margin: 3px 0 0; display: flex; align-items: center; gap: 10px; }
  .apr-special-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 9px; border-radius: 99px;
    background: #FFFBEB; color: #B45309;
    border: 1px solid #FDE68A; font-weight: 700; font-size: 11px;
  }

  /* Boutons header */
  .apr-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 10px;
    border: 1.5px solid #E2E8F0; background: white;
    color: #475569; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s; font-family: inherit;
  }
  .apr-btn:hover        { border-color: #0EA5E9; color: #0EA5E9; background: #F0F9FF; }
  .apr-btn--active      { border-color: #0EA5E9; color: #0EA5E9; background: #F0F9FF; }
  .apr-btn--primary     { background: #0F172A; color: white; border-color: #0F172A; }
  .apr-btn--primary:hover { background: #1E293B; border-color: #1E293B; }

  /* KPIs */
  .apr-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px; margin-bottom: 20px;
  }
  .apr-kpi-card {
    border-radius: 16px; border: 1.5px solid;
    padding: 18px 20px;
    animation: fadeUp .35s ease both;
    transition: transform .2s, box-shadow .2s;
  }
  .apr-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
  .apr-kpi-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: .6px; margin: 0 0 10px; }
  .apr-kpi-value { font-size: 28px; font-weight: 900; margin: 0; line-height: 1; }
  .apr-kpi-suffix { font-size: 13px; font-weight: 500; color: #94A3B8; }

  /* Graphique */
  .apr-chart-card {
    background: white; border-radius: 16px;
    border: 1px solid #E2E8F0; padding: 20px 22px;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    animation: fadeUp .35s ease both;
  }
  .apr-chart-title { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 16px; }

  /* Toolbar */
  .apr-toolbar {
    display: flex; align-items: center; gap: 12px;
    flex-wrap: wrap; background: white;
    border-radius: 16px; border: 1px solid #E2E8F0;
    padding: 14px 18px; margin-bottom: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    animation: fadeUp .35s ease both;
    animation-delay: .1s;
  }
  .apr-search {
    width: 100%; padding: 10px 14px 10px 38px;
    border: 1.5px solid #E2E8F0; border-radius: 12px;
    font-size: 13px; font-family: inherit; outline: none;
    color: #0F172A; background: #F8FAFC;
    transition: all .2s; box-sizing: border-box;
  }
  .apr-search:focus { border-color: #0EA5E9; background: white; box-shadow: 0 0 0 3px rgba(14,165,233,.1); }
  .apr-search::placeholder { color: #94A3B8; }

  .apr-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 13px; border-radius: 99px;
    border: 1.5px solid #E2E8F0; background: white;
    color: #475569; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all .15s;
    white-space: nowrap;
  }
  .apr-pill:hover    { border-color: #0EA5E9; color: #0369A1; }
  .apr-pill--active  { border-color: #0EA5E9 !important; color: #0369A1 !important; background: #F0F9FF !important; }

  .apr-sort {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 13px; border-radius: 10px;
    border: 1.5px solid #E2E8F0; background: white;
    color: #475569; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all .15s;
  }
  .apr-sort--active  { border-color: #0EA5E9; color: #0369A1; background: #F0F9FF; }

  .apr-reset {
    font-size: 12px; color: #0EA5E9; background: none;
    border: none; cursor: pointer; font-weight: 600;
    font-family: inherit; text-decoration: underline; padding: 0;
  }

  /* Empty */
  .apr-empty {
    text-align: center; padding: 64px 24px;
    background: white; border-radius: 20px;
    border: 1px solid #E2E8F0;
  }
  .apr-empty-icon {
    width: 64px; height: 64px; border-radius: 20px;
    background: #F8FAFC; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 16px;
    border: 1px solid #E2E8F0;
  }

  /* Carte transaction */
  .txn-card {
    position: relative;
    background: white; border-radius: 16px;
    border: 1px solid #E2E8F0; padding: 20px 22px 20px 26px;
    animation: fadeUp .35s ease both;
    box-shadow: 0 1px 4px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.03);
    transition: box-shadow .2s, transform .18s;
  }
  .txn-card:hover {
    box-shadow: 0 4px 20px rgba(15,23,42,.10), 0 1px 4px rgba(0,0,0,.04);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    .apr-root   { padding: 16px 14px; }
    .apr-kpis   { grid-template-columns: 1fr 1fr; }
    .apr-header { padding: 16px; }
    .txn-card   { padding: 16px 16px 16px 20px; }
  }
`;