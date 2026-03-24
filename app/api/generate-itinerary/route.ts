import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const N8N_API_KEY = process.env.N8N_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validation basique
    if (!body.jours || !body.villes || body.villes.length === 0) {
      return NextResponse.json(
        { error: 'Paramètres manquants : jours et villes requis' },
        { status: 400 }
      );
    }

    // Appel n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_API_KEY,
      },
      body: JSON.stringify({
        jours: body.jours,
        villes: body.villes,
        interets: body.interets || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n error: ${response.status}`);
    }

    const itineraire = await response.json();
    
    return NextResponse.json(itineraire);
    
  } catch (error) {
    console.error('Erreur génération itinéraire:', error);
    return NextResponse.json(
      { error: 'Impossible de générer l\'itinéraire' },
      { status: 500 }
    );
  }
}