"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  CalendarDays, Users, User, CheckCircle2, XCircle,
  CheckCheck, Loader2, CalendarX, Clock, MapPin,
  Banknote, Search, ChevronDown,
} from "lucide-react";

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
  excursion_title: string;
  excursion_city: string;
}

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  pending:   { label: "En attente", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A", Icon: Clock        },
  confirmed: { label: "Confirmée",  color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7", Icon: CheckCircle2 },
  completed: { label: "Terminée",   color: "#1E40AF", bg: "#DBEAFE", border: "#93C5FD", Icon: CheckCheck   },
  cancelled: { label: "Annulée",    color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5", Icon: XCircle      },
};

type FilterKey = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const TABS: { key: FilterKey; label: string; Icon: React.ElementType }[] = [
  { key: "pending",   label: "En attente", Icon: Clock        },
  { key: "confirmed", label: "Confirmées", Icon: CheckCircle2 },
  { key: "completed", label: "Terminées",  Icon: CheckCheck   },
  { key: "all",       label: "Toutes",     Icon: CalendarDays },
];

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function ReservationsClient({ reservations: initial }: { reservations: ResRow[] }) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(initial);
  const [loading, setLoading]           = useState<string | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter]             = useState<FilterKey>("all");
  const [search, setSearch]             = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (!error) {
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      showToast(
        status === "confirmed" ? "Réservation confirmée !" :
        status === "completed" ? "Réservation terminée !"  : "Réservation annulée",
        status !== "cancelled"
      );
    } else {
      showToast("Erreur lors de la mise à jour", false);
    }
    setLoading(null);
  };

  const counts: Record<string, number> = { all: reservations.length };
  reservations.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });

  const filtered = reservations.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.booking_code.toLowerCase().includes(q) ||
        r.touriste_name.toLowerCase().includes(q) ||
        r.excursion_title.toLowerCase().includes(q) ||
        r.excursion_city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ── Empty state ── */
  if (reservations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "70px 20px", background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(43,150,168,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CalendarX size={32} color="#2B96A8" strokeWidth={1.5} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucune réservation</p>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Publiez des excursions pour commencer à recevoir des réservations</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 100,
          display: "flex", alignItems: "center", gap: 8,
          padding: "13px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: toast.ok ? "#D1FAE5" : "#FEE2E2",
          color:      toast.ok ? "#059669" : "#DC2626",
          border:     `1px solid ${toast.ok ? "#6EE7B7" : "#FCA5A5"}`,
          boxShadow: "0 4px 16px rgba(0,0,0,.1)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {toast.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        background: "white", borderRadius: 16, border: "1px solid #E5E7EB",
        padding: "14px 18px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {/* Recherche */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={14} color="#9CA3AF" strokeWidth={2}
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par voyageur, excursion, code..."
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

        {/* Pills filtres */}
        {TABS.map((tab) => {
          const count  = counts[tab.key] ?? 0;
          const active = filter === tab.key;
          if (tab.key !== "all" && count === 0) return null;
          return (
            <button key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 20,
                border: active ? "none" : "1px solid #E5E7EB",
                background: active ? "#2B96A8" : "white",
                color: active ? "white" : "#6B7280",
                fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
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
        <div style={{ textAlign: "center", padding: 50, background: "white", borderRadius: 16, border: "1px solid #E5E7EB" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Search size={22} color="#9CA3AF" strokeWidth={1.5} />
          </div>
          <p style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>Aucun résultat</p>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {search ? `Aucune réservation pour « ${search} »` : "Aucune réservation dans cette catégorie"}
          </p>
          {(search || filter !== "all") && (
            <button onClick={() => { setSearch(""); setFilter("all"); }}
              style={{ marginTop: 12, padding: "8px 18px", background: "#F3F4F6", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
              Réinitialiser
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {filtered.map((r, i) => {
            const s         = STATUS[r.status] ?? STATUS.pending;
            const isLoading = loading === r.id;

            return (
              <div key={r.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "18px 22px", gap: 20,
                  borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
                  borderLeft: `3px solid ${s.color === "#92400E" ? "#F59E0B" : s.color === "#065F46" ? "#10B981" : s.color === "#1E40AF" ? "#3B82F6" : "#EF4444"}`,
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#FAFAFA")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "white")}
              >
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {/* Badge statut */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                    }}>
                      <s.Icon size={11} strokeWidth={2.5} />
                      {s.label}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9CA3AF", background: "#F3F4F6", padding: "2px 7px", borderRadius: 6 }}>
                      #{r.booking_code}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 5 }}>
                    {r.excursion_title}
                  </p>

                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <User size={11} color="#9CA3AF" strokeWidth={1.5} /> {r.touriste_name}
                    </span>
                    {r.excursion_city && (
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} color="#9CA3AF" strokeWidth={1.5} /> {r.excursion_city}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <CalendarDays size={11} color="#9CA3AF" strokeWidth={1.5} /> {fmtDate(r.date)} à {r.time}
                    </span>
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={11} color="#9CA3AF" strokeWidth={1.5} /> {r.people_count} personne{r.people_count > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Montant + Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                      {r.total_price} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span>
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 2 }}>
                      <Banknote size={10} color="#C4B8B0" strokeWidth={1.5} />
                      Net : {r.total_price - r.platform_fee} TND
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  {r.status === "pending" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => updateStatus(r.id, "confirmed")}
                        disabled={isLoading}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "7px 13px", borderRadius: 10, border: "none",
                          background: "#059669", color: "white",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          fontFamily: "inherit", opacity: isLoading ? 0.6 : 1,
                          transition: "opacity .15s",
                        }}
                      >
                        {isLoading
                          ? <Loader2 size={13} style={{ animation: "spin .6s linear infinite" }} />
                          : <CheckCircle2 size={13} />}
                        Confirmer
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "cancelled")}
                        disabled={isLoading}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "7px 13px", borderRadius: 10, border: "none",
                          background: "#FEE2E2", color: "#DC2626",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          fontFamily: "inherit", opacity: isLoading ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={13} /> Annuler
                      </button>
                    </div>
                  )}

                  {r.status === "confirmed" && (
                    <button
                      onClick={() => updateStatus(r.id, "completed")}
                      disabled={isLoading}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "7px 13px", borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        background: "white", color: "#374151",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit", opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      {isLoading
                        ? <Loader2 size={13} style={{ animation: "spin .6s linear infinite" }} />
                        : <CheckCheck size={13} />}
                      Terminer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}