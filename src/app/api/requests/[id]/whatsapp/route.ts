import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { getWhatsAppProvider } from "@/server/whatsapp";
import { normalizePhoneE164 } from "@/server/whatsapp/phone";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assistedOrdersEnabled = process.env.ASSISTED_ORDERS_ENABLED === "true";

  const formData = await request.formData();
  const message = formData.get("message");

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      resident: { include: { profile: true } },
      ...(assistedOrdersEnabled ? { contact: true } : {})
    }
  });

  const phone = serviceRequest?.resident?.profile?.phone ?? serviceRequest?.contact?.phone;
  if (!phone) {
    return NextResponse.json({ error: "No phone on file" }, { status: 400 });
  }

  const phoneE164 = normalizePhoneE164(phone);
  const provider = getWhatsAppProvider();
  let status = "SENT";
  let messageId: string | undefined;

  try {
    const result = await provider.sendText({ to: phoneE164, text: message });
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
      text: message,
      status,
      rawPayload: { requestId: params.id, source: "admin-request" }
    }
  });
  return NextResponse.json({ ok: true });
}
