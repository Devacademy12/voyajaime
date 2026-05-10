// ═══════════════════════════════════════════════════
//  app/api/admin/validate-prestataire/route.ts
//  Modifié : envoi de l'email d'acceptation via Resend
//  quand l'admin valide un prestataire.
// ═══════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { sendAccountAccepted } from "@/lib/emails/resend";

export async function POST(req: Request) {
  try {
    // ── 1. Vérification admin ──────────────────────
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: adminProfile } = await serverSupabase
      .from("profiles").select("role").eq("user_id", user.id).single();
    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { userId, action } = await req.json();
    if (!userId || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // ── 2. Client admin (bypass RLS) ───────────────
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 3. Action ──────────────────────────────────

    if (action === "validate") {
      const { error } = await admin
        .from("profiles")
        .update({ is_validated: true })
        .eq("user_id", userId);
      if (error) throw error;

      // ✉️ Récupérer les infos du prestataire pour l'email
      try {
        const [authUser, profileData] = await Promise.all([
          admin.auth.admin.getUserById(userId),
          admin.from("profiles").select("full_name, agency_name").eq("user_id", userId).single(),
        ]);

        const email = authUser.data.user?.email;
        const fullName   = profileData.data?.full_name   || "Prestataire";
        const agencyName = profileData.data?.agency_name || "votre agence";

        if (email) {
          await sendAccountAccepted({ email, fullName, agencyName });
          console.log("[validate-prestataire] ✅ Email d'acceptation envoyé à", email);
        }
      } catch (emailErr) {
        // Silencieux — la validation est faite, seul l'email a échoué
        console.warn("[validate-prestataire] Email d'acceptation échoué:", emailErr);
      }

    } else if (action === "revoke") {
      const { error } = await admin
        .from("profiles")
        .update({ is_validated: false })
        .eq("user_id", userId);
      if (error) throw error;

    } else if (action === "delete") {
      await admin.from("profiles").delete().eq("user_id", userId);
      try { await admin.auth.admin.deleteUser(userId); } catch {}
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    console.error("[validate-prestataire]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}