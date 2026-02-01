import { Badge } from "@/components/ui/badge";

const variantByStatus: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "outline",
  SUBMITTED: "default",
  MATCHED: "secondary",
  ACCEPTED: "secondary",
  PICKED_UP: "secondary",
  EN_ROUTE: "secondary",
  DELIVERED: "default",
  COMPLETED: "secondary",
  CANCELLED: "outline",
  OPEN: "default",
  ASSIGNED: "secondary",
  IN_PROGRESS: "secondary"
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variantByStatus[status] ?? "secondary"}>{status}</Badge>;
}
