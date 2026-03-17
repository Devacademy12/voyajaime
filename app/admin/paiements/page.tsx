import { createAdminClient } from "@/lib/supabaseAdmin";
import AdminPaiementsClient from "./AdminPaiementsClient";

export default async function AdminPaiements() {
  const supabase = createAdminClient();

  // Récupérer les paiements avec prestataire + réservation + excursion
  const { data: paiements } = await supabase
    .from("paiements")
    .select("id, amount, platform_fee, net_amount, status, created_at, prestataire_id, reservation_id")
    .order("created_at", { ascending: false });

  const data = paiements || [];

  // Prestataires
  const prestIds = [...new Set(data.map(p => p.prestataire_id).filter(Boolean))];
  const { data: prestataires } = prestIds.length
    ? await supabase.from("profiles").select("user_id, full_name, agency_name, avatar_url").in("user_id", prestIds)
    : { data: [] };

  // Réservations
  const resaIds = [...new Set(data.map(p => p.reservation_id).filter(Boolean))];
  const { data: reservations } = resaIds.length
    ? await supabase.from("reservations").select("id, booking_code, date, people_count, total_price, status, excursion_id, touriste_id").in("id", resaIds)
    : { data: [] };

  // Excursions
  const excIds = [...new Set((reservations || []).map((r: Record<string, unknown>) => r.excursion_id as string).filter(Boolean))];
  const { data: excursions } = excIds.length
    ? await supabase.from("excursions").select("id, title, city").in("id", excIds)
    : { data: [] };

  // Touristes
  const touristeIds = [...new Set((reservations || []).map((r: Record<string, unknown>) => r.touriste_id as string).filter(Boolean))];
  const { data: touristes } = touristeIds.length
    ? await supabase.from("profiles").select("user_id, full_name").in("user_id", touristeIds)
    : { data: [] };

  return (
    <AdminPaiementsClient
      paiements={data}
      prestataires={prestataires || []}
      reservations={(reservations || []) as Record<string, unknown>[]}
      excursions={(excursions || []) as { id: string; title: string; city: string }[]}
      touristes={touristes || []}
    />
  );
}