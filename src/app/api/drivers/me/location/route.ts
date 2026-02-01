import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const lastLat = body?.lastLat as number | undefined;
  const lastLng = body?.lastLng as number | undefined;

  if (typeof lastLat !== "number" || typeof lastLng !== "number") {
    return NextResponse.json({ error: "Coordinates required." }, { status: 400 });
  }

  const profile = await prisma.driverProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, lastLat, lastLng },
    update: { lastLat, lastLng }
  });

  return NextResponse.json({ ok: true, profile });
}
