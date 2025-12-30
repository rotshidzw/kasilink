import { NextResponse } from "next/server";
import { RequestEventType, RequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

const transitions: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: [RequestStatus.SUBMITTED],
  SUBMITTED: [RequestStatus.MATCHED, RequestStatus.CANCELLED],
  MATCHED: [RequestStatus.ACCEPTED, RequestStatus.CANCELLED],
  ACCEPTED: [RequestStatus.PICKED_UP, RequestStatus.CANCELLED],
  PICKED_UP: [RequestStatus.EN_ROUTE],
  EN_ROUTE: [RequestStatus.DELIVERED],
  DELIVERED: [RequestStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: []
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let newStatus: RequestStatus | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    newStatus = body?.newStatus as RequestStatus | undefined;
  } else {
    const formData = await request.formData();
    newStatus = (formData.get("newStatus") as RequestStatus | null) ?? undefined;
  }
  if (!newStatus || !Object.values(RequestStatus).includes(newStatus)) {
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
    newStatus === RequestStatus.COMPLETED &&
    serviceRequest.status === RequestStatus.DELIVERED;

  if (!isAdmin && !isDriver && !isResident) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isDriver && newStatus === RequestStatus.COMPLETED) {
    return NextResponse.json({ error: "Drivers cannot complete requests." }, { status: 403 });
  }

  const allowedNext = transitions[serviceRequest.status] ?? [];
  if (!allowedNext.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status transition." }, { status: 400 });
  }

  const updates: Record<string, Date> = {};
  if (newStatus === RequestStatus.DELIVERED) {
    updates.deliveredAt = new Date();
  }
  if (newStatus === RequestStatus.COMPLETED) {
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
