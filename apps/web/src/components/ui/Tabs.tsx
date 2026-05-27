"use client";

import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TabDescriptor<TValue extends string> {
  value: TValue;
  label: ReactNode;
  hint?: string;
}

interface TabsProps<TValue extends string> {
  tabs: TabDescriptor<TValue>[];
  value: TValue;
  onChange: (next: TValue) => void;
  className?: string;
}

/**
 * Lightweight controlled tabs (ARIA tablist + aria-selected).
 * Each panel should be rendered by the parent based on the current value.
 */
export function Tabs<TValue extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabsProps<TValue>) {
  const id = useId();

  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className={cn(
        "flex flex-wrap items-end gap-1 border-b border-border-subtle",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            id={`${id}-${tab.value}`}
            role="tab"
            aria-selected={active}
            aria-controls={`${id}-${tab.value}-panel`}
            tabIndex={active ? 0 : -1}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            <span>{tab.label}</span>
            {tab.hint ? (
              <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
                {tab.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
