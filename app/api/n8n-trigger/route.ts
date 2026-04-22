// app/api/n8n-trigger/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      touriste_name,
      touriste_email,
      excursion_title,
      excursion_city,
      prestataire_name,
      prestataire_email,
      booking_code,
      date,
      people_count,
      total_price,
    } = body;

    // 🔗 VOTRE URL WEBHOOK N8N
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.srv1544962.hstgr.cloud/webhook-test/send-confirmation";

    console.log("[n8n] Envoi des données vers:", N8N_WEBHOOK_URL);
    console.log("[n8n] Données:", {
      event_type: "reservation",
      customer_name: touriste_name,
      customer_email: touriste_email,
      excursion_name: excursion_title,
      date: date,
      people: people_count,
      total: total_price
    });

    // Envoyer les données à n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "reservation",
        booking_id: booking_code,
        customer_name: touriste_name,
        customer_email: touriste_email,
        excursion_name: excursion_title,
        excursion_city: excursion_city,
        date: date,
        time: "09:00",
        number_of_people: people_count,
        total_price: total_price,
        prestataire_name: prestataire_name,
        prestataire_email: prestataire_email,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n] Erreur réponse:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Erreur n8n: ${response.status}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("[n8n] Succès:", result);
    
    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    console.error("[n8n] Erreur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi à n8n" },
      { status: 500 }
    );
  }
}