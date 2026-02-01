import { NextResponse } from "next/server";
import { CallbackStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.callbackTicket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Callback not found" }, { status: 404 });
  }

  await prisma.callbackTicket.update({
    where: { id: params.id },
    data: {
      status: CallbackStatus.DONE,
      resolvedByUserId: session.user.id
    }
  });

  const redirectTo = request.headers.get("referer") ?? "/callcenter/callbacks";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
