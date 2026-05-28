import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  try {
    // Lire le body avec gestion d'erreur — évite le crash si le body n'est pas JSON
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

    // 1. Retry loop — attendre que l'utilisateur existe dans auth.users (max 5s)
    let userEmail: string | null = email || null;
    let userExists = false;
    for (let i = 0; i < 10; i++) {
      const { data: u } = await supabase.auth.admin.getUserById(userId);
      if (u?.user?.id) {
        userExists = true;
        userEmail = userEmail || u.user.email || null;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    if (!userExists) return NextResponse.json({ error: "Utilisateur non trouvé après création" }, { status: 404 });

    // 2. Confirmer email + metadata
    await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: { role: "prestataire", full_name: fullName, agency_name: agencyName, city },
    });

    // 3. Upload avatar si fourni
    let avatarUrl: string | null = null;
    if (avatarBase64 && avatarExt) {
      try {
        const buffer = Buffer.from(avatarBase64, "base64");
        const path = `${userId}/avatar-${Date.now()}.${avatarExt}`;
        const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
        const mime = mimeMap[avatarExt] || "image/jpeg";

        const { data: uploaded, error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, buffer, { contentType: mime, upsert: true });

        if (!uploadErr && uploaded) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(uploaded.path);
          avatarUrl = publicUrl;
        }
      } catch (e) {
        console.warn("[register-prestataire] Avatar upload failed:", e);
        // Continue without avatar
      }
    }

    // 4. Upsert profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        role: "prestataire",
        full_name: fullName || "",
        agency_name: agencyName || "",
        city: city || "",
        is_validated: false,
        avatar_url: avatarUrl,
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (profileError) {
      console.error("[register-prestataire] profileError:", profileError.message);
      return NextResponse.json({ error: profileError.message, code: profileError.code }, { status: 500 });
    }

    // ✉️ Email de bienvenue (optionnel — ne bloque pas si RESEND_API_KEY absent)
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