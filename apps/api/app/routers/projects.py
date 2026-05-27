"""/api/projects — owner-scoped CRUD."""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import AppSettings, DbSession, RequestUserId
from app.schemas.projects import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.projects import (
    ProjectNotFoundError,
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=ProjectListResponse)
async def list_my_projects(
    db: DbSession,
    user_id: RequestUserId,
    settings: AppSettings,
    page: int = Query(1, ge=1),
    page_size: int = Query(None, ge=1, le=100),
) -> ProjectListResponse:
    size = page_size or settings.default_page_size
    items, total = await list_projects(db, user_id=user_id, page=page, page_size=size)
    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=size,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ProjectResponse,
)
async def create(
    payload: ProjectCreate, db: DbSession, user_id: RequestUserId
) -> ProjectResponse:
    project = await create_project(db, user_id=user_id, payload=payload)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def read(
    project_id: uuid.UUID, db: DbSession, user_id: RequestUserId
) -> ProjectResponse:
    try:
        project = await get_project(db, user_id=user_id, project_id=project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: DbSession,
    user_id: RequestUserId,
) -> ProjectResponse:
    try:
        project = await update_project(
            db, user_id=user_id, project_id=project_id, payload=payload
        )
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    project_id: uuid.UUID, db: DbSession, user_id: RequestUserId
) -> None:
    try:
        await delete_project(db, user_id=user_id, project_id=project_id)
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc
