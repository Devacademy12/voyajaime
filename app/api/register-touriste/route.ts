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

  const { userId, email, fullName } = body;
  if (!userId || !email) {
    return NextResponse.json({ error: "userId et email obligatoires" }, { status: 400 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const MAX_ATTEMPTS = 8;
  const DELAY_MS = 1500;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    if (!authUser?.user?.id) {
      console.log(`[register-touriste] attempt ${attempt}/${MAX_ATTEMPTS} — waiting for user...`);
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: userId, role: "touriste", full_name: fullName || email },
        { onConflict: "user_id" }
      );

    if (!error) {
      console.log(`[register-touriste] ✅ Profil créé à l'attempt ${attempt} pour`, userId);
      return NextResponse.json({ success: true });
    }

    if (error.code === "23503") {
      await new Promise((r) => setTimeout(r, DELAY_MS));
      continue;
    }

    console.error("[register-touriste] profileError:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.warn("[register-touriste] Profil non cree apres", MAX_ATTEMPTS, "tentatives");
  return NextResponse.json({ success: true, deferred: true });
}
