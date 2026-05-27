"""Export request / response schemas."""

from pydantic import BaseModel

from app.core.export import ExportFormat


class ExportRequest(BaseModel):
    """Optional body; the format is also accepted as a query string."""

    format: ExportFormat | None = None


class ExportResponse(BaseModel):
    project_id: str
    format: ExportFormat
    filename: str
    content: str
