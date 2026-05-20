// StripeReturnHandler.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const SPIN_CSS = `@keyframes stripe-spin { to { transform: rotate(360deg); } }`;
const SUCCESS_DISPLAY_MS = 3000;

export function StripeReturnHandler() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error" | "cancelled">("idle");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    const sessionId = searchParams.get("session_id");
    const success   = searchParams.get("success");
    const canceled  = searchParams.get("canceled");

    /* ── Paiement annulé (retour depuis Stripe) ── */
    if (canceled === "true") {
      setStatus("cancelled");
      setTimeout(() => router.replace("/touriste/reservations"), 3500);
      return;
    }

    if (!sessionId || success !== "true") return;

    hasRun.current = true;
    setStatus("verifying");

    const confirm = async (attempt = 0) => {
      try {
        const res = await fetch("/api/paiement/stripe/confirm", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ session_id: sessionId }),
        });

        // ✅ Lire le texte brut d'abord pour éviter "Unexpected end of JSON input"
        const text = await res.text();
        let data: Record<string, unknown> = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(`Réponse invalide du serveur (${res.status})`);
        }

        if (!res.ok) throw new Error((data.error as string) || "Erreur serveur");

        if (!data.paid) {
          /* Webhook pas encore traité — réessayer jusqu'à 8 fois (16 sec) */
          if (attempt < 8) {
            setTimeout(() => confirm(attempt + 1), 2000);
          } else {
            /* Timeout : rediriger quand même, le webhook terminera le travail */
            setStatus("success");
            setTimeout(() => router.replace("/touriste/reservations"), SUCCESS_DISPLAY_MS);
          }
          return;
        }

        /* ── Succès ── */
        setStatus("success");
        setTimeout(() => router.replace("/touriste/reservations"), SUCCESS_DISPLAY_MS);

      } catch (err) {
        console.error("[StripeReturnHandler]", err);
        if (attempt < 5) {
          setTimeout(() => confirm(attempt + 1), 2000);
        } else {
          setStatus("error");
          setTimeout(() => router.replace("/touriste/reservations"), 3000);
        }
      }
    };

    confirm();
  }, [searchParams, router]);

  if (status === "idle") return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, backdropFilter: "blur(4px)",
    }}>
      <style>{SPIN_CSS}</style>

      <div style={{
        background: "#FFFFFF", borderRadius: 24,
        padding: "48px 52px", textAlign: "center",
        maxWidth: 380, width: "90%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
      }}>

        {/* ── Vérification ── */}
        {status === "verifying" && (
          <>
            <Loader2
              size={52} color="#0D9488"
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
            <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: "0 0 8px" }}>
              Votre réservation est confirmée.<br />
              Un email de confirmation vous a été envoyé.
            </p>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 20px" }}>
              Redirection dans {SUCCESS_DISPLAY_MS / 1000} secondes…
            </p>
            <button
              onClick={() => router.replace("/touriste/reservations")}
              style={{
                background: "#0D9488", color: "#FFFFFF",
                border: "none", borderRadius: 8,
                padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#0B7A70")}
              onMouseOut={e  => (e.currentTarget.style.background = "#0D9488")}
            >
              Aller à mes réservations
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
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
              Votre paiement a peut-être été traité. Vérifiez vos réservations.
            </p>
            <button
              onClick={() => router.replace("/touriste/reservations")}
              style={{ background: "#EF4444", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Voir mes réservations
            </button>
          </>
        )}

        {/* ── Paiement annulé ── */}
        {status === "cancelled" && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#FFF7ED", border: "2.5px solid #FED7AA",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <XCircle size={40} color="#F59E0B" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
              Paiement annulé
            </h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
              Votre réservation reste en attente.<br />Vous pouvez réessayer depuis Mes réservations.
            </p>
            <button
              onClick={() => router.replace("/touriste/reservations")}
              style={{ background: "#F59E0B", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Retour aux réservations
            </button>
          </>
        )}
      </div>
    </div>
  );
}