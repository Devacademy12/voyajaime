import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });
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

    // Vérifier que le paiement est bien encaissé
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const reservation_id = session.metadata?.reservation_id;
    if (!reservation_id) {
      return NextResponse.json({ error: "reservation_id manquant" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── 1. Récupérer la réservation complète ──────────────────────
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*, excursions(id, prestataire_id)")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      console.error("Réservation introuvable:", fetchError);
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // ── 2. Idempotence : vérifier si déjà traité ──────────────────
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

    const amount         = reservation.total_price;
    const platform_fee   = reservation.platform_fee;
    const net_amount     = amount - platform_fee;
    const prestataire_id = reservation.excursions?.prestataire_id ?? null;
    const excursion_id   = reservation.excursion_id ?? reservation.excursions?.id ?? null;
    const touriste_id    = reservation.touriste_id ?? null;

    // ── 3. Mettre à jour la réservation ───────────────────────────
    // FIX : payment_status="paid" était manquant → page réservations toujours "pending"
    const { error: reservationError } = await supabase
      .from("reservations")
      .update({
        status:         "confirmed",
        payment_status: "paid",
        paid_at:        new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (reservationError) {
      console.error("Erreur mise à jour réservation:", reservationError);
      return NextResponse.json({ error: "Erreur BDD réservation" }, { status: 500 });
    }

    // ── 4. Insérer dans la table paiements ────────────────────────
    // FIX : touriste_id + excursion_id étaient manquants
    // → dashboards admin et prestataire ne pouvaient pas joindre les données
    const { error: paiementError } = await supabase
      .from("paiements")
      .upsert({
        reservation_id,
        excursion_id,
        touriste_id,
        prestataire_id,
        amount,
        platform_fee,
        net_amount,
        status:            "paid",
        stripe_session_id: session.id,
        created_at:        new Date().toISOString(),
      }, { onConflict: "reservation_id" });

    if (paiementError) {
      console.error("Erreur création paiement (non bloquant):", paiementError);
    }

    console.log(`✅ Paiement confirmé — réservation ${reservation_id} — ${amount} EUR`);
  }

  return NextResponse.json({ received: true });
}