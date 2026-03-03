import { createAdminClient } from "@/lib/supabaseAdmin";
import AdminExcursionsClient from "./AdminExcursionsClient";

export default async function AdminExcursions() {
  const supabase = createAdminClient();

  const { data: excursionsRaw, error } = await supabase
    .from("excursions")
    .select("id, title, city, duration_hours, price_per_person, max_people, rating, reviews_count, is_active, prestataire_id, photos, categories, created_at")
    .order("created_at", { ascending: false });

  if (error) console.error("AdminExcursions load error:", error.message);

  const excursionsData = excursionsRaw || [];

  const prestataireIds = [...new Set(excursionsData.map(e => e.prestataire_id).filter(Boolean))];
  const { data: profiles } = prestataireIds.length
    ? await supabase.from("profiles").select("user_id, full_name, agency_name").in("user_id", prestataireIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profiles || []).map(p => [p.user_id, p.agency_name || p.full_name || "—"])
  );

  const excursions = excursionsData.map(e => ({
    ...e,
    photos: (e.photos as string[]) || [],
    categories: (e.categories as string[]) || [],
    prestataire_name: profileMap[e.prestataire_id] || "—",
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>Toutes les excursions</h1>
        <p style={{ color: "#6B7280", marginTop: 4 }}>
          {excursions.filter(e => e.is_active).length} actives · {excursions.filter(e => !e.is_active).length} brouillons · {excursions.length} total
        </p>
      </div>
      <AdminExcursionsClient excursions={excursions} />
    </div>
  );
}