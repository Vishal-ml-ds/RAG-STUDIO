/**
 * Server-side auth helpers. Reads the JWT from the httpOnly session cookie
 * and proxies to the backend's /api/auth/me endpoint. Cached per request.
 */

import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { apiFetch, ApiError } from "@/lib/api-client";
import { SESSION_COOKIE } from "@/lib/constants";
import type { CurrentUserResponse } from "@/lib/types";

export const getCurrentUser = cache(
  async (): Promise<CurrentUserResponse | null> => {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token) return null;

    try {
      return await apiFetch<CurrentUserResponse>("/api/auth/me");
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return null;
      }
      // Network / 5xx: treat as unauthenticated so layouts can recover.
      return null;
    }
  },
);
