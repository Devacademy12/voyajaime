import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import TouristeNav from "../components/touriste/TouristeNav";

export const revalidate = 300;

export default async function TouristeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Pas de redirect — les pages touriste sont accessibles sans connexion.
  // Chaque page gère elle-même les actions qui nécessitent un compte (favoris, réservation…).

  let userName = "Touriste";
  let favCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("role, full_name").eq("user_id", user.id).single();

    // Rediriger seulement si l'utilisateur est connecté mais n'est pas touriste
    if (profile && profile.role !== "touriste") redirect("/auth");

    userName = profile?.full_name || user.email || "Touriste";

    const { count } = await supabase
      .from("favoris").select("*", { count: "exact", head: true }).eq("touriste_id", user.id);
    favCount = count || 0;
  }

  return (
<div
  style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#FAFAF9",
    fontFamily: "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }}
>      <TouristeNav
        userName={userName}
        favCount={favCount}
      />
      <div style={{ paddingTop: 64 }} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/*
          ── Container centré global ──────────────────────────────────────
          Toutes les pages touriste (dashboard, favoris, historique,
          réservations, profil, itinéraires) héritent de ce container.

          EXCEPTIONS fullscreen (gèrent leur propre layout) :
            • /touriste/messages   → chat 2 colonnes, pas de max-width
            • /modeAssister        → wizard fullscreen
            • /modeLibre           → builder fullscreen
          Ces pages contournent ce container via leurs propres styles CSS.
          ────────────────────────────────────────────────────────────────
        */}
        <div className="touriste-container">
          {children}
        </div>
      </main>

      <style>{`
        /* ── Container centré global touriste ── */
        .touriste-container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 24px;
          padding-right: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Tablette */
        @media (max-width: 1024px) {
          .touriste-container {
            padding-left: 20px;
            padding-right: 20px;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .touriste-container {
            padding-left: 16px;
            padding-right: 16px;
          }
        }

        /*
          Pages fullscreen — elles posent min-height:100vh sur leur propre
          wrapper donc elles débordent naturellement du container.
          On les laisse s'étirer en annulant le max-width sur leur wrapper direct.
        */
        .touriste-container > .messages-page-wrapper,
        .touriste-container > .ma2-page,
        .touriste-container > .mlp-page {
          width: calc(100% + 48px);
          margin-left: -24px;
          margin-right: -24px;
          max-width: none;
        }

        @media (max-width: 640px) {
          .touriste-container > .messages-page-wrapper,
          .touriste-container > .ma2-page,
          .touriste-container > .mlp-page {
            width: calc(100% + 32px);
            margin-left: -16px;
            margin-right: -16px;
          }
        }
      `}</style>
    </div>
  );
}
