import { ingestInboundWhatsapp } from "@/server/whatsapp/ingest";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from?: string;
              text?: { body?: string };
            }>;
          };
        }>;
      }>;
    };

    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const phoneRaw = message?.from;
    const text = message?.text?.body;

    await ingestInboundWhatsapp({ phoneRaw, text, rawPayload: payload });
  } catch (error) {
    console.error("WhatsApp webhook parse failed", error);
  }

  return new Response("OK", { status: 200 });
}
