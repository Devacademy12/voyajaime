import { createServerSupabaseClient } from "@/lib/supabaseServer";
import DashboardClient from "./DashboardClient";

export default async function PrestataireDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile }      = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
  const { data: excursions }   = await supabase.from("excursions").select("id, title, rating, is_active, reviews_count").eq("prestataire_id", user!.id);
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, excursion:excursions!inner(title, prestataire_id)")
    .eq("excursion.prestataire_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: paiements } = await supabase.from("paiements").select("net_amount, status").eq("prestataire_id", user!.id);

  return (
    <DashboardClient
      profile={profile}
      excursions={(excursions || []) as Record<string, unknown>[]}
      reservations={(reservations || []) as Record<string, unknown>[]}
      paiements={(paiements || []) as Record<string, unknown>[]}
    />
  );
}