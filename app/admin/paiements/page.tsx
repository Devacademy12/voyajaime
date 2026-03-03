import { createServerSupabaseClient } from "@/lib/supabaseServer";

export default async function AdminPaiements() {
  const supabase = await createServerSupabaseClient();

  const { data: paiements } = await supabase
    .from("paiements")
    .select("*, prestataire:profiles!prestataire_id(full_name, agency_name), reservation:reservations(booking_code, date, excursion:excursions(title))")
    .order("created_at", { ascending: false });

  const totalAmount = paiements?.reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalFees = paiements?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.platform_fee), 0) || 0;
  const totalNet = paiements?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0) || 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Paiements & finances</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>{paiements?.length || 0} transactions</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Volume total", value: `${totalAmount} TND`, color: "#111827" },
          { label: "Commission encaissée", value: `${totalFees} TND`, color: "#2B96A8" },
          { label: "Versé aux prestataires", value: `${totalNet} TND`, color: "#059669" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {!paiements?.length ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ color: "#6B7280" }}>Aucun paiement encore</p>
        </div>
      ) : (
        <div className="table-wrapper">
          {paiements.map((p, idx) => {
            const prestataire = p.prestataire as Record<string, unknown> | null;
            const reservation = p.reservation as Record<string, unknown> | null;
            const excursion = reservation?.excursion as Record<string, unknown> | null;
            return (
              <div key={String(p.id)} className="table-row" style={{ borderBottom: idx < paiements.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                    {excursion?.title as string || "—"} — #{reservation?.booking_code as string}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>
                    🏢 {prestataire?.agency_name as string || prestataire?.full_name as string || "—"} · 📅 {reservation?.date as string} · Comm. {Number(p.platform_fee)} TND
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{Number(p.amount)} TND</p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Net prestataire : {Number(p.net_amount)} TND</p>
                  </div>
                  <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "refunded" ? "badge-red" : "badge-yellow"}`}>
                    {p.status === "paid" ? "✅ Payé" : p.status === "refunded" ? "🔄 Remboursé" : "⏳ En attente"}
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
