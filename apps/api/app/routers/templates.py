"""/api/templates — curated DesignerState presets."""

import uuid

from fastapi import APIRouter, HTTPException, status

from app.dependencies import DbSession, RequestUserId
from app.schemas.designer import DesignerStateResponse
from app.schemas.templates import (
    TemplateInstantiateRequest,
    TemplateListResponse,
    TemplateResponse,
)
from app.services.projects import ProjectNotFoundError
from app.services.templates import (
    TemplateNotFoundError,
    catalog_envelope,
    get_template_detail,
    instantiate_into_project,
)

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=TemplateListResponse)
async def list_templates_endpoint() -> TemplateListResponse:
    return TemplateListResponse.model_validate(catalog_envelope())


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template_endpoint(template_id: str) -> TemplateResponse:
    try:
        template = get_template_detail(template_id)
    except TemplateNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found",
        ) from exc
    return TemplateResponse.model_validate(template)


@router.post(
    "/{template_id}/instantiate",
    response_model=DesignerStateResponse,
    status_code=status.HTTP_200_OK,
)
async def instantiate_template_endpoint(
    template_id: str,
    payload: TemplateInstantiateRequest,
    db: DbSession,
    user_id: RequestUserId,
) -> DesignerStateResponse:
    try:
        project_uuid = uuid.UUID(payload.project_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="project_id must be a valid UUID",
        ) from exc

    try:
        state = await instantiate_into_project(
            db,
            user_id=user_id,
            template_id=template_id,
            project_id=project_uuid,
        )
    except TemplateNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found",
        ) from exc
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        ) from exc

    return DesignerStateResponse.model_validate(state)
