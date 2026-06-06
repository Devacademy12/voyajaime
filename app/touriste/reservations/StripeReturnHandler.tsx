// app/components/paiement/StripeReturnHandler.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

const STRIPE_HANDLED_KEY = "stripe_session_handled";

export function StripeReturnHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error" | "cancelled">("idle");
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const hasRun = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
  setStatus("idle");
  hasRun.current = false;
}, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goToReservations = () => {
  setStatus("idle"); // 🔥 ADD THIS LINE
  router.replace("/touriste/reservations");
};

  // Countdown auto-redirect sur succès
  useEffect(() => {
    if (status !== "success") return;
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          goToReservations();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (hasRun.current) return;

    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    // ✅ Vérifier si déjà traité
    const alreadyHandled = sessionId && sessionStorage.getItem(STRIPE_HANDLED_KEY) === sessionId;
    if (alreadyHandled) {
      // ✅ Ne pas appeler cleanUrl() ! Laisser l'URL comme elle est
      // Le user verra l'URL avec les params, c'est normal. Stripe les met là.
      return;
    }

    // Utilisateur a annulé le paiement sur Stripe
    if (canceled === "true") {
      hasRun.current = true;
      setStatus("cancelled");
      return;
    }

    if (!sessionId || success !== "true") return;

    hasRun.current = true;
    sessionStorage.setItem(STRIPE_HANDLED_KEY, sessionId);
    setStatus("verifying");

    // Confirmer le paiement auprès du backend
    const confirm = async (attempt = 0) => {
      try {
        const res = await fetch("/api/paiement/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur serveur");
        if (!data.paid) {
          // ✅ Retry avec backoff exponentiel
          attempt < 8 ? setTimeout(() => confirm(attempt + 1), 2000) : setStatus("success");
          return;
        }
        setStatus("success");
      } catch (err) {
        console.error("[StripeReturnHandler]", err);
        attempt < 5 ? setTimeout(() => confirm(attempt + 1), 2000) : setStatus("error");
      }
    };
    confirm();
  }, [searchParams]);

  if (status === "idle" || !mounted) return null;

  // ─── Styles ────────────────────────────────────────────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2147483647,
  };

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: 24,
    padding: "48px 40px",
    textAlign: "center",
    maxWidth: 420,
    width: "90%",
    boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
    isolation: "isolate",
    position: "relative",
    zIndex: 2147483647,
  };

  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 28px",
    background: "#0D9488",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%",
    pointerEvents: "auto",
    position: "relative",
    zIndex: 1,
  };

  const btnDarkStyle: React.CSSProperties = {
    ...btnStyle,
    background: "#0F172A",
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

  // ─── Contenu selon état ─────────────────────────────────────────────────────

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <>
            <Loader2
              size={52}
              color="#0D9488"
              style={{
                animation: "stripeSpinAnim 1s linear infinite",
                marginBottom: 20,
              }}
            />
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0F172A",
                margin: "0 0 8px",
              }}
            >
              Confirmation en cours…
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
              Vérification et enregistrement de votre paiement
            </p>
          </>
        );

      case "success":
        return (
          <>
            <div style={iconCircle("#F0FDFA", "#99F6E4")}>
              <CheckCircle2 size={40} color="#0D9488" strokeWidth={1.5} />
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0F172A",
                margin: "0 0 10px",
              }}
            >
              Paiement confirmé !
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#64748B",
                lineHeight: 1.7,
                margin: "0 0 6px",
              }}
            >
              Votre réservation est confirmée.
              <br />
              Un email de confirmation vous a été envoyé.
            </p>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 28px" }}>
              Redirection dans {countdown} seconde{countdown !== 1 ? "s" : ""}…
            </p>
            <button
              type="button"
              style={btnStyle}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToReservations();
              }}
            >
              Aller à mes réservations <ArrowRight size={16} />
            </button>
          </>
        );

      case "error":
        return (
          <>
            <div style={iconCircle("#FEF2F2", "#FCA5A5")}>
              <XCircle size={40} color="#EF4444" strokeWidth={1.5} />
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0F172A",
                margin: "0 0 10px",
              }}
            >
              Erreur de vérification
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px" }}>
              Votre paiement a peut-être été traité.
              <br />
              Vérifiez vos réservations.
            </p>
            <button
              type="button"
              style={btnDarkStyle}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToReservations();
              }}
            >
              Voir mes réservations <ArrowRight size={16} />
            </button>
          </>
        );

      case "cancelled":
        return (
          <>
            <div style={iconCircle("#FFF7ED", "#FCD34D")}>
              <XCircle size={40} color="#F59E0B" strokeWidth={1.5} />
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0F172A",
                margin: "0 0 10px",
              }}
            >
              Paiement annulé
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px" }}>
              Votre réservation reste en attente.
              <br />
              Vous pouvez réessayer à tout moment.
            </p>
            <button
              type="button"
              style={btnDarkStyle}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToReservations();
              }}
            >
              Retour aux réservations <ArrowRight size={16} />
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <>
      <style>{`
        @keyframes stripeSpinAnim { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={overlayStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget && status !== "verifying")
            goToReservations();
        }}
      >
        <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
          {renderContent()}
        </div>
      </div>
    </>,
    document.body
  );
}