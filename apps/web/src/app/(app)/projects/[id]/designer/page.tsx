import type { Metadata } from "next";

import { DesignerCanvas } from "@/components/designer/DesignerCanvas";
import { apiFetch } from "@/lib/api-client";
import { DESIGNER_STAGES } from "@/lib/constants";
import type {
  DesignerStateResponse,
  StagesCatalogResponse,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Designer",
};

interface DesignerPageProps {
  params: { id: string };
}

export default async function DesignerPage({ params }: DesignerPageProps) {
  // Fetch in parallel — catalog rarely changes but the state is per-project.
  const [catalogResult, stateResult] = await Promise.allSettled([
    apiFetch<StagesCatalogResponse>("/api/designer/stages"),
    apiFetch<DesignerStateResponse>(`/api/designer/${params.id}`),
  ]);

  const catalog =
    catalogResult.status === "fulfilled"
      ? catalogResult.value.stages
      : DESIGNER_STAGES;

  if (stateResult.status !== "fulfilled") {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-sm text-danger">
        Could not load designer state for this project. Make sure the API is
        reachable and reload the page.
      </div>
    );
  }

  return (
    <DesignerCanvas
      projectId={params.id}
      initialState={stateResult.value}
      catalog={catalog}
    />
  );
}
