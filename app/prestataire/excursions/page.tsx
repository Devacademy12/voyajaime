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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Mes excursions</h1>
          <p style={{ color: "#6B7280", marginTop: "4px" }}>{excursions?.length || 0} excursion(s)</p>
        </div>
        <a href="/prestataire/excursions/nouveau" className="btn-primary" style={{ textDecoration: "none" }}>
          + Nouvelle excursion
        </a>
      </div>
      <ExcursionsListClient excursions={excursions || []} prestataireId={user!.id} />
    </div>
  );
}
