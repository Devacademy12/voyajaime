import { createAdminClient } from "@/lib/supabaseAdmin";
import CatalogueClient from "./CatalogueClient";
import { MapPin, Tag } from "lucide-react";

export default async function AdminCatalogue() {
  const supabase = createAdminClient();
  const [{ data: villes }, { data: categories }] = await Promise.all([
    supabase.from("villes").select("*").order("nom"),
    supabase.from("categories").select("*").order("nom"),
  ]);

  const villesData     = villes     || [];
  const categoriesData = categories || [];
  const activeVilles   = villesData.filter((v: any) => v.active).length;

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fa  { animation: fadeUp .3s ease both; }
        .fa1 { animation-delay:.05s }
        .fa2 { animation-delay:.10s }
        .cstat-card { transition: transform .2s, box-shadow .2s; cursor: default; }
        .cstat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,51,102,.10) !important; }
      `}</style>

      {/* ── Header ── */}
      <div className="fa" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#053366", margin: 0, letterSpacing: "-0.4px" }}>
            Catalogues & Villes
          </h1>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0", fontWeight: 500 }}>
            Gérez les villes disponibles et les catégories d'excursions
          </p>
        </div>
      </div>

      {/* ── KPI mini-cards ── */}
      <div className="fa fa1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Villes actives",  value: activeVilles,          Icon: MapPin, color: "#02AFCF", bg: "rgba(2,175,207,.1)",  border: "rgba(2,175,207,.2)"  },
          { label: "Villes total",    value: villesData.length,     Icon: MapPin, color: "#259FFC", bg: "rgba(37,159,252,.1)", border: "rgba(37,159,252,.2)" },
          { label: "Catégories",      value: categoriesData.length, Icon: Tag,    color: "#D97706", bg: "rgba(217,119,6,.1)",  border: "rgba(217,119,6,.2)"  },
        ].map(s => (
          <div
            key={s.label}
            className="cstat-card"
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

      {/* ── Contenu ── */}
      <div className="fa fa2">
        <CatalogueClient villes={villesData} categories={categoriesData} />
      </div>
    </div>
  );
}