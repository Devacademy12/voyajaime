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

  // ── 1. Paiements + réservation + touriste + excursion en une seule query ──
  // La table paiements n'a pas de touriste_id/excursion_id directement.
  // On passe par : paiements → reservations → profiles (touriste) + excursions
  const { data: paiementsRaw = [] } = await supabase
    .from("paiements")
    .select(`
      id, reservation_id, prestataire_id,
      amount, platform_fee, net_amount,
      status, paid_at, created_at,
      reservations!paiements_reservation_id_fkey (
        id, booking_code, date, time, people_count,
        total_price, platform_fee, status,
        excursion_id, touriste_id,
        excursions!reservations_excursion_id_fkey (
          id, title, city, description, duration,
          difficulty, max_people, price_per_person,
          photo_url, includes
        ),
        profiles!reservations_touriste_id_fkey (
          user_id, full_name, email, avatar_url, phone
        )
      )
    `)
    .eq("prestataire_id", user.id)
    .order("created_at", { ascending: false });

  // ── 2. Aplatir les données paiements pour le client ──────────────────────
  // On reconstruit les tableaux séparés qu'attend le composant client
  const paiements = (paiementsRaw ?? []).map((p: any) => ({
    id:             p.id,
    reservation_id: p.reservation_id,
    prestataire_id: p.prestataire_id,
    amount:         p.amount,
    platform_fee:   p.platform_fee,
    net_amount:     p.net_amount,
    status:         p.status,
    paid_at:        p.paid_at,
    created_at:     p.created_at,
    // On injecte excursion_id et touriste_id depuis la réservation
    // pour que resolvePayData() fonctionne côté client
    excursion_id:   (p as any).reservations?.excursion_id ?? null,
    touriste_id:    (p as any).reservations?.touriste_id  ?? null,
  }));

  // reservationsPay : utilisé par resaPayMap dans le client (keyed by id)
  const reservationsPay = (paiementsRaw ?? [])
    .map((p: any) => p.reservations)
    .filter(Boolean)
    .map((r: any) => ({
      id:           r.id,
      booking_code: r.booking_code,
      date:         r.date,
      time:         r.time,
      people_count: r.people_count,
      excursion_id: r.excursion_id,
      touriste_id:  r.touriste_id,
    }));

  // excursionsPay : utilisé par excPayMap dans le client (keyed by id)
  const excursionsPayMap = new Map<string, any>();
  for (const p of (paiementsRaw ?? [])) {
    const resa_e = (p as any).reservations as any;
    const exc  = Array.isArray(resa_e?.excursions) ? resa_e.excursions[0] : resa_e?.excursions;
    if (exc?.id && !excursionsPayMap.has(exc.id)) {
      excursionsPayMap.set(exc.id, {
        id:               exc.id,
        title:            exc.title,
        city:             exc.city,
        description:      exc.description,
        duration:         exc.duration,
        difficulty:       exc.difficulty,
        max_people:       exc.max_people,
        price_per_person: exc.price_per_person,
        photo_url:        exc.photo_url,
        includes:         exc.includes,
      });
    }
  }
  const excursionsPay = Array.from(excursionsPayMap.values());

  // touristes : utilisé par tourMap dans le client (keyed by user_id)
  const touristesMap = new Map<string, any>();
  for (const p of (paiementsRaw ?? [])) {
    const resa_t = (p as any).reservations as any;
    const t    = Array.isArray(resa_t?.profiles) ? resa_t.profiles[0] : resa_t?.profiles;
    if (t?.user_id && !touristesMap.has(t.user_id)) {
      touristesMap.set(t.user_id, {
        user_id:    t.user_id,
        full_name:  t.full_name,
        email:      t.email,
        avatar_url: t.avatar_url,
        phone:      t.phone,
      });
    }
  }
  const touristes = Array.from(touristesMap.values());

  // ── 3. Excursions du prestataire (onglet Réservations + Diagnostic) ──────
  const { data: myExcursions = [] } = await supabase
    .from("excursions")
    .select("id, title, max_people, photo_url")
    .eq("prestataire_id", user.id);

  const myExcIds = (myExcursions ?? []).map((e: any) => e.id);

  // ── 4. Toutes les réservations (onglet Réservations) ─────────────────────
  // Join direct pour récupérer nom + email + avatar du touriste
  const { data: allReservations = [] } = myExcIds.length > 0
    ? await supabase
        .from("reservations")
        .select(`
          id, booking_code, date, time, people_count,
          total_price, platform_fee, status,
          excursion_id, touriste_id,
          excursions!reservations_excursion_id_fkey ( id, title, city, max_people ),
          profiles!reservations_touriste_id_fkey ( user_id, full_name, email, avatar_url, phone )
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
    touriste_id:     r.touriste_id,
    touriste_name:   r.profiles?.full_name  ?? "Client inconnu",
    touriste_email:  r.profiles?.email      ?? "",
    touriste_avatar: r.profiles?.avatar_url ?? null,
    touriste_phone:  r.profiles?.phone      ?? null,
    excursion_id:    r.excursion_id,
    excursion_title: r.excursions?.title     ?? "—",
    excursion_city:  r.excursions?.city      ?? "—",
    excursion_max:   r.excursions?.max_people ?? 0,
  }));

  // ── 5. Diagnostic : réservations groupées par excursion ──────────────────
  const allMyResas = myExcIds.length > 0
    ? (await supabase
        .from("reservations")
        .select("id, excursion_id, date, people_count, status")
        .in("excursion_id", myExcIds)
        .neq("status", "cancelled")).data ?? []
    : [];

  const allDatesData = myExcIds.length > 0
    ? (await supabase
        .from("excursion_dates")
        .select("excursion_id, date, max_people")
        .in("excursion_id", myExcIds)
        .order("date", { ascending: true })).data ?? []
    : [];

  const excursionStats = (myExcursions ?? []).map((exc: any) => {
    const excResas  = allMyResas.filter((r: any) => r.excursion_id === exc.id);
    const excDates  = allDatesData.filter((d: any) => d.excursion_id === exc.id);
    const maxPeople = exc.max_people ?? 0;
    const placesRes = excResas.reduce((s: number, r: any) => s + (r.people_count ?? 0), 0);
    const placesRest = Math.max(0, maxPeople - placesRes);
    const taux      = maxPeople > 0 ? Math.round((placesRes / maxPeople) * 100) : 0;
    const hasDates  = excDates.length > 0;

    const dateDiagnostics = hasDates
      ? excDates.map((d: any) => {
          const slots     = d.max_people ?? maxPeople;
          const reserved  = excResas
            .filter((r: any) => r.date === d.date)
            .reduce((s: number, r: any) => s + (r.people_count ?? 0), 0);
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
      photo:            exc.photo_url ?? null,
      date_diagnostics: dateDiagnostics,
      has_dates:        hasDates,
    };
  });

  return (
    <PrestatairePaiementsReservationsClient
      paiements={paiements}
      reservationsPay={reservationsPay}
      excursionsPay={excursionsPay}
      touristes={touristes}
      reservations={reservationsRows}
      excursionStats={excursionStats}
    />
  );
}