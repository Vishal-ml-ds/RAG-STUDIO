"""Designer state request / response schemas."""

from datetime import datetime
from typing import Any
import uuid

from pydantic import BaseModel, ConfigDict, Field


class StageDescriptor(BaseModel):
    id: str
    name: str
    category: str
    description: str
    default: dict[str, Any] = Field(default_factory=dict)


class StagesCatalogResponse(BaseModel):
    version: int
    stages: list[StageDescriptor]


class DesignerStatePut(BaseModel):
    stages: dict[str, dict[str, Any]] = Field(default_factory=dict)


class DesignerStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    version: int
    stages: dict[str, dict[str, Any]]
    created_at: datetime
    updated_at: datetime
