"""Health + readiness endpoints."""

from typing import Any

from fastapi import APIRouter

from app.metadata import API_SEMVER

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness probe")
async def health() -> dict[str, Any]:
    """Return 200 if the process is alive. Cheap; no dependency checks."""
    return {"status": "ok", "version": API_SEMVER}


@router.get("/ready", summary="Readiness probe")
async def ready() -> dict[str, Any]:
    """Return 200 once the process is ready to serve traffic.

    Future: probe DB, Redis, Qdrant, MLflow here and only flip to ready
    when all critical dependencies respond.
    """
    return {"status": "ready", "version": API_SEMVER}
