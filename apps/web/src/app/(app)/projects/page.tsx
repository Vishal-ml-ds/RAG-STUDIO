import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { listProjects } from "@/services/projects";
import type { ProjectListResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  let projects: ProjectListResponse;
  try {
    projects = await listProjects({ pageSize: 100 });
  } catch {
    projects = { items: [], total: 0, page: 1, page_size: 100 };
  }

  return (
    <div className="px-6 py-8">
      <PageHeader
        title="Projects"
        description={`${projects.total} project${projects.total === 1 ? "" : "s"} in your account.`}
        actions={<CreateProjectDialog />}
      />

      <section className="mt-6">
        {projects.items.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Spin up a project to start configuring its RAG pipeline."
            action={<CreateProjectDialog />}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.items.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
