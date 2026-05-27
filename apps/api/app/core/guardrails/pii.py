"""Regex-based PII detector.

Catches: emails, US-style phone numbers, SSN-shape strings, credit-card
shape strings (13-19 digit groups), IPv4 addresses. Findings are
high-severity by default — PII in either input or output should block.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from app.core.guardrails import Finding


_EMAIL_RE = re.compile(
    r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
)
_PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}"
)
_SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_CREDIT_CARD_RE = re.compile(
    r"\b(?:\d[ -]?){13,19}\b"
)
_IPV4_RE = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}"
    r"(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\b"
)


def _luhn_valid(digits: str) -> bool:
    """Return True if a digit string passes the Luhn checksum."""
    total = 0
    parity = len(digits) % 2
    for i, ch in enumerate(digits):
        if not ch.isdigit():
            return False
        d = int(ch)
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def detect_pii(text: str) -> list["Finding"]:
    from app.core.guardrails import Finding  # avoid circular import at module load

    findings: list[Finding] = []
    if not text:
        return findings

    emails = _EMAIL_RE.findall(text)
    if emails:
        findings.append(
            Finding(
                check="pii.email",
                severity="high",
                message=f"Found {len(emails)} email address(es)",
                matches=emails[:10],
            )
        )

    phones = _PHONE_RE.findall(text)
    # Filter false-positives that overlap with other matches (e.g. credit card digits).
    phones = [p for p in phones if len(re.sub(r"\D", "", p)) in (7, 10, 11)]
    if phones:
        findings.append(
            Finding(
                check="pii.phone",
                severity="medium",
                message=f"Found {len(phones)} phone number(s)",
                matches=phones[:10],
            )
        )

    ssns = _SSN_RE.findall(text)
    if ssns:
        findings.append(
            Finding(
                check="pii.ssn",
                severity="high",
                message=f"Found {len(ssns)} SSN-shape string(s)",
                matches=ssns[:10],
            )
        )

    candidates = _CREDIT_CARD_RE.findall(text)
    cards = [
        c.strip() for c in candidates
        if _luhn_valid(re.sub(r"\D", "", c))
    ]
    if cards:
        findings.append(
            Finding(
                check="pii.credit_card",
                severity="high",
                message=f"Found {len(cards)} credit-card-shape string(s)",
                matches=cards[:10],
            )
        )

    ips = _IPV4_RE.findall(text)
    if ips:
        findings.append(
            Finding(
                check="pii.ipv4",
                severity="low",
                message=f"Found {len(ips)} IPv4 address(es)",
                matches=ips[:10],
            )
        )

    return findings


__all__ = ["detect_pii"]
