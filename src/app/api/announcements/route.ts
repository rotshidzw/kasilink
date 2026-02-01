import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "BUSINESS"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = body?.title as string | undefined;
  const bodyText = body?.body as string | undefined;
  const category = body?.category as string | undefined;
  const isPinned = body?.isPinned === true;
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : undefined;

  if (!title || !bodyText || !category) {
    return NextResponse.json({ error: "Invalid announcement payload." }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      authorId: session.user.id,
      title,
      body: bodyText,
      category,
      isPinned,
      expiresAt
    }
  });

  return NextResponse.json({ ok: true, announcement });
}
