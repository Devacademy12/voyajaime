import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile } = await serverSupabase
      .from("profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { userId, action } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (action === "validate") {
      const { error } = await admin.from("profiles").update({ is_validated: true }).eq("user_id", userId);
      if (error) throw error;
    } else if (action === "revoke") {
      const { error } = await admin.from("profiles").update({ is_validated: false }).eq("user_id", userId);
      if (error) throw error;
    } else if (action === "delete") {
      await admin.from("profiles").delete().eq("user_id", userId);
      try { await admin.auth.admin.deleteUser(userId); } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}