// ─────────────────────────────────────────────
//  app/api/paiement/flouci/route.ts
//  Intégration Flouci — gateway de paiement tunisien
//  Doc : https://flouci.com/api/docs
// ─────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const FLOUCI_APP_TOKEN   = process.env.FLOUCI_APP_TOKEN!;
const FLOUCI_APP_SECRET  = process.env.FLOUCI_APP_SECRET!;
const FLOUCI_ACCEPT_CARD = process.env.FLOUCI_ACCEPT_CARD ?? "true";
const APP_URL            = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ─── POST /api/paiement/flouci ────────────────────────────────────────
   Body : { reservation_id: string }
   Retourne : { payment_url: string, payment_id: string }
──────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { reservation_id } = body as { reservation_id?: string };

  if (!reservation_id) {
    return NextResponse.json({ error: "reservation_id manquant" }, { status: 400 });
  }

  // Vérifier que la réservation appartient au touriste connecté
  const { data: resa, error: resaErr } = await supabase
    .from("reservations")
    .select("id, total_price, status, payment_status, touriste_id, excursion:excursions(title)")
    .eq("id", reservation_id)
    .eq("touriste_id", user.id)
    .single();

  if (resaErr || !resa) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  if (resa.payment_status === "paid") {
    return NextResponse.json({ error: "Cette réservation est déjà payée" }, { status: 400 });
  }

  // Montant en millimes (1 TND = 1000 millimes)
  const amountMillimes = Math.round(Number(resa.total_price) * 1000);

  // Créer le paiement Flouci
  const flouciRes = await fetch("https://developers.flouci.com/api/generate_payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_token:   FLOUCI_APP_TOKEN,
      app_secret:  FLOUCI_APP_SECRET,
      amount:      amountMillimes,
      accept_card: FLOUCI_ACCEPT_CARD === "true",
      session_id:  reservation_id,
      success_link: `${APP_URL}/touriste/reservations?payment=success&resa=${reservation_id}`,
      fail_link:    `${APP_URL}/touriste/reservations?payment=failed&resa=${reservation_id}`,
      developer_tracking_id: `resa_${reservation_id}`,
    }),
  });

  if (!flouciRes.ok) {
    const errText = await flouciRes.text();
    console.error("[Flouci] Erreur génération paiement:", errText);
    return NextResponse.json({ error: "Erreur Flouci, veuillez réessayer" }, { status: 502 });
  }

  const flouciData = await flouciRes.json();

  if (!flouciData.result?.link) {
    return NextResponse.json({ error: "Lien de paiement Flouci introuvable" }, { status: 502 });
  }

  // Sauvegarder le payment_id Flouci dans la réservation
  await supabase
    .from("reservations")
    .update({ flouci_payment_id: flouciData.result.payment_id })
    .eq("id", reservation_id);

  return NextResponse.json({
    payment_url: flouciData.result.link,
    payment_id:  flouciData.result.payment_id,
  });
}

/* ─── GET /api/paiement/flouci?payment_id=xxx ──────────────────────────
   Vérifie le statut du paiement Flouci (appelé après redirect success)
──────────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const payment_id       = searchParams.get("payment_id");
  const reservation_id   = searchParams.get("reservation_id");

  if (!payment_id || !reservation_id) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier le paiement côté Flouci
  const verifyRes = await fetch(`https://developers.flouci.com/api/verify_payment/${payment_id}`, {
    headers: {
      "Content-Type": "application/json",
      apppublic:  FLOUCI_APP_TOKEN,
      appsecret:  FLOUCI_APP_SECRET,
    },
  });

  if (!verifyRes.ok) {
    return NextResponse.json({ error: "Impossible de vérifier le paiement" }, { status: 502 });
  }

  const verifyData = await verifyRes.json();
  const isPaid     = verifyData.result?.status === "SUCCESS";

  if (isPaid) {
    // Marquer la réservation comme payée
    const { error: updateErr } = await supabase
      .from("reservations")
      .update({
        payment_status: "paid",
        payment_method: "flouci",
        status:         "confirmed",
      })
      .eq("id", reservation_id)
      .eq("touriste_id", user.id);

    if (updateErr) {
      console.error("[Flouci verify] Erreur update réservation:", updateErr);
      return NextResponse.json({ error: "Erreur mise à jour réservation" }, { status: 500 });
    }

    // Créer le paiement dans la table paiements si besoin
    const { data: resaData } = await supabase
      .from("reservations")
      .select("total_price, platform_fee, prestataire_id:excursions(prestataire_id)")
      .eq("id", reservation_id)
      .single();

    if (resaData) {
      const amount       = Number(resaData.total_price);
      const platform_fee = Number(resaData.platform_fee ?? amount * 0.10);
      const prestId      = (resaData.prestataire_id as { prestataire_id: string } | null)?.prestataire_id;

      await supabase.from("paiements").upsert({
        reservation_id,
        prestataire_id: prestId ?? "",
        amount,
        platform_fee,
        net_amount: amount - platform_fee,
        status:     "paid",
      }, { onConflict: "reservation_id" });
    }
  }

  return NextResponse.json({
    paid:   isPaid,
    status: verifyData.result?.status ?? "unknown",
  });
}