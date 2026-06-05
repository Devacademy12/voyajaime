// ❌ IMPORTANT: change this later to caching in STEP 2
export const revalidate = 300;
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import ExcursionClient from "./ExcursionClient";

export default async function ExcursionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createAdminClient();

  // 1. Excursion
  const { data: exc, error } = await supabase
    .from("excursions")
    .select("*, categories")
    .eq("id", id)
    .single();

  if (error || !exc) {
    console.error("Excursion not found:", id, error?.message);
    notFound();
  }

  // 2. Auth user (for likes)
  const serverSupabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  // 3. Parallel queries (PERFORMANCE BOOST 🚀)
  const [prestataireRes, avisRes, excursionCategoriesRes] =
    await Promise.all([
      exc.prestataire_id
        ? supabase
            .from("profiles")
            .select(
              "user_id, full_name, agency_name, avatar_url, city, description, phone"
            )
            .eq("user_id", exc.prestataire_id)
            .single()
        : Promise.resolve({ data: null }),

      supabase
        .from("avis")
        .select(
          "id, rating, comment, created_at, touriste_id, prestataire_response, likes_count"
        )
        .eq("excursion_id", id)
        .eq("is_moderated", true)
        .order("created_at", { ascending: false }),

      supabase
        .from("excursion_categories")
        .select("categories(*)")
        .eq("excursion_id", id),
    ]);

  const prestataire = prestataireRes.data;
  const avisData = avisRes.data || [];

  // 4. Build profiles map for avis
  const ids = [
    ...new Set(
      avisData.map((a: any) => a.touriste_id).filter(Boolean)
    ),
  ];

  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profiles || []).map((p: any) => [p.user_id, p])
  );

  const initialAvis = avisData.map((a: any) => ({
    id: a.id,
    rating: a.rating,
    comment: a.comment,
    created_at: a.created_at,
    prestataire_response: a.prestataire_response || null,
    likes_count: a.likes_count || 0,
    touriste_name:
      profileMap[a.touriste_id]?.full_name || "Voyageur",
    touriste_avatar:
      profileMap[a.touriste_id]?.avatar_url || null,
  }));

  // 5. Likes of current user
  let myLikedIds: string[] = [];

  if (user && initialAvis.length) {
    const { data: likes } = await supabase
      .from("avis_likes")
      .select("avis_id")
      .eq("user_id", user.id)
      .in(
        "avis_id",
        initialAvis.map((a: any) => a.id)
      );

    myLikedIds = (likes || []).map((l: any) => l.avis_id);
  }

  // 6. Categories
  let categories =
    excursionCategoriesRes.data
      ?.map((ec: any) => ec.categories)
      .filter(Boolean) || [];

  if (!categories.length) {
    categories = exc.categories || [];
  }

  // 7. Render
  return (
    <ExcursionClient
      exc={exc}
      prestataire={prestataire}
      initialAvis={initialAvis}
      myLikedIds={myLikedIds}
      categories={categories}
    />
  );
}