"""/metrics — Prometheus scrape endpoint."""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.dependencies import AppSettings

router = APIRouter(tags=["monitoring"])


@router.get("/metrics", include_in_schema=False)
async def metrics(settings: AppSettings) -> Response:
    if not settings.prometheus_metrics_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
