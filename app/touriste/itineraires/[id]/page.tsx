import { notFound } from "next/navigation";
import { createServerSupabaseClient as createServerClient } from "@/lib/supabaseServer";
import EditItineraireClient from "./EditItineraireClient";

export default async function EditItinerairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient(); // ← await, sans cookieStore

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data } = await supabase
    .from("itineraires")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) return notFound();

  return <EditItineraireClient itineraireId={id} />;
}