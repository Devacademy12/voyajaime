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

  // ── 1. Paiements ─────────────────────────────────────────────────────────
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
          id, title, city, description, duration_hours,
          difficulty, max_people, price_per_person,
          photos, inclusions
        )
      )
    `)
    .eq("prestataire_id", user.id)
    .order("created_at", { ascending: false });

  // ── 2. Collecter TOUS les touriste_ids (paiements + réservations) ─────────
  const payTouristeIds = (paiementsRaw ?? [])
    .map((p: any) => {
      const reservation = Array.isArray(p.reservations) ? p.reservations[0] : p.reservations;
      return reservation?.touriste_id;
    })
    .filter(Boolean) as string[];

  // ── 3. Excursions du prestataire ──────────────────────────────────────────
  const { data: myExcursions = [] } = await supabase
    .from("excursions")
    .select("id, title, max_people, photos")
    .eq("prestataire_id", user.id);

  const myExcIds = (myExcursions ?? []).map((e: any) => e.id);

  // ── 4. Toutes les réservations ────────────────────────────────────────────
  const { data: allReservations = [] } = myExcIds.length > 0
    ? await supabase
        .from("reservations")
        .select(`
          id, booking_code, date, time, people_count,
          total_price, platform_fee, status,
          excursion_id, touriste_id,
          excursions!reservations_excursion_id_fkey ( id, title, city, max_people )
        `)
        .in("excursion_id", myExcIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const resTouristeIds = (allReservations ?? [])
    .map((r: any) => r.touriste_id)
    .filter(Boolean) as string[];

  // ── 5. Fetch TOUS les profils en une seule requête ────────────────────────
  const allTouristeIds = [...new Set([...payTouristeIds, ...resTouristeIds])];

  const { data: profilesRaw = [] } = allTouristeIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, phone")
        .in("user_id", allTouristeIds)
    : { data: [] };

  // Map global user_id → profile
  const profilesMap = Object.fromEntries(
    (profilesRaw ?? []).map((p: any) => [p.user_id, p])
  );

  // ── 6. Aplatir paiements — profil touriste embarqué directement ───────────
  const paiements = (paiementsRaw ?? []).map((p: any) => {
    const reservation = Array.isArray(p.reservations) ? p.reservations[0] : p.reservations;
    const touristeId  = reservation?.touriste_id ?? null;
    // ✅ Profil résolu ici côté serveur, pas côté client
    const profile     = touristeId ? (profilesMap[touristeId] ?? null) : null;

    return {
      id:              p.id,
      reservation_id:  p.reservation_id,
      prestataire_id:  p.prestataire_id,
      amount:          p.amount,
      platform_fee:    p.platform_fee,
      net_amount:      p.net_amount,
      status:          p.status,
      paid_at:         p.paid_at,
      created_at:      p.created_at,
      excursion_id:    reservation?.excursion_id ?? null,
      touriste_id:     touristeId,
      // ✅ Données touriste directement dans le paiement
      touriste_name:   profile?.full_name  ?? null,
      touriste_email:  profile?.email      ?? null,
      touriste_avatar: profile?.avatar_url ?? null,
      touriste_phone:  profile?.phone      ?? null,
    };
  });

  const reservationsPay = (paiementsRaw ?? [])
    .map((p: any) => {
      const reservation = Array.isArray(p.reservations) ? p.reservations[0] : p.reservations;
      return reservation;
    })
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

  // Map excursions pour les paiements
  const excursionsPayMap = new Map<string, any>();
  for (const p of (paiementsRaw ?? [])) {
    const reservation = Array.isArray(p.reservations) ? p.reservations[0] : p.reservations;
    const exc = Array.isArray(reservation?.excursions)
      ? reservation.excursions[0]
      : reservation?.excursions;
    if (exc?.id && !excursionsPayMap.has(exc.id)) {
      excursionsPayMap.set(exc.id, {
        id:               exc.id,
        title:            exc.title,
        city:             exc.city,
        description:      exc.description,
        duration:         exc.duration_hours,
        difficulty:       exc.difficulty,
        max_people:       exc.max_people,
        price_per_person: exc.price_per_person,
        photo_url: Array.isArray(exc.photos) && exc.photos.length > 0
          ? exc.photos[0]
          : null,
        includes: exc.inclusions,
      });
    }
  }
  const excursionsPay = Array.from(excursionsPayMap.values());

  // ✅ Liste touristes (pour tourMap dans le client, garde-fou de secours)
  const touristes = allTouristeIds
    .map(id => profilesMap[id])
    .filter(Boolean)
    .map((t: any) => ({
      user_id:    t.user_id,
      full_name:  t.full_name,
      email:      t.email,
      avatar_url: t.avatar_url,
      phone:      t.phone,
    }));

  // ── 7. Lignes réservations avec profil touriste ───────────────────────────
  const reservationsRows = (allReservations ?? []).map((r: any) => {
    const profile = profilesMap[r.touriste_id] ?? null;
    const exc = Array.isArray(r.excursions) ? r.excursions[0] : r.excursions;
    return {
      id:              r.id,
      booking_code:    r.booking_code,
      date:            r.date,
      time:            r.time,
      people_count:    r.people_count,
      total_price:     r.total_price,
      platform_fee:    r.platform_fee,
      status:          r.status,
      touriste_id:     r.touriste_id,
      touriste_name:   profile?.full_name  ?? "Client inconnu",
      touriste_email:  profile?.email      ?? "",
      touriste_avatar: profile?.avatar_url ?? null,
      touriste_phone:  profile?.phone      ?? null,
      excursion_id:    r.excursion_id,
      excursion_title: exc?.title          ?? "—",
      excursion_city:  exc?.city           ?? "—",
      excursion_max:   exc?.max_people     ?? 0,
    };
  });

  // ── 8. Diagnostic ─────────────────────────────────────────────────────────
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
    const excResas   = allMyResas.filter((r: any) => r.excursion_id === exc.id);
    const excDates   = allDatesData.filter((d: any) => d.excursion_id === exc.id);
    const maxPeople  = exc.max_people ?? 0;
    const placesRes  = excResas.reduce((s: number, r: any) => s + (r.people_count ?? 0), 0);
    const placesRest = Math.max(0, maxPeople - placesRes);
    const taux       = maxPeople > 0 ? Math.round((placesRes / maxPeople) * 100) : 0;
    const hasDates   = excDates.length > 0;
    const photoUrl   = Array.isArray(exc.photos) && exc.photos.length > 0
      ? exc.photos[0]
      : null;

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
      excursion_title:  exc.title ?? "—",
      max_people:       maxPeople,
      nb_reservations:  excResas.length,
      nb_actives:       excResas.filter((r: any) => r.status === "confirmed").length,
      places_reservees: placesRes,
      places_restantes: placesRest,
      taux_remplissage: taux,
      photo:            photoUrl,
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