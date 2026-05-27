"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  DesignerStateResponse,
  StageConfig,
  StageDescriptor,
} from "@/lib/types";

interface UseDesignerStateOptions {
  initialState: DesignerStateResponse;
  catalog: StageDescriptor[];
}

export interface DesignerStateController {
  stages: Record<string, StageConfig>;
  baseline: Record<string, StageConfig>;
  dirtyStageIds: Set<string>;
  isDirty: boolean;
  setStageConfig: (stageId: string, next: StageConfig) => void;
  resetStage: (stageId: string) => void;
  reset: () => void;
  syncBaseline: (next: Record<string, StageConfig>) => void;
}

function cloneStages(
  source: Record<string, StageConfig>,
): Record<string, StageConfig> {
  const next: Record<string, StageConfig> = {};
  for (const [id, config] of Object.entries(source)) {
    next[id] = { ...config };
  }
  return next;
}

function mergeWithCatalog(
  state: Record<string, StageConfig>,
  catalog: StageDescriptor[],
): Record<string, StageConfig> {
  const merged: Record<string, StageConfig> = {};
  for (const stage of catalog) {
    const existing = state[stage.id];
    merged[stage.id] = existing ? { ...existing } : { ...stage.default };
  }
  return merged;
}

export function useDesignerState({
  initialState,
  catalog,
}: UseDesignerStateOptions): DesignerStateController {
  const initialMerged = useMemo(
    () => mergeWithCatalog(initialState.stages ?? {}, catalog),
    [initialState.stages, catalog],
  );

  const [baseline, setBaseline] = useState(initialMerged);
  const [stages, setStages] = useState(() => cloneStages(initialMerged));

  const setStageConfig = useCallback(
    (stageId: string, next: StageConfig) => {
      setStages((prev) => ({ ...prev, [stageId]: next }));
    },
    [],
  );

  const resetStage = useCallback(
    (stageId: string) => {
      setStages((prev) => ({
        ...prev,
        [stageId]: { ...(baseline[stageId] ?? {}) },
      }));
    },
    [baseline],
  );

  const reset = useCallback(() => {
    setStages(cloneStages(baseline));
  }, [baseline]);

  const syncBaseline = useCallback(
    (next: Record<string, StageConfig>) => {
      const cloned = cloneStages(next);
      setBaseline(cloned);
      setStages(cloneStages(cloned));
    },
    [],
  );

  const dirtyStageIds = useMemo(() => {
    const set = new Set<string>();
    for (const stageId of Object.keys(stages)) {
      const current = stages[stageId];
      const base = baseline[stageId];
      if (!shallowEqual(current, base)) {
        set.add(stageId);
      }
    }
    return set;
  }, [stages, baseline]);

  return {
    stages,
    baseline,
    dirtyStageIds,
    isDirty: dirtyStageIds.size > 0,
    setStageConfig,
    resetStage,
    reset,
    syncBaseline,
  };
}

function shallowEqual(
  a: StageConfig | undefined,
  b: StageConfig | undefined,
): boolean {
  // We compare JSON-serialized forms — designer configs are JSON-safe by design.
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
}
