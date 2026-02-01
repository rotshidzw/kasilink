import { prisma } from "@/server/db";
import { getWhatsAppProvider } from "./";
import { parseInboundText } from "./parser";
import { normalizePhoneE164 } from "./phone";

type IngestInboundParams = {
  phoneRaw?: string;
  text?: string;
  rawPayload: unknown;
};

function extractProfileName(rawPayload: unknown): string | undefined {
  const payload = rawPayload as {
    entry?: Array<{
      changes?: Array<{
        value?: { contacts?: Array<{ profile?: { name?: string } }> };
      }>;
    }>;
    profile?: { name?: string };
  };

  return (
    payload.profile?.name ??
    payload.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ??
    undefined
  );
}

export async function ingestInboundWhatsapp({ phoneRaw, text, rawPayload }: IngestInboundParams) {
  const phoneE164 = phoneRaw ? normalizePhoneE164(phoneRaw) : "unknown";

  await prisma.whatsappMessage.create({
    data: {
      direction: "IN",
      phoneE164,
      text: text?.trim(),
      status: "RECEIVED",
      rawPayload
    }
  });

  if (!phoneRaw || !text?.trim()) {
    return { kind: "UNKNOWN" };
  }

  const contactName = extractProfileName(rawPayload) ?? "WhatsApp user";

  const existingContact = await prisma.assistedContact.findFirst({
    where: { phone: phoneE164 }
  });

  const contact =
    existingContact ??
    (await prisma.assistedContact.create({
      data: {
        name: contactName,
        phone: phoneE164,
        area: "Unknown"
      }
    }));

  await prisma.whatsappLink.upsert({
    where: { phoneE164 },
    update: { contactId: contact.id },
    create: { phoneE164, contactId: contact.id }
  });

  const parsed = parseInboundText(text);
  if (parsed.kind === "CALLBACK") {
    await prisma.callbackTicket.create({
      data: {
        phone: phoneE164,
        name: parsed.name ?? contact.name,
        area: parsed.area ?? contact.area,
        notes: parsed.notes,
        status: "OPEN"
      }
    });

    await sendReply({
      phoneE164,
      text: "Sharp ✅ We got you. We will call you back soon.",
      rawPayload: { kind: "CALLBACK" }
    });

    return { kind: "CALLBACK" };
  }

  if (parsed.kind === "REQUEST") {
    const category =
      (await prisma.serviceCategory.findFirst({ where: { name: parsed.categoryName } })) ??
      (await prisma.serviceCategory.create({
        data: {
          name: parsed.categoryName,
          description: `${parsed.categoryName} requests`
        }
      }));

    const request = await prisma.serviceRequest.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        address: parsed.address ?? "Unknown address (WhatsApp)",
        status: "SUBMITTED",
        contactId: contact.id,
        categoryId: category.id,
        verifiedByCall: false
      }
    });

    await prisma.serviceRequestEvent.createMany({
      data: [
        {
          requestId: request.id,
          type: "CREATED",
          message: "Created via WhatsApp"
        },
        {
          requestId: request.id,
          type: "SUBMITTED",
          message: "Submitted via WhatsApp"
        }
      ]
    });

    const shortRef = request.id.slice(-6).toUpperCase();
    await sendReply({
      phoneE164,
      text: `Request received ✅ Ref: ${shortRef}. We’ll update you here on WhatsApp.`,
      rawPayload: { kind: "REQUEST", requestId: request.id }
    });

    return { kind: "REQUEST", createdRequestId: request.id };
  }

  return { kind: "UNKNOWN" };
}

async function sendReply({
  phoneE164,
  text,
  rawPayload
}: {
  phoneE164: string;
  text: string;
  rawPayload: Record<string, unknown>;
}) {
  const provider = getWhatsAppProvider();
  let status = "SENT";
  let messageId: string | undefined;

  try {
    const result = await provider.sendText({ to: phoneE164, text });
    messageId = result.messageId;
  } catch (error) {
    status = "FAILED";
    console.error("WhatsApp send failed", error);
  }

  await prisma.whatsappMessage.create({
    data: {
      direction: "OUT",
      phoneE164,
      messageId,
      text,
      status,
      rawPayload
    }
  });
}
