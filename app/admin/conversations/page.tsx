import { createAdminClient } from "@/lib/supabaseAdmin";
import ConversationsClient from "./ConversationsClient";

export default async function AdminConversations() {
  const supabase = createAdminClient();

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, touriste_id, prestataire_id, excursion_id, created_at, touriste_name, prestataire_name")
    .order("created_at", { ascending: false });

  const convData = convs || [];

  // Titres excursions
  const excIds = [...new Set(convData.map(c => c.excursion_id).filter(Boolean))];
  const { data: excursions } = excIds.length
    ? await supabase.from("excursions").select("id, title").in("id", excIds)
    : { data: [] };

  // Messages
  const convIds = convData.map(c => c.id);
  const { data: messages } = convIds.length
    ? await supabase
        .from("messages")
        .select("id, conversation_id, contenu, lu, expediteur_id, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Avatars touristes + prestataires
  const userIds = [...new Set([
    ...convData.map(c => c.touriste_id),
    ...convData.map(c => c.prestataire_id),
  ].filter(Boolean))];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds)
    : { data: [] };

  return (
    <ConversationsClient
      conversations={convData}
      excursions={excursions || []}
      messages={messages || []}
      profiles={profiles || []}
    />
  );
}