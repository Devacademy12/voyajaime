import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ✅ Solution 1: Utiliser le vrai endpoint de reset password sans fragment
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://voyajaime.com/auth/reset-password";
    
    // Dans forgot-password/route.ts
const { data, error } = await supabaseAdmin.auth.admin.generateLink({
  type: "recovery",
  email,
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`, // ← Important
  },

    });

    if (error || !data?.properties?.action_link) {
      console.error("generateLink error:", error?.message);
      return NextResponse.json({ success: true });
    }

    // 🔧 CORRECTION: Nettoyer et normaliser le lien
    let resetLink = data.properties.action_link;
    
    // Transformer https://voyajaime.com/auth/reset-password#access_token=xxx
    // en https://voyajaime.com/auth/reset-password?token=xxx
    if (resetLink.includes('#')) {
      const hashParams = resetLink.split('#')[1];
      const urlWithoutHash = resetLink.split('#')[0];
      resetLink = `${urlWithoutHash}?${hashParams}`;
    }

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: "VoyajAime <no-reply@voyajaime.com>",
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Arial, sans-serif;">
          <h2>Réinitialisation de votre mot de passe 🔐</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous :</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #2B96A8; color: white; text-decoration: none; border-radius: 5px;">
            Réinitialiser mon mot de passe
          </a>
          <p>Ce lien expire dans <strong>1 heure</strong>.</p>
          <p><strong>📌 Astuce :</strong> Copiez-collez le lien dans votre navigateur si le clic ne fonctionne pas.</p>
          <p style="font-size: 12px; color: #666;">Lien complet pour copier/coller :<br/>${resetLink}</p>
          <hr/>
          <p style="font-size: 12px; color: #999;">VoyajAime - Tourisme en Tunisie</p>
        </body>
        </html>
      `,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return NextResponse.json({ success: true });
    }

    console.log("📧 Email envoyé, resetLink:", resetLink);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}