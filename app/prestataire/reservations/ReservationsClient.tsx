"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const STATUS_LABEL: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };
const STATUS_CLASS: Record<string, string> = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };

interface Props {
  reservations: Record<string, unknown>[];
}

export default function ReservationsClient({ reservations: initial }: Props) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (!error) {
      setReservations((prev) => prev.map((r) => String(r.id) === id ? { ...r, status } : r));
      showToast(status === "confirmed" ? "✅ Réservation confirmée !" : "❌ Réservation annulée");
    }
    setLoading(null);
  };

  const filtered = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  const counts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    completed: reservations.filter((r) => r.status === "completed").length,
  };

  if (!reservations.length) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "60px" }}>
        <p style={{ fontSize: "48px", marginBottom: "16px" }}>📅</p>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Aucune réservation</p>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>Publiez des excursions pour commencer à recevoir des réservations</p>
      </div>
    );
  }

  return (
    <>
      {toast && <div className="toast toast-success">{toast}</div>}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "Toutes" },
          { key: "pending", label: "En attente" },
          { key: "confirmed", label: "Confirmées" },
          { key: "completed", label: "Terminées" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ padding: "7px 14px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
              background: filter === tab.key ? "#2B96A8" : "white",
              color: filter === tab.key ? "white" : "#6B7280",
              border: filter === tab.key ? "none" : "1px solid #E5E7EB",
            }}>
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
            const exc = r.excursion as Record<string, unknown> | null;
            const touriste = r.touriste as Record<string, unknown> | null;
            const status = String(r.status);
            return (
              <div key={String(r.id)} className="table-row" style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span className={`badge ${STATUS_CLASS[status] || "badge-gray"}`}>{STATUS_LABEL[status] || status}</span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>#{String(r.booking_code)}</span>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{exc?.title as string || "—"}</p>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>
                    👤 {touriste?.full_name as string || "Anonyme"} · 📅 {String(r.date)} à {String(r.time)} · 👥 {Number(r.people_count)} pers.
                    {r.special_needs && ` · 📝 ${String(r.special_needs)}`}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{Number(r.total_price)} TND</p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Net : {Number(r.total_price) - Number(r.platform_fee)} TND</p>
                  </div>
                  {status === "pending" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => updateStatus(String(r.id), "confirmed")} disabled={loading === String(r.id)} className="btn-success" style={{ fontSize: "12px", padding: "6px 12px" }}>
                        {loading === String(r.id) ? "..." : "✅ Confirmer"}
                      </button>
                      <button onClick={() => updateStatus(String(r.id), "cancelled")} disabled={loading === String(r.id)} className="btn-danger" style={{ fontSize: "12px", padding: "6px 12px" }}>
                        ❌ Annuler
                      </button>
                    </div>
                  )}
                  {status === "confirmed" && (
                    <button onClick={() => updateStatus(String(r.id), "completed")} disabled={loading === String(r.id)} className="btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }}>
                      {loading === String(r.id) ? "..." : "✔️ Terminer"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
