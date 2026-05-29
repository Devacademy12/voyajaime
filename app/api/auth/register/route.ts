import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeText } from "@/app/lib/sanitize";

// Service role = bypass rate limits + accès admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ jamais exposé côté client
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, agencyName, city } = body;

    // Validation minimale côté serveur
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    // Créer l'utilisateur via l'Admin API (pas de rate limit email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizeText(email),
      password,
      email_confirm: false, // envoie quand même l'email de confirmation, mais sans rate limit
      user_metadata: {
        role,
        full_name: sanitizeText(fullName),
        ...(agencyName && { agency_name: sanitizeText(agencyName) }),
        ...(city       && { city: sanitizeText(city) }),
      },
    });

    if (error) {
      // "User already registered" → message clair
      if (error.message.includes("already been registered") || error.message.includes("already registered")) {
        return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user.id;

    // Créer le profil
    await supabaseAdmin.from("profiles").upsert(
      {
        user_id:   userId,
        role:      role || "touriste",
        full_name: sanitizeText(fullName) || sanitizeText(email),
        ...(agencyName && { agency_name: sanitizeText(agencyName) }),
        ...(city       && { city: sanitizeText(city) }),
      },
      { onConflict: "user_id" }
    );

    // Si prestataire, envoyer aussi à register-prestataire
    if (role === "prestataire") {
      await fetch("https://voyajaime.com/api/register-prestataire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email:      sanitizeText(email),
          fullName:   sanitizeText(fullName),
          agencyName: sanitizeText(agencyName),
          city:       sanitizeText(city),
        }),
      });
    }

    return NextResponse.json({ success: true, userId });

  } catch (err) {
    console.error("[register] unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}