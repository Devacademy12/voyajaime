import { createAdminClient } from "@/lib/supabaseAdmin";
import NouvelleExcursionClient from "./NouvelleExcursionClient";

export default async function NouvelleExcursionPage() {
  const supabase = createAdminClient();

  const [{ data: villes }, { data: categories }, { data: langues }] =
    await Promise.all([
      supabase.from("villes").select("id, nom, active").eq("active", true).order("nom"),
      supabase.from("categories").select("id, nom, couleur").order("nom"),
      supabase.from("langues").select("id, nom").eq("actif", true).order("nom"), // ← ajout
    ]);

  return (
    <NouvelleExcursionClient
      villes={villes || []}
      categories={categories || []}
      langues={langues || []}  // ← ajout
    />
  );
}