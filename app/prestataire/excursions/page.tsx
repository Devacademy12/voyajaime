import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ExcursionsListClient from "./ExcursionsListClient";

export default async function PrestataireExcursions() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: excursions } = await supabase
    .from("profiles")
    .select("full_name, agency_name")
    .eq("user_id", user!.id)
    .single();

  const { data: list } = await supabase
    .from("excursions")
    .select("*")
    .eq("prestataire_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <ExcursionsListClient
      excursions={list || []}
      prestataireId={user!.id}
      prestataireInfo={{
        full_name: excursions?.full_name || null,
        agency_name: excursions?.agency_name || null
      }}
    />
  );
}