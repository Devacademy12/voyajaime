import type { UserRole } from "@/types";
import { createAdminClient } from "@/lib/supabaseAdmin";
import {
  sendConversationMessageNotification,
  sendPrestataireApplicationNotification,
  sendReservationCancellationPrestataire,
  sendReservationCancellationTouriste,
  sendReservationConfirmation,
  sendReservationPrestataireNotification,
} from "@/lib/emails/resend";

type NotificationRecipient = {
  userId: string;
  role: UserRole;
  email?: string | null;
  fullName?: string | null;
  agencyName?: string | null;
};

type ReservationContext = {
  reservation: {
    id: string;
    date: string;
    time: string;
    people_count: number;
    total_price: number;
    booking_code: string;
  };
  excursion: {
    title: string;
    city: string;
  };
  touriste: NotificationRecipient;
  prestataire: NotificationRecipient;
};

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Erreur inconnue";
  }
}

async function resolveUserEmail(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}


async function createOrUpdateNotification(params: {
  eventKey: string;
  recipient: NotificationRecipient;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();

  const payload = {
    event_key: params.eventKey,
    recipient_user_id: params.recipient.userId,
    recipient_role: params.recipient.role,
    type: params.type,
    title: params.title,
    message: params.message,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
    is_read: false,
    read_at: null,
    delivery_status: "pending",
    delivery_attempts: 0,
    delivery_last_error: null,
  };

  const { data: existing, error: existingError } = await admin
    .from("notifications")
    .select("id, delivery_status, delivery_attempts")
    .eq("event_key", params.eventKey)
    .maybeSingle();

  if (existingError) {
    console.error("[notifications] lookup error:", existingError.message);
    return null;
  }

  if (existing) {
    return existing as { id: string; delivery_status: string; delivery_attempts: number };
  }

  const { data, error } = await admin
    .from("notifications")
    .insert(payload)
    .select("id, delivery_status, delivery_attempts")
    .single();

  if (error) {
    console.error("[notifications] insert error:", error.message);
    return null;
  }

  return data as { id: string; delivery_status: string; delivery_attempts: number };
}

async function trackEmailDelivery(notificationId: string, success: boolean, lastError: string | null, previousAttempts = 0) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({
      delivery_status: success ? "sent" : "failed",
      delivery_attempts: previousAttempts + 1,
      delivery_last_error: lastError,
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    console.error("[notifications] update error:", error.message);
  }
}

async function dispatchNotification(params: {
  eventKey: string;
  recipient: NotificationRecipient;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  sendEmail?: () => Promise<unknown>;
}) {
  const notification = await createOrUpdateNotification(params);
  if (!notification) return null;

  if (!params.sendEmail || notification.delivery_status === "sent") {
    return notification;
  }

  try {
    await params.sendEmail();
    await trackEmailDelivery(notification.id, true, null, Number(notification.delivery_attempts || 0));
  } catch (error) {
    await trackEmailDelivery(notification.id, false, formatError(error), Number(notification.delivery_attempts || 0));
  }

  return notification;
}

export async function notifyReservationConfirmed(context: ReservationContext) {
  const { reservation, excursion, touriste, prestataire } = context;
  const touristeEmail = touriste.email ?? await resolveUserEmail(touriste.userId);
  const prestataireEmail = prestataire.email ?? await resolveUserEmail(prestataire.userId);
  const metadata = {
    reservation_id: reservation.id,
    booking_code: reservation.booking_code,
    excursion_title: excursion.title,
    excursion_city: excursion.city,
  };

  await Promise.allSettled([
    dispatchNotification({
      eventKey: `reservation-confirmed:${reservation.id}:${touriste.userId}`,
      recipient: touriste,
      type: "reservation_confirmed",
      title: `Réservation confirmée — ${excursion.title}`,
      message: `Votre réservation ${reservation.booking_code} est confirmée.`,
      entityType: "reservation",
      entityId: reservation.id,
      metadata,
      sendEmail: touristeEmail
        ? () => sendReservationConfirmation({
        email: touristeEmail,
            touristeName: touriste.fullName || "Voyageur",
            excursionTitle: excursion.title,
            excursionCity: excursion.city,
            date: reservation.date,
            time: reservation.time,
            peopleCount: reservation.people_count,
            totalPrice: reservation.total_price,
            bookingCode: reservation.booking_code,
          })
        : undefined,
    }),
    dispatchNotification({
      eventKey: `reservation-created:${reservation.id}:${prestataire.userId}`,
      recipient: prestataire,
      type: "reservation_created",
      title: `Nouvelle réservation — ${excursion.title}`,
      message: `${touriste.fullName || "Un voyageur"} a réservé cette excursion.`,
      entityType: "reservation",
      entityId: reservation.id,
      metadata,
      sendEmail: prestataireEmail
        ? () => sendReservationPrestataireNotification({
        email: prestataireEmail,
            prestataireName: prestataire.fullName || prestataire.agencyName || "Prestataire",
            touristeName: touriste.fullName || "Voyageur",
            excursionTitle: excursion.title,
            excursionCity: excursion.city,
            date: reservation.date,
            time: reservation.time,
            peopleCount: reservation.people_count,
            totalPrice: reservation.total_price,
            bookingCode: reservation.booking_code,
          })
        : undefined,
    }),
  ]);
}

export async function notifyReservationCancelled(context: ReservationContext & { refundPercentage: number; refundAmount: number; reason: string; }) {
  const { reservation, excursion, touriste, prestataire, refundPercentage, refundAmount, reason } = context;
  const touristeEmail = touriste.email ?? await resolveUserEmail(touriste.userId);
  const prestataireEmail = prestataire.email ?? await resolveUserEmail(prestataire.userId);
  const metadata = {
    reservation_id: reservation.id,
    booking_code: reservation.booking_code,
    excursion_title: excursion.title,
    excursion_city: excursion.city,
    refund_percentage: refundPercentage,
    refund_amount: refundAmount,
  };

  await Promise.allSettled([
    dispatchNotification({
      eventKey: `reservation-cancelled:${reservation.id}:${touriste.userId}`,
      recipient: touriste,
      type: "reservation_cancelled",
      title: `Annulation confirmée — ${excursion.title}`,
      message: `Votre réservation ${reservation.booking_code} a été annulée.`,
      entityType: "reservation",
      entityId: reservation.id,
      metadata,
      sendEmail: touristeEmail
        ? () => sendReservationCancellationTouriste({
        email: touristeEmail,
            touristeName: touriste.fullName || "Voyageur",
            excursionTitle: excursion.title,
            excursionCity: excursion.city,
            date: reservation.date,
            time: reservation.time,
            bookingCode: reservation.booking_code,
            refundAmount,
            refundPercentage,
            reason,
          })
        : undefined,
    }),
    dispatchNotification({
      eventKey: `reservation-cancelled-provider:${reservation.id}:${prestataire.userId}`,
      recipient: prestataire,
      type: "reservation_cancelled",
      title: `Réservation annulée — ${excursion.title}`,
      message: `${touriste.fullName || "Un voyageur"} a annulé sa réservation.`,
      entityType: "reservation",
      entityId: reservation.id,
      metadata,
      sendEmail: prestataireEmail
        ? () => sendReservationCancellationPrestataire({
        email: prestataireEmail,
            prestataireName: prestataire.fullName || prestataire.agencyName || "Prestataire",
            touristeName: touriste.fullName || "Voyageur",
            excursionTitle: excursion.title,
            excursionCity: excursion.city,
            date: reservation.date,
            time: reservation.time,
            bookingCode: reservation.booking_code,
            reason,
          })
        : undefined,
    }),
  ]);
}

export async function notifyPrestataireApplicationSubmitted({
  requester,
  agencyName,
  city,
}: {
  requester: { userId: string; fullName: string; email: string; };
  agencyName: string;
  city: string;
}) {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("user_id, full_name, agency_name")
    .eq("role", "admin");

  const recipients: NotificationRecipient[] = (admins || []).map((profile: any) => ({
    userId: profile.user_id,
    role: "admin",
    email: null,
    fullName: profile.full_name || "Administrateur",
    agencyName: profile.agency_name || null,
  }));

  await Promise.allSettled(recipients.map(async (recipient) => {
    const email = recipient.email ?? await resolveUserEmail(recipient.userId);
    if (!email) return null;

    return dispatchNotification({
      eventKey: `prestataire-request:${requester.userId}:${recipient.userId}`,
      recipient,
      type: "prestataire_application",
      title: `Nouvelle demande prestataire — ${agencyName}`,
      message: `${requester.fullName} a soumis une demande depuis ${city}.`,
      entityType: "profile",
      entityId: requester.userId,
      metadata: {
        requester_user_id: requester.userId,
        requester_name: requester.fullName,
        contact_email: requester.email,
        agency_name: agencyName,
        city,
      },
      sendEmail: () => sendPrestataireApplicationNotification({
        email,
        adminName: recipient.fullName || "Administrateur",
        prestataireName: requester.fullName,
        agencyName,
        city,
        dashboardLink: "/admin/prestataires",
      }),
    });
  }));
}

export async function notifyConversationMessage({
  recipient,
  senderName,
  conversationLabel,
  preview,
  conversationId,
  messageId,
  dashboardLink,
}: {
  recipient: NotificationRecipient;
  senderName: string;
  conversationLabel: string;
  preview: string;
  conversationId: string;
  messageId: string;
  dashboardLink: string;
}) {
  const recipientEmail = recipient.email ?? await resolveUserEmail(recipient.userId);
  await dispatchNotification({
    eventKey: `message:${messageId}:${recipient.userId}`,
    recipient,
    type: "conversation_message",
    title: `Nouveau message — ${conversationLabel}`,
    message: `${senderName} vous a envoyé un message.`,
    entityType: "conversation",
    entityId: conversationId,
    metadata: {
      conversation_id: conversationId,
      message_id: messageId,
      preview,
      sender_name: senderName,
      conversation_label: conversationLabel,
      dashboard_link: dashboardLink,
    },
    sendEmail: recipientEmail
      ? () => sendConversationMessageNotification({
          email: recipientEmail,
          recipientName: recipient.fullName || recipient.agencyName || "Utilisateur",
          senderName,
          conversationLabel,
          preview,
          dashboardLink,
        })
      : undefined,
  });
}
