import { createAdminClient } from "@/lib/supabaseAdmin";
import PrestatairesClient from "./PrestatairesClient";

export default async function AdminPrestataires() {
  const supabase = createAdminClient();

  const { data: prestataires, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "prestataire")
    .order("created_at", { ascending: false });

  if (error) console.error("Erreur chargement prestataires:", error.message);

  // Excursion count per prestataire
  const pIds = (prestataires || []).map(p => p.user_id);
  const { data: excursions } = pIds.length
    ? await supabase.from("excursions").select("prestataire_id, is_active").in("prestataire_id", pIds)
    : { data: [] };

  const excCountMap: Record<string, { total: number; active: number }> = {};
  (excursions || []).forEach((e: { prestataire_id: string; is_active: boolean }) => {
    if (!excCountMap[e.prestataire_id]) excCountMap[e.prestataire_id] = { total: 0, active: 0 };
    excCountMap[e.prestataire_id].total++;
    if (e.is_active) excCountMap[e.prestataire_id].active++;
  });

  const data = (prestataires || []).map(p => ({
    ...p,
    excursion_count: excCountMap[p.user_id]?.total || 0,
    excursion_active: excCountMap[p.user_id]?.active || 0,
  }));

  const pendingCount = data.filter(p => !p.is_validated).length;
  const validatedCount = data.filter(p => p.is_validated).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>Gestion des prestataires</h1>
        <p style={{ color: "#6B7280", marginTop: 4 }}>
          {pendingCount} en attente · {validatedCount} validés · {data.length} total
        </p>
      </div>
      <PrestatairesClient prestataires={data} />
    </div>
  );
}