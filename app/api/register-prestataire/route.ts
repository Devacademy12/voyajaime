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

  const profileData = {
    user_id:      userId,
    role:         "prestataire",
    full_name:    fullName   || "",
    agency_name:  agencyName || "",
    city:         city       || "",
    is_validated: false,
  };

  // Retry loop : attend que auth.users contienne le userId (max 15s)
  const MAX_ATTEMPTS = 10;
  const DELAY_MS     = 1500;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Vérifier que l'user existe dans auth.users avant d'upsert
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    if (!authUser?.user?.id) {
      console.log(`[register-prestataire] attempt ${attempt}/${MAX_ATTEMPTS} — user not in auth yet, waiting...`);
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    // L'user existe → upsert profil
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (!profileError) {
      // Succès — email de bienvenue optionnel
      if (process.env.RESEND_API_KEY) {
        try {
          const { sendWelcomePrestataire } = await import("@/lib/emails/resend");
          await sendWelcomePrestataire({ email, fullName: fullName || email, userId });
        } catch (e) {
          console.warn("[register-prestataire] email échoué (non bloquant):", e);
        }
      }
      console.log(`[register-prestataire] ✅ Profil créé à l'attempt ${attempt} pour`, userId);
      return NextResponse.json({ success: true });
    }

    lastError = profileError.message;
    console.error(`[register-prestataire] attempt ${attempt} profileError:`, lastError);

    // Si ce n'est pas une FK violation, inutile de réessayer
    if (profileError.code !== "23503") {
      return NextResponse.json({ error: lastError }, { status: 500 });
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.error("[register-prestataire] ❌ Échec après", MAX_ATTEMPTS, "tentatives");
  return NextResponse.json(
    { error: lastError || "Utilisateur non disponible après création. Réessayez." },
    { status: 500 }
  );
}