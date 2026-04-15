import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secretToken = process.env.CRON_SECRET_TOKEN;
  
  if (secretToken && authHeader !== `Bearer ${secretToken}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date().toISOString();

  // Récupérer les réservations expirées
  const { data: expiredReservations, error: findError } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count, total_price, platform_fee,
      status, payment_status, payment_deadline, touriste_id,
      excursion:excursions(title, city, photos)
    `)
    .eq("status", "pending")
    .lt("payment_deadline", now);

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  let movedCount = 0;

  for (const res of expiredReservations || []) {
    // Récupérer le touriste
    const { data: touriste } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", res.touriste_id)
      .single();

    // Copier dans historique
    await supabase.from("historique_reservations").insert({
      original_reservation_id: res.id,
      booking_code: res.booking_code,
      excursion_title: res.excursion?.title,
      excursion_city: res.excursion?.city,
      excursion_photo: res.excursion?.photos?.[0],
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

    // Supprimer l'original
    await supabase.from("reservations").delete().eq("id", res.id);
    movedCount++;
  }

  return NextResponse.json({
    message: `${movedCount} réservation(s) expirée(s) déplacée(s)`,
    moved: movedCount,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}