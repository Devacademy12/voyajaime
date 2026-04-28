import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Vérification d'un token secret pour sécuriser l'endpoint
  const authHeader = request.headers.get("authorization");
  const secretToken = process.env.CRON_SECRET_TOKEN;
  
  if (secretToken && authHeader !== `Bearer ${secretToken}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date().toISOString();

  console.log(`[Clean Expired] Exécution à ${now}`);

  // 1. Récupérer les réservations expirées (pending + deadline dépassée)
  const { data: expiredReservations, error: findError } = await supabase
    .from("reservations")
    .select(`
      id, 
      booking_code, 
      date, 
      time, 
      people_count, 
      total_price, 
      platform_fee,
      status, 
      payment_status, 
      payment_deadline, 
      touriste_id, 
      excursion_id,
      excursion:excursions(title, city, photos)
    `)
    .eq("status", "pending")
    .lt("payment_deadline", now);

  if (findError) {
    console.error("[Clean Expired] Erreur recherche:", findError);
    return NextResponse.json(
      { error: findError.message },
      { status: 500 }
    );
  }

  if (!expiredReservations || expiredReservations.length === 0) {
    console.log("[Clean Expired] Aucune réservation expirée trouvée");
    return NextResponse.json({ 
      message: "Aucune réservation expirée",
      moved: 0 
    });
  }

  console.log(`[Clean Expired] ${expiredReservations.length} réservation(s) expirée(s) trouvée(s)`);

  let movedCount = 0;
  const errors: string[] = [];

  for (const res of expiredReservations) {
    try {
      // ✅ Extraction correcte avec typage explicite
      const rawExcursion = res.excursion;
      
      // Déclarer le type pour excursionData
      let excursionData: { title: string; city: string; photos: string[] } | null = null;
      
      if (rawExcursion) {
        if (Array.isArray(rawExcursion) && rawExcursion.length > 0) {
          excursionData = rawExcursion[0];
        } else if (!Array.isArray(rawExcursion)) {
          excursionData = rawExcursion;
        }
      }

      // 2. Récupérer les infos du touriste
      const { data: touriste, error: userError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", res.touriste_id)
        .single();

      if (userError) {
        console.error(`[Clean Expired] Erreur récupération user pour ${res.booking_code}:`, userError);
        errors.push(`User not found for ${res.booking_code}`);
        continue;
      }

      // 3. Copier dans l'historique
      const { error: insertError } = await supabase
        .from("historique_reservations")
        .insert({
          original_reservation_id: res.id,
          booking_code: res.booking_code,
          excursion_title: excursionData?.title || null,
          excursion_city: excursionData?.city || null,
          excursion_photo: excursionData?.photos?.[0] || null,
          date: res.date,
          time: res.time,
          people_count: res.people_count,
          total_price: res.total_price,
          platform_fee: res.platform_fee,
          payment_status: "expired",
          status: "expired",
          cancellation_reason: "Délai de paiement dépassé (1h)",
          cancelled_at: now,
          touriste_email: touriste?.email,
          touriste_nom: touriste?.full_name,
        });

      if (insertError) {
        console.error(`[Clean Expired] Erreur insertion historique pour ${res.booking_code}:`, insertError);
        errors.push(`Insert failed for ${res.booking_code}`);
        continue;
      }

      // 4. Supprimer la réservation originale
      const { error: deleteError } = await supabase
        .from("reservations")
        .delete()
        .eq("id", res.id);

      if (deleteError) {
        console.error(`[Clean Expired] Erreur suppression pour ${res.booking_code}:`, deleteError);
        errors.push(`Delete failed for ${res.booking_code}`);
        continue;
      }

      movedCount++;
      console.log(`[Clean Expired] ✅ Réservation ${res.booking_code} déplacée vers historique (expirée)`);

    } catch (err) {
      console.error(`[Clean Expired] Erreur inattendue pour ${res.booking_code}:`, err);
      errors.push(`Unexpected error for ${res.booking_code}`);
    }
  }

  return NextResponse.json({
    message: `${movedCount} réservation(s) expirée(s) déplacée(s) vers l'historique`,
    moved: movedCount,
    total_expired: expiredReservations.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// Pour supporter les appels POST également (optionnel)
export async function POST(request: NextRequest) {
  return GET(request);
}