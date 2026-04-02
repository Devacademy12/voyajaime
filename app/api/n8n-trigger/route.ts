import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

   const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("[n8n proxy] Error:", res.status, await res.text());
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[n8n proxy] Exception:", err);
    return NextResponse.json({ success: false }, { status: 200 }); // ne pas bloquer
  }
}