import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["RESIDENT", "ADMIN", "BUSINESS"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    include: { driverProfile: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ drivers });
}
