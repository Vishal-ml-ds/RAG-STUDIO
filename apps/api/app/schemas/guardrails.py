"""Guardrails request / response schemas."""

from typing import Any, Literal
import uuid

from pydantic import BaseModel, Field


class GuardrailCheckRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    direction: Literal["input", "output"] = "input"
    context: str | None = Field(default=None, max_length=50000)
    project_id: uuid.UUID | None = None
    # When set, overrides the policies the service would otherwise derive
    # from the project's DesignerState ``guardrails`` stage config.
    policies: list[str] | None = None


class FindingResponse(BaseModel):
    check: str
    severity: str
    message: str
    matches: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class GuardrailCheckResponse(BaseModel):
    allowed: bool
    direction: Literal["input", "output"]
    policies_applied: list[str]
    findings: list[FindingResponse] = Field(default_factory=list)
