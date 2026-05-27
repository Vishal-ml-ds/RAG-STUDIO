"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { CodeBlock } from "@/components/ui/CodeBlock";
import { Tabs, type TabDescriptor } from "@/components/ui/Tabs";
import { EXPORT_FORMATS } from "@/lib/constants";
import type { ExportFormat, ExportResponse } from "@/lib/types";

interface CodeExporterProps {
  projectId: string;
}

interface CacheEntry {
  filename: string;
  content: string;
}

const TABS: TabDescriptor<ExportFormat>[] = EXPORT_FORMATS.map((format) => ({
  value: format.id,
  label: format.label,
}));

export function CodeExporter({ projectId }: CodeExporterProps) {
  const [format, setFormat] = useState<ExportFormat>("python");
  const [cache, setCache] = useState<Partial<Record<ExportFormat, CacheEntry>>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache[format]) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/designer/${projectId}/export?format=${format}`,
          { method: "POST" },
        );
        if (cancelled) return;

        if (!res.ok) {
          const body = (await safeJson(res)) as { detail?: string } | null;
          setError(body?.detail ?? "Could not generate the export.");
          return;
        }

        const data = (await res.json()) as ExportResponse;
        setCache((prev) => ({
          ...prev,
          [format]: { filename: data.filename, content: data.content },
        }));
      } catch {
        if (cancelled) return;
        setError("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [format, projectId, cache]);

  const current = cache[format];
  const meta = EXPORT_FORMATS.find((f) => f.id === format);

  return (
    <div className="flex flex-col gap-5">
      <Tabs<ExportFormat> tabs={TABS} value={format} onChange={setFormat} />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Export failed</p>
            <p className="text-xs text-danger/80">{error}</p>
          </div>
        </div>
      ) : null}

      {loading && !current ? (
        <ExportSkeleton />
      ) : current ? (
        <CodeBlock
          code={current.content}
          filename={current.filename}
          language={meta?.language}
        />
      ) : (
        <ExportSkeleton />
      )}
    </div>
  );
}

function ExportSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-bg-panel/40 text-xs text-text-secondary">
      <span className="inline-flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Generating export…
      </span>
    </div>
  );
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
