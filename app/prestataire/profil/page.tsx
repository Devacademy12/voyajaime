import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ProfilClient from "./ProfilClient";

export default async function PrestataireProfil() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();

  return (
    <div>
      
      <ProfilClient profile={profile} email={user!.email || ""} />
    </div>
  );
}
