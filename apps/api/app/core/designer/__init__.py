"""Designer pipeline — 17-stage configurable RAG architecture."""

from app.core.designer.stages import (
    DESIGNER_STAGES,
    DEFAULT_STAGE_CONFIG,
    load_stages_catalog,
)

__all__ = ["DESIGNER_STAGES", "DEFAULT_STAGE_CONFIG", "load_stages_catalog"]
