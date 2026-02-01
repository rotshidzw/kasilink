import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const phone = String(formData.get("phone") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  await prisma.callbackTicket.create({
    data: {
      phone,
      name: name || null,
      area: area || null,
      notes: notes || null
    }
  });

  const redirectTo = request.headers.get("referer") ?? "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
