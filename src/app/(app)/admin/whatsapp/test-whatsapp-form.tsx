"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type RequestOption = {
  id: string;
  title: string;
};

type TestWhatsAppFormProps = {
  requests: RequestOption[];
};

export function TestWhatsAppForm({ requests }: TestWhatsAppFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const response = await fetch("/api/whatsapp/test", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to send WhatsApp test message.");
      setIsSubmitting(false);
      return;
    }

    formElement.reset();
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="to">
            To phone
          </label>
          <Input id="to" name="to" placeholder="+2782..." required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="requestId">
            Link to request (optional)
          </label>
          <select
            id="requestId"
            name="requestId"
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            defaultValue=""
          >
            <option value="">No request</option>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                {request.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="body">
          Message
        </label>
        <Textarea id="body" name="body" placeholder="Type the WhatsApp message..." required />
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send test WhatsApp"}
        </Button>
      </div>
    </form>
  );
}
