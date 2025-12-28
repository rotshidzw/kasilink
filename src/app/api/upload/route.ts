import { NextResponse } from "next/server";
import { z } from "zod";

import { storageProvider } from "@/server/providers/storage";

export const runtime = "nodejs";

const uploadSchema = z.object({
  file: z.instanceof(File)
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const parsed = uploadSchema.safeParse({ file });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const buffer = Buffer.from(await parsed.data.file.arrayBuffer());
  const safeName = `${Date.now()}-${parsed.data.file.name}`.replace(/\s+/g, "-");
  const url = await storageProvider.upload({ fileName: safeName, data: buffer });

  return NextResponse.json({ url });
}
