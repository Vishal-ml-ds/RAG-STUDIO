/**
 * POST /api/auth/register (web)
 * --------------------------------------------------------------------------
 * Forwards the registration to the FastAPI backend. Auto-login is handled
 * client-side after a successful response.
 */

import { NextResponse } from "next/server";

import { apiFetch, ApiError } from "@/lib/api-client";
import type { CurrentUserResponse } from "@/lib/types";

interface RegisterPayload {
  email: string;
  password: string;
  name?: string | null;
}

export async function POST(request: Request) {
  let payload: RegisterPayload;
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!payload.email || !payload.password) {
    return NextResponse.json(
      { detail: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const user = await apiFetch<CurrentUserResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
      noAuth: true,
    });
    return NextResponse.json(user, { status: 201 });
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
