"""Per-request observability context (request_id, correlation_id)."""

import structlog


def bind_request_observability(*, request_id: str, correlation_id: str) -> None:
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        correlation_id=correlation_id,
    )


def clear_observability_context() -> None:
    structlog.contextvars.clear_contextvars()
