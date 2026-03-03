import { createServerSupabaseClient } from "@/lib/supabaseServer";

export default async function PrestatairePaiements() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: paiements } = await supabase
    .from("paiements")
    .select("*, reservation:reservations(booking_code, date, people_count, excursion:excursions(title))")
    .eq("prestataire_id", user!.id)
    .order("created_at", { ascending: false });

  const totalPaid = paiements?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0) || 0;
  const totalPending = paiements?.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.net_amount), 0) || 0;
  const totalFees = paiements?.reduce((s, p) => s + Number(p.platform_fee), 0) || 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Paiements</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Historique de vos revenus</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "28px" }}>
        <div className="stat-card" style={{ borderLeft: "4px solid #059669" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>Total encaissé</p>
          <p style={{ fontSize: "26px", fontWeight: 700, color: "#059669" }}>{totalPaid} TND</p>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #D97706" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>En attente de versement</p>
          <p style={{ fontSize: "26px", fontWeight: 700, color: "#D97706" }}>{totalPending} TND</p>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #9CA3AF" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>Commission plateforme (10%)</p>
          <p style={{ fontSize: "26px", fontWeight: 700, color: "#9CA3AF" }}>{totalFees} TND</p>
        </div>
      </div>

      {!paiements?.length ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>💰</p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Aucun paiement encore</p>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>Vos paiements apparaîtront ici après vos premières réservations confirmées</p>
        </div>
      ) : (
        <div className="table-wrapper">
          {paiements.map((p, idx) => {
            const reservation = p.reservation as Record<string, unknown> | null;
            const excursion = reservation?.excursion as Record<string, unknown> | null;
            return (
              <div key={String(p.id)} className="table-row" style={{ borderBottom: idx < paiements.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                    {excursion?.title as string || "Excursion"} — #{reservation?.booking_code as string}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>
                    📅 {reservation?.date as string} · 👥 {Number(reservation?.people_count)} pers. · Commission : {Number(p.platform_fee)} TND
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{Number(p.net_amount)} TND</p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>sur {Number(p.amount)} TND total</p>
                  </div>
                  <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "refunded" ? "badge-red" : "badge-yellow"}`}>
                    {p.status === "paid" ? "✅ Versé" : p.status === "refunded" ? "🔄 Remboursé" : "⏳ En attente"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
