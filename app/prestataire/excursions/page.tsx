import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ExcursionsListClient from "./ExcursionsListClient";

export default async function PrestataireExcursions() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: excursions } = await supabase
    .from("excursions")
    .select("*")
    .eq("prestataire_id", user!.id)
    .order("created_at", { ascending: false });

  const count = excursions?.length || 0;

  return (
    <div style={{ background: "#f7f8fc", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Hero */}
      <div style={{ background: "white", padding: "40px 0 32px", borderBottom: "1px solid #eef0f6" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#053366", margin: "0 0 4px", letterSpacing: "-0.4px" }}>
              Mes excursions
            </h1>
            <p style={{ fontSize: "14px", color: "#9CA3AF", margin: 0 }}>
              {count} excursion{count !== 1 ? "s" : ""} publiée{count !== 1 ? "s" : ""}
            </p>
          </div>

          
            <a href="/prestataire/excursions/nouveau"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 22px",
              background: "linear-gradient(135deg, #02AFCF, #259FFC)",
              color: "white", textDecoration: "none",
              borderRadius: "12px", fontSize: "14px", fontWeight: 700,
              boxShadow: "0 4px 14px rgba(2,175,207,0.35)",
            }}>
            + Nouvelle excursion
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "36px 28px 60px" }}>
        <ExcursionsListClient excursions={excursions || []} prestataireId={user!.id} />
      </div>
    </div>
  );
}