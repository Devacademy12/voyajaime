import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("[register-prestataire] Env vars manquantes");
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { userId, fullName, agencyName, city } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId manquant" }, { status: 400 });
  }

  try {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Délai initial pour laisser Supabase propager l'user
    await new Promise(r => setTimeout(r, 1500));

    const upsertData = {
      user_id:      userId,
      role:         "prestataire",
      full_name:    fullName   || "",
      agency_name:  agencyName || "",
      city:         city       || "",
      is_validated: false,
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(upsertData, { onConflict: "user_id" })
      .select()
      .single();

    if (profileError) {
      console.error("[register-prestataire] profileError:", profileError.message, profileError.code);

      // FK violation → user pas encore propagé, retry après 3s
      if (profileError.code === "23503") {
        console.log("[register-prestataire] FK violation, retry dans 3s...");
        await new Promise(r => setTimeout(r, 3000));

        const { data: retryProfile, error: retryError } = await supabase
          .from("profiles")
          .upsert(upsertData, { onConflict: "user_id" })
          .select()
          .single();

        if (retryError) {
          console.error("[register-prestataire] retry error:", retryError.message);
          return NextResponse.json(
            { error: retryError.message, code: retryError.code },
            { status: 500 }
          );
        }

        console.log("[register-prestataire] Profil créé (retry):", retryProfile.user_id);
        return NextResponse.json({ success: true, profile: retryProfile });
      }

      return NextResponse.json(
        { error: profileError.message, code: profileError.code },
        { status: 500 }
      );
    }

    // Mettre à jour metadata (non bloquant)
    supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        role:        "prestataire",
        full_name:   fullName,
        agency_name: agencyName,
        city,
      },
    }).catch(e => console.warn("[register-prestataire] updateUserById failed:", e));

    console.log("[register-prestataire] Profil créé:", profile.user_id);
    return NextResponse.json({ success: true, profile });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[register-prestataire] Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}