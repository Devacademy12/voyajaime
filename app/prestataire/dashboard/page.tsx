import { createServerSupabaseClient } from "@/lib/supabaseServer";

export default async function PrestataireDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
  const { data: excursions } = await supabase.from("excursions").select("id, title, rating, is_active, reviews_count").eq("prestataire_id", user!.id);
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, excursion:excursions!inner(title, prestataire_id)")
    .eq("excursion.prestataire_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: paiements } = await supabase.from("paiements").select("net_amount, status").eq("prestataire_id", user!.id);

  const revenue = paiements?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0) || 0;
  const pending = reservations?.filter((r) => r.status === "pending").length || 0;
  const activeExc = excursions?.filter((e) => e.is_active).length || 0;
  const avgRating = excursions?.length
    ? (excursions.reduce((s, e) => s + (Number(e.rating) || 0), 0) / excursions.length).toFixed(1)
    : "—";

  const name = String(profile?.agency_name || profile?.full_name || "Prestataire");

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Bonjour, {name} 👋</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Revenu total", value: `${revenue} TND`, icon: "💰", color: "#059669" },
          { label: "Excursions actives", value: activeExc, icon: "🏔️", color: "#2B96A8" },
          { label: "En attente", value: pending, icon: "⏳", color: "#D97706" },
          { label: "Note moyenne", value: `⭐ ${avgRating}`, icon: "⭐", color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "8px" }}>{s.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{String(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
        <a href="/prestataire/excursions/nouveau" className="btn-primary" style={{ textDecoration: "none" }}>
          + Ajouter une excursion
        </a>
        <a href="/prestataire/reservations" className="btn-secondary" style={{ textDecoration: "none" }}>
          Voir les réservations
        </a>
      </div>

      {/* Pending alert */}
      {pending > 0 && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "14px", color: "#D97706", fontWeight: 500 }}>
            ⏳ Vous avez <strong>{pending} réservation(s)</strong> en attente de confirmation
          </p>
          <a href="/prestataire/reservations" style={{ fontSize: "13px", color: "#D97706", fontWeight: 600, textDecoration: "none" }}>
            Voir →
          </a>
        </div>
      )}

      {/* Recent reservations */}
      {reservations && reservations.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
            Réservations récentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {reservations.map((r) => {
              const exc = r.excursion as Record<string, unknown> | null;
              const statusClass: Record<string, string> = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };
              const statusLabel: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };
              return (
                <div key={String(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F9FAFB", borderRadius: "10px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                      {exc?.title as string || "Excursion"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6B7280" }}>
                      #{String(r.booking_code)} · {String(r.date)} · {Number(r.people_count)} pers.
                    </p>
                  </div>
                  <span className={`badge ${statusClass[String(r.status)] || "badge-gray"}`}>
                    {statusLabel[String(r.status)] || String(r.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
