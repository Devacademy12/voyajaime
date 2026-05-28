import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ── Upsert profil directement — pas besoin que l'user soit confirmé ──
    // La FK profiles.user_id → auth.users.id existe dès le signUp,
    // même si l'email n'est pas encore confirmé.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id:      userId,
          role:         "prestataire",
          full_name:    fullName  || "",
          agency_name:  agencyName || "",
          city:         city      || "",
          email:        email,
          is_validated: false,
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      // Si FK violation → l'user n'existe vraiment pas encore, on attend 3s et on réessaie une fois
      if (profileError.code === "23503") {
        await new Promise((r) => setTimeout(r, 3000));

        const { error: retryError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id:      userId,
              role:         "prestataire",
              full_name:    fullName  || "",
              agency_name:  agencyName || "",
              city:         city      || "",
              email:        email,
              is_validated: false,
            },
            { onConflict: "user_id" }
          );

        if (retryError) {
          console.error("[register-prestataire] retry profileError:", retryError.message);
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        console.error("[register-prestataire] profileError:", profileError.message);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    }

    // ── Email de bienvenue (optionnel, non bloquant) ──
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendWelcomePrestataire } = await import("@/lib/emails/resend");
        await sendWelcomePrestataire({ email, fullName: fullName || email, userId });
      } catch (e) {
        console.warn("[register-prestataire] email échoué (non bloquant):", e);
      }
    }

    console.log("[register-prestataire] ✅ Profil créé pour", userId);
    return NextResponse.json({ success: true });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[register-prestataire] Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}