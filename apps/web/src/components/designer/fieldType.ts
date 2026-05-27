/**
 * Heuristics to pick the right input control for a stage config value.
 *
 * The designer config is loose JSON — these helpers infer a sensible field
 * type from the current value (or fall back to a textarea when unsure).
 */

export type FieldKind = "string" | "number" | "boolean" | "list" | "json";

export function inferFieldKind(value: unknown): FieldKind {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) {
    // Treat homogeneous primitive arrays as a comma-separated list.
    if (
      value.every(
        (v) =>
          typeof v === "string" || typeof v === "number" || typeof v === "boolean",
      )
    ) {
      return "list";
    }
  }
  return "json";
}

export function stringifyList(values: unknown[]): string {
  return values.map((v) => String(v)).join(", ");
}

export function parseList(raw: string, template?: unknown[]): unknown[] {
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const numeric = template?.every((v) => typeof v === "number") ?? false;
  const boolean = template?.every((v) => typeof v === "boolean") ?? false;

  if (numeric) {
    return parts.map((part) => Number(part)).filter((n) => !Number.isNaN(n));
  }
  if (boolean) {
    return parts.map((part) => part.toLowerCase() === "true");
  }
  return parts;
}

export function stringifyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function parseJson(raw: string): {
  ok: true;
  value: unknown;
} | {
  ok: false;
  error: string;
} {
  if (raw.trim().length === 0) {
    return { ok: true, value: null };
  }
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}

export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
