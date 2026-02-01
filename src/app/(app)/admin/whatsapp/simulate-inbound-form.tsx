"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SimulateInboundForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const payload = {
      phone: String(formData.get("phone") ?? "").trim(),
      text: String(formData.get("text") ?? "").trim()
    };

    const response = await fetch("/api/whatsapp/dev-simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Unable to simulate inbound WhatsApp.");
      setIsSubmitting(false);
      return;
    }

    formElement.reset();
    setSuccess("Inbound message simulated.");
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-dashed border-slate-200 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Simulate inbound message</h3>
        <p className="text-xs text-slate-500">
          Use this in development to create inbound messages and auto-create requests.
        </p>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="phone">
          From phone
        </label>
        <Input id="phone" name="phone" placeholder="+2782..." required />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="text">
          Message text
        </label>
        <Textarea id="text" name="text" placeholder="water address: 12 Main St" required />
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      {success && <p className="text-xs font-semibold text-emerald-600">{success}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting ? "Simulating..." : "Simulate inbound"}
        </Button>
      </div>
    </form>
  );
}
