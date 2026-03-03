import { createAdminClient } from "@/lib/supabaseAdmin";
import AvisClient from "./AvisClient";

export default async function AdminAvis() {
  const supabase = createAdminClient();

  // Requêtes séparées — pas de jointure qui peut échouer silencieusement
  const { data: avisRaw, error } = await supabase
    .from("avis")
    .select("id, rating, comment, is_moderated, created_at, touriste_id, excursion_id")
    .order("created_at", { ascending: false });

  if (error) console.error("Avis load error:", error.message);

  const avisData = avisRaw || [];

  // Noms des touristes
  const touristeIds = [...new Set(avisData.map(a => a.touriste_id).filter(Boolean))];
  const { data: profiles } = touristeIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", touristeIds)
    : { data: [] };

  // Titres des excursions
  const excursionIds = [...new Set(avisData.map(a => a.excursion_id).filter(Boolean))];
  const { data: excursions } = excursionIds.length
    ? await supabase.from("excursions").select("id, title, city").in("id", excursionIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name]));
  const excMap = Object.fromEntries((excursions || []).map(e => [e.id, { title: e.title, city: e.city }]));

  const avis = avisData.map(a => ({
    id: a.id,
    rating: a.rating,
    comment: a.comment,
    is_moderated: a.is_moderated,
    created_at: a.created_at,
    touriste_name: profileMap[a.touriste_id] || "Anonyme",
    excursion_title: excMap[a.excursion_id]?.title || "Excursion inconnue",
    excursion_city: excMap[a.excursion_id]?.city || "",
  }));

  const pendingCount = avis.filter(a => !a.is_moderated).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>Modération des avis</h1>
        <p style={{ color: "#6B7280", marginTop: 4 }}>
          <span style={{ color: pendingCount > 0 ? "#D97706" : "#6B7280", fontWeight: pendingCount > 0 ? 700 : 400 }}>
            {pendingCount} à modérer
          </span>
          {" · "}{avis.filter(a => a.is_moderated).length} approuvés · {avis.length} total
        </p>
      </div>
      <AvisClient avis={avis} />
    </div>
  );
}