import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

async function checkAdmin() {
  const s = await createServerSupabaseClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return null;
  const { data: p } = await s.from("profiles").select("role").eq("user_id", user.id).single();
  return p?.role === "admin" ? user : null;
}

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("categories").select("*").order("nom");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const body = await req.json();
  const admin = createAdminClient();
  const { action, id, ...fields } = body;

  if (action === "create") {
    const { data, error } = await admin.from("categories").insert(fields).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
  if (action === "update") {
    const { data, error } = await admin.from("categories").update(fields).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
  if (action === "delete") {
    const { error } = await admin.from("categories").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}