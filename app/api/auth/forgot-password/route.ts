import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

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
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      },
    });

    // Sécurité : toujours répondre success (ne pas révéler si email existe)
    if (error || !data?.properties?.action_link) {
      console.error("generateLink error:", error?.message);
      return NextResponse.json({ success: true });
    }

    const resetLink = data.properties.action_link;

    // Envoyer l'email via Resend
    // Sans domaine vérifié → utilise onboarding@resend.dev (mode test)
    await resend.emails.send({
      from: "VoyajAime <onboarding@resend.dev>",
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background:#F9FAFB;font-family:'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#053366,#02AFCF);padding:32px 40px;text-align:center;">
                      <span style="font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px;">🗺️ VoyajAime</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 12px;">
                        Réinitialisation du mot de passe 🔐
                      </h1>
                      <p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 28px;">
                        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
                      </p>
                      <div style="text-align:center;margin:0 0 28px;">
                        <a href="${resetLink}"
                          style="display:inline-block;background:linear-gradient(135deg,#053366,#02AFCF);color:white;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:15px;font-weight:700;">
                          Réinitialiser mon mot de passe →
                        </a>
                      </div>
                      <p style="font-size:13px;color:#9CA3AF;line-height:1.6;margin:0 0 16px;">
                        Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
                      </p>
                      <div style="background:#F9FAFB;border-radius:10px;padding:12px 16px;font-size:12px;color:#9CA3AF;word-break:break-all;">
                        Lien : <span style="color:#02AFCF;">${resetLink}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #F3F4F6;text-align:center;">
                      <p style="font-size:12px;color:#D1D5DB;margin:0;">© 2025 VoyajAime — Tourisme en Tunisie</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}