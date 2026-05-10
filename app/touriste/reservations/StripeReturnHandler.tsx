"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function StripeReturnHandler() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "cancelled">("idle");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const success   = searchParams.get("success");
    const canceled  = searchParams.get("canceled");

    if (canceled) {
      setStatus("cancelled");
      setTimeout(() => router.replace("/touriste/reservations"), 3500);
      return;
    }

    if (!sessionId || success !== "true") return;

    setStatus("verifying");

    const checkPayment = async (attempt = 0) => {
      try {
        const res  = await fetch(`/api/paiement/stripe/verify?session_id=${sessionId}`);
        const data = await res.json();

        if (data.paid) {
          setStatus("success");
          setTimeout(() => router.replace("/touriste/reservations"), 4000);
        } else if (attempt < 5) {
          // Webhook pas encore traité — réessayer jusqu'à 5 fois toutes les 2s
          setTimeout(() => checkPayment(attempt + 1), 2000);
        } else {
          // Après 10s, afficher succès quand même si Stripe confirme
          if (data.stripe_paid) {
            setStatus("success");
            setTimeout(() => router.replace("/touriste/reservations"), 4000);
          }
        }
      } catch {
        setStatus("success");
        setTimeout(() => router.replace("/touriste/reservations"), 4000);
      }
    };

    checkPayment();
  }, [searchParams, router]);

  if (status === "idle") return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 24, padding: "48px 52px",
        textAlign: "center", maxWidth: 380, width: "90%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
      }}>
        {status === "verifying" && (
          <>
            <Loader2
              size={52} color="#0D9488"
              style={{ animation: "spin 1s linear infinite", marginBottom: 20 }}
            />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 8, margin: "0 0 8px" }}>
              Confirmation en cours…
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
              Vérification de votre paiement
            </p>
          </>
        )}

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
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: 0 }}>
              Votre réservation est confirmée.<br />Un email de confirmation vous a été envoyé.
            </p>
          </>
        )}

        {status === "cancelled" && (
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
              Paiement annulé
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
              Votre réservation reste en attente. Vous pouvez réessayer.
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}