/**
 * POST /api/auth/login (web)
 * --------------------------------------------------------------------------
 * Proxies credentials to the FastAPI backend, then mints an httpOnly session
 * cookie with the JWT so client components never touch the token directly.
 */

import { NextResponse } from "next/server";

import { apiFetch, ApiError } from "@/lib/api-client";
import { SESSION_COOKIE } from "@/lib/constants";
import type { TokenResponse } from "@/lib/types";

interface LoginPayload {
  email: string;
  password: string;
}

const SESSION_MAX_AGE_FALLBACK = 60 * 60 * 8; // 8h, matches backend default.

export async function POST(request: Request) {
  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
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
    const token = await apiFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: payload,
      noAuth: true,
    });

    const response = NextResponse.json(
      { ok: true, expires_in: token.expires_in },
      { status: 200 },
    );

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token.access_token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: token.expires_in || SESSION_MAX_AGE_FALLBACK,
    });

    return response;
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
