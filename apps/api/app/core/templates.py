"""Template catalog loader.

Templates are curated DesignerState presets (e.g. "PDF chatbot",
"Wikipedia QA"). The catalog ships as JSON at ``data/templates.json``.
"""

from functools import lru_cache
import json
from pathlib import Path
from typing import Any

from app.config import get_settings

# Repo layout: apps/api/app/core/templates.py → ../../../../data/templates.json
_DEFAULT_PATH = (
    Path(__file__).resolve().parents[3] / "data" / "templates.json"
)


def _catalog_path() -> Path:
    override = get_settings().templates_catalog_path.strip()
    if override:
        return Path(override).expanduser().resolve()
    return _DEFAULT_PATH


@lru_cache
def load_templates_catalog() -> dict[str, Any]:
    """Read and cache the full templates catalog from disk."""
    path = _catalog_path()
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def list_templates() -> list[dict[str, Any]]:
    return list(load_templates_catalog().get("templates", []))


def get_template_by_id(template_id: str) -> dict[str, Any] | None:
    for template in list_templates():
        if template.get("id") == template_id:
            return template
    return None
