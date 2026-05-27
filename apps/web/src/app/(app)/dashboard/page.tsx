import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  LayoutTemplate,
  Wand2,
} from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { StatGrid } from "@/components/dashboard/StatGrid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRelative } from "@/lib/format";
import { listProjects } from "@/services/projects";
import type { ProjectListResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  let projects: ProjectListResponse;
  try {
    projects = await listProjects({ page: 1, pageSize: 5 });
  } catch {
    projects = { items: [], total: 0, page: 1, page_size: 5 };
  }

  const activeCount = projects.items.filter(
    (project) => project.status === "active",
  ).length;

  return (
    <div className="px-6 py-8">
      <PageHeader
        title="Dashboard"
        description="A quick view of your projects, pipelines, and recent activity."
        actions={
          <Link href="/projects">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              All projects
            </Button>
          </Link>
        }
      />

      <section className="mt-6">
        <StatGrid
          stats={[
            {
              label: "Projects",
              value: projects.total,
              hint: `${activeCount} active`,
              icon: FolderKanban,
            },
            {
              label: "Templates",
              value: 8,
              hint: "Curated presets",
              icon: LayoutTemplate,
            },
            {
              label: "Autopilot",
              value: "Ready",
              hint: "Brief to DesignerState",
              icon: Wand2,
            },
            {
              label: "API health",
              value: "OK",
              hint: "Backend reachable",
              icon: CheckCircle2,
            },
          ]}
        />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Recent projects
            </h2>
            <p className="text-xs text-text-secondary">
              Latest five projects from your account.
            </p>
          </div>
          <Link href="/projects">
            <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              View all
            </Button>
          </Link>
        </div>

        {projects.items.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to design a pipeline or hand off a brief to Autopilot."
            action={
              <Link href="/projects">
                <Button>Create project</Button>
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.items.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`}>
                  <Card interactive>
                    <CardHeader>
                      <div className="min-w-0">
                        <CardTitle className="truncate">{project.name}</CardTitle>
                        {project.description ? (
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        ) : null}
                      </div>
                      <Badge
                        tone={project.status === "active" ? "success" : "neutral"}
                      >
                        {project.status}
                      </Badge>
                    </CardHeader>
                    <p className="mt-4 text-xs text-text-tertiary">
                      Updated {formatRelative(project.updated_at)}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
