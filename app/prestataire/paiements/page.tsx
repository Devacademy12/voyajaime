import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  TrendingUp,
  Clock,
  Percent,
  Wallet,
  CalendarDays,
  Users,
  CheckCircle2,
  RefreshCcw,
  Hourglass,
} from "lucide-react";

export default async function PrestatairePaiements() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: paiements } = await supabase
    .from("paiements")
    .select("*, reservation:reservations(booking_code, date, people_count, excursion:excursions(title))")
    .eq("prestataire_id", user!.id)
    .order("created_at", { ascending: false });

  const totalPaid    = paiements?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0) || 0;
  const totalPending = paiements?.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.net_amount), 0) || 0;
  const totalFees    = paiements?.reduce((s, p) => s + Number(p.platform_fee), 0) || 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Paiements</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Historique de vos revenus</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total encaissé",               value: `${totalPaid} TND`,    color: "#059669", icon: <TrendingUp size={20} />,  bg: "rgba(5,150,105,.08)",   border: "#059669" },
          { label: "En attente de versement",       value: `${totalPending} TND`, color: "#D97706", icon: <Clock size={20} />,       bg: "rgba(217,119,6,.08)",   border: "#D97706" },
          { label: "Commission plateforme (10%)",   value: `${totalFees} TND`,    color: "#9CA3AF", icon: <Percent size={20} />,     bg: "rgba(156,163,175,.08)", border: "#9CA3AF" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.border}`, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "4px" }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {!paiements?.length ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(43,150,168,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Wallet size={36} style={{ color: "#2B96A8" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Aucun paiement encore</p>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>Vos paiements apparaîtront ici après vos premières réservations confirmées</p>
        </div>
      ) : (
        <div className="table-wrapper">
          {paiements.map((p, idx) => {
            const reservation = p.reservation as Record<string, unknown> | null;
            const excursion   = reservation?.excursion as Record<string, unknown> | null;

            const statusBadge = p.status === "paid"
              ? { cls: "badge-green",  icon: <CheckCircle2 size={12} />, label: "Versé" }
              : p.status === "refunded"
              ? { cls: "badge-red",    icon: <RefreshCcw size={12} />,   label: "Remboursé" }
              : { cls: "badge-yellow", icon: <Hourglass size={12} />,    label: "En attente" };

            return (
              <div key={String(p.id)} className="table-row" style={{ borderBottom: idx < paiements.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
                    {excursion?.title as string || "Excursion"} — #{reservation?.booking_code as string}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6B7280", display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CalendarDays size={11} /> {reservation?.date as string}
                    </span>
                    <span style={{ color: "#D1D5DB" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Users size={11} /> {Number(reservation?.people_count)} pers.
                    </span>
                    <span style={{ color: "#D1D5DB" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Percent size={11} /> Commission : {Number(p.platform_fee)} TND
                    </span>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{Number(p.net_amount)} TND</p>
                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>sur {Number(p.amount)} TND total</p>
                  </div>
                  <span className={`badge ${statusBadge.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {statusBadge.icon} {statusBadge.label}
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