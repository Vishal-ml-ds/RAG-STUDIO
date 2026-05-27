"""Template catalog loader.

Templates are curated DesignerState presets (e.g. "PDF chatbot",
"Wikipedia QA"). The catalog ships as JSON at ``data/templates.json``.
"""

from functools import lru_cache
import json
from pathlib import Path
from typing import Any

from app.config import get_settings


def _find_data_file(filename: str) -> Path:
    """Locate ``data/<filename>`` by walking up from this module until the
    repo root is found.
    """
    cursor = Path(__file__).resolve()
    for parent in cursor.parents:
        candidate = parent / "data" / filename
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        f"Could not locate data/{filename} starting from {cursor}"
    )


def _catalog_path() -> Path:
    override = get_settings().templates_catalog_path.strip()
    if override:
        return Path(override).expanduser().resolve()
    return _find_data_file("templates.json")


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
