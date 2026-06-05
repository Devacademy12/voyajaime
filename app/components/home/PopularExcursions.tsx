import Link from "next/link";
import {
  Heart, Lock, MapPin, Clock, Star, Mountain,
  CalendarCheck, ArrowRight,
} from "lucide-react";
import { ROUTES } from "@/app/lib/routes";
import { Excursion, SkeletonCard, FALLBACK_IMG } from "@/lib/homeUtils";

interface PopularExcursionsProps {
  excursions: Excursion[];
  excLoading: boolean;
  user:       { email?: string; id?: string } | null;
  openAuth:   (mode: "login" | "register" | "prestataire", redirect?: string) => void;
}

const EXC_CSS = `
  .exc-section {
    background: #FFFFFF;
    padding: 88px 64px 80px;
  }
  .exc-card-v2 {
    border-radius: 18px;
    overflow: hidden;
    background: white;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    transition: all 0.28s cubic-bezier(.16,1,.3,1);
    cursor: pointer;
    text-decoration: none;
    display: block;
    color: inherit;
  }
  .exc-card-v2:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.08);
    border-color: rgba(11,122,138,0.2);
  }
  .exc-card-v2 img { transition: transform 0.45s ease; display: block; }
  .exc-card-v2:hover img { transform: scale(1.05); }

  .exc-reserve-btn {
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
  }
  .exc-reserve-btn.active {
    background: #E6F4F6;
    color: #0B7A8A;
  }
  .exc-reserve-btn.active:hover {
    background: #0B7A8A;
    color: white;
  }
  .exc-reserve-btn.locked {
    background: #F3F4F6;
    color: #9CA3AF;
  }
`;

export default function PopularExcursions({
  excursions, excLoading, user, openAuth,
}: PopularExcursionsProps) {
  return (
    <section className="exc-section section-pad">
      <style>{EXC_CSS}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 48, flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <p className="section-eyebrow">Nos meilleures offres</p>
            <h2 className="section-title">Excursions populaires</h2>
          </div>
          <Link href={ROUTES.excursions} className="btn-outline" style={{ marginBottom: 4 }}>
            Voir tout le catalogue <ArrowRight size={14} />
          </Link>
        </div>

        {/* Loading skeletons */}
        {excLoading && (
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!excLoading && excursions.length === 0 && (
          <div style={{
            textAlign: "center", padding: "64px 20px",
            background: "#F7F9FC", borderRadius: 20, border: "1px solid #E5E7EB",
          }}>
            <Mountain size={44} style={{ color: "#D1D5DB", margin: "0 auto 14px" }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Aucune excursion disponible
            </p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>Revenez prochainement</p>
          </div>
        )}

        {/* Grid */}
        {!excLoading && excursions.length > 0 && (
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {excursions.map(exc => {
              const photo    = exc.photos?.find(Boolean) || FALLBACK_IMG;
              const category = exc.categories?.[0] || null;
              return (
                <Link key={exc.id} href={ROUTES.excursion(exc.id)} className="exc-card-v2">
                  <div style={{ position: "relative", height: 210, overflow: "hidden" }}>
                    <img
                      src={photo}
                      alt={exc.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                    />
                    {category && (
                      <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <span style={{
                          padding: "4px 10px",
                          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                          borderRadius: 20, fontSize: 11, fontWeight: 700,
                          color: "#053366", letterSpacing: 0.2,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                        }}>
                          {category}
                        </span>
                      </div>
                    )}
                    <button
                      className="heart-btn"
                      onClick={e => {
                        e.preventDefault();
                        if (!user) openAuth("login", ROUTES.excursion(exc.id));
                      }}
                    >
                      {user
                        ? <Heart size={15} color="#E11D48" />
                        : <Lock  size={13} color="#9CA3AF" />
                      }
                    </button>
                  </div>

                  <div style={{ padding: "16px 16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1, paddingRight: 10 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4, lineHeight: 1.3 }}>
                          {exc.title}
                        </h3>
                        <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} /> {exc.city}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 19, fontWeight: 800, color: "#053366", lineHeight: 1 }}>
                          {exc.price_per_person}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>EUR / pers.</p>
                      </div>
                    </div>

                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingTop: 12, borderTop: "1px solid #F3F4F6",
                    }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={11} /> {exc.duration_hours}h
                        </span>
                        {exc.rating > 0 && (
                          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <Star size={11} fill="#F59E0B" stroke="#F59E0B" />
                            {Number(exc.rating).toFixed(1)}
                            {exc.reviews_count > 0 && (
                              <span style={{ color: "#D1D5DB" }}>({exc.reviews_count})</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className={`exc-reserve-btn ${user ? "active" : "locked"}`}>
                        {user
                          ? <><CalendarCheck size={12} /> Réserver</>
                          : <><Lock size={11} /> Réserver</>
                        }
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
