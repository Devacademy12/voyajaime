import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import EditExcursionClient from "./EditExcursionClient";

interface PageProps { params: Promise<{ id: string }>; }

export default async function EditExcursionPage({ params }: PageProps) {
  const { id } = await params;

  const serverSupabase = await createServerSupabaseClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) notFound();

  const admin = createAdminClient();

  const [{ data: exc }, { data: villes }, { data: categories }] = await Promise.all([
    admin.from("excursions").select("*").eq("id", id).eq("prestataire_id", user.id).single(),
    admin.from("villes").select("id, nom, emoji, active").eq("active", true).order("nom"),
    admin.from("categories").select("id, nom, emoji, couleur").order("nom"),
  ]);

  if (!exc) notFound();

  return (
    <EditExcursionClient
      exc={exc}
      villes={villes || []}
      categories={categories || []}
    />
  );
}