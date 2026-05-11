// app/prestataire/paiements-reservations/page.tsx

import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import PrestatairePaiementsReservationsClient from "./PrestatairePaiementsReservationsClient";

export const dynamic    = "force-dynamic";
export const revalidate = 0;

export default async function PrestatairePaiements() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 1. Paiements ─────────────────────────────────────────────────
  const { data: paiements = [] } = await supabase
    .from("paiements")
    .select("*")
    .eq("prestataire_id", user.id)
    .order("created_at", { ascending: false });

  const resaIds = [...new Set((paiements ?? []).map((p: any) => p.reservation_id).filter(Boolean))];

  // ── 2. Réservations liées aux paiements ───────────────────────────
  const { data: reservations = [] } = resaIds.length > 0
    ? await supabase
        .from("reservations")
        .select("id, booking_code, date, time, people_count, total_price, platform_fee, status, excursion_id, touriste_id, created_at")
        .in("id", resaIds)
    : { data: [] };

  // FIX : prendre les IDs depuis paiements ET réservations
  // car les anciens paiements peuvent avoir excursion_id/touriste_id directement
  const excursionIdsFromResa = (reservations ?? []).map((r: any) => r.excursion_id).filter(Boolean);
  const excursionIdsFromPay  = (paiements  ?? []).map((p: any) => p.excursion_id).filter(Boolean);
  const excursionIds = [...new Set([...excursionIdsFromResa, ...excursionIdsFromPay])];

  const touristeIdsFromResa = (reservations ?? []).map((r: any) => r.touriste_id).filter(Boolean);
  const touristeIdsFromPay  = (paiements   ?? []).map((p: any) => p.touriste_id).filter(Boolean);
  const touristeIds  = [...new Set([...touristeIdsFromResa, ...touristeIdsFromPay])];

  // ── 3. Excursions pour paiements ──────────────────────────────────
  const { data: excursions = [] } = excursionIds.length > 0
    ? await supabase
        .from("excursions")
        .select("id, title, city, description, duration, difficulty, max_people, price_per_person, photo_url, includes")
        .in("id", excursionIds)
    : { data: [] };

  // ── 4. Profils touristes ──────────────────────────────────────────
  const { data: touristes = [] } = touristeIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, phone")
        .in("user_id", touristeIds)
    : { data: [] };

  // ── 5. Excursions du prestataire (avec photo_url !) ───────────────
  const { data: myExcursions = [] } = await supabase
    .from("excursions")
    .select("id, title, max_people, photo_url")
    .eq("prestataire_id", user.id);

  const myExcIds = (myExcursions ?? []).map((e: any) => e.id);

  // ── 6. Toutes les réservations (onglet Réservations) ──────────────
  const { data: allReservations = [] } = myExcIds.length > 0
    ? await supabase
        .from("reservations")
        .select(`
          id, booking_code, date, time, people_count,
          total_price, platform_fee, status,
          excursion_id, touriste_id,
          excursions!inner ( id, title, city, max_people ),
          profiles!reservations_touriste_id_fkey ( full_name, email )
        `)
        .in("excursion_id", myExcIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const reservationsRows = (allReservations ?? []).map((r: any) => ({
    id:              r.id,
    booking_code:    r.booking_code,
    date:            r.date,
    time:            r.time,
    people_count:    r.people_count,
    total_price:     r.total_price,
    platform_fee:    r.platform_fee,
    status:          r.status,
    touriste_name:   r.profiles?.full_name  ?? "Client inconnu",
    touriste_email:  r.profiles?.email      ?? "",
    excursion_id:    r.excursion_id,
    excursion_title: r.excursions?.title    ?? "—",
    excursion_city:  r.excursions?.city     ?? "—",
    excursion_max:   r.excursions?.max_people ?? 0,
  }));

  // ── 7. Diagnostic : réservations groupées par excursion ───────────
  const allMyResas = myExcIds.length > 0
    ? (await supabase
        .from("reservations")
        .select("id, excursion_id, date, people_count, status")
        .in("excursion_id", myExcIds)
        .neq("status", "cancelled")).data ?? []
    : [];

  // Dates par excursion (table excursion_dates si elle existe)
  const allDatesData = myExcIds.length > 0
    ? (await supabase
        .from("excursion_dates")
        .select("excursion_id, date, max_people")
        .in("excursion_id", myExcIds)
        .order("date", { ascending: true })).data ?? []
    : [];

  const excursionStats = (myExcursions ?? []).map((exc: any) => {
    const excResas    = allMyResas.filter((r: any) => r.excursion_id === exc.id);
    const excDates    = allDatesData.filter((d: any) => d.excursion_id === exc.id);
    const maxPeople   = exc.max_people ?? 0;
    const placesRes   = excResas.reduce((s: number, r: any) => s + (r.people_count ?? 0), 0);
    const placesRest  = Math.max(0, maxPeople - placesRes);
    const taux        = maxPeople > 0 ? Math.round((placesRes / maxPeople) * 100) : 0;
    const hasDates    = excDates.length > 0;

    const dateDiagnostics = hasDates
      ? excDates.map((d: any) => {
          const slots     = d.max_people ?? maxPeople;
          const reserved  = excResas.filter((r: any) => r.date === d.date).reduce((s: number, r: any) => s + (r.people_count ?? 0), 0);
          const remaining = Math.max(0, slots - reserved);
          const rate      = slots > 0 ? Math.round((reserved / slots) * 100) : 0;
          const nb_resa   = excResas.filter((r: any) => r.date === d.date).length;
          return { date: d.date, slots, reserved, remaining, rate, nb_resa };
        })
      : [];

    return {
      excursion_id:     exc.id,
      excursion_title:  exc.title    ?? "—",
      max_people:       maxPeople,
      nb_reservations:  excResas.length,
      nb_actives:       excResas.filter((r: any) => r.status === "confirmed").length,
      places_reservees: placesRes,
      places_restantes: placesRest,
      taux_remplissage: taux,
      photo:            exc.photo_url ?? null,   // ← photo correctement passée
      date_diagnostics: dateDiagnostics,
      has_dates:        hasDates,
    };
  });

  return (
    <PrestatairePaiementsReservationsClient
      paiements={paiements ?? []}
      reservationsPay={(reservations ?? []) as any[]}
      excursionsPay={(excursions ?? []) as any[]}
      touristes={touristes ?? []}
      reservations={reservationsRows}
      excursionStats={excursionStats}
    />
  );
}