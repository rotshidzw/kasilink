import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const announcement = await prisma.announcement.findUnique({ where: { id: params.id } });
  if (!announcement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canEdit =
    session.user.role === "ADMIN" ||
    (session.user.role === "BUSINESS" && announcement.authorId === session.user.id);
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const updates = {
    title: body?.title as string | undefined,
    body: body?.body as string | undefined,
    category: body?.category as string | undefined,
    isPinned: typeof body?.isPinned === "boolean" ? body.isPinned : undefined,
    expiresAt: body?.expiresAt ? new Date(body.expiresAt) : undefined
  };

  const updated = await prisma.announcement.update({
    where: { id: params.id },
    data: updates
  });

  return NextResponse.json({ ok: true, announcement: updated });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.announcement.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
