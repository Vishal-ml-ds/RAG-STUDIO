"""Heuristic factuality / hallucination check.

Compares the answer against the retrieval context using Jaccard
similarity over content tokens. This is intentionally a placeholder for a
real semantic-similarity / NLI check — it gives a tunable signal in the
API today without a model dependency.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from app.core.guardrails import Finding


_STOPWORDS = frozenset(
    {
        "a", "an", "the", "and", "or", "but", "if", "is", "are", "was",
        "were", "be", "being", "been", "have", "has", "had", "do", "does",
        "did", "of", "to", "in", "on", "at", "by", "for", "with", "from",
        "as", "that", "this", "these", "those", "it", "its", "i", "you",
        "he", "she", "we", "they", "them", "his", "her", "our", "their",
        "my", "your", "me", "him", "us", "what", "which", "who", "when",
        "where", "why", "how", "not", "no", "yes", "so", "than", "then",
        "there", "here",
    }
)


def _tokens(text: str) -> set[str]:
    cleaned = re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]*", text.lower())
    return {tok for tok in cleaned if tok not in _STOPWORDS and len(tok) > 2}


def jaccard_overlap(answer: str, context: str) -> float:
    a, b = _tokens(answer), _tokens(context)
    if not a:
        return 1.0  # nothing to verify; defer to other checks
    if not b:
        return 0.0
    return len(a & b) / max(1, len(a | b))


# Coverage = fraction of answer tokens supported by the context.
def context_coverage(answer: str, context: str) -> float:
    a, b = _tokens(answer), _tokens(context)
    if not a:
        return 1.0
    if not b:
        return 0.0
    return len(a & b) / len(a)


# Thresholds tuned for the heuristic. Below ``low_threshold`` the result is
# considered unsupported (high severity). Below ``mid_threshold`` it is
# considered weakly supported (medium severity).
LOW_THRESHOLD = 0.25
MID_THRESHOLD = 0.5


def score_factuality(
    answer: str, context: str
) -> tuple[float, "Finding | None"]:
    """Return ``(coverage, optional Finding)``.

    The finding is emitted only when coverage falls below
    :data:`MID_THRESHOLD`.
    """
    from app.core.guardrails import Finding

    if not answer or not answer.strip():
        return 1.0, None
    if context is None or not context.strip():
        # No grounding context → can't verify; flag as high severity.
        finding = Finding(
            check="factuality.no_context",
            severity="high",
            message="No retrieval context supplied for factuality check",
            metadata={"coverage": 0.0},
        )
        return 0.0, finding

    coverage = context_coverage(answer, context)
    if coverage < LOW_THRESHOLD:
        finding = Finding(
            check="factuality.unsupported",
            severity="high",
            message=(
                f"Answer coverage by context is {coverage:.2f} "
                f"(< {LOW_THRESHOLD}); likely hallucinated"
            ),
            metadata={"coverage": coverage, "threshold": LOW_THRESHOLD},
        )
        return coverage, finding
    if coverage < MID_THRESHOLD:
        finding = Finding(
            check="factuality.weak_support",
            severity="medium",
            message=(
                f"Answer coverage by context is {coverage:.2f} "
                f"(< {MID_THRESHOLD}); weak grounding"
            ),
            metadata={"coverage": coverage, "threshold": MID_THRESHOLD},
        )
        return coverage, finding
    return coverage, None


__all__ = [
    "LOW_THRESHOLD",
    "MID_THRESHOLD",
    "context_coverage",
    "jaccard_overlap",
    "score_factuality",
]
