import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import TouristeNav from "../components/touriste/TouristeNav";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FAFAF9" }}>
      <TouristeNav
        userName={userName}
        favCount={favCount}
      />
      <div style={{ paddingTop: 64 }} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}