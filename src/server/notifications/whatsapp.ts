export type WhatsAppMessage = {
  to: string;
  message: string;
  meta?: Record<string, string>;
};

export interface WhatsAppProvider {
  send: (payload: WhatsAppMessage) => Promise<void>;
}

class ConsoleProvider implements WhatsAppProvider {
  async send(payload: WhatsAppMessage) {
    console.log("[WhatsApp]", payload.to, payload.message, payload.meta ?? {});
  }
}

class TwilioProvider implements WhatsAppProvider {
  async send(payload: WhatsAppMessage) {
    console.log("[Twilio WhatsApp stub]", payload.to, payload.message);
  }
}

class MetaCloudProvider implements WhatsAppProvider {
  async send(payload: WhatsAppMessage) {
    console.log("[Meta WhatsApp stub]", payload.to, payload.message);
  }
}

function resolveProvider(): WhatsAppProvider {
  const provider = process.env.WHATSAPP_PROVIDER ?? "console";
  if (provider === "twilio") {
    return new TwilioProvider();
  }
  if (provider === "meta") {
    return new MetaCloudProvider();
  }
  return new ConsoleProvider();
}

export async function sendWhatsAppMessage(payload: WhatsAppMessage) {
  const provider = resolveProvider();
  await provider.send(payload);
}
