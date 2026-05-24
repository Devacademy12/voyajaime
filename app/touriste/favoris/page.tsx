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

  const favoris = (raw || []).map(f => ({
    id: f.id,
    excursion: Array.isArray(f.excursion) ? (f.excursion[0] ?? null) : f.excursion,
  }));

  return (
    <>
      <style>{`
        .fav-page {
          width: 100%;
          min-height: 100vh;
          background: #F8FAFC;
          box-sizing: border-box;
        }
        .fav-page-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 36px 32px 60px;
          box-sizing: border-box;
        }
        .fav-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .fav-page-title {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 700;
          color: #053366;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .fav-discover-btn {
          padding: 10px 20px;
          background: #02AFCF;
          color: white;
          border-radius: 12px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(2,175,207,0.28);
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: background .15s, box-shadow .15s;
          white-space: nowrap;
        }
        .fav-discover-btn:hover {
          background: #0891b2;
          box-shadow: 0 6px 18px rgba(2,175,207,0.38);
        }
        @media (max-width: 900px) {
          .fav-page-inner { padding: 24px 20px 48px; }
        }
        @media (max-width: 640px) {
          .fav-page-inner { padding: 16px 14px 40px; }
          .fav-page-header { margin-bottom: 20px; }
        }
      `}</style>

      <div className="fav-page">
        <div className="fav-page-inner">
          <div className="fav-page-header">
            <h1 className="fav-page-title">Mes favoris</h1>
            <Link href="/excursions" className="fav-discover-btn">
              <Compass size={15} strokeWidth={2} /> Découvrir plus
            </Link>
          </div>

          <FavorisClient favoris={favoris} userId={user!.id} />
        </div>
      </div>
    </>
  );
}