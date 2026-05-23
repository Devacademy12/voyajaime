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
    .select("id, title, city, photos")
    .eq("prestataire_id", user.id);

  const excIds = excursions?.map(e => e.id) || [];
  const excMap = Object.fromEntries(
    (excursions || []).map(e => [e.id, { title: e.title, city: e.city, photo: e.photos?.[0] || null }])
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
    excursion_id: a.excursion_id,
    excursion_title: excMap[a.excursion_id]?.title || "Excursion",
    excursion_city: excMap[a.excursion_id]?.city || "",
    excursion_photo: excMap[a.excursion_id]?.photo || null,
  }));

  const approved = avis.filter(a => a.is_moderated);
  const avgRating = approved.length
    ? (approved.reduce((s, a) => s + a.rating, 0) / approved.length).toFixed(1)
    : null;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, agency_name")
    .eq("user_id", user.id)
    .single();

  const name = profile?.agency_name || profile?.full_name || "Prestataire";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="pw">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pw {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #F5F7FA;
          min-height: 100vh;
          padding: 28px 36px 64px;
          width: 100%;
        }

        /* ── Header ── */
        .pw-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
          animation: fadeUp .35s ease both;
          flex-wrap: wrap;
        }
        .pw-header-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: #EFF9FB; border: 1px solid rgba(43,150,168,.22);
          border-radius: 20px; padding: 4px 12px;
          font-size: 11px; font-weight: 700; color: #2B96A8;
          text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: 10px;
        }
        .pw-header-title {
          font-size: clamp(22px, 4vw, 30px); font-weight: 800;
          color: #053366; line-height: 1.1; letter-spacing: -.02em;
        }
        .pw-header-sub {
          font-size: 13px; color: #94A3B8; margin-top: 5px; font-weight: 500;
        }
        .pw-header-badge {
          display: flex; align-items: center; gap: 8px;
          background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
          padding: 10px 16px; flex-shrink: 0; align-self: flex-start;
        }
        .pw-header-badge-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #053366, #2B96A8);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: #fff;
        }
        .pw-header-badge-name { font-size: 13px; font-weight: 700; color: #053366; }
        .pw-header-badge-role { font-size: 11px; color: #94A3B8; font-weight: 500; }

        .avis-card {
          background: #fff; border-radius: 20px; border: 1.5px solid #E2E8F0;
          padding: 24px; margin-bottom: 16px; animation: fadeUp .45s ease both;
        }
        
        .exc-link:hover { background: #F8FAFC !important; border-color: #CBD5E1 !important; transform: translateX(4px); }
      `}</style>

      <header className="pw-header">
        <div className="pw-header-left">
          <div className="pw-header-eyebrow">⭐ Retours clients</div>
          <h1 className="pw-header-title">Avis clients</h1>
          <p className="pw-header-sub">
            {approved.length} avis publiés {avgRating && <>· Note moyenne : <strong>{avgRating}/5</strong></>}
          </p>
        </div>

        <div className="pw-header-badge">
          <div className="pw-header-badge-avatar">{initials}</div>
          <div>
            <div className="pw-header-badge-name">{name}</div>
            <div className="pw-header-badge-role">Prestataire</div>
          </div>
        </div>
      </header>

      {avis.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 24, border: "1.5px solid #E2E8F0" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>⭐</p>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#053366", marginBottom: 8 }}>Aucun avis pour l&apos;instant</h3>
          <p style={{ fontSize: 14, color: "#94A3B8" }}>Les avis de vos clients apparaîtront ici après modération.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {avis.map(a => (
            <div key={a.id} className="avis-card" style={{ borderLeft: `5px solid ${a.is_moderated ? "#2B96A8" : "#E2E8F0"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#053366", flexShrink: 0 }}>
                    <div style={{ margin: "auto" }}>{(a.touriste_name[0] || "C").toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#053366" }}>{a.touriste_name}</span>
                      {!a.is_moderated && (
                        <span style={{ padding: "3px 10px", background: "#FFFBEB", color: "#D97706", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>En attente</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 20, color: s <= a.rating ? "#F59E0B" : "#E2E8F0" }}>★</span>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
                {a.comment}
              </p>

              <a href={`/prestataire/excursions/${a.excursion_id}`} className="exc-link" 
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "#F8FAFC", borderRadius: 16, border: "1.5px solid #E2E8F0", textDecoration: "none", transition: "all .2s" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#E2E8F0" }}>
                  {a.excursion_photo
                    ? <img src={a.excursion_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏔️</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.excursion_title}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>📍 {a.excursion_city || "Tunisie"}</p>
                </div>
                <span style={{ color: "#CBD5E1", fontSize: 20, paddingRight: 8 }}>›</span>
              </a>

              {a.prestataire_response && (
                <div style={{ marginTop: 16, padding: "16px", background: "#EFF9FB", borderRadius: 16, border: "1.5px solid rgba(43,150,168,.1)" }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#2B96A8", textTransform: "uppercase", marginBottom: 6 }}>Votre réponse</p>
                  <p style={{ fontSize: 14, color: "#053366", fontStyle: "italic" }}>&ldquo;{a.prestataire_response}&rdquo;</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}