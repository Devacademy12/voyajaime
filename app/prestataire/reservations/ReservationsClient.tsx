"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  CalendarDays,
  Users,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Loader2,
  CalendarX,
} from "lucide-react";

const STATUS_LABEL: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };
const STATUS_CLASS: Record<string, string> = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };

interface Props {
  reservations: Record<string, unknown>[];
}

export default function ReservationsClient({ reservations: initial }: Props) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (!error) {
      setReservations((prev) => prev.map((r) => String(r.id) === id ? { ...r, status } : r));
      if (status === "confirmed") showToast("Réservation confirmée !", "success");
      else showToast("Réservation annulée", "error");
    }
    setLoading(null);
  };

  const filtered = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  const counts = {
    all:       reservations.length,
    pending:   reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    completed: reservations.filter((r) => r.status === "completed").length,
  };

  if (!reservations.length) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "60px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(43,150,168,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CalendarX size={36} style={{ color: "#2B96A8" }} />
        </div>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Aucune réservation</p>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>Publiez des excursions pour commencer à recevoir des réservations</p>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {toast.type === "success"
            ? <CheckCircle2 size={15} />
            : <XCircle size={15} />
          }
          {toast.msg}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "all",       label: "Toutes" },
          { key: "pending",   label: "En attente" },
          { key: "confirmed", label: "Confirmées" },
          { key: "completed", label: "Terminées" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "7px 14px", borderRadius: "20px", cursor: "pointer",
              fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
              background: filter === tab.key ? "#2B96A8" : "white",
              color:      filter === tab.key ? "white"   : "#6B7280",
              border:     filter === tab.key ? "none"    : "1px solid #E5E7EB",
            }}
          >
            {tab.label} ({counts[tab.key as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#6B7280" }}>Aucune réservation dans cette catégorie</p>
        </div>
      ) : (
        <div className="table-wrapper">
          {filtered.map((r, idx) => {
            const exc      = r.excursion as Record<string, unknown> | null;
            const touriste = r.touriste  as Record<string, unknown> | null;
            const status   = String(r.status);
            const isLoading = loading === String(r.id);

            return (
              <div key={String(r.id)} className="table-row" style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span className={`badge ${STATUS_CLASS[status] || "badge-gray"}`}>{STATUS_LABEL[status] || status}</span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>#{String(r.booking_code)}</span>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: 3 }}>{exc?.title as string || "—"}</p>
                  <p style={{ fontSize: "12px", color: "#6B7280", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <User size={11} /> {touriste?.full_name as string || "Anonyme"}
                    </span>
                    <span style={{ color: "#D1D5DB" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CalendarDays size={11} /> {String(r.date)} à {String(r.time)}
                    </span>
                    <span style={{ color: "#D1D5DB" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Users size={11} /> {Number(r.people_count)} pers.
                    </span>
                       
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{Number(r.total_price)} TND</p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Net : {Number(r.total_price) - Number(r.platform_fee)} TND</p>
                  </div>

                  {status === "pending" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => updateStatus(String(r.id), "confirmed")}
                        disabled={isLoading}
                        className="btn-success"
                        style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        {isLoading
                          ? <Loader2 size={13} style={{ animation: "spin .6s linear infinite" }} />
                          : <CheckCircle2 size={13} />
                        }
                        Confirmer
                      </button>
                      <button
                        onClick={() => updateStatus(String(r.id), "cancelled")}
                        disabled={isLoading}
                        className="btn-danger"
                        style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <XCircle size={13} /> Annuler
                      </button>
                    </div>
                  )}

                  {status === "confirmed" && (
                    <button
                      onClick={() => updateStatus(String(r.id), "completed")}
                      disabled={isLoading}
                      className="btn-secondary"
                      style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      {isLoading
                        ? <Loader2 size={13} style={{ animation: "spin .6s linear infinite" }} />
                        : <CheckCheck size={13} />
                      }
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