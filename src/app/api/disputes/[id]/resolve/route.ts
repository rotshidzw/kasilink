import { NextResponse } from "next/server";
import { DisputeStatus, RequestEventType } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

type ResolutionType = "REFUND" | "VOUCHER" | "REJECT";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const resolutionType = body?.resolutionType as ResolutionType | undefined;
  const note = body?.note as string | undefined;
  const refundCents = body?.refundCents as number | undefined;

  if (!resolutionType) {
    return NextResponse.json({ error: "Resolution type required." }, { status: 400 });
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: { request: true }
  });
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  let status: DisputeStatus = DisputeStatus.CLOSED;

  await prisma.$transaction(async (tx) => {
    if (resolutionType === "REFUND") {
      status = DisputeStatus.RESOLVED_REFUND;
      const amount = refundCents ?? 0;
      await tx.wallet.upsert({
        where: { userId: dispute.openedById },
        create: { userId: dispute.openedById, balanceCents: amount },
        update: { balanceCents: { increment: amount } }
      });
    }

    if (resolutionType === "VOUCHER") {
      status = DisputeStatus.RESOLVED_VOUCHER;
      const voucher = await tx.voucher.create({
        data: {
          code: `DISPUTE-${Date.now()}`,
          description: "Dispute resolution voucher",
          amountOffCents: refundCents ?? 0,
          active: true,
          createdById: session.user.id
        }
      });
      await tx.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          userId: dispute.openedById,
          requestId: dispute.requestId
        }
      });
    }

    if (resolutionType === "REJECT") {
      status = DisputeStatus.RESOLVED_REJECTED;
    }

    await tx.dispute.update({
      where: { id: params.id },
      data: {
        status,
        resolutionNote: note,
        assignedAdminId: session.user.id
      }
    });

    await tx.serviceRequestEvent.create({
      data: {
        requestId: dispute.requestId,
        actorId: session.user.id,
        type: RequestEventType.DISPUTE_RESOLVED,
        message: `Dispute resolved: ${resolutionType}.`
      }
    });
  });

  return NextResponse.json({ ok: true, status });
}
