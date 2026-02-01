import { NextResponse } from "next/server";

import { ingestInboundWhatsapp } from "@/server/whatsapp/ingest";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = (await request.json()) as { phone?: string; text?: string };

  if (!body.phone || !body.text) {
    return NextResponse.json({ error: "phone and text are required" }, { status: 400 });
  }

  const result = await ingestInboundWhatsapp({
    phoneRaw: body.phone,
    text: body.text,
    rawPayload: { source: "dev-simulate", ...body }
  });

  return NextResponse.json({ ok: true, ...result });
}
