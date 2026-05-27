"""Designer stage catalog loader."""

from functools import lru_cache
import json
from pathlib import Path
from typing import Any


def _find_data_file(filename: str) -> Path:
    """Locate ``data/<filename>`` by walking up from this module until the
    repo root is found. Survives file moves better than a fixed parents index.
    """
    cursor = Path(__file__).resolve()
    for parent in cursor.parents:
        candidate = parent / "data" / filename
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        f"Could not locate data/{filename} starting from {cursor}"
    )


@lru_cache
def load_stages_catalog() -> dict[str, Any]:
    """Read and cache the 17-stage catalog from data/designer_stages.json."""
    with _find_data_file("designer_stages.json").open(encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache
def _stages_list() -> list[dict[str, Any]]:
    return load_stages_catalog().get("stages", [])


DESIGNER_STAGES: list[dict[str, Any]] = _stages_list()


def _build_default_config() -> dict[str, dict[str, Any]]:
    return {stage["id"]: dict(stage.get("default", {})) for stage in _stages_list()}


DEFAULT_STAGE_CONFIG: dict[str, dict[str, Any]] = _build_default_config()
