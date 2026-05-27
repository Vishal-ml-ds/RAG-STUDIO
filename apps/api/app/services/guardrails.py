"""Guardrails service — orchestrates checks against a project's policies."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.guardrails import (
    apply_input_guardrails,
    apply_output_guardrails,
)
from app.services.designer import get_or_create_state
from app.services.projects import ProjectNotFoundError


_DEFAULT_INPUT_POLICIES = ["pii"]
_DEFAULT_OUTPUT_POLICIES = ["toxicity", "hallucination"]


async def _resolve_policies(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    project_id: uuid.UUID | None,
    direction: str,
    override: list[str] | None,
) -> list[str]:
    if override is not None:
        return list(override)
    if project_id is None:
        return (
            _DEFAULT_INPUT_POLICIES
            if direction == "input"
            else _DEFAULT_OUTPUT_POLICIES
        )

    state = await get_or_create_state(
        db, user_id=user_id, project_id=project_id
    )
    guardrails_cfg = (state.stages or {}).get("guardrails", {})
    if direction == "input":
        return list(guardrails_cfg.get("input", _DEFAULT_INPUT_POLICIES))
    return list(guardrails_cfg.get("output", _DEFAULT_OUTPUT_POLICIES))


async def run_check(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    text: str,
    direction: str,
    context: str | None,
    project_id: uuid.UUID | None,
    policies_override: list[str] | None,
) -> dict:
    """Resolve effective policies then run the appropriate guardrail pass.

    Raises ``ProjectNotFoundError`` if the project_id is supplied but not
    owned by the caller.
    """
    try:
        policies = await _resolve_policies(
            db,
            user_id=user_id,
            project_id=project_id,
            direction=direction,
            override=policies_override,
        )
    except ProjectNotFoundError:
        raise

    if direction == "input":
        result = apply_input_guardrails(text, policies)
    else:
        result = apply_output_guardrails(
            text, context=context, policies=policies
        )

    return {
        "allowed": result.allowed,
        "direction": direction,
        "policies_applied": policies,
        "findings": [f.to_dict() for f in result.findings],
    }
