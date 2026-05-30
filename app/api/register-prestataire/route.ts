import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://voyajaime.com";
const FROM    = process.env.RESEND_FROM    || "VoyaJaime <noreply@voyajaime.tn>";
const API_KEY = process.env.RESEND_API_KEY || "";

async function sendWelcomeEmail(email: string, fullName: string) {
  if (!API_KEY) {
    console.warn("[register-prestataire] RESEND_API_KEY manquante");
    return;
  }

  const link = `${APP_URL}/completer-profil`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
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
  <tr><td style="padding:36px 32px 28px;">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">
      Bienvenue, ${fullName} 👋
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.7;">
      Votre compte prestataire VoyaJaime a été créé avec succès.<br/>
      <strong>Confirmez d'abord votre email</strong> via le lien envoyé par Supabase,
      puis complétez les informations de votre agence.
    </p>
    <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Étapes suivantes</p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">✅ &nbsp;<strong>Confirmer votre email</strong> — via le lien reçu</p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">📋 &nbsp;<strong>Compléter votre profil</strong> — agence, documents</p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">⏳ &nbsp;<strong>Validation</strong> — notre équipe examine sous 24–48h</p>
      <p style="margin:0;font-size:13px;color:#374151;">🚀 &nbsp;<strong>Publication</strong> — ajoutez vos excursions</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:#2B96A8;color:white;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">
          Compléter mon profil →
        </a>
      </td></tr>
    </table>
  </td></tr>
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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    FROM,
      to:      email,
      subject: "Bienvenue sur VoyaJaime — Complétez votre profil",
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[register-prestataire] Resend error:", data);
  } else {
    console.log("[register-prestataire] ✅ Email envoyé, id:", data.id);
  }
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { userId, email, fullName, agencyName, city } = body;
  if (!userId || !email) {
    return NextResponse.json({ error: "userId et email obligatoires" }, { status: 400 });
  }

  // Envoyer l'email de bienvenue immédiatement — on a l'email dans le body
  // Pas besoin que l'user soit confirmé pour ça
  await sendWelcomeEmail(email, fullName || email);

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Mettre à jour les user_metadata pour que le callback puisse créer le profil
  // après confirmation email (même si getUserById retourne 404 maintenant)
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);

  if (!authUser?.user) {
    // User pas encore confirmé — normal avec email confirmation activée
    // Le profil sera créé dans /api/auth/callback après confirmation
    console.log("[register-prestataire] User non confirmé — profil créé au callback");
    return NextResponse.json({ success: true, deferred: true });
  }

  // User déjà confirmé (ex: confirmation désactivée) → créer le profil direct
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      role: "prestataire",
      full_name:   fullName   || "",
      agency_name: agencyName || "",
      city:        city       || "",
    },
  });

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      user_id:      userId,
      role:         "prestataire",
      full_name:    fullName   || "",
      agency_name:  agencyName || "",
      city:         city       || "",
      is_validated: false,
    }, { onConflict: "user_id" });

  if (profileError) {
    console.error("[register-prestataire] profileError:", profileError.message);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  console.log("[register-prestataire] ✅ Profil créé pour", userId);
  return NextResponse.json({ success: true });
}