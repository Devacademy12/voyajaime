// ═══════════════════════════════════════════════════
//  lib/emails/resend.ts
//  Toutes les fonctions d'envoi d'email via Resend.
//  Un seul endroit à modifier si on change de provider.
//
//  Variables .env requises :
//    RESEND_API_KEY=re_xxxxxxxxxxxx
//    RESEND_FROM=VoyaJaime <noreply@voyajaime.tn>
//    NEXT_PUBLIC_APP_URL=https://voyajaime.tn
// ═══════════════════════════════════════════════════

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM || "VoyaJaime <noreply@voyajaime.tn>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Templates HTML ────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>VoyaJaime</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#0F172A;padding:28px 32px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">
            Voya<span style="color:#2B96A8;">Jaime</span>
          </span>
          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:6px 0 0;letter-spacing:1.5px;text-transform:uppercase;">
            Plateforme de tourisme en Tunisie
          </p>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:36px 32px 24px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;">
            © ${new Date().getFullYear()} VoyaJaime · Tunisie<br/>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Email 1 : Bienvenue + lien compléter le profil ─

export async function sendWelcomePrestataire({
  email,
  fullName,
  userId,
}: {
  email: string;
  fullName: string;
  userId: string;
}) {
  // Lien sécurisé avec l'userId en paramètre
  // La page /prestataire/completer-profil vérifie que l'user est connecté
  const completionLink = `${APP_URL}/prestataire/completer-profil?uid=${userId}`;

  const html = baseLayout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">
      Bienvenue, ${fullName} 👋
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.7;">
      Votre compte prestataire VoyaJaime a bien été créé.
      Pour finaliser votre inscription et accéder à votre espace, 
      complétez les détails de votre agence en cliquant sur le bouton ci-dessous.
    </p>

    <!-- Bouton CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${completionLink}"
          style="display:inline-block;padding:14px 32px;background:#2B96A8;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.2px;">
          Compléter mon profil agence →
        </a>
      </td></tr>
    </table>

    <!-- Ce qui vous attend -->
    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">
        Ce que vous pouvez faire ensuite
      </p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:6px 0;">
          <span style="display:inline-block;width:20px;height:20px;background:#ECFDF5;border-radius:50%;text-align:center;line-height:20px;font-size:11px;margin-right:10px;color:#059669;font-weight:700;">1</span>
          <span style="font-size:13px;color:#374151;">Compléter votre profil agence</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="display:inline-block;width:20px;height:20px;background:#EFF6FF;border-radius:50%;text-align:center;line-height:20px;font-size:11px;margin-right:10px;color:#1D4ED8;font-weight:700;">2</span>
          <span style="font-size:13px;color:#374151;">Attendre la validation de notre équipe (24–48h)</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="display:inline-block;width:20px;height:20px;background:#FEF3C7;border-radius:50%;text-align:center;line-height:20px;font-size:11px;margin-right:10px;color:#D97706;font-weight:700;">3</span>
          <span style="font-size:13px;color:#374151;">Publier vos excursions et recevoir des réservations</span>
        </td></tr>
      </table>
    </div>

    <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
      <a href="${completionLink}" style="color:#2B96A8;word-break:break-all;">${completionLink}</a>
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Bienvenue sur VoyaJaime — Complétez votre profil",
    html,
  });
}

// ─── Email 2 : Compte accepté par l'admin ──────────

export async function sendAccountAccepted({
  email,
  fullName,
  agencyName,
}: {
  email: string;
  fullName: string;
  agencyName: string;
}) {
  const dashboardLink = `${APP_URL}/prestataire/dashboard`;

  const html = baseLayout(`
    <!-- Icône succès -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;background:#ECFDF5;border-radius:50%;line-height:64px;font-size:30px;">
        ✓
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;text-align:center;">
      Votre compte est validé !
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;text-align:center;">
      Félicitations <strong>${fullName}</strong> — l'agence <strong>${agencyName}</strong>
      a été vérifiée et acceptée sur la plateforme VoyaJaime.
      Vous pouvez maintenant publier vos excursions.
    </p>

    <!-- Bouton CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="${dashboardLink}"
          style="display:inline-block;padding:14px 32px;background:#059669;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.2px;">
          Accéder à mon espace →
        </a>
      </td></tr>
    </table>

    <!-- Ce que vous pouvez faire -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:1px;">
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
        💡 <strong>Conseil :</strong> Commencez par compléter votre profil et ajouter au moins 
        3 excursions avec de belles photos pour attirer les touristes.
      </p>
    </div>
  `);

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "✅ Votre compte prestataire VoyaJaime est validé !",
    html,
  });
}