import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  TrendingUp,
  Map,
  CalendarClock,
  Star,
  Plus,
  CalendarDays,
  Clock,
  ArrowRight,
} from "lucide-react";

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

  const stats = [
    { label: "Revenu total",            value: `${revenue} TND`, icon: <TrendingUp size={20} />, color: "#059669", bg: "rgba(5,150,105,.08)"   },
    { label: "Excursions actives",       value: activeExc,        icon: <Map size={20} />,        color: "#2B96A8", bg: "rgba(43,150,168,.08)"  },
    { label: "En attente",               value: pending,          icon: <CalendarClock size={20}/>,color: "#D97706", bg: "rgba(217,119,6,.08)"   },
    { label: "Note moyenne",             value: avgRating,        icon: <Star size={20} />,       color: "#7C3AED", bg: "rgba(124,58,237,.08)"  },
  ];

  const statusClass: Record<string, string> = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };
  const statusLabel: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Bonjour, {name}</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{String(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
        <a href="/prestataire/excursions/nouveau" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <Plus size={16} /> Ajouter une excursion
        </a>
        <a href="/prestataire/reservations" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <CalendarDays size={16} /> Voir les réservations
        </a>
      </div>

      {/* Pending alert */}
      {pending > 0 && (
        <div style={{ marginBottom: "20px", padding: "14px 18px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "14px", color: "#D97706", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={15} style={{ flexShrink: 0 }} />
            Vous avez <strong>{pending} réservation(s)</strong> en attente de confirmation
          </p>
          <a href="/prestataire/reservations" style={{ fontSize: "13px", color: "#D97706", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Voir <ArrowRight size={14} />
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
              return (
                <div key={String(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F9FAFB", borderRadius: "10px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                      {exc?.title as string || "Excursion"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6B7280", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      #{String(r.booking_code)}
                      &nbsp;·&nbsp;
                      <CalendarDays size={11} /> {String(r.date)}
                      &nbsp;·&nbsp; {Number(r.people_count)} pers.
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