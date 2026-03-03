import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ProfilClient from "./ProfilClient";

export default async function PrestataireProfil() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>Mon profil</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Gérez vos informations professionnelles</p>
      </div>
      <ProfilClient profile={profile} email={user!.email || ""} />
    </div>
  );
}
