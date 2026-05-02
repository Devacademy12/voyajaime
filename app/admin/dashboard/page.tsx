// app/admin/dashboard/page.tsx
import { createAdminClient } from "@/lib/supabaseAdmin";
import {
  Luggage, Building2, Mountain, CalendarDays,
  TrendingUp, Coins, Clock, ChevronRight,
  CheckCircle, Star, MapPin,
} from "lucide-react";
import AdminCharts from "./AdminCharts";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  // ── Compteurs KPI ──────────────────────────────────────────────────────────
  const { count: totalTouristes }    = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "touriste");
  const { count: totalPrestataires } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "prestataire");
  const { count: excActives }        = await supabase.from("excursions").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: totalResa }         = await supabase.from("reservations").select("*", { count: "exact", head: true });
  const { data: paiements }          = await supabase.from("paiements").select("amount, platform_fee, status");

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
    .limit(4);

  // ✅ Fix — totalRevenue et totalFees filtrés sur status = "paid" uniquement
  const totalRevenue = paiements
    ?.filter(p => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalFees = paiements
    ?.filter(p => p.status === "paid")
    .reduce((s, p) => s + Number(p.platform_fee), 0) || 0;

  // ── Réservations par jour (30 j) ───────────────────────────────────────────
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  // ✅ Fix — booking_mode n'existe pas, on utilise itineraire_id à la place
  const { data: resaRaw } = await supabase
    .from("reservations")
    .select("created_at, itineraire_id")
    .gte("created_at", since30.toISOString().split("T")[0])
    .order("created_at", { ascending: true });

  const resaByDay: Record<string, { total: number; assiste: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    resaByDay[d.toISOString().split("T")[0]] = { total: 0, assiste: 0 };
  }
  (resaRaw || []).forEach(r => {
    const key = String(r.created_at).split("T")[0];
    if (resaByDay[key]) {
      resaByDay[key].total++;
      // ✅ Fix — réservation "assistée" = liée à un itinéraire
      if (r.itineraire_id !== null) resaByDay[key].assiste++;
    }
  });
  const reservationsParJour = Object.entries(resaByDay).map(([date, v]) => ({ date, ...v }));

  // ── Top 5 villes ───────────────────────────────────────────────────────────
  // ✅ Fix — syntaxe correcte pour la jointure Supabase + cast sécurisé
  // ── Top 5 villes ───────────────────────────────────────────────────────────
// ✅ Fix — on compte directement les excursions actives par ville
const { data: villesRaw } = await supabase
  .from("excursions")
  .select("city")
  .eq("is_active", true);

const villeCount: Record<string, number> = {};
(villesRaw || []).forEach(r => {
  if (r.city) villeCount[r.city] = (villeCount[r.city] || 0) + 1;
});
const topVilles = Object.entries(villeCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([city, count]) => ({ city, count }));

  // ── Commission par mois (12 derniers mois) ─────────────────────────────────
  const { data: paiementsAll } = await supabase
    .from("paiements")
    .select("platform_fee, status, created_at")
    .eq("status", "paid");

  const monthNames = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const commByMonth: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    commByMonth[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
  }
  (paiementsAll || []).forEach(p => {
    const key = String(p.created_at).slice(0, 7);
    if (key in commByMonth) commByMonth[key] += Number(p.platform_fee) || 0;
  });
  const revenusParMois = Object.entries(commByMonth).map(([key, commission]) => ({
    month: monthNames[parseInt(key.split("-")[1]) - 1],
    commission: Math.round(commission),
  }));

  // ── Helpers de style ───────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "white", borderRadius: 16,
    border: "1px solid #EEF2FF", padding: "14px 16px",
    boxShadow: "0 2px 10px rgba(5,51,102,.05)",
  };

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .db-kpi    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .db-rev    { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .db-middle { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fa  { animation: fadeUp .3s ease both; }
        .fa1 { animation-delay:.05s } .fa2 { animation-delay:.10s }
        .fa3 { animation-delay:.15s } .fa4 { animation-delay:.20s }

        .kpi-card { transition: transform .2s, box-shadow .2s; cursor: default; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,51,102,.1) !important; }

        .list-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 9px 12px; background: #F8FAFF; border-radius: 10px;
          border: 1px solid #EEF2FF; margin-bottom: 6px; gap: 8px;
          transition: border-color .15s;
        }
        .list-row:hover { border-color: #DCE5FF; }
        .list-row:last-child { margin-bottom: 0; }

        @media(max-width:1100px) { .db-kpi { grid-template-columns: repeat(2,1fr); } }
        @media(max-width:700px)  { .db-middle { grid-template-columns: 1fr; } .db-rev { grid-template-columns: 1fr; } }
        @media(max-width:500px)  { .db-kpi { grid-template-columns: 1fr 1fr; } }
      `}</style>

      {/* ─────────────── Header ─────────────── */}
      <div className="fa" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-0.4px" }}>
            Dashboard Admin
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: 12, margin: "2px 0 0" }}>
            Vue globale · VoyajAime
          </p>
        </div>
        {pendingPrestataires && pendingPrestataires.length > 0 && (
          
          <a  href="/admin/prestataires"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 10, textDecoration: "none",
              background: "rgba(2,175,207,.08)", border: "1px solid rgba(2,175,207,.25)",
              fontSize: 12, fontWeight: 700, color: "#02AFCF", whiteSpace: "nowrap",
            }}>
          
            <Clock size={13} strokeWidth={1.5} />
            {pendingPrestataires.length} en attente
            <ChevronRight size={13} />
          </a>
        )}
      </div>

      {/* ─────────────── KPIs ─────────────── */}
      <div className="db-kpi fa fa1">
        {[
          { label: "Touristes",    value: totalTouristes    || 0, Icon: Luggage,      color: "#259FFC", bg: "rgba(37,159,252,.1)",  border: "rgba(37,159,252,.2)"  },
          { label: "Prestataires", value: totalPrestataires || 0, Icon: Building2,    color: "#02AFCF", bg: "rgba(2,175,207,.1)",   border: "rgba(2,175,207,.2)"   },
          { label: "Excursions",   value: excActives        || 0, Icon: Mountain,     color: "#053366", bg: "rgba(5,51,102,.08)",   border: "rgba(5,51,102,.15)"   },
          { label: "Réservations", value: totalResa         || 0, Icon: CalendarDays, color: "#D97706", bg: "rgba(217,119,6,.1)",   border: "rgba(217,119,6,.2)"   },
        ].map(s => (
          <div
            key={s.label}
            className="kpi-card"
            style={{
              background: "white", borderRadius: 12, padding: "10px 14px",
              border: `1px solid ${s.border}`,
              boxShadow: "0 2px 8px rgba(5,51,102,.04)",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: s.bg, border: `1px solid ${s.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <s.Icon size={15} color={s.color} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#053366", lineHeight: 1, margin: "0 0 2px" }}>
                {s.value.toLocaleString("fr-FR")}
              </p>
              <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────── Revenus ─────────────── */}
      <div className="db-rev fa fa2">
        {[
          { label: "Volume encaissé", value: totalRevenue, color: "#259FFC", bg: "rgba(37,159,252,.07)", Icon: TrendingUp, suffix: "TND" },
          { label: "Commissions",     value: totalFees,    color: "#02AFCF", bg: "rgba(2,175,207,.07)",  Icon: Coins,      suffix: "TND" },
        ].map(r => (
          <div key={r.label} style={{
            background: r.bg,
            border: `1px solid ${r.color}22`,
            borderRadius: 16, padding: "14px 16px",
            boxShadow: "0 2px 10px rgba(5,51,102,.05)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `${r.color}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <r.Icon size={20} color={r.color} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                {r.label}
              </p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#053366", margin: 0, lineHeight: 1 }}>
                {r.value.toLocaleString("fr-FR")}{" "}
                <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.suffix}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────── Prestataires + Avis ─────────────── */}
      <div className="db-middle fa fa3">

        {/* Prestataires en attente */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#053366", display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(217,119,6,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={12} color="#D97706" strokeWidth={1.5} />
              </div>
              Prestataires en attente
            </h2>
            <a href="/admin/prestataires" style={{ fontSize: 11, color: "#259FFC", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
              Voir tous <ChevronRight size={11} />
            </a>
          </div>

          {!pendingPrestataires?.length ? (
            <p style={{ color: "#9CA3AF", fontSize: 13, display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
              <CheckCircle size={14} color="#02AFCF" strokeWidth={1.5} /> Aucun en attente
            </p>
          ) : (
            <>
              {pendingPrestataires.slice(0, 3).map(p => (
                <div key={String(p.id)} className="list-row">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {String(p.agency_name || p.full_name || "—")}
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={10} strokeWidth={1.5} />
                      {String(p.city || "—")} · {new Date(String(p.created_at)).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  
                 <a   href="/admin/prestataires"
                    style={{
                      padding: "4px 12px",
                      background: "linear-gradient(135deg,#02AFCF,#259FFC)",
                      color: "white", borderRadius: 8, textDecoration: "none",
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                      display: "flex", alignItems: "center", gap: 3,
                    }}
                  >
                    <CheckCircle size={10} strokeWidth={2} /> Valider
                  </a>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Avis à modérer */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#053366", display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(245,158,11,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={12} color="#F59E0B" strokeWidth={1.5} />
              </div>
              Avis à modérer
            </h2>
            <a href="/admin/avis" style={{ fontSize: 11, color: "#259FFC", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
              Voir tous <ChevronRight size={11} />
            </a>
          </div>

          {!pendingAvis?.length ? (
            <p style={{ color: "#9CA3AF", fontSize: 13, display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
              <CheckCircle size={14} color="#02AFCF" strokeWidth={1.5} /> Aucun avis en attente
            </p>
          ) : (
            <>
              {pendingAvis.map(a => {
                const touriste  = a.touriste  as Record<string, unknown> | null;
                const excursion = a.excursion as Record<string, unknown> | null;
                return (
                  <div key={String(a.id)} className="list-row">
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                        {(touriste?.full_name as string) || "Anonyme"}
                        <span style={{ display: "flex", gap: 1 }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={9}
                              fill={s <= Number(a.rating) ? "#F59E0B" : "none"}
                              color={s <= Number(a.rating) ? "#F59E0B" : "#E5E7EB"} />
                          ))}
                        </span>
                      </p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {excursion?.title as string}
                      </p>
                    </div>
                    <a href="/admin/avis" style={{ fontSize: 11, color: "#259FFC", textDecoration: "none", fontWeight: 700, flexShrink: 0 }}>
                      Modérer
                    </a>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ─────────────── Graphiques ─────────────── */}
      <div className="fa fa4">
        <AdminCharts
          reservationsParJour={reservationsParJour}
          topVilles={topVilles}
          revenusParMois={revenusParMois}
        />
      </div>
    </div>
  );
}