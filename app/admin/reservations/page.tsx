import { createServerSupabaseClient } from "@/lib/supabaseServer";

const STATUS_LABEL: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };
const STATUS_CLASS: Record<string, string> = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };

export default async function AdminReservations() {
  const supabase = await createServerSupabaseClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, excursion:excursions(title, city, prestataire_id), touriste:profiles!touriste_id(full_name)")
    .order("created_at", { ascending: false });

  const stats = {
    total: reservations?.length || 0,
    pending: reservations?.filter((r) => r.status === "pending").length || 0,
    confirmed: reservations?.filter((r) => r.status === "confirmed").length || 0,
    totalRevenue: reservations?.reduce((s, r) => s + Number(r.total_price), 0) || 0,
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Toutes les réservations</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>{stats.total} au total · {stats.pending} en attente · {stats.confirmed} confirmées</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total réservations", value: stats.total, color: "#2B96A8" },
          { label: "En attente", value: stats.pending, color: "#D97706" },
          { label: "Chiffre d'affaires", value: `${stats.totalRevenue} TND`, color: "#059669" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{String(s.value)}</p>
          </div>
        ))}
      </div>

      {!reservations?.length ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ color: "#6B7280" }}>Aucune réservation</p>
        </div>
      ) : (
        <div className="table-wrapper">
          {reservations.map((r, idx) => {
            const exc = r.excursion as Record<string, unknown> | null;
            const touriste = r.touriste as Record<string, unknown> | null;
            const status = String(r.status);
            return (
              <div key={String(r.id)} className="table-row" style={{ borderBottom: idx < reservations.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className={`badge ${STATUS_CLASS[status] || "badge-gray"}`}>{STATUS_LABEL[status] || status}</span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>#{String(r.booking_code)}</span>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{exc?.title as string || "—"}</p>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>
                    👤 {touriste?.full_name as string || "Anonyme"} · 📍 {exc?.city as string} · 📅 {String(r.date)} · 👥 {Number(r.people_count)} pers.
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{Number(r.total_price)} TND</p>
                  <p style={{ fontSize: "11px", color: "#9CA3AF" }}>comm. {Number(r.platform_fee)} TND</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
