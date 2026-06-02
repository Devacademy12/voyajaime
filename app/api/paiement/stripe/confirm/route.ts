// app/api/paiement/stripe/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { notifyReservationConfirmed } from "@/lib/notifications";

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

    // ── 2. Récupérer la réservation ─────────────────────────────────
    const { data: reservationData, error: reservationFetchError } = await supabaseAdmin
      .from("reservations")
      .select(`id, touriste_id, excursion_id, date, time, people_count, booking_code, total_price, platform_fee, excursions(id, title, city, prestataire_id)`)
      .eq("id", reservationId)
      .single();

    if (reservationFetchError || !reservationData) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const reservation = reservationData as any;
    const excursion = firstRow(reservation.excursions as any);
    const prestataireId = excursion?.prestataire_id ?? null;
    const amount = Number(reservation.total_price ?? session.amount_total! / 100);
    const platformFee = Number(reservation.platform_fee ?? (amount * 0.1).toFixed(2));
    const netAmount = Number((amount - platformFee).toFixed(2));
    const paidAt = new Date().toISOString();

    // ── 3. Enregistrer le paiement ──────────────────────────────────
    const paiementPayload = {
      reservation_id: reservationId,
      prestataire_id: prestataireId,
      amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: "paid",
      paid_at: paidAt,
      stripe_session_id: session.id,
    };

    const { data: existingPaiement } = await supabaseAdmin
      .from("paiements")
      .select("id")
      .eq("reservation_id", reservationId)
      .maybeSingle();

    if (existingPaiement?.id) {
      await supabaseAdmin.from("paiements").update(paiementPayload).eq("id", existingPaiement.id);
    } else {
      await supabaseAdmin.from("paiements").insert(paiementPayload);
    }

    // ── 4. ✅ METTRE À JOUR LA RÉSERVATION ──────────────────────────
    const { error: reservationUpdateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status:         "confirmed",
        payment_status: "paid",
        paid_at:        paidAt,
      })
      .eq("id", reservationId)
      .neq("status", "cancelled");

    if (reservationUpdateError) {
      console.error("[confirm] update reservation:", reservationUpdateError.message);
      // Non bloquant
    }

    const [touristeProfile, prestataireProfile] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, full_name").eq("user_id", reservation.touriste_id).single(),
      prestataireId
        ? supabaseAdmin.from("profiles").select("user_id, full_name, agency_name").eq("user_id", prestataireId).single()
        : Promise.resolve({ data: null }),
    ]);

    if (touristeProfile.data) {
      await notifyReservationConfirmed({
        reservation: {
          id: reservationId,
          date: reservation.date,
          time: reservation.time,
          people_count: reservation.people_count,
          total_price: amount,
          booking_code: reservation.booking_code,
        },
        excursion: {
          title: excursion?.title || "Excursion",
          city: excursion?.city || "Tunisie",
        },
        touriste: {
          userId: reservation.touriste_id,
          role: "touriste",
          fullName: touristeProfile.data.full_name,
        },
        prestataire: {
          userId: prestataireId || "",
          role: "prestataire",
          fullName: prestataireProfile?.data?.full_name || null,
          agencyName: prestataireProfile?.data?.agency_name || null,
        },
      });
    }

    return NextResponse.json({ paid: true, reservation_id: reservationId });

  } catch (err: any) {
    console.error("[confirm] erreur:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}