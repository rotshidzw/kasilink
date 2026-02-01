import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { sendWhatsApp } from "@/server/whatsapp";
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
  await sendWhatsApp({
    to: phoneE164,
    body: message,
    template: "ADMIN_UPDATE",
    requestId: params.id
  });
  return NextResponse.json({ ok: true });
}
