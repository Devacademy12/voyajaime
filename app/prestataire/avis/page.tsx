import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";

export default async function PrestataireAvis() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  // 1. Excursions du prestataire
  const { data: excursions } = await admin
    .from("excursions")
    .select("id, title, city")
    .eq("prestataire_id", user.id);

  const excIds = excursions?.map(e => e.id) || [];
  const excMap = Object.fromEntries(
    (excursions || []).map(e => [e.id, { title: e.title, city: e.city }])
  );

  // 2. Avis sur ces excursions (admin client voit tout)
  const { data: avisRaw } = excIds.length
    ? await admin
        .from("avis")
        .select("id, rating, comment, is_moderated, created_at, touriste_id, excursion_id, prestataire_response")
        .in("excursion_id", excIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // 3. Noms des touristes
  const touristeIds = [...new Set((avisRaw || []).map((a: {touriste_id: string}) => a.touriste_id).filter(Boolean))];
  const { data: profiles } = touristeIds.length
    ? await admin.from("profiles").select("user_id, full_name").in("user_id", touristeIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles || []).map((p: {user_id: string; full_name: string}) => [p.user_id, p.full_name]));

  const avis = (avisRaw || []).map((a: {
    id: string; rating: number; comment: string; is_moderated: boolean;
    created_at: string; touriste_id: string; excursion_id: string;
    prestataire_response?: string;
  }) => ({
    id: a.id,
    rating: a.rating,
    comment: a.comment,
    is_moderated: a.is_moderated,
    created_at: a.created_at,
    prestataire_response: a.prestataire_response || null,
    touriste_name: profileMap[a.touriste_id] || "Client anonyme",
    excursion_title: excMap[a.excursion_id]?.title || "Excursion",
    excursion_city: excMap[a.excursion_id]?.city || "",
  }));

  const approved = avis.filter(a => a.is_moderated);
  const avgRating = approved.length
    ? (approved.reduce((s, a) => s + a.rating, 0) / approved.length).toFixed(1)
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>Avis clients</h1>
        <p style={{ color: "#6B7280", marginTop: 4 }}>
          {approved.length} avis publiés
          {avgRating && <> · Note moyenne : <strong style={{ color: "#F59E0B" }}>⭐ {avgRating}/5</strong></>}
          {avis.length - approved.length > 0 && (
            <> · <span style={{ color: "#D97706", fontWeight: 600 }}>{avis.length - approved.length} en attente de modération</span></>
          )}
        </p>
      </div>

      {avis.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>⭐</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucun avis pour l&apos;instant</p>
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>Les avis de vos clients apparaîtront ici après modération</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {avis.map(a => (
            <div key={a.id} style={{
              background: "white", borderRadius: 16, border: "1px solid #F3F4F6",
              padding: "20px 24px",
              borderLeft: `4px solid ${a.is_moderated ? "#2B96A8" : "#E5E7EB"}`,
              opacity: a.is_moderated ? 1 : 0.65,
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                    {(a.touriste_name[0] || "C").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{a.touriste_name}</span>
                      {!a.is_moderated && (
                        <span style={{ padding: "2px 8px", background: "#FFFBEB", color: "#D97706", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>⏳ En attente</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                      {a.excursion_title} · {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 18, color: s <= a.rating ? "#F59E0B" : "#E5E7EB" }}>★</span>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, marginBottom: a.prestataire_response ? 14 : 0 }}>
                {a.comment}
              </p>

              {/* Réponse prestataire */}
              {a.prestataire_response && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(43,150,168,.06)", borderRadius: 10, borderLeft: "3px solid #2B96A8" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#2B96A8", marginBottom: 4 }}>Votre réponse :</p>
                  <p style={{ fontSize: 13, color: "#374151" }}>{a.prestataire_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}