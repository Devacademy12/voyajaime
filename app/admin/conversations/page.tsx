import { createAdminClient } from "@/lib/supabaseAdmin";
import ConversationsClient from "./ConversationsClient";

const BLOCKED_PATTERNS = [
  { pattern: /(\+?\d[\d\s\-\.]{7,}\d)/g,                                    type: "phone",    label: "Téléphone" },
  { pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,          type: "email",    label: "Email" },
  { pattern: /whatsapp|whats[\s\-]?app|wa\.me/gi,                             type: "whatsapp", label: "WhatsApp" },
  { pattern: /telegram|t\.me\//gi,                                            type: "telegram", label: "Telegram" },
  { pattern: /instagram|insta\b/gi,                                           type: "instagram",label: "Instagram" },
  { pattern: /\b(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf){4,}/gi,   type: "phone",    label: "Téléphone masqué" },
];

function detectViolations(contenu: string) {
  const found: { type: string; label: string; match: string }[] = [];
  for (const { pattern, type, label } of BLOCKED_PATTERNS) {
    const matches = contenu.match(pattern);
    if (matches) matches.forEach(m => found.push({ type, label, match: m }));
  }
  return found;
}

export default async function AdminConversations() {
  const supabase = createAdminClient();

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, touriste_id, prestataire_id, excursion_id, created_at, touriste_name, prestataire_name")
    .order("created_at", { ascending: false });

  const convData = convs || [];

  const excIds = [...new Set(convData.map(c => c.excursion_id).filter(Boolean))];
  const { data: excursions } = excIds.length
    ? await supabase.from("excursions").select("id, title").in("id", excIds)
    : { data: [] };

  const convIds = convData.map(c => c.id);
  const { data: messages } = convIds.length
    ? await supabase
        .from("messages")
        .select("id, conversation_id, contenu, lu, expediteur_id, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const userIds = [...new Set([
    ...convData.map(c => c.touriste_id),
    ...convData.map(c => c.prestataire_id),
  ].filter(Boolean))];

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds)
    : { data: [] };

  // Analyse violations
  const violations: Record<string, { type: string; label: string; match: string }[]> = {};
  for (const msg of messages || []) {
    const found = detectViolations(msg.contenu || "");
    if (found.length > 0) violations[msg.id] = found;
  }

  return (
    <ConversationsClient
      conversations={convData}
      excursions={excursions || []}
      messages={messages || []}
      profiles={profiles || []}
      violations={violations}
    />
  );
}