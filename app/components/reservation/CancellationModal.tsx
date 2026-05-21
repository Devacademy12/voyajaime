// app/components/reservation/CancellationModal.tsx
"use client";

import { useState } from "react";
import {
  AlertTriangle, XCircle, CheckCircle2, Loader2,
} from "lucide-react";

interface Props {
  reservation: {
    id: string;
    booking_code: string;
    date: string;
    time: string;
    total_price: number;
    platform_fee: number;
  };
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancellationModal({
  reservation,
  onClose,
  onCancelled,
}: Props) {
  const [status, setStatus] = useState<"idle" | "calculating" | "confirming" | "success" | "error">("idle");
  const [refundInfo, setRefundInfo] = useState<{
    percentage: number;
    amount: number;
    reason: string;
    hoursLeft: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Calculer les informations de remboursement
  const calculateRefund = () => {
    try {
      const excursionTime = reservation.time || "00:00";
      const timeStr = String(excursionTime).slice(0, 5);
      
      // Créer la date d'excursion de manière robuste
      const [year, month, day] = reservation.date.split("-");
      const [hour, minute] = timeStr.split(":");
      
      const excursionDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        0
      );
      
      const now = new Date();
      const millisecondsLeft = excursionDateTime.getTime() - now.getTime();
      const hoursLeft = millisecondsLeft / (1000 * 60 * 60);
      const daysLeft = Math.floor(hoursLeft / 24);
      const hoursRemainder = Math.floor(hoursLeft % 24);

      let percentage = 0;
      let amount = 0;
      let reason = "";

      if (hoursLeft >= 24) {
        percentage = 100;
        amount = reservation.total_price;
        reason = `✅ Remboursement intégral (${daysLeft}j ${hoursRemainder}h avant)`;
      } else if (hoursLeft > 0) {
        percentage = 50;
        amount = Math.round((reservation.total_price * 50) / 100 * 100) / 100;
        reason = `⚠️ Remboursement partiel - 50% (${Math.floor(hoursLeft)}h avant)`;
      } else {
        percentage = 0;
        amount = 0;
        reason = "❌ Pas de remboursement (excursion commencée)";
      }

      setRefundInfo({
        percentage,
        amount,
        reason,
        hoursLeft: Math.max(0, hoursLeft),
      });
      setStatus("confirming");
    } catch (error) {
      setErrorMsg("Erreur lors du calcul du remboursement");
      setStatus("error");
    }
  };

  // Confirmer l'annulation
  const handleConfirmCancel = async () => {
    setStatus("confirming");
    try {
      const res = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservation.id,
          reason: refundInfo?.reason || "Annulation utilisateur",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de l'annulation");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        onCancelled();
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erreur serveur");
      setStatus("error");
    }
  };

  // État initial
  if (status === "idle" && !refundInfo) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "32px 24px",
            maxWidth: 420,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#FEF3C7",
              border: "2.5px solid #FCD34D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <AlertTriangle size={40} color="#F59E0B" strokeWidth={1.5} />
          </div>

          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              margin: "0 0 10px",
              textAlign: "center",
            }}
          >
            Annuler cette réservation?
          </h3>

          <p
            style={{
              fontSize: 14,
              color: "#64748B",
              margin: "0 0 6px",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            #{reservation.booking_code} · {reservation.date} à {reservation.time}
          </p>

          <p
            style={{
              fontSize: 13,
              color: "#94A3B8",
              margin: "0 0 24px",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Cliquez sur "Calculer le remboursement" pour voir les détails de votre remboursement.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "#F3F4F6",
                color: "#6B7280",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E5E7EB")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#F3F4F6")
              }
            >
              Annuler
            </button>

            <button
              onClick={calculateRefund}
              style={{
                padding: "10px 24px",
                background: "#F59E0B",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#D97706")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#F59E0B")
              }
            >
              Calculer le remboursement
            </button>
          </div>
        </div>
      </div>
    );
  }

  // État de confirmation avec remboursement
  if (status === "confirming" && refundInfo) {
    const bgColor =
      refundInfo.percentage === 100
        ? "#ECFDF5"
        : refundInfo.percentage > 0
          ? "#FEF3C7"
          : "#FEF2F2";
    const borderColor =
      refundInfo.percentage === 100
        ? "#86EFAC"
        : refundInfo.percentage > 0
          ? "#FCD34D"
          : "#FECACA";
    const textColor =
      refundInfo.percentage === 100
        ? "#065F46"
        : refundInfo.percentage > 0
          ? "#92400E"
          : "#7F1D1D";

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "32px 24px",
            maxWidth: 420,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              margin: "0 0 20px",
              textAlign: "center",
            }}
          >
            Détails du remboursement
          </h3>

          {/* Refund info card */}
          <div
            style={{
              background: bgColor,
              border: `2px solid ${borderColor}`,
              borderRadius: 16,
              padding: "16px",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: textColor,
                margin: "0 0 12px",
                fontWeight: 600,
              }}
            >
              {refundInfo.reason}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: textColor,
                  fontWeight: 500,
                }}
              >
                Montant original
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {reservation.total_price.toLocaleString("fr-FR")} EUR
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: textColor,
                  fontWeight: 500,
                }}
              >
                Remboursement ({refundInfo.percentage}%)
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: textColor,
                }}
              >
                {refundInfo.amount.toLocaleString("fr-FR")} EUR
              </span>
            </div>

            {refundInfo.hoursLeft > 0 && (
              <p
                style={{
                  fontSize: 11,
                  color: textColor,
                  margin: "12px 0 0",
                  paddingTop: "12px",
                  borderTop: `1px solid ${borderColor}`,
                  fontWeight: 600,
                }}
              >
                ⏱️ Vous avez {refundInfo.hoursLeft >= 24 ? `${Math.floor(refundInfo.hoursLeft / 24)}j ${Math.floor(refundInfo.hoursLeft % 24)}h` : `${Math.floor(refundInfo.hoursLeft)}h`} avant l'excursion
              </p>
            )}
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#6B7280",
              margin: "0 0 24px",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {refundInfo.percentage === 100 && (
              <>Vous serez remboursé intégralement. Le remboursement sera traité sous 5-7 jours.</>
            )}
            {refundInfo.percentage === 50 && (
              <>Vous recevrez 50% du montant. Le remboursement sera traité sous 5-7 jours.</>
            )}
            {refundInfo.percentage === 0 && (
              <>L'excursion a déjà commencé. Aucun remboursement ne sera possible.</>
            )}
            <br/><br/>
            Êtes-vous sûr de vouloir annuler cette réservation?
            Cette action ne peut pas être annulée.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setStatus("idle")}
              style={{
                padding: "10px 20px",
                background: "#F3F4F6",
                color: "#6B7280",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#E5E7EB")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#F3F4F6")
              }
            >
              Retour
            </button>

            <button
              onClick={handleConfirmCancel}
              style={{
                padding: "10px 24px",
                background: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#DC2626")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#EF4444")
              }
            >
              <XCircle size={14} /> Confirmer annulation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // État de succès
  if (status === "success") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "32px 24px",
            maxWidth: 420,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#ECFDF5",
              border: "2.5px solid #86EFAC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <CheckCircle2 size={40} color="#10B981" strokeWidth={1.5} />
          </div>

          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#065F46",
              margin: "0 0 10px",
            }}
          >
            Réservation annulée
          </h3>

          <p
            style={{
              fontSize: 14,
              color: "#047857",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Votre réservation a été annulée avec succès. Le remboursement sera traité dans 5-7 jours.
          </p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (status === "error") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "32px 24px",
            maxWidth: 420,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#FEF2F2",
              border: "2.5px solid #FCA5A5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <XCircle size={40} color="#EF4444" strokeWidth={1.5} />
          </div>

          <h3
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#7F1D1D",
              margin: "0 0 10px",
            }}
          >
            Erreur d'annulation
          </h3>

          <p
            style={{
              fontSize: 14,
              color: "#B91C1C",
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            {errorMsg}
          </p>

          <button
            onClick={() => setStatus("idle")}
            style={{
              padding: "10px 24px",
              background: "#EF4444",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return null;
}
