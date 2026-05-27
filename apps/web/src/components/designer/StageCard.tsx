"use client";

import { ChevronRight, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { CATEGORY_ACCENT } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { StageCategory, StageConfig, StageDescriptor } from "@/lib/types";

interface StageCardProps {
  stage: StageDescriptor;
  index: number;
  config: StageConfig;
  isDirty: boolean;
  isActive: boolean;
  onSelect: () => void;
}

export function StageCard({
  stage,
  index,
  config,
  isDirty,
  isActive,
  onSelect,
}: StageCardProps) {
  const previewKeys = Object.keys(config ?? {}).slice(0, 3);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      className={cn(
        "group relative flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors",
        CATEGORY_ACCENT[stage.category as StageCategory] ??
          "border-border bg-bg-panel",
        isActive
          ? "ring-2 ring-accent/60 border-accent/60"
          : "hover:border-border-strong",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-bg-base font-mono text-xs text-text-secondary">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-text-primary">
            {stage.name}
          </h3>
          <Badge tone="neutral" className="capitalize">
            {stage.category}
          </Badge>
          {isDirty ? <Badge tone="accent">unsaved</Badge> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
          {stage.description}
        </p>

        {previewKeys.length > 0 ? (
          <dl className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-tertiary">
            {previewKeys.map((key) => (
              <div key={key} className="flex items-baseline gap-1">
                <dt className="font-mono text-text-tertiary">{key}:</dt>
                <dd className="font-mono text-text-secondary">
                  {summarizeValue((config as Record<string, unknown>)[key])}
                </dd>
              </div>
            ))}
            {Object.keys(config ?? {}).length > 3 ? (
              <span className="text-text-tertiary">…</span>
            ) : null}
          </dl>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-2">
        <Pencil className="h-3.5 w-3.5 text-text-tertiary transition-colors group-hover:text-accent" />
        <ChevronRight
          className={cn(
            "h-4 w-4 text-text-tertiary transition-transform",
            isActive && "translate-x-0.5 text-accent",
          )}
        />
      </div>
    </button>
  );
}

function summarizeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    return value.length > 28 ? `${value.slice(0, 28)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[${value.length}]`;
  }
  return "{…}";
}
