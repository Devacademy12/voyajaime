// app/api/paiement/stripe/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Variables d'environnement Stripe/Supabase manquantes");
      return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
    }

    // ── 1. Récupérer la session Stripe ──────────────────────────────
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ paid: false }, { status: 200 });
    }

    const reservationId = session.metadata?.reservation_id;
    const prestataireId = session.metadata?.prestataire_id || null;
    const amount        = Number(session.metadata?.amount        || session.amount_total! / 100);
    const platformFee   = Number(session.metadata?.platform_fee  || (amount * 0.10).toFixed(2));
    const netAmount     = Number(session.metadata?.net_amount    || (amount * 0.90).toFixed(2));

    if (!reservationId) {
      return NextResponse.json({ error: "reservation_id manquant dans metadata" }, { status: 400 });
    }

    // ── 2. Upsert paiements (admin — bypass RLS) ─────────────────────
    const { error: upsertError } = await supabaseAdmin
      .from("paiements")
      .upsert(
        {
          reservation_id: reservationId,
          prestataire_id: prestataireId,
          amount,
          platform_fee: platformFee,
          net_amount:   netAmount,
          status:       "paid",
          paid_at:      new Date().toISOString(),
        },
        { onConflict: "reservation_id", ignoreDuplicates: false }
      );

    if (upsertError) {
      console.error("[confirm] upsert paiements:", upsertError.message);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // ── 3. Mettre à jour la réservation ──────────────────────────────
    const { error: resaError } = await supabaseAdmin
      .from("reservations")
      .update({
        status:         "confirmed",
        payment_status: "paid",
        payment_method: "stripe",
        paid_at:        new Date().toISOString(),
      })
      .eq("id", reservationId)
      .neq("status", "cancelled");

    if (resaError) {
      console.error("[confirm] update reservations:", resaError.message);
      return NextResponse.json({ error: resaError.message }, { status: 500 });
    }

    // ── 4. Mettre à jour reservation_itineraires (non bloquant) ─────
    await supabaseAdmin
      .from("reservation_itineraires")
      .update({ payment_status: "paid" })
      .eq("reservation_id", reservationId);

    return NextResponse.json({ paid: true, reservation_id: reservationId });

  } catch (err: any) {
    console.error("[confirm] erreur:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}