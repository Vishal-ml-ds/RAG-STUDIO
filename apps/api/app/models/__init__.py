"""SQLAlchemy ORM model registry.

Importing this module registers every model with ``Base.metadata``
so Alembic autogeneration and ``Base.metadata.create_all`` see them all.
"""

from app.models.base import Base
from app.models.project import Project
from app.models.user import User

__all__ = ["Base", "Project", "User"]
