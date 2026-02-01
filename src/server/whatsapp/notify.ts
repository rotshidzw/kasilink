import { prisma } from "@/server/db";
import { getWhatsAppProvider } from "./";

type StatusUpdateParams = {
  phoneE164: string;
  requestId: string;
  status: string;
};

type DriverAssignedParams = {
  phoneE164: string;
  requestId: string;
  driverName: string;
};

export async function notifyContactRequestStatus({ phoneE164, requestId, status }: StatusUpdateParams) {
  const provider = getWhatsAppProvider();
  const text = `Update ✅ Your request ${requestId.slice(-6).toUpperCase()} is now ${status}.`;

  const { messageId } = await provider.sendText({ to: phoneE164, text });

  await prisma.whatsappMessage.create({
    data: {
      direction: "OUT",
      phoneE164,
      messageId,
      text,
      status: "SENT",
      rawPayload: { requestId, status }
    }
  });
}

export async function notifyDriverAssigned({ phoneE164, requestId, driverName }: DriverAssignedParams) {
  const provider = getWhatsAppProvider();
  const text = `Driver assigned ✅ ${driverName} is on it. Ref: ${requestId.slice(-6).toUpperCase()}.`;

  const { messageId } = await provider.sendText({ to: phoneE164, text });

  await prisma.whatsappMessage.create({
    data: {
      direction: "OUT",
      phoneE164,
      messageId,
      text,
      status: "SENT",
      rawPayload: { requestId, driverName }
    }
  });
}
