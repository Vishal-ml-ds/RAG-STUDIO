import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose conditional Tailwind class strings safely.
 * Merges duplicates so the last value wins (e.g. `p-2` overrides `p-1`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
