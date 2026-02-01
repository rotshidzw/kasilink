import { prisma } from "@/server/db";
import { sendWhatsApp } from "./provider";
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
  const toNumber = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "kasilink";

  await prisma.whatsappMessage.create({
    data: {
      to: toNumber,
      from: phoneE164,
      direction: "INBOUND",
      body: text?.trim() ?? "No text",
      status: "SENT",
      provider: process.env.WHATSAPP_PROVIDER ?? "stub"
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
      requestId: null
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
      requestId: request.id
    });

    return { kind: "REQUEST", createdRequestId: request.id };
  }

  return { kind: "UNKNOWN" };
}

async function sendReply({
  phoneE164,
  text,
  requestId
}: {
  phoneE164: string;
  text: string;
  requestId: string | null;
}) {
  await sendWhatsApp({
    to: phoneE164,
    body: text,
    requestId
  });
}
