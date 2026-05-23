// app/api/paiement/stripe/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function firstRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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

    if (!reservationId) {
      return NextResponse.json({ error: "reservation_id manquant dans metadata" }, { status: 400 });
    }

    const { data: reservationData, error: reservationFetchError } = await supabaseAdmin
      .from("reservations")
      .select(`
        id,
        touriste_id,
        excursion_id,
        total_price,
        platform_fee,
        excursions ( id, prestataire_id )
      `)
      .eq("id", reservationId)
      .single();

    if (reservationFetchError || !reservationData) {
      console.error("[confirm] reservation fetch:", reservationFetchError?.message);
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const reservation = reservationData as any;
    const excursion = firstRow(reservation.excursions as any);
    const prestataireId = excursion?.prestataire_id ?? null;
    const excursionId = reservation.excursion_id ?? excursion?.id ?? null;
    const amount = Number(reservation.total_price ?? session.amount_total! / 100);
    const platformFee = Number(reservation.platform_fee ?? (amount * 0.1).toFixed(2));
    const netAmount = Number((amount - platformFee).toFixed(2));
    const paidAt = new Date().toISOString();

    // ── 2. Enregistrer le paiement en base ─────────────────────────
    const paiementPayload = {
      reservation_id: reservationId,
      prestataire_id: prestataireId,
      excursion_id: excursionId,
      touriste_id: reservation.touriste_id ?? null,
      amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: "paid",
      paid_at: paidAt,
    };

    const { data: existingPaiement, error: existingPaiementError } = await supabaseAdmin
      .from("paiements")
      .select("id")
      .eq("reservation_id", reservationId)
      .maybeSingle();

    if (existingPaiementError) {
      console.error("[confirm] select paiements:", existingPaiementError.message);
      return NextResponse.json({ error: existingPaiementError.message }, { status: 500 });
    }

    if (existingPaiement?.id) {
      const { error: updatePaiementError } = await supabaseAdmin
        .from("paiements")
        .update(paiementPayload)
        .eq("id", existingPaiement.id);

      if (updatePaiementError) {
        console.error("[confirm] update paiements:", updatePaiementError.message);
        return NextResponse.json({ error: updatePaiementError.message }, { status: 500 });
      }
    } else {
      const { error: insertPaiementError } = await supabaseAdmin
        .from("paiements")
        .insert(paiementPayload);

      if (insertPaiementError) {
        console.error("[confirm] insert paiements:", insertPaiementError.message);
        return NextResponse.json({ error: insertPaiementError.message }, { status: 500 });
      }
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
    const { error: itinError } = await supabaseAdmin
      .from("reservation_itineraires")
      .update({ payment_status: "paid" })
      .eq("reservation_id", reservationId);

    if (itinError) {
      console.warn("[confirm] update reservation_itineraires:", itinError.message);
    }

    return NextResponse.json({ paid: true, reservation_id: reservationId });

  } catch (err: any) {
    console.error("[confirm] erreur:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}