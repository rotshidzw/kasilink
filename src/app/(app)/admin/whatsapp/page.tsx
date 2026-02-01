import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { TestWhatsAppForm } from "./test-whatsapp-form";

type WhatsAppInboxPageProps = {
  searchParams?: { direction?: string; phone?: string };
};

const directionOptions = [
  { value: "ALL", label: "All" },
  { value: "OUTBOUND", label: "Outbound" },
  { value: "INBOUND", label: "Inbound" }
] as const;

export default async function AdminWhatsAppInboxPage({ searchParams }: WhatsAppInboxPageProps) {
  const session = await getServerAuthSession();
  if (!session?.user || !["ADMIN", "CALLCENTER"].includes(session.user.role ?? "")) {
    redirect("/dashboard");
  }

  const direction =
    directionOptions.find((option) => option.value === searchParams?.direction)?.value ?? "ALL";
  const phoneQuery = searchParams?.phone?.trim();

  const whereClause = {
    ...(direction !== "ALL" ? { direction } : {}),
    ...(phoneQuery
      ? {
          OR: [
            { to: { contains: phoneQuery, mode: "insensitive" } },
            { from: { contains: phoneQuery, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [messages, recentRequests] = await Promise.all([
    prisma.whatsappMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { request: true, order: true }
    }),
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, title: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">WhatsApp inbox</h1>
          <p className="text-sm text-slate-600">Track stubbed WhatsApp notifications and request updates.</p>
        </div>
        <Badge variant="secondary">{messages.length} messages</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send test WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <TestWhatsAppForm requests={recentRequests} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Message history</CardTitle>
          <p className="text-xs text-slate-500">
            Tip: outbound messages appear after sending a test message; inbound messages appear after using the dev
            simulator or webhook.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {directionOptions.map((option) => {
              const href = new URLSearchParams();
              if (option.value !== "ALL") {
                href.set("direction", option.value);
              }
              if (phoneQuery) {
                href.set("phone", phoneQuery);
              }
              return (
                <Link
                  key={option.value}
                  href={`/admin/whatsapp?${href.toString()}`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    direction === option.value ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-500"
                  )}
                >
                  {option.label}
                </Link>
              );
            })}
            <form action="/admin/whatsapp" method="get" className="flex flex-1 justify-end">
              <input
                type="text"
                name="phone"
                defaultValue={phoneQuery}
                placeholder="Search phone number"
                className="w-full max-w-xs rounded-full border border-slate-200 px-3 py-1 text-xs"
              />
              {direction !== "ALL" && <input type="hidden" name="direction" value={direction} />}
              <button className="ml-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                Search
              </button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Body</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-slate-500">
                      {direction === "INBOUND" ? (
                        <span>
                          No inbound messages yet.{" "}
                          <Link className="font-semibold text-slate-700" href="/admin/whatsapp">
                            Show all
                          </Link>{" "}
                          or{" "}
                          <Link
                            className="font-semibold text-slate-700"
                            href="/admin/whatsapp?direction=OUTBOUND"
                          >
                            view outbound
                          </Link>
                          .
                        </span>
                      ) : direction === "OUTBOUND" ? (
                        <span>
                          No outbound messages yet. Try the test form above or{" "}
                          <Link className="font-semibold text-slate-700" href="/admin/whatsapp">
                            show all
                          </Link>
                          .
                        </span>
                      ) : (
                        "No WhatsApp messages yet."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {message.createdAt.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">{message.direction}</TableCell>
                      <TableCell className="text-xs text-slate-700">
                        <div>{message.to}</div>
                        {message.from && <div className="text-slate-400">from {message.from}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{message.status}</TableCell>
                      <TableCell className="max-w-xs text-xs text-slate-600">
                        {message.body.length > 140 ? `${message.body.slice(0, 140)}…` : message.body}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {message.requestId && (
                          <Link className="text-xs font-semibold text-slate-900" href={`/requests/${message.requestId}`}>
                            Request {message.requestId.slice(-6).toUpperCase()}
                          </Link>
                        )}
                        {!message.requestId && message.orderId && (
                          <Link
                            className="text-xs font-semibold text-slate-900"
                            href={`/admin?orderId=${message.orderId}`}
                          >
                            Order {message.orderId.slice(-6).toUpperCase()}
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
