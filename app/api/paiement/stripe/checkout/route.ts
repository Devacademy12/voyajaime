import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservation_id, special_notes, amount } = body;

    const supabaseAdmin = createAdminClient();
    const supabaseServer = await createServerSupabaseClient();

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select("*, excursions(*)")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) {
      console.error("❌ Réservation non trouvée:", fetchError);
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const { data: { user } } = await supabaseServer.auth.getUser();

    // Vérifier que l'utilisateur est bien le propriétaire de la réservation
    if (!user || reservation.touriste_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier que la réservation n'est pas déjà payée
    if (reservation.status === "confirmed" || reservation.status === "completed") {
      return NextResponse.json({ error: "Réservation déjà payée" }, { status: 400 });
    }

    // Montant calculé côté serveur (jamais depuis le client)
    const serverAmount = reservation.total_price;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "tnd",
            product_data: {
              name: reservation.excursions.title,
              description: `Excursion du ${reservation.date} à ${reservation.time} pour ${reservation.people_count} personne(s)`,
            },
            unit_amount: Math.round(serverAmount * 1000),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/touriste/reservations?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get("origin")}/touriste/reservations?canceled=true`,
      metadata: {
        reservation_id,
        booking_code: reservation.booking_code,
      },
      customer_email: user?.email,
    });

    await supabaseAdmin
      .from("reservations")
      .update({
        payment_intent_id: session.id,
        special_notes: special_notes || null,
      })
      .eq("id", reservation_id);

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("❌ Erreur Stripe:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de paiement" },
      { status: 500 }
    );
  }
}