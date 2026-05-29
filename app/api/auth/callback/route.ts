import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "recovery" pour reset password
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
      console.error("[auth/callback] error:", error?.message);
      return NextResponse.redirect(`${origin}/auth?error=callback`);
    }

    // ── Reset password → rediriger vers la page de reset ──
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }

    // ── Connexion normale → récupérer le rôle et rediriger ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    if (!profile) {
      await supabase.from("profiles").upsert(
        {
          user_id:    data.user.id,
          role:       "touriste",
          full_name:  data.user.user_metadata?.full_name || data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        },
        { onConflict: "user_id" }
      );
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

    const dest = redirect && redirect !== "/auth" ? redirect : "/";
    return NextResponse.redirect(`${origin}${dest}`);

  } catch (err) {
    console.error("[auth/callback] unexpected:", err);
    return NextResponse.redirect(`${origin}/auth?error=callback`);
  }
}