import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { maskPhone } from "@/server/whatsapp/phone";

export default async function AdminWhatsAppInboxPage() {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const inboundMessages = await prisma.whatsappMessage.findMany({
    where: { direction: "IN" },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const phoneNumbers = Array.from(new Set(inboundMessages.map((message) => message.phoneE164)));
  const outboundMessages = await prisma.whatsappMessage.findMany({
    where: { direction: "OUT", phoneE164: { in: phoneNumbers } },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  const latestOutboundByPhone = outboundMessages.reduce<Record<string, (typeof outboundMessages)[number]>>(
    (accumulator, message) => {
      if (!accumulator[message.phoneE164]) {
        accumulator[message.phoneE164] = message;
      }
      return accumulator;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">WhatsApp inbox</h1>
          <p className="text-sm text-slate-600">Latest inbound chats and quick actions.</p>
        </div>
        <Badge variant="secondary">{inboundMessages.length} inbound</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbound messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inboundMessages.length === 0 ? (
            <p className="text-sm text-slate-600">No WhatsApp messages yet.</p>
          ) : (
            inboundMessages.map((message) => {
              const lastOutbound = latestOutboundByPhone[message.phoneE164];
              return (
                <div key={message.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{maskPhone(message.phoneE164)}</p>
                      <p className="text-xs text-slate-500">
                        {message.createdAt.toLocaleString("en-ZA", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </p>
                    </div>
                    <Link
                      href={`/admin/assisted-orders?phone=${encodeURIComponent(message.phoneE164)}`}
                      className="text-xs font-semibold text-slate-900"
                    >
                      Create request →
                    </Link>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{message.text ?? "No text captured."}</p>
                  {lastOutbound?.text && (
                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-500">Last reply</p>
                      <p className="mt-1">{lastOutbound.text}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
