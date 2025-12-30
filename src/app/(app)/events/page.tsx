import { CalendarDays, Megaphone } from "lucide-react";
import Image from "next/image";

import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function EventsPage() {
  const [restockAnnouncements, communityAnnouncements] = await Promise.all([
    prisma.announcement.findMany({ where: { category: "DEALS" }, orderBy: { createdAt: "desc" } }),
    prisma.announcement.findMany({ where: { category: "COMMUNITY" }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Restock days</h1>
          <p className="text-sm text-slate-600">
            Plan ahead with scheduled spaza restock windows and community announcements.
          </p>
        </div>
        <div className="relative h-40 w-full overflow-hidden rounded-2xl">
          <Image src="/brand/hero-resident.svg" alt="Community events" fill className="object-cover" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming restock days
          </CardTitle>
          <Badge variant="secondary">{restockAnnouncements.length} scheduled</Badge>
        </CardHeader>
        <CardContent>
          {restockAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-600">No restock days announced yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restockAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium text-slate-900">{announcement.title}</TableCell>
                    <TableCell>
                      {announcement.expiresAt
                        ? new Date(announcement.expiresAt).toLocaleDateString()
                        : "TBA"}
                    </TableCell>
                    <TableCell>{announcement.body}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Community highlights
          </CardTitle>
          <Badge variant="secondary">{communityAnnouncements.length} updates</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {communityAnnouncements.length === 0 && <p className="text-sm text-slate-600">No updates yet.</p>}
          {communityAnnouncements.map((announcement) => (
            <div key={announcement.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">{announcement.title}</h3>
                <Badge variant="outline">
                  {announcement.expiresAt ? new Date(announcement.expiresAt).toLocaleDateString() : "Ongoing"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{announcement.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
