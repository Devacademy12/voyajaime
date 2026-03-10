"use client";

import { Calendar, Users, Clock, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";

type Reservation = {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  payment_status: string | null;
  excursion: {
    title: string;
    city: string;
    photos: string[];
    duration_hours: number;
    price_per_person: number;
  } | null;
};

export default function ReservationsClient({ reservations }: { reservations: Reservation[] }) {
  // Valeur par défaut pour éviter l'erreur si reservations est undefined
  const reservationsList = reservations || [];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return { bg: "#ECFDF3", text: "#067647", dot: "#12B76A" };
      case "pending":
        return { bg: "#FFFAEB", text: "#B54708", dot: "#F79009" };
      case "cancelled":
        return { bg: "#FEF3F2", text: "#B42318", dot: "#F04438" };
      default:
        return { bg: "#F2F4F7", text: "#344054", dot: "#667085" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmée";
      case "pending": return "En attente de paiement";
      case "cancelled": return "Annulée";
      default: return status;
    }
  };

  // Si pas de réservations, afficher un message
  if (reservationsList.length === 0) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: 60, 
        background: "#F9FAFB", 
        borderRadius: 20,
        border: "1px solid #E5E7EB"
      }}>
        <Calendar size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: "#4B5563", marginBottom: 20 }}>
          Aucune réservation à afficher
        </p>
        <Link 
          href="/touriste/itineraire"
          style={{ 
            padding: "10px 20px", 
            background: "#111827", 
            color: "white", 
            borderRadius: 30, 
            textDecoration: "none", 
            fontSize: 14, 
            fontWeight: 500,
            display: "inline-block"
          }}
        >
          Explorer les excursions
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {reservationsList.map((res) => {
        const statusStyle = getStatusColor(res.status);
        const photo = res.excursion?.photos?.[0] || "/placeholder-excursion.jpg";
        
        return (
          <div
            key={res.id}
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #E5E7EB",
              overflow: "hidden",
              transition: "box-shadow 0.2s"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Header avec statut */}
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid #E5E7EB",
                background: "#F9FAFB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    padding: "4px 10px",
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    borderRadius: 30,
                    fontSize: 12,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    <span style={{
                      width: 4,
                      height: 4,
                      background: statusStyle.dot,
                      borderRadius: "50%",
                      display: "inline-block"
                    }} />
                    {getStatusLabel(res.status)}
                  </div>
                  <span style={{ color: "#6B7280", fontSize: 12 }}>
                    #{res.booking_code}
                  </span>
                </div>
                
                {res.status === "pending" && (
                  <Link
                    href={`/paiement/${res.id}`}
                    style={{
                      background: "#111827",
                      color: "white",
                      padding: "6px 16px",
                      borderRadius: 30,
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <CreditCard size={14} />
                    Payer {res.total_price} TND
                  </Link>
                )}
              </div>

              {/* Contenu */}
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  {/* Image */}
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: 16,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "#F3F4F6"
                  }}>
                    <img
                      src={photo}
                      alt={res.excursion?.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* Détails */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: 18, 
                      fontWeight: 600, 
                      color: "#111827",
                      marginBottom: 10
                    }}>
                      {res.excursion?.title}
                    </h3>
                    
                    <div style={{ 
                      display: "flex", 
                      flexWrap: "wrap", 
                      gap: "12px 20px",
                      marginBottom: 8
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: "#4B5563" }}>
                          {res.excursion?.city}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: "#4B5563" }}>
                          {new Date(res.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short"
                          })}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: "#4B5563" }}>
                          {res.time} ({res.excursion?.duration_hours}h)
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={14} color="#9CA3AF" />
                        <span style={{ fontSize: 13, color: "#4B5563" }}>
                          {res.people_count} pers.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer pour les confirmées */}
              {res.status === "confirmed" && (
                <div style={{
                  padding: "12px 20px",
                  borderTop: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  display: "flex",
                  justifyContent: "flex-end"
                }}>
                  <Link
                    href={`/touriste/reservations/${res.id}`}
                    style={{
                      color: "#3B82F6",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    Voir détails →
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}