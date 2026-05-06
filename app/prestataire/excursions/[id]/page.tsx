import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import ExcursionDetailPrestataire from "./ExcursionDetailPrestataire";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrestataireExcursionDetail({ params }: PageProps) {
  const { id } = await params;

  const serverSupabase = await createServerSupabaseClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) notFound();

  const admin = createAdminClient();

  // Excursion
  const { data: exc } = await admin
    .from("excursions")
    .select("*")
    .eq("id", id)
    .eq("prestataire_id", user.id) // sécurité : seulement SES excursions
    .single();

  if (!exc) notFound();

  // Avis (tous — modérés ou non)
  const { data: avisRaw } = await admin
    .from("avis")
    .select("id, rating, comment, is_moderated, created_at, touriste_id, prestataire_response, likes_count")
    .eq("excursion_id", id)
    .order("created_at", { ascending: false });

  // Noms des touristes
  const touristeIds = [...new Set((avisRaw || []).map((a: {touriste_id: string}) => a.touriste_id).filter(Boolean))];
  const { data: profiles } = touristeIds.length
    ? await admin.from("profiles").select("user_id, full_name").in("user_id", touristeIds)
    : { data: [] };

  const nameMap = Object.fromEntries(
    (profiles || []).map((p: {user_id: string; full_name: string}) => [p.user_id, p.full_name])
  );

  // Likes du prestataire connecté
  const avisIds = (avisRaw || []).map((a: {id: string}) => a.id);
  const { data: myLikes } = avisIds.length
    ? await admin.from("avis_likes").select("avis_id").eq("user_id", user.id).in("avis_id", avisIds)
    : { data: [] };

  const likedSet = new Set((myLikes || []).map((l: {avis_id: string}) => l.avis_id));

  const avis = (avisRaw || []).map((a: {
    id: string; rating: number; comment: string; is_moderated: boolean;
    created_at: string; touriste_id: string; prestataire_response: string | null;
    likes_count: number;
  }) => ({
    ...a,
    touriste_name: nameMap[a.touriste_id] || "Client anonyme",
    liked_by_me: likedSet.has(a.id),
  }));

  const avgRating = avis.filter(a => a.is_moderated).length
    ? (avis.filter(a => a.is_moderated).reduce((s, a) => s + a.rating, 0) / avis.filter(a => a.is_moderated).length).toFixed(1)
    : null;

  return (
    <ExcursionDetailPrestataire
      exc={exc}
      avis={avis}
      prestataireId={user.id}
      avgRating={avgRating}
    />
  );
}