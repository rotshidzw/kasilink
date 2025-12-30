"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBusinessProduct,
  deleteBusinessProduct,
  type ProductActionState,
  updateBusinessProduct
} from "@/app/business/actions";

const initialState: ProductActionState = {};

type ProductRowActionsProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    price: number;
  };
};

export function ProductCreateForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createBusinessProduct, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 md:grid-cols-2">
      <Input name="name" placeholder="Product name" required />
      <Input name="unit" placeholder="Unit (kg, pack)" required />
      <Input name="description" placeholder="Short description" required />
      <Input name="price" type="number" step="0.01" placeholder="Price" required />
      <Input name="quantity" type="number" placeholder="Starting quantity" required />
      {state.error && (
        <p className="md:col-span-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="md:col-span-2">
        <Button type="submit">Create product</Button>
      </div>
    </form>
  );
}

export function ProductRowActions({ product }: ProductRowActionsProps) {
  const router = useRouter();
  const [updateState, updateAction] = useFormState(updateBusinessProduct, initialState);
  const [deleteState, deleteAction] = useFormState(deleteBusinessProduct, initialState);

  useEffect(() => {
    if (updateState.success || deleteState.success) {
      router.refresh();
    }
  }, [deleteState.success, router, updateState.success]);

  return (
    <>
      <form action={updateAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="productId" value={product.id} />
        <Input name="name" defaultValue={product.name} className="w-32" />
        <Input name="description" defaultValue={product.description ?? ""} className="w-40" />
        <Input name="unit" defaultValue={product.unit} className="w-20" />
        <Input name="price" type="number" step="0.01" defaultValue={product.price} className="w-24" />
        <Button size="sm" type="submit" variant="outline">
          Update
        </Button>
        {updateState.error && <span className="text-xs text-red-600">{updateState.error}</span>}
      </form>
      <form action={deleteAction} className="mt-2">
        <input type="hidden" name="productId" value={product.id} />
        <Button size="sm" type="submit" variant="outline">
          Delete
        </Button>
        {deleteState.error && <span className="ml-2 text-xs text-red-600">{deleteState.error}</span>}
      </form>
    </>
  );
}
