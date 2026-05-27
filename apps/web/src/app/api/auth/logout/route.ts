/**
 * DELETE /api/auth/logout (web)
 * --------------------------------------------------------------------------
 * Clears the session cookie. Stateless on the backend — the JWT simply
 * expires; we drop the local cookie so subsequent requests are unauthenticated.
 */

import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST() {
  // Allow form-style POST logout from links/buttons.
  return DELETE();
}
