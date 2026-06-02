// StripeReturnHandler.tsx — version corrigée (redirection + bouton fix)
"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

const SPIN_CSS = `@keyframes stripe-spin { to { transform: rotate(360deg); } }
@keyframes stripe-fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`;

const SUCCESS_DISPLAY_MS = 3500;

// Clé unique pour éviter le double-traitement après refresh
const STRIPE_HANDLED_KEY = "stripe_session_handled";

export function StripeReturnHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error" | "cancelled">("idle");
  const hasRun = useRef(false);

  // ── Nettoyer l'URL immédiatement pour éviter la réouverture ──
  const cleanUrl = () => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/touriste/reservations");
    }
  };

  const goToReservations = () => {
    cleanUrl();
    router.replace("/touriste/reservations");
  };

  useEffect(() => {
    if (hasRun.current) return;

    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    // ── Déjà traité (protection double-run) ──
    const alreadyHandled = sessionId && sessionStorage.getItem(STRIPE_HANDLED_KEY) === sessionId;
    if (alreadyHandled) {
      cleanUrl();
      return;
    }

    // ── Paiement annulé ──
    if (canceled === "true") {
      hasRun.current = true;
      cleanUrl(); // ← nettoie l'URL immédiatement
      setStatus("cancelled");
      return;
    }

    if (!sessionId || success !== "true") return;

    hasRun.current = true;
    cleanUrl(); // ← nettoie l'URL immédiatement, avant même la vérification
    sessionStorage.setItem(STRIPE_HANDLED_KEY, sessionId);
    setStatus("verifying");

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
          if (attempt < 8) {
            setTimeout(() => confirm(attempt + 1), 2000);
          } else {
            setStatus("success");
          }
          return;
        }

        setStatus("success");
      } catch (err) {
        console.error("[StripeReturnHandler]", err);
        if (attempt < 5) {
          setTimeout(() => confirm(attempt + 1), 2000);
        } else {
          setStatus("error");
        }
      }
    };

    confirm();
  }, [searchParams]);

  if (status === "idle") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(6px)",
      }}
      // ← clic sur le fond = fermeture si succès/annulé/erreur
      onClick={() => {
        if (status !== "verifying") goToReservations();
      }}
    >
      <style>{SPIN_CSS}</style>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 24,
          padding: "48px 52px",
          textAlign: "center",
          maxWidth: 400,
          width: "90%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
          animation: "stripe-fadeIn 0.25s ease both",
        }}
        onClick={(e) => e.stopPropagation()} // évite fermeture au clic sur la modale
      >

        {/* ── Vérification ── */}
        {status === "verifying" && (
          <>
            <Loader2
              size={52}
              color="#0D9488"
              style={{ animation: "stripe-spin 1s linear infinite", marginBottom: 20 }}
            />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
              Confirmation en cours…
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
              Vérification et enregistrement de votre paiement
            </p>
          </>
        )}

        {/* ── Succès ── */}
        {status === "success" && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#F0FDFA", border: "2.5px solid #99F6E4",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle2 size={40} color="#0D9488" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
              Paiement confirmé !
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: "0 0 24px" }}>
              Votre réservation est confirmée.<br />
              Un email de confirmation vous a été envoyé.
            </p>
            <button
              onClick={goToReservations}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "#0D9488",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0F766E")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0D9488")}
            >
              Voir mes réservations
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Erreur réseau ── */}
        {status === "error" && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#FEF2F2", border: "2.5px solid #FCA5A5",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <XCircle size={40} color="#EF4444" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
              Erreur de vérification
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px" }}>
              Votre paiement a peut-être été traité. Vérifiez vos réservations.
            </p>
            <button
              onClick={goToReservations}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "#0F172A",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Voir mes réservations
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Annulé ── */}
        {status === "cancelled" && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#FFF7ED", border: "2.5px solid #FCD34D",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <XCircle size={40} color="#F59E0B" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
              Paiement annulé
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px" }}>
              Votre réservation reste en attente. Vous pouvez réessayer à tout moment.
            </p>
            <button
              onClick={goToReservations}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "#0F172A",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Retour aux réservations
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}