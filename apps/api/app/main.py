"""RAG Studio — FastAPI application entry point."""

from contextlib import asynccontextmanager
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from starlette.responses import JSONResponse
import structlog

from app.config import get_settings
from app.core.security.auth import decode_access_token, hash_password
from app.metadata import API_DESCRIPTION, API_NAME, API_SEMVER
from app.models import Base, User
from app.observability.context import (
    bind_request_observability,
    clear_observability_context,
)
from app.observability.logging_setup import configure_logging
from app.routers.auth import router as auth_router
from app.routers.designer import router as designer_router
from app.routers.guardrails import router as guardrails_router
from app.routers.health import router as health_router
from app.routers.projects import router as projects_router
from app.routers.templates import router as templates_router

logger = structlog.get_logger(__name__)


async def _seed_bootstrap_users(settings) -> None:
    """Idempotently seed dev users from settings.auth_bootstrap_users.

    Format: comma-separated ``email:password:role:uuid`` entries.
    """
    engine = create_async_engine(settings.database_url, echo=False, poolclass=NullPool)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        for entry in settings.auth_bootstrap_users.split(","):
            parts = entry.strip().split(":")
            if len(parts) < 3:
                continue
            email, password, role = parts[0], parts[1], parts[2]
            user_id = uuid.UUID(parts[3]) if len(parts) >= 4 else uuid.uuid4()

            existing = await session.scalar(select(User).where(User.email == email))
            if existing:
                continue

            session.add(
                User(
                    id=user_id,
                    email=email,
                    password_hash=hash_password(password),
                    name=email.split("@")[0].capitalize(),
                    role=role,
                    email_verified=True,
                    is_active=True,
                )
            )
            logger.info("bootstrap_user_seeded", email=email, role=role)

        await session.commit()
    await engine.dispose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)

    logger.info(
        "rag_studio_api_starting",
        env=settings.app_env,
        log_level=settings.log_level,
        version=API_SEMVER,
    )

    if settings.app_env in {"development", "test"}:
        engine = create_async_engine(
            settings.database_url,
            echo=settings.is_development,
            poolclass=NullPool,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

        if settings.auth_bootstrap_users:
            await _seed_bootstrap_users(settings)

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

        # JWT enforcement for /api/* (except /api/auth/*).
        if (
            request.method != "OPTIONS"
            and request.url.path.startswith("/api/")
            and not request.url.path.startswith("/api/auth/")
        ):
            auth_header = request.headers.get("Authorization") or ""
            if not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Missing bearer token"},
                )
            token = auth_header.removeprefix("Bearer ").strip()
            try:
                decode_access_token(settings, token)
            except ValueError:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or expired token"},
                )

        inbound_rid = (
            request.headers.get("X-Request-ID") or request.headers.get("x-request-id") or ""
        ).strip()
        request_id = inbound_rid or str(uuid.uuid4())

        inbound_cid = (
            request.headers.get("X-Correlation-ID")
            or request.headers.get("x-correlation-id")
            or ""
        ).strip()
        correlation_id = inbound_cid or request_id

        bind_request_observability(request_id=request_id, correlation_id=correlation_id)

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start) * 1000, 2)

            response.headers["X-Request-ID"] = request_id
            response.headers.setdefault("X-Correlation-ID", correlation_id)
            response.headers.setdefault("X-Content-Type-Options", "nosniff")
            response.headers.setdefault("X-Frame-Options", "DENY")
            response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")

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
    app.include_router(auth_router)
    app.include_router(projects_router)
    app.include_router(designer_router)
    app.include_router(templates_router)
    app.include_router(guardrails_router)

    return app


app = create_app()
