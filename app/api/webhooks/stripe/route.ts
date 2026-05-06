import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Signature webhook invalide:", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reservation_id = session.metadata?.reservation_id;

    if (!reservation_id) {
      return NextResponse.json({ error: "reservation_id manquant" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Récupérer la réservation pour calculer les montants
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*, excursions(prestataire_id)")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      console.error("Réservation introuvable:", fetchError);
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const amount = reservation.total_price;
    const platform_fee = reservation.platform_fee;
    const net_amount = amount - platform_fee;

    // Idempotence : vérifier si déjà traité
    const { data: existingPaiement } = await supabase
      .from("paiements")
      .select("id")
      .eq("reservation_id", reservation_id)
      .eq("status", "paid")
      .single();

    if (existingPaiement) {
      console.log(`⚠️ Paiement déjà traité pour réservation ${reservation_id}`);
      return NextResponse.json({ received: true });
    }

    // Mettre à jour le statut de la réservation
    const { error: reservationError } = await supabase
      .from("reservations")
      .update({ status: "confirmed" })
      .eq("id", reservation_id);

    if (reservationError) {
      console.error("Erreur mise à jour réservation:", reservationError);
      return NextResponse.json({ error: "Erreur BDD" }, { status: 500 });
    }

    // Créer ou mettre à jour l'enregistrement paiement
    const { error: paiementError } = await supabase
      .from("paiements")
      .upsert({
        reservation_id,
        prestataire_id: reservation.excursions.prestataire_id,
        amount,
        platform_fee,
        net_amount,
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_session_id: session.id,
      }, { onConflict: "reservation_id" });

    if (paiementError) {
      console.error("Erreur création paiement:", paiementError);
      return NextResponse.json({ error: "Erreur paiement BDD" }, { status: 500 });
    }

    console.log(`✅ Paiement confirmé pour réservation ${reservation_id}`);
  }

  return NextResponse.json({ received: true });
}