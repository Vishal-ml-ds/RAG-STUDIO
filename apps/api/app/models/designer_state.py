"""Per-project Designer state — the 17-stage pipeline configuration."""

import uuid

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.models.base import GUID, Base, TimestampMixin


JsonColumn = JSONB().with_variant(JSON(), "sqlite")


class DesignerState(Base, TimestampMixin):
    """One row per project — stores the entire 17-stage configuration as JSON."""

    __tablename__ = "designer_states"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    stages: Mapped[dict] = mapped_column(JsonColumn, nullable=False, default=dict)

    def __repr__(self) -> str:
        return f"<DesignerState project_id={self.project_id} version={self.version}>"
