import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Récupérer l'utilisateur actuel (connecté via le lien magique)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Session invalide ou expirée. Veuillez refaire une demande." },
        { status: 401 }
      );
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error("Erreur mise à jour:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour le mot de passe" },
        { status: 500 }
      );
    }

    // Déconnecter l'utilisateur pour qu'il se reconnecte avec le nouveau mot de passe
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter."
    });

  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}