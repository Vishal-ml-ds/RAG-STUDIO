/**
 * Web-side proxy for /api/designer/{project_id}.
 *
 * The designer canvas runs in the browser and needs to PUT updated stage
 * config. This route forwards to the backend with the JWT cookie attached.
 */

import { NextResponse } from "next/server";

import { apiFetch, ApiError } from "@/lib/api-client";
import type { DesignerStatePut, DesignerStateResponse } from "@/lib/types";

interface RouteContext {
  params: { projectId: string };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const data = await apiFetch<DesignerStateResponse>(
      `/api/designer/${context.params.projectId}`,
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  let body: DesignerStatePut;
  try {
    body = (await request.json()) as DesignerStatePut;
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const data = await apiFetch<DesignerStateResponse>(
      `/api/designer/${context.params.projectId}`,
      { method: "PUT", body },
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}

function errorToResponse(error: unknown): NextResponse {
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
