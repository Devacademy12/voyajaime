import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import PrestaReservationsClient from "./PrestaReservationsClient";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function PrestaReservationsPage() {
  /* ── 1. Auth — vérifier que c'est bien un prestataire ── */
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, agency_name, phone")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "prestataire") redirect("/");

  /* ── 2. Service role pour bypass RLS ── */
  const admin = createAdminClient();

  /* ──────────────────────────────────────────────
     EXCURSIONS du prestataire
  ────────────────────────────────────────────── */
  const { data: excursionsRaw } = await admin
    .from("excursions")
    .select("id, title, city, max_people, price_per_person, is_active")
    .eq("prestataire_id", user.id)
    .order("title");

  const excursions = excursionsRaw || [];
  const excursionIds = excursions.map((e) => e.id);

  /* ──────────────────────────────────────────────
     RÉSERVATIONS — uniquement pour ses excursions
  ────────────────────────────────────────────── */
  const { data: resaRaw, error: resaError } = excursionIds.length
    ? await admin
        .from("reservations")
        .select(`
          id, booking_code, date, time, people_count, touriste_id,
          total_price, platform_fee, status, payment_status,
          payment_method, created_at, paid_at, cancelled_at,
          special_needs, cancel_reason,
          excursion:excursions (
            id, title, city, price_per_person, max_people
          )
        `)
        .in("excursion_id", excursionIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (resaError) {
    console.error("[presta] reservations error:", resaError);
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#EF4444" }}>
        Erreur réservations : {resaError.message}
      </div>
    );
  }

  /* ── Profils touristes ── */
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
      time:           r.time ? String(r.time).slice(0, 5) : "—",
      people_count:   r.people_count,
      touriste_id:    r.touriste_id,
      total_price:    Number(r.total_price),
      platform_fee:   Number(r.platform_fee),
      net_amount:     Number(r.total_price) - Number(r.platform_fee),
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
          }
        : null,
    };
  });

  /* ──────────────────────────────────────────────
     PAIEMENTS — uniquement ceux du prestataire
  ────────────────────────────────────────────── */
  const { data: paiementsRaw } = await admin
    .from("paiements")
    .select(`
      id, amount, platform_fee, net_amount, status, paid_at, created_at,
      reservation:reservations (
        id, booking_code, date, time, people_count, total_price, touriste_id,
        excursion:excursions ( id, title, city )
      )
    `)
    .eq("prestataire_id", user.id)
    .order("created_at", { ascending: false });

  /* ── Profils touristes pour paiements ── */
  const payTouristeIds = [
    ...new Set(
      (paiementsRaw || [])
        .map((p) => (one(p.reservation as any) as any)?.touriste_id)
        .filter(Boolean)
    ),
  ] as string[];

  const { data: payProfiles } = payTouristeIds.length
    ? await admin
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", payTouristeIds)
    : { data: [] };

  const payProfilesMap: Record<string, { full_name: string | null; phone: string | null }> = {};
  (payProfiles || []).forEach((p) => {
    payProfilesMap[p.user_id] = { full_name: p.full_name, phone: p.phone };
  });

  /* ── Normaliser paiements ── */
  const paiements = (paiementsRaw || []).map((p) => {
    const resa    = one(p.reservation as any) as any;
    const resaExc = resa ? (one(resa.excursion as any) as any) : null;
    const tid: string | null = resa?.touriste_id ?? null;
    const amount  = Number(p.amount);
    const fee     = amount * 0.10;
    const net     = amount * 0.90;

    return {
      id:           p.id,
      amount,
      platform_fee: fee,
      net_amount:   net,
      status:       p.status,
      paid_at:      p.paid_at ?? null,
      created_at:   p.created_at,
      reservation: resa
        ? {
            id:           resa.id,
            booking_code: resa.booking_code,
            date:         resa.date,
            time:         resa.time ? String(resa.time).slice(0, 5) : "—",
            people_count: resa.people_count,
            total_price:  Number(resa.total_price),
            touriste: tid
              ? (payProfilesMap[tid] ?? { full_name: null, phone: null })
              : null,
            excursion: resaExc
              ? { id: resaExc.id, title: resaExc.title, city: resaExc.city }
              : null,
          }
        : null,
    };
  });

  /* ──────────────────────────────────────────────
     CAPACITÉ — par (excursion_id, date, time)
  ────────────────────────────────────────────── */
  type SlotInfo = { booked: number; date: string; time: string };
  const capacite: Record<string, Record<string, SlotInfo>> = {};

  reservations.forEach((r) => {
    if (!r.excursion?.id || r.status === "cancelled") return;
    const excId   = r.excursion.id;
    const timeKey = r.time || "00:00";
    const slotKey = `${r.date}|${timeKey}`;
    if (!capacite[excId]) capacite[excId] = {};
    if (!capacite[excId][slotKey]) {
      capacite[excId][slotKey] = { booked: 0, date: r.date, time: timeKey };
    }
    capacite[excId][slotKey].booked += r.people_count;
  });

  console.log(
    `[presta] réservations: ${reservations.length} | paiements: ${paiements.length} | excursions: ${excursions.length}`
  );

  return (
    <PrestaReservationsClient
      reservations={reservations as any}
      paiements={paiements as any}
      excursions={excursions as any}
      capacite={capacite as any}
      prestataireInfo={{
        full_name:   profile?.full_name ?? null,
        agency_name: profile?.agency_name ?? null,
      }}
    />
  );
}