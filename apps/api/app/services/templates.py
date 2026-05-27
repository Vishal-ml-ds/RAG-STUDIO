"""Template business logic — list, get, instantiate."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.templates import (
    get_template_by_id,
    list_templates,
    load_templates_catalog,
)
from app.models.designer_state import DesignerState
from app.services.designer import save_state


class TemplateNotFoundError(Exception):
    """Raised when a requested template id is not in the catalog."""


def catalog_envelope() -> dict:
    """Return the catalog version + a compact summary per template."""
    catalog = load_templates_catalog()
    summaries = [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t["description"],
            "category": t["category"],
            "tags": t.get("tags", []),
            "recommended_use_cases": t.get("recommended_use_cases", []),
        }
        for t in catalog.get("templates", [])
    ]
    return {"version": catalog.get("version", 1), "templates": summaries}


def get_template_detail(template_id: str) -> dict:
    template = get_template_by_id(template_id)
    if template is None:
        raise TemplateNotFoundError(template_id)
    return template


async def instantiate_into_project(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    template_id: str,
    project_id: uuid.UUID,
) -> DesignerState:
    """Apply a template's stages to the project's DesignerState.

    Owner enforcement, project existence, and version bumping are handled by
    ``save_state`` (which itself delegates to ``get_or_create_state``).
    """
    template = get_template_by_id(template_id)
    if template is None:
        raise TemplateNotFoundError(template_id)

    stages = {k: dict(v) for k, v in template.get("stages", {}).items()}
    return await save_state(
        db, user_id=user_id, project_id=project_id, stages=stages
    )


# Re-export for any callers that import via the service layer.
__all__ = [
    "TemplateNotFoundError",
    "catalog_envelope",
    "get_template_detail",
    "instantiate_into_project",
    "list_templates",
]
