"""Autopilot service — creates a Project + DesignerState from a brief."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.autopilot import build_state_from_brief
from app.models.build_history import BuildHistory
from app.models.designer_state import DesignerState
from app.models.project import Project


async def build_from_brief(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    brief: str,
    name_override: str | None = None,
) -> dict:
    """Plan → create Project → create DesignerState → record BuildHistory.

    Returns a serialisable summary; callers wrap it in the response schema.
    """
    plan = build_state_from_brief(brief)
    project_name = (name_override or plan.project_name).strip()
    if not project_name:
        project_name = "Autopilot Project"

    project = Project(
        user_id=user_id,
        name=project_name[:255],
        description=plan.description[:2000] if plan.description else None,
        status="draft",
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)

    state = DesignerState(
        project_id=project.id,
        version=1,
        stages={k: dict(v) for k, v in plan.stages.items()},
    )
    db.add(state)

    history = BuildHistory(
        user_id=user_id,
        project_id=project.id,
        brief=brief,
        status="completed",
        plan={
            "project_name": project_name,
            "reasoning": list(plan.reasoning),
            "stages": {k: dict(v) for k, v in plan.stages.items()},
        },
    )
    db.add(history)

    await db.flush()
    await db.refresh(state)
    await db.refresh(history)

    return {
        "project_id": project.id,
        "build_history_id": history.id,
        "name": project.name,
        "description": project.description or "",
        "state": dict(state.stages or {}),
        "reasoning": list(plan.reasoning),
        "created_at": history.created_at,
    }


__all__ = ["build_from_brief"]
