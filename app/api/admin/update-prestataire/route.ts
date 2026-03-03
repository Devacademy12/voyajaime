import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const { data: adminProfile } = await serverSupabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (adminProfile?.role !== "admin") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const { userId, updates } = await req.json();
    if (!userId || !updates) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update(updates).eq("user_id", userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 500 });
  }
}