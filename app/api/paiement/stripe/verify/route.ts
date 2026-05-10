import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const reservation_id = session.metadata?.reservation_id;

    // Double vérification en base si le webhook a bien tourné
    let dbConfirmed = false;
    if (paid && reservation_id) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("reservations")
        .select("payment_status")
        .eq("id", reservation_id)
        .single();
      dbConfirmed = data?.payment_status === "paid";
    }

    return NextResponse.json({
      paid: paid && dbConfirmed,
      stripe_paid: paid,
      db_confirmed: dbConfirmed,
      status: session.payment_status,
      reservation_id,
    });
  } catch (err) {
    console.error("Erreur vérification session:", err);
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }
}