"""/api/designer — stages catalog + per-project designer state."""

import uuid

from fastapi import APIRouter, HTTPException, status

from app.core.designer import load_stages_catalog
from app.core.export import ExportFormat, UnsupportedExportFormatError
from app.dependencies import DbSession, RequestUserId
from app.schemas.designer import (
    DesignerStatePut,
    DesignerStateResponse,
    StagesCatalogResponse,
)
from app.schemas.export import ExportResponse
from app.services.designer import get_or_create_state, save_state
from app.services.export import export_pipeline
from app.services.projects import ProjectNotFoundError

router = APIRouter(prefix="/api/designer", tags=["designer"])


@router.get("/stages", response_model=StagesCatalogResponse)
async def stages_catalog() -> StagesCatalogResponse:
    return StagesCatalogResponse.model_validate(load_stages_catalog())


@router.get("/{project_id}", response_model=DesignerStateResponse)
async def read_state(
    project_id: uuid.UUID, db: DbSession, user_id: RequestUserId
) -> DesignerStateResponse:
    try:
        state = await get_or_create_state(db, user_id=user_id, project_id=project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc
    return DesignerStateResponse.model_validate(state)


@router.post(
    "/{project_id}/export",
    response_model=ExportResponse,
    status_code=status.HTTP_200_OK,
)
async def export_state(
    project_id: uuid.UUID,
    format: ExportFormat,
    db: DbSession,
    user_id: RequestUserId,
) -> ExportResponse:
    try:
        payload = await export_pipeline(
            db, user_id=user_id, project_id=project_id, fmt=format
        )
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc
    except UnsupportedExportFormatError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported export format: {exc}",
        ) from exc
    return ExportResponse.model_validate(payload)


@router.put("/{project_id}", response_model=DesignerStateResponse)
async def write_state(
    project_id: uuid.UUID,
    payload: DesignerStatePut,
    db: DbSession,
    user_id: RequestUserId,
) -> DesignerStateResponse:
    try:
        state = await save_state(
            db,
            user_id=user_id,
            project_id=project_id,
            stages=payload.stages,
        )
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc
    return DesignerStateResponse.model_validate(state)
