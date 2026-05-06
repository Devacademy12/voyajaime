import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("user_id", data.user.id).single();

      if (!profile) {
        await supabase.from("profiles").upsert({
          user_id: data.user.id,
          role: "touriste",
          full_name: data.user.user_metadata?.full_name || data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        }, { onConflict: "user_id" });
        // Touriste → retour à l'accueil (pas dashboard)
        return NextResponse.redirect(`${origin}/${redirect || ""}`);
      }

      const role = profile.role;

      if (role === "touriste") {
        // Touriste → accueil ou page demandée
        return NextResponse.redirect(`${origin}/${redirect || ""}`);
      } else if (role === "prestataire" || role === "admin") {
        return NextResponse.redirect(`${origin}/${role}/dashboard`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback`);
}