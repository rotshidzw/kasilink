import { redirect } from "next/navigation";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import RequestWizard from "@/app/requests/new/request-wizard";

export default async function NewRequestPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const categories = await prisma.serviceCategory.findMany({ orderBy: { name: "asc" } });
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <RequestWizard
      categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      addresses={addresses.map((address) => ({ id: address.id, label: address.label, line1: address.line1 }))}
    />
  );
}
