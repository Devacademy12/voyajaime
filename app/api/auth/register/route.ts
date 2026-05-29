import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeText } from "@/app/lib/sanitize";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, agencyName, city } = body;

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const cleanEmail      = sanitizeText(email);
    const cleanFullName   = sanitizeText(fullName) || cleanEmail;
    const cleanAgencyName = agencyName ? sanitizeText(agencyName) : null;
    const cleanCity       = city       ? sanitizeText(city)       : null;

    // Créer via Admin API → pas de rate limit Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: false,
      user_metadata: {
        role:      role || "touriste",
        full_name: cleanFullName,
        ...(cleanAgencyName && { agency_name: cleanAgencyName }),
        ...(cleanCity       && { city: cleanCity }),
      },
    });

    if (error) {
      if (
        error.message.includes("already been registered") ||
        error.message.includes("already registered")
      ) {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user.id;

    // Créer le profil
    await supabaseAdmin.from("profiles").upsert(
      {
        user_id:   userId,
        role:      role || "touriste",
        full_name: cleanFullName,
        ...(cleanAgencyName && { agency_name: cleanAgencyName }),
        ...(cleanCity       && { city: cleanCity }),
      },
      { onConflict: "user_id" }
    );

    // Envoyer l'email de confirmation via resend (Admin API)
    // Supabase enverra l'email avec le lien de confirmation
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      cleanEmail,
      { redirectTo: "https://voyajaime.com/api/auth/callback" }
    );
    // inviteUserByEmail échoue si l'user existe déjà → on ignore l'erreur ici
    // car l'user vient d'être créé et peut déjà avoir un invite pending
    if (inviteErr) {
      console.warn("[register] invite warning:", inviteErr.message);
    }

    // Si prestataire → enregistrement agence
    if (role === "prestataire" && cleanAgencyName) {
      await fetch("https://voyajaime.com/api/register-prestataire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email:      cleanEmail,
          fullName:   cleanFullName,
          agencyName: cleanAgencyName,
          city:       cleanCity,
        }),
      });
    }

    return NextResponse.json({ success: true, userId });

  } catch (err) {
    console.error("[register] unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}