import Link from "next/link";
import { redirect } from "next/navigation";
import { Headset, PhoneCall, MessageSquareText, ClipboardList } from "lucide-react";
import { CallbackStatus, VoiceNoteStatus, ServiceRequestStatus } from "@prisma/client";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function CallCenterPage() {
  const session = await getServerAuthSession();
  if (!session?.user || !["CALLCENTER", "ADMIN"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const [openRequests, openCallbacks, openVoiceNotes, recentCallbacks] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: ServiceRequestStatus.SUBMITTED } }),
    prisma.callbackTicket.count({ where: { status: CallbackStatus.OPEN } }),
    prisma.voiceNoteRequest.count({ where: { status: VoiceNoteStatus.NEW } }),
    prisma.callbackTicket.findMany({
      where: { status: CallbackStatus.OPEN },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            Call center hub
          </Badge>
          <h1 className="text-2xl font-semibold text-slate-900">Keep KasiLink moving, one call at a time.</h1>
          <p className="text-sm text-slate-600">
            Review callback requests, transcribe WhatsApp voice notes, and route service requests to the right teams.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/callcenter/callbacks" className={cn(buttonVariants())}>
              Manage callbacks
            </Link>
            <Link href="/requests" className={cn(buttonVariants({ variant: "outline" }))}>
              View open requests
            </Link>
          </div>
        </div>
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headset className="h-4 w-4" />
              Live workload
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Open requests", value: openRequests, icon: ClipboardList },
              { label: "Callbacks", value: openCallbacks, icon: PhoneCall },
              { label: "Voice notes", value: openVoiceNotes, icon: MessageSquareText }
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-slate-500">{stat.label}</p>
                  <stat.icon className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Open callback requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCallbacks.length === 0 ? (
              <p className="text-sm text-slate-600">No callbacks waiting right now.</p>
            ) : (
              recentCallbacks.map((callback) => (
                <div key={callback.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{callback.name ?? "Resident"}</p>
                    <Badge variant="secondary">{callback.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{callback.phone}</p>
                  {callback.area && <p className="mt-1 text-xs text-slate-500">Area: {callback.area}</p>}
                  {callback.notes && <p className="mt-2 text-xs text-slate-600">{callback.notes}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice note queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>Capture WhatsApp voice notes and convert them into service requests.</p>
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No voice notes captured yet.
            </div>
            <Link href="/requests" className="text-sm font-semibold text-slate-900">
              Route a new request →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
