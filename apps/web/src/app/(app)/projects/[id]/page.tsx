import Link from "next/link";
import { ArrowRight, Boxes, LayoutDashboard, LineChart } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { DesignerStateResponse } from "@/lib/types";
import { formatRelative } from "@/lib/format";

interface ProjectOverviewPageProps {
  params: { id: string };
}

export default async function ProjectOverviewPage({
  params,
}: ProjectOverviewPageProps) {
  let designer: DesignerStateResponse | null = null;
  try {
    designer = await apiFetch<DesignerStateResponse>(
      `/api/designer/${params.id}`,
    );
  } catch (error) {
    if (!(error instanceof ApiError) || error.status >= 500) {
      throw error;
    }
  }

  const stageCount = designer ? Object.keys(designer.stages).length : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionCard
        href={`/projects/${params.id}/designer`}
        icon={LayoutDashboard}
        title="Designer"
        description="Configure each pipeline stage — chunking, retrieval, prompts, guardrails, evaluation."
        meta={
          designer
            ? `${stageCount} stages · v${designer.version} · updated ${formatRelative(designer.updated_at)}`
            : "Open to initialize defaults"
        }
        cta="Open designer"
      />

      <SectionCard
        href={`/projects/${params.id}/export`}
        icon={Boxes}
        title="Export"
        description="Generate Python, YAML, Terraform, Docker Compose, or Kubernetes manifests from the current pipeline."
        meta="5 formats supported"
        cta="Open export"
      />

      <SectionCard
        href={`/projects/${params.id}/evaluation`}
        icon={LineChart}
        title="Evaluation"
        description="Run the evaluation stage and inspect per-metric scores (faithfulness, relevancy, context precision)."
        meta="RAGAS or stub"
        cta="Run evaluation"
      />
    </div>
  );
}

interface SectionCardProps {
  href: string;
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  meta: string;
  cta: string;
}

function SectionCard({
  href,
  icon: Icon,
  title,
  description,
  meta,
  cta,
}: SectionCardProps) {
  return (
    <Link href={href} className="group block">
      <Card interactive className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-bg-raised text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <ArrowRight className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-accent" />
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription className="flex-1">{description}</CardDescription>
        <p className="mt-4 text-[11px] uppercase tracking-wider text-text-tertiary">
          {meta}
        </p>
        <div className="mt-4">
          <Button size="sm" variant="secondary">
            {cta}
          </Button>
        </div>
      </Card>
    </Link>
  );
}
