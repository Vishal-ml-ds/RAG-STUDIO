"""/api/guardrails — operator-facing policy check endpoint."""

from fastapi import APIRouter, HTTPException, status

from app.dependencies import DbSession, RequestUserId
from app.schemas.guardrails import (
    GuardrailCheckRequest,
    GuardrailCheckResponse,
)
from app.services.guardrails import run_check
from app.services.projects import ProjectNotFoundError

router = APIRouter(prefix="/api/guardrails", tags=["guardrails"])


@router.post("/check", response_model=GuardrailCheckResponse)
async def check_text(
    payload: GuardrailCheckRequest,
    db: DbSession,
    user_id: RequestUserId,
) -> GuardrailCheckResponse:
    try:
        result = await run_check(
            db,
            user_id=user_id,
            text=payload.text,
            direction=payload.direction,
            context=payload.context,
            project_id=payload.project_id,
            policies_override=payload.policies,
        )
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc

    return GuardrailCheckResponse.model_validate(result)
