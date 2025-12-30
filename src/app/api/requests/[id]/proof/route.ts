import { NextResponse } from "next/server";
import { RequestEventType } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["ADMIN", "DRIVER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let proofOfDeliveryUrl: string | undefined;
  let deliveryOtp: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    proofOfDeliveryUrl = body?.proofOfDeliveryUrl as string | undefined;
    deliveryOtp = body?.deliveryOtp as string | undefined;
  } else {
    const formData = await request.formData();
    proofOfDeliveryUrl = (formData.get("proofOfDeliveryUrl") as string | null) ?? undefined;
    deliveryOtp = (formData.get("deliveryOtp") as string | null) ?? undefined;
  }

  if (!proofOfDeliveryUrl && !deliveryOtp) {
    return NextResponse.json({ error: "Proof URL or OTP required." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!serviceRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (session.user.role === "DRIVER" && serviceRequest.assignedDriverId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.serviceRequest.update({
    where: { id: params.id },
    data: {
      proofOfDeliveryUrl: proofOfDeliveryUrl ?? serviceRequest.proofOfDeliveryUrl,
      deliveryOtp: deliveryOtp ?? serviceRequest.deliveryOtp,
      updatedById: session.user.id,
      events: {
        create: {
          type: RequestEventType.PROOF_UPLOADED,
          message: "Proof of delivery uploaded.",
          actorId: session.user.id
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}
