import { NextResponse } from "next/server";
import { RequestEventType, ServiceRequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "RESIDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceRequest = await prisma.serviceRequest.findUnique({
    where: { id: params.id }
  });

  if (!sourceRequest || sourceRequest.residentId !== session.user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const newRequest = await prisma.serviceRequest.create({
    data: {
      title: sourceRequest.title,
      description: sourceRequest.description,
      address: sourceRequest.address,
      categoryId: sourceRequest.categoryId,
      residentId: session.user.id,
      status: ServiceRequestStatus.SUBMITTED,
      events: {
        create: {
          type: RequestEventType.CREATED,
          message: "Reorder created.",
          actorId: session.user.id
        }
      }
    }
  });

  await prisma.orderHistory.create({
    data: {
      userId: session.user.id,
      requestId: newRequest.id
    }
  });

  return NextResponse.json({ ok: true, requestId: newRequest.id });
}
