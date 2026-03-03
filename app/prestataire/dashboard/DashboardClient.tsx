"use client";

type Props = {
  profile: any;
  excursions: any[];
  reservations: any[];
  paiements: any[];
};

export default function DashboardClient({
  profile,
  excursions,
  reservations,
  paiements,
}: Props) {
  const revenue =
    paiements
      ?.filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.net_amount), 0) || 0;

  const pending =
    reservations?.filter((r) => r.status === "pending").length || 0;

  const activeExc =
    excursions?.filter((e) => e.is_active).length || 0;

  const avgRating = excursions.length
    ? (
        excursions.reduce(
          (s, e) => s + (Number(e.rating) || 0),
          0
        ) / excursions.length
      ).toFixed(1)
    : "—";

  const name =
    profile?.agency_name ||
    profile?.full_name ||
    "Prestataire";

  const statusClass: Record<string, string> = {
    pending: "badge-yellow",
    confirmed: "badge-green",
    completed: "badge-blue",
    cancelled: "badge-red",
  };

  const statusLabel: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmé",
    completed: "Terminé",
    cancelled: "Annulé",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>
          Bonjour, {name} 👋
        </h1>
        <p style={{ color: "#6B7280" }}>
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Revenu total",
            value: `${revenue} TND`,
          },
          {
            label: "Excursions actives",
            value: activeExc,
          },
          {
            label: "Réservations en attente",
            value: pending,
          },
          {
            label: "Note moyenne",
            value: `⭐ ${avgRating}`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card"
            style={{
              padding: 16,
              background: "#F9FAFB",
              borderRadius: 12,
            }}
          >
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              {s.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <a
          href="/prestataire/excursions/nouveau"
          className="btn-primary"
        >
          + Ajouter une excursion
        </a>

        <a
          href="/prestataire/reservations"
          className="btn-secondary"
        >
          Voir les réservations
        </a>
      </div>

      {/* Pending alert */}
      {pending > 0 && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            background: "#FEF3C7",
            borderRadius: 12,
          }}
        >
          ⏳ Vous avez <b>{pending}</b> réservation(s) en attente
        </div>
      )}

      {/* Recent reservations */}
      {reservations.length > 0 && (
        <div
          style={{
            padding: 20,
            background: "white",
            borderRadius: 12,
          }}
        >
          <h2 style={{ marginBottom: 16 }}>
            Réservations récentes
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reservations.map((r) => {
              const exc = r.excursion;

              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 12,
                    background: "#F9FAFB",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 500 }}>
                      {exc?.title || "Excursion"}
                    </p>

                    <p style={{ fontSize: 12, color: "#6B7280" }}>
                      #{r.booking_code} · {r.date} ·{" "}
                      {r.people_count} pers.
                    </p>
                  </div>

                  <span
                    className={`badge ${
                      statusClass[r.status] || "badge-gray"
                    }`}
                  >
                    {statusLabel[r.status] || r.status}
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
