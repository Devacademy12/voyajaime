import { createServerSupabaseClient } from "@/lib/supabaseServer";
import SliderAdminClient from "./SliderAdminClient";

export default async function AdminSliderPage() {
  const supabase = await createServerSupabaseClient();

  // Charger les slides configurées
  const { data: slides } = await supabase
    .from("home_slider")
    .select("*")
    .order("position", { ascending: true });

  // Charger toutes les excursions actives pour la sélection
  const { data: excursions } = await supabase
    .from("excursions")
    .select("id, title, city, photos, categories, rating")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  return (
    <SliderAdminClient
      initialSlides={slides || []}
      excursions={excursions || []}
    />
  );
}