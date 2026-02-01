import { prisma } from "@/server/db";

export type SendWhatsAppParams = {
  to: string;
  body: string;
  template?: string;
  requestId?: string | null;
  orderId?: string | null;
};

export type SendWhatsAppResult = {
  ok: boolean;
  messageId: string;
};

export async function sendWhatsApp({ to, body, template, requestId, orderId }: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "stub";
  const message = await prisma.whatsappMessage.create({
    data: {
      to,
      body,
      template: template ?? null,
      direction: "OUTBOUND",
      status: provider === "stub" ? "SENT" : "FAILED",
      provider,
      requestId: requestId ?? null,
      orderId: orderId ?? null
    }
  });

  return { ok: provider === "stub", messageId: message.id };
}

export async function notifyRequestEvent({
  requestId,
  eventType,
  toPhone,
  message
}: {
  requestId: string;
  eventType: string;
  toPhone: string;
  message: string;
}) {
  await sendWhatsApp({
    to: toPhone,
    body: message,
    template: eventType,
    requestId
  });
}
