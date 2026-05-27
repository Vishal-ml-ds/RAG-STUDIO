"""Project business logic — separated from HTTP concerns."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.projects import ProjectCreate, ProjectUpdate


class ProjectNotFoundError(Exception):
    """Raised when a project doesn't exist or isn't owned by the caller."""


async def list_projects(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    page: int,
    page_size: int,
) -> tuple[list[Project], int]:
    offset = (page - 1) * page_size

    total = await db.scalar(
        select(func.count(Project.id)).where(Project.user_id == user_id)
    )

    result = await db.scalars(
        select(Project)
        .where(Project.user_id == user_id)
        .order_by(Project.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return list(result), total or 0


async def get_project(
    db: AsyncSession, *, user_id: uuid.UUID, project_id: uuid.UUID
) -> Project:
    project = await db.scalar(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if project is None:
        raise ProjectNotFoundError(str(project_id))
    return project


async def create_project(
    db: AsyncSession, *, user_id: uuid.UUID, payload: ProjectCreate
) -> Project:
    project = Project(
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        status="draft",
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def update_project(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    payload: ProjectUpdate,
) -> Project:
    project = await get_project(db, user_id=user_id, project_id=project_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(project, field, value)
    await db.flush()
    await db.refresh(project)
    return project


async def delete_project(
    db: AsyncSession, *, user_id: uuid.UUID, project_id: uuid.UUID
) -> None:
    project = await get_project(db, user_id=user_id, project_id=project_id)
    await db.delete(project)
    await db.flush()
