import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    // ── Validation des entrées ────────────────────────────────────────
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId manquant ou invalide" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email manquant ou invalide" },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // ── Mise à jour dans Supabase auth.users via l'API Admin ─────────
    // supabaseAdmin doit être créé avec la SERVICE_ROLE_KEY
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: emailTrimmed }
    );

    if (error) {
      console.error("Erreur Supabase auth.admin.updateUserById:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email:   data.user.email,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur serveur inconnue";
    console.error("update-prestataire-email error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}