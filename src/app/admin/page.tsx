"use client";

import { api } from "@/app/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  const stats = api.admin.stats.useQuery();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[
        { label: "Total requests", value: stats.data?.totalRequests },
        { label: "Completed requests", value: stats.data?.completedRequests },
        { label: "Users", value: stats.data?.users },
        { label: "Events", value: stats.data?.events },
        { label: "RSVPs", value: stats.data?.rsvps }
      ].map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardTitle>{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{item.value ?? 0}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
