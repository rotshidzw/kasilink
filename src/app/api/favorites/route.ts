import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let type: string | undefined;
  let label: string | undefined;
  let payload: unknown = null;
  let requestId: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    type = body?.type as string | undefined;
    label = body?.label as string | undefined;
    payload = body?.payload ?? null;
    requestId = body?.requestId as string | undefined;
  } else {
    const formData = await request.formData();
    type = (formData.get("type") as string | null) ?? undefined;
    label = (formData.get("label") as string | null) ?? undefined;
    requestId = (formData.get("requestId") as string | null) ?? undefined;
    const payloadText = (formData.get("payload") as string | null) ?? null;
    if (payloadText) {
      try {
        payload = JSON.parse(payloadText);
      } catch {
        payload = null;
      }
    }
  }

  if (!type || !label || !payload) {
    return NextResponse.json({ error: "Invalid favorite payload." }, { status: 400 });
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId: session.user.id,
      type,
      label,
      payload,
      requestId
    }
  });

  return NextResponse.json({ ok: true, favorite });
}
