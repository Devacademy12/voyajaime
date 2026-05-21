// app/api/reservations/cancel/route.ts
/**
 * Endpoint pour annuler une réservation avec remboursement conditionnel
 * - Si annulation >= 24h avant la date: remboursement 100% (gratuit)
 * - Si annulation < 24h avant la date: remboursement 50%
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservation_id, reason } = body;

    if (!reservation_id) {
      return NextResponse.json(
        { error: "ID de réservation requis" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createServerSupabaseClient();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
    });

    // Vérifier l'authentification
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer la réservation
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select("*, paiements(*)")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      console.error("❌ Réservation non trouvée:", fetchError);
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (reservation.touriste_id !== user.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Réservation déjà annulée" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation est confirmée (payée)
    if (reservation.status !== "confirmed" && reservation.status !== "completed") {
      return NextResponse.json(
        { error: "Seules les réservations confirmées peuvent être annulées" },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────────────
    // Calculer le remboursement en fonction du timing
    // ──────────────────────────────────────────────────
    try {
      const excursionTime = reservation.time || "00:00";
      const timeStr = String(excursionTime).slice(0, 5); // Récupère HH:MM
      
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
      const minutesLeft = Math.round((millisecondsLeft % (1000 * 60 * 60)) / (1000 * 60));

      console.log(`[DEBUG] Date excursion: ${excursionDateTime.toISOString()}`);
      console.log(`[DEBUG] Maintenant: ${now.toISOString()}`);
      console.log(`[DEBUG] Heures restantes: ${hoursLeft}`);

      let refundPercentage = 0;
      let refundAmount = 0;
      let refundReason = "";

      if (hoursLeft >= 24) {
        // Remboursement 100% (gratuit)
        refundPercentage = 100;
        refundAmount = reservation.total_price;
        refundReason = `Annulation > 24h avant l'excursion (${Math.floor(hoursLeft)}h restantes)`;
      } else if (hoursLeft > 0) {
        // Remboursement 50%
        refundPercentage = 50;
        refundAmount = Math.round((reservation.total_price * 50) / 100 * 100) / 100;
        refundReason = `Annulation < 24h avant l'excursion (${Math.floor(hoursLeft)}h${minutesLeft}min restantes)`;
      } else {
        // Excursion déjà commencée ou passée
        refundPercentage = 0;
        refundAmount = 0;
        refundReason = "Excursion déjà commencée ou passée";
      }

      console.log(`[DEBUG] Remboursement: ${refundPercentage}% (${refundAmount} EUR)`);
    } catch (timeError) {
      console.error("❌ Erreur calcul remboursement:", timeError);
      return NextResponse.json(
        { error: "Erreur lors du calcul du remboursement" },
        { status: 500 }
      );
    }

    // ──────────────────────────────────────────────────
    // Traiter le remboursement Stripe
    // ──────────────────────────────────────────────────
    const paiement = reservation.paiements?.[0];
    let stripeRefundId: string | null = null;

    if (paiement && paiement.status === "paid" && refundAmount > 0) {
      try {
        // Récupérer la charge Stripe depuis la session de paiement
        const { data: { user: stripeUser } } = await supabaseServer.auth.getUser();
        
        // Chercher la session de paiement associée
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
        });

        const session = sessions.data.find(
          (s) => s.metadata?.reservation_id === reservation_id
        );

        if (session && session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string
          );

          if (paymentIntent.charges.data.length > 0) {
            const charge = paymentIntent.charges.data[0];

            // Créer le remboursement
            const refund = await stripe.refunds.create({
              charge: charge.id,
              amount: Math.round(refundAmount * 100), // centimes
              reason: refundPercentage === 100 ? "requested_by_customer" : "requested_by_customer",
              metadata: {
                reservation_id,
                refund_percentage: refundPercentage,
              },
            });

            stripeRefundId = refund.id;
            console.log("✅ Remboursement Stripe créé:", refund.id);
          }
        }
      } catch (stripeError) {
        console.error("❌ Erreur remboursement Stripe:", stripeError);
        // Continuer même si le remboursement échoue
      }
    }

    // ──────────────────────────────────────────────────
    // Mettre à jour la réservation
    // ──────────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || refundReason,
      })
      .eq("id", reservation_id);

    if (updateError) {
      console.error("❌ Erreur mise à jour réservation:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de l'annulation" },
        { status: 500 }
      );
    }

    // ──────────────────────────────────────────────────
    // Mettre à jour le paiement
    // ──────────────────────────────────────────────────
    if (paiement && refundAmount > 0) {
      await supabaseAdmin
        .from("paiements")
        .update({
          status: "refunded",
          refund_amount: refundAmount,
          refund_percentage: refundPercentage,
          stripe_refund_id: stripeRefundId,
        })
        .eq("id", paiement.id);
    }

    // ──────────────────────────────────────────────────
    // Restaurer les places disponibles
    // ──────────────────────────────────────────────────
    try {
      await supabaseAdmin.rpc("restore_slots_on_cancel", {
        p_reservation_id: reservation_id,
      });
    } catch (e) {
      console.warn("⚠️ Erreur restauration places:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Réservation annulée. Remboursement: ${refundPercentage}% (${refundAmount.toLocaleString("fr-FR")} EUR)`,
      data: {
        reservation_id,
        status: "cancelled",
        refund_percentage: refundPercentage,
        refund_amount: refundAmount,
        stripe_refund_id: stripeRefundId,
        reason: refundReason,
      },
    });

  } catch (error) {
    console.error("❌ Erreur annulation:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur serveur",
      },
      { status: 500 }
    );
  }
}
