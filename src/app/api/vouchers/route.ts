import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = body?.code as string | undefined;
  const description = body?.description as string | undefined;
  const amountOffCents = body?.amountOffCents as number | undefined;
  const percentOff = body?.percentOff as number | undefined;
  const maxUses = body?.maxUses as number | undefined;
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : undefined;

  if (!code || (!amountOffCents && !percentOff)) {
    return NextResponse.json({ error: "Invalid voucher payload." }, { status: 400 });
  }

  const voucher = await prisma.voucher.create({
    data: {
      code,
      description,
      amountOffCents,
      percentOff,
      maxUses,
      expiresAt,
      createdById: session.user.id
    }
  });

  return NextResponse.json({ ok: true, voucher });
}
