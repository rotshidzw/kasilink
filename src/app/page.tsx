import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-slate-900 px-8 py-12 text-white">
        <h1 className="text-3xl font-semibold">KasiLink</h1>
        <p className="mt-3 max-w-2xl text-slate-200">
          Connect residents, youth, and businesses to resolve service requests and organize cleanup events.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/requests" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900">
            Submit a request
          </Link>
          <Link href="/events" className="rounded-md border border-white px-4 py-2 text-sm font-medium text-white">
            Explore events
          </Link>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Report",
            body: "Residents can submit service requests with location and description."
          },
          {
            title: "Claim",
            body: "Youth and businesses claim open requests and update progress."
          },
          {
            title: "Gather",
            body: "Coordinate community cleanup events and RSVP."
          }
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
