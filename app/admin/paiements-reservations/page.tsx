import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminReservationsClient from "./AdminReservationsClient";

/* ── Client service role : bypass RLS pour l'admin ── */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/* Supabase renvoie parfois un tableau pour une FK one-to-one */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function AdminReservationsPage() {
  /* ── 1. Vérifier que l'utilisateur est bien admin (avec le client normal) ── */
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (adminProfile?.role !== "admin") redirect("/");

  /* ── 2. Toutes les requêtes admin utilisent le service role (bypass RLS) ── */
  const admin = createAdminClient();

  /* ──────────────────────────────────────────────
     RÉSERVATIONS — tous les statuts, tous les utilisateurs
  ────────────────────────────────────────────── */
  const { data: resaRaw, error: resaError } = await admin
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
    console.error("[admin] reservations error:", resaError);
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#EF4444" }}>
        Erreur réservations : {resaError.message}
      </div>
    );
  }

  /* ── Profils touristes en batch ── */
  const touristeIds = [
    ...new Set((resaRaw || []).map((r) => r.touriste_id).filter(Boolean)),
  ] as string[];

  const { data: touristesProfiles } = touristeIds.length
    ? await admin
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", touristeIds)
    : { data: [] };

  const profilesMap: Record<string, { full_name: string | null; phone: string | null }> = {};
  (touristesProfiles || []).forEach((p) => {
    profilesMap[p.user_id] = { full_name: p.full_name, phone: p.phone };
  });

  /* ── Normaliser réservations ── */
  const reservations = (resaRaw || []).map((r) => {
    const exc = one(r.excursion as any) as any;
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
            id:               exc.id,
            title:            exc.title,
            city:             exc.city,
            price_per_person: Number(exc.price_per_person),
            max_people:       exc.max_people,
            prestataire_id:   exc.prestataire_id,
          }
        : null,
    };
  });

  /* ──────────────────────────────────────────────
     PAIEMENTS
  ────────────────────────────────────────────── */
  const { data: paiementsRaw, error: payError } = await admin
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
    console.error("[admin] paiements error:", payError);
  }

  /* ── Profils pour paiements (touristes + prestataires) en batch ── */
  const payTouristeIds = [
    ...new Set(
      (paiementsRaw || [])
        .map((p) => (one(p.reservation as any) as any)?.touriste_id)
        .filter(Boolean)
    ),
  ] as string[];

  const prestatairesIds = [
    ...new Set(
      (paiementsRaw || []).map((p) => p.prestataire_id).filter(Boolean)
    ),
  ] as string[];

  const allPayIds = [...new Set([...payTouristeIds, ...prestatairesIds])];

  const { data: payProfiles } = allPayIds.length
    ? await admin
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

  /* ── Normaliser paiements ── */
  const paiements = (paiementsRaw || []).map((p) => {
    const resa     = one(p.reservation as any) as any;
    const resaExc  = resa ? (one(resa.excursion as any) as any) : null;
    const tid: string | null = resa?.touriste_id ?? null;

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
            touriste: tid
              ? (payProfilesMap[tid] ?? { full_name: null, phone: null })
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

  /* ──────────────────────────────────────────────
     EXCURSIONS — uniquement celles avec des réservations
  ────────────────────────────────────────────── */
  const excursionIds = [
    ...new Set(reservations.map((r) => r.excursion?.id).filter(Boolean)),
  ] as string[];

  const { data: excursions } = excursionIds.length
    ? await admin
        .from("excursions")
        .select("id, title, city, max_people, price_per_person, is_active")
        .in("id", excursionIds)
        .order("title")
    : { data: [] };

  /* ── Capacité : places prises par excursion (hors annulés) ── */
  const capacite: Record<string, number> = {};
  reservations.forEach((r) => {
    if (r.excursion?.id && r.status !== "cancelled") {
      capacite[r.excursion.id] = (capacite[r.excursion.id] || 0) + r.people_count;
    }
  });

  console.log(
    `[admin] réservations: ${reservations.length} | paiements: ${paiements.length} | excursions: ${excursions?.length ?? 0}`
  );

  return (
    <AdminReservationsClient
      reservations={reservations as any}
      paiements={paiements as any}
      excursions={(excursions || []) as any}
      capacite={capacite}
    />
  );
}