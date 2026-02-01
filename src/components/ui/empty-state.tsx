import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {description && <p className="text-sm text-slate-600">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={cn(buttonVariants())}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
