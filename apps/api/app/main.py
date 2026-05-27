"""RAG Studio — FastAPI application entry point."""

from contextlib import asynccontextmanager
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog

from app.config import get_settings
from app.metadata import API_DESCRIPTION, API_NAME, API_SEMVER
from app.observability.context import (
    bind_request_observability,
    clear_observability_context,
)
from app.observability.logging_setup import configure_logging
from app.routers.health import router as health_router

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    settings = get_settings()
    configure_logging(settings.log_level)

    logger.info(
        "rag_studio_api_starting",
        env=settings.app_env,
        log_level=settings.log_level,
        version=API_SEMVER,
    )

    yield

    logger.info("rag_studio_api_shutting_down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=API_NAME,
        description=API_DESCRIPTION,
        version=API_SEMVER,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
        redirect_slashes=False,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=512)

    @app.middleware("http")
    async def observability_middleware(request: Request, call_next):
        start = time.perf_counter()

        inbound_rid = (
            request.headers.get("X-Request-ID")
            or request.headers.get("x-request-id")
            or ""
        ).strip()
        request_id = inbound_rid or str(uuid.uuid4())

        inbound_cid = (
            request.headers.get("X-Correlation-ID")
            or request.headers.get("x-correlation-id")
            or ""
        ).strip()
        correlation_id = inbound_cid or request_id

        bind_request_observability(
            request_id=request_id,
            correlation_id=correlation_id,
        )

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start) * 1000, 2)

            response.headers["X-Request-ID"] = request_id
            response.headers.setdefault("X-Correlation-ID", correlation_id)
            response.headers.setdefault("X-Content-Type-Options", "nosniff")
            response.headers.setdefault("X-Frame-Options", "DENY")
            response.headers.setdefault(
                "Referrer-Policy", "strict-origin-when-cross-origin"
            )

            logger.info(
                "request",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

            return response

        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.exception(
                "request_failed",
                method=request.method,
                path=request.url.path,
                duration_ms=duration_ms,
            )
            raise

        finally:
            clear_observability_context()

    app.include_router(health_router)

    return app


app = create_app()
