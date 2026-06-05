import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { notifyConversationMessage } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const conversationId = body?.conversationId as string | undefined;
    const messageId = body?.messageId as string | undefined;

    if (!conversationId || !messageId) {
      return NextResponse.json({ error: "conversationId et messageId requis" }, { status: 400 });
    }

    const admin = createAdminClient();

    const [{ data: message, error: messageError }, { data: conversation, error: conversationError }] = await Promise.all([
      admin
        .from("messages")
        .select("id, conversation_id, expediteur_id, contenu")
        .eq("id", messageId)
        .single(),
      admin
        .from("conversations")
        .select("id, touriste_id, prestataire_id, excursion_id")
        .eq("id", conversationId)
        .single(),
    ]);

    if (messageError || conversationError || !message || !conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    if (message.conversation_id !== conversation.id || message.expediteur_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const recipientUserId = conversation.touriste_id === user.id ? conversation.prestataire_id : conversation.touriste_id;
    const recipientRole = conversation.touriste_id === user.id ? "prestataire" : "touriste";
    const dashboardLink = recipientRole === "prestataire" ? "/prestataire/messages" : "/touriste/messages";

    const [senderProfile, recipientProfile, excursion] = await Promise.all([
      admin.from("profiles").select("user_id, full_name, agency_name").eq("user_id", user.id).single(),
      admin.from("profiles").select("user_id, full_name, agency_name, role").eq("user_id", recipientUserId).single(),
      conversation.excursion_id
        ? admin.from("excursions").select("title").eq("id", conversation.excursion_id).single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const senderName = senderProfile.data?.agency_name || senderProfile.data?.full_name || "Utilisateur";

    await notifyConversationMessage({
      recipient: {
        userId: recipientUserId,
        role: (recipientProfile.data?.role || recipientRole) as "touriste" | "prestataire" | "admin",
        fullName: recipientProfile.data?.full_name || null,
        agencyName: recipientProfile.data?.agency_name || null,
      },
      senderName,
      conversationLabel: excursion.data?.title || "conversation",
      preview: message.contenu,
      conversationId: conversation.id,
      messageId: message.id,
      dashboardLink,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[notifications/message]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
