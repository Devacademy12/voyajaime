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

    // Client admin avec service_role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Générer le lien de reset
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`, // ✅ ICI
      },
    });

    // Sécurité : toujours répondre success
    if (error || !data?.properties?.action_link) {
      console.error("generateLink error:", error?.message);
      return NextResponse.json({ success: true });
    }

    const resetLink = data.properties.action_link;

    // ✅ Envoyer l'email via Resend
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
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <hr/>
          <p style="font-size: 12px; color: #999;">VoyajAime - Tourisme en Tunisie</p>
        </body>
        </html>
      `,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      // On retourne quand même success pour ne pas exposer si l'email existe
      return NextResponse.json({ success: true });
    }

    console.log("📧 Email envoyé via Resend, id:", sendData?.id);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}