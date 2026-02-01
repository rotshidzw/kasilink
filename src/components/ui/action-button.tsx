import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ActionButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      className={cn("h-12 w-full text-base font-semibold", className)}
    />
  );
}
