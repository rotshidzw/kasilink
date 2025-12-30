import { NextResponse } from "next/server";
import { RequestEventType } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let code: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    code = body?.code as string | undefined;
  } else {
    const formData = await request.formData();
    code = (formData.get("code") as string | null) ?? undefined;
  }
  if (!code) {
    return NextResponse.json({ error: "Voucher code required." }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!serviceRequest || serviceRequest.residentId !== session.user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const voucher = await prisma.voucher.findUnique({ where: { code } });
  if (!voucher || !voucher.active) {
    return NextResponse.json({ error: "Voucher invalid." }, { status: 400 });
  }

  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return NextResponse.json({ error: "Voucher expired." }, { status: 400 });
  }

  if (voucher.maxUses && voucher.uses >= voucher.maxUses) {
    return NextResponse.json({ error: "Voucher usage limit reached." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.voucher.update({
      where: { id: voucher.id },
      data: { uses: { increment: 1 } }
    }),
    prisma.voucherRedemption.create({
      data: {
        voucherId: voucher.id,
        userId: session.user.id,
        requestId: serviceRequest.id
      }
    }),
    prisma.serviceRequest.update({
      where: { id: serviceRequest.id },
      data: {
        updatedById: session.user.id,
        events: {
          create: {
            type: RequestEventType.VOUCHER_APPLIED,
            message: `Voucher ${voucher.code} applied.`,
            actorId: session.user.id
          }
        }
      }
    })
  ]);

  return NextResponse.json({ ok: true });
}
