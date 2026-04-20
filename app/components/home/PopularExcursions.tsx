import Link from "next/link";
import {
  Heart, Lock, MapPin, Clock, Star, Mountain,
  CalendarCheck, UserPlus, LogIn, ArrowRight,
} from "lucide-react";
import { ROUTES } from "@/app/lib/routes";
import { Excursion, SkeletonCard, FALLBACK_IMG } from "@/lib/homeUtils";

interface PopularExcursionsProps {
  excursions: Excursion[];
  excLoading: boolean;
  user:       { email?: string; id?: string } | null;
  openAuth:   (mode: "login" | "register" | "prestataire", redirect?: string) => void;
}

export default function PopularExcursions({
  excursions, excLoading, user, openAuth,
}: PopularExcursionsProps) {
  return (
    <section style={{ padding: "96px 72px 80px", background: "#FAFAF9" }} className="section-pad">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 52, flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <h2 className="section-title">
              Excursions<br />populaires
            </h2>
          </div>
          <Link href={ROUTES.excursions} className="btn-outline" style={{ marginBottom: 8 }}>
            Voir tout le catalogue <ArrowRight size={15} />
          </Link>
        </div>

        {/* Loading skeletons */}
        {excLoading && (
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!excLoading && excursions.length === 0 && (
          <div style={{
            textAlign: "center", padding: "72px 20px",
            background: "white", borderRadius: 20, border: "1px solid #F0F0F0",
          }}>
            <Mountain size={48} style={{ color: "#E5E7EB", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
              Aucune excursion disponible
            </p>
          </div>
        )}

        {/* Grid */}
        {!excLoading && excursions.length > 0 && (
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {excursions.map(exc => {
              const photo    = exc.photos?.find(Boolean) || FALLBACK_IMG;
              const category = exc.categories?.[0] || null;
              return (
                <Link key={exc.id} href={ROUTES.excursion(exc.id)} className="exc-card">
                  <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                    <img
                      src={photo}
                      alt={exc.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                    />
                    {category && (
                      <div style={{ position: "absolute", top: 14, left: 14 }}>
                        <span style={{
                          padding: "4px 11px",
                          background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)",
                          borderRadius: 20, fontSize: 11, fontWeight: 700, color: "white", letterSpacing: 0.3,
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
                        ? <Heart size={16} color="#E11D48" />
                        : <Lock  size={14} color="#6B7280" />
                      }
                    </button>
                  </div>

                  <div style={{ padding: "18px 18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4, lineHeight: 1.35 }}>
                          {exc.title}
                        </h3>
                        <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} /> {exc.city}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                          {exc.price_per_person}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>TND / pers.</p>
                      </div>
                    </div>

                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingTop: 14, borderTop: "1px solid #F3F4F6",
                    }}>
                      <div style={{ display: "flex", gap: 14 }}>
                        <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> {exc.duration_hours}h
                        </span>
                        {exc.rating > 0 && (
                          <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                            <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
                            {Number(exc.rating).toFixed(1)}
                            {exc.reviews_count > 0 && (
                              <span style={{ color: "#C4C9D4" }}>({exc.reviews_count})</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div style={{
                        padding: "7px 14px",
                        background: user ? "#02AFCF" : "#F3F4F6",
                        color:      user ? "white"   : "#9CA3AF",
                        borderRadius: 10, fontSize: 12, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        {user
                          ? <><CalendarCheck size={13} /> Réserver</>
                          : <><Lock size={12} /> Réserver</>
                        }
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Guest CTA */}
        {!user && (
          <div className="guest-cta" style={{
            marginTop: 56, padding: "40px 48px",
            background: "linear-gradient(135deg,#EFF9FB 0%,#F8FFFE 100%)",
            border: "1.5px solid #C5E9EF", borderRadius: 24,
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24,
          }}>
            <div>
              <h3 style={{
                fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8,
                fontFamily: "'Playfair Display',serif", letterSpacing: "-0.5px",
              }}>
                Envie de réserver ou sauvegarder ?
              </h3>
              <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6 }}>
                Créez un compte gratuit — accès aux favoris, réservations et suivi de paiement.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <button onClick={() => openAuth("register")} className="btn-primary" style={{ fontSize: 14, padding: "13px 24px" }}>
                <UserPlus size={16} /> Créer un compte
              </button>
              <button onClick={() => openAuth("login")} className="btn-outline" style={{ fontSize: 14 }}>
                <LogIn size={16} /> Se connecter
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}