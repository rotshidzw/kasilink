"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import { api } from "@/app/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function EventsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const utils = api.useUtils();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");

  const eventsQuery = api.event.list.useQuery(undefined, { enabled: !!role });
  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setLocation("");
      setStartsAt("");
      void utils.event.list.invalidate();
    }
  });

  const rsvp = api.event.rsvp.useMutation({
    onSuccess: () => void utils.event.list.invalidate()
  });

  const addProof = api.event.addProof.useMutation({
    onSuccess: () => void utils.event.list.invalidate()
  });

  const handleUpload = async (eventId: string, file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = (await response.json()) as { url?: string };
    if (data.url) {
      addProof.mutate({ eventId, proofImageUrl: data.url });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cleanup events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventsQuery.data?.map((event) => (
            <div key={event.id} className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
              <p className="text-sm text-slate-600">{event.description}</p>
              <div className="mt-2 text-xs text-slate-500">
                {event.location} · {new Date(event.startsAt).toLocaleString()}
              </div>
              {event.proofImageUrl && (
                <img
                  src={event.proofImageUrl}
                  alt="Proof"
                  className="mt-3 w-full max-w-sm rounded-lg border border-slate-200"
                />
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => rsvp.mutate({ eventId: event.id })}>
                  RSVP ({event.rsvps.length})
                </Button>
                {role === "ADMIN" && (
                  <label className="cursor-pointer text-xs font-medium text-slate-600">
                    Upload proof
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(fileEvent) => handleUpload(event.id, fileEvent.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
          {!eventsQuery.data?.length && <p className="text-sm text-slate-600">No events yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create an event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {role === "ADMIN" ? (
            <>
              <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <Input
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <Input
                placeholder="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
              <Button
                className="w-full"
                onClick={() =>
                  createEvent.mutate({ title, description, location, startsAt: new Date(startsAt).toISOString() })
                }
                disabled={createEvent.isPending || !startsAt}
              >
                Create event
              </Button>
            </>
          ) : (
            <p className="text-sm text-slate-600">Admins can create cleanup events.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
