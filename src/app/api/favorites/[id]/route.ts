import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.favorite.deleteMany({
    where: { id: params.id, userId: session.user.id }
  });

  return NextResponse.json({ ok: true });
}
