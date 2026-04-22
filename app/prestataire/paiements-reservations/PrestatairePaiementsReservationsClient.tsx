"use client";

// ─────────────────────────────────────────────────────────────────────
// FUSION : Paiements + Réservations prestataire
// Style original conservé. Ajouts :
//  - Photos des excursions dans le diagnostic
//  - Photo touriste + email + tous détails dans paiements
//  - Diagnostic : juste la carte photo + stats, sans superflu
// ─────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  TrendingUp, Clock, Percent, Wallet, CalendarDays, Users,
  Download, Search, User, CheckCircle2, XCircle, CheckCheck,
  Loader2, MapPin, Banknote, AlertTriangle, X, Activity,
  ChevronDown, ChevronUp, Plus, Image as ImageIcon, Mail,
  Hash, Phone,
} from "lucide-react";

import StatCard   from "../../components/ui/StatCard";
import { StatusBadge, Toast } from "../../components/ui";
import SearchBar  from "../../components/ui/SearchBar";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../../lib/useToast";
import {
  Paiement, PaiementStatus, PAIEMENT_STATUS,
  fmtDate, groupByMonth, exportCSV,
} from "../../../lib/paiement";

// ─── Types ────────────────────────────────────────────────────────────
interface ResRow {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
  status: string; touriste_name: string; touriste_email: string;
  excursion_id: string; excursion_title: string; excursion_city: string; excursion_max: number;
}
interface DateDiag {
  date: string; slots: number; reserved: number; remaining: number; rate: number; nb_resa: number;
}
interface ExcursionStat {
  excursion_id: string; excursion_title: string; max_people: number;
  nb_reservations: number; nb_actives: number;
  places_reservees: number; places_restantes: number; taux_remplissage: number;
  photo: string | null; date_diagnostics: DateDiag[]; has_dates: boolean;
}
interface TouristeProfile {
  user_id: string; full_name: string | null;
  email?: string | null; avatar_url?: string | null; phone?: string | null;
}
interface ExcursionInfo {
  id: string; title: string; city: string;
  photo_url?: string | null; duration?: string | null;
  description?: string | null; price_per_person?: number | null;
  max_people?: number | null;
}

interface Props {
  paiements:       Paiement[];
  reservationsPay: Record<string, unknown>[];
  excursionsPay:   ExcursionInfo[];
  touristes:       TouristeProfile[];
  reservations:    ResRow[];
  excursionStats:  ExcursionStat[];
}

// ─── Statuts réservation ──────────────────────────────────────────────
const RES_STATUS: Record<string, { label: string; color: string; bg: string; dot: string; Icon: React.ElementType }> = {
  pending:   { label: "En attente", color: "#A16207", bg: "#FEF9C3", dot: "#D97706", Icon: Clock        },
  confirmed: { label: "Confirmée",  color: "#15803D", bg: "#DCFCE7", dot: "#22C55E", Icon: CheckCircle2 },
  completed: { label: "Terminée",   color: "#259FFC", bg: "#DCE5FF", dot: "#02AFCF", Icon: CheckCheck   },
  cancelled: { label: "Annulée",    color: "#DC2626", bg: "#FEE2E2", dot: "#EF4444", Icon: XCircle      },
};
const CANCEL_REASONS = [
  { id: "complet",   label: "Excursion complète",         emoji: "👥" },
  { id: "meteo",     label: "Mauvaises conditions météo", emoji: "⛈️" },
  { id: "indispo",   label: "Prestataire indisponible",   emoji: "🚫" },
  { id: "technique", label: "Problème technique",         emoji: "🔧" },
  { id: "client",    label: "Demande du client",          emoji: "👤" },
  { id: "autre",     label: "Autre raison",               emoji: "📝" },
];
type FilterKey = "all" | "pending" | "confirmed" | "completed" | "cancelled";
const RES_TABS: { key: FilterKey; label: string; Icon: React.ElementType }[] = [
  { key: "pending",   label: "En attente", Icon: Clock        },
  { key: "confirmed", label: "Confirmées", Icon: CheckCircle2 },
  { key: "completed", label: "Terminées",  Icon: CheckCheck   },
  { key: "cancelled", label: "Annulées",   Icon: XCircle      },
  { key: "all",       label: "Toutes",     Icon: CalendarDays },
];

// ─── Helpers ──────────────────────────────────────────────────────────
function fmtDateShort(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function getSlotStatus(remaining: number, rate: number) {
  if (remaining === 0) return { label: "Complet",       color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", dot: "#EF4444", bar: "#EF4444" };
  if (rate >= 80)      return { label: "Presque plein", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", bar: "#F59E0B" };
  if (rate >= 50)      return { label: "En bonne voie", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7", dot: "#10B981", bar: "#10B981" };
  return                      { label: "Disponible",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", dot: "#9CA3AF", bar: "#02AFCF" };
}
const FALLBACK = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fit=crop";

// ─── Avatar touriste ──────────────────────────────────────────────────
function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const [err, setErr] = useState(false);
  const COLORS = ["#02AFCF","#8B5CF6","#EC4899","#F59E0B","#10B981","#EF4444","#6366F1","#0EA5E9"];
  const color  = COLORS[(name || "?").charCodeAt(0) % COLORS.length];
  if (url && !err) return (
    <img src={url} alt={name || ""} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
        flexShrink: 0, border: "2px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.1)" }} />
  );
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: "white",
      border: "2px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,.1)" }}>
      {initials}
    </div>
  );
}

// ─── Diagnostic Card (photo + stats uniquement) ───────────────────────
function DiagnosticCard({ s }: { s: ExcursionStat }) {
  const [expanded, setExpanded] = useState(false);
  const st      = getSlotStatus(s.places_restantes, s.taux_remplissage);
  const allFull = s.has_dates && s.date_diagnostics.length > 0
    && s.date_diagnostics.every(d => d.remaining === 0);

  return (
    <div style={{
      background: "white", border: `1.5px solid ${st.border}`, borderRadius: 18,
      overflow: "hidden", boxShadow: "0 2px 12px rgba(5,51,102,.07)",
      transition: "box-shadow .2s, transform .2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(5,51,102,.14)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(5,51,102,.07)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
    >
      {/* ── Photo ── */}
      <div style={{ position: "relative", height: 150, overflow: "hidden", background: "#F3F4F6", flexShrink: 0 }}>
        {s.photo ? (
          <img
            src={s.photo}
            alt={s.excursion_title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", background: "linear-gradient(135deg,#EEF2FF,#DCE5FF)" }}>
            <ImageIcon size={36} color="#C7D2FE" strokeWidth={1.2} />
          </div>
        )}
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(5,51,102,.75) 0%, rgba(5,51,102,.1) 50%, transparent 100%)" }} />
        {/* Badge statut */}
        <span style={{
          position: "absolute", top: 10, right: 10,
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
          backdropFilter: "blur(8px)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
          {st.label}
        </span>
        {/* Titre sur la photo */}
        <p style={{
          position: "absolute", bottom: 10, left: 12, right: 12,
          fontSize: 14, fontWeight: 800, color: "white", margin: 0, lineHeight: 1.3,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          textShadow: "0 2px 6px rgba(0,0,0,.5)",
        }}>{s.excursion_title}</p>
      </div>

      {/* ── Stats ── */}
      <div style={{ padding: "14px 16px 16px" }}>

        {/* Barre remplissage */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Remplissage global</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: st.bar }}>{s.taux_remplissage}%</span>
          </div>
          <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, s.taux_remplissage)}%`,
              background: st.bar, borderRadius: 99, transition: "width .6s ease" }} />
          </div>
        </div>

        {/* 3 chiffres */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Réservations",  value: s.nb_reservations, color: "#053366" },
            { label: "Places prises", value: s.places_reservees, color: "#059669" },
            { label: "Restantes",     value: s.places_restantes, color: s.places_restantes === 0 ? "#DC2626" : "#D97706" },
          ].map((item, i) => (
            <div key={i} style={{ background: "#F9FAFB", border: "1px solid #EEF2FF",
              borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: item.color, margin: 0, lineHeight: 1 }}>{item.value}</p>
              <p style={{ fontSize: 9, color: "#9CA3AF", margin: "4px 0 0", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Capacité */}
        {s.max_people > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "6px 10px", background: "#EEF2FF", borderRadius: 8, marginBottom: 12 }}>
            <Users size={11} color="#6B7280" />
            <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>
              Capacité : <strong style={{ color: "#053366" }}>{s.max_people} places</strong>
            </span>
          </div>
        )}

        {/* Bouton ajouter date si tout plein */}
        {allFull && (
          <a href={`/prestataire/excursions/${s.excursion_id}/edit`}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px 14px", background: "linear-gradient(135deg,#053366,#02AFCF)",
              color: "white", borderRadius: 12, fontSize: 12, fontWeight: 800,
              textDecoration: "none", marginBottom: 12,
              boxShadow: "0 3px 12px rgba(2,175,207,.35)", transition: "all .18s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "none"; }}
          >
            <Plus size={14} /> Ajouter une nouvelle date
          </a>
        )}

        {/* Détail par date */}
        {s.has_dates && s.date_diagnostics.length > 0 && (
          <>
            <button onClick={() => setExpanded(p => !p)}
              style={{ width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "8px 10px",
                background: "#F9FAFB", border: "1px solid #EEF2FF", borderRadius: 10,
                cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "#053366" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CalendarDays size={13} color="#02AFCF" />
                Voir par date ({s.date_diagnostics.length})
              </span>
              {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
            </button>

            {expanded && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {s.date_diagnostics.map(d => {
                  const dst = getSlotStatus(d.remaining, d.rate);
                  return (
                    <div key={d.date} style={{ background: dst.bg, border: `1px solid ${dst.border}`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dst.dot, display: "inline-block" }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#053366" }}>{fmtDateShort(d.date)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: dst.color, background: "white", border: `1px solid ${dst.border}`, padding: "1px 7px", borderRadius: 99 }}>{dst.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: dst.color }}>{d.rate}%</span>
                      </div>
                      <div style={{ height: 5, background: "rgba(0,0,0,.07)", borderRadius: 99, marginBottom: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, d.rate)}%`, background: dst.bar, borderRadius: 99 }} />
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 3 }}><Users size={10} color="#9CA3AF" /> {d.reserved}/{d.slots}</span>
                        <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 3 }}><CheckCheck size={10} color="#6B7280" /> {d.nb_resa} rés.</span>
                        {d.remaining === 0 && (
                          <a href={`/prestataire/excursions/${s.excursion_id}/edit`}
                            style={{ fontSize: 11, fontWeight: 700, color: "#02AFCF", display: "flex", alignItems: "center", gap: 3, textDecoration: "none", marginLeft: "auto" }}>
                            <Plus size={10} /> Nouvelle date
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Modal Annulation ─────────────────────────────────────────────────
function CancelModal({ reservation, onClose, onConfirm, loading }: {
  reservation: ResRow; onClose: () => void; onConfirm: (r: string) => void; loading: boolean;
}) {
  const [sel, setSel] = useState("");
  const [custom, setCustom] = useState("");
  const finalReason = sel === "autre" ? custom.trim() : CANCEL_REASONS.find(r => r.id === sel)?.label || "";
  const canSubmit = sel && (sel !== "autre" || custom.trim().length > 3);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.65)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 480, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg,#FEF2F2,#FFF5F5)", padding: "22px 24px 18px", borderBottom: "1px solid #FEE2E2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={20} color="#DC2626" strokeWidth={2} />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>Annuler la réservation</h2>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, marginTop: 2 }}>Un email sera envoyé automatiquement au touriste</p>
              </div>
            </div>
            {!loading && <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color="#6B7280" /></button>}
          </div>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "12px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", marginBottom: 6 }}>{reservation.excursion_title}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} color="#9CA3AF" /> {reservation.touriste_name}</span>
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Mail size={11} color="#9CA3AF" /> {reservation.touriste_email}</span>
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} color="#9CA3AF" /> {fmtDate(reservation.date)}</span>
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Users size={11} color="#9CA3AF" /> {reservation.people_count} pers.</span>
            </div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Raison <span style={{ color: "#DC2626" }}>*</span></p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {CANCEL_REASONS.map(reason => (
              <button key={reason.id} onClick={() => setSel(reason.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: `2px solid ${sel === reason.id ? "#DC2626" : "#E5E7EB"}`, borderRadius: 12, background: sel === reason.id ? "#FEF2F2" : "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>{reason.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sel === reason.id ? "#DC2626" : "#374151" }}>{reason.label}</span>
              </button>
            ))}
          </div>
          {sel === "autre" && (
            <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder="Précisez..." rows={3}
              style={{ width: "100%", padding: "11px 13px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", background: "#FAFAFA", boxSizing: "border-box", marginBottom: 12 }} />
          )}
          {sel && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 13px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, marginBottom: 16, fontSize: 12, color: "#92400E" }}>
              <span style={{ fontSize: 14 }}>📧</span>
              <span>Email à <strong>{reservation.touriste_name}</strong> ({reservation.touriste_email})</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Retour</button>
            <button onClick={() => onConfirm(finalReason)} disabled={!canSubmit || loading}
              style={{ flex: 2, padding: "12px", background: canSubmit ? "linear-gradient(135deg,#DC2626,#B91C1C)" : "#E5E7EB", color: canSubmit ? "white" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {loading ? <><Loader2 size={14} style={{ animation: "spin .6s linear infinite" }} /> Annulation...</> : <><XCircle size={14} /> Confirmer l&apos;annulation</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function PrestatairePaiementsReservationsClient({
  paiements, reservationsPay, excursionsPay, touristes,
  reservations: initial, excursionStats,
}: Props) {
  const supabase = createClient();
  const { toast, showToast } = useToast();

  const [reservations, setReservations] = useState(initial);
  const [loadingId,    setLoadingId]    = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ResRow | null>(null);
  const [resFilter,    setResFilter]    = useState<FilterKey>("pending");
  const [resSearch,    setResSearch]    = useState("");
  const [paySearch,    setPaySearch]    = useState("");
  const [payStatus,    setPayStatus]    = useState<"all" | PaiementStatus>("all");
  const [activeTab,    setActiveTab]    = useState<"reservations" | "paiements">("reservations");
  const [expandedPay,  setExpandedPay]  = useState<string | null>(null);

  // Maps
  const resaPayMap  = useMemo(() => Object.fromEntries(reservationsPay.map(r => [String((r as any).id), r])), [reservationsPay]);
  const excPayMap   = useMemo(() => Object.fromEntries(excursionsPay.map(e => [e.id, e])), [excursionsPay]);
  const tourMap     = useMemo(() => Object.fromEntries(touristes.map(t => [t.user_id, t])), [touristes]);

  // KPIs
  const totalPaid    = useMemo(() => paiements.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0), [paiements]);
  const totalPending = useMemo(() => paiements.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.net_amount), 0), [paiements]);
  const totalFees    = useMemo(() => paiements.reduce((s, p) => s + Number(p.platform_fee), 0), [paiements]);
  const nbPaid       = useMemo(() => paiements.filter(p => p.status === "paid").length, [paiements]);

  // Paiements filtrés
  const filteredPay = useMemo(() => paiements.filter(p => {
    const resa = resaPayMap[p.reservation_id] || {} as any;
    const exc  = excPayMap[String(resa.excursion_id)] || {} as ExcursionInfo;
    const tour = tourMap[String(resa.touriste_id)];
    const q = paySearch.toLowerCase();
    const match =
      (exc.title || "").toLowerCase().includes(q) ||
      (exc.city  || "").toLowerCase().includes(q) ||
      (tour?.full_name || "").toLowerCase().includes(q) ||
      (tour?.email     || "").toLowerCase().includes(q) ||
      String(resa.booking_code || "").toLowerCase().includes(q);
    return match && (payStatus === "all" || p.status === payStatus);
  }), [paiements, paySearch, payStatus, resaPayMap, excPayMap, tourMap]);

  const groupedPay = useMemo(() => groupByMonth(filteredPay), [filteredPay]);

  // Réservations filtrées
  const resCounts: Record<string, number> = { all: reservations.length };
  reservations.forEach(r => { resCounts[r.status] = (resCounts[r.status] ?? 0) + 1; });
  const filteredRes = reservations.filter(r => {
    if (resFilter !== "all" && r.status !== resFilter) return false;
    if (resSearch.trim()) {
      const q = resSearch.toLowerCase();
      return r.booking_code.toLowerCase().includes(q)
        || r.touriste_name.toLowerCase().includes(q)
        || r.touriste_email.toLowerCase().includes(q)
        || r.excursion_title.toLowerCase().includes(q)
        || r.excursion_city.toLowerCase().includes(q);
    }
    return true;
  });

  // Notifications
  const notifyN8n = async (r: ResRow, status: string, cancelReason?: string) => {
    try {
      await fetch("/api/notify-reservation-status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_code: r.booking_code, status, tourist_name: r.touriste_name, tourist_email: r.touriste_email, excursion_title: r.excursion_title, excursion_city: r.excursion_city, date: r.date, time: r.time, people_count: r.people_count, total_price: r.total_price, cancel_reason: cancelReason || "" }),
      });
    } catch {}
  };

  const updateStatus = async (id: string, status: string) => {
    setLoadingId(id);
    const r = reservations.find(x => x.id === id);
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (!error) {
      setReservations(prev => prev.map(x => x.id === id ? { ...x, status } : x));
      if (status === "confirmed" && r) await notifyN8n(r, status);
      showToast(status === "confirmed" ? "✅ Réservation confirmée ! Email envoyé" : status === "completed" ? "✅ Réservation terminée" : "Statut mis à jour", status !== "cancelled");
    } else { showToast("❌ Erreur lors de la mise à jour", false); }
    setLoadingId(null);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setLoadingId(cancelTarget.id);
    const { error } = await supabase.from("reservations").update({ status: "cancelled", cancel_reason: reason }).eq("id", cancelTarget.id);
    if (!error) {
      setReservations(prev => prev.map(r => r.id === cancelTarget.id ? { ...r, status: "cancelled" } : r));
      await notifyN8n(cancelTarget, "cancelled", reason);
      showToast("❌ Réservation annulée ! Email envoyé", false);
    } else { showToast("❌ Erreur", false); }
    setLoadingId(null); setCancelTarget(null);
  };

  function handleExport() {
    const rows = filteredPay.map(p => {
      const resa = resaPayMap[p.reservation_id] || {} as any;
      const exc  = excPayMap[String(resa.excursion_id)] || {} as ExcursionInfo;
      const tour = tourMap[String(resa.touriste_id)];
      return { Date: fmtDate(p.created_at), Excursion: exc.title || "—", Ville: (exc as any).city || "—", Touriste: tour?.full_name || "—", Email: tour?.email || "—", Code: String(resa.booking_code || "—"), "Montant TND": Number(p.amount), "Commission TND": Number(p.platform_fee), "Net TND": Number(p.net_amount), Statut: PAIEMENT_STATUS[p.status as PaiementStatus]?.label ?? p.status };
    });
    exportCSV(rows, `mes_paiements_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`${rows.length} paiement(s) exporté(s)`);
  }

  // ═══════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .pp-card { animation: fadeUp .35s ease both; }
        .pp-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 24px; }
        .pp-row   { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 18px; background: white; border-radius: 14px; border: 1px solid #EEF2FF; margin-bottom: 10px; transition: all .15s; }
        .pp-row:hover { background: #F8FAFF; border-color: #DCE5FF; box-shadow: 0 4px 16px rgba(5,51,102,.06); }
        .pp-ftab  { padding: 7px 14px; border-radius: 20px; border: 1.5px solid #DCE5FF; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; white-space: nowrap; background: white; color: #053366; }
        .pp-ftab.on { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 3px 10px rgba(2,175,207,.3); }
        .pp-btn   { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; border: none; background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; box-shadow: 0 3px 10px rgba(2,175,207,.3); }
        .pp-btn:hover { box-shadow: 0 5px 18px rgba(2,175,207,.45); transform: translateY(-1px); }
        .rr-search { width:100%; padding:10px 14px 10px 38px; border:1.5px solid #DCE5FF; border-radius:12px; font-size:13px; font-family:inherit; outline:none; color:#053366; background:white; transition:border .2s; }
        .rr-search:focus { border-color:#02AFCF; box-shadow:0 0 0 3px rgba(2,175,207,.1); }
        .rr-tab { display:flex; align-items:center; gap:5px; padding:7px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .18s; white-space:nowrap; }
        .rr-tab.on { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; border:none; box-shadow:0 3px 10px rgba(2,175,207,.35); }
        .rr-tab:not(.on) { background:white; color:#053366; border:1.5px solid #DCE5FF; }
        .rr-btn-confirm { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:10px; border:none; background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 2px 8px rgba(2,175,207,.3); transition:all .15s; }
        .rr-btn-confirm:hover { transform:translateY(-1px); }
        .rr-btn-cancel { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:10px; border:none; background:#FEE2E2; color:#DC2626; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
        .rr-btn-cancel:hover { background:#FECACA; }
        .rr-btn-done { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:10px; border:1.5px solid #DCE5FF; background:white; color:#053366; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
        .main-tab { padding:11px 24px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; border:none; transition:all .2s; }
        .main-tab.on { background: linear-gradient(135deg,#02AFCF,#053366); color:white; box-shadow:0 4px 14px rgba(2,175,207,.35); }
        .main-tab:not(.on) { background:white; color:#6B7280; border:1.5px solid #E5E7EB; }
        .pay-detail-row { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
        .pay-chip { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:8px; background:#F8FAFF; border:1px solid #EEF2FF; font-size:11px; color:#374151; font-weight:600; }
        @media(max-width:900px) { .pp-stats { grid-template-columns: repeat(2,1fr); } }
        @media(max-width:600px) { .pp-stats { grid-template-columns: 1fr; } .pp-row { flex-direction:column; } }
      `}</style>

      <Toast toast={toast} />
      {cancelTarget && <CancelModal reservation={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancelConfirm} loading={loadingId === cancelTarget.id} />}

      {/* ══ HEADER ══ */}
      <div className="pp-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#02AFCF,#053366)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(2,175,207,.35)" }}>
              <Wallet size={22} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#053366", margin: 0 }}>Paiements & Réservations</h1>
              <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
                {paiements.length} paiement{paiements.length > 1 ? "s" : ""} · {reservations.length} réservation{reservations.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {activeTab === "paiements" && <button className="pp-btn" onClick={handleExport}><Download size={14} /> Exporter CSV</button>}
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button className={`main-tab ${activeTab === "reservations" ? "on" : ""}`} onClick={() => setActiveTab("reservations")}>
          📅 Réservations
          <span style={{ marginLeft: 6, padding: "2px 8px", borderRadius: 99, fontSize: 11, background: activeTab === "reservations" ? "rgba(255,255,255,.25)" : "#EEF2FF", color: activeTab === "reservations" ? "white" : "#053366" }}>{reservations.length}</span>
        </button>
        <button className={`main-tab ${activeTab === "paiements" ? "on" : ""}`} onClick={() => setActiveTab("paiements")}>
          💳 Paiements
          <span style={{ marginLeft: 6, padding: "2px 8px", borderRadius: 99, fontSize: 11, background: activeTab === "paiements" ? "rgba(255,255,255,.25)" : "#EEF2FF", color: activeTab === "paiements" ? "white" : "#053366" }}>{paiements.length}</span>
        </button>
      </div>

      {/* ════════════════════════════════════════
          ONGLET RÉSERVATIONS
      ════════════════════════════════════════ */}
      {activeTab === "reservations" && (
        <>
          {/* Diagnostic */}
          {excursionStats.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#053366,#02AFCF)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(2,175,207,.3)" }}>
                  <Activity size={18} color="white" strokeWidth={2} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: 0 }}>Diagnostic de vos excursions</h2>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>État des réservations et places disponibles par excursion et par date</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {excursionStats.map(s => <DiagnosticCard key={s.excursion_id} s={s} />)}
              </div>
            </div>
          )}

          {/* Filtres */}
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #EEF2FF", padding: "14px 16px", marginBottom: 20, boxShadow: "0 2px 8px rgba(5,51,102,.05)" }}>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search size={15} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input className="rr-search" type="text" value={resSearch} onChange={e => setResSearch(e.target.value)} placeholder="Voyageur, email, excursion, code..." />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {RES_TABS.map(tab => {
                const count = resCounts[tab.key] ?? 0;
                if (tab.key !== "all" && count === 0) return null;
                const active = resFilter === tab.key;
                return (
                  <button key={tab.key} className={`rr-tab ${active ? "on" : ""}`} onClick={() => setResFilter(tab.key)}>
                    <tab.Icon size={12} strokeWidth={2} /> {tab.label}
                    <span style={{ padding: "1px 7px", borderRadius: 20, fontSize: 11, background: active ? "rgba(255,255,255,.25)" : "rgba(5,51,102,.07)", color: active ? "white" : "#053366" }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liste réservations */}
          {filteredRes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, background: "white", borderRadius: 16, border: "1px solid #EEF2FF" }}>
              <Search size={28} color="#DCE5FF" style={{ margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontWeight: 700, color: "#053366", marginBottom: 4 }}>Aucun résultat</p>
            </div>
          ) : filteredRes.map((r, i) => {
            const s = RES_STATUS[r.status] ?? RES_STATUS.pending;
            const isLoading = loadingId === r.id;
            const net = r.total_price - r.platform_fee;
            return (
              <div key={r.id} className="pp-card pp-row" style={{ animationDelay: `${i * .04}s`, borderLeft: `4px solid ${s.dot}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Status + code */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />{s.label}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#02AFCF", fontWeight: 700, background: "rgba(2,175,207,.08)", padding: "2px 8px", borderRadius: 8 }}>#{r.booking_code}</span>
                  </div>

                  {/* Excursion */}
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#053366", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.excursion_title}</p>

                  {/* Touriste */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Avatar name={r.touriste_name} size={36} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{r.touriste_name}</p>
                      {r.touriste_email && (
                        <a href={`mailto:${r.touriste_email}`} style={{ fontSize: 11, color: "#02AFCF", display: "flex", alignItems: "center", gap: 3, textDecoration: "none", marginTop: 2 }}>
                          <Mail size={10} color="#02AFCF" /> {r.touriste_email}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Infos */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {r.excursion_city && <span className="pay-chip"><MapPin size={10} color="#9CA3AF" /> {r.excursion_city}</span>}
                    <span className="pay-chip"><CalendarDays size={10} color="#9CA3AF" /> {fmtDate(r.date)}{r.time ? ` à ${r.time}` : ""}</span>
                    <span className="pay-chip"><Users size={10} color="#9CA3AF" /> {r.people_count} pers.</span>
                  </div>
                </div>

                {/* Droite */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#053366", margin: 0 }}>{r.total_price} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span></p>
                    <p style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}><Banknote size={10} /> Net : {net} TND</p>
                  </div>
                  {r.status === "pending" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="rr-btn-confirm" onClick={() => updateStatus(r.id, "confirmed")} disabled={isLoading}>
                        {isLoading ? <Loader2 size={13} style={{ animation: "spin .6s linear infinite" }} /> : <CheckCircle2 size={13} />} Confirmer
                      </button>
                      <button className="rr-btn-cancel" onClick={() => setCancelTarget(r)} disabled={isLoading}>
                        <XCircle size={13} /> Annuler
                      </button>
                    </div>
                  )}
                  {r.status === "confirmed" && (
                    <button className="rr-btn-done" onClick={() => updateStatus(r.id, "completed")} disabled={isLoading}>
                      {isLoading ? <Loader2 size={13} style={{ animation: "spin .6s linear infinite" }} /> : <CheckCheck size={13} />} Terminer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ════════════════════════════════════════
          ONGLET PAIEMENTS
      ════════════════════════════════════════ */}
      {activeTab === "paiements" && (
        <>
          {/* KPIs */}
          <div className="pp-stats pp-card" style={{ animationDelay: ".07s" }}>
            <StatCard label="Total encaissé"       value={`${totalPaid} TND`}    icon={<TrendingUp size={20}/>} color="#02AFCF" bg="rgba(2,175,207,.1)"   border="rgba(2,175,207,.2)"   delay={0.07} />
            <StatCard label="En attente versement" value={`${totalPending} TND`} icon={<Clock size={20}/>}      color="#A16207" bg="rgba(217,119,6,.1)"   border="rgba(217,119,6,.2)"   delay={0.12} />
            <StatCard label="Commission prélevée"  value={`${totalFees} TND`}    icon={<Percent size={20}/>}   color="#6B7280" bg="rgba(107,114,128,.08)" border="rgba(107,114,128,.15)" delay={0.17} />
          </div>

          {paiements.length === 0 ? (
            <EmptyState icon={<Wallet size={32} color="#02AFCF" strokeWidth={1.5} />} title="Aucun paiement pour l'instant" subtitle="Vos revenus apparaîtront ici après vos premières réservations confirmées" />
          ) : (
            <>
              {/* Toolbar */}
              <div className="pp-card" style={{ background: "white", borderRadius: 16, border: "1px solid #EEF2FF", padding: "14px 16px", marginBottom: 20, animationDelay: ".18s" }}>
                <div style={{ marginBottom: 12 }}>
                  <SearchBar value={paySearch} onChange={setPaySearch} placeholder="Excursion, touriste, email, code..." />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["all", "paid", "pending", "refunded"] as const).map(s => (
                    <button key={s} className={`pp-ftab ${payStatus === s ? "on" : ""}`} onClick={() => setPayStatus(s)}>
                      {s === "all" ? `Tous (${paiements.length})` : `${PAIEMENT_STATUS[s].label} (${paiements.filter(p => p.status === s).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPay.length === 0 ? (
                <EmptyState icon={<Wallet size={24} color="#9CA3AF" strokeWidth={1.5} />} title="Aucun résultat" subtitle="Essayez d'autres filtres" action={<button onClick={() => { setPaySearch(""); setPayStatus("all"); }} style={{ padding: "8px 18px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "inherit" }}>Réinitialiser</button>} />
              ) : (
                Object.entries(groupedPay).map(([month, items]) => {
                  const monthNet = items.reduce((s, p) => s + Number(p.net_amount), 0);
                  return (
                    <div key={month} style={{ marginBottom: 28 }}>
                      {/* En-tête mois */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(#02AFCF,#259FFC)" }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#053366", textTransform: "capitalize" }}>{month}</span>
                          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{items.length} transaction{items.length > 1 ? "s" : ""}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#02AFCF" }}>{monthNet} TND net</span>
                      </div>

                      {items.map((p, i) => {
                        const resa = resaPayMap[p.reservation_id] || {} as any;
                        const exc  = excPayMap[String(resa.excursion_id)] || {} as ExcursionInfo;
                        const tour = tourMap[String(resa.touriste_id)];
                        const cfg  = PAIEMENT_STATUS[p.status as PaiementStatus] ?? PAIEMENT_STATUS.pending;
                        const isOpen = expandedPay === p.id;

                        return (
                          <div key={p.id} className="pp-card pp-row" style={{ animationDelay: `${i * .04}s`, borderLeft: `3px solid ${cfg.dot}`, flexDirection: "column", alignItems: "stretch" }}>
                            {/* Ligne principale */}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

                              {/* Avatar touriste */}
                              <Avatar url={tour?.avatar_url} name={tour?.full_name} size={44} />

                              {/* Infos touriste + excursion */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Nom + statut */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 14, fontWeight: 800, color: "#053366" }}>{tour?.full_name || "Client inconnu"}</span>
                                  <StatusBadge status={p.status} config={PAIEMENT_STATUS} size="sm" />
                                </div>
                                {/* Email */}
                                {tour?.email && (
                                  <a href={`mailto:${tour.email}`} style={{ fontSize: 11, color: "#02AFCF", display: "flex", alignItems: "center", gap: 3, textDecoration: "none", marginBottom: 4 }}>
                                    <Mail size={10} color="#02AFCF" /> {tour.email}
                                  </a>
                                )}
                                {/* Chips excursion + détails */}
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{exc.title || "—"}</span>
                                  {(exc as any).city && <span className="pay-chip"><MapPin size={9} color="#9CA3AF" /> {(exc as any).city}</span>}
                                  {resa.booking_code && <span className="pay-chip" style={{ fontFamily: "monospace", color: "#02AFCF" }}>#{String(resa.booking_code)}</span>}
                                  {resa.date && <span className="pay-chip"><CalendarDays size={9} color="#9CA3AF" /> {fmtDate(String(resa.date))}</span>}
                                  {resa.people_count && <span className="pay-chip"><Users size={9} color="#9CA3AF" /> {String(resa.people_count)} pers.</span>}
                                </div>
                              </div>

                              {/* Montant + bouton détails */}
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ fontSize: 20, fontWeight: 900, color: "#053366", margin: 0 }}>
                                  {Number(p.net_amount)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span>
                                </p>
                                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>sur {Number(p.amount)} TND</p>
                                <button onClick={() => setExpandedPay(isOpen ? null : p.id)}
                                  style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1.5px solid #DCE5FF", background: "white", color: "#02AFCF", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                  {isOpen ? <><ChevronUp size={11} /> Moins</> : <><ChevronDown size={11} /> Détails</>}
                                </button>
                              </div>
                            </div>

                            {/* Barre commission */}
                            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#EEF2FF", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(Number(p.net_amount) / Number(p.amount)) * 100}%`, background: "linear-gradient(90deg,#02AFCF,#259FFC)", borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                                Commission {Number(p.platform_fee)} TND ({Math.round((Number(p.platform_fee) / Number(p.amount)) * 100)}%)
                              </span>
                            </div>

                            {/* Détails étendus */}
                            {isOpen && (
                              <div style={{ marginTop: 14, padding: "14px 16px", background: "#F8FAFF", borderRadius: 12, border: "1px solid #EEF2FF" }}>
                                {/* Photo excursion */}
                                {exc.photo_url && (
                                  <div style={{ position: "relative", height: 120, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                                    <img src={exc.photo_url} alt={exc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,51,102,.6) 0%, transparent 60%)" }} />
                                    <p style={{ position: "absolute", bottom: 8, left: 10, right: 10, fontSize: 13, fontWeight: 800, color: "white", margin: 0 }}>{exc.title}</p>
                                  </div>
                                )}

                                {/* Grille détails */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginBottom: 12 }}>
                                  {[
                                    { label: "Montant payé",    value: `${Number(p.amount)} TND`,       color: "#053366" },
                                    { label: "Votre part",      value: `${Number(p.net_amount)} TND`,   color: "#059669" },
                                    { label: "Commission",      value: `${Number(p.platform_fee)} TND`, color: "#D97706" },
                                    { label: "Places",          value: `${resa.people_count ?? "—"} pers.`, color: "#02AFCF" },
                                    ...(exc.price_per_person    ? [{ label: "Prix/pers.", value: `${exc.price_per_person} TND`, color: "#6B7280" }] : []),
                                    ...(exc.max_people          ? [{ label: "Capacité",   value: `${exc.max_people} places`,   color: "#6B7280" }] : []),
                                  ].map((item, idx) => (
                                    <div key={idx} style={{ background: "white", border: "1px solid #EEF2FF", borderRadius: 10, padding: "8px 10px" }}>
                                      <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: .4 }}>{item.label}</p>
                                      <p style={{ fontSize: 15, fontWeight: 900, color: item.color, margin: "3px 0 0" }}>{item.value}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Description excursion */}
                                {exc.description && (
                                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>{exc.description}</p>
                                )}

                                {/* Infos touriste complètes */}
                                <div style={{ marginTop: 12, padding: "10px 12px", background: "white", borderRadius: 10, border: "1px solid #EEF2FF" }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .5, margin: "0 0 8px" }}>Informations touriste</p>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Avatar url={tour?.avatar_url} name={tour?.full_name} size={38} />
                                    <div>
                                      <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0 }}>{tour?.full_name || "—"}</p>
                                      {tour?.email && <a href={`mailto:${tour.email}`} style={{ fontSize: 11, color: "#02AFCF", display: "flex", alignItems: "center", gap: 3, textDecoration: "none", marginTop: 2 }}><Mail size={10} /> {tour.email}</a>}
                                      {tour?.phone && <p style={{ fontSize: 11, color: "#6B7280", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}><Phone size={10} color="#9CA3AF" /> {tour.phone}</p>}
                                    </div>
                                  </div>
                                </div>

                                <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 10, textAlign: "right" }}>Paiement le {fmtDate(p.created_at)}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}