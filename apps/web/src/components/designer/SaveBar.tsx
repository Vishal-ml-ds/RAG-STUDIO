"use client";

import { Check, Save, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface SaveBarProps {
  isDirty: boolean;
  dirtyCount: number;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({
  isDirty,
  dirtyCount,
  saving,
  error,
  onSave,
  onDiscard,
}: SaveBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-6">
      <div
        className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-xl border bg-bg-panel/95 px-4 py-3 shadow-panel backdrop-blur transition-opacity ${
          isDirty || error ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!isDirty && !error}
      >
        <div className="flex min-w-0 items-center gap-3">
          {error ? (
            <span className="text-xs text-danger">{error}</span>
          ) : isDirty ? (
            <span className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">
                {dirtyCount}
              </span>{" "}
              stage{dirtyCount === 1 ? "" : "s"} changed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-success">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDiscard}
            disabled={!isDirty || saving}
            leftIcon={<Undo2 className="h-3.5 w-3.5" />}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!isDirty}
            loading={saving}
            leftIcon={<Save className="h-3.5 w-3.5" />}
          >
            Save pipeline
          </Button>
        </div>
      </div>
    </div>
  );
}
