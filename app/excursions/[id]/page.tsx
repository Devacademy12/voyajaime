export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import ExcursionClient from "./ExcursionClient";

export default async function ExcursionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // 1. Excursion avec catégories
  const { data: exc, error } = await supabase
    .from("excursions")
    .select("*, categories")  // ✅ Ajout de categories
    .eq("id", id)
    .single();
  
  if (error || !exc) { 
    console.error("Excursion not found:", id, error?.message); 
    notFound(); 
  }

  // 2. Prestataire avec avatar
  let prestataire = null;
  if (exc.prestataire_id) {
    const { data: p } = await supabase
      .from("profiles")
      .select("user_id, full_name, agency_name, avatar_url, city, description, phone")
      .eq("user_id", exc.prestataire_id)
      .single();
    prestataire = p;
  }

  // 3. Avis approuvés avec noms, avatars et likes
  const { data: avisData } = await supabase
    .from("avis")
    .select("id, rating, comment, created_at, touriste_id, prestataire_response, likes_count")
    .eq("excursion_id", id)
    .eq("is_moderated", true)
    .order("created_at", { ascending: false });

  const initialAvis = [];
  if (avisData?.length) {
    const ids = [...new Set(avisData.map((a: { touriste_id: string }) => a.touriste_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", ids);

    const profileMap = Object.fromEntries(
      (profiles || []).map((p: { user_id: string; full_name: string; avatar_url: string }) => [p.user_id, p])
    );

    initialAvis.push(...avisData.map((a: {
      id: string; rating: number; comment: string; created_at: string;
      touriste_id: string; prestataire_response: string | null; likes_count: number;
    }) => ({
      id: a.id, rating: a.rating, comment: a.comment, created_at: a.created_at,
      prestataire_response: a.prestataire_response || null,
      likes_count: a.likes_count || 0,
      touriste_name: profileMap[a.touriste_id]?.full_name || "Voyageur",
      touriste_avatar: profileMap[a.touriste_id]?.avatar_url || null,
    })));
  }

  // 4. Likes de l'utilisateur connecté
  const serverSupabase = await createServerSupabaseClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  const avisIds = initialAvis.map(a => a.id);
  let myLikedIds: string[] = [];
  if (user && avisIds.length) {
    const { data: likes } = await supabase
      .from("avis_likes")
      .select("avis_id")
      .eq("user_id", user.id)
      .in("avis_id", avisIds);
    myLikedIds = (likes || []).map((l: { avis_id: string }) => l.avis_id);
  }

  // 5. Récupérer les catégories (si ce n'est pas déjà fait via la jointure)
  let categories = exc.categories || [];
  
  // Si categories n'est pas dans exc, récupère-les séparément
  if (!categories.length) {
    const { data: excursionCategories } = await supabase
      .from("excursion_categories")
      .select("categories(*)")
      .eq("excursion_id", id);
    
    categories = (excursionCategories || []).map((ec: any) => ec.categories).filter(Boolean);
  }

  return (
    <ExcursionClient
      exc={exc}
      prestataire={prestataire}
      initialAvis={initialAvis}
      myLikedIds={myLikedIds}
      categories={categories}  // ✅ Ajout de la propriété categories
    />
  );
}