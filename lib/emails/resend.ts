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

async function sendEmail({ to, subject, html }: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!API_KEY) {
    console.warn("[resend] RESEND_API_KEY manquante — email non envoyé");
    return { error: "RESEND_API_KEY manquante" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[resend] Erreur envoi email:", data);
    return { error: data };
  }

  return { id: data.id };
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