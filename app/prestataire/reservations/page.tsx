import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";
import ReservationsClient from "./ReservationsClient";
import { Clock, CalendarDays, CheckCircle2, TrendingUp } from "lucide-react";

export default async function PrestataireReservations() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Client admin pour récupérer les emails depuis auth.users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Étape 1 : IDs des excursions du prestataire
  const { data: excursions } = await supabase
    .from("excursions").select("id").eq("prestataire_id", user.id);

  const excIds = (excursions ?? []).map(e => e.id);

  if (excIds.length === 0) {
    return (
      <div>
        <Header pending={0} total={0} confirmed={0} revenue={0}/>
        <ReservationsClient reservations={[]}/>
      </div>
    );
  }

  // Étape 2 : Réservations
  const { data: rows, error } = await supabase
    .from("reservations")
    .select(`id, booking_code, date, time, people_count, total_price, platform_fee, status, touriste_id, created_at, excursion:excursions(title, city)`)
    .in("excursion_id", excIds)
    .order("created_at", { ascending: false });

  // Étape 3 : Noms + emails touristes
  const touristeIds = [...new Set((rows ?? []).map(r => String(r.touriste_id)).filter(Boolean))];
  const nameMap:  Record<string, string> = {};
  const emailMap: Record<string, string> = {};

  if (touristeIds.length > 0) {
    // Noms depuis profiles
    const { data: profs } = await supabase
      .from("profiles").select("user_id, full_name").in("user_id", touristeIds);
    (profs ?? []).forEach(p => {
      nameMap[String(p.user_id)] = String(p.full_name || "Anonyme");
    });

    // Emails depuis auth.users via admin client
    try {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authList?.users) {
        authList.users
          .filter(u => touristeIds.includes(u.id))
          .forEach(u => { emailMap[u.id] = u.email || ""; });
      }
    } catch (e) {
      console.warn("[reservations] Could not fetch auth emails:", e);
    }
  }

  // Étape 4 : Sérialisation
  const list = (rows ?? []).map(r => ({
    id:              String(r.id),
    booking_code:    String(r.booking_code ?? ""),
    date:            String(r.date ?? ""),
    time:            r.time ? String(r.time).substring(0, 5) : "",
    people_count:    Number(r.people_count ?? 1),
    total_price:     Number(r.total_price ?? 0),
    platform_fee:    Number(r.platform_fee ?? 0),
    status:          String(r.status ?? "pending"),
    touriste_name:   nameMap[String(r.touriste_id)]  ?? "Anonyme",
    touriste_email:  emailMap[String(r.touriste_id)] ?? "",
    excursion_title: (r.excursion as { title?: string } | null)?.title ?? "Excursion",
    excursion_city:  (r.excursion as { city?: string }  | null)?.city  ?? "",
  }));

  const pending   = list.filter(r => r.status === "pending").length;
  const confirmed = list.filter(r => r.status === "confirmed").length;
  const revenue   = list.filter(r => r.status !== "cancelled").reduce((s, r) => s + r.total_price - r.platform_fee, 0);

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <Header pending={pending} total={list.length} confirmed={confirmed} revenue={revenue}/>
      {error && (
        <div style={{ background:"#FEE2E2", border:"1px solid #FCA5A5", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#DC2626" }}>
          <strong>Erreur :</strong> {error.message}
        </div>
      )}
      <ReservationsClient reservations={list}/>
    </div>
  );
}

function Header({ pending, total, confirmed, revenue }: { pending: number; total: number; confirmed: number; revenue: number }) {
  return (
    <>
      <style>{`
        @keyframes fadeUp2 { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .rh-card { animation:fadeUp2 .35s ease both; }
        .rh-stat:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(5,51,102,.1)!important; transition:all .2s; }
        .rh-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
        @media(max-width:900px){ .rh-stats { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:500px){ .rh-stats { grid-template-columns:repeat(2,1fr); gap:10px; } }
      `}</style>

      <div className="rh-card" style={{ marginBottom:24, animationDelay:"0s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:6 }}>
          <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(2,175,207,.35)" }}>
            <CalendarDays size={22} color="white" strokeWidth={1.8}/>
          </div>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:"#053366", margin:0, letterSpacing:"-0.5px" }}>Réservations reçues</h1>
            <p style={{ color:"#6B7280", fontSize:14, margin:0 }}>{total} réservation{total > 1 ? "s" : ""} au total</p>
          </div>
        </div>
      </div>

      <div className="rh-stats rh-card" style={{ animationDelay:".07s" }}>
        {[
          { label:"En attente", value:pending,          icon:<Clock size={20}/>,        color:"#A16207", bg:"rgba(217,119,6,.1)",   border:"rgba(217,119,6,.2)"  },
          { label:"Confirmées", value:confirmed,        icon:<CheckCircle2 size={20}/>, color:"#02AFCF", bg:"rgba(2,175,207,.1)",   border:"rgba(2,175,207,.2)"  },
          { label:"Total",      value:total,            icon:<CalendarDays size={20}/>, color:"#053366", bg:"rgba(5,51,102,.08)",   border:"rgba(5,51,102,.15)"  },
          { label:"Net perçu",  value:`${revenue} TND`, icon:<TrendingUp size={20}/>,   color:"#259FFC", bg:"rgba(37,159,252,.1)", border:"rgba(37,159,252,.2)" },
        ].map((s, i) => (
          <div key={s.label} className="rh-stat" style={{ background:"white", border:`1px solid ${s.border}`, borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 8px rgba(5,51,102,.05)", animationDelay:`${.07 + i*.05}s`, cursor:"default" }}>
            <div style={{ width:40, height:40, borderRadius:11, background:s.bg, border:`1px solid ${s.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize:20, fontWeight:900, color:"#053366", margin:0, lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:11, color:"#9CA3AF", margin:"3px 0 0", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.4px" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}