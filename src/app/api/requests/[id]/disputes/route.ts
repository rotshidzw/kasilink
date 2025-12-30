import { NextResponse } from "next/server";
import { RequestEventType, RequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "RESIDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reason: string | undefined;
  let details: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    reason = body?.reason as string | undefined;
    details = body?.details as string | undefined;
  } else {
    const formData = await request.formData();
    reason = (formData.get("reason") as string | null) ?? undefined;
    details = (formData.get("details") as string | null) ?? undefined;
  }

  if (!reason) {
    return NextResponse.json({ error: "Reason required." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!serviceRequest || serviceRequest.residentId !== session.user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (![RequestStatus.DELIVERED, RequestStatus.COMPLETED].includes(serviceRequest.status)) {
    return NextResponse.json({ error: "Disputes allowed after delivery." }, { status: 400 });
  }

  const dispute = await prisma.dispute.create({
    data: {
      requestId: serviceRequest.id,
      openedById: session.user.id,
      reason,
      details
    }
  });

  await prisma.serviceRequestEvent.create({
    data: {
      requestId: serviceRequest.id,
      actorId: session.user.id,
      type: RequestEventType.DISPUTE_OPENED,
      message: "Dispute opened."
    }
  });

  return NextResponse.json({ ok: true, disputeId: dispute.id });
}
