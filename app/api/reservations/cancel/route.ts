/**
 * Endpoint pour annuler une réservation avec remboursement conditionnel
 * - >= 24h : 100%
 * - < 24h : 50%
 * - passé : 0%
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

    // Auth user
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupération réservation
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select("*, paiements(*)")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // check owner
    if (reservation.touriste_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // déjà annulée
    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Déjà annulée" },
        { status: 400 }
      );
    }

    // statut valide
    if (
      reservation.status !== "confirmed" &&
      reservation.status !== "completed"
    ) {
      return NextResponse.json(
        { error: "Réservation non annulable" },
        { status: 400 }
      );
    }

    // ─────────────────────────────
    // CALCUL REMBOURSEMENT
    // ─────────────────────────────
    let refundPercentage = 0;
    let refundAmount = 0;
    let refundReason = "";

    try {
      const timeStr = String(reservation.time || "00:00").slice(0, 5);

      const [year, month, day] = reservation.date.split("-");
      const [hour, minute] = timeStr.split(":");

      const excursionDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
      );

      const now = new Date();
      const diffHours =
        (excursionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      const diffMinutes = Math.round(
        ((excursionDate.getTime() - now.getTime()) %
          (1000 * 60 * 60)) /
          (1000 * 60)
      );

      if (diffHours >= 24) {
        refundPercentage = 100;
        refundAmount = reservation.total_price;
        refundReason = `Annulation > 24h (${Math.floor(diffHours)}h restantes)`;
      } else if (diffHours > 0) {
        refundPercentage = 50;
        refundAmount = Math.round(reservation.total_price * 0.5 * 100) / 100;
        refundReason = `Annulation < 24h (${Math.floor(
          diffHours
        )}h${diffMinutes}min restantes)`;
      } else {
        refundPercentage = 0;
        refundAmount = 0;
        refundReason = "Excursion déjà passée";
      }
    } catch (e) {
      console.error("Erreur calcul remboursement:", e);
      return NextResponse.json(
        { error: "Erreur calcul remboursement" },
        { status: 500 }
      );
    }

    // ─────────────────────────────
    // STRIPE REFUND
    // ─────────────────────────────
    const paiement = reservation.paiements?.[0];
    let stripeRefundId: string | null = null;

    if (paiement?.status === "paid" && refundAmount > 0) {
      try {
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
        });

        const session = sessions.data.find(
          (s) => s.metadata?.reservation_id === reservation_id
        );

        if (session?.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string
          );

          const charge = paymentIntent.charges.data[0];

          if (charge) {
            const refund = await stripe.refunds.create({
              charge: charge.id,
              amount: Math.round(refundAmount * 100),
              metadata: {
                reservation_id,
                refund_percentage: refundPercentage,
              },
            });

            stripeRefundId = refund.id;
          }
        }
      } catch (err) {
        console.error("Stripe refund error:", err);
      }
    }

    // ─────────────────────────────
    // UPDATE RESERVATION
    // ─────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || refundReason,
      })
      .eq("id", reservation_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Erreur annulation" },
        { status: 500 }
      );
    }

    // ─────────────────────────────
    // UPDATE PAIEMENT
    // ─────────────────────────────
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

    // ─────────────────────────────
    // RESTORE SLOTS
    // ─────────────────────────────
    try {
      await supabaseAdmin.rpc("restore_slots_on_cancel", {
        p_reservation_id: reservation_id,
      });
    } catch (e) {
      console.warn("restore slots error:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Annulée avec remboursement ${refundPercentage}%`,
      data: {
        reservation_id,
        refund_percentage: refundPercentage,
        refund_amount: refundAmount,
        stripe_refund_id: stripeRefundId,
      },
    });
  } catch (error) {
    console.error("Cancel API error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}