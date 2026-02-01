import { NextResponse } from "next/server";
import { RequestEventType, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { notifyRequestEvent } from "@/server/whatsapp";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "RESIDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: params.id }
  });

  if (!serviceRequest || serviceRequest.residentId !== session.user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (serviceRequest.status !== ServiceRequestStatus.DRAFT) {
    return NextResponse.json({ error: "Request already submitted." }, { status: 400 });
  }

  const updatedRequest = await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      status: ServiceRequestStatus.SUBMITTED,
      updatedById: session.user.id,
      events: {
        create: {
          type: RequestEventType.SUBMITTED,
          message: "Request submitted.",
          actorId: session.user.id
        }
      }
    },
    include: { resident: { include: { profile: true } } }
  });

  const phone = updatedRequest.resident?.profile?.phone;
  if (phone) {
    await notifyRequestEvent({
      requestId: updatedRequest.id,
      eventType: "REQUEST_SUBMITTED",
      toPhone: phone,
      message: `Request submitted: ${updatedRequest.title} (ID: ${updatedRequest.id.slice(-6).toUpperCase()})`
    });
  }

  return NextResponse.json({ ok: true });
}
