import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  try {
    let body: Record<string, string>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
    }

    const { userId, email, fullName, agencyName, city, avatarBase64, avatarExt } = body;

    if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Confirmer email + metadata — avec un retry si l'user n'est pas encore propagé
    const tryUpdate = async () =>
      supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: {
          role: "prestataire",
          full_name: fullName,
          agency_name: agencyName,
          city,
        },
      });

    let { error: updateErr } = await tryUpdate();

    // Si user pas encore visible dans Auth, on attend 2s et on réessaie
    if (updateErr?.message?.toLowerCase().includes("not found")) {
      await new Promise((r) => setTimeout(r, 2000));
      ({ error: updateErr } = await tryUpdate());
    }

    // Deuxième retry après 3s supplémentaires
    if (updateErr?.message?.toLowerCase().includes("not found")) {
      await new Promise((r) => setTimeout(r, 3000));
      ({ error: updateErr } = await tryUpdate());
    }

    if (updateErr) {
      console.error("[register-prestataire] updateUserById error:", updateErr.message);
      return NextResponse.json(
        { error: "Utilisateur non trouvé après création. Réessayez dans quelques secondes." },
        { status: 404 }
      );
    }

    // 2. Upload avatar si fourni
    let avatarUrl: string | null = null;
    if (avatarBase64 && avatarExt) {
      try {
        const buffer = Buffer.from(avatarBase64, "base64");
        const path = `${userId}/avatar-${Date.now()}.${avatarExt}`;
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        };
        const mime = mimeMap[avatarExt] || "image/jpeg";

        const { data: uploaded, error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, buffer, { contentType: mime, upsert: true });

        if (!uploadErr && uploaded) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(uploaded.path);
          avatarUrl = publicUrl;
        }
      } catch (e) {
        console.warn("[register-prestataire] Avatar upload failed:", e);
      }
    }

    // 3. Upsert profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          role: "prestataire",
          full_name: fullName || "",
          agency_name: agencyName || "",
          city: city || "",
          is_validated: false,
          avatar_url: avatarUrl,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (profileError) {
      console.error("[register-prestataire] profileError:", profileError.message);
      return NextResponse.json(
        { error: profileError.message, code: profileError.code },
        { status: 500 }
      );
    }

    // 4. Email de bienvenue (optionnel)
    const userEmail = email || null;
    if (userEmail && process.env.RESEND_API_KEY) {
      try {
        const { sendWelcomePrestataire } = await import("@/lib/emails/resend");
        await sendWelcomePrestataire({ email: userEmail, fullName: fullName || userEmail, userId });
        console.log("[register-prestataire] ✅ Email de bienvenue envoyé à", userEmail);
      } catch (emailErr) {
        console.warn("[register-prestataire] Email de bienvenue échoué (non bloquant):", emailErr);
      }
    }

    console.log("[register-prestataire] ✅ Profil créé:", profile.user_id);
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[register-prestataire] Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}