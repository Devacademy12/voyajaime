import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import AdminReservationsClient from "./AdminReservationsClient";

/* Supabase renvoie parfois un tableau même pour une FK unique (one-to-one) */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function AdminReservationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /* ── Vérifier rôle admin ── */
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (adminProfile?.role !== "admin") redirect("/");

  /* ──────────────────────────────────────────────────────
     1. RÉSERVATIONS
     touriste_id → auth.users donc pas de jointure profiles
  ────────────────────────────────────────────────────── */
  const { data: resaRaw, error: resaError } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count, touriste_id,
      total_price, platform_fee, status, payment_status,
      payment_method, created_at, paid_at, cancelled_at,
      special_needs, cancel_reason,
      excursion:excursions (
        id, title, city, price_per_person, max_people, prestataire_id
      )
    `)
    .order("created_at", { ascending: false });

  if (resaError) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#EF4444" }}>
        Erreur chargement réservations : {resaError.message}
      </div>
    );
  }

  /* ── 2. Profils touristes (batch) ── */
  const touristeIds = [
    ...new Set((resaRaw || []).map((r) => r.touriste_id).filter(Boolean)),
  ] as string[];

  const { data: touristesProfiles } = touristeIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", touristeIds)
    : { data: [] };

  const profilesMap: Record<string, { full_name: string | null; phone: string | null }> = {};
  (touristesProfiles || []).forEach((p) => {
    profilesMap[p.user_id] = { full_name: p.full_name, phone: p.phone };
  });

  /* ── 3. Normaliser réservations ── */
  const reservations = (resaRaw || []).map((r) => {
    const exc = one(r.excursion as any);
    return {
      id:             r.id,
      booking_code:   r.booking_code,
      date:           r.date,
      time:           r.time,
      people_count:   r.people_count,
      touriste_id:    r.touriste_id,
      total_price:    Number(r.total_price),
      platform_fee:   Number(r.platform_fee),
      status:         r.status,
      payment_status: r.payment_status ?? null,
      payment_method: (r as any).payment_method ?? null,
      created_at:     r.created_at,
      paid_at:        (r as any).paid_at ?? null,
      cancelled_at:   (r as any).cancelled_at ?? null,
      special_needs:  (r as any).special_needs ?? null,
      cancel_reason:  (r as any).cancel_reason ?? null,
      touriste: r.touriste_id
        ? (profilesMap[r.touriste_id] ?? { full_name: null, phone: null })
        : null,
      excursion: exc
        ? {
            id:               (exc as any).id,
            title:            (exc as any).title,
            city:             (exc as any).city,
            price_per_person: Number((exc as any).price_per_person),
            max_people:       (exc as any).max_people,
            prestataire_id:   (exc as any).prestataire_id,
          }
        : null,
    };
  });

  /* ──────────────────────────────────────────────────────
     4. PAIEMENTS
  ────────────────────────────────────────────────────── */
  const { data: paiementsRaw, error: payError } = await supabase
    .from("paiements")
    .select(`
      id, amount, platform_fee, net_amount, status, paid_at, created_at,
      prestataire_id,
      reservation:reservations (
        id, booking_code, date, people_count, total_price, touriste_id,
        excursion:excursions ( title, city )
      )
    `)
    .order("created_at", { ascending: false });

  if (payError) {
    console.error("Erreur paiements:", payError.message);
  }

  /* ── 5. Profils pour paiements (batch touristes + prestataires) ── */
  const payTouristeIds = [
    ...new Set(
      (paiementsRaw || [])
        .map((p) => (one(p.reservation as any) as any)?.touriste_id)
        .filter(Boolean)
    ),
  ] as string[];

  const prestatairesIds = [
    ...new Set((paiementsRaw || []).map((p) => p.prestataire_id).filter(Boolean)),
  ] as string[];

  const allPayIds = [...new Set([...payTouristeIds, ...prestatairesIds])];

  const { data: payProfiles } = allPayIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name, phone, agency_name")
        .in("user_id", allPayIds)
    : { data: [] };

  const payProfilesMap: Record<
    string,
    { full_name: string | null; phone: string | null; agency_name: string | null }
  > = {};
  (payProfiles || []).forEach((p) => {
    payProfilesMap[p.user_id] = {
      full_name:   p.full_name,
      phone:       p.phone,
      agency_name: p.agency_name,
    };
  });

  /* ── 6. Normaliser paiements ── */
  const paiements = (paiementsRaw || []).map((p) => {
    const resa      = one(p.reservation as any) as any;
    const resaExc   = resa ? one(resa.excursion as any) as any : null;
    const touristeTid: string | null = resa?.touriste_id ?? null;

    return {
      id:           p.id,
      amount:       Number(p.amount),
      platform_fee: Number(p.platform_fee),
      net_amount:   Number(p.net_amount),
      status:       p.status,
      paid_at:      p.paid_at ?? null,
      created_at:   p.created_at,
      reservation: resa
        ? {
            id:           resa.id,
            booking_code: resa.booking_code,
            date:         resa.date,
            people_count: resa.people_count,
            total_price:  Number(resa.total_price),
            touriste: touristeTid
              ? (payProfilesMap[touristeTid] ?? { full_name: null, phone: null })
              : null,
            excursion: resaExc
              ? { title: resaExc.title, city: resaExc.city }
              : null,
          }
        : null,
      prestataire: p.prestataire_id
        ? (payProfilesMap[p.prestataire_id] ?? { full_name: null, agency_name: null })
        : null,
    };
  });

  /* ──────────────────────────────────────────────────────
     7. EXCURSIONS pour onglet capacité
     On prend uniquement celles qui ont des réservations
  ────────────────────────────────────────────────────── */
  const excursionIds = [
    ...new Set(reservations.map((r) => r.excursion?.id).filter(Boolean)),
  ] as string[];

  const { data: excursions } = excursionIds.length
    ? await supabase
        .from("excursions")
        .select("id, title, city, max_people, price_per_person, is_active")
        .in("id", excursionIds)
        .order("title")
    : { data: [] };

  /* ── 8. Capacité ── */
  const capacite: Record<string, number> = {};
  reservations.forEach((r) => {
    if (r.excursion?.id && r.status !== "cancelled") {
      capacite[r.excursion.id] = (capacite[r.excursion.id] || 0) + r.people_count;
    }
  });

  return (
    <AdminReservationsClient
      reservations={reservations as any}
      paiements={paiements as any}
      excursions={(excursions || []) as any}
      capacite={capacite}
    />
  );
}