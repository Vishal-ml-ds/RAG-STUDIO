"use client";

import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CATEGORY_ACCENT } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { StageEditorField } from "@/components/designer/StageEditorField";
import type { StageCategory, StageConfig, StageDescriptor } from "@/lib/types";

interface StageEditorProps {
  stage: StageDescriptor;
  config: StageConfig;
  isDirty: boolean;
  onChange: (next: StageConfig) => void;
  onResetStage: () => void;
}

export function StageEditor({
  stage,
  config,
  isDirty,
  onChange,
  onResetStage,
}: StageEditorProps) {
  const keys = Array.from(
    new Set([...Object.keys(stage.default), ...Object.keys(config ?? {})]),
  );

  const setField = (key: string, value: unknown) => {
    onChange({ ...(config ?? {}), [key]: value });
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-bg-panel/80 p-5 shadow-panel",
        CATEGORY_ACCENT[stage.category as StageCategory] ??
          "border-border",
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {stage.name}
            </h2>
            <Badge tone="neutral" className="capitalize">
              {stage.category}
            </Badge>
            {isDirty ? <Badge tone="accent">unsaved</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-text-secondary">{stage.description}</p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          disabled={!isDirty}
          onClick={onResetStage}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          Revert
        </Button>
      </header>

      {keys.length === 0 ? (
        <p className="mt-4 text-xs italic text-text-tertiary">
          This stage has no configurable fields.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {keys.map((key) => (
            <StageEditorField
              key={key}
              fieldKey={key}
              value={(config as Record<string, unknown>)[key]}
              defaultValue={
                (stage.default as Record<string, unknown>)[key] ?? null
              }
              onChange={(value) => setField(key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
