"""Template request / response schemas."""

from typing import Any

from pydantic import BaseModel, Field


class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    tags: list[str] = Field(default_factory=list)
    recommended_use_cases: list[str] = Field(default_factory=list)
    stages: dict[str, dict[str, Any]] = Field(default_factory=dict)


class TemplateSummary(BaseModel):
    """Compact view used by the list endpoint (no full stages payload)."""

    id: str
    name: str
    description: str
    category: str
    tags: list[str] = Field(default_factory=list)
    recommended_use_cases: list[str] = Field(default_factory=list)


class TemplateListResponse(BaseModel):
    version: int
    templates: list[TemplateSummary]


class TemplateInstantiateRequest(BaseModel):
    project_id: str = Field(min_length=1)
