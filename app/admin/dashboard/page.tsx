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

  const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
    pending:   { bg: "#FEF9C3", color: "#A16207",  dot: "#D97706" },
    confirmed: { bg: "#DCFCE7", color: "#15803D",  dot: "#22C55E" },
    completed: { bg: "#DCE5FF", color: "#259FFC",  dot: "#02AFCF" },
    cancelled: { bg: "#FEE2E2", color: "#DC2626",  dot: "#EF4444" },
  };
  const STATUS_LABEL: Record<string, string> = {
    pending: "En attente", confirmed: "Confirmé", completed: "Terminé", cancelled: "Annulé",
  };

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .dp-card { animation: fadeUp .35s ease both; }
        .dp-stat:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(5,51,102,.1) !important; transition:all .2s; }
        .dp-action { display:inline-flex; align-items:center; gap:8px; padding:11px 22px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; font-family:inherit; transition:all .2s; border:none; }
        .dp-action-primary { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; box-shadow:0 4px 16px rgba(2,175,207,.35); }
        .dp-action-primary:hover { box-shadow:0 6px 22px rgba(2,175,207,.5); transform:translateY(-2px); }
        .dp-action-secondary { background:white; color:#053366; border:1.5px solid #DCE5FF !important; }
        .dp-action-secondary:hover { background:#DCE5FF; }
        .dp-resa-row { display:flex; justify-content:space-between; align-items:center; padding:13px 16px; background:white; border-radius:12px; border:1px solid #EEF2FF; transition:all .15s; margin-bottom:8px; }
        .dp-resa-row:hover { background:#F8FAFF; border-color:#DCE5FF; }

        /* Grids */
        .d-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        .d-rev { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
        .d-mid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
        .d-resa-meta { display:flex; align-items:center; gap:8px; flex-shrink:0; }

        @media(max-width:1024px) { .d-kpi { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:700px)  { .d-mid { grid-template-columns:1fr; } }
        @media(max-width:600px)  {
          .d-rev { grid-template-columns:1fr; gap:10px; }
          .dp-resa-row { flex-direction:column; align-items:flex-start; gap:8px; }
          .d-resa-meta { align-self:flex-end; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="dp-card" style={{ marginBottom: 28, animationDelay: "0s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-0.5px" }}>Dashboard Admin</h1>
            <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>Vue globale de la plateforme VoyajAime</p>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="d-kpi dp-card" style={{ animationDelay: ".07s" }}>
        {[
          { label: "Touristes",          value: totalTouristes || 0,    Icon: Luggage,      color: "#259FFC", bg: "rgba(37,159,252,.1)",  border: "rgba(37,159,252,.2)"  },
          { label: "Prestataires",       value: totalPrestataires || 0, Icon: Building2,    color: "#02AFCF", bg: "rgba(2,175,207,.1)",   border: "rgba(2,175,207,.2)"   },
          { label: "Excursions actives", value: excActives || 0,        Icon: Mountain,     color: "#053366", bg: "rgba(5,51,102,.08)",   border: "rgba(5,51,102,.15)"   },
          { label: "Réservations",       value: totalResa || 0,         Icon: CalendarDays, color: "#D97706", bg: "rgba(217,119,6,.1)",   border: "rgba(217,119,6,.2)"   },
        ].map(s => (
          <div key={s.label} className="dp-stat" style={{ background: "white", border: `1px solid ${s.border}`, borderRadius: 16, padding: "18px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 2px 10px rgba(5,51,102,.05)", cursor: "default" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={20} color={s.color} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 900, color: "#053366", lineHeight: 1, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue ── */}
      <div className="d-rev dp-card" style={{ animationDelay: ".14s" }}>
        {[
          { label: "Chiffre d'affaires total", value: `${totalRevenue} TND`, Icon: TrendingUp, color: "#02AFCF", border: "#02AFCF", bg: "rgba(2,175,207,.1)" },
          { label: "Commission encaissée (10%)", value: `${totalFees} TND`,  Icon: Coins,      color: "#259FFC", border: "#259FFC", bg: "rgba(37,159,252,.1)" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", border: "1px solid #EEF2FF", borderLeft: `4px solid ${s.border}`, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 10px rgba(5,51,102,.05)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={22} color={s.color} strokeWidth={1.5} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#053366", lineHeight: 1, margin: 0 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alerte prestataires ── */}
      {pendingPrestataires && pendingPrestataires.length > 0 && (
        <div className="dp-card" style={{ marginBottom: 20, padding: "14px 18px", background: "linear-gradient(135deg,rgba(2,175,207,.07),rgba(37,159,252,.05))", border: "1px solid rgba(2,175,207,.25)", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, animationDelay: ".2s" }}>
          <p style={{ fontSize: 14, color: "#053366", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Clock size={16} color="#02AFCF" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <span><strong style={{ color: "#02AFCF" }}>{pendingPrestataires.length} prestataire(s)</strong> en attente de validation</span>
          </p>
          <a href="/admin/prestataires" style={{ fontSize: 13, color: "#259FFC", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            Valider <ChevronRight size={14} />
          </a>
        </div>
      )}

      {/* ── Milieu : prestataires + avis ── */}
      <div className="d-mid dp-card" style={{ animationDelay: ".24s" }}>
        {/* Prestataires à valider */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #EEF2FF", padding: "20px 22px", boxShadow: "0 2px 12px rgba(5,51,102,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(217,119,6,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={14} color="#D97706" strokeWidth={1.5} />
              </div>
              Prestataires en attente
            </h2>
            <a href="/admin/prestataires" style={{ fontSize: 13, color: "#259FFC", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              Voir tous <ChevronRight size={13} />
            </a>
          </div>
          {!pendingPrestataires?.length ? (
            <p style={{ color: "#9CA3AF", fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle size={15} color="#02AFCF" strokeWidth={1.5} /> Aucun en attente
            </p>
          ) : (
            pendingPrestataires.slice(0, 3).map(p => (
              <div key={String(p.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFF", borderRadius: 12, marginBottom: 8, border: "1px solid #EEF2FF", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {String(p.agency_name || p.full_name || "—")}
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <MapPin size={11} color="#9CA3AF" strokeWidth={1.5} />
                    {String(p.city || "—")} · {new Date(String(p.created_at)).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <a href="/admin/prestataires" style={{ padding: "5px 14px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", color: "white", borderRadius: 9, textDecoration: "none", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flexShrink: 0, boxShadow: "0 2px 8px rgba(2,175,207,.3)" }}>
                  <CheckCircle size={12} strokeWidth={2} /> Valider
                </a>
              </div>
            ))
          )}
        </div>

        {/* Avis à modérer */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #EEF2FF", padding: "20px 22px", boxShadow: "0 2px 12px rgba(5,51,102,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={14} color="#F59E0B" strokeWidth={1.5} />
              </div>
              Avis à modérer
            </h2>
            <a href="/admin/avis" style={{ fontSize: 13, color: "#259FFC", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              Voir tous <ChevronRight size={13} />
            </a>
          </div>
          {!pendingAvis?.length ? (
            <p style={{ color: "#9CA3AF", fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
              <CheckCircle size={15} color="#02AFCF" strokeWidth={1.5} /> Aucun avis en attente
            </p>
          ) : (
            pendingAvis.map(a => {
              const touriste  = a.touriste  as Record<string, unknown> | null;
              const excursion = a.excursion as Record<string, unknown> | null;
              return (
                <div key={String(a.id)} style={{ padding: "10px 14px", background: "#F8FAFF", borderRadius: 12, marginBottom: 8, border: "1px solid #EEF2FF" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", marginBottom: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {touriste?.full_name as string || "Anonyme"}
                    <span style={{ display: "flex", gap: 1 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} fill={s <= Number(a.rating) ? "#F59E0B" : "none"} color={s <= Number(a.rating) ? "#F59E0B" : "#E5E7EB"} />
                      ))}
                    </span>
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {excursion?.title as string}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Réservations récentes ── */}
      {recentResa && recentResa.length > 0 && (
        <div className="dp-card" style={{ background: "white", borderRadius: 20, border: "1px solid #EEF2FF", padding: "22px 24px", boxShadow: "0 2px 12px rgba(5,51,102,.06)", animationDelay: ".3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(2,175,207,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays size={14} color="#02AFCF" strokeWidth={1.5} />
              </div>
              Réservations récentes
            </h2>
            <a href="/admin/reservations" style={{ fontSize: 13, color: "#259FFC", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              Voir toutes <ChevronRight size={13} />
            </a>
          </div>
          {recentResa.map(r => {
            const exc    = r.excursion as Record<string, unknown> | null;
            const status = String(r.status);
            const ss     = STATUS_STYLE[status] || { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" };
            return (
              <div key={String(r.id)} className="dp-resa-row">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 4px" }}>
                    {exc?.title as string || "—"}
                  </p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", color: "#02AFCF", fontWeight: 600 }}>#{String(r.booking_code)}</span>
                    <span>{String(r.date)}</span>
                    <span>{Number(r.people_count)} pers.</span>
                  </p>
                </div>
                <div className="d-resa-meta">
                  <span style={{ fontWeight: 800, color: "#053366", fontSize: 14, whiteSpace: "nowrap" }}>
                    {Number(r.total_price)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span>
                  </span>
                  <span style={{ padding: "4px 12px", borderRadius: 20, background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                    {STATUS_LABEL[status] || status}
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