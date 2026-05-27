"""/api/designer — stages catalog + per-project designer state."""

import uuid

from fastapi import APIRouter, HTTPException, status

from app.core.designer import load_stages_catalog
from app.dependencies import DbSession, RequestUserId
from app.schemas.designer import (
    DesignerStatePut,
    DesignerStateResponse,
    StagesCatalogResponse,
)
from app.services.designer import get_or_create_state, save_state
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
