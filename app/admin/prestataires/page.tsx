import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PrestatairesClient from "./PrestatairesClient";
import { Clock, CheckCircle, Building2 } from "lucide-react";

export default async function AdminPrestataires() {
  const supabase = supabaseAdmin;

  const { data: prestataires, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "prestataire")
    .order("created_at", { ascending: false });

  if (error) console.error("Erreur chargement prestataires:", error.message);

  const pIds = (prestataires || []).map(p => p.user_id);

  const { data: excursions } = pIds.length
    ? await supabase
        .from("excursions")
        .select("prestataire_id, is_active")
        .in("prestataire_id", pIds)
    : { data: [] };

  const excCountMap: Record<string, { total: number; active: number }> = {};
  (excursions || []).forEach((e: { prestataire_id: string; is_active: boolean }) => {
    if (!excCountMap[e.prestataire_id])
      excCountMap[e.prestataire_id] = { total: 0, active: 0 };
    excCountMap[e.prestataire_id].total++;
    if (e.is_active) excCountMap[e.prestataire_id].active++;
  });

  // ── Récupérer les emails depuis auth.users via l'API Admin ──────────
  let emailMap: Record<string, string> = {};
  if (pIds.length) {
    // listUsers retourne max 1000 par page — suffisant pour un admin
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authError) {
      console.error("Erreur récupération emails auth:", authError.message);
    } else {
      emailMap = Object.fromEntries(
        (authData?.users ?? []).map(u => [u.id, u.email ?? ""])
      );
    }
  }

  const data = (prestataires || []).map(p => ({
    ...p,
    email:            emailMap[p.user_id] ?? null,
    excursion_count:  excCountMap[p.user_id]?.total  || 0,
    excursion_active: excCountMap[p.user_id]?.active || 0,
  }));

  const pendingCount   = data.filter(p => !p.is_validated).length;
  const validatedCount = data.filter(p =>  p.is_validated).length;
  const totalCount     = data.length;

  return (
    <div
      style={{
        fontFamily: "'DM Sans',system-ui,sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fa  { animation: fadeUp .3s ease both; }
        .fa1 { animation-delay:.05s }
        .fa2 { animation-delay:.10s }
        .pstat-card { transition: transform .2s, box-shadow .2s; cursor: default; }
        .pstat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,51,102,.10) !important; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="fa"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#053366",
              margin: 0,
              letterSpacing: "-0.4px",
            }}
          >
            Gestion des prestataires
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              margin: "3px 0 0",
              fontWeight: 500,
            }}
          >
            Validez, modifiez ou supprimez les comptes prestataires
          </p>
        </div>

        {pendingCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 10,
              background: "rgba(217,119,6,.08)",
              border: "1px solid rgba(217,119,6,.25)",
              fontSize: 12,
              fontWeight: 700,
              color: "#D97706",
              whiteSpace: "nowrap",
            }}
          >
            <Clock size={13} strokeWidth={1.5} />
            {pendingCount} en attente
          </div>
        )}
      </div>

      {/* ── KPI mini-cards ── */}
      <div
        className="fa fa1"
        style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}
      >
        {[
          {
            label: "En attente",
            value: pendingCount,
            Icon: Clock,
            color: "#D97706",
            bg: "rgba(217,119,6,.1)",
            border: "rgba(217,119,6,.2)",
          },
          {
            label: "Validés",
            value: validatedCount,
            Icon: CheckCircle,
            color: "#02AFCF",
            bg: "rgba(2,175,207,.1)",
            border: "rgba(2,175,207,.2)",
          },
          {
            label: "Total",
            value: totalCount,
            Icon: Building2,
            color: "#259FFC",
            bg: "rgba(37,159,252,.1)",
            border: "rgba(37,159,252,.2)",
          },
        ].map(s => (
          <div
            key={s.label}
            className="pstat-card"
            style={{
              background: "white",
              borderRadius: 12,
              padding: "10px 14px",
              border: `1px solid ${s.border}`,
              boxShadow: "0 2px 8px rgba(5,51,102,.04)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                background: s.bg,
                border: `1px solid ${s.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <s.Icon size={15} color={s.color} strokeWidth={1.5} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#053366",
                  lineHeight: 1,
                  margin: "0 0 2px",
                }}
              >
                {s.value.toLocaleString("fr-FR")}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "#9CA3AF",
                  fontWeight: 600,
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Liste ── */}
      <div className="fa fa2">
        <PrestatairesClient prestataires={data} />
      </div>
    </div>
  );
}