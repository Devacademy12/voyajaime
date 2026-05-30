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

  // On ne vérifie plus getUserById (l'user peut ne pas exister encore si
  // email confirmation est activée). On upsert directement dans profiles.
  // La FK sera respectée une fois que l'user confirmera son email et que
  // le callback créera la session — en attendant on stocke les metadata.
  
  // Mettre à jour les user_metadata via admin (ne nécessite pas que l'user
  // soit confirmé, juste qu'il existe dans auth.users en état "unconfirmed")
  const { data: authUser, error: adminError } = await supabase.auth.admin.getUserById(userId);

  if (adminError || !authUser?.user) {
    // L'user n'existe pas encore (email confirmation pending) →
    // on retourne success car le callback créera le profil après confirmation
    console.log("[register-prestataire] User pas encore confirmé, metadata sauvegardées via signUp options");
    return NextResponse.json({ success: true, deferred: true });
  }

  // L'user existe → mettre à jour ses metadata et créer le profil
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      role:         "prestataire",
      full_name:    fullName    || "",
      agency_name:  agencyName  || "",
      city:         city        || "",
    },
  });

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      user_id:      userId,
      role:         "prestataire",
      full_name:    fullName    || "",
      agency_name:  agencyName  || "",
      city:         city        || "",
      is_validated: false,
    }, { onConflict: "user_id" });

  if (profileError) {
    console.error("[register-prestataire] profileError:", profileError.message);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  console.log("[register-prestataire] ✅ Profil créé pour", userId);
  return NextResponse.json({ success: true });
}