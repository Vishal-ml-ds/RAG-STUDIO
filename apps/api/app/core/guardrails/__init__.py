"""Guardrails — input / output policy enforcement.

Two public surfaces:
    apply_input_guardrails(text, policies)
    apply_output_guardrails(answer, *, context, policies)

Both return a :class:`GuardrailResult` describing whether the payload is
allowed and what findings (if any) were raised.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.core.guardrails.pii import detect_pii
from app.core.guardrails.toxicity import detect_toxicity


@dataclass
class Finding:
    check: str
    severity: str  # "low" | "medium" | "high"
    message: str
    matches: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "check": self.check,
            "severity": self.severity,
            "message": self.message,
            "matches": list(self.matches),
            "metadata": dict(self.metadata),
        }


@dataclass
class GuardrailResult:
    allowed: bool
    findings: list[Finding] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "allowed": self.allowed,
            "findings": [f.to_dict() for f in self.findings],
        }


_HIGH_SEVERITY = {"high"}


def _decide(findings: list[Finding]) -> bool:
    """A request is rejected if any finding is high severity."""
    return not any(f.severity in _HIGH_SEVERITY for f in findings)


def apply_input_guardrails(
    text: str, policies: list[str] | None = None
) -> GuardrailResult:
    """Run the configured input checks against ``text``.

    Default input policies if none provided: ``["pii"]``.
    """
    policies = policies or ["pii"]
    findings: list[Finding] = []

    if "pii" in policies:
        findings.extend(detect_pii(text))
    if "toxicity" in policies:
        findings.extend(detect_toxicity(text))

    return GuardrailResult(allowed=_decide(findings), findings=findings)


def apply_output_guardrails(
    answer: str,
    *,
    context: str | None = None,
    policies: list[str] | None = None,
) -> GuardrailResult:
    """Run the configured output checks against ``answer`` (and ``context``)."""
    policies = policies or ["toxicity"]
    findings: list[Finding] = []

    if "pii" in policies:
        findings.extend(detect_pii(answer))
    if "toxicity" in policies:
        findings.extend(detect_toxicity(answer))

    return GuardrailResult(allowed=_decide(findings), findings=findings)


__all__ = [
    "Finding",
    "GuardrailResult",
    "apply_input_guardrails",
    "apply_output_guardrails",
]
