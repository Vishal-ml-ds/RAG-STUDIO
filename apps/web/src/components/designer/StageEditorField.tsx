"use client";

import { useEffect, useId, useState } from "react";

import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import {
  humanizeKey,
  inferFieldKind,
  parseJson,
  parseList,
  stringifyJson,
  stringifyList,
} from "@/components/designer/fieldType";

interface StageEditorFieldProps {
  fieldKey: string;
  value: unknown;
  defaultValue: unknown;
  onChange: (next: unknown) => void;
}

export function StageEditorField({
  fieldKey,
  value,
  defaultValue,
  onChange,
}: StageEditorFieldProps) {
  const id = useId();
  const kind = inferFieldKind(value ?? defaultValue);

  switch (kind) {
    case "boolean":
      return (
        <BooleanField
          id={id}
          fieldKey={fieldKey}
          value={Boolean(value)}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <NumberField
          id={id}
          fieldKey={fieldKey}
          value={typeof value === "number" ? value : Number(value ?? 0)}
          onChange={onChange}
        />
      );
    case "string":
      return (
        <StringField
          id={id}
          fieldKey={fieldKey}
          value={typeof value === "string" ? value : String(value ?? "")}
          onChange={onChange}
        />
      );
    case "list":
      return (
        <ListField
          id={id}
          fieldKey={fieldKey}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );
    default:
      return (
        <JsonField
          id={id}
          fieldKey={fieldKey}
          value={value}
          onChange={onChange}
        />
      );
  }
}

// ---- Sub-fields -----------------------------------------------------------

interface FieldProps {
  id: string;
  fieldKey: string;
}

function StringField({
  id,
  fieldKey,
  value,
  onChange,
}: FieldProps & { value: string; onChange: (next: string) => void }) {
  const isLong = value.length > 80 || value.includes("\n");
  return (
    <FormField label={humanizeKey(fieldKey)} htmlFor={id}>
      {isLong ? (
        <textarea
          id={id}
          rows={Math.min(6, Math.max(3, value.split("\n").length))}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full resize-y rounded-lg border border-border bg-bg-inset px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FormField>
  );
}

function NumberField({
  id,
  fieldKey,
  value,
  onChange,
}: FieldProps & { value: number; onChange: (next: number) => void }) {
  return (
    <FormField label={humanizeKey(fieldKey)} htmlFor={id}>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
      />
    </FormField>
  );
}

function BooleanField({
  id,
  fieldKey,
  value,
  onChange,
}: FieldProps & { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-inset px-3 py-2">
      <label htmlFor={id} className="text-xs font-medium text-text-secondary">
        {humanizeKey(fieldKey)}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? "bg-accent" : "bg-bg-raised"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ListField({
  id,
  fieldKey,
  value,
  onChange,
}: FieldProps & { value: unknown[]; onChange: (next: unknown[]) => void }) {
  const [raw, setRaw] = useState(stringifyList(value));

  useEffect(() => {
    setRaw(stringifyList(value));
  }, [value]);

  return (
    <FormField
      label={humanizeKey(fieldKey)}
      htmlFor={id}
      hint="Comma-separated values"
    >
      <Input
        id={id}
        value={raw}
        onChange={(e) => {
          const next = e.target.value;
          setRaw(next);
          onChange(parseList(next, value));
        }}
      />
    </FormField>
  );
}

function JsonField({
  id,
  fieldKey,
  value,
  onChange,
}: FieldProps & { value: unknown; onChange: (next: unknown) => void }) {
  const [raw, setRaw] = useState(stringifyJson(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRaw(stringifyJson(value));
  }, [value]);

  return (
    <FormField
      label={humanizeKey(fieldKey)}
      htmlFor={id}
      hint="JSON"
      error={error ?? undefined}
    >
      <textarea
        id={id}
        rows={5}
        value={raw}
        onChange={(e) => {
          const next = e.target.value;
          setRaw(next);
          const parsed = parseJson(next);
          if (parsed.ok) {
            setError(null);
            onChange(parsed.value);
          } else {
            setError(parsed.error);
          }
        }}
        className="block w-full resize-y rounded-lg border border-border bg-bg-inset px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
    </FormField>
  );
}
