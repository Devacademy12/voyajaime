import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { CalendarDays, AlertCircle, Clock } from "lucide-react";
import ReservationsClient from "./ReservationsClient";

type Reservation = {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
  status: string; payment_status: string | null; payment_deadline?: string | null;
  excursion: { title: string; city: string; photos: string[]; duration_hours: number; price_per_person: number; } | null;
};

export default async function TouristeReservations({
  searchParams,
}: {
  searchParams: Promise<{ pay?: string }>;   // ← Next.js 15+ : Promise
}) {
  // ← await obligatoire en Next.js 15
  const resolvedParams = await searchParams;
  const autoOpenId     = resolvedParams?.pay;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return (
    <div style={{ textAlign:"center", padding:48 }}>
      <p style={{ color:"#4a6080" }}>Veuillez vous connecter pour voir vos réservations</p>
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select(`
      id, booking_code, date, time, people_count,
      total_price, platform_fee, status, created_at, payment_deadline,
      excursion:excursions(title, city, photos, duration_hours, price_per_person)
    `)
    .eq("touriste_id", user.id)
    .neq("status", "cancelled")
    .gte("date", today)
    .order("date", { ascending: true });

  let paymentStatuses: Record<string, string> = {};
  try {
    const { data: ps } = await supabase.from("reservations").select("id, payment_status").eq("touriste_id", user.id);
    if (ps) ps.forEach((r: { id: string; payment_status?: string | null }) => {
      if (r.payment_status) paymentStatuses[r.id] = r.payment_status;
    });
  } catch (_) {}

  if (error) return (
    <div style={{ textAlign:"center", padding:48 }}>
      <p style={{ color:"#EF4444" }}>Erreur : {error.message}</p>
    </div>
  );

  const formattedReservations: Reservation[] = (reservations || [])
    .filter(r => r.excursion !== null)
    .map(r => ({
      id: r.id, booking_code: r.booking_code, date: r.date, time: r.time,
      people_count: r.people_count, total_price: r.total_price, platform_fee: r.platform_fee,
      status: r.status, payment_status: paymentStatuses[r.id] || null,
      payment_deadline: r.payment_deadline,
      excursion: r.excursion ? {
        title: r.excursion.title, city: r.excursion.city,
        photos: r.excursion.photos || [],
        duration_hours: r.excursion.duration_hours,
        price_per_person: r.excursion.price_per_person,
      } : null,
    }));

  const total = formattedReservations.length;
  const hasPendingPayments = formattedReservations.some(
    r => r.status === "pending" && r.payment_status !== "paid"
  );

  const { count: histCount } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("touriste_id", user.id)
    .or(`status.eq.cancelled,and(status.in.(confirmed,completed),date.lt.${today})`);

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 32px", background:"white", minHeight:"100vh" }}>

      {/* ── styles purs CSS — aucun event handler ── */}
      <style>{`
        .hist-link {
          display:inline-flex; align-items:center; gap:8px;
          padding:10px 18px; background:#F3F4F6; color:#374151;
          border-radius:14px; text-decoration:none; font-size:13px;
          font-weight:700; border:1px solid #E5E7EB; transition:all .18s;
        }
        .hist-link:hover { background:#053366 !important; color:white !important; border-color:#053366 !important; }
        .hist-badge {
          background:#053366; color:white; border-radius:20px;
          padding:2px 8px; font-size:11px; font-weight:800; transition:background .18s;
        }
        .hist-link:hover .hist-badge { background:rgba(255,255,255,.22); }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, color:"#053366", margin:0 }}>Mes réservations</h1>
          <p style={{ fontSize:13, color:"#9CA3AF", margin:"4px 0 0" }}>
            Vos prochaines excursions et réservations actives
          </p>
        </div>

        {/* Lien Historique — CSS hover uniquement, pas d'event handlers */}
        <a href="/touriste/historique" className="hist-link">
          {/* Icône SVG inline pour éviter tout import côté serveur */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
          </svg>
          Historique
          {(histCount || 0) > 0 && (
            <span className="hist-badge">{histCount}</span>
          )}
        </a>
      </div>

      {/* Alerte paiement en attente */}
      {hasPendingPayments && (
        <div style={{ marginBottom:24, padding:"14px 18px", background:"#e8f7fb", borderLeft:"4px solid #02AFCF", borderRadius:12, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"#c7eef5", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Clock size={18} color="#02AFCF"/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#053366", marginBottom:2 }}>Paiement en attente</p>
            <p style={{ fontSize:12, color:"#4a6080", margin:0 }}>
              Vous avez des réservations en attente de paiement. Elles seront{" "}
              <strong style={{ color:"#053366" }}>annulées automatiquement</strong> si le paiement n&apos;est pas finalisé sous{" "}
              <strong style={{ color:"#053366" }}>1 heure</strong>.
            </p>
          </div>
          <AlertCircle size={18} color="#02AFCF" style={{ flexShrink:0 }}/>
        </div>
      )}

      {/* Compteur */}
      <p style={{ fontSize:13, color:"#4a6080", display:"flex", alignItems:"center", gap:6, marginBottom:24 }}>
        <CalendarDays size={14} style={{ color:"#02AFCF" }}/>
        <strong style={{ color:"#053366" }}>{total}</strong>
        {total > 1 ? " réservations actives" : " réservation active"}
      </p>

      {/* Client component — reçoit uniquement des données sérialisables */}
      <ReservationsClient
        reservations={formattedReservations}
        autoOpenId={autoOpenId}
      />
    </div>
  );
}