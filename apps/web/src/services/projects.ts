/**
 * Server-side data-access helpers for /api/projects.
 *
 * These wrap the typed api client and add small conveniences (default
 * pagination, sensible fallbacks on failure). Pages should call these
 * instead of hitting `apiFetch` directly so the contract stays in one place.
 */

import "server-only";

import { apiFetch } from "@/lib/api-client";
import type {
  ProjectCreate,
  ProjectListResponse,
  ProjectResponse,
  ProjectUpdate,
} from "@/lib/types";

interface ListOptions {
  page?: number;
  pageSize?: number;
}

export async function listProjects(
  options: ListOptions = {},
): Promise<ProjectListResponse> {
  return apiFetch<ProjectListResponse>("/api/projects", {
    query: {
      page: options.page ?? 1,
      page_size: options.pageSize ?? 50,
    },
  });
}

export async function getProject(id: string): Promise<ProjectResponse> {
  return apiFetch<ProjectResponse>(`/api/projects/${id}`);
}

export async function createProject(
  payload: ProjectCreate,
): Promise<ProjectResponse> {
  return apiFetch<ProjectResponse>("/api/projects", {
    method: "POST",
    body: payload,
  });
}

export async function updateProject(
  id: string,
  payload: ProjectUpdate,
): Promise<ProjectResponse> {
  return apiFetch<ProjectResponse>(`/api/projects/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" });
}
