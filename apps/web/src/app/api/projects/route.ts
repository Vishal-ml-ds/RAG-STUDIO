/**
 * Web-side proxy routes for /api/projects.
 *
 * Client components can't reach the backend directly (the JWT lives in an
 * httpOnly cookie that only server contexts can read). These handlers act
 * as a thin shim that re-attaches the bearer token via `apiFetch`.
 */

import { NextResponse } from "next/server";

import { apiFetch, ApiError } from "@/lib/api-client";
import type {
  ProjectCreate,
  ProjectListResponse,
  ProjectResponse,
} from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("page_size") ?? "50");

  try {
    const data = await apiFetch<ProjectListResponse>("/api/projects", {
      query: { page, page_size: pageSize },
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(request: Request) {
  let payload: ProjectCreate;
  try {
    payload = (await request.json()) as ProjectCreate;
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!payload.name) {
    return NextResponse.json(
      { detail: "name is required." },
      { status: 400 },
    );
  }

  try {
    const project = await apiFetch<ProjectResponse>("/api/projects", {
      method: "POST",
      body: payload,
    });
    return NextResponse.json(project, { status: 201 });
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
