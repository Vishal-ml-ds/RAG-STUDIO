"""Autopilot request / response schemas."""

from datetime import datetime
from typing import Any
import uuid

from pydantic import BaseModel, Field


class AutopilotBuildRequest(BaseModel):
    brief: str = Field(min_length=10, max_length=5000)
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Optional override; derived from the brief when omitted.",
    )


class AutopilotBuildResponse(BaseModel):
    project_id: uuid.UUID
    build_history_id: uuid.UUID
    name: str
    description: str
    state: dict[str, dict[str, Any]]
    reasoning: list[str]
    created_at: datetime
