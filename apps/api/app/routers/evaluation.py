"""/api/evaluation — RAGAS-style evaluation runs."""

import uuid

from fastapi import APIRouter, HTTPException, status

from app.dependencies import DbSession, RequestUserId
from app.schemas.evaluation import EvaluationRunRequest, EvaluationRunResponse
from app.services.evaluation import (
    ProjectNotFoundError,
    run_project_evaluation,
)

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


@router.post(
    "/run/{project_id}",
    response_model=EvaluationRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def run_evaluation_endpoint(
    project_id: uuid.UUID,
    payload: EvaluationRunRequest,
    db: DbSession,
    user_id: RequestUserId,
) -> EvaluationRunResponse:
    try:
        run = await run_project_evaluation(
            db,
            user_id=user_id,
            project_id=project_id,
            metrics_override=payload.metrics,
            dataset_ref=payload.dataset_ref,
            sample_count=payload.sample_count,
        )
    except ProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        ) from exc

    return EvaluationRunResponse.model_validate(run)
