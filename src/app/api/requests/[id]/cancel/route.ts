import { NextResponse } from "next/server";
import { RequestEventType, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

const cancellableStatuses = new Set([
  ServiceRequestStatus.DRAFT,
  ServiceRequestStatus.SUBMITTED,
  ServiceRequestStatus.MATCHED,
  ServiceRequestStatus.ACCEPTED
]);

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: params.id }
  });

  if (!serviceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const isResidentOwner = session.user.role === "RESIDENT" && serviceRequest.residentId === session.user.id;
  if (!isResidentOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!cancellableStatuses.has(serviceRequest.status)) {
    return NextResponse.json({ error: "Request can no longer be cancelled." }, { status: 400 });
  }

  await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      status: ServiceRequestStatus.CANCELLED,
      cancelledAt: new Date(),
      updatedById: session.user.id,
      events: {
        create: {
          type: RequestEventType.CANCELLED,
          message: "Request cancelled.",
          actorId: session.user.id
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}
