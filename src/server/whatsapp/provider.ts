export type SendWhatsAppParams = {
  to: string;
  text: string;
  meta?: Record<string, unknown>;
};

export interface WhatsAppProvider {
  sendText(params: SendWhatsAppParams): Promise<{ messageId?: string }>;
}

class StubProvider implements WhatsAppProvider {
  async sendText({ to, text }: SendWhatsAppParams) {
    console.log("[WHATSAPP:STUB] to:", to, "text:", text);
    return { messageId: `stub-${Date.now()}` };
  }
}

class MetaProvider implements WhatsAppProvider {
  async sendText({ to, text }: SendWhatsAppParams) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      throw new Error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID for Meta provider.");
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Meta WhatsApp API error: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as { messages?: Array<{ id: string }> };
    return { messageId: payload.messages?.[0]?.id };
  }
}

export const whatsappProviders = {
  stub: () => new StubProvider(),
  meta: () => new MetaProvider()
};
