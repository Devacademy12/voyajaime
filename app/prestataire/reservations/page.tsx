import { createServerSupabaseClient } from "@/lib/supabaseServer";
import ReservationsClient from "./ReservationsClient";
import { Clock, CalendarDays } from "lucide-react";

export default async function PrestataireReservations() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // ── Étape 1 : IDs des excursions du prestataire ──
  const { data: excursions } = await supabase
    .from("excursions")
    .select("id")
    .eq("prestataire_id", user.id);

  const excIds = (excursions ?? []).map((e) => e.id);

  if (excIds.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>Réservations reçues</h1>
          <p style={{ color: "#6B7280", marginTop: 6, fontSize: 14 }}>Aucune excursion publiée</p>
        </div>
        <ReservationsClient reservations={[]} />
      </div>
    );
  }

  // ── Étape 2 : Réservations + excursion (sans join profiles — FK pointe auth.users pas profiles) ──
  const { data: rows, error } = await supabase
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
    .in("excursion_id", excIds)
    .order("created_at", { ascending: false });

  // ── Étape 3 : Noms des touristes via profiles.user_id ──
  const touristeIds = [
    ...new Set((rows ?? []).map((r) => String(r.touriste_id)).filter(Boolean)),
  ];

  const nameMap: Record<string, string> = {};

  if (touristeIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", touristeIds);

    (profs ?? []).forEach((p) => {
      nameMap[String(p.user_id)] = String(p.full_name || p.email || "Anonyme");
    });
  }

  // ── Étape 4 : Sérialisation propre pour le client ──
  const list = (rows ?? []).map((r) => ({
    id:              String(r.id),
    booking_code:    String(r.booking_code ?? ""),
    date:            String(r.date ?? ""),
    time:            r.time ? String(r.time).substring(0, 5) : "09:00",
    people_count:    Number(r.people_count ?? 1),
    total_price:     Number(r.total_price ?? 0),
    platform_fee:    Number(r.platform_fee ?? 0),
    status:          String(r.status ?? "pending"),
    touriste_name:   nameMap[String(r.touriste_id)] ?? "Anonyme",
    excursion_title: (r.excursion as { title?: string } | null)?.title ?? "Excursion",
    excursion_city:  (r.excursion as { city?: string }  | null)?.city  ?? "",
  }));

  const pendingCount = list.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>Réservations reçues</h1>
        <p style={{ color: "#6B7280", marginTop: 6, display: "flex", alignItems: "center", gap: 14, fontSize: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Clock size={14} color="#D97706" />
            <span><strong style={{ color: "#111827" }}>{pendingCount}</strong> en attente</span>
          </span>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <CalendarDays size={14} color="#6B7280" />
            <span><strong style={{ color: "#111827" }}>{list.length}</strong> au total</span>
          </span>
        </p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
          <strong>Erreur :</strong> {error.message}
        </div>
      )}

      <ReservationsClient reservations={list} />
    </div>
  );
}