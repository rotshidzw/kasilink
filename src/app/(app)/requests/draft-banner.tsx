"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "kasilink:draft-request";

export function DraftBanner() {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setHasDraft(Boolean(window.localStorage.getItem(DRAFT_KEY)));
  }, []);

  if (!hasDraft) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">Resume saved request</p>
      <p className="mt-1 text-xs text-slate-500">We saved your draft so you can finish later.</p>
      <Link href="/requests/new" className={cn(buttonVariants({ className: "mt-3" }))}>
        Resume draft
      </Link>
    </div>
  );
}
