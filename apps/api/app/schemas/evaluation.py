"""Evaluation request / response schemas."""

from datetime import datetime
from typing import Any
import uuid

from pydantic import BaseModel, ConfigDict, Field


class EvaluationRunRequest(BaseModel):
    metrics: list[str] | None = Field(
        default=None,
        description="Override the metric list; defaults to the project's evaluation stage config.",
    )
    dataset_ref: str | None = Field(
        default=None,
        max_length=512,
        description="Free-form pointer to the eval dataset (S3 URI, dataset id, etc.).",
    )
    sample_count: int = Field(default=0, ge=0, le=100000)


class EvaluationRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    framework: str
    mode: str
    status: str
    dataset_ref: str | None
    metrics: list[str]
    scores: dict[str, float]
    summary: dict[str, Any]
    created_at: datetime
    updated_at: datetime
