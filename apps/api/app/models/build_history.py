"""Autopilot build history — one row per autopilot run."""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.models.base import GUID, Base, TimestampMixin


JsonColumn = JSONB().with_variant(JSON(), "sqlite")


class BuildHistory(Base, TimestampMixin):
    """Audit trail for autopilot-driven project creations."""

    __tablename__ = "build_history"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    brief: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default="completed", nullable=False, index=True
    )
    plan: Mapped[dict] = mapped_column(JsonColumn, nullable=False, default=dict)

    def __repr__(self) -> str:
        return (
            f"<BuildHistory id={self.id} project_id={self.project_id} "
            f"status={self.status}>"
        )
