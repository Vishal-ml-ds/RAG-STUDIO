/**
 * Web-side proxy for POST /api/designer/{project_id}/export.
 *
 * Mirrors the backend signature: `?format=python|yaml|terraform|...`. The
 * body is optional and unused for now — the format is read from the query
 * string per the backend contract.
 */

import { NextResponse } from "next/server";

import { apiFetch, ApiError } from "@/lib/api-client";
import type { ExportFormat, ExportResponse } from "@/lib/types";

interface RouteContext {
  params: { projectId: string };
}

const ALLOWED: ReadonlySet<ExportFormat> = new Set([
  "python",
  "yaml",
  "terraform",
  "docker-compose",
  "kubernetes",
]);

function isExportFormat(value: string): value is ExportFormat {
  return ALLOWED.has(value as ExportFormat);
}

export async function POST(request: Request, context: RouteContext) {
  const url = new URL(request.url);
  const formatRaw = url.searchParams.get("format") ?? "python";

  if (!isExportFormat(formatRaw)) {
    return NextResponse.json(
      { detail: `Unsupported format: ${formatRaw}` },
      { status: 400 },
    );
  }

  try {
    const data = await apiFetch<ExportResponse>(
      `/api/designer/${context.params.projectId}/export`,
      {
        method: "POST",
        query: { format: formatRaw },
      },
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status === 0 ? 502 : error.status },
      );
    }
    return NextResponse.json(
      { detail: "Could not reach the API." },
      { status: 502 },
    );
  }
}
