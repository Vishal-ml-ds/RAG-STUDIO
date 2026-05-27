"""Render a DesignerState as a hand-written YAML config.

We avoid pulling in PyYAML for this — the output is deterministic and
small, so a small recursive renderer keeps the dependency surface tight.
"""

from __future__ import annotations

from typing import Any


def _is_scalar(value: Any) -> bool:
    return isinstance(value, (str, int, float, bool)) or value is None


def _render_scalar(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    # str: quote if it contains special chars
    text = str(value)
    if (
        text == ""
        or any(ch in text for ch in ":#{}[],&*!|>'\"%@`\n\t")
        or text != text.strip()
        or text.lower() in {"null", "true", "false", "yes", "no", "on", "off"}
    ):
        escaped = text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
        return f'"{escaped}"'
    return text


def _render(value: Any, indent: int = 0) -> str:
    pad = "  " * indent

    if _is_scalar(value):
        return _render_scalar(value)

    if isinstance(value, list):
        if not value:
            return "[]"
        lines: list[str] = []
        for item in value:
            if _is_scalar(item):
                lines.append(f"{pad}- {_render_scalar(item)}")
            elif isinstance(item, dict):
                rendered = _render(item, indent + 1)
                # Inline first key for list-of-dicts readability.
                first_line, _, rest = rendered.partition("\n")
                lines.append(f"{pad}- {first_line.strip()}")
                if rest:
                    lines.append(rest)
            else:
                rendered = _render(item, indent + 1)
                lines.append(f"{pad}-\n{rendered}")
        return "\n".join(lines)

    if isinstance(value, dict):
        if not value:
            return "{}"
        lines = []
        for key, sub in value.items():
            if _is_scalar(sub):
                lines.append(f"{pad}{key}: {_render_scalar(sub)}")
            elif isinstance(sub, list) and not sub:
                lines.append(f"{pad}{key}: []")
            elif isinstance(sub, dict) and not sub:
                lines.append(f"{pad}{key}: {{}}")
            else:
                lines.append(f"{pad}{key}:")
                lines.append(_render(sub, indent + 1))
        return "\n".join(lines)

    return _render_scalar(value)


def export_yaml(stages: dict, *, project_name: str) -> str:
    document: dict[str, Any] = {
        "version": 1,
        "project": project_name,
        "stages": stages,
    }
    body = _render(document)
    return f"# RAG-Studio pipeline export\n# project: {project_name}\n{body}\n"
