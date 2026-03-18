import { createServerSupabaseClient } from "@/lib/supabaseServer";
import PrestatairePaiementsClient from "./PrestatairePaiementsClient";

export default async function PrestatairePaiements() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: paiements } = await supabase
    .from("paiements")
    .select("id, amount, net_amount, platform_fee, status, created_at, reservation_id")
    .eq("prestataire_id", user.id)
    .order("created_at", { ascending: false });

  const data = paiements || [];

  // Réservations liées
  const resaIds = [...new Set(data.map(p => p.reservation_id).filter(Boolean))];
  const { data: reservations } = resaIds.length
    ? await supabase
        .from("reservations")
        .select("id, booking_code, date, people_count, total_price, excursion_id, touriste_id")
        .in("id", resaIds)
    : { data: [] };

  // Excursions
  const excIds = [...new Set((reservations || []).map(r => r.excursion_id).filter(Boolean))];
  const { data: excursions } = excIds.length
    ? await supabase.from("excursions").select("id, title, city").in("id", excIds)
    : { data: [] };

  // Noms touristes
  const touristeIds = [...new Set((reservations || []).map(r => r.touriste_id).filter(Boolean))];
  const { data: touristes } = touristeIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", touristeIds)
    : { data: [] };

  return (
    <PrestatairePaiementsClient
      paiements={data}
      reservations={(reservations || []) as Record<string, unknown>[]}
      excursions={(excursions || []) as { id: string; title: string; city: string }[]}
      touristes={(touristes || []) as { user_id: string; full_name: string | null }[]}
    />
  );
}