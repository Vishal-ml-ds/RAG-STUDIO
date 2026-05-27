import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

export function Card({
  className,
  interactive,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-bg-panel p-5",
        interactive &&
          "transition-colors hover:border-border-strong hover:bg-bg-raised cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold tracking-tight text-text-primary",
        className,
      )}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-xs leading-relaxed text-text-secondary", className)}
      {...rest}
    >
      {children}
    </p>
  );
}
