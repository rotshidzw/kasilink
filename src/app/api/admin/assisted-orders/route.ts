import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { sendWhatsApp } from "@/server/whatsapp";
import { normalizePhoneE164 } from "@/server/whatsapp/phone";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const phone = formData.get("phone");
  const name = formData.get("name");
  const area = formData.get("area");
  const addressNote = formData.get("addressNote");
  const categoryName = formData.get("category");
  const title = formData.get("title");
  const description = formData.get("description");

  if (typeof phone !== "string" || typeof categoryName !== "string" || typeof title !== "string") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const phoneE164 = normalizePhoneE164(phone);

  const existingContact = await prisma.assistedContact.findFirst({
    where: { phone: phoneE164 }
  });

  const contact =
    existingContact ??
    (await prisma.assistedContact.create({
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : "WhatsApp user",
        phone: phoneE164,
        area: typeof area === "string" && area.trim() ? area.trim() : "Unknown",
        addressNote: typeof addressNote === "string" && addressNote.trim() ? addressNote.trim() : null,
        createdById: session.user.id
      }
    }));

  if (existingContact) {
    await prisma.assistedContact.update({
      where: { id: contact.id },
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : contact.name,
        area: typeof area === "string" && area.trim() ? area.trim() : contact.area,
        addressNote: typeof addressNote === "string" && addressNote.trim() ? addressNote.trim() : contact.addressNote
      }
    });
  }

  await prisma.whatsappLink.upsert({
    where: { phoneE164 },
    update: { contactId: contact.id },
    create: { phoneE164, contactId: contact.id }
  });

  const category =
    (await prisma.serviceCategory.findFirst({ where: { name: categoryName } })) ??
    (await prisma.serviceCategory.create({
      data: { name: categoryName, description: `${categoryName} requests` }
    }));

  const requestRecord = await prisma.serviceRequest.create({
    data: {
      title,
      description: typeof description === "string" ? description : "",
      address: typeof addressNote === "string" && addressNote.trim() ? addressNote.trim() : "Unknown address (WhatsApp)",
      status: "SUBMITTED",
      contactId: contact.id,
      createdByStaffId: session.user.id,
      categoryId: category.id,
      verifiedByCall: false
    }
  });

  await prisma.serviceRequestEvent.createMany({
    data: [
      {
        requestId: requestRecord.id,
        actorId: session.user.id,
        type: "CREATED",
        message: "Created via assisted order"
      },
      {
        requestId: requestRecord.id,
        actorId: session.user.id,
        type: "SUBMITTED",
        message: "Submitted via assisted order"
      }
    ]
  });

  const shortRef = requestRecord.id.slice(-6).toUpperCase();
  const replyText = `We created your request ✅ Ref: ${shortRef}.`;
  await sendWhatsApp({
    to: phoneE164,
    body: replyText,
    template: "ASSISTED_ORDER",
    requestId: requestRecord.id
  });

  return NextResponse.json({ ok: true, requestId: requestRecord.id });
}
