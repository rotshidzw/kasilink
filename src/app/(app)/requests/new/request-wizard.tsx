"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createServiceRequest, type RequestState } from "@/app/(app)/requests/actions";

const initialState: RequestState = {};

type RequestWizardProps = {
  categories: { id: string; name: string }[];
  addresses: { id: string; label: string | null; line1: string }[];
};

export default function RequestWizard({ categories, addresses }: RequestWizardProps) {
  const [state, formAction] = useFormState(createServiceRequest, initialState);
  const [step, setStep] = useState("category");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [addressLabel, setAddressLabel] = useState(addresses[0]?.label ?? "Home");
  const [addressLine1, setAddressLine1] = useState(addresses[0]?.line1 ?? "");

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create a service request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full grid-cols-3 gap-2 text-xs font-semibold text-slate-500">
            {["category", "details", "address"].map((label, index) => (
              <button
                key={label}
                type="button"
                className={`rounded-md px-3 py-2 text-center uppercase ${
                  step === label ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
                onClick={() => setStep(label)}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="categoryId" value={categoryId} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="addressLabel" value={addressLabel} />
            <input type="hidden" name="addressLine1" value={addressLine1} />
            <input type="hidden" name="addressId" value={addressId} />
            {step === "category" && (
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700">Select service category</label>
                <select
                  name="categoryId"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button type="button" className="w-full" onClick={() => setStep("details")}>
                  Continue to details
                </Button>
              </div>
            )}

            {step === "details" && (
              <div className="space-y-4">
                <Input
                  name="title"
                  placeholder="Request title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
                <Input
                  name="description"
                  placeholder="Describe the request"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                />
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep("category")}>
                    Back
                  </Button>
                  <Button type="button" className="w-full" onClick={() => setStep("address")}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === "address" && (
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700">Delivery address</label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={addressId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setAddressId(nextId);
                    const selected = addresses.find((saved) => saved.id === nextId);
                    if (selected) {
                      setAddressLabel(selected.label ?? "Saved address");
                      setAddressLine1(selected.line1);
                    } else {
                      setAddressLabel("Custom");
                      setAddressLine1("");
                    }
                  }}
                >
                  <option value="">Use a new address</option>
                  {addresses.map((saved) => (
                    <option key={saved.id} value={saved.id}>
                      {saved.label ? `${saved.label}: ` : ""}{saved.line1}
                    </option>
                  ))}
                </select>
                <Input
                  name="addressLabel"
                  placeholder="Label (e.g. Home, Work)"
                  value={addressLabel}
                  onChange={(event) => setAddressLabel(event.target.value)}
                  required
                />
                <Input
                  name="addressLine1"
                  placeholder="Enter an address"
                  value={addressLine1}
                  onChange={(event) => setAddressLine1(event.target.value)}
                  required
                />
                {state.error && (
                  <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {state.error}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep("details")}>
                    Back
                  </Button>
                  <Button type="submit" className="w-full">
                    Submit request
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <input type="hidden" name="addressId" value={addressId} />
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5" />
            Request preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-100">
          <div>
            <p className="text-xs uppercase text-slate-400">Category</p>
            <p className="text-base font-semibold text-white">{selectedCategory?.name ?? "Select a category"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Title</p>
            <p className="text-base font-semibold text-white">{title || "Request title"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Details</p>
            <p className="text-sm text-slate-200">{description || "Share key details for helpers."}</p>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-1 h-4 w-4 text-slate-300" />
            <p className="text-sm text-slate-200">
              {addressLine1 ? `${addressLabel} · ${addressLine1}` : "Add a delivery address"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
