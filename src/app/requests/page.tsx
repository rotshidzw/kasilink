"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { api } from "@/app/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const statusOptions = ["NEW", "CLAIMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default function RequestsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const utils = api.useUtils();

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const createRequest = api.request.create.useMutation({
    onSuccess: () => {
      setType("");
      setDescription("");
      setAddress("");
      void utils.request.listMine.invalidate();
    }
  });

  const openRequests = api.request.listOpen.useQuery(undefined, {
    enabled: role === "YOUTH" || role === "BUSINESS"
  });
  const myRequests = api.request.listMine.useQuery(undefined, {
    enabled: role === "RESIDENT"
  });

  const claimRequest = api.request.claim.useMutation({
    onSuccess: () => void utils.request.listOpen.invalidate()
  });

  const updateStatus = api.request.updateStatus.useMutation({
    onSuccess: () => void utils.request.listOpen.invalidate()
  });

  const isResident = role === "RESIDENT";
  const isResponder = role === "YOUTH" || role === "BUSINESS";

  const requestList = useMemo(() => {
    if (isResident) {
      return myRequests.data ?? [];
    }
    return openRequests.data ?? [];
  }, [isResident, myRequests.data, openRequests.data]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{isResident ? "Create a service request" : "Open service requests"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isResident && (
            <>
              <Input placeholder="Request type" value={type} onChange={(event) => setType(event.target.value)} />
              <Input
                placeholder="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <Input placeholder="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
              <Button
                className="w-full"
                onClick={() => createRequest.mutate({ type, description, address })}
                disabled={createRequest.isPending}
              >
                Submit request
              </Button>
            </>
          )}
          {!role && <p className="text-sm text-slate-600">Sign in to submit or claim requests.</p>}
          {isResponder && <p className="text-sm text-slate-600">Claim a request to start helping.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isResident ? "My requests" : "Available requests"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestList.length === 0 && <p className="text-sm text-slate-600">No requests yet.</p>}
          {requestList.map((request) => (
            <div key={request.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">{request.type}</h3>
                <span className="text-xs font-semibold uppercase text-slate-500">{request.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{request.description}</p>
              <p className="mt-1 text-xs text-slate-500">{request.address}</p>
              {isResponder && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => claimRequest.mutate({ requestId: request.id })}>
                    Claim
                  </Button>
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ requestId: request.id, status })}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
