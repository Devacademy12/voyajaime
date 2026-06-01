import { createAdminClient } from "@/lib/supabaseAdmin";
import AvisClient from "./AvisClient";
import { MessageCircle, Clock, CheckCircle, LayoutList } from "lucide-react";

export default async function AdminAvis() {
  const supabase = createAdminClient();

  const { data: avisRaw, error } = await supabase
    .from("avis")
    .select("id, rating, comment, is_moderated, created_at, touriste_id, excursion_id")
    .order("created_at", { ascending: false });

  if (error) console.error("Avis load error:", error.message);

  const avisData = avisRaw || [];

  const touristeIds = [...new Set(avisData.map(a => a.touriste_id).filter(Boolean))];
  const { data: profiles } = touristeIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", touristeIds)
    : { data: [] };

  const excursionIds = [...new Set(avisData.map(a => a.excursion_id).filter(Boolean))];
  const { data: excursions } = excursionIds.length
    ? await supabase.from("excursions").select("id, title, city, photos").in("id", excursionIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name]));
  const excMap = Object.fromEntries((excursions || []).map(e => [e.id, { title: e.title, city: e.city, photo: e.photos?.[0] || null }]));

  const avis = avisData.map(a => ({
    id: a.id,
    rating: a.rating,
    comment: a.comment,
    is_moderated: a.is_moderated,
    created_at: a.created_at,
    touriste_name: profileMap[a.touriste_id] || "Anonyme",
    excursion_id: a.excursion_id,
    excursion_title: excMap[a.excursion_id]?.title || "Excursion inconnue",
    excursion_city: excMap[a.excursion_id]?.city || "",
    excursion_photo: excMap[a.excursion_id]?.photo || null,
  }));

  const pendingCount  = avis.filter(a => !a.is_moderated).length;
  const approvedCount = avis.filter(a =>  a.is_moderated).length;
  const totalCount    = avis.length;

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fa  { animation: fadeUp .3s ease both; }
        .fa1 { animation-delay:.05s }
        .fa2 { animation-delay:.10s }
        .avis-stat-card { transition: transform .2s, box-shadow .2s; cursor: default; }
        .avis-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,51,102,.10) !important; }
      `}</style>

      {/* ── Header ── */}
      <div className="fa" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-0.4px" }}>
            Modération des avis
          </h1>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0", fontWeight: 500 }}>
            Gérez et modérez les avis laissés par les touristes
          </p>
        </div>

        {/* Badge "à modérer" — même style que le badge dashboard */}
        {pendingCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 10,
            background: "rgba(217,119,6,.08)", border: "1px solid rgba(217,119,6,.25)",
            fontSize: 12, fontWeight: 700, color: "#D97706", whiteSpace: "nowrap",
          }}>
            <Clock size={13} strokeWidth={1.5} />
            {pendingCount} à modérer
          </div>
        )}
      </div>

      {/* ── KPI mini-cards ── */}
      <div className="fa fa1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "En attente",  value: pendingCount,  Icon: Clock,         color: "#D97706", bg: "rgba(217,119,6,.1)",  border: "rgba(217,119,6,.2)"  },
          { label: "Approuvés",   value: approvedCount, Icon: CheckCircle,   color: "#02AFCF", bg: "rgba(2,175,207,.1)",  border: "rgba(2,175,207,.2)"  },
          { label: "Total avis",  value: totalCount,    Icon: LayoutList,    color: "#259FFC", bg: "rgba(37,159,252,.1)", border: "rgba(37,159,252,.2)" },
        ].map(s => (
          <div
            key={s.label}
            className="avis-stat-card"
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

      {/* ── Liste filtrée ── */}
      <div className="fa fa2">
        <AvisClient avis={avis} />
      </div>
    </div>
  );
}