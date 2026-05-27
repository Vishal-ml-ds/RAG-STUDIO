"""Export service — loads the project's DesignerState and dispatches to the exporter."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.export import (
    ExportFormat,
    UnsupportedExportFormatError,
    render,
)
from app.services.designer import get_or_create_state
from app.services.projects import ProjectNotFoundError, get_project


async def export_pipeline(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    fmt: ExportFormat,
) -> dict:
    """Return ``{project_id, format, filename, content}``.

    Raises ``ProjectNotFoundError`` if the caller doesn't own the project,
    and ``UnsupportedExportFormatError`` if the format isn't registered.
    """
    project = await get_project(db, user_id=user_id, project_id=project_id)
    state = await get_or_create_state(
        db, user_id=user_id, project_id=project_id
    )

    stages = dict(state.stages or {})
    filename, content = render(fmt, stages, project_name=project.name)

    return {
        "project_id": str(project_id),
        "format": fmt,
        "filename": filename,
        "content": content,
    }


__all__ = [
    "ExportFormat",
    "ProjectNotFoundError",
    "UnsupportedExportFormatError",
    "export_pipeline",
]
