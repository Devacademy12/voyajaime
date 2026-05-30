import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("user_id", data.user.id).single();

      if (!profile) {
        // Utilise le service role pour créer le profil (évite les erreurs RLS)
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const userRole = data.user.user_metadata?.role || "touriste";
        await adminClient.from("profiles").upsert({
          user_id:     data.user.id,
          role:        userRole,
          full_name:   data.user.user_metadata?.full_name || data.user.email,
          avatar_url:  data.user.user_metadata?.avatar_url || null,
          agency_name: data.user.user_metadata?.agency_name || null,
          city:        data.user.user_metadata?.city || null,
        }, { onConflict: "user_id" });

        if (userRole === "prestataire") {
          return NextResponse.redirect(`${origin}/prestataire/dashboard`);
        }
        return NextResponse.redirect(`${origin}/${redirect || ""}`);
      }

      const role = profile.role;
      if (role === "touriste") {
        return NextResponse.redirect(`${origin}/${redirect || ""}`);
      } else if (role === "prestataire" || role === "admin") {
        return NextResponse.redirect(`${origin}/${role}/dashboard`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback`);
}