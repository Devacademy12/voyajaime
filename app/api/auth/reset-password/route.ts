import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { newPassword, accessToken, refreshToken } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Session invalide ou expirée. Veuillez refaire une demande." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: "Session invalide ou expirée. Veuillez refaire une demande." },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[reset-password] updateUser error:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour le mot de passe" },
        { status: 500 }
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter.",
    });

  } catch (error) {
    console.error("[reset-password] unexpected error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}