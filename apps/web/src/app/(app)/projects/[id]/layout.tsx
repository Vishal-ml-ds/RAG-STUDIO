import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { ApiError } from "@/lib/api-client";
import { formatRelative } from "@/lib/format";
import { getProject } from "@/services/projects";

interface ProjectLayoutProps {
  children: ReactNode;
  params: { id: string };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const project = await getProject(params.id);
    return { title: project.name };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  let project;
  try {
    project = await getProject(params.id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <Badge tone={project.status === "active" ? "success" : "neutral"}>
              {project.status}
            </Badge>
          </div>
          {project.description ? (
            <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-text-secondary">
              {project.description}
            </p>
          ) : (
            <p className="mt-1 text-sm italic text-text-tertiary">
              No description yet.
            </p>
          )}
          <p className="mt-2 text-xs text-text-tertiary">
            Updated {formatRelative(project.updated_at)} ·{" "}
            <span className="font-mono">{project.id.slice(0, 8)}</span>
          </p>
        </div>
      </div>

      <ProjectTabs projectId={project.id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
