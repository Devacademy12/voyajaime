"use client";

import {
  TrendingUp,
  Map,
  CalendarClock,
  Star,
  Plus,
  CalendarDays,
  Clock,
  AlertCircle,
} from "lucide-react";

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
        excursions.reduce((s, e) => s + (Number(e.rating) || 0), 0) /
        excursions.length
      ).toFixed(1)
    : "—";

  const name =
    profile?.agency_name || profile?.full_name || "Prestataire";

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

  const stats = [
    {
      label: "Revenu total",
      value: `${revenue} TND`,
      icon: <TrendingUp size={20} />,
      color: "#2B96A8",
      bg: "rgba(43,150,168,.08)",
    },
    {
      label: "Excursions actives",
      value: activeExc,
      icon: <Map size={20} />,
      color: "#7C3AED",
      bg: "rgba(124,58,237,.08)",
    },
    {
      label: "Réservations en attente",
      value: pending,
      icon: <CalendarClock size={20} />,
      color: "#D97706",
      bg: "rgba(217,119,6,.08)",
    },
    {
      label: "Note moyenne",
      value: avgRating,
      icon: <Star size={20} />,
      color: "#F59E0B",
      bg: "rgba(245,158,11,.08)",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Bonjour, {name}</h1>
        <p style={{ color: "#6B7280" }}>Vue d&apos;ensemble de votre activité</p>
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
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: 16,
              background: "#F9FAFB",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: s.bg,
                color: s.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <a
          href="/prestataire/excursions/nouveau"
          className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <Plus size={16} /> Ajouter une excursion
        </a>
        <a
          href="/prestataire/reservations"
          className="btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <CalendarDays size={16} /> Voir les réservations
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
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 14,
            color: "#92400E",
            border: "1px solid #FDE68A",
          }}
        >
          <Clock size={16} style={{ flexShrink: 0 }} />
          Vous avez <b>{pending}</b> réservation(s) en attente
        </div>
      )}

      {/* Recent reservations */}
      {reservations.length > 0 && (
        <div style={{ padding: 20, background: "white", borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>Réservations récentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reservations.map((r) => {
              const exc = r.excursion;
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 12,
                    background: "#F9FAFB",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 500 }}>{exc?.title || "Excursion"}</p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 3,
                      }}
                    >
                      <AlertCircle size={11} /> #{r.booking_code}
                      &nbsp;·&nbsp;
                      <CalendarDays size={11} /> {r.date}
                      &nbsp;·&nbsp; {r.people_count} pers.
                    </p>
                  </div>
                  <span className={`badge ${statusClass[r.status] || "badge-gray"}`}>
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