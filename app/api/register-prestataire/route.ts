import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomePrestataire } from "@/lib/emails/resend";
import { notifyPrestataireApplicationSubmitted } from "@/lib/notifications";

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
  await sendWelcomePrestataire({ email, fullName: fullName || email, userId });
  await notifyPrestataireApplicationSubmitted({
    requester: {
      userId,
      fullName: fullName || email,
      email,
    },
    agencyName: agencyName || "Agence prestataire",
    city: city || "",
  });

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