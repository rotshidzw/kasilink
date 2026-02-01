import { redirect } from "next/navigation";
import Image from "next/image";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnnouncementsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }]
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-600">Community updates, service alerts, and deals.</p>
        </div>
        <div className="decorative-image relative h-40 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-resident.svg" alt="Announcements hero" fill className="object-cover" data-decorative />
        </div>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">No announcements yet.</CardContent>
          </Card>
        )}
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{announcement.title}</CardTitle>
              <Badge variant={announcement.isPinned ? "default" : "secondary"}>{announcement.category}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>{announcement.body}</p>
              {announcement.expiresAt && (
                <p className="text-xs text-slate-500">
                  Expires {announcement.expiresAt.toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
