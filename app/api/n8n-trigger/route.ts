// app/api/n8n-trigger/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("[n8n] === DÉBUT DE LA REQUÊTE ===");
  
  try {
    // 1. Vérifier que le body existe
    let body;
    try {
      body = await request.json();
      console.log("[n8n] Body reçu:", JSON.stringify(body, null, 2));
    } catch (e) {
      console.error("[n8n] Erreur de parsing JSON:", e);
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // 2. Extraire les données avec des valeurs par défaut
    const {
      touriste_name = "Client",
      touriste_email = "email@non.renseigne",
      excursion_title = "Excursion",
      excursion_city = "Tunisie",
      prestataire_name = "Prestataire",
      prestataire_email = "contact@voyajaim.tn",
      booking_code = "N/A",
      date = new Date().toISOString().split('T')[0],
      people_count = 1,
      total_price = 0,
    } = body;

    // 3. Valider les données minimales
    if (!booking_code || booking_code === "N/A") {
      console.warn("[n8n] Attention: booking_code manquant");
    }

    // 4. Récupérer l'URL webhook (avec fallback)
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    
    if (!N8N_WEBHOOK_URL) {
      console.error("[n8n] ⚠️ VARIABLE D'ENVIRONNEMENT MANQUANTE !");
      console.error("[n8n] Ajoutez N8N_WEBHOOK_URL dans .env.local");
      
      // Ne pas échouer la requête, juste logger
      return NextResponse.json({ 
        success: true, 
        warning: "Webhook non configuré - notification ignorée",
        received: { booking_code, excursion_title }
      });
    }

    console.log("[n8n] Webhook URL:", N8N_WEBHOOK_URL);
    console.log("[n8n] Envoi des données...");

    // 5. Préparer le payload pour n8n
    const payload = {
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
    };

    console.log("[n8n] Payload:", JSON.stringify(payload, null, 2));

    // 6. Envoyer à n8n avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[n8n] Statut de la réponse:", response.status);
      console.log("[n8n] Headers:", Object.fromEntries(response.headers.entries()));

      // Lire la réponse texte pour le débogage
      const responseText = await response.text();
      console.log("[n8n] Réponse brute:", responseText);

      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn("[n8n] La réponse n'est pas du JSON:", responseText);
        result = { raw_response: responseText };
      }

      if (!response.ok) {
        console.error("[n8n] ❌ Erreur n8n:", response.status, result);
        return NextResponse.json(
          { 
            success: false, 
            error: `Erreur n8n: ${response.status}`,
            details: result 
          },
          { status: 500 }
        );
      }

      console.log("[n8n] ✅ Notification envoyée avec succès !");
      return NextResponse.json({ success: true, data: result });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("[n8n] ❌ Timeout - n8n ne répond pas");
        return NextResponse.json(
          { success: false, error: "Timeout - n8n ne répond pas" },
          { status: 504 }
        );
      }
      
      console.error("[n8n] ❌ Erreur fetch:", fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message || "Erreur réseau" },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("[n8n] ❌ Erreur générale:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur serveur",
        stack: process.env.NODE_ENV === "development" ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    );
  } finally {
    console.log("[n8n] === FIN DE LA REQUÊTE ===");
  }
}

// Route OPTIONS pour gérer le CORS si nécessaire
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}