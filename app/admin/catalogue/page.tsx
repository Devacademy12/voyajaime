import { createAdminClient } from "@/lib/supabaseAdmin";
import CatalogueClient from "./CatalogueClient";

export default async function AdminCatalogue() {
  const supabase = createAdminClient();
  const [{ data: villes }, { data: categories }] = await Promise.all([
    supabase.from("villes").select("*").order("nom"),
    supabase.from("categories").select("*").order("nom"),
  ]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>Catalogues & Villes</h1>
        <p style={{ color: "#6B7280", marginTop: 4 }}>
          {villes?.length || 0} villes · {categories?.length || 0} catégories
        </p>
      </div>
      <CatalogueClient villes={villes || []} categories={categories || []} />
    </div>
  );
}