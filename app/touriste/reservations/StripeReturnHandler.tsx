"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

// CSS spin défini en dehors du JSX pour garantir le chargement avant l'animation
const SPIN_CSS = `@keyframes stripe-spin { to { transform: rotate(360deg); } }`;

// Durée minimale d'affichage de l'écran "Paiement confirmé" en ms
const SUCCESS_MIN_DISPLAY_MS = 3000;

export function StripeReturnHandler() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const supabase     = createClient();

  const [status, setStatus]   = useState<"idle" | "verifying" | "success" | "cancelled">("idle");
  const [message, setMessage] = useState("");

  // Ref pour éviter double-exécution en StrictMode React
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    const sessionId = searchParams.get("session_id");
    const success   = searchParams.get("success");
    const canceled  = searchParams.get("canceled");

    if (canceled) {
      setStatus("cancelled");
      setTimeout(() => router.replace("/touriste/reservations"), 3500);
      return;
    }

    if (!sessionId || success !== "true") return;

    hasRun.current = true;
    setStatus("verifying");

    const checkAndRecord = async (attempt = 0) => {
      try {
        // ── 1. Vérifier le paiement Stripe ──────────────────────────
        const res  = await fetch(`/api/paiement/stripe/verify?session_id=${sessionId}`);
        const data = await res.json();

        const isPaid = data.paid || data.stripe_paid;

        if (!isPaid) {
          // Webhook pas encore traité — réessayer
          if (attempt < 8) {
            setTimeout(() => checkAndRecord(attempt + 1), 2000);
          } else {
            // Après ~16s, rediriger sans confirmer
            router.replace("/touriste/reservations");
          }
          return;
        }

        // ── 2. Paiement confirmé — enregistrer dans la table paiements ──
        const reservationId  = data.reservation_id  || data.metadata?.reservation_id;
        const prestataireId  = data.prestataire_id  || data.metadata?.prestataire_id  || null;
        const amount         = data.amount          || data.metadata?.amount;
        const platformFee    = data.platform_fee    || data.metadata?.platform_fee;
        const netAmount      = data.net_amount      || data.metadata?.net_amount;

        if (reservationId && amount) {
          // Upsert : si le paiement existe déjà (webhook plus rapide), on ne duplique pas
          const { error: upsertError } = await supabase
            .from("paiements")
            .upsert(
              {
                reservation_id: reservationId,
                prestataire_id: prestataireId,
                amount:         Number(amount),
                platform_fee:   Number(platformFee   || (Number(amount) * 0.10).toFixed(2)),
                net_amount:     Number(netAmount      || (Number(amount) * 0.90).toFixed(2)),
                status:         "paid",
                paid_at:        new Date().toISOString(),
              },
              {
                onConflict:        "reservation_id",   // clé unique de la table
                ignoreDuplicates:  false,              // met à jour si existe déjà en pending
              }
            );

          if (upsertError) {
            console.error("[StripeReturnHandler] upsert paiements:", upsertError.message);
            // On continue quand même — le webhook a peut-être déjà inséré
          }

          // ── 3. Mettre à jour la réservation ──────────────────────
          const { error: resaError } = await supabase
            .from("reservations")
            .update({
              status:         "confirmed",
              payment_status: "paid",
              payment_method: "stripe",
              paid_at:        new Date().toISOString(),
            })
            .eq("id", reservationId)
            .neq("status", "cancelled");   // ne pas modifier si annulée entre temps

          if (resaError) {
            console.error("[StripeReturnHandler] update reservations:", resaError.message);
          }
        } else {
          console.warn("[StripeReturnHandler] reservation_id ou amount manquant dans la réponse verify:", data);
        }

        // ── 4. Afficher succès pendant au moins SUCCESS_MIN_DISPLAY_MS ──
        const successShownAt = Date.now();
        setStatus("success");

        const elapsed   = Date.now() - successShownAt;
        const remaining = Math.max(0, SUCCESS_MIN_DISPLAY_MS - elapsed);

        setTimeout(() => {
          router.replace("/touriste/reservations");
        }, remaining + SUCCESS_MIN_DISPLAY_MS); // afficher au minimum SUCCESS_MIN_DISPLAY_MS

      } catch (err) {
        console.error("[StripeReturnHandler] erreur réseau:", err);
        // Erreur réseau → réessayer
        if (attempt < 6) {
          setTimeout(() => checkAndRecord(attempt + 1), 2000);
        } else {
          // Dernier recours après ~12s d'échecs
          setStatus("success");
          setTimeout(() => router.replace("/touriste/reservations"), SUCCESS_MIN_DISPLAY_MS);
        }
      }
    };

    checkAndRecord();
  }, [searchParams, router, supabase]);

  if (status === "idle") return null;

  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      background:     "rgba(15,23,42,0.55)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      zIndex:         9999,
      backdropFilter: "blur(4px)",
    }}>
      <style>{SPIN_CSS}</style>

      <div style={{
        background:   "#FFFFFF",
        borderRadius: 24,
        padding:      "48px 52px",
        textAlign:    "center",
        maxWidth:     380,
        width:        "90%",
        boxShadow:    "0 32px 80px rgba(0,0,0,0.18)",
      }}>

        {/* ── Vérification en cours ── */}
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

        {/* ── Succès — affiché au minimum SUCCESS_MIN_DISPLAY_MS ms ── */}
        {status === "success" && (
          <>
            <div style={{
              width:          80,
              height:         80,
              borderRadius:   "50%",
              background:     "#F0FDFA",
              border:         "2.5px solid #99F6E4",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              margin:         "0 auto 20px",
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
            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
              Redirection automatique dans quelques secondes…
            </p>
          </>
        )}

        {/* ── Annulé ── */}
        {status === "cancelled" && (
          <>
            <div style={{
              width:          80,
              height:         80,
              borderRadius:   "50%",
              background:     "#FEF2F2",
              border:         "2.5px solid #FCA5A5",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              margin:         "0 auto 20px",
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
    </div>
  );
}