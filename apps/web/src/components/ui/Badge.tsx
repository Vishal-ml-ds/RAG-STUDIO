import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "accent" | "success" | "danger" | "warning";

const TONE: Record<BadgeTone, string> = {
  neutral: "border-border bg-bg-raised text-text-secondary",
  accent: "border-accent/30 bg-accent/10 text-accent",
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({
  tone = "neutral",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
