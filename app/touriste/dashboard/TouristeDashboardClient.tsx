"use client";

interface Props {
  profile: Record<string, unknown> | null;
  reservations: Record<string, unknown>[];
  favorisCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};
const STATUS_CLASS: Record<string, string> = {
  pending: "badge-yellow",
  confirmed: "badge-green",
  completed: "badge-blue",
  cancelled: "badge-red",
};

export default function TouristeDashboardClient({ profile, reservations, favorisCount }: Props) {
  const firstName = String(profile?.full_name || "Voyageur").split(" ")[0];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>
          Bonjour, {firstName} 👋
        </h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>
          Prêt pour votre prochaine aventure en Tunisie ?
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { icon: "🤖", title: "Mode Assisté", desc: "On crée votre itinéraire", href: "/touriste/itineraire?mode=assiste", color: "#2B96A8" },
          { icon: "✏️", title: "Mode Libre", desc: "Construisez vous-même", href: "/touriste/itineraire?mode=libre", color: "#7C3AED" },
          { icon: "🔍", title: "Explorer", desc: "Parcourir les excursions", href: "/touriste/itineraire", color: "#D97706" },
        ].map((a) => (
          <a
            key={a.title}
            href={a.href}
            style={{ textDecoration: "none" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).querySelector(".action-card") as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).querySelector(".action-card") as HTMLDivElement).style.boxShadow = "none"}
          >
            <div className="action-card card" style={{ cursor: "pointer", transition: "box-shadow 0.2s", height: "100%" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>{a.icon}</div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>{a.title}</h3>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>{a.desc}</p>
              <span style={{ padding: "4px 12px", borderRadius: "20px", background: `${a.color}15`, color: a.color, fontSize: "12px", fontWeight: 600 }}>
                Commencer →
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px", maxWidth: "480px", marginBottom: "32px" }}>
        {[
          { label: "Réservations", value: reservations.length, icon: "📅", href: "/touriste/reservations" },
          { label: "Favoris", value: favorisCount, icon: "❤️", href: "/touriste/favoris" },
        ].map((s) => (
          <a key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }}>
              <span style={{ fontSize: "28px" }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>{s.value}</p>
                <p style={{ fontSize: "13px", color: "#6B7280" }}>{s.label}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Recent Reservations */}
      {reservations.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>
            Réservations récentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {reservations.map((r) => {
              const exc = r.excursion as Record<string, unknown> | null;
              const status = String(r.status);
              return (
                <div key={String(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F9FAFB", borderRadius: "10px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                      {exc?.title as string || "Excursion"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6B7280" }}>
                      📍 {exc?.city as string} · 📅 {String(r.date)} · #{String(r.booking_code)}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <span style={{ fontWeight: 600 }}>{Number(r.total_price)} TND</span>
                    <span className={`badge ${STATUS_CLASS[status] || "badge-gray"}`}>
                      {STATUS_LABEL[status] || status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <a href="/touriste/reservations" style={{ display: "block", marginTop: "12px", textAlign: "center", fontSize: "13px", color: "#2B96A8", textDecoration: "none" }}>
            Voir toutes les réservations →
          </a>
        </div>
      )}
    </div>
  );
}
