"""Designer stage catalog loader."""

from functools import lru_cache
import json
from pathlib import Path
from typing import Any

# Repo layout: apps/api/app/core/designer/stages.py → ../../../../data/designer_stages.json
_CATALOG_PATH = (
    Path(__file__).resolve().parents[4] / "data" / "designer_stages.json"
)


@lru_cache
def load_stages_catalog() -> dict[str, Any]:
    """Read and cache the 17-stage catalog from data/designer_stages.json."""
    with _CATALOG_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache
def _stages_list() -> list[dict[str, Any]]:
    return load_stages_catalog().get("stages", [])


DESIGNER_STAGES: list[dict[str, Any]] = _stages_list()


def _build_default_config() -> dict[str, dict[str, Any]]:
    return {stage["id"]: dict(stage.get("default", {})) for stage in _stages_list()}


DEFAULT_STAGE_CONFIG: dict[str, dict[str, Any]] = _build_default_config()
