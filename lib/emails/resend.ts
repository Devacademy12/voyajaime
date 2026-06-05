// ═══════════════════════════════════════════════════
//  lib/emails/resend.ts
//  Service d'envoi d'emails via Resend
//
//  Variables .env requises :
//    RESEND_API_KEY=re_xxxxxxxxxxxx
//    RESEND_FROM=VoyaJaime <noreply@voyajaime.tn>
//    NEXT_PUBLIC_APP_URL=https://voyajaime.com
// ═══════════════════════════════════════════════════

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://voyajaime.com";
const FROM    = process.env.RESEND_FROM         || "VoyaJaime <noreply@voyajaime.tn>";
const API_KEY = process.env.RESEND_API_KEY      || "";

// ─── Envoi HTTP direct (pas besoin du SDK) ─────────
// Évite les problèmes d'import dynamique en production

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmail({ to, subject, html }: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!API_KEY) {
    console.warn("[resend] RESEND_API_KEY manquante — email non envoyé");
    return { error: "RESEND_API_KEY manquante" };
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ from: FROM, to, subject, html }),
      });

      const data = await res.json();
      if (res.ok) {
        return { id: data.id };
      }

      lastError = data;
      console.error(`[resend] Erreur envoi email (tentative ${attempt})`, data);

      if (res.status < 500 && res.status !== 429) {
        break;
      }
    } catch (error) {
      lastError = error;
      console.error(`[resend] Erreur réseau envoi email (tentative ${attempt})`, error);
    }

    if (attempt < 3) {
      await sleep(attempt * 700);
    }
  }

  return { error: lastError ?? "Erreur inconnue" };
}

export async function sendTransactionalEmail(params: { to: string; subject: string; html: string; }) {
  return sendEmail(params);
}

// ─── Layout HTML commun ────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:#0F172A;padding:28px 32px;text-align:center;">
    <span style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">
      Voya<span style="color:#2B96A8;">Jaime</span>
    </span>
    <p style="color:rgba(255,255,255,0.45);font-size:11px;margin:6px 0 0;letter-spacing:1.5px;text-transform:uppercase;">
      Plateforme de tourisme en Tunisie
    </p>
  </td></tr>
  <tr><td style="padding:36px 32px 28px;">${content}</td></tr>
  <tr><td style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;">
      © ${new Date().getFullYear()} VoyaJaime · Tunisie<br/>
      Cet email est automatique, merci de ne pas y répondre.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Email 1 : Bienvenue — compléter le profil ─────

export async function sendWelcomePrestataire({
  email,
  fullName,
  userId,
}: {
  email: string;
  fullName: string;
  userId: string;
}) {
  const link = `${APP_URL}/completer-profil`;

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">
      Bienvenue, ${fullName} 👋
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.7;">
      Votre compte prestataire VoyaJaime a été créé avec succès.<br/>
      Pour finaliser votre inscription et soumettre votre dossier de validation,
      complétez les informations de votre agence.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:#2B96A8;color:white;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">
          Compléter mon profil agence →
        </a>
      </td></tr>
    </table>

    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">
        Étapes suivantes
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">
        ✅ &nbsp;<strong>Compléter votre profil</strong> — agence, adresse, patente, documents
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">
        ⏳ &nbsp;<strong>Validation</strong> — notre équipe examine votre dossier sous 24–48h
      </p>
      <p style="margin:0;font-size:13px;color:#374151;">
        🚀 &nbsp;<strong>Publication</strong> — ajoutez vos excursions et recevez des réservations
      </p>
    </div>

    <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
      Lien : <a href="${link}" style="color:#2B96A8;">${link}</a>
    </p>
  `);

  return sendEmail({
    to: email,
    subject: "Bienvenue sur VoyaJaime — Complétez votre profil",
    html,
  });
}

// ─── Email 2 : Compte validé par l'admin ──────────

export async function sendAccountAccepted({
  email,
  fullName,
  agencyName,
}: {
  email: string;
  fullName: string;
  agencyName: string;
}) {
  const link = `${APP_URL}/prestataire/dashboard`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:68px;height:68px;background:#ECFDF5;border-radius:50%;line-height:68px;font-size:32px;border:1px solid #BBF7D0;">
        ✓
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;text-align:center;">
      Compte activé !
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;text-align:center;">
      Félicitations <strong>${fullName}</strong> — l'agence <strong>${agencyName}</strong>
      a été vérifiée et approuvée sur VoyaJaime.<br/>
      Vous pouvez maintenant publier vos excursions.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:#059669;color:white;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">
          Accéder à mon espace →
        </a>
      </td></tr>
    </table>

    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:1px;">
        Votre espace est prêt
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">
        🗺️ &nbsp;<strong>Ajoutez vos excursions</strong> avec photos, tarifs et disponibilités
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">
        📅 &nbsp;<strong>Gérez vos réservations</strong> depuis votre tableau de bord
      </p>
      <p style="margin:0;font-size:13px;color:#374151;">
        💰 &nbsp;<strong>Suivez vos revenus</strong> et recevez vos paiements
      </p>
    </div>

    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;">
      <p style="margin:0;font-size:12px;color:#92400E;line-height:1.6;">
        💡 <strong>Conseil :</strong> Ajoutez au moins 3 excursions avec de belles photos
        pour attirer les premiers touristes.
      </p>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: "✅ Votre compte prestataire VoyaJaime est activé !",
    html,
  });
}

// ─── Email 3 : Confirmation de réservation + paiement ────

export async function sendReservationConfirmation({
  email,
  touristeName,
  excursionTitle,
  excursionCity,
  date,
  time,
  peopleCount,
  totalPrice,
  bookingCode,
  duration_hours,
  meeting_point,
}: {
  email: string;
  touristeName: string;
  excursionTitle: string;
  excursionCity: string;
  date: string;
  time: string;
  peopleCount: number;
  totalPrice: number;
  bookingCode: string;
  duration_hours?: number;
  meeting_point?: string;
}) {
  // Formater la date
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dashboardLink = `${APP_URL}/touriste/reservations`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:68px;height:68px;background:#ECFDF5;border-radius:50%;line-height:68px;font-size:32px;border:1px solid #BBF7D0;">
        ✓
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;text-align:center;">
      Réservation confirmée !
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;text-align:center;">
      Merci <strong>${touristeName}</strong> — votre paiement a été reçu et votre réservation est confirmée.
    </p>

    <div style="background:#F0FDF4;border:2px solid #86EFAC;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:1px;">
        📍 Votre excursion
      </p>
      <div style="margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0F172A;">
          ${excursionTitle}
        </p>
        <p style="margin:0;font-size:13px;color:#6B7280;">
          ${excursionCity}
        </p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr style="border-top:1px solid #DCFCE7;">
          <td style="padding:10px 0;font-size:13px;color:#6B7280;"><strong>📅 Date</strong></td>
          <td style="padding:10px 0;font-size:13px;color:#0F172A;text-align:right;">
            <strong>${formattedDate}</strong>
          </td>
        </tr>
        <tr style="border-top:1px solid #DCFCE7;">
          <td style="padding:10px 0;font-size:13px;color:#6B7280;"><strong>🕐 Heure départ</strong></td>
          <td style="padding:10px 0;font-size:13px;color:#0F172A;text-align:right;">
            <strong>${time}</strong>
          </td>
        </tr>
        <tr style="border-top:1px solid #DCFCE7;">
          <td style="padding:10px 0;font-size:13px;color:#6B7280;"><strong>👥 Voyageurs</strong></td>
          <td style="padding:10px 0;font-size:13px;color:#0F172A;text-align:right;">
            <strong>${peopleCount} ${peopleCount > 1 ? "personnes" : "personne"}</strong>
          </td>
        </tr>
        ${duration_hours ? `
        <tr style="border-top:1px solid #DCFCE7;">
          <td style="padding:10px 0;font-size:13px;color:#6B7280;"><strong>⏱️ Durée</strong></td>
          <td style="padding:10px 0;font-size:13px;color:#0F172A;text-align:right;">
            <strong>${duration_hours} ${duration_hours > 1 ? "heures" : "heure"}</strong>
          </td>
        </tr>
        ` : ""}
        ${meeting_point ? `
        <tr style="border-top:1px solid #DCFCE7;">
          <td style="padding:10px 0;font-size:13px;color:#6B7280;"><strong>📍 Point de rendez-vous</strong></td>
          <td style="padding:10px 0;font-size:13px;color:#0F172A;text-align:right;">
            <strong>${meeting_point}</strong>
          </td>
        </tr>
        ` : ""}
      </table>
    </div>

    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">
        💰 Détail du paiement
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;">Total payé :</td>
          <td style="padding:8px 0;font-size:16px;font-weight:800;color:#0F172A;text-align:right;">
            ${totalPrice.toLocaleString("fr-FR")} EUR
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
      <p style="margin:0 0 10px;font-size:12px;color:#92400E;">
        <strong>Code réservation :</strong> <code style="background:white;padding:3px 6px;border-radius:4px;font-family:monospace;font-weight:700;color:#0F172A;">${bookingCode}</code>
      </p>
      <p style="margin:0;font-size:12px;color:#92400E;">
        💡 Conservez ce code — vous en aurez besoin le jour de l'excursion.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${dashboardLink}" style="display:inline-block;padding:14px 36px;background:#2B96A8;color:white;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">
          Voir mes réservations →
        </a>
      </td></tr>
    </table>

    <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:14px 18px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#0369A1;">
        ℹ️ Questions ?
      </p>
      <p style="margin:0;font-size:12px;color:#075985;">
        Consultez notre <a href="${APP_URL}/contact" style="color:#0369A1;font-weight:600;">page d'aide</a>
        ou contactez-nous via votre espace personnel.
      </p>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `✅ Réservation confirmée — ${excursionTitle}`,
    html,
  });
}

export async function sendReservationPrestataireNotification({
  email,
  prestataireName,
  touristeName,
  excursionTitle,
  excursionCity,
  date,
  time,
  peopleCount,
  totalPrice,
  bookingCode,
}: {
  email: string;
  prestataireName: string;
  touristeName: string;
  excursionTitle: string;
  excursionCity: string;
  date: string;
  time: string;
  peopleCount: number;
  totalPrice: number;
  bookingCode: string;
}) {
  const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">Nouvelle réservation reçue</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.7;">
      Bonjour <strong>${prestataireName}</strong>, <strong>${touristeName}</strong> vient de réserver <strong>${excursionTitle}</strong>.
    </p>
    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#0F172A;">${excursionTitle}</p>
      <p style="margin:0 0 12px;font-size:13px;color:#6B7280;">${excursionCity}</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.8;">
        <strong>Date :</strong> ${formattedDate}<br/>
        <strong>Heure :</strong> ${time}<br/>
        <strong>Voyageurs :</strong> ${peopleCount}<br/>
        <strong>Montant :</strong> ${totalPrice.toLocaleString("fr-FR")} EUR<br/>
        <strong>Référence :</strong> ${bookingCode}
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Connectez-vous à votre espace pour préparer l’accueil du client.</p>
  `);

  return sendEmail({
    to: email,
    subject: `Nouvelle réservation — ${excursionTitle}`,
    html,
  });
}

export async function sendReservationCancellationTouriste({
  email,
  touristeName,
  excursionTitle,
  excursionCity,
  date,
  time,
  bookingCode,
  refundAmount,
  refundPercentage,
  reason,
}: {
  email: string;
  touristeName: string;
  excursionTitle: string;
  excursionCity: string;
  date: string;
  time: string;
  bookingCode: string;
  refundAmount: number;
  refundPercentage: number;
  reason: string;
}) {
  const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">Annulation confirmée</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.7;">
      Bonjour <strong>${touristeName}</strong>, votre réservation a bien été annulée.
    </p>
    <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#0F172A;">${excursionTitle}</p>
      <p style="margin:0 0 12px;font-size:13px;color:#6B7280;">${excursionCity}</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.8;">
        <strong>Date :</strong> ${formattedDate}<br/>
        <strong>Heure :</strong> ${time}<br/>
        <strong>Code :</strong> ${bookingCode}<br/>
        <strong>Remboursement :</strong> ${refundPercentage}% (${refundAmount.toLocaleString("fr-FR")} EUR)
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Motif : ${reason}</p>
  `);

  return sendEmail({
    to: email,
    subject: `Confirmation d'annulation — ${excursionTitle}`,
    html,
  });
}

export async function sendReservationCancellationPrestataire({
  email,
  prestataireName,
  touristeName,
  excursionTitle,
  excursionCity,
  date,
  time,
  bookingCode,
  reason,
}: {
  email: string;
  prestataireName: string;
  touristeName: string;
  excursionTitle: string;
  excursionCity: string;
  date: string;
  time: string;
  bookingCode: string;
  reason: string;
}) {
  const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">Réservation annulée</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.7;">
      Bonjour <strong>${prestataireName}</strong>, <strong>${touristeName}</strong> a annulé sa réservation.
    </p>
    <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#0F172A;">${excursionTitle}</p>
      <p style="margin:0 0 12px;font-size:13px;color:#6B7280;">${excursionCity}</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.8;">
        <strong>Date :</strong> ${formattedDate}<br/>
        <strong>Heure :</strong> ${time}<br/>
        <strong>Code :</strong> ${bookingCode}
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Motif : ${reason}</p>
  `);

  return sendEmail({
    to: email,
    subject: `Réservation annulée — ${excursionTitle}`,
    html,
  });
}

export async function sendPrestataireApplicationNotification({
  email,
  adminName,
  prestataireName,
  agencyName,
  city,
  dashboardLink,
}: {
  email: string;
  adminName: string;
  prestataireName: string;
  agencyName: string;
  city: string;
  dashboardLink: string;
}) {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">Nouvelle demande prestataire</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.7;">
      Bonjour <strong>${adminName}</strong>, <strong>${prestataireName}</strong> a soumis une demande d&apos;inscription.
    </p>
    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:16px;font-weight:800;color:#0F172A;">${agencyName}</p>
      <p style="margin:0;font-size:13px;color:#6B7280;">${city}</p>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Une notification a également été créée dans le tableau de bord administrateur.</p>
  `);

  return sendEmail({
    to: email,
    subject: `Nouvelle demande prestataire — ${agencyName}`,
    html,
  });
}

export async function sendConversationMessageNotification({
  email,
  recipientName,
  senderName,
  conversationLabel,
  preview,
  dashboardLink,
}: {
  email: string;
  recipientName: string;
  senderName: string;
  conversationLabel: string;
  preview: string;
  dashboardLink: string;
}) {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">Nouveau message reçu</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.7;">
      Bonjour <strong>${recipientName}</strong>, <strong>${senderName}</strong> vous a envoyé un message dans ${conversationLabel}.
    </p>
    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Aperçu</p>
      <p style="margin:0;font-size:14px;color:#0F172A;line-height:1.7;">${preview}</p>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Accédez à la conversation dans votre espace pour répondre.</p>
  `);

  return sendEmail({
    to: email,
    subject: `Nouveau message — ${senderName}`,
    html,
  });
}