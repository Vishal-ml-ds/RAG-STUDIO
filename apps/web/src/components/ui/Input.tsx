import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = "text", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "block w-full rounded-lg border bg-bg-inset px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary",
        "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid ? "border-danger/70" : "border-border",
        className,
      )}
      {...rest}
    />
  );
});
