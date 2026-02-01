import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/server/auth";
import { sendWhatsApp } from "@/server/whatsapp";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const to = formData.get("to");
  const body = formData.get("body");
  const requestId = formData.get("requestId");

  if (typeof to !== "string" || typeof body !== "string" || !to.trim() || !body.trim()) {
    return NextResponse.json({ error: "To and body are required." }, { status: 400 });
  }

  await sendWhatsApp({
    to: to.trim(),
    body: body.trim(),
    template: "TEST",
    requestId: typeof requestId === "string" && requestId ? requestId : null
  });

  return NextResponse.json({ ok: true });
}
