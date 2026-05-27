"""Evaluation run — one row per RAGAS evaluation against a project."""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.models.base import GUID, Base, TimestampMixin


JsonColumn = JSONB().with_variant(JSON(), "sqlite")


class EvaluationRun(Base, TimestampMixin):
    """RAGAS scores (or stubbed scores) recorded for a project run."""

    __tablename__ = "evaluation_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    framework: Mapped[str] = mapped_column(
        String(32), default="ragas", nullable=False
    )
    mode: Mapped[str] = mapped_column(
        String(16), default="live", nullable=False
    )  # "live" | "stub"
    status: Mapped[str] = mapped_column(
        String(32), default="completed", nullable=False, index=True
    )
    dataset_ref: Mapped[str | None] = mapped_column(Text, nullable=True)
    metrics: Mapped[list[str]] = mapped_column(
        JsonColumn, nullable=False, default=list
    )
    scores: Mapped[dict] = mapped_column(
        JsonColumn, nullable=False, default=dict
    )
    summary: Mapped[dict] = mapped_column(
        JsonColumn, nullable=False, default=dict
    )

    def __repr__(self) -> str:
        return (
            f"<EvaluationRun id={self.id} project_id={self.project_id} "
            f"mode={self.mode}>"
        )
