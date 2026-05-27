/**
 * Tiny formatting helpers — keep components free of date math.
 */

export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const ms = now.getTime() - then.getTime();
  const sec = Math.floor(ms / 1000);

  if (sec < 60) return "just now";
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return `${m}m ago`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return `${h}h ago`;
  }
  if (sec < 86400 * 7) {
    const d = Math.floor(sec / 86400);
    return `${d}d ago`;
  }
  return then.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
