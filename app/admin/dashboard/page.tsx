import { createAdminClient } from "@/lib/supabaseAdmin";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const { count: totalTouristes } = await supabase
    .from("profiles").select("*", { count: "exact", head: true }).eq("role", "touriste");
  const { count: totalPrestataires } = await supabase
    .from("profiles").select("*", { count: "exact", head: true }).eq("role", "prestataire");
  const { count: excActives } = await supabase
    .from("excursions").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: totalResa } = await supabase
    .from("reservations").select("*", { count: "exact", head: true });
  const { data: paiements } = await supabase
    .from("paiements").select("amount, platform_fee, status");

  const { data: pendingPrestataires } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "prestataire")
    .eq("is_validated", false)
    .order("created_at", { ascending: false });

  const { data: pendingAvis } = await supabase
    .from("avis")
    .select("*, excursion:excursions(title), touriste:profiles!touriste_id(full_name)")
    .eq("is_moderated", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentResa } = await supabase
    .from("reservations")
    .select("*, excursion:excursions(title, city)")
    .order("created_at", { ascending: false })
    .limit(5);

  const totalRevenue = paiements?.reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalFees = paiements?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.platform_fee), 0) || 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Dashboard Admin</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Vue globale de la plateforme VoyajAime</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Touristes", value: totalTouristes || 0, icon: "🧳" },
          { label: "Prestataires", value: totalPrestataires || 0, icon: "🏢" },
          { label: "Excursions actives", value: excActives || 0, icon: "🏔️" },
          { label: "Réservations", value: totalResa || 0, icon: "📅" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>{s.value}</p>
            <p style={{ fontSize: "13px", color: "#6B7280" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
        <div className="stat-card" style={{ borderLeft: "4px solid #059669" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>Chiffre d&apos;affaires total</p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#059669" }}>{totalRevenue} TND</p>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #2B96A8" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>Commission encaissée (10%)</p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#2B96A8" }}>{totalFees} TND</p>
        </div>
      </div>

      {/* Alerte prestataires en attente */}
      {pendingPrestataires && pendingPrestataires.length > 0 && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "14px", color: "#D97706", fontWeight: 500 }}>
            ⏳ <strong>{pendingPrestataires.length} prestataire(s)</strong> en attente de validation
          </p>
          <a href="/admin/prestataires" style={{ fontSize: "13px", color: "#D97706", fontWeight: 600, textDecoration: "none" }}>
            Valider →
          </a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Prestataires à valider */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>Prestataires en attente</h2>
            <a href="/admin/prestataires" style={{ fontSize: "13px", color: "#2B96A8", textDecoration: "none" }}>Voir tous →</a>
          </div>
          {!pendingPrestataires?.length ? (
            <p style={{ color: "#6B7280", fontSize: "14px" }}>✅ Aucun en attente</p>
          ) : (
            pendingPrestataires.slice(0, 3).map((p) => (
              <div key={String(p.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F9FAFB", borderRadius: "8px", marginBottom: "8px" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                    {String(p.agency_name || p.full_name || "—")}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>
                    📍 {String(p.city || "—")} · {new Date(String(p.created_at)).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <a href="/admin/prestataires" style={{ padding: "5px 12px", background: "#2B96A8", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                  Valider
                </a>
              </div>
            ))
          )}
        </div>

        {/* Avis à modérer */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>Avis à modérer</h2>
            <a href="/admin/avis" style={{ fontSize: "13px", color: "#2B96A8", textDecoration: "none" }}>Voir tous →</a>
          </div>
          {!pendingAvis?.length ? (
            <p style={{ color: "#6B7280", fontSize: "14px" }}>✅ Aucun avis en attente</p>
          ) : (
            pendingAvis.map((a) => {
              const touriste = a.touriste as Record<string, unknown> | null;
              const excursion = a.excursion as Record<string, unknown> | null;
              return (
                <div key={String(a.id)} style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: "8px", marginBottom: "8px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827", marginBottom: "2px" }}>
                    {touriste?.full_name as string || "Anonyme"} — ⭐ {Number(a.rating)}/5
                  </p>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>{excursion?.title as string}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Réservations récentes */}
      {recentResa && recentResa.length > 0 && (
        <div className="card" style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>Réservations récentes</h2>
            <a href="/admin/reservations" style={{ fontSize: "13px", color: "#2B96A8", textDecoration: "none" }}>Voir toutes →</a>
          </div>
          {recentResa.map((r) => {
            const exc = r.excursion as Record<string, unknown> | null;
            const statusClass: Record<string, string> = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };
            const statusLabel: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };
            return (
              <div key={String(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F9FAFB", borderRadius: "8px", marginBottom: "8px" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>{exc?.title as string || "—"}</p>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>
                    #{String(r.booking_code)} · {String(r.date)} · {Number(r.people_count)} pers.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 600 }}>{Number(r.total_price)} TND</span>
                  <span className={`badge ${statusClass[String(r.status)] || "badge-gray"}`}>
                    {statusLabel[String(r.status)] || String(r.status)}
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