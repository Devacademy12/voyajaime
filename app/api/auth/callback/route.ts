import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=callback`);
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error("[auth/callback] exchangeCodeForSession error:", error?.message);
      return NextResponse.redirect(`${origin}/auth?error=callback`);
    }

    const user = data.user;

    // Récupérer le profil existant
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Créer le profil si inexistant (première connexion Google par ex.)
    if (!profile || profileError) {
      await supabase.from("profiles").upsert(
        {
          user_id:    user.id,
          role:       "touriste",
          full_name:  user.user_metadata?.full_name || user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: "user_id" }
      );

      // Nouveau touriste → accueil ou redirect demandé
      const dest = redirect && redirect !== "/auth" ? redirect : "/";
      return NextResponse.redirect(`${origin}${dest}`);
    }

    const role = profile.role;

    if (role === "prestataire") {
      return NextResponse.redirect(`${origin}/prestataire/dashboard`);
    }

    if (role === "admin") {
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }

    // Touriste → accueil ou redirect demandé
    const dest = redirect && redirect !== "/auth" ? redirect : "/";
    return NextResponse.redirect(`${origin}${dest}`);

  } catch (err) {
    console.error("[auth/callback] unexpected error:", err);
    return NextResponse.redirect(`${origin}/auth?error=callback`);
  }
}