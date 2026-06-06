// app/components/reservation/CancellationModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

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

export default function CancellationModal({ reservation, onClose, onCancelled }: Props) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"idle" | "confirming" | "success" | "error">("idle");
  const [refundInfo, setRefundInfo] = useState<{
    percentage: number;
    amount: number;
    reason: string;
    hoursLeft: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
    // Bloquer le scroll du body quand le modal est ouvert
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const calculateRefund = () => {
    try {
      const timeStr = String(reservation.time || "00:00").slice(0, 5);
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
      const hoursLeft = (excursionDateTime.getTime() - Date.now()) / 3_600_000;
      const daysLeft = Math.floor(hoursLeft / 24);
      const hoursRem = Math.floor(hoursLeft % 24);

      let percentage = 0;
      let amount = 0;
      let reason = "";

      if (hoursLeft >= 24) {
        percentage = 100;
        amount = reservation.total_price;
        reason = `✅ Remboursement intégral (${daysLeft}j ${hoursRem}h avant)`;
      } else if (hoursLeft > 0) {
        percentage = 50;
        amount = Math.round((reservation.total_price * 50) / 100 * 100) / 100;
        reason = `⚠️ Remboursement partiel — 50% (${Math.floor(hoursLeft)}h avant)`;
      } else {
        reason = "❌ Pas de remboursement (excursion commencée)";
      }

      setRefundInfo({ percentage, amount, reason, hoursLeft: Math.max(0, hoursLeft) });
      setStatus("confirming");
    } catch {
      setErrorMsg("Erreur lors du calcul du remboursement");
      setStatus("error");
    }
  };

  const handleConfirmCancel = async () => {
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
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur serveur");
      setStatus("error");
    }
  };

  if (!mounted) return null;

  // ── Styles communs ──────────────────────────────────────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  };

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 24,
    padding: "32px 24px",
    maxWidth: 440,
    width: "90%",
    boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
    position: "relative",
  };

  const btnGhostStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: "#F3F4F6",
    color: "#6B7280",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "inherit",
  };

  const btnDangerStyle: React.CSSProperties = {
    padding: "10px 24px",
    background: "#EF4444",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "inherit",
  };

  function iconCircle(bg: string, border: string): React.CSSProperties {
    return {
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: bg,
      border: `2.5px solid ${border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px",
    };
  }

  // ── Contenu selon état ──────────────────────────────────────────────────────

  const renderContent = () => {

    // SUCCÈS
    if (status === "success") {
      return (
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={iconCircle("#ECFDF5", "#86EFAC")}>
            <CheckCircle2 size={40} color="#10B981" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "#065F46", margin: "0 0 10px" }}>
            Réservation annulée
          </h3>
          <p style={{ fontSize: 14, color: "#047857", margin: 0, lineHeight: 1.6 }}>
            Votre réservation a été annulée avec succès.<br />
            Le remboursement sera traité dans 5–7 jours ouvrés.
          </p>
        </div>
      );
    }

    // ERREUR
    if (status === "error") {
      return (
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={iconCircle("#FEF2F2", "#FCA5A5")}>
            <XCircle size={40} color="#EF4444" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "#7F1D1D", margin: "0 0 10px" }}>
            Erreur d'annulation
          </h3>
          <p style={{ fontSize: 14, color: "#B91C1C", margin: "0 0 24px", lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <button
            style={{ ...btnDangerStyle, margin: "0 auto" }}
            onClick={() => setStatus("idle")}
          >
            Réessayer
          </button>
        </div>
      );
    }

    // CONFIRMATION + DÉTAILS REMBOURSEMENT
    if (status === "confirming" && refundInfo) {
      const pal =
        refundInfo.percentage === 100
          ? { bg: "#ECFDF5", border: "#86EFAC", text: "#065F46" }
          : refundInfo.percentage > 0
          ? { bg: "#FEF3C7", border: "#FCD34D", text: "#92400E" }
          : { bg: "#FEF2F2", border: "#FECACA", text: "#7F1D1D" };

      return (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 20px", textAlign: "center" }}>
            Détails du remboursement
          </h3>

          {/* Carte remboursement */}
          <div
            style={{
              background: pal.bg,
              border: `2px solid ${pal.border}`,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: 13, color: pal.text, fontWeight: 600, margin: "0 0 12px" }}>
              {refundInfo.reason}
            </p>

            {/* Montant original */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: pal.text, fontWeight: 500 }}>Montant original</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: pal.text }}>
                {reservation.total_price.toLocaleString("fr-FR")} EUR
              </span>
            </div>

            {/* Remboursement */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: pal.text, fontWeight: 500 }}>
                Remboursement ({refundInfo.percentage}%)
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: pal.text }}>
                {refundInfo.amount.toLocaleString("fr-FR")} EUR
              </span>
            </div>

            {/* Temps restant */}
            {refundInfo.hoursLeft > 0 && (
              <p
                style={{
                  fontSize: 11,
                  color: pal.text,
                  margin: "12px 0 0",
                  paddingTop: 12,
                  borderTop: `1px solid ${pal.border}`,
                  fontWeight: 600,
                }}
              >
                ⏱️{" "}
                {refundInfo.hoursLeft >= 24
                  ? `${Math.floor(refundInfo.hoursLeft / 24)}j ${Math.floor(refundInfo.hoursLeft % 24)}h`
                  : `${Math.floor(refundInfo.hoursLeft)}h`}{" "}
                avant l'excursion
              </p>
            )}
          </div>

          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 24px", textAlign: "center", lineHeight: 1.6 }}>
            {refundInfo.percentage === 100 && "Vous serez remboursé intégralement. Traitement sous 5–7 jours ouvrés."}
            {refundInfo.percentage === 50 && "Vous recevrez 50% du montant payé. Traitement sous 5–7 jours ouvrés."}
            {refundInfo.percentage === 0 && "L'excursion a déjà commencé. Aucun remboursement possible."}
            <br /><br />
            Êtes-vous sûr de vouloir annuler ? <strong>Cette action est irréversible.</strong>
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              style={btnGhostStyle}
              onClick={() => setStatus("idle")}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
            >
              Retour
            </button>
            <button
              style={btnDangerStyle}
              onClick={handleConfirmCancel}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#DC2626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#EF4444")}
            >
              <XCircle size={14} />
              Confirmer l'annulation
            </button>
          </div>
        </div>
      );
    }

    // IDLE — état initial
    return (
      <div style={cardStyle}>
        <div style={iconCircle("#FEF3C7", "#FCD34D")}>
          <AlertTriangle size={40} color="#F59E0B" strokeWidth={1.5} />
        </div>

        <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 10px", textAlign: "center" }}>
          Annuler cette réservation ?
        </h3>

        <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", margin: "0 0 6px", lineHeight: 1.6 }}>
          #{reservation.booking_code} · {reservation.date} à {reservation.time}
        </p>

        <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", margin: "0 0 28px", lineHeight: 1.6 }}>
          Cliquez sur "Calculer le remboursement" pour voir les détails avant de confirmer.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            style={btnGhostStyle}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
          >
            Fermer
          </button>
          <button
            style={{
              padding: "10px 24px",
              background: "#F59E0B",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
              fontFamily: "inherit",
            }}
            onClick={calculateRefund}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#D97706")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F59E0B")}
          >
            Calculer le remboursement
          </button>
        </div>
      </div>
    );
  };

  // ── Portail → rendu directement sur document.body ───────────────────────────
  return createPortal(
    <div
      style={overlayStyle}
      onClick={(e) => {
        // Fermer en cliquant sur le fond (pas sur la carte)
        if (e.target === e.currentTarget && status !== "success") onClose();
      }}
    >
      {renderContent()}
    </div>,
    document.body
  );
}