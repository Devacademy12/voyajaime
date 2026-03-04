import { createAdminClient } from "@/lib/supabaseAdmin";
import NouvelleExcursionClient from "./NouvelleExcursionClient";

export default async function NouvelleExcursionPage() {
  const supabase = createAdminClient();
  const [{ data: villes }, { data: categories }] = await Promise.all([
    supabase.from("villes").select("id, nom, emoji, active").eq("active", true).order("nom"),
    supabase.from("categories").select("id, nom, emoji, couleur").order("nom"),
  ]);

  return (
    <NouvelleExcursionClient
      villes={villes || []}
      categories={categories || []}
    />
  );
}