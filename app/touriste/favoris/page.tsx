import { createServerSupabaseClient } from "@/lib/supabaseServer";
import FavorisClient from "./FavorisClient";
import Link from "next/link";
import { Compass } from "lucide-react";

export default async function TouristeFavoris() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: raw } = await supabase
    .from("favoris")
    .select("id, excursion:excursions(id,title,city,price_per_person,duration_hours,rating,reviews_count,max_people,photos,categories)")
    .eq("touriste_id", user!.id)
    .order("created_at", { ascending: false });

  /* Supabase retourne excursion comme un tableau — on prend le premier élément */
  const favoris = (raw || []).map(f => ({
    id: f.id,
    excursion: Array.isArray(f.excursion) ? (f.excursion[0] ?? null) : f.excursion,
  }));

  return (
    <div style={{ padding:"36px 48px 60px", maxWidth:1160, margin:"0 auto", width:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:36 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#053366", margin: 0 }}>Mes favoris</h1>
        </div>
        <Link href="/excursions" style={{ padding:"11px 22px", background:"#02AFCF", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(43,150,168,0.3)", display:"inline-flex", alignItems:"center", gap:8 }}>
          <Compass size={16} strokeWidth={2} /> Découvrir plus
        </Link>
      </div>
      <FavorisClient favoris={favoris} userId={user!.id} />
    </div>
  );
}