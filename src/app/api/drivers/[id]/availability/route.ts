import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSelf = session.user.id === params.id;
  if (!isSelf && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let isAvailable: boolean | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    isAvailable = body?.isAvailable as boolean | undefined;
  } else {
    const formData = await request.formData();
    const formValue = formData.get("isAvailable");
    if (formValue === "true") {
      isAvailable = true;
    } else if (formValue === "false") {
      isAvailable = false;
    }
  }

  if (typeof isAvailable !== "boolean") {
    return NextResponse.json({ error: "isAvailable required." }, { status: 400 });
  }

  const profile = await prisma.driverProfile.upsert({
    where: { userId: params.id },
    create: { userId: params.id, isAvailable },
    update: { isAvailable }
  });

  return NextResponse.json({ ok: true, profile });
}
