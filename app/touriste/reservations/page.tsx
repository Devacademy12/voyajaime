import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import {
  CalendarDays, MapPin, Clock, Users, Plus,
  Sparkles, Banknote, CheckCircle, AlertCircle, XCircle, Info,
} from "lucide-react";

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string; Icon: React.ElementType }> = {
  pending:   { label: "En attente",  bg: "#FFFBEB", color: "#D97706", dot: "#F59E0B", Icon: Clock         },
  confirmed: { label: "Confirmée",   bg: "#F0FDF4", color: "#15803D", dot: "#22C55E", Icon: CheckCircle   },
  completed: { label: "Terminée",    bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6", Icon: Info          },
  cancelled: { label: "Annulée",     bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444", Icon: XCircle       },
};

export default async function TouristeReservations() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, excursion:excursions(title, city, photos, duration_hours, price_per_person)")
    .eq("touriste_id", user!.id)
    .order("created_at", { ascending: false });

  const total     = reservations?.length || 0;
  const pending   = reservations?.filter(r => r.status === "pending").length || 0;
  const confirmed = reservations?.filter(r => r.status === "confirmed").length || 0;

  return (
    <div style={{ padding: "36px 48px 60px", maxWidth: 1160, margin: "0 auto", width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#2B96A8", textTransform: "uppercase", marginBottom: 8 }}>MON ESPACE</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>Mes réservations</h1>
        </div>
        <Link href="/touriste/itineraire"
          style={{ padding: "11px 22px", background: "#111827", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} strokeWidth={2.5} /> Nouvelle réservation
        </Link>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total",       value: total,     color: "#2B96A8", bg: "#EFF9FB", Icon: CalendarDays  },
            { label: "En attente",  value: pending,   color: "#D97706", bg: "#FFFBEB", Icon: AlertCircle   },
            { label: "Confirmées",  value: confirmed, color: "#15803D", bg: "#F0FDF4", Icon: CheckCircle   },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: "20px 24px", border: `1px solid ${s.color}20`, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.Icon size={20} color={s.color} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 13, color: "#6B7280", marginTop: 3, fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!total ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 24, border: "1px solid #F3F4F6" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(43,150,168,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CalendarDays size={32} color="#2B96A8" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucune réservation</h3>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
            Planifiez votre voyage et réservez des excursions en Tunisie
          </p>
          <Link href="/touriste/itineraire"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#2B96A8", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(43,150,168,0.35)" }}>
            <Sparkles size={16} /> Planifier mon voyage
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reservations!.map(r => {
            const exc = r.excursion as Record<string, unknown> | null;
            const s   = STATUS[String(r.status)] || STATUS.pending;
            const photo = (exc?.photos as string[] | null)?.[0];
            return (
              <div key={String(r.id)}
                style={{ background: "white", borderRadius: 20, border: "1px solid #F3F4F6", overflow: "hidden", display: "flex", transition: "box-shadow 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"}>

                {/* Thumb */}
                <div style={{ width: 120, flexShrink: 0, background: "linear-gradient(135deg, #2B96A8, #1e7a8a)", position: "relative", overflow: "hidden" }}>
                  {photo
                    ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CalendarDays size={32} color="rgba(255,255,255,.5)" strokeWidth={1.5} />
                      </div>
                  }
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      {/* Status badge */}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: s.bg, borderRadius: 20 }}>
                        <s.Icon size={12} color={s.color} strokeWidth={2} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>#{String(r.booking_code)}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                      {exc?.title as string || "Excursion"}
                    </h3>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} color="#9CA3AF" strokeWidth={1.5} />{exc?.city as string}
                      </span>
                      <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarDays size={12} color="#9CA3AF" strokeWidth={1.5} />{String(r.date)} à {String(r.time)}
                      </span>
                      <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={12} color="#9CA3AF" strokeWidth={1.5} />{Number(r.people_count)} pers.
                      </span>
                      <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} color="#9CA3AF" strokeWidth={1.5} />{Number(exc?.duration_hours)}h
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "#111827", display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                      {Number(r.total_price)} <span style={{ fontSize: 13, fontWeight: 500, color: "#6B7280" }}>TND</span>
                    </p>
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <Banknote size={11} color="#C4B8B0" strokeWidth={1.5} />dont {Number(r.platform_fee)} frais
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
   
  );
}