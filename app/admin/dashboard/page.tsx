import { createAdminClient } from "@/lib/supabaseAdmin";
import {
  Luggage, Building2, Mountain, CalendarDays,
  TrendingUp, Coins, Clock, ChevronRight,
  CheckCircle, Star, MapPin,
} from "lucide-react";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const { count: totalTouristes }   = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "touriste");
  const { count: totalPrestataires }= await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "prestataire");
  const { count: excActives }       = await supabase.from("excursions").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: totalResa }        = await supabase.from("reservations").select("*", { count: "exact", head: true });
  const { data: paiements }         = await supabase.from("paiements").select("amount, platform_fee, status");

  const { data: pendingPrestataires } = await supabase
    .from("profiles").select("*").eq("role", "prestataire").eq("is_validated", false).order("created_at", { ascending: false });

  const { data: pendingAvis } = await supabase
    .from("avis")
    .select("*, excursion:excursions(title), touriste:profiles!touriste_id(full_name)")
    .eq("is_moderated", false).order("created_at", { ascending: false }).limit(5);

  const { data: recentResa } = await supabase
    .from("reservations")
    .select("*, excursion:excursions(title, city)")
    .order("created_at", { ascending: false }).limit(5);

  const totalRevenue = paiements?.reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalFees    = paiements?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.platform_fee), 0) || 0;

  const statusClass: Record<string, string>  = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };
  const statusLabel: Record<string, string>  = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box}`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>Dashboard Admin</h1>
        <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Vue globale de la plateforme VoyajAime</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Touristes",          value: totalTouristes || 0,   Icon: Luggage,      color: "#6366F1", bg: "rgba(99,102,241,.08)"  },
          { label: "Prestataires",       value: totalPrestataires || 0, Icon: Building2,   color: "#2B96A8", bg: "rgba(43,150,168,.08)"  },
          { label: "Excursions actives", value: excActives || 0,       Icon: Mountain,     color: "#059669", bg: "rgba(5,150,105,.08)"   },
          { label: "Réservations",       value: totalResa || 0,        Icon: CalendarDays, color: "#D97706", bg: "rgba(217,119,6,.08)"   },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={20} color={s.color} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: "4px solid #059669", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(5,150,105,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={22} color="#059669" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Chiffre d&apos;affaires total</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#059669", lineHeight: 1 }}>{totalRevenue} TND</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #2B96A8", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(43,150,168,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Coins size={22} color="#2B96A8" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Commission encaissée (10%)</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#2B96A8", lineHeight: 1 }}>{totalFees} TND</p>
          </div>
        </div>
      </div>

      {/* Alerte prestataires */}
      {pendingPrestataires && pendingPrestataires.length > 0 && (
        <div style={{ marginBottom: 20, padding: "14px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 14, color: "#D97706", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={16} color="#D97706" strokeWidth={1.5} />
            <strong>{pendingPrestataires.length} prestataire(s)</strong> en attente de validation
          </p>
          <a href="/admin/prestataires" style={{ fontSize: 13, color: "#D97706", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            Valider <ChevronRight size={14} />
          </a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Prestataires à valider */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 7 }}>
              <Clock size={15} color="#D97706" strokeWidth={1.5} /> Prestataires en attente
            </h2>
            <a href="/admin/prestataires" style={{ fontSize: 13, color: "#2B96A8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              Voir tous <ChevronRight size={13} />
            </a>
          </div>
          {!pendingPrestataires?.length ? (
            <p style={{ color: "#6B7280", fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle size={15} color="#059669" strokeWidth={1.5} /> Aucun en attente
            </p>
          ) : (
            pendingPrestataires.slice(0, 3).map(p => (
              <div key={String(p.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F9FAFB", borderRadius: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{String(p.agency_name || p.full_name || "—")}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={11} color="#9CA3AF" strokeWidth={1.5} />{String(p.city || "—")} · {new Date(String(p.created_at)).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <a href="/admin/prestataires" style={{ padding: "6px 14px", background: "#2B96A8", color: "white", borderRadius: 9, textDecoration: "none", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle size={12} strokeWidth={2} /> Valider
                </a>
              </div>
            ))
          )}
        </div>

        {/* Avis à modérer */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 7 }}>
              <Star size={15} color="#F59E0B" strokeWidth={1.5} /> Avis à modérer
            </h2>
            <a href="/admin/avis" style={{ fontSize: 13, color: "#2B96A8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              Voir tous <ChevronRight size={13} />
            </a>
          </div>
          {!pendingAvis?.length ? (
            <p style={{ color: "#6B7280", fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle size={15} color="#059669" strokeWidth={1.5} /> Aucun avis en attente
            </p>
          ) : (
            pendingAvis.map(a => {
              const touriste  = a.touriste  as Record<string, unknown> | null;
              const excursion = a.excursion as Record<string, unknown> | null;
              return (
                <div key={String(a.id)} style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: 10, marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    {touriste?.full_name as string || "Anonyme"}
                    <span style={{ display: "flex", gap: 1 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= Number(a.rating) ? "#F59E0B" : "none"} color={s <= Number(a.rating) ? "#F59E0B" : "#E5E7EB"} />)}
                    </span>
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>{excursion?.title as string}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Réservations récentes */}
      {recentResa && recentResa.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 7 }}>
              <CalendarDays size={15} color="#2B96A8" strokeWidth={1.5} /> Réservations récentes
            </h2>
            <a href="/admin/reservations" style={{ fontSize: 13, color: "#2B96A8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              Voir toutes <ChevronRight size={13} />
            </a>
          </div>
          {recentResa.map(r => {
            const exc = r.excursion as Record<string, unknown> | null;
            return (
              <div key={String(r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F9FAFB", borderRadius: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{exc?.title as string || "—"}</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>
                    #{String(r.booking_code)} · {String(r.date)} · {Number(r.people_count)} pers.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{Number(r.total_price)} TND</span>
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