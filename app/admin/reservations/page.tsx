import { createAdminClient } from "@/lib/supabaseAdmin";
import AdminReservationsClient from "./AdminReservationsClient";

export default async function AdminReservations() {
  const db = createAdminClient();

  const { data: rows, error } = await db
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
      touriste_id,
      created_at,
      excursion:excursions ( title, city )
    `)
    .order("created_at", { ascending: false });

  // Noms touristes
  const touristeIds = [
    ...new Set((rows ?? []).map((r) => r.touriste_id as string).filter(Boolean)),
  ] as string[];

  const nameMap: Record<string, string> = {};

  if (touristeIds.length > 0) {
    const { data: profs } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", touristeIds);

    (profs ?? []).forEach((p: { id: string; full_name?: string; email?: string }) => {
      nameMap[p.id] = p.full_name || p.email || "Anonyme";
    });

    const missing = touristeIds.filter((id) => !nameMap[id]);
    if (missing.length > 0) {
      try {
        const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
        (authData?.users ?? []).forEach((u) => {
          if (missing.includes(u.id)) {
            nameMap[u.id] = (u.user_metadata?.full_name as string) || u.email || "Anonyme";
          }
        });
      } catch { /* auth.admin non dispo */ }
    }
  }

  const list = (rows ?? []).map((r) => ({
    id:            String(r.id),
    booking_code:  String(r.booking_code ?? ""),
    date:          String(r.date ?? ""),
    time:          r.time ? String(r.time).substring(0, 5) : "09:00",
    people_count:  Number(r.people_count ?? 1),
    total_price:   Number(r.total_price ?? 0),
    platform_fee:  Number(r.platform_fee ?? 0),
    status:        String(r.status ?? "pending"),
    touriste_name: nameMap[String(r.touriste_id)] ?? "Anonyme",
    excursion:     (r.excursion as { title?: string; city?: string } | null) ?? null,
  }));

  return (
    <AdminReservationsClient
      reservations={list}
      error={error?.message ?? null}
    />
  );
}