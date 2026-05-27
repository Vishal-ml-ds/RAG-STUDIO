"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-border bg-bg-panel p-6 shadow-panel",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-raised hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        {title ? (
          <h2
            id="dialog-title"
            className="text-base font-semibold tracking-tight text-text-primary"
          >
            {title}
          </h2>
        ) : null}
        {description ? (
          <p
            id="dialog-description"
            className="mt-1 text-sm text-text-secondary"
          >
            {description}
          </p>
        ) : null}

        <div className={cn(title || description ? "mt-5" : null)}>{children}</div>
      </div>
    </div>
  );
}
