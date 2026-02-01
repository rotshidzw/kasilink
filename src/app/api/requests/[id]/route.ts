import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      resident: true,
      assignedDriver: { include: { driverProfile: true } },
      assignedBusiness: true,
      events: { orderBy: { createdAt: "desc" }, include: { actor: true } },
      disputes: { include: { openedBy: true, assignedAdmin: true } }
    }
  });

  if (!serviceRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canAccess =
    session.user.role === "ADMIN" ||
    serviceRequest.residentId === session.user.id ||
    serviceRequest.assignedDriverId === session.user.id ||
    serviceRequest.assignedBusinessId === session.user.id;

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ request: serviceRequest });
}
