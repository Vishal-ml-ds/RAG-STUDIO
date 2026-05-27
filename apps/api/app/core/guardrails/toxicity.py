"""Keyword-blocklist toxicity detector with optional JSON policy override.

A real production stack would call a hosted classifier (Perspective,
OpenAI moderation, Detoxify). This module ships a curated word list and
loads a richer policy from ``settings.guardrails_toxicity_policy_path``
when present.
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


_DEFAULT_POLICY: dict[str, list[str]] = {
    "high": [
        "kill yourself",
        "kys",
        "suicide method",
    ],
    "medium": [
        "idiot",
        "stupid",
        "moron",
        "hate you",
        "shut up",
    ],
    "low": [
        "damn",
        "hell",
        "crap",
    ],
}


@lru_cache
def _load_policy() -> dict[str, list[str]]:
    override = get_settings().guardrails_toxicity_policy_path.strip()
    if not override:
        return _DEFAULT_POLICY
    path = Path(override).expanduser()
    if not path.exists():
        return _DEFAULT_POLICY
    with path.open(encoding="utf-8") as fh:
        loaded = json.load(fh)
    # Accept either {severity: [terms]} or {"terms": {severity: [...]}}.
    if "terms" in loaded and isinstance(loaded["terms"], dict):
        return {k: list(v) for k, v in loaded["terms"].items()}
    return {k: list(v) for k, v in loaded.items()}


def _word_boundary_match(text: str, term: str) -> bool:
    pattern = r"\b" + re.escape(term) + r"\b"
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def detect_toxicity(text: str) -> list["Finding"]:
    from app.core.guardrails import Finding

    findings: list[Finding] = []
    if not text:
        return findings

    policy = _load_policy()
    for severity, terms in policy.items():
        matches = [t for t in terms if _word_boundary_match(text, t)]
        if matches:
            findings.append(
                Finding(
                    check="toxicity.keyword",
                    severity=severity,
                    message=f"Matched {len(matches)} toxicity term(s) at {severity} severity",
                    matches=matches[:10],
                    metadata={"policy_source": "default"},
                )
            )
    return findings


__all__ = ["detect_toxicity"]
