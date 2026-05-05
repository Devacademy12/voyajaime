import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabaseClient";

// Initialiser Stripe avec votre clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  console.log("📡 API Stripe Checkout appelée");
  
  try {
    // 1. Récupérer les données de la requête
    const body = await req.json();
    const { reservation_id, special_notes, amount } = body;
    
    console.log("📝 Données reçues:", { reservation_id, amount });
    
    // 2. Vérifier que la réservation existe
    const supabase = createClient();
    
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*, excursions(*)")
      .eq("id", reservation_id)
      .single();
    
    if (fetchError || !reservation) {
      console.error("❌ Réservation non trouvée:", fetchError);
      return NextResponse.json(
        { error: "Réservation introuvable" },
        { status: 404 }
      );
    }
    
    console.log("✅ Réservation trouvée:", reservation.booking_code);
    
    // 3. Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "tnd",
            product_data: {
              name: reservation.excursions.title,
              description: `Excursion du ${reservation.date} à ${reservation.time} pour ${reservation.people_count} personne(s)`,
              metadata: {
                booking_code: reservation.booking_code,
              },
            },
            unit_amount: Math.round(amount * 1000), // Conversion TND → millimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/touriste/reservations?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get("origin")}/touriste/reservations?canceled=true`,
      metadata: {
        reservation_id: reservation_id,
        booking_code: reservation.booking_code,
      },
      customer_email: (await supabase.auth.getUser()).data.user?.email,
    });
    
    console.log("✅ Session Stripe créée:", session.id);
    
    // 4. Sauvegarder l'ID de session dans la réservation
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ 
        payment_intent_id: session.id,
        special_notes: special_notes || null 
      })
      .eq("id", reservation_id);
    
    if (updateError) {
      console.warn("⚠️ Erreur mise à jour réservation:", updateError);
    }
    
    // 5. Retourner l'URL de paiement
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error("❌ Erreur Stripe:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de paiement" },
      { status: 500 }
    );
  }
}