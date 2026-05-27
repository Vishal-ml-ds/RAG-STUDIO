"use client";

import { cn } from "@/lib/cn";
import { STAGE_CATEGORIES } from "@/lib/constants";
import type { StageCategory } from "@/lib/types";

export type CategoryValue = StageCategory | "all";

interface CategoryFilterProps {
  value: CategoryValue;
  onChange: (next: CategoryValue) => void;
  dirtyCount: number;
}

export function CategoryFilter({
  value,
  onChange,
  dirtyCount,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip
          active={value === "all"}
          onClick={() => onChange("all")}
          label="All"
        />
        {STAGE_CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            active={value === category.id}
            onClick={() => onChange(category.id)}
            label={category.label}
          />
        ))}
      </div>

      <div className="text-xs text-text-tertiary">
        {dirtyCount > 0 ? (
          <span className="text-accent">
            {dirtyCount} stage{dirtyCount === 1 ? "" : "s"} pending save
          </span>
        ) : (
          <span>All changes saved</span>
        )}
      </div>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function Chip({ active, onClick, label }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent/60 bg-accent/15 text-text-primary"
          : "border-border bg-bg-panel text-text-secondary hover:border-border-strong hover:text-text-primary",
      )}
    >
      {label}
    </button>
  );
}
