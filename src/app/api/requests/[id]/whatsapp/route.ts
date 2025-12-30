import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { sendWhatsAppMessage } from "@/server/notifications/whatsapp";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const message = formData.get("message");

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: { resident: { include: { profile: true } }, contact: true }
  });

  const phone = serviceRequest?.resident?.profile?.phone ?? serviceRequest?.contact?.phone;
  if (!phone) {
    return NextResponse.json({ error: "No phone on file" }, { status: 400 });
  }

  await sendWhatsAppMessage({ to: phone, message });
  return NextResponse.json({ ok: true });
}
