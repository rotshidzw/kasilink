import { whatsappProviders, type WhatsAppProvider } from "./provider";

export function getWhatsAppProvider(): WhatsAppProvider {
  const providerName = process.env.WHATSAPP_PROVIDER ?? "stub";
  return whatsappProviders[providerName as keyof typeof whatsappProviders]?.() ?? whatsappProviders.stub();
}
