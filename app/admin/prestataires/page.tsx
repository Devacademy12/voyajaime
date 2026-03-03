import { createAdminClient } from "@/lib/supabaseAdmin";
import PrestatairesClient from "./PrestatairesClient";

export default async function AdminPrestataires() {
  // ✅ Admin client (service_role) — bypass RLS pour voir tous les profils
  const supabase = createAdminClient();

  const { data: prestataires, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "prestataire")
    .order("created_at", { ascending: false });

  if (error) console.error("Erreur chargement prestataires:", error.message);

  const pendingCount = prestataires?.filter((p) => !p.is_validated).length || 0;
  const validatedCount = prestataires?.filter((p) => p.is_validated).length || 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>
          Gestion des prestataires
        </h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>
          {pendingCount} en attente de validation · {validatedCount} validés · {prestataires?.length || 0} total
        </p>
      </div>
      <PrestatairesClient prestataires={prestataires || []} />
    </div>
  );
}