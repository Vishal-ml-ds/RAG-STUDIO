"""Export pipeline — render a DesignerState into a deployable artifact.

Supported formats are registered in :data:`EXPORTERS` and mirrored on
:class:`ExportFormat`. Each exporter has the signature
``(stages: dict, *, project_name: str) -> str``.
"""

from collections.abc import Callable
from enum import Enum

from app.core.export.python_exporter import export_python


class ExportFormat(str, Enum):
    PYTHON = "python"
    YAML = "yaml"
    TERRAFORM = "terraform"
    DOCKER_COMPOSE = "docker-compose"
    KUBERNETES = "kubernetes"


Exporter = Callable[..., str]

EXPORTERS: dict[ExportFormat, Exporter] = {
    ExportFormat.PYTHON: export_python,
}


FILENAME_BY_FORMAT: dict[ExportFormat, str] = {
    ExportFormat.PYTHON: "pipeline.py",
    ExportFormat.YAML: "pipeline.yaml",
    ExportFormat.TERRAFORM: "main.tf",
    ExportFormat.DOCKER_COMPOSE: "docker-compose.yml",
    ExportFormat.KUBERNETES: "manifests.yaml",
}


class UnsupportedExportFormatError(Exception):
    """Raised when no exporter is registered for the requested format."""


def render(
    fmt: ExportFormat, stages: dict, *, project_name: str
) -> tuple[str, str]:
    """Render the artifact and return ``(filename, content)``."""
    exporter = EXPORTERS.get(fmt)
    if exporter is None:
        raise UnsupportedExportFormatError(fmt.value)
    content = exporter(stages, project_name=project_name)
    return FILENAME_BY_FORMAT[fmt], content


__all__ = [
    "EXPORTERS",
    "ExportFormat",
    "FILENAME_BY_FORMAT",
    "UnsupportedExportFormatError",
    "render",
]
