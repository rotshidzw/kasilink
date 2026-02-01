import { NextResponse } from "next/server";
import { RequestEventType } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let businessId: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    businessId = body?.businessId as string | undefined;
  } else {
    const formData = await request.formData();
    businessId = (formData.get("businessId") as string | null) ?? undefined;
  }
  if (!businessId) {
    return NextResponse.json({ error: "Business is required." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!serviceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      assignedBusinessId: businessId,
      updatedById: session.user.id,
      events: {
        create: {
          type: RequestEventType.BUSINESS_ASSIGNED,
          message: "Business assigned.",
          actorId: session.user.id
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}
