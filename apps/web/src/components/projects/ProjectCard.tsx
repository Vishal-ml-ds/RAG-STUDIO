import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRelative } from "@/lib/format";
import type { ProjectResponse } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectResponse;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card interactive>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 truncate">
              {project.name}
              <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary transition-colors group-hover:text-accent" />
            </CardTitle>
            {project.description ? (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            ) : (
              <CardDescription className="italic text-text-tertiary">
                No description yet.
              </CardDescription>
            )}
          </div>
          <Badge tone={project.status === "active" ? "success" : "neutral"}>
            {project.status}
          </Badge>
        </CardHeader>

        <div className="mt-5 flex items-center justify-between text-xs text-text-tertiary">
          <span>Updated {formatRelative(project.updated_at)}</span>
          <span className="font-mono text-[10px] text-text-tertiary">
            {project.id.slice(0, 8)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
