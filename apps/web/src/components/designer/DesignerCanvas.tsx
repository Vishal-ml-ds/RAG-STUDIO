"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes } from "lucide-react";

import { CategoryFilter, type CategoryValue } from "@/components/designer/CategoryFilter";
import { SaveBar } from "@/components/designer/SaveBar";
import { StageCard } from "@/components/designer/StageCard";
import { StageEditor } from "@/components/designer/StageEditor";
import { useDesignerState } from "@/components/designer/useDesignerState";
import { EmptyState } from "@/components/app/EmptyState";
import type {
  DesignerStateResponse,
  StageDescriptor,
} from "@/lib/types";

interface DesignerCanvasProps {
  projectId: string;
  initialState: DesignerStateResponse;
  catalog: StageDescriptor[];
}

export function DesignerCanvas({
  projectId,
  initialState,
  catalog,
}: DesignerCanvasProps) {
  const router = useRouter();
  const controller = useDesignerState({ initialState, catalog });

  const [activeStageId, setActiveStageId] = useState<string | null>(
    catalog[0]?.id ?? null,
  );
  const [category, setCategory] = useState<CategoryValue>("all");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    if (category === "all") return catalog;
    return catalog.filter((stage) => stage.category === category);
  }, [catalog, category]);

  const activeStage = useMemo(
    () => catalog.find((stage) => stage.id === activeStageId) ?? null,
    [catalog, activeStageId],
  );

  // TODO: drag-and-drop reordering is out of scope for the initial UI.
  // The 17 stages are presented in catalog order; reordering will arrive
  // alongside a backend schema for stage ordering.

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/designer/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages: controller.stages }),
      });

      if (!res.ok) {
        const body = (await safeJson(res)) as { detail?: string } | null;
        setSaveError(body?.detail ?? "Could not save the pipeline.");
        return;
      }

      const next = (await res.json()) as DesignerStateResponse;
      controller.syncBaseline(next.stages);
      router.refresh();
    } catch {
      setSaveError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <CategoryFilter
        value={category}
        onChange={setCategory}
        dirtyCount={controller.dirtyStageIds.size}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3 pb-32">
          {filteredCatalog.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No stages in this category"
              description="Switch to All or another category to keep editing."
            />
          ) : (
            filteredCatalog.map((stage) => {
              const index = catalog.findIndex((s) => s.id === stage.id);
              return (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  config={controller.stages[stage.id] ?? {}}
                  isDirty={controller.dirtyStageIds.has(stage.id)}
                  isActive={stage.id === activeStageId}
                  onSelect={() => setActiveStageId(stage.id)}
                />
              );
            })
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {activeStage ? (
            <StageEditor
              stage={activeStage}
              config={controller.stages[activeStage.id] ?? {}}
              isDirty={controller.dirtyStageIds.has(activeStage.id)}
              onChange={(next) => controller.setStageConfig(activeStage.id, next)}
              onResetStage={() => controller.resetStage(activeStage.id)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
              Pick a stage to edit its configuration.
            </div>
          )}
        </aside>
      </div>

      <SaveBar
        isDirty={controller.isDirty}
        dirtyCount={controller.dirtyStageIds.size}
        saving={saving}
        error={saveError}
        onSave={onSave}
        onDiscard={controller.reset}
      />
    </div>
  );
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
