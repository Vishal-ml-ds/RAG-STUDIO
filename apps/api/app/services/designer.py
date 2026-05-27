"""Designer state business logic."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.designer import DEFAULT_STAGE_CONFIG
from app.models.designer_state import DesignerState
from app.models.project import Project
from app.services.projects import ProjectNotFoundError


async def _assert_owned(
    db: AsyncSession, *, user_id: uuid.UUID, project_id: uuid.UUID
) -> Project:
    project = await db.scalar(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if project is None:
        raise ProjectNotFoundError(str(project_id))
    return project


async def get_or_create_state(
    db: AsyncSession, *, user_id: uuid.UUID, project_id: uuid.UUID
) -> DesignerState:
    """Return the project's designer state, creating it from defaults on first read."""
    await _assert_owned(db, user_id=user_id, project_id=project_id)

    state = await db.scalar(
        select(DesignerState).where(DesignerState.project_id == project_id)
    )
    if state is not None:
        return state

    state = DesignerState(
        project_id=project_id,
        version=1,
        stages={k: dict(v) for k, v in DEFAULT_STAGE_CONFIG.items()},
    )
    db.add(state)
    await db.flush()
    await db.refresh(state)
    return state


async def save_state(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    stages: dict[str, dict],
) -> DesignerState:
    state = await get_or_create_state(db, user_id=user_id, project_id=project_id)
    state.stages = stages
    state.version += 1
    await db.flush()
    await db.refresh(state)
    return state
