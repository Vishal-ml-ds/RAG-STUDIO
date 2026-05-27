"""/api/autopilot — brief-driven project + DesignerState creation."""

from fastapi import APIRouter, status

from app.dependencies import DbSession, RequestUserId
from app.schemas.autopilot import AutopilotBuildRequest, AutopilotBuildResponse
from app.services.autopilot import build_from_brief

router = APIRouter(prefix="/api/autopilot", tags=["autopilot"])


@router.post(
    "/build",
    response_model=AutopilotBuildResponse,
    status_code=status.HTTP_201_CREATED,
)
async def build_endpoint(
    payload: AutopilotBuildRequest,
    db: DbSession,
    user_id: RequestUserId,
) -> AutopilotBuildResponse:
    result = await build_from_brief(
        db,
        user_id=user_id,
        brief=payload.brief,
        name_override=payload.name,
    )
    return AutopilotBuildResponse.model_validate(result)
