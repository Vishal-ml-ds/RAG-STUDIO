"""Evaluation service — runs the RAGAS evaluator and persists results."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.evaluation import run_evaluation
from app.models.evaluation_run import EvaluationRun
from app.services.designer import get_or_create_state
from app.services.projects import ProjectNotFoundError, get_project


_DEFAULT_METRICS = ["faithfulness", "answer_relevancy", "context_precision"]


def _resolve_metrics(
    state_stages: dict, override: list[str] | None
) -> list[str]:
    if override:
        return list(override)
    cfg = (state_stages or {}).get("evaluation", {}) or {}
    metrics = cfg.get("metrics") or _DEFAULT_METRICS
    return list(metrics)


async def run_project_evaluation(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    metrics_override: list[str] | None,
    dataset_ref: str | None,
    sample_count: int,
) -> EvaluationRun:
    """Execute an evaluation pass and persist an ``EvaluationRun`` row.

    Raises ``ProjectNotFoundError`` if the project isn't owned by the caller.
    """
    # Ownership / existence check.
    await get_project(db, user_id=user_id, project_id=project_id)

    state = await get_or_create_state(
        db, user_id=user_id, project_id=project_id
    )
    metrics = _resolve_metrics(state.stages, metrics_override)

    outcome = run_evaluation(
        metrics=metrics,
        dataset_ref=dataset_ref,
        sample_count=sample_count,
    )

    run = EvaluationRun(
        project_id=project_id,
        user_id=user_id,
        framework=outcome.framework,
        mode=outcome.mode.value,
        status="completed",
        dataset_ref=dataset_ref,
        metrics=list(outcome.metrics),
        scores=dict(outcome.scores),
        summary=dict(outcome.summary),
    )
    db.add(run)
    await db.flush()
    await db.refresh(run)
    return run


__all__ = [
    "ProjectNotFoundError",
    "run_project_evaluation",
]
