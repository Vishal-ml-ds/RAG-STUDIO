/**
 * Server-side HTTP client for the FastAPI backend.
 *
 * Auth model: the JWT lives in an httpOnly cookie (see SESSION_COOKIE). On
 * every request we read the cookie via `next/headers` and attach a Bearer
 * Authorization header. Tokens never reach the browser.
 *
 * This module is intentionally server-only — calling it from a client
 * component will throw at import time because `next/headers` is forbidden
 * outside server components / route handlers.
 */

import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_API_URL, SESSION_COOKIE } from "@/lib/constants";
import { ApiError, type ApiErrorBody } from "@/lib/types";

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** JSON body (auto-stringified). Use `rawBody` for non-JSON. */
  body?: unknown;
  /** Raw body that bypasses JSON serialization. */
  rawBody?: BodyInit;
  /** Query string parameters. */
  query?: Record<string, string | number | boolean | undefined>;
  /** Bypass cookie-based auth and use this token instead (login/register flows). */
  authToken?: string | null;
  /** Don't attach any auth header. */
  noAuth?: boolean;
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    DEFAULT_API_URL.replace(/\/$/, "")
  );
}

function buildQuery(query: ApiFetchOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function getSessionToken(): string | null {
  try {
    return cookies().get(SESSION_COOKIE)?.value ?? null;
  } catch {
    // cookies() throws outside a request scope (e.g. during build).
    return null;
  }
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody | null> {
  try {
    return (await res.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

function errorMessage(body: ApiErrorBody | null, fallback: string): string {
  if (!body?.detail) return fallback;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail) && body.detail.length > 0) {
    const first = body.detail[0];
    return first?.msg ?? fallback;
  }
  return fallback;
}

/**
 * Issue a request against the backend and return the parsed JSON body.
 *
 * On non-2xx responses this throws {@link ApiError} with the upstream status
 * and body so callers can branch on `err.status === 401` etc.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    body,
    rawBody,
    query,
    headers,
    authToken,
    noAuth,
    method = "GET",
    ...rest
  } = options;

  const url = `${getApiBaseUrl()}${path}${buildQuery(query)}`;
  const finalHeaders = new Headers(headers);

  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json");
  }

  let payload: BodyInit | undefined;
  if (rawBody !== undefined) {
    payload = rawBody;
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    if (!finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
  }

  if (!noAuth) {
    const token = authToken ?? getSessionToken();
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(url, {
    ...rest,
    method,
    headers: finalHeaders,
    body: payload,
    // RAG Studio cookies are app-scoped; we never want to send them upstream.
    credentials: "omit",
    cache: rest.cache ?? "no-store",
  });

  if (!res.ok) {
    const errBody = await parseErrorBody(res);
    throw new ApiError(
      res.status,
      errorMessage(errBody, `Request failed with status ${res.status}`),
      errBody,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}

export { ApiError };
