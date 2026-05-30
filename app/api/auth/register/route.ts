import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeText } from "@/app/lib/sanitize";

// ✅ PLUS de createClient au niveau module

export async function POST(req: Request) {
  try {
    // ✅ Initialisé DANS le handler → les env vars sont garanties disponibles
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log("[register] ENV check:", {
      url:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      svcKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    const body = await req.json();
    const { email, password, fullName, role, agencyName, city } = body;

    console.log("[register] body:", { email, role, hasPassword: !!password });

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const cleanEmail      = sanitizeText(email);
    const cleanFullName   = fullName   ? sanitizeText(fullName)   : cleanEmail;
    const cleanAgencyName = agencyName ? sanitizeText(agencyName) : null;
    const cleanCity       = city       ? sanitizeText(city)       : null;

    // ── Créer l'utilisateur via Admin API (pas de rate limit) ──
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
      console.error("[register] createUser error:", error.message);
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
    console.log("[register] user created:", userId);

    // ── Créer le profil ──
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        user_id:   userId,
        role:      role || "touriste",
        full_name: cleanFullName,
        ...(cleanAgencyName && { agency_name: cleanAgencyName }),
        ...(cleanCity       && { city: cleanCity }),
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      console.error("[register] profile error:", profileError.message);
      // Non-bloquant : l'user Auth est créé, le profil peut être recréé
    }

    // ── Envoyer l'email de confirmation ──
    // generateLink génère le lien ET déclenche l'envoi de l'email de confirmation
    const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: cleanEmail,
      password,
      options: {
        redirectTo: "https://voyajaime.com/api/auth/callback",
      },
    });

    if (linkError) {
      console.error("[register] generateLink error:", linkError.message);
      // Non-bloquant : l'user peut redemander la confirmation depuis le login
    }

    // ── Prestataire → enregistrement agence ──
    if (role === "prestataire" && cleanAgencyName) {
      try {
        const res = await fetch("https://voyajaime.com/api/register-prestataire", {
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
        if (!res.ok) {
          console.error("[register] register-prestataire error:", res.status);
        }
      } catch (e) {
        console.error("[register] register-prestataire fetch error:", e);
        // Non-bloquant
      }
    }

    return NextResponse.json({ success: true, userId });

  } catch (err) {
    console.error("[register] unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}