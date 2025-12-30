import { NextResponse } from "next/server";
import { RequestEventType, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

const transitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  DRAFT: [ServiceRequestStatus.SUBMITTED],
  SUBMITTED: [ServiceRequestStatus.MATCHED, ServiceRequestStatus.CANCELLED],
  MATCHED: [ServiceRequestStatus.ACCEPTED, ServiceRequestStatus.CANCELLED],
  ACCEPTED: [ServiceRequestStatus.PICKED_UP, ServiceRequestStatus.CANCELLED],
  PICKED_UP: [ServiceRequestStatus.EN_ROUTE],
  EN_ROUTE: [ServiceRequestStatus.DELIVERED],
  DELIVERED: [ServiceRequestStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: []
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let newStatus: ServiceRequestStatus | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    newStatus = body?.newStatus as ServiceRequestStatus | undefined;
  } else {
    const formData = await request.formData();
    newStatus = (formData.get("newStatus") as ServiceRequestStatus | null) ?? undefined;
  }
  if (!newStatus || !Object.values(ServiceRequestStatus).includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: params.id }
  });

  if (!serviceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isDriver = session.user.role === "DRIVER" && serviceRequest.assignedDriverId === session.user.id;
  const isResident =
    session.user.role === "RESIDENT" &&
    serviceRequest.residentId === session.user.id &&
    newStatus === ServiceRequestStatus.COMPLETED &&
    serviceRequest.status === ServiceRequestStatus.DELIVERED;

  if (!isAdmin && !isDriver && !isResident) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isDriver && newStatus === ServiceRequestStatus.COMPLETED) {
    return NextResponse.json({ error: "Drivers cannot complete requests." }, { status: 403 });
  }

  const allowedNext = transitions[serviceRequest.status] ?? [];
  if (!allowedNext.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status transition." }, { status: 400 });
  }

  const updates: Record<string, Date> = {};
  if (newStatus === ServiceRequestStatus.DELIVERED) {
    updates.deliveredAt = new Date();
  }
  if (newStatus === ServiceRequestStatus.COMPLETED) {
    updates.completedAt = new Date();
  }

  await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      ...updates,
      updatedById: session.user.id,
      events: {
        create: {
          type: RequestEventType.STATUS_CHANGED,
          message: `Status changed to ${newStatus}.`,
          actorId: session.user.id
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}
