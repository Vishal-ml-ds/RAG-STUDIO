"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  maxHeightClass?: string;
}

/**
 * Monospaced code surface with copy + download actions.
 *
 * We deliberately avoid a heavy syntax-highlighting dependency — the focus
 * is readable monospace with line numbers and a stable copy/download flow.
 */
export function CodeBlock({
  code,
  language,
  filename,
  className,
  maxHeightClass = "max-h-[600px]",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const lines = useMemo(() => code.split("\n"), [code]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const onDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename ?? "snippet.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-bg-inset",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border-subtle bg-bg-panel/60 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {filename ? (
            <span className="font-mono text-text-primary">{filename}</span>
          ) : null}
          {language ? (
            <span className="rounded border border-border bg-bg-base px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              {language}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            leftIcon={
              copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )
            }
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDownload}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Download
          </Button>
        </div>
      </div>

      <div className={cn("overflow-auto", maxHeightClass)}>
        <pre className="m-0 grid grid-cols-[auto_1fr] gap-x-4 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-text-primary">
          <code className="select-none text-right text-text-tertiary">
            {lines.map((_, idx) => (
              <span key={idx} className="block">
                {idx + 1}
              </span>
            ))}
          </code>
          <code>
            {lines.map((line, idx) => (
              <span key={idx} className="block whitespace-pre">
                {line.length === 0 ? "​" : line}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
