"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  CalendarDays, Users, User, CheckCircle2, XCircle,
  CheckCheck, Loader2, CalendarX, Clock, MapPin,
  Banknote, Search, AlertTriangle, X, Activity,
  TrendingUp, ChevronDown, ChevronUp, Plus, Image as ImageIcon,
} from "lucide-react";

/* ─────────────── Types ─────────────── */
interface ResRow {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
  status: string; touriste_name: string; touriste_email: string;
  excursion_id: string; excursion_title: string; excursion_city: string; excursion_max: number;
}

interface DateDiag {
  date: string; slots: number; reserved: number;
  remaining: number; rate: number; nb_resa: number;
}

interface ExcursionStat {
  excursion_id: string; excursion_title: string; max_people: number;
  nb_reservations: number; nb_actives: number;
  places_reservees: number; places_restantes: number; taux_remplissage: number;
  photo: string | null; date_diagnostics: DateDiag[]; has_dates: boolean;
}

/* ─────────────── Helpers ─────────────── */
const STATUS: Record<string, { label: string; color: string; bg: string; dot: string; Icon: React.ElementType }> = {
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

const TABS: { key: FilterKey; label: string; Icon: React.ElementType }[] = [
  { key: "pending",   label: "En attente", Icon: Clock        },
  { key: "confirmed", label: "Confirmées", Icon: CheckCircle2 },
  { key: "completed", label: "Terminées",  Icon: CheckCheck   },
  { key: "cancelled", label: "Annulées",   Icon: XCircle      },
  { key: "all",       label: "Toutes",     Icon: CalendarDays },
];

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateShort(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getDateStatus(remaining: number, rate: number) {
  if (remaining === 0) return { label: "Complet",       color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", dot: "#EF4444", bar: "#EF4444" };
  if (rate >= 80)      return { label: "Presque plein", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", bar: "#F59E0B" };
  if (rate >= 50)      return { label: "En bonne voie", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7", dot: "#10B981", bar: "#10B981" };
  return                      { label: "Disponible",    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", dot: "#9CA3AF", bar: "#02AFCF" };
}

/* ─────────────── Diagnostic card ─────────────── */
function DiagnosticCard({ s }: { s: ExcursionStat }) {
  const [expanded, setExpanded] = useState(false);
  const globalSt = getDateStatus(s.places_restantes, s.taux_remplissage);
  const allFull  = s.has_dates && s.date_diagnostics.length > 0
    && s.date_diagnostics.every(d => d.remaining === 0);

  return (
    <div style={{ background: "white", border: `1.5px solid ${globalSt.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(5,51,102,.07)", transition: "box-shadow .2s" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(5,51,102,.13)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(5,51,102,.07)")}
    >
      {/* ── Photo + titre ── */}
      <div style={{ position: "relative", height: 130, overflow: "hidden", background: "#F3F4F6" }}>
        {s.photo ? (
          <img src={s.photo} alt={s.excursion_title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#EEF2FF,#DCE5FF)" }}>
            <ImageIcon size={32} color="#C7D2FE" strokeWidth={1.5} />
          </div>
        )}
        {/* Overlay gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,51,102,.7) 0%, transparent 55%)" }} />

        {/* Badge statut global */}
        <span style={{ position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: globalSt.bg, color: globalSt.color, border: `1px solid ${globalSt.border}`, backdropFilter: "blur(4px)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: globalSt.dot, display: "inline-block" }} />
          {globalSt.label}
        </span>

        {/* Titre sur la photo */}
        <p style={{ position: "absolute", bottom: 10, left: 12, right: 12, fontSize: 13, fontWeight: 800, color: "white", margin: 0, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", textShadow: "0 1px 4px rgba(0,0,0,.4)" }}>
          {s.excursion_title}
        </p>
      </div>

      {/* ── Corps ── */}
      <div style={{ padding: "14px 16px 16px" }}>

        {/* Barre remplissage global */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Remplissage global</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: globalSt.bar }}>{s.taux_remplissage}%</span>
          </div>
          <div style={{ height: 7, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, s.taux_remplissage)}%`, background: globalSt.bar, borderRadius: 99, transition: "width .5s ease" }} />
          </div>
        </div>

        {/* 3 chiffres globaux */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 12 }}>
          {[
            { label: "Réservations", value: s.nb_reservations, color: "#053366" },
            { label: "Places prises", value: s.places_reservees, color: "#059669" },
            { label: "Restantes",    value: s.places_restantes, color: s.places_restantes === 0 ? "#DC2626" : "#D97706" },
          ].map((item, i) => (
            <div key={i} style={{ background: "#F9FAFB", border: "1px solid #EEF2FF", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: item.color, margin: 0, lineHeight: 1 }}>{item.value}</p>
              <p style={{ fontSize: 10, color: "#9CA3AF", margin: "3px 0 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Capacité */}
        {s.max_people > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "5px 10px", background: "#EEF2FF", borderRadius: 8, marginBottom: 12 }}>
            <Users size={11} color="#6B7280" />
            <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Capacité : <strong style={{ color: "#053366" }}>{s.max_people} places</strong></span>
          </div>
        )}

        {/* ── Bouton : Ajouter une date (si toutes dates complètes) ── */}
        {allFull && (
          <a href={`/prestataire/excursions/${s.excursion_id}/edit`}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px", background: "linear-gradient(135deg,#053366,#02AFCF)", color: "white", borderRadius: 12, fontSize: 12, fontWeight: 800, textDecoration: "none", marginBottom: 12, boxShadow: "0 3px 12px rgba(2,175,207,.35)", transition: "all .18s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 18px rgba(2,175,207,.45)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "none"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 3px 12px rgba(2,175,207,.35)"; }}
          >
            <Plus size={14} />
            Ajouter une nouvelle date
          </a>
        )}

        {/* ── Détail par date ── */}
        {s.has_dates && s.date_diagnostics.length > 0 && (
          <>
            <button onClick={() => setExpanded(p => !p)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#F9FAFB", border: "1px solid #EEF2FF", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "#053366" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CalendarDays size={13} color="#02AFCF" />
                Voir par date ({s.date_diagnostics.length})
              </span>
              {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
            </button>

            {expanded && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {s.date_diagnostics.map(d => {
                  const dst = getDateStatus(d.remaining, d.rate);
                  return (
                    <div key={d.date} style={{ background: dst.bg, border: `1px solid ${dst.border}`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dst.dot, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#053366" }}>{fmtDateShort(d.date)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: dst.color, background: "white", border: `1px solid ${dst.border}`, padding: "1px 7px", borderRadius: 99 }}>{dst.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: dst.color }}>{d.rate}%</span>
                      </div>

                      {/* Mini barre */}
                      <div style={{ height: 5, background: "rgba(0,0,0,.08)", borderRadius: 99, marginBottom: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, d.rate)}%`, background: dst.bar, borderRadius: 99 }} />
                      </div>

                      {/* Stats */}
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 3 }}>
                          <Users size={10} color="#9CA3AF" /> {d.reserved}/{d.slots} places
                        </span>
                        <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 3 }}>
                          <TrendingUp size={10} color={d.remaining === 0 ? "#EF4444" : "#10B981"} />
                          {d.remaining === 0 ? "Complet" : `${d.remaining} restante${d.remaining > 1 ? "s" : ""}`}
                        </span>
                        <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 3 }}>
                          <CheckCheck size={10} color="#6B7280" /> {d.nb_resa} rés.
                        </span>
                      </div>

                      {/* Bouton ajouter date pour cette date précise */}
                      {d.remaining === 0 && (
                        <a href={`/prestataire/excursions/${s.excursion_id}/edit`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, padding: "5px 10px", background: "linear-gradient(135deg,#053366,#02AFCF)", color: "white", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 8px rgba(2,175,207,.3)" }}>
                          <Plus size={11} /> Ajouter une date proche
                        </a>
                      )}
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

/* ─────────────── Diagnostic section ─────────────── */
function DiagnosticExcursions({ stats }: { stats: ExcursionStat[] }) {
  if (stats.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#053366,#02AFCF)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(2,175,207,.3)" }}>
          <Activity size={18} color="white" strokeWidth={2} />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: 0 }}>Diagnostic de vos excursions</h2>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, marginTop: 2 }}>État des réservations et places disponibles par excursion et par date</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
        {stats.map(s => <DiagnosticCard key={s.excursion_id} s={s} />)}
      </div>
    </div>
  );
}

/* ─────────────── Modal Annulation ─────────────── */
function CancelModal({ reservation, onClose, onConfirm, loading }: {
  reservation: ResRow; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason,   setCustomReason]   = useState("");
  const finalReason = selectedReason === "autre"
    ? customReason.trim()
    : CANCEL_REASONS.find(r => r.id === selectedReason)?.label || "";
  const canSubmit = selectedReason && (selectedReason !== "autre" || customReason.trim().length > 3);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.65)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .2s ease" }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 480, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden", animation: "slideUp .25s ease" }}>
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
            {!loading && (
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color="#6B7280" />
              </button>
            )}
          </div>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "12px 14px", marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", marginBottom: 4 }}>{reservation.excursion_title}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={11} color="#9CA3AF" /> {reservation.touriste_name}</span>
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={11} color="#9CA3AF" /> {fmtDate(reservation.date)}</span>
              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Users size={11} color="#9CA3AF" /> {reservation.people_count} pers.</span>
            </div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
            Raison de l&apos;annulation <span style={{ color: "#DC2626" }}>*</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {CANCEL_REASONS.map(reason => (
              <button key={reason.id} onClick={() => setSelectedReason(reason.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: `2px solid ${selectedReason === reason.id ? "#DC2626" : "#E5E7EB"}`, borderRadius: 12, background: selectedReason === reason.id ? "#FEF2F2" : "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all .15s" }}>
                <span style={{ fontSize: 16 }}>{reason.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: selectedReason === reason.id ? "#DC2626" : "#374151" }}>{reason.label}</span>
                {selectedReason === reason.id && (
                  <span style={{ marginLeft: "auto", width: 16, height: 16, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckCheck size={10} color="white" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
          {selectedReason === "autre" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
                Précisez la raison <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <textarea value={customReason} onChange={e => setCustomReason(e.target.value)}
                placeholder="Expliquez la raison de l'annulation..." rows={3}
                style={{ width: "100%", padding: "11px 13px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", color: "#111827", background: "#FAFAFA", boxSizing: "border-box", transition: "border .2s" }}
                onFocus={e => e.target.style.borderColor = "#DC2626"}
                onBlur={e  => e.target.style.borderColor = "#E5E7EB"}
              />
            </div>
          )}
          {selectedReason && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 13px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, marginBottom: 16, fontSize: 12, color: "#92400E" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>📧</span>
              <span>Email envoyé à <strong>{reservation.touriste_name}</strong> — Raison : <strong>&quot;{finalReason}&quot;</strong></span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} disabled={loading}
              style={{ flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Retour
            </button>
            <button onClick={() => onConfirm(finalReason)} disabled={!canSubmit || loading}
              style={{ flex: 2, padding: "12px", background: canSubmit ? "linear-gradient(135deg,#DC2626,#B91C1C)" : "#E5E7EB", color: canSubmit ? "white" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .2s", boxShadow: canSubmit ? "0 4px 14px rgba(220,38,38,.3)" : "none" }}>
              {loading ? <><Loader2 size={14} style={{ animation: "spin .6s linear infinite" }} /> Annulation...</> : <><XCircle size={14} /> Confirmer l&apos;annulation</>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ─────────────── Main ─────────────── */
export default function ReservationsClient({
  reservations: initial,
  excursionStats,
}: {
  reservations: ResRow[];
  excursionStats: ExcursionStat[];
}) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(initial);
  const [loading,      setLoading]      = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter,       setFilter]       = useState<FilterKey>("pending");
  const [search,       setSearch]       = useState("");
  const [cancelTarget, setCancelTarget] = useState<ResRow | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500);
  };

  const notifyN8n = async (reservation: ResRow, status: string, cancelReason?: string) => {
    try {
      await fetch("/api/notify-reservation-status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: reservation.booking_code, status,
          tourist_name: reservation.touriste_name, tourist_email: reservation.touriste_email,
          excursion_title: reservation.excursion_title, excursion_city: reservation.excursion_city,
          date: reservation.date, time: reservation.time,
          people_count: reservation.people_count, total_price: reservation.total_price,
          cancel_reason: cancelReason || "",
        }),
      });
    } catch (err) { console.error("❌ Erreur notification n8n:", err); }
  };

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    const reservation = reservations.find(r => r.id === id);
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (!error) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (status === "confirmed" && reservation) await notifyN8n(reservation, status);
      showToast(status === "confirmed" ? "✅ Réservation confirmée ! Email envoyé au touriste" : status === "completed" ? "✅ Réservation terminée" : "Statut mis à jour", status !== "cancelled");
    } else {
      showToast("❌ Erreur lors de la mise à jour", false);
    }
    setLoading(null);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    setLoading(cancelTarget.id);
    const { error } = await supabase.from("reservations").update({ status: "cancelled", cancel_reason: reason }).eq("id", cancelTarget.id);
    const success = !error || (() => supabase.from("reservations").update({ status: "cancelled" }).eq("id", cancelTarget.id).then(({ error: e2 }) => !e2))();
    if (success) {
      setReservations(prev => prev.map(r => r.id === cancelTarget.id ? { ...r, status: "cancelled" } : r));
      await notifyN8n(cancelTarget, "cancelled", reason);
      showToast("❌ Réservation annulée ! Email envoyé au touriste", false);
    } else { showToast("❌ Erreur lors de l'annulation", false); }
    setLoading(null); setCancelTarget(null);
  };

  const counts: Record<string, number> = { all: reservations.length };
  reservations.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });

  const filtered = reservations.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.booking_code.toLowerCase().includes(q) || r.touriste_name.toLowerCase().includes(q) || r.excursion_title.toLowerCase().includes(q) || r.excursion_city.toLowerCase().includes(q);
    }
    return true;
  });

  if (reservations.length === 0) return (
    <div style={{ textAlign: "center", padding: "70px 20px", background: "white", borderRadius: 20, border: "1px solid #EEF2FF" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(2,175,207,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CalendarX size={32} color="#02AFCF" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#053366", marginBottom: 8 }}>Aucune réservation</p>
      <p style={{ fontSize: 14, color: "#9CA3AF" }}>Publiez des excursions pour commencer à recevoir des réservations</p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rr-row{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;gap:16px;background:white;border-radius:14px;border:1px solid #EEF2FF;margin-bottom:10px;transition:all .15s;animation:fadeUp .3s ease both}
        .rr-row:hover{background:#F8FAFF;border-color:#DCE5FF;box-shadow:0 4px 16px rgba(5,51,102,.06)}
        .rr-search{width:100%;padding:10px 14px 10px 38px;border:1.5px solid #DCE5FF;border-radius:12px;font-size:13px;font-family:inherit;outline:none;color:#053366;background:white;transition:border .2s}
        .rr-search:focus{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.1)}
        .rr-tab{display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .18s;white-space:nowrap}
        .rr-tab.on{background:linear-gradient(135deg,#02AFCF,#259FFC);color:white;border:none;box-shadow:0 3px 10px rgba(2,175,207,.35)}
        .rr-tab:not(.on){background:white;color:#053366;border:1.5px solid #DCE5FF}
        .rr-btn-confirm{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#02AFCF,#259FFC);color:white;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(2,175,207,.3);transition:all .15s}
        .rr-btn-confirm:hover{box-shadow:0 4px 14px rgba(2,175,207,.45);transform:translateY(-1px)}
        .rr-btn-cancel{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:10px;border:none;background:#FEE2E2;color:#DC2626;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
        .rr-btn-cancel:hover{background:#FECACA}
        .rr-btn-done{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:10px;border:1.5px solid #DCE5FF;background:white;color:#053366;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
        .rr-btn-done:hover{background:#DCE5FF}
        @media(max-width:600px){.rr-row{flex-direction:column;align-items:flex-start}.rr-actions{align-self:flex-end}.rr-amounts{text-align:left!important}}
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 2000, display: "flex", alignItems: "center", gap: 8, padding: "13px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: toast.ok ? "#DCFCE7" : "#FEE2E2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#86EFAC" : "#FCA5A5"}`, boxShadow: "0 4px 16px rgba(0,0,0,.1)", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
          {toast.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}{toast.msg}
        </div>
      )}

      {cancelTarget && (
        <CancelModal reservation={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancelConfirm} loading={loading === cancelTarget.id} />
      )}

      {/* ── Diagnostic ── */}
      <DiagnosticExcursions stats={excursionStats} />

      {/* ── Filtres + Search ── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #EEF2FF", padding: "14px 16px", marginBottom: 20, boxShadow: "0 2px 8px rgba(5,51,102,.05)" }}>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={15} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="rr-search" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher voyageur, excursion, code..." />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map(tab => {
            const count = counts[tab.key] ?? 0;
            const active = filter === tab.key;
            if (tab.key !== "all" && count === 0) return null;
            return (
              <button key={tab.key} className={`rr-tab ${active ? "on" : ""}`} onClick={() => setFilter(tab.key)}>
                <tab.Icon size={12} strokeWidth={2} /> {tab.label}
                <span style={{ padding: "1px 7px", borderRadius: 20, fontSize: 11, background: active ? "rgba(255,255,255,.25)" : "rgba(5,51,102,.07)", color: active ? "white" : "#053366" }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Liste réservations ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "white", borderRadius: 16, border: "1px solid #EEF2FF" }}>
          <Search size={28} color="#DCE5FF" style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontWeight: 700, color: "#053366", marginBottom: 4 }}>Aucun résultat</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 14 }}>{search ? `Aucune réservation pour « ${search} »` : "Aucune réservation dans cette catégorie"}</p>
          {(search || filter !== "all") && (
            <button onClick={() => { setSearch(""); setFilter("all"); }} style={{ padding: "8px 18px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "inherit" }}>Réinitialiser</button>
          )}
        </div>
      ) : filtered.map((r, i) => {
        const s = STATUS[r.status] ?? STATUS.pending;
        const isLoading = loading === r.id;
        const net = r.total_price - r.platform_fee;
        return (
          <div key={r.id} className="rr-row" style={{ animationDelay: `${i * .04}s`, borderLeft: `4px solid ${s.dot}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />{s.label}
                </span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#02AFCF", fontWeight: 700, background: "rgba(2,175,207,.08)", padding: "2px 8px", borderRadius: 8 }}>#{r.booking_code}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#053366", marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.excursion_title}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><User size={12} color="#9CA3AF" /> {r.touriste_name}</span>
                {r.excursion_city && <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} color="#9CA3AF" /> {r.excursion_city}</span>}
                <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><CalendarDays size={12} color="#9CA3AF" /> {fmtDate(r.date)} {r.time && `à ${r.time}`}</span>
                <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}><Users size={12} color="#9CA3AF" /> {r.people_count} pers.</span>
              </div>
            </div>
            <div className="rr-actions" style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <div className="rr-amounts" style={{ textAlign: "right" }}>
                <p style={{ fontSize: 17, fontWeight: 900, color: "#053366", margin: 0, lineHeight: 1 }}>{r.total_price} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span></p>
                <p style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600, marginTop: 4, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}><Banknote size={11} color="#02AFCF" /> Net : {net} TND</p>
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
  );
}
