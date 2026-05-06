import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("📥 Reçu:", data);
    
    // Vérifie que tourist_email est présent
    if (!data.tourist_email) {
      console.error("❌ Email manquant dans les données!");
      return NextResponse.json({ 
        success: false, 
        error: "Email du touriste manquant" 
      }, { status: 400 });
    }
    
    // Déterminer quel webhook n8n utiliser selon le statut
    let webhookUrl = "";
    
    if (data.status === "confirmed") {
      webhookUrl = process.env.NEXT_PUBLIC_N8N_CONFIRMATION_WEBHOOK!;
    } else if (data.status === "cancelled") {
      webhookUrl = process.env.NEXT_PUBLIC_N8N_CANCELLATION_WEBHOOK!;
    } else {
      return NextResponse.json({ skipped: true, message: "Statut non géré" });
    }
    
    if (!webhookUrl) {
      console.log("⚠️ Pas d'URL n8n configurée");
      return NextResponse.json({ 
        success: false, 
        message: "Webhook URL non configurée" 
      }, { status: 200 });
    }
    
    // Structure des données à envoyer à n8n
    const n8nData = {
      booking_code: data.booking_code,
      status: data.status,
      tourist_name: data.tourist_name,
      tourist_email: data.tourist_email,  // ← IMPORTANT: inclure l'email
      excursion_title: data.excursion_title,
      excursion_city: data.excursion_city,
      date: data.date,
      time: data.time,
      people_count: data.people_count,
      total_price: data.total_price,
      booking_code_full: data.booking_code_full
    };
    
    console.log("📤 Envoi à n8n:", n8nData);
    
    // Appeler n8n
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur n8n:", response.status, errorText);
      return NextResponse.json({ 
        success: false, 
        error: errorText 
      }, { status: 500 });
    }
    
    const result = await response.json();
    console.log("✅ Réponse n8n:", result);
    
    return NextResponse.json({ success: true, data: result });
    
  } catch (err) {
    console.error("❌ Erreur API:", err);
    return NextResponse.json({ 
      success: false, 
      error: String(err) 
    }, { status: 500 });
  }
}