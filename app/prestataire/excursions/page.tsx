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
    <div style={{
      background: "#F5F7FA",
      minHeight: "100vh",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      {/* Hero */}
      <div style={{
        background: "white",
        padding: "40px 0 32px",
        borderBottom: "1.5px solid #E2E8F0"
      }}>
        <div style={{
          maxWidth: "1160px",
          margin: "0 auto",
          padding: "0 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            {/* Eyebrow badge — même style que pw-header-eyebrow */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#EFF9FB",
              border: "1px solid rgba(43,150,168,.22)",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#2B96A8",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: "10px"
            }}>
              ✦ Espace prestataire
            </div>

            <h1 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#053366",
              margin: "0 0 4px",
              letterSpacing: "-0.4px"
            }}>
              Mes excursions
            </h1>
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0, fontWeight: 500 }}>
              {count} excursion{count !== 1 ? "s" : ""} publiée{count !== 1 ? "s" : ""}
            </p>
          </div>

          
           <a href="/prestataire/excursions/nouveau"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 22px",
              background: "linear-gradient(135deg, #053366, #2B96A8)",
              color: "white",
              textDecoration: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(5,51,102,0.25)",
            }}
          >
            + Nouvelle excursion
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: "1160px",
        margin: "0 auto",
        padding: "36px 28px 60px"
      }}>
        <ExcursionsListClient excursions={excursions || []} prestataireId={user!.id} />
      </div>
    </div>
  );
}