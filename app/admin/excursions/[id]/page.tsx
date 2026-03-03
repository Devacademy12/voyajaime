import { createAdminClient } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import AdminExcursionDetail from "./AdminExcursionDetail";

export default async function AdminExcursionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: exc } = await supabase.from("excursions").select("*").eq("id", id).single();
  if (!exc) notFound();

  // Prestataire
  const { data: prestataire } = exc.prestataire_id
    ? await supabase.from("profiles").select("*").eq("user_id", exc.prestataire_id).single()
    : { data: null };

  // Avis + touristes
  const { data: avisRaw } = await supabase
    .from("avis")
    .select("id, rating, comment, is_moderated, created_at, touriste_id, prestataire_response, likes_count")
    .eq("excursion_id", id)
    .order("created_at", { ascending: false });

  const touristeIds = [...new Set((avisRaw || []).map((a: { touriste_id: string }) => a.touriste_id).filter(Boolean))];
  const { data: profiles } = touristeIds.length
    ? await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", touristeIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profiles || []).map((p: { user_id: string; full_name: string; avatar_url: string }) => [p.user_id, p])
  );

  const avis = (avisRaw || []).map((a: {
    id: string; rating: number; comment: string; is_moderated: boolean;
    created_at: string; touriste_id: string; prestataire_response: string | null; likes_count: number;
  }) => ({
    ...a,
    touriste_name: profileMap[a.touriste_id]?.full_name || "Anonyme",
    touriste_avatar: profileMap[a.touriste_id]?.avatar_url || null,
  }));

  // Stats
  const { data: reservations } = await supabase
    .from("reservations").select("id, status").eq("excursion_id", id);

  return (
    <AdminExcursionDetail
      exc={exc}
      prestataire={prestataire}
      avis={avis}
      reservations={reservations || []}
    />
  );
}