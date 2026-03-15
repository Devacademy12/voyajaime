import { createAdminClient } from "@/lib/supabaseAdmin";
import {
  Luggage, Building2, Mountain, CalendarDays,
  TrendingUp, Coins, Clock, ChevronRight,
  CheckCircle, Star, MapPin,
} from "lucide-react";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const { count: totalTouristes }    = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "touriste");
  const { count: totalPrestataires } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "prestataire");
  const { count: excActives }        = await supabase.from("excursions").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: totalResa }         = await supabase.from("reservations").select("*", { count: "exact", head: true });
  const { data: paiements }          = await supabase.from("paiements").select("amount, platform_fee, status");

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

  const statusClass: Record<string, string> = { pending: "badge-yellow", confirmed: "badge-green", completed: "badge-blue", cancelled: "badge-red" };
  const statusLabel: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé" };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        /* ── KPIs : 4 col → 2 col → 2 col ── */
        .d-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        @media(max-width:1024px){ .d-kpi { grid-template-columns:repeat(2,1fr); } }

        /* ── Revenue : 2 col → 1 col ── */
        .d-rev { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
        @media(max-width:600px){ .d-rev { grid-template-columns:1fr; gap:12px; } }

        /* ── Milieu : 2 col → 1 col ── */
        .d-mid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
        @media(max-width:700px){ .d-mid { grid-template-columns:1fr; } }

        /* ── Ligne réservation ── */
        .d-resa-row { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#F9FAFB; border-radius:10px; margin-bottom:8px; gap:8px; }
        @media(max-width:500px){
          .d-resa-row { flex-direction:column; align-items:flex-start; }
          .d-resa-meta { align-self:flex-end; }
        }

        /* ── Stat card KPI ── */
        .d-kpi-card { background:white; border:1px solid #e5e7eb; border-radius:16px; padding:16px; display:flex; flex-direction:column; gap:8px; }
        @media(max-width:400px){
          .d-kpi-card { padding:12px; }
          .d-kpi-card .kpi-val { font-size:22px !important; }
        }

        /* ── Titre ── */
        .d-title { font-size:24px; font-weight:800; color:#111827; }
        @media(max-width:400px){ .d-title { font-size:20px; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="d-title">Dashboard Admin</h1>
        <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Vue globale de la plateforme VoyajAime</p>
      </div>

      {/* KPIs */}
      <div className="d-kpi">
        {[
          { label: "Touristes",          value: totalTouristes || 0,    Icon: Luggage,      color: "#6366F1", bg: "rgba(99,102,241,.08)"  },
          { label: "Prestataires",       value: totalPrestataires || 0, Icon: Building2,    color: "#2B96A8", bg: "rgba(43,150,168,.08)"  },
          { label: "Excursions actives", value: excActives || 0,        Icon: Mountain,     color: "#059669", bg: "rgba(5,150,105,.08)"   },
          { label: "Réservations",       value: totalResa || 0,         Icon: CalendarDays, color: "#D97706", bg: "rgba(217,119,6,.08)"   },
        ].map(s => (
          <div key={s.label} className="d-kpi-card">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={20} color={s.color} strokeWidth={1.5} />
            </div>
            <p className="kpi-val" style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div className="d-rev">
        <div className="stat-card" style={{ borderLeft: "4px solid #059669", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(5,150,105,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={22} color="#059669" strokeWidth={1.5} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Chiffre d&apos;affaires total</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#059669", lineHeight: 1 }}>{totalRevenue} TND</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #2B96A8", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(43,150,168,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Coins size={22} color="#2B96A8" strokeWidth={1.5} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Commission encaissée (10%)</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#2B96A8", lineHeight: 1 }}>{totalFees} TND</p>
          </div>
        </div>
      </div>

      {/* Alerte prestataires en attente */}
      {pendingPrestataires && pendingPrestataires.length > 0 && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 14, color: "#D97706", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Clock size={16} color="#D97706" strokeWidth={1.5} />
            <strong>{pendingPrestataires.length} prestataire(s)</strong> en attente de validation
          </p>
          <a href="/admin/prestataires" style={{ fontSize: 13, color: "#D97706", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            Valider <ChevronRight size={14} />
          </a>
        </div>
      )}

      {/* Milieu : prestataires + avis */}
      <div className="d-mid">
        {/* Prestataires à valider */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 7 }}>
              <Clock size={15} color="#D97706" strokeWidth={1.5} /> Prestataires en attente
            </h2>
            <a href="/admin/prestataires" style={{ fontSize: 13, color: "#2B96A8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              Voir tous <ChevronRight size={13} />
            </a>
          </div>
          {!pendingPrestataires?.length ? (
            <p style={{ color: "#6B7280", fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle size={15} color="#059669" strokeWidth={1.5} /> Aucun en attente
            </p>
          ) : (
            pendingPrestataires.slice(0, 3).map(p => (
              <div key={String(p.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F9FAFB", borderRadius: 10, marginBottom: 8, gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {String(p.agency_name || p.full_name || "—")}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={11} color="#9CA3AF" strokeWidth={1.5} />
                    {String(p.city || "—")} · {new Date(String(p.created_at)).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <a href="/admin/prestataires" style={{ padding: "5px 12px", background: "#2B96A8", color: "white", borderRadius: 9, textDecoration: "none", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <CheckCircle size={12} strokeWidth={2} /> Valider
                </a>
              </div>
            ))
          )}
        </div>

        {/* Avis à modérer */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 7 }}>
              <Star size={15} color="#F59E0B" strokeWidth={1.5} /> Avis à modérer
            </h2>
            <a href="/admin/avis" style={{ fontSize: 13, color: "#2B96A8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
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
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {touriste?.full_name as string || "Anonyme"}
                    <span style={{ display: "flex", gap: 1 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} fill={s <= Number(a.rating) ? "#F59E0B" : "none"} color={s <= Number(a.rating) ? "#F59E0B" : "#E5E7EB"} />
                      ))}
                    </span>
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {excursion?.title as string}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Réservations récentes */}
      {recentResa && recentResa.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 7 }}>
              <CalendarDays size={15} color="#2B96A8" strokeWidth={1.5} /> Réservations récentes
            </h2>
            <a href="/admin/reservations" style={{ fontSize: 13, color: "#2B96A8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              Voir toutes <ChevronRight size={13} />
            </a>
          </div>
          {recentResa.map(r => {
            const exc = r.excursion as Record<string, unknown> | null;
            return (
              <div key={String(r.id)} className="d-resa-row">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {exc?.title as string || "—"}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    #{String(r.booking_code)} · {String(r.date)} · {Number(r.people_count)} pers.
                  </p>
                </div>
                <div className="d-resa-meta" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>{Number(r.total_price)} TND</span>
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