"""Regex pattern catalog for biased / stereotyped language.

The default catalog flags absolute generalizations about demographic
groups ("all X are Y", "X people always Z"). A richer pattern set can be
mounted via ``settings.guardrails_bias_patterns_policy_path``.
"""

from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
import re
from typing import TYPE_CHECKING

from app.config import get_settings

if TYPE_CHECKING:  # pragma: no cover
    from app.core.guardrails import Finding


_DEFAULT_PATTERNS: list[dict[str, str]] = [
    {
        "id": "absolute_group_claim",
        "severity": "medium",
        "pattern": r"\ball\s+(men|women|asians|africans|whites|blacks|christians|muslims|jews|hindus|buddhists|atheists|gays|lesbians|trans|liberals|conservatives)\s+(are|do|hate|love|believe)\b",
    },
    {
        "id": "always_group_claim",
        "severity": "medium",
        "pattern": r"\b(men|women|asians|africans|whites|blacks|christians|muslims|jews|hindus|buddhists|atheists|gays|lesbians|trans|liberals|conservatives)\s+always\s+\w+",
    },
    {
        "id": "never_group_claim",
        "severity": "medium",
        "pattern": r"\b(men|women|asians|africans|whites|blacks|christians|muslims|jews|hindus|buddhists|atheists|gays|lesbians|trans|liberals|conservatives)\s+never\s+\w+",
    },
    {
        "id": "inferior_superior_claim",
        "severity": "high",
        "pattern": r"\b(men|women|asians|africans|whites|blacks|christians|muslims|jews|hindus|buddhists)\s+are\s+(superior|inferior|smarter|dumber|better|worse)\b",
    },
]


@lru_cache
def _load_patterns() -> list[dict[str, str]]:
    override = get_settings().guardrails_bias_patterns_policy_path.strip()
    if not override:
        return _DEFAULT_PATTERNS
    path = Path(override).expanduser()
    if not path.exists():
        return _DEFAULT_PATTERNS
    with path.open(encoding="utf-8") as fh:
        loaded = json.load(fh)
    items = loaded.get("patterns", loaded)
    out: list[dict[str, str]] = []
    for item in items:
        if {"id", "severity", "pattern"} <= set(item.keys()):
            out.append(
                {
                    "id": str(item["id"]),
                    "severity": str(item["severity"]),
                    "pattern": str(item["pattern"]),
                }
            )
    return out or _DEFAULT_PATTERNS


def detect_bias(text: str) -> list["Finding"]:
    from app.core.guardrails import Finding

    findings: list[Finding] = []
    if not text:
        return findings

    for entry in _load_patterns():
        try:
            compiled = re.compile(entry["pattern"], flags=re.IGNORECASE)
        except re.error:
            continue
        matches = compiled.findall(text)
        if not matches:
            continue
        # Some patterns capture groups; normalise to flat strings.
        flat: list[str] = []
        for m in matches:
            if isinstance(m, tuple):
                flat.append(" ".join(part for part in m if part))
            else:
                flat.append(str(m))
        findings.append(
            Finding(
                check=f"bias.{entry['id']}",
                severity=entry["severity"],
                message=f"Matched bias pattern '{entry['id']}' {len(flat)} time(s)",
                matches=flat[:10],
            )
        )
    return findings


__all__ = ["detect_bias"]
